const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:sBROyPJOHojRoUsbRrExfcRhiGCRnvst@postgres.railway.internal:5432/railway', // Paste the DATABASE_URL from Railway
});

module.exports = pool;