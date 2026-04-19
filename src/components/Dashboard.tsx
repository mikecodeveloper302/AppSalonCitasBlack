import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { seedDatabase } from '../utils/seed';
import { MOCK_APPOINTMENTS, MOCK_CLIENTS, MOCK_SERVICES } from '../utils/mockData';
import { View } from '../App';
import firebaseAppletConfig from '../../firebase-applet-config.json';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard({ setView }: { setView: (view: View) => void }) {
  const [stats, setStats] = useState({
    totalClients: 0,
    appointmentsToday: 0,
    revenueMonth: 0,
    lowStock: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFirebaseConfigured = firebaseAppletConfig.apiKey !== "TODO_KEYHERE" && firebaseAppletConfig.apiKey !== "";

  const handleSeed = async () => {
    if (!isFirebaseConfigured) {
      alert('El sembrado de base de datos no está disponible en Modo Demo. Conecta Firebase para usar esta función.');
      return;
    }
    setSeeding(true);
    const success = await seedDatabase();
    if (success) {
      alert('Base de datos inicializada con éxito.');
      window.location.reload();
    } else {
      alert('La base de datos ya tiene información o hubo un error.');
    }
    setSeeding(false);
  };

  useEffect(() => {
    async function fetchStats() {
      if (!isFirebaseConfigured) {
        setStats({
          totalClients: MOCK_CLIENTS.length,
          appointmentsToday: MOCK_APPOINTMENTS.length,
          revenueMonth: 1250.50,
          lowStock: 2
        });
        setRecentAppointments(MOCK_APPOINTMENTS);
        setLoading(false);
        return;
      }

      try {
        const clientsSnap = await getDocs(collection(db, 'clients'));
        const today = new Date();
        today.setHours(0,0,0,0);
        const appointmentsSnap = await getDocs(query(
          collection(db, 'appointments'),
          where('startTime', '>=', today.toISOString())
        ));
        const productsSnap = await getDocs(collection(db, 'products'));
        const lowStockCount = productsSnap.docs.filter(doc => doc.data().stock <= doc.data().minStock).length;

        setStats({
          totalClients: clientsSnap.size,
          appointmentsToday: appointmentsSnap.size,
          revenueMonth: 1250.50,
          lowStock: lowStockCount
        });

        const recentSnap = await getDocs(query(
          collection(db, 'appointments'),
          orderBy('startTime', 'desc'),
          limit(5)
        ));
        setRecentAppointments(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Error al cargar estadísticas. Verifica tu conexión y permisos.');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-ink">Resumen del Salón</h2>
          <p className="text-xs text-muted uppercase tracking-widest mt-1">Métricas clave y actividad reciente</p>
        </div>
        <button 
          onClick={handleSeed}
          disabled={seeding}
          className="btn-elegant text-[10px] py-2"
        >
          {seeding ? 'Inicializando...' : 'Cargar Datos de Prueba'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs flex items-center gap-2 mb-6">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agenda Card */}
        <div className="lg:col-span-2 bg-card-bg border border-border rounded-xl p-6">
          <div className="card-title-style">
            <span>Agenda del Día</span>
            <span 
              onClick={() => setView('dashboard')}
              className="text-gold cursor-pointer hover:underline text-[10px]"
            >
              Ver Calendario Completo &rarr;
            </span>
          </div>
          <div className="space-y-1">
            {recentAppointments.length > 0 ? (
              recentAppointments.map((app) => (
                <div key={app.id} className="flex items-center py-4 border-b border-border last:border-0 hover:bg-stat-bg/50 px-2 rounded-lg transition-colors">
                  <div className="w-16 text-gold font-medium text-sm">
                    {format(new Date(app.startTime), 'HH:mm')}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink">{app.clientName}</div>
                    <div className="text-[10px] text-muted uppercase tracking-widest italic">{app.serviceName}</div>
                  </div>
                  <div className="text-[10px] px-2.5 py-1 rounded-full bg-dark-bg border border-border text-secondary uppercase tracking-widest font-bold">
                    {app.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted text-xs uppercase tracking-widest italic">
                No hay citas registradas para hoy
              </div>
            )}
          </div>
        </div>

        {/* Stats and Promo Card */}
        <div className="space-y-6">
          <div className="bg-card-bg border border-border rounded-xl p-6">
            <div className="card-title-style">Resumen Financiero</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-bg p-4 rounded-lg border border-border border-l-gold border-l-2">
                <div className="text-2xl font-light text-ink">${stats.revenueMonth}</div>
                <div className="text-[10px] text-muted uppercase tracking-widest font-bold">Ventas Mes</div>
              </div>
              <div className="bg-dark-bg p-4 rounded-lg border border-border border-l-gold border-l-2">
                <div className="text-2xl font-light text-ink">112.20</div>
                <div className="text-[10px] text-muted uppercase tracking-widest font-bold">Gastos</div>
              </div>
            </div>

            <div className="card-title-style mt-8 border-none">Promoción Activa</div>
            <div className="bg-gradient-to-br from-dark-bg to-card-bg border border-dashed border-gold/50 p-4 rounded-lg">
              <p className="text-[10px] font-bold text-gold uppercase tracking-widest mb-1">Flash Sale:</p>
              <p className="text-xs text-ink">20% en tratamientos capilares los martes.</p>
              <span className="text-[10px] text-muted mt-2 block uppercase tracking-widest">Expira en 3 días</span>
            </div>
          </div>

          <div className="bg-card-bg border border-border rounded-xl p-6">
            <div className="card-title-style">Acciones Rápidas</div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setView('dashboard')} className="btn-elegant-fill">Nueva Cita</button>
              <button onClick={() => setView('billing')} className="btn-elegant">Emitir Factura</button>
              <button onClick={() => setView('billing')} className="btn-elegant">Registrar Pago</button>
              <button onClick={() => setView('clients')} className="btn-elegant">Nuevo Cliente</button>
              <button onClick={() => setView('stats')} className="btn-elegant">Gasto Extra</button>
              <button onClick={() => setView('stats')} className="btn-elegant">Enviar Notifs.</button>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] text-muted uppercase tracking-widest">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
              14 recordatorios automáticos para mañana
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Alert Card */}
      <div className="bg-card-bg border border-border rounded-xl p-6">
        <div className="card-title-style">Alertas de Inventario</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4">
          {stats.lowStock > 0 ? (
            <div className="flex justify-between items-center text-xs border-b border-border pb-2">
              <span className="text-ink uppercase tracking-widest">Productos con stock bajo</span>
              <span className="text-rose-500 font-bold uppercase tracking-widest">{stats.lowStock} ítems</span>
            </div>
          ) : (
            <div className="text-xs text-muted uppercase tracking-widest italic">Todo el inventario está al día</div>
          )}
        </div>
        <button className="btn-elegant w-full mt-6 text-[10px] uppercase tracking-widest">Generar Orden de Compra</button>
      </div>
    </div>
  );
}
