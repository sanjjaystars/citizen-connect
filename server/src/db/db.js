const path = require('path');
const fs = require('fs');

let pgClient = null;
let sqliteDb = null;
let isPostgres = false;

// Calculate Haversine distance in meters
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function initDb() {
  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      // Test connection
      await pool.query('SELECT 1');
      pgClient = pool;
      isPostgres = true;
      console.log('Connected to PostgreSQL database');
      await setupPostgresSchema();
      return;
    } catch (err) {
      console.warn('Could not connect to PostgreSQL via DATABASE_URL, falling back to embedded SQLite:', err.message);
    }
  }

  // Fallback to built-in node:sqlite
  try {
    const { DatabaseSync } = require('node:sqlite');
    const dbPath = path.join(__dirname, '../../civic_connect.db');
    sqliteDb = new DatabaseSync(dbPath);
    sqliteDb.exec('PRAGMA foreign_keys = ON;');
    isPostgres = false;
    console.log('Using embedded SQLite database at', dbPath);
    setupSqliteSchema();
  } catch (err) {
    console.error('Failed to initialize SQLite database:', err);
    throw err;
  }
}

function setupSqliteSchema() {
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS municipalities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      municipality_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (municipality_id) REFERENCES municipalities(id)
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      municipality_id INTEGER NOT NULL,
      FOREIGN KEY (municipality_id) REFERENCES municipalities(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'citizen', -- 'citizen' or 'official'
      municipality_id INTEGER,
      ward_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (municipality_id) REFERENCES municipalities(id),
      FOREIGN KEY (ward_id) REFERENCES wards(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ward_id INTEGER NOT NULL,
      department_id INTEGER,
      category TEXT NOT NULL, -- Road, Water, Electricity, Garbage, Drainage, Other
      description TEXT NOT NULL,
      cleaned_description TEXT,
      photo_url TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      severity TEXT NOT NULL DEFAULT 'Medium', -- Low, Medium, High
      status TEXT NOT NULL DEFAULT 'Received', -- Received, In Progress, Resolved
      official_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (ward_id) REFERENCES wards(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS upvotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      query TEXT NOT NULL,
      response TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

async function setupPostgresSchema() {
  await pgClient.query(`
    CREATE EXTENSION IF NOT EXISTS postgis;

    CREATE TABLE IF NOT EXISTS municipalities (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      district VARCHAR(255) NOT NULL,
      state VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wards (
      id SERIAL PRIMARY KEY,
      municipality_id INTEGER NOT NULL REFERENCES municipalities(id),
      name VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      municipality_id INTEGER NOT NULL REFERENCES municipalities(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'citizen',
      municipality_id INTEGER REFERENCES municipalities(id),
      ward_id INTEGER REFERENCES wards(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      ward_id INTEGER NOT NULL REFERENCES wards(id),
      department_id INTEGER REFERENCES departments(id),
      category VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      cleaned_description TEXT,
      photo_url TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      geom GEOMETRY(Point, 4326),
      severity VARCHAR(50) NOT NULL DEFAULT 'Medium',
      status VARCHAR(50) NOT NULL DEFAULT 'Received',
      official_notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS posts_geom_idx ON posts USING GIST (geom);

    CREATE TABLE IF NOT EXISTS upvotes (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS chat_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      query TEXT NOT NULL,
      response TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function translatePostgresToSqlite(sql, params) {
  const sqliteParams = [];
  let sqliteSql = sql.replace(/\$(\d+)/g, (match, p1) => {
    const idx = parseInt(p1, 10) - 1;
    sqliteParams.push(params[idx]);
    return '?';
  });

  sqliteSql = sqliteSql.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');
  sqliteSql = sqliteSql.replace(/BOOLEAN/gi, 'INTEGER');
  sqliteSql = sqliteSql.replace(/RETURNING\s+\*/gi, '');

  return { sqliteSql, sqliteParams };
}

/**
 * Universal query runner:
 * Accepts standard PostgreSQL style ($1, $2) queries and translates them for SQLite if needed.
 */
async function query(text, params = []) {
  if (!isPostgres && !sqliteDb) {
    await initDb();
  }

  if (isPostgres) {
    const res = await pgClient.query(text, params);
    return { rows: res.rows, rowCount: res.rowCount };
  } else {
    const { sqliteSql, sqliteParams } = translatePostgresToSqlite(text, params);

    const trimmed = sqliteSql.trim();
    if (trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('WITH')) {
      const stmt = sqliteDb.prepare(sqliteSql);
      const rows = stmt.all(...sqliteParams);
      return { rows, rowCount: rows.length };
    } else {
      const stmt = sqliteDb.prepare(sqliteSql);
      const info = stmt.run(...sqliteParams);
      return {
        rows: info.lastInsertRowid ? [{ id: Number(info.lastInsertRowid) }] : [],
        rowCount: info.changes,
        lastInsertRowid: Number(info.lastInsertRowid),
      };
    }
  }
}

function getDatabaseEngine() {
  return isPostgres ? 'postgresql' : 'sqlite';
}

module.exports = {
  initDb,
  query,
  haversineDistanceMeters,
  getDatabaseEngine,
};
