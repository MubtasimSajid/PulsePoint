const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });
const db = require("../src/config/database");

const specializations = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "General Medicine",
  "Gynecology",
  "Ophthalmology",
  "ENT"
];

async function seed() {
  try {
    console.log("Seeding specializations...");
    
    // Check if empty
    const check = await db.query("SELECT COUNT(*) FROM specializations");
    if (parseInt(check.rows[0].count) > 0) {
      console.log("Specializations already exist. Skiping.");
      process.exit(0);
    }

    for (const spec of specializations) {
      await db.query("INSERT INTO specializations (spec_name) VALUES ($1)", [spec]);
      console.log(`Inserted: ${spec}`);
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding:", err);
    process.exit(1);
  }
}

seed();
