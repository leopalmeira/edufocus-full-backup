import { useState, useEffect } from 'react';
import { Camera, DollarSign, MessageSquare, Menu, School, DoorOpen, CheckCircle, XCircle, Search, Target, Info, Plus, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function TechnicianDashboard() {
    const [activeTab, setActiveTab] = useState('cameras');
    const [showCameraForm, setShowCameraForm] = useState(false);
    const [showClassroomModal, setShowClassroomModal] = useState(false);
    const [schools, setSchools] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [cameras, setCameras] = useState([]);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [searchSchool, setSearchSchool] = useState('');

    const [classroomForm, setClassroomForm] = useState({
        name: '',
        capacity: '30'
    });

    const [cameraForm, setCameraForm] = useState({
        school_id: '',
        classroom_id: '', // Deprecated - manter para compatibilidade
        assigned_classes: [], // NOVO: Array de IDs de turmas
        camera_name: '',
        camera_type: 'IP',
        camera_purpose: 'classroom', // NOVO: 'entrance' ou 'classroom'
        camera_ip: '',
        camera_url: '',
        camera_port: '80',
        camera_username: '',
        camera_password: '',
        notes: ''
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({});

    const toggleMenu = (menuId) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuId]: !prev[menuId]
        }));
    };

    useEffect(() => {
        document.body.classList.add('force-landscape');
        loadSchools();
        loadCameras(); // Carregamento inicial

        // Polling para atualizar status das câmeras (IA, Conexão) a cada 10 segundos
        const interval = setInterval(() => {
            loadCameras();
        }, 10000);

        return () => {
            document.body.classList.remove('force-landscape');
            clearInterval(interval);
        };
    }, []);

    // Carregar salas quando escola selecionada
    useEffect(() => {
        if (cameraForm.school_id) {
            loadClassrooms(cameraForm.school_id);
        }
    }, [cameraForm.school_id]);

    const menuItems = [
        { id: 'cameras', label: 'Câmeras', icon: <Camera size={20} /> },
        { id: 'billing', label: 'Faturamento', icon: <DollarSign size={20} /> },
        { id: 'support', label: 'Suporte', icon: <MessageSquare size={20} /> }
    ];

    const loadSchools = async () => {
        console.log('═══════════════════════════════════════');
        console.log('CARREGANDO ESCOLAS...');
        console.log('URL Base do Axios:', api.defaults.baseURL);

        try {
            console.log('Fazendo requisição para: /technician/schools');
            const res = await api.get('/technician/schools');

            console.log('✅ Resposta recebida!');
            console.log('Status:', res.status);
            console.log('Dados:', res.data);
            console.log('Total de escolas:', res.data?.length || 0);

            setSchools(res.data || []);
            console.log('✅ Escolas setadas no state');
            console.log('═══════════════════════════════════════');
        } catch (err) {
            console.error('❌❌❌ ERRO AO CARREGAR ESCOLAS ❌❌❌');
            console.error('Mensagem:', err.message);
            console.error('Response:', err.response);
            console.error('Request:', err.request);
            console.error('═══════════════════════════════════════');
            setSchools([]);
        }
    };

    const loadClassrooms = async (schoolId) => {
        try {
            console.log('🔍 Carregando turmas da escola:', schoolId);
            const res = await api.get(`/technician/schools/${schoolId}/classrooms`);
            console.log('✅ Turmas carregadas:', res.data);
            setClassrooms(res.data);
        } catch (err) {
            console.error('❌ Erro ao carregar turmas:', err);
            console.error('Status:', err.response?.status);
            console.error('Mensagem:', err.response?.data);
            alert(`❌ Erro ao carregar turmas: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleCreateClassroom = async (e) => {
        e.preventDefault();

        if (!cameraForm.school_id) {
            alert('⚠️ Selecione uma escola primeiro');
            return;
        }

        try {
            const res = await api.post(`/technician/schools/${cameraForm.school_id}/classrooms`, classroomForm);
            alert('✅ Turma criada com sucesso!');

            // Recarregar turmas
            await loadClassrooms(cameraForm.school_id);

            // Limpar formulário e fechar modal
            setClassroomForm({ name: '', capacity: '30' });
            setShowClassroomModal(false);
        } catch (err) {
            console.error('Erro ao criar turma:', err);
            alert(`❌ ${err.response?.data?.message || 'Erro ao criar turma'}`);
        }
    };

    const loadCameras = async () => {
        try {
            console.log('🔍 Carregando câmeras...');
            const res = await api.get('/technician/cameras');
            console.log('✅ Câmeras carregadas:', res.data);
            setCameras(res.data);
        } catch (err) {
            console.error('❌ Erro ao carregar câmeras:', err);
            console.error('Status:', err.response?.status);
            console.error('Mensagem:', err.response?.data);
            // Não mostrar alert para câmeras vazias (é normal no início)
        }
    };

    const testConnection = async () => {
        if (!cameraForm.camera_url) {
            alert('⚠️ Preencha a URL da câmera primeiro');
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const res = await api.post('/technician/cameras/test', {
                camera_url: cameraForm.camera_url,
                camera_type: cameraForm.camera_type
            });
            setTestResult({ success: true, message: res.data.message });
        } catch (err) {
            setTestResult({
                success: false,
                message: err.response?.data?.message || 'Erro ao testar conexão'
            });
        } finally {
            setTesting(false);
        }
    };

    const handleAddCamera = async (e) => {
        e.preventDefault();

        // Validação condicional
        if (!cameraForm.school_id) {
            alert('⚠️ Selecione a escola');
            return;
        }

        if (cameraForm.camera_purpose === 'classroom' && (!cameraForm.assigned_classes || cameraForm.assigned_classes.length === 0)) {
            alert('⚠️ Câmeras de sala de aula precisam de turmas vinculadas');
            return;
        }

        try {
            await api.post('/technician/cameras', cameraForm);
            alert('✅ Câmera cadastrada com sucesso!');
            setCameraForm({
                school_id: '',
                classroom_id: '',
                assigned_classes: [],
                camera_name: '',
                camera_type: 'IP',
                camera_purpose: 'classroom',
                camera_ip: '',
                camera_url: '',
                camera_port: '80',
                camera_username: '',
                camera_password: '',
                notes: ''
            });
            setShowCameraForm(false);
            setTestResult(null);
            loadCameras();
        } catch (err) {
            console.error('Erro ao cadastrar câmera:', err);
            alert('❌ Erro ao cadastrar câmera');
        }
    };

    const requestCameraRemoval = async (id) => {
        const reason = prompt('📝 Motivo da remoção:\n(Esta solicitação será enviada para aprovação do Super Admin)');

        if (!reason || reason.trim() === '') {
            alert('⚠️ É necessário informar um motivo para a remoção');
            return;
        }

        if (!confirm('Confirma o envio da solicitação de remoção?')) {
            return;
        }

        try {
            await api.post(`/api/technician/cameras/${id}/request-removal`, { reason });
            alert('✅ Solicitação enviada com sucesso!\nAguarde a aprovação do Super Admin.');
        } catch (err) {
            console.error('Erro ao solicitar remoção:', err);
            alert(`❌ ${err.response?.data?.message || 'Erro ao solicitar remoção'}`);
        }
    };

    const calculateEarnings = () => {
        const installations = [
            { school: 'Escola Centro', cameras: 3, value: 250 },
            { school: 'Colégio Norte', cameras: 4, value: 310 },
            { school: 'Instituto Sul', cameras: 5, value: 380 }
        ];

        return installations;
    };

    const installations = calculateEarnings();
    const totalEarnings = installations.reduce((sum, inst) => sum + inst.value, 0);

    // Filtrar escolas pela busca
    const filteredSchools = schools.filter(school =>
        school.name?.toLowerCase().includes(searchSchool.toLowerCase()) ||
        school.admin_name?.toLowerCase().includes(searchSchool.toLowerCase()) ||
        school.address?.toLowerCase().includes(searchSchool.toLowerCase())
    );

    return (
        <div className="dashboard-layout">
            <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu size={24} />
            </button>
            <div className={`sidebar-backdrop ${mobileMenuOpen ? 'visible' : ''}`} onClick={() => setMobileMenuOpen(false)} />

            <Sidebar
                menuItems={menuItems}
                activeTab={activeTab}
                setActiveTab={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }}
                isOpen={mobileMenuOpen}
                expandedMenus={expandedMenus}
                toggleMenu={toggleMenu}
            />

            <div className="main-content">
                {activeTab === 'cameras' && (
                    <div className="fade-in">
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>
                            📹 Gerenciar Câmeras
                        </h1>

                        {/* Busca de Escola - Sempre Visível */}
                        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Search size={20} />
                                Buscar Escola
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Digite o nome da escola ou cidade para filtrar..."
                                        value={searchSchool}
                                        onChange={(e) => setSearchSchool(e.target.value)}
                                        style={{ fontSize: '1rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                        <School size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                        Escola Selecionada
                                    </label>
                                    <select
                                        className="input-field"
                                        value={cameraForm.school_id}
                                        onChange={(e) => {
                                            setCameraForm({ ...cameraForm, school_id: e.target.value, assigned_classes: [] });
                                            if (e.target.value) {
                                                loadClassrooms(e.target.value);
                                            }
                                        }}
                                    >
                                        <option value="">Selecione uma escola</option>
                                        {filteredSchools.map(school => (
                                            <option key={school.id} value={school.id}>
                                                {school.name} - {school.city}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'end' }}>
                                    <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', width: '100%' }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            <strong>{filteredSchools.length}</strong> escola(s) encontrada(s)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Formulário de Cadastro */}
                        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Camera size={24} />
                                {showCameraForm ? 'Nova Câmera' : 'Cadastrar Nova Câmera'}
                            </h3>

                            {!showCameraForm ? (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowCameraForm(true)}
                                    style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                                >
                                    ➕ Adicionar Câmera
                                </button>
                            ) : (
                                <form onSubmit={handleAddCamera}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        {/* Escola já selecionada acima - mostrar apenas info */}
                                        {cameraForm.school_id && (
                                            <div style={{ gridColumn: '1 / -1', padding: '1rem', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '8px', border: '1px solid rgba(46, 204, 113, 0.3)' }}>
                                                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                                                    <CheckCircle size={18} />
                                                    Escola selecionada: <strong>{schools.find(s => s.id == cameraForm.school_id)?.name}</strong>
                                                </p>
                                            </div>
                                        )}

                                        {!cameraForm.school_id && (
                                            <div style={{ gridColumn: '1 / -1', padding: '1rem', background: 'rgba(241, 196, 15, 0.1)', borderRadius: '8px', border: '1px solid rgba(241, 196, 15, 0.3)' }}>
                                                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f1c40f' }}>
                                                    <Info size={18} />
                                                    Selecione uma escola acima para continuar
                                                </p>
                                            </div>
                                        )}

                                        {/* Finalidade da Câmera */}
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                <Target size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                                Finalidade da Câmera *
                                            </label>
                                            <select
                                                className="input-field"
                                                value={cameraForm.camera_purpose}
                                                onChange={(e) => setCameraForm({ ...cameraForm, camera_purpose: e.target.value, assigned_classes: [] })}
                                                required
                                            >
                                                <option value="classroom">📚 Sala de Aula (Monitoramento)</option>
                                                <option value="entrance">🚪 Entrada (Reconhecimento Facial - Alunos)</option>
                                                <option value="employee">👤 Ponto Biométrico (Funcionários)</option>
                                            </select>
                                        </div>

                                        {/* Turmas - Apenas para Sala de Aula */}
                                        {cameraForm.camera_purpose === 'classroom' && (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                    <DoorOpen size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                                    Turmas * (Pode selecionar múltiplas)
                                                </label>
                                                {classrooms.length > 0 ? (
                                                    <>
                                                        <div style={{ marginBottom: '0.5rem', padding: '0.5rem', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '6px' }}>
                                                            <span style={{ color: 'var(--success)', fontSize: '0.875rem' }}>
                                                                ✅ {classrooms.length} turma(s) disponível(is) nesta escola
                                                            </span>
                                                        </div>
                                                        <div className="custom-scrollbar" style={{
                                                            maxHeight: '200px',
                                                            overflowY: 'auto',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            borderRadius: '8px',
                                                            padding: '0.5rem',
                                                            background: 'rgba(0, 0, 0, 0.2)'
                                                        }}>
                                                            {classrooms.map(classroom => (
                                                                <label
                                                                    key={classroom.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        padding: '0.75rem',
                                                                        cursor: 'pointer',
                                                                        gap: '0.75rem',
                                                                        borderRadius: '6px',
                                                                        transition: 'background 0.2s',
                                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={cameraForm.assigned_classes.some(id => String(id) === String(classroom.id))}
                                                                        onChange={(e) => {
                                                                            const id = String(classroom.id);
                                                                            let newSelected;
                                                                            if (e.target.checked) {
                                                                                newSelected = [...cameraForm.assigned_classes, id];
                                                                            } else {
                                                                                newSelected = cameraForm.assigned_classes.filter(item => String(item) !== id);
                                                                            }
                                                                            setCameraForm({ ...cameraForm, assigned_classes: newSelected });
                                                                        }}
                                                                        style={{
                                                                            width: '18px',
                                                                            height: '18px',
                                                                            cursor: 'pointer',
                                                                            accentColor: 'var(--primary)'
                                                                        }}
                                                                    />
                                                                    <span style={{ fontSize: '0.95rem' }}>
                                                                        {classroom.name}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ padding: '1rem', background: 'rgba(241, 196, 15, 0.1)', borderRadius: '8px', border: '1px solid rgba(241, 196, 15, 0.3)' }}>
                                                        <p style={{ margin: 0, color: '#f1c40f', fontSize: '0.875rem' }}>
                                                            ⚠️ Esta escola ainda não possui turmas cadastradas.
                                                            <br />A escola precisa criar turmas primeiro no painel dela.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Mensagem para Câmera de Entrada */}
                                        {cameraForm.camera_purpose === 'entrance' && (
                                            <div style={{ gridColumn: '1 / -1', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
                                                    <Info size={18} />
                                                    Esta câmera será usada para reconhecimento facial de ALUNOS na entrada da escola.
                                                    Ficará online 24/7 e enviará notificações WhatsApp quando alunos forem detectados.
                                                </p>
                                            </div>
                                        )}

                                        {/* Mensagem para Ponto Biométrico */}
                                        {cameraForm.camera_purpose === 'employee' && (
                                            <div style={{ gridColumn: '1 / -1', padding: '1rem', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '8px', border: '1px solid rgba(46, 204, 113, 0.3)' }}>
                                                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                                                    <Info size={18} />
                                                    Esta câmera será usada para ponto biométrico de FUNCIONÁRIOS.
                                                    Registrará entrada e saída dos funcionários automaticamente via reconhecimento facial.
                                                </p>
                                            </div>
                                        )}

                                        {/* Nome da Câmera */}
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                Nome da Câmera *
                                            </label>
                                            <input
                                                className="input-field"
                                                placeholder="Ex: Câmera Sala 1A"
                                                value={cameraForm.camera_name}
                                                onChange={(e) => setCameraForm({ ...cameraForm, camera_name: e.target.value })}
                                                required
                                            />
                                        </div>

                                        {/* Tipo */}
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                Tipo de Câmera
                                            </label>
                                            <select
                                                className="input-field"
                                                value={cameraForm.camera_type}
                                                onChange={(e) => setCameraForm({ ...cameraForm, camera_type: e.target.value })}
                                            >
                                                <option value="IP">IP Camera (HTTP/HTTPS)</option>
                                                <option value="RTSP">RTSP Stream</option>
                                                <option value="HTTP">HTTP MJPEG</option>
                                            </select>
                                        </div>

                                        {/* IP */}
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                IP da Câmera
                                            </label>
                                            <input
                                                className="input-field"
                                                placeholder="192.168.1.100"
                                                value={cameraForm.camera_ip}
                                                onChange={(e) => setCameraForm({ ...cameraForm, camera_ip: e.target.value })}
                                            />
                                        </div>

                                        {/* Porta */}
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                Porta
                                            </label>
                                            <input
                                                className="input-field"
                                                type="number"
                                                placeholder="80"
                                                value={cameraForm.camera_port}
                                                onChange={(e) => setCameraForm({ ...cameraForm, camera_port: e.target.value })}
                                            />
                                        </div>

                                        {/* URL */}
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                URL Completa *
                                            </label>
                                            <input
                                                className="input-field"
                                                placeholder="http://192.168.1.100:80/video ou rtsp://192.168.1.100:554/stream"
                                                value={cameraForm.camera_url}
                                                onChange={(e) => setCameraForm({ ...cameraForm, camera_url: e.target.value })}
                                                required
                                            />
                                        </div>

                                        {/* Usuário */}
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                Usuário
                                            </label>
                                            <input
                                                className="input-field"
                                                placeholder="admin"
                                                value={cameraForm.camera_username}
                                                onChange={(e) => setCameraForm({ ...cameraForm, camera_username: e.target.value })}
                                            />
                                        </div>

                                        {/* Senha */}
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                Senha
                                            </label>
                                            <input
                                                className="input-field"
                                                type="password"
                                                placeholder="••••••"
                                                value={cameraForm.camera_password}
                                                onChange={(e) => setCameraForm({ ...cameraForm, camera_password: e.target.value })}
                                            />
                                        </div>

                                        {/* Observações */}
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                Observações
                                            </label>
                                            <textarea
                                                className="input-field"
                                                rows="3"
                                                placeholder="Informações adicionais sobre a câmera..."
                                                value={cameraForm.notes}
                                                onChange={(e) => setCameraForm({ ...cameraForm, notes: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Resultado do Teste */}
                                    {testResult && (
                                        <div style={{
                                            marginBottom: '1rem',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            background: testResult.success ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                                            border: `1px solid ${testResult.success ? 'var(--success)' : 'var(--danger)'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            {testResult.success ? <CheckCircle size={20} color="var(--success)" /> : <XCircle size={20} color="var(--danger)" />}
                                            {testResult.message}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            type="button"
                                            className="btn"
                                            style={{ background: 'var(--bg-secondary)' }}
                                            onClick={testConnection}
                                            disabled={testing || !cameraForm.camera_url}
                                        >
                                            {testing ? 'Testando...' : '🔍 Testar Conexão'}
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            💾 Cadastrar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn"
                                            style={{ background: 'var(--bg-secondary)' }}
                                            onClick={() => {
                                                setShowCameraForm(false);
                                                setTestResult(null);
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Lista de Câmeras */}
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                            Câmeras Cadastradas ({cameras.length})
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {cameras.map(camera => (
                                <div key={camera.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {camera.camera_purpose === 'entrance' ? '🚪' : '📚'} {camera.camera_name}
                                            </h3>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                                <div>
                                                    <strong>Finalidade:</strong> {camera.camera_purpose === 'entrance' ? 'Entrada (Reconhecimento Facial)' : 'Sala de Aula (Monitoramento)'}
                                                </div>
                                                {camera.camera_purpose === 'classroom' && (
                                                    <div><strong>Turmas:</strong> {camera.classroom_names || 'N/A'}</div>
                                                )}
                                                <div><strong>IP:</strong> {camera.camera_ip || 'N/A'}</div>
                                                <div><strong>Escola:</strong> {camera.school_name}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: camera.status === 'active' ? 'var(--success)' : 'var(--danger)' }}></div>
                                                <span style={{ color: camera.status === 'active' ? 'var(--success)' : 'var(--danger)', fontSize: '0.875rem', fontWeight: '600' }}>
                                                    {camera.status === 'active' ? 'Conexão Online' : 'Conexão Offline'}
                                                </span>
                                            </div>

                                            {/* Status Monitoramento IA Server-Side */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: camera.monitoring_status === 'active' ? '#3b82f6' : '#64748b' }}></div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: camera.monitoring_status === 'active' ? '#3b82f6' : 'var(--text-secondary)' }}>
                                                    {camera.monitoring_status === 'active' ? '👁️ IA Monitorando Rostos' : '👁️ IA Inativa'}
                                                </span>
                                            </div>

                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                🛠️ Instalado por: {camera.technician_name || 'Desconhecido'}
                                            </div>
                                            <button
                                                className="btn"
                                                style={{ background: 'var(--danger)', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                onClick={() => requestCameraRemoval(camera.id)}
                                            >
                                                📝 Solicitar Remoção
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {cameras.length === 0 && (
                                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                                    <Camera size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.5 }} />
                                    <h3 style={{ marginBottom: '0.5rem' }}>Nenhuma câmera configurada</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                        Clique em "Adicionar Câmera" para começar.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'billing' && (
                    <div className="fade-in">
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>Faturamento</h1>

                        <div className="glass-panel stat-card" style={{ marginBottom: '2rem', maxWidth: '400px' }}>
                            <div className="stat-label">Total a Receber Este Mês</div>
                            <div className="stat-value">R$ {totalEarnings.toLocaleString('pt-BR')}</div>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Tabela de Valores</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                <div style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>3</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Câmeras</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--success)' }}>R$ 250</div>
                                </div>

                                <div style={{ padding: '1.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>4</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Câmeras</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--success)' }}>R$ 310</div>
                                </div>

                                <div style={{ padding: '1.5rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '12px', border: '1px solid rgba(236, 72, 153, 0.3)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ec4899', marginBottom: '0.5rem' }}>5</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Câmeras</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--success)' }}>R$ 380</div>
                                </div>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '1rem', textAlign: 'center' }}>
                                * Valores podem ser ajustados pelo Super Admin
                            </p>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Instalações Realizadas</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {installations.map((inst, index) => (
                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{inst.school}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{inst.cameras} câmeras instaladas</div>
                                        </div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--success)' }}>
                                            R$ {inst.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'support' && (
                    <div className="fade-in">
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>Suporte ao Sistema</h1>

                        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Contato Direto</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                Para questões urgentes, entre em contato diretamente via WhatsApp:
                            </p>
                            <a
                                href="https://wa.me/5521995879170"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                                style={{ display: 'inline-flex' }}
                            >
                                <MessageSquare size={20} />
                                Abrir WhatsApp
                            </a>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Abrir Ticket de Suporte</h3>
                            <textarea
                                className="input-field"
                                rows="5"
                                placeholder="Descreva o problema técnico ou dúvida..."
                                style={{ resize: 'vertical', marginBottom: '1rem' }}
                            ></textarea>
                            <button className="btn btn-primary">Enviar Ticket</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Criação de Turma */}
            {showClassroomModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="glass-panel" style={{
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '90%',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => {
                                setShowClassroomModal(false);
                                setClassroomForm({ name: '', capacity: '30' });
                            }}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '0.5rem'
                            }}
                        >
                            <X size={24} />
                        </button>

                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <DoorOpen size={24} />
                            Nova Turma
                        </h3>

                        <form onSubmit={handleCreateClassroom}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    Nome da Turma *
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Ex: 501A, 6º Ano B, Turma Alfa"
                                    value={classroomForm.name}
                                    onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                                    Use um nome único e descritivo
                                </small>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    Capacidade (Número de Alunos) *
                                </label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="30"
                                    min="1"
                                    max="100"
                                    value={classroomForm.capacity}
                                    onChange={(e) => setClassroomForm({ ...classroomForm, capacity: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    ✅ Criar Turma
                                </button>
                                <button
                                    type="button"
                                    className="btn"
                                    style={{ background: 'var(--bg-secondary)', flex: 1 }}
                                    onClick={() => {
                                        setShowClassroomModal(false);
                                        setClassroomForm({ name: '', capacity: '30' });
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
