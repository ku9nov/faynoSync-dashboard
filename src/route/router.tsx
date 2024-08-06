import { createBrowserRouter } from 'react-router-dom';
import { SignInPage } from '../pages/signInPage.tsx';
import { SignUpPage } from '../pages/signUpPage.tsx';
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
        <SignInPage />
      </PublicRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicRoute>
        <SignUpPage />
      </PublicRoute>
    ),
  },
]);
