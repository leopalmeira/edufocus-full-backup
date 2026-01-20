const https = require('https');

const urls = [
    { name: 'API (Backend)', url: 'https://edufocus-api-production.onrender.com' },
    { name: 'Client Panel', url: 'https://edufocus-full-backup.onrender.com' },
    { name: 'Guardian PWA', url: 'https://edufocus-guardian-pwa.onrender.com' }
];

async function checkUrl(item) {
    return new Promise((resolve) => {
        const req = https.get(item.url, (res) => {
            resolve({
                name: item.name,
                url: item.url,
                status: res.statusCode,
                ok: res.statusCode >= 200 && res.statusCode < 500
            });
        });

        req.on('error', (e) => {
            resolve({
                name: item.name,
                url: item.url,
                status: 'ERROR',
                error: e.message,
                ok: false
            });
        });
    });
}

async function run() {
    console.log("--- Verifying Deployments ---");
    let allOk = true;

    for (const item of urls) {
        const result = await checkUrl(item);
        if (result.ok) {
            console.log(`✅ ${result.name}: ONLINE (Status: ${result.status})`);
        } else {
            console.log(`❌ ${result.name}: OFFLINE/ERROR (Status: ${result.status})`);
            if (result.error) console.log(`   Error: ${result.error}`);
            allOk = false;
        }
    }

    if (allOk) {
        console.log("\n🚀 All systems seem to be operational!");
    } else {
        console.log("\n⚠️ Some systems are still down or deploying. Please wait a moment.");
    }
}

run();
