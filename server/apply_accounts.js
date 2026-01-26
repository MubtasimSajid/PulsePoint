require('dotenv').config({ path: '../.env' }); // Adjust path if running from server/sql or similar
// Actually, let's look for .env in current dir or parent
const path = require('path');
const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const { Pool } = require('pg');
const fs = require('fs');

const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
};

// Fallback if env vars missing (local dev context)
if (!process.env.DB_USER) {
    config.user = 'postgres';
    config.password = 'wirelight';
    config.database = 'hospital_management';
}

console.log('Using config:', { ...config, password: '****' });

const pool = new Pool(config);

async function run() {
    try {
        const client = await pool.connect();
        console.log('Connected.');

        const sqlPath = path.join(__dirname, 'sql/accounts_schema.sql');
        if (!fs.existsSync(sqlPath)) {
            console.error('SQL file not found at:', sqlPath);
            process.exit(1);
        }
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying schema...');
        await client.query(sql);
        console.log('Schema applied successfully.');

        client.release();
    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

run();
