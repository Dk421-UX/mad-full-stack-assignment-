const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');

const app = express();
const PORT = 3000;
const DATA = path.join(__dirname, 'data');
const UPLOADS = path.join(__dirname, 'uploads');
fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(UPLOADS, { recursive: true });

const db = new sqlite3.Database(path.join(DATA, 'students.db'));
db.run(`CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, college TEXT,
  department TEXT, year TEXT, projectTitle TEXT, projectCategory TEXT,
  projectDescription TEXT, comments TEXT, photo TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)`);

const upload = multer({
  dest: UPLOADS,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /image\/(jpeg|png|webp)/.test(file.mimetype))
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/students', upload.single('photo'), (req, res) => {
  const d = req.body;
  if (!d.name || !d.email) return res.status(400).json({ error: 'Name and email are required' });
  const photo = req.file ? '/uploads/' + req.file.filename : '';
  const sql = `INSERT INTO students
    (name,email,phone,college,department,year,projectTitle,projectCategory,projectDescription,comments,photo)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
  const values = [d.name,d.email,d.phone,d.college,d.department,d.year,d.projectTitle,d.projectCategory,d.projectDescription,d.comments,photo];
  db.run(sql, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Saved successfully' });
  });
});

app.get('/api/students', (req, res) => {
  db.all('SELECT * FROM students ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/students/:id', (req, res) => {
  db.get('SELECT * FROM students WHERE id=?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Student not found' });
    res.json(row);
  });
});

app.listen(PORT, () => console.log(`Viyaan AI app: http://localhost:${PORT}`));
