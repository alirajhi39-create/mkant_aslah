import { readBody, send, sanitizeClassCode } from "../server/redis.js";
import { configured, providerLabel, updateStudentByTeacher } from "../server/store.js";

const SECTIONS = ["٣/١", "٣/٢"];

const PASSWORD = process.env.TEACHER_PASSWORD || "139613";

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

  const id = String(body.id || "").trim();
  if (!/^[a-zA-Z0-9-]{6,64}$/.test(id)) {
    send(res, 400, { ok: false, error: "INVALID_STUDENT_ID" });
    return;
  }

  const edits = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim().slice(0, 48);
    if (name.length < 2) {
      send(res, 400, { ok: false, error: "INVALID_STUDENT_NAME" });
      return;
    }
    edits.name = name;
  }
  if (body.section !== undefined) {
    const section = String(body.section).trim();
    if (!SECTIONS.includes(section)) {
      send(res, 400, { ok: false, error: "INVALID_STUDENT_SECTION" });
      return;
    }
    edits.section = section;
  }
  if (Object.keys(edits).length === 0) {
    send(res, 400, { ok: false, error: "EMPTY_UPDATE" });
    return;
  }

  try {
    const updated = await updateStudentByTeacher(classCode, id, edits);
    if (!updated) {
      send(res, 404, { ok: false, error: "STUDENT_NOT_FOUND" });
      return;
    }
    const { token: _token, ...student } = updated;
    send(res, 200, { ok: true, student, storage: providerLabel() });
  } catch (error) {
    send(res, 502, { ok: false, error: "STORAGE_WRITE_FAILED", detail: String(error).slice(0, 160) });
  }
}
