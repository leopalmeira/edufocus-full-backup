const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school_31.db');

console.log('Conectando a:', dbPath);

const db = new Database(dbPath);

// Check pickup_notifications table
try {
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pickup_notifications'").get();
    console.log('Tabela pickup_notifications existe?', !!tableExists);

    if (tableExists) {
        const notifications = db.prepare('SELECT * FROM pickup_notifications').all();
        console.log('\nNotificações de pickup:', notifications.length);
        notifications.forEach(n => {
            console.log(`  ID: ${n.id}, Guardian: ${n.guardian_id}, Student: ${n.student_name}, Type: ${n.notification_type}, Read: ${n.read_at || 'NÃO'}`);
        });
    }

    // Check pickups table
    const pickups = db.prepare('SELECT * FROM pickups ORDER BY id DESC LIMIT 5').all();
    console.log('\nÚltimos pickups:', pickups.length);
    pickups.forEach(p => {
        console.log(`  ID: ${p.id}, Student: ${p.student_id}, Guardian: ${p.guardian_id}, Status: ${p.status}`);
    });

} catch (e) {
    console.error('ERRO:', e.message);
}
