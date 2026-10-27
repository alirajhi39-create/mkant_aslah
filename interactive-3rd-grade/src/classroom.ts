export const TASK_KEYS = ["read", "activity", "status", "evaluation"] as const;
export type TaskKey = (typeof TASK_KEYS)[number];

export const TASKS: { key: TaskKey; label: string; short: string }[] = [
  { key: "read", label: "أقرأ وأجيب", short: "أقرأ" },
  { key: "activity", label: "نشاط الحديث", short: "نشاط" },
  { key: "status", label: "مكانة الصلاة وحكم أدائها", short: "المكانة" },
  { key: "evaluation", label: "التقويم", short: "التقويم" },
];

export const TASK_LABELS: Record<TaskKey, string> = {
  read: "أقرأ وأجيب",
  activity: "نشاط الحديث",
  status: "مكانة الصلاة وحكم أدائها",
  evaluation: "التقويم",
};

export type StationResult = {
  correct: number;
  incorrect: number;
  lastStatus: "correct" | "incorrect" | null;
  updatedAt: string | null;
};

export const STUDENT_SECTIONS = ["٣/١", "٣/٢"] as const;
export type StudentSection = (typeof STUDENT_SECTIONS)[number] | "";

export type Student = {
  id: string;
  name: string;
  section: StudentSection;
  submittedAt: string | null;
  createdAt: string;
  lastActive: string;
  completed: Record<TaskKey, boolean>;
  results: Record<TaskKey, StationResult>;
  evaluationScore: number;
  notes: string;
  demo?: boolean;
  imported?: boolean;
};

export type StudentSubmission = {
  id: string;
  studentId: string;
  name: string;
  section: Exclude<StudentSection, "">;
  percent: number;
  completedCount: number;
  evaluationScore: number;
  submittedAt: string;
};

export type Classroom = {
  version: 2;
  activeId: string;
  students: Student[];
  submissions: StudentSubmission[];
};

const CLASSROOM_KEY = "salah-classroom-v2";
const LEGACY_PROGRESS_KEY = "salah-lesson-progress-v1";
export const MAX_STUDENTS = 40;
export const TEACHER_PASSWORD = "139613";
export const TEACHER_UNLOCK_KEY = "salah-teacher-unlocked";

