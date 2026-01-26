require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function cleanup() {
    const logFile = 'cleanup_log.txt';
    const log = (msg) => {
        try { fs.appendFileSync(logFile, msg + '\n'); } catch (e) { }
        console.log(msg);
    };

    log('Connecting from server context...');
    try {
        const client = await pool.connect();
        log('Connected.');

        try {
            await client.query('BEGIN');

            log('Truncating tables...');
            await client.query(`
            TRUNCATE TABLE 
                medical_history, 
                prescriptions, 
                triage_notes,
                account_transactions,
                notifications,
                appointment_slots, 
                appointments,
                doctor_degrees,
                doctor_specializations, 
                hospital_doctors, 
                doctor_schedules,
                chambers,
                patients, 
                doctors, 
                hospitals,
                users
            CASCADE;
        `);

            await client.query('COMMIT');
            log('Database wiped successfully.');
        } catch (e) {
            await client.query('ROLLBACK');
            log('SQL Error: ' + e);
        } finally {
            client.release();
        }
    } catch (err) {
        log('Connection Error: ' + err);
    } finally {
        pool.end();
    }
}

cleanup();
