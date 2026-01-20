// Script para testar exclusão de aluno (cria um aluno fake e tenta excluir via API)
const http = require('http');
const db = require('better-sqlite3')('../database/school_31.db');

async function main() {
    console.log('=== TESTE DE EXCLUSÃO DE ALUNO ===\n');

    // 1. Criar aluno fake no banco diretamente para testar exclusão
    console.log('1. Criando aluno fake no banco...');
    let studentId;
    try {
        const result = db.prepare(`
            INSERT INTO students (name, class_name, parent_email, phone, age)
            VALUES (?, ?, ?, ?, ?)
        `).run('Aluno Para Excluir', 'Test Class', 'guardian@test.com', '123456789', 10);
        studentId = result.lastInsertRowid;
        console.log(`   ✅ Aluno criado com ID: ${studentId}`);
    } catch (e) {
        console.error('   ❌ Erro ao criar aluno:', e.message);
        return;
    }

    // 2. Login para obter token
    console.log('\n2. Fazendo login...');
    const loginData = JSON.stringify({
        email: 'escola456@email.com',
        password: '123456'
    });

    const loginResult = await new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.write(loginData);
        req.end();
    });

    if (!loginResult.token) {
        console.log('   ❌ Login falhou:', loginResult);
        return;
    }
    console.log('   ✅ Login OK');

    // 3. Tentar excluir via API
    console.log(`\n3. Tentando excluir aluno ID ${studentId} via API...`);

    const deleteOptions = {
        hostname: 'localhost',
        port: 5000,
        path: `/api/school/students/${studentId}`,
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${loginResult.token}`
        }
    };

    const deleteResult = await new Promise((resolve) => {
        const req = http.request(deleteOptions, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                console.log('   Status Code:', res.statusCode);
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });
        req.end();
    });

    console.log('   Resposta:', deleteResult);

    // 4. Verificar se foi excluído
    const check = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    console.log(`\n4. Verificação no banco: Aluno existe? ${!!check ? 'SIM ❌' : 'NÃO ✅'}`);

    db.close();
}

main();
