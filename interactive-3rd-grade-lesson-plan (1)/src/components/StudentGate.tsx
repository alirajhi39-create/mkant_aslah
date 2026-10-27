import { useEffect, useMemo, useRef, useState } from "react";
import {
  STUDENT_SECTIONS,
  TEACHER_PASSWORD,
  TEACHER_UNLOCK_KEY,
  completionPercent,
  completedCount,
  formatLastActive,
  type SharedSubmission,
  type Student,
  type StudentSection,
} from "../classroom";
import { lesson, teacher } from "../content";
import { Arabesque, Button, Icon, ProgressRing, StarBurst, cn } from "./ui";

const ar = (value: number) => value.toLocaleString("ar-EG");
const isPlaceholderName = (name: string) =>
  name === "طالب الصف الثالث" || name === "طالب مجتهد" || name === "طالب اجتهاد" || !name.trim();

const classShort = (section: StudentSection) => (section ? section : "غير محدّد");

export function StudentGate({
  students,
  activeId,
  onStartNew,
  onContinue,
  onOpenTeacher,
  onClose,
}: {
  students: Student[];
  activeId: string;
  onStartNew: (name: string, section: Exclude<StudentSection, "">) => void;
  onContinue: (studentId: string) => void;
  onOpenTeacher: () => void;
  onClose?: () => void;
}) {
  const [name, setName] = useState("");
  const [section, setSection] = useState<StudentSection>("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"new" | "previous">("new");

  const realStudents = useMemo(
    () => students.filter((student) => !isPlaceholderName(student.name) && !student.demo),
    [students],
  );

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const start = () => {
    if (name.trim().length < 3) {
      setError("اكتب اسمك الثلاثي أو اسمك واسم العائلة (٣ أحرف على الأقل).");
      return;
    }
    if (!section) {
      setError("اختر صفّك: ٣/١ أو ٣/٢.");
      return;
    }
    setError(null);
    onStartNew(name.trim(), section as Exclude<StudentSection, "">);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
      dir="rtl"
      className="fixed inset-0 z-[65] overflow-y-auto bg-brand-900"
    >
      <div className="pointer-events-none fixed inset-0 opacity-30" aria-hidden="true">
        <div className="pattern-grid absolute inset-0" />
        <div className="absolute -right-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl" />
        <Arabesque className="absolute -bottom-14 left-10 h-80 w-80 text-white/[0.06]" />
      </div>

      <div className="relative mx-auto flex min-h-full max-w-[1120px] items-center px-3 py-6 sm:px-6 sm:py-10">
        <div className="grid w-full overflow-hidden rounded-[30px] bg-sand-50 shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
          {/* Intro */}
          <div className="relative order-2 overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 p-5 text-white sm:p-8 lg:order-1">
            <div className="pattern-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
            <StarBurst className="absolute -left-8 -top-10 h-40 w-40 text-white/[0.07]" />
            <div className="relative">
              <div className="mb-3 flex items-center gap-3 sm:mb-5">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold-400 text-brand-900 shadow-lg sm:h-12 sm:w-12">
                  <Icon name="mosque" className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.16em] text-gold-400">{lesson.number}</p>
                  <h1 id="gate-title" className="font-display text-lg font-extrabold sm:text-xl">
                    {lesson.title}
                  </h1>
                </div>
              </div>

              <p className="font-serif text-lg leading-[1.8] text-white sm:text-2xl sm:leading-[1.9]">
                «الصلاةُ أفضلُ الأعمالِ وأعظمُ أركانِ الإسلامِ بعدَ الشهادتين»
              </p>
              <p className="mt-2 text-[11px] leading-6 text-brand-100/85">
                {lesson.subject} · {lesson.grade} · {lesson.audience}
              </p>

              <div className="mt-5 hidden space-y-2 sm:block">
                {[
                  { icon: "pen" as const, title: "اكتب اسمك وصفّك", note: "٣/١ أو ٣/٢" },
                  { icon: "book" as const, title: "أكمل المحطات الأربع", note: "قراءة، نشاط، مكانة، تقويم" },
                  { icon: "send" as const, title: "أرسل عملك للمعلم", note: "يظهر في سجل لوحة المعلم" },
                ].map((step, index) => (
                  <div key={step.title} className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15 text-[10px] font-extrabold text-gold-400">
                      {index + 1}
                    </span>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-brand-100">
                      <Icon name={step.icon} className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold">{step.title}</p>
                      <p className="text-[9px] font-medium text-brand-100/70">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col items-start gap-2">
                <button
                  type="button"
                  onClick={onOpenTeacher}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-brand-100 transition hover:border-gold-400/50 hover:bg-white/10"
                >
                  <Icon name="lock" className="h-3 w-3 text-gold-400" />
                  دخول المعلم · كلمة السر مطلوبة
                </button>

                <div className="flex w-full max-w-[230px] min-w-0 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-2.5 py-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gold-400 font-display text-[10px] font-extrabold text-brand-900">
                    {teacher.name.trim().split(/\s+/).slice(0, 2).map((word) => word.charAt(0)).join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 truncate text-[10px] font-extrabold text-white" title={`${teacher.role}: ${teacher.name}`}>
                      <Icon name="pen" className="h-2.5 w-2.5 shrink-0 text-gold-400" />
                      {teacher.name}
                    </p>
                    <p className="flex items-center gap-1 truncate text-[9px] font-medium text-brand-100/80" title={teacher.school}>
                      <Icon name="mosque" className="h-2.5 w-2.5 shrink-0 text-gold-400" />
                      {teacher.school}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="order-1 p-5 sm:p-8 lg:order-2">
            <div className="mb-5 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold tracking-wider text-brand-500">بداية الدرس</p>
                <h2 className="mt-0.5 font-display text-xl font-extrabold text-brand-900">من يدرس الآن؟</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name="users" className="h-5 w-5" />
                </span>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="العودة إلى درس الطالب الحالي"
                    title="العودة إلى الدرس"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-brand-100 bg-white text-brand-600 transition hover:bg-brand-50"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {realStudents.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-brand-50 p-1">
                <button
                  type="button"
                  onClick={() => setTab("new")}
                  aria-pressed={tab === "new"}
                  className={cn(
                    "rounded-lg px-2 py-1.5 text-[11px] font-extrabold transition",
                    tab === "new" ? "bg-white text-brand-800 shadow-sm" : "text-brand-500 hover:text-brand-700",
                  )}
                >
                  طالب جديد
                </button>
                <button
                  type="button"
                  onClick={() => setTab("previous")}
                  aria-pressed={tab === "previous"}
                  className={cn(
                    "rounded-lg px-2 py-1.5 text-[11px] font-extrabold transition",
                    tab === "previous" ? "bg-white text-brand-800 shadow-sm" : "text-brand-500 hover:text-brand-700",
                  )}
                >
                  متابعة طالب ({ar(realStudents.length)})
                </button>
              </div>
            )}

            {tab === "new" || realStudents.length === 0 ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  start();
                }}
              >
                <label htmlFor="gate-name" className="mb-1.5 block text-[11px] font-extrabold text-brand-800">
                  اسم الطالب
                </label>
                <input
                  id="gate-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError(null);
                  }}
                  maxLength={40}
                  autoComplete="name"
                  placeholder="مثال: عبدالله محمد الغامدي"
                  className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm font-bold text-ink outline-none transition placeholder:text-xs placeholder:font-medium placeholder:text-muted/60 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />

                <fieldset className="mt-4">
                  <legend className="mb-1.5 text-[11px] font-extrabold text-brand-800">الصف</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {STUDENT_SECTIONS.map((option) => {
                      const selected = section === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setSection(option);
                            setError(null);
                          }}
                          aria-pressed={selected}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border p-2.5 text-right transition-all",
                            selected
                              ? "border-brand-600 bg-brand-50"
                              : "border-brand-100 bg-white hover:border-brand-300 hover:bg-sand-50",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-[11px] font-extrabold",
                              selected ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-600",
                            )}
                          >
                            ٣
                          </span>
                          <span>
                            <span className="block text-[9px] font-medium text-muted">الصف الثالث</span>
                            <span className="block font-display text-sm font-extrabold text-brand-900">
                              {option.replace("٣/", "شعبة ")}
                            </span>
                          </span>
                          {selected && <Icon name="check" className="ms-auto h-4 w-4 text-brand-600" />}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {error && (
                  <p role="alert" className="mt-3 flex items-start gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1.5 text-[10px] font-bold leading-5 text-clay-600">
                    <Icon name="close" className="mt-0.5 h-3 w-3 shrink-0" />
                    {error}
                  </p>
                )}

                <Button type="submit" size="md" icon="compass" className="mt-4 w-full">
                  ابدأ الدرس
                </Button>

                <p className="mt-2 text-center text-[9px] leading-5 text-muted">
                  يُحفظ تقدّمك باسمك وصفّك، ويظهر عملك في سجلّ المعلم عند الإرسال.
                </p>
              </form>
            ) : (
              <div>
                <p className="mb-2 text-[10px] leading-5 text-muted">
                  اختر اسمك لمتابعة درسك من حيث توقفت، أو ارجع إلى «طالب جديد».
                </p>
                <ul className="hide-scrollbar max-h-[290px] space-y-2 overflow-y-auto pe-0.5">
                  {realStudents.map((student, index) => {
                    const active = student.id === activeId;
                    return (
                      <li key={student.id}>
                        <button
                          type="button"
                          onClick={() => onContinue(student.id)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-right transition-all hover:-translate-y-0.5 hover:shadow-sm",
                            active ? "border-gold-400/60 bg-sand-100/70" : "border-brand-100 bg-white hover:border-brand-300",
                          )}
                        >
                          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full text-[10px] font-extrabold", index % 3 === 0 ? "bg-brand-700 text-sand-50" : index % 3 === 1 ? "bg-gold-400 text-brand-900" : "bg-brand-400 text-white")}>
                            {student.name.trim().split(/\s+/).slice(0, 2).map((word) => word.charAt(0)).join("")}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-extrabold text-brand-900">{student.name}</span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-1 text-[9px] font-medium text-muted">
                              <span className="rounded-full bg-brand-50 px-1.5 py-0.5 font-bold text-brand-600">{classShort(student.section)}</span>
                              <span>{ar(completedCount(student))} من ٤ محطات</span>
                              {student.submittedAt && <span className="font-bold text-gold-600">· سلّم للمعلم</span>}
                            </span>
                          </span>
                          <ProgressRing value={completionPercent(student)} size={34} stroke={3.5} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SubmissionImport({
  shared,
  onImport,
  onOpenTeacher,
  onDismiss,
}: {
  shared: SharedSubmission;
  onImport: () => void;
  onOpenTeacher: () => void;
  onDismiss: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 250);
    return () => window.clearTimeout(timer);
  }, []);

  const receive = () => {
    if (code !== TEACHER_PASSWORD) {
      setError("كلمة سر المعلم غير صحيحة.");
      setCode("");
      return;
    }
    try {
      window.sessionStorage.setItem(TEACHER_UNLOCK_KEY, "1");
    } catch {
      /* الجلسة غير متاحة */
    }
    setError(null);
    setDone(true);
    onImport();
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="import-title" dir="rtl" className="fixed inset-0 z-[68] overflow-y-auto bg-brand-900 p-3 sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true">
        <div className="pattern-grid absolute inset-0" />
        <div className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-full max-w-lg items-center">
        <div className="animate-pop w-full overflow-hidden rounded-[26px] bg-sand-50 shadow-2xl">
          <div className="relative overflow-hidden bg-gradient-to-l from-brand-800 to-brand-600 p-5 text-center text-white">
            <div className="pattern-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
            <span className="relative mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-gold-400 text-brand-900">
              <Icon name={done ? "check" : "send"} className="h-6 w-6" />
            </span>
            <h1 id="import-title" className="relative font-display text-lg font-extrabold">
              {done ? "أُضيف عمل الطالب إلى سجلّك" : "وصل عمل طالب جديد"}
            </h1>
            <p className="relative mt-1 text-[10px] text-brand-100/80">
              {done ? "يمكنك مراجعته الآن في لوحة المعلم." : "أدخل كلمة سر المعلم لقبول التسليم في سجلّ الصف."}
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-700 font-display text-sm font-extrabold text-white">
                {shared.name.trim().slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-brand-900">{shared.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-muted">
                  <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-brand-700">الصف {shared.section}</span>
                  <span>·</span>
                  <span>{formatLastActive(shared.submittedAt)}</span>
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "نسبة الإنجاز", value: `${ar(shared.percent)}٪` },
                { label: "المحطات", value: `${ar(shared.completed.length)} من ٤` },
                { label: "درجة التقويم", value: `${ar(shared.evaluationScore)} من ٣` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-brand-100 bg-white p-2.5 text-center">
                  <p className="font-display text-sm font-extrabold text-brand-800">{item.value}</p>
                  <p className="mt-0.5 text-[9px] font-medium text-muted">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {[
                { key: "read", label: "أقرأ وأجيب" },
                { key: "activity", label: "نشاط الحديث" },
                { key: "status", label: "مكانة الصلاة" },
                { key: "evaluation", label: "التقويم" },
              ].map((task) => {
                const doneTask = shared.completed.includes(task.key as never);
                return (
                  <span
                    key={task.key}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold",
                      doneTask ? "bg-brand-50 text-brand-700" : "bg-sand-100 text-muted",
                    )}
                  >
                    <Icon name={doneTask ? "check" : "lock"} className="h-2.5 w-2.5" />
                    {task.label}
                  </span>
                );
              })}
            </div>

            {!done ? (
              <>
                <label htmlFor="import-code" className="mt-4 block text-[11px] font-extrabold text-brand-900">
                  كلمة سر المعلم
                </label>
                <input
                  ref={inputRef}
                  id="import-code"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6));
                    setError(null);
                  }}
                  placeholder="••••••"
                  dir="ltr"
                  className="mt-1.5 w-full rounded-xl border-2 border-brand-200 bg-white py-2.5 text-center font-display text-lg font-extrabold tracking-[0.4em] text-brand-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />
                {error && (
                  <p role="alert" className="mt-2 flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1.5 text-[10px] font-bold text-clay-600">
                    <Icon name="close" className="h-3 w-3" />
                    {error}
                  </p>
                )}
                <Button icon="check" className="mt-3 w-full" onClick={receive}>
                  استلام العمل وإضافته للسجل
                </Button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="mt-2 w-full rounded-lg py-1.5 text-[10px] font-bold text-muted transition hover:bg-sand-100"
                >
                  تجاهل هذا التسليم ومتابعة الدرس
                </button>
              </>
            ) : (
              <Button icon="users" className="mt-3 w-full" onClick={onOpenTeacher}>
                فتح لوحة المعلم ومراجعة السجل
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
