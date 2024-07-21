import { useNavigate } from 'react-router-dom';
import { PropsWithChildren, useEffect, FC } from 'react';
import { useAuth } from '../providers/authProvider.tsx';

export const PublicRoute: FC<PropsWithChildren> = ({ children }) => {
  const user = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user !== null) {
      navigate('/home', { replace: true });
    }
  }, [navigate, user]);

  return children;
};
