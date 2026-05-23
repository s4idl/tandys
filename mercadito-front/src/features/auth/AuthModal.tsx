import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, User, Phone, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/axios';
import { useUserStore } from '../../store/userStore';
import './AuthModal.css';

interface AuthModalProps {
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, defaultTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useUserStore();

  // Form states
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [telefono, setTelefono] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'login') {
        const { data } = await api.post('/auth/login', { correo, contrasena });
        login(data.access_token);
        const { userType } = useUserStore.getState();
        onClose();
        if (userType === 'admin') navigate('/solicitudes');
        else if (userType === 'brand') navigate('/mi-marca');
        else navigate('/');
      } else {
        // Register flow: Backend returns { message, user }
        // We register with 'vendedor' so they can create brands
        await api.post('/auth/register', {
          nombre,
          correo,
          contrasena,
          telefono,
          rol: 'vendedor', 
        });
        
        // After successful registration, we need to log them in automatically
        const { data } = await api.post('/auth/login', { correo, contrasena });
        login(data.access_token);
        const { userType } = useUserStore.getState();
        onClose();
        if (userType === 'admin') navigate('/solicitudes');
        else if (userType === 'brand') navigate('/mi-marca', { state: { autoOpenWizard: true } });
        else navigate('/');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Ocurrió un error. Por favor intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="auth-header">
          <div className="auth-icon-wrap">
            <LogIn size={24} />
          </div>
          <h2 className="auth-title">Bienvenido a Tandys</h2>
          <p className="auth-subtitle">Gestiona tus marcas y espacios en mercaditos</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => { setActiveTab('login'); setError(null); }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => { setActiveTab('register'); setError(null); }}
          >
            Registrarse
          </button>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {activeTab === 'register' && (
            <div className="auth-field">
              <label>Nombre Completo</label>
              <div className="auth-input-wrap">
                <User size={16} className="auth-input-icon" />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Ej. María Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label>Correo Electrónico</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                className="auth-input"
                placeholder="tu@correo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>
          </div>

          {activeTab === 'register' && (
            <div className="auth-field">
              <label>Teléfono (Opcional)</label>
              <div className="auth-input-wrap">
                <Phone size={16} className="auth-input-icon" />
                <input
                  type="tel"
                  className="auth-input"
                  placeholder="10 dígitos"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label>Contraseña</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : (activeTab === 'login' ? 'Entrar' : 'Crear Cuenta')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
