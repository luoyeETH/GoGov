#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const dns = require("dns");

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

function normalizeTtsUrl(value) {
  if (!value) {
    return null;
  }
  const trimmed = String(value).trim().replace(/\/$/, "");
  if (!trimmed) {
    return null;
  }
  if (trimmed.endsWith("/synthesize")) {
    return trimmed;
  }
  return `${trimmed}/synthesize`;
}

function clampSpeed(value) {
  if (!Number.isFinite(value)) {
    return 1.0;
  }
  return Math.min(2, Math.max(0.5, value));
}

function buildCacheKey(text, speaker, speed) {
  const normalizedSpeed = Number.isFinite(speed) ? speed.toFixed(2) : "1.00";
  return crypto
    .createHash("sha1")
    .update(`${speaker}|${normalizedSpeed}|${text}`)
    .digest("hex");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const apiUrl = normalizeTtsUrl(
  process.env.INTERVIEW_TTS_API_URL || process.env.INTERVIEW_TTS_BASE_URL
);
const apiKey = (process.env.INTERVIEW_TTS_API_KEY || "").trim();
const speaker = (process.env.INTERVIEW_TTS_SPEAKER || "").trim();
const speed = clampSpeed(Number.parseFloat(process.env.INTERVIEW_TTS_SPEED || ""));

if (!apiUrl) {
  console.error("Missing INTERVIEW_TTS_API_URL or INTERVIEW_TTS_BASE_URL");
  process.exit(1);
}
if (!apiKey) {
  console.error("Missing INTERVIEW_TTS_API_KEY");
  process.exit(1);
}
if (!speaker) {
  console.error("Missing INTERVIEW_TTS_SPEAKER");
  process.exit(1);
}

const presetsPath = path.join(rootDir, "src", "interview", "presets.json");
if (!fs.existsSync(presetsPath)) {
  console.error(`Presets file not found: ${presetsPath}`);
  process.exit(1);
}

const presets = JSON.parse(fs.readFileSync(presetsPath, "utf8"));
const introScripts = presets.intro || {};
const questionsByType = presets.questionsByType || {};
const questionsByDifficulty = presets.questions || {};

const limitPerType = Number.parseInt(process.env.TTS_PRESET_LIMIT || "5", 10) || 5;
const throttleMs = Number.parseInt(process.env.TTS_THROTTLE_MS || "7000", 10) || 7000;

const textSet = new Set();
const addText = (text) => {
  const trimmed = String(text || "").trim();
  if (trimmed) {
    textSet.add(trimmed);
  }
};

Object.values(introScripts).forEach(addText);
Object.values(questionsByType).forEach((items) => {
  if (!Array.isArray(items)) return;
  items.slice(0, limitPerType).forEach(addText);
});
Object.values(questionsByDifficulty).forEach((items) => {
  if (!Array.isArray(items)) return;
  items.slice(0, limitPerType).forEach(addText);
});

const ttsCacheDir = path.join(rootDir, "tts-cache");
fs.mkdirSync(ttsCacheDir, { recursive: true });

const texts = Array.from(textSet);
if (texts.length === 0) {
  console.log("No preset texts found.");
  process.exit(0);
}

console.log(`Found ${texts.length} preset texts.`);
console.log(`Speaker=${speaker}, speed=${speed.toFixed(2)}, throttle=${throttleMs}ms`);

async function fetchTts(text) {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, speaker, speed, stream: false }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer;
}

async function run() {
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < texts.length; i += 1) {
    const text = texts[i];
    const cacheKey = buildCacheKey(text, speaker, speed);
    const cachePath = path.join(ttsCacheDir, `${cacheKey}.wav`);

    if (fs.existsSync(cachePath)) {
      skipped += 1;
      continue;
    }

    try {
      const audio = await fetchTts(text);
      fs.writeFileSync(cachePath, audio);
      generated += 1;
      console.log(`Saved ${i + 1}/${texts.length} -> ${path.basename(cachePath)}`);
    } catch (err) {
      failed += 1;
      console.error(`Failed ${i + 1}/${texts.length}: ${err.message || err}`);
    }

    if (i < texts.length - 1) {
      await sleep(throttleMs);
    }
  }

  console.log(`Done. generated=${generated}, skipped=${skipped}, failed=${failed}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
