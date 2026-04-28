const express = require('express');
const session = require('express-session');
const path = require('path');
const { getDb } = require('./db');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'xiaochao-guazi-session-secret-' + Date.now(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Static files — existing frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '.')));

// API routes
app.use('/api', apiRoutes);

// Admin routes
app.use('/admin', adminRoutes);

// Default: serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ success: false, error: '接口不存在' });
  } else {
    res.status(404).send('404 Not Found');
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api') || req.xhr) {
    res.status(500).json({ success: false, error: err.message || '服务器内部错误' });
  } else {
    res.status(500).send('服务器内部错误');
  }
});

// Start
async function start() {
  await getDb();
  app.listen(PORT, () => {
    console.log(`✓ 小潮瓜子后台服务已启动`);
    console.log(`✓ 前台网站：http://localhost:${PORT}`);
    console.log(`✓ 后台管理：http://localhost:${PORT}/admin/login`);
    console.log(`✓ 默认账号：admin / admin123`);
  });
}

start();
