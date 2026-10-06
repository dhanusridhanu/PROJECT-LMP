const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Initialize the PostgreSQL connection pool
// A connection pool maintains active database connections ready to handle queries efficiently.
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'handicraft_marketplace',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection cannot be established
});

// Event listener for unexpected errors on idle clients
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

/**
 * Execute a parameterized SQL query
 * @param {string} text - SQL query string with placeholders ($1, $2, ...)
 * @param {Array} params - Array of parameter values to prevent SQL injection
 */
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query:', { text: text.trim().substring(0, 80) + '...', duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
};

/**
 * Acquire a dedicated client for running transactions (BEGIN / COMMIT / ROLLBACK)
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Test connectivity on application boot
 */
const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW() AS current_time');
    console.log(`✅ Connected to PostgreSQL successfully at: ${res.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL database.');
    console.error('Error detail:', error.message);
    console.error('Please verify that:');
    console.error(' 1. PostgreSQL service is running on your machine.');
    console.error(' 2. The database "handicraft_marketplace" exists.');
    console.error(' 3. The credentials in server/.env are correct.');
    return false;
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};
