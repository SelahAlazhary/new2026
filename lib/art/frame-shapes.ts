/**
 * أشكال إطار صورة الهيرو — عشرون شكلاً مولَّداً.
 * ------------------------------------------------------------------
 * كل شكل دالّة تُعيد مسار SVG داخل صندوق w×h. لماذا دالّة لا مسار ثابت؟
 * لأن الإطار يُرسم بحدّ خارجي وخيط داخلي متوازيين، فيلزم توليد الشكل
 * نفسه بأكثر من «إزاحة للداخل» — ودالّة واحدة تكفي لكل الإزاحات بدل
 * كتابة كل شكل مرّتين ونسيان تحديث إحداهما.
 *
 * الصندوق ثابت (٤٠٠×٥٠٠) وviewBox ثابت، فلا تمدّد ولا تشويه مهما اتّسع
 * العمود الذي يحتضن الإطار.
 */

export type FrameShape = {
  id: string;
  name: string;
  hint: string;
  /** مسار الشكل داخل صندوق w×h مع إزاحة للداخل. */
  path: (w: number, h: number, inset: number) => string;
  /** هل يُرسم الخيط الداخلي؟ بعض الأشكال لا يليق بها. */
  innerRule: boolean;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ */
/*  مولّدات المسارات                                                    */
/* ------------------------------------------------------------------ */

/** قوس مدبّب (محراب). */
function mihrab(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y1 = h - i;
  const sh = h * 0.44, apex = i + h * 0.02, cy = h * 0.15;
  return `M${x0} ${y1} V${sh} Q${x0} ${cy} ${w / 2} ${apex} Q${x1} ${cy} ${x1} ${sh} V${y1} Z`;
}

/** قوس مفصّص — فصوص متتابعة في النصف العلوي. */
function lobed(w: number, h: number, i: number, lobes = 5): string {
  const x0 = i, x1 = w - i, sh = h * 0.46;
  const span = (x1 - x0) / lobes, rr = span / 2;
  let d = `M${x0} ${h - i} V${sh}`;
  for (let k = 0; k < lobes; k++) {
    const rise = k === Math.floor(lobes / 2) ? 1.4 : 1;
    d += ` A${r2(rr)} ${r2(rr * rise)} 0 0 1 ${r2(x0 + (k + 1) * span)} ${r2(sh)}`;
  }
  return d + ` V${h - i} Z`;
}

/** مثمّن منتظم. */
function octagon(w: number, h: number, i: number): string {
  const k = 0.2929, cx = w * k, cy = h * k;
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i;
  return `M${r2(x0 + cx)} ${y0} H${r2(x1 - cx)} L${x1} ${r2(y0 + cy)} V${r2(y1 - cy)} L${r2(x1 - cx)} ${y1} H${r2(x0 + cx)} L${x0} ${r2(y1 - cy)} V${r2(y0 + cy)} Z`;
}

/** مسدّس رأسي. */
function hexagon(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i, q = (y1 - y0) * 0.25;
  return `M${w / 2} ${y0} L${x1} ${r2(y0 + q)} V${r2(y1 - q)} L${w / 2} ${y1} L${x0} ${r2(y1 - q)} V${r2(y0 + q)} Z`;
}

/** ميدالية بيضاوية. */
function medallion(w: number, h: number, i: number): string {
  const rx = (w - i * 2) / 2, ry = (h - i * 2) / 2;
  return `M${w / 2} ${i} a${r2(rx)} ${r2(ry)} 0 1 1 -0.01 0 Z`;
}

/** عين (vesica) — بيضاوي مدبّب الطرفين. */
function leaf(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i;
  return `M${w / 2} ${y0} Q${x1} ${h * 0.3} ${w / 2} ${y1} Q${x0} ${h * 0.3} ${w / 2} ${y0} Z`;
}

/** قطرة — دائري أسفل ومدبّب أعلى. */
function teardrop(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y1 = h - i;
  return `M${w / 2} ${i} Q${x1} ${h * 0.42} ${x1} ${h * 0.62} Q${x1} ${y1} ${w / 2} ${y1} Q${x0} ${y1} ${x0} ${h * 0.62} Q${x0} ${h * 0.42} ${w / 2} ${i} Z`;
}

/** ثقب مفتاح — دائرة أعلى تنزل بضلعين. */
function keyhole(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y1 = h - i, cy = h * 0.34, rr = (w - i * 2) / 2;
  return `M${x0} ${cy} a${r2(rr)} ${r2(rr)} 0 0 1 ${r2(rr * 2)} 0 V${r2(y1 - h * 0.06)} Q${x1} ${y1} ${r2(x1 - w * 0.14)} ${y1} H${r2(x0 + w * 0.14)} Q${x0} ${y1} ${x0} ${r2(y1 - h * 0.06)} Z`;
}

/** رباعي الفصوص. */
function quatrefoil(w: number, h: number, i: number): string {
  const cx = w / 2, cy = h / 2, rx = (w - i * 2) / 2, ry = (h - i * 2) / 2;
  const a = rx * 0.62, b = ry * 0.62;
  return (
    `M${cx} ${r2(cy - ry)} ` +
    `A${r2(a)} ${r2(b)} 0 0 1 ${r2(cx + rx)} ${cy} ` +
    `A${r2(a)} ${r2(b)} 0 0 1 ${cx} ${r2(cy + ry)} ` +
    `A${r2(a)} ${r2(b)} 0 0 1 ${r2(cx - rx)} ${cy} ` +
    `A${r2(a)} ${r2(b)} 0 0 1 ${cx} ${r2(cy - ry)} Z`
  );
}

/** معيّن (مربّع مُدار). */
function diamond(w: number, h: number, i: number): string {
  return `M${w / 2} ${i} L${w - i} ${h / 2} L${w / 2} ${h - i} L${i} ${h / 2} Z`;
}

/** درع. */
function shield(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y0 = i;
  return `M${x0} ${y0} H${x1} V${h * 0.55} Q${x1} ${h * 0.86} ${w / 2} ${h - i} Q${x0} ${h * 0.86} ${x0} ${h * 0.55} Z`;
}

/** مربّع بقمّة مقبّبة. */
function domeTop(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y1 = h - i, sh = h * 0.28;
  return `M${x0} ${y1} V${sh} Q${w / 2} ${i - h * 0.06} ${x1} ${sh} V${y1} Z`;
}

/** طاق مزدوج — قوس فوق قوس. */
function doubleArch(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y1 = h - i;
  return `M${x0} ${y1} V${h * 0.5} Q${x0} ${h * 0.3} ${w / 2} ${h * 0.28} Q${x1} ${h * 0.3} ${x1} ${h * 0.5} V${y1} Z M${w / 2} ${h * 0.28} Q${w * 0.72} ${h * 0.12} ${w / 2} ${i} Q${w * 0.28} ${h * 0.12} ${w / 2} ${h * 0.28} Z`;
}

/** لوح بأركان مقصوصة. */
function plaque(w: number, h: number, i: number): string {
  const c = Math.min(w, h) * 0.11;
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i;
  return `M${r2(x0 + c)} ${y0} H${r2(x1 - c)} L${x1} ${r2(y0 + c)} V${r2(y1 - c)} L${r2(x1 - c)} ${y1} H${r2(x0 + c)} L${x0} ${r2(y1 - c)} V${r2(y0 + c)} Z`;
}

/** راية بطرف سفلي مشقوق. */
function banner(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i, notch = h * 0.09;
  return `M${x0} ${y0} H${x1} V${y1} L${w / 2} ${r2(y1 - notch)} L${x0} ${y1} Z`;
}

/** حافّة موجيّة سفلى. */
function waveBottom(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i, a = h * 0.045;
  return `M${x0} ${y0} H${x1} V${r2(y1 - a)} Q${w * 0.75} ${r2(y1 + a)} ${w / 2} ${r2(y1 - a)} T${x0} ${r2(y1 - a)} Z`;
}

/** دائرة مفصّصة الحافّة. */
function scalloped(w: number, h: number, i: number, lobes = 14): string {
  const cx = w / 2, cy = h / 2, rx = (w - i * 2) / 2, ry = (h - i * 2) / 2;
  let d = "";
  for (let k = 0; k <= lobes; k++) {
    const a = (k / lobes) * Math.PI * 2 - Math.PI / 2;
    const rr = k % 2 === 0 ? 1 : 0.93;
    const x = r2(cx + Math.cos(a) * rx * rr);
    const y = r2(cy + Math.sin(a) * ry * rr);
    d += k === 0 ? `M${x} ${y}` : ` L${x} ${y}`;
  }
  return d + " Z";
}

/** نجمة ثمانية. */
function star8(w: number, h: number, i: number): string {
  const cx = w / 2, cy = h / 2, rx = (w - i * 2) / 2, ry = (h - i * 2) / 2;
  let d = "";
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 - Math.PI / 2;
    const f = k % 2 === 0 ? 1 : 0.62;
    const x = r2(cx + Math.cos(a) * rx * f);
    const y = r2(cy + Math.sin(a) * ry * f);
    d += k === 0 ? `M${x} ${y}` : ` L${x} ${y}`;
  }
  return d + " Z";
}

