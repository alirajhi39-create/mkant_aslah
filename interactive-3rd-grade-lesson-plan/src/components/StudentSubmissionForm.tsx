import { useEffect, useMemo, useState } from "react";
import {
  STUDENT_SECTIONS,
  TASK_KEYS,
  TASKS,
  completedCount,
  encodeSubmission,
  formatLastActive,
  formatScore,
  stationScore,
  totalScore,
  STATIONS_MAX,
  TOTAL_MAX,
  type Student,
  type StudentSection,
} from "../classroom";
import { Button, Icon, ProgressRing, Reveal, cn } from "./ui";

const ar = (value: number) => value.toLocaleString("ar-EG");

const isPlaceholderName = (name: string) =>
  name.trim().length === 0 || name === "طالب الصف الثالث" || name === "طالب اجتهاد" || name === "طالب مجتهد";

export function StudentSubmissionForm({
  student,
  progress,
  onOpenCertificate,
  onSubmit,
  onRestart,
  cloudStatus,
  cloudError,
  classCode,
}: {
  student: Student;
  progress: number;
  onOpenCertificate: () => void;
  onSubmit: (name: string, section: Exclude<StudentSection, "">) => void;
  onRestart: () => void;
  cloudStatus: "checking" | "ready" | "local" | "error";
  cloudError: string | null;
  classCode: string;
}) {
  const initialName = isPlaceholderName(student.name) ? "" : student.name;
  const [name, setName] = useState(initialName);
  const [section, setSection] = useState<StudentSection>(student.section);
  const [editing, setEditing] = useState(!student.submittedAt);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setName(isPlaceholderName(student.name) ? "" : student.name);
    setSection(student.section);
    setEditing(!student.submittedAt);
    setError(null);
    setJustSubmitted(false);
    setCopied(false);
    setLinkCopied(false);
  }, [student.id]);

  const attempts = useMemo(
    () => TASK_KEYS.reduce((sum, key) => sum + student.results[key].correct + student.results[key].incorrect, 0),
    [student.results],
  );

  const canSubmit = name.trim().length >= 3 && Boolean(section);

  const submit = () => {
    const cleanName = name.trim();
    if (cleanName.length < 3) {
      setError("اكتب اسمك كاملًا (٣ أحرف على الأقل).");
      return;
    }
    if (!section) {
      setError("اختر صفّك: ٣/١ أو ٣/٢.");
      return;
    }
    onSubmit(cleanName, section as Exclude<StudentSection, "">);
    setError(null);
    setEditing(false);
    setJustSubmitted(true);
  };

  const copySummary = async () => {
    const summary = [
      "تسليم درس مكانة الصلاة",
      `الطالب: ${student.name}`,
      `الصف: ${student.section || "—"}`,
      `الإنجاز: ${ar(progress)}٪ (${ar(completedCount(student))} من ٤ محطات)`,
      `درجة التقويم: ${ar(student.evaluationScore)} من ٣`,
      `وقت التسليم: ${formatLastActive(student.submittedAt ?? new Date().toISOString())}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("تعذّر نسخ البيانات في هذا المتصفح.");
    }
  };

  const isSubmitted = Boolean(student.submittedAt) && !editing;
  const submissionLink = useMemo(() => {
    const code = encodeSubmission(student);
    if (typeof window === "undefined") return `?submission=${code}`;
    return `${window.location.origin}${window.location.pathname}?submission=${code}`;
  }, [student]);

  const copySubmissionLink = async () => {
    try {
      await navigator.clipboard.writeText(submissionLink);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2600);
    } catch {
      setError("تعذّر نسخ الرابط؛ يمكنك تحديده ونسخه يدويًا.");
    }
  };

  return (
    <section
      id="submit"
      aria-labelledby="submission-title"
      className="no-print relative overflow-hidden py-12"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-100/50 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-sand-200/60 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border border-brand-100 bg-white shadow-card">
            <div className="relative overflow-hidden bg-gradient-to-l from-brand-800 via-brand-700 to-brand-600 px-5 py-5 text-white sm:px-7 sm:py-6">
              <div className="pattern-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
              <Icon name="send" className="pointer-events-none absolute -bottom-3 left-4 h-28 w-28 text-white/[0.07]" />
              <div className="relative flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold-400 text-brand-900 shadow-lg">
                    <Icon name="send" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-gold-400">الخطوة الأخيرة</p>
                    <h2 id="submission-title" className="font-display text-lg font-extrabold sm:text-xl">
                      {isSubmitted ? "تم إرسال بطاقتك إلى المعلم" : "سجّل اسمك وأرسل إنجازك للمعلم"}
                    </h2>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-brand-100">
                  <Icon name="lock" className="h-3 w-3 text-gold-400" />
                  يظهر التسليم في لوحة المعلم
                </span>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
              {/* Summary */}
              <div className="relative border-b border-brand-100 bg-sand-50/70 p-5 sm:p-6 lg:border-b-0 lg:border-l">
                <div className="flex items-center gap-3">
                  <ProgressRing value={progress} size={58} stroke={5} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted">ملخص إنجازك في الدرس</p>
                    <p className="font-display text-base font-extrabold text-brand-900">
                      {ar(completedCount(student))} من ٤ محطات
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-brand-600">
                      درجة التقويم {ar(student.evaluationScore)} من ٣
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-gold-400/50 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-extrabold text-gold-600">الدرجة الكلية</p>
                    <p className="whitespace-nowrap font-display text-lg font-extrabold leading-none text-brand-900" dir="ltr">
                      {formatScore(totalScore(student))}
                      <span className="mx-0.5 text-[11px] font-bold text-muted">/</span>
                      {formatScore(TOTAL_MAX)}
                    </p>
                  </div>
                  <p className="mt-1.5 text-[9px] font-bold text-muted">
                    المحطات <span dir="ltr">{formatScore(stationScore(student))} / {formatScore(STATIONS_MAX)}</span> (نصف درجة
                    لكل محطة) + التقويم <span dir="ltr">{ar(student.evaluationScore)} / ٣</span>
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {TASKS.map((task) => (
                    <div
                      key={task.key}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-2 py-1.5",
                        student.completed[task.key]
                          ? "border-brand-200 bg-brand-50 text-brand-800"
                          : "border-brand-100 bg-white text-muted",
                      )}
                    >
                      <Icon
                        name={student.completed[task.key] ? "check" : "lock"}
                        className="h-3 w-3 shrink-0 text-brand-500"
                      />
                      <span className="truncate text-[9px] font-bold">{task.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-brand-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="font-medium text-muted">عدد المحاولات</span>
                    <span className="font-extrabold text-brand-800">{ar(attempts)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px]">
                    <span className="font-medium text-muted">الإجابات الصحيحة</span>
                    <span className="font-extrabold text-brand-700">
                      {ar(TASK_KEYS.reduce((sum, key) => sum + student.results[key].correct, 0))}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px]">
                    <span className="font-medium text-muted">الأخطاء</span>
                    <span className="font-extrabold text-clay-600">
                      {ar(TASK_KEYS.reduce((sum, key) => sum + student.results[key].incorrect, 0))}
                    </span>
                  </div>
                </div>

                <p className="mt-4 flex items-start gap-1.5 text-[9px] leading-5 text-muted">
                  <Icon name="bulb" className="mt-0.5 h-3 w-3 shrink-0 text-gold-500" />
                  يمكنك إرسال بطاقتك في أي وقت، ويفضّل إكمال المحطات الأربع أولًا.
                </p>
              </div>

              {/* Form / success */}
              <div className="p-5 sm:p-6">
                {isSubmitted ? (
                  <div key="submitted" className="animate-pop">
                    <div className="flex flex-col items-center text-center">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-lg">
                        <Icon name="check" className="h-7 w-7" />
                      </span>
                      <h3 className="mt-3 font-display text-lg font-extrabold text-brand-900">وصل تسليمك إلى المعلم</h3>
                      <p className="mt-1 max-w-sm text-[11px] leading-6 text-muted">
                        سجّلنا اسمك وصفّك مع ملخص إنجازك، ويستطيع المعلم رؤيته في لوحة المعلم على هذا الجهاز.
                      </p>
                    </div>

                    <dl className="mt-4 space-y-2 rounded-2xl border border-brand-100 bg-sand-50 p-3.5">
                      {[
                        { label: "اسم الطالب", value: student.name },
                        { label: "الصف", value: student.section || "—" },
                        { label: "المحطات المكتملة", value: `${ar(completedCount(student))} من ٤` },
                        { label: "درجة التقويم", value: `${ar(student.evaluationScore)} من ٣` },
                        {
                          label: "الدرجة الكلية",
                          value: `${formatScore(totalScore(student))} / ${formatScore(TOTAL_MAX)}`,
                        },
                        { label: "وقت التسليم", value: formatLastActive(student.submittedAt ?? new Date().toISOString()) },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-3 border-b border-dashed border-brand-100 pb-2 last:border-0 last:pb-0">
                          <dt className="text-[10px] font-medium text-muted">{item.label}</dt>
                          <dd className="text-[11px] font-extrabold text-brand-900">{item.value}</dd>
                        </div>
                      ))}
                    </dl>

                    {justSubmitted && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 p-2.5 text-[10px] font-bold leading-5 text-brand-800">
                        <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                        تم تسجيل التسليم بنجاح. شكرًا لك، وبالتوفيق في درسك القادم.
                      </div>
                    )}

                    <div
                      className={cn(
                        "mt-3 flex items-start gap-2 rounded-xl border p-2.5 text-[10px] font-bold leading-5",
                        cloudStatus === "ready"
                          ? "border-brand-200 bg-brand-50 text-brand-800"
                          : cloudStatus === "error"
                            ? "border-clay-400/40 bg-orange-50 text-clay-600"
                            : "border-sand-300 bg-sand-100 text-gold-600",
                      )}
                    >
                      <Icon
                        name={cloudStatus === "ready" ? "check" : cloudStatus === "error" ? "close" : "bulb"}
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      />
                      <span>
                        {cloudStatus === "ready"
                          ? `تم حفظ إنجازك تلقائيًا في سجل الصف المشترك (${classCode})، ويراه المعلم في لوحته.`
                          : cloudStatus === "checking"
                            ? "جارٍ التحقق من سجل الصف المشترك..."
                            : cloudStatus === "error"
                              ? `تعذّر الحفظ في السجل المشترك (${cloudError ?? "خطأ"}). بياناتك محفوظة على هذا الجهاز، وأعد المحاولة عند توفر الإنترنت.`
                              : "السجل المشترك غير مفعّل على هذا النشر؛ بياناتك محفوظة على هذا الجهاز. اطلب من المعلم تفعيل الربط السحابي."}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-gold-400/40 bg-sand-100/70 p-3">
                      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold text-gold-600">
                        <Icon name="send" className="h-3.5 w-3.5" />
                        رابط تسليم المعلم على أي جهاز
                      </p>
                      <p className="mb-2 text-[9px] leading-5 text-muted">
                        انسخ الرابط وأرسله للمعلم. يفتح المعلم الرابط، يدخل كلمة السر، فيُضاف عملك إلى سجلّ الصف.
                      </p>
                      <div className="flex items-center gap-1.5">
                        <input
                          readOnly
                          value={submissionLink}
                          aria-label="رابط تسليم العمل للمعلم"
                          dir="ltr"
                          onFocus={(event) => event.currentTarget.select()}
                          className="min-w-0 flex-1 truncate rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-[9px] font-medium text-muted outline-none"
                        />
                        <Button size="sm" variant={linkCopied ? "secondary" : "primary"} icon={linkCopied ? "check" : "send"} onClick={copySubmissionLink} className="shrink-0">
                          {linkCopied ? "نُسخ" : "نسخ"}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                      <Button variant="secondary" size="sm" icon={copied ? "check" : "pen"} onClick={copySummary}>
                        {copied ? "نُسخت البيانات" : "نسخ بيانات التسليم"}
                      </Button>
                      <Button variant="outline" size="sm" icon="trophy" onClick={onOpenCertificate}>
                        بطاقة إنجازي
                      </Button>
                    </div>

                    <Button icon="refresh" className="mt-2.5 w-full" onClick={onRestart}>
                      بدء الدرس من جديد لطالب آخر
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(true);
                        setJustSubmitted(false);
                      }}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-bold text-brand-600 transition hover:bg-brand-50"
                    >
                      <Icon name="refresh" className="h-3.5 w-3.5" />
                      تعديل الاسم أو الصف وإعادة الإرسال
                    </button>
                  </div>
                ) : (
                  <form
                    className="animate-pop"
                    onSubmit={(event) => {
                      event.preventDefault();
                      submit();
                    }}
                  >
                    <div className="mb-4">
                      <h3 className="font-display text-base font-extrabold text-brand-900">بيانات الطالب</h3>
                      <p className="mt-0.5 text-[10px] font-medium leading-5 text-muted">
                        اكتب اسمك كاملًا، واختر الصف، ثم اضغط «إرسال إلى المعلم».
                      </p>
                    </div>

                    <label htmlFor="student-full-name" className="mb-1.5 block text-[11px] font-extrabold text-brand-800">
                      الاسم الكامل
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-brand-50 text-brand-500">
                        <Icon name="pen" className="h-3 w-3" />
                      </span>
                      <input
                        id="student-full-name"
                        value={name}
                        onChange={(event) => {
                          setName(event.target.value);
                          setError(null);
                        }}
                        maxLength={40}
                        autoComplete="name"
                        placeholder="مثال: عبدالله محمد الغامدي"
                        className={cn(
                          "w-full rounded-xl border bg-white py-2.5 pe-3 ps-11 text-sm font-bold text-ink outline-none transition placeholder:text-xs placeholder:font-medium placeholder:text-muted/60 focus:ring-4 focus:ring-brand-500/10",
                          error && name.trim().length < 3 ? "border-clay-400" : "border-brand-200 focus:border-brand-500",
                        )}
                      />
                    </div>

                    <fieldset className="mt-4">
                      <legend className="mb-1.5 text-[11px] font-extrabold text-brand-800">الصف</legend>
                      <div className="grid grid-cols-2 gap-2">
                        {STUDENT_SECTIONS.map((option) => {
                          const selected = section === option;
                          return (
                            <label
                              key={option}
                              className={cn(
                                "flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition-all",
                                selected
                                  ? "border-brand-600 bg-brand-50 shadow-[0_6px_18px_-12px_rgba(15,116,107,0.7)]"
                                  : "border-brand-100 bg-white hover:border-brand-300 hover:bg-sand-50",
                              )}
                            >
                              <input
                                type="radio"
                                name="student-section"
                                value={option}
                                checked={selected}
                                onChange={() => {
                                  setSection(option);
                                  setError(null);
                                }}
                                className="sr-only"
                              />
                              <span
                                className={cn(
                                  "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-extrabold",
                                  selected ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-600",
                                )}
                              >
                                ٣
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[9px] font-medium text-muted">الصف الثالث</span>
                                <span className="block font-display text-sm font-extrabold text-brand-900">
                                  {option.replace("٣/", "شعبة ")}
                                </span>
                              </span>
                              <span
                                className={cn(
                                  "ms-auto grid h-4 w-4 shrink-0 place-items-center rounded-full border-2",
                                  selected ? "border-brand-600 bg-brand-600 text-white" : "border-brand-200",
                                )}
                              >
                                {selected && <Icon name="check" className="h-2.5 w-2.5" />}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>

                    {error && (
                      <p role="alert" className="mt-3 flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1.5 text-[10px] font-bold text-clay-600">
                        <Icon name="close" className="h-3 w-3" />
                        {error}
                      </p>
                    )}

                    <Button type="submit" icon="send" size="md" disabled={!canSubmit} className="mt-4 w-full">
                      إرسال إلى المعلم
                    </Button>

                    <p className="mt-2 flex items-center justify-center gap-1 text-[9px] font-medium text-muted">
                      <Icon name="lock" className="h-3 w-3" />
                      يُحفظ التسليم على هذا الجهاز ويظهر داخل لوحة المعلم.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
