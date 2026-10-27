const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 10004;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

const MARKS = new Set(['check', 'x', '']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── Helpers ──────────────────────────────────────────────

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function isAuthorized(req) {
  if (!ADMIN_PASSWORD) return false; // fail closed if no password is configured
  const given = String(req.headers['x-admin-password'] || '');
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
}

function readBody(req, limit = 10000) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > limit) { reject(new Error('too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function loadAttendance() {
  try {
    const data = JSON.parse(fs.readFileSync(ATTENDANCE_FILE, 'utf8'));
    return { students: data.students || [], marks: data.marks || {} };
  } catch {
    return { students: [], marks: {} };
  }
}

function saveAttendance(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = ATTENDANCE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, ATTENDANCE_FILE);
}

// ── API ──────────────────────────────────────────────────

async function handleApi(req, res, pathname) {
  if (!isAuthorized(req)) return sendJson(res, 401, { error: 'unauthorized' });

  if (pathname === '/api/login' && req.method === 'POST') {
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === '/api/attendance' && req.method === 'GET') {
    return sendJson(res, 200, loadAttendance());
  }

  if (pathname === '/api/attendance' && req.method === 'PUT') {
    let body;
    try { body = await readBody(req); } catch { return sendJson(res, 400, { error: 'bad body' }); }
    const { student, date, mark } = body;
    const data = loadAttendance();
    if (!data.students.includes(student)) return sendJson(res, 400, { error: 'unknown student' });
    if (typeof date !== 'string' || !DATE_RE.test(date)) return sendJson(res, 400, { error: 'bad date' });
    if (!MARKS.has(mark)) return sendJson(res, 400, { error: 'bad mark' });
    const key = `${student}|${date}`;
    if (mark) data.marks[key] = mark; else delete data.marks[key];
    saveAttendance(data);
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 404, { error: 'not found' });
}

// ── Static files ─────────────────────────────────────────

function serveStatic(res, pathname) {
  const rel = pathname === '/' ? 'index.html' : pathname;
  const filePath = path.resolve(PUBLIC_DIR, '.' + path.posix.normalize('/' + rel));
  // Never serve anything outside the public folder.
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    return res.end('<h1>404 Not Found</h1>');
  }
  const contentType = MIME[path.extname(filePath)] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400); return res.end();
  }
  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname).catch(() => sendJson(res, 500, { error: 'server error' }));
    return;
  }
  serveStatic(res, pathname);
});

server.listen(PORT, () => {
  console.log(`Codebusters site running on port ${PORT}`);
  if (!ADMIN_PASSWORD) console.warn('ADMIN_PASSWORD is not set — admin API is disabled.');
});