/** مستطيل بحوافّ دائرية. */
function rounded(w: number, h: number, i: number): string {
  const rad = Math.min(w, h) * 0.12;
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i;
  return `M${r2(x0 + rad)} ${y0} H${r2(x1 - rad)} A${r2(rad)} ${r2(rad)} 0 0 1 ${x1} ${r2(y0 + rad)} V${r2(y1 - rad)} A${r2(rad)} ${r2(rad)} 0 0 1 ${r2(x1 - rad)} ${y1} H${r2(x0 + rad)} A${r2(rad)} ${r2(rad)} 0 0 1 ${x0} ${r2(y1 - rad)} V${r2(y0 + rad)} A${r2(rad)} ${r2(rad)} 0 0 1 ${r2(x0 + rad)} ${y0} Z`;
}

/** مستطيل حادّ الأركان. */
function sharp(w: number, h: number, i: number): string {
  return `M${i} ${i} H${w - i} V${h - i} H${i} Z`;
}

/** قوس حدوة — نصف دائرة تتجاوز نصفها قليلاً. */
function horseshoe(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y1 = h - i, sh = h * 0.42, rr = (x1 - x0) / 2;
  return `M${x0} ${y1} V${sh} a${r2(rr)} ${r2(rr * 1.15)} 0 0 1 ${r2(rr * 2)} 0 V${y1} Z`;
}

