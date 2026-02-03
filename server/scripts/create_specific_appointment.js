const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function run() {
  const client = await pool.connect();
  try {
    const patientEmail = "tahmid12955@gmail.com";
    const doctorEmail = "tahmid0259@gmail.com";
    const apptDate = "2026-01-29";
    const apptTime = "08:00:00";
    const password = "password123";
    const hash = await bcrypt.hash(password, 10);

    // 1. Ensure Patient
    let pUser = await client.query("SELECT * FROM users WHERE email = $1", [patientEmail]);
    if (pUser.rows.length === 0) {
        console.log("Creating Patient User...");
        pUser = await client.query(
            `INSERT INTO users (email, password_hash, full_name, role, is_active)
             VALUES ($1, $2, 'Tahmid Patient', 'patient', TRUE) RETURNING *`,
            [patientEmail, hash]
        );
    }
    const patientUser = pUser.rows[0];
    // Ensure Patient Profile
    const pProfile = await client.query("SELECT * FROM patients WHERE user_id = $1", [patientUser.user_id]);
    if (pProfile.rows.length === 0) {
        await client.query("INSERT INTO patients (user_id, patient_code) VALUES ($1, 'P-MANUAL')", [patientUser.user_id]);
    }

    // 2. Ensure Doctor
    let dUser = await client.query("SELECT * FROM users WHERE email = $1", [doctorEmail]);
    if (dUser.rows.length === 0) {
        console.log("Creating Doctor User...");
        dUser = await client.query(
            `INSERT INTO users (email, password_hash, full_name, role, is_active)
             VALUES ($1, $2, 'Dr. Tahmid', 'doctor', TRUE) RETURNING *`,
            [doctorEmail, hash]
        );
    }
    const doctorUser = dUser.rows[0];
    // Ensure Doctor Profile
    const dProfile = await client.query("SELECT * FROM doctors WHERE user_id = $1", [doctorUser.user_id]);
    if (dProfile.rows.length === 0) {
        await client.query(
            `INSERT INTO doctors (user_id, doctor_code, consultation_fee, qualification) 
             VALUES ($1, 'D-MANUAL', 500.00, 'MBBS')`, 
            [doctorUser.user_id]
        );
    }

    // 2.5 Ensure Chamber
    let chamber = await client.query("SELECT * FROM chambers WHERE doctor_id = $1", [doctorUser.user_id]);
    if (chamber.rows.length === 0) {
        console.log("Creating Doctor Chamber...");
        chamber = await client.query(
            `INSERT INTO chambers (doctor_id, name, address, phone)
             VALUES ($1, 'Test Chamber', '123 Fake St', '555-0123') RETURNING *`,
            [doctorUser.user_id]
        );
    }
    const chamberId = chamber.rows[0].chamber_id;
    
    // 3. Create Appointment
    console.log(`Creating Appointment: ${apptDate} ${apptTime} with ChamberID: ${chamberId}`);
    const res = await client.query(
        `INSERT INTO appointments (patient_id, doctor_id, appt_date, appt_time, status, chamber_id)
         VALUES ($1, $2, $3, $4, 'scheduled', $5) RETURNING appointment_id`,
        [patientUser.user_id, doctorUser.user_id, apptDate, apptTime, chamberId]
    );
    
    console.log(`✅ Appointment Created! ID: ${res.rows[0].appointment_id}`);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
