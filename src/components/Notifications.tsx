import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Trash2,
  Send,
  RefreshCw
} from 'lucide-react';
import { format, isAfter, subHours, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFirebaseConfigured = firebaseAppletConfig.apiKey !== "TODO_KEYHERE" && firebaseAppletConfig.apiKey !== "";

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      setError('Error al cargar notificaciones.');
      handleFirestoreError(err, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, []);

  const handleSendAutomatedReminders = async () => {
    if (!isFirebaseConfigured) return;
    setSending(true);
    setError(null);

    try {
      // 1. Get appointments for the next 24-48 hours
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const appointmentsSnap = await getDocs(query(
        collection(db, 'appointments'),
        where('status', '==', 'confirmed'),
        where('startTime', '>=', now.toISOString()),
        where('startTime', '<=', tomorrow.toISOString())
      ));

      let sentCount = 0;
      for (const appDoc of appointmentsSnap.docs) {
        const app = appDoc.data();
        
        // Check if a notification already exists for this appointment
        const existingSnap = await getDocs(query(
          collection(db, 'notifications'),
          where('appointmentId', '==', appDoc.id),
          where('type', '==', 'reminder')
        ));

        if (existingSnap.empty) {
          // Create simulated notification
          await addDoc(collection(db, 'notifications'), {
            appointmentId: appDoc.id,
            clientName: app.clientName,
            type: 'reminder',
            method: 'email', // Default
            status: 'sent',
            message: `Hola ${app.clientName}, te recordamos tu cita para ${app.serviceName} mañana a las ${format(parseISO(app.startTime), 'HH:mm')}.`,
            createdAt: new Date().toISOString()
          });
          sentCount++;
        }
      }

      alert(`Se enviaron ${sentCount} recordatorios automáticos.`);
    } catch (err) {
      setError('Error al procesar recordatorios automáticos.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!isFirebaseConfigured) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `notifications/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light text-ink">Centro de Notificaciones</h2>
          <p className="text-xs text-muted uppercase tracking-widest mt-1">Recordatorios y comunicación con clientes</p>
        </div>
        <button 
          onClick={handleSendAutomatedReminders}
          disabled={sending}
          className="btn-elegant-fill flex items-center justify-center gap-2"
        >
          {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Procesar Recordatorios (24h)
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!isFirebaseConfigured && (
        <div className="p-8 text-center bg-gold/5 border border-dashed border-gold/20 rounded-xl">
          <Bell className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <p className="text-gold text-sm italic">El sistema de notificaciones requiere Firebase configurado.</p>
        </div>
      )}

      {isFirebaseConfigured && (
        <div className="bg-card-bg border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border bg-stat-bg/30">
            <h3 className="text-sm font-bold text-gold uppercase tracking-widest">Historial de Envíos</h3>
          </div>
          
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-20 flex justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-border" />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className="p-6 hover:bg-stat-bg/50 transition-colors flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border",
                      notif.status === 'sent' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-gold/10 border-gold/20 text-gold"
                    )}>
                      {notif.method === 'email' ? <Mail className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-ink">{notif.clientName}</p>
                        <span className="text-[10px] text-muted">•</span>
                        <span className="text-[10px] text-muted uppercase tracking-widest">
                          {format(parseISO(notif.createdAt), "d MMM, HH:mm", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm text-secondary mt-1">{notif.message}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3" />
                          Enviado vía {notif.method}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteNotification(notif.id)}
                    className="p-2 text-muted hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-20 text-center">
                <Clock className="w-12 h-12 text-muted mx-auto mb-4 opacity-20" />
                <p className="text-muted text-sm italic">No hay notificaciones enviadas recientemente.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card-bg border border-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-gold uppercase tracking-widest mb-4">Configuración de Canales</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold" />
                <div>
                  <p className="text-sm font-medium text-ink">Correo Electrónico</p>
                  <p className="text-[10px] text-muted uppercase tracking-widest">Activado</p>
                </div>
              </div>
              <div className="w-10 h-5 bg-gold rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-border opacity-50">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-muted" />
                <div>
                  <p className="text-sm font-medium text-ink">WhatsApp / SMS</p>
                  <p className="text-[10px] text-muted uppercase tracking-widest">Próximamente</p>
                </div>
              </div>
              <div className="w-10 h-5 bg-border rounded-full relative">
                <div className="absolute left-1 top-1 w-3 h-3 bg-muted rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card-bg border border-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-gold uppercase tracking-widest mb-4">Reglas de Automatización</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs text-secondary">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <p>Recordatorio automático 24 horas antes de la cita.</p>
            </div>
            <div className="flex items-start gap-3 text-xs text-secondary">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <p>Confirmación inmediata al agendar nueva cita.</p>
            </div>
            <div className="flex items-start gap-3 text-xs text-secondary">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <p>Agradecimiento 2 horas después de completar el servicio.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
