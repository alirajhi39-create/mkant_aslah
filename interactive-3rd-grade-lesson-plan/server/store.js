/**
 * طبقة تخزين مشتركة مستقلة عن المزوّد.
 * المزوّدون المدعومون (يُختار تلقائيًا حسب متغيّرات البيئة):
 *  1) Supabase  → SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *  2) Neon/Postgres → DATABASE_URL (يعمل عبر HTTP دون اتصال TCP)
 *  3) Upstash/Vercel KV (الوضع القديم) → UPSTASH_REDIS_REST_URL/TOKEN أو KV_REST_API_*
 * يمكن فرض مزوّد معيّن عبر STORAGE_PROVIDER=supabase|postgres|redis
 */
import { command as redisCommand, configured as redisConfigured, key as redisKey } from "./redis.js";

export const TABLE = "salah_students";
const STUDENT_FIELDS = [
  "id",
  "name",
  "section",
  "token",
  "completed",
  "results",
  "evaluationScore",
  "percent",
  "completedCount",
  "submittedAt",
  "createdAt",
  "lastActive",
];

const supabaseUrl = () =>
  (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const supabaseKey = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  "";

const neonUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || "";

export function provider() {
  const forced = String(process.env.STORAGE_PROVIDER || "").toLowerCase();
  if (forced === "supabase" && supabaseUrl() && supabaseKey()) return "supabase";
  if ((forced === "postgres" || forced === "neon") && neonUrl()) return "postgres";
  if (forced === "redis" && redisConfigured()) return "redis";
  if (supabaseUrl() && supabaseKey()) return "supabase";
  if (neonUrl()) return "postgres";
  if (redisConfigured()) return "redis";
  return null;
}

export const configured = () => Boolean(provider());

export const providerLabel = () => {
  const active = provider();
  if (active === "supabase") return "Supabase";
  if (active === "postgres") return "PostgreSQL (Neon)";
  if (active === "redis") return "Upstash Redis";
  return "not-configured";
};

/* ------------------------------- Normalizers ------------------------------ */

export function toRow(classCode, record) {
  return {
    class_code: classCode,
    student_id: record.id,
    name: record.name,
    section: record.section,
    token: record.token || null,
    completed: record.completed || {},
    results: record.results || {},
    evaluation_score: Number(record.evaluationScore) || 0,
    percent: Number(record.percent) || 0,
    completed_count: Number(record.completedCount) || 0,
    submitted_at: record.submittedAt || null,
    created_at: record.createdAt || new Date().toISOString(),
    last_active: record.lastActive || new Date().toISOString(),
  };
}

export function fromRow(row) {
  if (!row || typeof row !== "object") return null;
  const id = row.student_id ?? row.id;
  if (typeof id !== "string") return null;
  return {
    id,
    name: String(row.name || ""),
    section: String(row.section || ""),
    token: row.token == null ? null : String(row.token),
    completed: row.completed && typeof row.completed === "object" ? row.completed : {},
    results: row.results && typeof row.results === "object" ? row.results : {},
    evaluationScore: Number(row.evaluation_score ?? row.evaluationScore) || 0,
    percent: Number(row.percent) || 0,
    completedCount: Number(row.completed_count ?? row.completedCount) || 0,
    submittedAt: row.submitted_at ?? row.submittedAt ?? null,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    lastActive: row.last_active ?? row.lastActive ?? new Date().toISOString(),
  };
}

export function withoutToken(record) {
  if (!record) return record;
  const { token: _token, ...rest } = record;
  return rest;
}

/* --------------------------------- Supabase -------------------------------- */

async function supabaseRequest(path, init = {}) {
  const response = await fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseKey(),
      Authorization: `Bearer ${supabaseKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`SUPABASE_${response.status}${text ? `:${text.slice(0, 160)}` : ""}`);
  }
  if (response.status === 204) return [];
  const text = await response.text();
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

/* ----------------------------- Postgres (Neon) ----------------------------- */

let sqlClient = null;

async function neonSql() {
  if (!sqlClient) {
    const { neon } = await import("@neondatabase/serverless");
    sqlClient = neon(neonUrl());
  }
  return sqlClient;
}

let tableReady = false;

async function ensurePostgresTable() {
  if (tableReady) return;
  const sql = await neonSql();
  await sql`
    CREATE TABLE IF NOT EXISTS salah_students (
      class_code TEXT NOT NULL,
      student_id TEXT NOT NULL,
      name TEXT NOT NULL,
      section TEXT NOT NULL,
      token TEXT,
      completed JSONB NOT NULL DEFAULT '{}'::jsonb,
      results JSONB NOT NULL DEFAULT '{}'::jsonb,
      evaluation_score SMALLINT NOT NULL DEFAULT 0,
      percent SMALLINT NOT NULL DEFAULT 0,
      completed_count SMALLINT NOT NULL DEFAULT 0,
      submitted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_active TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (class_code, student_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS salah_students_class_idx ON salah_students (class_code, last_active DESC)`;
  tableReady = true;
}

/* --------------------------------- Redis ---------------------------------- */

const hashKey = (classCode) => redisKey(classCode, "students");

/* ----------------------------------- API ---------------------------------- */

export async function getStudent(classCode, studentId) {
  const active = provider();
  if (!active) throw new Error("SHARED_STORAGE_NOT_CONFIGURED");

  if (active === "supabase") {
    const rows = await supabaseRequest(
      `${TABLE}?class_code=eq.${encodeURIComponent(classCode)}&student_id=eq.${encodeURIComponent(studentId)}&limit=1`,
    );
    return fromRow(rows[0]);
  }

  if (active === "postgres") {
    await ensurePostgresTable();
    const sql = await neonSql();
    const rows = await sql`SELECT * FROM salah_students WHERE class_code = ${classCode} AND student_id = ${studentId} LIMIT 1`;
    return fromRow(rows[0]);
  }

  const raw = await redisCommand(["HGET", hashKey(classCode), studentId]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveStudent(classCode, record) {
  const active = provider();
  if (!active) throw new Error("SHARED_STORAGE_NOT_CONFIGURED");
  const row = toRow(classCode, record);

  if (active === "supabase") {
    await supabaseRequest(`${TABLE}?on_conflict=class_code,student_id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(row),
    });
    return record;
  }

  if (active === "postgres") {
    await ensurePostgresTable();
    const sql = await neonSql();
    await sql`
      INSERT INTO salah_students (
        class_code, student_id, name, section, token, completed, results,
        evaluation_score, percent, completed_count, submitted_at, created_at, last_active
      ) VALUES (
        ${row.class_code}, ${row.student_id}, ${row.name}, ${row.section}, ${row.token},
        ${JSON.stringify(row.completed)}::jsonb, ${JSON.stringify(row.results)}::jsonb,
        ${row.evaluation_score}, ${row.percent}, ${row.completed_count},
        ${row.submitted_at}, ${row.created_at}, ${row.last_active}
      )
      ON CONFLICT (class_code, student_id) DO UPDATE SET
        name = EXCLUDED.name,
        section = EXCLUDED.section,
        token = EXCLUDED.token,
        completed = EXCLUDED.completed,
        results = EXCLUDED.results,
        evaluation_score = EXCLUDED.evaluation_score,
        percent = EXCLUDED.percent,
        completed_count = EXCLUDED.completed_count,
        submitted_at = EXCLUDED.submitted_at,
        last_active = EXCLUDED.last_active
    `;
    return record;
  }

  await redisCommand(["HSET", hashKey(classCode), record.id, JSON.stringify(record)]);
  return record;
}

