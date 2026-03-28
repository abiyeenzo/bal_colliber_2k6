const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Base de données PostgreSQL (Railway)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(cors());
app.use(express.json());

// Initialisation de la table des votes
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        theme VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("DB Initialized");
  } catch (err) {
    console.error("DB Error:", err);
  }
};
initDb();

// 1. Obtenir tous les résultats réels
app.get('/api/results', async (req, res) => {
  try {
    const result = await pool.query('SELECT theme, COUNT(*) as count FROM votes GROUP BY theme');
    const data = {};
    const themes = [
      'Monarchs & Magnificence', 'House of Majesty', 'Imperial Legacy', 
      'A Night of Sovereigns', 'Crowns & Legacy', 'Gatsby', 'Bridgerton'
    ];
    
    // Initialiser à 0 pour éviter le NaN%
    themes.forEach(t => data[t] = 0);
    result.rows.forEach(row => {
      data[row.theme] = parseInt(row.count);
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// 2. Enregistrer un vote
app.post('/api/vote', async (req, res) => {
  const { theme } = req.body;
  if (!theme) return res.status(400).send("Theme required");

  try {
    await pool.query('INSERT INTO votes (theme) VALUES ($1)', [theme]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to vote" });
  }
});

// Servir le Frontend React (après le build)
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
