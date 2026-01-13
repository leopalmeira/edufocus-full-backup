const { getSystemDB } = require('./db');

console.log("Iniciando atualização manual do endereço...");

try {
    const db = getSystemDB();

    // Tentar executar a migração se ainda não tiver rodado (pois o server não reiniciou)
    try {
        const tableInfo = db.prepare("PRAGMA table_info(schools)").all();
        const hasLatitude = tableInfo.some(col => col.name === 'latitude');

        if (!hasLatitude) {
            console.log('Aplicando migração de colunas...');
            db.prepare("ALTER TABLE schools ADD COLUMN latitude REAL").run();
            db.prepare("ALTER TABLE schools ADD COLUMN longitude REAL").run();
            db.prepare("ALTER TABLE schools ADD COLUMN number TEXT").run();
            db.prepare("ALTER TABLE schools ADD COLUMN zip_code TEXT").run();
        }
    } catch (e) {
        console.log('Nota sobre migração:', e.message);
    }

    // Atualizar endereço da escola (ID 1 ou todas para garantir)
    // Dados da imagem: Rua Toriba, 113, 21545260
    // GPS aproximado (do log anterior): -22.8406804, -43.3434602

    const info = db.prepare(`
        UPDATE schools 
        SET address = ?, number = ?, zip_code = ?, latitude = ?, longitude = ?
    `).run('Rua Toriba', '113', '21545260', -22.8406804, -43.3434602);

    console.log(`✅ Sucesso! ${info.changes} escola(s) atualizada(s) no banco de dados.`);
    console.log("Reinicie o servidor para que o botão de salvar funcione para futuras alterações.");

} catch (e) {
    console.error("❌ Erro ao atualizar:", e);
}
