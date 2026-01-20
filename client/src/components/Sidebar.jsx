import { useRef, useState, useEffect } from 'react';
import { LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ menuItems, activeTab, setActiveTab, isOpen, expandedMenus, toggleMenu, onAffiliateClick }) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Scroll Indicator Logic
    const navRef = useRef(null);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const checkScroll = () => {
        if (navRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = navRef.current;
            setCanScrollDown(scrollHeight > scrollTop + clientHeight + 10);
        }
    };

    useEffect(() => {
        checkScroll();
        // Check again after a small delay to allow rendering
        const timeout = setTimeout(checkScroll, 100);
        window.addEventListener('resize', checkScroll);
        return () => {
            window.removeEventListener('resize', checkScroll);
            clearTimeout(timeout);
        };
    }, [menuItems, expandedMenus, isOpen]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleMenuClick = (item) => {
        if (item.hasSubmenu) {
            toggleMenu(item.id);
        } else {
            setActiveTab(item.id);
        }
    };

    const handleSubmenuClick = (subItem) => {
        if (subItem.isAffiliate && onAffiliateClick) {
            onAffiliateClick(subItem.affiliateId, subItem.label);
        } else {
            setActiveTab(subItem.id);
        }
    };

    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(to right, #3b82f6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    EDUFOCUS
                </h2>
            </div>

            <nav className="sidebar-nav" ref={navRef} onScroll={checkScroll}>
                {menuItems.map((item, index) => {
                    // Render Section Title
                    if (item.section) {
                        return (
                            <div key={`section-${index}`} style={{
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                color: '#818cf8', // Indigo claro para destaque
                                textTransform: 'uppercase',
                                padding: '1.25rem 0.5rem 0.25rem',
                                letterSpacing: '0.05em',
                                borderBottom: '1px solid rgba(129, 140, 248, 0.2)',
                                marginBottom: '0.5rem',
                                marginLeft: '0.25rem',
                                marginRight: '0.25rem'
                            }}>
                                {item.section}
                            </div>
                        );
                    }

                    return (
                        <div key={item.id}>
                            {/* Main Menu Item */}
                            <button
                                onClick={() => handleMenuClick(item)}
                                className={activeTab === item.id && !item.hasSubmenu ? 'menu-item-active' : 'menu-item'}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.75rem',
                                    padding: '0.65rem 0.8rem',
                                    borderRadius: '8px',
                                    background: activeTab === item.id && !item.hasSubmenu
                                        ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-hover))'
                                        : expandedMenus[item.id]
                                            ? 'rgba(59, 130, 246, 0.1)'
                                            : 'transparent',
                                    color: activeTab === item.id && !item.hasSubmenu ? 'white' : 'var(--text-secondary)',
                                    border: 'none',
                                    width: '100%',
                                    textAlign: 'left',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer',
                                    fontWeight: activeTab === item.id && !item.hasSubmenu ? '600' : '500'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {item.icon}
                                    <span>{item.label}</span>
                                </div>
                                {item.hasSubmenu && (
                                    <div style={{
                                        transition: 'transform 0.2s',
                                        transform: expandedMenus[item.id] ? 'rotate(0deg)' : 'rotate(-90deg)'
                                    }}>
                                        <ChevronDown size={16} />
                                    </div>
                                )}
                            </button>

                            {/* Submenu Items */}
                            {item.hasSubmenu && expandedMenus[item.id] && (
                                <div style={{
                                    marginTop: '0.25rem',
                                    marginBottom: '0.5rem',
                                    paddingLeft: '2.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.25rem',
                                    borderLeft: '2px solid rgba(59, 130, 246, 0.3)',
                                    marginLeft: '1rem'
                                }}>
                                    {item.submenu.map((subItem) => (
                                        <button
                                            key={subItem.id}
                                            onClick={() => handleSubmenuClick(subItem)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: subItem.isMainSchool ? '0.65rem 0.75rem' : '0.45rem 0.75rem',
                                                borderRadius: '8px',
                                                background: subItem.isMainSchool
                                                    ? 'rgba(16, 185, 129, 0.15)'
                                                    : (activeTab === subItem.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent'),
                                                color: subItem.isMainSchool
                                                    ? '#10b981'
                                                    : (activeTab === subItem.id ? '#3b82f6' : 'var(--text-secondary)'),
                                                border: subItem.isMainSchool
                                                    ? '1px solid rgba(16, 185, 129, 0.3)'
                                                    : (activeTab === subItem.id ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent'),
                                                width: '100%',
                                                textAlign: 'left',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                fontWeight: subItem.isMainSchool ? '600' : (activeTab === subItem.id ? '600' : '400'),
                                                marginBottom: subItem.isMainSchool ? '0.5rem' : '0'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!subItem.isMainSchool && activeTab !== subItem.id) {
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!subItem.isMainSchool && activeTab !== subItem.id) {
                                                    e.currentTarget.style.background = 'transparent';
                                                }
                                            }}
                                        >
                                            {!subItem.isAffiliate && (
                                                <div style={{
                                                    width: '4px',
                                                    height: '4px',
                                                    borderRadius: '50%',
                                                    background: activeTab === subItem.id ? '#3b82f6' : 'var(--text-secondary)',
                                                    transition: 'all 0.2s'
                                                }} />
                                            )}
                                            <span>{subItem.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {canScrollDown && (
                <div className="animate-bounce" style={{
                    position: 'absolute',
                    bottom: '5.5rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 20,
                    pointerEvents: 'none',
                    color: '#fff',
                    background: 'var(--accent-primary)',
                    borderRadius: '50%',
                    padding: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.9
                }}>
                    <ChevronDown size={20} />
                </div>
            )}

            <button
                onClick={handleLogout}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--danger)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    marginTop: '1rem',
                    fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
            >
                <LogOut size={20} />
                <span>Sair</span>
            </button>
        </div>
    );
}
