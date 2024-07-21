import { createContext, PropsWithChildren, useContext, useState } from 'react';

type AuthProviderProps = PropsWithChildren & {
  isSignedIn?: boolean;
};

type User = {};

const AuthContext = createContext<User | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const isSignedIn = true;

  const [user] = useState<User | null>(isSignedIn ? { id: 1 } : null);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
