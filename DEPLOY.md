# النشر على Vercel — خطوة بخطوة

> المنصّة سحابية بالكامل: البيانات في **Firebase Realtime Database**، والملفات في **Google Drive**.
> لا تحتاج أي قرص على الخادم، فهي مناسبة لفيرسل تماماً.

---

## ١) قبل الرفع على GitHub

- `.env.local` **لا يُرفع** (مستبعد في `.gitignore`) — القيم تُضاف في لوحة فيرسل.
- تأكّد أن المستودع **Private** ما لم تكن قد أغلقت قواعد فايربيز بعد.

```bash
git commit -m "منصة إيمان زيدان"
```

```bash
git branch -M main && git remote add origin https://github.com/USERNAME/REPO.git && git push -u origin main
```

---

## ٢) إنشاء المشروع على Vercel

1. vercel.com ← **Add New… → Project** ← اختر المستودع.
2. الإطار يُكتشف تلقائياً (Next.js) — لا تغيّر أمر البناء.
3. **قبل الضغط على Deploy** أضِف متغيّرات البيئة (الجدول التالي).

---

## ٣) متغيّرات البيئة (Settings ← Environment Variables)

انسخ القيم من `.env.local` عندك، وأضِف للجميع البيئات (Production / Preview / Development):

| المتغيّر | الشرح |
|---|---|
| `AUTH_SECRET` | سرّ توقيع الجلسات — سلسلة عشوائية طويلة |
| `COOKIE_SECURE` | **`1`** — إلزامي على فيرسل لأنه HTTPS |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | حساب المالكة (يُستخدم عند أول تشغيل فقط) |
| `FIREBASE_DATABASE_URL` | رابط قاعدة البيانات |
| `FIREBASE_CLIENT_EMAIL` | من ملف حساب الخدمة |
| `FIREBASE_PRIVATE_KEY` | من ملف حساب الخدمة — **الصقه كما هو بأسطره**، فيرسل يقبل الأسطر المتعدّدة |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | تطبيق جوجل (Meet + Drive) |
| `GOOGLE_REDIRECT_URI` | `https://اسم-المشروع.vercel.app/api/google/callback` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | إشعارات الأجهزة |
| `YOUTUBE_API_KEY` | اختياري — لجلب كل فيديوهات القناة |
| `CRON_SECRET` | سرّ عشوائي لحماية مسار النسخ الاحتياطي المجدول |
| `ADMIN_DEVICE_LOCK` | اختياري — `0` يوقف قفل جهاز المشرفين مؤقّتاً (صمّام استعادة) |
| `VERCEL_TOKEN` | اختياري — لربط الدومينات المخصّصة تلقائياً عبر Vercel API |
| `VERCEL_PROJECT_ID` | اختياري — معرّف مشروع فيرسل (مع `VERCEL_TOKEN` لإدارة الدومينات) |
| `VERCEL_TEAM_ID` | اختياري — معرّف الفريق إن كان المشروع تحت فريق |

> **تنبيه على `FIREBASE_PRIVATE_KEY`:** إن لصقته بصيغة السطر الواحد فاترك `\n` كما هي — الكود يحوّلها لأسطر حقيقية.

---

## ٤) بعد أول نشر

1. **Google Cloud Console ← Credentials ← OAuth client ← Authorized redirect URIs** ← أضِف:
   `https://اسم-المشروع.vercel.app/api/google/callback`
   (وأي دومين مخصّص تربطه لاحقاً).
2. افتح `/admin/live` ← **اربط حساب جوجل** (لتعمل اجتماعات Meet ورفع الملفات إلى Drive).
3. افتح `/admin/backup` ← **نسخة احتياطية الآن** للتأكّد من عمل المسار.
4. جرّب تسجيل الدخول والتسجيل من هاتف — الإشعارات والتثبيت كتطبيق يعملان على HTTPS فقط.

---

## ٥) النسخ الاحتياطي المجدول

