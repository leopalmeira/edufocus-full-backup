const http = require('http');
const db = require('better-sqlite3')('../database/system.db');

async function main() {
    console.log('=== TESTE DE SCHOOL SETTINGS ===\n');

    // 1. Verificar colunas da tabela schools
    console.log('1. Verificando tabela schools...');
    try {
        const cols = db.prepare('PRAGMA table_info(schools)').all();
        console.log('   Colunas:', cols.map(c => c.name).join(', '));
    } catch (e) { console.error('   Erro:', e.message); }

    // 2. Login para obter token
    console.log('\n2. Fazendo login com escola456...');
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
        // Tentar com a senha nova que defini antes?
        console.log('   Tentando com senha 123456...');
        const loginData2 = JSON.stringify({
            email: 'escola456@email.com',
            password: '123456'
        });
        // ... (repetir login, simplificando: o script anterior logou com 123456. O usuário pode estar usando 123 ou 123456)
    } else {
        console.log('   ✅ Login OK');
    }

    const token = loginResult.token;
    if (!token) return;

    // 3. Testar GET /school/settings
    console.log('\n3. Testando GET /school/settings...');
    const getResult = await new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/school/settings',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                console.log('   Status Code:', res.statusCode);
                try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
            });
        });
        req.end();
    });
    console.log('   Resultado GET:', getResult);

    // 4. Testar POST /school/settings
    console.log('\n4. Testando POST /school/settings...');
    const postData = JSON.stringify({
        address: "Rua Teste",
        number: "123",
        zip_code: "12345-678",
        latitude: -23.550520,
        longitude: -46.633308
    });

    const postResult = await new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/school/settings',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                console.log('   Status Code:', res.statusCode);
                try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
            });
        });
        req.write(postData);
        req.end();
    });
    console.log('   Resultado POST:', postResult);

    // Fechar DB
    db.close();
}

main();
