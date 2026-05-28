import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function getRule(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "m"));
  return match?.[1] ?? "";
}

test("makes the playful No hint prominent and visually separate from form status text", async () => {
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  const hintRule = getRule(css, ".no-hint");
  const bubbleRule = getRule(css, ".no-hint:not(:empty)");
  const statusRule = getRule(css, ".status-line");

  assert.match(hintRule, /font-size:\s*2[0-9]px/);
  assert.match(hintRule, /font-weight:\s*900/);
  assert.match(bubbleRule, /display:\s*inline-block/);
  assert.match(bubbleRule, /background:\s*#fff0f5/);
  assert.match(statusRule, /font-size:\s*14px/);
});

test("makes activity titles visually larger than explanatory text", async () => {
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  const titleRule = getRule(css, ".choice-card strong");
  const detailRule = getRule(css, ".choice-card span");
  const iconRule = getRule(css, ".choice-icon");

  assert.match(titleRule, /font-size:\s*(1[8-9]|2[0-9])px/);
  assert.match(titleRule, /font-weight:\s*900/);
  assert.match(detailRule, /font-size:\s*12px/);
  assert.match(iconRule, /font-size:\s*(2[8-9]|3[0-9])px/);
});
