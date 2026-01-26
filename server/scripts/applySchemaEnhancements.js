const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const db = require("../src/config/database");

async function main() {
  const schemaPath = path.join(
    __dirname,
    "..",
    "..",
    "schema_enhancements.sql",
  );
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  try {
    await db.query(schemaSql);
    console.log("Schema enhancements applied successfully.");
  } catch (err) {
    console.error("Error applying schema enhancements:", err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main();
