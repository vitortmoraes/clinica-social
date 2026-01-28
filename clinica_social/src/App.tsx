
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AttendanceScreen from './pages/AttendanceScreen';
import MedicalRecordPrint from './pages/MedicalRecordPrint';
import PrescriptionPrint from './pages/PrescriptionPrint';
import ReceiptPrint from './pages/ReceiptPrint';
import MealPlanEditor from './pages/MealPlanEditor';
import MealPlanPrint from './pages/MealPlanPrint';
import AdminApp from './pages/AdminApp';
import AppointmentConfirmation from './pages/AppointmentConfirmation';
import { useAuth } from './contexts/AuthContext';

function RequireAuth({ children }: { children: JSX.Element }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/acesso-voluntarios" replace />;
    }

    return children;
}

const App: React.FC = () => {
    return (
        <Routes>
            {/* Volunteer Module */}
            <Route path="/acesso-voluntarios" element={<Login />} />

            <Route
                path="/volunteer-dashboard"
                element={
                    <RequireAuth>
                        <VolunteerDashboard />
                    </RequireAuth>
                }
            />

            <Route
                path="/attendance/:id"
                element={
                    <RequireAuth>
                        <AttendanceScreen />
                    </RequireAuth>
                }
            />

            <Route path="/print/record/:id" element={<MedicalRecordPrint />} />
            <Route path="/print/record/:id" element={<MedicalRecordPrint />} />
            <Route path="/print/prescription/:id" element={<PrescriptionPrint />} />
            <Route path="/print/receipt/:id" element={<ReceiptPrint />} />
            <Route
                path="/meal-plan/:id"
                element={
                    <RequireAuth>
                        <MealPlanEditor />
                    </RequireAuth>
                }
            />
            <Route path="/print/meal-plan/:id" element={<MealPlanPrint />} />

            {/* Public Confirmation Route */}
            <Route path="/confirmar-consulta/:id" element={<AppointmentConfirmation />} />

            {/* Admin Module (Existing App) */}
            {/* It handles its own internal "routing"/view switching for now */}
            <Route path="/*" element={<AdminApp />} />
        </Routes>
    );
};

export default App;
