import { readBody, send, sanitizeClassCode } from "../server/redis.js";
import { configured, deleteAllStudents, deleteStudents, providerLabel } from "../server/store.js";

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
  const classCode = sanitizeClassCode(body.classCode ?? req.query?.classCode ?? req.query?.code);
  if (!classCode) {
    send(res, 400, { ok: false, error: "INVALID_CLASS_CODE" });
    return;
  }
  if (String(body.password || "") !== PASSWORD) {
    send(res, 401, { ok: false, error: "INVALID_TEACHER_PASSWORD" });
    return;
  }

  if (String(body.action || "") === "deleteAll") {
    try {
      await deleteAllStudents(classCode);
    } catch {
      send(res, 502, { ok: false, error: "STORAGE_UNAVAILABLE" });
      return;
    }
    send(res, 200, { ok: true, action: "deleteAll", storage: providerLabel() });
    return;
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id) => typeof id === "string" && /^[a-zA-Z0-9-]{6,64}$/.test(id))
    : [];
  if (ids.length === 0) {
    send(res, 400, { ok: false, error: "INVALID_IDS" });
    return;
  }

  let deleted = 0;
  try {
    deleted = await deleteStudents(classCode, ids);
  } catch {
    send(res, 502, { ok: false, error: "STORAGE_UNAVAILABLE" });
    return;
  }
  send(res, 200, { ok: true, deleted, storage: providerLabel() });
}
