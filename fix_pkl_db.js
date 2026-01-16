const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'server', 'school_31.db'); // Assumindo escola 31 pelos logs

if (!fs.existsSync(dbPath)) {
    console.error(`Database not found at ${dbPath}`);
    // Tentar listar arquivos para ver qual é o correto
    const dir = path.join(__dirname, 'server');
    const files = fs.readdirSync(dir);
    console.log('Arquivos no diretorio:', files.filter(f => f.startsWith('school_')));
} else {
    const db = new Database(dbPath);

    console.log('Aplicando correcao na tabela pickups...');

    try {
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

        // Verificar colunas
        const columns = db.prepare("PRAGMA table_info(pickups)").all();
        console.log('Colunas na tabela pickups:', columns.map(c => c.name));

    } catch (e) {
        console.error('Erro ao corrigir DB:', e);
    }
}
