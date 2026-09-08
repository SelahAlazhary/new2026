import { headers } from "next/headers";
import type { SiteContent, SitePlan, Subject } from "@/lib/utils/types";
import { planPrice } from "@/lib/business/plans";

/**
 * بيانات Schema.org المهيكلة (JSON-LD).
 * ------------------------------------------------------------------
 * كل ما يُبنى هنا مشتقّ من المحتوى الحيّ — لا نصّ ثابت — فيبقى صادقاً
 * مع ما يراه الزائر فعلاً. جوجل يعاقب البيانات المهيكلة التي لا تطابق
 * الصفحة، فلا نُدرج تقييماً بلا مقيّمين ولا سعراً بلا خطة منشورة.
 *
 * ما نُصدره:
 *  • EducationalOrganization : هويّة المنصّة وروابطها ووسائل تواصلها.
 *  • WebSite + SearchAction  : يتيح لجوجل عرض مربّع بحث للموقع.
 *  • Person                  : المعلّمة ككيان مستقلّ مرتبط بالمنصّة.
 *  • Course (لكل كورس منشور) : مع عرض السعر إن وُجدت خطة له.
 *  • ItemList                : قائمة الكورسات مرتّبة.
 *  • FAQPage                 : الأسئلة الشائعة.
 *  • BreadcrumbList          : مسار التنقّل.
 */

/**
 * عنوان الموقع المطلق.
 * ------------------------------------------------------------------
 * يُفضَّل ما ضبطه الأدمن في «تخصيص الموقع»، وإن كان فارغاً اشتُقّ من
 * الطلب نفسه (Host + البروتوكول من ترويسة الوكيل).
 *
 * هذا الاشتقاق ليس ترفاً: بلا عنوان مطلق تسقط خريطة الموقع والعنوان
 * القانوني وكيان WebSite ومسار التنقّل — أي معظم ما يجعل الفهرسة قوية.
 * فلا نترك ذلك رهن حقل قد ينساه أحد.
 */
export async function siteUrl(configured?: string): Promise<string> {
  const set = (configured || "").trim().replace(/\/+$/, "");
  if (set) return set;
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    if (!host) return "";
    const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    return "";
  }
}

type Ctx = {
  content: SiteContent;
  subjects?: Subject[];
  plans?: SitePlan[];
};

/** عنوان مطلق آمن — البيانات المهيكلة تتطلّب روابط كاملة لا نسبية. */
function abs(base: string, path = ""): string | undefined {
  const root = (base || "").replace(/\/+$/, "");
  if (!root) return undefined;
  return path ? `${root}${path.startsWith("/") ? path : `/${path}`}` : root;
}

/** يزيل المفاتيح الفارغة — جوجل يفضّل غياب الحقل على قيمة جوفاء. */
function clean<T extends Record<string, unknown>>(o: T): T {
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) delete o[k];
  }
  return o;
}

