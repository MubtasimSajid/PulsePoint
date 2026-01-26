require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function checkTables() {
    console.log('--- Database Status ---');
    try {
        const client = await pool.connect();

        // Helper to get count
        const getCount = async (table) => {
            const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
            return parseInt(res.rows[0].count);
        };

        const tables = ['users', 'patients', 'doctors', 'appointments'];

        for (const table of tables) {
            const count = await getCount(table);
            console.log(`${table.padEnd(15)}: ${count} rows`);
            if (count > 0 && table === 'users') {
                const users = await client.query('SELECT user_id, email, role FROM users LIMIT 5');
                console.log('  Samples:', users.rows);
            }
        }

        client.release();
    } catch (err) {
        console.error('Error connecting/querying:', err);
    } finally {
        pool.end();
    }
}

checkTables();
