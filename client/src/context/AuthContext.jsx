import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const PRESET_ACCOUNTS = {
  'citizen-annanagar': {
    phone: '9999999999',
    name: 'Karthikeyan S.',
    role: 'citizen',
    label: 'Citizen (Chennai - Anna Nagar)',
  },
  'citizen-tnagar': {
    phone: '9888888888',
    name: 'Priya Raman',
    role: 'citizen',
    label: 'Citizen (Chennai - T. Nagar)',
  },
  'official-chennai': {
    phone: '9876543210',
    name: 'Rajesh Kumar (Zonal Officer)',
    role: 'official',
    label: 'GCC Official (Greater Chennai)',
  },
  'official-coimbatore': {
    phone: '9876543211',
    name: 'Meena Sundaram (Commissioner)',
    role: 'official',
    label: 'CCMC Official (Coimbatore)',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('civic_token'));
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Selected browsing location (for citizen feed)
  const [currentWard, setCurrentWard] = useState(() => {
    const saved = localStorage.getItem('civic_active_ward');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      municipality_id: 1,
      municipality_name: 'Greater Chennai Corporation',
      ward_id: 1,
      ward_name: 'Ward 104 - Anna Nagar West',
      state: 'Tamil Nadu',
      district: 'Chennai',
    };
  });

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.user) {
            setUser(res.user);
            if (res.user.ward_id) {
              const wardObj = {
                municipality_id: res.user.municipality_id,
                municipality_name: res.user.municipality_name,
                ward_id: res.user.ward_id,
                ward_name: res.user.ward_name,
              };
              setCurrentWard(wardObj);
              localStorage.setItem('civic_active_ward', JSON.stringify(wardObj));
            }
          }
        } catch (err) {
          console.warn('Session expired or invalid, clearing:', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (phone, otp, role = 'citizen', name) => {
    const res = await api.verifyOtp(phone, otp, role, name);
    return handleAuthSuccess(res);
  };

  const registerUser = async (registerData) => {
    const res = await api.register(registerData);
    return handleAuthSuccess(res);
  };

  const loginWithGoogle = async (googleData) => {
    const res = await api.googleLogin(googleData);
    return handleAuthSuccess(res);
  };

  const loginWithEmail = async (emailData) => {
    const res = await api.emailLogin(emailData);
    return handleAuthSuccess(res);
  };

  const handleAuthSuccess = (res) => {
    if (res.token && res.user) {
      localStorage.setItem('civic_token', res.token);
      setToken(res.token);
      setUser(res.user);

      if (res.user.role === 'citizen' && !res.user.ward_id) {
        setShowLocationModal(true);
      } else if (res.user.ward_id) {
        const wardObj = {
          municipality_id: res.user.municipality_id,
          municipality_name: res.user.municipality_name,
          ward_id: res.user.ward_id,
          ward_name: res.user.ward_name,
        };
        setCurrentWard(wardObj);
        localStorage.setItem('civic_active_ward', JSON.stringify(wardObj));
      }
      setShowAuthModal(false);
      return res.user;
    }
  };

  const quickLogin = async (key) => {
    const preset = PRESET_ACCOUNTS[key];
    if (!preset) return;
    try {
      await login(preset.phone, '123456', preset.role, preset.name);
    } catch (err) {
      console.error('Quick login failed:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('civic_token');
    setToken(null);
    setUser(null);
  };

  const setLocation = (loc) => {
    setCurrentWard(loc);
    localStorage.setItem('civic_active_ward', JSON.stringify(loc));
    if (user && user.role === 'citizen') {
      api.updateProfile({
        municipality_id: loc.municipality_id,
        ward_id: loc.ward_id,
      }).catch(console.error);
    }
    setShowLocationModal(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        currentWard,
        setLocation,
        login,
        registerUser,
        loginWithGoogle,
        loginWithEmail,
        quickLogin,
        logout,
        showAuthModal,
        setShowAuthModal,
        showLocationModal,
        setShowLocationModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
