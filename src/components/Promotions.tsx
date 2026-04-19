import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Plus, 
  Tag, 
  Calendar, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { MOCK_PROMOTIONS } from '../utils/mockData';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export default function Promotions() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isFirebaseConfigured = firebaseAppletConfig.apiKey !== "TODO_KEYHERE" && firebaseAppletConfig.apiKey !== "";

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    active: true
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setPromotions(MOCK_PROMOTIONS);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'promotions'), orderBy('startDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPromotions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'promotions'));

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      if (editingPromo) {
        setPromotions(prev => prev.map(p => p.id === editingPromo.id ? { ...p, ...formData } : p));
      } else {
        setPromotions(prev => [...prev, { id: 'demo-' + Date.now(), ...formData, createdAt: new Date().toISOString() }]);
      }
      closeModal();
      return;
    }

    try {
      if (editingPromo) {
        await updateDoc(doc(db, 'promotions', editingPromo.id), formData);
      } else {
        await addDoc(collection(db, 'promotions'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      closeModal();
    } catch (err) {
      handleFirestoreError(err, editingPromo ? OperationType.UPDATE : OperationType.CREATE, 'promotions');
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    if (!isFirebaseConfigured) {
      setPromotions(prev => prev.map(p => p.id === id ? { ...p, active } : p));
      return;
    }

    try {
      await updateDoc(doc(db, 'promotions', id), { active });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `promotions/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;
    if (!isFirebaseConfigured) {
      setPromotions(prev => prev.filter(p => p.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'promotions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `promotions/${id}`);
    }
  };

  const openModal = (promo: any = null) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        name: promo.name,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        startDate: promo.startDate,
        endDate: promo.endDate,
        active: promo.active
      });
    } else {
      setEditingPromo(null);
      setFormData({
        name: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPromo(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light text-ink">Promociones</h2>
          <p className="text-xs text-muted uppercase tracking-widest mt-1">Crea ofertas especiales para atraer más clientes</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="btn-elegant-fill flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Promoción
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promo) => (
          <div key={promo.id} className={cn(
            "bg-card-bg p-6 rounded-xl border transition-all relative overflow-hidden",
            promo.active ? "border-gold/30 shadow-sm" : "border-border opacity-60"
          )}>
            {!promo.active && (
              <div className="absolute top-0 right-0 bg-dark-bg text-muted px-3 py-1 text-[10px] font-bold uppercase rounded-bl-lg border-l border-b border-border">
                Inactiva
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-dark-bg text-gold rounded-lg border border-border">
                <Tag className="w-6 h-6" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openModal(promo)} className="p-2 hover:bg-gold/10 text-gold rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(promo.id)} className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-medium text-ink mb-1">{promo.name}</h3>
            <p className="text-xs text-muted mb-4 line-clamp-2 italic">{promo.description}</p>

            <div className="bg-dark-bg p-4 rounded-lg border border-border mb-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Descuento</span>
                <span className="text-xl font-medium text-gold">
                  {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `$${promo.discountValue}`}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-[10px] text-muted uppercase tracking-widest">
                <Calendar className="w-3.5 h-3.5" />
                Desde: {format(new Date(promo.startDate), 'dd/MM/yyyy')}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5" />
                Hasta: {format(new Date(promo.endDate), 'dd/MM/yyyy')}
              </div>
            </div>

            <button 
              onClick={() => toggleActive(promo.id, !promo.active)}
              className={cn(
                "w-full py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                promo.active 
                  ? "bg-dark-bg border-border text-gold hover:border-gold/50" 
                  : "bg-gold border-gold text-black hover:bg-gold/90"
              )}
            >
              {promo.active ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ))}
      </div>

      {/* Modal Promoción */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card-bg border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-medium text-gold">
                {editingPromo ? 'Editar Promoción' : 'Nueva Promoción'}
              </h3>
              <button onClick={closeModal} className="text-muted hover:text-ink">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Nombre</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  placeholder="Ej: Especial de Verano"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Descripción</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors h-20 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Tipo Descuento</label>
                  <select 
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value as any})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Valor</label>
                  <input 
                    type="number"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: Number(e.target.value)})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Fecha Inicio</label>
                  <input 
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Fecha Fin</label>
                  <input 
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  />
                </div>
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
                  {editingPromo ? 'Guardar Cambios' : 'Crear Promoción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
