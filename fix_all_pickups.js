const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to all school databases
const dbDir = path.join(__dirname, 'database');

console.log('=== CORRIGINDO TABELA PICKUPS EM TODOS OS BANCOS ===\n');

// Get all school database files
const files = fs.readdirSync(dbDir).filter(f => f.startsWith('school_') && f.endsWith('.db'));

console.log(`Encontrados ${files.length} bancos de escola.\n`);

files.forEach(file => {
    const dbPath = path.join(dbDir, file);
    console.log(`Processando: ${file}`);

    try {
        const db = new Database(dbPath);

        // Check if pickups table exists and has the bad constraint
        const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='pickups'").get();

        if (tableInfo && tableInfo.sql.includes('guardians')) {
            console.log(`  ❌ Tabela pickups tem referência inválida a guardians. Corrigindo...`);

            // Backup existing data
            let existingData = [];
            try {
                existingData = db.prepare('SELECT * FROM pickups').all();
                console.log(`  📦 ${existingData.length} registros salvos para backup.`);
            } catch (e) {
                console.log('  🆕 Nenhum dado existente.');
            }

            // Drop and recreate
            db.exec('DROP TABLE IF EXISTS pickups');

            db.exec(`
                CREATE TABLE pickups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL,
                    guardian_id INTEGER NOT NULL,
                    status TEXT DEFAULT 'waiting',
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    remote_authorization INTEGER DEFAULT 0
                );
            `);

            // Restore data if any
            if (existingData.length > 0) {
                const insert = db.prepare(`
                    INSERT INTO pickups (id, student_id, guardian_id, status, timestamp, remote_authorization)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                existingData.forEach(row => {
                    insert.run(row.id, row.student_id, row.guardian_id, row.status, row.timestamp, row.remote_authorization);
                });
                console.log(`  ✅ ${existingData.length} registros restaurados.`);
            }

            console.log(`  ✅ Tabela pickups corrigida!`);
        } else if (tableInfo) {
            console.log(`  ✅ Tabela pickups já está correta.`);
        } else {
            // Create fresh table
            db.exec(`
                CREATE TABLE IF NOT EXISTS pickups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL,
                    guardian_id INTEGER NOT NULL,
                    status TEXT DEFAULT 'waiting',
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    remote_authorization INTEGER DEFAULT 0
                );
            `);
            console.log(`  🆕 Tabela pickups criada.`);
        }

        db.close();
    } catch (e) {
        console.error(`  ❌ Erro: ${e.message}`);
    }
});

console.log('\n=== CORREÇÃO CONCLUÍDA ===');
