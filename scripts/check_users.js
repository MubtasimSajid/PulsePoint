require('dotenv').config({ path: 'server/.env' });
const db = require('../server/src/config/database');
const fs = require('fs');

const logFile = 'scripts/check_users_log.txt';
function log(msg) {
    try { fs.appendFileSync(logFile, msg + '\n'); } catch (e) { }
    console.log(msg);
}

async function checkUsers() {
    log('Checking users...');
    try {
        const result = await db.query("SELECT user_id, email, role FROM users");
        log(`Found ${result.rows.length} users:`);
        result.rows.forEach(u => log(`- ID: ${u.user_id}, Email: ${u.email}, Role: ${u.role}`));
    } catch (error) {
        log('Error: ' + error);
    } finally {
        process.exit();
    }
}

checkUsers();
