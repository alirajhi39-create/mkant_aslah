import {
  TASK_KEYS,
  completionPercent,
  completedCount,
  emptyResult,
  type Classroom,
  type Student,
  type StudentSubmission,
  type TaskKey,
} from "./classroom";

export const DEFAULT_CLASS_CODE = "SALAH-3-1";
const CLASS_CODE_KEY = "salah-cloud-class-code";
const STUDENT_TOKEN_KEY = "salah-cloud-token";
const TEACHER_PASSWORD_KEY = "salah-teacher-password";

export type CloudStatus = "checking" | "ready" | "local" | "error";

export type CloudStudent = Student & {
  cloud?: boolean;
};

export type RosterResult =
  | { ok: true; students: CloudStudent[]; classCode: string; fetchedAt: string }
  | { ok: false; error: string; code?: string };

export function getClassCode(): string {
  try {
    const stored = window.localStorage.getItem(CLASS_CODE_KEY);
    if (stored && /^[A-Z0-9_-]{2,32}$/.test(stored)) return stored;
  } catch {
    /* التخزين غير متاح */
  }
  return DEFAULT_CLASS_CODE;
}

export function setClassCode(value: string) {
  const code = value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
  try {
    window.localStorage.setItem(CLASS_CODE_KEY, code || DEFAULT_CLASS_CODE);
  } catch {
    /* التخزين غير متاح */
  }
  return code || DEFAULT_CLASS_CODE;
}

export function getStudentToken(): string {
  try {
    const stored = window.localStorage.getItem(STUDENT_TOKEN_KEY);
    if (stored && stored.length >= 8) return stored;
    const token = generateToken();
    window.localStorage.setItem(STUDENT_TOKEN_KEY, token);
    return token;
  } catch {
    return generateToken();
  }
}

export function getTeacherPassword(): string {
  try {
    return window.sessionStorage.getItem(TEACHER_PASSWORD_KEY) || "";
  } catch {
    return "";
  }
}

export function rememberTeacherPassword(password: string) {
  try {
    window.sessionStorage.setItem(TEACHER_PASSWORD_KEY, password);
  } catch {
    /* الجلسة غير متاحة */
  }
}

function generateToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

async function parseJson(response: Response) {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) return null;
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export type CloudProbe = {
  configured: boolean;
  reachable: boolean;
  provider: string;
  storage: string;
};

export async function probeCloud(): Promise<CloudProbe> {
  try {
    const response = await fetch("/api/health", { headers: { Accept: "application/json" }, cache: "no-store" });
    const data = await parseJson(response);
    if (!response.ok || !data) {
      return { configured: false, reachable: false, provider: "", storage: "" };
    }
    return {
      configured: data.configured === true,
      reachable: data.reachable !== false,
      provider: String(data.provider || ""),
      storage: String(data.storage || ""),
    };
  } catch {
    return { configured: false, reachable: false, provider: "", storage: "" };
  }
}

export async function syncStudent(student: Student): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/student", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        classCode: getClassCode(),
        id: student.id,
        token: getStudentToken(),
        name: student.name,
        section: student.section,
        completed: student.completed,
        results: Object.fromEntries(
          TASK_KEYS.map((task) => [
            task,
            { correct: student.results[task].correct, incorrect: student.results[task].incorrect },
          ]),
        ),
        evaluationScore: student.evaluationScore,
        submittedAt: student.submittedAt,
      }),
    });
    const data = await parseJson(response);
    if (!response.ok || !data?.ok) {
      return { ok: false, error: String(data?.error || `HTTP_${response.status}`) };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}

const mapResults = (source: unknown) => {
  const record = (source ?? {}) as Partial<Record<TaskKey, { correct?: number; incorrect?: number }>>;
  return Object.fromEntries(
    TASK_KEYS.map((task) => [
      task,
      {
        correct: Math.max(0, Number(record[task]?.correct) || 0),
        incorrect: Math.max(0, Number(record[task]?.incorrect) || 0),
        lastStatus: null,
        updatedAt: null,
      },
    ]),
  ) as Student["results"];
};

