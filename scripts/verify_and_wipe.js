const { Pool } = require('pg');

const config = {
    user: 'postgres',
    host: 'localhost',
    database: 'hospital_management',
    password: 'wirelight',
    port: 5432,
};

console.log('Using config:', { ...config, password: '****' });

const fs = require('fs');

async function log(msg) {
    console.log(msg);
    try { fs.appendFileSync('scripts/logs.txt', msg + '\n'); } catch (e) { }
}

const pool = new Pool(config);

async function run() {
    log('Connecting...');
    try {
        const client = await pool.connect();
        log('Connected successfully!');

        // Check row count before
        const startCount = await client.query('SELECT COUNT(*) FROM users');
        log('Users before wipe: ' + startCount.rows[0].count);

        log('Executing TRUNCATE CASCADE...');
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
            users,
            accounts
        CASCADE;
    `);
        console.log('TRUNCATE executed.');

        // Check row count after
        const endCount = await client.query('SELECT COUNT(*) FROM users');
        console.log('Users after wipe:', endCount.rows[0].count);

        client.release();
    } catch (err) {
        console.error('ERROR OCCURRED:', err);
    } finally {
        pool.end();
    }
}

run();
