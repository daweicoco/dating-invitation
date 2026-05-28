function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function centerOf(rect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
}

export function clampButtonPosition(position, area, button, margin = 12) {
  return {
    x: clamp(position.x, margin, Math.max(margin, area.width - button.width - margin)),
    y: clamp(position.y, margin, Math.max(margin, area.height - button.height - margin))
  };
}

export function doesOverlap(a, b, gap = 8) {
  return !(
    a.x + a.width + gap < b.x ||
    b.x + b.width + gap < a.x ||
    a.y + a.height + gap < b.y ||
    b.y + b.height + gap < a.y
  );
}

export function shouldDodgePointer(pointer, buttonRect, radius = 84) {
  const buttonCenter = centerOf(buttonRect);
  return Math.hypot(pointer.x - buttonCenter.x, pointer.y - buttonCenter.y) <= radius;
}

export function getDodgingPosition({
  area,
  button,
  current,
  pointer,
  avoidRects = [],
  margin = 12,
  random = Math.random
}) {
  const maxX = Math.max(margin, area.width - button.width - margin);
  const maxY = Math.max(margin, area.height - button.height - margin);
  const minDistance = Math.max(72, Math.min(area.width, area.height) * 0.26);
  const attempts = 18;

  for (let i = 0; i < attempts; i += 1) {
    const angle = random() * Math.PI * 2;
    const distance = minDistance + random() * 90;
    const candidate = clampButtonPosition(
      {
        x: pointer.x + Math.cos(angle) * distance - button.width / 2,
        y: pointer.y + Math.sin(angle) * distance - button.height / 2
      },
      area,
      button,
      margin
    );

    const candidateRect = { ...candidate, ...button };
    const farEnough = Math.hypot(candidate.x - pointer.x, candidate.y - pointer.y) > 72;
    const avoidsTargets = avoidRects.every((rect) => !doesOverlap(candidateRect, rect));
    const moved = Math.hypot(candidate.x - current.x, candidate.y - current.y) > 24;

    if (farEnough && avoidsTargets && moved) {
      return candidate;
    }
  }

  const fallback = clampButtonPosition(
    {
      x: pointer.x < area.width / 2 ? maxX : margin,
      y: pointer.y < area.height / 2 ? maxY : margin
    },
    area,
    button,
    margin
  );

  const fallbackRect = { ...fallback, ...button };
  if (avoidRects.every((rect) => !doesOverlap(fallbackRect, rect))) {
    return fallback;
  }

  return clampButtonPosition(
    { x: maxX, y: margin },
    area,
    button,
    margin
  );
}
