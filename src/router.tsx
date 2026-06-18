import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MembersPage from './pages/MembersPage';
import LivePage from './pages/LivePage';
import SchedulePage from './pages/SchedulePage';
import CalendarPage from './pages/CalendarPage';
import HistoryPage from './pages/HistoryPage';
import TimesPage from './pages/TimesPage';
import LikaPage from './pages/LikaPage';
import MaintenancePage from './pages/MaintenancePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'live', element: <LivePage /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'times', element: <TimesPage /> },
      { path: 'lika', element: <LikaPage /> },
      { path: 'maintenance', element: <MaintenancePage /> },
    ],
  },
]);
