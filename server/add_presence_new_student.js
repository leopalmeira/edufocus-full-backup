// Script para adicionar presenças de teste para o novo aluno
const db = require('better-sqlite3')('../database/school_31.db');

const studentId = 5; // claudinei assis

console.log('=== ADICIONANDO PRESENÇAS PARA ALUNO claudinei assis ===\n');

// Verificar aluno
const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
console.log('Aluno:', student.name);

// Dias de presença a adicionar (Janeiro 2026 - dias úteis passados)
const presenceDays = [
    '2026-01-02T08:00:00.000Z',  // Quinta
    '2026-01-03T08:00:00.000Z',  // Sexta
    '2026-01-06T08:00:00.000Z',  // Segunda
    '2026-01-07T08:00:00.000Z',  // Terça
    '2026-01-08T08:00:00.000Z',  // Quarta
    '2026-01-09T08:00:00.000Z',  // Quinta
    '2026-01-10T08:00:00.000Z',  // Sexta
    '2026-01-13T08:00:00.000Z',  // Segunda
    '2026-01-14T08:00:00.000Z',  // Terça
    '2026-01-15T08:00:00.000Z',  // Quarta
    '2026-01-16T08:00:00.000Z',  // Quinta
    '2026-01-17T08:00:00.000Z',  // Sexta
];

console.log('\nAdicionando presenças...');

let added = 0;
for (const timestamp of presenceDays) {
    const dateStr = timestamp.split('T')[0];

    // Verificar se já existe
    const existing = db.prepare(`
        SELECT * FROM attendance 
        WHERE student_id = ? AND date(timestamp) = date(?)
    `).get(studentId, dateStr);

    if (!existing) {
        db.prepare(`
            INSERT INTO attendance (student_id, timestamp, type)
            VALUES (?, ?, 'entry')
        `).run(studentId, timestamp);
        console.log(`   ✅ ${dateStr} adicionado`);
        added++;
    } else {
        console.log(`   ⏭️ ${dateStr} já existe`);
    }
}

console.log(`\n${added} presenças adicionadas!`);

// Verificar total
const total = db.prepare('SELECT COUNT(*) as count FROM attendance WHERE student_id = ?').get(studentId);
console.log(`\nTotal de presenças do aluno ${student.name}: ${total.count}`);

// Listar todas
console.log('\nTodas as presenças:');
const all = db.prepare('SELECT * FROM attendance WHERE student_id = ? ORDER BY timestamp DESC').all(studentId);
all.forEach(a => {
    const date = new Date(a.timestamp);
    console.log(`   ${date.toLocaleDateString('pt-BR')} - ${a.type}`);
});

console.log('\n=== PRONTO! Recarregue o Guardian App para ver as presenças ===');

db.close();
