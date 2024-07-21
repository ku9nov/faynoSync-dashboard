import { PropsWithChildren, useEffect, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/authProvider.tsx';

export const PrivateRoute: FC<PropsWithChildren> = ({ children }) => {
  const user = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) {
      navigate('/signin', { replace: true });
    }
  }, [navigate, user]);

  return children;
};
