/**
 * علامةٌ متحرّكة من مكتبة الحركة.
 * ------------------------------------------------------------------
 * تعرض أيَّ صورةٍ من المئتين وثلاثٍ في `lib/motion-art` صورةً حقيقيةً
 * متحرّكة — لا أيقونةَ خطٍّ ساكنة.
 *
 * **ولماذا `<img>` لا `<svg>` مباشرةً؟** لأنّ الحركةَ فيها SMIL داخل
 * الملفّ، وحقنُها في الصفحة يجعل معرّفاتِ الحركة تتصادم حين تتكرّر
 * الصورةُ مرّتين. و`<img>` يعزل كلَّ نسخةٍ في مستندها، فتدور كلٌّ منها
 * وحدَها ولا تتزاحم.
 *
 * ورابطُ البيانات يُبنى مرّةً في التصيير — لا شبكةَ تُنتظر ولا ملفَّ
 * يُطلب، فالصورةُ في الصفحة نفسِها.
 */

import { findMotionArt, motionArtUrl } from "@/lib/art/motion-art";

export function MotionMark({
  id,
  size = 28,
  className = "",
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const art = findMotionArt(id);
  if (!art) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={motionArtUrl(art)}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      decoding="async"
      className={`select-none object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
