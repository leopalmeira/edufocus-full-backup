import { useState, useEffect, useRef } from 'react';
import { Menu, BarChart3, Users, MessageSquare, Shuffle, Settings, LogOut, Play, Pause, Camera, TrendingUp, AlertTriangle, CheckCircle, Clock, Brain, BookOpen, Bell, FileText, Calendar, HelpCircle, RefreshCw, Download, Eye, Activity, Zap, Target, Send, X } from 'lucide-react';
import api from '../api/axios';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import EmotionMonitor from '../components/EmotionMonitor';
import '../styles/TeacherDashboardFixed.css';

export default function TeacherDashboard() {
    const { logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [teacher, setTeacher] = useState(null);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [monitoring, setMonitoring] = useState(false);
    const [students, setStudents] = useState([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Estados para métricas em tempo real
    const [metrics, setMetrics] = useState({
        attention: 0,
        disposition: 0,
        performance: 0,
        engagement: 0
    });

    const [emotions, setEmotions] = useState({});
    const [alerts, setAlerts] = useState([]);
    const [distribution, setDistribution] = useState({ high: 0, medium: 0, low: 0 });

    // Estados para enquetes
    const [pollActive, setPollActive] = useState(false);
    const [currentPoll, setCurrentPoll] = useState(null);
    const [pollResults, setPollResults] = useState([]);
    const [countdown, setCountdown] = useState(0);

    // Estados para rodízio
    const [lastSeatingChange, setLastSeatingChange] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Estados para mensagens
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Estado para dados reais de emoções da câmera
    const [emotionData, setEmotionData] = useState(null);
    const [capturedAnswers, setCapturedAnswers] = useState({}); // {studentId: 'A'|'B'|'C'|'D'}
    const [currentResponsesCount, setCurrentResponsesCount] = useState(0);

    useEffect(() => {
        document.body.classList.add('force-landscape');
        return () => document.body.classList.remove('force-landscape');
    }, []);

    useEffect(() => {
        const initDashboard = async () => {
            try {
                const res = await api.get('/teacher/me');
                setTeacher(res.data);

                if (res.data.school_id) {
                    const classesRes = await api.get('/teacher/classes');
                    setClasses(classesRes.data);
                }
            } catch (err) {
                console.error('Erro ao carregar dados:', err);
            } finally {
                setLoading(false);
            }
        };
        initDashboard();
    }, []);

    useEffect(() => {
        if (!selectedClass) return;

        const loadClassData = async () => {
            try {
                const res = await api.get(`/teacher/students?class_id=${selectedClass.id}`);
                const studentsData = res.data.map(s => ({
                    ...s,
                    img: s.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`
                }));
                setStudents(studentsData);

                // Carregar última mudança de carteiras
                const seatingRes = await api.get(`/teacher/class/${selectedClass.id}/last-seating-change`).catch(() => ({ data: null }));
                setLastSeatingChange(seatingRes.data?.last_change);

                // Carregar mensagens da escola
                loadMessages();

            } catch (err) {
                console.error('Erro ao carregar alunos:', err);
            }
        };

        loadClassData();
    }, [selectedClass]);

    const handleEmotionsUpdate = (data) => {
        setEmotionData(data);

        if (data.stats) {
            const total = data.totalFaces || 1;

            // Cálculo dinâmico de métricas baseado na distribuição emocional
            // Feliz/Neutro = Bom Foco
            const positiveEmotions = (data.stats.happy || 0) + (data.stats.neutral || 0) + (data.stats.surprise || 0);
            const negativeEmotions = (data.stats.angry || 0) + (data.stats.sad || 0) + (data.stats.disgust || 0) + (data.stats.fear || 0);

            setMetrics({
                attention: Math.min(100, Math.round((positiveEmotions / total) * 100)),
                disposition: Math.min(100, Math.round(((data.stats.happy || 0) / total) * 100 + 20)),
                performance: metrics.performance, // Mantém o anterior ou calcula se tiver dados de polls
                engagement: Math.min(100, Math.round((total / (students.length || 1)) * 100))
            });

            // Atualizar distribuição para as barras de progresso
            setDistribution({
                high: data.stats.happy || 0,
                medium: data.stats.neutral || 0,
                low: negativeEmotions
            });

            // Atualizar respostas de enquete em tempo real se ativa
            if (data.responses && pollActive) {
                const fingerMap = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
                setCapturedAnswers(prev => {
                    const next = { ...prev };
                    let changed = false;
                    Object.entries(data.responses).forEach(([sid, fingers]) => {
                        const letter = fingerMap[fingers];
                        if (letter && next[sid] !== letter) {
                            next[sid] = letter;
                            changed = true;
                        }
                    });
                    if (changed) {
                        setCurrentResponsesCount(Object.keys(next).length);
                        return next;
                    }
                    return prev;
                });
            }

            // Gerar alertas automáticos se muitos alunos estiverem desatentos
            if (negativeEmotions >= 3 && monitoring) {
                const newAlert = {
                    title: 'Dispersão Detectada',
                    description: `${negativeEmotions} alunos apresentam sinais de desatenção ou emoções negativas.`,
                    type: 'warning'
                };

                // Evitar duplicatas exageradas
                setAlerts(prev => {
                    const exists = prev.some(a => a.description === newAlert.description);
                    if (exists) return prev;
                    return [newAlert, ...prev].slice(0, 5);
                });
            }
        }
    };

    const startPoll = async (poll) => {
        setCapturedAnswers({});
        setCurrentResponsesCount(0);
        setCurrentPoll(poll);

        // FORÇAR MONITORAMENTO ATIVO PARA A CAMERA APARECER
        setMonitoring(true);

        setPollActive(true);
        setCountdown(10);

        try {
            const pollRes = await api.post('/teacher/polls', {
                class_id: selectedClass.id,
                question: poll.question,
                optionA: poll.option1,
                optionB: poll.option2,
                optionC: poll.option3,
                optionD: poll.option4,
                correct_answer: poll.correct
            });

            const pollId = pollRes.data.pollId;

            const countInterval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countInterval);
                        capturePollResponses(pollId, poll);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            console.error('Erro ao criar enquete:', err);
            alert('Erro ao criar enquete');
        }
    };

    const capturePollResponses = async (pollId, poll) => {
        try {
            const responses = (students || []).map(student => {
                const answer = (capturedAnswers || {})[student.id];
                return {
                    studentId: student.id,
                    studentName: student.name,
                    answer: answer || null,
                    isCorrect: String(answer) === String(poll?.correct)
                };
            });

            const validResponses = responses.filter(r => r.answer !== null);

            await api.post(`/teacher/polls/${pollId}/responses`, { responses: validResponses });

            setPollResults(prev => [...(prev || []), {
                pollId,
                question: poll?.question || 'Enquete sem título',
                responses: validResponses,
                timestamp: new Date()
            }]);

            alert(`✅ Enquete finalizada! ${validResponses.length} respostas capturadas.`);
        } catch (err) {
            console.error('Erro ao registrar respostas:', err);
            alert('⚠️ Erro ao registrar respostas no servidor, mas a sessão foi encerrada.');
        } finally {
            setPollActive(false);
            setCapturedAnswers({});
            setCurrentResponsesCount(0);
        }
    };

    const shuffleSeats = async () => {
        if (!confirm('Deseja reorganizar as carteiras com base nos dados de atenção e comportamento?')) return;

        try {
            const arrangement = students.map((student, idx) => ({
                studentId: student.id,
                position: idx + 1
            }));

            await api.post('/teacher/seating', {
                class_id: selectedClass.id,
                arrangement
            });

            setLastSeatingChange(new Date());
            alert('✅ Carteiras reorganizadas com sucesso!');
        } catch (err) {
            console.error('Erro ao reorganizar carteiras:', err);
        }
    };

    const loadStudentReport = async (student) => {
        try {
            const res = await api.get(`/teacher/student/${student.id}/report`);
            setSelectedStudent({ ...student, reportData: res.data });
        } catch (err) {
            console.error('Erro ao carregar relatório:', err);
            setSelectedStudent(student);
        }
    };

    const loadMessages = async () => {
        try {
            const res = await api.get('/teacher/messages');
            setMessages(res.data || []);
            const unread = (res.data || []).filter(m => !m.read && m.sender_type !== 'teacher').length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Erro ao carregar mensagens:', err);
            setMessages([]);
        }
    };

    useEffect(() => {
        if (teacher?.school_id) {
            loadMessages();
            const interval = setInterval(loadMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [teacher]);

    const markAsRead = async (messageId) => {
        try {
            await api.put(`/teacher/messages/${messageId}/read`);
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, read: true } : m
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Erro ao marcar mensagem como lida:', err);
        }
    };

    if (loading) return <div className="teacher-dashboard-wrapper"><div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>Carregando...</div></div>;

    if (!teacher?.school_id) {
        return (
            <div className="teacher-dashboard-wrapper">
                <div className="class-selection">
                    <div className="class-box">
                        <h1>Aguardando Vínculo</h1>
                        <p>Olá, <strong>{teacher?.name}</strong>. Peça ao administrador para vincular você a uma escola.</p>
                        <button className="btn btn-danger" onClick={logout}>Sair</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedClass) {
        return (
            <div className="teacher-dashboard-wrapper">
                <div className="class-selection">
                    <div className="class-box">
                        <h1>Selecionar Turma</h1>
                        <p>Olá, Professor(a) <strong>{teacher.name}</strong>! Selecione a turma:</p>
                        {classes.length > 0 ? (
                            <div className="class-grid">
                                {classes.map(cls => (
                                    <div key={cls.id} className="class-item" onClick={() => setSelectedClass(cls)}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{cls.name}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                                Nenhuma turma vinculada.
                            </div>
                        )}
                        <button className="btn btn-danger" onClick={logout} style={{ marginTop: '20px' }}>Sair</button>
                    </div>
                </div>
            </div>
        );
    }

    const daysSinceLastSeating = lastSeatingChange
        ? Math.floor((new Date() - new Date(lastSeatingChange)) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="teacher-dashboard-wrapper">
            <div className="app-container">
                <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <Menu size={24} />
                </button>

                <div className={`sidebar-backdrop ${mobileMenuOpen ? 'visible' : ''}`} onClick={() => setMobileMenuOpen(false)} />

                <div className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
                    <div className="logo">
                        <h1>Edu<span>Focus</span></h1>
                    </div>
                    <ul className="menu">
                        <li className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}>
                            <BarChart3 size={20} /> <span>Dashboard</span>
                        </li>
                        <li className={`menu-item ${activeTab === 'seats' ? 'active' : ''}`} onClick={() => { setActiveTab('seats'); setMobileMenuOpen(false); }}>
                            <Shuffle size={20} /> <span>Rodízio de Carteiras</span>
                        </li>
                        <li className={`menu-item ${activeTab === 'interactivity' ? 'active' : ''}`} onClick={() => { setActiveTab('interactivity'); setMobileMenuOpen(false); }}>
                            <MessageSquare size={20} /> <span>Interatividade</span>
                        </li>
                        <li className={`menu-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => { setActiveTab('students'); setMobileMenuOpen(false); }}>
                            <Users size={20} /> <span>Alunos</span>
                        </li>
                        <li className={`menu-item ${activeTab === 'academic' ? 'active' : ''}`} onClick={() => { setActiveTab('academic'); setMobileMenuOpen(false); }}>
                            <BookOpen size={20} /> <span>Acadêmico</span>
                        </li>
                        <li className={`menu-item ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => { setActiveTab('messages'); setMobileMenuOpen(false); }}>
                            <Bell size={20} /> <span>Mensagens</span>
                            {unreadCount > 0 && <span className="menu-badge">{unreadCount}</span>}
                        </li>
                    </ul>
                    <button className="logout-btn" onClick={logout}>
                        <LogOut size={20} /> <span>Sair</span>
                    </button>
                </div>

                <div className="main-content">
                    {/* DASHBOARD */}
                    {activeTab === 'dashboard' && (
                        <div className="fade-in">
                            {/* Header Profissional */}
                            <div className="content-header-premium">
                                <div className="header-title-group">
                                    <div className="title-icon-wrapper">
                                        <BarChart3 size={32} />
                                    </div>
                                    <div>
                                        <h1>Painel de Comando</h1>
                                        <p>Monitoramento Analítico • {selectedClass.name} • {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                                    </div>
                                </div>

                                <div className="header-controls-premium">
                                    <div className="session-timer">
                                        <Clock size={16} />
                                        <span>01:24:05</span>
                                    </div>
                                    <button
                                        className={`btn-monitor ${monitoring ? 'active' : ''}`}
                                        onClick={() => setMonitoring(!monitoring)}
                                    >
                                        {monitoring ? (
                                            <><span className="pulse-red"></span> Parar Monitoramento</>
                                        ) : (
                                            <><Camera size={18} /> Iniciar Análise</>
                                        )}
                                    </button>
                                    <div className="divider-v"></div>
                                    <button className="btn-small-round" title="Atualizar Dados" onClick={() => window.location.reload()}>
                                        <RefreshCw size={18} />
                                    </button>
                                    <button className="btn-small-round" title="Alertas">
                                        <Bell size={18} />
                                        {alerts.length > 0 && <span className="badge-glow">{alerts.length}</span>}
                                    </button>
                                </div>
                            </div>

                            {/* Alertas Críticos (Banner flutuante se houver muitos) */}
                            {alerts.length > 0 && monitoring && (
                                <div className="live-alert-banner">
                                    <div className="alert-aura"></div>
                                    <AlertTriangle size={20} className="shake-anim" />
                                    <marquee behavior="scroll" direction="left">
                                        {alerts.map((a, i) => (
                                            <span key={i} className="alert-text">
                                                <strong>{a.title}:</strong> {a.description} •
                                            </span>
                                        ))}
                                    </marquee>
                                </div>
                            )}

                            {/* Monitor de Emoções com Câmera (Invisível/Logístico) */}
                            <EmotionMonitor
                                onEmotionsUpdate={handleEmotionsUpdate}
                                isActive={monitoring}
                                roomId={selectedClass.id}
                                schoolId={teacher.school_id}
                                students={students}
                            />

                            {/* Grid Superior: Métricas e Visualização em Tempo Real */}
                            <div className="dashboard-top-grid">
                                {/* Métricas Principais com Sparklines */}
                                <div className="metrics-column">
                                    <div className="premium-metrics-grid">
                                        <PremiumMetricCard
                                            title="Nível de Foco"
                                            value={metrics.attention}
                                            icon={<Brain size={20} />}
                                            color="#60a5fa"
                                            glowColor="rgba(96, 165, 250, 0.4)"
                                            data={[40, 45, 60, 55, 70, 75, metrics.attention]}
                                        />
                                        <PremiumMetricCard
                                            title="Clima da Turma"
                                            value={metrics.disposition}
                                            icon={<Activity size={20} />}
                                            color="#34d399"
                                            glowColor="rgba(52, 211, 153, 0.4)"
                                            data={[50, 55, 52, 58, 62, 60, metrics.disposition]}
                                        />
                                        <PremiumMetricCard
                                            title="Engajamento"
                                            value={metrics.engagement}
                                            icon={<Zap size={20} />}
                                            color="#fbbf24"
                                            glowColor="rgba(251, 191, 36, 0.4)"
                                            data={[30, 40, 45, 55, 65, 75, metrics.engagement]}
                                        />
                                        <PremiumMetricCard
                                            title="Performance"
                                            value={metrics.performance}
                                            icon={<Target size={20} />}
                                            color="#a78bfa"
                                            glowColor="rgba(167, 139, 250, 0.4)"
                                            data={[60, 62, 65, 68, 72, 75, metrics.performance]}
                                        />
                                    </div>
                                </div>

                                {/* Visualização Analítica Central */}
                                <div className="analytics-card glass-panel-premium">
                                    <div className="card-header">
                                        <h3><Activity size={18} /> Insights em Tempo Real</h3>
                                        <div className="live-pill">AO VIVO</div>
                                    </div>

                                    <div className="analytics-content">
                                        {monitoring ? (
                                            <div className="radar-container">
                                                <div className="radar-circle">
                                                    <div className="radar-sweep"></div>
                                                    <div className="central-icon"><Eye size={32} /></div>
                                                    {/* Pontos representando alunos ativos */}
                                                    {students.slice(0, 12).map((s, i) => (
                                                        <div
                                                            key={i}
                                                            className="radar-dot"
                                                            style={{
                                                                top: `${20 + Math.random() * 60}%`,
                                                                left: `${20 + Math.random() * 60}%`,
                                                                animationDelay: `${i * 0.2}s`
                                                            }}
                                                        ></div>
                                                    ))}
                                                </div>
                                                <div className="radar-info">
                                                    <div className="info-stat">
                                                        <span className="label">Presença Ativa</span>
                                                        <span className="value">{emotionData ? emotionData.totalFaces : 0} ({students.length})</span>
                                                    </div>
                                                    <div className="info-stat">
                                                        <span className="label">Status</span>
                                                        <span className="value green">Analisando Comportamento</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="empty-analytics">
                                                <div className="empty-glow"></div>
                                                <Play size={48} style={{ opacity: 0.3 }} />
                                                <p>Inicie o monitoramento para visualizar dados analíticos da turma</p>
                                                <button className="btn btn-primary" onClick={() => setMonitoring(true)}>Ativar Câmera</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Grid Inferior: Distribuição e Informações Detalhadas */}
                            <div className="dashboard-bottom-grid">
                                {/* Distribuição Emocional */}
                                <div className="distribution-card glass-panel-premium">
                                    <div className="card-header">
                                        <h3><BarChart3 size={18} /> Perfil Comportamental</h3>
                                    </div>
                                    <div className="distribution-bars">
                                        <div className="dist-item">
                                            <div className="dist-info">
                                                <span>Alta Atenção</span>
                                                <span className="dist-value">{distribution.high} alunos</span>
                                            </div>
                                            <div className="premium-progress-bar">
                                                <div className="bar-bg"></div>
                                                <div className="bar-fill blue" style={{ width: `${(distribution.high / (students.length || 1)) * 100}%` }}></div>
                                                <div className="bar-glow blue"></div>
                                            </div>
                                        </div>
                                        <div className="dist-item">
                                            <div className="dist-info">
                                                <span>Média Atenção</span>
                                                <span className="dist-value">{distribution.medium} alunos</span>
                                            </div>
                                            <div className="premium-progress-bar">
                                                <div className="bar-bg"></div>
                                                <div className="bar-fill yellow" style={{ width: `${(distribution.medium / (students.length || 1)) * 100}%` }}></div>
                                                <div className="bar-glow yellow"></div>
                                            </div>
                                        </div>
                                        <div className="dist-item">
                                            <div className="dist-info">
                                                <span>Baixa Atenção</span>
                                                <span className="dist-value">{distribution.low} alunos</span>
                                            </div>
                                            <div className="premium-progress-bar">
                                                <div className="bar-bg"></div>
                                                <div className="bar-fill red" style={{ width: `${(distribution.low / (students.length || 1)) * 100}%` }}></div>
                                                <div className="bar-glow red"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contexto Acadêmico */}
                                <div className="context-card glass-panel-premium">
                                    <div className="card-header">
                                        <h3><BookOpen size={18} /> Contexto Acadêmico</h3>
                                    </div>
                                    <div className="context-grid">
                                        <div className="context-item">
                                            <div className="ctx-label">Matéria</div>
                                            <div className="ctx-value">Matemática</div>
                                            <div className="ctx-tag blue">Aula 05/12</div>
                                        </div>
                                        <div className="context-item">
                                            <div className="ctx-label">Tópico Atual</div>
                                            <div className="ctx-value">Equações Quadráticas</div>
                                        </div>
                                        <div className="context-item">
                                            <div className="ctx-label">Duração</div>
                                            <div className="ctx-value">50 min restantes</div>
                                        </div>
                                        <div className="context-item">
                                            <div className="ctx-label">Próxima Aula</div>
                                            <div className="ctx-value">História</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MEUS ALUNOS */}
                    {activeTab === 'students' && (
                        <StudentsTab
                            students={students}
                            emotions={emotions}
                            onSelectStudent={loadStudentReport}
                        />
                    )}

                    {/* ENQUETES */}
                    {activeTab === 'interactivity' && (
                        <InteractivityTab
                            onStartPoll={startPoll}
                            currentResponsesCount={currentResponsesCount}
                            pollActive={pollActive}
                            currentPoll={currentPoll}
                            countdown={countdown}
                            pollResults={pollResults}
                            monitoring={monitoring}
                            setMonitoring={setMonitoring}
                            selectedClass={selectedClass}
                        />
                    )}

                    {/* RODÍZIO */}
                    {activeTab === 'seats' && (
                        <SeatsTab
                            students={students}
                            lastSeatingChange={lastSeatingChange}
                            daysSinceLastSeating={daysSinceLastSeating}
                            onShuffle={shuffleSeats}
                        />
                    )}

                    {/* ACADÊMICO */}
                    {activeTab === 'academic' && (
                        <AcademicTab
                            students={students}
                            classId={selectedClass?.id}
                        />
                    )}

                    {/* MENSAGENS */}
                    {activeTab === 'messages' && (
                        <MessagesTab
                            messages={messages}
                            onMarkAsRead={markAsRead}
                            onRefresh={loadMessages}
                            teacher={teacher}
                        />
                    )}
                </div>

                {selectedStudent && (
                    <StudentReportModal
                        student={selectedStudent}
                        onClose={() => setSelectedStudent(null)}
                        pollResults={pollResults}
                        emotions={emotions}
                    />
                )}
            </div>
        </div>
    );
}

// Componentes auxiliares
// Componente de Métrica Premium com Sparkline
function PremiumMetricCard({ title, value, icon, color, glowColor, data = [] }) {
    return (
        <div className="premium-metric-card" style={{ '--accent-color': color, '--glow-color': glowColor }}>
            <div className="card-inner">
                <div className="card-top">
                    <div className="icon-box" style={{ backgroundColor: `${color}20`, color: color }}>
                        {icon}
                    </div>
                    <div className="trend-badge">
                        <TrendingUp size={12} />
                        <span>+12%</span>
                    </div>
                </div>

                <div className="card-body">
                    <div className="value-group">
                        <span className="current-value">{value}%</span>
                        <span className="value-label">{title}</span>
                    </div>

                    <div className="sparkline-wrapper">
                        <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path
                                d={`M ${data.map((v, i) => `${(i / (data.length - 1)) * 100} ${30 - (v / 100) * 30}`).join(' L ')}`}
                                fill="none"
                                stroke={color}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d={`M ${data.map((v, i) => `${(i / (data.length - 1)) * 100} ${30 - (v / 100) * 30}`).join(' L ')} L 100 30 L 0 30 Z`}
                                fill={`url(#grad-${title.replace(/\s+/g, '')})`}
                            />
                        </svg>
                    </div>
                </div>
            </div>
            <div className="card-glow"></div>
        </div>
    );
}

// Manter componentes antigos para compatibilidade se necessário, ou remover
function MetricCard({ title, value, icon, color, change }) {
    const [showDetails, setShowDetails] = useState(false);

    const getMetricDescription = (title) => {
        const descriptions = {
            'Atenção da Turma': 'Mede o nível de foco e concentração dos alunos durante a aula, baseado em análise comportamental.',
            'Disposição da Turma': 'Avalia o nível de energia e motivação dos alunos para participar das atividades.',
            'Desempenho': 'Indica a performance acadêmica geral da turma com base em atividades e avaliações.',
            'Engajamento': 'Mede a participação ativa dos alunos em enquetes, discussões e atividades interativas.'
        };
        return descriptions[title] || 'Métrica de acompanhamento da turma.';
    };

    const getRecommendations = (title, value) => {
        const recommendations = {
            'Atenção da Turma': value < 70 ? [
                '🎯 Faça uma pausa de 5 minutos',
                '🎮 Introduza uma atividade interativa',
                '❓ Faça perguntas para engajar os alunos'
            ] : [
                '✅ Mantenha o ritmo atual',
                '📚 Aproveite para aprofundar o conteúdo',
                '🎯 Introduza conceitos mais complexos'
            ],
            'Disposição da Turma': value < 65 ? [
                '🏃 Atividade física rápida (alongamento)',
                '🎵 Música motivacional',
                '🎮 Jogo educativo'
            ] : [
                '✅ Disposição excelente',
                '📖 Momento ideal para novos conteúdos',
                '🎯 Aproveite para atividades desafiadoras'
            ],
            'Desempenho': value < 75 ? [
                '📝 Revisar conteúdos anteriores',
                '👥 Atividades em grupo',
                '🎯 Exercícios de reforço'
            ] : [
                '✅ Desempenho excelente',
                '🚀 Avançar para próximos tópicos',
                '🏆 Reconhecer o progresso da turma'
            ],
            'Engajamento': value < 80 ? [
                '📋 Criar enquete interativa',
                '🎮 Gamificar a aula',
                '🤝 Atividade colaborativa'
            ] : [
                '✅ Engajamento ótimo',
                '🎯 Manter estratégias atuais',
                '🏆 Celebrar participação ativa'
            ]
        };
        return recommendations[title] || [];
    };

    return (
        <>
            <div
                className="metric-compact clickable"
                onClick={() => setShowDetails(true)}
                style={{ cursor: 'pointer' }}
            >
                <div className="metric-header-compact">
                    <h3 className="metric-title-compact">{title}</h3>
                    <div style={{ color }}>{icon}</div>
                </div>
                <div className="metric-value-compact">{value}%</div>
                <div className={`metric-change ${change === 'positive' ? 'change-positive' : 'change-negative'}`}>
                    {change === 'positive' ? '↑' : '↓'} {Math.abs(value - 75)}% {change === 'positive' ? 'acima' : 'abaixo'} da média
                </div>
                <div className="progress-bar-compact">
                    <div className="progress-fill-compact" style={{ width: `${value}%`, backgroundColor: color }}></div>
                </div>
                <div style={{
                    marginTop: '0.75rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    opacity: 0.7
                }}>
                    Clique para ver detalhes
                </div>
            </div>

            {showDetails && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.85)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        animation: 'fadeIn 0.3s ease-out'
                    }}
                    onClick={() => setShowDetails(false)}
                >
                    <div
                        className="glass-panel"
                        style={{
                            maxWidth: '600px',
                            width: '100%',
                            padding: '2rem',
                            maxHeight: '80vh',
                            overflowY: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ color, fontSize: '2rem' }}>{icon}</div>
                            <div>
                                <h2 style={{ margin: 0, marginBottom: '0.25rem' }}>{title}</h2>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    {getMetricDescription(title)}
                                </p>
                            </div>
                        </div>

                        <div style={{
                            padding: '1.5rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px',
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '3rem', fontWeight: '800', color, marginBottom: '0.5rem' }}>
                                {value}%
                            </div>
                            <div className={`metric-change ${change === 'positive' ? 'change-positive' : 'change-negative'}`}>
                                {change === 'positive' ? '↑' : '↓'} {Math.abs(value - 75)}% {change === 'positive' ? 'acima' : 'abaixo'} da média
                            </div>
                            <div className="progress-bar-compact" style={{ marginTop: '1rem' }}>
                                <div className="progress-fill-compact" style={{ width: `${value}%`, backgroundColor: color }}></div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Target size={20} style={{ color }} />
                                Recomendações
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {getRecommendations(title, value).map((rec, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            borderRadius: '8px',
                                            borderLeft: `3px solid ${color}`,
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        {rec}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={() => setShowDetails(false)}
                            style={{ width: '100%' }}
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

function InfoItem({ label, value, color }) {
    return (
        <div className="info-item">
            <div className="info-label">{label}</div>
            <div className="info-value" style={color ? { color } : {}}>{value}</div>
        </div>
    );
}

function AlertItem({ alert }) {
    const iconClass = alert.type === 'attention' ? 'alerta-attention' :
        alert.type === 'disposition' ? 'alerta-disposition' : 'alerta-behavior';

    return (
        <div className="alerta-item-compact">
            <div className={`alerta-icon-compact ${iconClass}`}>
                {alert.type === 'attention' && <Brain size={18} />}
                {alert.type === 'disposition' && <Activity size={18} />}
                {alert.type === 'behavior' && <Users size={18} />}
            </div>
            <div className="alerta-text-compact">
                <strong>{alert.title}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{alert.description}</div>
            </div>
            <div className="alerta-time-compact">{alert.time}</div>
        </div>
    );
}

function DistributionItem({ value, label, percentage, color }) {
    return (
        <div className="distribuicao-item">
            <div className={`distribuicao-valor ${color}`}>{value}</div>
            <div className="distribuicao-label">{label}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{percentage}% dos alunos</div>
        </div>
    );
}

function StudentsTab({ students, emotions, onSelectStudent }) {
    return (
        <div className="fade-in">
            <div className="content-header">
                <div className="page-title">
                    <h1>Meus Alunos</h1>
                    <div className="page-subtitle">Visualize e acompanhe cada aluno individualmente</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {students.map(student => (
                    <div
                        key={student.id}
                        className="glass-panel"
                        style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onClick={() => onSelectStudent(student)}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <img src={student.img} alt={student.name} style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{student.name}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {student.age} anos
                                </div>
                            </div>
                        </div>
                        {emotions[student.id] && (
                            <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    Emoção Atual
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                    {emotions[student.id] === 'feliz' && '😊'}
                                    {emotions[student.id] === 'triste' && '😢'}
                                    {emotions[student.id] === 'raiva' && '😠'}
                                    {emotions[student.id] === 'medo' && '😨'}
                                    {emotions[student.id] === 'surpresa' && '😲'}
                                    {emotions[student.id] === 'nojo' && '🤢'}
                                    {emotions[student.id] === 'neutro' && '😐'}
                                    {' '}{emotions[student.id]}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function InteractivityTab({
    onStartPoll, pollActive, currentPoll, countdown, pollResults,
    currentResponsesCount, monitoring, setMonitoring, selectedClass
}) {
    const [poll, setPoll] = useState({
        question: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct: '1'
    });

    const handleSubmit = () => {
        if (!poll.question || !poll.option1 || !poll.option2 || !poll.option3 || !poll.option4) {
            alert('⚠️ Preencha todos os campos!');
            return;
        }
        onStartPoll(poll);
        setPoll({ question: '', option1: '', option2: '', option3: '', option4: '', correct: '1' });
    };

    // Efeito para iniciar/parar a câmera no servidor Python
    useEffect(() => {
        const manageCamera = async () => {
            const pythonApiUrl = 'http://localhost:5001/api/analysis';
            try {
                if (monitoring && selectedClass?.id) {
                    console.log('🔵 Iniciando câmera para sala:', selectedClass.id);
                    await axios.post(`${pythonApiUrl}/start`, {
                        room_id: selectedClass.id,
                        school_id: 1, // Fallback safe
                        camera_url: 0 // Força webcam local
                    });
                } else if (!monitoring && selectedClass?.id) {
                    console.log('🔴 Parando câmera...');
                    await axios.post(`${pythonApiUrl}/stop`, { room_id: selectedClass.id });
                }
            } catch (error) {
                console.error('Erro na câmera Python:', error);
            }
        };
        manageCamera();

        // Cleanup ao desmontar
        return () => {
            if (monitoring && selectedClass?.id) {
                axios.post('http://localhost:5001/api/analysis/stop', { room_id: selectedClass.id }).catch(() => { });
            }
        };
    }, [monitoring, selectedClass]);

    return (
        <div className="fade-in">
            <div className="content-header">
                <div className="page-title">
                    <h1>Enquetes Interativas</h1>
                    <div className="page-subtitle">Crie perguntas e capture respostas em tempo real</div>
                </div>
            </div>

            {!pollActive && (
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Nova Enquete</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Digite sua pergunta..."
                            value={poll.question}
                            onChange={(e) => setPoll({ ...poll, question: e.target.value })}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            {[1, 2, 3, 4].map(opt => (
                                <input
                                    key={opt}
                                    type="text"
                                    className="input-field"
                                    placeholder={`Opção ${opt}`}
                                    value={poll[`option${opt}`]}
                                    onChange={(e) => setPoll({ ...poll, [`option${opt}`]: e.target.value })}
                                />
                            ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label>Resposta Correta:</label>
                            <select
                                className="input-field"
                                value={poll.correct}
                                onChange={(e) => setPoll({ ...poll, correct: e.target.value })}
                                style={{ width: 'auto' }}
                            >
                                {[1, 2, 3, 4].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 1 }}>
                                <Camera size={20} /> Iniciar Enquete Oficial
                            </button>
                            <button
                                className="btn btn-ghost"
                                onClick={() => setMonitoring(!monitoring)}
                                style={{ border: monitoring ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)' }}
                            >
                                {monitoring ? 'Desligar Câmera de Teste' : 'Testar Câmera de IA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {monitoring && !pollActive && (
                <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', border: '1px solid var(--accent-primary)' }}>
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>MODO DE TESTE: Verifique se os nomes aparecem sobre os rostos</span>
                        <button className="btn btn-icon" onClick={() => setMonitoring(false)}><X size={18} /></button>
                    </div>
                    <img
                        src={`http://localhost:5001/api/analysis/video/${selectedClass?.id || 1}`}
                        alt="AI Preview"
                        style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', background: '#000' }}
                    />
                </div>
            )}

            {pollActive && currentPoll && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '1rem', border: '2px solid var(--accent-primary)', position: 'relative', overflow: 'hidden', minHeight: '400px' }}>
                        <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, background: 'red', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>LIVE AI FEED</div>
                        <img
                            src={`http://localhost:5001/api/analysis/video/${selectedClass?.id || 1}`}
                            alt="AI Analysis"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', background: '#000' }}
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/640x480?text=Aguardando+Servidor+IA...';
                            }}
                        />
                    </div>
                    <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-1rem' }}>
                                <button
                                    className="btn btn-ghost"
                                    style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}
                                    onClick={() => {
                                        setPollActive(false);
                                        setCountdown(0);
                                    }}
                                >
                                    Cancelar Enquete
                                </button>
                            </div>
                            <Clock size={40} style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }} />
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                {countdown}s
                            </h2>
                            <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                                Capturando respostas via visão computacional...
                            </div>
                            {currentResponsesCount > 0 && (
                                <div style={{
                                    marginTop: '1rem',
                                    display: 'inline-block',
                                    padding: '8px 16px',
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    color: '#10b981',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    border: '1px solid #10b981',
                                    animation: 'pulse 2s infinite'
                                }}>
                                    {currentResponsesCount} aluno{currentResponsesCount > 1 ? 's' : ''} já respondeu{currentResponsesCount > 1 ? 'ram' : ''} ✋
                                </div>
                            )}
                        </div>
                        <div style={{ fontSize: '1.3rem', textAlign: 'center', marginBottom: '1.5rem', fontWeight: '600' }}>
                            {currentPoll.question}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            {[1, 2, 3, 4].map(opt => (
                                <div key={opt} style={{
                                    padding: '1.5rem',
                                    background: String(currentPoll?.correct) === String(opt) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    textAlign: 'center',
                                    border: String(currentPoll?.correct) === String(opt) ? '1px solid #10b981' : '1px solid transparent'
                                }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{opt}</div>
                                    <div>{currentPoll?.[`option${opt}`] || '-'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {(pollResults || []).length > 0 && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Histórico de Enquetes</h3>
                    {pollResults.map((pr, idx) => (
                        <div key={idx} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>{pr?.question}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {(pr?.responses || []).length} respostas • {(pr?.responses || []).filter(r => r?.isCorrect).length} corretas
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SeatsTab({ students, lastSeatingChange, daysSinceLastSeating, onShuffle }) {
    const needsChange = daysSinceLastSeating === null || daysSinceLastSeating >= 15;

    return (
        <div className="fade-in">
            <div className="content-header">
                <div className="page-title">
                    <h1>Rodízio de Carteiras</h1>
                    <div className="page-subtitle">Reorganize os alunos baseado em dados científicos</div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3>Status do Rodízio</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            {lastSeatingChange ? `Última mudança: ${new Date(lastSeatingChange).toLocaleDateString('pt-BR')}` : 'Nenhuma mudança registrada'}
                        </p>
                        {needsChange && (
                            <p style={{ color: 'var(--warning)', marginTop: '0.5rem', fontWeight: 'bold' }}>
                                ⚠️ Recomendado reorganizar (já se passaram {daysSinceLastSeating || 'mais de 15'} dias)
                            </p>
                        )}
                    </div>
                    <button className="btn btn-primary" onClick={onShuffle}>
                        <Shuffle size={20} /> Reorganizar Agora
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Disposição Atual</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                    {students.map((student, idx) => (
                        <div key={student.id} className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Posição {idx + 1}</div>
                            <img src={student.img} alt={student.name} style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '0.5rem' }} />
                            <div style={{ fontSize: '0.85rem' }}>{student.name}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MessagesTab({ messages, onMarkAsRead, onRefresh, teacher }) {
    const [showCompose, setShowCompose] = useState(false);
    const [msgText, setMsgText] = useState("");
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!msgText.trim()) return;
        setSending(true);
        try {
            await api.post('/messages/send', {
                from_user_type: 'teacher',
                from_user_id: teacher.id,
                to_user_type: 'school_admin',
                to_user_id: teacher.school_id,
                message: msgText
            });
            alert('Mensagem enviada!');
            setMsgText("");
            setShowCompose(false);
            onRefresh();
        } catch (e) {
            console.error(e);
            alert('Erro ao enviar');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fade-in">
            <div className="content-header">
                <div className="page-title">
                    <h1>Mensagens</h1>
                    <div className="page-subtitle">Chat com a Coordenação</div>
                </div>

                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => setShowCompose(true)}>
                        <Send size={18} /> Nova Mensagem
                    </button>
                    <button className="btn-icon" title="Atualizar" onClick={onRefresh}>
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {showCompose && (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--accent-primary)' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Nova Mensagem para Coordenação</h3>
                    <textarea
                        className="input-field"
                        style={{ width: '100%', minHeight: '100px', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '1rem' }}
                        value={msgText}
                        onChange={e => setMsgText(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        disabled={sending}
                    />
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={() => setShowCompose(false)} disabled={sending}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
                            {sending ? 'Enviando...' : 'Enviar'}
                        </button>
                    </div>
                </div>
            )}

            {messages.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Bell size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                    <h3>Nenhuma mensagem</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Histórico vazio.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.map(message => {
                        const isMe = message.sender_type === 'teacher';
                        return (
                            <div
                                key={message.id}
                                className="glass-panel"
                                style={{
                                    padding: '1.5rem',
                                    borderLeft: isMe ? '3px solid var(--accent-secondary)' : (message.read ? '3px solid var(--text-secondary)' : '3px solid var(--accent-primary)'),
                                    background: isMe ? 'rgba(16, 185, 129, 0.05)' : (message.read ? 'rgba(255, 255, 255, 0.03)' : 'rgba(99, 102, 241, 0.1)'),
                                    marginLeft: isMe ? '2rem' : '0',
                                    marginRight: isMe ? '0' : '2rem'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: isMe ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
                                                {isMe ? 'Você' : (message.from || 'Escola / Coordenação')}
                                            </h3>
                                            {!isMe && !message.read && (
                                                <span style={{ background: 'var(--accent-primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>NOVA</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {new Date(message.created_at).toLocaleString('pt-BR')}
                                        </div>
                                    </div>
                                    {!isMe && !message.read && (
                                        <button className="btn-icon" onClick={() => onMarkAsRead(message.id)} title="Marcar como lida">
                                            <CheckCircle size={18} />
                                        </button>
                                    )}
                                </div>
                                <div style={{ lineHeight: '1.5', color: 'var(--text-primary)' }}>
                                    {message.message || message.content}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function StudentReportModal({ student, onClose, pollResults, emotions }) {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem'
            }}
            onClick={onClose}
        >
            <div
                className="glass-panel"
                style={{ maxWidth: '800px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ marginBottom: '1.5rem' }}>Relatório de {student.name}</h2>
                <div style={{ marginBottom: '1rem' }}>
                    <strong>Emoção Atual:</strong> {emotions[student.id] || 'Não detectada'}
                </div>
                <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
                    Fechar
                </button>
            </div>
        </div>
    );
}

function AcademicTab({ students, classId }) {
    const [subTab, setSubTab] = useState('grades');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [loading, setLoading] = useState(false);

    // Grade Form
    const [gradeData, setGradeData] = useState({ subject: '', value: '', term: '1º Bimestre' });

    // Report Form
    const [reportData, setReportData] = useState({ title: '', content: '' });

    const handleSaveGrade = async (e) => {
        e.preventDefault();
        if (!selectedStudentId) return alert('Selecione um aluno');
        setLoading(true);
        try {
            await api.post('/teacher/grades', {
                student_id: selectedStudentId,
                subject: gradeData.subject,
                value: gradeData.value,
                term: gradeData.term,
                class_id: classId
            });
            alert('Nota salva com sucesso!');
            setGradeData(prev => ({ ...prev, value: '' }));
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar nota.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveReport = async (e) => {
        e.preventDefault();
        if (!selectedStudentId) return alert('Selecione um aluno');
        setLoading(true);
        try {
            await api.post('/teacher/reports', {
                student_id: selectedStudentId,
                title: reportData.title,
                content: reportData.content,
                class_id: classId
            });
            alert('Relatório salvo com sucesso!');
            setReportData({ title: '', content: '' });
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar relatório.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in">
            <div className="content-header">
                <div className="page-title">
                    <h1>Acadêmico</h1>
                    <div className="page-subtitle">Lançamento de notas e relatórios</div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button
                        className={`btn ${subTab === 'grades' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setSubTab('grades')}
                    >
                        Lançar Notas
                    </button>
                    <button
                        className={`btn ${subTab === 'reports' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setSubTab('reports')}
                        style={{
                            background: subTab === 'reports' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            color: subTab === 'reports' ? 'white' : 'var(--text-secondary)'
                        }}
                    >
                        Criar Relatórios
                    </button>
                    <button
                        className={`btn ${subTab === 'exams' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setSubTab('exams')}
                        style={{
                            background: subTab === 'exams' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            color: subTab === 'exams' ? 'white' : 'var(--text-secondary)'
                        }}
                    >
                        Corrigir Provas
                    </button>
                </div>

                <div className="form-group" style={{ maxWidth: '400px', marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Selecione o Aluno</label>
                    <select
                        className="form-control"
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            borderRadius: '8px'
                        }}
                    >
                        <option value="">-- Selecione --</option>
                        {students.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {subTab === 'grades' && (
                    <form onSubmit={handleSaveGrade} style={{ maxWidth: '500px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Matéria</label>
                                <input
                                    type="text"
                                    required
                                    className="form-control"
                                    placeholder="Ex: Matemática"
                                    value={gradeData.subject}
                                    onChange={e => setGradeData({ ...gradeData, subject: e.target.value })}
                                    style={{
                                        width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Nota (0-10)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.1" max="10" min="0"
                                    className="form-control"
                                    placeholder="Ex: 8.5"
                                    value={gradeData.value}
                                    onChange={e => setGradeData({ ...gradeData, value: e.target.value })}
                                    style={{
                                        width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px'
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Bimestre/Período</label>
                            <select
                                className="form-control"
                                value={gradeData.term}
                                onChange={e => setGradeData({ ...gradeData, term: e.target.value })}
                                style={{
                                    width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px'
                                }}
                            >
                                <option>1º Bimestre</option>
                                <option>2º Bimestre</option>
                                <option>3º Bimestre</option>
                                <option>4º Bimestre</option>
                                <option>Recuperação</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px' }}>
                            {loading ? 'Salvando...' : 'Salvar Nota'}
                        </button>
                    </form>
                )}

                {subTab === 'reports' && (
                    <form onSubmit={handleSaveReport} style={{ maxWidth: '600px' }}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Título do Relatório</label>
                            <input
                                type="text"
                                required
                                className="form-control"
                                placeholder="Ex: Comportamento em aula"
                                value={reportData.title}
                                onChange={e => setReportData({ ...reportData, title: e.target.value })}
                                style={{
                                    width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Conteúdo</label>
                            <textarea
                                required
                                rows={6}
                                className="form-control"
                                placeholder="Descreva o desempenho ou comportamento do aluno..."
                                value={reportData.content}
                                onChange={e => setReportData({ ...reportData, content: e.target.value })}
                                style={{
                                    width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', resize: 'vertical'
                                }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px' }}>
                            {loading ? 'Salvando...' : 'Salvar Relatório'}
                        </button>
                    </form>
                )}

                {subTab === 'exams' && (
                    <div style={{ maxWidth: '600px', animation: 'fadeIn 0.3s ease-in-out' }}>
                        <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                                <span>🤖</span> Correção Automática com IA
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '15px' }}>
                                Envie uma foto da prova ou gabarito para correção automática e lançamento de notas.
                            </p>

                            <div style={{
                                border: '2px dashed var(--border)',
                                borderRadius: '12px',
                                padding: '40px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: 'rgba(255,255,255,0.02)',
                                transition: 'all 0.2s'
                            }}
                                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                onClick={() => alert('Simulação: Abrindo câmera/upload...')}
                            >
                                <div style={{ fontSize: '48px', marginBottom: '15px', color: 'var(--primary)' }}>📸</div>
                                <div style={{ fontWeight: '600', marginBottom: '5px', color: 'var(--text-primary)' }}>Clique para enviar a prova</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>JPG, PNG ou PDF (Máx. 5MB)</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button className="btn btn-ghost" style={{ border: '1px solid var(--border)' }} onClick={() => alert('Em breve')}>
                                Ver Histórico
                            </button>
                            <button className="btn btn-primary" onClick={() => alert('Simulação: Prova enviada para correção!\nO sistema processará as respostas.')}>
                                Iniciar Correção em Lote
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
