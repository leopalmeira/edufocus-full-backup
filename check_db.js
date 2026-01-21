const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'database', 'school_31.db');
console.log('Checking DB at:', dbPath);
try {
    const db = new Database(dbPath, { fileMustExist: true });

    // Listar tabelas
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tabelas:', tables.map(t => t.name).join(', '));

    // Verificar turmas
    try {
        const classes = db.prepare("SELECT * FROM classes").all();
        console.log('Turmas:', classes);
    } catch (e) {
        console.log('Sem tabela classes. Buscando de students...');
        const classesFromStudents = db.prepare("SELECT DISTINCT class_name FROM students WHERE class_name IS NOT NULL").all();
        console.log('Turmas de students:', classesFromStudents);
    }
} catch (e) {
    console.error('Error:', e.message);
}
