const express = require('express');
const { createClient } = require('redis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration Redis Labs (Enzo config)
const redisUrl = "redis://default:ZiISoblW8pIBJD09slHNlGEXFmaIgPDv@redis-17575.c10.us-east-1-3.ec2.cloud.redislabs.com:17575";

const getRedisClient = async () => {
  const client = createClient({ url: redisUrl });
  client.on('error', (err) => console.log('Redis Client Error', err));
  await client.connect();
  return client;
};

// 1. Obtenir les résultats réels de Redis Labs
app.get('/api/results', async (req, res) => {
  let client;
  try {
    client = await getRedisClient();
    const themes = [
      'Masquerade', 'Glam', 'Euphoria', 'Oscar Night', 'Monarch & Magnificence', 'Gatsby'
    ];
    
    const data = {};
    for (const theme of themes) {
      const val = await client.get(`vote:${theme}`);
      data[theme] = parseInt(val) || 0;
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Redis Read Error" });
  } finally {
    if (client) await client.disconnect();
  }
});

// 2. Enregistrer un vote (Incrémentation réelle)
app.post('/api/vote', async (req, res) => {
  const { theme } = req.body;
  if (!theme) return res.status(400).send("Theme required");

  let client;
  try {
    client = await getRedisClient();
    // Incrémentation atomique dans Redis
    await client.incr(`vote:${theme}`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Redis Write Error" });
  } finally {
    if (client) await client.disconnect();
  }
});

module.exports = app;
