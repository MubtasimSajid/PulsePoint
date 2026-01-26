require('dotenv').config({ path: 'server/.env' });
try {
    require('dotenv'); // Check if it can be found normally
} catch (e) {
    // If not found, try to add server/node_modules to the path
    module.paths.push(require('path').join(__dirname, '../server/node_modules'));
}

const db = require('../server/src/config/database');
const fs = require('fs');

const logFile = 'scripts/seed_log.txt';
function log(msg) { try { fs.appendFileSync(logFile, msg + '\n'); } catch (e) { } }

async function seedLocations() {
    log('Starting seed...');
    try {
        // 1. Update Hospitals with missing locations
        log('Updating hospitals...');
        await db.query(`
      UPDATE hospitals 
      SET location = CASE 
        WHEN name ILIKE '%Dhaka%' THEN 'Dhaka'
        WHEN name ILIKE '%Chittagong%' THEN 'Chittagong'
        ELSE 'Dhaka' 
      END
      WHERE location IS NULL
    `);

        // 2. Update Chambers with missing locations
        log('Updating chambers...');
        await db.query(`
      UPDATE chambers 
      SET location = 'Dhaka'
      WHERE location IS NULL
    `);

        // 3. Ensure we have some doctor schedules
        log('Checking schedules...');
        const doctors = await db.query('SELECT user_id FROM doctors LIMIT 1');
        if (doctors.rows.length > 0) {
            const doctorId = doctors.rows[0].user_id;

            // Check if schedule exists
            const schedules = await db.query('SELECT * FROM doctor_schedules WHERE doctor_id = $1', [doctorId]);

            if (schedules.rows.length === 0) {
                log('Creating dummy schedule...');
                const hospital = await db.query('SELECT hospital_id FROM hospitals LIMIT 1');

                if (hospital.rows.length > 0) {
                    await db.query(`
                INSERT INTO doctor_schedules (doctor_id, facility_id, facility_type, day_of_week, start_time, end_time, slot_duration_minutes)
                VALUES ($1, $2, 'hospital', 'Monday', '09:00', '17:00', 30)
            `, [doctorId, hospital.rows[0].hospital_id]);
                    await db.query(`
                INSERT INTO doctor_schedules (doctor_id, facility_id, facility_type, day_of_week, start_time, end_time, slot_duration_minutes)
                VALUES ($1, $2, 'hospital', 'Wednesday', '09:00', '17:00', 30)
            `, [doctorId, hospital.rows[0].hospital_id]);
                }
            }

            // Generate slots for the next few days
            log('Generating slots...');
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);

            const upcomingSchedule = await db.query('SELECT schedule_id FROM doctor_schedules WHERE doctor_id = $1', [doctorId]);
            if (upcomingSchedule.rows.length > 0) {
                await db.query(`SELECT generate_slots_for_schedule($1, $2, $3)`, [
                    upcomingSchedule.rows[0].schedule_id,
                    today.toISOString().split('T')[0],
                    nextWeek.toISOString().split('T')[0]
                ]);
            }
        }

        log('Seed completed successfully.');
    } catch (error) {
        log('Error seeding: ' + error.toString());
    } finally {
        process.exit();
    }
}

seedLocations();