/** طاق فارسي — كتفان مرتفعان وقمّة مدبّبة حادّة. */
function persian(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y1 = h - i;
  return `M${x0} ${y1} V${h * 0.4} Q${x0} ${h * 0.2} ${w * 0.3} ${h * 0.14} Q${w / 2} ${h * 0.1} ${w / 2} ${i} Q${w / 2} ${h * 0.1} ${w * 0.7} ${h * 0.14} Q${x1} ${h * 0.2} ${x1} ${h * 0.4} V${y1} Z`;
}

/** ثلاثي الفصوص. */
function trefoil(w: number, h: number, i: number): string {
  const cx = w / 2, rx = (w - i * 2) / 2, ry = (h - i * 2) / 2, cy = h / 2;
  const a = rx * 0.66, b = ry * 0.66;
  return (
    `M${cx} ${r2(cy - ry)} ` +
    `A${r2(a)} ${r2(b)} 0 0 1 ${r2(cx + rx)} ${r2(cy + ry * 0.3)} ` +
    `A${r2(a)} ${r2(b)} 0 0 1 ${cx} ${r2(cy + ry)} ` +
    `A${r2(a)} ${r2(b)} 0 0 1 ${r2(cx - rx)} ${r2(cy + ry * 0.3)} ` +
    `A${r2(a)} ${r2(b)} 0 0 1 ${cx} ${r2(cy - ry)} Z`
  );
}

/** خماسي منتظم. */
function pentagon(w: number, h: number, i: number): string {
  const cx = w / 2, cy = h / 2, rx = (w - i * 2) / 2, ry = (h - i * 2) / 2;
  let d = "";
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    d += (k ? " L" : "M") + `${r2(cx + Math.cos(a) * rx)} ${r2(cy + Math.sin(a) * ry)}`;
  }
  return d + " Z";
}

