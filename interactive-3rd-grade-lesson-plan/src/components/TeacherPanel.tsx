import { useEffect, useMemo, useRef, useState } from "react";
import { lesson, teacher } from "../content";
import {
  MAX_STUDENTS,
  TASK_KEYS,
  TEACHER_PASSWORD,
  TEACHER_UNLOCK_KEY,
  TASKS,
  addStudent,
  clearAllStudents,
  completionPercent,
  completedCount,
  demoClassroom,
  downloadClassroomCsv,
  emptyResult,
  formatFullDate,
  formatLastActive,
  needsSupport,
  nowISO,
  removeDemoStudents,
  removeStudentCompletely,
  stationScore,
  totalCorrect,
  totalIncorrect,
  totalScore,
  formatScore,
  STATIONS_MAX,
  TOTAL_MAX,
  updateStudent,
  type Classroom,
  type Student,
} from "../classroom";
import { Button, Icon, ProgressRing, cn, type IconName } from "./ui";
import {
  cloudErrorArabic,
  parseBackupFile,
  type BackupStudent,
  getTeacherPassword,
  rememberTeacherPassword,
  type CloudStatus,
  type CloudStudent,
} from "../cloud";
import type { StudentSubmission } from "../classroom";

type Filter = "all" | "complete" | "progress" | "notstarted" | "support";

const UNLOCK_SESSION_KEY = TEACHER_UNLOCK_KEY;

export type TeacherCloud = {
  status: CloudStatus;
  error: string | null;
  students: CloudStudent[];
  submissions: StudentSubmission[];
  classCode: string;
  loading: boolean;
  lastSync: string | null;
  provider: string | null;
  onRefresh: (password: string) => void | Promise<void>;
  onClassCodeChange: (value: string) => void;
  onDelete: (ids: string[]) => Promise<{ ok: boolean; error?: string }>;
  onDeleteAll: () => Promise<{ ok: boolean; error?: string }>;
  onRename: (
    id: string,
    edits: { name?: string; section?: Exclude<Student["section"], ""> },
  ) => Promise<{ ok: boolean; error?: string }>;
  onBackup: () => Promise<{ ok: boolean; error?: string }>;
  onRestore: (records: BackupStudent[]) => Promise<{ ok: boolean; error?: string; imported?: number; skipped?: string[] }>;
};


type TeacherPanelProps = {
  open: boolean;
  classroom: Classroom;
  onChange: (next: Classroom) => void;
  onClose: () => void;
  cloud: TeacherCloud;
  onRequestNewStudent?: () => void;
};

const ar = (value: number) => value.toLocaleString("ar-EG");

const stationIcons: Record<string, IconName> = {
  read: "book",
  activity: "spark",
  status: "star",
  evaluation: "check",
};

const avatarTones = [
  "bg-brand-700 text-sand-50",
  "bg-gold-400 text-brand-900",
  "bg-brand-400 text-white",
  "bg-clay-400 text-white",
  "bg-brand-900 text-gold-400",
];

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "brand",
}: {
  icon: IconName;
  label: string;
  value: React.ReactNode;
  hint: string;
  tone?: "brand" | "gold" | "clay" | "plain";
}) {
  const tones = {
    brand: "bg-brand-700 text-sand-50",
    gold: "bg-gold-400 text-brand-900",
    clay: "bg-clay-500 text-white",
    plain: "bg-sand-100 text-gold-600",
  }[tone];

  return (
    <div className="relative min-w-0 overflow-hidden rounded-2xl border border-brand-100 bg-white p-2.5 shadow-soft sm:p-4">
      <div className="mb-1.5 flex items-start justify-between gap-1">
        <span className={cn("grid h-8 w-8 place-items-center rounded-xl sm:h-9 sm:w-9", tones)}>
          <Icon name={icon} className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
        </span>
        <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[8px] font-bold text-brand-500 sm:text-[9px]">مباشر</span>
      </div>
      <p className="truncate font-display text-lg font-extrabold leading-none text-brand-900 sm:text-2xl" dir="auto">{value}</p>
      <p className="mt-1 text-[10px] font-extrabold leading-4 text-brand-800 sm:text-[11px]">{label}</p>
      <p className="mt-0.5 line-clamp-2 text-[8px] font-medium leading-4 text-muted sm:text-[9px]">{hint}</p>
    </div>
  );
}

function readUnlocked() {
  try {
    return window.sessionStorage.getItem(UNLOCK_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function TeacherLock({ onUnlock, onClose }: { onUnlock: (password: string) => void; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 250);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", handleKey);
      window.clearTimeout(timer);
    };
  }, [onClose]);

  const submit = () => {
    if (code === TEACHER_PASSWORD) {
      setError(null);
      onUnlock(code);
      return;
    }
    setError(code.length === 0 ? "أدخل كلمة سر المعلم أولًا." : "كلمة السر غير صحيحة، حاول مرة أخرى.");
    setAttempts((value) => value + 1);
    setCode("");
    inputRef.current?.focus();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-lock-title"
      dir="rtl"
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-brand-900 p-4"
    >
      <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true">
        <div className="pattern-grid absolute inset-0" />
        <div className="absolute -right-24 -top-20 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-gold-500/20 blur-3xl" />
      </div>

      <div className="animate-pop relative w-full max-w-md">
        <div className="overflow-hidden rounded-[26px] bg-sand-50 shadow-2xl">
          <div className="relative overflow-hidden bg-gradient-to-l from-brand-800 to-brand-600 p-6 text-center text-white">
            <div className="pattern-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
            <span className="relative mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gold-400 text-brand-900 shadow-lg">
              <Icon name="shield" className="h-7 w-7" />
            </span>
            <p className="relative text-[10px] font-bold tracking-[0.2em] text-gold-400">منطقة خاصة بالمعلم</p>
            <h1 id="teacher-lock-title" className="relative mt-1 font-display text-xl font-extrabold">
              لوحة متابعة إنجاز الطلاب
            </h1>

            <div className="relative mx-auto mt-3 flex max-w-xs items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 text-right">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-400 font-display text-[12px] font-extrabold text-brand-900">
                {teacher.name.trim().split(/\s+/).slice(0, 2).map((word) => word.charAt(0)).join("")}
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gold-400">{teacher.role}</p>
                <p className="truncate font-display text-[13px] font-extrabold text-white">{teacher.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[9px] font-medium text-brand-100/85">
                  <Icon name="mosque" className="h-3 w-3 shrink-0 text-gold-400" />
                  {teacher.school}
                </p>
              </div>
            </div>

            <p className="relative mt-3 text-[10px] leading-6 text-brand-100/80">
              {lesson.title} · {lesson.grade} · {lesson.audience}
            </p>
          </div>

          <form
            className="p-5 sm:p-6"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label htmlFor="teacher-code" className="mb-1.5 block text-center text-[11px] font-extrabold text-brand-900">
              كلمة سر المعلم
            </label>
            <p className="mb-3 text-center text-[10px] leading-5 text-muted">
              أدخل الرمز المكوّن من ٦ أرقام للوصول إلى بيانات الصف.
            </p>

            <div className="relative">
              <input
                ref={inputRef}
                id="teacher-code"
                type={show ? "text" : "password"}
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={6}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6));
                  setError(null);
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "teacher-code-error" : undefined}
                placeholder="••••••"
                className={cn(
                  "w-full rounded-2xl border-2 bg-white py-3 text-center font-display text-xl font-extrabold tracking-[0.5em] text-brand-900 outline-none transition placeholder:tracking-[0.4em] placeholder:text-brand-200 focus:ring-4 focus:ring-brand-500/15",
                  error ? "border-clay-400" : "border-brand-200 focus:border-brand-500",
                )}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShow((value) => !value)}
                aria-label={show ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
                className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-brand-400 transition hover:bg-brand-50 hover:text-brand-700"
              >
                <Icon name={show ? "lock" : "eye"} className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <p
                id="teacher-code-error"
                role="alert"
                className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1.5 text-[10px] font-bold text-clay-600"
              >
                <Icon name="close" className="h-3 w-3" />
                {error}
                {attempts >= 2 && <span className="font-medium">· تواصل مع إدارة المدرسة عند نسيان الكلمة.</span>}
              </p>
            )}

            <Button type="submit" icon="lock" size="md" className="mt-4 w-full">
              فتح اللوحة
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-bold text-muted transition hover:bg-sand-100 hover:text-brand-800"
            >
              <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
              العودة إلى الدرس
            </button>

            <p className="mt-3 flex items-start justify-center gap-1.5 border-t border-brand-100 pt-3 text-center text-[9px] leading-5 text-muted">
              <Icon name="shield" className="mt-0.5 h-3 w-3 shrink-0 text-brand-400" />
              هذه حماية لواجهة اللوحة، وتُحفظ بيانات الصف على هذا المتصفح.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export function TeacherPanel({
  open,
  classroom,
  onChange,
  onClose,
  cloud,
  onRequestNewStudent,
  onDownloadLocalBackup,
  onRestoreLocal,
}: TeacherPanelProps & {
  onDownloadLocalBackup?: () => void;
  onRestoreLocal?: (records: BackupStudent[]) => void;
}) {
  const [unlocked, setUnlocked] = useState(readUnlocked);
  const [password, setPassword] = useState(getTeacherPassword);

  useEffect(() => {
    if (!open) return;
    setUnlocked(readUnlocked());
    setPassword(getTeacherPassword());
  }, [open]);

  if (!open) return null;

  if (!unlocked) {
    return (
      <TeacherLock
        onClose={onClose}
        onUnlock={(value) => {
          try {
            window.sessionStorage.setItem(UNLOCK_SESSION_KEY, "1");
          } catch {
            /* الجلسة غير متاحة */
          }
          rememberTeacherPassword(value);
          setPassword(value);
          setUnlocked(true);
        }}
      />
    );
  }

  return (
    <TeacherDashboard
      classroom={classroom}
      onChange={onChange}
      onClose={onClose}
      cloud={cloud}
      password={password}
      onRequestNewStudent={onRequestNewStudent}
      onDownloadLocalBackup={onDownloadLocalBackup}
      onRestoreLocal={onRestoreLocal}
      onLock={() => {
        try {
          window.sessionStorage.removeItem(UNLOCK_SESSION_KEY);
        } catch {
          /* الجلسة غير متاحة */
        }
        setUnlocked(false);
      }}
    />
  );
}

