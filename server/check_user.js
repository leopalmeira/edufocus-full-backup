const db = require('better-sqlite3')('../database/system.db');
const user = db.prepare("SELECT * FROM users WHERE email='escola456@email.com'").get();
console.log('User:', user);
db.close();
