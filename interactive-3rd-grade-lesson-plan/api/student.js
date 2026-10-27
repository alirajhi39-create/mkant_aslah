import { readBody, send, sanitizeClassCode } from "../server/redis.js";
import { configured, getStudent, providerLabel, saveStudent } from "../server/store.js";

const SECTIONS = ["٣/١", "٣/٢"];
const TASKS = ["read", "activity", "status", "evaluation"];

const clampInt = (value, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.round(number)));
};

const cleanBooleanMap = (source) => Object.fromEntries(TASKS.map((task) => [task, Boolean(source && source[task])]));

const cleanResults = (source) =>
  Object.fromEntries(
    TASKS.map((task) => {
      const entry = (source && source[task]) || {};
      return [task, { correct: clampInt(entry.correct, 0, 999), incorrect: clampInt(entry.incorrect, 0, 999) }];
    }),
  );

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
  const classCode = sanitizeClassCode(body.classCode ?? req.query?.classCode ?? req.query?.code);
  if (!classCode) {
    send(res, 400, { ok: false, error: "INVALID_CLASS_CODE" });
    return;
  }

  const id = String(body.id || "").trim();
  const token = String(body.token || "").trim();
  const name = String(body.name || "").trim().slice(0, 48);
  const section = SECTIONS.includes(String(body.section)) ? String(body.section) : "";

  if (!/^[a-zA-Z0-9-]{6,64}$/.test(id) || !/^[a-zA-Z0-9-]{8,80}$/.test(token)) {
    send(res, 400, { ok: false, error: "INVALID_IDENTITY" });
    return;
  }
  if (name.length < 3 || !section) {
    send(res, 400, { ok: false, error: "INVALID_STUDENT_DATA" });
    return;
  }

  let existing = null;
  try {
    existing = await getStudent(classCode, id);
  } catch {
    existing = null;
  }
  if (existing && existing.token && existing.token !== token) {
    send(res, 403, { ok: false, error: "IDENTITY_MISMATCH" });
    return;
  }

  const completed = cleanBooleanMap(body.completed);
  const doneCount = TASKS.filter((task) => completed[task]).length;
  const record = {
    id,
    name,
    section,
    token,
    completed,
    results: cleanResults(body.results),
    evaluationScore: clampInt(body.evaluationScore, 0, 3),
    percent: clampInt((doneCount / TASKS.length) * 100, 0, 100),
    completedCount: doneCount,
    submittedAt: typeof body.submittedAt === "string" && body.submittedAt.length >= 10 ? body.submittedAt : null,
    createdAt: existing?.createdAt || new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };

  try {
    await saveStudent(classCode, record);
  } catch (error) {
    send(res, 502, { ok: false, error: "STORAGE_WRITE_FAILED", detail: String(error).slice(0, 160) });
    return;
  }

  const { token: _omit, ...publicRecord } = record;
  send(res, 200, { ok: true, student: publicRecord, syncedAt: record.lastActive, storage: providerLabel() });
}
