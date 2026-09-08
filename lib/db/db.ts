import "server-only";
import crypto from "crypto";
import type { DB, PublicDB, PublicIntegrations, User, PublicUser, Role, Subject, Lesson, QuizResult, Live, Exam, ExamAttempt } from "@/lib/utils/types";
import {
  defaultContent, defaultPlans, defaultStudents, defaultSubjects, defaultGrades,
  defaultCodes, defaultExams, defaultLive, defaultTickets, defaultNotifications,
} from "@/lib/utils/defaults";
import { seedUsers } from "@/lib/business/seed-admin";
import { bunnyConfigured, signBunnyUrl } from "@/lib/integrations/bunny";
import { courseActive, lessonActive, planExpiry, planTargets, eligibleFor, liveVisible, publicLives } from "@/lib/auth/access";
import { resolvePlan } from "@/lib/business/plans";
import { allLessons, courseUnits, findLesson, isSplit, lessonCount } from "@/lib/business/course-units";
import { parsePick } from "@/lib/business/picks";
import { dropActivity } from "@/lib/db/activity-store";
import { firebaseConfigured, fbClaimOnce } from "@/lib/db/firebase";
import { pushConfigured } from "@/lib/integrations/push";
import { ensureStore, peek, commit, flushStore, storeState, invalidate, readLocal } from "@/lib/db/store";
import { bindTenant, tenantPath, tryCurrentTenant } from "@/lib/hub/context";
import { sectionHidden } from "@/lib/hub/sections";

/**
 * مخزن محلي بسيط على هيئة ملف JSON.
 * الطبقة معزولة خلف دوال (getDB/saveDB/...) بحيث يسهل استبدالها لاحقاً بـ Supabase
 * دون المساس ببقية التطبيق.
 */

/* ---------- تجزئة كلمات المرور (scrypt) ---------- */
export function hashPassword(password: string, salt?: string) {
  const s = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, s, 64).toString("hex");
  return { salt: s, passwordHash: hash };
}
export function verifyPassword(password: string, user: User) {
  const { passwordHash } = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(passwordHash), Buffer.from(user.passwordHash));
}

function seed(): DB {
  const users: User[] = seedUsers.map((u, i) => {
    const { password, ...rest } = u;
    const { salt, passwordHash } = hashPassword(password);
    return {
      id: `USR-${1000 + i}`,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
      ...rest,
    } as User;
  });
  return {
    content: defaultContent,
    plans: defaultPlans,
    students: defaultStudents,
    subjects: defaultSubjects,
    grades: defaultGrades,
    codes: defaultCodes,
    exams: defaultExams,
    live: defaultLive,
    tickets: defaultTickets,
    notifications: defaultNotifications,
    users,
  };
}

/** تحميل البيانات من مصدر الحقيقة (فايربيز إن ضُبط، وإلا الملف المحلي). */
export async function loadDB(): Promise<DB> {
  /*
    أوّلُ شيء: أيُّ منصّةٍ؟ — يُربط الطلبُ بمستأجره من ترويسات الوسيط.
    داخل مسار API ملفوفٍ بـ`tenantRoute` السياقُ قائمٌ فلا يُفعل شيء؛
    وفي التخطيطات والصفحات هذا هو ما يجعل `getDB()` بعده تعرف منصّتها.
  */
  await bindTenant();
  await ensureStore(seed);
  const db = getDB(); // getDB يطبّع الحقول الناقصة على النسخة المحمّلة
  void autoBackupTick();
  return db;
}

/** فحص خفيف: إن مرّ يوم على آخر نسخة احتياطية تُؤخذ واحدة في الخلفية. */
async function autoBackupTick() {
  try {
    const { maybeAutoBackup } = await import("./backup");
    await maybeAutoBackup();
  } catch {
    /* النسخ الاحتياطي لا يعطّل الطلبات */
  }
}

/** إجبار قراءة جديدة في الطلب التالي. */
export function refreshDB() {
  invalidate();
}

/** ضمان اكتمال الكتابة السحابية قبل الردّ على المستخدم. */
export async function flushDB() {
  return flushStore();
}

/**
 * تطبيعُ المصفوفات — الغائبُ والفارغُ شيءٌ واحدٌ عند Firebase.
 * ------------------------------------------------------------------
 * **Firebase RTDB لا يخزّن المصفوفةَ الفارغة ولا الكائنَ الفارغ**: يكتبها
 * فيحذف المفتاحَ من العقدة. فامتحانٌ حُذفت أسئلتُه كلُّها يعود
 * `{ title, … }` بلا `questions`، ودرسٌ نُزعت مرفقاتُه يعود بلا
 * `materials`. والشيفرةُ تقرأ `x.questions.length` فتسقط الشجرةُ كلُّها
 * بـ«Cannot read properties of undefined» — وهذا ما كان يُطفئ صفحاتِ
 * اللوحة الواحدةَ تلوَ الأخرى.
 *
 * ولا يُصلَح بـ`?.` في كلّ قراءة: المواضعُ عشراتٌ، وسيُنسى بعضُها، وسيُنسى
 * في كلّ ما يُكتب غداً. فالتطبيعُ عند الحدّ: ما خرج من القاعدة خرج
 * مكتملَ المصفوفات، ولا يعود بقيّةُ البرنامج تسأل.
 *
 * ويُعدَّل الكائنُ في مكانه لا نسخةً منه — `peek` يُرجع المخبوءَ نفسَه،
 * ونسخةٌ جديدةٌ في كلّ نداءٍ تُبطل المقارنةَ بالمرجع في React.
 */
