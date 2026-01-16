
const https = require('https');

const urls = [
    { name: 'Backend', url: 'https://edufocus-api-production.onrender.com/api/admin/dashboard' }, // Test auth route or root
    { name: 'Backend Health', url: 'https://edufocus-api-production.onrender.com/' },
    { name: 'Client Panel (Backup URL)', url: 'https://edufocus-full-backup.onrender.com' },
    { name: 'Client Panel (New Name URL)', url: 'https://edufocus-client-panel.onrender.com' },
    { name: 'Guardian PWA', url: 'https://edufocus-guardian-pwa.onrender.com' }
];

function checkUrl(site) {
    return new Promise((resolve) => {
        https.get(site.url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const title = data.match(/<title>(.*?)<\/title>/)?.[1] || 'No Title';
                console.log(`[${site.name}] Status: ${res.statusCode} | Title: ${title} | URL: ${site.url}`);
                if (res.statusCode === 200 || res.statusCode === 403 || res.statusCode === 401) resolve(true);
                else resolve(false);
            });
        }).on('error', (e) => {
            console.log(`[${site.name}] Error: ${e.message}`);
            resolve(false);
        });
    });
}

async function run() {
    console.log("--- Starting Production Checks ---");
    for (const site of urls) {
        await checkUrl(site);
    }
    console.log("--- End Checks ---");
}

run();
