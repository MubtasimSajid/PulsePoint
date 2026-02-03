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

async function setupData() {
  const client = await pool.connect();
  try {
    const docEmail = "tahmid0259@gmail.com";
    const patEmail = "tahmid12955@gmail.com";

    console.log("1. Ensuring Users exist...");

    // Helper to create user if missing
    async function getOrCreateUser(email, role, name) {
      let res = await client.query("SELECT * FROM users WHERE email = $1", [email]);
      if (res.rows.length === 0) {
        console.log(`   Creating ${role}: ${email}`);
        const hash = await bcrypt.hash("password123", 10);
        res = await client.query(
          `INSERT INTO users (email, password_hash, full_name, role, is_verified, phone, is_active)
           VALUES ($1, $2, $3, $4, TRUE, '1234567890', TRUE) RETURNING *`,
          [email, hash, name, role]
        );
      } else {
        console.log(`   Found ${role}: ${email}`);
      }
      return res.rows[0];
    }

    const docUser = await getOrCreateUser(docEmail, "doctor", "Dr. Tahmid");
    const patUser = await getOrCreateUser(patEmail, "patient", "Mr. Tahmid Test");

    // Ensure Doctor Profile
    let docProfile = await client.query("SELECT * FROM doctors WHERE user_id = $1", [docUser.user_id]);
    if (docProfile.rows.length === 0) {
       // Need department/spec
       let spec = await client.query("SELECT * FROM specializations LIMIT 1");
       if (spec.rows.length === 0) {
         // Create default spec
         const dept = await client.query("INSERT INTO departments (name) VALUES ('General') RETURNING *");
         spec = await client.query("INSERT INTO specializations (spec_name, dept_id) VALUES ('General Physician', $1) RETURNING *", [dept.rows[0].dept_id]);
       }
       await client.query(
         `INSERT INTO doctors (user_id, doctor_code, consultation_fee, experience_years, qualification)
          VALUES ($1, 'DOC-TEST', 500, 5, 'MBBS')`,
         [docUser.user_id]
       );
       console.log("   Created Doctor Profile");
    }

    // Ensure Patient Profile
    let patProfile = await client.query("SELECT * FROM patients WHERE user_id = $1", [patUser.user_id]);
    if (patProfile.rows.length === 0) {
       await client.query("INSERT INTO patients (user_id, patient_code) VALUES ($1, 'PAT-TEST')", [patUser.user_id]);
       console.log("   Created Patient Profile");
    }

    // Get Meta (Hospital, Department)
    let hosRes = await client.query("SELECT * FROM hospitals LIMIT 1");
    let hospital_id = null;
    if (hosRes.rows.length > 0) hospital_id = hosRes.rows[0].hospital_id;
    else {
        // Create dummy hospital
        const hAdmin = await getOrCreateUser("admin@hospital.com", "hospital_admin", "Admin");
        const h = await client.query("INSERT INTO hospitals (name, admin_user_id) VALUES ('General Hospital', $1) RETURNING hospital_id", [hAdmin.user_id]);
        hospital_id = h.rows[0].hospital_id;
    }

    let deptRes = await client.query("SELECT * FROM departments LIMIT 1");
    if (deptRes.rows.length === 0) {
         await client.query("INSERT INTO departments (name) VALUES ('General')");
         deptRes = await client.query("SELECT * FROM departments LIMIT 1");
    }
    const dept_id = deptRes.rows[0].dept_id;


    console.log("2. Creating Appointments...");
    
    // Helper to get date string YYYY-MM-DD
    const getDateStr = (d) => [d.getFullYear(), ('0' + (d.getMonth() + 1)).slice(-2), ('0' + d.getDate()).slice(-2)].join('-');

    // Appointment 1: VALID for prescription (Started 30 mins ago)
    // We need appt_date to be today, and appt_time to be 30 mins ago.
    const now = new Date();
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60000); // 30 mins ago
    
    await client.query(
        `INSERT INTO appointments (patient_id, doctor_id, hospital_id, department_id, appt_date, appt_time, status, note)
         VALUES ($1, $2, $3, $4, $5, $6, 'completed', 'Valid for prescription')`,
        [patUser.user_id, docUser.user_id, hospital_id, dept_id, getDateStr(thirtyMinsAgo), thirtyMinsAgo.toTimeString().split(' ')[0]]
    );
    console.log("   ✅ Created 'Valid' Appointment (30 mins ago)");

    // Appointment 2: EXPIRED (Started 5 hours ago)
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60000);
    
    await client.query(
        `INSERT INTO appointments (patient_id, doctor_id, hospital_id, department_id, appt_date, appt_time, status, note)
         VALUES ($1, $2, $3, $4, $5, $6, 'completed', 'Expired window')`,
        [patUser.user_id, docUser.user_id, hospital_id, dept_id, getDateStr(fiveHoursAgo), fiveHoursAgo.toTimeString().split(' ')[0]]
    );
    console.log("   ✅ Created 'Expired' Appointment (5 hours ago)");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    pool.end();
  }
}

setupData();
