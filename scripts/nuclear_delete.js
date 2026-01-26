require('dotenv').config({ path: 'server/.env' });
const db = require('../server/src/config/database');

async function deleteAll() {
    try {
        console.log('Force deleting EVERYTHING...');
        // Disable triggers if possible or just nuclear delete
        await db.query(`
            TRUNCATE TABLE 
                medical_history, 
                prescriptions, 
                triage_notes,
                account_transactions,
                appointments, 
                appointment_slots, 
                doctor_schedules, 
                doctor_degrees,
                doctor_specializations, 
                hospital_doctors, 
                chambers,
                patients, 
                doctors, 
                hospitals,
                users 
            CASCADE;
        `);
        console.log('All tables truncated.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
deleteAll();