function TeacherDashboard({
  classroom,
  onChange,
  onClose,
  onLock,
  cloud,
  password,
  onRequestNewStudent,
  onDownloadLocalBackup,
  onRestoreLocal,
}: {
  classroom: Classroom;
  onChange: (next: Classroom) => void;
  onClose: () => void;
  onLock: () => void;
  cloud: TeacherCloud;
  password: string;
  onRequestNewStudent?: () => void;
  onDownloadLocalBackup?: () => void;
  onRestoreLocal?: (records: BackupStudent[]) => void;
}) {
  const localStudents = classroom.students;
  const usingCloud = cloud.status === "ready" && cloud.students.length > 0;
  const students = (usingCloud ? cloud.students : localStudents).filter(
    (student) => student.name !== "طالب الصف الثالث",
  );
  const [cloudPanelOpen, setCloudPanelOpen] = useState(false);
  const [codeDraft, setCodeDraft] = useState(cloud.classCode);
  const [refreshing, setRefreshing] = useState(false);

  const refreshRoster = async () => {
    setRefreshing(true);
    try {
      await cloud.onRefresh(password);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!password || cloud.status === "local") return;
    cloud.onRefresh(password);
    const timer = window.setInterval(() => cloud.onRefresh(password), 20000);
    return () => window.clearInterval(timer);
    // التحديث مرتبط بحالة الاتصال ورمز الصف فقط
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password, cloud.status, cloud.classCode]);

  useEffect(() => {
    setCodeDraft(cloud.classCode);
  }, [cloud.classCode]);
  const active =
    localStudents.find(
      (student) => student.id === classroom.activeId && student.name !== "طالب الصف الثالث",
    ) ?? (localStudents[0]?.name === "طالب الصف الثالث" ? null : localStudents[0]);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailName, setDetailName] = useState("");
  const [detailSection, setDetailSection] = useState<Student["section"]>("");
  const [detailNotes, setDetailNotes] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<BackupStudent[] | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const messageTimer = useRef<number | null>(null);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    if (messageTimer.current) window.clearTimeout(messageTimer.current);
    messageTimer.current = window.setTimeout(() => setMessage(null), 3800);
  };

  useEffect(() => {
    return () => {
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
    };
  }, []);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (detailId) setDetailId(null);
      else onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", handleKey);
    };
  }, [detailId, onClose]);

  const detail = detailId ? students.find((student) => student.id === detailId) : null;
  const detailIsLocal = detail ? localStudents.some((student) => student.id === detail.id) : false;

  useEffect(() => {
    if (!detailId) return;
    const student = students.find((item) => item.id === detailId);
    if (!student) return;
    setDetailName(student.name);
    setDetailSection(student.section);
    setDetailNotes(student.notes);
    setConfirmReset(false);
    setConfirmDelete(false);
    // إعادة التهيئة عند تغيير الطالب المفتوح فقط
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailId]);

  const hasDemo = students.some((student) => student.demo);

  const submissions = useMemo(
    () =>
      [...(usingCloud ? cloud.submissions : classroom.submissions)].sort((a, b) =>
        b.submittedAt.localeCompare(a.submittedAt),
      ),
    [classroom.submissions, cloud.submissions, usingCloud],
  );

  const stats = useMemo(() => {
    const total = students.length;
    const average = total
      ? Math.round(students.reduce((sum, student) => sum + completionPercent(student), 0) / total)
      : 0;
    const finished = students.filter((student) => completionPercent(student) === 100).length;
    const support = students.filter((student) => needsSupport(student)).length;
    const averageScore = total
      ? Math.round((students.reduce((sum, student) => sum + totalScore(student), 0) / total) * 10) / 10
      : 0;
    return { total, average, averageScore, finished, support };
  }, [students]);

  const counts = useMemo(
    () => ({
      all: students.length,
      complete: students.filter((student) => completionPercent(student) === 100).length,
      progress: students.filter((student) => {
        const percent = completionPercent(student);
        return percent > 0 && percent < 100;
      }).length,
      notstarted: students.filter((student) => {
        const percent = completionPercent(student);
        const attempts = totalCorrect(student) + totalIncorrect(student);
        return percent === 0 && attempts === 0;
      }).length,
      support: students.filter((student) => needsSupport(student)).length,
    }),
    [students],
  );

  const filtered = useMemo(() => {
    const term = query.trim();
    return students.filter((student) => {
      if (term && !student.name.includes(term)) return false;
      const percent = completionPercent(student);
      if (filter === "complete") return percent === 100;
      if (filter === "progress") return percent > 0 && percent < 100;
      if (filter === "notstarted") return percent === 0 && totalCorrect(student) + totalIncorrect(student) === 0;
      if (filter === "support") return needsSupport(student);
      return true;
    });
  }, [students, query, filter]);

  const setActive = (student: Student, close = false) => {
    onChange({ ...classroom, activeId: student.id });
    notify(`أصبح «${student.name}» هو الطالب الحالي في الدرس.`);
    if (close) onClose();
  };

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newName.trim();
    if (name.length < 2) {
      notify("اكتب اسمًا من حرفين على الأقل.", "error");
      return;
    }
    if (students.length >= MAX_STUDENTS) {
      notify(`الحد الأقصى ${ar(MAX_STUDENTS)} طالبًا.`, "error");
      return;
    }
    if (students.some((student) => student.name.trim() === name)) {
      notify("هذا الاسم موجود في القائمة.", "error");
      return;
    }
    const { classroom: next } = addStudent(classroom, name);
    onChange(next);
    setNewName("");
    notify(`أُضيف الطالب «${name}» إلى الصف.`);
  };

  const handleReset = (studentId: string) => {
    const updated = updateStudent(classroom, studentId, (student) => ({
      ...student,
      completed: { read: false, activity: false, status: false, evaluation: false },
      results: {
        read: emptyResult(),
        activity: emptyResult(),
        status: emptyResult(),
        evaluation: emptyResult(),
      },
      evaluationScore: 0,
      submittedAt: null,
      lastActive: nowISO(),
    }));
    onChange({
      ...updated,
      submissions: updated.submissions.filter((submission) => submission.studentId !== studentId),
    });
    setConfirmReset(false);
    notify("تم تصفير تقدّم الطالب مع الاحتفاظ باسمه وملاحظاته.");
  };

  const handleDelete = async (student: Student) => {
    if (deletingId) return;
    const remainingVisible = students.filter((item) => item.id !== student.id).length;
    setDeletingId(student.id);
    try {
      if (cloud.status === "ready") {
        const result = await cloud.onDelete([student.id]);
        if (!result.ok) {
          notify(cloudErrorArabic(result.error), "error");
          return;
        }
      }
      const next = removeStudentCompletely(classroom, student.id);
      onChange(next);
      setDetailId(null);
      setConfirmDelete(false);
      const emptied = remainingVisible === 0;
      notify(
        emptied
          ? "حُذف الطالب، ولم يتبقَّ طلاب في السجل. يمكنك بدء طالب جديد."
          : `حُذف الطالب «${student.name}» وسجله.`,
      );
      if (emptied) onRequestNewStudent?.();
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (deletingAll) return;
    setDeletingAll(true);
    try {
      if (cloud.status === "ready") {
        const result = await cloud.onDeleteAll();
        if (!result.ok) {
          notify(cloudErrorArabic(result.error), "error");
          return;
        }
      }
      onChange(clearAllStudents(classroom));
      setDetailId(null);
      setConfirmClearAll(false);
      setConfirmDelete(false);
      notify("حُذف جميع الطلاب وسجلاتهم. يمكنك البدء من جديد.");
      onRequestNewStudent?.();
    } finally {
      setDeletingAll(false);
    }
  };

  const handleSaveStudentData = async () => {
    if (!detail || renaming) return;
    const name = detailName.trim();
    if (name.length < 2) {
      notify("اكتب اسمًا من حرفين على الأقل.", "error");
      return;
    }
    if (detailSection !== "٣/١" && detailSection !== "٣/٢") {
      notify("اختر شعبة الطالب: ٣/١ أو ٣/٢.", "error");
      return;
    }

    const isCloudRecord = Boolean((detail as CloudStudent).cloud) || !detailIsLocal;
    const sectionChanged = detailSection !== detail.section;
    const nameChanged = name !== detail.name;

    if (isCloudRecord) {
      if (cloud.status !== "ready") {
        notify("يلزم تفعيل السجل المشترك لحفظ التعديل لكل الأجهزة. يمكنك حفظه محليًا من النسخة الاحتياطية.", "error");
        return;
      }
      setRenaming(true);
      try {
        const result = await cloud.onRename(detail.id, {
          ...(nameChanged ? { name } : {}),
          ...(sectionChanged ? { section: detailSection as Exclude<Student["section"], ""> } : {}),
        });
        if (!result.ok) {
          notify(cloudErrorArabic(result.error), "error");
          return;
        }
        setDetailName(name);
        setConfirmDelete(false);
        notify(
          sectionChanged
            ? `حُفظت بيانات الطالب «${name}» والشعبة ${detailSection} في السجل المشترك.`
            : `حُفظ اسم الطالب «${name}» في السجل المشترك، وسيظهر في جميع الأجهزة.`,
        );
      } finally {
        setRenaming(false);
      }
      return;
    }

    const updated = updateStudent(classroom, detail.id, (student) => ({
      ...student,
      name,
      section: detailSection,
    }));
    onChange({
      ...updated,
      submissions: updated.submissions.map((submission) =>
        submission.studentId === detail.id
          ? { ...submission, name, section: detailSection as Exclude<Student["section"], ""> }
          : submission,
      ),
    });
    setDetailName(name);
    notify(sectionChanged ? "تم تحديث اسم الطالب وشعبته وحفظها." : "تم تحديث اسم الطالب وحفظه.");
  };

  const handleBackup = async () => {
    if (backupBusy) return;
    setBackupBusy(true);
    try {
      if (cloud.status === "ready") {
        const result = await cloud.onBackup();
        notify(
          result.ok
            ? "تم تنزيل نسخة احتياطية بكل بيانات الطلاب. احتفظ بها لاستعادتها بعد أي نشر جديد."
            : cloudErrorArabic(result.error),
          result.ok ? "success" : "error",
        );
      } else if (onDownloadLocalBackup) {
        onDownloadLocalBackup();
        notify("تم تنزيل نسخة احتياطية للبيانات المحفوظة على هذا الجهاز.");
      } else {
        notify("لا توجد بيانات متاحة للنسخ الاحتياطي.", "error");
      }
    } finally {
      setBackupBusy(false);
    }
  };

  const handleRestoreFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const records = parseBackupFile(JSON.parse(text) as unknown);
      if (records.length === 0) {
        notify("الملف لا يحتوي على بيانات طلاب صالحة.", "error");
        return;
      }
      setPendingRestore(records);
    } catch {
      notify("تعذّر قراءة ملف النسخة الاحتياطية. تأكد أنه ملف JSON صادر من هذا الدرس.", "error");
    } finally {
      if (restoreInputRef.current) restoreInputRef.current.value = "";
    }
  };

  const confirmRestore = async () => {
    if (!pendingRestore || backupBusy) return;
    setBackupBusy(true);
    try {
      if (cloud.status === "ready") {
        const result = await cloud.onRestore(pendingRestore);
        if (!result.ok) {
          notify(cloudErrorArabic(result.error), "error");
          return;
        }
        notify(
          `تمت استعادة ${ar(result.imported || pendingRestore.length)} سجلًا في السجل المشترك.` +
            (result.skipped && result.skipped.length ? ` (تم تجاهل ${ar(result.skipped.length)})` : ""),
        );
      } else if (onRestoreLocal) {
        onRestoreLocal(pendingRestore);
        notify(`تمت استعادة ${ar(pendingRestore.length)} سجلًا على هذا الجهاز.`);
      }
      setPendingRestore(null);
    } finally {
      setBackupBusy(false);
    }
  };

  const handleSaveNotes = () => {
    if (!detail || !localStudents.some((student) => student.id === detail.id)) return;
    onChange(updateStudent(classroom, detail.id, (student) => ({ ...student, notes: detailNotes.slice(0, 500) })));
    notify("حُفظت ملاحظة المعلم.");
  };

  const handleSeedDemo = () => {
    onChange(demoClassroom(classroom));
    notify("أُضيفت بيانات تجريبية للعرض؛ يمكنك حذفها في أي وقت.", "success");
  };

  const handleRemoveDemo = () => {
    onChange(removeDemoStudents(classroom));
    setDetailId(null);
    notify("حُذفت البيانات التجريبية.");
  };

  const handleExport = () => {
    downloadClassroomCsv(classroom);
    notify("تم تنزيل تقرير الصف بصيغة CSV.");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=1000");
    if (!printWindow) {
      notify("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.", "error");
      return;
    }

    const bySection = (section: "٣/١" | "٣/٢") => students.filter((student) => student.section === section);
    const avgScore = (list: typeof students) =>
      list.length ? Math.round((list.reduce((sum, student) => sum + totalScore(student), 0) / list.length) * 10) / 10 : 0;

    const toneOf = (value: number) => (value >= 4 ? "good" : value >= 2.5 ? "mid" : value > 0 ? "low" : "zero");

    const rows =
      students.length === 0
        ? `<tr><td colspan="6" class="empty">لا توجد بيانات طلاب في هذا السجل حتى الآن.</td></tr>`
        : students
            .map((student, index) => {
              const percent = completionPercent(student);
              const score = totalScore(student);
              const tone = toneOf(score);
              const stations = TASKS.map((task) => {
                const done = student.completed[task.key];
                return `<span class="chip ${done ? "on" : "off"}" title="${escapeHtml(task.label)}">
                  <i>${done ? "✓" : "•"}</i><b>${escapeHtml(task.short)}</b>
                </span>`;
              }).join("");
              const notes = student.notes
                ? `<div class="note">📝 ${escapeHtml(student.notes.slice(0, 70))}${student.notes.length > 70 ? "…" : ""}</div>`
                : "";
              return `<tr>
                <td class="idx">${index + 1}</td>
                <td class="who">
                  <div class="name">${escapeHtml(student.name)}</div>
                  <div class="sub">
                    <span class="sec">${escapeHtml(student.section || "—")}</span>
                    ${student.demo ? `<span class="demo">تجريبي</span>` : ""}
                    <span class="active">آخر نشاط: ${escapeHtml(formatLastActive(student.lastActive))}</span>
                  </div>
                  ${notes}
                </td>
                <td class="stations"><div class="chips">${stations}</div></td>
                <td class="progress">
                  <div class="pct ${percent === 100 ? "full" : percent >= 50 ? "half" : "part"}" dir="ltr">${percent}%</div>
                  <div class="bar"><span style="width:${Math.max(percent, 3)}%"></span></div>
                </td>
                <td class="score">
                  <div class="badge ${tone}" dir="ltr">${formatScore(score)}<small> / ${formatScore(TOTAL_MAX)}</small></div>
                  <div class="split">محطات <span dir="ltr">${formatScore(stationScore(student))}/${formatScore(STATIONS_MAX)}</span> · تقويم <span dir="ltr">${student.evaluationScore}/٣</span></div>
                </td>
                <td class="submit">
                  ${
                    student.submittedAt
                      ? `<span class="sent">✓ سلّم</span><div class="when">${escapeHtml(formatLastActive(student.submittedAt))}</div>`
                      : `<span class="not-sent">لم يسلّم</span>`
                  }
                </td>
              </tr>`;
            })
            .join("");

    const sectionCards = (["٣/١", "٣/٢"] as const)
      .map((section) => {
        const list = bySection(section);
        return `<div class="section-card">
          <div class="s-label">شعبة ${section}</div>
          <div class="s-value">${ar(list.length)} <small>طالب</small></div>
          <div class="s-note">متوسط الدرجة <span dir="ltr" class="ratio">${formatScore(avgScore(list))}/${formatScore(TOTAL_MAX)}</span></div>
        </div>`;
      })
      .join("");

    const today = new Date().toLocaleDateString("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    printWindow.document.write(`<!doctype html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8" />
<title>تقرير إنجاز الطلاب — ${escapeHtml(lesson.title)}</title>
<style>
  @page { size: A4 portrait; margin: 8mm 9mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Tajawal", "Tahoma", "Segoe UI", sans-serif;
    color: #16312d; background: #fff; font-size: 10px; line-height: 1.55;
  }
  .sheet { padding: 2mm 0 0; }

  /* ---------------- Header ---------------- */
  .hero {
    position: relative; overflow: hidden; border-radius: 14px;
    background: linear-gradient(120deg, #0e3e3b 0%, #0e5d57 55%, #1e9084 100%);
    color: #fff; padding: 14px 16px 12px; margin-bottom: 10px;
  }
  .hero::after {
    content: ""; position: absolute; left: -30px; top: -40px; width: 150px; height: 150px;
    border-radius: 50%; background: rgba(255,255,255,.06);
  }
  .hero::before {
    content: ""; position: absolute; left: 18px; bottom: -46px; width: 120px; height: 120px;
    border: 14px solid rgba(214,170,79,.18); border-radius: 50%;
  }
  .hero-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; position: relative; }
  .brand { display: flex; align-items: center; gap: 8px; }
  .logo {
    width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center;
    background: #d6aa4f; color: #0e3e3b; font-size: 17px; font-weight: 800;
  }
  .school { font-size: 11px; font-weight: 800; }
  .teacher { font-size: 9px; color: #d3f0e9; }
  .stamp {
    border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.12);
    border-radius: 999px; padding: 4px 10px; font-size: 8.5px; font-weight: 700; color: #f8f1df;
  }
  h1 { position: relative; margin: 9px 0 2px; font-size: 19px; letter-spacing: -.2px; }
  .lesson { position: relative; margin: 0; font-size: 10.5px; color: #d3f0e9; font-weight: 600; }
  .hero-meta {
    position: relative; margin-top: 9px; display: flex; flex-wrap: wrap; gap: 6px;
    font-size: 8.5px; color: #eafaf6;
  }
  .hero-meta span { background: rgba(255,255,255,.12); border-radius: 999px; padding: 3px 8px; }
  .hero-meta .gold { background: #d6aa4f; color: #0e3e3b; font-weight: 800; }

  /* ---------------- Stats ---------------- */
  .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 8px; }
  .stat { border-radius: 10px; padding: 7px 8px; border: 1px solid #e6ecdd; background: #fdfaf2; }
  .stat .k { font-size: 7.5px; color: #5c736e; font-weight: 700; }
  .stat .v { font-size: 14px; font-weight: 800; color: #0e3e3b; line-height: 1.3; }
  .stat .v small { font-size: 7.5px; color: #5c736e; font-weight: 700; }
  .stat.teal { background: #edf9f6; border-color: #a9e2d7; }
  .stat.gold { background: #f8f1df; border-color: #e6d3a6; }
  .stat.green { background: #e9f7ef; border-color: #b9e4c9; }
  .stat.clay { background: #fdf0ea; border-color: #f0c9b4; }

  .sections { display: flex; gap: 6px; margin-bottom: 9px; }
  .section-card {
    flex: 1; display: flex; align-items: center; gap: 8px;
    border: 1px dashed #a9e2d7; background: #f4fbf9; border-radius: 10px; padding: 6px 9px;
  }
  .s-label { font-size: 9px; font-weight: 800; color: #0f746b; background: #fff; border-radius: 6px; padding: 2px 7px; }
  .s-value { font-size: 12px; font-weight: 800; color: #0e3e3b; }
  .s-value small { font-size: 7.5px; font-weight: 700; color: #5c736e; }
  .s-note { margin-inline-start: auto; font-size: 8px; color: #5c736e; font-weight: 700; }
  .ratio { unicode-bidi: isolate; white-space: nowrap; }

  /* ---------------- Table ---------------- */
  table { width: 100%; border-collapse: separate; border-spacing: 0; }
  thead th {
    background: #0e5d57; color: #fff; font-size: 8.5px; font-weight: 800;
    padding: 7px 6px; text-align: right; border: none;
  }
  thead th:first-child { border-radius: 0 9px 0 0; }
  thead th:last-child { border-radius: 9px 0 0 0; }
  tbody td { padding: 6px 6px; border-bottom: 1px solid #e9f0e2; vertical-align: middle; }
  tbody tr:nth-child(even) td { background: #fdfaf2; }
  tbody tr:last-child td { border-bottom: 2px solid #0e5d57; }
  .idx { width: 16px; text-align: center; font-size: 8px; font-weight: 800; color: #9db3ad; }
  .who { width: 30%; }
  .name { font-size: 10px; font-weight: 800; color: #0e3e3b; }
  .sub { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 2px; font-size: 7.5px; color: #5c736e; }
  .sec { background: #d6aa4f; color: #0e3e3b; border-radius: 999px; padding: 1px 6px; font-weight: 800; font-size: 7.5px; }
  .demo { background: #f0e4c8; color: #9a7025; border-radius: 999px; padding: 1px 5px; font-weight: 700; }
  .note { margin-top: 2px; font-size: 7.5px; color: #9a7025; background: #fdf8ec; border-radius: 5px; padding: 1px 5px; }

  .stations { width: 20%; }
  .chips { display: flex; flex-wrap: wrap; gap: 3px; }
  .chip {
    display: inline-flex; align-items: center; gap: 2px; border-radius: 6px;
    padding: 2px 4px; font-size: 7px; border: 1px solid #e6ecdd; background: #fff; color: #9db3ad;
  }
  .chip i { font-style: normal; font-size: 7px; }
  .chip b { font-weight: 800; }
  .chip.on { background: #e9f7ef; border-color: #73cbbd; color: #0e5d57; }
  .chip.on i { color: #0f746b; }

  .progress { width: 12%; }
  .pct { font-size: 10px; font-weight: 800; }
  .pct.full { color: #0f746b; }
  .pct.half { color: #bc8d31; }
  .pct.part { color: #b8623d; }
  .bar { height: 4px; border-radius: 999px; background: #e8f1ec; overflow: hidden; margin-top: 3px; }
  .bar span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #d6aa4f, #1e9084); }

  .score { width: 15%; }
  .badge {
    display: inline-block; border-radius: 8px; padding: 3px 7px; font-size: 11px; font-weight: 800;
    border: 1px solid transparent;
  }
  .badge small { font-size: 7.5px; font-weight: 700; opacity: .75; }
  .badge.good { background: #e9f7ef; color: #0e5d57; border-color: #73cbbd; }
  .badge.mid { background: #f8f1df; color: #9a7025; border-color: #e6d3a6; }
  .badge.low { background: #fdf0ea; color: #b8623d; border-color: #f0c9b4; }
  .badge.zero { background: #f3f6f4; color: #9db3ad; border-color: #e6ecdd; }
  .split { font-size: 7px; color: #5c736e; margin-top: 2px; font-weight: 700; }
  .split span { unicode-bidi: isolate; }

  .submit { width: 13%; font-size: 8px; }
  .sent { color: #0f746b; font-weight: 800; }
  .not-sent { color: #b8623d; font-weight: 700; }
  .when { color: #9db3ad; font-size: 7px; margin-top: 1px; }
  .empty { text-align: center; padding: 24px; color: #5c736e; font-weight: 700; }

  /* ---------------- Footer ---------------- */
  .legend {
    margin-top: 9px; border: 1px solid #e6ecdd; background: #fcfdfa; border-radius: 10px;
    padding: 7px 9px; font-size: 7.8px; color: #5c736e; line-height: 1.85;
  }
  .legend b { color: #0e3e3b; }
  .legend .dots { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 3px; }
  .legend .dot { display: inline-flex; align-items: center; gap: 3px; }
  .legend .sw { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
  .sign { display: flex; justify-content: space-between; gap: 14px; margin-top: 20px; font-size: 8.5px; color: #5c736e; }
  .sign div { flex: 1; border-top: 1px dashed #a9e2d7; padding-top: 6px; text-align: center; }
  .foot {
    display: flex; justify-content: space-between; align-items: center; gap: 8px;
    margin-top: 10px; border-top: 2px solid #0e5d57; padding-top: 5px; font-size: 7.5px; color: #9db3ad;
  }
  .foot .brandline { display: inline-flex; align-items: center; gap: 4px; color: #0f746b; font-weight: 800; }
  @media print { body { font-size: 10px; } thead { display: table-header-group; } tr { page-break-inside: avoid; } }
</style></head>
<body>
  <div class="sheet">
    <header class="hero">
      <div class="hero-top">
        <div class="brand">
          <div class="logo"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V9l8-5 8 5v12"/><path d="M4 21h16M9 21v-6h6v6"/></svg></div>
          <div>
            <div class="school">${escapeHtml(teacher.school)}</div>
            <div class="teacher">${escapeHtml(teacher.role)}: ${escapeHtml(teacher.name)}</div>
          </div>
        </div>
        <div class="stamp">تقرير رسمي · ${escapeHtml(today)}</div>
      </div>
      <h1>تقرير إنجاز الطلاب</h1>
      <p class="lesson">${escapeHtml(lesson.title)} — ${escapeHtml(lesson.subject)} · ${escapeHtml(lesson.grade)} · ${escapeHtml(lesson.audience)}</p>
      <div class="hero-meta">
        <span>${escapeHtml(lesson.number)}</span>
        <span>رمز الصف: ${escapeHtml(cloud.classCode)}</span>
        <span>قاعدة البيانات: ${escapeHtml(cloud.provider || "محلي")}</span>
        <span class="gold">الدرجة الكلية من ${formatScore(TOTAL_MAX)}</span>
      </div>
    </header>

    <section class="stats">
      <div class="stat teal"><div class="k">طلاب السجل</div><div class="v">${ar(stats.total)} <small>طالب</small></div></div>
      <div class="stat"><div class="k">متوسط الإنجاز</div><div class="v" dir="ltr">${ar(stats.average)}%</div></div>
      <div class="stat gold"><div class="k">متوسط الدرجة</div><div class="v" dir="ltr">${formatScore(stats.averageScore)} <small>/ ${formatScore(TOTAL_MAX)}</small></div></div>
      <div class="stat green"><div class="k">أتموا الرحلة</div><div class="v">${ar(stats.finished)}</div></div>
      <div class="stat clay"><div class="k">تسليمات الطلاب</div><div class="v">${ar(classroom.submissions.length)}</div></div>
    </section>

    <section class="sections">${sectionCards}</section>

    <table>
      <thead>
        <tr>
          <th></th>
          <th>الطالب والشعبة</th>
          <th>المحطات</th>
          <th>الإنجاز</th>
          <th>الدرجة</th>
          <th>التسليم</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="legend">
      <b>طريقة الاحتساب:</b> كل محطة مكتملة (✓) = نصف درجة، والمحطات الأربع = ٢ درجات، وتُضاف درجة التقويم من ٣، فالدرجة الكلية من ٥.
      تُحسب نسبة الإنجاز من المحطات الأربع: أقرأ وأجيب، نشاط الحديث، مكانة الصلاة وحكم أدائها، التقويم.
      <div class="dots">
        <span class="dot"><i class="sw" style="background:#0e5d57"></i> ٤–٥ ممتاز</span>
        <span class="dot"><i class="sw" style="background:#bc8d31"></i> ٢٫٥–٣٫٩ جيد</span>
        <span class="dot"><i class="sw" style="background:#b8623d"></i> أقل من ٢٫٥ يحتاج متابعة</span>
        <span class="dot"><i class="sw" style="background:#d6aa4f"></i> الشعبة</span>
      </div>
    </div>

    <div class="sign">
      <div>توقيع المعلم: ${escapeHtml(teacher.name)}</div>
      <div>ملاحظات الإدارة</div>
      <div>توقيع ولي الأمر</div>
    </div>

    <footer class="foot">
      <span class="brandline"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V9l8-5 8 5v12"/><path d="M4 21h16M9 21v-6h6v6"/></svg> ${escapeHtml(teacher.school)}</span>
      <span>${escapeHtml(lesson.title)} · ${escapeHtml(lesson.grade)}</span>
      <span>تم إنشاء التقرير في <span dir="rtl">${escapeHtml(new Date().toLocaleString("ar-EG"))}</span></span>
    </footer>
  </div>
</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 400);
  };

  const filterOptions: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "الكل", count: counts.all },
    { id: "complete", label: "أتموا الرحلة", count: counts.complete },
    { id: "progress", label: "قيد التقدّم", count: counts.progress },
    { id: "notstarted", label: "لم يبدأوا", count: counts.notstarted },
    { id: "support", label: "يحتاجون متابعة", count: counts.support },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-title"
      dir="rtl"
      className="fixed inset-0 z-[70] overflow-y-auto bg-sand-50"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-brand-100/50 to-transparent" aria-hidden="true" />

      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-brand-900/10 bg-sand-50/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center gap-1.5 px-2 py-2.5 sm:gap-3 sm:px-6 sm:py-3 lg:px-8">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-800 text-gold-400 shadow-sm sm:h-11 sm:w-11">
            <Icon name="users" className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 id="teacher-title" className="truncate font-display text-base font-extrabold text-brand-900 sm:text-lg">
                لوحة المعلم
              </h1>
              <span className="hidden rounded-full bg-gold-400/20 px-2 py-0.5 text-[9px] font-bold text-gold-600 sm:inline">
                متابعة إنجاز الطلاب
              </span>
            </div>
            <p className="truncate text-[10px] font-medium text-muted">
              {teacher.name} · {teacher.school}
            </p>
            <p className="hidden truncate text-[9px] font-medium text-muted/80 sm:block">
              {lesson.title} · {lesson.grade} · {students.length === 1 ? "طالب واحد" : `${ar(students.length)} طلاب`}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              icon="download"
              onClick={handleExport}
              aria-label="تنزيل تقرير CSV"
              title="تنزيل تقرير CSV"
              className="px-2 sm:px-3.5"
            >
              <span className="hidden md:inline">تصدير CSV</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon="printer"
              onClick={handlePrint}
              aria-label="طباعة تقرير الصف"
              title="طباعة تقرير الصف"
              className="hidden px-2 sm:inline-flex lg:px-3.5"
            >
            </Button>
            <button
              type="button"
              onClick={onLock}
              aria-label="قفل لوحة المعلم"
              title="قفل لوحة المعلم"
              className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200 bg-white text-brand-700 transition hover:border-brand-400 hover:bg-brand-50"
            >
              <Icon name="lock" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="العودة إلى الدرس"
              className="grid h-9 w-9 place-items-center rounded-xl border border-brand-200 bg-white text-brand-700 transition hover:border-brand-400 hover:bg-brand-50"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1280px] px-3 pb-20 pt-5 sm:px-6 lg:px-8">
        {/* Shared roster */}
        <div
          className={cn(
            "mb-4 overflow-hidden rounded-2xl border shadow-soft",
            cloud.status === "ready"
              ? "border-brand-200 bg-brand-50/60"
              : cloud.status === "checking"
                ? "border-sand-300 bg-sand-100/60"
                : "border-orange-100 bg-orange-50/50",
          )}
        >
          <div className="flex flex-wrap items-center gap-2 p-3 sm:p-3.5">
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                cloud.status === "ready" ? "bg-brand-700 text-gold-400" : "bg-white text-gold-600",
              )}
            >
              <Icon name={cloud.status === "ready" ? "check" : cloud.status === "checking" ? "refresh" : "bulb"} className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold text-brand-900">
                {cloud.status === "ready" ? "السجل المشترك متصل" : cloud.status === "checking" ? "جارٍ فحص السجل المشترك..." : "السجل المشترك غير مفعّل"}
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold text-brand-700 ring-1 ring-brand-100" dir="ltr">
                  {cloud.classCode}
                </span>
                {cloud.status === "ready" && cloud.provider && (
                  <span className="rounded-full bg-gold-400/20 px-1.5 py-0.5 text-[9px] font-extrabold text-gold-600" dir="ltr">
                    {cloud.provider}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[9px] font-medium leading-5 text-muted">
                {cloud.status === "ready"
                  ? `كل الطلاب الذين يفتحون الدرس برمز الصف نفسه يظهرون هنا تلقائيًا${cloud.lastSync ? ` · آخر حفظ ${formatLastActive(cloud.lastSync)}` : ""}`
                  : cloud.status === "checking"
                    ? "نتحقق من إعداد قاعدة البيانات على هذا النشر."
                    : `${cloudErrorArabic(cloud.error ?? undefined)} لتفعيل سجل واحد لكل الطلاب: أضف تكامل Upstash Redis من Vercel Marketplace ثم أعد النشر.`}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {cloud.status === "ready" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[9px] font-bold text-brand-700 ring-1 ring-brand-100">
                  <Icon name="users" className="h-3 w-3" />
                  {ar(cloud.students.length)} في السجل
                </span>
              )}
              <Button
                size="sm"
                variant={cloud.status === "ready" ? "secondary" : "outline"}
                icon="refresh"
                onClick={() => {
                  void refreshRoster();
                }}
                disabled={refreshing || cloud.loading}
              >
                {refreshing ? "تحديث..." : "تحديث"}
              </Button>
              {cloud.status !== "ready" && (
                <Button
                  size="sm"
                  variant="gold"
                  icon="bulb"
                  onClick={() => setCloudPanelOpen(true)}
                  className="whitespace-nowrap"
                >
                  طريقة التفعيل
                </Button>
              )}
              <button
                type="button"
                onClick={() => setCloudPanelOpen((value) => !value)}
                aria-expanded={cloudPanelOpen}
                className="grid h-8 w-8 place-items-center rounded-lg border border-brand-200 bg-white text-brand-600 transition hover:bg-brand-50"
                title="إعداد رمز الصف"
              >
                <Icon name="pen" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {cloudPanelOpen && (
            <div className="border-t border-brand-100 bg-white/80 p-3">
              <label htmlFor="class-code" className="mb-1 block text-[10px] font-extrabold text-brand-900">
                رمز الصف المشترك
              </label>
              <p className="mb-2 text-[9px] leading-5 text-muted">
                يجب أن يكون الرمز نفسه على أجهزة الطلاب. الافتراضي <span dir="ltr" className="font-bold">SALAH-3-1</span>،
                وغيّره فقط إذا أردت فصلاً أو درسًا مستقلًا.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <input
                  id="class-code"
                  value={codeDraft}
                  onChange={(event) => setCodeDraft(event.target.value.toUpperCase())}
                  dir="ltr"
                  maxLength={32}
                  className="min-w-0 flex-1 rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
                />
                <Button
                  size="sm"
                  icon="check"
                  onClick={() => {
                    cloud.onClassCodeChange(codeDraft);
                    setCloudPanelOpen(false);
                    window.setTimeout(() => void refreshRoster(), 400);
                  }}
                  disabled={!codeDraft.trim()}
                >
                  حفظ وربط
                </Button>
              </div>
              {cloud.status !== "ready" && (
                <div className="mt-2 rounded-lg border border-sand-300 bg-sand-100 px-2.5 py-2 text-[9px] leading-5 text-gold-600">
                  <p className="mb-1 font-extrabold">اختر قاعدة بيانات مشتركة (أي خيار يكفي):</p>
                  <ol className="list-inside list-decimal space-y-0.5 font-medium">
                    <li>
                      <b dir="ltr">Supabase</b> (الأسهل): أنشئ مشروعًا، نفّذ جدول <b dir="ltr">salah_students</b> من
                      ملف DEPLOY.md، ثم أضف <b dir="ltr">SUPABASE_URL</b> و<b dir="ltr">SUPABASE_SERVICE_ROLE_KEY</b>.
                    </li>
                    <li>
                      <b dir="ltr">Neon / PostgreSQL</b>: أنشئ قاعدة، ثم أضف <b dir="ltr">DATABASE_URL</b>. يُنشئ
                      التطبيق الجدول تلقائيًا.
                    </li>
                    <li>أعد النشر، وتأكد من <b dir="ltr">/api/health</b>.</li>
                  </ol>
                  <p className="mt-1.5 border-t border-sand-300 pt-1.5">
                    ما زال <b dir="ltr">Upstash Redis</b> مدعومًا كخيار قديم، ويمكن فرض المزوّد عبر
                    <b dir="ltr"> STORAGE_PROVIDER</b>. التفاصيل الكاملة في DEPLOY.md.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Privacy + demo note */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 rounded-xl border border-brand-100 bg-white/70 px-3 py-2 text-[10px] font-medium leading-5 text-muted">
            <Icon name="lock" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
            {usingCloud
              ? `تظهر هنا أعمال الطلاب من جميع أجهزتهم، محفوظة في ${cloud.provider || "قاعدة البيانات المشتركة"}. لا تُرسل بيانات الطلاب إلى أي خدمة أخرى.`
              : "بيانات هذا الجهاز محفوظة في المتصفح. لتفعيل التجميع من جميع الأجهزة، اربط Supabase أو Neon/PostgreSQL كما في إعدادات Vercel."}
          </p>
          {hasDemo && (
            <button
              type="button"
              onClick={handleRemoveDemo}
              className="shrink-0 self-start rounded-full border border-gold-400/40 bg-sand-100 px-3 py-1.5 text-[10px] font-bold text-gold-600 transition hover:bg-sand-200 sm:self-auto"
            >
              توجد بيانات تجريبية — حذفها
            </button>
          )}
        </div>

        {/* Active student */}
        {active && (
          <div className="relative mb-4 overflow-hidden rounded-[24px] bg-gradient-to-l from-brand-800 via-brand-700 to-brand-600 p-4 text-white shadow-card sm:p-5">
            <div className="pattern-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
            <div className="relative flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold-400 font-display text-sm font-extrabold text-brand-900 shadow-lg sm:h-14 sm:w-14 sm:text-lg">
                {initials(active.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-gold-400">الطالب الحالي في الدرس</p>
                <h2 className="truncate font-display text-lg font-extrabold sm:text-xl">{active.name}</h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] leading-5 text-brand-100/80">
                  <span>
                    أتم {ar(completedCount(active))} من {ar(TASK_KEYS.length)} محطات · درجة التقويم {ar(active.evaluationScore)} من ٣ ·
                    آخر نشاط {formatLastActive(active.lastActive)}
                  </span>
                  {active.section && (
                    <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      الصف {active.section}
                    </span>
                  )}
                  {active.submittedAt && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-400/20 px-1.5 py-0.5 text-[9px] font-bold text-gold-400">
                      <Icon name="send" className="h-2.5 w-2.5" />
                      أرسل بطاقته
                    </span>
                  )}
                </p>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="flex min-w-0 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-2.5 py-2 sm:px-3">
                  <ProgressRing value={completionPercent(active)} size={36} stroke={3.5} className="[&_span]:text-white" />
                  <span className="text-[10px] font-bold text-brand-100">نسبة إنجاز الطالب</span>
                </span>
                <Button
                  size="sm"
                  variant="gold"
                  icon="book"
                  onClick={() => setActive(active, true)}
                  className="whitespace-nowrap px-2.5 sm:px-4"
                >
                  متابعة الدرس
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard icon="users" label="طلاب الصف" value={ar(stats.total)} hint="تشمل الطلاب المضافين والطالب الحالي" />
          <StatCard icon="chart" label="متوسط الإنجاز" value={`${ar(stats.average)}٪`} hint="متوسط المحطات المكتملة" tone="gold" />
          <StatCard
            icon="star"
            label="متوسط الدرجة"
            value={
              <span className="whitespace-nowrap" dir="ltr" title={`متوسط الدرجة من ${formatScore(TOTAL_MAX)}`}>
                {formatScore(stats.averageScore)}
                <span className="mx-0.5 text-sm text-muted">/</span>
                {formatScore(TOTAL_MAX)}
              </span>
            }
            hint="محطات (نصف درجة لكل محطة) + التقويم"
            tone="brand"
          />
          <StatCard icon="trophy" label="أتموا الرحلة" value={ar(stats.finished)} hint="من أكملوا المحطات الأربع" tone="plain" />
          <StatCard icon="send" label="تسليمات الطلاب" value={ar(classroom.submissions.length)} hint="أسماء وصفوف وصلت للمعلم" tone="brand" />
          <StatCard icon="bulb" label="يحتاجون متابعة" value={ar(stats.support)} hint="لديهم أخطاء أو تقويم غير مكتمل" tone="clay" />
        </div>

        {/* Student submissions */}
        <section
          aria-labelledby="submissions-title"
          className="mb-4 overflow-hidden rounded-[24px] border border-brand-100 bg-white shadow-soft"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-50 bg-brand-50/30 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-gold-400">
                <Icon name="send" className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 id="submissions-title" className="font-display text-sm font-extrabold text-brand-900 sm:text-base">
                  تسليمات الطلاب
                </h2>
                <p className="text-[10px] font-medium text-muted">
                  الاسم والصف اللذان يرسلهما الطالب في نهاية الدرس
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-brand-700 ring-1 ring-brand-100">
              <Icon name="send" className="h-3 w-3 text-brand-500" />
              {submissions.length === 1 ? "تسليم واحد" : `${ar(submissions.length)} تسليمات`}
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-5 sm:px-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sand-100 text-gold-600">
                <Icon name="bulb" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-extrabold text-brand-800">لم يصل أي تسليم بعد</p>
                <p className="mt-0.5 text-[10px] leading-5 text-muted">
                  بعد أن يكتب الطالب اسمه ويختار صفّه في نهاية الدرس ويضغط «إرسال إلى المعلم»، سيظهر تسليمه هنا مباشرة.
                </p>
              </div>
            </div>
          ) : (
            <ul className="grid sm:grid-cols-2">
              {submissions.slice(0, 8).map((submission) => {
                const student = students.find((item) => item.id === submission.studentId);
                return (
                  <li key={submission.id} className="border-b border-brand-50 last:border-b-0 sm:border-l sm:last:border-b-0 [&:nth-child(2n)]:sm:border-l-0">
                    <button
                      type="button"
                      disabled={!student}
                      onClick={() => student && setDetailId(student.id)}
                      className="flex w-full items-center gap-2.5 px-3.5 py-3 text-right transition hover:bg-sand-50/70 disabled:cursor-default"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-700 text-[10px] font-extrabold text-sand-50">
                        {initials(submission.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-[11px] font-extrabold text-brand-900">{submission.name}</span>
                          <span className="rounded-full bg-gold-400/20 px-1.5 py-0.5 text-[8px] font-extrabold text-gold-600">
                            {submission.section}
                          </span>
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] font-medium text-muted">
                          <span>{formatLastActive(submission.submittedAt)}</span>
                          <span className="text-brand-300">·</span>
                          <span>{ar(submission.percent)}٪ إنجاز</span>
                          <span className="text-brand-300">·</span>
                          <span>الدرجة {formatScore((submission.completedCount ?? 0) * 0.5 + submission.evaluationScore)}/{formatScore(TOTAL_MAX)}</span>
                        </span>
                      </span>
                      {student && <Icon name="eye" className="h-3.5 w-3.5 shrink-0 text-brand-400" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Students */}
        <section aria-labelledby="students-title" className="overflow-hidden rounded-[24px] border border-brand-100 bg-white shadow-soft">
          <div className="border-b border-brand-50 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name="users" className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h2 id="students-title" className="font-display text-sm font-extrabold text-brand-900 sm:text-base">
                    سجلّ إنجاز الطلاب
                  </h2>
                  <p className="text-[10px] font-medium text-muted">
                    اضغط على الطالب للتفاصيل، أو اختره ليصبح الطالب الحالي.
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
                {!hasDemo && (
                  <button
                    type="button"
                    onClick={handleSeedDemo}
                    className="rounded-full border border-dashed border-brand-300 bg-white px-3 py-1.5 text-[10px] font-bold text-brand-600 transition hover:border-brand-500 hover:bg-brand-50"
                  >
                    إضافة بيانات تجريبية للعرض
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setConfirmClearAll(true);
                    setConfirmReset(false);
                    setConfirmDelete(false);
                  }}
                  disabled={students.length === 0 || deletingAll}
                  className="inline-flex items-center gap-1.5 rounded-full border border-clay-400/40 bg-orange-50 px-3 py-1.5 text-[10px] font-extrabold text-clay-600 transition hover:bg-orange-100 disabled:opacity-40"
                >
                  <Icon name="trash" className="h-3.5 w-3.5" />
                  حذف جميع الطلاب
                </button>
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => void handleBackup()}
                disabled={backupBusy}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-[10px] font-extrabold text-brand-700 transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-50"
                title="تنزيل نسخة JSON لكل بيانات الطلاب"
              >
                <Icon name="download" className="h-3.5 w-3.5" />
                {backupBusy ? "جارٍ التنزيل..." : "نسخة احتياطية"}
              </button>
              <button
                type="button"
                onClick={() => restoreInputRef.current?.click()}
                disabled={backupBusy}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-[10px] font-extrabold text-brand-700 transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-50"
                title="استعادة بيانات الطلاب من ملف نسخة احتياطية"
              >
                <Icon name="refresh" className="h-3.5 w-3.5" />
                استعادة
              </button>
              <input
                ref={restoreInputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="ملف النسخة الاحتياطية"
                onChange={(event) => void handleRestoreFile(event.target.files?.[0])}
              />
              <span className="text-[9px] font-medium leading-5 text-muted">
                {cloud.status === "ready"
                  ? "النسخة الاحتياطية تحفظ أسماء الطلاب والدرجات والتسليمات، وتُستعاد بعد أي نشر جديد."
                  : "تحفظ بيانات هذا الجهاز وتُستعاد عليه؛ فعّل السجل المشترك لحفظها لكل الأجهزة."}
              </span>
            </div>

            {pendingRestore && (
              <div className="mt-3 rounded-xl border-2 border-brand-300 bg-brand-50 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-[11px] font-extrabold text-brand-900">
                      <Icon name="refresh" className="h-4 w-4 shrink-0 text-brand-600" />
                      استعادة {ar(pendingRestore.length)} سجلًا من النسخة الاحتياطية
                    </p>
                    <p className="mt-1 text-[9px] leading-5 text-brand-700">
                      سيتم تحديث السجلات التي تحمل المعرف نفسه، وإضافة السجلات الجديدة. الأسماء المعدّلة من المعلم تبقى محفوظة.
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setPendingRestore(null)}>
                      إلغاء
                    </Button>
                    <Button size="sm" icon="check" disabled={backupBusy} onClick={() => void confirmRestore()}>
                      {backupBusy ? "جارٍ الاستعادة..." : "تأكيد الاستعادة"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {confirmClearAll && (
              <div className="mt-3 flex flex-col gap-2 rounded-xl border-2 border-clay-400/40 bg-orange-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-[10px] font-bold leading-5 text-clay-600">
                  <Icon name="trash" className="mt-0.5 h-4 w-4 shrink-0" />
                  سيتم حذف جميع الطلاب وسجلاتهم وتسليماتهم نهائيًا (محليًا ومشتركًا). لا يمكن التراجع.
                </p>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setConfirmClearAll(false)}>
                    إلغاء
                  </Button>
                  <Button
                    size="sm"
                    variant="gold"
                    icon="trash"
                    disabled={deletingAll}
                    onClick={() => void handleDeleteAll()}
                    className="bg-clay-500 text-white hover:bg-clay-600"
                  >
                    {deletingAll ? "جارٍ الحذف..." : "تأكيد حذف الكل"}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="hide-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {filterOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFilter(option.id)}
                    aria-pressed={filter === option.id}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold transition",
                      filter === option.id
                        ? "border-brand-700 bg-brand-700 text-white"
                        : "border-brand-100 bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50",
                    )}
                  >
                    {option.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-[9px]",
                        filter === option.id ? "bg-white/20 text-white" : "bg-sand-100 text-gold-600",
                      )}
                    >
                      {ar(option.count)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative min-w-0 flex-1 lg:w-56 lg:flex-none">
                <Icon name="search" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-300" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ابحث باسم الطالب..."
                  aria-label="البحث عن طالب"
                  className="w-full rounded-xl border border-brand-100 bg-sand-50/60 py-2 pe-3 ps-9 text-xs font-medium text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
            </div>

            <form onSubmit={handleAdd} className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor="new-student" className="sr-only">
                اسم الطالب الجديد
              </label>
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-dashed border-brand-200 bg-sand-50/60 p-1.5 ps-3">
                <Icon name="userPlus" className="h-4 w-4 shrink-0 text-brand-500" />
                <input
                  id="new-student"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  maxLength={40}
                  placeholder="أضف اسم طالب إلى الصف..."
                  className="min-w-0 flex-1 bg-transparent py-1.5 text-xs font-bold text-ink outline-none placeholder:font-medium placeholder:text-muted/70"
                />
                <Button
                  type="submit"
                  size="sm"
                  icon="userPlus"
                  disabled={!newName.trim() || students.length >= MAX_STUDENTS}
                  className="shrink-0"
                >
                  إضافة
                </Button>
              </div>
              <p className="text-[9px] font-medium text-muted sm:max-w-[210px]">
                {students.length >= MAX_STUDENTS
                  ? "بلغت الحد الأقصى للطلاب."
                  : "عدد الطلاب المسجّلين يُحفظ تلقائيًا في هذا المتصفح."}
              </p>
            </form>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-5 py-14 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-400">
                <Icon name="search" className="h-6 w-6" />
              </span>
              <h3 className="font-display text-sm font-extrabold text-brand-900">لا توجد نتائج مطابقة</h3>
              <p className="max-w-sm text-[11px] leading-6 text-muted">
                جرّب البحث باسم آخر، أو غيّر مرشّح العرض. يمكنك أيضًا إضافة طالب جديد من الحقل أعلاه.
              </p>
              {onRequestNewStudent && (
                <Button size="sm" variant="secondary" icon="userPlus" onClick={onRequestNewStudent}>
                  بدء طالب جديد
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[940px] border-collapse text-right">
                  <thead>
                    <tr className="border-y border-brand-50 bg-sand-50/80 text-[10px] font-extrabold text-brand-600">
                      <th className="px-4 py-2.5 font-extrabold">الطالب</th>
                      <th className="px-3 py-2.5 font-extrabold">نسبة الإنجاز</th>
                      <th className="px-3 py-2.5 font-extrabold">المحطات</th>
                      <th className="px-3 py-2.5 font-extrabold">التقويم</th>
                      <th className="px-3 py-2.5 font-extrabold">
                        الدرجة الكلية
                        <span className="block text-[8px] font-medium text-muted">من {formatScore(TOTAL_MAX)}</span>
                      </th>
                      <th className="px-3 py-2.5 font-extrabold">الإجابات</th>
                      <th className="px-3 py-2.5 font-extrabold">آخر نشاط</th>
                      <th className="px-4 py-2.5 font-extrabold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-50">
                    {filtered.map((student, index) => {
                      const isActive = student.id === active?.id;
                      const percent = completionPercent(student);
                      return (
                        <tr
                          key={student.id}
                          className={cn(
                            "text-xs transition-colors hover:bg-sand-50/60",
                            isActive && "bg-brand-50/40",
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={cn(
                                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-extrabold",
                                  avatarTones[index % avatarTones.length],
                                )}
                              >
                                {initials(student.name)}
                              </span>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="truncate text-[12px] font-extrabold text-brand-900">{student.name}</p>
                                  {isActive && (
                                    <span className="rounded-full bg-brand-700 px-1.5 py-0.5 text-[8px] font-bold text-white">
                                      الطالب الحالي
                                    </span>
                                  )}
                                  {student.demo && (
                                    <span className="rounded-full bg-sand-200 px-1.5 py-0.5 text-[8px] font-bold text-gold-600">
                                      تجريبي
                                    </span>
                                  )}
                                  {student.section && (
                                    <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[8px] font-bold text-brand-700">
                                      {student.section}
                                    </span>
                                  )}
                                  {(student as CloudStudent).cloud && (
                                    <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[8px] font-bold text-brand-600" title="وارد من جهاز الطالب">
                                      مشترك
                                    </span>
                                  )}
                                  {student.submittedAt && (
                                    <span
                                      className="inline-flex items-center gap-0.5 rounded-full bg-gold-400/20 px-1.5 py-0.5 text-[8px] font-bold text-gold-600"
                                      title={`أرسل بطاقته ${formatLastActive(student.submittedAt)}`}
                                    >
                                      <Icon name="send" className="h-2.5 w-2.5" />
                                      سلّم
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[9px] font-medium text-muted">
                                  أنشئ في {formatFullDate(student.createdAt).replace(/^ال/, "")}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-brand-100">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-[width] duration-500",
                                    percent === 100 ? "bg-brand-600" : percent >= 50 ? "bg-gold-400" : "bg-clay-400",
                                  )}
                                  style={{ width: `${Math.max(percent, 4)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-extrabold tabular-nums text-brand-800">{ar(percent)}٪</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              {TASKS.map((task) => (
                                <span
                                  key={task.key}
                                  title={`${task.label}: ${student.completed[task.key] ? "مكتمل" : "غير مكتمل"}`}
                                  className={cn(
                                    "grid h-5 w-5 place-items-center rounded-md",
                                    student.completed[task.key]
                                      ? "bg-brand-600 text-white"
                                      : "border border-brand-100 bg-white text-brand-200",
                                  )}
                                >
                                  <Icon name={student.completed[task.key] ? "check" : stationIcons[task.key]} className="h-3 w-3" />
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3].map((step) => (
                                <span
                                  key={step}
                                  className={cn(
                                    "h-2.5 w-2.5 rounded-full",
                                    student.evaluationScore >= step ? "bg-gold-400" : "bg-brand-100",
                                  )}
                                />
                              ))}
                              <span className="ms-1 text-[10px] font-extrabold text-brand-800">
                                {ar(student.evaluationScore)}/٣
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="inline-flex items-baseline gap-1 rounded-lg bg-sand-100/80 px-2 py-1">
                              <span className="whitespace-nowrap font-display text-[13px] font-extrabold text-brand-900" dir="ltr">
                                {formatScore(totalScore(student))}
                                <span className="mx-0.5 text-[9px] text-muted">/</span>
                                {formatScore(TOTAL_MAX)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[8px] font-medium text-muted">
                              محطات {formatScore(stationScore(student))} + تقويم {formatScore(student.evaluationScore)}
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold text-brand-700">
                                <Icon name="check" className="h-2.5 w-2.5" />
                                {ar(totalCorrect(student))}
                              </span>
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-clay-600">
                                <Icon name="close" className="h-2.5 w-2.5" />
                                {ar(totalIncorrect(student))}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-[10px] font-medium text-muted">{formatLastActive(student.lastActive)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setDetailId(student.id)}
                                aria-label={`تفاصيل ${student.name}`}
                                title="تفاصيل الطالب"
                                className="grid h-7 w-7 place-items-center rounded-lg border border-brand-100 bg-white text-brand-600 transition hover:border-brand-300 hover:bg-brand-50"
                              >
                                <Icon name="eye" className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setActive(student)}
                                disabled={isActive}
                                aria-label={`اختيار ${student.name} كطالب حالي`}
                                title={isActive ? "الطالب الحالي" : "اختيار كطالب حالي"}
                                className={cn(
                                  "grid h-7 w-7 place-items-center rounded-lg border transition",
                                  isActive
                                    ? "cursor-default border-brand-700 bg-brand-700 text-white"
                                    : "border-brand-100 bg-white text-brand-600 hover:border-brand-300 hover:bg-brand-50",
                                )}
                              >
                                <Icon name="check" className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailId(student.id);
                                  setConfirmDelete(true);
                                  setConfirmReset(false);
                                }}
                                aria-label={`حذف ${student.name}`}
                                title="حذف الطالب"
                                className="grid h-7 w-7 place-items-center rounded-lg border border-clay-400/30 bg-white text-clay-600 transition hover:bg-orange-50"
                              >
                                <Icon name="trash" className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-brand-50 md:hidden">
                {filtered.map((student, index) => {
                  const isActive = student.id === active?.id;
                  const percent = completionPercent(student);
                  return (
                    <li key={student.id} className={cn("p-3.5", isActive && "bg-brand-50/40")}>
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-full text-[10px] font-extrabold",
                            avatarTones[index % avatarTones.length],
                          )}
                        >
                          {initials(student.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-xs font-extrabold text-brand-900">{student.name}</p>
                            {isActive && (
                              <span className="rounded-full bg-brand-700 px-1.5 py-0.5 text-[8px] font-bold text-white">
                                الطالب الحالي
                              </span>
                            )}
                            {student.demo && (
                              <span className="rounded-full bg-sand-200 px-1.5 py-0.5 text-[8px] font-bold text-gold-600">تجريبي</span>
                            )}
                            {student.section && (
                              <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[8px] font-bold text-brand-700">
                                {student.section}
                              </span>
                            )}
                            {student.submittedAt && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-400/20 px-1.5 py-0.5 text-[8px] font-bold text-gold-600">
                                <Icon name="send" className="h-2.5 w-2.5" />
                                سلّم
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-100">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  percent === 100 ? "bg-brand-600" : percent >= 50 ? "bg-gold-400" : "bg-clay-400",
                                )}
                                style={{ width: `${Math.max(percent, 4)}%` }}
                              />
                            </div>
                            <span className="shrink-0 text-[10px] font-extrabold text-brand-800">{ar(percent)}٪</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-bold text-muted">
                            <span className="rounded-full bg-sand-100 px-1.5 py-0.5 text-brand-800">
                              الدرجة: {formatScore(totalScore(student))}/{formatScore(TOTAL_MAX)}
                            </span>
                            <span>المحطات: {formatScore(stationScore(student))}/{formatScore(STATIONS_MAX)}</span>
                            <span className="text-brand-300">|</span>
                            <span>التقويم: {ar(student.evaluationScore)}/٣</span>
                            <span className="text-brand-300">|</span>
                            <span>صحيحة: {ar(totalCorrect(student))}</span>
                            <span className="text-brand-300">|</span>
                            <span>أخطاء: {ar(totalIncorrect(student))}</span>
                            <span className="text-brand-300">|</span>
                            <span>{formatLastActive(student.lastActive)}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              {TASKS.map((task) => (
                                <span
                                  key={task.key}
                                  title={`${task.label}: ${student.completed[task.key] ? "مكتمل" : "غير مكتمل"}`}
                                  className={cn(
                                    "grid h-5 w-5 place-items-center rounded-md",
                                    student.completed[task.key]
                                      ? "bg-brand-600 text-white"
                                      : "border border-brand-100 bg-white text-brand-200",
                                  )}
                                >
                                  <Icon name={student.completed[task.key] ? "check" : stationIcons[task.key]} className="h-3 w-3" />
                                </span>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setDetailId(student.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-2 py-1 text-[9px] font-bold text-brand-700"
                            >
                              <Icon name="eye" className="h-3 w-3" />
                              التفاصيل
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDetailId(student.id);
                                setConfirmDelete(true);
                                setConfirmReset(false);
                              }}
                              aria-label={`حذف ${student.name}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-clay-400/30 bg-white px-2 py-1 text-[9px] font-bold text-clay-600"
                            >
                              <Icon name="trash" className="h-3 w-3" />
                              حذف
                            </button>
                          </div>
                          <div className="mt-1.5 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setActive(student)}
                              disabled={isActive}
                              className={cn(
                                "rounded-lg border px-2 py-1 text-[9px] font-bold transition",
                                isActive
                                  ? "cursor-default border-brand-100 bg-brand-50 text-brand-600"
                                  : "border-brand-700 bg-brand-700 text-white",
                              )}
                            >
                              {isActive ? "الطالب الحالي في الدرس" : "تعيين كطالب حالي"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <p className="mt-4 text-center text-[9px] font-medium leading-5 text-muted">
          تُسجَّل نتيجة كل محاولة عند تحقّق الطالب من إجابته. درجة التقويم من ثلاثة أنشطة، ونسبة الإنجاز من أربع محطات.
        </p>
      </div>

      {/* Message toast */}
      {message && (
        <div
          role="status"
          className={cn(
            "fixed inset-x-0 bottom-5 z-[85] mx-auto flex w-[calc(100%-2rem)] max-w-md items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-lift",
            message.type === "error" ? "bg-clay-600" : "bg-brand-800",
          )}
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-400 text-brand-900">
            <Icon name={message.type === "error" ? "close" : "check"} className="h-4 w-4" />
          </span>
          <p className="flex-1 leading-6">{message.text}</p>
          <button
            type="button"
            onClick={() => setMessage(null)}
            aria-label="إغلاق الرسالة"
            className="grid h-6 w-6 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
          >
            <Icon name="close" className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Details drawer */}
      {detail && (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="إغلاق تفاصيل الطالب"
            onClick={() => setDetailId(null)}
            className="absolute inset-0 bg-brand-900/45 backdrop-blur-[2px]"
          />
          <aside
            role="region"
            aria-label={`تفاصيل الطالب ${detail.name}`}
            className="absolute inset-y-0 left-0 w-full max-w-[460px] overflow-y-auto overscroll-contain bg-sand-50 p-0 shadow-2xl"
          >
            <div className="relative overflow-hidden bg-brand-800 p-4 text-white sm:p-5">
              <div className="pattern-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold-400 font-display text-base font-extrabold text-brand-900">
                    {initials(detail.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-gold-400">بطاقة متابعة الطالب</p>
                    <h2 className="truncate font-display text-base font-extrabold">{detail.name}</h2>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[9px] font-medium text-brand-100/75">
                      <span>{detail.id === active?.id ? "الطالب الحالي في الدرس" : "طالب في الصف"}</span>
                      {detail.section && (
                        <span className="rounded-full bg-white/15 px-1.5 py-0.5 font-bold text-white">الصف {detail.section}</span>
                      )}
                      {detail.submittedAt && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-400/20 px-1.5 py-0.5 font-bold text-gold-400">
                          <Icon name="send" className="h-2.5 w-2.5" />
                          سلّم بطاقته
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailId(null)}
                  aria-label="إغلاق البطاقة"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </div>

              <div className="relative mt-4 flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-2.5">
                <ProgressRing value={completionPercent(detail)} size={46} stroke={4.5} className="[&_span]:text-white" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold">
                    أتم {ar(completedCount(detail))} من {ar(TASK_KEYS.length)} محطات
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {TASKS.map((task) => (
                      <span
                        key={task.key}
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[8px] font-bold",
                          detail.completed[task.key] ? "bg-gold-400 text-brand-900" : "bg-white/10 text-brand-100/70",
                        )}
                      >
                        {task.short}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 sm:p-5">
              <div className="relative overflow-hidden rounded-2xl border border-gold-400/50 bg-gradient-to-l from-sand-100 to-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[9px] font-bold text-gold-600">الدرجة الكلية</p>
                    <p className="whitespace-nowrap font-display text-xl font-extrabold leading-tight text-brand-900" dir="ltr">
                      {formatScore(totalScore(detail))}
                      <span className="mx-0.5 text-sm font-bold text-muted">/</span>
                      {formatScore(TOTAL_MAX)}
                    </p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-400 text-brand-900">
                    <Icon name="star" className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-[9px] font-bold">
                  <span className="flex items-center justify-between gap-1 rounded-lg bg-white/80 px-2 py-1 text-brand-700">
                    <span>المحطات</span>
                    <span dir="ltr">
                      {formatScore(stationScore(detail))} / {formatScore(STATIONS_MAX)}
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-1 rounded-lg bg-white/80 px-2 py-1 text-gold-600">
                    <span>التقويم</span>
                    <span dir="ltr">
                      {ar(detail.evaluationScore)} / {ar(3)}
                    </span>
                  </span>
                </div>
                <p className="mt-1.5 text-[8px] font-medium leading-4 text-muted">
                  كل محطة مكتملة (علامة صح) = نصف درجة، وتُضاف درجة التقويم من ٣.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "صحيحة", value: totalCorrect(detail), tone: "text-brand-700" },
                  { label: "أخطاء", value: totalIncorrect(detail), tone: "text-clay-600" },
                  { label: "المحطات", value: `${formatScore(stationScore(detail))}/${formatScore(STATIONS_MAX)}`, tone: "text-brand-700" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-brand-100 bg-white p-2.5 text-center">
                    <p className={cn("font-display text-base font-extrabold", item.tone)}>
                      {typeof item.value === "number" ? ar(item.value) : item.value}
                    </p>
                    <p className="mt-0.5 text-[9px] font-bold text-muted">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-brand-100 bg-white p-3">
                <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold text-brand-900">
                  <Icon name="chart" className="h-3.5 w-3.5 text-brand-500" />
                  تفصيل المحطات
                </h3>
                <ul className="space-y-1.5">
                  {TASKS.map((task) => {
                    const result = detail.results[task.key];
                    const attempts = result.correct + result.incorrect;
                    return (
                      <li key={task.key} className="flex items-center gap-2 rounded-lg bg-sand-50/70 p-2">
                        <span
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                            detail.completed[task.key] ? "bg-brand-600 text-white" : "bg-white text-brand-300",
                          )}
                        >
                          <Icon name={stationIcons[task.key]} className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-extrabold text-brand-900">{task.label}</p>
                          <p className="text-[8px] font-medium text-muted">
                            {attempts > 0
                              ? `${ar(result.correct)} صحيحة · ${ar(result.incorrect)} خاطئة`
                              : "لا توجد محاولات مسجّلة"}
                          </p>
                          <p className="mt-0.5 text-[8px] font-bold text-gold-600">
                            {detail.completed[task.key] ? "تحتسب نصف درجة (٠٫٥)" : "بدون درجة — لم تكتمل المحطة"}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold",
                            detail.completed[task.key]
                              ? "bg-brand-50 text-brand-700"
                              : result.lastStatus === "incorrect"
                                ? "bg-orange-50 text-clay-600"
                                : "bg-sand-100 text-muted",
                          )}
                        >
                          {detail.completed[task.key]
                            ? "مكتملة"
                            : result.lastStatus === "incorrect"
                              ? "تحتاج مراجعة"
                              : "لم تكتمل"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-xl border border-brand-100 bg-white p-3">
                <label htmlFor="student-name" className="mb-1.5 block text-[10px] font-extrabold text-brand-900">
                  اسم الطالب
                </label>
                <input
                  id="student-name"
                  value={detailName}
                  onChange={(event) => setDetailName(event.target.value)}
                  maxLength={40}
                  placeholder="اسم الطالب"
                  className="w-full rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-bold text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
                />

                <p className="mb-1.5 mt-2.5 block text-[10px] font-extrabold text-brand-900">الشعبة</p>
                <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="شعبة الطالب">
                  {(["٣/١", "٣/٢"] as const).map((section) => {
                    const selected = detailSection === section;
                    return (
                      <button
                        key={section}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setDetailSection(section)}
                        className={cn(
                          "flex items-center justify-between gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-extrabold transition",
                          selected
                            ? "border-brand-600 bg-brand-50 text-brand-900"
                            : "border-brand-200 bg-white text-brand-600 hover:border-brand-300 hover:bg-sand-50",
                        )}
                      >
                        <span>الصف {section}</span>
                        <span
                          className={cn(
                            "grid h-4 w-4 place-items-center rounded-full border-2",
                            selected ? "border-brand-600 bg-brand-600 text-white" : "border-brand-200",
                          )}
                        >
                          {selected && <Icon name="check" className="h-2.5 w-2.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  icon={renaming ? "refresh" : "pen"}
                  onClick={() => void handleSaveStudentData()}
                  disabled={
                    renaming ||
                    detailName.trim().length < 2 ||
                    (detailName.trim() === detail.name && detailSection === detail.section)
                  }
                  className="mt-2.5 w-full"
                >
                  {renaming ? "جارٍ الحفظ..." : "حفظ اسم الطالب والشعبة"}
                </Button>
                <p className="mt-1.5 flex items-start gap-1.5 text-[9px] leading-4 text-muted">
                  <Icon name="shield" className="mt-0.5 h-3 w-3 shrink-0 text-brand-400" />
                  {cloud.status === "ready"
                    ? "تُحفظ البيانات في السجل المشترك وتظهر لجميع الأجهزة، ولا يستطيع جهاز الطالب الكتابة فوقها."
                    : "تُحفظ على هذا الجهاز. فعّل السجل المشترك ليُحفظ لكل الأجهزة وبعد النشر."}
                </p>
              </div>

              <div className="rounded-xl border border-brand-100 bg-white p-3">
                <label htmlFor="teacher-note" className="mb-1.5 block text-[10px] font-extrabold text-brand-900">
                  ملاحظة المعلم
                </label>
                <textarea
                  id="teacher-note"
                  value={detailNotes}
                  onChange={(event) => setDetailNotes(event.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="مثال: يحتاج إلى مراجعة حديث أركان الإسلام..."
                  className="w-full resize-none rounded-lg border border-brand-200 p-2 text-[11px] leading-6 text-ink outline-none placeholder:text-muted/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
                />
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-[8px] font-medium text-muted">{ar(detailNotes.length)}/٥٠٠</span>
                  <Button
                    size="sm"
                    icon="check"
                    onClick={handleSaveNotes}
                    disabled={!detailIsLocal || detailNotes === detail.notes}
                  >
                    حفظ الملاحظة
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-brand-100 bg-white p-3">
                <h3 className="mb-2 text-[10px] font-extrabold text-brand-900">بيانات المتابعة</h3>
                <dl className="space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted">آخر نشاط</dt>
                    <dd className="font-bold text-brand-800">{formatLastActive(detail.lastActive)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted">الصف الدراسي</dt>
                    <dd className="font-bold text-brand-800">{detail.section || "لم يُحدّد"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted">تسليم البطاقة للمعلم</dt>
                    <dd className="font-bold text-brand-800">
                      {detail.submittedAt ? formatLastActive(detail.submittedAt) : "لم يسلّم بعد"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted">تاريخ الإضافة</dt>
                    <dd className="font-bold text-brand-800">{formatFullDate(detail.createdAt)}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-2 pt-1">
                {!detailIsLocal && (
                  <p className="flex items-start gap-1.5 rounded-xl border border-gold-400/40 bg-sand-100 px-2.5 py-2 text-[9px] leading-5 text-gold-600">
                    <Icon name="lock" className="mt-0.5 h-3 w-3 shrink-0" />
                    هذا السجل وصل من جهاز الطالب عبر السجل المشترك. يمكنك مراجعته وحذفه من هنا، أما التعديل والتصفير فيخصّان سجل هذا الجهاز.
                  </p>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  icon="book"
                  className="w-full"
                  disabled={!detailIsLocal}
                  onClick={() => setActive(detail, true)}
                >
                  {detail.id === active?.id ? "متابعة الدرس بهذا الطالب" : "تعيين كطالب حالي ومتابعة الدرس"}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant={confirmReset ? "gold" : "outline"}
                    icon="refresh"
                    onClick={() => {
                      if (!confirmReset) {
                        setConfirmReset(true);
                        setConfirmDelete(false);
                        return;
                      }
                      handleReset(detail.id);
                    }}
                    className="w-full"
                    disabled={!detailIsLocal}
                  >
                    {confirmReset ? "تأكيد التصفير" : "تصفير التقدّم"}
                  </Button>
                  <Button
                    size="sm"
                    variant={confirmDelete ? "gold" : "outline"}
                    icon="trash"
                    disabled={deletingId === detail.id || deletingAll}
                    onClick={() => {
                      if (!confirmDelete) {
                        setConfirmDelete(true);
                        setConfirmReset(false);
                        return;
                      }
                      void handleDelete(detail);
                    }}
                    className={cn("w-full", !confirmDelete && "text-clay-600 hover:border-clay-400 hover:bg-orange-50")}
                  >
                    {deletingId === detail.id ? "جارٍ الحذف..." : confirmDelete ? "تأكيد الحذف" : "حذف الطالب"}
                  </Button>
                </div>
                {(confirmReset || confirmDelete) && (
                  <p className="rounded-lg bg-orange-50 px-2.5 py-1.5 text-center text-[9px] font-bold leading-5 text-clay-600">
                    {confirmDelete
                      ? "سيُحذف الطالب وسجلّه وتسليمه نهائيًا من هذا الجهاز ومن السجل المشترك. اضغط «تأكيد الحذف» للمتابعة."
                      : "ستُصفّر المحطات والمحاولات، ويبقى اسم الطالب وملاحظته."}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
