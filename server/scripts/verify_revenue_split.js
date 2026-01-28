const pool = require('../src/config/database');

async function runTest() {
  console.log('Starting revenue split test...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Setup Test Data
    // Create Doctor User
    const docRes = await client.query(`
      INSERT INTO users (full_name, email, password_hash, role) 
      VALUES ('Test Doctor', 'testdoc_' || floor(random()*100000) || '@test.com', 'pass', 'doctor') 
      RETURNING user_id
    `);
    const doctorId = docRes.rows[0].user_id;
    console.log('Created Doctor:', doctorId);

    // Create Doctor Profile
    await client.query(`
      INSERT INTO doctors (user_id, consultation_fee) 
      VALUES ($1, 1000.00)
    `, [doctorId]);

    // Create Hospital Admin User
    const adminRes = await client.query(`
      INSERT INTO users (full_name, email, password_hash, role) 
      VALUES ('Test Admin', 'testadmin_' || floor(random()*100000) || '@test.com', 'pass', 'hospital_admin') 
      RETURNING user_id
    `);
    const adminId = adminRes.rows[0].user_id;
    console.log('Created Admin:', adminId);

    // Create Hospital
    const hospRes = await client.query(`
      INSERT INTO hospitals (admin_user_id, name) 
      VALUES ($1, 'Test Hospital') 
      RETURNING hospital_id
    `, [adminId]);
    const hospitalId = hospRes.rows[0].hospital_id;
    console.log('Created Hospital:', hospitalId);

    // Link Doctor to Hospital with fee
    await client.query(`
      INSERT INTO hospital_doctors (hospital_id, doctor_id, consultation_fee) 
      VALUES ($1, $2, 2000.00)
    `, [hospitalId, doctorId]);
    console.log('Linked Doctor to Hospital with fee 2000.00');

    // Create Patient User
    const patRes = await client.query(`
      INSERT INTO users (full_name, email, password_hash, role) 
      VALUES ('Test Patient', 'testpat_' || floor(random()*100000) || '@test.com', 'pass', 'patient') 
      RETURNING user_id
    `);
    const patientId = patRes.rows[0].user_id;
    console.log('Created Patient:', patientId);

    // Create Patient Profile
    await client.query(`
      INSERT INTO patients (user_id) VALUES ($1)
    `, [patientId]);

    // Add Balance to Patient
    // First ensure account exists
    const accRes = await client.query(`
      INSERT INTO accounts (owner_type, owner_id, balance) 
      VALUES ('user', $1, 5000.00) 
      RETURNING account_id
    `, [patientId]);
    const patientAccountId = accRes.rows[0].account_id;
    console.log('Patient Account created with 5000 balance');

    // Create Department
    const deptRes = await client.query(`
       INSERT INTO departments (name) VALUES ('Test Dept ' || floor(random()*10000)) RETURNING dept_id
    `);
    const deptId = deptRes.rows[0].dept_id;

    // 2. Book Appointment at Hospital (Fee 2000)
    // Expect: 
    // Hospital Share: 10% of 2000 = 200
    // Doctor Share: remaining = 1800
    console.log('Booking Appointment...');
    const apptRes = await client.query(`
      INSERT INTO appointments (patient_id, doctor_id, hospital_id, department_id, appt_date, appt_time)
      VALUES ($1, $2, $3, $4, CURRENT_DATE, '10:00')
      RETURNING appointment_id
    `, [patientId, doctorId, hospitalId, deptId]);
    const appointmentId = apptRes.rows[0].appointment_id;
    console.log('Appointment Created:', appointmentId);

    // 3. Verify Transactions
    const txRes = await client.query(`
      SELECT * FROM account_transactions 
      WHERE description LIKE '%' || $1 || '%'
    `, [appointmentId]);

    console.log('Transactions found:', txRes.rows.length);
    
    let doctorTx = null;
    let hospitalTx = null;

    for (let tx of txRes.rows) {
      console.log(`Transaction: ${tx.amount} to account ${tx.to_account_id} - ${tx.description}`);
      if (tx.description.includes('Doctor fee')) doctorTx = tx;
      if (tx.description.includes('Hospital fee')) hospitalTx = tx;
    }

    let pass = true;

    if (!doctorTx) {
      console.error('FAIL: No doctor transaction found');
      pass = false;
    } else {
      if (Number(doctorTx.amount) === 1800.00) {
        console.log('PASS: Doctor amount is 1800 (90%)');
      } else {
        console.error(`FAIL: Doctor amount is ${doctorTx.amount}, expected 1800.00`);
        pass = false;
      }
    }

    if (!hospitalTx) {
      console.error('FAIL: No hospital transaction found');
      pass = false;
    } else {
      if (Number(hospitalTx.amount) === 200.00) {
        console.log('PASS: Hospital amount is 200 (10%)');
      } else {
        console.error(`FAIL: Hospital amount is ${hospitalTx.amount}, expected 200.00`);
        pass = false;
      }
    }

    if (pass) {
        console.log('*** TEST PASSED: Revenue split works correctly ***');
    } else {
        console.log('*** TEST FAILED ***');
    }

    // Rollback to keep DB clean
    await client.query('ROLLBACK');
    console.log('Database rolled back.');

  } catch (err) {
    console.error('Test Error:', err);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    pool.end();
  }
}

runTest();
