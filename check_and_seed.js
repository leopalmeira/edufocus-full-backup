const Database = require('better-sqlite3');
const path = require('path');

const SCHOOL_DB_PATH = path.join(__dirname, 'database', 'school_28.db');
const SYSTEM_DB_PATH = path.join(__dirname, 'database', 'system.db');

console.log('--- Verifying Data for Guardian App ---');

try {
    const db = new Database(SCHOOL_DB_PATH);
    const systemDB = new Database(SYSTEM_DB_PATH);

    console.log('Checking Guardian ID 30...');

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables in DB:', tables.map(t => t.name));

    // 2. Check Events
    // Create table if missing
    const eventTableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'").get();
    if (!eventTableCheck) {
        console.log('Events table missing. Creating...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                description TEXT,
                event_date DATE,
                cost REAL,
                type TEXT DEFAULT 'event',
                class_name TEXT,
                pix_key TEXT,
                payment_deadline DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    const events = db.prepare('SELECT * FROM events').all();
    console.log(`Events found: ${events.length}`);

    if (events.length === 0) {
        console.log('No events found. Seeding test event...');
        db.prepare(`
            INSERT INTO events (title, description, event_date, cost, type, class_name)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            'Reunião de Pais',
            'Reunião para discutir o progresso do semestre. Sua presença é importante!',
            '2026-02-15',
            0,
            'meeting',
            null // Global event
        );
        console.log('✅ Test event created.');
    } else {
        console.log('Events already exist.');
    }

    // 3. Check Invoices
    // First ensure table exists
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'").get();
    if (!tableCheck) {
        console.log('Invoices table missing. Creating...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                description TEXT,
                amount REAL,
                due_date DATE,
                status TEXT DEFAULT 'pending',
                payment_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    // Find a student for Guardian 30
    const student = db.prepare(`
        SELECT s.id, s.name 
        FROM students s
        JOIN student_guardians sg ON s.id = sg.student_id
        WHERE sg.guardian_id = 30 AND sg.status = 'active'
        LIMIT 1
    `).get();

    if (student) {
        console.log(`Found student for Guardian 30: ${student.name} (ID: ${student.id})`);

        const invoices = db.prepare('SELECT * FROM invoices WHERE student_id = ?').all(student.id);
        console.log(`Invoices found for student: ${invoices.length}`);

        if (invoices.length === 0) {
            console.log('No invoices found. Seeding test invoice...');
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 10); // 10 days from now

            db.prepare(`
                INSERT INTO invoices (student_id, description, amount, due_date, status, payment_url)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                student.id,
                'Mensalidade Janeiro/2026',
                1500.00,
                dueDate.toISOString().split('T')[0],
                'pending',
                'https://pagamento.exemplo.com'
            );
            console.log('✅ Test invoice created.');
        } else {
            console.log('Invoices already exist.');
        }
    } else {
        console.log('❌ No active student found for Guardian 30 in School 28.');
    }

} catch (e) {
    console.error('Error:', e);
}
