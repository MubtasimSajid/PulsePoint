const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const config = {
    user: 'postgres',
    host: 'localhost',
    database: 'hospital_management',
    password: 'wirelight',
    port: 5432,
};

async function run() {
    const logFile = path.resolve('cleanup_server.log');
    const log = (msg) => {
        try { fs.appendFileSync(logFile, msg + '\n'); } catch (e) { }
    };

    log('Starting cleanup...');
    const pool = new Pool(config);

    try {
        const client = await pool.connect();
        log('Connected to DB!');

        await client.query('BEGIN');
        log('Cleaning tables...');
        await client.query(`
        TRUNCATE TABLE 
            medical_history, prescriptions, triage_notes, account_transactions, notifications,
            appointment_slots, appointments, doctor_degrees, doctor_specializations, 
            hospital_doctors, doctor_schedules, chambers, patients, doctors, hospitals, users, accounts
        CASCADE;
    `);
        await client.query('COMMIT');
        log('Cleanup DONE.');
        client.release();
    } catch (err) {
        log('Error: ' + err.toString());
    } finally {
        pool.end();
        process.exit();
    }
}

run();
