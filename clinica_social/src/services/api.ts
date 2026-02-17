import { Patient, Volunteer, Appointment, User, Role, PaymentTable, SpecialtyItem, ClinicSettings } from '../types';

const API_BASE = 'http://localhost:8000/api/v1';

export const api = {

    getPatients: async (): Promise<Patient[]> => {
        try {
            const response = await fetch(`${API_BASE}/patients/`);
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar pacientes:', error);
            throw error;
        }
    },
    createPatient: async (patient: Omit<Patient, 'id'>) => {
        const token = localStorage.getItem('@ClinicaSocial:token');
        const response = await fetch(`${API_BASE}/patients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(patient),
        });
        if (!response.ok) throw new Error('Failed to create patient');
        return await response.json();
    },
    updatePatient: async (patient: Patient) => {
        const token = localStorage.getItem('@ClinicaSocial:token');
        const response = await fetch(`${API_BASE}/patients/${patient.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(patient),
        });
        if (!response.ok) throw new Error('Failed to update patient');
        return await response.json();
    },
    deletePatient: async (id: string) => {
        const token = localStorage.getItem('@ClinicaSocial:token');
        const response = await fetch(`${API_BASE}/patients/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete patient');
    },
    anonymizePatient: async (id: string) => {
        const token = localStorage.getItem('@ClinicaSocial:token');
        const response = await fetch(`${API_BASE}/patients/${id}/anonymize`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to anonymize patient');
        return await response.json();
    },
    getAddressByCep: async (cep: string) => {
        try {
            const cleanCep = cep.replace(/\D/g, '');
            if (cleanCep.length !== 8) return null;
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();
            if (data.erro) return null;
            return data;
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            return null;
        }
    },
    getPaymentTables: async (): Promise<import('../types').PaymentTable[]> => {
        try {
            const response = await fetch(`${API_BASE}/payment-tables/`);
            if (!response.ok) throw new Error('Failed to fetch payment tables');
            return await response.json();
        } catch (error) {
            console.error('Error fetching payment tables:', error);
            return [];
        }
    },
    createPaymentTable: async (data: { name: string; value: number }) => {
        const response = await fetch(`${API_BASE}/payment-tables/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create payment table');
        return await response.json();
    },
    updatePaymentTable: async (id: string, data: { name: string; value: number }) => {
        const response = await fetch(`${API_BASE}/payment-tables/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update payment table');
        return await response.json();
    },
    deletePaymentTable: async (id: string) => {
        const response = await fetch(`${API_BASE}/payment-tables/${id}/`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete payment table');
    },
    // Specialties
    getSpecialties: async (): Promise<import('../types').SpecialtyItem[]> => {
        try {
            const response = await fetch(`${API_BASE}/specialties/`);
            if (!response.ok) throw new Error('Failed to fetch specialties');
            return await response.json();
        } catch (error) {
            console.error('Error fetching specialties:', error);
            return [];
        }
    },
    createSpecialty: async (data: { name: string; anamnesis_type?: string }) => {
        const response = await fetch(`${API_BASE}/specialties/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create specialty');
        return await response.json();
    },
    deleteSpecialty: async (id: string) => {
        const response = await fetch(`${API_BASE}/specialties/${id}/`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete specialty');
    },
    getVolunteers: async (): Promise<import('../types').Volunteer[]> => {
        try {
            const response = await fetch(`${API_BASE}/volunteers/`);
            if (!response.ok) throw new Error('Failed to fetch volunteers');
            return await response.json();
        } catch (error) {
            console.error('Error fetching volunteers:', error);
            return [];
        }
    },
    createVolunteer: async (volunteer: Omit<import('../types').Volunteer, 'id'>) => {
        const token = localStorage.getItem('@ClinicaSocial:token');
        const response = await fetch(`${API_BASE}/volunteers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(volunteer),
        });
        if (!response.ok) throw new Error('Failed to create volunteer');
        return await response.json();
    },
    updateVolunteer: async (volunteer: import('../types').Volunteer) => {
        const token = localStorage.getItem('@ClinicaSocial:token');
        // Prepare data ensuring password is removed if empty/not meant to be updated
        // For now, we send everything. Backend ignores missing fields in update.
        const response = await fetch(`${API_BASE}/volunteers/${volunteer.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(volunteer),
        });
        if (!response.ok) throw new Error('Failed to update volunteer');
        return await response.json();
    },
    deleteVolunteer: async (id: string) => {
        const token = localStorage.getItem('@ClinicaSocial:token');
        const response = await fetch(`${API_BASE}/volunteers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete volunteer');
    },
    getAppointments: async (filters?: { volunteer_id?: string, patient_id?: string, date?: string }): Promise<import('../types').Appointment[]> => {
        const params = new URLSearchParams();
        if (filters?.volunteer_id) params.append('volunteer_id', filters.volunteer_id);
        if (filters?.patient_id) params.append('patient_id', filters.patient_id);
        if (filters?.date) params.append('date', filters.date);

        const response = await fetch(`${API_BASE}/appointments/?${params}`);
        if (!response.ok) throw new Error('Failed to fetch appointments');
        return await response.json();
    },
    createAppointment: async (appointment: Omit<import('../types').Appointment, 'id'>) => {
        const response = await fetch(`${API_BASE}/appointments/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointment),
        });
        if (response.status === 409) throw new Error('Horário indisponível. Já existe um agendamento para este voluntário neste horário.');
        if (!response.ok) throw new Error('Failed to create appointment');
        return await response.json();
    },
    updateAppointment: async (appointment: import('../types').Appointment) => {
        const response = await fetch(`${API_BASE}/appointments/${appointment.id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointment),
        });
        if (response.status === 409) throw new Error('Horário indisponível. Conflito com outro agendamento.');
        if (!response.ok) throw new Error('Failed to update appointment');
        return await response.json();
    },
    deleteAppointment: async (id: string) => {
        const response = await fetch(`${API_BASE}/appointments/${id}/`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete appointment');
    },
    confirmAppointment: async (id: string) => {
        const response = await fetch(`${API_BASE}/public/appointments/${id}/confirm`, {
            method: 'POST',
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Falha ao confirmar agendamento');
        }
        return await response.json();
    },
    // Auth
    login: async (credentials: { email: string; password: string }): Promise<User> => {
        const response = await fetch(`${API_BASE}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            throw {
                message: 'Credenciais inválidas',
                response: { status: response.status }
            };
        }
        const data = await response.json();
        if (data.access_token) {
            localStorage.setItem('@ClinicaSocial:token', data.access_token);
        }
        return data;
    },
    changePassword: async (data: { user_id: string; current_password: string; new_password: string }) => {
        const response = await fetch(`${API_BASE}/auth/change-password/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Erro ao alterar senha');
        }
        return await response.json();
    },
    // Financial
    getTransactions: async (filters: { date?: string; startDate?: string; endDate?: string; patient_id?: string; appointment_id?: string }) => {
        const params = new URLSearchParams();
        if (filters.date) params.append('date_filter', filters.date);
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        if (filters.patient_id) params.append('patient_id', filters.patient_id);
        if (filters.appointment_id) params.append('appointment_id', filters.appointment_id);
        const response = await fetch(`${API_BASE}/financial/transactions/?${params}`);
        if (!response.ok) throw new Error('Failed to fetch transactions');
        return await response.json();
    },
    createTransaction: async (data: any) => {
        const response = await fetch(`${API_BASE}/financial/transactions/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create transaction');
        return await response.json();
    },
    getDailyStats: async (date: string) => {
        const response = await fetch(`${API_BASE}/financial/stats/daily/?target_date=${date}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
    },
    getTransaction: async (id: string) => {
        // Backend seems to lack GET /transactions/{id}.
        // But we can filter fetching all for the date, or implement it on backend.
        // For robustness, I'll assume we add GET /financial/transactions/{id} to backend or use the existing list to find it improperly.
        // Let's rely on the list for now if backend is not touched. 
        // Wait, I am allowed to touch backend. It's better to add the endpoint to backend.
        const response = await fetch(`${API_BASE}/financial/transactions/detail/${id}`);
        if (!response.ok) throw new Error('Failed to fetch transaction');
        return await response.json();
    },

    getStats: async (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        const response = await fetch(`${API_BASE}/financial/stats/summary?${params}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
    },
    getBirthdays: async () => {
        const response = await fetch(`${API_BASE}/stats/birthdays`);
        if (!response.ok) throw new Error('Failed to fetch birthdays');
        return await response.json();
    },
    deleteTransaction: async (id: string) => {
        const response = await fetch(`${API_BASE}/financial/transactions/${id}/`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete transaction');
    },
    updateTransaction: async (id: string, data: any) => {
        const response = await fetch(`${API_BASE}/financial/transactions/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update transaction');
        return await response.json();
    }
    ,
    // Attendance
    attendance: {
        getMyAppointments: async (): Promise<Appointment[]> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/attendance/my-appointments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch my appointments');
            return await response.json();
        },
        start: async (id: string): Promise<Appointment> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/attendance/${id}/start`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to start attendance');
            return await response.json();
        },
        finish: async (id: string, record: any): Promise<any> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/attendance/${id}/finish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(record)
            });
            if (!response.ok) throw new Error('Failed to finish attendance');
            return await response.json();
        },
        getHistory: async (patientId: string): Promise<any[]> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/attendance/patient/${patientId}/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch history');
            return await response.json();
        },
        getRecord: async (appointmentId: string): Promise<any> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/attendance/${appointmentId}/record`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch record');
            return await response.json();
        },
        getPatientHistory: async (patientId: string): Promise<any[]> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/attendance/patient/${patientId}/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch history');
            return await response.json();
        },
        cancel: async (id: string): Promise<Appointment> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/attendance/${id}/cancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to cancel attendance start');
            return await response.json();
        },
    },
    // Settings
    settings: {
        get: async (): Promise<ClinicSettings> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/settings/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch settings');
            return await response.json();
        },
        update: async (data: Partial<ClinicSettings>): Promise<ClinicSettings> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/settings/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to update settings');
            return await response.json();
        }
    },
    // System Users
    users: {
        list: async (): Promise<User[]> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/users/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            return await response.json();
        },
        create: async (user: any): Promise<User> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/users/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(user),
            });
            if (!response.ok) throw new Error('Failed to create user');
            return await response.json();
        },
        delete: async (id: string): Promise<void> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete user');
        },
        update: async (user: Partial<User>): Promise<User> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/users/${user.id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(user),
            });
            if (!response.ok) throw new Error('Failed to update user');
            return await response.json();
        }
    },
    // Forms
    forms: {
        listTemplates: async (specialty?: string): Promise<any[]> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const params = specialty ? `?specialty=${specialty}` : '';
            const response = await fetch(`${API_BASE}/forms/templates${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch templates');
            return await response.json();
        },
        createTemplate: async (data: any): Promise<any> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/forms/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(errorData.detail || 'Failed to create template');
            }
            return await response.json();
        },
        updateTemplate: async (id: string, data: any): Promise<any> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/forms/templates/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(errorData.detail || 'Failed to update template');
            }
            return await response.json();
        },
        deleteTemplate: async (id: string): Promise<void> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/forms/templates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete template');
        }
    },
    // Audit Logs
    getAuditLogs: async (filters?: { user_id?: string, limit?: number, start_date?: string, end_date?: string }): Promise<any[]> => {
        const token = localStorage.getItem('@ClinicaSocial:token');
        const params = new URLSearchParams();
        if (filters?.user_id) params.append('user_id', filters.user_id);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.start_date && filters.start_date.trim() !== '') params.append('start_date', filters.start_date);
        if (filters?.end_date && filters.end_date.trim() !== '') params.append('end_date', filters.end_date);

        const response = await fetch(`${API_BASE}/audit?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch audit logs');
        return await response.json();
    },
    // Backup
    backup: {
        trigger: async (): Promise<{ filename: string }> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/admin/backup`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao gerar backup');
            return await response.json();
        },
        list: async (): Promise<{ filename: string, size: number, created_at: number }[]> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/admin/backups`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao listar backups');
            return await response.json();
        },
        download: async (filename: string): Promise<Blob> => {
            const token = localStorage.getItem('@ClinicaSocial:token');
            const response = await fetch(`${API_BASE}/admin/backups/${filename}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao baixar backup');
            return await response.blob();
        }
    }
};
