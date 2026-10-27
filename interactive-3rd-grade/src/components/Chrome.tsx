import { useEffect, useState } from "react";
import { lesson, navItems, references, type SectionId } from "../content";
import { formatScore, stationScore, TOTAL_MAX, type Student } from "../classroom";
import { Arabesque, Button, Confetti, Icon, ProgressRing, StarBurst, cn, type IconName } from "./ui";

const navIcons: Record<SectionId, IconName> = {
  overview: "compass",
  read: "book",
  activity: "spark",
  status: "star",
  evaluation: "check",
};

export function Header({
  active,
  progress,
  completedCount,
  total,
  studentName,
  studentSection,
  onOpenCertificate,
  onOpenTeacher,
  onNewLesson,
}: {
  active: SectionId;
  progress: number;
  completedCount: number;
  total: number;
  studentName: string;
  studentSection: string;
  onOpenCertificate: () => void;
  onOpenTeacher: () => void;
  onNewLesson: () => void;
}) {
  return (
    <>
      <div className="no-print h-1.5 w-full bg-gradient-to-l from-gold-400 via-brand-400 to-brand-700" />
      <header className="no-print sticky top-0 z-40 border-b border-brand-900/10 bg-sand-50/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-2.5 sm:h-16 sm:gap-4 sm:px-6 lg:h-[76px] lg:px-8">
          <a href="#overview" className="group flex min-w-0 items-center gap-3">
            <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-700 text-sand-50 shadow-[0_10px_24px_-12px_rgba(14,93,87,0.9)] sm:h-12 sm:w-12 sm:rounded-2xl">
              <Arabesque className="absolute -bottom-4 -left-4 h-16 w-16 text-white/10" />
              <Icon name="mosque" className="relative h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.5} />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-[13px] font-extrabold leading-tight text-brand-900 sm:text-lg">
                {lesson.title}
              </span>
              <span className="hidden truncate text-[10px] font-medium text-muted min-[380px]:block sm:text-[11px]">
                {lesson.subject} · {lesson.grade}
              </span>
            </span>
          </a>

          <nav aria-label="محطات الدرس" className="mx-auto hidden items-center gap-0.5 xl:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={active === item.id ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-[12px] font-bold transition-colors",
                  active === item.id
                    ? "bg-brand-50 text-brand-800"
                    : "text-muted hover:bg-sand-100 hover:text-brand-800",
                )}
              >
                <Icon name={navIcons[item.id]} className="h-4 w-4" />
                {item.label}
                {item.id !== "overview" && (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-colors",
                      active === item.id ? "bg-gold-400" : "bg-brand-200",
                    )}
                  />
                )}
              </a>
            ))}
          </nav>

          <div className="mr-auto flex shrink-0 items-center gap-1 sm:gap-2.5 lg:mr-0">
            <button
              type="button"
              onClick={onNewLesson}
              aria-label={`الطالب: ${studentName} — نسبة الإنجاز ${progress}٪ — تبديل الطالب`}
              title="تبديل الطالب"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-brand-100 bg-white/80 md:hidden"
            >
              <ProgressRing value={progress} size={26} stroke={3} />
            </button>
            <button
              type="button"
              onClick={onNewLesson}
              title="تبديل الطالب أو بدء الدرس من جديد"
              className="hidden items-center gap-2 rounded-full border border-brand-100 bg-white/70 py-1 pe-3 ps-1 transition hover:border-brand-300 hover:bg-brand-50 md:flex"
            >
              <ProgressRing value={progress} size={34} stroke={3.5} />
              <span className="max-w-[135px] text-right leading-tight">
                <span className="flex items-center gap-1">
                  <span className="truncate text-[9px] font-bold text-muted">{studentName}</span>
                  {studentSection && (
                    <span className="shrink-0 rounded-full bg-brand-50 px-1 text-[8px] font-bold text-brand-600">
                      {studentSection}
                    </span>
                  )}
                </span>
                <span className="block text-[11px] font-extrabold text-brand-800">
                  {completedCount} من {total} محطات
                </span>
              </span>
            </button>
            <Button
              variant="secondary"
              size="sm"
              icon="userPlus"
              onClick={onNewLesson}
              aria-label="طالب جديد أو بدء الدرس من جديد"
              title="طالب جديد / بدء الدرس من جديد"
              className="hidden whitespace-nowrap min-[420px]:inline-flex"
            >
              <span className="hidden xl:inline">طالب جديد</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon="users"
              onClick={onOpenTeacher}
              aria-label="لوحة المعلم"
              title="لوحة المعلم لمتابعة إنجاز الطلاب"
              className="whitespace-nowrap bg-white/80 px-2.5 sm:px-3.5"
            >
              <span className="hidden sm:inline">لوحة المعلم</span>
            </Button>
            <Button
              variant="gold"
              size="sm"
              icon="trophy"
              onClick={onOpenCertificate}
              aria-label="بطاقة إنجازي"
              className="whitespace-nowrap px-2.5 sm:px-3.5"
            >
              <span className="hidden md:inline">بطاقة إنجازي</span>
              <span className="md:hidden">إنجازي</span>
            </Button>
          </div>
        </div>
        <div className="h-1 w-full bg-brand-100/60 xl:hidden">
          <div
            className="h-full rounded-e-full bg-gradient-to-l from-gold-400 to-brand-500 transition-[width] duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>
    </>
  );
}