function normalizeArrays(db: DB) {
  db.notifications = db.notifications ?? [];
  db.plans = db.plans ?? [];
  db.students = db.students ?? [];
  db.subjects = db.subjects ?? [];
  db.grades = db.grades ?? [];
  db.codes = db.codes ?? [];
  db.exams = db.exams ?? [];
  db.live = db.live ?? [];
  db.tickets = db.tickets ?? [];
  db.users = db.users ?? [];

  for (const e of db.exams) e.questions = e.questions ?? [];

  for (const c of db.subjects) {
    c.materials = c.materials ?? [];
    c.videos = c.videos ?? [];
    for (const u of c.units ?? []) {
      u.lessons = u.lessons ?? [];
      for (const l of u.lessons) normalizeLesson(l);
    }
    for (const l of c.videos) normalizeLesson(l);
  }

  for (const u of db.users) u.quizResults = u.quizResults ?? [];
}

/** الدرسُ: مرفقاتُه وأسئلتُه — كلاهما يُحذف حين يفرغ. */
function normalizeLesson(l: Lesson) {
  l.materials = l.materials ?? [];
  if (l.quiz) l.quiz.questions = l.quiz.questions ?? [];
}

export function getDB(): DB {
  const db = peek(seed);
  normalizeArrays(db);

  /**
   * مالكة المنصّة: إن لم يُعلَّم أحد بعد، فأقدم مشرف هو المالكة.
   * يضمن وجود حساب واحد لا تُسحب صلاحياته ولا يُحذف مهما جرى.
   */
  const admins = (db.users ?? []).filter((u) => u.role === "admin");
  if (admins.length && !admins.some((u) => u.owner)) {
    const first = [...admins].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))[0];
    first.owner = true;
  }
  db.plans = db.plans ?? [];
  db.security = db.security ?? { events: [], bans: [] };
  db.security.events = db.security.events ?? [];
  db.security.bans = db.security.bans ?? [];
  db.students = db.students ?? [];
  db.subjects = db.subjects ?? [];
  db.grades = db.grades ?? [];
  db.codes = db.codes ?? [];
  db.exams = (db.exams ?? []).map((e) => ({
    ...e,
    questions: Array.isArray(e.questions) ? e.questions : [],
  }));
  db.live = db.live ?? [];
  db.tickets = db.tickets ?? [];
  return db;
}


export function saveDB(db: DB) {
  // يحفظ محلياً فوراً ويُدرج الكتابة إلى فايربيز في طابور مرتّب
  commit(db);
}

/* ---------- المزامنة السحابية ---------- */

/** رفع النسخة الحالية إلى فايربيز والانتظار حتى تكتمل. */
export async function mirrorToFirebase(): Promise<{ ok: boolean; error: string | null }> {
  if (!firebaseConfigured()) return { ok: false, error: "فايربيز غير مضبوط" };
  commit(getDB());
  return flushStore();
}

