import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Plus, 
  Receipt, 
  Search, 
  Download, 
  CreditCard, 
  Banknote, 
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { MOCK_INVOICES, MOCK_CLIENTS } from '../utils/mockData';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export default function Billing() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isFirebaseConfigured = firebaseAppletConfig.apiKey !== "TODO_KEYHERE" && firebaseAppletConfig.apiKey !== "";

  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    items: [{ description: '', price: 0 }],
    paymentMethod: 'cash' as 'cash' | 'card' | 'transfer',
    status: 'paid' as 'paid' | 'pending'
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setInvoices(MOCK_INVOICES);
      setClients(MOCK_CLIENTS);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'invoices'));

    async function fetchClients() {
      const snap = await getDocs(collection(db, 'clients'));
      setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    fetchClients();
    return () => unsubscribe();
  }, []);

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === newInvoice.clientId);
    const total = newInvoice.items.reduce((acc, item) => acc + item.price, 0);

    if (!isFirebaseConfigured) {
      setInvoices(prev => [{
        id: 'demo-' + Date.now(),
        ...newInvoice,
        clientName: client?.name || 'Cliente General',
        total,
        createdAt: new Date().toISOString()
      }, ...prev]);
      setIsModalOpen(false);
      setNewInvoice({
        clientId: '',
        items: [{ description: '', price: 0 }],
        paymentMethod: 'cash',
        status: 'paid'
      });
      return;
    }

    try {
      await addDoc(collection(db, 'invoices'), {
        ...newInvoice,
        clientName: client?.name || 'Cliente General',
        total,
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewInvoice({
        clientId: '',
        items: [{ description: '', price: 0 }],
        paymentMethod: 'cash',
        status: 'paid'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'invoices');
    }
  };

  const exportPDF = (invoice: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Glow Salon - Factura', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Factura #: ${invoice.id}`, 20, 40);
    doc.text(`Fecha: ${format(new Date(invoice.createdAt), 'dd/MM/yyyy HH:mm')}`, 20, 45);
    doc.text(`Cliente: ${invoice.clientName}`, 20, 50);
    doc.text(`Método de Pago: ${invoice.paymentMethod}`, 20, 55);

    const tableData = invoice.items.map((item: any) => [item.description, `$${item.price}`]);
    (doc as any).autoTable({
      startY: 65,
      head: [['Descripción', 'Precio']],
      body: tableData,
      foot: [['Total', `$${invoice.total}`]]
    });

    doc.save(`Factura_${invoice.id}.pdf`);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light text-ink">Facturación</h2>
          <p className="text-xs text-muted uppercase tracking-widest mt-1">Emisión de comprobantes y gestión de ventas</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-elegant-fill flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Venta
        </button>
      </div>

      <div className="bg-card-bg border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text"
              placeholder="Buscar por cliente o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-bg border border-border rounded-lg pl-12 pr-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-dark-bg text-muted text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">ID Factura</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-stat-bg transition-colors group">
                  <td className="px-6 py-4 font-mono text-[10px] text-muted">
                    #{inv.id.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 font-medium text-ink">
                    {inv.clientName}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted">
                    {format(new Date(inv.createdAt), 'dd MMM, HH:mm', { locale: es })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-secondary">
                      {inv.paymentMethod === 'cash' && <Banknote className="w-4 h-4 text-emerald-500" />}
                      {inv.paymentMethod === 'card' && <CreditCard className="w-4 h-4 text-gold" />}
                      {inv.paymentMethod === 'transfer' && <ArrowRightLeft className="w-4 h-4 text-amber-500" />}
                      <span className="text-[10px] font-bold uppercase tracking-widest">{inv.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-ink">
                    ${inv.total}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gold/10 text-gold'
                    )}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => exportPDF(inv)}
                      className="p-2 hover:bg-gold/10 text-gold rounded-lg transition-colors"
                      title="Descargar PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Venta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card-bg border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-medium text-gold flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Nueva Venta
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-ink">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddInvoice} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Cliente</label>
                <select 
                  required
                  value={newInvoice.clientId}
                  onChange={(e) => setNewInvoice({...newInvoice, clientId: e.target.value})}
                  className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-widest text-muted">Ítems / Servicios</label>
                  <button 
                    type="button"
                    onClick={() => setNewInvoice({...newInvoice, items: [...newInvoice.items, { description: '', price: 0 }]})}
                    className="text-[10px] font-bold text-gold hover:underline uppercase tracking-widest"
                  >
                    + Agregar Ítem
                  </button>
                </div>
                {newInvoice.items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input 
                      type="text"
                      required
                      placeholder="Descripción"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...newInvoice.items];
                        newItems[i].description = e.target.value;
                        setNewInvoice({...newInvoice, items: newItems});
                      }}
                      className="flex-1 bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                    />
                    <input 
                      type="number"
                      required
                      placeholder="Precio"
                      value={item.price}
                      onChange={(e) => {
                        const newItems = [...newInvoice.items];
                        newItems[i].price = Number(e.target.value);
                        setNewInvoice({...newInvoice, items: newItems});
                      }}
                      className="w-24 bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Método de Pago</label>
                  <select 
                    value={newInvoice.paymentMethod}
                    onChange={(e) => setNewInvoice({...newInvoice, paymentMethod: e.target.value as any})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Estado</label>
                  <select 
                    value={newInvoice.status}
                    onChange={(e) => setNewInvoice({...newInvoice, status: e.target.value as any})}
                    className="w-full bg-dark-bg border border-border rounded-lg px-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                  >
                    <option value="paid">Pagado</option>
                    <option value="pending">Pendiente</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-bold text-muted uppercase tracking-widest">Total a Pagar</span>
                  <span className="text-2xl font-medium text-gold">
                    ${newInvoice.items.reduce((acc, item) => acc + item.price, 0)}
                  </span>
                </div>
                <div className="flex gap-3">
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
                    Generar Factura
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
