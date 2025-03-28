import { PropsWithChildren, useEffect, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/authProvider.tsx';

export const PrivateRoute: FC<PropsWithChildren> = ({ children }) => {
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/signin', { replace: true });
    }
  }, [navigate, token]);

  if (!token) {
    return null;
  }

  return children;
};
