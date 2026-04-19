import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Plus, 
  Search, 
  Scissors, 
  Clock, 
  DollarSign, 
  Edit2, 
  Trash2, 
  XCircle,
  Tag
} from 'lucide-react';
import { MOCK_SERVICES } from '../utils/mockData';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export default function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isFirebaseConfigured = firebaseAppletConfig.apiKey !== "TODO_KEYHERE" && firebaseAppletConfig.apiKey !== "";

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 30,
    category: 'Corte'
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setServices(MOCK_SERVICES);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'services'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'services'));

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      if (editingService) {
        setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, ...formData } : s));
      } else {
        setServices(prev => [...prev, { id: 'demo-' + Date.now(), ...formData, createdAt: new Date().toISOString() }]);
      }
      closeModal();
      return;
    }

    try {
      if (editingService) {
        await updateDoc(doc(db, 'services', editingService.id), formData);
      } else {
        await addDoc(collection(db, 'services'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      closeModal();
    } catch (err) {
      handleFirestoreError(err, editingService ? OperationType.UPDATE : OperationType.CREATE, 'services');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;
    if (!isFirebaseConfigured) {
      setServices(prev => prev.filter(s => s.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `services/${id}`);
    }
  };

  const openModal = (service: any = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        price: service.price,
        duration: service.duration,
        category: service.category || 'Corte'
      });
    } else {
      setEditingService(null);
      setFormData({ name: '', description: '', price: 0, duration: 30, category: 'Corte' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light text-ink">Servicios y Precios</h2>
          <p className="text-xs text-muted uppercase tracking-widest mt-1">Catálogo de servicios del salón</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="btn-elegant-fill flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Servicio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="group bg-card-bg p-6 rounded-xl border border-border hover:border-gold/50 transition-all relative">
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => openModal(service)}
                className="p-1.5 hover:bg-gold/10 text-gold rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(service.id)}
                className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-dark-bg rounded-xl flex items-center justify-center text-gold border border-border">
                <Scissors className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-ink">{service.name}</h3>
                <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                  {service.category}
                </span>
              </div>
            </div>

            <p className="text-sm text-secondary mb-6 line-clamp-2 min-h-[40px]">
              {service.description || 'Sin descripción disponible.'}
            </p>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-center gap-2 text-muted">
                <Clock className="w-4 h-4" />
                <span className="text-xs">{service.duration} min</span>
              </div>
              <div className="flex items-center gap-1 text-gold font-serif italic text-xl">
                <span className="text-sm not-italic font-sans mr-1">$</span>
                {service.price}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Servicio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card-bg border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-medium text-gold">
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button onClick={closeModal} className="text-muted hover:text-ink">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Nombre del Servicio</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  placeholder="Ej: Corte de Dama"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Precio ($)</label>
                  <input 
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Duración (min)</label>
                  <input 
                    type="number"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Categoría</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                >
                  <option value="Corte">Corte</option>
                  <option value="Color">Color</option>
                  <option value="Peinado">Peinado</option>
                  <option value="Tratamiento">Tratamiento</option>
                  <option value="Manicure">Manicure</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Descripción</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors h-24 resize-none"
                  placeholder="Detalles del servicio..."
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
                  {editingService ? 'Guardar Cambios' : 'Crear Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