export const nowISO = () => new Date().toISOString();

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `student-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const emptyCompleted = (): Record<TaskKey, boolean> => ({
  read: false,
  activity: false,
  status: false,
  evaluation: false,
});

const emptyStation = (): StationResult => ({
  correct: 0,
  incorrect: 0,
  lastStatus: null,
  updatedAt: null,
});

const emptyResults = (): Record<TaskKey, StationResult> => ({
  read: emptyStation(),
  activity: emptyStation(),
  status: emptyStation(),
  evaluation: emptyStation(),
});

export function createStudent(name: string, options?: { demo?: boolean }): Student {
  const timestamp = nowISO();
  return {
    id: makeId(),
    name: name.trim() || "طالب بدون اسم",
    section: "",
    submittedAt: null,
    createdAt: timestamp,
    lastActive: timestamp,
    completed: emptyCompleted(),
    results: emptyResults(),
    evaluationScore: 0,
    notes: "",
    ...(options?.demo ? { demo: true } : {}),
  };
}

function sanitizeStudent(raw: unknown): Student | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Partial<Student>;
  if (typeof record.id !== "string" || typeof record.name !== "string") return null;

  const completed = emptyCompleted();
  TASK_KEYS.forEach((key) => {
    completed[key] = Boolean(record.completed?.[key]);
  });

  const results = emptyResults();
  TASK_KEYS.forEach((key) => {
    const value = record.results?.[key];
    if (value && typeof value === "object") {
      results[key] = {
        correct: Math.max(0, Number(value.correct) || 0),
        incorrect: Math.max(0, Number(value.incorrect) || 0),
        lastStatus:
          value.lastStatus === "correct" || value.lastStatus === "incorrect" ? value.lastStatus : null,
        updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
      };
    }
  });

  return {
    id: record.id,
    name: record.name.slice(0, 48),
    section: STUDENT_SECTIONS.includes(record.section as (typeof STUDENT_SECTIONS)[number])
      ? (record.section as StudentSection)
      : "",
    submittedAt: typeof record.submittedAt === "string" ? record.submittedAt : null,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : nowISO(),
    lastActive: typeof record.lastActive === "string" ? record.lastActive : nowISO(),
    completed,
    results,
    evaluationScore: Math.min(3, Math.max(0, Number(record.evaluationScore) || 0)),
    notes: typeof record.notes === "string" ? record.notes.slice(0, 500) : "",
    ...(record.demo ? { demo: true } : {}),
    ...(record.imported ? { imported: true } : {}),
  };
}

function sanitizeSubmission(raw: unknown): StudentSubmission | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Partial<StudentSubmission>;
  if (typeof record.id !== "string" || typeof record.studentId !== "string" || typeof record.name !== "string") {
    return null;
  }
  if (!STUDENT_SECTIONS.includes(record.section as (typeof STUDENT_SECTIONS)[number])) return null;
  return {
    id: record.id,
    studentId: record.studentId,
    name: record.name.slice(0, 48),
    section: record.section as Exclude<StudentSection, "">,
    percent: Math.min(100, Math.max(0, Number(record.percent) || 0)),
    completedCount: Math.min(TASK_KEYS.length, Math.max(0, Number(record.completedCount) || 0)),
    evaluationScore: Math.min(3, Math.max(0, Number(record.evaluationScore) || 0)),
    submittedAt: typeof record.submittedAt === "string" ? record.submittedAt : nowISO(),
  };
}

function legacyProgress(): Record<TaskKey, boolean> | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Record<TaskKey, boolean>>;
    const completed = emptyCompleted();
    TASK_KEYS.forEach((key) => {
      completed[key] = Boolean(parsed[key]);
    });
    return completed;
  } catch {
    return null;
  }
}

export function loadClassroom(): Classroom {
  try {
    const raw = window.localStorage.getItem(CLASSROOM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Classroom>;
      const students = Array.isArray(parsed.students)
        ? parsed.students.map(sanitizeStudent).filter((student): student is Student => Boolean(student))
        : [];
      if (students.length > 0) {
        const activeId = students.some((student) => student.id === parsed.activeId)
          ? (parsed.activeId as string)
          : students[0].id;
        const submissions = Array.isArray(parsed.submissions)
          ? parsed.submissions
              .map(sanitizeSubmission)
              .filter((submission): submission is StudentSubmission => Boolean(submission))
              .filter((submission) => students.some((student) => student.id === submission.studentId))
          : [];
        return { version: 2, activeId, students, submissions };
      }
    }
  } catch {
    /* نبدأ بصف جديد */
  }

  const student = createStudent("طالب الصف الثالث");
  const legacy = legacyProgress();
  if (legacy) {
    student.completed = legacy;
    student.lastActive = nowISO();
  }
  return { version: 2, activeId: student.id, students: [student], submissions: [] };
}

export function saveClassroom(classroom: Classroom) {
  try {
    window.localStorage.setItem(CLASSROOM_KEY, JSON.stringify(classroom));
    window.localStorage.setItem(
      LEGACY_PROGRESS_KEY,
      JSON.stringify(currentStudent(classroom).completed),
    );
  } catch {
    /* التخزين المحلي غير متاح */
  }
}

export function currentStudent(classroom: Classroom): Student {
  return classroom.students.find((student) => student.id === classroom.activeId) ?? classroom.students[0];
}

export const completedCount = (student: Student) =>
  TASK_KEYS.filter((key) => student.completed[key]).length;

/* -------------------------------- الدرجات -------------------------------- */
/** كل محطة مكتملة (علامة صح) = نصف درجة، والدرجة الكلية = درجات المحطات + درجة التقويم. */
export const STATION_MARK = 0.5;
export const STATIONS_MAX = TASK_KEYS.length * STATION_MARK; // ٢
export const EVALUATION_MAX = 3;
export const TOTAL_MAX = STATIONS_MAX + EVALUATION_MAX; // ٥

export const stationScore = (student: Student) => completedCount(student) * STATION_MARK;

export const totalScore = (student: Student) =>
  Math.min(TOTAL_MAX, Math.round((stationScore(student) + Math.max(0, Math.min(EVALUATION_MAX, student.evaluationScore))) * 10) / 10);

export const formatScore = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return rounded.toLocaleString("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
};

export const formatTotalScore = (student: Student) => `${formatScore(totalScore(student))} من ${formatScore(TOTAL_MAX)}`;

export const completionPercent = (student: Student) =>
  Math.round((completedCount(student) / TASK_KEYS.length) * 100);

export const totalCorrect = (student: Student) =>
  TASK_KEYS.reduce((sum, key) => sum + student.results[key].correct, 0);

export const totalIncorrect = (student: Student) =>
  TASK_KEYS.reduce((sum, key) => sum + student.results[key].incorrect, 0);

export const needsSupport = (student: Student) =>
  totalIncorrect(student) > 0 || (completedCount(student) > 0 && student.evaluationScore < 3);

export const emptyResult = emptyStation;

export function updateStudent(
  classroom: Classroom,
  studentId: string,
  update: (student: Student) => Student,
): Classroom {
  return {
    ...classroom,
    students: classroom.students.map((student) => (student.id === studentId ? update(student) : student)),
  };
}

export function addStudent(classroom: Classroom, name: string): { classroom: Classroom; student: Student } {
  const student = createStudent(name);
  return {
    student,
    classroom: { ...classroom, students: [...classroom.students, student] },
  };
}

export function submitStudentData(
  classroom: Classroom,
  studentId: string,
  data: { name: string; section: Exclude<StudentSection, ""> },
): Classroom {
  const student = classroom.students.find((item) => item.id === studentId);
  if (!student) return classroom;
  const timestamp = nowISO();
  const name = data.name.trim().slice(0, 48);
  const percent = completionPercent(student);
  const count = completedCount(student);

  const submission: StudentSubmission = {
    id: classroom.submissions.find((item) => item.studentId === studentId)?.id ?? makeId(),
    studentId,
    name,
    section: data.section,
    percent,
    completedCount: count,
    evaluationScore: student.evaluationScore,
    submittedAt: timestamp,
  };

  return {
    ...classroom,
    students: classroom.students.map((item) =>
      item.id === studentId
        ? { ...item, name, section: data.section, submittedAt: timestamp, lastActive: timestamp }
        : item,
    ),
    submissions: [
      submission,
      ...classroom.submissions.filter((item) => item.studentId !== studentId),
    ],
  };
}

export function withResult(student: Student, task: TaskKey, correct: boolean): Student {
  const previous = student.results[task];
  const timestamp = nowISO();
  return {
    ...student,
    lastActive: timestamp,
    results: {
      ...student.results,
      [task]: {
        correct: previous.correct + (correct ? 1 : 0),
        incorrect: previous.incorrect + (correct ? 0 : 1),
        lastStatus: correct ? "correct" : "incorrect",
        updatedAt: timestamp,
      },
    },
  };
}

export function withCompletion(student: Student, task: TaskKey): Student {
  if (student.completed[task]) return { ...student, lastActive: nowISO() };
  return {
    ...student,
    lastActive: nowISO(),
    completed: { ...student.completed, [task]: true },
  };
}

export function formatLastActive(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "غير معروف";
  const diff = Date.now() - date.getTime();
  const day = 24 * 60 * 60 * 1000;
  const time = date.toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" });
  if (diff < 60 * 1000) return "الآن";
  if (date.toDateString() === new Date().toDateString()) return `اليوم · ${time}`;
  if (diff < 2 * day) return `أمس · ${time}`;
  if (diff < 7 * day) return `منذ ${Math.floor(diff / day).toLocaleString("ar-EG")} أيام`;
  return date.toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" });
}

export function formatFullDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function demoClassroom(current: Classroom): Classroom {
  const completedStudent = createStudent("عبدالله أحمد", { demo: true });
  completedStudent.completed = { read: true, activity: true, status: true, evaluation: true };
  completedStudent.results = {
    read: { correct: 1, incorrect: 0, lastStatus: "correct", updatedAt: nowISO() },
    activity: { correct: 1, incorrect: 0, lastStatus: "correct", updatedAt: nowISO() },
    status: { correct: 1, incorrect: 1, lastStatus: "correct", updatedAt: nowISO() },
    evaluation: { correct: 3, incorrect: 1, lastStatus: "correct", updatedAt: nowISO() },
  };
  completedStudent.evaluationScore = 3;

  const progressStudent = createStudent("محمد سعد", { demo: true });
  progressStudent.completed = { read: true, activity: true, status: false, evaluation: false };
  progressStudent.results = {
    read: { correct: 1, incorrect: 1, lastStatus: "correct", updatedAt: nowISO() },
    activity: { correct: 1, incorrect: 0, lastStatus: "correct", updatedAt: nowISO() },
    status: { correct: 0, incorrect: 1, lastStatus: "incorrect", updatedAt: nowISO() },
    evaluation: { correct: 1, incorrect: 1, lastStatus: "correct", updatedAt: nowISO() },
  };
  progressStudent.evaluationScore = 1;

  const startedStudent = createStudent("يوسف خالد", { demo: true });
  startedStudent.completed = { read: true, activity: false, status: false, evaluation: false };
  startedStudent.results = {
    read: { correct: 0, incorrect: 2, lastStatus: "incorrect", updatedAt: nowISO() },
    activity: emptyStation(),
    status: emptyStation(),
    evaluation: emptyStation(),
  };

  const notStarted = createStudent("سلمان فهد", { demo: true });

  completedStudent.section = "٣/١";
  completedStudent.submittedAt = nowISO();
  progressStudent.section = "٣/٢";
  progressStudent.submittedAt = nowISO();

  const demoSubmissions: StudentSubmission[] = [
    {
      id: makeId(),
      studentId: completedStudent.id,
      name: completedStudent.name,
      section: "٣/١",
      percent: 100,
      completedCount: 4,
      evaluationScore: 3,
      submittedAt: nowISO(),
    },
    {
      id: makeId(),
      studentId: progressStudent.id,
      name: progressStudent.name,
      section: "٣/٢",
      percent: 50,
      completedCount: 2,
      evaluationScore: 1,
      submittedAt: nowISO(),
    },
  ];

  return {
    ...current,
    students: [...current.students.filter((student) => !student.demo), completedStudent, progressStudent, startedStudent, notStarted],
    submissions: [...current.submissions, ...demoSubmissions],
  };
}

export function removeDemoStudents(classroom: Classroom): Classroom {
  const students = classroom.students.filter((student) => !student.demo);
  if (students.length === 0) {
    const student = createStudent("طالب الصف الثالث");
    return { ...classroom, activeId: student.id, students: [student], submissions: [] };
  }
  const activeId = students.some((student) => student.id === classroom.activeId)
    ? classroom.activeId
    : students[0].id;
  return {
    ...classroom,
    activeId,
    students,
    submissions: classroom.submissions.filter((submission) =>
      students.some((student) => student.id === submission.studentId),
    ),
  };
}

const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

export function buildClassroomCsv(classroom: Classroom): string {
  const headers = [
    "الطالب",
    "الصف",
    "نسبة الإنجاز",
    "أقرأ وأجيب",
    "نشاط الحديث",
    "مكانة الصلاة",
    "التقويم",
    "درجة المحطات من ٢",
    "درجة التقويم من ٣",
    "الدرجة الكلية من ٥",
    "إجابات صحيحة",
    "أخطاء",
    "آخر نشاط",
    "وقت التسليم للمعلم",
    "ملاحظات المعلم",
  ];

  const rows = classroom.students
    .filter((student) => student.name !== "طالب الصف الثالث")
    .map((student) => [
    student.name,
    student.section || "—",
    `${completionPercent(student)}%`,
    ...TASK_KEYS.map((key) => (student.completed[key] ? "مكتمل" : "غير مكتمل")),
    `${stationScore(student)} / 2`,
    `${student.evaluationScore} / 3`,
    `${totalScore(student)} / 5`,
    totalCorrect(student),
    totalIncorrect(student),
    formatLastActive(student.lastActive),
    student.submittedAt ? formatLastActive(student.submittedAt) : "لم يسلّم",
    student.notes,
  ]);

  return "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function downloadClassroomCsv(classroom: Classroom) {
  const blob = new Blob([buildClassroomCsv(classroom)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `تقرير-مكانة-الصلاة-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}


