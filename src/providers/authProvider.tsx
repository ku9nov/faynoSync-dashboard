import { createContext, PropsWithChildren, useContext, useState } from 'react';
import axios from 'axios';

type LoginProviderProps = {
  username: string;
  password: string;
};

type SignUpProviderProps = LoginProviderProps & { secretKey: string };

interface AuthContextType {
  token: string | null;
  login: ({ username, password }: LoginProviderProps) => Promise<void>;
  signUp: ({
    username,
    password,
    secretKey,
  }: SignUpProviderProps) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<string | null>(null);

  const login = async ({
    username,
    password,
  }: LoginProviderProps): Promise<void> => {
    try {
      const response = await axios.post(
        'http://localhost:9000/login',
        {
          username,
          password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      setToken(response.data.token);
    } catch (error: any) {
      throw error?.response?.data?.error;
    }
  };

  const signUp = async ({
    username,
    password,
    secretKey,
  }: SignUpProviderProps) => {
    try {
      const response = await axios.post(
        'http://localhost:9000/signup',
        {
          username,
          password,
          api_key: secretKey,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Success:', response.data);
    } catch (error: any) {
      throw error?.response?.data?.error;
    }
  };

  const logout = () => {};

  return (
    <AuthContext.Provider value={{ token, login, logout, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
