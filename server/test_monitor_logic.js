const db = require('better-sqlite3')('../database/system.db');

console.log('=== TESTE LÓGICA MONITORAMENTO ===');

try {
    const cameras = db.prepare(`
        SELECT * FROM cameras 
        WHERE status = 'active' 
        AND (camera_purpose = 'entrance' OR camera_purpose = 'presence')
        AND camera_url IS NOT NULL 
        AND camera_url != ''
    `).all();

    console.log(`✅ Câmeras encontradas pela Query: ${cameras.length}`);

    if (cameras.length > 0) {
        cameras.forEach(cam => {
            console.log(`\n📹 Câmera: ${cam.camera_name}`);
            console.log(`   URL: ${cam.camera_url}`);
            console.log(`   Purpose: ${cam.camera_purpose}`);
            console.log(`   STATUS: PARECE OK PARA MONITORAMENTO.`);

            if (cam.camera_url.includes('192.168.') || cam.camera_url.includes('localhost')) {
                console.log('   ⚠️  ALERTA: IP Local detectado. Não funcionará se o servidor estiver na nuvem (Render).');
            } else {
                console.log('   ☁️  URL parece pública ou acessível.');
            }
        });
    } else {
        console.log('❌ Nenhuma câmera encontrada com os critérios.');
    }

} catch (err) {
    console.error('Erro na query:', err.message);
}