export function cloudStudentToLocal(raw: Record<string, unknown>): CloudStudent | null {
  if (typeof raw.id !== "string" || typeof raw.name !== "string") return null;
  if (raw.section !== "٣/١" && raw.section !== "٣/٢") return null;
  const completed = (raw.completed ?? {}) as Partial<Record<TaskKey, boolean>>;
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString();
  return {
    id: raw.id,
    name: raw.name,
    section: raw.section,
    submittedAt: typeof raw.submittedAt === "string" ? raw.submittedAt : null,
    createdAt,
    lastActive: typeof raw.lastActive === "string" ? raw.lastActive : createdAt,
    completed: Object.fromEntries(TASK_KEYS.map((task) => [task, Boolean(completed[task])])) as Student["completed"],
    results: mapResults(raw.results),
    evaluationScore: Math.max(0, Math.min(3, Number(raw.evaluationScore) || 0)),
    notes: "",
    cloud: true,
  };
}

export function cloudStudentToSubmission(student: Student): StudentSubmission {
  return {
    id: `cloud-${student.id}`,
    studentId: student.id,
    name: student.name,
    section: student.section as Exclude<Student["section"], "">,
    percent: completionPercent(student),
    completedCount: completedCount(student),
    evaluationScore: student.evaluationScore,
    submittedAt: student.submittedAt ?? student.lastActive,
  };
}

export function mergeCloudStudents(classroom: Classroom, cloudStudents: CloudStudent[]): CloudStudent[] {
  const map = new Map<string, CloudStudent>();
  cloudStudents.forEach((student) => map.set(student.id, student));
  classroom.students
    .filter((student) => !student.demo && student.section)
    .forEach((student) => {
      if (!map.has(student.id)) map.set(student.id, { ...student, cloud: false });
    });
  return [...map.values()].sort((a, b) => b.lastActive.localeCompare(a.lastActive));
}

export type BackupStudent = {
  id: string;
  name: string;
  section: Exclude<Student["section"], "">;
  completed: Student["completed"];
  results: Record<string, unknown>;
  evaluationScore: number;
  percent: number;
  completedCount: number;
  submittedAt: string | null;
  createdAt?: string;
  lastActive?: string;
};

export async function renameCloudStudent(
  id: string,
  edits: { name?: string; section?: Exclude<Student["section"], ""> },
): Promise<{ ok: boolean; error?: string; student?: CloudStudent }> {
  try {
    const response = await fetch("/api/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      cache: "no-store",
      body: JSON.stringify({ password: getTeacherPassword(), classCode: getClassCode(), id, ...edits }),
    });
    const data = await parseJson(response);
    if (!response.ok || !data?.ok) return { ok: false, error: String(data?.error || `HTTP_${response.status}`) };
    const student = cloudStudentToLocal((data.student ?? {}) as Record<string, unknown>);
    return { ok: true, student: student ? { ...student, cloud: true } : undefined };
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}

export async function exportCloudBackup(): Promise<{
  ok: boolean;
  error?: string;
  students?: BackupStudent[];
}> {
  try {
    const response = await fetch("/api/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      cache: "no-store",
      body: JSON.stringify({ password: getTeacherPassword(), classCode: getClassCode(), action: "export" }),
    });
    const data = await parseJson(response);
    if (!response.ok || !data?.ok) return { ok: false, error: String(data?.error || `HTTP_${response.status}`) };
    return { ok: true, students: (Array.isArray(data.students) ? data.students : []) as BackupStudent[] };
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}

export async function importCloudBackup(
  students: BackupStudent[],
): Promise<{ ok: boolean; error?: string; imported?: number; skipped?: string[] }> {
  try {
    const response = await fetch("/api/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        password: getTeacherPassword(),
        classCode: getClassCode(),
        action: "import",
        students,
      }),
    });
    const data = await parseJson(response);
    if (!response.ok || !data?.ok) return { ok: false, error: String(data?.error || `HTTP_${response.status}`) };
    return {
      ok: true,
      imported: Number(data.imported) || 0,
      skipped: Array.isArray(data.skipped) ? (data.skipped as string[]) : [],
    };
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}

