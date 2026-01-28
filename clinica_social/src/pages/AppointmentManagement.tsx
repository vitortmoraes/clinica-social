import React, { useState, useEffect } from 'react';
import { Appointment, Patient, Volunteer, AppointmentStatus, PaymentTable, PaymentMethod, TransactionType } from '../types';
import PaymentModal from '../components/PaymentModal';
import { api } from '../services/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, addMonths, subMonths, parse, addHours, isBefore, startOfToday, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentManagementProps {
  appointments: Appointment[];
  patients: Patient[];
  volunteers: Volunteer[];
  onAddAppointment: (appointment: Appointment) => void;
  onUpdateAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
}

const AppointmentManagement: React.FC<AppointmentManagementProps> = ({ appointments, patients, volunteers, onAddAppointment, onUpdateAppointment, onDeleteAppointment }) => {
  // Selection State
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [volunteerSearchTerm, setVolunteerSearchTerm] = useState('');

  // Next Appointments Filters
  const [searchTermVolunteer, setSearchTermVolunteer] = useState('');
  const [searchDate, setSearchDate] = useState('');

  // Edit State
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAppointment, setPaymentAppointment] = useState<Appointment | null>(null);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Data & Loading State
  const [paymentTables, setPaymentTables] = useState<PaymentTable[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTables = async () => {
      try {
        const tables = await api.getPaymentTables();
        setPaymentTables(tables);
      } catch (error) {
        console.error(error);
      }
    }
    loadTables();
  }, []);

  // --- Helpers ---
  const getPrice = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return 0;
    const table = paymentTables.find(t => t.id === patient.payment_table_id);
    return table ? table.value : 0;
  };

  const normalizeDay = (day: string) => day.trim().toLowerCase();

  const isDateAvailable = (date: Date) => {
    // Corrected check: ensure availability exists
    if (!selectedVolunteer || !selectedVolunteer.availability) return false;
    const dayOfWeekMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayString = dayOfWeekMap[getDay(date)];

    return selectedVolunteer.availability.some(a => normalizeDay(a.day) === normalizeDay(dayString));
  };

  interface Slot {
    time: string;
    status: 'available' | 'booked';
    appointment?: Appointment;
  }

  const getAllSlots = (): Slot[] => {
    if (!selectedVolunteer || !selectedDate) return [];
    if (!selectedVolunteer.availability) return [];

    const dayOfWeekMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayString = dayOfWeekMap[getDay(selectedDate)];

    const ranges = selectedVolunteer.availability.filter(a => normalizeDay(a.day) === normalizeDay(dayString));
    let slots: Slot[] = [];

    ranges.forEach(range => {
      let start = parse(range.start, 'HH:mm', selectedDate);
      let end = parse(range.end, 'HH:mm', selectedDate);
      let current = start;

      while (isBefore(current, end)) {
        const timeStr = format(current, 'HH:mm');

        // Find if there is an appointment
        const conflictingApp = appointments.find(app =>
          app.volunteer_id === selectedVolunteer.id &&
          app.date === format(selectedDate, 'yyyy-MM-dd') &&
          app.time === timeStr &&
          app.status === AppointmentStatus.SCHEDULED &&
          app.id !== editingAppointmentId
        );

        if (conflictingApp) {
          slots.push({ time: timeStr, status: 'booked', appointment: conflictingApp });
        } else {
          slots.push({ time: timeStr, status: 'available' });
        }

        current = addHours(current, 1);
      }
    });
    return slots.sort((a, b) => a.time.localeCompare(b.time));
  };

  const handleEdit = (app: Appointment) => {
    const vol = volunteers.find(v => v.id === app.volunteer_id);
    if (!vol) return;

    // Parse date correctly: '2023-11-25' -> Date object
    // Important: Use timezone neutral parsing or just manual extraction to avoid day shift
    const [y, m, d] = app.date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d); // Month is 0-indexed

    setSelectedVolunteer(vol);
    setSelectedDate(dateObj);
    setCurrentMonth(dateObj); // Move calendar to that month
    setSelectedTime(app.time);
    setSelectedPatientId(app.patient_id);
    setEditingAppointmentId(app.id);

    // Scroll to booking area
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleBookOrUpdate = async () => {
    if (!selectedVolunteer || !selectedDate || !selectedTime || !selectedPatientId) return;

    const price = getPrice(selectedPatientId);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    setLoading(true);
    try {
      if (editingAppointmentId) {
        const updatedApp: any = {
          id: editingAppointmentId,
          patient_id: selectedPatientId,
          volunteer_id: selectedVolunteer.id,
          date: dateStr,
          time: selectedTime,
          status: AppointmentStatus.SCHEDULED,
          notes: '',
          price: price
        };
        const updated = await api.updateAppointment(updatedApp);
        onUpdateAppointment(updated);
        alert('Agendamento atualizado!');
        resetForm(); // Just reset form, keep view
      } else {
        const newApp: any = {
          patient_id: selectedPatientId,
          volunteer_id: selectedVolunteer.id,
          date: dateStr,
          time: selectedTime,
          status: AppointmentStatus.SCHEDULED,
          notes: '',
          price: price
        };
        const created = await api.createAppointment(newApp);
        onAddAppointment(created);
        alert('Agendamento realizado!');
        resetForm();
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedTime('');
    setSelectedPatientId('');
    setEditingAppointmentId(null);
  };

  // Sorted upcoming appointments (next 10)
  // Sorted upcoming appointments (next 10 or filtered)
  const nextAppointments = appointments
    .filter(a => {
      // 1. Apply Vol Filter
      if (searchTermVolunteer) {
        const v = volunteers.find(vol => vol.id === a.volunteer_id);
        if (!v || !v.name.toLowerCase().includes(searchTermVolunteer.toLowerCase())) return false;
      }

      // 2. Apply Date Filter (Override Future/Status checks)
      if (searchDate) {
        return a.date === searchDate;
      }

      // 3. Default View: Upcoming & Scheduled/Pending
      const isFuture = isAfter(parse(a.date + ' ' + a.time, 'yyyy-MM-dd HH:mm', new Date()), new Date());
      // Show Scheduled, Not Started, In Progress. Hide Cancelled.
      const isValidStatus = [
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.NOT_STARTED,
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.CONFIRMED
      ].includes(a.status as any);

      return isFuture && isValidStatus;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  // .slice(0, 10); // Remove limit if searching? Or conditional slice.

  // Let's apply slice ONLY if no searchDate is active, to show full history for day.
  const displayAppointments = searchDate ? nextAppointments : nextAppointments.slice(0, 10);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* Top Section: Next Appointments */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Gestão de Consultas
        </h2>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Filtrar por nome do profissional..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={searchTermVolunteer}
              onChange={(e) => setSearchTermVolunteer(e.target.value)}
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <div className="relative">
            <input
              type="date"
              className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary outline-none text-slate-500"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          {(searchTermVolunteer || searchDate) && (
            <button onClick={() => { setSearchTermVolunteer(''); setSearchDate(''); }} className="text-sm text-red-500 hover:underline">
              Limpar
            </button>
          )}
        </div>

        {displayAppointments.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 text-slate-400 text-center text-sm">
            Nenhuma consulta futura agendada.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayAppointments.map(app => {
              const p = patients.find(show => show.id === app.patient_id);
              const v = volunteers.find(vol => vol.id === app.volunteer_id);
              return (
                <div key={app.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 group relative">
                  <div className="flex justify-between items-start">
                    <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {app.date.split('-').reverse().join('/')} • {app.time}
                    </span>

                    {/* Status Column (Payment + Appointment) */}
                    <div className="flex flex-col items-end gap-1">
                      {/* Payment Status */}
                      {/* Payment Status */}
                      {app.payment_status === 'PAID' && (
                        <div className="flex items-center gap-1">
                          <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-200 shadow-sm">
                            PAGO
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const txs = await api.getTransactions({ appointment_id: app.id });
                                if (txs.length > 0) {
                                  window.open(`/print/receipt/${txs[0].id}`, '_blank');
                                } else {
                                  alert('Recibo não encontrado.');
                                }
                              } catch (err) {
                                console.error(err);
                                alert('Erro ao abrir recibo.');
                              }
                            }}
                            className="text-green-600 hover:text-green-800 p-0.5 rounded transition-colors"
                            title="Imprimir Recibo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          </button>
                        </div>
                      )}
                      {app.payment_status === 'PARTIAL' && (
                        <div className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full border border-orange-200 shadow-sm">
                          PARCIAL
                        </div>
                      )}
                      {(!app.payment_status || app.payment_status === 'PENDING') && (
                        <div className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full border border-red-200 shadow-sm">
                          VALOR PENDENTE
                        </div>
                      )}

                      {/* Appointment Status */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border
                          ${app.status === 'finished' ? 'bg-green-50 text-green-700 border-green-100' :
                          app.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' :
                            'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {app.status === 'confirmed' ? 'PACIENTE CONFIRMADO' :
                          app.status === 'finished' ? 'FINALIZADO' :
                            app.status === 'in_progress' ? 'EM ANDAMENTO' :
                              app.status === 'not_started' ? 'NA FILA' : 'AGENDADO'}
                      </span>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm border border-slate-200">
                      {p?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">{p?.name}</p>
                      <p className="text-xs text-slate-500 font-medium">Dr(a). {v?.name}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-slate-50">

                    {/* WhatsApp Button */}
                    <button
                      onClick={() => {
                        const p = patients.find(pat => pat.id === app.patient_id);
                        const v = volunteers.find(vol => vol.id === app.volunteer_id);
                        if (!p || !p.whatsapp) return alert('Paciente sem telefone cadastrado.');

                        const phone = p.whatsapp.replace(/\D/g, '');
                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                        const baseUrl = window.location.origin;
                        const link = `${baseUrl}/confirmar-consulta/${app.id}`;
                        const msg = `Olá *${p.name.split(' ')[0]}*, aqui é da Clínica Cuidar! 🏥\n\nSua consulta com *${v?.name}* está agendada para *${app.date.split('-').reverse().join('/')}* às *${app.time}*.\n\nPor favor, confirme sua presença clicando no link abaixo:\n${link}`;

                        if (isMobile) {
                          window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                        } else {
                          window.open(`https://web.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(msg)}`, 'whatsapp-confirmation');
                        }
                      }}
                      className="w-full bg-green-50 text-green-700 text-xs font-bold py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                      title="Enviar confirmação via WhatsApp"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                      WhatsApp
                    </button>

                    <div className="flex gap-2">
                      {/* Payment Button */}
                      {(app.payment_status !== 'PAID' || ((app.amount_paid || 0) < (app.price || 0) - 0.1)) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentAppointment(app);
                            setShowPaymentModal(true);
                          }}
                          className={`flex-1 py-1.5 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs
                                        ${app.payment_status === 'PARTIAL' ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}
                                      `}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {app.payment_status === 'PARTIAL' && app.price
                            ? `Restante R$ ${Math.max(0, (app.price) - (app.amount_paid || 0)).toFixed(2)}`
                            : 'Pagar'}
                        </button>
                      ) : (
                        <div className="flex-1"></div>
                      )}

                      {/* Edit/Delete Buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(app)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Editar Agendamento"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
                              try {
                                await api.deleteAppointment(app.id);
                                onDeleteAppointment(app.id);
                                alert('Agendamento cancelado.');
                              } catch (e) { alert('Erro ao cancelar'); }
                            }
                          }}
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Cancelar Agendamento"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Print Buttons */}
                  {app.status === 'finished' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => window.open(`/print/record/${app.id}`, '_blank')}
                        className="flex-1 bg-slate-50 text-slate-600 hover:bg-green-50 hover:text-green-700 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 border border-slate-100"
                      >
                        <span>📄</span> Prontuário
                      </button>
                      <button
                        onClick={() => window.open(`/print/prescription/${app.id}`, '_blank')}
                        className="flex-1 bg-slate-50 text-slate-600 hover:bg-green-50 hover:text-green-700 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 border border-slate-100"
                      >
                        <span>💊</span> Receita
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Section: Split View - FIXED HEIGHT and SCROLL FIX */}
      <div className="flex gap-6 h-[600px] mt-6">

        {/* Left Column: Volunteers List - SCROLLABLE */}
        < div className="w-[30%] bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden" >
          <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex-shrink-0">
            <h3 className="font-bold text-slate-700 mb-2">Profissionais</h3>
            <input
              type="text"
              placeholder="Buscar profissional..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={volunteerSearchTerm}
              onChange={(e) => setVolunteerSearchTerm(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
            {volunteers
              .filter(v => v.active !== false)
              .filter(v => v.name.toLowerCase().includes(volunteerSearchTerm.toLowerCase()))
              .map(v => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVolunteer(v);
                    setSelectedDate(null);
                    setSelectedTime('');
                    setSelectedPatientId('');
                    setEditingAppointmentId(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 flex-shrink-0
                            ${selectedVolunteer?.id === v.id ? 'bg-primary text-white shadow-lg shadow-green-100' : 'hover:bg-slate-50 text-slate-600'}
                        `}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm flex-shrink-0 ${selectedVolunteer?.id === v.id ? 'bg-white/20 text-white' : 'bg-white border border-slate-100'}`}>
                    {v.photo ? <img src={v.photo} className="w-full h-full rounded-full object-cover" /> : '👨‍⚕️'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold truncate">{v.name}</p>
                    <p className={`text-xs truncate ${selectedVolunteer?.id === v.id ? 'text-white/80' : 'text-slate-400'}`}>{v.specialty}</p>
                  </div>
                </button>
              ))}
          </div>
        </div >

        {/* Right Column: Calendar & Booking - FIXED */}
        < div className="w-[70%] bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col relative overflow-hidden h-full" >
          {!selectedVolunteer ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-300">
              <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-lg font-medium">Selecione um profissional ao lado</p>
            </div>
          ) : (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Header: Volunteer Info */}
              <div className="flex justify-between items-end mb-6 pb-6 border-b border-slate-100 flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {editingAppointmentId ? `Editando Agendamento` : `Agenda de Dr(a). ${selectedVolunteer.name}`}
                  </h2>
                  <p className="text-slate-500 text-sm flex gap-2 mt-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{selectedVolunteer.specialty}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">CRM/CRO: {selectedVolunteer.license_number}</span>
                  </p>
                </div>
                {/* Month Navigation */}
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white rounded-md transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                  <span className="px-4 py-2 font-bold text-slate-700 min-w-[140px] text-center capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white rounded-md transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                </div>
              </div>

              <div className="flex gap-8 flex-1 overflow-hidden">
                {/* Calendar Grid */}
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                  <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide sticky top-0 bg-white z-10 py-1">
                    {weekDays.map(d => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: getDay(startOfMonth(currentMonth)) }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {daysInMonth.map((date, i) => {
                      const available = isDateAvailable(date);
                      const isBeforeToday = isBefore(date, startOfToday());
                      const isSelected = selectedDate && isSameDay(date, selectedDate);

                      return (
                        <button
                          key={i}
                          disabled={!available || isBeforeToday}
                          onClick={() => { setSelectedDate(date); setSelectedTime(''); }}
                          className={`
                                                aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all relative
                                                ${!isSameMonth(date, currentMonth) ? 'opacity-0 pointer-events-none' : ''}
                                                ${!available || isBeforeToday
                              ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                              : isSelected
                                ? 'bg-primary text-white shadow-lg shadow-green-200 scale-110 z-10'
                                : 'bg-green-50 text-green-700 hover:bg-green-100 hover:scale-105 cursor-pointer font-bold'}
                                            `}
                        >
                          {format(date, 'd')}
                          {available && !isBeforeToday && !isSelected && <span className="absolute bottom-1 w-1 h-1 bg-green-400 rounded-full"></span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Side Panel: Slots & Action */}
                <div className="w-[320px] bg-slate-50 rounded-2xl p-5 flex flex-col h-full overflow-hidden border border-slate-100">
                  {!selectedDate ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-4">
                      <p>Selecione um dia disponível no calendário</p>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300">
                      <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        Horários para {format(selectedDate, 'dd/MM')}
                      </h4>

                      {/* Slots List */}
                      <div className="grid grid-cols-3 gap-2 mb-6 flex-1 overflow-y-auto pr-2 content-start">
                        {getAllSlots().length > 0 ? getAllSlots().map(slot => (
                          <button
                            key={slot.time}
                            onClick={() => {
                              if (slot.status === 'available') {
                                setSelectedTime(slot.time);
                                setEditingAppointmentId(null);
                                setSelectedPatientId('');
                              } else if (slot.status === 'booked' && slot.appointment) {
                                handleEdit(slot.appointment);
                              }
                            }}
                            className={`py-2 rounded-lg text-sm font-semibold border transition-all relative overflow-hidden
                                ${slot.status === 'booked'
                                ? 'bg-red-50 border-red-100 text-red-500 cursor-pointer hover:bg-red-100' // Visual style for booked (interactive)
                                : selectedTime === slot.time
                                  ? 'bg-primary text-white border-primary shadow-md'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                              }
                              `}
                            title={slot.status === 'booked' ? `Agendado: ${patients.find(p => p.id === slot.appointment?.patient_id)?.name} (Clique para editar)` : 'Disponível'}
                          >
                            {slot.time}
                          </button>
                        )) : <p className="col-span-3 text-xs text-center text-red-400 font-medium">Agenda indisponível.</p>}
                      </div>

                      {/* Booking Form (Visible if time selected) */}
                      {selectedTime && (
                        <div className="mt-auto pt-6 border-t border-slate-200 space-y-4 animate-in fade-in slide-in-from-bottom-2 shrink-0">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Paciente</label>
                            <select
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary outline-none bg-white text-sm"
                              value={selectedPatientId}
                              onChange={e => setSelectedPatientId(e.target.value)}
                            >
                              <option value="">Selecione...</option>
                              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>

                          {selectedPatientId && (
                            <div className="bg-green-100 p-3 rounded-xl border border-green-200 text-center">
                              <p className="text-xs text-green-700 font-bold uppercase">Valor Social</p>
                              <p className="text-2xl font-black text-green-800">R$ {getPrice(selectedPatientId).toFixed(2)}</p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            {editingAppointmentId && (
                              <>
                                <button onClick={async () => {
                                  if (window.confirm('Excluir este agendamento?')) {
                                    try {
                                      setLoading(true);
                                      await api.deleteAppointment(editingAppointmentId);
                                      onDeleteAppointment(editingAppointmentId);
                                      alert('Agendamento excluído.');
                                      resetForm();
                                    } catch (e) { alert('Erro ao excluir'); } finally { setLoading(false); }
                                  }
                                }} type="button" className="px-4 py-3 bg-red-50 text-red-600 font-semibold hover:bg-red-100 rounded-xl transition-colors" title="Excluir Agendamento">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                                <button onClick={resetForm} className="flex-1 py-3 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl">
                                  Voltar
                                </button>
                              </>
                            )}
                            <button
                              disabled={!selectedPatientId || loading}
                              onClick={handleBookOrUpdate}
                              className="flex-[2] bg-primary text-white py-3 rounded-xl font-bold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-100 transition-all flex justify-center items-center gap-2"
                            >
                              {loading ? 'Salvando...' : (editingAppointmentId ? 'Atualizar' : 'Confirmar')}
                              {!loading && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div >
      </div >


      {/* Payment Modal */}
      {
        paymentAppointment && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setPaymentAppointment(null);
            }}
            appointment={paymentAppointment}
            patientName={patients.find(p => p.id === paymentAppointment.patient_id)?.name || 'Paciente'}
            onSuccess={(updatedApp) => {
              onUpdateAppointment(updatedApp);
            }}
          />
        )
      }
    </div >
  );
};

export default AppointmentManagement;
