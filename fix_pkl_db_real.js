const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Correct path based on investigation
const dbPath = path.join(__dirname, 'database', 'school_31.db');

if (!fs.existsSync(dbPath)) {
    console.error(`Database not found at ${dbPath}`);
} else {
    const db = new Database(dbPath);
    console.log(`Connected to ${dbPath}`);

    try {
        // Force create pickups table
        db.exec(`
            CREATE TABLE IF NOT EXISTS pickups (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              student_id INTEGER NOT NULL,
              guardian_id INTEGER NOT NULL,
              status TEXT DEFAULT 'waiting', -- waiting, calling, completed
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              remote_authorization INTEGER DEFAULT 0,
              FOREIGN KEY (student_id) REFERENCES students(id)
            );
        `);
        console.log('Tabela pickups verificada/criada com sucesso.');

        // Check columns to be sure
        const columns = db.prepare("PRAGMA table_info(pickups)").all();
        console.log('Colunas na tabela pickups:', columns.map(c => c.name));

        // Check triggers or constraints? 
        // Trying a dummy insert to test constraint logic? No, let's keep it simple.

    } catch (e) {
        console.error('Erro ao corrigir DB:', e);
    }
}
