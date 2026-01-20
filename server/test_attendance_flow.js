// Script para adicionar presença de um novo dia e verificar o fluxo
const db = require('better-sqlite3')('../database/school_31.db');

const studentId = 3; // LEANDRO PALMEIRA DE SOUZA

console.log('=== VERIFICAÇÃO FINAL DO SISTEMA ===\n');

// 1. Verificar aluno
console.log('1. Estado do aluno:');
const student = db.prepare('SELECT id, name, class_name, face_descriptor FROM students WHERE id = ?').get(studentId);
console.log(`   ID: ${student.id}`);
console.log(`   Nome: ${student.name}`);
console.log(`   Turma: ${student.class_name}`);
console.log(`   Tem face_descriptor: ${!!student.face_descriptor} ✅`);

// 2. Adicionar presença para hoje (dia 19/01 para teste do calendário)
console.log('\n2. Adicionando presença para dia 19/01/2026 (para testar no calendário)...');
const jan19 = '2026-01-19T08:00:00.000Z';

const existingJan19 = db.prepare(`
    SELECT * FROM attendance 
    WHERE student_id = ? AND type = 'entry' AND date(timestamp) = date(?)
`).get(studentId, '2026-01-19');

if (existingJan19) {
    console.log('   ⚠️ Já existe registro para 19/01');
} else {
    db.prepare(`
        INSERT INTO attendance (student_id, timestamp, type)
        VALUES (?, ?, 'entry')
    `).run(studentId, jan19);
    console.log('   ✅ Presença de 19/01 adicionada!');
}

// 3. Listar todas as presenças
console.log('\n3. Todos os registros de presença do aluno:');
const attendance = db.prepare(`
    SELECT * FROM attendance 
    WHERE student_id = ? 
    ORDER BY timestamp DESC
`).all(studentId);

attendance.forEach(a => {
    const date = new Date(a.timestamp);
    console.log(`   ${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')} - ${a.type}`);
});

console.log(`\n   TOTAL: ${attendance.length} registros`);

// 4. Contar presenças de janeiro
const janAttendance = db.prepare(`
    SELECT COUNT(*) as count FROM attendance 
    WHERE student_id = ? AND strftime('%Y-%m', timestamp) = '2026-01'
`).get(studentId);

console.log(`\n4. Presenças em Janeiro/2026: ${janAttendance.count}`);

console.log('\n=== SISTEMA PRONTO ===');
console.log('');
console.log('📌 O aluno LEANDRO PALMEIRA DE SOUZA agora tem:');
console.log('   • face_descriptor cadastrado (para reconhecimento facial)');
console.log(`   • ${attendance.length} registros de presença`);
console.log('');
console.log('🔄 Para testar no app do responsável:');
console.log('   1. Recarregue a página do Guardian App');
console.log('   2. Vá em Acadêmico → Frequência');
console.log('   3. O calendário deve mostrar os dias verdes');

db.close();
