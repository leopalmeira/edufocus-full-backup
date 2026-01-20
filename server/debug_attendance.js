const db = require('better-sqlite3')('../database/school_31.db');

console.log('=== STUDENTS com face_descriptor ===');
try {
    const students = db.prepare('SELECT id, name, face_descriptor FROM students').all();
    students.forEach(s => {
        console.log(`ID: ${s.id}, Name: ${s.name}, Has FaceDescriptor: ${!!s.face_descriptor}`);
    });
} catch (e) { console.log('Error:', e.message); }

console.log('\n=== ATTENDANCE (todos) ===');
try {
    const attendance = db.prepare('SELECT * FROM attendance ORDER BY timestamp DESC').all();
    console.log(attendance);
} catch (e) { console.log('Error:', e.message); }

db.close();
