const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'database', 'system.db');
console.log('Checking DB at:', dbPath);
try {
    const db = new Database(dbPath, { fileMustExist: true });
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='inspectors'").get();
    console.log('Result:', table ? 'Table exists' : 'Table missing');

    if (table) {
        const columns = db.prepare("PRAGMA table_info(inspectors)").all();
        console.log('Columns:', columns.map(c => c.name).join(', '));
    }
} catch (e) {
    console.error('Error:', e.message);
}
