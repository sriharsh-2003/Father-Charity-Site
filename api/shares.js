// /api/shares
//
// A single shared counter: "how many times has this site been shared".
// Much simpler than /api/prayers (no list of entries, no content, nothing
// to moderate), just one number that goes up. Same Redis instance, same
// env var names, see the comment at the top of api/prayers.js for the
// full explanation of why those specific names.
//
// Deliberately does not try to distinguish real shares from someone
// mashing the button, beyond basic per-IP rate limiting. A share counter
// is a "roughly how much has this resonated" number, not an audited
// metric, the same honesty caveat applies here as to any public share
// count on any site.

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const COUNT_KEY = "shares:count";
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_PER_WINDOW = 10; // higher than prayers: sharing to several apps in a row is normal

async function redis(command) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    throw new Error(`Redis command failed: ${res.status}`);
  }
  const data = await res.json();
  return data.result;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

export default async function handler(req, res) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    res.status(500).json({ error: "Storage is not configured yet. Check KV_REST_API_URL / KV_REST_API_TOKEN in Vercel." });
    return;
  }

  if (req.method === "GET") {
    try {
      const count = await redis(["GET", COUNT_KEY]);
      res.status(200).json({ count: Number(count) || 0 });
    } catch (err) {
      res.status(500).json({ error: "Could not load the share count." });
    }
    return;
  }

  if (req.method === "POST") {
    const ip = getClientIp(req);

    try {
      const rateKey = `ratelimit:shares:${ip}`;
      const rateCount = await redis(["INCR", rateKey]);
      if (rateCount === 1) await redis(["EXPIRE", rateKey, String(RATE_LIMIT_WINDOW_SECONDS)]);
      if (rateCount > RATE_LIMIT_MAX_PER_WINDOW) {
        // Silently accepted from the visitor's point of view -- a share
        // button that suddenly errors after a few taps is a worse
        // experience than just not incrementing past that point.
        res.status(200).json({ count: null });
        return;
      }

      const count = await redis(["INCR", COUNT_KEY]);
      res.status(200).json({ count });
    } catch (err) {
      res.status(500).json({ error: "Could not record the share." });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed." });
}
