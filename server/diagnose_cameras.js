const db = require('better-sqlite3')('../database/system.db');

console.log('=== DIAGNÓSTICO DE CÂMERAS ===');

// Listar todas as câmeras
const cameras = db.prepare('SELECT * FROM cameras').all();

if (cameras.length === 0) {
    console.log('❌ Nenhuma câmera encontrada no banco de dados.');
} else {
    console.table(cameras);
}

console.log('\n=== FILTRO DO MONITOR SERVIÇO ===');
const activeFilter = db.prepare(`
    SELECT * FROM cameras 
    WHERE status = 'active' 
    AND (camera_purpose = 'entrance' OR camera_purpose = 'presence')
    AND camera_url IS NOT NULL 
    AND camera_url != ''
`).all();

console.log(`Câmeras que passariam no filtro do monitor: ${activeFilter.length}`);
if (activeFilter.length > 0) {
    console.table(activeFilter);
} else {
    console.log('⚠️ Nenhuma câmera atende aos critérios do Monitor (Active + Entrance/Presence + URL válida).');
}
