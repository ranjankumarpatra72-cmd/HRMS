import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Employee, UserRole } from '../types/index';
import { apiFetch } from '../utils/api';
import { getEmployeeByIdFromFirestore } from '../services/firestoreService';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  token: string | null;
  isLoading: boolean;
  processingMessage: string | null;
  toasts: ToastMessage[];
  login: (username: string, password: string, captchaId?: string, captchaInput?: string) => Promise<boolean>;
  loginWithDemoOtp: (username: string, otp: string) => Promise<boolean>;
  switchDemoUser: (employeeId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  showProcessing: (msg: string) => void;
  hideProcessing: () => void;
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hrms_demo_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showProcessing = (msg: string) => setProcessingMessage(msg);
  const hideProcessing = () => setProcessingMessage(null);

  const fetchCurrentUser = async (overrideToken?: string) => {
    try {
      setIsLoading(true);
      const activeToken = overrideToken || token || localStorage.getItem('hrms_demo_token');
      const res = await fetch('/api/auth/me', {
        headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          let empRecord = data.employee;
          if (data.user.employeeId) {
            try {
              const cloudEmp = await getEmployeeByIdFromFirestore(data.user.employeeId);
              if (cloudEmp) {
                empRecord = cloudEmp;
              }
            } catch (cloudErr) {
              console.warn('Firestore direct fetch fallback:', cloudErr);
            }
          }
          setEmployee(empRecord);
        } else {
          setUser(null);
          setEmployee(null);
        }
      } else {
        setUser(null);
        setEmployee(null);
      }
    } catch (e) {
      console.error('Failed to fetch user context:', e);
      setUser(null);
      setEmployee(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (username: string, password: string, captchaId?: string, captchaInput?: string): Promise<boolean> => {
    showProcessing('Authenticating User Credentials...');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, captchaId, captchaInput })
      });
      const data = await res.json();
      hideProcessing();

      if (data.success && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('hrms_demo_token', data.token);
        addToast('success', 'Authentication Successful', `Welcome, ${data.user.name}`);
        await fetchCurrentUser(data.token);
        return true;
      } else {
        addToast('error', 'Login Failed', data.message || 'Invalid Employee ID or Password.');
        return false;
      }
    } catch (e: any) {
      hideProcessing();
      addToast('error', 'Network Error', 'Unable to connect to server. Check your internet connection.');
      return false;
    }
  };

  const loginWithDemoOtp = async (username: string, otp: string): Promise<boolean> => {
    showProcessing('Verifying Demo OTP...');
    try {
      const res = await fetch('/api/auth/demo-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, otp })
      });
      const data = await res.json();
      hideProcessing();

      if (data.success && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('hrms_demo_token', data.token);
        addToast('success', 'Demo OTP Verified', `Logged in as ${data.user.name}`);
        await fetchCurrentUser(data.token);
        return true;
      } else {
        addToast('error', 'OTP Verification Failed', data.message || 'Invalid OTP');
        return false;
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Could not reach server.');
      return false;
    }
  };

  const switchDemoUser = async (employeeId: string): Promise<boolean> => {
    showProcessing('Switching Demo Persona Role...');
    try {
      const res = await apiFetch('/api/auth/switch-demo-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      const data = await res.json();
      hideProcessing();

      if (data.success && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('hrms_demo_token', data.token);
        addToast('info', 'Role Switched', `Active Persona: ${data.user.name} (${data.user.role})`);
        await fetchCurrentUser(data.token);
        return true;
      } else {
        addToast('error', 'Switch Failed', data.message);
        return false;
      }
    } catch (e) {
      hideProcessing();
      addToast('error', 'Server Error', 'Failed to switch user.');
      return false;
    }
  };

  const logout = async () => {
    showProcessing('Logging Out...');
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setEmployee(null);
      setToken(null);
      localStorage.removeItem('hrms_demo_token');
      hideProcessing();
      addToast('info', 'Logged Out', 'Your session has ended.');
    }
  };

  const refreshUserData = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        token,
        isLoading,
        processingMessage,
        toasts,
        login,
        loginWithDemoOtp,
        switchDemoUser,
        logout,
        showProcessing,
        hideProcessing,
        addToast,
        removeToast,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
