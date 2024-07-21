import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/loginPage.tsx';
import { HomePage } from '../pages/homePage.tsx';
import { PrivateRoute } from './privateRoute.tsx';
import { PublicRoute } from './publicRoute.tsx';

export const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <PrivateRoute>
        <HomePage />
      </PrivateRoute>
    ),
  },
  {
    path: '/home',
    element: (
      <PrivateRoute>
        <HomePage />
      </PrivateRoute>
    ),
  },
  {
    path: '/signin',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
]);