/* ----------------------------- مشاركة التسليم ----------------------------- */

export type SharedSubmission = {
  v: 1;
  name: string;
  section: Exclude<StudentSection, "">;
  percent: number;
  completed: TaskKey[];
  evaluationScore: number;
  tasks: Record<TaskKey, { c: number; i: number }>;
  submittedAt: string;
};

const TASK_CODE: Record<TaskKey, string> = { read: "r", activity: "a", status: "s", evaluation: "e" };

const toBase64Url = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (value: string) => {
  let base = value.replace(/-/g, "+").replace(/_/g, "/");
  while (base.length % 4 !== 0) base += "=";
  const binary = atob(base);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export function encodeSubmission(student: Student): string {
  const tasks = Object.fromEntries(
    TASK_KEYS.map((key) => [TASK_CODE[key], { c: student.results[key].correct, i: student.results[key].incorrect }]),
  );
  const payload = {
    v: 1,
    n: student.name,
    s: student.section,
    p: completionPercent(student),
    k: TASK_KEYS.filter((key) => student.completed[key]).map((key) => TASK_CODE[key]),
    e: student.evaluationScore,
    t: student.submittedAt ?? nowISO(),
    a: tasks,
  };
  return toBase64Url(JSON.stringify(payload));
}

export function decodeSubmission(code: string): SharedSubmission | null {
  try {
    const raw = JSON.parse(fromBase64Url(code.trim())) as Record<string, unknown>;
    if (raw.v !== 1) return null;
    if (typeof raw.n !== "string" || typeof raw.s !== "string") return null;
    if (!STUDENT_SECTIONS.includes(raw.s as (typeof STUDENT_SECTIONS)[number])) return null;
    if (raw.n.trim().length < 2) return null;
    const names = Object.fromEntries(Object.entries(TASK_CODE).map(([key, value]) => [value, key])) as Record<string, TaskKey>;
    const sourceTasks = (raw.a ?? {}) as Record<string, { c?: number; i?: number }>;
    const tasks = {} as Record<TaskKey, { c: number; i: number }>;
    TASK_KEYS.forEach((key) => {
      const entry = sourceTasks[TASK_CODE[key]];
      tasks[key] = {
        c: Math.max(0, Math.min(99, Number(entry?.c) || 0)),
        i: Math.max(0, Math.min(99, Number(entry?.i) || 0)),
      };
    });
    const completed = Array.isArray(raw.k)
      ? raw.k.filter((value): value is string => typeof value === "string").map((value) => names[value]).filter((value): value is TaskKey => Boolean(value))
      : [];
    return {
      v: 1,
      name: raw.n.trim().slice(0, 48),
      section: raw.s as Exclude<StudentSection, "">,
      percent: Math.max(0, Math.min(100, Number(raw.p) || 0)),
      completed,
      evaluationScore: Math.max(0, Math.min(3, Number(raw.e) || 0)),
      tasks,
      submittedAt: typeof raw.t === "string" ? raw.t : nowISO(),
    };
  } catch {
    return null;
  }
}

export function importSubmission(classroom: Classroom, shared: SharedSubmission): Classroom {
  const existing = classroom.students.find(
    (student) =>
      !student.demo &&
      student.name.trim() === shared.name.trim() &&
      student.section === shared.section,
  );
  const student = existing ?? createStudent(shared.name, { demo: false });
  const timestamp = nowISO();
  const completed = Object.fromEntries(TASK_KEYS.map((key) => [key, shared.completed.includes(key)])) as Record<TaskKey, boolean>;
  const results = Object.fromEntries(
    TASK_KEYS.map((key) => {
      const entry = shared.tasks[key];
      return [
        key,
        {
          correct: entry.c,
          incorrect: entry.i,
          lastStatus: shared.completed.includes(key) ? ("correct" as const) : entry.i > 0 ? ("incorrect" as const) : null,
          updatedAt: entry.c + entry.i > 0 ? shared.submittedAt : null,
        },
      ];
    }),
  ) as Record<TaskKey, StationResult>;

  const updatedStudent: Student = {
    ...student,
    name: shared.name,
    section: shared.section,
    submittedAt: shared.submittedAt,
    lastActive: timestamp,
    completed,
    results,
    evaluationScore: shared.evaluationScore,
    imported: true,
  };

  const submission: StudentSubmission = {
    id: classroom.submissions.find((item) => item.studentId === updatedStudent.id)?.id ?? makeId(),
    studentId: updatedStudent.id,
    name: updatedStudent.name,
    section: shared.section,
    percent: shared.percent,
    completedCount: shared.completed.length,
    evaluationScore: shared.evaluationScore,
    submittedAt: shared.submittedAt,
  };

  const students = existing
    ? classroom.students.map((item) => (item.id === updatedStudent.id ? updatedStudent : item))
    : [...classroom.students.filter((item) => item.name !== "طالب الصف الثالث"), updatedStudent];

  return {
    ...classroom,
    students,
    submissions: [submission, ...classroom.submissions.filter((item) => item.studentId !== updatedStudent.id)],
  };
}

export function addNewSessionStudent(
  classroom: Classroom,
  name: string,
  section: Exclude<StudentSection, "">,
): { classroom: Classroom; student: Student } {
  const existing = classroom.students.find(
    (student) => student.name.trim() === name.trim() && student.section === section && !student.demo,
  );
  if (existing) {
    return { classroom: { ...classroom, activeId: existing.id }, student: existing };
  }
  const student = createStudent(name);
  student.section = section;
  return {
    student,
    classroom: { ...classroom, activeId: student.id, students: [...classroom.students, student] },
  };
}


const PLACEHOLDER_NAME = "طالب الصف الثالث";

export function removeStudentCompletely(classroom: Classroom, studentId: string): Classroom {
  const student = classroom.students.find((item) => item.id === studentId);
  const remaining = classroom.students.filter((item) => item.id !== studentId);
  if (!student) return classroom;

  const needsPlaceholder = remaining.every((item) => item.name === PLACEHOLDER_NAME) || remaining.length === 0;
  if (needsPlaceholder) {
    const placeholder = createStudent(PLACEHOLDER_NAME);
    return {
      ...classroom,
      activeId: placeholder.id,
      students: [placeholder],
      submissions: [],
    };
  }

  const activeId = classroom.activeId === studentId ? remaining[0].id : classroom.activeId;
  return {
    ...classroom,
    activeId,
    students: remaining,
    submissions: classroom.submissions.filter((submission) => submission.studentId !== studentId),
  };
}

export function clearAllStudents(classroom: Classroom): Classroom {
  const placeholder = createStudent(PLACEHOLDER_NAME);
  return { ...classroom, activeId: placeholder.id, students: [placeholder], submissions: [] };
}
