const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Database = require('better-sqlite3');

// Tentar carregar dependências de IA (Opcionais para local, Obrigatórias para Produção)
let faceapi, canvas, ffmpegPath;
let AI_AVAILABLE = false;

try {
    canvas = require('canvas');
    faceapi = require('@vladmandic/face-api');
    ffmpegPath = require('ffmpeg-static');

    const { Canvas, Image, ImageData } = canvas;
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
    AI_AVAILABLE = true;
    console.log('✅ [CAMERA MONITOR] Módulo de IA Carregado com Sucesso (Modo SERVIDOR)');
} catch (e) {
    console.warn('⚠️ [CAMERA MONITOR] Dependências de IA não encontradas. Monitoramento rodará apenas check de conexão.');
}

class CameraMonitorService {
    constructor() {
        this.activeStreams = new Map(); // camera_id -> { status, lastCheck }
        this.modelsLoaded = false;
        this.MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        this.db = null; // Banco de dados será inicializado no start()
    }

    async start() {
        console.log('\n🎥 [CAMERA MONITOR] Iniciando Serviço...');

        // Inicializar Banco de Dados System com Caminho Absoluto Seguro
        try {
            // __dirname = server/services
            // Queremos: server/services/../../database -> raiz/database
            const dbDir = path.resolve(__dirname, '../../database');

            if (!fs.existsSync(dbDir)) {
                console.log('📁 [CAMERA MONITOR] Criando diretório de banco de dados:', dbDir);
                fs.mkdirSync(dbDir, { recursive: true });
            }

            const dbPath = path.join(dbDir, 'system.db');
            this.db = new Database(dbPath);
            console.log('✅ [CAMERA MONITOR] Conectado ao banco de dados:', dbPath);

        } catch (e) {
            console.error('❌ [CAMERA MONITOR] Erro fatal ao abrir banco de dados:', e.message);
            return;
        }

        if (AI_AVAILABLE) {
            await this.loadModels();
        }

        // Loop principal: Verificar câmeras a cada 30 segundos
        this.refreshCameras();
        setInterval(() => this.refreshCameras(), 30000);
    }

