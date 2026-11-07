import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { SessionProvider, useSession } from './session';
import { AppLoading } from './ui/AppLoading';
import { ErrorBoundary, RecoveryScreen } from './ui/ErrorBoundary';
import { AppShell } from './layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { CollaboratorsPage } from './pages/collaborators/CollaboratorsPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ProjectPage } from './pages/projects/ProjectPage';
import { ProcessesPage } from './pages/processes/ProcessesPage';
import { AgendaPage } from './pages/agenda/AgendaPage';
import { DeletionRequestsPage } from './pages/deletion/DeletionRequestsPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { PrivacyPage } from './pages/privacy/PrivacyPage';
import { BudgetsPage } from './pages/budgets/BudgetsPage';
import { BudgetEditorPage } from './pages/budgets/BudgetEditorPage';
import { PresentationsPage } from './pages/presentations/PresentationsPage';
import { PresentationPendingPage } from './pages/presentations/PresentationPendingPage';

function Protected() {
  const session = useSession();
  if (session.status === 'loading') return <AppLoading />;
  if (session.status === 'anonymous') return <Navigate to="/entrar" replace />;
  return <AppShell user={session.user} />;
}

/** Telas de tela cheia, sem o menu lateral (editor de orçamento), com a mesma exigência de sessão. */
function ProtectedFull({ children }: { children: ReactNode }) {
  const session = useSession();
  if (session.status === 'loading') return <AppLoading />;
  if (session.status === 'anonymous') return <Navigate to="/entrar" replace />;
  return <ErrorBoundary fallback={(error) => <RecoveryScreen error={error} fullPage />}>{children}</ErrorBoundary>;
}

/** A API já responde 403 para quem não é administrador; aqui só evitamos mostrar a tela vazia. */
function AdminOnly({ title, children }: { title: string; children: ReactNode }) {
  const session = useSession();
  if (session.status === 'authenticated' && session.user.role === 'admin') return children;
  return <PlaceholderPage title={title} text="Esta área é só para a administração do estúdio." />;
}

function LoginRoute() {
  const session = useSession();
  if (session.status === 'loading') return <AppLoading />;
  if (session.status === 'authenticated') return <Navigate to="/" replace />;
  return <LoginPage />;
}

/** Último recurso: um erro fora da moldura (sessão, rotas) mostra a tela de recuperação, não uma página em branco. */
export function App() {
  return (
    <ErrorBoundary fallback={(error) => <RecoveryScreen error={error} fullPage />}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

/**
 * /privacidade é pública: fica fora do SessionProvider, então não consulta /api/me, não passa pelo
 * bloqueio de login nem pela moldura com o menu lateral. O resto do ERP continua atrás da sessão.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/privacidade" element={<PrivacyPage />} />
      <Route path="*" element={<SessionRoutes />} />
    </Routes>
  );
}

function SessionRoutes() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/entrar" element={<LoginRoute />} />
        <Route
          path="/orcamentos/:id"
          element={
            <ProtectedFull>
              <BudgetEditorPage />
            </ProtectedFull>
          }
        />
        <Route element={<Protected />}>
          <Route
            index
            element={
              <PlaceholderPage
                title="Dashboard"
                soon
                text="Aqui você verá o resumo do estúdio: projetos em andamento, prazos, compromissos e orçamentos. O dashboard chega depois das outras telas."
              />
            }
          />
          <Route path="/apresentacoes" element={<PresentationsPage />} />
          <Route path="/apresentacoes/:id" element={<PresentationPendingPage />} />
          <Route path="/orcamentos" element={<BudgetsPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/processos" element={<ProcessesPage />} />
          <Route path="/projetos" element={<ProjectsPage />} />
          <Route path="/projetos/:id" element={<ProjectPage />} />
          <Route path="/notificacoes" element={<NotificationsPage />} />
          <Route
            path="/colaboradores"
            element={
              <AdminOnly title="Colaboradores">
                <CollaboratorsPage />
              </AdminOnly>
            }
          />
          <Route
            path="/pedidos-de-exclusao"
            element={
              <AdminOnly title="Pedidos de exclusão">
                <DeletionRequestsPage />
              </AdminOnly>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </SessionProvider>
  );
}
