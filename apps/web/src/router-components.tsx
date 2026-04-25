import { Outlet } from '@tanstack/react-router';
import { MainLayout } from './layouts/main-layout.tsx';

export function RootRoute() {
  return <Outlet />;
}

export function AuthenticatedRoute() {
  return <MainLayout />;
}

export function PendingRoute() {
  return <p className="p-8 text-sm text-stone-500">Carregando…</p>;
}

export function NotFoundRoute() {
  return <p className="p-8 text-sm text-red-400">Rota não encontrada.</p>;
}
