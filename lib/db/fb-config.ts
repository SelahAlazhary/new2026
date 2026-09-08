import "server-only";

/**
 * قراءةُ إعداد فايربيز الملصوق.
 * ------------------------------------------------------------------
 * الأدمن لا يحفظ عنوان قاعدته ولا يعرف في أيّ إقليمٍ أُنشئت. وما بين
 * يديه هو ما تعطيه إيّاه كونسول فايربيز: مقطعُ `<script>` فيه
 * `firebaseConfig`. فليكن هو المدخل.
 *
 * **ثلاث مشكلاتٍ يحلّها هذا الملفّ:**
 *
 * ١ ــ المقطعُ ليس JSON. مفاتيحُه بلا علامات اقتباس، وفيه تعليقاتٌ
 *     ووسومٌ واستيرادات. فيُقرأ بالنمط لا بـ`JSON.parse` — ولا يُنفَّذ
 *     أبداً بـ`eval`: نصٌّ ملصوقٌ من الخارج لا يُشغَّل على الخادم.
 *
 * ٢ ــ الإعدادُ لا يحمل `databaseURL` في الغالب — كونسول فايربيز لا
 *     يضعه إلّا إن أُنشئت قاعدةُ الوقت الحقيقي قبل نسخ الإعداد. فيُشتقّ
 *     من `projectId`، وله أربع صيغٍ بحسب الإقليم، فتُجرَّب كلُّها
 *     ويُؤخذ ما يردّ.
 *
 * ٣ ــ الإعدادُ لا يحمل اعتماداً. مفتاحُ `apiKey` هنا **ليس سرّاً** —
 *     هو معرّفٌ عامٌّ يُنشر في كل صفحة، ولا يفتح قاعدةً مقفلة. فإن كانت
 *     قواعدُ القاعدة مفتوحةً عملت بلا اعتماد (وهذا خطرٌ يُنبَّه إليه)،
 *     وإن كانت مقفلةً لزم حسابُ خدمة.
 */

export type ParsedConfig = {
  projectId?: string;
  /** العنوان إن ذُكر صراحةً في الإعداد. */
  databaseURL?: string;
  /** من ملفّ حساب الخدمة إن لُصق معه. */
  clientEmail?: string;
  privateKey?: string;
  /** سرُّ القاعدة القديم إن لُصق. */
  secret?: string;
};

/** قيمةُ مفتاحٍ داخل كائنٍ جافاسكربتي أو JSON — بعلامات اقتباس أو بدونها. */
function pick(src: string, key: string): string | undefined {
  const re = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`, "i");
  return src.match(re)?.[1]?.trim() || undefined;
}

/**
 * يقرأ ما لُصق: مقطع `<script>`، أو كائنَ `firebaseConfig` وحده، أو
 * ملفَّ حساب الخدمة، أو الثلاثة معاً في صندوقٍ واحد.
 */
export function parseFirebasePaste(raw: string): ParsedConfig {
  const src = String(raw ?? "").slice(0, 20_000);
  const out: ParsedConfig = {};

  out.projectId = pick(src, "projectId") || pick(src, "project_id");
  out.databaseURL = pick(src, "databaseURL") || pick(src, "database_url");
  out.clientEmail = pick(src, "client_email") || pick(src, "clientEmail");
  out.secret = pick(src, "secret") || pick(src, "databaseSecret");

  /*
    المفتاحُ الخاصّ سطورٌ لا سطر، ومحاطٌ بـ`-----BEGIN`. يُقرأ بحدّيه
    لا بنمط المفتاح/القيمة — وإلّا انقطع عند أوّل سطر.
  */
  const pem = src.match(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/);
  if (pem) out.privateKey = pem[0].replace(/\\n/g, "\n").replace(/\\r/g, "");

  /* `projectId` قد يُستخرج من العنوان نفسِه إن لُصق العنوان وحده. */
  if (!out.projectId && out.databaseURL) {
    out.projectId = out.databaseURL
      .replace(/^https?:\/\//, "")
      .split(".")[0]
      .replace(/-default-rtdb$/, "");
  }

  /* لُصق عنوانٌ عارٍ بلا إعداد. */
  if (!out.databaseURL) {
    const bare = src.match(/https:\/\/[\w-]+\.(?:firebaseio\.com|firebasedatabase\.app)/i);
    if (bare) out.databaseURL = bare[0];
  }

  return out;
}

/** هل العنوان عنوانُ قاعدةِ وقتٍ حقيقي؟ */
export function validDbUrl(url: string): boolean {
  return /^https:\/\/[\w.-]+\.(firebaseio\.com|firebasedatabase\.app)$/i.test(url.replace(/\/$/, ""));
}

/**
 * العناوينُ المحتملة لمشروع.
 * فايربيز يضع القاعدة في `firebaseio.com` للإقليم الأمريكي، وفي
 * `firebasedatabase.app` مسبوقاً باسم الإقليم لما عداه. ولا سبيل لمعرفة
 * الإقليم من الإعداد، فتُجرَّب الصيغُ بترتيب شيوعها.
 */
export function candidateUrls(projectId: string): string[] {
  const p = projectId.trim().replace(/[^\w-]/g, "");
  if (!p) return [];
  return [
    `https://${p}-default-rtdb.firebaseio.com`,
    `https://${p}-default-rtdb.europe-west1.firebasedatabase.app`,
    `https://${p}-default-rtdb.asia-southeast1.firebasedatabase.app`,
    `https://${p}-default-rtdb.us-central1.firebasedatabase.app`,
    `https://${p}.firebaseio.com`,
  ];
}
