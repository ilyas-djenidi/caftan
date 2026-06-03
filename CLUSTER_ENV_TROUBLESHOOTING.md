# 🔧 Cluster Mode + Environment Variables Troubleshooting

## 📌 المشكلة التي حدثت

```
GET /api/health =>
{
  "status": "degraded",
  "database": "error",
  "cache": "unavailable"
}
```

**السبب الحقيقي:**
- `server.js` لم يكن يحمل `dotenv`
- كل worker في Cluster لم يرث متغيرات البيئة من `.env`
- Database connection attempts استخدمت undefined credentials

---

## ✅ الحلول المطبقة

### 1. **تحميل dotenv في البداية (server.js)**

```javascript
// CRITICAL: Load dotenv FIRST in every process (master + workers)
if (!process.env.DB_HOST) {
  require('dotenv').config();
}
```

**لماذا؟**
- dotenv يحمل البيانات من `.env` قبل cluster fork
- كل process (master + workers) يستدعي server.js
- التحقق `!process.env.DB_HOST` يتجنب duplicate loading

### 2. **إضافة environment diagnostics (server.js)**

```javascript
console.log("  NODE_ENV after:", process.env.NODE_ENV);
console.log("  env.db.host:", env.db.host);
console.log("  env.db.user:", env.db.user);
console.log("  env.db.database:", env.db.database);
console.log("  env.db.poolMax:", env.db.poolMax);
```

**الفائدة:**
- رؤية القيم المحملة فعلياً
- تشخيص سريع للمشاكل

### 3. **DB Connection Verification (server.js)**

```javascript
// ✅ Verify DB connection in master before spawning workers
(async () => {
  try {
    const res = await pool.query('SELECT 1');
    logger.info('✓ Master verified DB connection before workers');
  } catch (err) {
    logger.error('✗ Master DB connection FAILED before workers');
    logger.error('  This likely means environment variables are not loaded correctly');
    process.exit(1);
  }
})();
```

**الفائدة:**
- Fail fast إذا كانت البيانات غير موجودة
- منع spawn workers بدون DB connection

### 4. **تحسين health check endpoint**

```javascript
try {
  const result = await pool.query('SELECT NOW() as timestamp');
  dbOk = true;
  logger.debug('✓ Health check: DB OK');
} catch (err) {
  dbError = err.message;
  logger.warn('✗ Health check: DB failed', { error: err.message, code: err.code });
}

res.json({
  status: dbOk ? 'ok' : 'degraded',
  database: dbOk ? 'connected' : `error: ${dbError}`,
  cache: cacheOk ? 'connected' : 'unavailable',
  pid: process.pid,  // Which worker?
  timestamp: new Date().toISOString(),
});
```

**الفائدة:**
- رسائل خطأ واضحة
- معرفة أي worker فشل

---

## 🧪 كيفية الاختبار

### 1. التحقق من environment variables

```bash
node -e "console.log(process.env.DB_USER, process.env.DB_PASSWORD)"
```

### 2. تشغيل مع logging مفصل

```bash
DEBUG=true npm start
# أو مع development
npm run dev
```

### 3. اختبار health endpoint

```bash
curl http://localhost:4000/api/health
```

**النتيجة المتوقعة:**
```json
{
  "status": "ok",
  "uptime": 2.345,
  "pid": 12345,
  "database": "connected",
  "cache": "connected",
  "timestamp": "2026-06-03T10:30:00.000Z"
}
```

---

## 🚀 عمارة الإنتاج (Production Architecture)

### خيار 1: Cluster Mode (الحالي) ✅

**الإيجابيات:**
- Native Node.js clustering
- Graceful shutdown مدمج
- الموارد محددة مسبقاً

**السلبيات:**
- No automatic restart على crash
- Logs معقدة مع multiple processes
- Requires custom health checks

### خيار 2: PM2 (موصى به) ⭐

**الإيجابيات:**
- Automatic restart على crash
- Process monitoring
- Logs سهلة
- Graceful shutdown built-in
- Cluster mode مدمج

**الإجراء:**
```bash
npm install -g pm2

# ecosystem.config.js بالفعل موجود
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit
pm2 logs

# إعادة تشغيل
pm2 restart all
pm2 reload all  # Graceful restart
```

**ecosystem.config.js (existing):**
```javascript
module.exports = {
  apps: [{
    name: 'caftan-api',
    script: './src/server.js',
    instances: 'max',  // استخدم جميع CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### خيار 3: Docker + Kubernetes (للمستقبل)

- Containerize مع Docker
- Deploy على K8s for auto-scaling

---

## 📊 Checklist للإصلاح

- [x] تحميل dotenv قبل cluster fork
- [x] إضافة diagnostics للـ environment variables
- [x] Verify DB connection في master قبل workers
- [x] تحسين health check endpoint
- [x] إضافة logging مفصل
- [ ] Migration إلى PM2 (اختياري لكن موصى به)
- [ ] إعداد monitoring/alerts

---

## 🔍 إذا استمرت المشاكل

### Debug القائمة:

1. **Check .env file exists**
   ```bash
   cat backend/.env | grep DB_
   ```

2. **Check environment variables are loaded**
   ```bash
   npm run dev 2>&1 | grep -E "DB_|env\."
   ```

3. **Verify PostgreSQL is running**
   ```bash
   # Windows
   psql -U postgres -d caftan_db -c "SELECT 1"
   
   # Or check service
   Get-Service postgres*
   ```

4. **Check firewall/network**
   ```bash
   # Test connection
   psql -h 127.0.0.1 -U caftan_user -d caftan_db
   ```

5. **Check pool configuration**
   - المنافذ صحيحة؟
   - الـ credentials صحيحة؟
   - SSL disabled؟

---

## 📝 ملاحظات مهمة

- ✅ `ssl: false` مناسب للـ local/LAN connections
- ✅ Windows Server قد يتطلب Firewall rules للـ port 5432
- ✅ Cluster mode على Windows يعمل لكن PM2 أفضل
- ✅ كل worker يفتح اتصال pool منفصل (اضبط `max: 20` إذا كانت عددية)

---

## 🎯 Next Steps

1. **اختبر الآن:**
   ```bash
   npm run migrate
   npm run dev
   curl http://localhost:4000/api/health
   ```

2. **بعد التأكد من النجاح:**
   - النقل إلى PM2
   - إعداد monitoring
   - تحسين logging

