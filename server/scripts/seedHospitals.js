const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const db = require("../src/config/database");

const bcrypt = require("bcrypt");

const hospitals = [
  {
    name: "PulsePoint Hospital",
    location: "Dhanmondi Branch",
    address: "Road 27, Dhanmondi, Dhaka",
    phone: "+880-2-00000001",
    email: "dhanmondi@pulsepoint.local",
  },
  {
    name: "PulsePoint Hospital",
    location: "Gulshan Branch",
    address: "Road 121, Gulshan, Dhaka",
    phone: "+880-2-00000002",
    email: "gulshan@pulsepoint.local",
  },
  {
    name: "PulsePoint Hospital",
    location: "Uttara Branch",
    address: "Sector 7, Uttara, Dhaka",
    phone: "+880-2-00000003",
    email: "uttara@pulsepoint.local",
  },
];

async function seed() {
  const client = await db.connect();
  try {
    console.log("Seeding hospitals/branches...");

    // Ensure location column exists (older schema may not have it)
    await client.query(
      "ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS location VARCHAR(100)",
    );

    // Only seed if PulsePoint Hospital branches are missing
    const check = await client.query(
      "SELECT COUNT(*) FROM hospitals WHERE name = $1",
      ["PulsePoint Hospital"],
    );
    if (parseInt(check.rows[0].count) > 0) {
      console.log("PulsePoint Hospital already exists. Skipping.");
      process.exit(0);
    }

    // Find an existing admin user, else fall back to any user, else create one.
    let adminResult = await client.query(
      "SELECT user_id FROM users WHERE role = 'admin' LIMIT 1",
    );

    let adminUserId;
    if (adminResult.rows.length === 0) {
      // Fall back to any existing user
      const anyUser = await client.query("SELECT user_id FROM users LIMIT 1");
      if (anyUser.rows.length > 0) {
        adminUserId = anyUser.rows[0].user_id;
        console.log(
          `No admin user found; using existing user ID: ${adminUserId}`,
        );
      } else {
        // Create a minimal admin user for seeding
        const email = "seed.hospital_admin@pulsepoint.local";
        const existing = await client.query(
          "SELECT user_id FROM users WHERE email = $1 LIMIT 1",
          [email],
        );

        if (existing.rows.length > 0) {
          adminUserId = existing.rows[0].user_id;
        } else {
          const passwordHash = await bcrypt.hash("Admin1234!", 10);
          const created = await client.query(
            `INSERT INTO users (email, password_hash, full_name, phone, role, is_active)
           VALUES ($1, $2, $3, $4, 'admin', TRUE)
           RETURNING user_id`,
            [email, passwordHash, "Seed Hospital Admin", "0000000000"],
          );
          adminUserId = created.rows[0].user_id;
        }
      }
    } else {
      adminUserId = adminResult.rows[0].user_id;
    }
    console.log(`Using admin user ID: ${adminUserId}`);

    // Insert hospitals
    for (const hospital of hospitals) {
      await client.query(
        `INSERT INTO hospitals (admin_user_id, name, location, address, phone, email, est_year)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          adminUserId,
          hospital.name,
          hospital.location || null,
          hospital.address,
          hospital.phone,
          hospital.email,
          2020,
        ],
      );
      console.log(`Inserted: ${hospital.name} - ${hospital.location}`);
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding:", err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
