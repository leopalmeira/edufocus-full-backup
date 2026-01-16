const jwt = require('jsonwebtoken');
const http = require('http');

const SECRET = 'edufocus_secret_key_change_me';
// Guardian ID 33 was successful in logs
const guardianId = 33;
const token = jwt.sign({ id: guardianId, type: 'guardian' }, SECRET, { expiresIn: '1h' });

console.log('Testing Confirm Event Route with Token for Guardian 33...');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/guardian/school-events/31/2/confirm',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': 0
    }
}; // Event 2 (Passeio)

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(`BODY: ${data}`);
    });
});

req.on('error', (e) => {
    console.error(`Request Error: ${e.message}`);
});

req.end();
