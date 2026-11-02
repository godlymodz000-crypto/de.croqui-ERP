import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Badge, Icon, IconButton } from '../ui/ds';
import { useIsMobile } from '../ui/useMediaQuery';
import { AppIcon } from '../ui/AppIcon';
import { logout, type SessionUser } from '../session';
import logo from '../design-system/assets/logo/decroqui-imagotipo-horizontal-escuro.svg';

export const NAV_ITEMS = [
  { to: '/agenda', label: 'Agenda', icon: 'calendar' },
  { to: '/processos', label: 'Processos', icon: 'square-kanban' },
  { to: '/projetos', label: 'Projetos', icon: 'folder' },
  { to: '/orcamentos', label: 'Orçamentos', icon: 'file-text' },
  { to: '/apresentacoes', label: 'Apresentação', icon: 'presentation' },
  { to: '/', label: 'Dashboard', icon: 'layout-dashboard', soon: true },
] as const;

const ROLE_LABEL: Record<SessionUser['role'], string> = {
  admin: 'Administrador',
  member: 'Colaborador',
  viewer: 'Somente leitura',
};

export function AppShell({ user }: { user: SessionUser }) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const openButton = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLDivElement>(null);
  const drawer = isMobile && drawerOpen;

  // No celular o menu lateral vira gaveta: fecha ao navegar, com Esc, no véu ou no botão Fechar.
  useEffect(() => setDrawerOpen(false), [location.pathname, isMobile]);
  useEffect(() => {
    if (!drawer) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    closeButton.current?.querySelector('button')?.focus();
    const opener = openButton.current;
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
      opener?.querySelector('button')?.focus();
    };
  }, [drawer]);

  return (
    <div className="shell">
      {drawer && <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} aria-hidden />}
      <aside
        id="menu-principal"
        className={`sidebar${drawer ? ' is-open' : ''}`}
        inert={isMobile && !drawerOpen ? true : undefined}
        aria-label={isMobile ? 'Menu' : undefined}
      >
        <div className="sidebar__close" ref={closeButton}>
          <IconButton icon="x" label="Fechar menu" variant="ghost" onClick={() => setDrawerOpen(false)} />
        </div>
        <img className="sidebar__logo" src={logo} alt="De.Croqui" />
        <nav aria-label="Principal">
          <p className="sidebar__section">Estúdio</p>
          <ul className="sidebar__nav">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}>
                  <AppIcon name={item.icon} />
                  <span>{item.label}</span>
                  {'soon' in item && <Badge tone="neutral">Em breve</Badge>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <p className="sidebar__motto">
          Do primeiro croqui
          <br />à última peça.
        </p>
      </aside>

      <div className="shell__main">
        <header className="topbar">
          <div className="topbar__menu" ref={openButton}>
            <IconButton
              icon="menu"
              label="Abrir menu"
              variant="ghost"
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawer}
              aria-controls="menu-principal"
            />
          </div>
          <img className="topbar__logo" src={logo} alt="De.Croqui" />
          <UserMenu user={user} />
        </header>
        <main className="shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function initials(user: SessionUser) {
  const source = user.name?.trim() || user.email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-menu__trigger" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="avatar" aria-hidden>
          {initials(user)}
        </span>
        <span className="user-menu__who">
          <span className="user-menu__name">{user.name ?? user.email}</span>
          <span className="user-menu__role">{ROLE_LABEL[user.role]}</span>
        </span>
        <Icon name="chevron-down" size={16} />
      </button>
      {open && (
        <div className="user-menu__popover" role="menu">
          <p className="user-menu__email">{user.email}</p>
          {user.role === 'admin' && (
            <Link className="user-menu__item" role="menuitem" to="/colaboradores" onClick={() => setOpen(false)}>
              Colaboradores
            </Link>
          )}
          <button className="user-menu__item" role="menuitem" onClick={logout}>
            <AppIcon name="log-out" size={18} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
