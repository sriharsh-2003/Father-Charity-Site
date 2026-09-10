// /api/testimonies
//
// The one write-capable endpoint on this site. Everything else is static.
//
// STORAGE: Upstash Redis, connected through Vercel Marketplace (Vercel's
// own KV product was retired and folded into the Marketplace in Dec 2024,
// so Upstash is the direct successor, not a workaround). Set these two
// environment variables in the Vercel project after installing the
// integration (Vercel injects them automatically if you use the Marketplace
// install flow):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
// Also set, by hand, a long random secret used only by the admin page:
//   ADMIN_TOKEN
//
// DATA SHAPE: a single Redis list, one JSON string per testimony:
//   { id, name, message, createdAt }
//
// SECURITY MODEL (deliberately minimal, matching the "no accounts" brief):
//   - POST is public (anyone can submit a testimony), but rate-limited per
//     IP and deduplicated so the same person can't flood the list.
//   - GET is public (the page needs to read the list to display it).
//   - DELETE requires the ADMIN_TOKEN as a header. There is no login page,
//     no session, no password recovery, just one shared secret. That's the
//     right amount of security for "one or two trusted people occasionally
//     remove an inappropriate entry" and the wrong amount for anything with
//     real named user accounts, if this grows, replace this with real auth.

import crypto from "node:crypto";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const LIST_KEY = "testimonies:list";
const MAX_ENTRIES = 1000;         // oldest entries fall off past this
const MAX_MESSAGE_LENGTH = 500;
const MAX_NAME_LENGTH = 80;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_PER_WINDOW = 3;
const DEDUPE_WINDOW_SECONDS = 3600;

// Upstash's REST API takes plain HTTP calls, so no SDK dependency is
// required, one less thing to install and keep updated.
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

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export default async function handler(req, res) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    res.status(500).json({ error: "Storage is not configured yet." });
    return;
  }

  if (req.method === "GET") {
    try {
      const raw = await redis(["LRANGE", LIST_KEY, "0", "-1"]);
      const testimonies = (raw || []).map((item) => JSON.parse(item));
      res.status(200).json({ testimonies });
    } catch (err) {
      res.status(500).json({ error: "Could not load testimonies." });
    }
    return;
  }

  if (req.method === "POST") {
    const ip = getClientIp(req);

    try {
      // Rate limit: at most a few submissions per IP per minute.
      const rateKey = `ratelimit:testimonies:${ip}`;
      const count = await redis(["INCR", rateKey]);
      if (count === 1) await redis(["EXPIRE", rateKey, String(RATE_LIMIT_WINDOW_SECONDS)]);
      if (count > RATE_LIMIT_MAX_PER_WINDOW) {
        res.status(429).json({ error: "Too many submissions. Please wait a moment and try again." });
        return;
      }
    } catch (err) {
      // If rate limiting itself fails, fail closed on submission rather
      // than silently allowing unlimited posts.
      res.status(500).json({ error: "Could not process submission right now." });
      return;
    }

    const body = req.body || {};
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!message) {
      res.status(400).json({ error: "A message is required." });
      return;
    }

    const cleanMessage = message.slice(0, MAX_MESSAGE_LENGTH);
    const cleanName = name.slice(0, MAX_NAME_LENGTH);

    try {
      // Duplicate guard: same IP submitting the same text again within the
      // window gets rejected, this is what "no duplicates" means here,
      // since there are no user accounts to key a duplicate check on.
      const dedupeKey = `dedupe:testimonies:${ip}:${hash(cleanMessage)}`;
      const seen = await redis(["GET", dedupeKey]);
      if (seen) {
        res.status(409).json({ error: "This looks like a duplicate submission." });
        return;
      }
      await redis(["SET", dedupeKey, "1", "EX", String(DEDUPE_WINDOW_SECONDS)]);

      const entry = {
        id: crypto.randomUUID(),
        name: cleanName || null,
        message: cleanMessage,
        createdAt: new Date().toISOString(),
      };

      await redis(["LPUSH", LIST_KEY, JSON.stringify(entry)]);
      await redis(["LTRIM", LIST_KEY, "0", String(MAX_ENTRIES - 1)]);

      res.status(201).json({ testimony: entry });
    } catch (err) {
      res.status(500).json({ error: "Could not save the testimony." });
    }
    return;
  }

  if (req.method === "DELETE") {
    const token = req.headers["x-admin-token"];
    if (!ADMIN_TOKEN || !token || token !== ADMIN_TOKEN) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const id = (req.query && req.query.id) || "";
    if (!id) {
      res.status(400).json({ error: "Missing id." });
      return;
    }

    try {
      const raw = await redis(["LRANGE", LIST_KEY, "0", "-1"]);
      const match = (raw || []).find((item) => {
        try {
          return JSON.parse(item).id === id;
        } catch {
          return false;
        }
      });
      if (!match) {
        res.status(404).json({ error: "Not found." });
        return;
      }
      await redis(["LREM", LIST_KEY, "1", match]);
      res.status(200).json({ deleted: id });
    } catch (err) {
      res.status(500).json({ error: "Could not delete the testimony." });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed." });
}
