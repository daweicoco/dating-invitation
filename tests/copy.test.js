import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { copy, activities, timeSlots } from "../public/js/copy.js";

test("defines editable copy for every invite step without copying the reference line", () => {
  assert.ok(copy.intro.title);
  assert.ok(copy.date.title);
  assert.ok(copy.activity.title);
  assert.ok(copy.result.title);

  const serialized = JSON.stringify(copy);
  assert.equal(serialized.includes("Will you go on a date with me"), false);
  assert.equal(serialized.includes("So... when are you free"), false);
});

test("offers activity choices beyond dinner", () => {
  const ids = activities.map((activity) => activity.id);

  assert.ok(ids.includes("climbing"));
  assert.ok(ids.includes("kayaking"));
  assert.ok(ids.includes("drinks"));
  assert.ok(ids.includes("tennis"));
  assert.ok(ids.includes("meal"));
  assert.ok(ids.includes("custom"));
});

test("defines English copy for identity clue and optional note fields", () => {
  assert.equal(copy.activity.customLabel, "Custom activity");
  assert.equal(copy.activity.identityLabel, "Give me a clue only we would understand to know who you are");
  assert.equal(copy.activity.identityPlaceholder, "");
  assert.equal(copy.activity.noteLabel, "Optional note");
  assert.equal(copy.activity.notePlaceholder, "Anything else I should know? ");
  assert.equal(copy.activity.notePlaceholder.includes("nosy"), false);
});

test("uses a clean exhibition activity label", () => {
  const exhibition = activities.find((activity) => activity.id === "exhibition");
  assert.equal(exhibition.label, "exhibition");
});

test("uses emoji icons for activity choices", () => {
  assert.deepEqual(
    activities.map((activity) => activity.icon),
    ["\u{1F9D7}", "\u{1F6A3}", "\u{1F378}", "\u{1F3BE}", "\u2615", "\u{1F5BC}\uFE0F", "\u{1F37D}\uFE0F", "\u2728"]
  );
});

test("offers broad time slots for a low-friction invite", () => {
  assert.deepEqual(
    timeSlots.map((slot) => slot.id),
    ["lunch", "afternoon", "evening", "flexible"]
  );
});

test("keeps project-facing text English-only", async () => {
  const textFiles = [
    "README.md",
    "docs/copy-deck.md",
    "public/index.html",
    "public/js/app.js",
    "public/js/copy.js",
    "src/server.js"
  ];

  for (const file of textFiles) {
    const content = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.equal(/[\p{Script=Han}]/u.test(content), false, `${file} contains Chinese characters`);
    assert.equal(/[çæåäœŒèéïð]/u.test(content), false, `${file} contains mojibake text`);
  }
});
