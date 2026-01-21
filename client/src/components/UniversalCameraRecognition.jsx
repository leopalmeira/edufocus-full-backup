import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Bell, UserCheck, AlertCircle, Wifi, WifiOff, Play, Pause, Monitor, Video } from 'lucide-react';
import api from '../api/axios';
import * as faceapi from 'face-api.js';

/**
 * Componente Universal para Reconhecimento Facial
 * Suporta:
 * - Câmera IP com snapshot JPEG
 * - Stream via iframe (VDO.Ninja, etc)
 * - Webcam local
 */
export default function UniversalCameraRecognition({
    cameraUrl,
    cameraName = 'Câmera',
    schoolId,
    students = [],
    onRecognition,
    mode = 'auto' // 'auto', 'webcam', 'iframe', 'snapshot'
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const iframeRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [currentMode, setCurrentMode] = useState('webcam');
    const [lastRecognition, setLastRecognition] = useState(null);
    const [recognitionStats, setRecognitionStats] = useState({ today: 0, recognized: [] });
    const [faceMatcher, setFaceMatcher] = useState(null);
    const [statusMessage, setStatusMessage] = useState('Carregando modelos...');
    const frameIntervalRef = useRef(null);
    const lastRecognitionTime = useRef({});

    // Detectar tipo de stream baseado na URL
    useEffect(() => {
        if (mode !== 'auto') {
            setCurrentMode(mode);
            return;
        }

        if (!cameraUrl) {
            setCurrentMode('webcam');
            return;
        }

        // Detectar tipo de URL
        if (cameraUrl.includes('vdo.ninja') || cameraUrl.includes('obs.ninja')) {
            setCurrentMode('iframe');
        } else if (cameraUrl.includes('.mjpg') || cameraUrl.includes('/video') || cameraUrl.includes('mjpeg')) {
            setCurrentMode('iframe'); // MJPEG pode ser exibido em img/iframe
        } else if (cameraUrl.includes('.jpg') || cameraUrl.includes('.jpeg') || cameraUrl.includes('snapshot')) {
            setCurrentMode('snapshot');
        } else {
            // Default para webcam se não conseguir identificar
            setCurrentMode('webcam');
        }
    }, [cameraUrl, mode]);

    // Carregar modelos face-api
    useEffect(() => {
        const loadModels = async () => {
            try {
                setStatusMessage('Carregando modelos de IA...');
                const CDN_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(CDN_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(CDN_URL)
                ]);

                setModelsLoaded(true);
                setStatusMessage('Modelos carregados! Pronto para iniciar.');
                console.log('✅ Modelos face-api carregados');
            } catch (err) {
                console.error('❌ Erro ao carregar modelos:', err);
                setStatusMessage('Erro ao carregar modelos de IA');
            }
        };

        loadModels();
    }, []);

    // Configurar FaceMatcher quando students mudarem
    useEffect(() => {
        if (!modelsLoaded || students.length === 0) {
            if (modelsLoaded) {
                setStatusMessage('Aguardando alunos cadastrados com foto...');
            }
            return;
        }

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
            setStatusMessage(`Pronto! ${studentsWithDescriptors.length} aluno(s) com biometria`);
            console.log(`✅ Matcher configurado com ${studentsWithDescriptors.length} alunos`);
        } else {
            setStatusMessage('Nenhum aluno com foto cadastrada');
        }
    }, [modelsLoaded, students]);

    // Iniciar câmera webcam
    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            return true;
        } catch (err) {
            console.error('Erro ao acessar webcam:', err);
            setStatusMessage('Erro ao acessar câmera. Verifique permissões.');
            return false;
        }
    };

    // Parar webcam
    const stopWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    // Iniciar reconhecimento
    const startRecognition = async () => {
        if (!modelsLoaded || !faceMatcher) {
            alert('Sistema não está pronto. Verifique se há alunos cadastrados com foto.');
            return;
        }

        setIsActive(true);
        setStatusMessage('Iniciando reconhecimento...');

        if (currentMode === 'webcam') {
            const success = await startWebcam();
            if (!success) {
                setIsActive(false);
                return;
            }
        }

        // Iniciar loop de detecção
        frameIntervalRef.current = setInterval(() => {
            processFrame();
        }, 500); // 2 FPS

        setStatusMessage('🔍 Reconhecendo rostos...');
    };

    // Parar reconhecimento
    const stopRecognition = () => {
        setIsActive(false);

        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
        }

        if (currentMode === 'webcam') {
            stopWebcam();
        }

        setStatusMessage('Reconhecimento parado');
    };

    // Processar frame para detecção
    const processFrame = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas || !faceMatcher) return;

        const ctx = canvas.getContext('2d');
        let sourceElement = null;

        // Determinar fonte do vídeo
        if (currentMode === 'webcam' && videoRef.current) {
            sourceElement = videoRef.current;
        } else if (currentMode === 'iframe' && iframeRef.current) {
            // Para iframe, não podemos capturar diretamente devido a CORS
            // Usar webcam como fallback
            if (videoRef.current && videoRef.current.srcObject) {
                sourceElement = videoRef.current;
            }
        }

        if (!sourceElement || sourceElement.paused || sourceElement.ended) return;

        try {
            // Ajustar canvas
            canvas.width = sourceElement.videoWidth || 640;
            canvas.height = sourceElement.videoHeight || 480;

            // Desenhar frame
            ctx.drawImage(sourceElement, 0, 0);

            // Detectar rostos
            const detections = await faceapi
                .detectAllFaces(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptors();

            if (detections.length > 0) {
                const displaySize = { width: canvas.width, height: canvas.height };
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
                    ctx.fillStyle = match.label !== 'unknown' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
                    ctx.fillRect(box.x, box.y - 30, box.width, 30);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(
                        match.label !== 'unknown' ? `${match.label} ✓` : 'Desconhecido',
                        box.x + 5,
                        box.y - 8
                    );

                    // Registrar presença se reconhecido
                    if (match.label !== 'unknown' && match.distance < 0.5) {
                        await handleRecognition(match.label, match.distance);
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao processar frame:', error);
        }
    }, [currentMode, faceMatcher]);

    // Registrar presença
    const handleRecognition = async (studentName, distance) => {
        const student = students.find(s => s.name === studentName);
        if (!student) return;

        const now = Date.now();
        const lastTime = lastRecognitionTime.current[student.id] || 0;

        // Evitar duplicatas: 30 segundos entre reconhecimentos do mesmo aluno
        if ((now - lastTime) / 1000 < 30) return;

        lastRecognitionTime.current[student.id] = now;

        try {
            console.log(`🎯 Reconhecido: ${student.name} (distância: ${distance.toFixed(3)})`);

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
                similarity: ((1 - distance) * 100).toFixed(0) + '%',
                whatsappSent: response.data.whatsapp?.success || false,
                alreadyRegistered: response.data.alreadyRegistered || false
            };

            setLastRecognition(recognition);

            if (!response.data.alreadyRegistered) {
                setRecognitionStats(prev => ({
                    today: prev.today + 1,
                    recognized: [...prev.recognized.slice(-9), recognition]
                }));

                setStatusMessage(`✅ ${student.name} registrado!`);
            } else {
                setStatusMessage(`ℹ️ ${student.name} já registrado hoje`);
            }

            // Callback para componente pai
            if (onRecognition) {
                onRecognition(recognition);
            }

        } catch (error) {
            console.error('Erro ao registrar presença:', error);
        }
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (frameIntervalRef.current) {
                clearInterval(frameIntervalRef.current);
            }
            stopWebcam();
        };
    }, []);

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Camera size={24} style={{ color: '#fff' }} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: '600' }}>
                            {cameraName}
                        </h3>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '4px',
                            color: isActive ? '#10b981' : '#9ca3af',
                            fontSize: '0.9rem'
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isActive ? '#10b981' : '#6b7280',
                                animation: isActive ? 'pulse 1.5s infinite' : 'none'
                            }} />
                            {statusMessage}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Seletor de modo */}
                    <select
                        value={currentMode}
                        onChange={(e) => setCurrentMode(e.target.value)}
                        disabled={isActive}
                        style={{
                            padding: '10px 15px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: '#fff',
                            fontSize: '0.9rem',
                            cursor: isActive ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <option value="webcam">📹 Webcam</option>
                        <option value="iframe">🖥️ Stream Externo</option>
                    </select>

                    <button
                        onClick={isActive ? stopRecognition : startRecognition}
                        disabled={!modelsLoaded || !faceMatcher}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            borderRadius: '10px',
                            border: 'none',
                            background: isActive
                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: modelsLoaded && faceMatcher ? 'pointer' : 'not-allowed',
                            opacity: modelsLoaded && faceMatcher ? 1 : 0.5,
                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                            transition: 'all 0.3s'
                        }}
                    >
                        {isActive ? <Pause size={20} /> : <Play size={20} />}
                        {isActive ? 'Parar' : 'Iniciar'}
                    </button>
                </div>
            </div>

            {/* Área de Vídeo */}
            <div style={{
                position: 'relative',
                background: '#000',
                borderRadius: '16px',
                overflow: 'hidden',
                aspectRatio: '16/9',
                marginBottom: '20px'
            }}>
                {/* Webcam Video (hidden quando inativo) */}
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: currentMode === 'webcam' ? 'block' : 'none'
                    }}
                />

                {/* Iframe para stream externo */}
                {currentMode === 'iframe' && cameraUrl && (
                    <iframe
                        ref={iframeRef}
                        src={cameraUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none'
                        }}
                        allow="camera; microphone"
                    />
                )}

                {/* Canvas de detecção (overlay) */}
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        display: isActive && currentMode === 'webcam' ? 'block' : 'none'
                    }}
                />

                {/* Status Overlay */}
                {isActive && (
                    <div style={{
                        position: 'absolute',
                        top: '15px',
                        left: '15px',
                        background: 'rgba(16, 185, 129, 0.9)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: '#fff',
                            animation: 'pulse 1s infinite'
                        }} />
                        <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600' }}>
                            RECONHECENDO
                        </span>
                    </div>
                )}

                {/* Placeholder quando inativo */}
                {!isActive && currentMode === 'webcam' && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.8)'
                    }}>
                        <Video size={64} style={{ color: '#6b7280', marginBottom: '15px' }} />
                        <span style={{ color: '#9ca3af', fontSize: '1.1rem' }}>
                            Clique em "Iniciar" para ativar a câmera
                        </span>
                    </div>
                )}
            </div>

            {/* Último Reconhecimento */}
            {lastRecognition && (
                <div style={{
                    padding: '20px',
                    background: lastRecognition.alreadyRegistered
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                    border: `1px solid ${lastRecognition.alreadyRegistered ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    marginBottom: '20px',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: lastRecognition.alreadyRegistered
                            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <UserCheck size={28} style={{ color: '#fff' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            color: lastRecognition.alreadyRegistered ? '#3b82f6' : '#10b981',
                            fontWeight: '700',
                            fontSize: '1.25rem'
                        }}>
                            {lastRecognition.studentName}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '4px' }}>
                            {lastRecognition.className} • {lastRecognition.timestamp} • {lastRecognition.similarity} similaridade
                        </div>
                        {lastRecognition.alreadyRegistered && (
                            <div style={{ color: '#60a5fa', fontSize: '0.85rem', marginTop: '4px' }}>
                                ℹ️ Já registrado hoje
                            </div>
                        )}
                    </div>
                    {!lastRecognition.alreadyRegistered && (
                        <div style={{
                            padding: '8px 16px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            borderRadius: '8px',
                            color: '#10b981',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                        }}>
                            ✅ REGISTRADO
                        </div>
                    )}
                </div>
            )}

            {/* Estatísticas */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '15px'
            }}>
                <div style={{
                    padding: '16px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                    <div style={{ color: '#10b981', fontSize: '2rem', fontWeight: '700' }}>
                        {recognitionStats.today}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '4px' }}>
                        Registros Hoje
                    </div>
                </div>
                <div style={{
                    padding: '16px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                    <div style={{ color: '#3b82f6', fontSize: '2rem', fontWeight: '700' }}>
                        {students.filter(s => s.face_descriptor).length}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '4px' }}>
                        Alunos c/ Biometria
                    </div>
                </div>
                <div style={{
                    padding: '16px',
                    background: 'rgba(168, 85, 247, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid rgba(168, 85, 247, 0.2)'
                }}>
                    <div style={{ color: '#a855f7', fontSize: '2rem', fontWeight: '700' }}>
                        {students.length}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '4px' }}>
                        Total de Alunos
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.1); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
