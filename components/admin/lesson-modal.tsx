"use client";

/**
 * نافذةُ «إدارة الدرس».
 * ------------------------------------------------------------------
 * الدرسُ أربعةُ أشياءَ لا شيءٌ واحد: محتواه، وفيديوه، وواجبُه، ومرفقاتُه.
 * وكانت موزّعةً في ثلاثة مواضعَ من اللوحة، فمن أراد إتمامَ درسٍ واحدٍ
 * تنقّل بينها ولم يعرف ما نقص منه. فجُمعت في نافذةٍ بأربعة تبويبات،
 * والعدّادُ على التبويب يقول ما فيه قبل فتحه.
 *
 * ------------------------------------------------------------------
 * **ولا زرَّ لا يكتب شيئاً.**
 *
 * في التصميم المرسَل شريطُ «نسبة المشاهدة المطلوبة» ومفتاحُ «السماح
 * بالتحميل» لكلّ درس. ولا حقلَ لهما في هذه القاعدة: لا في `Lesson` ولا
 * في `Quiz`. ورسمُهما يُعطي الأستاذَ زرّاً يُحرّكه ولا يقع منه شيء — وهو
 * أسوأُ من غيابه، لأنّه يَعِد ولا يفي، ولا يُكتشف إلّا بعد أن يعتمد عليه.
 *
 * فوُضع مكانَهما ما يعمل: حمايةُ المحتوى مضبوطةٌ للمنصّة كلِّها لا لدرسٍ
 * بعينه، فتُعرض حالتُها الحقيقيّةُ ويُدلّ على موضع تبديلها.
 *
 * **ومفاتيحُ الرفع الأربعة تكتب فعلاً**: `/api/upload` يقبل PDF و Word و
 * PowerPoint والصور — فكلُّ مفتاحٍ يفتح المنتقيَ بامتداداته ويرفع ويُضيف.
 *
 * **والواجبُ واحدٌ لكلّ درس** في هذه القاعدة (`Lesson.quiz`)، لا قائمةُ
 * واجبات. فبطاقتُه واحدةٌ حالُها «منشور» أو «مسودّة»، والقائمةُ تحتها
 * أسئلتُه — وهي وحدةُ العمل الحقيقيّة.
 *
 * **ولا تُحفظ إلّا بالضغط**: الحقولُ تُجمع في مسوّدةٍ ثمّ تُكتب دفعةً
 * واحدة. ونافذةٌ تحفظ مع كلّ حرفٍ تكتب في القاعدة عشراتِ المرّات، ومن
 * فتحها ليطّلع ثمّ أغلقها يجد نفسَه قد عدّل.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  X, FileText, Video, ClipboardList, Paperclip, Plus, Trash2, Link2,
  Upload, Gift, Clock, Check, ExternalLink, ShieldCheck, Loader2,
  FileType2, Presentation, ImageIcon, Pencil,
} from "lucide-react";
import { useContent } from "@/components/content/content-provider";
import type { Lesson, Material, Quiz, QuizQuestion } from "@/lib/utils/types";

const ar = (n: number) => n.toLocaleString("ar-EG");

/* التبويباتُ بترتيب التصميم المرسَل — والأوّلُ المفتوحُ هو «المحتوى». */
type Tab = "files" | "quiz" | "video" | "content";

type Prov = "bunny" | "drive" | "youtube" | "vimeo" | "direct" | "other";

/** يُتعرَّف على المزوّد من الرابط — يُعرض ولا يُسأل عنه الأستاذ. */
function detect(url: string): Prov {
  const u = (url ?? "").trim();
  if (!u) return "other";
  if (u.includes("mediadelivery.net") || /^\d{3,7}\/[0-9a-f-]{20,}$/i.test(u)) return "bunny";
  if (u.includes("drive.google.com") || u.includes("googleusercontent.com")) return "drive";
  if (u.includes("youtu.be") || u.includes("youtube.com")) return "youtube";
  if (u.includes("vimeo.com")) return "vimeo";
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(u)) return "direct";
  return "other";
}

const PROV_NAME: Record<Prov, string> = {
  bunny: "Bunny Stream (مفضّل)",
  drive: "Google Drive",
  youtube: "YouTube",
  vimeo: "Vimeo",
  direct: "ملفّ فيديو مباشر",
  other: "رابط آخر",
};

