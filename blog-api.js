const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

app.use(express.json());

const db = new sqlite3.Database('./blog.db', (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to SQLite database.');
});

// Create posts table with timestamps
db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Get all posts
app.get('/posts', (req, res) => {
  db.all('SELECT * FROM posts', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get single post
app.get('/posts/:id', (req, res) => {
  db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Post not found' });
    res.json(row);
  });
});

// Create post
app.post('/posts', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  const now = new Date().toISOString();
  db.run(
    'INSERT INTO posts (title, content, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [title, content, now, now],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        id: this.lastID,
        title,
        content,
        created_at: now,
        updated_at: now
      });
    }
  );
});

// Update post
app.put('/posts/:id', (req, res) => {
  const { title, content } = req.body;
  const updated_at = new Date().toISOString();

  db.run(
    'UPDATE posts SET title = ?, content = ?, updated_at = ? WHERE id = ?',
    [title, content, updated_at, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Post not found' });

      res.json({
        id: parseInt(req.params.id),
        title,
        content,
        updated_at
      });
    }
  );
});

// Delete post
app.delete('/posts/:id', (req, res) => {
  db.run('DELETE FROM posts WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Post not found' });
    res.status(204).send();
  });
});



// Start server
app.listen(PORT, () => {
  console.log(`Blog API with SQLite and timestamps running at http://localhost:${PORT}`);
});
