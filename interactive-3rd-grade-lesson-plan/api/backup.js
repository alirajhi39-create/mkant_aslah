import { readBody, send, sanitizeClassCode } from "../server/redis.js";
import { configured, getStudent, listStudents, providerLabel, saveStudent, withoutToken } from "../server/store.js";

const PASSWORD = process.env.TEACHER_PASSWORD || "139613";
const TASKS = ["read", "activity", "status", "evaluation"];
const SECTIONS = ["٣/١", "٣/٢"];

const clampInt = (value, min, max) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min;
};

const cleanCompleted = (source) => Object.fromEntries(TASKS.map((t) => [t, Boolean(source && source[t])]));
const cleanResults = (source) => {
  const base = Object.fromEntries(
    TASKS.map((t) => {
      const e = (source && source[t]) || {};
      return [t, { correct: clampInt(e.correct, 0, 999), incorrect: clampInt(e.incorrect, 0, 999) }];
    }),
  );
  const meta = source && source.__meta && source.__meta.nameLocked ? { __meta: source.__meta } : {};
  return { ...base, ...meta };
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    send(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }
  if (!configured()) {
    send(res, 503, { ok: false, error: "SHARED_STORAGE_NOT_CONFIGURED" });
    return;
  }

  const body = readBody(req);
  const classCode = sanitizeClassCode(body.classCode);
  if (!classCode) {
    send(res, 400, { ok: false, error: "INVALID_CLASS_CODE" });
    return;
  }
  if (String(body.password || "") !== PASSWORD) {
    send(res, 401, { ok: false, error: "INVALID_TEACHER_PASSWORD" });
    return;
  }

  if (body.action === "export") {
    try {
      const students = await listStudents(classCode);
      send(res, 200, {
        ok: true,
        classCode,
        exportedAt: new Date().toISOString(),
        storage: providerLabel(),
        count: students.length,
        students: students.map(withoutToken),
      });
    } catch {
      send(res, 502, { ok: false, error: "STORAGE_UNAVAILABLE" });
    }
    return;
  }

  if (body.action === "import") {
    const incoming = Array.isArray(body.students) ? body.students : [];
    if (incoming.length === 0) {
      send(res, 400, { ok: false, error: "EMPTY_BACKUP" });
      return;
    }

    let imported = 0;
    const skipped = [];
    for (const raw of incoming.slice(0, 500)) {
      const id = String(raw?.id || "").trim();
      const name = String(raw?.name || "").trim().slice(0, 48);
      const section = SECTIONS.includes(String(raw?.section)) ? String(raw.section) : null;
      if (!/^[a-zA-Z0-9-]{6,64}$/.test(id) || name.length < 2 || !section) {
        skipped.push(raw?.name || id || "سجل غير صالح");
        continue;
      }
      try {
        const existing = await getStudent(classCode, id);
        const completed = cleanCompleted(raw.completed);
        const doneCount = TASKS.filter((t) => completed[t]).length;
        const record = {
          id,
          name: existing && existing.results?.__meta?.nameLocked ? existing.name : name,
          section,
          token: existing?.token || null,
          completed,
          results: cleanResults(raw.results),
          evaluationScore: clampInt(raw.evaluationScore, 0, 3),
          percent: clampInt((doneCount / TASKS.length) * 100, 0, 100),
          completedCount: doneCount,
          submittedAt: typeof raw.submittedAt === "string" ? raw.submittedAt : null,
          createdAt: existing?.createdAt || (typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString()),
          lastActive: new Date().toISOString(),
        };
        await saveStudent(classCode, record);
        imported += 1;
      } catch {
        skipped.push(name);
      }
    }

    send(res, 200, { ok: true, imported, skipped, storage: providerLabel() });
    return;
  }

  send(res, 400, { ok: false, error: "INVALID_ACTION" });
}
