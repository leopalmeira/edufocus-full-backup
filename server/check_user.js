
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'system.db');
const db = new Database(dbPath);

const email = '1@email.com';
const password = '123'; // Senha padrão para teste

async function checkAndCreate() {
    console.log(`🔍 Verificando usuário: ${email}`);
    const user = db.prepare('SELECT * FROM guardians WHERE email = ?').get(email);

    if (user) {
        console.log(`✅ Usuário encontrado: ID ${user.id}`);
        // Verificar senha
        const valid = await bcrypt.compare(password, user.password);
        console.log(`🔑 Senha '123' é válida? ${valid ? 'SIM' : 'NÃO'}`);

        if (!valid) {
            console.log('🔄 Atualizando senha para 123...');
            const hash = await bcrypt.hash(password, 10);
            db.prepare('UPDATE guardians SET password = ? WHERE id = ?').run(hash, user.id);
            console.log('✅ Senha atualizada!');
        }
    } else {
        console.log('❌ Usuário não encontrado. Criando...');
        const hash = await bcrypt.hash(password, 10);
        const result = db.prepare(`
            INSERT INTO guardians (name, email, password, phone, created_at)
            VALUES (?, ?, ?, ?, ?)
        `).run('Responsável Teste', email, hash, '11999999999', new Date().toISOString());
        console.log(`✅ Usuário criado com Sucesso! ID: ${result.lastInsertRowid}`);
    }
}

checkAndCreate();
