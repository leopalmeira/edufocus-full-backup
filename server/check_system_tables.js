const db = require('better-sqlite3')('../database/system.db');

console.log('=== TABELAS SYSTEM.DB ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables.map(t => t.name));

// Verificar se existe tabela cameras
const hasCameras = tables.some(t => t.name === 'cameras');
if (hasCameras) {
    console.log('\n=== COLUNAS CAMERAS ===');
    const cols = db.prepare("PRAGMA table_info(cameras)").all();
    console.log(cols.map(c => c.name));
} else {
    console.log('\n❌ Tabela cameras não existe no system.db');
}

db.close();
