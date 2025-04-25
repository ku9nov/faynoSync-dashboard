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

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ToastContainer />
    {children}
  </AuthProvider>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout><PrivateRoute><HomePage /></PrivateRoute></RootLayout>,
  },
  {
    path: '/applications',
    element: <RootLayout><PrivateRoute><HomePage /></PrivateRoute></RootLayout>,
  },
  {
    path: '/applications/:appName',
    element: <RootLayout><PrivateRoute><HomePage /></PrivateRoute></RootLayout>,
  },
  {
    path: '/channels',
    element: <RootLayout><PrivateRoute><ChannelsPage /></PrivateRoute></RootLayout>,
  },
  {
    path: '/platforms',
    element: <RootLayout><PrivateRoute><PlatformsPage /></PrivateRoute></RootLayout>,
  },
  {
    path: '/architectures',
    element: <RootLayout><PrivateRoute><ArchitecturesPage /></PrivateRoute></RootLayout>,
  },
  {
    path: '/signin',
    element: <RootLayout><PublicRoute><SignInPage /></PublicRoute></RootLayout>,
  },
  {
    path: '/signup',
    element: <RootLayout><PublicRoute><SignUpPage /></PublicRoute></RootLayout>,
  },
]);
