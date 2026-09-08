/**
 * هويةُ المنصّة اللونية.
 * ------------------------------------------------------------------
 * كان «اللون المخصّص» لوناً واحداً يُشتقّ منه الباقي بتدوير الدرجة —
 * وهذا يكفي لتلوينٍ سريع، ولا يكفي لهويةٍ بصريّةٍ معطاة: من يملك كحليّه
 * وذهبَه وورقَه بأرقامها لا يقبل أن يُشتقّ ذهبُه من كحليّه.
 *
 * فصارت ثلاثةَ ألوانٍ تُعطى وتُكتب **كما أُعطيت**: لا يُشتقّ من الذهب
 * غامقٌ ولا فاتح، ولا من الورق بطاقةٌ أفتح. الهويةُ ثلاثةٌ فتبقى ثلاثة.
 *
 * **ويبقى قيدٌ لا يُتجاوَز:** الذهبُ الفاتح `#e5caa5` تباينُه مع الورق
 * دون ١٫٦:١ — نصٌّ به لا يُقرأ. فبدل اختراع درجةٍ رابعة، تأخذ اللكنةُ
 * (`--accent`، وهي لونُ النصّ الثانوي والشارات) **الكحليَّ**: لونٌ من
 * الثلاثة، ويُقرأ. والذهبُ يبقى حيث موضعُه — في الحدود والزخارف والخطوط
 * والفواصل، لا في المتن.
 *
 * ولا يُشتقّ إلّا ما لا قيام للتخطيط بدونه: `--muted` و`--border` —
 * فحدٌّ بلون ما يحدُّه لا يُرى. وهما الدرجةُ نفسُها أخفتَ قليلاً، لا لونٌ
 * جديد.
 */

export type BrandColors = {
  /** اللون الأساسي — الكحلي. */
  primary?: string;
  /** الذهبي — للزخرفة والحدود. */
  gold?: string;
  /** لون الورق — خلفية الصفحة في الوضع الفاتح. */
  paper?: string;
};

export type Hsl = [number, number, number];

export function hexToHsl(hex: string): Hsl {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let hue = 0;
  let s = 0;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = ((g - b) / d) % 6; break;
      case g: hue = (b - r) / d + 2; break;
      default: hue = (r - g) / d + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return [Math.round(hue), Math.round(s * 100), Math.round(l * 100)];
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));
const v = ([h, s, l]: Hsl) => `${h} ${s}% ${l}%`;

/** يُتحقّق أنّ ما وصل لونٌ فعلاً — لا يدخل CSS ما ليس لوناً. */
export function safeHex(x?: string): string | undefined {
  return x && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(x.trim()) ? x.trim() : undefined;
}

/**
 * يبني متغيّرات CSS من الألوان الثلاثة.
 * يُستدعى على الخادم فيُحقن قبل أوّل رسم — فلا يومض الثيمُ الافتراضيّ
 * لحظةً ثمّ ينقلب — ويُستدعى في المتصفّح عند التعديل الحيّ.
 */
export function brandVars(c: BrandColors): Record<string, string> {
  const out: Record<string, string> = {};

  const primary = safeHex(c.primary);
  if (primary) {
    const [h, s, l] = hexToHsl(primary);
    out["--primary"] = v([h, s, l]);
    out["--primary-foreground"] = l > 62 ? "224 44% 12%" : "0 0% 100%";
    out["--ring"] = v([h, s, l]);
  }

  const gold = safeHex(c.gold);
  if (gold) {
    const [h, sat, l] = hexToHsl(gold);
    /*
      الذهبُ يُكتب كما أُعطي، لا يُشتقّ منه غامقٌ ولا فاتح.
      كانت هنا درجتان مُخترعتان — «ذهبٌ غائر» للنصّ و«فاتح» للتوهّج —
      وهما لونان ليسا من الهوية. والهويةُ ثلاثةُ ألوانٍ أُعطيت بأرقامها،
      فتُكتب بأرقامها.
    */
    out["--gold"] = v([h, sat, l]);
    out["--gold-light"] = v([h, sat, l]);
    out["--gold-deep"] = v([h, sat, l]);
    /*
      والوهجُ ذهبيٌّ لا كحليّ.
      كان يُشتقّ من الأساسيّ فيخرج أزرقَ باهتاً حول الألواح — لونٌ رابعٌ
      لا في الهوية ولا في القائمة الجانبية، فيبدو غريباً عنهما. والذهبُ
      هو ما يُضيء في هذه الهوية: القائمةُ الجانبية تُضيء به، فيستوي معها
      المتنُ ولا ينشقّ عنه.
    */
    out["--glow"] = v([h, clamp(sat + 8), clamp(l - 4)]);
  }

  /*
    واللكنةُ تأخذ الأساسيَّ لا الذهب.
    `--accent` تُستعمل نصّاً وشارات، والذهبُ الفاتح `#e5caa5` تباينُه مع
    الورق دون ١٫٦:١ — نصٌّ به لا يُقرأ. فبدل أن أخترع درجةً رابعة ليست
    من الهوية، تأخذ اللكنةُ الكحليَّ: لونٌ من الثلاثة، ويُقرأ.
    والذهبُ يبقى حيث موضعُه — في الحدود والزخارف والخطوط.
  */
  if (primary) {
    const [h, s2, l2] = hexToHsl(primary);
    out["--accent"] = v([h, s2, l2]);
    out["--accent-foreground"] = "0 0% 100%";
  }

  const paper = safeHex(c.paper);
  if (paper) {
    const [h, s, l] = hexToHsl(paper);
    /*
      الورقُ والبطاقةُ لونٌ واحدٌ كما أُعطي.
      وتبقى درجتان مشتقّتان لا مفرَّ منهما: `--muted` و`--border` — حدٌّ
      بلون ما يحدُّه لا يُرى، وسطحٌ خافتٌ بلون الورق لا يتميّز عنه.
      وهما بناءٌ لا هوية: الدرجةُ نفسُها أخفتَ قليلاً، لا لونٌ جديد.
    */
    out["--background"] = v([h, s, l]);
    out["--card"] = v([h, s, l]);
    out["--muted"] = v([h, s, clamp(l - 5)]);
    out["--border"] = v([h, s, clamp(l - 11)]);
  }

  return out;
}

/** المتغيّرات نصّاً جاهزاً للحقن في `<style>` على الخادم. */
export function brandCss(c: BrandColors): string {
  const vars = brandVars(c);
  const body = Object.entries(vars).map(([k, val]) => `${k}:${val}`).join(";");
  if (!body) return "";
  /*
    يُكتب على `[data-layout="light"]` أيضاً لا على `:root` وحده: قواعدُ
    الطبقة الفاتحة تكتب `--background` و`--card` بوزنٍ أعلى من `:root`،
    فلولا هذا لغلبت ورقَ الهوية وأعادت الورقَ الافتراضيّ.
  */
  return `:root{${body}}\n[data-layout="light"]{${body}}`;
}
