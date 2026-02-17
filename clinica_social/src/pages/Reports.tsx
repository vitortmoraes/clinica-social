import React, { useState, useEffect } from 'react';
import { Patient, Volunteer, Appointment, ClinicSettings } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import ConsentPrint from './ConsentPrint';
import SearchableSelect from '../components/molecules/SearchableSelect';
import AuditLogViewer from '../components/AuditLogViewer';

interface ReportsProps {
    patients: Patient[];
    volunteers: Volunteer[];
    appointments: Appointment[];
    currentUser?: import('../types').User;
}

type ReportSection = 'patients' | 'volunteers' | 'appointments' | 'financial' | 'audit' | null;

const Reports: React.FC<ReportsProps> = ({ patients, volunteers, appointments, currentUser }) => {
    const [openSection, setOpenSection] = useState<ReportSection>(null);
    const [settings, setSettings] = useState<ClinicSettings | null>(null);

    // Fetch settings for report headers
    useEffect(() => {
        api.settings.get().then(setSettings).catch(console.error);
    }, []);

    // State for selected fields
    const [patientFields, setPatientFields] = useState({ name: true, phone: true, birth_date: true, address: false, history: false });
    const [patientReportType, setPatientReportType] = useState<'all' | 'birthdays' | 'single' | 'lgpd_term'>('all');

    // Volunteer State
    // Volunteer State
    const [volunteerReportType, setVolunteerReportType] = useState<'all' | 'birthdays' | 'single' | 'specialty' | 'lgpd_term'>('all');
    const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');
    const [volunteerFields, setVolunteerFields] = useState({ name: true, specialty: true, phone: true, email: false, availability: false, birth_date: true });

    // Appointment/Record State
    const [apptReportType, setApptReportType] = useState<'scheduled' | 'completed' | 'history' | 'prescription' | 'daily_specialty'>('scheduled');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [commFields, setCommFields] = useState({ date: true, patient: true, volunteer: true, status: true, notes: false });
    const [finFields, setFinFields] = useState({ date: true, type: true, amount: true, method: true, description: false });

    // LGPD Report State
    const [selectedLgpdPatientId, setSelectedLgpdPatientId] = useState<string>('');
    const [showConsentPrint, setShowConsentPrint] = useState(false);
    const [consentData, setConsentData] = useState<{ person: Patient | Volunteer, type: 'patient' | 'volunteer' } | null>(null);

    const toggleSection = (section: ReportSection) => {
        setOpenSection(openSection === section ? null : section);
    };

    const getFilteredPatients = () => {
        let data = [...patients];
        if (patientReportType === 'birthdays') {
            data = data.filter(p => {
                if (!p.birth_date) return false;
                if (selectedMonth === 'all') return true;
                // birth_date is YYYY-MM-DD
                const parts = p.birth_date.split('-');
                if (parts.length !== 3) return false;
                const month = parseInt(parts[1], 10) - 1; // 0-indexed
                return month.toString() === selectedMonth;
            });
        } else if (patientReportType === 'single') {
            data = data.filter(p => p.id === selectedPatientId);
        }
        return data.sort((a, b) => a.name.localeCompare(b.name));
    };

    const getFilteredVolunteers = () => {
        let data = [...volunteers];
        if (volunteerReportType === 'birthdays') {
            data = data.filter(v => {
                if (!v.birth_date) return false;
                if (selectedMonth === 'all') return true;
                const parts = v.birth_date.split('-');
                if (parts.length !== 3) return false;
                const month = parseInt(parts[1], 10) - 1;
                return month.toString() === selectedMonth;
            });
        } else if (volunteerReportType === 'single') {
            data = data.filter(v => v.id === selectedVolunteerId);
        }
        return data.sort((a, b) => a.name.localeCompare(b.name));
    };

    const getSpecialtyStats = () => {
        const stats: Record<string, number> = {};
        volunteers.forEach(v => {
            const spec = v.specialty || 'Sem Especialidade';
            stats[spec] = (stats[spec] || 0) + 1;
        });
        return Object.entries(stats)
            .map(([specialty, count]) => ({ specialty, count }))
            .sort((a, b) => a.specialty.localeCompare(b.specialty));
    };

    const formatValue = (value: any, key?: string): string => {
        if (value === null || value === undefined) return '-';

        if ((key === 'whatsapp' || key === 'phone') && typeof value === 'string') {
            const cleaned = value.replace(/\D/g, '');
            if (cleaned.length === 11) {
                return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
            }
            if (cleaned.length === 10) {
                return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
            }
            return value;
        }

        if ((key === 'birth_date' || key === 'date') && typeof value === 'string') {
            const parts = value.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts;
                return `${day}/${month}/${year}`;
            }
        }

        if (key === 'status' && typeof value === 'string') {
            const statusMap: Record<string, string> = {
                'scheduled': 'Agendada',
                'completed': 'Realizada',
                'cancelled': 'Cancelada',
                'not_started': 'Não iniciada',
                'in_progress': 'Em atendimento',
                'finished': 'Finalizada'
            };
            return statusMap[value] || value;
        }

        if (typeof value === 'object') {
            if ('street' in value || 'city' in value) {
                return `${value.street || ''}, ${value.number || ''} - ${value.neighborhood || ''} - ${value.city || ''}/${value.state || ''}`;
            }
            if (Array.isArray(value) && value.length > 0 && 'day' in value[0]) {
                return value.map((a: any) => `${a.day} (${a.start}-${a.end})`).join(', ');
            }
            return JSON.stringify(value);
        }
        return String(value);
    };

    const generatePDF = async (title: string, data: any[], columns: { header: string, dataKey: string }[], subtitle?: string) => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const pageWidth = doc.internal.pageSize.getWidth();

        if (settings?.logo_url) {
            try {
                const img = new Image();
                img.src = settings.logo_url;
                await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
                doc.addImage(settings.logo_url, 'PNG', 14, 10, 50, 30);
            } catch (e) {
                console.warn("Could not load logo for PDF", e);
            }
        }

        doc.setFontSize(22);
        doc.setTextColor(22, 163, 74);
        doc.text(settings?.clinic_name || 'Clínica Social', 70, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(settings?.address || '', 70, 26);
        doc.text(`${settings?.phone || ''} • ${settings?.email || ''}`, 70, 31);

        doc.setDrawColor(200);
        doc.line(14, 45, pageWidth - 14, 45);

        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text(title, 14, 55);

        if (subtitle) {
            doc.setFontSize(12);
            doc.setTextColor(80);
            doc.text(subtitle, 14, 62);
        }

        doc.setFontSize(9);
        doc.setTextColor(128);
        const dateY = subtitle ? 68 : 62;
        doc.text(`Gerado em: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}`, 14, dateY);

        autoTable(doc, {
            startY: dateY + 5,
            head: [columns.map(c => c.header)],
            body: data.map(item => columns.map(c => formatValue(item[c.dataKey], c.dataKey))),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 253, 244] },
            margin: { top: dateY + 5 },
            didParseCell: (data) => {
                if (data.section === 'body') {
                    const rowData = data.row.raw as any[];
                    // Basic heuristic: check description column
                    const descIdx = columns.findIndex(c => c.dataKey === 'description');

                    if (descIdx >= 0 && typeof rowData[descIdx] === 'string') {
                        const desc = rowData[descIdx];

                        if (desc.startsWith('TOTAL')) {
                            data.cell.styles.fontStyle = 'bold';
                            data.cell.styles.fillColor = [220, 252, 231];

                            if (desc.includes('ENTRADAS')) {
                                data.cell.styles.textColor = [22, 163, 74];
                            } else if (desc.includes('SAÍDAS')) {
                                data.cell.styles.textColor = [220, 38, 38];
                            }
                        } else if (desc.startsWith('SALDO LÍQUIDO')) {
                            data.cell.styles.fontStyle = 'bold';
                            data.cell.styles.fillColor = [220, 252, 231];
                            data.cell.styles.textColor = [0, 0, 0];
                        } else if (desc.startsWith('> Total em')) {
                            data.cell.styles.fontStyle = 'italic';
                            data.cell.styles.textColor = [80, 80, 80];
                        } else if (desc.startsWith('RESUMO')) {
                            data.cell.styles.textColor = [50, 50, 50];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                }
            }
        });

        doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    };

    const exportToExcel = (title: string, data: any[], columns: { header: string, dataKey: string }[]) => {
        const headerRows = [
            [settings?.clinic_name || 'Clínica Social'],
            [settings?.address || ''],
            [`${settings?.phone || ''} - ${settings?.email || ''}`],
            [],
            [title],
            [`Gerado em: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}`],
            []
        ];

        const tableHeader = columns.map(c => c.header);
        const tableData = data.map(item => columns.map(c => formatValue(item[c.dataKey], c.dataKey)));
        const combinedData = [...headerRows, tableHeader, ...tableData];
        const ws = XLSX.utils.aoa_to_sheet(combinedData);
        const wscols = columns.map(() => ({ wch: 25 }));
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Relatório");
        XLSX.writeFile(wb, `${title.replace(/\s+/g, '_').toLowerCase()}.xlsx`);
    };

    const handleGenerateVolunteerReport = (format: 'pdf' | 'excel') => {
        if (volunteerReportType === 'lgpd_term') {
            if (!selectedVolunteerId) {
                alert("Selecione um voluntário para gerar o termo.");
                return;
            }
            const volunteer = volunteers.find(v => v.id === selectedVolunteerId);
            if (volunteer) {
                setConsentData({ person: volunteer, type: 'volunteer' });
                setShowConsentPrint(true);
            }
            return;
        }

        let data: any[] = [];
        let columns: { header: string, dataKey: string }[] = [];
        let title = '';

        if (volunteerReportType === 'specialty') {
            data = getSpecialtyStats();
            title = 'Relatório de Voluntários - Quantidade por Especialidade';
            columns = [
                { header: 'Especialidade', dataKey: 'specialty' },
                { header: 'Quantidade', dataKey: 'count' }
            ];
        } else {
            data = getFilteredVolunteers();
            title = `Relatório de Voluntários - ${volunteerReportType === 'all' ? 'Geral' : volunteerReportType === 'birthdays' ? 'Aniversariantes' : 'Individual'}`;

            const possibleCols = [
                { id: 'name', header: 'Nome', dataKey: 'name' },
                { id: 'specialty', header: 'Especialidade', dataKey: 'specialty' },
                { id: 'phone', header: 'Telefone', dataKey: 'phone' },
                { id: 'birth_date', header: 'Data de Nascimento', dataKey: 'birth_date' },
                { id: 'email', header: 'E-mail', dataKey: 'email' },
                { id: 'availability', header: 'Disponibilidade', dataKey: 'availability' },
            ];
            columns = possibleCols.filter(c => (volunteerFields as any)[c.id]);
        }

        if (format === 'pdf') {
            generatePDF(title, data, columns);
        } else {
            exportToExcel(title, data, columns);
        }
    };

    const handleGenerateAppointmentReport = async (format: 'pdf' | 'excel') => {
        let data: any[] = [];
        let title = '';
        let columns: { header: string, dataKey: string }[] = [];

        if (apptReportType === 'daily_specialty') {
            title = 'Relatório de Consultas - Quantitativo por Especialidade';

            const filtered = appointments.filter(a => {
                if (['cancelled'].includes(a.status)) return false;
                if (dateRange.start && a.date < dateRange.start) return false;
                if (dateRange.end && a.date > dateRange.end) return false;
                return true;
            });

            const stats: Record<string, number> = {};

            filtered.forEach(a => {
                const vol = volunteers.find(v => v.id === a.volunteer_id);
                // Simple aggregation by Specialty only
                const spec = vol?.specialty || 'Sem Especialidade';
                stats[spec] = (stats[spec] || 0) + 1;
            });

            data = Object.entries(stats).map(([specialty, count]) => {
                return {
                    specialty,
                    count
                };
            }).sort((a, b) => a.specialty.localeCompare(b.specialty));

            columns = [
                { header: 'Especialidade', dataKey: 'specialty' },
                { header: 'Quantidade', dataKey: 'count' }
            ];

        } else if (apptReportType === 'scheduled' || apptReportType === 'completed') {
            data = appointments.filter(a => {
                const statusMatch = apptReportType === 'scheduled'
                    ? ['scheduled', 'not_started'].includes(a.status)
                    : ['completed', 'finished'].includes(a.status);

                if (!statusMatch) return false;

                if (dateRange.start && a.date < dateRange.start) return false;
                if (dateRange.end && a.date > dateRange.end) return false;

                if (selectedPatientId && a.patient_id !== selectedPatientId) return false;

                return true;
            });

            data = data.map(a => {
                const p = patients.find(p => p.id === a.patient_id);
                const v = volunteers.find(v => v.id === a.volunteer_id);
                return {
                    ...a,
                    patient_name: p?.name || 'Desconhecido',
                    volunteer_name: v?.name || 'Desconhecido',
                    formatted_date: a.date.split('-').reverse().join('/')
                };
            }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

            title = `Relatório de Consultas - ${apptReportType === 'scheduled' ? 'Agendadas' : 'Realizadas'}`;

            const possibleCols = [
                { id: 'date', header: 'Data', dataKey: 'formatted_date' },
                { id: 'date', header: 'Hora', dataKey: 'time' },
                { id: 'patient', header: 'Paciente', dataKey: 'patient_name' },
                { id: 'volunteer', header: 'Profissional', dataKey: 'volunteer_name' },
                { id: 'status', header: 'Status', dataKey: 'status' },
                { id: 'notes', header: 'Anotações', dataKey: 'notes' },
            ];
            columns = possibleCols.filter(c => (commFields as any)[c.id]);
        }
        else if (apptReportType === 'history' || apptReportType === 'prescription') {
            if (!selectedPatientId) {
                alert("Por favor, selecione um paciente.");
                return;
            }
            try {
                const history = await api.attendance.getPatientHistory(selectedPatientId);
                const patient = patients.find(p => p.id === selectedPatientId);

                data = history.map((h: any) => ({
                    ...h,
                    formatted_date: new Date(h.created_at).toLocaleDateString(),
                    patient_name: patient?.name || '',
                }));

                if (apptReportType === 'prescription') {
                    data = data.filter((h: any) => h.prescription);
                    title = `Relatório de Receitas - ${patient?.name}`;
                    columns = [
                        { header: 'Data', dataKey: 'formatted_date' },
                        { header: 'Prescrição', dataKey: 'prescription' }
                    ];
                } else {
                    title = `Prontuário Médico - ${patient?.name}`;
                    columns = [
                        { header: 'Data', dataKey: 'formatted_date' },
                        { header: 'Queixa', dataKey: 'chief_complaint' },
                        { header: 'Histórico', dataKey: 'history' },
                        { header: 'Procedimentos', dataKey: 'procedures' },
                        { header: 'Prescrição', dataKey: 'prescription' }
                    ];
                }
            } catch (error) {
                console.error("Error fetching history", error);
                alert("Erro ao buscar histórico do paciente.");
                return;
            }
        }

        if (format === 'pdf') {
            generatePDF(title, data, columns);
        } else {
            exportToExcel(title, data, columns);
        }
    };

    const [financialReportType, setFinancialReportType] = useState<'detailed' | 'summary'>('detailed');

    const handleGenerateFinancialReport = async (format: 'pdf' | 'excel') => {
        if (!dateRange.start || !dateRange.end) {
            alert("Por favor, selecione um período de datas.");
            return;
        }

        try {
            const transactions = await api.getTransactions({
                startDate: dateRange.start,
                endDate: dateRange.end
            });

            if (financialReportType === 'detailed') {
                const title = `Extrato Detalhado`;
                const subtitle = `Período: ${new Date(dateRange.start).toLocaleDateString()} a ${new Date(dateRange.end).toLocaleDateString()}`;

                // 1. Sort Descending
                const sorted = transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

                // 2. Group by Date
                const grouped: Record<string, any[]> = {};
                sorted.forEach((t: any) => {
                    const dateKey = new Date(t.date).toLocaleDateString();
                    if (!grouped[dateKey]) grouped[dateKey] = [];
                    grouped[dateKey].push(t);
                });

                // 3. Build Rows with Totals
                const processedData: any[] = [];
                let grandTotal = 0;
                let totalIncome = 0;
                let totalExpense = 0;
                const incomeByMethod: Record<string, number> = {};

                Object.keys(grouped).forEach(dateStr => {
                    const dayTrans = grouped[dateStr];
                    let dayTotal = 0;

                    dayTrans.forEach((t: any) => {
                        const amount = t.amount;
                        if (t.type === 'INCOME') {
                            dayTotal += amount;
                            grandTotal += amount;
                            totalIncome += amount;
                            // Track income by method
                            const method = t.payment_method;
                            incomeByMethod[method] = (incomeByMethod[method] || 0) + amount;
                        } else {
                            dayTotal -= amount;
                            grandTotal -= amount;
                            totalExpense += amount;
                        }

                        processedData.push({
                            ...t,
                            formatted_date: new Date(t.date).toLocaleDateString(),
                            formatted_amount: `R$ ${t.amount.toFixed(2)}`,
                            type_label: t.type === 'INCOME' ? 'Entrada' : 'Saída',
                            patient_name: patients.find(p => p.id === t.patient_id)?.name || '-'
                        });
                    });

                    // Add Daily Total Row
                    processedData.push({
                        formatted_date: '',
                        description: `TOTAL DO DIA ${dateStr}`,
                        patient_name: '',
                        type_label: '',
                        payment_method: '',
                        formatted_amount: `R$ ${dayTotal.toFixed(2)}`
                    });
                });

                // Add Summary Section
                processedData.push({ description: '', formatted_amount: '' }); // Spacer

                // Total Income (Green)
                processedData.push({
                    formatted_date: '',
                    description: 'TOTAL ENTRADAS (PERÍODO)',
                    patient_name: '',
                    type_label: '',
                    payment_method: '',
                    formatted_amount: `R$ ${totalIncome.toFixed(2)}`
                });

                // Total Expenses (Red)
                processedData.push({
                    formatted_date: '',
                    description: 'TOTAL SAÍDAS (PERÍODO)',
                    patient_name: '',
                    type_label: '',
                    payment_method: '',
                    formatted_amount: `R$ -${totalExpense.toFixed(2)}`
                });

                // Grand Total (Net)
                processedData.push({
                    formatted_date: '',
                    description: 'SALDO LÍQUIDO FINAL',
                    patient_name: '',
                    type_label: '',
                    payment_method: '',
                    formatted_amount: `R$ ${grandTotal.toFixed(2)}`
                });

                // Breakdown Spacer
                processedData.push({ description: '', formatted_amount: '' });

                // Breakdown Header
                processedData.push({
                    formatted_date: '',
                    description: 'RESUMO DE ENTRADAS POR MÉTODO',
                    formatted_amount: ''
                });

                // Breakdown Rows
                Object.entries(incomeByMethod).forEach(([method, amount]) => {
                    processedData.push({
                        formatted_date: '',
                        description: `> Total em ${method}`,
                        patient_name: '',
                        type_label: '',
                        payment_method: '',
                        formatted_amount: `R$ ${amount.toFixed(2)}`
                    });
                });

                const columns = [
                    { header: 'Data', dataKey: 'formatted_date' },
                    { header: 'Descrição', dataKey: 'description' },
                    { header: 'Paciente', dataKey: 'patient_name' },
                    { header: 'Tipo', dataKey: 'type_label' },
                    { header: 'Método', dataKey: 'payment_method' },
                    { header: 'Valor', dataKey: 'formatted_amount' }
                ];

                if (format === 'pdf') {
                    generatePDF(title, processedData, columns, subtitle);
                } else {
                    exportToExcel(`${title} - ${subtitle}`, processedData, columns);
                }

            } else {
                // SUMMARY REPORT (Fechamento de Caixa)
                const title = `Resumo Financeiro`;
                const subtitle = `Período: ${new Date(dateRange.start).toLocaleDateString()} a ${new Date(dateRange.end).toLocaleDateString()}`;

                const summary: any = {
                    total_income: 0,
                    total_expense: 0,
                    by_method: {}
                };

                transactions.forEach((t: any) => {
                    if (t.type === 'INCOME') {
                        summary.total_income += t.amount;
                        // Summarize by method only for Income usually, but let's do all
                        const method = t.payment_method || 'OUTROS';
                        summary.by_method[method] = (summary.by_method[method] || 0) + t.amount;
                    } else {
                        summary.total_expense += t.amount;
                    }
                });

                const balance = summary.total_income - summary.total_expense;

                // For PDF/Excel, we need rows.
                // Row 1: Income
                // Row 2: Expense
                // Row 3: Balance
                // Row 4: Breakdown Header
                // Rows 5+: Methods

                const rows = [
                    { category: 'Total de Entradas', value: `R$ ${summary.total_income.toFixed(2)}` },
                    { category: 'Total de Saídas', value: `R$ ${summary.total_expense.toFixed(2)}` },
                    { category: 'Saldo do Período', value: `R$ ${balance.toFixed(2)}` },
                    { category: '', value: '' }, // Spacer
                    { category: '--- Detalhamento por Método (Entradas) ---', value: '' }
                ];

                Object.entries(summary.by_method).forEach(([method, amount]) => {
                    rows.push({
                        category: method as string,
                        value: `R$ ${(amount as number).toFixed(2)}`
                    });
                });

                const columns = [
                    { header: 'Categoria', dataKey: 'category' },
                    { header: 'Valor', dataKey: 'value' }
                ];

                if (format === 'pdf') {
                    generatePDF(title, rows, columns);
                } else {
                    exportToExcel(title, rows, columns);
                }
            }

        } catch (error) {
            console.error("Error generating financial report", error);
            alert("Erro ao gerar relatório financeiro.");
        }
    };

    const handlePrepareConsentPrint = () => {
        // Legacy function, replaced by handleGeneratePatientReport with lgpd_term
    };

    const handleGeneratePatientReport = (format: 'pdf' | 'excel') => {
        if (patientReportType === 'lgpd_term') {
            if (!selectedPatientId) {
                alert("Selecione um paciente para gerar o termo.");
                return;
            }
            const patient = patients.find(p => p.id === selectedPatientId);
            if (patient) {
                setConsentData({ person: patient, type: 'patient' });
                setShowConsentPrint(true);
            }
            return;
        }

        const data = getFilteredPatients();
        const title = `Relatório de Pacientes - ${patientReportType === 'all' ? 'Geral' : patientReportType === 'birthdays' ? 'Aniversariantes' : 'Individual'}`;

        const possibleCols = [
            { id: 'name', header: 'Nome Completo', dataKey: 'name' },
            { id: 'phone', header: 'Telefone', dataKey: 'whatsapp' },
            { id: 'birth_date', header: 'Data de Nascimento', dataKey: 'birth_date' },
            { id: 'address', header: 'Endereço', dataKey: 'address' },
            { id: 'history', header: 'Observações', dataKey: 'observations' },
        ];

        const columns = possibleCols.filter(c => (patientFields as any)[c.id]);

        if (format === 'pdf') {
            generatePDF(title, data, columns);
        } else {
            exportToExcel(title, data, columns);
        }
    };

    const generateReport = (type: string) => {
        alert(`Gerando relatório de ${type} com as opções selecionadas... (Funcionalidade em desenvolvimento)`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
                <p className="text-slate-500">Gere relatórios personalizados do sistema.</p>
            </div>



            {/* Relatórios de Pacientes */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button
                    onClick={() => toggleSection('patients')}
                    className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-slate-800">Relatórios de Pacientes</h3>
                            <p className="text-sm text-slate-500">Listagem, histórico e contatos de pacientes.</p>
                        </div>
                    </div>
                    <svg className={`w-6 h-6 text-slate-400 transition-transform ${openSection === 'patients' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {openSection === 'patients' && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50 animate-in fade-in slide-in-from-top-2 duration-200">

                        {/* Sub-selection of Report Type */}
                        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="patientReportType"
                                    value="all"
                                    checked={patientReportType === 'all'}
                                    onChange={() => setPatientReportType('all')}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-slate-700 font-medium">Todos os Pacientes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="patientReportType"
                                    value="birthdays"
                                    checked={patientReportType === 'birthdays'}
                                    onChange={() => setPatientReportType('birthdays')}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-slate-700 font-medium">Aniversariantes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="patientReportType"
                                    value="single"
                                    checked={patientReportType === 'single'}
                                    onChange={() => setPatientReportType('single')}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-slate-700 font-medium">Paciente Específico</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="patientReportType"
                                    value="lgpd_term"
                                    checked={patientReportType === 'lgpd_term'}
                                    onChange={() => {
                                        setPatientReportType('lgpd_term');
                                        setPatientFields({ ...patientFields }); // Reset specific fields if needed
                                    }}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-slate-700 font-medium">Termo LGPD</span>
                            </label>
                        </div>

                        {/* Filters based on Type */}
                        {patientReportType === 'birthdays' && (
                            <div className="mb-6 animate-in fade-in">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Selecione o Mês</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="all">Todos os Meses</option>
                                    <option value="0">Janeiro</option>
                                    <option value="1">Fevereiro</option>
                                    <option value="2">Março</option>
                                    <option value="3">Abril</option>
                                    <option value="4">Maio</option>
                                    <option value="5">Junho</option>
                                    <option value="6">Julho</option>
                                    <option value="7">Agosto</option>
                                    <option value="8">Setembro</option>
                                    <option value="9">Outubro</option>
                                    <option value="10">Novembro</option>
                                    <option value="11">Dezembro</option>
                                </select>
                            </div>
                        )}

                        {(patientReportType === 'single' || patientReportType === 'lgpd_term') && (
                            <div className="mb-6 animate-in fade-in">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Selecione o Paciente</label>
                                <SearchableSelect
                                    options={patients.map(p => ({ id: p.id, label: p.name }))}
                                    value={selectedPatientId}
                                    onChange={(val) => setSelectedPatientId(val)}
                                    placeholder="Digite para buscar o paciente..."
                                    className="w-full md:w-1/2"
                                />
                            </div>
                        )}

                        {patientReportType !== 'lgpd_term' && (
                            <>
                                <h4 className="font-semibold text-slate-700 mb-4">Selecione as colunas para o relatório:</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {Object.entries(patientFields).map(([key, val]) => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                                            <input type="checkbox" checked={val} onChange={() => setPatientFields({ ...patientFields, [key]: !val })} className="w-4 h-4 text-primary rounded focus:ring-primary" />
                                            <span className="capitalize text-slate-700">
                                                {key === 'name' ? 'Nome Completo' :
                                                    key === 'phone' ? 'Telefone' :
                                                        key === 'birth_date' ? 'Data de Nascimento' :
                                                            key === 'address' ? 'Endereço' :
                                                                key === 'history' ? 'Observações' : key}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </>
                        )}
                        <div className="flex justify-end gap-3">
                            {patientReportType === 'lgpd_term' ? (
                                <button onClick={() => handleGeneratePatientReport('pdf')} className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition-colors font-bold shadow-lg shadow-purple-200">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                    Gerar Termo de Consentimento
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => handleGeneratePatientReport('excel')} className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl hover:bg-green-100 transition-colors font-semibold">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        Excel
                                    </button>
                                    <button onClick={() => handleGeneratePatientReport('pdf')} className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors font-semibold">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        PDF
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Relatórios de Voluntários */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button
                    onClick={() => toggleSection('volunteers')}
                    className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-slate-800">Relatórios de Voluntários</h3>
                            <p className="text-sm text-slate-500">Disponibilidade, especialidades e cadastros.</p>
                        </div>
                    </div>
                    <svg className={`w-6 h-6 text-slate-400 transition-transform ${openSection === 'volunteers' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {openSection === 'volunteers' && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Sub-selection of Report Type */}
                        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="volunteerReportType"
                                    value="all"
                                    checked={volunteerReportType === 'all'}
                                    onChange={() => setVolunteerReportType('all')}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-slate-700 font-medium">Todos</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="volunteerReportType"
                                    value="birthdays"
                                    checked={volunteerReportType === 'birthdays'}
                                    onChange={() => setVolunteerReportType('birthdays')}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-slate-700 font-medium">Aniversariantes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="volunteerReportType"
                                    value="single"
                                    checked={volunteerReportType === 'single'}
                                    onChange={() => setVolunteerReportType('single')}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-slate-700 font-medium">Voluntário Específico</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="volunteerReportType"
                                    value="specialty"
                                    checked={volunteerReportType === 'specialty'}
                                    onChange={() => setVolunteerReportType('specialty')}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-slate-700 font-medium">Por Especialidade (Qtd)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="volunteerReportType"
                                    value="lgpd_term"
                                    checked={volunteerReportType === 'lgpd_term'}
                                    onChange={() => setVolunteerReportType('lgpd_term')}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-slate-700 font-medium">Termo LGPD</span>
                            </label>
                        </div>

                        {/* Filters based on Type */}
                        {volunteerReportType === 'birthdays' && (
                            <div className="mb-6 animate-in fade-in">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Selecione o Mês</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
                                >
                                    <option value="all">Todos os meses</option>
                                    <option value="0">Janeiro</option>
                                    <option value="1">Fevereiro</option>
                                    <option value="2">Março</option>
                                    <option value="3">Abril</option>
                                    <option value="4">Maio</option>
                                    <option value="5">Junho</option>
                                    <option value="6">Julho</option>
                                    <option value="7">Agosto</option>
                                    <option value="8">Setembro</option>
                                    <option value="9">Outubro</option>
                                    <option value="10">Novembro</option>
                                    <option value="11">Dezembro</option>
                                </select>
                            </div>
                        )}

                        {(volunteerReportType === 'single' || volunteerReportType === 'lgpd_term') && (
                            <div className="mb-6 animate-in fade-in">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Selecione o Voluntário</label>
                                <SearchableSelect
                                    options={volunteers.map(v => ({ id: v.id, label: v.name }))}
                                    value={selectedVolunteerId}
                                    onChange={(val) => setSelectedVolunteerId(val)}
                                    placeholder="Digite para buscar o voluntário..."
                                    className="w-full md:w-1/2"
                                />
                            </div>
                        )}

                        {volunteerReportType !== 'specialty' && volunteerReportType !== 'lgpd_term' && (
                            <>
                                <h4 className="font-semibold text-slate-700 mb-4">Selecione as colunas para o relatório:</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {Object.entries(volunteerFields).map(([key, val]) => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border border-slate-200 hover:border-green-300 transition-colors">
                                            <input type="checkbox" checked={val} onChange={() => setVolunteerFields({ ...volunteerFields, [key]: !val })} className="w-4 h-4 text-green-600 rounded focus:ring-green-600" />
                                            <span className="capitalize text-slate-700">
                                                {key === 'name' ? 'Nome' :
                                                    key === 'availability' ? 'Disponibilidade' :
                                                        key === 'specialty' ? 'Especialidade' :
                                                            key === 'phone' ? 'Telefone' :
                                                                key === 'birth_date' ? 'Data de Nascimento' : key}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-3">
                            {volunteerReportType === 'lgpd_term' ? (
                                <button onClick={() => handleGenerateVolunteerReport('pdf')} className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition-colors font-bold shadow-lg shadow-purple-200">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                    Gerar Termo de Consentimento
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => handleGenerateVolunteerReport('excel')} className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl hover:bg-green-100 transition-colors font-semibold">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        Excel
                                    </button>
                                    <button onClick={() => handleGenerateVolunteerReport('pdf')} className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors font-semibold">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        PDF
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Relatórios de Consultas */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button
                    onClick={() => toggleSection('appointments')}
                    className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-slate-800">Relatórios de Consultas</h3>
                            <p className="text-sm text-slate-500">Agendamentos, histórico e estatísticas.</p>
                        </div>
                    </div>
                    <svg className={`w-6 h-6 text-slate-400 transition-transform ${openSection === 'appointments' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {openSection === 'appointments' && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Report Type Selection */}
                        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="apptReportType"
                                    value="scheduled"
                                    checked={apptReportType === 'scheduled'}
                                    onChange={() => setApptReportType('scheduled')}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-slate-700 font-medium">Consultas Agendadas</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="apptReportType"
                                    value="completed"
                                    checked={apptReportType === 'completed'}
                                    onChange={() => setApptReportType('completed')}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-slate-700 font-medium">Consultas Realizadas</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="apptReportType"
                                    value="daily_specialty"
                                    checked={apptReportType === 'daily_specialty'}
                                    onChange={() => setApptReportType('daily_specialty')}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-slate-700 font-medium">Quantitativo por Especialidade</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="apptReportType"
                                    value="history"
                                    checked={apptReportType === 'history'}
                                    onChange={() => setApptReportType('history')}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-slate-700 font-medium">Prontuário de Paciente</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="apptReportType"
                                    value="prescription"
                                    checked={apptReportType === 'prescription'}
                                    onChange={() => setApptReportType('prescription')}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-slate-700 font-medium">Receita Médica</span>
                            </label>
                        </div>

                        {/* Filters */}
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Date Range for Scheduled/Completed/Daily */}
                            {(apptReportType === 'scheduled' || apptReportType === 'completed' || apptReportType === 'daily_specialty') && (
                                <div className="p-4 bg-white rounded-lg border border-slate-100">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Período</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                        <span className="self-center text-slate-400">até</span>
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Patient Select for Scheduled/Completed (Optional) OR History/Prescription (Required) */}
                            {apptReportType !== 'daily_specialty' && (
                                <div className="p-4 bg-white rounded-lg border border-slate-100">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        {(apptReportType === 'history' || apptReportType === 'prescription') ? 'Selecione o Paciente (Obrigatório)' : 'Filtrar por Paciente (Opcional)'}
                                    </label>
                                    <select
                                        value={selectedPatientId}
                                        onChange={(e) => setSelectedPatientId(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">Selecione...</option>
                                        {patients.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Columns Selection (Only for Appointment Lists, fixed for Records) */}
                        {(apptReportType === 'scheduled' || apptReportType === 'completed') && (
                            <>
                                <h4 className="font-semibold text-slate-700 mb-4">Selecione as colunas:</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {Object.entries(commFields).map(([key, val]) => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors">
                                            <input type="checkbox" checked={val} onChange={() => setCommFields({ ...commFields, [key]: !val })} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-600" />
                                            <span className="capitalize text-slate-700">
                                                {key === 'date' ? 'Data/Hora' :
                                                    key === 'patient' ? 'Paciente' :
                                                        key === 'volunteer' ? 'Profissional' :
                                                            key === 'notes' ? 'Anotações' : key}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-3">
                            <button onClick={() => handleGenerateAppointmentReport('excel')} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors font-semibold">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Excel
                            </button>
                            <button onClick={() => handleGenerateAppointmentReport('pdf')} className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors font-semibold">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                PDF
                            </button>
                        </div>
                    </div>
                )}            </div>

            {/* Relatórios Financeiros */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button
                    onClick={() => toggleSection('financial')}
                    className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-slate-800">Relatórios Financeiros</h3>
                            <p className="text-sm text-slate-500">Entradas, saídas e balanços.</p>
                        </div>
                    </div>
                    <svg className={`w-6 h-6 text-slate-400 transition-transform ${openSection === 'financial' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {openSection === 'financial' && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Type Selection */}
                        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="financialReportType"
                                    value="detailed"
                                    checked={financialReportType === 'detailed'}
                                    onChange={() => setFinancialReportType('detailed')}
                                    className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                                />
                                <span className="text-slate-700 font-medium">Extrato Detalhado</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="financialReportType"
                                    value="summary"
                                    checked={financialReportType === 'summary'}
                                    onChange={() => setFinancialReportType('summary')}
                                    className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                                />
                                <span className="text-slate-700 font-medium">Resumo (Fechamento de Caixa)</span>
                            </label>
                        </div>

                        {/* Date Range */}
                        <div className="mb-6">
                            <div className="p-4 bg-white rounded-lg border border-slate-100 inline-block">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Selecione o Período</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-yellow-500 outline-none text-sm"
                                    />
                                    <span className="self-center text-slate-400">até</span>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-yellow-500 outline-none text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => handleGenerateFinancialReport('excel')} className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl hover:bg-green-100 transition-colors font-semibold">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Excel
                            </button>
                            <button onClick={() => handleGenerateFinancialReport('pdf')} className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors font-semibold">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                PDF
                            </button>
                        </div>

                    </div>
                )}
            </div>





            {/* Modal de Impressão LGPD (Reutilizando Componente) */}
            {
                showConsentPrint && consentData && settings && (
                    <ConsentPrint
                        person={consentData.person}
                        type={consentData.type}
                        clinicName={settings.clinic_name}
                        onClose={() => setShowConsentPrint(false)}
                    />
                )
            }



            {/* Audit Logs Section (LGPD) - Visible to Admin and Staff */}
            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF') && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <button
                        onClick={() => toggleSection('audit')}
                        className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-bold text-slate-800">Relatórios de Logs (LGPD)</h3>
                                <p className="text-sm text-slate-500">Visualize o histórico de acesso e ações no sistema.</p>
                            </div>
                        </div>
                        <svg className={`w-6 h-6 text-slate-400 transition-transform ${openSection === 'audit' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {openSection === 'audit' && (
                        <div className="p-6 border-t border-slate-100 bg-slate-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <AuditLogViewer />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Reports;
