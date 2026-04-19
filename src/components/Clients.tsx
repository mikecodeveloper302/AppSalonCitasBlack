import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  Mail, 
  History, 
  Edit2, 
  Trash2, 
  Download,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MOCK_CLIENTS } from '../utils/mockData';
import { View } from '../App';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export default function Clients({ setView }: { setView: (view: View) => void }) {
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFirebaseConfigured = firebaseAppletConfig.apiKey !== "TODO_KEYHERE" && firebaseAppletConfig.apiKey !== "";

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setClients(MOCK_CLIENTS);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'clients'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
      setError(null);
    }, (err) => {
      setError('Error al cargar clientes. Verifica tus permisos.');
      handleFirestoreError(err, OperationType.LIST, 'clients');
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      if (editingClient) {
        setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...formData } : c));
      } else {
        setClients(prev => [...prev, { id: 'demo-' + Date.now(), ...formData, createdAt: new Date().toISOString() }]);
      }
      closeModal();
      return;
    }

    try {
      if (editingClient) {
        await updateDoc(doc(db, 'clients', editingClient.id), formData);
      } else {
        await addDoc(collection(db, 'clients'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      closeModal();
    } catch (err) {
      handleFirestoreError(err, editingClient ? OperationType.UPDATE : OperationType.CREATE, 'clients');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    if (!isFirebaseConfigured) {
      setClients(prev => prev.filter(c => c.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `clients/${id}`);
    }
  };

  const exportClients = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Nombre,Email,Telefono,Notas\n"
      + clients.map(c => `${c.name},${c.email},${c.phone},${c.notes}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clientes_glow_salon.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openModal = (client: any = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        notes: client.notes || ''
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', email: '', phone: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light text-ink">Clientes e Historial</h2>
          <p className="text-xs text-muted uppercase tracking-widest mt-1">Gestión de base de datos de clientes</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportClients}
            className="btn-elegant flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button 
            onClick={() => openModal()}
            className="btn-elegant-fill flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="bg-card-bg border border-border rounded-xl p-6">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-bg border border-border rounded-lg pl-12 pr-4 py-3 text-sm text-ink focus:border-gold outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="group bg-stat-bg p-6 rounded-xl border border-border hover:border-gold/50 transition-all relative">
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openModal(client)}
                  className="p-1.5 hover:bg-gold/10 text-gold rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(client.id)}
                  className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-dark-bg rounded-full flex items-center justify-center text-gold border border-border">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-medium text-ink">{client.name}</h3>
                  <p className="text-[10px] text-muted uppercase tracking-widest">Desde {format(new Date(client.createdAt), 'MMM yyyy', { locale: es })}</p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <Phone className="w-4 h-4 text-muted" />
                  {client.phone || 'Sin teléfono'}
                </div>
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <Mail className="w-4 h-4 text-muted" />
                  {client.email || 'Sin email'}
                </div>
              </div>

              <div className="flex gap-2 border-t border-border pt-4">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-dark-bg hover:bg-border text-gold rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">
                  <History className="w-4 h-4" />
                  Historial
                </button>
                <button 
                  onClick={() => setView('dashboard')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Agendar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card-bg border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-medium text-gold">
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button onClick={closeModal} className="text-muted hover:text-ink">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Nombre Completo</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  placeholder="Ej: Ana García"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Correo Electrónico</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  placeholder="ana@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Teléfono</label>
                <input 
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Notas / Preferencias</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors h-24 resize-none"
                  placeholder="Alergias, preferencias de color, etc."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 btn-elegant"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 btn-elegant-fill"
                >
                  {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