export function buildJsonLd(
  c: SiteContent,
  extra: Omit<Ctx, "content"> & { base?: string } = {}
) {
  const base = (extra.base || c.url || "").replace(/\/+$/, "");
  const site = abs(base);
  const logo = c.teacher.logo || c.teacher.avatar;
  const image = abs(base, logo) ?? logo;

  const socials = [c.social?.facebook, c.social?.youtube, c.social?.telegram].filter(
    (u): u is string => Boolean(u && u !== "#")
  );

  /* ---------- المعلّمة ---------- */
  const person = clean({
    "@type": "Person",
    "@id": site ? `${site}/#teacher` : undefined,
    name: c.teacher.name,
    jobTitle: `معلّمة ${c.teacher.subject}`,
    description: c.teacher.bio,
    image,
    knowsLanguage: "ar",
    worksFor: site ? { "@id": `${site}/#org` } : undefined,
  });

  /* ---------- المنصّة ---------- */
  const org = clean({
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": site ? `${site}/#org` : undefined,
    name: c.brand,
    alternateName: c.platformSubtitle,
    description: c.teacher.bio,
    url: site,
    logo: image,
    image,
    inLanguage: "ar",
    areaServed: "EG",
    sameAs: socials,
    employee: person,
    contactPoint: c.whatsapp
      ? [
          clean({
            "@type": "ContactPoint",
            contactType: "customer support",
            telephone: `+${String(c.whatsapp).replace(/\D/g, "")}`,
            availableLanguage: ["ar"],
          }),
        ]
      : undefined,
  });

  /* ---------- الموقع + مربّع البحث ---------- */
  const website = site
    ? clean({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${site}/#website`,
        url: site,
        name: c.brand,
        inLanguage: "ar",
        publisher: { "@id": `${site}/#org` },
      })
    : null;

  /* ---------- الكورسات ---------- */
  const published = (extra.subjects ?? []).filter((s) => s.status === "منشورة");
  const plans = (extra.plans ?? []).filter((p) => p.visible);

  /** أرخص خطة تفتح هذا الكورس — منها يُشتقّ العرض المعروض. */
  const offerFor = (s: Subject) => {
    const fit = plans.filter((p) => p.scope === "all" || p.subjectId === s.id);
    if (!fit.length) return undefined;
    const cheapest = fit
      .map((p) => planPrice(p).price)
      .filter((n) => n > 0)
      .sort((a, b) => a - b)[0];
    if (!cheapest) return undefined;
    return {
      "@type": "Offer",
      price: cheapest,
      priceCurrency: "EGP",
      category: "Subscription",
      availability: "https://schema.org/InStock",
      url: abs(base, "/register"),
    };
  };

  const courses = published.map((s) =>
    clean({
      "@context": "https://schema.org",
      "@type": "Course",
      name: s.name,
      description: `${s.name} — ${c.teacher.subject} مع ${c.teacher.name}${s.grade ? ` · ${s.grade}` : ""}`,
      inLanguage: "ar",
      educationalLevel: s.grade,
      teaches: c.teacher.subject,
      provider: site ? { "@id": `${site}/#org` } : { "@type": "Organization", name: c.brand },
      instructor: site ? { "@id": `${site}/#teacher` } : person,
      offers: offerFor(s),
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        inLanguage: "ar",
        courseWorkload: s.lessons > 0 ? `PT${s.lessons}H` : undefined,
      },
    })
  );

  const itemList =
    courses.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `كورسات ${c.teacher.subject}`,
          numberOfItems: courses.length,
          itemListElement: published.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.name,
          })),
        }
      : null;

  /* ---------- الأسئلة الشائعة ---------- */
  const faqs = (c.faqs ?? []).filter((f) => f.q?.trim() && f.a?.trim());
  const faqPage =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  /* ---------- مسار التنقّل ---------- */
  const breadcrumb = site
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "الرئيسية", item: site },
          { "@type": "ListItem", position: 2, name: "الخطط", item: `${site}/#plans` },
          { "@type": "ListItem", position: 3, name: "إنشاء حساب", item: `${site}/register` },
        ],
      }
    : null;

  /* ---------- تقييم المنصّة (فقط إن وُجد مقيّمون فعلاً) ---------- */
  const rating =
    c.teacher.ratingCount > 0 && c.teacher.rating > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${c.teacher.subject} — ${c.brand}`,
          image,
          brand: { "@type": "Brand", name: c.brand },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: c.teacher.rating,
            reviewCount: c.teacher.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : null;

  return [org, website, { "@context": "https://schema.org", ...person }, ...courses, itemList, faqPage, breadcrumb, rating]
    .filter(Boolean) as Record<string, unknown>[];
}

/**
 * كلمات مفتاحية مشتقّة من المحتوى — لا قائمة ثابتة.
 * قيمتها اليوم محدودة في ترتيب جوجل، لكنها تفيد محرّكات أخرى ولا تضرّ
 * ما دامت صادقة ومطابقة للصفحة.
 */
export function buildKeywords(c: SiteContent, subjects: Subject[] = []): string[] {
  const subject = c.teacher.subject;
  const grades = [...new Set(subjects.map((s) => s.grade).filter(Boolean))];
  const names = subjects.filter((s) => s.status === "منشورة").map((s) => s.name);

  return [
    ...new Set(
      [
        c.brand,
        c.teacher.name,
        subject,
        `شرح ${subject}`,
        `كورس ${subject}`,
        `${subject} أونلاين`,
        `مدرس ${subject}`,
        "منصة تعليمية",
        "دروس أونلاين",
        ...grades.map((g) => `${subject} ${g}`),
        ...names,
      ]
        .map((k) => (k ?? "").trim())
        .filter(Boolean)
    ),
  ].slice(0, 25);
}
