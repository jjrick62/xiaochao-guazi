const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Multer config — file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，仅支持 jpg/png/webp/gif'));
    }
  },
});

// ===== Auth =====

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: '请输入用户名和密码' });
    }

    const admin = db.queryOne('SELECT * FROM admins WHERE username = ?', [username]);
    if (!admin) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }

    const valid = bcrypt.compareSync(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }

    req.session.adminId = admin.id;
    req.session.adminName = admin.username;
    res.json({ success: true, message: '登录成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: '已退出' });
});

router.get('/me', (req, res) => {
  if (req.session && req.session.adminId) {
    res.json({ success: true, data: { id: req.session.adminId, username: req.session.adminName } });
  } else {
    res.json({ success: false, error: '未登录' });
  }
});

// ===== Change Password =====

router.put('/api/change-password', requireAdmin, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: '请填写旧密码和新密码' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: '新密码至少6位' });
    }

    const admin = db.queryOne('SELECT * FROM admins WHERE id = ?', [req.session.adminId]);
    if (!admin) return res.status(404).json({ success: false, error: '管理员不存在' });

    const valid = bcrypt.compareSync(oldPassword, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: '旧密码错误' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    db.run('UPDATE admins SET password_hash = ? WHERE id = ?', [hash, admin.id]);
    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Dashboard Stats =====

router.get('/api/stats', requireAdmin, (req, res) => {
  try {
    const productCount = db.queryOne('SELECT COUNT(*) as count FROM products');
    const activeProductCount = db.queryOne('SELECT COUNT(*) as count FROM products WHERE status = 1');
    const carouselCount = db.queryOne('SELECT COUNT(*) as count FROM carousels');
    res.json({
      success: true,
      data: {
        totalProducts: productCount.count,
        activeProducts: activeProductCount.count,
        totalCarousels: carouselCount.count,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Products CRUD =====

router.get('/api/products', requireAdmin, (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM products';
    const params = [];
    if (category && category !== 'all') {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    sql += ' ORDER BY sort_order ASC, id ASC';
    const products = db.queryAll(sql, params);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/products', requireAdmin, (req, res) => {
  try {
    const { name, price, category, description, sort_order, status } = req.body;
    if (!name) return res.status(400).json({ success: false, error: '产品名称不能为空' });

    const id = db.run(
      'INSERT INTO products (name, price, category, description, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, parseFloat(price) || 0, category || 'melon', description || '', parseInt(sort_order) || 0, status !== undefined ? parseInt(status) : 1]
    );
    res.json({ success: true, data: { id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/products/:id', requireAdmin, (req, res) => {
  try {
    const { name, price, category, description, image, sort_order, status } = req.body;
    const product = db.queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ success: false, error: '产品不存在' });

    db.run(
      `UPDATE products SET name=?, price=?, category=?, description=?, image=?, sort_order=?, status=?, updated_at=datetime('now','localtime') WHERE id=?`,
      [
        name || product.name,
        parseFloat(price) || product.price,
        category || product.category,
        description !== undefined ? description : product.description,
        image !== undefined ? image : product.image,
        sort_order !== undefined ? parseInt(sort_order) : product.sort_order,
        status !== undefined ? parseInt(status) : product.status,
        req.params.id,
      ]
    );
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/products/:id', requireAdmin, (req, res) => {
  try {
    const product = db.queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ success: false, error: '产品不存在' });
    db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Carousels =====

router.post('/api/carousels', requireAdmin, upload.single('image'), (req, res) => {
  try {
    const { type, sort_order } = req.body;
    if (!type) return res.status(400).json({ success: false, error: '缺少分类 type' });
    if (!req.file) return res.status(400).json({ success: false, error: '请选择图片' });

    const imagePath = '/uploads/' + req.file.filename;
    const id = db.run(
      'INSERT INTO carousels (type, image, sort_order) VALUES (?, ?, ?)',
      [type, imagePath, parseInt(sort_order) || 0]
    );
    res.json({ success: true, data: { id, image: imagePath } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Also allow carousel creation via URL for existing images
router.post('/api/carousels/url', requireAdmin, (req, res) => {
  try {
    const { type, image, sort_order } = req.body;
    if (!type || !image) return res.status(400).json({ success: false, error: '缺少参数' });
    const id = db.run(
      'INSERT INTO carousels (type, image, sort_order) VALUES (?, ?, ?)',
      [type, image, parseInt(sort_order) || 0]
    );
    res.json({ success: true, data: { id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/carousels/:id', requireAdmin, (req, res) => {
  try {
    const item = db.queryOne('SELECT * FROM carousels WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ success: false, error: '记录不存在' });
    db.run('DELETE FROM carousels WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/carousels/:id/sort', requireAdmin, (req, res) => {
  try {
    const { sort_order } = req.body;
    db.run('UPDATE carousels SET sort_order = ? WHERE id = ?', [parseInt(sort_order) || 0, req.params.id]);
    res.json({ success: true, message: '排序更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Upload =====

router.post('/api/upload', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: '请选择文件' });
  }
  const imagePath = '/uploads/' + req.file.filename;
  res.json({ success: true, data: { url: imagePath, filename: req.file.filename } });
});

router.post('/api/upload-multiple', requireAdmin, upload.array('files', 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, error: '请选择文件' });
  }
  const urls = req.files.map(f => '/uploads/' + f.filename);
  res.json({ success: true, data: urls });
});

// ===== Settings =====

router.put('/api/settings', requireAdmin, (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      const exists = db.queryOne('SELECT id FROM settings WHERE key = ?', [key]);
      if (exists) {
        db.run("UPDATE settings SET value = ?, updated_at = datetime('now','localtime') WHERE key = ?", [value, key]);
      } else {
        db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
      }
    }
    res.json({ success: true, message: '设置已更新' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Admin routes (EJS pages) =====

router.get('/login', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin');
  }
  res.render('login');
});

router.get(['/', '/dashboard'], requireAdmin, (req, res) => {
  res.render('dashboard', { admin: req.session.adminName });
});

router.get('/products', requireAdmin, (req, res) => {
  res.render('products', { admin: req.session.adminName });
});

router.get('/carousels', requireAdmin, (req, res) => {
  res.render('carousels', { admin: req.session.adminName });
});

router.get('/settings', requireAdmin, (req, res) => {
  res.render('settings', { admin: req.session.adminName });
});

module.exports = router;