    async loadModels() {
        try {
            console.log('🔄 [CAMERA MONITOR] Carregando modelos de Face API...');

            // Define o diretório de modelos (raiz/server/models)
            const modelPath = path.resolve(__dirname, '../models');

            if (!fs.existsSync(modelPath)) {
                fs.mkdirSync(modelPath, { recursive: true });
                console.log('⬇️ [CAMERA MONITOR] Baixando modelos para', modelPath);

                const models = [
                    'ssd_mobilenet_v1_model-weights_manifest.json',
                    'ssd_mobilenet_v1_model-shard1',
                    'face_landmark_68_model-weights_manifest.json',
                    'face_landmark_68_model-shard1',
                    'face_recognition_model-weights_manifest.json',
                    'face_recognition_model-shard1',
                    'face_recognition_model-shard2'
                ];

                for (const model of models) {
                    await this.downloadModel(this.MODEL_URL + model, modelPath);
                }
            }

            await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
            await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
            await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);

            this.modelsLoaded = true;
            console.log('✅ [CAMERA MONITOR] Modelos carregados!');
        } catch (err) {
            console.error('❌ [CAMERA MONITOR] Erro ao carregar modelos:', err.message);
            AI_AVAILABLE = false; // Desativa IA se falhar
        }
    }

    async downloadModel(url, destFolder) {
        const fileName = url.split('/').pop();
        const filePath = path.join(destFolder, fileName);
        if (fs.existsSync(filePath)) return;

        try {
            const writer = fs.createWriteStream(filePath);
            const response = await axios({ url, method: 'GET', responseType: 'stream' });
            response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } catch (error) {
            console.error(`❌ Falha ao baixar ${fileName}:`, error.message);
        }
    }

    refreshCameras() {
        if (!this.db) return;

        try {
            // As câmeras são armazenadas no systemDB, não no banco da escola
            // Buscar câmeras de entrada ativas com URL configurada
            const cameras = this.db.prepare(`
                SELECT * FROM cameras 
                WHERE camera_url IS NOT NULL 
                AND camera_url != ''
                AND status = 'active'
                AND (camera_purpose = 'entrance' OR camera_purpose = 'presence')
            `).all();

            if (cameras.length === 0) {
                console.log(`📹 [CAMERA MONITOR] Nenhuma câmera de entrada ativa encontrada`);
                return;
            }

            console.log(`📹 [CAMERA MONITOR] Encontrada(s) ${cameras.length} câmera(s) de entrada ativa(s)`);

            for (const cam of cameras) {
                this.processCamera(cam);
            }
        } catch (err) {
            console.error('❌ [CAMERA MONITOR] Erro ao listar câmeras:', err.message);
        }
    }

    async processCamera(camera) {
        // Se IA não estiver disponível, apenas logar status
        if (!AI_AVAILABLE || !this.modelsLoaded) {
            // Check simples de ping (simulado)
            console.log(`📡 [CHECK] Câmera ${camera.camera_name} (ID ${camera.id}) - OK (IA Offline)`);
            return;
        }

        console.log(`📸 [PROCESS] Analisando frame da câmera ${camera.camera_name}...`);

        try {
            const buffer = await this.captureFrame(camera.camera_url);
            if (!buffer) return;

            const img = await canvas.loadImage(buffer);
            const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

            if (detections.length > 0) {
                console.log(`👤 [DETECTADO] ${detections.length} rosto(s) na câmera ${camera.camera_name}`);
                await this.recognizeFaces(detections, camera.school_id);
            }
        } catch (err) {
            console.error(`❌ [STREAM] Erro na câmera ${camera.camera_name}:`, err.message);
        }
    }

    captureFrame(rtspUrl) {
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn(ffmpegPath, [
                '-y',
                '-i', rtspUrl,
                '-frames:v', '1',
                '-f', 'image2',
                '-update', '1',
                'pipe:1'
            ]);

            let buffer = Buffer.alloc(0);

            ffmpeg.stdout.on('data', (data) => {
                buffer = Buffer.concat([buffer, data]);
            });

            ffmpeg.on('close', (code) => {
                if (code === 0 && buffer.length > 0) {
                    resolve(buffer);
                } else {
                    resolve(null);
                }
            });

            ffmpeg.stderr.on('data', () => { }); // Ignorar logs do ffmpeg

            // Timeout de 10s
            setTimeout(() => {
                try { ffmpeg.kill(); } catch (e) { }
                resolve(null);
            }, 10000);
        });
    }

    async recognizeFaces(detections, schoolId) {
        // Usa caminho absoluto para evitar erro de diretório
        const dbDir = path.resolve(__dirname, '../../database');
        const schoolDbPath = path.join(dbDir, `school_${schoolId}.db`);

        if (!fs.existsSync(schoolDbPath)) return;

        let schoolDb;
        try {
            schoolDb = new Database(schoolDbPath);
        } catch (e) {
            console.error('Erro ao abrir DB escola:', e);
            return;
        }

        // Buscar alunos com face_descriptor
        const students = schoolDb.prepare("SELECT id, name, face_descriptor FROM students WHERE face_descriptor IS NOT NULL").all();

        if (students.length === 0) {
            schoolDb.close();
            return;
        }

        // Criar Matcher
        const labeledDescriptors = students.map(s => {
            try {
                const desc = JSON.parse(s.face_descriptor);
                return new faceapi.LabeledFaceDescriptors(s.id.toString(), [new Float32Array(desc)]);
            } catch (e) { return null; }
        }).filter(d => d);

        if (labeledDescriptors.length === 0) {
            schoolDb.close();
            return;
        }

        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

        for (const detection of detections) {
            const match = faceMatcher.findBestMatch(detection.descriptor);
            if (match.label !== 'unknown') {
                const studentId = match.label;
                const student = students.find(s => s.id == studentId);
                console.log(`✅ [RECONHECIDO] Aluno: ${student.name} (ID: ${studentId})`);

                this.registerAttendance(schoolDb, student, schoolId);
            }
        }

        schoolDb.close();
    }

    registerAttendance(db, student, schoolId) {
        // Verificar se já tem presença HOJE
        const today = new Date().toISOString().split('T')[0];
        const exists = db.prepare("SELECT id FROM attendance WHERE student_id = ? AND date = ?").get(student.id, today);

        if (!exists) {
            db.prepare("INSERT INTO attendance (student_id, date, status, time) VALUES (?, ?, 'present', ?)")
                .run(student.id, today, new Date().toLocaleTimeString());

            console.log(`📝 Presença registrada para ${student.name}`);

            // Criar Notificação
            try {
                db.prepare("INSERT INTO notifications (student_id, title, message, read, created_at) VALUES (?, ?, ?, 0, datetime('now'))")
                    .run(student.id, 'Chegada na Escola', `O aluno ${student.name} chegou na escola.`, new Date().toISOString());
            } catch (e) {
                // Ignore se tabela não existir (migração pendente)
            }
        }
    }
}

module.exports = new CameraMonitorService();
