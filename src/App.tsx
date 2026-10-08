import { lazy, Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import { client } from './graphql/client';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { MobileTabs } from './components/MobileTabs';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ToastContainer } from './components/Toast';
import { CreateTaskProvider } from './context/CreateTaskContext';
import { FilterProvider } from './context/FilterContext';
import { NotificationProvider } from './context/NotificationContext';
import { useCreateTask } from './hooks/useCreateTask';
import { useFilters } from './hooks/useFilters';
import { useNotifications } from './hooks/useNotifications';
import { ROUTES } from './constants/navigation';
import './styles/global.css';

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const MyTasks = lazy(() => import('./pages/MyTasks').then((m) => ({ default: m.MyTasks })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

function AppShell() {
  const { requestCreate } = useCreateTask();
  const { filters, setFilters } = useFilters();
  const { toasts, removeToast } = useNotifications();

  const [searchInput, setSearchInput] = useState(filters.name ?? '');
  const debounceRef = useRef<number | undefined>(undefined);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        setFilters({ ...filters, name: value || undefined });
      }, 300);
    },
    [filters, setFilters],
  );

  useEffect(() => {
    return () => window.clearTimeout(debounceRef.current);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-layout__main">
        <Header searchValue={searchInput} onSearchChange={handleSearchChange} />
        <MobileTabs />
        <main className="app-layout__content">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path={ROUTES.dashboard} element={<Dashboard />} />
                <Route path={ROUTES.myTasks} element={<MyTasks />} />
                <Route path={ROUTES.settings} element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        <BottomNav onAddClick={requestCreate} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ApolloProvider client={client}>
        <BrowserRouter>
          <FilterProvider>
            <NotificationProvider>
              <CreateTaskProvider>
                <AppShell />
              </CreateTaskProvider>
            </NotificationProvider>
          </FilterProvider>
        </BrowserRouter>
      </ApolloProvider>
    </ErrorBoundary>
  );
}
