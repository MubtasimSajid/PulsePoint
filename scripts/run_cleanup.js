require('dotenv').config({ path: 'server/.env' });
const db = require('../server/src/config/database');
const fs = require('fs');
const path = require('path');

const logFile = 'scripts/cleanup_log.txt';
function log(msg) {
    try { fs.appendFileSync(logFile, msg + '\n'); } catch (e) { }
    console.log(msg);
}

async function runCleanup() {
    log('Starting cleanup...');
    try {
        const sqlPath = path.join(__dirname, 'cleanup.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        log('Executing SQL...');
        await db.query(sql);
        log('Database cleanup completed successfully.');
    } catch (e) {
        log('Error cleaning database: ' + e);
        console.error(e);
    } finally {
        process.exit();
    }
}

runCleanup();
