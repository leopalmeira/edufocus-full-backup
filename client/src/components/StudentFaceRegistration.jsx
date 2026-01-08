import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, X, Save, Upload, Image as ImageIcon } from 'lucide-react';
import * as faceapi from 'face-api.js';
import api from '../api/axios';

export default function StudentFaceRegistration({ student, onClose, onSave }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const [mode, setMode] = useState('camera'); // 'camera' | 'upload'
    const [isDetecting, setIsDetecting] = useState(false);
    const [bestDescriptor, setBestDescriptor] = useState(null);
    const [status, setStatus] = useState('Iniciando...');
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);

    // Load Models
    useEffect(() => {
        const loadModels = async () => {
            try {
                const CDN_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(CDN_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(CDN_URL)
                ]);
                setModelsLoaded(true);
                if (mode === 'camera') {
                    setStatus('Posicione o rosto do aluno no centro');
                    startCamera();
                } else {
                    setStatus('Selecione uma foto do aluno');
                }
            } catch (e) {
                setStatus('Erro ao carregar modelos IA');
            }
        };
        loadModels();
        return () => stopCamera();
    }, []);

    // Switch modes
    useEffect(() => {
        if (!modelsLoaded) return;
        setBestDescriptor(null);
        if (mode === 'camera') {
            setUploadedImage(null);
            setStatus('Posicione o rosto do aluno no centro');
            startCamera();
        } else {
            stopCamera();
            setStatus('Selecione uma foto do aluno');
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    }, [mode, modelsLoaded]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsDetecting(true);
        } catch (err) {
            setStatus('Erro ao acessar câmera.');
        }
    };

    const stopCamera = () => {
        setIsDetecting(false);
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }
    };

    const handleVideoPlay = () => {
        const interval = setInterval(async () => {
            if (!videoRef.current || !canvasRef.current || !isDetecting || mode !== 'camera') return;

            const video = videoRef.current;
            const canvas = canvasRef.current;

            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();

            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);

            if (resizedDetections.length === 1) {
                const det = resizedDetections[0];
                if (det.detection.score > 0.8) {
                    setBestDescriptor(Array.from(det.descriptor));
                    setStatus('Rosto detectado com alta qualidade!');
                } else {
                    setStatus('Melhore a iluminação ou posição.');
                }
            } else if (resizedDetections.length > 1) {
                setStatus('Apenas uma pessoa por vez.');
                setBestDescriptor(null);
            } else {
                setBestDescriptor(null);
                setStatus('Procurando rosto...');
            }

        }, 200);
        return () => clearInterval(interval);
    };

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const imgUrl = URL.createObjectURL(file);
            setUploadedImage(imgUrl);
            setStatus('Processando imagem...');

            const img = await faceapi.fetchImage(imgUrl);

            // Wait a bit for image to be ready if needed, or process directly
            const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

            if (detections.length === 0) {
                setStatus('Nenhum rosto detectado na foto.');
                setBestDescriptor(null);
            } else if (detections.length > 1) {
                setStatus('Muitos rostos detectados. Use uma foto apenas do aluno.');
                setBestDescriptor(null);
            } else {
                setBestDescriptor(Array.from(detections[0].descriptor));
                setStatus('Rosto extraído com sucesso da foto!');

                // Draw detection on canvas over the image
                if (canvasRef.current) {
                    const canvas = canvasRef.current;
                    const displaySize = { width: img.width, height: img.height };
                    // We need to fit image in container, logic bit complex for pure canvas overlay on img tag
                    // For simplicity, we trust the status message.
                }
            }
        }
    };

    const handleSave = async () => {
        if (!bestDescriptor) return;
        setStatus('Salvando...');
        try {
            await api.put(`/school/students/${student.id}/face`, {
                face_descriptor: JSON.stringify(bestDescriptor)
            });
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            setStatus('Erro ao salvar. Tente novamente.');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '20px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                    <X size={24} />
                </button>

                <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: '15px' }}>
                    Cadastrar Biometria: <span style={{ color: 'var(--accent-primary)' }}>{student.name}</span>
                </h2>

                {/* Tabs */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
                    <button
                        onClick={() => setMode('camera')}
                        style={{
                            background: mode === 'camera' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                            border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <Camera size={20} /> Câmera
                    </button>
                    <button
                        onClick={() => setMode('upload')}
                        style={{
                            background: mode === 'upload' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                            border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <Upload size={20} /> Upload Foto
                    </button>
                </div>

                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', aspectRatio: '4/3', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                    {mode === 'camera' ? (
                        <>
                            <video ref={videoRef} onPlay={handleVideoPlay} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                        </>
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}>
                            {uploadedImage ? (
                                <img src={uploadedImage} alt="Upload" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : (
                                <div onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer', textAlign: 'center', color: '#aaa' }}>
                                    <ImageIcon size={48} style={{ marginBottom: '10px' }} />
                                    <p>Clique para selecionar uma foto</p>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            {uploadedImage && (
                                <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                    Trocar Foto
                                </button>
                            )}
                        </div>
                    )}

                    {!modelsLoaded && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                            Carregando IA...
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <p style={{ color: bestDescriptor ? '#10b981' : '#f59e0b', fontWeight: 'bold', fontSize: '1.1rem' }}>{status}</p>

                    <button
                        onClick={handleSave}
                        disabled={!bestDescriptor}
                        style={{
                            marginTop: '15px',
                            background: bestDescriptor ? 'var(--accent-primary)' : '#64748b',
                            color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px',
                            fontSize: '1rem', fontWeight: 'bold', cursor: bestDescriptor ? 'pointer' : 'not-allowed',
                            display: 'inline-flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <Save size={20} /> Salvar Biometria
                    </button>
                </div>
            </div>
        </div>
    );
}
