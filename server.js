import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, "out");

const MIME = {
  ".html": "text/html", ".js": "application/javascript",
  ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg",
  ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".webp": "image/webp",
};

function serve(res, filePath) {
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404); res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

http.createServer((req, res) => {
  let url = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  url = decodeURIComponent(url);

  const tryServe = (dir) => {
    const filePath = path.join(dir, url);
    const normalized = path.normalize(filePath);
    if (!normalized.startsWith(dir)) {
      return null;
    }
    return new Promise((resolve) => {
      fs.stat(normalized, (err, stats) => {
        if (err || !stats.isFile()) resolve(null);
        else resolve(normalized);
      });
    });
  };

  (async () => {
    let found = await tryServe(OUT_DIR);
    if (!found && url === "/index.html") found = path.join(ROOT, "index.html");
    if (!found) found = await tryServe(OUT_DIR);
    if (!found) {
      found = path.join(ROOT, "index.html");
      const stat = await fs.promises.stat(found).catch(() => null);
      if (!stat) { res.writeHead(404); res.end("Not found"); return; }
    }
    serve(res, found);
  })();
}).listen(PORT, () => console.log(`Server on port ${PORT}`));
