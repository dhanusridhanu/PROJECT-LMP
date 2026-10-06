const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function initializeDatabase() {
  console.log('🔄 Initializing database schema...');
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Execute the complete schema SQL script
    await pool.query(sql);

    console.log('✅ All tables, constraints, indexes, and seed categories created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error executing schema initialization:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
