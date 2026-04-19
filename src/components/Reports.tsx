import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Download
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';

export default function Reports() {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    growth: 12.5
  });

  useEffect(() => {
    // Mock data for demonstration as real aggregation requires many documents
    const mockSales = [
      { name: 'Ene', sales: 4000, expenses: 2400 },
      { name: 'Feb', sales: 3000, expenses: 1398 },
      { name: 'Mar', sales: 2000, expenses: 9800 },
      { name: 'Abr', sales: 2780, expenses: 3908 },
      { name: 'May', sales: 1890, expenses: 4800 },
      { name: 'Jun', sales: 2390, expenses: 3800 },
    ];

    const mockCategories = [
      { name: 'Cabello', value: 400 },
      { name: 'Uñas', value: 300 },
      { name: 'Piel', value: 300 },
      { name: 'Productos', value: 200 },
    ];

    setSalesData(mockSales);
    setCategoryData(mockCategories);
    setStats({
      totalRevenue: 16060,
      totalExpenses: 26106,
      netProfit: -10046,
      growth: 12.5
    });
  }, []);

  const COLORS = ['#D4AF37', '#A0A0A0', '#666666', '#1C1C1C'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-ink">Reportes y Analíticas</h2>
          <p className="text-xs text-muted uppercase tracking-widest mt-1">Visualiza el rendimiento financiero de tu salón</p>
        </div>
        <button className="btn-elegant flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar Reporte
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card-bg p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-dark-bg text-gold rounded-lg border border-border">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+{stats.growth}%</span>
          </div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Ingresos Totales</p>
          <p className="text-2xl font-medium text-ink mt-1">${stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-card-bg p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-dark-bg text-rose-500 rounded-lg border border-border">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Gastos Totales</p>
          <p className="text-2xl font-medium text-ink mt-1">${stats.totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-card-bg p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-dark-bg text-gold rounded-lg border border-border">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Utilidad Neta</p>
          <p className={cn(
            "text-2xl font-medium mt-1",
            stats.netProfit >= 0 ? "text-emerald-500" : "text-rose-500"
          )}>${stats.netProfit.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card-bg p-6 rounded-xl border border-border">
          <h3 className="text-sm font-medium text-gold mb-8 uppercase tracking-widest">Ventas vs Gastos (Últimos 6 meses)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A2A" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666666', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#666666', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#161616', borderRadius: '12px', border: '1px solid #2A2A2A', color: '#E0E0E0'}}
                  itemStyle={{color: '#D4AF37'}}
                />
                <Bar dataKey="sales" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#2A2A2A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card-bg p-6 rounded-xl border border-border">
          <h3 className="text-sm font-medium text-gold mb-8 uppercase tracking-widest">Distribución por Categoría</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{backgroundColor: '#161616', borderRadius: '12px', border: '1px solid #2A2A2A', color: '#E0E0E0'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {categoryData.map((cat, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
