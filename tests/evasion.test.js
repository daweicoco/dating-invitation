import test from "node:test";
import assert from "node:assert/strict";

import {
  clampButtonPosition,
  doesOverlap,
  getDodgingPosition,
  shouldDodgePointer
} from "../public/js/evasion-core.js";

test("keeps the dodging button inside the playable area", () => {
  const position = clampButtonPosition(
    { x: 999, y: -50 },
    { width: 320, height: 220 },
    { width: 90, height: 44 },
    16
  );

  assert.deepEqual(position, { x: 214, y: 16 });
});

test("detects when the pointer is close enough for the No button to dodge", () => {
  assert.equal(
    shouldDodgePointer(
      { x: 142, y: 100 },
      { x: 120, y: 80, width: 80, height: 44 },
      72
    ),
    true
  );

  assert.equal(
    shouldDodgePointer(
      { x: 12, y: 12 },
      { x: 120, y: 80, width: 80, height: 44 },
      72
    ),
    false
  );
});

test("moves No away from the pointer and avoids the Yes button", () => {
  const position = getDodgingPosition({
    area: { width: 360, height: 260 },
    button: { width: 88, height: 44 },
    current: { x: 130, y: 110 },
    pointer: { x: 150, y: 125 },
    avoidRects: [{ x: 126, y: 180, width: 108, height: 50 }],
    margin: 14,
    random: () => 0.2
  });

  assert.equal(doesOverlap({ ...position, width: 88, height: 44 }, { x: 126, y: 180, width: 108, height: 50 }), false);
  assert.ok(Math.hypot(position.x - 150, position.y - 125) > 72);
  assert.ok(position.x >= 14);
  assert.ok(position.y >= 14);
  assert.ok(position.x <= 258);
  assert.ok(position.y <= 202);
});
