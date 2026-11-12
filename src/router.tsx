import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MembersPage from './pages/MembersPage';
import LivePage from './pages/LivePage';
import NoticePage from './pages/NoticePage';
import CalendarPage from './pages/CalendarPage';
import ContentsPage from './pages/ContentsPage';
import HistoryPage from './pages/HistoryPage';
import TimesPage from './pages/TimesPage';
import LikaPage from './pages/LikaPage';
import MaintenancePage from './pages/MaintenancePage';
import FanArtPage from './pages/FanArtPage';
import AdminFanArtPage from './pages/AdminFanArtPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'live', element: <LivePage /> },
      { path: 'notice', element: <NoticePage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'contents', element: <ContentsPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'fanart', element: <FanArtPage /> },
      { path: 'admin/fanart', element: <AdminFanArtPage /> },
      //{ path: 'times', element: <TimesPage /> },
      //{ path: 'lika', element: <LikaPage /> },
      { path: 'maintenance', element: <MaintenancePage /> },
    ],
  },
  // 전체 화면 3D 공간 — 사이트 헤더·Lenis 없이 lazy-load
  { path: '/castle', lazy: () => import('./pages/CastlePage').then((m) => ({ Component: m.default })) },
  // 개발 서버에서만: SOOP 방송 임베드 시험 페이지 (배포 번들에는 들어가지 않는다)
  ...(import.meta.env.DEV
    ? [{ path: '/soop-test', lazy: () => import('./pages/SoopEmbedTestPage').then((m) => ({ Component: m.default })) }]
    : []),
]);
