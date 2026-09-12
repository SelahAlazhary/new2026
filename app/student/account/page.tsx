"use client";

/**
 * «حسابي» — بطاقة بيانات الطالب.
 * ------------------------------------------------------------------
 * للعرض فقط. البريد وكلمة المرور لا يغيّرهما الطالب من هنا: بيانات
 * الدخول تُدار مركزياً من لوحة الإدارة، حتى لا تُفقد القدرة على
 * الوصول إلى حساب أو استعادته، وحتى لا يُسرَّب حساب مدفوع بتغيير
 * بريده. كل ما يحتاجه الطالب هو معرفة بياناته وطلب تعديلها من الدعم.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconUsers, IconKey, IconLayers, IconCalendar, IconLifebuoy, IconShield,
} from "@/components/brand/icons";
import { Card, PageHeader, Medallion, GoldRule } from "@/components/dashboard/ui";
import { useContent } from "@/components/content/content-provider";
import { activeSubs, daysLeft } from "@/lib/auth/access";
import { GradeRequestCard } from "@/components/student/grade-request";

const ar = (n: number) => n.toLocaleString("ar-EG");

/** تاريخ مقروء بالعربية. */
function arDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo",  year: "numeric", month: "long", day: "numeric" });
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-3 last:border-0">
      <span className="font-kufi shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-sm font-bold">{value?.trim() ? value : "—"}</span>
    </div>
  );
}

export default function StudentAccount() {
  const { db, session, wa } = useContent();
  const me = db?.users.find((u) => u.id === session?.uid);
  const subjects = db?.subjects ?? [];
  const subs = activeSubs(me);
  const fem = me?.gender === "female";

  return (
    <>
      <PageHeader title="حسابي" subtitle="بياناتك كما هي مسجّلة في المنصّة" />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------- بيانات الحساب ---------- */}
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -40px 0px" }}>
          <Card>
            <div className="mb-3 flex items-center gap-3">
              <Medallion size={44} className="text-primary">
                <IconUsers className="size-5" />
              </Medallion>
              <div className="min-w-0">
                <p className="font-display truncate text-lg font-bold">{me?.name ?? session?.name}</p>
                <p className="font-kufi text-[11px] text-muted-foreground">
                  {fem ? "طالبة" : "طالب"} · انضممت في {arDate(me?.createdAt)}
                </p>
              </div>
            </div>
            <div className="mb-2 max-w-[10rem] text-accent">
              <GoldRule />
            </div>

            <Row label="البريد الإلكتروني" value={me?.username} />
            <Row label="رقم الموبايل" value={me?.phone} />
            <Row label="النظام التعليمي" value={me?.eduSystem} />
            <Row label="المرحلة الدراسية" value={me?.stage} />
            <Row label="الصف الدراسي" value={me?.grade} />
            {me?.track && <Row label="الشعبة" value={me.track} />}
            {me?.branch && <Row label="فرع الشعبة" value={me.branch} />}
            <Row label="المدرسة" value={me?.school} />
            <Row label="المحافظة" value={me?.governorate} />
          </Card>
        </motion.div>

        <div className="grid content-start gap-4">
          {/* ---------- بيانات الدخول ---------- */}
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -40px 0px" }} transition={{ delay: 0.06 }}>
            <Card>
              <div className="flex items-start gap-3">
                <Medallion size={44} className="text-accent">
                  <IconKey className="size-5" />
                </Medallion>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-bold">بيانات الدخول</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    البريد وكلمة المرور تُغيَّر من إدارة المنصّة وحدها — حمايةً لحسابك من أن
                    يُنقل بريده أو تُغيَّر كلمته دون علمك. لتغيير أيّهما تواصل مع الدعم.
                  </p>
                  <div className="mt-3 rounded-2xl bg-muted/60 px-3 py-2.5">
                    <p className="font-kufi text-[10px] text-muted-foreground">البريد الحالي</p>
                    <p dir="ltr" className="mt-0.5 truncate text-right text-sm font-bold">{me?.username ?? "—"}</p>
                  </div>
                  <div className="mt-2 rounded-2xl bg-muted/60 px-3 py-2.5">
                    <p className="font-kufi text-[10px] text-muted-foreground">كلمة المرور</p>
                    <p dir="ltr" className="mt-0.5 text-right text-sm font-bold tracking-[0.3em]">••••••••</p>
                  </div>
                  <a
                    href={wa("أرغب في تغيير بيانات الدخول الخاصة بحسابي")}
                    className="btn-foil mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition hover:text-primary"
                  >
                    <IconLifebuoy className="size-4" /> اطلب التغيير من الدعم
                  </a>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ---------- الجهاز المربوط ---------- */}
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -40px 0px" }} transition={{ delay: 0.12 }}>
            <Card className="flex items-start gap-3">
              <Medallion size={44} className="text-primary">
                <IconShield className="size-5" />
              </Medallion>
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-bold">الجهاز المربوط</h3>
                <p className="mt-1 truncate text-sm font-bold">{me?.deviceLabel ?? "بانتظار أول جهاز"}</p>
                <p className="font-kufi mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  حسابك مرتبط بجهاز واحد لضمان تجربة عادلة. لتغييره تواصل مع الدعم.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ---------- الاشتراكات ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="lg:col-span-2"
        >
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <Medallion size={44} className="text-accent">
                <IconLayers className="size-5" />
              </Medallion>
              <h3 className="font-display font-bold">اشتراكاتك</h3>
            </div>

            {subs.length === 0 ? (
              <div className="rounded-2xl bg-muted/60 px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">لا يوجد اشتراك ساري على حسابك.</p>
                <Link
                  href="/student/subjects"
                  className="btn-glow mt-3 inline-block rounded-full px-6 py-2.5 text-xs font-bold text-white"
                >
                  تصفّح الكورسات
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {subs.map((sb) => {
                  const left = daysLeft(sb.expiresAt);
                  const all = sb.subjectId === "*";
                  const soon = left !== null && left <= 7;
                  return (
                    <div key={sb.id} className="rounded-2xl border border-border p-4">
                      <p className="truncate font-bold">
                        {sb.planName ?? (all ? "الترم الكامل" : "اشتراك كورس")}
                      </p>
                      <p className="font-kufi mt-0.5 truncate text-[11px] text-muted-foreground">
                        {all ? "كل المواد المتاحة لصفّك" : subjects.find((s) => s.id === sb.subjectId)?.name ?? "كورس"}
                      </p>
                      <span
                        className={`font-kufi mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          soon ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/14 text-emerald-600"
                        }`}
                      >
                        <IconCalendar className="size-3" />
                        {left !== null ? `متبقٍ ${ar(left)} يوم` : "بلا انتهاء"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/*
            طلبُ نقل المرحلة تحت الاشتراكات لا فوق البيانات.
            صفحةُ الحساب تُقرأ من أعلى: من هو، ثمّ ماذا يملك، ثمّ ما يمكنه
            أن يطلب. والطلبُ في الأعلى يزاحم ما جاء الطالبُ يراه.
          */}
          <div className="mt-6">
            <GradeRequestCard />
          </div>
        </motion.div>
      </div>
    </>
  );
}
