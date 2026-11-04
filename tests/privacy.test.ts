// Página pública /privacidade: abre sem sessão, mostra o texto aprovado sem alterações, o login aponta para ela
// e as telas protegidas continuam atrás da sessão. A API sem sessão está em privacy-api.test.ts.
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';

// Texto aprovado, como foi entregue. A página precisa mostrar exatamente isto, na mesma ordem.
const APPROVED = `Política de Privacidade: De.Croqui ERP
Última atualização: 04 de novembro de 2026
O De.Croqui ERP é um sistema interno do estúdio De.Croqui para gestão de projetos, processos, agenda e arquivos. Esta política explica quais dados são usados, para quê, e como você pode controlá-los.
1. Quem acessa o sistema
Somente pessoas convidadas pelo administrador do estúdio podem entrar. O acesso é feito exclusivamente com a conta Google, sem senha no sistema.
2. Dados que coletamos
Dados da conta Google: nome, endereço de e-mail e identificador da conta, recebidos no login.
Dados de uso: papel no sistema (administrador, colaborador ou somente leitura), data do último acesso e registros de ações feitas no sistema.
Projetos e processos: nomes de projetos e clientes, etapas e histórico de movimentação.
Arquivos: arquivos enviados aos projetos ficam na pasta do estúdio no Google Drive.
Agenda: eventos criados no sistema ou no Google Agenda, dentro do calendário "De.Croqui ERP" da conta do administrador.
Credenciais: para manter a conexão com o Google, o sistema guarda um token de acesso criptografado. Ele é usado somente para o Drive e a Agenda.
3. Como usamos os dados
Permitir o login e manter a sessão.
Mostrar e atualizar projetos, processos, arquivos e eventos.
Sincronizar a Agenda com o Google Agenda, nos dois sentidos.
Enviar notificações internas entre colaboradores.
Manter o registro de auditoria de alterações, para conferência.
4. O que não fazemos
Não vendemos dados.
Não usamos dados para publicidade.
Não compartilhamos dados com terceiros, exceto os provedores de infraestrutura listados abaixo.
O uso de informações recebidas das APIs do Google segue a Política de Dados do Usuário dos Serviços de API do Google, incluindo os requisitos de Uso Limitado.
5. Onde os dados ficam
Banco de dados: Supabase, em São Paulo (Brasil).
Aplicação: Vercel, em São Paulo (gru1).
Arquivos e eventos: Google Drive e Google Agenda.
6. Por quanto tempo guardamos
Dados pessoais de um colaborador removido (nome, e-mail, identificador da conta, sessões e token de acesso) são apagados em até 30 dias após a remoção. Projetos e arquivos do estúdio não são apagados, porque pertencem ao estúdio.
Registros de auditoria são mantidos por 1 ano, para conferência de quem fez cada alteração.
Ao desconectar a Agenda, o token de acesso é apagado do sistema. Os eventos já criados continuam no Google Agenda.
Pedidos de exclusão de dados pessoais feitos pelo e-mail de suporte seguem o mesmo prazo de 30 dias.
7. Seus direitos
Você pode pedir a qualquer momento o acesso, a correção ou a exclusão dos seus dados, pelo e-mail decroqui.arts@gmail.com. Você também pode revogar o acesso do sistema à sua conta Google em https://myaccount.google.com/permissions.
8. Contato
Dúvidas sobre esta política: decroqui.arts@gmail.com.`;

type Mods = {
  router: typeof import('react-router');
  app: typeof import('../src/App');
  login: typeof import('../src/pages/LoginPage');
};
let m: Mods;

beforeAll(async () => {
  // O design system espera window.React; sem navegador, window aponta para o global.
  (globalThis as { window?: unknown }).window ??= globalThis;
  m = {
    router: await import('react-router'),
    app: await import('../src/App'),
    login: await import('../src/pages/LoginPage'),
  };
});

function renderAt(path: string) {
  return renderToStaticMarkup(
    createElement(m.router.MemoryRouter, { initialEntries: [path] }, createElement(m.app.AppRoutes)),
  );
}

/** Texto visível de blocos (títulos, parágrafos, itens), um por linha, sem as tags. */
function blocks(html: string): string {
  const decode = (s: string) =>
    s.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  return [...html.matchAll(/<(h1|h2|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((x) => decode(x[2].replace(/<[^>]+>/g, ''))).join('\n');
}

describe('/privacidade sem sessão', () => {
  it('abre a página sem consultar a sessão, sem login e sem o menu lateral', () => {
    const html = renderAt('/privacidade');
    expect(html).toContain('class="privacy"');
    expect(html).not.toContain('Carregando o ERP');
    expect(html).not.toContain('Entrar com Google');
    expect(html).not.toContain('sidebar');
  });

  it('mostra o texto aprovado, completo e sem alterações', () => {
    expect(blocks(renderAt('/privacidade'))).toBe(APPROVED);
  });

  it('o título e a data de atualização estão no topo', () => {
    const html = renderAt('/privacidade');
    expect(html).toMatch(/<h1[^>]*>Política de Privacidade: De\.Croqui ERP<\/h1>/);
    expect(html).toContain('Última atualização: 04 de novembro de 2026');
  });

  it('o e-mail de suporte e o endereço do Google viram links', () => {
    const html = renderAt('/privacidade');
    expect(html).toContain('href="mailto:decroqui.arts@gmail.com"');
    expect(html).toContain('href="https://myaccount.google.com/permissions"');
  });

  it('a página não tem botão, emoji nem ponto de exclamação', () => {
    const html = renderAt('/privacidade');
    expect(html).not.toContain('<button');
    expect(APPROVED).not.toContain('!');
    expect(blocks(html)).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('na Vercel, /privacidade é reescrita para o index.html e não para a API', () => {
    const { rewrites } = JSON.parse(readFileSync('vercel.json', 'utf8')) as { rewrites: { source: string; destination: string }[] };
    const toRegex = (source: string) => new RegExp(`^${source.replace('/:path*', '/.*')}$`);
    const match = rewrites.find((r) => toRegex(r.source).test('/privacidade'));
    expect(match?.destination).toBe('/index.html');
  });
});

describe('link no login', () => {
  it('o rodapé do login aponta para /privacidade', () => {
    const html = renderToStaticMarkup(
      createElement(m.router.MemoryRouter, { initialEntries: ['/entrar'] }, createElement(m.login.LoginPage)),
    );
    expect(html).toMatch(/<footer class="login__footer"><a href="\/privacidade"[^>]*>Política de Privacidade<\/a><\/footer>/);
  });
});

describe('rotas protegidas continuam fechadas sem sessão', () => {
  it('as telas do ERP ficam atrás da conferência de sessão', () => {
    for (const path of ['/', '/agenda', '/processos', '/projetos', '/projetos/abc', '/notificacoes', '/colaboradores', '/pedidos-de-exclusao', '/orcamentos']) {
      const html = renderAt(path);
      expect(html, path).toContain('Carregando o ERP');
      expect(html, path).not.toContain('class="privacy"');
    }
  });
});
