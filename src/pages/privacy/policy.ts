// Texto aprovado da Política de Privacidade, palavra por palavra. Não editar sem nova aprovação.

export const POLICY_TITLE = 'Política de Privacidade: De.Croqui ERP';
export const POLICY_UPDATED = 'Última atualização: 04 de novembro de 2026';
export const POLICY_INTRO =
  'O De.Croqui ERP é um sistema interno do estúdio De.Croqui para gestão de projetos, processos, agenda e arquivos. Esta política explica quais dados são usados, para quê, e como você pode controlá-los.';

export const SUPPORT_EMAIL = 'decroqui.arts@gmail.com';
export const GOOGLE_PERMISSIONS_URL = 'https://myaccount.google.com/permissions';

export interface PolicySection {
  heading: string;
  /** Parágrafo corrido (seções 1, 7 e 8). */
  text?: string;
  /** Lista de itens (seções 2 a 6). */
  items?: string[];
}

export const POLICY_SECTIONS: PolicySection[] = [
  {
    heading: '1. Quem acessa o sistema',
    text: 'Somente pessoas convidadas pelo administrador do estúdio podem entrar. O acesso é feito exclusivamente com a conta Google, sem senha no sistema.',
  },
  {
    heading: '2. Dados que coletamos',
    items: [
      'Dados da conta Google: nome, endereço de e-mail e identificador da conta, recebidos no login.',
      'Dados de uso: papel no sistema (administrador, colaborador ou somente leitura), data do último acesso e registros de ações feitas no sistema.',
      'Projetos e processos: nomes de projetos e clientes, etapas e histórico de movimentação.',
      'Arquivos: arquivos enviados aos projetos ficam na pasta do estúdio no Google Drive.',
      'Agenda: eventos criados no sistema ou no Google Agenda, dentro do calendário "De.Croqui ERP" da conta do administrador.',
      'Credenciais: para manter a conexão com o Google, o sistema guarda um token de acesso criptografado. Ele é usado somente para o Drive e a Agenda.',
    ],
  },
  {
    heading: '3. Como usamos os dados',
    items: [
      'Permitir o login e manter a sessão.',
      'Mostrar e atualizar projetos, processos, arquivos e eventos.',
      'Sincronizar a Agenda com o Google Agenda, nos dois sentidos.',
      'Enviar notificações internas entre colaboradores.',
      'Manter o registro de auditoria de alterações, para conferência.',
    ],
  },
  {
    heading: '4. O que não fazemos',
    items: [
      'Não vendemos dados.',
      'Não usamos dados para publicidade.',
      'Não compartilhamos dados com terceiros, exceto os provedores de infraestrutura listados abaixo.',
      'O uso de informações recebidas das APIs do Google segue a Política de Dados do Usuário dos Serviços de API do Google, incluindo os requisitos de Uso Limitado.',
    ],
  },
  {
    heading: '5. Onde os dados ficam',
    items: [
      'Banco de dados: Supabase, em São Paulo (Brasil).',
      'Aplicação: Vercel, em São Paulo (gru1).',
      'Arquivos e eventos: Google Drive e Google Agenda.',
    ],
  },
  {
    heading: '6. Por quanto tempo guardamos',
    items: [
      'Dados pessoais de um colaborador removido (nome, e-mail, identificador da conta, sessões e token de acesso) são apagados em até 30 dias após a remoção. Projetos e arquivos do estúdio não são apagados, porque pertencem ao estúdio.',
      'Registros de auditoria são mantidos por 1 ano, para conferência de quem fez cada alteração.',
      'Ao desconectar a Agenda, o token de acesso é apagado do sistema. Os eventos já criados continuam no Google Agenda.',
      'Pedidos de exclusão de dados pessoais feitos pelo e-mail de suporte seguem o mesmo prazo de 30 dias.',
    ],
  },
  {
    heading: '7. Seus direitos',
    text: 'Você pode pedir a qualquer momento o acesso, a correção ou a exclusão dos seus dados, pelo e-mail decroqui.arts@gmail.com. Você também pode revogar o acesso do sistema à sua conta Google em https://myaccount.google.com/permissions.',
  },
  {
    heading: '8. Contato',
    text: 'Dúvidas sobre esta política: decroqui.arts@gmail.com.',
  },
];
