const fs = require("fs");
const path = require("path");

// Resolve dotenv from the server workspace (root package.json may not have deps)
const dotenvPath = require.resolve("dotenv", {
  paths: [path.join(__dirname, "../server")],
});
require(dotenvPath).config({ path: path.join(__dirname, "../server/.env") });

const db = require("../server/src/config/database");

const logFile = "scripts/apply_schema_log.txt";
function log(msg) {
  try {
    fs.appendFileSync(logFile, msg + "\n");
  } catch (e) {}
}

async function applySchema() {
  try {
    const schemaPath = path.join(__dirname, "../schema_enhancements.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    log("Applying schema enhancements...");
    await db.query(schemaSql);
    log("Schema enhancements applied successfully.");
  } catch (error) {
    log("Error applying schema: " + error);
  } finally {
    process.exit();
  }
}

applySchema();
