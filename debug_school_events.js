const { getSystemDB, getSchoolDB } = require('./server/db');
const path = require('path');
process.env.DB_PATH = path.join(__dirname, 'server/db'); // Adjust if needed

const guardianId = 33; // ID from previous logs

try {
    console.log(`Diagnosing events for Guardian ID: ${guardianId}`);
    const sysDB = getSystemDB();
    const schools = sysDB.prepare('SELECT id, name FROM schools').all();

    schools.forEach(school => {
        console.log(`\nChecking School ${school.id} (${school.name})...`);
        const schoolDB = getSchoolDB(school.id);

        // 1. Check Link
        const linkQuery = 'SELECT * FROM student_guardians WHERE guardian_id = ?';
        const links = schoolDB.prepare(linkQuery).all(guardianId);
        console.log(`- Vínculos encontrados: ${links.length}`);
        links.forEach(l => console.log(`  > Student: ${l.student_id}, Status: ${l.status}`));

        const hasLink = links.some(l => l.status === 'active');
        console.log(`- Has Active Link? ${hasLink}`);

        // 2. Check Events
        const tableCheck = schoolDB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'").get();
        if (tableCheck) {
            const events = schoolDB.prepare('SELECT id, title, class_name FROM events').all();
            console.log(`- Eventos na escola: ${events.length}`);
            events.forEach(e => console.log(`  > Event ${e.id}: ${e.title} (Class: ${e.class_name || 'Global'})`));
        } else {
            console.log('- Tabela events não existe.');
        }
    });

} catch (e) {
    console.error('Erro:', e);
}
