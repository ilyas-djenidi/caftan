'use strict';

require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BACKUP_DIR = path.join(__dirname, '../backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const DB_NAME = process.env.DB_NAME || 'caftan_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup_${DB_NAME}_${timestamp}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);

  const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

  console.log(`Starting backup: ${filename}`);
  execSync(
    `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --no-owner --no-acl | gzip > "${filepath}"`,
    { env, stdio: 'inherit' }
  );
  console.log(`Backup complete: ${filepath}`);

  // Retain last 30 backups, delete older
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sql.gz'))
    .map((f) => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime }))
    .sort((a, b) => b.time - a.time);

  const toDelete = files.slice(30);
  for (const f of toDelete) {
    fs.unlinkSync(path.join(BACKUP_DIR, f.name));
    console.log(`Deleted old backup: ${f.name}`);
  }
}

backup();
