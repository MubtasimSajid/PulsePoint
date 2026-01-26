require('dotenv').config({ path: 'server/.env' });
const db = require('../server/src/config/database');
const fs = require('fs');

const logFile = 'scripts/delete_log.txt';
function log(msg) {
    try { fs.appendFileSync(logFile, msg + '\n'); } catch (e) { }
    console.log(msg);
}

async function deleteUsers() {
    log('Starting deletion process...');
    try {
        // 1. Delete medical history (references doctors/patients)
        log('Deleting medical history...');
        await db.query('DELETE FROM medical_history');

        // 2. Delete prescriptions (references appointments)
        log('Deleting prescriptions...');
        await db.query('DELETE FROM prescriptions');

        // 3. Delete triage notes (references appointments)
        log('Deleting triage notes...');
        try {
            await db.query('DELETE FROM triage_notes');
        } catch (e) { log('triage_notes table might not exist or empty'); }

        // 4. Delete account transactions (references accounts)
        log('Deleting account transactions...');
        await db.query('DELETE FROM account_transactions');

        // 5. Delete appointments (references doctors causing constraint issues)
        log('Deleting appointments...');
        await db.query('DELETE FROM appointments');

        // 6. Delete appointment_slots (references doctors)
        log('Deleting appointment slots...');
        try {
            await db.query('DELETE FROM appointment_slots');
        } catch (e) { log('appointment_slots table might not exist'); }

        // 7. Delete doctor schedules
        log('Deleting doctor schedules...');
        try {
            await db.query('DELETE FROM doctor_schedules');
        } catch (e) { log('doctor_schedules table might not exist'); }

        // 8. Delete hospital_doctors and other doctor relations
        log('Deleting doctor relations...');
        await db.query('DELETE FROM hospital_doctors');
        await db.query('DELETE FROM doctor_specializations');
        await db.query('DELETE FROM doctor_degrees');
        await db.query('DELETE FROM chambers');

        // 9. Finally delete users (Cascades to patients and doctors tables)
        log('Deleting users (patients and doctors)...');
        const result = await db.query("DELETE FROM users WHERE role IN ('patient', 'doctor') RETURNING user_id, role");

        log(`Deleted ${result.rows.length} users.`);

    } catch (error) {
        log('Error during deletion: ' + error);
    } finally {
        process.exit();
    }
}

deleteUsers();