/** نجمة سداسية (خاتم سليمان). */
function star6(w: number, h: number, i: number): string {
  const cx = w / 2, cy = h / 2, rx = (w - i * 2) / 2, ry = (h - i * 2) / 2;
  let d = "";
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 - Math.PI / 2;
    const f = k % 2 === 0 ? 1 : 0.58;
    d += (k ? " L" : "M") + `${r2(cx + Math.cos(a) * rx * f)} ${r2(cy + Math.sin(a) * ry * f)}`;
  }
  return d + " Z";
}

/** نجمة اثنتي عشرة — أدقّ وأكثر زخرفة. */
function star12(w: number, h: number, i: number): string {
  const cx = w / 2, cy = h / 2, rx = (w - i * 2) / 2, ry = (h - i * 2) / 2;
  let d = "";
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2 - Math.PI / 2;
    const f = k % 2 === 0 ? 1 : 0.78;
    d += (k ? " L" : "M") + `${r2(cx + Math.cos(a) * rx * f)} ${r2(cy + Math.sin(a) * ry * f)}`;
  }
  return d + " Z";
}

/** مربّع بأركان مقعّرة إلى الداخل. */
function concave(w: number, h: number, i: number): string {
  const c = Math.min(w, h) * 0.16;
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i;
  return `M${r2(x0 + c)} ${y0} H${r2(x1 - c)} Q${x1} ${y0} ${x1} ${r2(y0 + c)} V${r2(y1 - c)} Q${x1} ${y1} ${r2(x1 - c)} ${y1} H${r2(x0 + c)} Q${x0} ${y1} ${x0} ${r2(y1 - c)} V${r2(y0 + c)} Q${x0} ${y0} ${r2(x0 + c)} ${y0} Z`;
}

/** ورقة — ركنان متقابلان مدوّران والآخران حادّان. */
function petal(w: number, h: number, i: number): string {
  const rad = Math.min(w, h) * 0.42;
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i;
  return `M${x0} ${y0} H${r2(x1 - rad)} A${r2(rad)} ${r2(rad)} 0 0 1 ${x1} ${r2(y0 + rad)} V${y1} H${r2(x0 + rad)} A${r2(rad)} ${r2(rad)} 0 0 1 ${x0} ${r2(y1 - rad)} Z`;
}

/** قوس مكسور — قمّة مثلّثة حادّة. */
function gable(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y1 = h - i;
  return `M${x0} ${y1} V${h * 0.34} L${w / 2} ${i} L${x1} ${h * 0.34} V${y1} Z`;
}

/** شبّاك مشربية — قمّة مقوّسة وقاعدة مقصوصة الأركان. */
function mashrabiya(w: number, h: number, i: number): string {
  const c = Math.min(w, h) * 0.1;
  const x0 = i, x1 = w - i, y1 = h - i, sh = h * 0.34;
  return `M${x0} ${r2(y1 - c)} V${sh} Q${x0} ${h * 0.12} ${w / 2} ${i} Q${x1} ${h * 0.12} ${x1} ${sh} V${r2(y1 - c)} L${r2(x1 - c)} ${y1} H${r2(x0 + c)} Z`;
}

/** مستطيل بحافّة سفلى مفصّصة. */
function scallopBottom(w: number, h: number, i: number, lobes = 6): string {
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i;
  const span = (x1 - x0) / lobes, rr = span / 2;
  let d = `M${x0} ${y0} H${x1} V${r2(y1 - rr * 0.6)}`;
  for (let k = 0; k < lobes; k++) {
    d += ` A${r2(rr)} ${r2(rr * 0.7)} 0 0 1 ${r2(x1 - (k + 1) * span)} ${r2(y1 - rr * 0.6)}`;
  }
  return d + ` V${y0} Z`;
}

/** بوّابة — قمّة مقوّسة وقاعدة عريضة بارزة. */
function gateway(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y1 = h - i, base = h * 0.08;
  return `M${x0} ${r2(y1 - base)} V${h * 0.4} Q${x0} ${h * 0.16} ${w / 2} ${h * 0.13} Q${x1} ${h * 0.16} ${x1} ${h * 0.4} V${r2(y1 - base)} H${r2(x1 + w * 0.0)} V${y1} H${x0} Z`;
}