/** أنواعُ الملفّات التي يقبلها الخادم — أربعةُ مفاتيحَ لا واحد. */
const KINDS: { id: string; label: string; accept: string; icon: React.ReactNode }[] = [
  { id: "pdf", label: "PDF", accept: ".pdf", icon: <FileText className="size-5" /> },
  { id: "word", label: "Word", accept: ".doc,.docx", icon: <FileType2 className="size-5" /> },
  { id: "ppt", label: "PowerPoint", accept: ".ppt,.pptx", icon: <Presentation className="size-5" /> },
  { id: "img", label: "صورة", accept: "image/*", icon: <ImageIcon className="size-5" /> },
];

export function LessonModal({
  lesson, courseName, unitName, onClose, onSave, quizResults,
}: {
  lesson: Lesson;
  courseName: string;
  unitName: string;
  onClose: () => void;
  onSave: (next: Lesson) => void;
  quizResults?: { attempts: number; avg: number; passed: number };
}) {
  const { content, uploadImage } = useContent();
  const [tab, setTab] = useState<Tab>("content");
  const [draft, setDraft] = useState<Lesson>(lesson);
  const [link, setLink] = useState({ title: "", url: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const pick = useRef<HTMLInputElement>(null);
  const pending = useRef<string>("");

  useEffect(() => { setDraft(lesson); setTab("content"); }, [lesson]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const files = draft.materials ?? [];
  const quiz: Quiz = draft.quiz ?? { enabled: false, passScore: 60, questions: [] };
  const qCount = quiz.questions?.length ?? 0;
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(lesson), [draft, lesson]);
  const prov = detect(draft.url);

  const set = (p: Partial<Lesson>) => setDraft((d) => ({ ...d, ...p }));
  const setQuiz = (p: Partial<Quiz>) => set({ quiz: { ...quiz, ...p } });

  const addLink = () => {
    const t = link.title.trim(), u = link.url.trim();
    if (!t || !u) return;
    set({ materials: [...files, { id: `M-${Date.now().toString(36)}`, title: t, url: u }] });
    setLink({ title: "", url: "" });
  };

  const openPicker = (accept: string) => {
    pending.current = accept;
    if (pick.current) { pick.current.accept = accept; pick.current.value = ""; pick.current.click(); }
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy("upload");
    const url = await uploadImage(f);
    setBusy(null);
    if (!url) return;
    set({ materials: [...files, { id: `M-${Date.now().toString(36)}`, title: f.name, url }] });
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "files", label: "المرفقات", icon: <Paperclip className="size-3.5" />, badge: ar(files.length) },
    { id: "quiz", label: "الواجب", icon: <ClipboardList className="size-3.5" />, badge: qCount ? ar(qCount) : undefined },
    { id: "video", label: "الفيديو", icon: <Video className="size-3.5" />, badge: draft.url.trim() ? "✓" : undefined },
    { id: "content", label: "المحتوى", icon: <FileText className="size-3.5" /> },
  ];

  return (
    <div className="lm-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-label="إدارة الدرس">
      <div className="lm">
        {/* الترويسة — العنوانُ يميناً والإغلاقُ يساراً كما في التصميم */}
        <header className="lm-head">
          <div className="min-w-0">
            <h2 className="lm-title">إدارة الدرس</h2>
            <p className="lm-sub">حرِّر محتوى الدرس وأضِف المرفقات · {courseName} — {unitName}</p>
          </div>
          <button onClick={onClose} className="lm-x" aria-label="إغلاق"><X className="size-4" /></button>
        </header>

        {/* التبويبات */}
        <div className="lm-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "true" : undefined}
              className={`lm-tab ${tab === t.id ? "is-on" : ""}`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.badge && <span className="lm-tab-b">{t.badge}</span>}
            </button>
          ))}
        </div>

        <div className="lm-body">
          {/* ــــــــ المحتوى ــــــــ */}
          {tab === "content" && (
            <div className="lm-stack">
              <label className="lm-f">
                <span className="lm-l">عنوان الدرس</span>
                <input value={draft.title} onChange={(e) => set({ title: e.target.value })} className="lm-i" />
              </label>

              <div className="lm-grid2">
                <label className="lm-f">
                  <span className="lm-l">المدّة</span>
                  <span className="relative block">
                    <Clock className="lm-i-icon" />
                    <input value={draft.duration ?? ""} onChange={(e) => set({ duration: e.target.value || undefined })} className="lm-i lm-i-pad" placeholder="١٢:٤٠" />
                  </span>
                </label>

                <button type="button" onClick={() => set({ isFree: !draft.isFree })} role="switch" aria-checked={Boolean(draft.isFree)} className="lm-toggle">
                  <span className={`lm-sw ${draft.isFree ? "is-on" : ""}`}><span className="lm-sw-k" /></span>
                  <span className="min-w-0 flex-1 text-right">
                    <span className="lm-toggle-t">درسٌ مجّانيّ</span>
                    <span className="lm-toggle-h">يُشاهَد بلا اشتراك — يُجرَّب به الكورسُ قبل الشراء</span>
                  </span>
                  <Gift className={`size-4 shrink-0 ${draft.isFree ? "text-emerald-500" : "text-muted-foreground"}`} />
                </button>
              </div>
            </div>
          )}

          {/* ــــــــ الفيديو ــــــــ */}
          {tab === "video" && (
            <div className="lm-stack">
              <div className={`lm-note ${prov !== "other" || !draft.url.trim() ? "is-ok" : "is-warn"}`}>
                <Video className="size-4 shrink-0" />
                {draft.url.trim()
                  ? prov !== "other" ? `يُشغَّل عبر ${PROV_NAME[prov]}` : "رابطٌ غيرُ معروف — قد لا يُشغَّل عند الطالب"
                  : "لا رابطَ بعد — الدرسُ لن يعمل حتّى يُضاف"}
              </div>

              <label className="lm-f">
                <span className="lm-l">مزوّد الفيديو</span>
                <select className="lm-i" value={prov} disabled>
                  <option value={prov}>{PROV_NAME[prov]}</option>
                </select>
                <span className="lm-h">يُعرف من الرابط تلقائياً — لا يُختار.</span>
              </label>

              <label className="lm-f">
                <span className="lm-l">رابط الفيديو أو معرّفه</span>
                <input value={draft.url} onChange={(e) => set({ url: e.target.value })} dir="ltr" className="lm-i lm-mono" placeholder="https://…" />
              </label>

              {draft.url.trim() && (
                <a href={draft.url} target="_blank" rel="noreferrer" className="lm-ghost w-fit">
                  <ExternalLink className="size-3.5" /> افتح الرابط للتأكّد
                </a>
              )}

              {/*
                حمايةُ المحتوى للمنصّة كلِّها لا لدرسٍ بعينه — فتُعرض حالتُها
                الحقيقيّةُ ويُدلّ على موضع تبديلها، ولا يُرسم مفتاحٌ لا يكتب.
              */}
              <div className="lm-card">
                <p className="lm-card-t"><ShieldCheck className="size-4 text-primary" /> حماية المحتوى</p>
                <div className="lm-row">
                  <span className={`lm-badge ${content.blockCapture ? "is-ok" : "is-off"}`}>
                    <span className="lm-badge-d" />
                    {content.blockCapture ? "مفعَّلة" : "مطفأة"}
                  </span>
                  <p className="lm-card-h">
                    تمنع النسخَ والتقاطَ الشاشة قدرَ الإمكان. وهي إعدادٌ للمنصّة كلِّها لا لهذا الدرس.
                  </p>
                  <Link href="/admin/customize" className="lm-ghost shrink-0">تبديلها</Link>
                </div>
              </div>

              <div className="lm-card">
                <p className="lm-card-t">الصيغُ المقبولة</p>
                <ul className="lm-list">
                  <li>· <b>Bunny Stream</b> — الرابطُ أو «معرّف المكتبة/معرّف الفيديو»</li>
                  <li>· <b>Google Drive</b> — أيُّ صيغةِ رابطٍ للملفّ</li>
                  <li>· <b>YouTube</b> و<b>Vimeo</b> — رابطُ المشاهدة العاديّ</li>
                  <li>· ملفٌّ مباشر — ‎.mp4‎ · ‎.webm‎ · ‎.ogg‎</li>
                </ul>
              </div>
            </div>
          )}

          {/* ــــــــ الواجب ــــــــ */}
          {tab === "quiz" && (
            <QuizTab
              quiz={quiz}
              onChange={setQuiz}
              results={quizResults}
            />
          )}

          {/* ــــــــ المرفقات ــــــــ */}
          {tab === "files" && (
            <div className="lm-stack">
              <div>
                <p className="lm-l">رفع ملفّ</p>
                <div className="lm-kinds">
                  {KINDS.map((k) => (
                    <button key={k.id} type="button" onClick={() => openPicker(k.accept)} disabled={busy === "upload"} className="lm-kind">
                      {busy === "upload" && pending.current === k.accept ? <Loader2 className="size-5 animate-spin" /> : k.icon}
                      <span>{k.label}</span>
                    </button>
                  ))}
                </div>
                <input ref={pick} type="file" hidden onChange={(e) => onFile(e.target.files?.[0])} />
              </div>

              <div className="lm-card">
                <p className="lm-card-t"><Link2 className="size-4 text-primary" /> إضافة رابط خارجيّ</p>
                <div className="lm-grid2">
                  <input value={link.title} onChange={(e) => setLink({ ...link, title: e.target.value })} className="lm-i" placeholder="عنوان الرابط" />
                  <input value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} dir="ltr" className="lm-i" placeholder="https://…" />
                </div>
                <button type="button" onClick={addLink} disabled={!link.title.trim() || !link.url.trim()} className="lm-ghost mt-2.5">
                  <Plus className="size-3.5" /> إضافة الرابط
                </button>
              </div>

              <div>
                <p className="lm-l">المرفقاتُ الحالية</p>
                {files.length === 0 ? (
                  <div className="lm-empty">
                    <span className="lm-empty-i"><Upload className="size-5" /></span>
                    <p className="lm-empty-t">لا مرفقات بعد</p>
                    <p className="lm-empty-h">أضِف ملفّات أو روابط لإثراء الدرس.</p>
                  </div>
                ) : (
                  <ul className="lm-files">
                    {files.map((m: Material) => (
                      <li key={m.id} className="lm-file">
                        <span className="lm-file-i"><FileText className="size-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="lm-file-t">{m.title}</span>
                          <span dir="ltr" className="lm-file-u">{m.url}</span>
                        </span>
                        <a href={m.url} target="_blank" rel="noreferrer" className="lm-mini" title="فتح"><ExternalLink className="size-3.5" /></a>
                        <button onClick={() => set({ materials: files.filter((x) => x.id !== m.id) })} className="lm-mini is-bad" title="حذف"><Trash2 className="size-3.5" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="lm-foot">
          <button onClick={() => onSave(draft)} disabled={!dirty || !draft.title.trim()} className="lm-save">
            <Check className="size-4" /> حفظ التعديلات
          </button>
          <button onClick={onClose} className="lm-ghost">إغلاق</button>
          <span className={`lm-state ${dirty ? "is-dirty" : ""}`}>{dirty ? "فيه تعديلاتٌ لم تُحفظ" : "لا تعديلات"}</span>
        </footer>
      </div>
    </div>
  );
}

/* ================= تبويبُ الواجب ================= */
function QuizTab({
  quiz, onChange, results,
}: {
  quiz: Quiz;
  onChange: (p: Partial<Quiz>) => void;
  results?: { attempts: number; avg: number; passed: number };
}) {
  const [q, setQ] = useState({ text: "", options: ["", "", "", ""], correct: 0 });
  const [editing, setEditing] = useState<string | null>(null);
  const list = quiz.questions ?? [];

  const add = () => {
    const text = q.text.trim();
    const options = q.options.map((o) => o.trim()).filter(Boolean);
    if (!text || options.length < 2) return;
    const item: QuizQuestion = {
      id: `Q-${Date.now().toString(36)}`,
      text,
      options,
      correct: Math.min(q.correct, options.length - 1),
    };
    onChange({ questions: [...list, item], enabled: quiz.enabled });
    setQ({ text: "", options: ["", "", "", ""], correct: 0 });
  };

  return (
    <div className="lm-stack">
      {/* حالُ الواجب — الواجبُ واحدٌ لكلّ درسٍ في هذه القاعدة */}
      <div className="lm-card">
        <div className="lm-row">
          <span className={`lm-badge ${quiz.enabled ? "is-ok" : "is-off"}`}>
            <span className="lm-badge-d" />
            {quiz.enabled ? "منشور" : "مسودّة"}
          </span>
          <p className="lm-card-h">
            {quiz.enabled
              ? "يظهر للطالب بعد الفيديو ويُصحَّح تلقائياً."
              : "لا يراه الطالب. انشره بعد إضافة أسئلته."}
          </p>
          <button type="button" onClick={() => onChange({ enabled: !quiz.enabled })} disabled={!quiz.enabled && list.length === 0} className="lm-ghost shrink-0">
            {quiz.enabled ? "إرجاعه مسودّة" : "نشر الواجب"}
          </button>
        </div>
        {!quiz.enabled && list.length === 0 && (
          <p className="lm-card-h mt-2">أضِف سؤالاً واحداً على الأقلّ قبل النشر.</p>
        )}
      </div>

      <div className="lm-grid2">
        <label className="lm-f">
          <span className="lm-l">نوع الواجب</span>
          <select className="lm-i" disabled>
            <option>اختيار من متعدّد (تصحيحٌ تلقائيّ)</option>
          </select>
          <span className="lm-h">النوعُ الوحيدُ الذي تُصحّحه المنصّةُ تلقائياً.</span>
        </label>
        <label className="lm-f">
          <span className="lm-l">نسبةُ النجاح ٪</span>
          <input
            type="number" min={1} max={100}
            value={quiz.passScore ?? 60}
            onChange={(e) => onChange({ passScore: Math.max(1, Math.min(100, Number(e.target.value) || 60)) })}
            className="lm-i"
          />
        </label>
      </div>

      {/* إنشاءُ سؤال */}
      <div className="lm-card">
        <p className="lm-card-t"><Plus className="size-4 text-primary" /> إضافة سؤال</p>
        <input value={q.text} onChange={(e) => setQ({ ...q, text: e.target.value })} className="lm-i" placeholder="نصّ السؤال" />
        <div className="lm-grid2 mt-2.5">
          {q.options.map((o, i) => (
            <span key={i} className="relative block">
              <input
                value={o}
                onChange={(e) => setQ({ ...q, options: q.options.map((x, k) => (k === i ? e.target.value : x)) })}
                className="lm-i lm-i-pad"
                placeholder={`الخيار ${ar(i + 1)}`}
              />
              {/* الصحيحُ يُؤشَّر في الخيار نفسِه لا في قائمةٍ منفصلة */}
              <button
                type="button"
                onClick={() => setQ({ ...q, correct: i })}
                title="هذا هو الصحيح"
                className={`lm-correct ${q.correct === i ? "is-on" : ""}`}
              >
                <Check className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <button type="button" onClick={add} disabled={!q.text.trim() || q.options.filter((o) => o.trim()).length < 2} className="lm-ghost mt-2.5">
          <Plus className="size-3.5" /> إنشاء السؤال
        </button>
      </div>

      {/* أسئلةُ هذا الدرس */}
      <div>
        <p className="lm-l">أسئلةُ هذا الدرس {list.length > 0 && <span className="text-muted-foreground">({ar(list.length)})</span>}</p>
        {list.length === 0 ? (
          <div className="lm-empty">
            <span className="lm-empty-i"><ClipboardList className="size-5" /></span>
            <p className="lm-empty-t">لا أسئلة بعد</p>
            <p className="lm-empty-h">أضِف سؤالاً من الأعلى ليصير للدرس واجب.</p>
          </div>
        ) : (
          <ul className="lm-files">
            {list.map((item, i) => (
              <li key={item.id} className="lm-q">
                <span className="lm-q-n">{ar(i + 1)}</span>
                <span className="min-w-0 flex-1">
                  {editing === item.id ? (
                    <input
                      autoFocus
                      defaultValue={item.text}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v) onChange({ questions: list.map((x) => (x.id === item.id ? { ...x, text: v } : x)) });
                        setEditing(null);
                      }}
                      className="lm-i"
                    />
                  ) : (
                    <>
                      <span className="lm-file-t">{item.text}</span>
                      <span className="lm-file-u" dir="rtl">
                        {item.options.length.toLocaleString("ar-EG")} خيارات · الصحيح: {item.options[item.correct]}
                      </span>
                    </>
                  )}
                </span>
                <button onClick={() => setEditing(editing === item.id ? null : item.id)} className="lm-mini" title="تعديل"><Pencil className="size-3.5" /></button>
                <button onClick={() => onChange({ questions: list.filter((x) => x.id !== item.id) })} className="lm-mini is-bad" title="حذف"><Trash2 className="size-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {results && results.attempts > 0 && (
        <p className="lm-h">
          حاوله {ar(results.attempts)} طالباً · متوسّط {ar(results.avg)}٪ · نجح {ar(results.passed)}
        </p>
      )}
    </div>
  );
}
