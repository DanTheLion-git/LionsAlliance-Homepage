const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;
const DATA_FILE = path.join(__dirname, 'data', 'services.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Redirect /dashboard to the dashboard HTML
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// --- Persistence helpers ---

function loadServices() {
  if (!fs.existsSync(DATA_FILE)) return getDefaultServices();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return getDefaultServices();
  }
}

function saveServices(services) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(services, null, 2));
}

function getDefaultServices() {
  return [
    { id: 1, name: 'Food Tracker',      port: 4242,  icon: '🍎', color: '#16a34a', description: 'Grocery receipts, inventory & diet diary' },
    { id: 2, name: 'Finance',           port: 3001,  icon: '💰', color: '#2563eb', description: 'Budget tracking & expense overview' },
    { id: 3, name: 'Jellyfin',          port: 8096,  icon: '🎬', color: '#7c3aed', description: 'Media streaming server' },
    { id: 4, name: 'Media Portal',      port: 5000,  icon: '📥', color: '#dc2626', description: 'Download movies & series for local playback' },
    { id: 5, name: 'Audiobook Library', port: 13378, icon: '📚', color: '#d97706', description: 'Audiobook server' },
  ];
}

// --- API routes ---

app.get('/api/services', (req, res) => {
  res.json(loadServices());
});

app.post('/api/services', (req, res) => {
  const { name, port, icon, color, description } = req.body;
  if (!name || !port) return res.status(400).json({ error: 'name and port are required' });

  const services = loadServices();
  const id = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
  const service = {
    id,
    name: String(name).trim(),
    port: Number(port),
    icon: icon || '🔧',
    color: color || '#6b7280',
    description: description ? String(description).trim() : '',
  };
  services.push(service);
  saveServices(services);
  res.status(201).json(service);
});

app.put('/api/services/:id', (req, res) => {
  const id = Number(req.params.id);
  const services = loadServices();
  const idx = services.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Service not found' });

  const { name, port, icon, color, description } = req.body;
  services[idx] = {
    ...services[idx],
    ...(name        !== undefined && { name: String(name).trim() }),
    ...(port        !== undefined && { port: Number(port) }),
    ...(icon        !== undefined && { icon }),
    ...(color       !== undefined && { color }),
    ...(description !== undefined && { description: String(description).trim() }),
  };
  saveServices(services);
  res.json(services[idx]);
});

app.delete('/api/services/:id', (req, res) => {
  const id = Number(req.params.id);
  const services = loadServices();
  const filtered = services.filter(s => s.id !== id);
  if (filtered.length === services.length) return res.status(404).json({ error: 'Service not found' });
  saveServices(filtered);
  res.json({ ok: true });
});

// All other routes → company homepage
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LionsAlliance Homepage running on http://0.0.0.0:${PORT}`);
});