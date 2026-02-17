
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
import { MOCK_PATIENTS, MOCK_VOLUNTEERS, MOCK_APPOINTMENTS } from '../constants';
import { Patient, Volunteer, Appointment, User, Role } from '../types';
import { api } from '../services/api';

const AdminApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [volunteers, setVolunteers] = useState<Volunteer[]>(MOCK_VOLUNTEERS);
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, v, a] = await Promise.all([
          api.getPatients(),
          api.getVolunteers(),
          api.getAppointments()
        ]);
        setPatients(p);
        setVolunteers(v);
        setAppointments(a);
      } catch (error) {
        console.error('Falha ao carregar dados:', error);
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
        return <AdminSettings currentUser={user} />;
      default:
        return <Dashboard patients={patients} volunteers={volunteers} appointments={filteredAppointments} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-1 ml-64 p-10 animate-in fade-in duration-500">
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default AdminApp;
