/**
 * ترحيل اختياري لمرة واحدة: ينسخ السجلات من Upstash Redis القديم
 * إلى المزوّد الجديد (Supabase / Postgres).
 * يستخدم فقط عند بقاء متغيّرات Redis مضبوطة بجانب المزوّد الجديد.
 */
import { readBody, readHash, configured as redisConfigured, key, send } from "../server/redis.js";
import { provider, saveStudent, configured } from "../server/store.js";

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
  if (provider() === "redis") {
    send(res, 400, { ok: false, error: "ALREADY_ON_REDIS" });
    return;
  }
  if (!redisConfigured()) {
    send(res, 400, { ok: false, error: "REDIS_NOT_CONFIGURED" });
    return;
  }

  const body = readBody(req);
  if (String(body.password || "") !== PASSWORD) {
    send(res, 401, { ok: false, error: "INVALID_TEACHER_PASSWORD" });
    return;
  }

  const classCodeRaw = String(body.classCode || "").trim().toUpperCase();
  if (!/^[A-Z0-9_-]{2,32}$/.test(classCodeRaw)) {
    send(res, 400, { ok: false, error: "INVALID_CLASS_CODE" });
    return;
  }

  try {
    const students = await readHash(key(classCodeRaw, "students"));
    let migrated = 0;
    for (const record of students) {
      if (!record || typeof record.id !== "string") continue;
      await saveStudent(classCodeRaw, {
        ...record,
        createdAt: record.createdAt || new Date().toISOString(),
        lastActive: record.lastActive || new Date().toISOString(),
      });
      migrated += 1;
    }
    send(res, 200, { ok: true, migrated, provider: provider(), classCode: classCodeRaw });
  } catch (error) {
    send(res, 502, { ok: false, error: "MIGRATION_FAILED", detail: String(error).slice(0, 180) });
  }
}
