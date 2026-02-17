
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
import PrivacyPolicy from './pages/PrivacyPolicy';
import DpiaPage from './pages/DpiaPage';
import { useAuth } from './contexts/AuthContext';

function RequireAuth({ children }: { children: React.ReactElement }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/acesso-voluntarios" replace />;
    }

    return children;
}

function RequireMedicalAccess({ children }: { children: React.ReactElement }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    // Allow ADMIN and VOLUNTEER. Block STAFF (Receptionists) from seeing medical details.
    // Ideally we should use the Role enum, but checking strings is safe here matching the backend.
    if (!user || (user.role !== 'ADMIN' && user.role !== 'VOLUNTEER')) {
        // Redirect to home/dashboard if unauthorized
        return <Navigate to="/" replace />;
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

            {/* Protected Print Routes (Medical Only) */}
            <Route
                path="/print/record/:id"
                element={
                    <RequireAuth>
                        <RequireMedicalAccess>
                            <MedicalRecordPrint />
                        </RequireMedicalAccess>
                    </RequireAuth>
                }
            />
            <Route
                path="/print/prescription/:id"
                element={
                    <RequireAuth>
                        <RequireMedicalAccess>
                            <PrescriptionPrint />
                        </RequireMedicalAccess>
                    </RequireAuth>
                }
            />

            {/* Receipt is Financial, maybe Staff can see? User didn't specify, but usually Staff handles money. Keeping Auth only for now. */}
            <Route
                path="/print/receipt/:id"
                element={
                    <RequireAuth>
                        <ReceiptPrint />
                    </RequireAuth>
                }
            />

            <Route
                path="/meal-plan/:id"
                element={
                    <RequireAuth>
                        <RequireMedicalAccess>
                            <MealPlanEditor />
                        </RequireMedicalAccess>
                    </RequireAuth>
                }
            />
            <Route
                path="/print/meal-plan/:id"
                element={
                    <RequireAuth>
                        <RequireMedicalAccess>
                            <MealPlanPrint />
                        </RequireMedicalAccess>
                    </RequireAuth>
                }
            />

            {/* Public Confirmation Route */}
            <Route path="/confirmar-consulta/:id" element={<AppointmentConfirmation />} />

            {/* Public Privacy Policy */}
            <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
            <Route path="/relatorio-impacto" element={<DpiaPage />} />

            {/* Admin Module (Existing App) */}
            {/* It handles its own internal "routing"/view switching for now */}
            <Route path="/*" element={<AdminApp />} />
        </Routes>
    );
};

export default App;
