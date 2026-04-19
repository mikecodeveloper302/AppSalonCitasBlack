import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Package, 
  Receipt, 
  Users, 
  UserCog, 
  BarChart3, 
  Tag, 
  LogOut,
  Menu,
  X,
  Download,
  Scissors,
  Bell
} from 'lucide-react';
import { auth } from '../firebase';
import { cn } from '../lib/utils';
import { View } from '../App';
import { User } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  setView: (view: View) => void;
  user: User;
  userRole: string | null;
}

export default function Layout({ children, currentView, setView, user, userRole }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Agenda y Citas', icon: Calendar, roles: ['admin', 'staff', 'receptionist'] },
    { id: 'stats', label: 'Resumen y Métricas', icon: LayoutDashboard, roles: ['admin', 'staff', 'receptionist'] },
    { id: 'clients', label: 'Clientes e Historial', icon: Users, roles: ['admin', 'staff', 'receptionist'] },
    { id: 'services', label: 'Servicios y Precios', icon: Scissors, roles: ['admin', 'receptionist'] },
    { id: 'inventory', label: 'Inventario', icon: Package, roles: ['admin', 'staff', 'receptionist'] },
    { id: 'billing', label: 'Facturación / POS', icon: Receipt, roles: ['admin', 'receptionist'] },
    { id: 'reports', label: 'Reportes de Ventas', icon: BarChart3, roles: ['admin'] },
    { id: 'staff', label: 'Gestión de Personal', icon: UserCog, roles: ['admin'] },
    { id: 'promotions', label: 'Promociones', icon: Tag, roles: ['admin', 'receptionist'] },
    { id: 'notifications', label: 'Notificaciones', icon: Bell, roles: ['admin', 'staff', 'receptionist'] },
  ];

  const filteredItems = menuItems.filter(item => userRole && item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-dark-bg text-ink overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/70 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-60 bg-card-bg border-r border-border transition-transform duration-300 lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-8 text-center border-b border-border mb-8">
            <h1 className="font-serif italic text-2xl text-gold tracking-wide">Lumière</h1>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as View);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-all",
                  currentView === item.id 
                    ? "bg-[#1F1F1F] text-gold border-l-4 border-gold" 
                    : "text-secondary hover:bg-[#1F1F1F] hover:text-ink"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border mt-auto">
            <button
              onClick={() => {
                // Mock export
                console.log('Exportando base de datos...');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-secondary hover:text-ink transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar Base de Datos
            </button>
            <button
              onClick={() => auth.signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-secondary hover:text-rose-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-dark-bg flex items-center justify-between px-8">
          <button 
            className="lg:hidden p-2 text-secondary"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div>
            <h1 className="text-2xl font-light text-ink">Panel Administrativo</h1>
            <span className="text-xs text-muted">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-ink">{user.displayName}</p>
              <span className="bg-gold text-black px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {userRole === 'admin' ? 'Administrador' : userRole}
              </span>
            </div>
            <div className="w-10 h-10 bg-border rounded-full border border-gold overflow-hidden">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=2A2A2A&color=D4AF37`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