export function MobileDock({ active }: { active: SectionId }) {
  return (
    <nav
      aria-label="تنقّل سريع"
      className="no-print pb-safe fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-brand-900/10 bg-white/95 px-1.5 pt-1.5 shadow-[0_18px_45px_-12px_rgba(14,62,59,0.4)] backdrop-blur-lg lg:hidden"
    >
      <ul className="flex items-center justify-between gap-0.5">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id} className="flex-1">
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-0.5 py-1.5 transition-colors",
                  isActive ? "bg-brand-50 text-brand-800" : "text-muted",
                )}
              >
                <Icon name={navIcons[item.id]} className={cn("h-[18px] w-[18px]", isActive && "text-brand-600")} />
                <span className="text-[9px] font-bold leading-none">{item.shortLabel}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function CertificateModal({
  open,
  onClose,
  progress,
  completedLabels,
  studentName,
  studentSection,
  scoreSource,
}: {
  open: boolean;
  onClose: () => void;
  progress: number;
  completedLabels: string[];
  studentName: string;
  studentSection: string;
  scoreSource?: Student;
}) {
  const [name, setName] = useState(studentName || "طالب مجتهد");

  useEffect(() => {
    if (!open) return;
    setName(studentName || "طالب مجتهد");
  }, [open, studentName]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = original;
    };
  }, [open, onClose]);

  if (!open) return null;
  const isComplete = progress >= 100;

  return (
    <div
      className="print-overlay fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-brand-900/55 p-3 py-6 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="certificate-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="animate-pop relative w-full max-w-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق بطاقة الإنجاز"
          className="absolute -top-2 left-1 z-20 grid h-9 w-9 place-items-center rounded-full bg-white text-brand-800 shadow-md transition hover:bg-sand-100"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>

        <div className="relative overflow-hidden rounded-[28px] bg-sand-50 p-2 shadow-2xl">
          {isComplete && <Confetti seed={7} />}
          <div className="print-card relative overflow-hidden rounded-[22px] border-[3px] border-brand-700 bg-sand-50 px-5 py-8 text-center sm:px-10 sm:py-10">
            <div className="pattern-dots pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-2 rounded-[16px] border border-gold-400/60" aria-hidden="true" />
            <Arabesque className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 text-brand-200/50" />
            <Arabesque className="pointer-events-none absolute -bottom-12 -left-10 h-44 w-44 text-gold-400/25" />

            <div className="relative">
              <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-700 text-sand-50 shadow-lg">
                <Icon name="mosque" className="h-7 w-7" />
              </span>
              <p className="text-[10px] font-bold tracking-[0.25em] text-gold-600">
                {lesson.subject} · {lesson.number}
              </p>
              <h2 id="certificate-title" className="mt-1 font-display text-2xl font-extrabold text-brand-900 sm:text-3xl">
                بطاقة إنجاز الدرس
              </h2>

              <div className="mx-auto my-5 flex max-w-md items-center gap-3 print:hidden">
                <label htmlFor="student-name" className="shrink-0 text-xs font-bold text-brand-800">
                  اسم الطالب
                </label>
                <input
                  id="student-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={28}
                  className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm font-bold text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
                  placeholder="اكتب اسمك هنا"
                />
              </div>

              <p className="text-sm font-bold text-muted">أتمّ بمشاركةٍ ممتعة رحلة درس</p>
              <p className="mt-1 font-serif text-3xl font-bold text-brand-800 sm:text-4xl">مكانةُ الصلاة</p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold text-brand-700">
                <Icon name="users" className="h-3 w-3" />
                {lesson.grade} {studentSection ? `· الصف ${studentSection}` : ""}
              </p>

              <div className="mx-auto mt-4 max-w-sm rounded-2xl border border-gold-400/40 bg-white/70 px-5 py-3">
                <p className="text-[10px] font-bold text-muted">اسم الطالب</p>
                <p className="font-display text-lg font-extrabold text-brand-900">{name.trim() || "طالب مجتهد"}</p>
              </div>

              <div className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-3 rounded-2xl border border-gold-400/40 bg-white/80 px-4 py-2.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-400 text-brand-900">
                  <Icon name="star" className="h-5 w-5" />
                </span>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-muted">الدرجة الكلية</p>
                  <p className="whitespace-nowrap font-display text-lg font-extrabold leading-tight text-brand-900" dir="ltr">
                    {formatScore(scoreSource ? stationScore(scoreSource) + scoreSource.evaluationScore : 0)}
                    <span className="mx-0.5 text-[12px] font-bold text-muted">/</span>
                    {formatScore(TOTAL_MAX)}
                  </p>
                  <p className="text-[8px] font-medium text-muted">
                    المحطات {formatScore(scoreSource ? stationScore(scoreSource) : 0)} + التقويم{" "}
                    {formatScore(scoreSource?.evaluationScore ?? 0)}
                  </p>
                </div>
              </div>

              <div className="mx-auto mt-4 flex items-center justify-center gap-2">
                <ProgressRing value={progress} size={46} stroke={4.5} />
                <p className="text-right text-xs font-bold text-brand-800">
                  أنجزت {Math.round(progress)}٪ من رحلة الدرس
                  <span className="block text-[10px] font-medium text-muted">
                    {isComplete ? "ما شاء الله، أكملت جميع المحطات!" : "أكمل بقية المحطات لتكتمل رحلتك."}
                  </span>
                </p>
              </div>

              {completedLabels.length > 0 && (
                <ul className="mx-auto mt-4 flex max-w-md flex-wrap justify-center gap-1.5">
                  {completedLabels.map((label) => (
                    <li
                      key={label}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700"
                    >
                      <Icon name="check" className="h-3 w-3" />
                      {label}
                    </li>
                  ))}
                </ul>
              )}

              <p className="mx-auto mt-5 max-w-md font-serif text-base leading-8 text-brand-800">
                «الصلاةُ أفضلُ الأعمالِ وأعظمُ أركانِ الإسلامِ بعد الشهادتين»
              </p>

              <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-brand-200/70 pt-4 sm:flex-row">
                <p className="text-[10px] font-medium text-muted">
                  {lesson.grade} · {lesson.audience}
                </p>
                <StarBurst className="h-7 w-7 text-gold-500" />
                <p className="text-[10px] font-medium text-muted">درس تفاعلي · {new Date().toLocaleDateString("ar-SA")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 print:hidden">
          <Button onClick={() => window.print()} icon="printer" variant="gold" size="md">
            طباعة البطاقة
          </Button>
          <Button onClick={onClose} variant="secondary" icon="close" size="md">
            إغلاق
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Footer({
  onOpenCertificate,
  onOpenTeacher,
  onNewLesson,
}: {
  onOpenCertificate: () => void;
  onOpenTeacher: () => void;
  onNewLesson: () => void;
}) {
  return (
    <footer className="no-print relative mt-16 overflow-hidden bg-brand-900 pb-28 pt-14 text-sand-100 lg:pb-14">
      <div className="pattern-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <Arabesque className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 text-white/5" />
      <StarBurst className="pointer-events-none absolute -bottom-8 right-8 h-44 w-44 text-gold-400/10" />

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-sand-50">
                <Icon name="mosque" className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-xl font-extrabold text-white">مكانةُ الصلاة</p>
                <p className="text-xs text-brand-200">
                  {lesson.subject} · {lesson.grade} {lesson.audience}
                </p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-7 text-brand-100/80">{lesson.intro}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["قراءة تفاعلية", "استماع للأحاديث", "أنشطة فورية", "بطاقة إنجاز"].map((tag) => (
                <span key={tag} className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium text-brand-100">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={onOpenCertificate} variant="gold" size="sm" icon="trophy">
                استعرض بطاقة إنجازك
              </Button>
              <Button
                onClick={onOpenTeacher}
                variant="outline"
                size="sm"
                icon="users"
                className="border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10 hover:text-white"
              >
                لوحة المعلم
              </Button>
              <Button
                onClick={onNewLesson}
                variant="outline"
                size="sm"
                icon="userPlus"
                className="border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10 hover:text-white"
              >
                طالب جديد
              </Button>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-extrabold text-white">المصادر والمراجع</h3>
            <ul className="space-y-2.5">
              {references.map((reference) => (
                <li key={reference.mark} className="flex items-start gap-2.5 text-xs leading-6 text-brand-100/85">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-bold text-gold-400">
                    {reference.mark}
                  </span>
                  {reference.text}
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] leading-6 text-brand-100/70">
              جميع نصوص الدرس والأسئلة مأخوذة من المادة المرفقة، مع تنظيمها في أنشطة تفاعلية.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 text-[11px] text-brand-200/80 sm:flex-row">
          <p>رحلة تعلّم تفاعلية · {lesson.number}</p>
          <p className="flex items-center gap-1.5">
            أُعدّت لتلاميذ الصف الثالث الابتدائي
            <Icon name="heart" className="h-3.5 w-3.5 text-gold-400" />
          </p>
        </div>
      </div>
    </footer>
  );
}
