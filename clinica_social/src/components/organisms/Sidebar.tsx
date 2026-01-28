import React from 'react';
import { User, Role } from '../../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, user, onLogout }) => {
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', roles: [Role.ADMIN, Role.STAFF, Role.VOLUNTEER] },
    { id: 'patients', label: 'Pacientes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', roles: [Role.ADMIN, Role.STAFF] },
    { id: 'volunteers', label: 'Voluntários', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', roles: [Role.ADMIN] },
    { id: 'appointments', label: 'Consultas', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', roles: [Role.ADMIN, Role.STAFF, Role.VOLUNTEER] },
    { id: 'financial', label: 'Financeiro', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', roles: [Role.ADMIN, Role.STAFF] },
    { id: 'reports', label: 'Relatórios', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', roles: [Role.ADMIN, Role.STAFF] },
    { id: 'settings', label: 'Configurações', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', roles: [Role.ADMIN] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="w-64 bg-primary text-white min-h-screen p-4 flex flex-col fixed left-0 top-0 z-40 shadow-xl">
      <div className="flex flex-col items-center gap-3 mb-10 px-2 mt-6">
        <div className="bg-white/90 p-3 rounded-2xl shadow-lg w-full flex justify-center">
          <img src="/logo_cuidar.png" alt="Clínica Cuidar" className="h-20 object-contain" />
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${currentView === item.id
              ? 'bg-secondary text-primary shadow-lg border-l-4 border-white'
              : 'text-white/80 hover:bg-white/10 hover:translate-x-1'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 px-4 border-t border-white/20 pb-4">
        <div className="flex flex-col mb-4">
          <p className="text-xs text-secondary uppercase font-bold tracking-widest">{user.role}</p>
          <p className="text-sm font-semibold truncate">{user.name}</p>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-red-500/10 hover:bg-500/20 text-red-200 rounded-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sair da Conta
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
