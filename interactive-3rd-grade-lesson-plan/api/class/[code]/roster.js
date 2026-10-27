import {
  configured,
  readBody,
  readHash,
  sanitizeClassCode,
  key,
  send,
} from "../../_redis.js";

const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || "139613";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    send(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  if (!configured()) {
    send(res, 503, { ok: false, error: "SHARED_STORAGE_NOT_CONFIGURED" });
    return;
  }

  const classCode = sanitizeClassCode(req.query?.code);
  if (!classCode) {
    send(res, 400, { ok: false, error: "INVALID_CLASS_CODE" });
    return;
  }

  const body = readBody(req);
  if (String(body.password || "") !== TEACHER_PASSWORD) {
    send(res, 401, { ok: false, error: "INVALID_TEACHER_PASSWORD" });
    return;
  }

  let students = [];
  try {
    students = await readHash(key(classCode, "students"));
  } catch {
    send(res, 502, { ok: false, error: "STORAGE_UNAVAILABLE" });
    return;
  }

  const safe = students
    .filter((student) => student && typeof student.id === "string")
    .map(({ token: _token, ...student }) => student)
    .sort((a, b) => String(b.lastActive || "").localeCompare(String(a.lastActive || "")));

  send(res, 200, {
    ok: true,
    classCode,
    count: safe.length,
    submitted: safe.filter((student) => student.submittedAt).length,
    fetchedAt: new Date().toISOString(),
    students: safe,
  });
}
