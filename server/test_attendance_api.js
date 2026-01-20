// Script para testar o endpoint de frequência diretamente
const http = require('http');

async function main() {
    // 1. Login como guardian
    console.log('=== TESTE DO ENDPOINT DE FREQUÊNCIA ===\n');

    const loginData = JSON.stringify({
        email: 'ac@email.com',
        password: '123456'
    });

    console.log('1. Fazendo login...');

    const loginResult = await new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/guardian/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
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

    // 2. Buscar lista de alunos
    console.log('\n2. Buscando lista de alunos...');

    const studentsResult = await new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/guardian/my-students',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${loginResult.token}`
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.end();
    });

    console.log('   Alunos encontrados:', studentsResult.students?.length || 0);
    if (studentsResult.students) {
        studentsResult.students.forEach(s => {
            console.log(`   - ID: ${s.id}, Nome: ${s.name}, Escola: ${s.school_id}`);
        });
    }

    // 3. Buscar frequência do primeiro aluno
    if (studentsResult.students && studentsResult.students.length > 0) {
        const student = studentsResult.students[0];
        console.log(`\n3. Buscando frequência do aluno ${student.name} (ID ${student.id})...`);

        const url = `/api/guardian/student-attendance?schoolId=${student.school_id}&studentId=${student.id}&month=1&year=2026`;
        console.log(`   URL: ${url}`);

        const attendanceResult = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port: 5000,
                path: url,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${loginResult.token}`
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    console.log('   Status:', res.statusCode);
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        resolve(body);
                    }
                });
            });
            req.end();
        });

        console.log('   Registros:', Array.isArray(attendanceResult) ? attendanceResult.length : 'Erro');
        if (Array.isArray(attendanceResult) && attendanceResult.length > 0) {
            console.log('   Primeiros 5 registros:');
            attendanceResult.slice(0, 5).forEach(r => {
                console.log(`      - ${r.timestamp} (${r.type})`);
            });
        } else if (attendanceResult.error) {
            console.log('   ERRO:', attendanceResult.error);
        }
    }

    console.log('\n=== FIM DO TESTE ===');
}

main();
