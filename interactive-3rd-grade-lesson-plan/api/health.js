import { configured, send } from "./_redis.js";

export default function handler(_req, res) {
  send(res, 200, {
    ok: true,
    configured: configured(),
    storage: configured() ? "upstash-redis-rest" : "not-configured",
  });
}
