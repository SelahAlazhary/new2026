"use client";

/**
 * خلفية الصفحة الرئيسية.
 * ------------------------------------------------------------------
 * صورة يضبطها الأدمن تُرسم خلف كل أقسام الصفحة، والعناصر تعوم فوقها.
 *
 * • «ثابتة»: الطبقة `position: fixed` بمقاس الشاشة، فتبقى في مكانها
 *   وبحجمها بينما يمرّ المحتوى فوقها. لم نستخدم
 *   `background-attachment: fixed` لأنها معطّلة على iOS ومكلفة في
 *   الرسم على الجوّال — والطبقة الثابتة تعطي الأثر نفسه في كل متصفّح.
 * • «تتحرّك مع الصفحة»: الطبقة مطلقة داخل الصفحة فتمرّ معها.
 *
 * مقاس الصورة:
 *   تملأ (قد تُقصّ) · كاملة بحجمها داخل الشاشة · بحجمها الأصلي · مكرّرة.
 *
 * فوق الصورة حجاب من لون الخلفية بشدّة قابلة للضبط — بلا حجاب تصير
 * النصوص فوق صورة مزدحمة غير مقروءة.
 */
import { useContent } from "@/components/content/content-provider";
import { mediaSrc } from "@/lib/utils/media";

export function SiteBackground() {
  const { content } = useContent();
  const bg = content.background;
  if (!bg?.image) return null;

  const opacity = Math.max(0, Math.min(100, bg.opacity ?? 35)) / 100;
  const blur = Math.max(0, Math.min(20, bg.blur ?? 0));
  const veil = Math.max(0, Math.min(90, bg.veil ?? 45)) / 100;
  const mode = bg.size ?? "cover";

  /** ترجمة وضع المقاس إلى خصائص الخلفية. */
  const sizing =
    mode === "contain"
      ? { backgroundSize: "contain", backgroundRepeat: "no-repeat" }
      : mode === "natural"
        ? { backgroundSize: "auto", backgroundRepeat: "no-repeat" }
        : mode === "tile"
          ? { backgroundSize: "auto", backgroundRepeat: "repeat" }
          : { backgroundSize: "cover", backgroundRepeat: "no-repeat" };

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none ${bg.fixed ? "fixed" : "absolute"} inset-0 -z-20 overflow-hidden`}
    >
      <div
        className="size-full bg-center"
        style={{
          backgroundImage: `url(${mediaSrc(bg.image)})`,
          ...sizing,
          opacity,
          filter: blur ? `blur(${blur}px)` : undefined,
          // التكبير الطفيف يخفي حواف الضباب الشفّافة عند أطراف الطبقة
          transform: blur ? "scale(1.06)" : undefined,
        }}
      />
      {/* حجاب يضمن التباين مع النصوص */}
      <div className="absolute inset-0" style={{ background: `hsl(var(--background) / ${veil})` }} />
    </div>
  );
}