export function downloadBackupFile(
  students: BackupStudent[] | CloudStudent[],
  meta: { classCode: string; teacher: string; school: string; lesson: string },
) {
  const payload = {
    app: "مكانة الصلاة",
    version: 1,
    exportedAt: new Date().toISOString(),
    ...meta,
    count: students.length,
    students,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  link.download = `نسخة-احتياطية-مكانة-الصلاة-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function parseBackupFile(raw: unknown): BackupStudent[] {
  const source = Array.isArray(raw) ? raw : raw && typeof raw === "object" && Array.isArray((raw as { students?: unknown }).students)
    ? ((raw as { students: unknown[] }).students)
    : [];
  const mapped: (BackupStudent | null)[] = source.map((item): BackupStudent | null => {
      const record = item as Record<string, unknown>;
      if (typeof record.id !== "string" || typeof record.name !== "string") return null;
      const section = record.section === "٣/١" || record.section === "٣/٢" ? (record.section as Exclude<Student["section"], "">) : null;
      if (!section) return null;
      const completedSource = (record.completed ?? {}) as Partial<Record<TaskKey, boolean>>;
      return {
        id: record.id,
        name: record.name,
        section,
        completed: Object.fromEntries(TASK_KEYS.map((key) => [key, Boolean(completedSource[key])])) as Student["completed"],
        results: (record.results ?? {}) as Record<string, unknown>,
        evaluationScore: Math.max(0, Math.min(3, Number(record.evaluationScore) || 0)),
        percent: Math.max(0, Math.min(100, Number(record.percent) || 0)),
        completedCount: Math.max(0, Math.min(4, Number(record.completedCount) || 0)),
        submittedAt: typeof record.submittedAt === "string" ? record.submittedAt : null,
        createdAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
        lastActive: typeof record.lastActive === "string" ? record.lastActive : undefined,
      } satisfies BackupStudent;
  });
  return mapped.filter((student): student is BackupStudent => student !== null);
}

export async function deleteCloudStudents(
  ids: string[],
  all = false,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        password: getTeacherPassword(),
        classCode: getClassCode(),
        action: all ? "deleteAll" : "delete",
        ids,
      }),
    });
    const data = await parseJson(response);
    if (!response.ok || !data?.ok) return { ok: false, error: String(data?.error || `HTTP_${response.status}`) };
    return { ok: true };
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}

export async function fetchRoster(password: string): Promise<RosterResult> {
  try {
    const response = await fetch("/api/roster", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      cache: "no-store",
      body: JSON.stringify({ password, classCode: getClassCode() }),
    });
    const data = await parseJson(response);
    if (!response.ok || !data?.ok) {
      return {
        ok: false,
        code: String(data?.error || `HTTP_${response.status}`),
        error: String(data?.error || `HTTP_${response.status}`),
      };
    }
    const rawStudents = Array.isArray(data.students) ? (data.students as Record<string, unknown>[]) : [];
    const byIdentity = new Map<string, CloudStudent>();
    rawStudents
      .map(cloudStudentToLocal)
      .filter((student): student is CloudStudent => Boolean(student))
      .map((student) => ({ ...student, cloud: true }))
      .forEach((student) => {
        const identity = `${student.name.trim()}|${student.section}`;
        const previous = byIdentity.get(identity);
        if (!previous || student.lastActive > previous.lastActive) byIdentity.set(identity, student);
      });
    const students = [...byIdentity.values()];
    return {
      ok: true,
      students,
      classCode: String(data.classCode || getClassCode()),
      fetchedAt: String(data.fetchedAt || new Date().toISOString()),
    };
  } catch {
    return { ok: false, error: "NETWORK", code: "NETWORK" };
  }
}

export const cloudErrorArabic = (code?: string) => {
  switch (code) {
    case "SHARED_STORAGE_NOT_CONFIGURED":
      return "قاعدة البيانات المشتركة غير مفعّلة على هذا النشر بعد.";
    case "INVALID_TEACHER_PASSWORD":
      return "كلمة سر المعلم غير صحيحة.";
    case "NETWORK":
      return "تعذّر الاتصال بالخادم. تحقّق من الإنترنت ثم أعد المحاولة.";
    case "STORAGE_UNAVAILABLE":
      return "خدمة التخزين المشتركة غير متاحة حاليًا.";
    default:
      return "تعذّر جلب سجلّ الصف من الخادم.";
  }
};

export const currentStudentSignature = (student: Student) =>
  JSON.stringify({
    name: student.name,
    section: student.section,
    completed: student.completed,
    results: Object.fromEntries(
      TASK_KEYS.map((task) => [task, [student.results[task].correct, student.results[task].incorrect]]),
    ),
    evaluationScore: student.evaluationScore,
    submittedAt: student.submittedAt,
  });

export const cloudEmptyResults = () =>
  Object.fromEntries(TASK_KEYS.map((task) => [task, emptyResult()])) as Student["results"];
