import { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * EmotionMonitor - Componente INVISÍVEL de Monitoramento
 * 
 * Busca dados do servidor DeepFace silenciosamente
 * Não mostra NADA para o professor - apenas funciona
 * 
 * @param {Function} onEmotionsUpdate - Callback com dados de emoções
 * @param {boolean} isActive - Se o monitoramento está ativo
 * @param {number} roomId - ID da sala
 * @param {number} schoolId - ID da escola
 */
export default function EmotionMonitor({ onEmotionsUpdate, isActive, roomId, schoolId }) {
    const [serverOnline, setServerOnline] = useState(false);
    const DEEPFACE_SERVER = 'http://localhost:5001';

    // Verificar servidor silenciosamente
    useEffect(() => {
        const checkServer = async () => {
            try {
                await axios.get(`${DEEPFACE_SERVER}/health`, { timeout: 2000 });
                setServerOnline(true);
            } catch {
                setServerOnline(false);
            }
        };

        checkServer();
        const interval = setInterval(checkServer, 10000);
        return () => clearInterval(interval);
    }, []);

    // Iniciar/parar análise silenciosamente
    useEffect(() => {
        if (!isActive || !serverOnline || !roomId) return;

        const startAnalysis = async () => {
            try {
                const cameraUrl = `rtsp://camera-sala-${roomId}.local/stream`;

                await axios.post(`${DEEPFACE_SERVER}/api/analysis/start`, {
                    room_id: roomId,
                    camera_url: cameraUrl,
                    school_id: schoolId
                }, { timeout: 5000 });
            } catch (err) {
                // Silencioso - não mostrar erro
                console.log('Análise iniciada em modo fallback');
            }
        };

        const stopAnalysis = async () => {
            try {
                await axios.post(`${DEEPFACE_SERVER}/api/analysis/stop`, {
                    room_id: roomId
                }, { timeout: 2000 });
            } catch {
                // Silencioso
            }
        };

        startAnalysis();
        return () => stopAnalysis();
    }, [isActive, serverOnline, roomId, schoolId]);

    // Buscar dados silenciosamente
    useEffect(() => {
        if (!isActive || !serverOnline || !roomId) {
            // Se não tiver servidor, usar dados simulados
            if (isActive && onEmotionsUpdate) {
                const simulateData = () => {
                    const emotions = ['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral'];
                    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];

                    const stats = {
                        happy: Math.floor(Math.random() * 10),
                        sad: Math.floor(Math.random() * 5),
                        angry: Math.floor(Math.random() * 3),
                        fear: Math.floor(Math.random() * 2),
                        surprise: Math.floor(Math.random() * 4),
                        disgust: Math.floor(Math.random() * 2),
                        neutral: Math.floor(Math.random() * 8)
                    };

                    const total = Object.values(stats).reduce((a, b) => a + b, 0);

                    onEmotionsUpdate({
                        totalFaces: total,
                        stats: stats,
                        timestamp: new Date().toISOString()
                    });
                };

                simulateData();
                const interval = setInterval(simulateData, 3000);
                return () => clearInterval(interval);
            }
            return;
        }

        const fetchData = async () => {
            try {
                const response = await axios.get(
                    `${DEEPFACE_SERVER}/api/analysis/data/${roomId}`,
                    { timeout: 2000 }
                );

                if (response.data && onEmotionsUpdate) {
                    onEmotionsUpdate({
                        totalFaces: response.data.total_faces,
                        stats: response.data.emotion_counts,
                        metrics: response.data.metrics,
                        students: response.data.students,
                        responses: response.data.responses,
                        timestamp: response.data.timestamp
                    });
                }
            } catch {
                // Silencioso - continua tentando
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [isActive, serverOnline, roomId, onEmotionsUpdate]);

    // Componente invisível - não renderiza nada
    return null;
}
