require('dotenv').config({ path: 'server/.env' });
const db = require('../server/src/config/database');
const fs = require('fs');

const logFile = 'scripts/db_state.txt';

function log(msg) {
    try {
        fs.appendFileSync(logFile, msg + '\n');
    } catch (e) {
        // console.error(e);
    }
}

log('Starting script...');
log('DB Config: ' + JSON.stringify({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD ? '****' : 'MISSING'
}, null, 2));

async function checkState() {
    log('Connecting to DB...');
    try {
        const hospitals = await db.query('SELECT * FROM hospitals LIMIT 5');
        log('Hospitals: ' + JSON.stringify(hospitals.rows, null, 2));

        const chambers = await db.query('SELECT * FROM chambers LIMIT 5');
        log('Chambers: ' + JSON.stringify(chambers.rows, null, 2));

        const doctors = await db.query('SELECT * FROM doctors LIMIT 5');
        log('Doctors: ' + JSON.stringify(doctors.rows, null, 2));

        const slots = await db.query('SELECT * FROM appointment_slots LIMIT 5');
        log('Slots: ' + JSON.stringify(slots.rows, null, 2));

        // Check if location column exists
        const locationCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'hospitals' AND column_name = 'location'
    `);
        log('Hospital location column: ' + JSON.stringify(locationCheck.rows, null, 2));

    } catch (error) {
        log('Error: ' + error.toString());
    } finally {
        log('Exiting...');
        process.exit();
    }
}

checkState();
