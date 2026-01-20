// Script para verificar todos os alunos e seus vínculos
const systemDB = require('better-sqlite3')('../database/system.db');
const fs = require('fs');
const path = require('path');

console.log('=== VERIFICAÇÃO COMPLETA ===\n');

// 1. Listar todos os guardians
console.log('1. Guardians cadastrados:');
try {
    const guardians = systemDB.prepare('SELECT id, name, email FROM guardians ORDER BY id DESC LIMIT 5').all();
    guardians.forEach(g => console.log(`   Guardian ${g.id}: ${g.name} (${g.email})`));
} catch (e) { console.log('   Erro:', e.message); }

// 2. Verificar escola 31 - todos os alunos
console.log('\n2. Alunos na escola 31:');
const schoolDB = require('better-sqlite3')('../database/school_31.db');

try {
    const students = schoolDB.prepare('SELECT id, name, class_name, face_descriptor FROM students').all();
    console.log(`   Total de alunos: ${students.length}`);
    students.forEach(s => {
        console.log(`   ID ${s.id}: ${s.name} (${s.class_name}) - Face: ${!!s.face_descriptor}`);
    });
} catch (e) { console.log('   Erro:', e.message); }

// 3. Vínculos guardian-aluno
console.log('\n3. Vínculos student_guardians na escola 31:');
try {
    const links = schoolDB.prepare('SELECT * FROM student_guardians ORDER BY id DESC').all();
    console.log(`   Total de vínculos: ${links.length}`);
    links.forEach(l => {
        const student = schoolDB.prepare('SELECT name FROM students WHERE id = ?').get(l.student_id);
        console.log(`   Vínculo ${l.id}: Guardian ${l.guardian_id} → Aluno ${l.student_id} (${student?.name || 'NÃO ENCONTRADO'})`);
    });
} catch (e) { console.log('   Erro:', e.message); }

// 4. Presença por aluno
console.log('\n4. Presença por aluno na escola 31:');
try {
    const students = schoolDB.prepare('SELECT id, name FROM students').all();
    for (const s of students) {
        const count = schoolDB.prepare('SELECT COUNT(*) as count FROM attendance WHERE student_id = ?').get(s.id);
        console.log(`   Aluno ${s.id} (${s.name}): ${count.count} registros de presença`);

        // Mostrar últimos registros
        const records = schoolDB.prepare('SELECT * FROM attendance WHERE student_id = ? ORDER BY timestamp DESC LIMIT 3').all(s.id);
        records.forEach(r => {
            console.log(`      - ${r.timestamp} (${r.type})`);
        });
    }
} catch (e) { console.log('   Erro:', e.message); }

schoolDB.close();
systemDB.close();