/** بطاقة بشريط علوي بارز. */
function labelTop(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i, t = h * 0.1, m = w * 0.18;
  return `M${r2(x0 + m)} ${y0} H${r2(x1 - m)} V${r2(y0 + t)} H${x1} V${y1} H${x0} V${r2(y0 + t)} H${r2(x0 + m)} Z`;
}

/** مستطيل بأركان مدوّرة متناوبة (اثنان فقط). */
function altRounded(w: number, h: number, i: number): string {
  const rad = Math.min(w, h) * 0.28;
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i;
  return `M${r2(x0 + rad)} ${y0} H${x1} V${r2(y1 - rad)} A${r2(rad)} ${r2(rad)} 0 0 1 ${r2(x1 - rad)} ${y1} H${x0} V${r2(y0 + rad)} A${r2(rad)} ${r2(rad)} 0 0 1 ${r2(x0 + rad)} ${y0} Z`;
}

/** قوس ثلاثي — ثلاثة أقواس متجاورة. */
function tripleArch(w: number, h: number, i: number): string {
  return lobed(w, h, i, 3);
}

/** قوس بتسعة فصوص — الأدقّ. */
function lobed9(w: number, h: number, i: number): string {
  return lobed(w, h, i, 9);
}

/** بيضة — عريض أسفل وأضيق أعلى. */
function egg(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i;
  return `M${w / 2} ${y0} C${r2(x1 - w * 0.06)} ${h * 0.18} ${x1} ${h * 0.52} ${x1} ${h * 0.66} C${x1} ${r2(y1)} ${r2(x0)} ${r2(y1)} ${x0} ${h * 0.66} C${x0} ${h * 0.52} ${r2(x0 + w * 0.06)} ${h * 0.18} ${w / 2} ${y0} Z`;
}

/** مثمّن ممدود — أضلاع علوية وسفلية أطول. */
function octagonTall(w: number, h: number, i: number): string {
  const cx = w * 0.18, cy = h * 0.12;
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i;
  return `M${r2(x0 + cx)} ${y0} H${r2(x1 - cx)} L${x1} ${r2(y0 + cy)} V${r2(y1 - cy)} L${r2(x1 - cx)} ${y1} H${r2(x0 + cx)} L${x0} ${r2(y1 - cy)} V${r2(y0 + cy)} Z`;
}

/** درع مدبّب — قمّة مقوّسة وقاعدة مدبّبة. */
function crest(w: number, h: number, i: number): string {
  const x0 = i, x1 = w - i;
  return `M${w / 2} ${i} Q${x1} ${h * 0.1} ${x1} ${h * 0.32} V${h * 0.56} Q${x1} ${h * 0.86} ${w / 2} ${h - i} Q${x0} ${h * 0.86} ${x0} ${h * 0.56} V${h * 0.32} Q${x0} ${h * 0.1} ${w / 2} ${i} Z`;
}

/** إطار مزدوج — مستطيل داخله انحناء خفيف بأربع نقاط. */
function pillowed(w: number, h: number, i: number): string {
  const b = Math.min(w, h) * 0.06;
  const x0 = i, x1 = w - i, y0 = i, y1 = h - i;
  return `M${x0} ${y0} Q${w / 2} ${r2(y0 + b)} ${x1} ${y0} Q${r2(x1 - b)} ${h / 2} ${x1} ${y1} Q${w / 2} ${r2(y1 - b)} ${x0} ${y1} Q${r2(x0 + b)} ${h / 2} ${x0} ${y0} Z`;
}

/* ------------------------------------------------------------------ */
/*  السجلّ                                                              */
/* ------------------------------------------------------------------ */

const f = (
  id: string, name: string, hint: string,
  path: FrameShape["path"], innerRule = true
): FrameShape => ({ id, name, hint, path, innerRule });

