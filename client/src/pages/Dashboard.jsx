import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SuperAdminDashboard from './SuperAdminDashboard';
import SchoolDashboard from './SchoolDashboard';
import TeacherDashboard from './TeacherDashboard';
import RepresentativeDashboard from './RepresentativeDashboard';
import TechnicianDashboard from './TechnicianDashboard';
import InspectorDashboard from './InspectorDashboard';
import ThemeToggle from '../components/ThemeToggle';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>
            </div>
        );
    }

    if (!user) return null;

    switch (user.role) {
        case 'super_admin':
            return <><SuperAdminDashboard /><ThemeToggle /></>;
        case 'school_admin':
            return <><SchoolDashboard /><ThemeToggle /></>;
        case 'teacher':
            return <><TeacherDashboard /><ThemeToggle /></>;
        case 'representative':
            return <><RepresentativeDashboard /><ThemeToggle /></>;
        case 'technician':
            return <><TechnicianDashboard /><ThemeToggle /></>;
        case 'inspector':
            return <><InspectorDashboard /><ThemeToggle /></>;
        default:
            return <div>Unauthorized</div>;
    }
}
