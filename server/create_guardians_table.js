
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'system.db');
const db = new Database(dbPath);

console.log('📦 Criando tabela guardians...');

db.exec(`
    CREATE TABLE IF NOT EXISTS guardians (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        cpf TEXT,
        address TEXT,
        photo_url TEXT,
        fcm_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reset_token TEXT,
        reset_token_expiry DATETIME
    );
`);

console.log('✅ Tabela guardians criada!');

// Agora criar o usuário
const bcrypt = require('bcryptjs');
const email = '1@email.com';
const password = '123';

async function createUser() {
    const user = db.prepare('SELECT * FROM guardians WHERE email = ?').get(email);
    if (!user) {
        const hash = await bcrypt.hash(password, 10);
        db.prepare(`
            INSERT INTO guardians (name, email, password, phone, created_at)
            VALUES (?, ?, ?, ?, ?)
        `).run('Responsável Teste', email, hash, '11999999999', new Date().toISOString());
        console.log(`✅ Usuário ${email} criado com senha '123'!`);
    } else {
        console.log(`ℹ️ Usuário ${email} já existe.`);
    }
}

createUser();
