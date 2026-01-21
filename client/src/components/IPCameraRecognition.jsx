import { useState, useRef, useEffect } from 'react';
import { Camera, Bell, UserCheck, AlertCircle, Wifi, WifiOff, Play, Pause } from 'lucide-react';
import api from '../api/axios';
import * as faceapi from 'face-api.js';

/**
 * Componente para reconhecimento facial em stream de câmera IP
 * Processa os frames no navegador e envia reconhecimentos para o servidor
 */
export default function IPCameraRecognition({
    cameraUrl,
    cameraName = 'Câmera IP',
    schoolId,
    students = [],
    onRecognition
}) {
    const imgRef = useRef(null);
    const canvasRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('testing');
    const [lastRecognition, setLastRecognition] = useState(null);
    const [recognitionStats, setRecognitionStats] = useState({ today: 0, recognized: [] });
    const [faceMatcher, setFaceMatcher] = useState(null);
    const frameIntervalRef = useRef(null);
    const lastRecognitionTime = useRef({});
    const imgLoadErrorRef = useRef(0);

    // Carregar modelos
    useEffect(() => {
        const loadModels = async () => {
            try {
                console.log('🔄 [IP CAM] Carregando modelos face-api...');
                const CDN_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(CDN_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(CDN_URL)
                ]);

                setModelsLoaded(true);
                console.log('✅ [IP CAM] Modelos carregados!');
            } catch (err) {
                console.error('❌ [IP CAM] Erro ao carregar modelos:', err);
            }
        };

        loadModels();
    }, []);

    // Configurar FaceMatcher quando students mudarem
    useEffect(() => {
        if (!modelsLoaded || students.length === 0) return;

        const studentsWithDescriptors = students
            .filter(s => s.face_descriptor)
            .map(s => {
                let descriptor = s.face_descriptor;
                if (typeof descriptor === 'string') {
                    try {
                        descriptor = JSON.parse(descriptor);
                    } catch (e) {
                        return null;
                    }
                }
                if (!Array.isArray(descriptor) || descriptor.length !== 128) return null;
                return { ...s, descriptor: new Float32Array(descriptor) };
            })
            .filter(s => s);

        if (studentsWithDescriptors.length > 0) {
            const labeledDescriptors = studentsWithDescriptors.map(s =>
                new faceapi.LabeledFaceDescriptors(s.name, [s.descriptor])
            );
            const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.55);
            setFaceMatcher(matcher);
            console.log(`✅ [IP CAM] Matcher configurado com ${labeledDescriptors.length} alunos`);
        }
    }, [modelsLoaded, students]);

    // Testar conexão da câmera
    useEffect(() => {
        if (!cameraUrl) {
            setConnectionStatus('error');
            return;
        }

        const testConnection = () => {
            const testImg = new Image();
            testImg.crossOrigin = 'anonymous';

            testImg.onload = () => {
                setConnectionStatus('online');
                imgLoadErrorRef.current = 0;
            };

            testImg.onerror = () => {
                imgLoadErrorRef.current++;
                if (imgLoadErrorRef.current > 3) {
                    setConnectionStatus('offline');
                }
            };

            // Adicionar timestamp para evitar cache
            testImg.src = `${cameraUrl}?t=${Date.now()}`;
        };

        testConnection();
        const interval = setInterval(testConnection, 10000);

        return () => clearInterval(interval);
    }, [cameraUrl]);

    const startRecognition = () => {
        if (!modelsLoaded || !faceMatcher || connectionStatus !== 'online') {
            alert('Sistema não está pronto. Verifique conexão e modelos.');
            return;
        }

        setIsActive(true);

        // Capturar frames a cada 1 segundo
        frameIntervalRef.current = setInterval(() => {
            captureAndProcess();
        }, 1000);

        console.log('🎥 [IP CAM] Reconhecimento iniciado');
    };

    const stopRecognition = () => {
        setIsActive(false);
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
        }
        console.log('⏹️ [IP CAM] Reconhecimento parado');
    };

    const captureAndProcess = async () => {
        if (!imgRef.current || !canvasRef.current || !faceMatcher) return;

        try {
            // Criar imagem a partir do stream
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = async () => {
                try {
                    // Detectar rostos
                    const detections = await faceapi
                        .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                        .withFaceLandmarks()
                        .withFaceDescriptors();

                    // Desenhar no canvas
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    if (detections.length > 0) {
                        const displaySize = { width: img.width, height: img.height };
                        faceapi.matchDimensions(canvas, displaySize);
                        const resized = faceapi.resizeResults(detections, displaySize);

                        // Processar cada detecção
                        for (const detection of resized) {
                            const match = faceMatcher.findBestMatch(detection.descriptor);
                            const box = detection.detection.box;

                            // Desenhar caixa
                            ctx.lineWidth = 3;
                            ctx.strokeStyle = match.label !== 'unknown' ? '#10b981' : '#ef4444';
                            ctx.strokeRect(box.x, box.y, box.width, box.height);

                            // Desenhar nome
                            ctx.fillStyle = match.label !== 'unknown' ? '#10b981' : '#ef4444';
                            ctx.fillRect(box.x, box.y - 25, box.width, 25);
                            ctx.fillStyle = '#fff';
                            ctx.font = 'bold 14px Arial';
                            ctx.fillText(
                                match.label !== 'unknown' ? match.label : 'Desconhecido',
                                box.x + 5,
                                box.y - 7
                            );

                            // Registrar presença se reconhecido
                            if (match.label !== 'unknown') {
                                await handleRecognition(match.label);
                            }
                        }
                    }
                } catch (detErr) {
                    console.error('Erro na detecção:', detErr);
                }
            };

            img.onerror = () => {
                imgLoadErrorRef.current++;
                if (imgLoadErrorRef.current > 5) {
                    setConnectionStatus('offline');
                    stopRecognition();
                }
            };

            // Capturar frame da câmera
            img.src = `${cameraUrl}?t=${Date.now()}`;

        } catch (error) {
            console.error('Erro ao processar frame:', error);
        }
    };

    const handleRecognition = async (studentName) => {
        const student = students.find(s => s.name === studentName);
        if (!student) return;

        const now = Date.now();
        const lastTime = lastRecognitionTime.current[student.id] || 0;

        // Evitar duplicatas: 30 segundos entre reconhecimentos do mesmo aluno
        if ((now - lastTime) / 1000 < 30) return;

        lastRecognitionTime.current[student.id] = now;

        try {
            console.log(`🎯 [IP CAM] Reconhecido: ${student.name}`);

            const response = await api.post('/attendance/register', {
                student_id: student.id,
                school_id: schoolId,
                event_type: 'arrival'
            });

            const recognition = {
                studentId: student.id,
                studentName: student.name,
                className: student.class_name,
                timestamp: new Date().toLocaleTimeString('pt-BR'),
                date: new Date().toLocaleDateString('pt-BR'),
                whatsappSent: response.data.whatsapp?.success || false,
                alreadyRegistered: response.data.alreadyRegistered || false
            };

            setLastRecognition(recognition);

            if (!response.data.alreadyRegistered) {
                setRecognitionStats(prev => ({
                    today: prev.today + 1,
                    recognized: [...prev.recognized.slice(-9), recognition]
                }));
            }

            // Callback para componente pai
            if (onRecognition) {
                onRecognition(recognition);
            }

            console.log(`✅ [IP CAM] Presença registrada para ${student.name}`);

        } catch (error) {
            console.error('Erro ao registrar presença:', error);
        }
    };

    return (
        <div style={{
            background: 'rgba(17, 24, 39, 0.9)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Camera size={24} style={{ color: '#10b981' }} />
                    <div>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{cameraName}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            {connectionStatus === 'online' ? (
                                <>
                                    <Wifi size={14} style={{ color: '#10b981' }} />
                                    <span style={{ color: '#10b981', fontSize: '0.85rem' }}>Conectada</span>
                                </>
                            ) : connectionStatus === 'testing' ? (
                                <>
                                    <Wifi size={14} style={{ color: '#fbbf24' }} />
                                    <span style={{ color: '#fbbf24', fontSize: '0.85rem' }}>Testando...</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff size={14} style={{ color: '#ef4444' }} />
                                    <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>Offline</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={isActive ? stopRecognition : startRecognition}
                    disabled={connectionStatus !== 'online' || !modelsLoaded}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isActive ? '#ef4444' : '#10b981',
                        color: '#fff',
                        fontWeight: '600',
                        cursor: connectionStatus === 'online' && modelsLoaded ? 'pointer' : 'not-allowed',
                        opacity: connectionStatus === 'online' && modelsLoaded ? 1 : 0.5
                    }}
                >
                    {isActive ? <Pause size={18} /> : <Play size={18} />}
                    {isActive ? 'Parar' : 'Iniciar Reconhecimento'}
                </button>
            </div>

            {/* Stream Preview / Canvas */}
            <div style={{
                position: 'relative',
                background: '#000',
                borderRadius: '12px',
                overflow: 'hidden',
                aspectRatio: '16/9'
            }}>
                {/* Imagem de referência (hidden) */}
                <img
                    ref={imgRef}
                    src={cameraUrl ? `${cameraUrl}?t=${Date.now()}` : ''}
                    crossOrigin="anonymous"
                    alt=""
                    style={{ display: 'none' }}
                />

                {/* Canvas para exibir detecções */}
                <canvas
                    ref={canvasRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: isActive ? 'block' : 'none'
                    }}
                />

                {/* Preview estático quando parado */}
                {!isActive && (
                    <img
                        src={cameraUrl ? `${cameraUrl}?t=${Date.now()}` : ''}
                        crossOrigin="anonymous"
                        alt="Camera Preview"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                        }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                )}

                {/* Status Overlay */}
                {isActive && (
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(16, 185, 129, 0.9)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#fff',
                            animation: 'pulse 1s infinite'
                        }} />
                        <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>
                            RECONHECENDO
                        </span>
                    </div>
                )}

                {connectionStatus === 'offline' && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.8)'
                    }}>
                        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '10px' }} />
                        <span style={{ color: '#ef4444', fontWeight: '600' }}>Câmera Offline</span>
                        <span style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '5px' }}>
                            Verifique a conexão
                        </span>
                    </div>
                )}
            </div>

            {/* Último Reconhecimento */}
            {lastRecognition && !lastRecognition.alreadyRegistered && (
                <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <UserCheck size={32} style={{ color: '#10b981' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ color: '#10b981', fontWeight: '700', fontSize: '1.1rem' }}>
                            {lastRecognition.studentName}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                            {lastRecognition.className} • {lastRecognition.timestamp}
                        </div>
                    </div>
                    {lastRecognition.whatsappSent && (
                        <Bell size={20} style={{ color: '#10b981' }} />
                    )}
                </div>
            )}

            {/* Stats */}
            <div style={{
                marginTop: '15px',
                display: 'flex',
                gap: '15px'
            }}>
                <div style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: '700' }}>
                        {recognitionStats.today}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                        Reconhecimentos Hoje
                    </div>
                </div>
                <div style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: '700' }}>
                        {students.filter(s => s.face_descriptor).length}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                        Alunos Cadastrados
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
