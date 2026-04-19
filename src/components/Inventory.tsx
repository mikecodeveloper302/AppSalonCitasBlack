import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  XCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MOCK_PRODUCTS } from '../utils/mockData';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isFirebaseConfigured = firebaseAppletConfig.apiKey !== "TODO_KEYHERE" && firebaseAppletConfig.apiKey !== "";

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    minStock: 5,
    description: ''
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setProducts(MOCK_PRODUCTS);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...formData } : p));
      } else {
        setProducts(prev => [...prev, { id: 'demo-' + Date.now(), ...formData, createdAt: new Date().toISOString() }]);
      }
      closeModal();
      return;
    }

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), formData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      closeModal();
    } catch (err) {
      handleFirestoreError(err, editingProduct ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    if (!isFirebaseConfigured) {
      setProducts(prev => prev.filter(p => p.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const openModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        minStock: product.minStock,
        description: product.description
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: '', price: 0, stock: 0, minStock: 5, description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light text-ink">Inventario</h2>
          <p className="text-xs text-muted uppercase tracking-widest mt-1">Gestión de productos y control de stock</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="btn-elegant-fill flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card-bg border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-dark-bg text-gold rounded-lg border border-border">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Total Productos</p>
            <p className="text-2xl font-medium text-ink">{products.length}</p>
          </div>
        </div>
        <div className="bg-card-bg border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Stock Bajo</p>
            <p className="text-2xl font-medium text-ink">{lowStockProducts.length}</p>
          </div>
        </div>
        <div className="bg-card-bg border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Valor Inventario</p>
            <p className="text-2xl font-medium text-ink">
              ${products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card-bg border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-bg border border-border rounded-lg pl-12 pr-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <select className="bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-gold uppercase tracking-widest outline-none">
              <option>Todas las categorías</option>
              <option>Cabello</option>
              <option>Uñas</option>
              <option>Piel</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-dark-bg text-muted text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-stat-bg transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-dark-bg rounded-lg flex items-center justify-center text-muted border border-border">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-ink">{product.name}</p>
                        <p className="text-[10px] text-muted truncate max-w-[200px] italic">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-dark-bg text-secondary border border-border rounded-lg text-[10px] font-bold uppercase tracking-widest">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-ink">
                    ${product.price}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-bold",
                        product.stock <= product.minStock ? "text-rose-500" : "text-ink"
                      )}>
                        {product.stock}
                      </span>
                      <span className="text-muted text-[10px] uppercase tracking-widest">unid.</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {product.stock <= product.minStock ? (
                      <span className="flex items-center gap-1.5 text-rose-500 text-[10px] font-bold uppercase tracking-widest">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        STOCK BAJO
                      </span>
                    ) : (
                      <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">DISPONIBLE</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openModal(product)}
                        className="p-2 hover:bg-gold/10 text-gold rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card-bg border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-medium text-gold">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={closeModal} className="text-muted hover:text-ink">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Nombre del Producto</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                    placeholder="Ej: Shampoo Hidratante"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Categoría</label>
                  <select 
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Cabello">Cabello</option>
                    <option value="Uñas">Uñas</option>
                    <option value="Piel">Piel</option>
                    <option value="Maquillaje">Maquillaje</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Precio Venta</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Stock Actual</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Stock Mínimo</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({...formData, minStock: Number(e.target.value)})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Descripción</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors h-24 resize-none"
                    placeholder="Detalles del producto..."
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
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
