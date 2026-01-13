import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { MapPin, UserPlus, ShieldCheck, Trash2, Crosshair, Save } from 'lucide-react';

export default function SchoolPickupsManager() {
    // Campos visuais (iniciam vazios para edição)
    const [form, setForm] = useState({
        address: '',
        number: '',
        zip_code: '',
        latitude: '',
        longitude: ''
    });

    const [currentLocation, setCurrentLocation] = useState(null);
    const [loadingGPS, setLoadingGPS] = useState(false);

    // Inspetores
    const [inspectors, setInspectors] = useState([]);
    const [showAddInspector, setShowAddInspector] = useState(false);
    const [newInspector, setNewInspector] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const sRes = await api.get('/school/settings');
            // Salva dados atuais para mostrar no card de status, mas não preenche o form
            if (sRes.data.latitude) {
                setCurrentLocation(sRes.data);
            }
            const iRes = await api.get('/school/inspectors');
            setInspectors(iRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    // --- SALVAR ENDEREÇO E OBTER GPS AUTOMATICAMENTE ---
    const handleSave = async () => {
        if (!form.address || !form.number || !form.zip_code) {
            return toast.error("Por favor, preencha todos os campos do endereço.");
        }

        const toastId = toast.loading("Buscando coordenadas e salvando...");

        let lat = form.latitude;
        let lon = form.longitude;

        // Sempre tenta atualizar coordenadas baseado no endereço escrito para garantir precisão
        try {
            const query = `${form.address}, ${form.number}, ${form.zip_code}`;
            // Usa Nominatim para obter Lat/Lon a partir do texto
            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await resp.json();

            if (data && data.length > 0) {
                lat = parseFloat(data[0].lat);
                lon = parseFloat(data[0].lon);
                console.log("📍 Coordenadas encontradas:", lat, lon);
            } else {
                // Tenta só Rua e CEP se falhar número
                const query2 = `${form.address}, ${form.zip_code}`;
                const resp2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query2)}&limit=1`);
                const data2 = await resp2.json();
                if (data2 && data2.length > 0) {
                    lat = parseFloat(data2[0].lat);
                    lon = parseFloat(data2[0].lon);
                }
            }
        } catch (e) {
            console.warn("Erro no Geocoding:", e);
        }

        const payload = { ...form, latitude: lat, longitude: lon };

        try {
            await api.post('/school/settings', payload);
            toast.success("✅ Endereço atualizado com sucesso!", { id: toastId });
            setCurrentLocation(payload);
            setForm(prev => ({ ...prev, latitude: lat, longitude: lon }));
        } catch (err) {
            console.error(err);
            toast.error("Erro ao salvar endereço.", { id: toastId });
        }
    };

    // --- INSPETORES (MANTIDO IGUAL) ---
    const handleCreateInspector = async (e) => {
        e.preventDefault();
        try {
            await api.post('/school/inspectors', newInspector);
            toast.success('Inspetor criado!');
            setNewInspector({ name: '', email: '', password: '' });
            setShowAddInspector(false);
            loadData();
        } catch (err) { toast.error('Erro ao criar conta'); }
    };
    const handleDeleteInspector = async (id, name) => {
        if (confirm(`Excluir ${name}?`)) {
            try {
                await api.delete(`/school/inspectors/${id}`);
                loadData();
                toast.success('Excluído.');
            } catch (e) { toast.error('Erro ao excluir'); }
        }
    };

    return (
        <div className="fade-in">
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>🎯 Gestão de Portaria</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* PAINEL DE ENDEREÇO */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
                            <MapPin size={24} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Localização da Escola</h3>
                    </div>

                    <div className="mb-6">
                        <label className="text-sm text-gray-400 block mb-1">Rua / Avenida</label>
                        <input
                            className="input-field w-full"
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                            placeholder="Ex: Av. Paulista"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Número</label>
                            <input
                                className="input-field w-full"
                                value={form.number}
                                onChange={e => setForm({ ...form, number: e.target.value })}
                                placeholder="123"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">CEP</label>
                            <input
                                className="input-field w-full"
                                value={form.zip_code}
                                onChange={e => setForm({ ...form, zip_code: e.target.value })}
                                placeholder="00000-000"
                            />
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 mb-6 text-sm text-gray-400">
                        <p>ℹ️ O sistema tentará localizar as coordenadas GPS automaticamente baseando-se no endereço acima para habilitar o raio de detecção dos pais.</p>
                        {(form.latitude || currentLocation?.latitude) && (
                            <div className="mt-2 text-green-400 text-xs">
                                <span className="flex items-center gap-1">📍 Coordenadas detectadas: {Number(form.latitude || currentLocation.latitude).toFixed(4)}, {Number(form.longitude || currentLocation.longitude).toFixed(4)}</span>
                            </div>
                        )}
                    </div>

                    <button onClick={handleSave} className="btn btn-primary w-full py-3 text-lg shadow-xl">
                        <Save size={20} className="inline mr-2" />
                        Salvar Endereço
                    </button>
                </div>

                {/* INSPETORES */}
                {/* INSPETORES */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500"><ShieldCheck size={24} /></div>
                            <h3 className="text-xl font-semibold">Inspetores</h3>
                        </div>
                        <button className="btn btn-primary px-4 py-2 flex items-center gap-2" onClick={() => setShowAddInspector(true)}>
                            <UserPlus size={18} />
                            <span>Adicionar</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-gray-400 text-sm">
                                    <th className="p-3 font-semibold">Nome</th>
                                    <th className="p-3 font-semibold">Email</th>
                                    <th className="p-3 font-semibold text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inspectors.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-4 text-center text-gray-500">
                                            Nenhum inspetor cadastrado.
                                        </td>
                                    </tr>
                                ) : (
                                    inspectors.map(insp => (
                                        <tr key={insp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-3 font-medium text-white">{insp.name}</td>
                                            <td className="p-3 text-gray-300">{insp.email}</td>
                                            <td className="p-3 text-right">
                                                <button
                                                    onClick={() => handleDeleteInspector(insp.id, insp.name)}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded transition-colors"
                                                    title="Excluir Inspetor"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Inspetor */}
            {showAddInspector && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="glass-panel w-full max-w-md p-8 animate-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-6 text-center">Novo Inspetor</h3>
                        <form onSubmit={handleCreateInspector} className="space-y-4">
                            <input className="input-field w-full" placeholder="Nome" value={newInspector.name} onChange={e => setNewInspector({ ...newInspector, name: e.target.value })} required />
                            <input className="input-field w-full" type="email" placeholder="Email" value={newInspector.email} onChange={e => setNewInspector({ ...newInspector, email: e.target.value })} required />
                            <input className="input-field w-full" type="password" placeholder="Senha" value={newInspector.password} onChange={e => setNewInspector({ ...newInspector, password: e.target.value })} required />
                            <div className="flex gap-3 pt-2">
                                <button type="button" className="btn flex-1 bg-white/10 hover:bg-white/20" onClick={() => setShowAddInspector(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary flex-1">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
