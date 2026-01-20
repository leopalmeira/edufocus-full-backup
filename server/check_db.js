const db = require('better-sqlite3')('../database/system.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

// Tentar ler users de novo com try/catch
try {
    const user = db.prepare("SELECT * FROM users WHERE email='escola456@email.com'").get();
    console.log('User:', user);
} catch (e) {
    console.log('Error reading users:', e.message);
}

// Tentar ler schools
try {
    const school = db.prepare("SELECT * FROM schools WHERE email='escola456@email.com'").get();
    console.log('School:', school);
} catch (e) {
    console.log('Error reading schools:', e.message);
}

db.close();
