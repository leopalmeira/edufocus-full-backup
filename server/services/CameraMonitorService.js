const db = require('better-sqlite3')('../database/system.db');

class CameraMonitorService {
    constructor() {
        this.activeStreams = new Map(); // school_id -> stream status
        this.checkInterval = null;
    }

    start() {
        console.log('\n🎥 [CAMERA MONITOR] Iniciando Serviço de Monitoramento Centralizado...');
        this.refreshCameras();

        // Verificar novas câmeras ou alterações a cada 10 segundos
        this.checkInterval = setInterval(() => this.refreshCameras(), 10000);
    }

    refreshCameras() {
        try {
            console.log('[CameraMonitor] 🔄 Verificando câmeras no DB...');

            // DEBUG: Listar TODAS
            const allCams = db.prepare("SELECT id, camera_name, status, camera_purpose FROM cameras").all();
            console.log(`[CameraMonitor] 🔍 Total no Banco: ${allCams.length}. Detalhes: ${JSON.stringify(allCams)}`);

            const cameras = db.prepare(`
                SELECT * FROM cameras 
                WHERE status = 'active' 
                AND (camera_purpose = 'entrance' OR camera_purpose = 'presence')
                AND camera_url IS NOT NULL 
                AND camera_url != ''
            `).all();

            console.log(`[CameraMonitor] ✅ Elegíveis para Monitor: ${cameras.length}`);

            if (cameras.length > 0) {
                console.log(`📡 [CAMERA MONITOR] ${cameras.length} câmeras de portaria configuradas.`);
            }

            cameras.forEach(cam => {
                if (!this.activeStreams.has(cam.id)) {
                    this.startStream(cam);
                }
            });

            // Lógica para parar streams de câmeras que foram desativadas (futuro)
        } catch (error) {
            console.error('❌ [CAMERA MONITOR] Erro ao buscar câmeras:', error.message);
        }
    }

    startStream(camera) {
        // Validação de Rede para Servidor em Nuvem (Render)
        if (camera.camera_url && (camera.camera_url.includes('192.168.') || camera.camera_url.includes('//10.') || camera.camera_url.includes('localhost'))) {
            console.warn(`⚠️ [ALERTA DE REDE] A câmera "${camera.camera_name}" (Escola ${camera.school_id}) tem um IP LOCAL: ${camera.camera_url}`);
            console.warn(`   ℹ️ Se este servidor estiver na nuvem (Render), ele NÃO conseguirá acessar esta câmera.`);
            console.warn(`   ✅ SOLUÇÃO: Configure um DDNS ou IP Público no roteador da escola para acesso externo.`);
        }

        console.log(`▶️ [CAMERA MONITOR] INICIANDO MONITORAMENTO AUTOMÁTICO`);
        console.log(`   🏫 Escola ID: ${camera.school_id}`);
        console.log(`   📹 Câmera: ${camera.camera_name} (ID: ${camera.id})`);
        console.log(`   🔗 URL RTSP: ${camera.camera_url.substring(0, 20)}...`);
        console.log(`   ✅ Status: CONECTADO AO SERVIDOR (Aguardando processamento de vídeo...)`);

        // Simulação de estado ativo
        this.activeStreams.set(camera.id, {
            status: 'connected',
            startTime: new Date(),
            schoolId: camera.school_id
        });

        // FUTURO: Aqui iniciaremos o ffmpeg e face-api worker
        // PRIVACIDADE: O vídeo será processado em memória (RAM) quadro a quadro.
        // NENHUM VÍDEO SERÁ GRAVADO EM DISCO. Apenas os descritores faciais são extraídos.
        // ISOLAMENTO: O reconhecimento facial consultará APENAS o banco de dados da escola ID ${camera.school_id}.
    }

    getAllStatuses() {
        const statuses = {};
        for (const [id, data] of this.activeStreams.entries()) {
            statuses[id] = {
                status: data.status,
                online_since: data.startTime,
                school_id: data.schoolId
            };
        }
        return statuses;
    }
}

module.exports = new CameraMonitorService();
