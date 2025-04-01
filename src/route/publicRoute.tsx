import { useNavigate } from 'react-router-dom';
import { PropsWithChildren, useEffect, FC } from 'react';
import { useAuth } from '../providers/authProvider.tsx';

export const PublicRoute: FC<PropsWithChildren> = ({ children }) => {
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [navigate, token]);

  return children;
};
