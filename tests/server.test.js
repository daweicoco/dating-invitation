import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createInviteServer } from "../src/server.js";

async function withServer(fn) {
  const dir = await mkdtemp(join(tmpdir(), "dating-invite-test-"));
  await mkdir(join(dir, "data"), { recursive: true });
  const dataFile = join(dir, "data", "responses.jsonl");
  const server = createInviteServer({
    rootDir: process.cwd(),
    dataFile,
    adminKey: "test-key"
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    await fn({ baseUrl: `http://127.0.0.1:${port}`, dataFile });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
}

test("accepts a complete invite response and stores it as JSONL", async () => {
  await withServer(async ({ baseUrl, dataFile }) => {
    const response = await fetch(`${baseUrl}/api/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date: "2026-06-01",
        timeSlot: "evening",
        activity: "climbing",
        personHint: "the one who always orders matcha",
        note: "maybe after work"
      })
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });

    const [line] = (await readFile(dataFile, "utf8")).trim().split("\n");
    const saved = JSON.parse(line);
    assert.equal(saved.date, "2026-06-01");
    assert.equal(saved.timeSlot, "evening");
    assert.equal(saved.activity, "climbing");
    assert.equal(saved.personHint, "the one who always orders matcha");
    assert.equal(saved.note, "maybe after work");
    assert.match(saved.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  });
});

test("rejects incomplete invite responses, including missing identity hints", async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date: "",
        timeSlot: "evening",
        activity: "",
        personHint: ""
      })
    });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).ok, false);

    const missingHint = await fetch(`${baseUrl}/api/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date: "2026-06-01",
        timeSlot: "evening",
        activity: "tennis"
      })
    });

    assert.equal(missingHint.status, 400);
    assert.match((await missingHint.json()).error, /personHint/);
  });
});

test("renders the admin page without a key during testing", async () => {
  await withServer(async ({ baseUrl }) => {
    await fetch(`${baseUrl}/api/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date: "2026-06-02",
        timeSlot: "afternoon",
        activity: "kayaking",
        personHint: "your suspiciously competitive friend",
        note: "bring sunscreen"
      })
    });

    const allowed = await fetch(`${baseUrl}/admin`);
    const html = await allowed.text();

    assert.equal(allowed.status, 200);
    assert.equal(html.includes("Forbidden"), false);
    assert.match(html, /Invite response inbox/);
    assert.match(html, /<th>Submitted<\/th>/);
    assert.match(html, /<th>user<\/th>/);
    assert.match(html, /your suspiciously competitive friend/);
    assert.match(html, /kayaking/);
    assert.match(html, /bring sunscreen/);
    assert.equal(/[\p{Script=Han}]/u.test(html), false);
  });
});

test("serves the invite page with the expected app shell", async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<title>Dating Invite<\/title>/);
    assert.match(html, /id="invite-app"/);
    assert.match(html, /data-no-button/);
    assert.match(html, /data-person-hint/);
    assert.equal(/[\p{Script=Han}]/u.test(html), false);
  });
});
