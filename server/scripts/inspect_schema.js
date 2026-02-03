const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function inspect() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('doctors', 'appointments', 'patients', 'specializations', 'departments', 'hospitals', 'medical_history') 
      ORDER BY table_name, ordinal_position;
    `);
    const fs = require('fs');
    const dump = res.rows.map(r => `${r.table_name}: ${r.column_name} (${r.data_type})`).join('\n');
    fs.writeFileSync(path.resolve(__dirname, 'schema_dump.txt'), dump);
    console.log("Dumped to schema_dump.txt");
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

inspect();
