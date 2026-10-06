const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seedAdmin() {
  console.log('🔄 Checking for default Admin account...');
  try {
    const adminEmail = 'admin@marketplace.local';
    const adminPassword = 'AdminPassword123!';

    const existingAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (existingAdmin.rows.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role, phone, address)
         VALUES ($1, $2, $3, 'admin', $4, $5)`,
        ['Marketplace Administrator', adminEmail, passwordHash, '+1234567890', 'Marketplace Headquarters']
      );

      console.log('=======================================================');
      console.log('✅ Default Admin account created successfully:');
      console.log(`   Email:    ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('=======================================================');
    } else {
      console.log('ℹ️  Default Admin account already exists.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed default Admin account:', error.message);
    process.exit(1);
  }
}

seedAdmin();
