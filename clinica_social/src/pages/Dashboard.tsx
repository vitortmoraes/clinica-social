
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
// Fix: Added missing IncomeLevel import
import { Patient, Volunteer, Appointment } from '../types';
import { getDailyBriefing } from '../services/geminiService';

import { api } from '../services/api';

interface DashboardProps {
  patients: Patient[];
  volunteers: Volunteer[];
  appointments: Appointment[];
}

const Dashboard: React.FC<DashboardProps> = ({ patients, volunteers, appointments }) => {
  const [briefing, setBriefing] = useState<string>('Carregando mensagem do dia...');
  const [specialtiesCount, setSpecialtiesCount] = useState<number>(0);
  const [financialStats, setFinancialStats] = useState<any>(null);
  const [financialFilter, setFinancialFilter] = useState<'today' | 'month' | 'all'>('today');
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [showValues, setShowValues] = useState(false);
  const [birthdays, setBirthdays] = useState<any[]>([]); // New state for birthdays

  // Date filter for appointments list
  const [appointmentsDate, setAppointmentsDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Briefing still uses TODAY's appointments context
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppointments = appointments.filter(app => app.date === today);

  // Filtered list for display
  const displayAppointments = appointments.filter(app => app.date === appointmentsDate && app.volunteer_id);

  useEffect(() => {
    const fetchBriefing = async () => {
      const msg = await getDailyBriefing(todayAppointments, patients, volunteers);
      setBriefing(msg || '');
    };

    const fetchSpecialties = async () => {
      try {
        const specs = await api.getSpecialties();
        setSpecialtiesCount(specs.length);
      } catch (e) {
        console.error("Failed to fetch specialties count");
      }
    };

    const fetchBirthdays = async () => {
      try {
        const data = await api.getBirthdays();
        setBirthdays(data);
      } catch (e) {
        console.error("Failed to fetch birthdays");
      }
    };

    fetchBriefing();
    fetchSpecialties();
    fetchBirthdays();
  }, [patients, volunteers, appointments]); // Re-run if data props change? Currently app passes them from parent.

  useEffect(() => {
    const fetchFinancials = async () => {
      setLoadingFinancial(true);
      try {
        let start = undefined;
        let end = undefined;
        const now = new Date();

        if (financialFilter === 'today') {
          start = format(now, 'yyyy-MM-dd');
          end = start;
        } else if (financialFilter === 'month') {
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          start = format(firstDay, 'yyyy-MM-dd');
          end = format(lastDay, 'yyyy-MM-dd');
        } else if (financialFilter === 'all') {
          // For 'all', start and end remain undefined, fetching all data
        }

        const stats = await api.getStats(start, end);
        setFinancialStats(stats);
      } catch (error) {
        console.error("Error fetching financial stats", error);
      } finally {
        setLoadingFinancial(false);
      }
    };

    fetchFinancials();
  }, [financialFilter]);

  const stats = [
    { label: 'Total de Pacientes', value: patients.length, color: 'bg-blue-100 text-blue-700', icon: '👤' },
    { label: 'Voluntários Cadastrados', value: volunteers.length, color: 'bg-green-100 text-green-700', icon: '🤝' },
    { label: 'Consultas Hoje', value: todayAppointments.length, color: 'bg-green-100 text-green-700', icon: '📅' },
    { label: 'Especialidades', value: specialtiesCount, color: 'bg-purple-100 text-purple-700', icon: '🏥' },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Bom dia, Administrador!</h1>
          <p className="text-slate-500 mb-6 max-w-2xl">
            Bem-vindo ao painel de controle da Clínica Cuidar. Aqui você gerencia o amor em forma de atendimento.
          </p>
          <div className="bg-surface border-l-4 border-primary p-6 rounded-r-xl">
            <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.336 16.336a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM16.336 13.336a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414zM4.343 14.243a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707z" /></svg>
              Mensagem Inspiradora (IA)
            </h3>
            <p className="italic text-primary leading-relaxed">"{briefing}"</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-5">
          <svg className="w-64 h-64 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-2.75-.174l-.209-.025a1 1 0 00-1.151.798c-.186.76.591 1.447 1.341 1.258l.21-.025c1.458-.182 2.845-.593 4.148-1.213a.999.999 0 01.348-.124l7-3a1 1 0 00.394-1.714l-7 3a1 1 0 00-.787 0l-1.94-.832z" /></svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center text-xl`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Próximos Atendimentos</h2>
            <input
              type="date"
              value={appointmentsDate}
              onChange={(e) => setAppointmentsDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-4">
            {displayAppointments.length > 0 ? displayAppointments.map(app => {
              const patient = patients.find(p => p.id === app.patient_id);
              const volunteer = volunteers.find(v => v.id === app.volunteer_id);
              return (
                <div key={app.id} className="flex items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center border-2 border-indigo-100 text-indigo-700 font-bold text-lg shadow-sm">
                      {app.time}
                    </div>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex flex-col">
                      <p className="text-base font-bold text-slate-800 truncate">
                        {patient?.name || 'Paciente não encontrado'}
                      </p>
                      <div className="flex items-center text-sm text-slate-600 mt-0.5">
                        <span className="font-medium text-indigo-600 mr-2">
                          {volunteer?.specialty || 'Especialista'}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="ml-2 truncate">Dr(a). {volunteer?.name || 'Profissional não encontrado'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${app.status === 'completed' ? 'bg-green-100 text-green-700' :
                      app.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                      {app.status === 'completed' ? 'Concluído' :
                        app.status === 'cancelled' ? 'Cancelado' : 'Confirmado'}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <p className="text-slate-400 text-center py-10">Nenhuma consulta agendada para esta data.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">Distribuição de Renda</h2>
              <button
                onClick={() => setShowValues(!showValues)}
                className="text-slate-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-slate-100"
                title={showValues ? "Ocultar valores" : "Mostrar valores"}
              >
                {showValues ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                )}
              </button>
            </div>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setFinancialFilter('today')}
                className={`px-3 py-1 text-sm rounded-md transition-all ${financialFilter === 'today' ? 'bg-white shadow text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'}`}>
                Hoje
              </button>
              <button
                onClick={() => setFinancialFilter('month')}
                className={`px-3 py-1 text-sm rounded-md transition-all ${financialFilter === 'month' ? 'bg-white shadow text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'}`}>
                Mês
              </button>
              <button
                onClick={() => setFinancialFilter('all')}
                className={`px-3 py-1 text-sm rounded-md transition-all ${financialFilter === 'all' ? 'bg-white shadow text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'}`}>
                Total
              </button>
            </div>
          </div>

          {loadingFinancial ? (
            <div className="py-20 flex justify-center text-slate-400">Carregando dados...</div>
          ) : !financialStats ? (
            <p className="text-slate-500 text-center py-10">Não foi possível carregar os dados.</p>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-6 bg-green-50 rounded-2xl border border-green-100">
                <p className="text-sm text-green-600 font-medium mb-1">Valor em Caixa (Saldo)</p>
                <h3 className="text-4xl font-bold text-green-700">
                  {showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialStats.total_income) : 'R$ ••••••'}
                </h3>
                <p className="text-xs text-green-500 mt-2">{financialStats.transaction_count} movimentações no período</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Por Forma de Pagamento</h4>
                {Object.entries(financialStats.by_method || {}).length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhuma receita registrada no período.</p>
                ) : (
                  Object.entries(financialStats.by_method as Record<string, number>).map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 text-slate-600">
                          {method === 'PIX' ? '💠' : method === 'MONEY' ? '💵' : method === 'CARD' ? '💳' : '💰'}
                        </div>
                        <span className="font-medium text-slate-700 capitalize">
                          {method === 'MONEY' ? 'Dinheiro' : method === 'CARD' ? 'Cartão' : method}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800">
                        {showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount) : 'R$ ••••'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Birthdays Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">🎉</span>
            <h2 className="text-xl font-bold text-slate-800">Aniversariantes da Semana</h2>
          </div>
          <div className="space-y-3">
            {birthdays.length > 0 ? (
              birthdays.map((b) => (
                <div key={b.id} className={`flex items-center justify-between p-3 rounded-xl border ${b.is_today ? 'bg-pink-50 border-pink-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${b.is_today ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {b.formatted_date}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{b.name}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{b.type}</p>
                    </div>
                  </div>
                  {b.is_today && (
                    <span className="bg-pink-100 text-pink-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                      Hoje!
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">🎈</p>
                <p className="text-slate-400">Nenhum aniversariante nos próximos dias.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
