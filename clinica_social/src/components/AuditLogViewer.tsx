import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface AuditLog {
    id: number;
    user_name: string;
    action: string;
    resource: string;
    details: string;
    timestamp: string;
    ip_address: string;
}

const AuditLogViewer: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const response = await api.getAuditLogs({
                start_date: dateRange.start || undefined,
                end_date: dateRange.end || undefined
            });
            setLogs(response);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const translateAction = (action: string) => {
        switch (action) {
            case 'POST':
            case 'CREATE':
                return { label: 'Criação', color: 'bg-green-100 text-green-700' };
            case 'PUT':
            case 'UPDATE':
                return { label: 'Edição', color: 'bg-blue-100 text-blue-700' };
            case 'DELETE':
            case 'DELETE (SOFT)':
                return { label: 'Exclusão', color: 'bg-red-100 text-red-700' };
            case 'GET': return { label: 'Visualização', color: 'bg-gray-100 text-gray-700' };
            case 'LOGIN': return { label: 'Login', color: 'bg-purple-100 text-purple-700' };
            default: return { label: action, color: 'bg-slate-100 text-slate-700' };
        }
    };

    const translateResource = (res: string) => {
        const map: Record<string, string> = {
            'patients': 'Pacientes',
            'volunteers': 'Voluntários',
            'users': 'Usuários',
            'medical-records': 'Prontuários',
            'financial': 'Financeiro',
            'api': 'Sistema',
            'auth': 'Autenticação'
        };
        return map[res] || res;
    };

    const formatDetails = (log: AuditLog) => {
        const { action, details, resource } = log;
        try {
            // Try to parse if it looks like JSON
            if (details && (details.startsWith('{') || details.startsWith('['))) {
                const parsed = JSON.parse(details);
                const name = parsed.name || 'Item';

                if (action === 'POST' || action === 'CREATE') {
                    return `Criou novo(a) ${name}`;
                }
                if (action === 'PUT' || action === 'UPDATE') {
                    if (parsed.name) {
                        return `Atualizou cadastro de ${parsed.name}`;
                    }
                    if (parsed.changes && Array.isArray(parsed.changes)) {
                        const changes = parsed.changes.join(', ');
                        return `Atualizou dados: ${changes}`;
                    }
                    return `Atualizou cadastro de ${name}`;
                }
                if (action === 'DELETE') {
                    return `Excluiu o registro de ${name}`;
                }

                if (parsed.name) return `Registro: ${parsed.name}`;

                // Fallback for other JSON
                if (parsed.changes) return `Alterações: ${parsed.changes}`;

                return JSON.stringify(parsed, null, 2);
            }

            // Clean up "Path: ..." logs (Middleware natural logs)
            if (details && details.startsWith('Path:')) {
                if (action === 'GET') return `Visualizou dados de ${resource}`;
                return `Acesso em ${resource}`;
            }

            return details || '-';
        } catch (e) {
            return details;
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.text("Relatório de Auditoria (LGPD) - Clínica Cuidar", 14, 15);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 22);

        const tableData = logs.map(log => [
            new Date(log.timestamp).toLocaleString('pt-BR'),
            log.user_name,
            translateAction(log.action).label,
            translateResource(log.resource),
            formatDetails(log)
        ]);

        autoTable(doc, {
            head: [['Data/Hora', 'Usuário', 'Ação', 'Recurso', 'Detalhes']],
            body: tableData,
            startY: 25,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [22, 101, 52] }, // Primary green color
            columnStyles: {
                0: { cellWidth: 40 }, // Data/Hora
                1: { cellWidth: 50 }, // Usuário
                2: { cellWidth: 30 }, // Ação
                3: { cellWidth: 30 }, // Recurso
                4: { cellWidth: 'auto' } // Detalhes (fills rest)
            }
        });

        doc.save('auditoria_lgpd.pdf');
    };

    const exportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(logs.map(log => ({
            'Data/Hora': new Date(log.timestamp).toLocaleString('pt-BR'),
            'Usuário': log.user_name,
            'Ação': translateAction(log.action).label,
            'Recurso': log.resource,
            'Detalhes': formatDetails(log)
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoria");
        XLSX.writeFile(workbook, "auditoria_lgpd.xlsx");
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4 flex-wrap">
                <h3 className="font-bold text-slate-700">Registros de Auditoria (LGPD)</h3>
                <div className="flex gap-2 items-center flex-wrap">
                    <input
                        type="date"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary"
                        value={dateRange.start}
                        onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <span className="text-slate-400">-</span>
                    <input
                        type="date"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary"
                        value={dateRange.end}
                        onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                    <button onClick={loadLogs} className="bg-primary hover:bg-green-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all ml-2">
                        Filtrar
                    </button>

                    <div className="h-6 w-px bg-slate-200 mx-1"></div>

                    <button onClick={exportPDF} className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border border-red-200" title="Exportar PDF">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        PDF
                    </button>
                    <button onClick={exportExcel} className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border border-green-200" title="Exportar Excel">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Excel
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                        <tr>
                            <th className="px-4 py-3">Data/Hora</th>
                            <th className="px-4 py-3">Usuário</th>
                            <th className="px-4 py-3">Ação</th>
                            <th className="px-4 py-3">Recurso</th>
                            <th className="px-4 py-3">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log) => {
                            const actionStyle = translateAction(log.action);
                            return (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-slate-600">
                                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{log.user_name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${actionStyle.color}`}>
                                            {actionStyle.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{translateResource(log.resource)}</td>
                                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={formatDetails(log)}>
                                        {formatDetails(log)}
                                    </td>
                                </tr>
                            );
                        })}
                        {logs.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                    Nenhum registro encontrado.
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                    Carregando registros...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogViewer;
