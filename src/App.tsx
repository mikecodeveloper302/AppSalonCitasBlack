/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Appointments from './components/Appointments';
import Inventory from './components/Inventory';
import Billing from './components/Billing';
import Clients from './components/Clients';
import Staff from './components/Staff';
import Reports from './components/Reports';
import Promotions from './components/Promotions';
import Services from './components/Services';
import Notifications from './components/Notifications';
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';
import firebaseAppletConfig from '../firebase-applet-config.json';

export type View = 'stats' | 'dashboard' | 'inventory' | 'billing' | 'clients' | 'staff' | 'reports' | 'promotions' | 'services' | 'notifications';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const isFirebaseConfigured = firebaseAppletConfig.apiKey !== "TODO_KEYHERE" && firebaseAppletConfig.apiKey !== "";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!isFirebaseConfigured) {
          setUser(firebaseUser);
          setUserRole('admin');
          setLoading(false);
          return;
        }
        try {
          // Fetch user role from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            // Default role for new users (if admin email matches)
            const isAdmin = firebaseUser.email === 'miguelcodev302@gmail.com' || firebaseUser.email === 'admin@salon.com';
            const role = isAdmin ? 'admin' : 'staff';
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: role,
              photoURL: firebaseUser.photoURL,
              createdAt: new Date().toISOString()
            });
            setUserRole(role);
          }
          setUser(firebaseUser);
          setIsDemo(false);
        } catch (error) {
          console.error("Firestore error, falling back to basic auth:", error);
          setUser(firebaseUser);
          setUserRole('admin'); // Fallback for testing
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-bg">
        <Loader2 className="h-12 w-12 animate-spin text-gold" />
      </div>
    );
  }

  if (!user && !isDemo) {
    return <Login onDemoLogin={() => {
      setIsDemo(true);
      setUserRole('admin');
    }} />;
  }

  const renderView = () => {
    // Pass isDemo prop to components if needed, or they can handle empty states
    switch (currentView) {
      case 'stats': return <Dashboard setView={setCurrentView} />;
      case 'dashboard': return <Appointments />;
      case 'inventory': return <Inventory />;
      case 'billing': return <Billing />;
      case 'clients': return <Clients setView={setCurrentView} />;
      case 'staff': return <Staff userRole={userRole} />;
      case 'reports': return <Reports />;
      case 'promotions': return <Promotions />;
      case 'services': return <Services />;
      case 'notifications': return <Notifications />;
      default: return <Dashboard setView={setCurrentView} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      setView={setCurrentView} 
      user={user || { displayName: 'Usuario Demo', email: 'demo@salon.com' } as any} 
      userRole={userRole || 'admin'}
    >
      {renderView()}
    </Layout>
  );
}

