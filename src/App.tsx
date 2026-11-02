import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { SessionProvider, useSession } from './session';
import { AppShell } from './layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { CollaboratorsPage } from './pages/collaborators/CollaboratorsPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ProjectPage } from './pages/projects/ProjectPage';
import { DeletionRequestsPage } from './pages/deletion/DeletionRequestsPage';

const PAGES = [
  {
    path: '/agenda',
    title: 'Agenda',
    text: 'Aqui você verá os compromissos do estúdio, em sincronia com o Google Agenda. Esta tela chega na fase da agenda.',
  },
  {
    path: '/processos',
    title: 'Processos',
    text: 'Aqui cada projeto aparece como um card, na coluna da etapa em que está. Esta tela chega na fase dos processos.',
  },
  {
    path: '/orcamentos',
    title: 'Orçamentos',
    text: 'Aqui você vai criar e acompanhar os orçamentos de cada projeto. Esta tela chega na fase do orçamento.',
  },
  {
    path: '/apresentacoes',
    title: 'Apresentação',
    text: 'Aqui você vai montar a apresentação de cada projeto para o cliente. Esta tela chega na fase da apresentação.',
  },
];

function Protected() {
  const session = useSession();
  if (session.status === 'loading') return null;
  if (session.status === 'anonymous') return <Navigate to="/entrar" replace />;
  return <AppShell user={session.user} />;
}

/** A API já responde 403 para quem não é administrador; aqui só evitamos mostrar a tela vazia. */
function AdminOnly({ title, children }: { title: string; children: ReactNode }) {
  const session = useSession();
  if (session.status === 'authenticated' && session.user.role === 'admin') return children;
  return <PlaceholderPage title={title} text="Esta área é só para a administração do estúdio." />;
}

function LoginRoute() {
  const session = useSession();
  if (session.status === 'loading') return null;
  if (session.status === 'authenticated') return <Navigate to="/" replace />;
  return <LoginPage />;
}

export function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<LoginRoute />} />
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
            {PAGES.map((p) => (
              <Route key={p.path} path={p.path} element={<PlaceholderPage title={p.title} text={p.text} />} />
            ))}
            <Route path="/projetos" element={<ProjectsPage />} />
            <Route path="/projetos/:id" element={<ProjectPage />} />
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
      </BrowserRouter>
    </SessionProvider>
  );
}
