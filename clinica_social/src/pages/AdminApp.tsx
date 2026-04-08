import React, { useState, useEffect } from 'react';
import Sidebar from '../components/organisms/Sidebar';
import Dashboard from './Dashboard';
import PatientManagement from './PatientManagement';
import VolunteerManagement from './VolunteerManagement';
import AppointmentManagement from './AppointmentManagement';
import AdminSettings from './AdminSettings';
import FinancialManagement from './FinancialManagement';
import Reports from './Reports';
import LoginView from './LoginView';
import { Patient, Volunteer, Appointment, User, Role } from '../types';
import { api } from '../services/api';
import './AdminApp.css';

const AdminApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const p = await api.getPatients().catch(e => { console.error(e); return []; });
        const v = await api.getVolunteers().catch(e => { console.error(e); return []; });
        const a = await api.getAppointments().catch(e => { console.error(e); return []; });

        setPatients(p);
        setVolunteers(v);
        setAppointments(a);
      } catch (error) {
        console.error('Falha ao carregar dados inesperada:', error);
      }
    };
    loadData();

    const savedUser = localStorage.getItem('clinic_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('clinic_user', JSON.stringify(userData));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('clinic_user');
  };

  const handleAddPatient = (p: Patient) => setPatients([...patients, p]);
  const handleAddVolunteer = (v: Volunteer) => setVolunteers([...volunteers, v]);
  const handleAddAppointment = (a: Appointment) => setAppointments([...appointments, a]);

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderView = () => {
    // Basic filter for volunteer role to only see their own appointments or general stats
    const filteredAppointments = user.role === Role.VOLUNTEER && user.volunteerId
      ? appointments.filter(a => a.volunteerId === user.volunteerId)
      : appointments;

    switch (currentView) {
      case 'dashboard':
        return <Dashboard patients={patients} volunteers={volunteers} appointments={filteredAppointments} />;
      case 'patients':
        return <PatientManagement patients={patients} onAddPatient={handleAddPatient} />;
      case 'volunteers':
        return (
          <VolunteerManagement
            volunteers={volunteers}
            onAddVolunteer={handleAddVolunteer}
            onUpdateVolunteer={(updated: Volunteer) => setVolunteers(volunteers.map(v => v.id === updated.id ? updated : v))}
            onDeleteVolunteer={(id: string) => setVolunteers(volunteers.filter(v => v.id !== id))}
          />
        );
      case 'appointments':
        return (
          <AppointmentManagement
            appointments={filteredAppointments}
            patients={patients}
            volunteers={volunteers}
            onAddAppointment={handleAddAppointment}
            onUpdateAppointment={(updated) => setAppointments(appointments.map(a => a.id === updated.id ? updated : a))}
            onDeleteAppointment={(id) => setAppointments(appointments.filter(a => a.id !== id))}
          />
        );
      case 'financial':
        return <FinancialManagement />;
      case 'reports':
        return <Reports patients={patients} volunteers={volunteers} appointments={appointments} currentUser={user || undefined} />;
      case 'settings':
        return <AdminSettings
          currentUser={user}
          onUpdateCurrentUser={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem('clinic_user', JSON.stringify(updatedUser));
          }}
        />;
      default:
        return <Dashboard patients={patients} volunteers={volunteers} appointments={filteredAppointments} />;
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <div className="admin-main">
        <header className="mobile-header">
          <div className="mobile-header-content">
             <button onClick={() => setIsSidebarOpen(true)} className="hamburger-btn">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
             </button>
             <h1 className="mobile-title">Clínica Cuidar</h1>
          </div>
        </header>

        <main className="admin-content">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default AdminApp;
