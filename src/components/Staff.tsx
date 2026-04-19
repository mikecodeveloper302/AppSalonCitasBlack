import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  UserCog, 
  Shield, 
  User, 
  Mail, 
  Calendar, 
  Trash2,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { MOCK_STAFF } from '../utils/mockData';
import firebaseAppletConfig from '../../firebase-applet-config.json';

interface StaffProps {
  userRole: string | null;
}

export default function Staff({ userRole }: StaffProps) {
  const [staff, setStaff] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isFirebaseConfigured = firebaseAppletConfig.apiKey !== "TODO_KEYHERE" && firebaseAppletConfig.apiKey !== "";

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setStaff(MOCK_STAFF);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    return () => unsubscribe();
  }, []);

  const handleUpdateRole = async (id: string, role: string) => {
    if (!isFirebaseConfigured) {
      setStaff(prev => prev.map(s => s.id === id ? { ...s, role } : s));
      return;
    }

    try {
      await updateDoc(doc(db, 'users', id), { role });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este miembro del personal?')) return;
    if (!isFirebaseConfigured) {
      setStaff(prev => prev.filter(s => s.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-card-bg border border-border rounded-xl">
        <Shield className="w-16 h-16 text-muted mb-4 opacity-20" />
        <h2 className="text-xl font-light text-ink">Acceso Restringido</h2>
        <p className="text-xs text-muted uppercase tracking-widest mt-2">Solo los administradores pueden gestionar el personal</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light text-ink">Gestión de Personal</h2>
        <p className="text-xs text-muted uppercase tracking-widest mt-1">Administra los roles y accesos de tu equipo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <div key={member.id} className="bg-card-bg p-6 rounded-xl border border-border hover:border-gold/30 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <img 
                  src={member.photoURL || `https://ui-avatars.com/api/?name=${member.displayName}&background=1C1C1C&color=D4AF37`} 
                  alt={member.displayName} 
                  className="w-14 h-14 rounded-lg border border-border"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-medium text-ink">{member.displayName}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      member.role === 'admin' ? 'bg-rose-500/10 text-rose-500' :
                      member.role === 'receptionist' ? 'bg-gold/10 text-gold' :
                      'bg-emerald-500/10 text-emerald-500'
                    )}>
                      {member.role}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(member.id)} className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-xs text-secondary">
                <Mail className="w-4 h-4 text-muted" />
                {member.email}
              </div>
              <div className="flex items-center gap-3 text-xs text-secondary">
                <Calendar className="w-4 h-4 text-muted" />
                Unido el {format(new Date(member.createdAt), 'dd/MM/yyyy')}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Cambiar Rol</label>
              <div className="grid grid-cols-3 gap-2">
                {['admin', 'staff', 'receptionist'].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleUpdateRole(member.id, role)}
                    className={cn(
                      "py-2 rounded-lg text-[10px] font-bold uppercase transition-all tracking-widest border",
                      member.role === role 
                        ? "bg-gold border-gold text-black" 
                        : "bg-dark-bg border-border text-muted hover:border-gold/50 hover:text-ink"
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
