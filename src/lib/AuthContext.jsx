import React, { createContext, useState, useContext, useEffect } from 'react';
import { invokeFunction } from '@/lib/api';
import * as neonAuth from '@/lib/neonAuth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);
    setAppPublicSettings({ id: 'liafrik', public_settings: {} });
    setIsLoadingPublicSettings(false);
    if (neonAuth.hasSession()) {
      await checkUserAuth();
    } else {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const neonUser = await neonAuth.getUser();
      if (!neonUser) throw Object.assign(new Error('Not authenticated'), { status: 401 });
      // Keep the shape the app already expects (id, email, full_name, role)
      const currentUser = { ...neonUser, full_name: neonUser.name, role: neonUser.role || 'user' };

      // Invite-only access control: verify the user has a valid Administrator record.
      // Platform admins (role === 'admin', i.e. the founder) bypass this check.
      if (currentUser.role !== 'admin') {
        try {
          const admins = await invokeFunction('neonData', {
            entity: 'Administrator',
            operation: 'filter',
            query: { email: currentUser.email }
          }).then(r => r.data);
          const validAdmin = admins.find(a => a.status === 'active' || a.status === 'pending');
          if (!validAdmin) {
            // User is authenticated but not in the administrator registry — deny access
            setAuthError({
              type: 'user_not_registered',
              message: 'Access denied — you are not registered as an administrator.'
            });
            setIsAuthenticated(false);
            setIsLoadingAuth(false);
            setAuthChecked(true);
            return;
          }
        } catch (adminCheckError) {
          console.error('Administrator registry check failed:', adminCheckError);
          setAuthError({
            type: 'user_not_registered',
            message: 'Unable to verify administrator access.'
          });
          setIsAuthenticated(false);
          setIsLoadingAuth(false);
          setAuthChecked(true);
          return;
        }
      }

      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      
      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    neonAuth.signOut().finally(() => {
      if (shouldRedirect) window.location.href = '/login';
    });
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};