`vercel.json` يشغّل نسخة يومية الساعة **٢:٠٠ فجراً UTC** عبر `/api/cron/backup`.
المسار لا يستجيب إلا لجدولة فيرسل أو لترويسة `Authorization: Bearer $CRON_SECRET`.

> خطط فيرسل المجانية تسمح بجدولة يومية واحدة — وهو ما نستخدمه بالضبط.

---

## ٦) أشياء تختلف عن التشغيل المحلي

| الأمر | محلياً | على فيرسل |
|---|---|---|
| تخزين البيانات | فايربيز (أو ملف محلي بلا ربط) | فايربيز فقط |
| رفع الملفات | Drive أو قرص الخادم | **Drive فقط** (لا قرص دائم) |
| كوكي الجلسة | بلا `Secure` | `Secure` عبر `COOKIE_SECURE=1` |
| النسخ التلقائي | عند أول طلب بعد ٢٤ ساعة | جدولة فيرسل اليومية |
| تحديد المحاولات | ذاكرة عملية واحدة | ذاكرة كل نسخة على حدة (الحظر نفسه في القاعدة ومشترك) |

---

## ٦.٥) إن فُقد جهاز المالكة

حساب المشرف مرتبط بجهاز واحد. لو تعذّر الدخول من جهاز جديد:

1. في فيرسل ← Environment Variables ← أضِف `ADMIN_DEVICE_LOCK` = `0` ثم Redeploy.
2. سجّلي الدخول من الجهاز الجديد.
3. من **المشرفون** اضغطي «جهاز جديد» على حسابك ليرتبط بالجهاز الحالي.
4. احذفي المتغيّر وأعيدي النشر ليعود القفل.

---

## ٧) قائمة تحقّق أمنية قبل الإطلاق

- [ ] نشر قواعد فايربيز المغلقة (`npx firebase-tools deploy --only database`).
- [ ] إضافة حساب الخدمة في متغيّرات فيرسل.
- [ ] `COOKIE_SECURE=1`.
- [ ] تغيير `ADMIN_PASSWORD` عن القيمة الافتراضية.
- [ ] توليد `client_secret` جديد لجوجل إن كان القديم قد شورك في أي مكان.
- [ ] فتح `/admin/security` والتأكّد أن السجلّ يعمل.

---

## ٨) تعدّد المنصّات (Multi-Tenant) — خطوات النشر

1. **انشر الكود أوّلاً** — يعمل بلا أي متغيّر جديد: الجذر يخدم المنصّة الحالية، وتُقرأ بياناتها من `platform/` القديم حتى يتمّ الترحيل.
2. **رحّل البيانات** (من جهازك، بـ`.env.local` الإنتاجي):
   ```bash
   node scripts/migrate-to-tenants.mjs --dry
   node scripts/migrate-to-tenants.mjs --id default --slug default --name "اسم المنصّة"
   ```
   ينسخ ولا يحذف. بعد التأكّد أن كل شيء يعمل لأيام: `--drop-legacy`.
3. **انشر قواعد فايربيز الجديدة**: `npx firebase-tools deploy --only database`.
4. **متغيّرات فيرسل الجديدة**: `DEFAULT_TENANT_ID=default` · `ROOT_DOMAIN=platforms.example.com` (النطاق الجذري للمنصّات) · `ROOT_HOST_MODE=tenant` (يبقى كذلك حتى إطلاق الـHub في M3).
5. **النطاق الفرعي العامّ**: في Vercel ← Domains أضِف `*.platforms.example.com`، وعند مزوّد DNS: `CNAME * → cname.vercel-dns.com`. الشهادة تُصدر تلقائياً.
6. **جوجل**: عنوان العودة يبقى على الجذر — لا حاجة لتسجيل كل نطاق فرعي.

> محلّياً: `npm run dev:local` ثم `http://demo.localhost:3000` لأي منصّة مسجّلة في `data/hub.json` (أو `?tenant=demo` على localhost).
