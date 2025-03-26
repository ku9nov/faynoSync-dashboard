import { createBrowserRouter } from 'react-router-dom';
import { SignInPage } from '../pages/signInPage.tsx';
import { SignUpPage } from '../pages/signUpPage.tsx';
import { HomePage } from '../pages/homePage.tsx';
import { ChannelsPage } from '../pages/channelsPage.tsx';
import { PlatformsPage } from '../pages/platformsPage.tsx';
import { ArchitecturesPage } from '../pages/architecturesPage.tsx';
import { PrivateRoute } from './privateRoute.tsx';
import { PublicRoute } from './publicRoute.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PrivateRoute>
        <HomePage />
      </PrivateRoute>
    ),
  },
  {
    path: '/applications',
    element: (
      <PrivateRoute>
        <HomePage />
      </PrivateRoute>
    ),
  },
  {
    path: '/channels',
    element: (
      <PrivateRoute>
        <ChannelsPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/platforms',
    element: (
      <PrivateRoute>
        <PlatformsPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/architectures',
    element: (
      <PrivateRoute>
        <ArchitecturesPage />
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