/** استيراد النسخة السحابية واعتمادها. */
export async function hydrateFromFirebase(): Promise<{ ok: boolean; error?: string; users?: number }> {
  if (!firebaseConfigured()) return { ok: false, error: "فايربيز غير مضبوط" };
  invalidate();
  try {
    const db = await ensureStore(seed);
    return { ok: true, users: db.users.length };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function firebaseSyncState() {
  const st = storeState();
  return { lastMirrorAt: st.lastSyncAt, lastMirrorError: st.lastError, source: st.source, cachedAt: st.cachedAt };
}

/** نسخة الطوارئ المحلية (للاستعادة اليدوية). */
export function localBackup(): DB | null {
  return readLocal();
}

/** يدمج تعديلاً جزئياً على المستوى الأعلى (content/students/...) ويحفظ. */
export function patchDB(patch: Partial<DB>): DB {
  const db = getDB();
  const next = { ...db, ...patch } as DB;
  saveDB(next);
  return next;
}

function toPublicUser(u: User): PublicUser {
  const { passwordHash, salt, pushSubs, ...rest } = u;
  return { ...rest, pushDevices: pushSubs?.length ?? 0 };
}

/** حالة التكاملات بلا أي رموز سرّية. */
export function publicIntegrations(db: DB): PublicIntegrations {
  const g = db.integrations?.google;
  return {
    google: {
      configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      connected: Boolean(g?.connected && g?.refreshToken),
      email: g?.email,
      connectedAt: g?.connectedAt,
    },
    youtubeApiKey: Boolean(process.env.YOUTUBE_API_KEY || db.integrations?.youtubeApiKey),
    push: pushConfigured(),
    databases: (db.integrations?.databases ?? []).length,
    /* المفتاحُ لا يخرج — وجودُه فقط، والمكتبةُ والمهلةُ ليستا سرّاً. */
    bunny: {
      configured: bunnyConfigured(),
      libraryId: db.integrations?.bunny?.libraryId,
      ttl: db.integrations?.bunny?.ttl,
    },
  };
}

/** نسخة عامة بدون بيانات سرّية (كلمات مرور/رموز تكاملات) — تُرسل للواجهة. */
export function getPublicDB(): PublicDB {
  const db = getDB();
  /*
    روابطُ Bunny تُوقَّع قبل خروجها.
    ------------------------------------------------------------------
    هذا هو الموضعُ الوحيدُ الذي تخرج منه روابطُ الدروس إلى المتصفّح، فهو
    موضعُ التوقيع. وتوقيعُها هنا يجعل كلَّ رابطٍ يصل الطالبَ منتهيَ
    الصلاحية بعد ساعات — فما نُسخ منه مات، ولا يُشارَك.

    ولا يُنسخ الكائنُ إلّا إن كان المفتاحُ مضبوطاً: بلا مفتاحٍ لا فائدةَ
    من مرورٍ على المنهج كلِّه في كلّ طلب.
  */
  const pub = { ...db, users: db.users.map(toPublicUser), integrations: publicIntegrations(db) };
  if (!bunnyConfigured()) return pub;

  pub.subjects = pub.subjects.map((c) => ({
    ...c,
    videos: (c.videos ?? []).map(signLesson),
    units: (c.units ?? []).map((u) => ({ ...u, lessons: (u.lessons ?? []).map(signLesson) })),
  }));
  return pub;
}

/** درسٌ برابطٍ موقَّع — وما ليس Bunny يعود كما هو. */
function signLesson<T extends { url: string }>(l: T): T {
  const url = signBunnyUrl(l.url);
  return url === l.url ? l : { ...l, url };
}

/* ---------- المستخدمون ---------- */
export function findUserByUsername(username: string): User | undefined {
  return getDB().users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function createUser(input: {
  name: string; username: string; password: string; role: Role;
  phone?: string; grade?: string; stage?: string; eduSystem?: string; termName?: string; track?: string; branch?: string;
  gender?: "male" | "female"; school?: string; governorate?: string; active?: boolean;
  /** من أين جاء وأوّل صفحة دخل منها — تُحفظ مرّةً ولا تُقرأ بعدها. */
  source?: string; landing?: string;
}): PublicUser {
  const db = getDB();
  if (db.users.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
    throw new Error("اسم المستخدم مستخدم بالفعل");
  }
  const { salt, passwordHash } = hashPassword(input.password);
  const user: User = {
    id: `USR-${1000 + db.users.length}`,
    name: input.name,
    role: input.role,
    username: input.username,
    passwordHash,
    salt,
    active: input.active ?? (input.role === "admin"),
    phone: input.phone,
    grade: input.grade,
    stage: input.stage,
    eduSystem: input.eduSystem,
    termName: input.termName,
    track: input.track,
    branch: input.branch,
    gender: input.gender,
    school: input.school,
    governorate: input.governorate,
    source: input.source,
    landing: input.landing,
    progress: {},
    enrolled: [],
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  saveDB(db);
  return toPublicUser(user);
}

/**
 * تغيير بريد الطالب أو كلمة مروره — من الأدمن وحده.
 * الطالب لا يملك تغييرهما من بوابته: بيانات الدخول تُدار مركزياً حتى
 * لا يفقد صاحب المنصّة القدرة على الوصول لحساب طالب أو استعادته.
 * حسابات المشرفين تُدار من /api/admins لا من هنا.
 */
export function setUserCredentials(
  id: string,
  input: { username?: string; password?: string }
): { ok: true; user: PublicUser } | { ok: false; error: string } {
  const db = getDB();
  const u = db.users.find((x) => x.id === id);
  if (!u) return { ok: false, error: "الحساب غير موجود" };
  if (u.role !== "student") return { ok: false, error: "حسابات المشرفين تُدار من قسم المشرفين" };

  const username = input.username?.trim();
  if (username && username.toLowerCase() !== u.username.toLowerCase()) {
    if (db.users.some((x) => x.id !== id && x.username.toLowerCase() === username.toLowerCase())) {
      return { ok: false, error: "هذا البريد مستخدم بحساب آخر" };
    }
    u.username = username;
  }

  if (input.password) {
    const { salt, passwordHash } = hashPassword(input.password);
    u.salt = salt;
    u.passwordHash = passwordHash;
  }

  saveDB(db);
  return { ok: true, user: toPublicUser(u) };
}

export function setUserActive(id: string, active: boolean) {
  const db = getDB();
  const u = db.users.find((x) => x.id === id);
  if (u) { u.active = active; saveDB(db); }
  return u ? toPublicUser(u) : null;
}

/** تحديث نسبة تقدّم الطالب في كورس (لا يتجاوز 100). */
export function setUserProgress(userId: string, subjectId: string, value: number) {
  const db = getDB();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return null;
  u.progress = u.progress ?? {};
  u.progress[subjectId] = Math.max(0, Math.min(100, Math.round(value)));
  saveDB(db);
  return u.progress[subjectId];
}

/**
 * حذف حساب طالب — ومعه كل ما هو مربوط به.
 *
 * ما يُحذف مع سجلّ المستخدم نفسه (لأنه مخزّن داخله):
 *   التقدّم · الاشتراكات · محاولات الاختبارات · أجهزة الإشعارات ·
 *   الجهاز المربوط · الإشعارات المقروءة · كلمة المرور وملحها.
 *
 * وما يُنظَّف خارجه:
 *   • الأكواد التي فعّلها: تُفكّ من الحساب وتُعلَّم «منتهي» — لا تعود
 *     «متاح» عمداً، حتى لا يصير الحذف باباً لإحياء كود مدفوع.
 *   • محادثات الدعم الخاصة به.
 *   • الإشعارات الموجّهة إليه وحده (إشعارات الصفّ/الشعبة تبقى للبقية).
 *   • سجلّ الحماية: يُجرَّد من هويّته (لا يُحذف) — فالسجلّ أثر أمني
 *     يوثّق المحاولات المشبوهة، ومحوه يُضعف الحماية.
 *
 * لا تُمسّ شهادات الطلاب في الصفحة الرئيسية: محتوى تسويقي يكتبه الأدمن
 * ولا يرتبط بمعرّف حساب، فمطابقتها بالاسم قد تحذف شهادة شخص آخر.
 */
export function deleteUser(id: string) {
  const db = getDB();
  const u = db.users.find((x) => x.id === id);
  if (!u || u.role === "admin") return false; // لا يُحذف الأدمن

  db.users = db.users.filter((x) => x.id !== id);

  db.codes = db.codes.map((c) =>
    c.studentId === id
      ? { ...c, status: "منتهي" as const, studentId: undefined, student: undefined }
      : c
  );

  // القديمة بلا userId تُطابَق بالاسم — لم يكن يُحفظ المعرّف وقت إنشائها
  db.tickets = db.tickets.filter((t) => (t.userId ? t.userId !== id : t.student !== u.name));

  db.notifications = db.notifications.filter((n) => n.userId !== id);

  /* سجلّ نشاطه في مساره المستقلّ — يُمحى معه فلا يبقى بعد صاحبه. */
  void dropActivity(id);

  /* طلبات الدفع تحمل اسمه وهاتفه وصورة إيصاله — تُحذف معه. */
  db.payments = (db.payments ?? []).filter((p) => p.userId !== id);

  if (db.security?.events) {
    db.security.events = db.security.events.map((e) =>
      e.userId === id ? { ...e, userId: undefined, username: undefined } : e
    );
  }

  saveDB(db);
  return true;
}

/**
 * صاحب الجلسة كما هو في القاعدة الآن — لا كما كان وقت إصدار الكوكي.
 * الجلسة رمز موقّع لا يُلغى بحذف الحساب، فكل بوابة تتحقّق من الحساب
 * نفسه: المحذوف أو الموقوف يُعامَل كزائر ويُخرَج فوراً.
 */
export function sessionUser(session: { uid: string } | null | undefined): User | null {
  if (!session?.uid) return null;
  const u = getDB().users.find((x) => x.id === session.uid);
  return u && u.active ? u : null;
}

/* ---------- الخطط والاشتراكات ---------- */

/** تفعيل خطة بكود: يُنشئ اشتراكاً للطالب وحده بمدّة الخطة، ويُبطل الكود بعد استخدامه. */
export async function redeemCode(userId: string, rawCode: string, subjectId?: string): Promise<
  | { ok: true; subjectId: string; plan: string; planName: string; expiresAt: string | null }
  | { ok: false; error: string }
> {
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user || user.role !== "student") return { ok: false, error: "المستخدم غير موجود" };
  if (!user.active) return { ok: false, error: "الحساب موقوف — تواصل مع الدعم" };

  const code = db.codes.find((c) => c.code.toUpperCase() === rawCode.trim().toUpperCase());
  if (!code) return { ok: false, error: "كود غير صحيح" };
  if (code.status !== "متاح") return { ok: false, error: "هذا الكود مستخدم أو منتهٍ" };

  /*
    الخطة المصدر — من الخطط المحفوظة أو من خيارات أسعار الكورس.
    البحث في `db.plans` وحده كان يُسقط خيارات الأسعار إلى الخطة
    الضمنية، فتضيع مدّتها: «حصّة واحدة» تصير شهراً و«مرّة واحدة»
    تنتهي بعد شهر.
  */
  const plan = resolvePlan(code.planId ?? "", db.plans, db.subjects) ?? {
    id: "legacy",
    name: code.subjectId === "*" ? "الترم الكامل" : code.subjectName,
    kind: (code.plan === "ترم" ? "term" : "month") as "term" | "month",
    scope: (code.subjectId === "*" ? "all" : "subject") as "all" | "subject",
    subjectId: code.subjectId === "*" ? undefined : code.subjectId,
    price: 0,
    visible: false,
    createdAt: code.createdAt,
  };

  /*
    الخطّةُ قد تفتح أكثرَ من شيء.
    كانت تفتح مفتاحاً واحداً فيُكتب اشتراكٌ واحد؛ وخطّةُ «المختارة» تفتح
    ما أُشّر عليه — كورساتٍ وموادَّ — فيُكتب لكلٍّ اشتراكُه. والكودُ يبقى
    كوداً واحداً: الطالبُ يُفعّل مرّةً ويُفتح له ما اشتراه كلُّه.
  */
  const targets = planTargets(plan);
  if (targets.length === 0) return { ok: false, error: "الخطة غير مكتملة — تواصل مع الدعم" };
  const target = targets[0];

  const isTermScope = (t: string) => /^T[12]$/.test(t);

  /* يُفحص كلُّ مفتاحٍ قبل كتابة شيء — فإمّا أن يمرّ الكودُ كلُّه أو لا يُكتب
     منه شيء، ولا يبقى اشتراكٌ نصفُه صحيح. */
  for (const t of targets) {
    if (t === "*" || isTermScope(t)) continue;
    const { subjectId: sid, unitId } = parsePick(t);
    const subj = db.subjects.find((x) => x.id === sid);
    if (!subj) return { ok: false, error: "الكورس غير موجود" };
    if (unitId && !courseUnits(subj).some((u) => u.id === unitId)) {
      return { ok: false, error: "المادّة لم تعد موجودة في الكورس" };
    }
    if (!eligibleFor(subj, user)) return { ok: false, error: "هذا الكورس غير متاح لصفّك/شعبتك" };
  }

  /*
    وحصرُ الكود بكورسٍ بعينه يُفحص على المجموعة لا على الأوّل: كودُ خطّةٍ
    مختارةٍ تشمل كورسَك صالحٌ وإن لم يكن كورسُك أوّلَ ما فيها.
  */
  if (subjectId && !targets.some((t) => t === "*" || isTermScope(t) || parsePick(t).subjectId === subjectId)) {
    return { ok: false, error: "هذا الكود مخصّص لكورس آخر" };
  }

  const now = new Date();
  const expiresAt = planExpiry(plan, db.content.termEnd, now);
  if (plan.kind === "term" && expiresAt && new Date(expiresAt).getTime() <= now.getTime()) {
    return { ok: false, error: "انتهت مدّة هذه الخطة — تواصل مع الدعم" };
  }

  /*
    المطالبةُ الذرّيّةُ بالكود — تُستهلَك مرّةً واحدةً في العالم كلِّه.
    ------------------------------------------------------------------
    فحصُ `code.status` أعلاه يحمي داخلَ النسخةِ الواحدة (شيفرةٌ متزامنة
    لا تتداخل). لكنّ Vercel يشغّل نُسخاً متعدّدةً كلٌّ بمخبئها، فقد ترى
    نسختان الكودَ «متاحاً» في النافذة نفسِها فتُستهلكه مرّتين.

    فتُطلب مطالبةٌ ذرّيّةٌ على `claims/<code>` قبل كتابةِ أيّ اشتراك: من
    يفوز بها يُفعّل، ومن يخسرها يُردّ «مستخدم». والمطالبةُ **قبل** أوّل
    تعديلٍ على المستخدم، فلا اشتراكَ يُكتب ثمّ يُتراجَع عنه.

    وبلا فايربيز (تشغيلٌ محلّيّ) تعيد `true` دائماً — النسخةُ واحدةٌ
    والفحصُ المتزامنُ يكفيها.
  */
  const claimKey = code.code.trim().toUpperCase().replace(/[.$#[\]/]/g, "-");
  const claimed = await fbClaimOnce(tenantPath(`claims/${claimKey}`), {
    by: user.id, name: user.name, at: now.toISOString(),
  });
  if (!claimed) {
    return { ok: false, error: "هذا الكود مستخدم أو منتهٍ" };
  }

  user.progress = user.progress ?? {};
  user.subscriptions = user.subscriptions ?? [];
  targets.forEach((t, i) => {
    user.subscriptions!.push({
      id: `SUB-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      subjectId: t,
      scope: plan.scope,
      termNo: plan.termNo,
      plan: plan.kind === "term" ? "ترم" : "شهر",
      planId: plan.id,
      planName: plan.name,
      activatedAt: now.toISOString(),
      expiresAt,
    });
    /* التقدّمُ يُفتح للكورس لا للمادّة — تقدّمُ الطالب في الكورس واحد. */
    const sid = parsePick(t).subjectId;
    if (t !== "*" && !isTermScope(t) && !(sid in user.progress!)) user.progress![sid] = 0;
  });

  code.status = "مستخدم";
  code.student = user.name;
  code.studentId = user.id;
  code.usedAt = now.toISOString();

  /* الطلب الذي صدر عنه الكود يُعلَّم مفعَّلاً — فتُعرف الأموال التي
     وصلت ولم يُستعمل كودها بعد. */
  if (code.payId) {
    const req = (db.payments ?? []).find((p) => p.id === code.payId);
    if (req) req.redeemedAt = now.toISOString();
  }

  /* عدّادُ طلاب الكورس — مرّةً لكلّ كورسٍ لا لكلّ مفتاح، وإلّا عُدّ من
     اشترى ثلاثَ موادَّ من كورسٍ ثلاثةَ طلاب. */
  const touched = new Set(
    targets.filter((t) => t !== "*" && !isTermScope(t)).map((t) => parsePick(t).subjectId)
  );
  for (const sid of touched) {
    const subj = db.subjects.find((x) => x.id === sid);
    if (subj) subj.students = (subj.students ?? 0) + 1;
  }

  saveDB(db);
  return { ok: true, subjectId: target, plan: plan.kind, planName: plan.name, expiresAt };
}

/* ---------- اختبارات الدروس ---------- */

/** تصحيح اختبار درس على السيرفر وحفظ النتيجة (الإجابات الصحيحة لا تغادر السيرفر). */
export function gradeQuiz(userId: string, subjectId: string, lessonId: string, answers: number[]):
  | { ok: true; result: QuizResult; correct: number[] }
  | { ok: false; error: string } {
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: "المستخدم غير موجود" };

  const subject = db.subjects.find((s) => s.id === subjectId);
  /* البحثُ يمرّ بالوحدات: درسٌ في وحدةٍ لا يوجد في `videos` فيُردّ خطأً. */
  const lesson = subject ? findLesson(subject, lessonId)?.lesson : undefined;
  if (!subject || !lesson) return { ok: false, error: "الدرس غير موجود" };
  if (!lesson.quiz?.enabled || !lesson.quiz.questions.length) return { ok: false, error: "لا يوجد اختبار على هذا الدرس" };
  if (!lesson.isFree && !courseActive(user, subjectId, Date.now(), subject.term)) {
    return { ok: false, error: "هذا الدرس غير مُفعّل" };
  }

  const questions = lesson.quiz.questions;
  const correct = questions.map((q) => q.correct);
  const score = questions.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
  const total = questions.length;
  const percent = Math.round((score / total) * 100);
  const result: QuizResult = {
    subjectId, lessonId, score, total, percent,
    passed: percent >= (lesson.quiz.passScore ?? 60),
    at: new Date().toISOString(),
    /*
      وتُحفظ إجاباتُه ليُعرف **أين** أخطأ لا أنّه أخطأ.
      وتُقصّ على عدد الأسئلة وتُطبَّع: ما وصل من المتصفّح لا يُصدَّق طولُه
      ولا نوعُه — مصفوفةٌ أطولُ من الأسئلة تُخزَّن في القاعدة أبداً، وقيمةٌ
      ليست رقماً تكسر العرضَ عند القراءة.
    */
    answers: questions.map((_, i) => (Number.isInteger(answers[i]) ? answers[i] : -1)),
  };

  /*
    أعلى نتيجةٍ تبقى.
    ------------------------------------------------------------------
    كانت المحاولةُ الأخيرةُ تمحو ما قبلها أيّاً كانت — فمن نجح بتسعين ثمّ
    أعاد ليراجع فأخطأ، خسر نجاحَه بمراجعته. وهذا يُعلّم الطالبَ ألّا
    يُعيد، وإعادةُ الواجب هي المقصودةُ منه.

    فالأعلى يبقى، ويُحفظ تاريخُ آخر محاولةٍ معه: الأوّلُ يقول ما بلغه،
    والثاني يقول متى عمل.
  */
  const prev = (user.quizResults ?? []).find((r) => r.lessonId === lessonId);
  const keep = prev && prev.percent > result.percent ? { ...prev, at: result.at } : result;

  user.quizResults = (user.quizResults ?? []).filter((r) => r.lessonId !== lessonId);
  user.quizResults.push(keep);
  saveDB(db);
  return { ok: true, result, correct };
}

/** تعليم إشعارات كمقروءة لطالب. */
export function markNotificationsRead(userId: string, ids: string[]) {
  const db = getDB();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return false;
  u.readNotifications = Array.from(new Set([...(u.readNotifications ?? []), ...ids]));
  saveDB(db);
  return true;
}

/* ---------- الحمولة المرسلة للواجهة (مقيّدة حسب الدور) ---------- */

type Scope = { uid: string; role: Role } | null;

/**
 * كورس بلا أي روابط (للزائر) — اسم وسعر وغلاف فقط.
 *
 * **والوحداتُ تُفرَّغ كما تُفرَّغ `videos`.** كانت هذه الدالّةُ تُفرّغ
 * المسطّحةَ وحدَها، فلو أُضيفت الوحداتُ ولم تُذكر هنا لخرجت روابطُ
 * دروسِها كلِّها إلى كلّ زائر. وعناوينُ الوحدات تبقى: هي فهرسُ المنهج
 * ويُراد أن تُرى قبل الشراء.
 */
function stripSubject(s: Subject): Subject {
  return {
    ...s,
    videos: [],
    materials: [],
    units: (s.units ?? []).map((u) => ({ ...u, lessons: [], materials: [] })),
    lessons: lessonCount(s),
  };
}

/** كورس للطالب: رابط الدرس يُرسل فقط إذا كان الدرس مفتوحاً له، وإجابات الاختبار تُحذف دائماً. */
function scopeSubjectForStudent(s: Subject, me: User | undefined): Subject {
  const owned = courseActive(me, s.id, Date.now(), s.term);

  /*
    قيدُ الدرس الواحد — يُكتب مرّةً ويُطبَّق على المسطّحة وعلى الوحدات.
    وكتابتُه مرّتين هي كيف تتسرّب الروابط: يُصلَح أحدُ الموضعين ويُنسى
    الآخر، ولا يظهر الخللُ في الواجهة لأنّ المشترك يرى كلَّ شيءٍ أصلاً.
  */
  const gate = (v: Lesson): Lesson => {
    const open = Boolean(v.isFree) || owned;
    const quiz = v.quiz?.enabled
      ? {
          enabled: true,
          passScore: v.quiz.passScore,
          questions: open
            ? v.quiz.questions.map((q) => ({ id: q.id, text: q.text, options: q.options, correct: -1 }))
            : [],
        }
      : undefined;
    return { ...v, url: open ? v.url : "", quiz };
  };

  return {
    ...s,
    videos: (s.videos ?? []).map(gate),
    units: (s.units ?? []).map((u) => ({
      ...u,
      lessons: (u.lessons ?? []).map(gate),
      materials: owned ? u.materials ?? [] : [],
    })),
    materials: owned ? s.materials ?? [] : [],
    lessons: lessonCount(s),
  };
}

/**
 * الحمولة العامة حسب الجلسة — لا يُرسل للمتصفّح إلا ما يخصّ صاحب الجلسة:
 * • زائر: المحتوى + الخطط الظاهرة + أسماء الكورسات فقط (بلا روابط أو دروس أو بيانات طلاب).
 * • طالب: حسابه هو فقط + كورسات صفّه/شعبته + روابط الدروس المفتوحة له + إشعاراته.
 * • أدمن: كل شيء.
 */
export function getScopedDB(session: Scope): PublicDB {
  const db = getDB();

  /*
    المشرفُ يأخذ كلَّ شيءٍ **إلّا ما أُخفي عن منصّته**.
    والإخفاءُ هنا تقليلٌ للحمولة لا حمايةٌ وحدَه (الحمايةُ في `tenantRoute`
    و`PUT /api/content`): لا يُرسَل إلى المتصفّح ما لا شاشةَ له.
  */
  if (session?.role === "admin") {
    const pub = getPublicDB();
    const tenant = tryCurrentTenant()?.tenant;
    if (!tenant?.hiddenSections?.length) return pub;
    const out = { ...pub };
    if (sectionHidden(tenant, "youtube")) out.youtube = undefined;
    if (sectionHidden(tenant, "payments")) out.payments = [];
    if (sectionHidden(tenant, "codes")) out.codes = [];
    if (sectionHidden(tenant, "exams")) out.exams = [];
    if (sectionHidden(tenant, "support") || sectionHidden(tenant, "supportChat")) out.tickets = [];
    if (sectionHidden(tenant, "security")) out.security = { events: [], bans: [] };
    return out;
  }

  if (session?.role === "student") {
    const me = db.users.find((u) => u.id === session.uid);
    // حساب محذوف أو موقوف: لا حمولة طالب إطلاقاً — يسقط لحمولة الزائر
    if (!me || !me.active) return getScopedDB(null);
    const subjects = db.subjects
      .filter((s) => s.status === "منشورة" && eligibleFor(s, me))
      .map((s) => scopeSubjectForStudent(s, me));
    // البث: يظهر لصفّه/شعبته فقط، والرابط لا يُرسل إلا لمن يحقّ له فتحه
    const live: Live[] = db.live
      .filter((l) => eligibleFor({ grade: l.grade, track: l.track }, me))
      .map((l) => {
        const subj = l.subjectId ? db.subjects.find((x) => x.id === l.subjectId) : undefined;
        return liveVisible(me, { ...l, subjectTerm: subj?.term }) ? l : { ...l, url: "" };
      });
    // الاختبارات: اختبارات صفّه/شعبته فقط · بلا إجابات صحيحة · الأسئلة تُحجب عمّن لا يحقّ له
    const exams: Exam[] = db.exams
      .filter((e) => eligibleFor({ grade: e.grade, track: e.track }, me))
      .map((e) => {
        const open = me ? examAllowed(me, e) : false;
        return {
          ...e,
          questions: open
            ? e.questions.map((q) => ({ id: q.id, text: q.text, options: q.options, correct: -1, points: q.points }))
            : [],
        };
      });
    const notifications = db.notifications.filter((n) =>
      (!n.userId || n.userId === me?.id) &&
      (!n.grade || !me?.grade || n.grade === me.grade) &&
      (!n.track || !me?.track || n.track === me.track)
    );
    return {
      ...db,
      subjects,
      live,
      exams,
      notifications,
      plans: db.plans,
      youtube: undefined, // قسم القناة إداري بحت
      // طلبات الدفع: طلباتُه وحده — لا يرى تحويلات غيره ولا أرقامهم
      payments: (db.payments ?? []).filter((p) => p.userId === me.id),
      codes: [],
      tickets: [],
      students: [],
      integrations: undefined, // التكاملات شأن إداري بحت
      security: undefined,     // سجلّ الأمان للأدمن فقط
      /*
        طلباتُ النقل: طلباتُه وحدَه.
        و`...db` يمرّرها كاملةً لو لم تُذكر هنا — وفيها أسماءُ الطلاب
        ومراحلُهم وأسبابُهم. وهي أوّلُ ما يُنسى في حقلٍ جديد: يُضاف إلى
        القاعدة فيخرج مع الحمولة بلا أن يكتبه أحد.
      */
      gradeRequests: (db.gradeRequests ?? []).filter((r) => r.userId === me.id),
      users: me ? [toPublicUser(me)] : [],
    };
  }

  // زائر
  const { videoUrl, ...cta } = db.content.cta ?? {};
  /*
    أرقام التحويل تُعطى لمن يدفع لا لمن يمرّ: الزائر يرى أن البوّابة
    موجودة ولا يرى رقماً واحداً منها، فلا تُحصَد الأرقام من الصفحة.
  */
  const payCfg = db.content.payments;
  return {
    ...db,
    payments: [],
    content: {
      ...db.content,
      ...(payCfg ? { payments: { ...payCfg, methods: [] } } : {}),
      cta: { ...cta, videoUrl: "" },
    },
    plans: db.plans.filter((p) => p.visible),
    youtube: undefined,
    // أسماء الصفوف فقط (تلزم قائمة التسجيل) — بلا أعداد الطلاب أو المواد
    grades: db.grades.map((g) => ({ ...g, students: 0, subjects: 0 })),
    subjects: db.subjects.filter((s) => s.status === "منشورة").map(stripSubject),
    codes: [],
    exams: [],
    gradeRequests: [], // شأنُ الطلاب — لا يخرج لمن ليس منهم
    // الزائر يرى البث المجاني وحده (برابطه) ولا شيء غيره
    live: publicLives(db.live),
    tickets: [],
    students: [],
    notifications: [],
    integrations: undefined,
    security: undefined,
    users: [],
  };
}

/* ---------- إشعارات الأجهزة (Web Push) ---------- */

/** حفظ/تحديث اشتراك جهاز للطالب (بلا تكرار لنفس endpoint). */
export function savePushSub(
  userId: string,
  sub: { endpoint: string; p256dh: string; auth: string; ua?: string }
) {
  const db = getDB();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return false;
  u.pushSubs = (u.pushSubs ?? []).filter((s) => s.endpoint !== sub.endpoint);
  u.pushSubs.push({
    id: `PS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth: sub.auth,
    ua: sub.ua,
    createdAt: new Date().toISOString(),
  });
  saveDB(db);
  return true;
}

/** إلغاء اشتراك جهاز. */
export function removePushSub(userId: string, endpoint: string) {
  const db = getDB();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return false;
  u.pushSubs = (u.pushSubs ?? []).filter((s) => s.endpoint !== endpoint);
  saveDB(db);
  return true;
}

/** حذف اشتراك تالف (رد 404/410 من خدمة الدفع). */
export function dropDeadSub(endpoint: string) {
  const db = getDB();
  let changed = false;
  db.users.forEach((u) => {
    const before = u.pushSubs?.length ?? 0;
    if (before) {
      u.pushSubs = u.pushSubs!.filter((s) => s.endpoint !== endpoint);
      if (u.pushSubs.length !== before) changed = true;
    }
  });
  if (changed) saveDB(db);
}

/** الطلاب المستهدفون بإشعار (نفس قاعدة العرض في البوابة). */
export function pushTargets(n: { userId?: string; grade?: string; track?: string }): User[] {
  return getDB().users.filter(
    (u) =>
      u.role === "student" &&
      u.active &&
      (u.pushSubs?.length ?? 0) > 0 &&
      (!n.userId || n.userId === u.id) &&
      (!n.grade || !u.grade || n.grade === u.grade) &&
      (!n.track || !u.track || n.track === u.track)
  );
}

/* ---------- الاختبارات ---------- */

/** هل يملك المستخدم صلاحية على كورس؟ يبحث عن الكورس ليمرّر فصله الدراسي. */
export function userOwnsSubject(user: User | undefined, subjectId: string): boolean {
  if (!user) return false;
  const subject = getDB().subjects.find((s) => s.id === subjectId);
  return courseActive(user, subjectId, Date.now(), subject?.term);
}

/** هل يحقّ للطالب دخول هذا الاختبار؟ (نفس منطق البث: الجمهور + الصف/الشعبة) */
export function examAllowed(user: User | undefined, exam: Exam): boolean {
  if (!user) return false;
  if (!eligibleFor({ grade: exam.grade, track: exam.track }, user)) return false;
  if (["all", "public"].includes(exam.audience ?? "subscribers")) return true;
  if (exam.subjectId) {
    const subj = getDB().subjects.find((s) => s.id === exam.subjectId);
    return courseActive(user, exam.subjectId, Date.now(), subj?.term);
  }
  return (user.subscriptions ?? []).some((sb) => !sb.expiresAt || new Date(sb.expiresAt).getTime() > Date.now());
}

/** تصحيح اختبار وحفظ المحاولة وتحديث إحصاءات الاختبار. */
export function gradeExam(userId: string, examId: string, answers: number[]):
  | { ok: true; attempt: ExamAttempt; correct: number[] }
  | { ok: false; error: string } {
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  const exam = db.exams.find((e) => e.id === examId);
  if (!user) return { ok: false, error: "المستخدم غير موجود" };
  if (!exam) return { ok: false, error: "الاختبار غير موجود" };
  if (exam.status !== "منشور") return { ok: false, error: "الاختبار غير متاح الآن" };
  if (!exam.questions.length) return { ok: false, error: "لا توجد أسئلة في هذا الاختبار" };
  if (!examAllowed(user, exam)) return { ok: false, error: "هذا الاختبار غير متاح لك" };

  const previous = (user.examAttempts ?? []).filter((a) => a.examId === examId);
  const allowed = exam.attempts ?? 0;
  if (allowed > 0 && previous.length >= allowed) {
    return { ok: false, error: `انتهت محاولاتك المسموحة (${allowed})` };
  }

  const total = exam.questions.reduce((n, q) => n + (q.points ?? 1), 0);
  const score = exam.questions.reduce(
    (n, q, i) => n + (answers[i] === q.correct ? q.points ?? 1 : 0),
    0
  );
  const percent = total ? Math.round((score / total) * 100) : 0;
  const attempt: ExamAttempt = {
    examId,
    score,
    total,
    percent,
    passed: percent >= (exam.passScore ?? 60),
    at: new Date().toISOString(),
    answers,
  };

  user.examAttempts = [...(user.examAttempts ?? []), attempt];

  // إحصاءات الاختبار: أفضل محاولة لكل طالب
  const best = new Map<string, number>();
  db.users.forEach((u) => {
    (u.examAttempts ?? [])
      .filter((a) => a.examId === examId)
      .forEach((a) => best.set(u.id, Math.max(best.get(u.id) ?? 0, a.percent)));
  });
  exam.submissions = best.size;
  exam.avg = best.size ? Math.round([...best.values()].reduce((x, y) => x + y, 0) / best.size) : 0;

  saveDB(db);
  return { ok: true, attempt, correct: exam.questions.map((q) => q.correct) };
}

/* ---------- ربط الحساب بجهاز واحد ---------- */

/** ربط الجهاز بالحساب (يُستدعى عند أول دخول/تسجيل). */
export function bindDevice(userId: string, deviceId: string, label?: string) {
  const db = getDB();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return false;
  u.deviceId = deviceId;
  u.deviceLabel = label;
  u.deviceBoundAt = new Date().toISOString();
  saveDB(db);
  return true;
}

/** فكّ الارتباط ليتمكّن الطالب من الدخول من جهاز جديد — للأدمن. */
export function resetDevice(userId: string) {
  const db = getDB();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return null;
  u.deviceId = undefined;
  u.deviceLabel = undefined;
  u.deviceBoundAt = undefined;
  u.deviceResetAt = new Date().toISOString();
  saveDB(db);
  return toPublicUser(u);
}
