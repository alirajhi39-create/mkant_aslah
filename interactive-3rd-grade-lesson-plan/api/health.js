import { healthCheck, providerLabel } from "../server/store.js";
import { send } from "../server/redis.js";

export default async function handler(_req, res) {
  const result = await healthCheck();
  send(res, 200, {
    ok: true,
    configured: result.configured,
    reachable: result.reachable,
    storage: result.configured ? result.provider : "not-configured",
    provider: providerLabel(),
    ...(result.error ? { error: result.error } : {}),
  });
}
