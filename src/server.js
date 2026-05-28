import { createReadStream } from "node:fs";
import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import http from "node:http";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const defaultRootDir = resolve(__dirname, "..");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, text, contentType = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store"
  });
  response.end(text);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function readRequestJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) {
      const error = new Error("Payload too large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function normalizeSubmission(payload) {
  const date = String(payload.date ?? "").trim();
  const timeSlot = String(payload.timeSlot ?? "").trim();
  const activity = String(payload.activity ?? "").trim();
  const activityLabel = String(payload.activityLabel ?? activity).trim();
  const personHint = String(payload.personHint ?? "").trim().slice(0, 160);
  const note = String(payload.note ?? "").trim().slice(0, 500);
  const customActivity = String(payload.customActivity ?? "").trim().slice(0, 120);

  if (!date || !timeSlot || !activity || !personHint) {
    return {
      ok: false,
      error: "date, timeSlot, activity and personHint are required"
    };
  }

  return {
    ok: true,
    value: {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      date,
      timeSlot,
      activity,
      activityLabel,
      customActivity,
      personHint,
      note
    }
  };
}

async function renderAdminPage(dataFile) {
  let lines = [];
  try {
    const raw = await readFile(dataFile, "utf8");
    lines = raw.split("\n").filter(Boolean);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  const rows = lines
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();

  const body = rows.length
    ? rows.map((item) => `
        <tr>
          <td>${escapeHtml(new Date(item.createdAt).toLocaleString("en-US", { hour12: false }))}</td>
          <td>${escapeHtml(item.date)}</td>
          <td>${escapeHtml(item.timeSlot)}</td>
          <td>${escapeHtml(item.activityLabel || item.activity)}${item.customActivity ? `<br><small>${escapeHtml(item.customActivity)}</small>` : ""}</td>
          <td>${escapeHtml(item.personHint)}</td>
          <td>${escapeHtml(item.note)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="6" class="empty">No responses yet.</td></tr>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invite Responses</title>
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #fff8f6; color: #2b171b; }
    main { width: min(960px, calc(100vw - 32px)); margin: 36px auto; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    p { margin: 0 0 22px; color: #7a5b62; }
    table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 14px; background: white; box-shadow: 0 16px 50px rgba(91, 36, 50, .12); }
    th, td { padding: 14px 16px; border-bottom: 1px solid #f1dfe4; text-align: left; vertical-align: top; }
    th { font-size: 13px; color: #8a4c5c; background: #ffe6ee; }
    small, .empty { color: #8b6c74; }
  </style>
</head>
<body>
  <main>
    <h1>Invite response inbox</h1>
    <p>Newest submissions are at the top. This page is protected by the key in the URL, so do not share it publicly.</p>
    <table>
      <thead>
        <tr>
          <th>Submitted</th>
          <th>Date</th>
          <th>Time slot</th>
          <th>Activity</th>
          <th>user</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  </main>
</body>
</html>`;
}

async function serveStatic(request, response, rootDir) {
  const publicDir = resolve(rootDir, "public");
  const url = new URL(request.url, "http://localhost");
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const targetPath = normalize(join(publicDir, pathname));
  const resolvedPath = resolve(targetPath);

  if (!resolvedPath.startsWith(publicDir)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const info = await stat(resolvedPath);
    if (!info.isFile()) {
      sendText(response, 404, "Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": mimeTypes[extname(resolvedPath)] || "application/octet-stream",
      "cache-control": "public, max-age=300"
    });
    createReadStream(resolvedPath).pipe(response);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendText(response, 404, "Not found");
      return;
    }
    throw error;
  }
}

export function createInviteServer({
  rootDir = defaultRootDir,
  dataFile = join(rootDir, "data", "responses.jsonl")
} = {}) {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");

      if (request.method === "POST" && url.pathname === "/api/submit") {
        const payload = await readRequestJson(request);
        const normalized = normalizeSubmission(payload);

        if (!normalized.ok) {
          sendJson(response, 400, { ok: false, error: normalized.error });
          return;
        }

        await mkdir(dirname(dataFile), { recursive: true });
        await appendFile(dataFile, `${JSON.stringify(normalized.value)}\n`, "utf8");
        sendJson(response, 200, { ok: true });
        return;
      }

      if (request.method === "GET" && url.pathname === "/admin") {
        sendText(response, 200, await renderAdminPage(dataFile), "text/html; charset=utf-8");
        return;
      }

      if (request.method === "GET" || request.method === "HEAD") {
        await serveStatic(request, response, rootDir);
        return;
      }

      sendText(response, 405, "Method not allowed");
    } catch (error) {
      if (error.statusCode === 413) {
        sendJson(response, 413, { ok: false, error: "Payload too large" });
        return;
      }
      if (error instanceof SyntaxError) {
        sendJson(response, 400, { ok: false, error: "Invalid JSON" });
        return;
      }
      sendJson(response, 500, { ok: false, error: "Server error" });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const server = createInviteServer();
  server.listen(port, () => {
    console.log(`Dating invite listening on http://127.0.0.1:${port}`);
    console.log(`Admin page: http://127.0.0.1:${port}/admin`);
  });
}
