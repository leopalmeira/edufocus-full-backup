const Database = require('better-sqlite3');
const path = require('path');

// Correct path 
const dbPath = path.join(__dirname, 'database', 'school_31.db');

console.log('Conectando a:', dbPath);

const db = new Database(dbPath);

// Test the exact insert that's failing
try {
    const student_id = 3; // From the logs
    const guardian_id = 33; // From the logs
    const remote_authorization = 0;

    console.log('Tentando inserir pickup...');
    console.log('student_id:', student_id);
    console.log('guardian_id:', guardian_id);

    // Check if student exists
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(student_id);
    console.log('Aluno encontrado:', student ? student.name : 'NÃO ENCONTRADO');

    // Check pickups table structure
    const columns = db.prepare("PRAGMA table_info(pickups)").all();
    console.log('Colunas da tabela pickups:', columns.map(c => `${c.name} (${c.type})`));

    // Try the insert
    const result = db.prepare(`
        INSERT INTO pickups (student_id, guardian_id, status, remote_authorization, timestamp)
        VALUES (?, ?, 'waiting', ?, datetime('now', 'localtime'))
    `).run(student_id, guardian_id, remote_authorization);

    console.log('INSERT bem sucedido! ID:', result.lastInsertRowid);

} catch (e) {
    console.error('ERRO:', e.message);
    console.error('Código:', e.code);
}
