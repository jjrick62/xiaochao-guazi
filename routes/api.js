const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取产品列表
router.get('/products', (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM products WHERE status = 1';
    const params = [];
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY sort_order ASC, id ASC';
    const products = db.queryAll(sql, params);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取单个产品
router.get('/products/:id', (req, res) => {
  try {
    const product = db.queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ success: false, error: '产品不存在' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取轮播图
router.get('/carousels', (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM carousels';
    const params = [];
    if (type) {
      sql += ' WHERE type = ?';
      params.push(type);
    }
    sql += ' ORDER BY sort_order ASC, id ASC';
    const carousels = db.queryAll(sql, params);
    res.json({ success: true, data: carousels });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取店铺设置
router.get('/settings', (req, res) => {
  try {
    const settings = db.queryAll('SELECT key, value FROM settings');
    const result = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