export const FRAME_SHAPES: FrameShape[] = [
  f("mihrab", "المحراب", "قوس مدبّب كلاسيكي", mihrab),
  f("lobed", "المفصّص", "قوس بخمسة فصوص", (w, h, i) => lobed(w, h, i, 5)),
  f("lobed7", "المفصّص السباعي", "قوس بسبعة فصوص أدقّ", (w, h, i) => lobed(w, h, i, 7)),
  f("doubleArch", "الطاق المزدوج", "قوس يعلوه قوس", doubleArch, false),
  f("domeTop", "القبّة", "مربّع بقمّة مقبّبة", domeTop),
  f("octagon", "المثمّن", "ثمانية أضلاع منتظمة", octagon),
  f("hexagon", "المسدّس", "ستّة أضلاع رأسية", hexagon),
  f("diamond", "المعيّن", "مربّع مُدار على رأسه", diamond),
  f("star8", "النجمة الثمانية", "نجمة بثمانية رؤوس", star8, false),
  f("scalloped", "المفصّص الدائري", "دائرة بحافّة مفصّصة", (w, h, i) => scalloped(w, h, i, 14), false),
  f("medallion", "الميدالية", "بيضاوي كامل", medallion),
  f("leaf", "العين", "بيضاوي مدبّب الطرفين", leaf),
  f("teardrop", "القطرة", "مدبّب أعلى ودائري أسفل", teardrop),
  f("keyhole", "ثقب المفتاح", "دائرة تنزل بضلعين", keyhole),
  f("quatrefoil", "رباعي الفصوص", "أربعة فصوص متقابلة", quatrefoil, false),
  f("shield", "الدرع", "قمّة مستقيمة وقاعدة مدبّبة", shield),
  f("plaque", "اللوح", "أركان أربعة مقصوصة", plaque),
  f("banner", "الراية", "طرف سفلي مشقوق", banner),
  f("wave", "الموج", "حافّة سفلى موجيّة", waveBottom),
  f("rounded", "الناعم", "مستطيل بحوافّ دائرية", rounded),
  f("sharp", "الحادّ", "مستطيل بأركان قائمة", sharp),
  f("horseshoe", "حدوة الفرس", "نصف دائرة تتجاوز نصفها", horseshoe),
  f("persian", "الطاق الفارسي", "كتفان مرتفعان وقمّة حادّة", persian),
  f("tripleArch", "الطاق الثلاثي", "ثلاثة أقواس متجاورة", tripleArch),
  f("lobed9", "المفصّص التساعي", "تسعة فصوص دقيقة", lobed9),
  f("gable", "القوس المكسور", "قمّة مثلّثة حادّة", gable),
  f("mashrabiya", "المشربية", "قمّة مقوّسة وقاعدة مقصوصة", mashrabiya),
  f("gateway", "البوّابة", "قوس بقاعدة عريضة بارزة", gateway),
  f("trefoil", "ثلاثي الفصوص", "ثلاثة فصوص متقابلة", trefoil, false),
  f("pentagon", "الخماسي", "خمسة أضلاع منتظمة", pentagon),
  f("star6", "النجمة السداسية", "خاتم بستّة رؤوس", star6, false),
  f("star12", "النجمة الاثنتاعشرية", "زخرفة بأربعة وعشرين رأساً", star12, false),
  f("concave", "المقعّر", "أركان تنحني إلى الداخل", concave),
  f("petal", "الورقة", "ركنان مدوّران وركنان حادّان", petal),
  f("altRounded", "المتناوب", "ركنان مدوّران متقابلان", altRounded),
  f("scallopBottom", "المفصّص السفلي", "حافّة سفلى بفصوص", scallopBottom),
  f("labelTop", "اللافتة", "شريط علوي بارز", labelTop),
  f("egg", "البيضة", "عريض أسفل وأضيق أعلى", egg),
  f("octagonTall", "المثمّن الممدود", "مثمّن بأضلاع أطول", octagonTall),
  f("crest", "الشعار", "قمّة مقوّسة وقاعدة مدبّبة", crest),
  f("pillowed", "الوسادة", "أضلاع تنحني انحناءة خفيفة", pillowed),
];

export const FRAME_COUNT = FRAME_SHAPES.length;
export const DEFAULT_FRAME = FRAME_SHAPES[0].id;

export function findFrame(id?: string | number): FrameShape {
  if (typeof id === "number") return FRAME_SHAPES[(id - 1) % FRAME_SHAPES.length] ?? FRAME_SHAPES[0];
  return FRAME_SHAPES.find((x) => x.id === id) ?? FRAME_SHAPES[0];
}