export async function listStudents(classCode) {
  const active = provider();
  if (!active) throw new Error("SHARED_STORAGE_NOT_CONFIGURED");

  if (active === "supabase") {
    const rows = await supabaseRequest(
      `${TABLE}?class_code=eq.${encodeURIComponent(classCode)}&select=*&order=last_active.desc`,
    );
    return rows.map(fromRow).filter(Boolean);
  }

  if (active === "postgres") {
    await ensurePostgresTable();
    const sql = await neonSql();
    const rows = await sql`SELECT * FROM salah_students WHERE class_code = ${classCode} ORDER BY last_active DESC`;
    return rows.map(fromRow).filter(Boolean);
  }

  const raw = await redisCommand(["HGETALL", hashKey(classCode)]);
  const list = Array.isArray(raw) ? raw : [];
  const students = [];
  for (let index = 0; index < list.length; index += 2) {
    try {
      students.push(JSON.parse(list[index + 1]));
    } catch {
      /* تجاهل السجلات غير الصالحة */
    }
  }
  return students.sort((a, b) => String(b.lastActive || "").localeCompare(String(a.lastActive || "")));
}

export async function deleteStudents(classCode, ids) {
  const active = provider();
  if (!active) throw new Error("SHARED_STORAGE_NOT_CONFIGURED");
  const clean = [...new Set(ids)].filter((id) => typeof id === "string" && /^[a-zA-Z0-9-]{6,64}$/.test(id));
  if (clean.length === 0) return 0;

  if (active === "supabase") {
    const list = clean.join(",");
    await supabaseRequest(
      `${TABLE}?class_code=eq.${encodeURIComponent(classCode)}&student_id=in.(${list})`,
      { method: "DELETE", headers: { Prefer: "return=minimal" } },
    );
    return clean.length;
  }

  if (active === "postgres") {
    await ensurePostgresTable();
    const sql = await neonSql();
    const result = await sql`DELETE FROM salah_students WHERE class_code = ${classCode} AND student_id = ANY(${clean}::text[]) RETURNING student_id`;
    return Array.isArray(result) ? result.length : 0;
  }

  let deleted = 0;
  for (const id of clean.slice(0, 100)) {
    const value = await redisCommand(["HDEL", hashKey(classCode), id]);
    deleted += Number(value) || 0;
  }
  return deleted;
}

export async function deleteAllStudents(classCode) {
  const active = provider();
  if (!active) throw new Error("SHARED_STORAGE_NOT_CONFIGURED");

  if (active === "supabase") {
    await supabaseRequest(`${TABLE}?class_code=eq.${encodeURIComponent(classCode)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
    return true;
  }

  if (active === "postgres") {
    await ensurePostgresTable();
    const sql = await neonSql();
    await sql`DELETE FROM salah_students WHERE class_code = ${classCode}`;
    return true;
  }

  await redisCommand(["DEL", hashKey(classCode)]);
  return true;
}

export async function healthCheck() {
  const active = provider();
  if (!active) return { configured: false, reachable: false, provider: null };
  try {
    if (active === "postgres") await ensurePostgresTable();
    if (active === "supabase") await supabaseRequest(`${TABLE}?select=class_code&limit=1`);
    if (active === "redis") await redisCommand(["PING"]);
    return { configured: true, reachable: true, provider: active };
  } catch (error) {
    return { configured: true, reachable: false, provider: active, error: String(error).slice(0, 200) };
  }
}

export { STUDENT_FIELDS };
