const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

export const configured = () => Boolean(url && token);

export const sanitizeClassCode = (value) => {
  const code = String(value || "").trim().toUpperCase();
  return /^[A-Z0-9_-]{2,32}$/.test(code) ? code : null;
};

export const key = (classCode, suffix) => `salah:${classCode}:${suffix}`;

async function call(path, body) {
  if (!configured()) throw new Error("SHARED_STORAGE_NOT_CONFIGURED");
  const response = await fetch(`${url.replace(/\/+$/, "")}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`STORAGE_${response.status}${text ? `:${text.slice(0, 120)}` : ""}`);
  }
  return response.json();
}

export async function command(args) {
  const result = await call("", args);
  if (result && result.error) throw new Error(String(result.error));
  return result?.result ?? null;
}

export async function pipeline(commands) {
  const result = await call("/pipeline", commands);
  if (!Array.isArray(result)) throw new Error("STORAGE_INVALID_RESPONSE");
  const failed = result.find((entry) => entry && entry.error);
  if (failed) throw new Error(String(failed.error));
  return result.map((entry) => entry?.result ?? null);
}

export async function readHash(hashKey) {
  const raw = await command(["HGETALL", hashKey]);
  const list = Array.isArray(raw) ? raw : [];
  const students = [];
  for (let index = 0; index < list.length; index += 2) {
    try {
      students.push(JSON.parse(list[index + 1]));
    } catch {
      /* تجاهل السجلات غير الصالحة */
    }
  }
  return students;
}

export function send(res, status, payload) {
  res.status(status).setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}
