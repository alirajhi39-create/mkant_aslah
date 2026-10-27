import { command, configured, key, readBody, sanitizeClassCode, send } from "../../_redis.js";

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

  const classCode = sanitizeClassCode(req.query?.code);
  if (!classCode) {
    send(res, 400, { ok: false, error: "INVALID_CLASS_CODE" });
    return;
  }

  const body = readBody(req);
  if (String(body.password || "") !== PASSWORD) {
    send(res, 401, { ok: false, error: "INVALID_TEACHER_PASSWORD" });
    return;
  }

  const hashKey = key(classCode, "students");
  const action = String(body.action || "");

  if (action === "deleteAll") {
    await command(["DEL", hashKey]);
    send(res, 200, { ok: true, action: "deleteAll" });
    return;
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id) => typeof id === "string" && /^[a-zA-Z0-9-]{6,64}$/.test(id))
    : [];
  if (ids.length === 0) {
    send(res, 400, { ok: false, error: "INVALID_IDS" });
    return;
  }

  const results = [];
  for (const id of ids.slice(0, 100)) {
    results.push(await command(["HDEL", hashKey, id]));
  }
  send(res, 200, { ok: true, deleted: results.reduce((sum, value) => sum + (Number(value) || 0), 0) });
}
