import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Scissors, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { MOCK_APPOINTMENTS, MOCK_CLIENTS, MOCK_SERVICES, MOCK_STAFF } from '../utils/mockData';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export default function Appointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFirebaseConfigured = firebaseAppletConfig.apiKey !== "TODO_KEYHERE" && firebaseAppletConfig.apiKey !== "";

  const [newAppointment, setNewAppointment] = useState({
    clientId: '',
    serviceId: '',
    staffId: '',
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: ''
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAppointments(MOCK_APPOINTMENTS);
      setClients(MOCK_CLIENTS);
      setServices(MOCK_SERVICES);
      setStaff(MOCK_STAFF);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'appointments'), orderBy('startTime', 'asc'));
    const unsubscribeApp = onSnapshot(q, (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
      setError(null);
    }, (err) => {
      setError('Error al cargar citas. Verifica tus permisos.');
      handleFirestoreError(err, OperationType.LIST, 'appointments');
    });

    const unsubscribeClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Clients loaded:', data.length);
      setClients(data);
      setError(null);
    }, (err) => {
      setError('Error al cargar clientes.');
      handleFirestoreError(err, OperationType.LIST, 'clients');
    });

    const unsubscribeServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Services loaded:', data.length);
      setServices(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'services'));

    const qStaff = query(collection(db, 'users'), where('role', 'in', ['admin', 'staff']));
    const unsubscribeStaff = onSnapshot(qStaff, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Staff loaded:', data.length);
      setStaff(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    return () => {
      unsubscribeApp();
      unsubscribeClients();
      unsubscribeServices();
      unsubscribeStaff();
    };
  }, []);

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === newAppointment.clientId);
    const service = services.find(s => s.id === newAppointment.serviceId);
    const staffMember = staff.find(s => s.id === newAppointment.staffId);

    const appointmentData = {
      ...newAppointment,
      clientName: client?.name || 'Cliente Desconocido',
      serviceName: service?.name || 'Servicio Desconocido',
      staffName: staffMember?.displayName || 'Personal Desconocido',
      totalPrice: service?.price || 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseConfigured) {
      // Demo mode: update local state
      setAppointments(prev => [...prev, { id: 'demo-' + Date.now(), ...appointmentData }]);
      setIsModalOpen(false);
      setNewAppointment({
        clientId: '',
        serviceId: '',
        staffId: '',
        startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        notes: ''
      });
      return;
    }

    try {
      await addDoc(collection(db, 'appointments'), appointmentData);
      setIsModalOpen(false);
      setNewAppointment({
        clientId: '',
        serviceId: '',
        staffId: '',
        startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        notes: ''
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'appointments');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (!isFirebaseConfigured) {
      setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app));
      return;
    }

    try {
      await updateDoc(doc(db, 'appointments', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const sendReminder = async (app: any) => {
    if (!isFirebaseConfigured) {
      alert('Recordatorio enviado (Modo Demo): ' + app.clientName);
      return;
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        appointmentId: app.id,
        clientName: app.clientName,
        type: 'reminder',
        method: 'email',
        status: 'sent',
        message: `Hola ${app.clientName}, te recordamos tu cita para ${app.serviceName} hoy a las ${format(new Date(app.startTime), 'HH:mm')}.`,
        createdAt: new Date().toISOString()
      });
      alert('Recordatorio enviado con éxito.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'notifications');
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 1 })
  });

  const filteredAppointments = appointments.filter(app => isSameDay(new Date(app.startTime), selectedDate));

  return (
    <div className="space-y-6">
      {!isFirebaseConfigured && (
        <div className="p-4 bg-gold/10 border border-gold/20 rounded-xl text-gold text-xs text-center mb-6">
          Modo Demo Activo: Conecta Firebase para guardar citas permanentemente.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light text-ink">Agenda de Citas</h2>
          <p className="text-xs text-muted uppercase tracking-widest mt-1">Gestión de servicios y horarios</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-elegant-fill flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Cita
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}      {/* Calendar Header */}
      <div className="bg-card-bg border border-border rounded-xl p-6 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="p-2 hover:bg-border rounded-full transition-colors text-gold"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-medium text-ink min-w-[200px] text-center capitalize">
              {format(weekDays[0], 'd MMM', { locale: es })} - {format(weekDays[6], 'd MMM yyyy', { locale: es })}
            </h3>
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="p-2 hover:bg-border rounded-full transition-colors text-gold"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-1 bg-dark-bg p-1 rounded-lg border border-border">
            <button 
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 text-[10px] font-bold text-gold hover:bg-border rounded-md transition-all uppercase tracking-widest"
            >
              Hoy
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="min-w-[900px] grid grid-cols-7 gap-4">
            {weekDays.map((day, i) => {
              const isToday = isSameDay(day, new Date());
              const dayAppointments = appointments.filter(app => isSameDay(new Date(app.startTime), day));

              return (
                <div key={i} className="flex flex-col">
                  <div className={cn(
                    "text-center p-3 rounded-xl border mb-4 sticky top-0 z-10",
                    isToday ? "bg-gold border-gold text-black shadow-lg" : "bg-dark-bg border-border text-secondary"
                  )}>
                    <span className="text-[10px] font-medium uppercase mb-1 tracking-tighter block">{format(day, 'EEEE', { locale: es })}</span>
                    <span className={cn("text-xl font-bold")}>{format(day, 'd')}</span>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    {loading ? (
                      <div className="flex justify-center p-4">
                        <Clock className="w-6 h-6 animate-spin text-border" />
                      </div>
                    ) : dayAppointments.length === 0 ? (
                      <div className="text-center py-4 text-muted text-xs border border-dashed border-border rounded-xl">Sin citas</div>
                    ) : (
                      dayAppointments.map((app) => (
                        <div key={app.id} className="group relative p-3 rounded-xl border border-border bg-stat-bg hover:border-gold/50 transition-all flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-ink">{format(new Date(app.startTime), 'HH:mm')}</p>
                            <span className={cn(
                              "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest",
                              app.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' :
                              app.status === 'confirmed' ? 'bg-gold/20 text-gold' :
                              app.status === 'cancelled' ? 'bg-rose-500/20 text-rose-500' :
                              'bg-secondary/20 text-secondary'
                            )}>
                              {app.status === 'pending' ? 'Pdte' : app.status.substring(0,4)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-ink text-xs line-clamp-1 truncate">{app.clientName}</p>
                            <p className="text-[10px] text-muted line-clamp-1 truncate">{app.serviceName}</p>
                          </div>
                          
                          {/* Actions overlay */}
                          <div className="absolute inset-0 bg-card-bg/95 backdrop-blur-sm rounded-xl border border-gold/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                             {app.status !== 'completed' && app.status !== 'cancelled' ? (
                               <div className="flex gap-1">
                                 <button onClick={() => sendReminder(app)} className="p-1.5 hover:bg-gold/20 text-gold rounded-md" title="Recordatorio"><Clock className="w-4 h-4"/></button>
                                 <button onClick={() => updateStatus(app.id, 'completed')} className="p-1.5 hover:bg-emerald-500/20 text-emerald-500 rounded-md" title="Completar"><CheckCircle2 className="w-4 h-4"/></button>
                                 <button onClick={() => updateStatus(app.id, 'cancelled')} className="p-1.5 hover:bg-rose-500/20 text-rose-500 rounded-md" title="Cancelar"><XCircle className="w-4 h-4"/></button>
                               </div>
                             ) : (
                               <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                                 {app.status}
                               </span>
                             )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Nueva Cita */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card-bg border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-medium text-gold">Nueva Cita</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-ink">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddAppointment} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Cliente</label>
                <select 
                  required
                  value={newAppointment.clientId}
                  onChange={(e) => setNewAppointment({...newAppointment, clientId: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                >
                  <option value="">{clients.length === 0 ? 'No hay clientes registrados' : 'Seleccionar cliente'}</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {clients.length === 0 && (
                  <p className="text-[9px] text-rose-500 mt-1 uppercase tracking-widest">Debes agregar clientes primero</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Servicio</label>
                <select 
                  required
                  value={newAppointment.serviceId}
                  onChange={(e) => setNewAppointment({...newAppointment, serviceId: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                >
                  <option value="">{services.length === 0 ? 'No hay servicios registrados' : 'Seleccionar servicio'}</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} (${s.price})</option>)}
                </select>
                {services.length === 0 && (
                  <p className="text-[9px] text-rose-500 mt-1 uppercase tracking-widest">Debes agregar servicios primero</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Especialista</label>
                <select 
                  required
                  value={newAppointment.staffId}
                  onChange={(e) => setNewAppointment({...newAppointment, staffId: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                >
                  <option value="">{staff.length === 0 ? 'No hay especialistas registrados' : 'Seleccionar especialista'}</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
                </select>
                {staff.length === 0 && (
                  <p className="text-[9px] text-rose-500 mt-1 uppercase tracking-widest">No se encontraron usuarios con rol admin/staff</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Fecha y Hora</label>
                <input 
                  type="datetime-local"
                  required
                  value={newAppointment.startTime}
                  onChange={(e) => setNewAppointment({...newAppointment, startTime: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Notas</label>
                <textarea 
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors h-24 resize-none"
                  placeholder="Instrucciones especiales..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn-elegant"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 btn-elegant-fill"
                >
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function cn_local(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
