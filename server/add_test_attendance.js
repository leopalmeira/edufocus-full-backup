// Script para adicionar presença de teste para o aluno
const db = require('better-sqlite3')('../database/school_31.db');

const studentId = 3; // LEANDRO PALMEIRA DE SOUZA
const today = new Date().toISOString();

console.log('=== ADICIONANDO PRESENÇA PARA HOJE ===');
console.log('Student ID:', studentId);
console.log('Timestamp:', today);

try {
    // Verificar se já tem registro hoje
    const todayStr = today.split('T')[0];
    const existing = db.prepare(`
        SELECT * FROM attendance 
        WHERE student_id = ? AND type = 'entry' AND date(timestamp) = date(?)
    `).get(studentId, todayStr);

    if (existing) {
        console.log('⚠️ Já existe registro de entrada para hoje:', existing);
    } else {
        // Inserir novo registro
        const result = db.prepare(`
            INSERT INTO attendance (student_id, timestamp, type)
            VALUES (?, ?, 'entry')
        `).run(studentId, today);

        console.log('✅ Presença registrada com sucesso!');
        console.log('Insert ID:', result.lastInsertRowid);
    }

    // Mostrar todos os registros
    console.log('\n=== TODOS OS REGISTROS DE PRESENÇA ===');
    const all = db.prepare('SELECT * FROM attendance ORDER BY timestamp DESC').all();
    console.log(all);

} catch (e) {
    console.error('Erro:', e.message);
}

db.close();
