import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn, Mail, Lock, UserPlus } from 'lucide-react';
import React, { useState } from 'react';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export default function Login({ onDemoLogin }: { onDemoLogin: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isFirebaseConfigured = firebaseAppletConfig.apiKey !== "TODO_KEYHERE" && firebaseAppletConfig.apiKey !== "";

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      setError('Configuración de Firebase faltante. Por favor, completa el proceso de configuración.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setError(`Error de Google: ${err.message || 'Intenta de nuevo'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      setError('Configuración de Firebase faltante. Por favor, completa el proceso de configuración.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Credenciales inválidas. Si es una cuenta nueva, usa el botón "Crear Cuenta de Prueba".');
      } else {
        setError(`Error: ${err.message || 'Intenta de nuevo'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!email || !password) {
      setError('Por favor ingresa un correo y contraseña.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado. Intenta iniciar sesión.');
      } else {
        setError('Error al crear la cuenta. Por favor intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card-bg border border-border rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="font-serif italic text-4xl text-gold mb-2 tracking-widest">Lumière</h1>
          <p className="text-muted text-xs uppercase tracking-[3px]">Salon Management System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-bg border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                placeholder="admin@salon.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-bg border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink focus:border-gold outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-elegant-fill flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleCreateAccount}
            disabled={loading}
            className="w-full btn-elegant flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-widest disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            Crear Cuenta de Prueba
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-card-bg px-2 text-muted">O continuar con</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-black rounded-md py-3 text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
            Google
          </button>

          <button
            onClick={onDemoLogin}
            className="w-full mt-2 text-[10px] uppercase tracking-[2px] text-gold/60 hover:text-gold transition-colors py-2"
          >
            Explorar en Modo Demo (Sin Base de Datos)
          </button>
        </div>

        <p className="mt-8 text-center text-[10px] text-muted uppercase tracking-widest leading-loose">
          Acceso restringido a personal autorizado.<br />
          Lumière © 2024
        </p>
      </div>
    </div>
  );
}
