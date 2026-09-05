/**
 * تشغيلٌ محلّيٌّ معزول — بلا سحابة.
 * ------------------------------------------------------------------
 * `.env.local` يحمل مفاتيحَ قاعدة الإنتاج، و`next start` يقرؤه. فأيُّ
 * تجربةٍ محلّية تلمس بياناتِ الطلاب الحقيقية. هذا الغلاف يُفرغ مفاتيحَ
 * فايربيز قبل الإقلاع (والمتغيّرُ المضبوطُ ولو فارغاً لا يُستبدل من
 * الملف)، فتعمل المنصّة على ملفّات `data/` وحدها.
 *
 *   node scripts/start-local.mjs            # إنتاج محلّي على 3300
 *   node scripts/start-local.mjs dev        # تطوير على 3000
 *   PORT=4000 node scripts/start-local.mjs
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* يعمل من جذر المشروع مهما كان مجلّدُ التشغيل */
process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));

const mode = process.argv[2] === "dev" ? "dev" : "start";
const port = process.env.PORT || (mode === "dev" ? "3000" : "3300");

const env = {
  ...process.env,
  FIREBASE_DATABASE_URL: "",
  FIREBASE_CLIENT_EMAIL: "",
  FIREBASE_PRIVATE_KEY: "",
  FIREBASE_DATABASE_SECRET: "",
  COOKIE_SECURE: "0",
  ADMIN_DEVICE_LOCK: "0",
  /*
    حسابُ لوحة المنصّات للتجربة المحلّية وحدَها.
    مكتوبٌ هنا لا في `.env.example` لأنّ هذا الملفَّ **مِشْجَبُ تطويرٍ
    صريح**: يُفرغ مفاتيحَ الإنتاج ويُطفئ الكوكيَ الآمنة وقفلَ الجهاز.
    وفي الإنتاج تُضبط `SUPER_ADMIN_*` في متغيّرات الاستضافة، ولا يمرّ
    هذا السكربتُ أصلاً.
  */
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || "super@local.test",
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || "LocalHub@2026",
  SUPER_DEVICE_LOCK: "0",
};

const child = spawn("npx", ["next", mode, "-p", port], { stdio: "inherit", env, shell: true });
child.on("exit", (code) => process.exit(code ?? 0));
