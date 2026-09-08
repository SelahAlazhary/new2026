"use client";

/** CTA نهائي + الفوتر — من المحتوى الحيّ. */
import { motion } from "framer-motion";
import Link from "next/link";
import { navLinks } from "@/lib/utils/data";
import { Button } from "@/components/ui/primitives";
import { SpringArrow } from "@/components/ui/animated-icons";
import { IconWhatsapp, IconFacebook, IconYoutube, IconTelegram } from "@/components/brand/icons";
import { BrandLockup } from "@/components/brand/logo";
import { RuleOrnament, Shamsa, ElegantRule } from "@/components/brand/pattern";
import { useContent } from "@/components/content/content-provider";
import { findCtaStyle, ctaClass, findFooterStyle, footerClass } from "@/lib/styles/block-styles";
import { el, isHidden, btnStyle } from "@/lib/styles/ui-style";
import { mediaSrc } from "@/lib/utils/media";
import type { SiteContent } from "@/lib/utils/types";

export function CtaFooter() {
  const { content, wa } = useContent();
  const CT = findCtaStyle(content.ctaStyle);
  /*
    أصناف الهوية (glass/foil/الظلّ) تُكتب فقط في التصميم «الأصلي».
    محاولةُ إلغائها بقاعدة CSS أقوى تجعل كل سطح جديد يخوض حرب أولويات
    مع الهوية — والأنظف ألّا تُكتب أصلاً حين لا تُراد.
  */
  const ctBrand = CT.fill === "brand" ? "btn-glow shadow-glow-lg" : "";
  const FT = findFooterStyle(content.footerStyle);
  const showCta = !isHidden(content, "section.cta");

  /*
    المحتوى المخزون لا يُدمج مع الافتراضي بل يحلّ محلّه، فمنصّةٌ حُفظ
    محتواها قبل هذه الميزة لا تحمل المفتاح أصلاً. فالنسبةُ تظهر افتراضاً
    ومن أرادها أخرى بدّلها من اللوحة، ومن أراد إخفاءها حفظ ذلك فيها.
  */
  const dev = content.developer ?? { name: "EX-EG" };

  return (
    <>
      {showCta && (
      <section className={`relative py-24 ${ctaClass(CT)}`} data-cta-style={CT.id}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className={`ct-panel relative overflow-hidden rounded-[2.5rem] px-8 py-16 text-center text-white ${ctBrand}`}>
            <span className="ct-decor">
              <Shamsa size={520} rays={32} className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 opacity-25" />
            </span>
            <div className="ct-body relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-[1.5] [text-wrap:balance] sm:text-4xl">
                جاهز تبدأ رحلتك مع {content.teacher.subject}؟
              </h2>
              <div className="mt-4 flex justify-center">
                <ElegantRule width={280} className="text-white/60" />
              </div>
              <p className="mx-auto mt-4 max-w-xl text-white/85">أنشئ حسابك في أقل من دقيقة، فعّل باقتك، وابدأ من الدرس الأول.</p>
              <motion.div initial="rest" whileHover="hover" className="ct-actions mt-8 flex flex-wrap justify-center gap-3">
                <Button as="a" href={content.cta?.registerUrl || "/register"} style={btnStyle(el(content, "cta.primary"))} variant="outline" className="border-white/40 bg-white px-8 py-3.5 text-primary hover:bg-white">
                  {content.cta?.heroPrimaryLabel || "أنشئ حساب طالب"} <SpringArrow />
                </Button>
                <Button as="a" href={wa()} variant="ghost" className="border border-white/40 text-white hover:bg-white/10">
                  <IconWhatsapp className="size-5" /> تواصل واتساب
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
      )}

      <footer className={`site-footer border-t border-border py-12 ${footerClass(FT)}`} data-footer-style={FT.id}>
        <div className="ft-grid container grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <BrandLockup brand={content.brand} subtitle={content.platformSubtitle} logo={content.teacher.logo} size={44} />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              منصّة {content.brand} لتعليم {content.teacher.subject} — شرح يبني القاعدة، وتطبيق بعد كل درس، من أي مكان وفي أي وقت.
            </p>
          </div>

          <div>
            <p className="font-kufi mb-4 text-xs font-bold tracking-[0.14em] text-accent">روابط</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {navLinks.map((l) => (<li key={l.id}><a href={`#${l.id}`} className="transition hover:text-primary">{l.label}</a></li>))}
              <li><Link href="/login" className="transition hover:text-primary">تسجيل الدخول</Link></li>
              <li><Link href="/legal/privacy" className="transition hover:text-primary">سياسة الخصوصية</Link></li>
              <li><Link href="/legal/terms" className="transition hover:text-primary">شروط الاستخدام</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-kufi mb-4 text-xs font-bold tracking-[0.14em] text-accent">تواصل معنا</p>
            <div className="flex gap-3">
              <SocialBtn href={wa()} label="واتساب"><IconWhatsapp className="size-5" /></SocialBtn>
              <SocialBtn href={content.social.facebook} label="فيسبوك"><IconFacebook className="size-5" /></SocialBtn>
              <SocialBtn href={content.social.youtube} label="يوتيوب"><IconYoutube className="size-5" /></SocialBtn>
              <SocialBtn href={content.social.telegram} label="تليجرام"><IconTelegram className="size-5" /></SocialBtn>
            </div>
          </div>
        </div>
        <div className="container mt-10 flex justify-center"><RuleOrnament width={240} className="text-accent" /></div>
        <div className="container mt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {content.brand}. جميع الحقوق محفوظة.
        </div>
        {/*
          الشركة المطوّرة.
          سطرٌ منفصلٌ تحت الحقوق لا مدسوسٌ فيها: حقوقُ المنصّة للأستاذة،
          والتطويرُ نسبةٌ أخرى — فلا يختلطان في جملةٍ واحدة.
        */}
        {dev.name && !dev.hidden ? (
          <div className="container mt-2 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <span>تطوير</span>
            <DevCredit dev={dev} />
          </div>
        ) : null}
      </footer>
    </>
  );
}

function SocialBtn({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a href={href} aria-label={label} className="btn-foil grid size-11 place-items-center rounded-2xl text-muted-foreground transition hover:text-accent">
      {children}
    </a>
  );
}

/**
 * نسبةُ التطوير.
 * الشعارُ صورةٌ عاديّة لا `next/image`: مصدرُه رابطٌ خارجيٌّ قد يكون من
 * أيّ مضيف، ولا يستحقّ سطرٌ بهذا الحجم إعداداً للنطاقات المسموحة.
 */
function DevCredit({ dev }: { dev: NonNullable<SiteContent["developer"]> }) {
  const inner = (
    <>
      {dev.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaSrc(dev.logo)}
          alt={dev.name ?? ""}
          className="h-4 w-auto max-w-[64px] object-contain"
          referrerPolicy="no-referrer"
        />
      ) : null}
      <span className="font-bold">{dev.name}</span>
    </>
  );

  if (!dev.url) {
    return <span className="inline-flex items-center gap-1.5">{inner}</span>;
  }
  return (
    <a
      href={dev.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 transition hover:text-primary"
    >
      {inner}
    </a>
  );
}
