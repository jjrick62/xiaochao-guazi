const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data', 'database.sqlite');
let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');
  initTables();
  seedData();

  return db;
}

function initTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'melon',
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS carousels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      image TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);
}

function seedData() {
  // Seed default admin: admin / admin123
  const existing = db.exec('SELECT id FROM admins LIMIT 1');
  if (existing.length === 0 || existing[0].values.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', hash]);
  }

  // Seed default settings
  const defaultSettings = {
    shop_address: '三门峡市湖滨区和平路梦之城对面向东 150 米小潮瓜子',
    shop_phone: '13298271296',
    shop_hours: '早上八点到晚上九点，春节期间延长至凌晨',
    brand_story: '1998 年，小潮瓜子在三门峡和平路老街悄然开张。创始人带着一口铸铁大锅，守着祖辈传下的炒货手艺，自己加以改进，在烟火缭绕的小铺里，开启了与这座小城的味觉约定。\n\n没有花哨的添加剂，只有精选的原料，和柴火灶上的慢炒功夫。翻炒、控火、入味，每一步都拿捏得恰到好处。铁锅与瓜子碰撞的沙沙声，伴着焦香漫出店门，很快吸引了老街坊。\n\n从最初的几人排队，到后来熟客常常光顾，三十年过去，铁锅依旧，手艺未改。如今的小潮瓜子，早已是三门峡人舌尖上的老味道。每一粒炒货里，都藏着岁月沉淀的烟火气，和对传统手艺不变的坚守。',
    qrcode_image: '',
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    const exists = db.exec('SELECT id FROM settings WHERE key = ? LIMIT 1', [key]);
    if (exists.length === 0 || exists[0].values.length === 0) {
      db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
  }

  // Seed sample products if empty
  const prodCount = db.exec('SELECT COUNT(*) as c FROM products');
  if (!prodCount[0] || prodCount[0].values[0][0] === 0) {
    const sampleProducts = [
      ['原味瓜子', 18.80, 'melon', '精选优质葵花籽，传统工艺炒制，保留原味香气，颗粒饱满，口感酥脆，是您休闲时光的最佳伴侣。', '', 1],
      ['焦糖瓜子', 20.80, 'melon', '采用优质葵花籽，融入焦糖风味，色泽诱人，甜而不腻，颗颗饱满，每一口都充满甜蜜与香脆。', '', 2],
      ['五香瓜子', 19.80, 'melon', '精选葵花籽，配以多种香料精心炒制，香气浓郁，咸香适中，回味无穷，是经典的休闲零食。', '', 3],
      ['奶油瓜子', 21.80, 'melon', '优质葵花籽，加入奶油风味，香气浓郁，口感顺滑，香甜可口，让您爱不释手。', '', 4],
      ['核桃味瓜子', 22.80, 'melon', '精选葵花籽，融入核桃风味，营养丰富，香气独特，口感酥脆，是健康美味的休闲食品。', '', 5],
      ['原味花生', 16.80, 'peanut', '优质花生，传统工艺炒制，保留原味香气，颗粒饱满，口感酥脆，是您休闲时光的最佳选择。', '', 6],
      ['蒜香花生', 18.80, 'peanut', '精选花生，加入大蒜风味，香气独特，口感酥脆，蒜香浓郁，让您回味无穷。', '', 7],
      ['五香花生', 17.80, 'peanut', '优质花生，配以多种香料精心炒制，香气浓郁，咸香适中，口感酥脆，是经典的休闲零食。', '', 8],
      ['开心果', 58.80, 'nut', '精选优质开心果，颗粒饱满，色泽自然，口感酥脆，营养丰富，是健康美味的坚果零食。', '', 9],
      ['碧根果', 48.80, 'nut', '精选优质碧根果，外壳薄脆，果仁饱满，口感香甜，营养丰富，是您享受美味的最佳选择。', '', 10],
      ['巴旦木', 45.80, 'nut', '精选优质巴旦木，颗粒饱满，口感酥脆，香气浓郁，营养丰富，是健康美味的坚果零食。', '', 11],
      ['松子', 68.80, 'nut', '精选优质松子，颗粒饱满，口感细腻，香气浓郁，营养丰富，是珍贵的坚果美味。', '', 12],
    ];

    for (const p of sampleProducts) {
      db.run(
        'INSERT INTO products (name, price, category, description, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        p
      );
    }
  }

  saveDb();
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper: query all rows as array of objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: query one row as object
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: run a statement, auto-save
function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] || null;
}

module.exports = { getDb, queryAll, queryOne, run, saveDb };
