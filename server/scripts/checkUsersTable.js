const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });
const db = require("../src/config/database");

async function check() {
  try {
    const result = await db.query(
      "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
    );
    console.log("Users table columns:");
    result.rows.forEach(x => {
      console.log(`  ${x.column_name} (nullable: ${x.is_nullable})`);
    });
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

check();
