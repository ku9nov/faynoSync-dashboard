import { createBrowserRouter } from 'react-router-dom';
import { SignInPage } from '../pages/signInPage.tsx';
import { SignUpPage } from '../pages/signUpPage.tsx';
import { HomePage } from '../pages/homePage.tsx';
import { ChannelsPage } from '../pages/channelsPage.tsx';
import { PlatformsPage } from '../pages/platformsPage.tsx';
import { ArchitecturesPage } from '../pages/architecturesPage.tsx';
import { PrivateRoute } from './privateRoute.tsx';
import { PublicRoute } from './publicRoute.tsx';
import { AuthProvider } from '../providers/authProvider.tsx';
import { ToastContainer } from 'react-toastify';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <ToastContainer />
        <PrivateRoute>
          <HomePage />
        </PrivateRoute>
      </AuthProvider>
    ),
  },
  {
    path: '/applications',
    element: (
      <AuthProvider>
        <PrivateRoute>
          <HomePage />
        </PrivateRoute>
      </AuthProvider>
    ),
  },
  {
    path: '/applications/:appName',
    element: (
      <AuthProvider>
        <PrivateRoute>
          <HomePage />
        </PrivateRoute>
      </AuthProvider>
    ),
  },
  {
    path: '/channels',
    element: (
      <AuthProvider>
        <PrivateRoute>
          <ChannelsPage />
        </PrivateRoute>
      </AuthProvider>
    ),
  },
  {
    path: '/platforms',
    element: (
      <AuthProvider>
        <PrivateRoute>
          <PlatformsPage />
        </PrivateRoute>
      </AuthProvider>
    ),
  },
  {
    path: '/architectures',
    element: (
      <AuthProvider>
        <PrivateRoute>
          <ArchitecturesPage />
        </PrivateRoute>
      </AuthProvider>
    ),
  },
  {
    path: '/signin',
    element: (
      <AuthProvider>
        <PublicRoute>
          <SignInPage />
        </PublicRoute>
      </AuthProvider>
    ),
  },
  {
    path: '/signup',
    element: (
      <AuthProvider>
        <PublicRoute>
          <SignUpPage />
        </PublicRoute>
      </AuthProvider>
    ),
  },
]);
