import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { SessionProvider, useSession } from './session';
import { AppShell } from './layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { CollaboratorsPage } from './pages/collaborators/CollaboratorsPage';

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
    path: '/projetos',
    title: 'Projetos',
    text: 'Aqui ficará a lista de projetos, cada um com a própria pasta no Google Drive. Esta tela chega na fase dos projetos.',
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
function AdminOnly() {
  const session = useSession();
  if (session.status === 'authenticated' && session.user.role === 'admin') return <CollaboratorsPage />;
  return <PlaceholderPage title="Colaboradores" text="Esta área é só para a administração do estúdio." />;
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
            <Route path="/colaboradores" element={<AdminOnly />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}
