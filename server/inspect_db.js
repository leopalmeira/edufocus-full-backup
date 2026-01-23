
const db = require('better-sqlite3')('../database/school_31.db'); // Usando escola 31 como exemplo
console.log('📂 Tabelas na Escola 31:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables.map(t => t.name));

// Se achar tabelas suspeitas, listar colunas
const suspects = ['grades', 'exams', 'exam_results', 'reports', 'student_reports', 'notes'];
suspects.forEach(t => {
    if (tables.find(tbl => tbl.name === t)) {
        console.log(`\n📋 Colunas de ${t}:`);
        const columns = db.prepare(`PRAGMA table_info(${t})`).all();
        console.log(columns.map(c => c.name));

        // Ver dados de exemplo
        const rows = db.prepare(`SELECT * FROM ${t} LIMIT 3`).all();
        console.log(`📊 Exemplo de dados em ${t}:`, rows);
    }
});
