/* @ds-bundle: {"format":4,"namespace":"DeCroquiDesignSystem_5f8fc8","components":[{"name":"ArchFrame","sourcePath":"components/core/ArchFrame.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Icon","sourcePath":"components/icon/Icon.jsx"},{"name":"ICON_NAMES","sourcePath":"components/icon/Icon.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"brand-kit/ComponentSections.jsx":"6c14c683117a","brand-kit/Foundations1.jsx":"54596fd44def","brand-kit/Foundations2.jsx":"1e46c1e87cfd","brand-kit/Instagram.jsx":"f844d8b6077a","brand-kit/Kits.jsx":"5fc5cbf84cef","brand-kit/Shell.jsx":"5ddd4674d6db","brand-kit/ig-icons.js":"233ded3301d7","components/core/ArchFrame.jsx":"e88d9ddc1fa3","components/core/Badge.jsx":"5fcb21402095","components/core/Button.jsx":"646eb7e1383c","components/core/Card.jsx":"cf3dc30fb15e","components/core/IconButton.jsx":"34c9b4fdff76","components/core/Tag.jsx":"492a75e56318","components/feedback/Dialog.jsx":"b87ed48a4321","components/feedback/Toast.jsx":"69188a125dba","components/feedback/Tooltip.jsx":"c7b400aadd1b","components/forms/Checkbox.jsx":"666b74aa9b7c","components/forms/Input.jsx":"219e2a4fb845","components/forms/Radio.jsx":"a36f27e70d87","components/forms/Select.jsx":"0cc8be9bf942","components/forms/Switch.jsx":"2e79e1fa9e88","components/icon/Icon.jsx":"d00a9622c314","components/navigation/Tabs.jsx":"350d40abd36a","logo-anim/LogoReel.jsx":"36d8e29614b3","logo-anim/PlantaReel.jsx":"8ea949d939b4","logo-anim/PlantaSound.jsx":"c6f84b897ad4","logo-anim/animations-v3.jsx":"06ae64d470d6","logo-anim/tweaks-panel.jsx":"d259e3a86f73","ui_kits/website/Contact.jsx":"e0769299f68a","ui_kits/website/Footer.jsx":"5a01de0d67c1","ui_kits/website/Header.jsx":"125f67e4fec0","ui_kits/website/Home.jsx":"5f54dcd83e60","ui_kits/website/Portfolio.jsx":"e6b590780acf","ui_kits/website/Project.jsx":"cd6c76dcb9be","ui_kits/website/data.js":"edbbcf6ea728"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DeCroquiDesignSystem_5f8fc8 = window.DeCroquiDesignSystem_5f8fc8 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// brand-kit/ComponentSections.jsx
try { (() => {
function Demo({
  label,
  children,
  dark,
  stone,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'bk-panel' + (dark ? ' dark' : '') + (stone ? ' stone' : ''),
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label",
    style: dark ? {
      color: 'var(--ardosia-300)'
    } : undefined
  }, label), children);
}
function ButtonsSection() {
  const {
    Button
  } = BK_DS;
  const [size, setSize] = React.useState('md');
  const [n, setN] = React.useState(0);
  return /*#__PURE__*/React.createElement(Section, {
    id: "c-botoes",
    eyebrow: "Componentes \xB7 Button",
    title: "Bot\xF5es",
    desc: "R\xF3tulos em caixa-alta espa\xE7ada, cantos de 2px. Vinho \xE9 reservado para a a\xE7\xE3o principal \u2014 no m\xE1ximo um por tela. Setas deslizam 3px no hover."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 6
    }
  }, ['sm', 'md', 'lg'].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setSize(s),
    style: {
      all: 'unset',
      cursor: 'pointer',
      font: '500 11px var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      padding: '8px 14px',
      borderRadius: 999,
      background: size === s ? 'var(--noite-900)' : 'transparent',
      color: size === s ? 'var(--linho-50)' : 'var(--text-secondary)',
      border: '1px solid ' + (size === s ? 'var(--noite-900)' : 'var(--border-default)')
    }
  }, s)), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      font: '400 13px var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, "Cliques: ", n)), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g2"
  }, /*#__PURE__*/React.createElement(Demo, {
    label: "Primary \xB7 Secondary \xB7 Outline"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row"
  }, /*#__PURE__*/React.createElement(Button, {
    size: size,
    iconRight: "arrow-right",
    onClick: () => setN(n + 1)
  }, "Agende uma conversa"), /*#__PURE__*/React.createElement(Button, {
    size: size,
    variant: "secondary",
    onClick: () => setN(n + 1)
  }, "Portf\xF3lio"), /*#__PURE__*/React.createElement(Button, {
    size: size,
    variant: "outline",
    onClick: () => setN(n + 1)
  }, "Saber mais"))), /*#__PURE__*/React.createElement(Demo, {
    label: "Ghost \xB7 Disabled"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: size,
    variant: "ghost",
    iconRight: "arrow-right"
  }, "Ver projeto"), /*#__PURE__*/React.createElement(Button, {
    size: size,
    disabled: true
  }, "Indispon\xEDvel"), /*#__PURE__*/React.createElement(Button, {
    size: size,
    variant: "outline",
    disabled: true
  }, "Esgotado"))), /*#__PURE__*/React.createElement(Demo, {
    label: "Sobre fundo escuro \xB7 Light",
    dark: true
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row"
  }, /*#__PURE__*/React.createElement(Button, {
    size: size,
    variant: "light",
    iconRight: "arrow-right"
  }, "Agende uma conversa"), /*#__PURE__*/React.createElement(Button, {
    size: size,
    variant: "ghost",
    style: {
      color: 'var(--linho-50)'
    }
  }, "Ver portf\xF3lio"))), /*#__PURE__*/React.createElement(Demo, {
    label: "Com \xEDcone \xB7 largura total"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: size,
    fullWidth: true,
    iconLeft: "calendar"
  }, "Escolher hor\xE1rio"), /*#__PURE__*/React.createElement(Button, {
    size: size,
    fullWidth: true,
    variant: "outline",
    iconLeft: "download"
  }, "Baixar apresenta\xE7\xE3o")))), /*#__PURE__*/React.createElement(Code, null, `const { Button } = window.DeCroquiDesignSystem_5f8fc8;
<Button variant="primary" size="${size}" iconRight="arrow-right">Agende uma conversa</Button>`));
}
function IconButtonsSection() {
  const {
    IconButton,
    Tooltip
  } = BK_DS;
  const [fav, setFav] = React.useState(false);
  const [i, setI] = React.useState(0);
  const slides = ['Sala', 'Pátio', 'Cozinha', 'Banho'];
  return /*#__PURE__*/React.createElement(Section, {
    id: "c-iconbtn",
    eyebrow: "Componentes \xB7 IconButton",
    title: "Icon buttons",
    desc: "C\xEDrculos para a\xE7\xF5es sem r\xF3tulo \u2014 carrossel, salvar, compartilhar, fechar. Sempre com label acess\xEDvel; a variante glass \xE9 exclusiva para uso sobre fotografia."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g4"
  }, ['outline', 'filled', 'ghost'].map(v => /*#__PURE__*/React.createElement(Demo, {
    key: v,
    label: v
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row"
  }, ['sm', 'md', 'lg'].map(s => /*#__PURE__*/React.createElement(IconButton, {
    key: s,
    icon: "arrow-right",
    label: "Pr\xF3ximo",
    variant: v,
    size: s
  }))))), /*#__PURE__*/React.createElement(Demo, {
    label: "glass",
    style: {
      background: 'var(--ardosia-600)',
      borderColor: 'transparent'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "heart",
    label: "Salvar",
    variant: "glass"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "share-2",
    label: "Compartilhar",
    variant: "glass"
  })))), /*#__PURE__*/React.createElement(Demo, {
    label: "Exemplo \xB7 carrossel de projeto",
    stone: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 260,
      borderRadius: 'var(--radius-arch-soft)',
      background: ['var(--vinho-700)', 'var(--ardosia-500)', 'var(--noite-800)', 'var(--linho-400)'][i],
      backgroundImage: 'var(--grain)',
      transition: 'background var(--duration-slow) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label",
    style: {
      position: 'absolute',
      left: 24,
      bottom: 22,
      color: 'var(--linho-50)'
    }
  }, "Foto \xB7 ", slides[i], " \xB7 ", i + 1, "/", slides.length), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 18,
      right: 18,
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Tooltip, {
    label: fav ? 'Salvo' : 'Salvar',
    placement: "bottom"
  }, /*#__PURE__*/React.createElement(IconButton, {
    variant: "glass",
    icon: "heart",
    label: "Salvar",
    onClick: () => setFav(!fav),
    style: fav ? {
      background: 'var(--vinho-800)'
    } : undefined
  })), /*#__PURE__*/React.createElement(IconButton, {
    variant: "glass",
    icon: "share-2",
    label: "Compartilhar"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 18,
      bottom: 18,
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    variant: "glass",
    icon: "arrow-left",
    label: "Anterior",
    onClick: () => setI((i + slides.length - 1) % slides.length)
  }), /*#__PURE__*/React.createElement(IconButton, {
    variant: "glass",
    icon: "arrow-right",
    label: "Pr\xF3ximo",
    onClick: () => setI((i + 1) % slides.length)
  })))));
}
function CardsSection() {
  const {
    Card,
    ArchFrame
  } = BK_DS;
  const [shape, setShape] = React.useState('soft');
  return /*#__PURE__*/React.createElement(Section, {
    id: "c-cards",
    eyebrow: "Componentes \xB7 Card \xB7 ArchFrame",
    title: "Cards & ArchFrame",
    desc: "O card editorial \xE9 imagem + texto direto sobre a p\xE1gina, sem caixa. O ArchFrame d\xE1 a silhueta de arco; sem foto, mostra um placeholder com gr\xE3o \u2014 nunca use imagem gen\xE9rica de banco."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 6
    }
  }, ['arch', 'soft', 'rect', 'round'].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setShape(s),
    style: {
      all: 'unset',
      cursor: 'pointer',
      font: '500 11px var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      padding: '8px 14px',
      borderRadius: 999,
      background: shape === s ? 'var(--noite-900)' : 'transparent',
      color: shape === s ? 'var(--linho-50)' : 'var(--text-secondary)',
      border: '1px solid ' + (shape === s ? 'var(--noite-900)' : 'var(--border-default)')
    }
  }, s))), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g3",
    style: {
      gap: 28
    }
  }, /*#__PURE__*/React.createElement(Card, {
    shape: shape,
    eyebrow: "Residencial \xB7 Trancoso",
    title: "Casa Alecrim",
    description: "Cal, travertino e luz rasante.",
    imageLabel: "Foto \xB7 Casa Alecrim",
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(Card, {
    shape: shape,
    eyebrow: "Hospitalidade \xB7 Lisboa",
    title: "Su\xEDte Figueira",
    description: "Veludo vinho e gesso.",
    imageLabel: "Foto \xB7 Su\xEDte Figueira",
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(Card, {
    shape: shape,
    variant: "boxed",
    eyebrow: "Servi\xE7o",
    title: "Consultoria",
    description: "Uma visita, um croqui e uma paleta para come\xE7ar.",
    meta: "A partir de 2 semanas",
    imageLabel: "Croqui",
    ratio: "4 / 3"
  })), /*#__PURE__*/React.createElement(Sub, {
    title: "ArchFrame \xB7 tons de placeholder"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g4"
  }, ['stone', 'slate', 'wine', 'night'].map(t => /*#__PURE__*/React.createElement(ArchFrame, {
    key: t,
    shape: shape,
    tone: t,
    ratio: "3 / 4",
    label: t
  })))));
}
function FormsSection() {
  const {
    Input,
    Select,
    Button
  } = BK_DS;
  const [variant, setVariant] = React.useState('line');
  const [email, setEmail] = React.useState('ana@exemplo');
  const err = email && !/.+@.+\..+/.test(email) ? 'Verifique o endereço de e-mail' : '';
  return /*#__PURE__*/React.createElement(Section, {
    id: "c-forms",
    eyebrow: "Componentes \xB7 Input \xB7 Select",
    title: "Formul\xE1rios",
    desc: "Campos com r\xF3tulo em caixa-alta. A variante line (s\xF3 a linha inferior) \xE9 editorial e padr\xE3o; box \xE9 para \xE1reas densas e textos longos."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 6
    }
  }, ['line', 'box'].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setVariant(s),
    style: {
      all: 'unset',
      cursor: 'pointer',
      font: '500 11px var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      padding: '8px 14px',
      borderRadius: 999,
      background: variant === s ? 'var(--noite-900)' : 'transparent',
      color: variant === s ? 'var(--linho-50)' : 'var(--text-secondary)',
      border: '1px solid ' + (variant === s ? 'var(--noite-900)' : 'var(--border-default)')
    }
  }, s))), /*#__PURE__*/React.createElement("div", {
    className: "bk-panel",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
      gap: '28px 40px'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    variant: variant,
    label: "Nome",
    placeholder: "Como gostaria de ser chamado"
  }), /*#__PURE__*/React.createElement(Input, {
    variant: variant,
    label: "E-mail \xB7 valida\xE7\xE3o ao vivo",
    iconLeft: "mail",
    value: email,
    onChange: e => setEmail(e.target.value),
    error: err,
    hint: err ? '' : 'Tudo certo'
  }), /*#__PURE__*/React.createElement(Select, {
    variant: variant,
    label: "Tipo de projeto",
    placeholder: "Selecione",
    options: ['Residencial', 'Comercial', 'Hospitalidade']
  }), /*#__PURE__*/React.createElement(Input, {
    variant: variant,
    label: "Cidade",
    placeholder: "S\xE3o Paulo",
    hint: "Atendemos Brasil e Portugal"
  }), /*#__PURE__*/React.createElement(Input, {
    variant: variant,
    label: "Desabilitado",
    placeholder: "Indispon\xEDvel",
    disabled: true
  }), /*#__PURE__*/React.createElement(Select, {
    variant: variant,
    label: "Or\xE7amento",
    defaultValue: "b",
    options: [{
      value: 'a',
      label: 'Até R$ 150 mil'
    }, {
      value: 'b',
      label: 'R$ 150–400 mil'
    }, {
      value: 'c',
      label: 'Acima de R$ 400 mil'
    }]
  }), /*#__PURE__*/React.createElement(Input, {
    variant: "box",
    multiline: true,
    rows: 4,
    label: "Conte-nos sobre o seu espa\xE7o",
    placeholder: "O que voc\xEA guarda, o que voc\xEA sonha\u2026",
    style: {
      gridColumn: '1 / -1'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1',
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    iconRight: "arrow-right",
    disabled: !!err
  }, "Enviar pedido"))));
}
function SelectionSection() {
  const {
    Checkbox,
    Radio,
    Switch
  } = BK_DS;
  const [rooms, setRooms] = React.useState({
    Sala: true,
    Cozinha: false,
    Quartos: true,
    Varanda: false
  });
  const [plan, setPlan] = React.useState('projeto');
  const [sw, setSw] = React.useState({
    news: true,
    visita: false,
    video: true
  });
  return /*#__PURE__*/React.createElement(Section, {
    id: "c-selecao",
    eyebrow: "Componentes \xB7 Checkbox \xB7 Radio \xB7 Switch",
    title: "Sele\xE7\xE3o",
    desc: "Quadrados para m\xFAltipla escolha, c\xEDrculos para escolha \xFAnica, switch para prefer\xEAncias que valem na hora. Vinho marca o selecionado; noite marca o ligado."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g3"
  }, /*#__PURE__*/React.createElement(Demo, {
    label: 'Checkbox · ' + Object.values(rooms).filter(Boolean).length + ' ambientes'
  }, Object.keys(rooms).map(r => /*#__PURE__*/React.createElement(Checkbox, {
    key: r,
    label: r,
    checked: rooms[r],
    onChange: v => setRooms({
      ...rooms,
      [r]: v
    })
  })), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Desabilitado",
    disabled: true
  })), /*#__PURE__*/React.createElement(Demo, {
    label: "Radio \xB7 servi\xE7o"
  }, [['consultoria', 'Consultoria', 'Uma visita e uma paleta.'], ['projeto', 'Projeto completo', 'Do conceito à obra.'], ['acompanhamento', 'Acompanhamento', 'Gestão da obra.']].map(([v, l, d]) => /*#__PURE__*/React.createElement(Radio, {
    key: v,
    name: "bk-plan",
    value: v,
    label: l,
    description: d,
    checked: plan === v,
    onChange: setPlan
  }))), /*#__PURE__*/React.createElement(Demo, {
    label: "Switch \xB7 prefer\xEAncias"
  }, [['news', 'Caderno mensal'], ['visita', 'Visita presencial'], ['video', 'Aceito chamada de vídeo']].map(([k, l]) => /*#__PURE__*/React.createElement(Switch, {
    key: k,
    label: l,
    checked: sw[k],
    onChange: v => setSw({
      ...sw,
      [k]: v
    })
  })), /*#__PURE__*/React.createElement(Switch, {
    label: "Desabilitado",
    disabled: true
  }))));
}
function TabsSection() {
  const {
    Tabs
  } = BK_DS;
  const [a, setA] = React.useState('conceito');
  const [b, setB] = React.useState('Salas');
  const copy = {
    conceito: 'Um pátio central organiza a casa; arcos filtram a luz da tarde.',
    materiais: 'Travertino romano, cal, linho cru e latão escovado.',
    planta: 'Térreo de 220 m² voltado ao jardim; suítes no andar superior.',
    galeria: '24 fotografias · outono de 2026.'
  };
  return /*#__PURE__*/React.createElement(Section, {
    id: "c-tabs",
    eyebrow: "Componentes \xB7 Tabs",
    title: "Tabs",
    desc: "Line para navega\xE7\xE3o de interface; serif para navega\xE7\xE3o editorial de categorias, com a aba ativa em it\xE1lico. O sublinhado vinho marca a posi\xE7\xE3o."
  }, /*#__PURE__*/React.createElement(Demo, {
    label: "line"
  }, /*#__PURE__*/React.createElement(Tabs, {
    items: [{
      id: 'conceito',
      label: 'Conceito'
    }, {
      id: 'materiais',
      label: 'Materiais'
    }, {
      id: 'planta',
      label: 'Planta'
    }, {
      id: 'galeria',
      label: 'Galeria'
    }],
    value: a,
    onChange: setA
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 22px/1.4 var(--font-display)',
      color: 'var(--text-primary)',
      minHeight: 62
    }
  }, copy[a])), /*#__PURE__*/React.createElement(Demo, {
    label: "serif",
    stone: true
  }, /*#__PURE__*/React.createElement(Tabs, {
    variant: "serif",
    items: ['Salas', 'Quartos', 'Cozinhas', 'Jardins'],
    value: b,
    onChange: setB
  })));
}
function FeedbackSection() {
  const {
    Dialog,
    Toast,
    Tooltip,
    Button,
    IconButton
  } = BK_DS;
  const [open, setOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const fire = t => {
    setToast(t);
    clearTimeout(window.__bkT);
    window.__bkT = setTimeout(() => setToast(null), 3600);
  };
  const T = {
    success: ['Pedido recebido', 'Respondemos em até dois dias úteis.'],
    warning: ['Horário quase lotado', 'Restam duas vagas nesta semana.'],
    danger: ['Não foi possível enviar', 'Verifique sua conexão e tente de novo.'],
    neutral: ['Novo projeto publicado', 'Casa Oliva já está no portfólio.']
  };
  return /*#__PURE__*/React.createElement(Section, {
    id: "c-feedback",
    eyebrow: "Componentes \xB7 Dialog \xB7 Toast \xB7 Tooltip",
    title: "Dialog, Toast & Tooltip",
    desc: "Camadas flutuantes sempre em noite ou papel, com sombra lg. Di\xE1logo sobre v\xE9u noite com desfoque; toast no canto inferior esquerdo; tooltip curto, s\xF3 no hover."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g3"
  }, /*#__PURE__*/React.createElement(Demo, {
    label: "Dialog"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 15px/1.6 var(--font-body)',
      color: 'var(--text-secondary)'
    }
  }, "Modal para tarefas focadas: agendar, confirmar."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Button, {
    iconRight: "calendar",
    onClick: () => setOpen(true)
  }, "Abrir di\xE1logo"))), /*#__PURE__*/React.createElement(Demo, {
    label: "Toast \xB7 disparar"
  }, Object.keys(T).map(t => /*#__PURE__*/React.createElement("div", {
    key: t
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "outline",
    onClick: () => fire(t)
  }, t)))), /*#__PURE__*/React.createElement(Demo, {
    label: "Tooltip \xB7 passe o mouse"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 14,
      paddingTop: 30
    }
  }, [['Travertino', 'var(--linho-300)'], ['Latão', 'var(--latao-500)'], ['Oliveira', 'var(--oliva-600)'], ['Vinho', 'var(--vinho-800)']].map(([l, c]) => /*#__PURE__*/React.createElement(Tooltip, {
    key: l,
    label: l
  }, /*#__PURE__*/React.createElement("span", {
    tabIndex: 0,
    style: {
      width: 44,
      height: 56,
      background: c,
      backgroundImage: 'var(--grain)',
      borderRadius: 'var(--radius-arch-soft)',
      display: 'inline-block'
    }
  }))), /*#__PURE__*/React.createElement(Tooltip, {
    label: "Compartilhar"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "share-2",
    label: "Compartilhar"
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g2",
    style: {
      background: 'var(--linho-100)',
      padding: 24,
      borderRadius: 'var(--radius-sm)'
    }
  }, ['success', 'danger'].map(t => /*#__PURE__*/React.createElement(Toast, {
    key: t,
    tone: t,
    title: T[t][0],
    message: T[t][1],
    onClose: () => {}
  }))), /*#__PURE__*/React.createElement(Dialog, {
    open: open,
    onClose: () => setOpen(false),
    eyebrow: "Consulta",
    title: "Vamos conversar sobre a sua casa",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setOpen(false)
    }, "Agora n\xE3o"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => {
        setOpen(false);
        fire('success');
      }
    }, "Agendar"))
  }, "Uma primeira conversa de 40 minutos, sem compromisso \u2014 por v\xEDdeo ou no est\xFAdio."), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      left: 24,
      bottom: 24,
      zIndex: 300
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: toast,
    title: T[toast][0],
    message: T[toast][1],
    onClose: () => setToast(null)
  })));
}
Object.assign(window, {
  Demo,
  ButtonsSection,
  IconButtonsSection,
  CardsSection,
  FormsSection,
  SelectionSection,
  TabsSection,
  FeedbackSection
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "brand-kit/ComponentSections.jsx", error: String((e && e.message) || e) }); }

// brand-kit/Foundations1.jsx
try { (() => {
const BK_COLORS = {
  brand: [{
    name: 'Vinho',
    hex: '#490b1a',
    token: '--vinho-800',
    role: 'Primária · ações, ênfase',
    fg: '#efe0df'
  }, {
    name: 'Noite',
    hex: '#142841',
    token: '--noite-900',
    role: 'Tinta · fundos escuros',
    fg: '#aab8c9'
  }, {
    name: 'Ardósia',
    hex: '#798da6',
    token: '--ardosia-500',
    role: 'Secundária fria',
    fg: '#142841'
  }, {
    name: 'Linho',
    hex: '#e5ded2',
    token: '--linho-200',
    role: 'Pedra · fundos claros',
    fg: '#490b1a'
  }],
  scales: [['Vinho', [['900', '#2e0610'], ['800', '#490b1a'], ['700', '#621a2b'], ['600', '#7c2c3d'], ['400', '#a86672'], ['200', '#d9b8bc'], ['100', '#efe0df']], 'vinho'], ['Noite', [['950', '#0b1726'], ['900', '#142841'], ['800', '#1f3655'], ['700', '#2e4868']], 'noite'], ['Ardósia', [['700', '#4f627b'], ['600', '#62768f'], ['500', '#798da6'], ['300', '#aab8c9'], ['200', '#c9d2dd'], ['100', '#e4e9ef']], 'ardosia'], ['Linho', [['50', '#f7f3ed'], ['100', '#efe9df'], ['200', '#e5ded2'], ['300', '#d6ccbc'], ['400', '#bdb09b'], ['600', '#8c806c']], 'linho']],
  materials: [{
    name: 'Latão',
    hex: '#a88a5a',
    token: '--latao-500',
    use: 'Metais · detalhe'
  }, {
    name: 'Latão claro',
    hex: '#cdb68f',
    token: '--latao-300',
    use: 'Metais · realce'
  }, {
    name: 'Oliva',
    hex: '#5c6a45',
    token: '--oliva-600',
    use: 'Plantas · sucesso'
  }, {
    name: 'Ocre',
    hex: '#a8762a',
    token: '--ocre-600',
    use: 'Terra · atenção'
  }, {
    name: 'Terracota',
    hex: '#9c4a2f',
    token: '--terracota-600',
    use: 'Argila · erro'
  }],
  semantic: [['--surface-page', 'Fundo da página', '--linho-50'], ['--surface-card', 'Cartões', '#fbf8f3'], ['--surface-stone', 'Faixas de pedra', '--linho-200'], ['--surface-inverse', 'Hero, rodapé', '--noite-900'], ['--surface-brand', 'Faixa de destaque', '--vinho-800'], ['--text-primary', 'Texto principal', '--noite-900'], ['--text-secondary', 'Texto de apoio', '--ardosia-700'], ['--text-muted', 'Metadados', '--linho-600'], ['--text-brand', 'Eyebrows, links', '--vinho-800'], ['--action-primary', 'Botão primário', '--vinho-800'], ['--border-hairline', 'Divisórias', 'noite 14%'], ['--focus-ring', 'Foco', '--ardosia-500']]
};
function bkLum(hex) {
  const c = hex.replace('#', '').match(/../g).map(h => {
    const v = parseInt(h, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function bkContrast(a, b) {
  const x = bkLum(a),
    y = bkLum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function OverviewSection() {
  const {
    ArchFrame
  } = BK_DS;
  return /*#__PURE__*/React.createElement(Section, {
    id: "visao",
    eyebrow: "Fundamentos \xB7 01",
    title: "Vis\xE3o geral",
    desc: "De.Croqui desenha interiores com est\xE9tica mediterr\xE2nea e luxo silencioso. Cada casa come\xE7a num croqui \xE0 m\xE3o \u2014 e termina guardando a hist\xF3ria de quem mora nela."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-split",
    style: {
      '--split': '1.35fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-panel dark",
    style: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: 40,
      minHeight: 360,
      padding: 40
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label",
    style: {
      color: 'var(--ardosia-300)'
    }
  }, "Manifesto"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 44px/1.12 var(--font-display)',
      color: 'var(--linho-50)'
    }
  }, "O conceito antes da forma. A pedra antes do acabamento. ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: 'var(--linho-200)'
    }
  }, "A sua hist\xF3ria antes de tudo.")), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px/1 var(--font-body)',
      color: 'var(--ardosia-300)',
      letterSpacing: '.04em'
    }
  }, "P\xFAblico \xB7 18 a 80 anos \xB7 Brasil & Portugal")), /*#__PURE__*/React.createElement(ArchFrame, {
    shape: "arch",
    ratio: "auto",
    tone: "wine",
    label: "Foto \xB7 interior assinatura",
    style: {
      minHeight: 360
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g4"
  }, [['Aconchego', 'Luz baixa, tecidos naturais, escala humana.'], ['Autenticidade', 'Materiais reais, nomeados pelo que são.'], ['História', 'Peças com proveniência; casas com memória.'], ['Conceito', 'Todo projeto nasce de uma ideia desenhada.']].map(([t, d], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      borderTop: '1px solid var(--border-strong)',
      paddingTop: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label"
  }, "0", i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 30px/1.05 var(--font-display)',
      color: 'var(--text-primary)'
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '300 14.5px/1.55 var(--font-body)',
      color: 'var(--text-secondary)'
    }
  }, d)))), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-panel stone"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label",
    style: {
      color: 'var(--vinho-800)'
    }
  }, "Somos"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: '16px 0 0',
      padding: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      font: 'italic 300 24px/1.25 var(--font-display)',
      color: 'var(--text-primary)'
    }
  }, /*#__PURE__*/React.createElement("li", null, "Silenciosos, n\xE3o minimalistas."), /*#__PURE__*/React.createElement("li", null, "Luxuosos pela mat\xE9ria, n\xE3o pelo brilho."), /*#__PURE__*/React.createElement("li", null, "Mediterr\xE2neos, com sotaque brasileiro."))), /*#__PURE__*/React.createElement("div", {
    className: "bk-panel"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label",
    style: {
      color: 'var(--terracota-600)'
    }
  }, "N\xE3o somos"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: '16px 0 0',
      padding: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      font: '300 24px/1.25 var(--font-display)',
      color: 'var(--text-secondary)',
      textDecoration: 'line-through',
      textDecorationColor: 'var(--terracota-600)',
      textDecorationThickness: '1px'
    }
  }, /*#__PURE__*/React.createElement("li", null, "Bregas ou ostensivos"), /*#__PURE__*/React.createElement("li", null, "Gen\xE9ricos de cat\xE1logo"), /*#__PURE__*/React.createElement("li", null, "Sem personalidade")))));
}
function Wordmark({
  color = 'var(--vinho-800)',
  size = 56,
  tagline,
  stacked
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: stacked ? 'column' : 'row',
      alignItems: stacked ? 'center' : 'baseline',
      gap: stacked ? 10 : 16,
      color
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 ' + size + 'px/1 var(--font-display)',
      letterSpacing: '.01em',
      whiteSpace: 'nowrap'
    }
  }, "De.Croqui"), tagline && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 ' + Math.max(9, size * 0.17) + 'px/1 var(--font-body)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap'
    }
  }, "Interiores"));
}
async function bkDownload(e, path) {
  e.preventDefault();
  const name = path.split('/').pop();
  try {
    const txt = await (await fetch(path)).text();
    const url = URL.createObjectURL(new Blob([txt], {
      type: 'image/svg+xml'
    }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    window.dispatchEvent(new CustomEvent('bk-copied', {
      detail: {
        text: name,
        label: 'Se o download não iniciar, use “Abrir” e salve com o botão direito.'
      }
    }));
  } catch (err) {
    window.open(path, '_blank');
  }
}
function LogosSection() {
  const files = [['Isotipo', 'decroqui-isotipo'], ['Imagotipo horizontal', 'decroqui-imagotipo-horizontal'], ['Imagotipo vertical', 'decroqui-imagotipo-vertical']];
  const vars = [['escuro', 'var(--linho-50)', 'Para fundos claros'], ['claro', 'var(--vinho-800)', 'Para fundos escuros'], ['vinho', 'var(--linho-200)', 'Monocromático']];
  return /*#__PURE__*/React.createElement(Section, {
    id: "logos",
    eyebrow: "Fundamentos \xB7 02",
    title: "Logos",
    desc: "v22 \xB7 Planta baixa \u2014 o s\xEDmbolo de porta das plantas de arquitetura: duas paredes e a porta que se abre. O projeto como convite: entre. Arquivos SVG com texto j\xE1 convertido em curvas."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-split",
    style: {
      '--split': '1fr 1.6fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-panel",
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 300
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/logo/decroqui-isotipo-escuro.svg",
    alt: "Isotipo De.Croqui",
    style: {
      width: 200
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "bk-panel stone",
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 300
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/logo/decroqui-imagotipo-horizontal-escuro.svg",
    alt: "Imagotipo De.Croqui",
    style: {
      width: '80%',
      maxWidth: 520
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g3"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--vinho-800)',
      borderRadius: 'var(--radius-sm)',
      height: 220,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/logo/decroqui-imagotipo-vertical-claro.svg",
    alt: "",
    style: {
      height: 160
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--noite-900)',
      borderRadius: 'var(--radius-sm)',
      height: 220,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/logo/decroqui-imagotipo-horizontal-claro.svg",
    alt: "",
    style: {
      width: '80%'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--linho-200)',
      borderRadius: 'var(--radius-sm)',
      height: 220,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/logo/decroqui-isotipo-vinho.svg",
    alt: "",
    style: {
      width: 90
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 7,
      background: 'var(--vinho-800)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/logo/decroqui-isotipo-claro.svg",
    alt: "",
    style: {
      width: 26
    }
  })))), /*#__PURE__*/React.createElement(Sub, {
    title: "Arquivos",
    note: "SVG vetorial \xB7 clique para baixar \xB7 ou abra e use Salvar como"
  }, /*#__PURE__*/React.createElement("table", {
    className: "bk-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Pe\xE7a"), vars.map(([v,, u]) => /*#__PURE__*/React.createElement("th", {
    key: v
  }, v, " \xB7 ", u)))), /*#__PURE__*/React.createElement("tbody", null, files.map(([n, base]) => /*#__PURE__*/React.createElement("tr", {
    key: base
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      color: 'var(--text-primary)'
    }
  }, n), vars.map(([v, bg]) => /*#__PURE__*/React.createElement("td", {
    key: v
  }, /*#__PURE__*/React.createElement("a", {
    href: 'assets/logo/' + base + '-' + v + '.svg',
    target: "_blank",
    rel: "noopener",
    onClick: e => bkDownload(e, 'assets/logo/' + base + '-' + v + '.svg'),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 30,
      background: bg,
      borderRadius: 2,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: 'assets/logo/' + base + '-' + v + '.svg',
    alt: "",
    style: {
      maxWidth: 36,
      maxHeight: 22
    }
  })), ".svg")))))))), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g3"
  }, [['Área de respiro', 'Metade da largura do isotipo em todos os lados.'], ['Tamanho mínimo', 'Isotipo 16px (favicon) · imagotipo 120px de largura.'], ['Não fazer', 'Não distorcer, não girar, não trocar as cores das paredes e da porta, não fechar a porta.']].map(([t, d]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      borderTop: '1px solid var(--border-strong)',
      paddingTop: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label"
  }, t), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 14.5px/1.55 var(--font-body)',
      color: 'var(--text-secondary)',
      marginTop: 10
    }
  }, d)))));
}
function LogoMotionSection() {
  const {
    Switch,
    Button
  } = BK_DS;
  const [som, setSom] = React.useState(false);
  const refs = [React.useRef(null), React.useRef(null)];
  const files = som ? ['logo/Logo Animation V22 Som.html', 'logo/Logo Animation V22 Vertical Som.html'] : ['logo/Logo Animation V22.html', 'logo/Logo Animation V22 Vertical.html'];
  const box = (i, ratio, label) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: ratio,
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
      background: 'var(--noite-950)',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("iframe", {
    key: files[i],
    ref: refs[i],
    src: files[i] + (som ? '?som=1&embed=1' : ''),
    allow: "autoplay",
    title: label,
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      border: 0
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      font: '400 13px var(--font-body)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("a", {
    href: files[i],
    target: "_blank"
  }, "Abrir \u2197")));
  const wav = () => {
    const w = refs[0].current && refs[0].current.contentWindow;
    if (w && w.V22Sound) w.V22Sound.wav();
  };
  return /*#__PURE__*/React.createElement(Section, {
    id: "logo-motion",
    eyebrow: "Fundamentos \xB7 03",
    title: "Logo animado",
    desc: "Fecho para v\xEDdeos: a prancheta, as paredes, a porta que se abre e o nome que entra. 9,4s em loop. Ligue o som para ouvir a vers\xE3o com efeitos \u2014 papel, l\xE1pis, porta, sino e acorde, sem fundo sonoro. Exporte o v\xEDdeo pelo menu Share \u2192 Export \u2192 Video dentro de cada arquivo; a trilha sai \xE0 parte em .wav."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 20,
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: som ? 'Som ligado · versão com efeitos sonoros' : 'Som desligado · versão original',
    checked: som,
    onChange: setSom
  }), som && /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "outline",
    iconLeft: "download",
    onClick: wav
  }, "Baixar trilha .wav")), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid",
    style: {
      gridTemplateColumns: 'minmax(0,2.2fr) minmax(0,1fr)',
      gap: 20,
      alignItems: 'start'
    }
  }, box(0, '16 / 9', 'Horizontal · 1920×1080'), box(1, '9 / 16', 'Vertical · 1080×1920 (Reels, Stories, TikTok)')), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g4"
  }, [['01 · Prancheta', 'Grade e linhas-guia', 'Sopro de papel, guias, toques de lápis'], ['02 · Paredes', 'Traço grosso + cotas', 'Grafite no papel, ticks das cotas'], ['03 · Porta', 'Abre com o arco · “entre.”', 'Sopro grave, batente de madeira, sino'], ['04 · Nome', 'Recuo de câmera, nome e frase', 'Varredura, acorde quente, brilho']].map(([t, d, a]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      borderTop: '1px solid var(--border-strong)',
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 22px/1.1 var(--font-display)'
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 13px var(--font-body)',
      color: 'var(--text-secondary)',
      marginTop: 6
    }
  }, d), som && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'italic 400 15px/1.3 var(--font-display)',
      color: 'var(--vinho-800)',
      marginTop: 6
    }
  }, "Som \u2014 ", a)))));
}
function ColorsSection() {
  const [fg, setFg] = React.useState('#142841');
  const [bg, setBg] = React.useState('#e5ded2');
  const ratio = bkContrast(fg, bg);
  const all = [...BK_COLORS.brand.map(c => [c.name, c.hex]), ['Papel', '#f7f3ed'], ['Ardósia 700', '#4f627b'], ['Latão', '#a88a5a']];
  return /*#__PURE__*/React.createElement(Section, {
    id: "cores",
    eyebrow: "Fundamentos \xB7 04",
    title: "Cores",
    desc: "Quatro cores-m\xE3e tiradas da paleta original, escalas derivadas para interface e acentos de materiais \u2014 pedra, metal, planta, argila. Clique em qualquer cor para copiar o hex."
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
      height: 300
    }
  }, BK_COLORS.brand.map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: c.hex,
    onClick: () => bkCopy(c.hex, c.name),
    title: 'Copiar ' + c.hex,
    style: {
      all: 'unset',
      cursor: 'pointer',
      background: c.hex,
      color: c.fg,
      borderRadius: '0 48px 0 0',
      marginLeft: i ? -48 : 0,
      paddingLeft: i ? 48 : 0,
      position: 'relative',
      zIndex: 4 - i,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 24px 24px ' + (i ? 20 : 24) + 'px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 clamp(22px,2.4vw,34px)/1 var(--font-display)'
    }
  }, c.name), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px/1.4 var(--font-body)',
      opacity: .9
    }
  }, c.hex.toUpperCase(), /*#__PURE__*/React.createElement("br", null), c.token), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '300 12px/1.3 var(--font-body)',
      opacity: .75
    }
  }, c.role))))), BK_COLORS.scales.map(([name, steps, key]) => /*#__PURE__*/React.createElement(Sub, {
    key: name,
    title: name,
    note: steps.length + ' tons'
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-grid",
    style: {
      gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))',
      gap: 10
    }
  }, steps.map(([s, h]) => /*#__PURE__*/React.createElement(Swatch, {
    key: s,
    name: name + ' ' + s,
    hex: h,
    token: '--' + key + '-' + s
  }))))), /*#__PURE__*/React.createElement(Sub, {
    title: "Materiais & feedback",
    note: "usar com parcim\xF4nia"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-grid",
    style: {
      gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))',
      gap: 10
    }
  }, BK_COLORS.materials.map(m => /*#__PURE__*/React.createElement(Swatch, {
    key: m.token,
    name: m.name + ' · ' + m.use,
    hex: m.hex,
    token: m.token
  })))), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-split",
    style: {
      '--split': '1.3fr 1fr',
      gap: 16,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Sub, {
    title: "Tokens sem\xE2nticos"
  }, /*#__PURE__*/React.createElement("table", {
    className: "bk-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null), /*#__PURE__*/React.createElement("th", null, "Token"), /*#__PURE__*/React.createElement("th", null, "Uso"), /*#__PURE__*/React.createElement("th", null, "Valor"))), /*#__PURE__*/React.createElement("tbody", null, BK_COLORS.semantic.map(([t, u, v]) => /*#__PURE__*/React.createElement("tr", {
    key: t
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      width: 28
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: 18,
      height: 18,
      borderRadius: 4,
      background: 'var(' + t + ')',
      border: '1px solid var(--border-hairline)'
    }
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, t)), /*#__PURE__*/React.createElement("td", null, u), /*#__PURE__*/React.createElement("td", null, v)))))), /*#__PURE__*/React.createElement(Sub, {
    title: "Teste de contraste",
    note: "WCAG 2.1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-panel",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      color: fg,
      borderRadius: 'var(--radius-xs)',
      padding: '28px 24px',
      border: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 38px/1 var(--font-display)'
    }
  }, "Casa Alecrim"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 14px/1.5 var(--font-body)',
      marginTop: 8
    }
  }, "Travertino, cal e linho cru.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '300 48px/1 var(--font-display)',
      color: 'var(--text-primary)'
    }
  }, ratio.toFixed(2), ":1"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1 var(--font-body)',
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: ratio >= 4.5 ? 'var(--oliva-600)' : ratio >= 3 ? 'var(--ocre-600)' : 'var(--terracota-600)'
    }
  }, ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA títulos' : 'Reprovado')), [['Texto', fg, setFg], ['Fundo', bg, setBg]].map(([l, v, set]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label",
    style: {
      width: 52
    }
  }, l), all.map(([n, h]) => /*#__PURE__*/React.createElement("button", {
    key: h,
    title: n,
    onClick: () => set(h),
    style: {
      all: 'unset',
      cursor: 'pointer',
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: h,
      boxShadow: v === h ? '0 0 0 2px var(--surface-card),0 0 0 3px var(--noite-900)' : 'inset 0 0 0 1px rgba(20,40,65,.15)'
    }
  }))))))), /*#__PURE__*/React.createElement(Sub, {
    title: "Propor\xE7\xE3o de uso",
    note: "por \xE1rea numa composi\xE7\xE3o t\xEDpica"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: 56,
      borderRadius: 'var(--radius-xs)',
      overflow: 'hidden'
    }
  }, [['Linho / papel', 58, '#f7f3ed', '#142841'], ['Noite', 22, '#142841', '#f7f3ed'], ['Ardósia', 10, '#798da6', '#142841'], ['Vinho', 8, '#490b1a', '#efe0df'], ['', 2, '#a88a5a', '#142841']].map(([n, p, c, t]) => /*#__PURE__*/React.createElement("div", {
    key: c,
    style: {
      flex: p,
      background: c,
      color: t,
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      font: '400 12px var(--font-body)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      borderRight: c === '#f7f3ed' ? '1px solid var(--border-hairline)' : 0
    }
  }, n && n + ' · ' + p + '%')))));
}
function TypeSection() {
  const [size, setSize] = React.useState(72);
  const [italic, setItalic] = React.useState(false);
  const [weight, setWeight] = React.useState(300);
  const roles = [['Display', '--type-display', '300 88px/1.02 var(--font-display)', 'Casa com memória', '88 / 1.02 · Light'], ['H1', '--type-h1', '300 64px/1.02 var(--font-display)', 'O conceito antes da forma', '64 / 1.02 · Light'], ['H2', '--type-h2', '400 48px/1.15 var(--font-display)', 'Projetos residenciais', '48 / 1.15 · Regular'], ['H3', '--type-h3', '400 28px/1.15 var(--font-display)', 'Casa Alecrim, Trancoso', '28 / 1.15 · Regular'], ['Lead', '--type-lead', '300 18px/1.7 var(--font-body)', 'Desenhamos interiores que guardam histórias — pedra, luz e textura em equilíbrio.', '18 / 1.7 · Jost Light'], ['Body', '--type-body', '400 16px/1.5 var(--font-body)', 'Cada projeto começa por um croqui à mão. A partir dele, escolhemos materiais naturais e peças com proveniência.', '16 / 1.5 · Jost Regular'], ['Small', '--type-small', '400 14px/1.5 var(--font-body)', 'Legendas, metadados e notas de rodapé.', '14 / 1.5 · Jost Regular']];
  return /*#__PURE__*/React.createElement(Section, {
    id: "tipografia",
    eyebrow: "Fundamentos \xB7 05",
    title: "Tipografia",
    desc: "Uma serifa cl\xE1ssica e leve para emo\xE7\xE3o e uma geom\xE9trica humanista para clareza. O contraste entre t\xEDtulos enormes e r\xF3tulos min\xFAsculos espa\xE7ados \xE9 a assinatura da marca."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g2"
  }, [['Cormorant Garamond', 'var(--font-display)', 'Display & títulos', '300 · 400 · 500 · 600 + itálicos', 'Aa'], ['Jost', 'var(--font-body)', 'Texto, rótulos, interface', '300 · 400 · 500', 'Aa']].map(([n, f, u, w, s], i) => /*#__PURE__*/React.createElement("div", {
    key: n,
    className: 'bk-panel' + (i ? '' : ' dark'),
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      minHeight: 300
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label",
    style: {
      color: i ? undefined : 'var(--ardosia-300)'
    }
  }, u), /*#__PURE__*/React.createElement("span", {
    className: "bk-label",
    style: {
      color: i ? undefined : 'var(--ardosia-300)'
    }
  }, "Google Fonts \xB7 OFL")), /*#__PURE__*/React.createElement("div", {
    style: {
      font: (i ? '300 ' : '300 ') + '140px/0.9 ' + f,
      color: i ? 'var(--noite-900)' : 'var(--linho-50)'
    }
  }, s, !i && /*#__PURE__*/React.createElement("em", {
    style: {
      color: 'var(--linho-200)'
    }
  }, "g")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 30px/1.1 ' + (i ? 'var(--font-body)' : 'var(--font-display)'),
      color: i ? 'var(--noite-900)' : 'var(--linho-50)'
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 13px var(--font-body)',
      color: i ? 'var(--text-secondary)' : 'var(--ardosia-300)',
      marginTop: 6
    }
  }, w)), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 15px/1.5 ' + f,
      color: i ? 'var(--text-secondary)' : 'var(--ardosia-200)',
      letterSpacing: '.02em',
      wordBreak: 'break-all'
    }
  }, "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 \xE3\xE7\xE9\xEA\xED\xF3\xF4\xFA \u2014 \u201C\u201D &")))), /*#__PURE__*/React.createElement(Sub, {
    title: "Escala tipogr\xE1fica",
    note: "clique no texto para editar"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, roles.map(([r, t, f, s, m]) => /*#__PURE__*/React.createElement("div", {
    key: r,
    className: "bk-typerow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label",
    style: {
      color: 'var(--vinho-800)'
    }
  }, r), /*#__PURE__*/React.createElement("div", {
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: false,
    style: {
      font: f,
      fontSize: parseInt(f.split(' ')[1]) > 40 ? 'clamp(36px,' + (parseInt(f.split(' ')[1]) / 14.4).toFixed(2) + 'vw,' + parseInt(f.split(' ')[1]) + 'px)' : undefined,
      color: 'var(--text-primary)',
      outline: 'none',
      letterSpacing: f.includes('display') && parseInt(f.split(' ')[1]) > 40 ? '-.015em' : 0,
      textWrap: 'balance',
      minWidth: 0
    }
  }, s), /*#__PURE__*/React.createElement("span", {
    className: "bk-typemeta",
    style: {
      font: '400 12px/1.5 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, m, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("code", {
    style: {
      fontSize: 11
    }
  }, t)))))), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-split",
    style: {
      '--split': '1.6fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Sub, {
    title: "Laborat\xF3rio",
    note: size + 'px · ' + weight + (italic ? ' · itálico' : '')
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-panel stone",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      minHeight: 280
    }
  }, /*#__PURE__*/React.createElement("div", {
    contentEditable: true,
    suppressContentEditableWarning: true,
    style: {
      font: (italic ? 'italic ' : '') + weight + ' ' + size + 'px/1.02 var(--font-display)',
      color: 'var(--vinho-800)',
      outline: 'none',
      letterSpacing: '-.01em',
      flex: 1,
      overflowWrap: 'anywhere',
      minWidth: 0
    }
  }, "Figueira & alecrim"), /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "24",
    max: "140",
    value: size,
    onChange: e => setSize(+e.target.value),
    style: {
      flex: 1,
      accentColor: '#490b1a'
    }
  }), [300, 400, 500, 600].map(w => /*#__PURE__*/React.createElement("button", {
    key: w,
    onClick: () => setWeight(w),
    style: {
      all: 'unset',
      cursor: 'pointer',
      font: w + ' 18px var(--font-display)',
      padding: '4px 8px',
      borderBottom: '1px solid ' + (weight === w ? 'var(--vinho-800)' : 'transparent'),
      color: 'var(--noite-900)'
    }
  }, w)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setItalic(!italic),
    style: {
      all: 'unset',
      cursor: 'pointer',
      font: 'italic 400 18px var(--font-display)',
      padding: '4px 8px',
      borderBottom: '1px solid ' + (italic ? 'var(--vinho-800)' : 'transparent')
    }
  }, "It\xE1lico")))), /*#__PURE__*/React.createElement(Sub, {
    title: "R\xF3tulos"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-panel",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
      minHeight: 280,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1 var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--vinho-800)'
    }
  }, "Eyebrow \xB7 .18em"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11px/1 var(--font-body)',
      letterSpacing: '.32em',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, "Tagline \xB7 .32em"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1 var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--noite-900)'
    }
  }, "Bot\xE3o \xB7 Agende"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'italic 400 22px/1.2 var(--font-display)',
      color: 'var(--text-primary)'
    }
  }, "\u2014 legenda editorial em it\xE1lico")))));
}
Object.assign(window, {
  BK_COLORS,
  OverviewSection,
  LogosSection,
  LogoMotionSection,
  ColorsSection,
  TypeSection,
  Wordmark
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "brand-kit/Foundations1.jsx", error: String((e && e.message) || e) }); }

// brand-kit/Foundations2.jsx
try { (() => {
function IconsSection() {
  const {
    Icon,
    ICON_NAMES,
    Input
  } = BK_DS;
  const [q, setQ] = React.useState('');
  const [stroke, setStroke] = React.useState(1.25);
  const [size, setSize] = React.useState(26);
  const list = (ICON_NAMES || []).filter(n => n.includes(q.trim().toLowerCase()));
  return /*#__PURE__*/React.createElement(Section, {
    id: "icones",
    eyebrow: "Fundamentos \xB7 06",
    title: "\xCDcones",
    desc: "Lucide em tra\xE7o fino (1.25), monocrom\xE1tico, sempre em currentColor. Usados com parcim\xF4nia: contato, setas de a\xE7\xE3o, etapas do processo. Clique para copiar o nome."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 28,
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Buscar",
    iconLeft: "search",
    placeholder: "ex.: arrow, leaf, sofa",
    value: q,
    onChange: e => setQ(e.target.value),
    style: {
      flex: '1 1 260px'
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      flex: '0 1 200px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label"
  }, "Tra\xE7o \xB7 ", stroke), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0.75",
    max: "2",
    step: "0.25",
    value: stroke,
    onChange: e => setStroke(+e.target.value),
    style: {
      accentColor: '#490b1a'
    }
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      flex: '0 1 200px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label"
  }, "Tamanho \xB7 ", size, "px"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "16",
    max: "48",
    step: "2",
    value: size,
    onChange: e => setSize(+e.target.value),
    style: {
      accentColor: '#490b1a'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bk-panel stone",
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(96px,1fr))',
      gap: 4
    }
  }, list.map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    className: "bk-iconcell",
    onClick: () => bkCopy(n, 'Ícone'),
    title: n
  }, /*#__PURE__*/React.createElement(Icon, {
    name: n,
    size: size,
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("span", null, n))), !list.length && /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'italic 300 22px var(--font-display)',
      color: 'var(--text-secondary)',
      padding: 24
    }
  }, "Nenhum \xEDcone com \u201C", q, "\u201D."))), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g3"
  }, [['Em ações', /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      font: '500 12px var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--vinho-800)'
    }
  }, "Ver projeto ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 16
  }))], ['Em listas de contato', /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      font: '300 14px var(--font-body)',
      color: 'var(--text-secondary)'
    }
  }, [['map-pin', 'São Paulo · Lisboa'], ['mail', 'ola@decroqui.com']].map(([i, t]) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: i,
    size: 18,
    style: {
      color: 'var(--vinho-800)'
    }
  }), t)))], ['Nunca', /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 14px/1.6 var(--font-body)',
      color: 'var(--terracota-600)'
    }
  }, "\u2715 emoji \xB7 \u2715 \xEDcones preenchidos \xB7 \u2715 \xEDcones coloridos ou em duas cores")]].map(([l, c]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    className: "bk-panel",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      minHeight: 140
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label"
  }, l), c))));
}
const BK_PATTERNS = [{
  name: 'Arcadas',
  note: 'Fachada de arcos repetidos',
  css: {
    backgroundColor: 'var(--linho-200)',
    backgroundImage: 'radial-gradient(circle at 50% 100%, var(--linho-50) 0 22px, transparent 22.5px), linear-gradient(var(--linho-50),var(--linho-50))',
    backgroundSize: '60px 72px, 44px 34px',
    backgroundPosition: '0 0, 8px 38px',
    backgroundRepeat: 'repeat, repeat'
  }
}, {
  name: 'Toldo',
  note: 'Listras de varanda mediterrânea',
  css: {
    background: 'repeating-linear-gradient(90deg, var(--vinho-800) 0 22px, var(--linho-200) 22px 44px)'
  }
}, {
  name: 'Azulejo',
  note: 'Ladrilho hidráulico simplificado',
  css: {
    backgroundColor: 'var(--linho-50)',
    backgroundImage: 'radial-gradient(circle at 50% 50%, var(--noite-900) 0 6px, transparent 6.5px), radial-gradient(circle at 0 0, transparent 22px, var(--ardosia-500) 22.5px 24px, transparent 24.5px), radial-gradient(circle at 100% 100%, transparent 22px, var(--ardosia-500) 22.5px 24px, transparent 24.5px)',
    backgroundSize: '48px 48px'
  }
}, {
  name: 'Pedra',
  note: 'Grão sutil sobre linho',
  css: {
    backgroundColor: 'var(--linho-300)',
    backgroundImage: 'var(--grain)'
  }
}, {
  name: 'Abas da paleta',
  note: 'Faixas sobrepostas com canto arredondado',
  css: {
    background: 'var(--linho-200)'
  },
  tabs: true
}, {
  name: 'Riscado',
  note: 'Linhas de croqui em noite',
  css: {
    backgroundColor: 'var(--noite-900)',
    backgroundImage: 'repeating-linear-gradient(-35deg, transparent 0 13px, rgba(170,184,201,.35) 13px 14px)'
  }
}];
function PatternsSection() {
  const [pick, setPick] = React.useState(0);
  const P = BK_PATTERNS[pick];
  return /*#__PURE__*/React.createElement(Section, {
    id: "padroes",
    eyebrow: "Fundamentos \xB7 07",
    title: "Padr\xF5es & estampas",
    desc: "Texturas inspiradas na arquitetura mediterr\xE2nea \u2014 arcos, toldos, azulejos e pedra. Feitas em CSS a partir dos tokens; use em faixas, embalagens e fundos de apoio, nunca atr\xE1s de texto longo."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-split",
    style: {
      '--split': '1.5fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      borderRadius: 'var(--radius-arch-soft)',
      overflow: 'hidden',
      minHeight: 380,
      ...P.css
    }
  }, P.tabs && /*#__PURE__*/React.createElement(PaletteTabs, null), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 20,
      bottom: 20,
      background: 'var(--surface-card)',
      padding: '14px 18px',
      borderRadius: 'var(--radius-xs)',
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 26px/1 var(--font-display)',
      color: 'var(--text-primary)'
    }
  }, P.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 13px var(--font-body)',
      color: 'var(--text-secondary)',
      marginTop: 4
    }
  }, P.note))), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g2",
    style: {
      gap: 12
    }
  }, BK_PATTERNS.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: p.name,
    onClick: () => setPick(i),
    style: {
      all: 'unset',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 96,
      borderRadius: 'var(--radius-xs)',
      position: 'relative',
      overflow: 'hidden',
      outline: pick === i ? '1.5px solid var(--vinho-800)' : '1px solid var(--border-hairline)',
      outlineOffset: pick === i ? 3 : 0,
      ...p.css
    }
  }, p.tabs && /*#__PURE__*/React.createElement(PaletteTabs, null)), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 13px var(--font-body)',
      color: pick === i ? 'var(--vinho-800)' : 'var(--text-secondary)'
    }
  }, p.name))))));
}
function PaletteTabs() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'grid',
      gridTemplateColumns: '1.6fr 1fr 1fr 1fr'
    }
  }, ['#490b1a', '#142841', '#798da6', '#e5ded2'].map((c, i) => /*#__PURE__*/React.createElement("span", {
    key: c,
    style: {
      background: c,
      borderRadius: '0 28px 0 0',
      marginLeft: i ? -28 : 0,
      position: 'relative',
      zIndex: 4 - i
    }
  })));
}
function SpacingSection() {
  const sc = [[1, 4], [2, 8], [3, 12], [4, 16], [5, 24], [6, 32], [7, 48], [8, 64], [9, 96], [10, 128]];
  const [hover, setHover] = React.useState(null);
  return /*#__PURE__*/React.createElement(Section, {
    id: "espacamento",
    eyebrow: "Fundamentos \xB7 08",
    title: "Espa\xE7amento",
    desc: "Base de 4px com saltos generosos no topo da escala. O luxo aqui \xE9 o espa\xE7o vazio: se\xE7\xF5es respiram 96\u2013128px; elementos relacionados ficam a 8\u201316px."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-panel",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, sc.map(([i, px]) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => bkCopy('var(--space-' + i + ')', 'Espaço'),
    onMouseEnter: () => setHover(i),
    onMouseLeave: () => setHover(null),
    style: {
      all: 'unset',
      cursor: 'pointer',
      display: 'grid',
      gridTemplateColumns: '120px 60px minmax(0,1fr)',
      alignItems: 'center',
      gap: 16,
      padding: '6px 8px',
      borderRadius: 'var(--radius-xs)',
      background: hover === i ? 'var(--linho-100)' : 'transparent'
    }
  }, /*#__PURE__*/React.createElement("code", {
    style: {
      font: '400 12.5px ui-monospace,Menlo,monospace',
      color: 'var(--text-primary)'
    }
  }, "--space-", i), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 13px var(--font-body)',
      color: 'var(--text-muted)',
      textAlign: 'right'
    }
  }, px, "px"), /*#__PURE__*/React.createElement("span", {
    style: {
      height: 14,
      width: px / 128 * 100 + '%',
      background: hover === i ? 'var(--vinho-800)' : 'var(--vinho-200)',
      transition: 'background var(--duration-fast) var(--ease-out)'
    }
  })))), /*#__PURE__*/React.createElement(Sub, {
    title: "Em uso",
    note: "card de projeto anotado"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-panel stone",
    style: {
      display: 'flex',
      justifyContent: 'center',
      padding: 48
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 320,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 220,
      background: 'var(--ardosia-300)',
      backgroundImage: 'var(--grain)',
      borderRadius: 'var(--radius-arch-soft)'
    }
  }), /*#__PURE__*/React.createElement(Measure, {
    h: 18,
    label: "18 \xB7 gap"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 11px/1 var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, "Residencial \xB7 Trancoso"), /*#__PURE__*/React.createElement(Measure, {
    h: 8,
    label: "8"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 28px/1.1 var(--font-display)',
      color: 'var(--text-primary)'
    }
  }, "Casa Alecrim"), /*#__PURE__*/React.createElement(Measure, {
    h: 8,
    label: "8"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 15px/1.6 var(--font-body)',
      color: 'var(--text-secondary)'
    }
  }, "Cal, travertino e luz rasante."), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: -64,
      top: 0,
      bottom: 0,
      width: 40,
      borderRight: '1px solid var(--vinho-400)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: '50%',
      right: 6,
      transform: 'translateY(-50%)',
      font: '400 10.5px var(--font-body)',
      color: 'var(--vinho-600)',
      whiteSpace: 'nowrap'
    }
  }, "gutter"))))), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g3"
  }, [['Contêiner', '1320px', '--container-max'], ['Texto corrido', '760px', '--container-narrow'], ['Gutter', 'clamp(20px, 4vw, 56px)', '--gutter']].map(([l, v, t]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      borderTop: '1px solid var(--border-strong)',
      paddingTop: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label"
  }, l), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 30px/1.1 var(--font-display)',
      margin: '10px 0 4px'
    }
  }, v), /*#__PURE__*/React.createElement("code", {
    style: {
      font: '400 12px ui-monospace,Menlo,monospace',
      color: 'var(--text-muted)'
    }
  }, t)))));
}
function Measure({
  h,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: h,
      position: 'relative',
      background: 'repeating-linear-gradient(45deg,rgba(73,11,26,.18) 0 2px,transparent 2px 5px)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: -44,
      top: '50%',
      transform: 'translateY(-50%)',
      font: '400 10.5px var(--font-body)',
      color: 'var(--vinho-600)'
    }
  }, label));
}
function RadiiSection() {
  const [elev, setElev] = React.useState('md');
  const radii = [['--radius-xs', '2px', 'Botões, campos'], ['--radius-sm', '4px', 'Cards, diálogos'], ['--radius-md', '8px', 'Raro'], ['--radius-lg', '16px', 'Imagens soltas'], ['--radius-pill', '999px', 'Tags, switch'], ['--radius-arch-soft', '48 48 0 0', 'Cards de imagem'], ['--radius-arch', 'arco', 'Hero, editorial']];
  return /*#__PURE__*/React.createElement(Section, {
    id: "raios",
    eyebrow: "Fundamentos \xB7 09",
    title: "Raios & sombras",
    desc: "Interface quase reta (2\u20134px) para parecer precisa; imagens em arco para evocar a arquitetura. Sombras frias, longas e discretas \u2014 s\xF3 para o que flutua."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-panel",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(96px,1fr))',
      gap: 16,
      alignItems: 'end'
    }
  }, radii.map(([t, v, u]) => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => bkCopy('var(' + t + ')', 'Raio'),
    style: {
      all: 'unset',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: t.includes('arch') ? 150 : 96,
      background: 'var(--linho-200)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(' + t + ')'
    }
  }), /*#__PURE__*/React.createElement("code", {
    style: {
      font: '400 11px ui-monospace,Menlo,monospace',
      color: 'var(--text-primary)'
    }
  }, t.replace('--radius-', '')), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11.5px/1.3 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, v, " \xB7 ", u)))), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-split",
    style: {
      '--split': '1fr 1.2fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--linho-100)',
      borderRadius: 'var(--radius-sm)',
      padding: 32,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 24
    }
  }, ['xs', 'sm', 'md', 'lg'].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setElev(s),
    style: {
      all: 'unset',
      cursor: 'pointer',
      height: 110,
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-' + s + ')',
      display: 'flex',
      alignItems: 'flex-end',
      padding: 14,
      outline: elev === s ? '1px solid var(--vinho-400)' : 'none',
      outlineOffset: 4
    }
  }, /*#__PURE__*/React.createElement("code", {
    style: {
      font: '400 12px ui-monospace,Menlo,monospace'
    }
  }, "--shadow-", s)))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--linho-100)',
      borderRadius: 'var(--radius-sm)',
      padding: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      minHeight: 280
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '78%',
      background: 'var(--surface-page)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-' + elev + ')',
      padding: 28,
      transition: 'box-shadow var(--duration-slow) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label",
    style: {
      color: 'var(--vinho-800)'
    }
  }, "Eleva\xE7\xE3o \xB7 ", elev), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 30px/1.1 var(--font-display)',
      marginTop: 10
    }
  }, {
    xs: 'Repouso',
    sm: 'Campos e cards',
    md: 'Hover de card',
    lg: 'Diálogo, toast'
  }[elev])))));
}
function ChipsSection() {
  const {
    Tag,
    Badge
  } = BK_DS;
  const rooms = ['Salas', 'Cozinhas', 'Quartos', 'Banhos', 'Jardins', 'Varandas'];
  const [sel, setSel] = React.useState(['Salas', 'Jardins']);
  const [mats, setMats] = React.useState(['Travertino', 'Latão escovado', 'Linho cru', 'Oliveira', 'Cal']);
  const tones = ['neutral', 'brand', 'navy', 'slate', 'success', 'warning', 'danger'];
  return /*#__PURE__*/React.createElement(Section, {
    id: "chips",
    eyebrow: "Fundamentos \xB7 10",
    title: "Chips & tags",
    desc: "Tags s\xE3o interativas (filtros, materiais); badges apenas informam status ou categoria. Tags s\xE3o p\xEDlulas; badges, ret\xE2ngulos com 2px."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-panel",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label"
  }, "Filtro \xB7 m\xFAltipla escolha \xB7 ", sel.length, " selecionados"), /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 8
    }
  }, rooms.map(r => /*#__PURE__*/React.createElement(Tag, {
    key: r,
    selected: sel.includes(r),
    onClick: () => setSel(sel.includes(r) ? sel.filter(x => x !== r) : [...sel, r])
  }, r)))), /*#__PURE__*/React.createElement("div", {
    className: "bk-panel",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label"
  }, "Materiais \xB7 remov\xEDveis"), /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 8
    }
  }, mats.map(m => /*#__PURE__*/React.createElement(Tag, {
    key: m,
    onRemove: () => setMats(mats.filter(x => x !== m))
  }, m)), !mats.length && /*#__PURE__*/React.createElement("button", {
    onClick: () => setMats(['Travertino', 'Latão escovado', 'Linho cru', 'Oliveira', 'Cal']),
    style: {
      all: 'unset',
      cursor: 'pointer',
      font: '400 14px var(--font-body)',
      color: 'var(--text-brand)',
      textDecoration: 'underline'
    }
  }, "Restaurar")))), /*#__PURE__*/React.createElement("div", {
    className: "bk-panel",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label"
  }, "Badges \xB7 tons"), /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 10
    }
  }, tones.map(t => /*#__PURE__*/React.createElement(Badge, {
    key: t,
    tone: t
  }, t))), /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 10
    }
  }, [['success', 'Concluído'], ['warning', 'Em revisão'], ['navy', 'Em obra'], ['brand', 'Novo'], ['danger', 'Atrasado']].map(([t, l]) => /*#__PURE__*/React.createElement(Badge, {
    key: l,
    tone: t,
    dot: true
  }, l)))));
}
Object.assign(window, {
  IconsSection,
  PatternsSection,
  SpacingSection,
  RadiiSection,
  ChipsSection
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "brand-kit/Foundations2.jsx", error: String((e && e.message) || e) }); }

// brand-kit/Instagram.jsx
try { (() => {
const IG_THEMES = {
  vinho: {
    label: 'Vinho',
    hex: '#490B1A',
    bg: '#490b1a',
    ink: '#efe9df',
    accent: '#d9b8bc'
  },
  noite: {
    label: 'Noite',
    hex: '#142841',
    bg: '#142841',
    ink: '#efe9df',
    accent: '#d9b8bc'
  },
  linho: {
    label: 'Linho',
    hex: '#E5DED2',
    bg: '#e5ded2',
    ink: '#142841',
    accent: '#490b1a'
  }
};
const IG_ITEMS = [{
  id: 'parceiros',
  title: 'Parceiros',
  short: 'Parceiros'
}, {
  id: 'comercial',
  title: 'Comercial',
  short: 'Comercial'
}, {
  id: 'residencial',
  title: 'Residencial',
  short: 'Residencial'
}, {
  id: 'corporativo',
  title: 'Corporativo',
  short: 'Corporativo'
}, {
  id: 'faq',
  title: 'Perguntas e Respostas',
  short: 'FAQ'
}, {
  id: 'feedback',
  title: 'Feedback',
  short: 'Feedback'
}];
const IG_ICON_DIR = 'croqui';
const IG_DISPLAY = "'Cormorant Garamond', Garamond, serif";
const IG_BODY = "Jost, Futura, 'Century Gothic', sans-serif";
function igLogo(ctx, t, cx, cy, size) {
  const s = size / 64;
  ctx.save();
  ctx.translate(cx - 50 * s, cy - 50 * s);
  ctx.scale(s, s);
  ctx.strokeStyle = t.ink;
  ctx.lineWidth = 4.4;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';
  ctx.stroke(new Path2D('M40 82 H18 V18 H82 V36'));
  ctx.stroke(new Path2D('M74 82 H82'));
  ctx.strokeStyle = t.accent;
  ctx.fillStyle = t.accent;
  ctx.lineCap = 'round';
  ctx.globalAlpha = .75;
  ctx.lineWidth = 1;
  ctx.stroke(new Path2D('M74 82 A34 34 0 0 0 40 48'));
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1.6;
  ctx.stroke(new Path2D('M40 82 L40 48'));
  ctx.beginPath();
  ctx.arc(40, 82, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function igPaintProfile(ctx, t) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, 1080, 1080);
  igLogo(ctx, t, 540, 540, 540);
}

// Story 1080×1920. O destaque recorta o círculo central (y 420–1500): só o ícone fica ali.
function igPaintStory(ctx, t, item) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, 1080, 1920);
  const is = 600;
  ctx.save();
  ctx.translate(540 - is / 2, 960 - is / 2);
  ctx.scale(is / 100, is / 100);
  window.DC_IG_ICONS.paint(ctx, IG_ICON_DIR, item.id, t.ink, t.accent, t.bg);
  ctx.restore();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = t.accent;
  ctx.font = '500 28px ' + IG_BODY;
  ctx.letterSpacing = '10px';
  ctx.fillText('DE.CROQUI', 545, 300);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = t.ink;
  let fs = 104;
  ctx.font = '300 ' + fs + 'px ' + IG_DISPLAY;
  while (ctx.measureText(item.title).width > 900 && fs > 60) {
    fs -= 4;
    ctx.font = '300 ' + fs + 'px ' + IG_DISPLAY;
  }
  ctx.fillText(item.title, 540, 1670);
}
function igPaintCrop(ctx, t, item) {
  ctx.save();
  ctx.translate(0, -420);
  igPaintStory(ctx, t, item);
  ctx.restore();
}
let igFontsP = null;
function useIgFonts() {
  const [ok, setOk] = React.useState(false);
  React.useEffect(() => {
    igFontsP = igFontsP || Promise.all([document.fonts.load('300 104px "Cormorant Garamond"'), document.fonts.load('500 28px Jost')]).catch(() => {}).then(() => document.fonts.ready);
    igFontsP.then(() => setOk(true));
  }, []);
  return ok;
}
function IgCanvas({
  w,
  h,
  res = 0.5,
  paint,
  deps,
  style
}) {
  const ref = React.useRef(null);
  const ready = useIgFonts();
  React.useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.scale(res, res);
    paint(ctx);
  }, [ready, ...deps]);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    width: w * res,
    height: h * res,
    style: {
      display: 'block',
      width: '100%',
      height: 'auto',
      ...style
    }
  });
}
function igDownload(w, h, paint, name) {
  const run = () => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    paint(c.getContext('2d'));
    c.toBlob(b => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = name + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
  };
  (igFontsP || Promise.resolve()).then(run);
}
function IgDl({
  onClick,
  children
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      all: 'unset',
      cursor: 'pointer',
      font: '500 10.5px var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, children, " \u2193");
}
function InstagramSection() {
  const {
    Button
  } = BK_DS;
  const [tone, setTone] = React.useState('vinho');
  const t = IG_THEMES[tone];
  const dlStory = (it, k = tone) => igDownload(1080, 1920, ctx => igPaintStory(ctx, IG_THEMES[k], it), 'decroqui-destaque-' + it.id + '-' + k);
  const dlProfile = k => igDownload(1080, 1080, ctx => igPaintProfile(ctx, IG_THEMES[k]), 'decroqui-perfil-' + k);
  const dlAll = () => {
    dlProfile(tone);
    IG_ITEMS.forEach((it, i) => setTimeout(() => dlStory(it), 350 * (i + 1)));
  };
  return /*#__PURE__*/React.createElement(Section, {
    id: "k-instagram",
    eyebrow: "Kits \xB7 Redes sociais",
    title: "Kit Instagram",
    desc: "Foto de perfil e capas de destaques em tr\xEAs cores da marca. Use a mesma cor no perfil e em todos os destaques. As capas seguem o formato dos stories (1080 \xD7 1920); ao adicion\xE1-las ao destaque, o Instagram recorta o c\xEDrculo central, onde fica o \xEDcone. \xCDcones pr\xF3prios no tra\xE7o de croqui: linhas soltas que passam do canto, como no primeiro esbo\xE7o."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 6
    }
  }, Object.entries(IG_THEMES).map(([k, v]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTone(k),
    style: {
      all: 'unset',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      font: '500 11px var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      padding: '8px 14px 8px 10px',
      borderRadius: 999,
      background: tone === k ? 'var(--noite-900)' : 'transparent',
      color: tone === k ? 'var(--linho-50)' : 'var(--text-secondary)',
      border: '1px solid ' + (tone === k ? 'var(--noite-900)' : 'var(--border-default)')
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: v.bg,
      boxShadow: 'inset 0 0 0 1px rgba(20,40,65,.18)'
    }
  }), v.label, " \xB7 ", v.hex)), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "primary",
    iconLeft: "download",
    onClick: dlAll
  }, "Baixar tudo \xB7 ", t.label))), /*#__PURE__*/React.createElement(Sub, {
    title: "Pr\xE9via do perfil",
    note: "Como aparece no topo do perfil"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-panel",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      padding: '32px 32px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 120,
      height: 120,
      borderRadius: '50%',
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: '0 0 0 1px var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement(IgCanvas, {
    w: 1080,
    h: 1080,
    res: 0.25,
    paint: ctx => igPaintProfile(ctx, t),
    deps: [tone]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 30px/1 var(--font-display)',
      color: 'var(--text-primary)'
    }
  }, "De.Croqui"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 14px/1.5 var(--font-body)',
      color: 'var(--text-secondary)'
    }
  }, "Interiores com est\xE9tica mediterr\xE2nea"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 22,
      flexWrap: 'wrap'
    }
  }, IG_ITEMS.map(it => /*#__PURE__*/React.createElement("div", {
    key: it.id,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      width: 76
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 70,
      height: 70,
      borderRadius: '50%',
      padding: 3,
      boxShadow: 'inset 0 0 0 1px var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(IgCanvas, {
    w: 1080,
    h: 1080,
    res: 0.2,
    paint: ctx => igPaintCrop(ctx, t, it),
    deps: [tone]
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px/1.2 var(--font-body)',
      color: 'var(--text-primary)',
      textAlign: 'center'
    }
  }, it.short)))))), /*#__PURE__*/React.createElement(Sub, {
    title: "Foto de perfil",
    note: "PNG 1080 \xD7 1080 \xB7 isotipo com respiro de meia largura"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g3"
  }, Object.entries(IG_THEMES).map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '72%',
      borderRadius: '50%',
      overflow: 'hidden',
      boxShadow: k === tone ? '0 0 0 2px var(--surface-page), 0 0 0 3.5px var(--vinho-800)' : '0 0 0 1px var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement(IgCanvas, {
    w: 1080,
    h: 1080,
    res: 0.4,
    paint: ctx => igPaintProfile(ctx, v),
    deps: [k]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-label"
  }, v.label), /*#__PURE__*/React.createElement(IgDl, {
    onClick: () => dlProfile(k)
  }, "PNG")))))), /*#__PURE__*/React.createElement(Sub, {
    title: 'Capas dos destaques · ' + t.label,
    note: "PNG 1080 \xD7 1920 \xB7 formato story"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-grid",
    style: {
      gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
      gap: 18
    }
  }, IG_ITEMS.map(it => /*#__PURE__*/React.createElement("div", {
    key: it.id,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)'
    }
  }, /*#__PURE__*/React.createElement(IgCanvas, {
    w: 1080,
    h: 1920,
    res: 0.3,
    paint: ctx => igPaintStory(ctx, t, it),
    deps: [tone]
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: '21.9%',
      margin: '0 auto',
      width: '100%',
      aspectRatio: '1',
      borderRadius: '50%',
      border: '1px dashed ' + t.accent,
      opacity: .45,
      pointerEvents: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 13px/1.2 var(--font-body)',
      color: 'var(--text-primary)'
    }
  }, it.short), /*#__PURE__*/React.createElement(IgDl, {
    onClick: () => dlStory(it)
  }, "PNG")))))), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g3"
  }, [['Publicar', 'Poste a capa como story (sem texto ou sticker por cima) e adicione-a ao destaque correspondente.'], ['Recortar', 'Em “Editar destaque › Editar capa”, escolha a imagem e centralize o ícone dentro do círculo — a linha tracejada nas prévias mostra a área.'], ['Nomear', 'Use os nomes curtos da prévia; “Perguntas e Respostas” fica como FAQ, pois o Instagram corta nomes longos.']].map(([h, d]) => /*#__PURE__*/React.createElement("div", {
    key: h,
    style: {
      borderTop: '1px solid var(--border-strong)',
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 22px/1.1 var(--font-display)'
    }
  }, h), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 13px/1.5 var(--font-body)',
      color: 'var(--text-secondary)',
      marginTop: 6
    }
  }, d)))));
}
Object.assign(window, {
  InstagramSection,
  IG_THEMES,
  IG_ITEMS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "brand-kit/Instagram.jsx", error: String((e && e.message) || e) }); }

// brand-kit/Kits.jsx
try { (() => {
function ApresentacaoSection() {
  const {
    Button
  } = BK_DS;
  const frame = React.useRef(null);
  const src = 'templates/apresentacao/Apresentacao.dc.html';
  const print = () => {
    const w = frame.current && frame.current.contentWindow;
    if (w) {
      w.focus();
      w.print();
    }
  };
  const parts = [['Capa', 'Projeto, cliente, projetista, local, data e código — campos vazios não são impressos. Três composições e três cores da marca.'], ['Texto & conceito', 'Título, introdução e blocos de texto e imagem; imagens em diagonal, lado a lado, empilhadas, em destaque abaixo do texto ou com posição personalizada, em arco ou retangulares.'], ['Moodboard', 'Materiais com imagem, fabricante, código, acabamento, ambiente e observações; a grade se adapta à quantidade.'], ['Apresentação visual', 'Renders e isométricas em cinco composições, com programas utilizados e notas técnicas.'], ['Desenho técnico', 'Prints de plantas, vistas e detalhes com cotas (1 a 4 por prancha), sem cortes, com carimbo.'], ['Notas & direitos', 'Notas e diretrizes reorganizáveis; direitos autorais com redação própria — modelos em cinza não são impressos.']];
  return /*#__PURE__*/React.createElement(Section, {
    id: "k-apresentacao",
    eyebrow: "Kits \xB7 Apresenta\xE7\xF5es",
    title: "Kit de apresenta\xE7\xF5es",
    desc: "Editor de apresenta\xE7\xF5es de projetos de marcenaria e interiores em A4 ou A3 paisagem (ou tela 16:9). Preencha pelo painel ou clique direto nos textos e imagens da p\xE1gina; arraste imagens do computador para qualquer \xE1rea. Tudo fica salvo neste navegador e funciona offline \u2014 exporte em PDF."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "primary",
    iconLeft: "download",
    onClick: print
  }, "Exportar PDF"), /*#__PURE__*/React.createElement("a", {
    href: src,
    target: "_blank",
    style: {
      font: '500 11px var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase'
    }
  }, "Abrir em tela cheia \u2197"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      font: '300 13px var(--font-body)',
      color: 'var(--text-secondary)'
    }
  }, "No di\xE1logo de impress\xE3o: \u201CSalvar como PDF\u201D, margens nenhuma, gr\xE1ficos de fundo ativados.")), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--border-hairline)',
      height: 920,
      background: 'var(--linho-100)'
    }
  }, /*#__PURE__*/React.createElement("iframe", {
    ref: frame,
    src: src,
    title: "Kit de apresenta\xE7\xF5es De.Croqui",
    style: {
      width: '100%',
      height: '100%',
      border: 0,
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g3"
  }, parts.map(([t, d]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      borderTop: '1px solid var(--border-strong)',
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 22px/1.1 var(--font-display)'
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 13px/1.5 var(--font-body)',
      color: 'var(--text-secondary)',
      marginTop: 6
    }
  }, d)))));
}
function UIKitSection() {
  const wrap = React.useRef(null);
  const frame = React.useRef(null);
  const [scale, setScale] = React.useState(0.7);
  const [page, setPage] = React.useState('home');
  React.useEffect(() => {
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 1440));
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);
  const show = p => {
    setPage(p);
    try {
      localStorage.setItem('dc-site', JSON.stringify({
        page: p,
        pid: 'alecrim'
      }));
    } catch (e) {}
    if (frame.current) frame.current.contentWindow.location.reload();
  };
  const pages = [['home', 'Home'], ['portfolio', 'Portfólio'], ['projeto', 'Projeto'], ['contato', 'Contato']];
  return /*#__PURE__*/React.createElement(Section, {
    id: "k-ui",
    eyebrow: "Kits \xB7 Website",
    title: "UI kit \xB7 Website",
    desc: "Site do est\xFAdio montado s\xF3 com os componentes desta biblioteca: home, portf\xF3lio filtr\xE1vel, p\xE1gina de projeto e formul\xE1rio de contato com di\xE1logo e toast. Navegue dentro da pr\xE9via."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 6
    }
  }, pages.map(([id, l]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => show(id),
    style: {
      all: 'unset',
      cursor: 'pointer',
      font: '500 11px var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      padding: '8px 14px',
      borderRadius: 999,
      background: page === id ? 'var(--noite-900)' : 'transparent',
      color: page === id ? 'var(--linho-50)' : 'var(--text-secondary)',
      border: '1px solid ' + (page === id ? 'var(--noite-900)' : 'var(--border-default)')
    }
  }, l)), /*#__PURE__*/React.createElement("a", {
    href: "ui_kits/website/index.html",
    target: "_blank",
    style: {
      marginLeft: 'auto',
      font: '500 11px var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase'
    }
  }, "Abrir em tela cheia \u2197")), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 34,
      background: 'var(--linho-100)',
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      padding: '0 14px',
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: 'var(--linho-300)'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 14,
      font: '400 12px var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, "decroqui.com/", page === 'home' ? '' : page)), /*#__PURE__*/React.createElement("div", {
    ref: wrap,
    style: {
      height: 900 * scale,
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("iframe", {
    ref: frame,
    src: "ui_kits/website/index.html",
    title: "Website De.Croqui",
    style: {
      width: 1440,
      height: 900,
      border: 0,
      transform: 'scale(' + scale + ')',
      transformOrigin: '0 0',
      position: 'absolute',
      top: 0,
      left: 0
    }
  }))));
}
function OrcamentoSection() {
  const {
    Button
  } = BK_DS;
  const frame = React.useRef(null);
  const src = 'templates/orcamento/Orcamento.dc.html';
  const print = () => {
    const w = frame.current && frame.current.contentWindow;
    if (w) {
      w.focus();
      w.print();
    }
  };
  return /*#__PURE__*/React.createElement(Section, {
    id: "k-orcamento",
    eyebrow: "Kits \xB7 Comercial",
    title: "Kit de or\xE7amento",
    desc: "Proposta em tr\xEAs p\xE1ginas A4: resumo com as duas op\xE7\xF5es de investimento, Op\xE7\xE3o 01 (render 3D + executivo geral, com marcenaria parceira) e Op\xE7\xE3o 02 (projeto completo por ambiente). Escolha se a proposta leva uma ou as duas op\xE7\xF5es, preencha os dados do cliente no painel \u2014 os totais s\xE3o calculados sozinhos \u2014 e salve em PDF."
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-row",
    style: {
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "primary",
    iconLeft: "download",
    onClick: print
  }, "Salvar em PDF"), /*#__PURE__*/React.createElement("a", {
    href: src,
    target: "_blank",
    style: {
      font: '500 11px var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase'
    }
  }, "Abrir em tela cheia \u2197"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      font: '300 13px var(--font-body)',
      color: 'var(--text-secondary)'
    }
  }, "No di\xE1logo de impress\xE3o: destino \u201CSalvar como PDF\u201D, papel A4, margens nenhuma, gr\xE1ficos de fundo ativados.")), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--border-hairline)',
      height: 920,
      background: 'var(--linho-100)'
    }
  }, /*#__PURE__*/React.createElement("iframe", {
    ref: frame,
    src: src,
    title: "Kit de or\xE7amento De.Croqui",
    style: {
      width: '100%',
      height: '100%',
      border: 0,
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "bk-grid bk-g3"
  }, [['01 · Resumo', 'Dados do cliente, as duas opções com o total de cada uma, observações, condições de pagamento e validade.'], ['02 · Opção 01', 'Render 3D por ambiente + executivo detalhado geral, resumo e nota da marcenaria parceira.'], ['03 · Opção 02', 'Projeto completo por ambiente, lista de ambientes com valor de cada um e total.']].map(([t, d]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      borderTop: '1px solid var(--border-strong)',
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 22px/1.1 var(--font-display)'
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 13px/1.5 var(--font-body)',
      color: 'var(--text-secondary)',
      marginTop: 6
    }
  }, d)))));
}
Object.assign(window, {
  ApresentacaoSection,
  UIKitSection,
  OrcamentoSection
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "brand-kit/Kits.jsx", error: String((e && e.message) || e) }); }

// brand-kit/Shell.jsx
try { (() => {
const BK_DS = window.DeCroquiDesignSystem_5f8fc8;
function bkCopy(text, label) {
  const done = () => window.dispatchEvent(new CustomEvent('bk-copied', {
    detail: {
      text,
      label
    }
  }));
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, done);else {
    const t = document.createElement('textarea');
    t.value = text;
    document.body.appendChild(t);
    t.select();
    try {
      document.execCommand('copy');
    } catch (e) {}
    t.remove();
    done();
  }
}
const BK_NAV = [{
  label: 'Fundamentos',
  items: [{
    id: 'visao',
    label: 'Visão geral',
    dot: 'var(--vinho-800)'
  }, {
    id: 'logos',
    label: 'Logos',
    dot: 'var(--noite-900)',
    count: 9
  }, {
    id: 'logo-motion',
    label: 'Logo animado',
    dot: 'var(--vinho-600)',
    count: 2
  }, {
    id: 'cores',
    label: 'Cores',
    dot: 'var(--ardosia-500)',
    count: 36
  }, {
    id: 'tipografia',
    label: 'Tipografia',
    dot: 'var(--linho-300)',
    count: 9
  }, {
    id: 'icones',
    label: 'Ícones',
    dot: 'var(--latao-500)',
    count: 34
  }, {
    id: 'padroes',
    label: 'Padrões & estampas',
    dot: 'var(--terracota-600)',
    count: 6
  }, {
    id: 'espacamento',
    label: 'Espaçamento',
    dot: 'var(--oliva-600)',
    count: 10
  }, {
    id: 'raios',
    label: 'Raios & sombras',
    dot: 'var(--ardosia-300)',
    count: 12
  }, {
    id: 'chips',
    label: 'Chips & tags',
    dot: 'var(--vinho-400)'
  }]
}, {
  label: 'Componentes',
  items: [{
    id: 'c-botoes',
    label: 'Botões',
    dot: 'var(--vinho-800)',
    count: 5
  }, {
    id: 'c-iconbtn',
    label: 'Icon buttons',
    dot: 'var(--noite-900)',
    count: 4
  }, {
    id: 'c-cards',
    label: 'Cards & ArchFrame',
    dot: 'var(--linho-400)'
  }, {
    id: 'c-forms',
    label: 'Formulários',
    dot: 'var(--ardosia-500)'
  }, {
    id: 'c-selecao',
    label: 'Seleção',
    dot: 'var(--oliva-600)'
  }, {
    id: 'c-tabs',
    label: 'Tabs',
    dot: 'var(--latao-500)',
    count: 2
  }, {
    id: 'c-feedback',
    label: 'Dialog, Toast & Tooltip',
    dot: 'var(--terracota-600)'
  }]
}, {
  label: 'Kits',
  items: [{
    id: 'k-apresentacao',
    label: 'Kit de apresentações',
    dot: 'var(--vinho-600)',
    count: 7
  }, {
    id: 'k-ui',
    label: 'UI kit · Website',
    dot: 'var(--noite-700)',
    count: 4
  }, {
    id: 'k-orcamento',
    label: 'Kit de orçamento',
    dot: 'var(--latao-500)',
    count: 3
  }, {
    id: 'k-instagram',
    label: 'Kit Instagram',
    dot: 'var(--vinho-800)',
    count: 21
  }]
}];
function useScrollSpy(ids) {
  const [active, setActive] = React.useState(ids[0]);
  React.useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const line = window.innerHeight * 0.28;
        let cur = ids[0];
        for (const id of ids) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= line) cur = id;
        }
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = ids[ids.length - 1];
        setActive(cur);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return active;
}
function Sidebar({
  active
}) {
  const sideRef = React.useRef(null);
  React.useEffect(() => {
    const side = sideRef.current;
    const el = side && side.querySelector('.bk-link.is-active');
    if (!el) return;
    const s = side.getBoundingClientRect(),
      r = el.getBoundingClientRect();
    if (getComputedStyle(side).flexDirection === 'row') {
      if (r.left < s.left || r.right > s.right) side.scrollTo({
        left: side.scrollLeft + r.left - s.left - 120,
        behavior: 'smooth'
      });
    } else if (r.top < s.top + 40 || r.bottom > s.bottom - 40) side.scrollTo({
      top: side.scrollTop + r.top - s.top - s.height / 2,
      behavior: 'smooth'
    });
  }, [active]);
  const go = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - (window.innerWidth <= 900 ? 80 : 24),
      behavior: 'smooth'
    });
    history.replaceState(null, '', '#' + id);
  };
  return /*#__PURE__*/React.createElement("aside", {
    className: "bk-side",
    ref: sideRef
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-brand"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-eyebrow"
  }, "Biblioteca viva \xB7 v1.0"), /*#__PURE__*/React.createElement("img", {
    src: "assets/logo/decroqui-imagotipo-horizontal-escuro.svg",
    alt: "De.Croqui",
    style: {
      width: 200,
      display: 'block',
      margin: '6px 0 4px'
    }
  }), /*#__PURE__*/React.createElement("p", null, "Kit de marca e design system \u2014 interiores com est\xE9tica mediterr\xE2nea.")), BK_NAV.map(g => /*#__PURE__*/React.createElement("nav", {
    className: "bk-group",
    key: g.label,
    "aria-label": g.label
  }, /*#__PURE__*/React.createElement("div", {
    className: "bk-group-label"
  }, g.label), g.items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it.id,
    href: '#' + it.id,
    onClick: e => go(e, it.id),
    className: 'bk-link' + (active === it.id ? ' is-active' : '')
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-dot",
    style: {
      background: it.dot
    }
  }), /*#__PURE__*/React.createElement("span", null, it.label), it.count != null && /*#__PURE__*/React.createElement("span", {
    className: "bk-count"
  }, it.count))))), /*#__PURE__*/React.createElement("div", {
    className: "bk-side-foot"
  }, "Tokens em ", /*#__PURE__*/React.createElement("code", null, "styles.css"), " \xB7 Componentes em ", /*#__PURE__*/React.createElement("code", null, "window.DeCroquiDesignSystem")));
}
function Section({
  id,
  eyebrow,
  title,
  desc,
  children
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: id,
    className: "bk-sec",
    "data-screen-label": title
  }, /*#__PURE__*/React.createElement("header", {
    className: "bk-sec-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "bk-eyebrow"
  }, eyebrow), /*#__PURE__*/React.createElement("h2", null, title)), /*#__PURE__*/React.createElement("p", null, desc)), children);
}
function Sub({
  title,
  note,
  children
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "bk-sub"
  }, /*#__PURE__*/React.createElement("h3", null, title), note && /*#__PURE__*/React.createElement("span", null, note)), children);
}
function Swatch({
  name,
  hex,
  token,
  dark
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: "bk-swatch",
    onClick: () => bkCopy(hex, name),
    title: 'Copiar ' + hex
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-swatch-chip",
    style: {
      background: 'var(' + token + ')',
      boxShadow: hex.toLowerCase() === '#f7f3ed' || hex.toLowerCase() === '#fbf8f3' ? 'inset 0 -1px 0 var(--border-hairline)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bk-copy-hint"
  }, "Copiar")), /*#__PURE__*/React.createElement("span", {
    className: "bk-swatch-meta"
  }, /*#__PURE__*/React.createElement("b", null, name), /*#__PURE__*/React.createElement("span", null, hex.toUpperCase()), /*#__PURE__*/React.createElement("span", null, token)));
}
function Code({
  children
}) {
  return /*#__PURE__*/React.createElement("pre", {
    className: "bk-code"
  }, children);
}
Object.assign(window, {
  BK_DS,
  bkCopy,
  BK_NAV,
  useScrollSpy,
  Sidebar,
  Section,
  Sub,
  Swatch,
  Code
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "brand-kit/Shell.jsx", error: String((e && e.message) || e) }); }

// brand-kit/ig-icons.js
try { (() => {
// Ícones próprios De.Croqui · grade 100×100 · gramática do isotipo.
// Tipos: W parede/traço principal (tinta) · T linha fina (tinta) · K ponto (tinta) · F sólido (tinta) · L folha (acento) · Ld folha tracejada · A arco (acento) · Ad arco tracejado · S arco forte (acento) · D sólido/pivô (acento) · B vazado (cor do fundo) · X traço vazado (cor do fundo) · O deslocamento [dx,dy]
(function () {
  const c = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  const leaf = (bx, by, c1x, c1y, tx, ty, c2x, c2y) => `M${bx} ${by}Q${c1x} ${c1y} ${tx} ${ty}Q${c2x} ${c2y} ${bx} ${by}Z`;
  const planta = {
    parceiros: {
      why: 'Duas salas, uma passagem: cada parceiro de um lado, o elo no meio.',
      p: [['W', 'M18 18H82V82H18Z'], ['W', 'M50 18V37'], ['W', 'M50 63V82'], ['A', 'M50 37A13 13 0 0 0 50 63'], ['A', 'M50 37A13 13 0 0 1 50 63'], ['D', c(50, 37, 2.6)], ['D', c(50, 63, 2.6)]]
    },
    comercial: {
      why: 'A loja vista de cima: vitrine na fachada, porta dupla e balcão.',
      p: [['W', 'M18 70V18H82V70'], ['T', 'M18 70H37M18 77H37M63 70H82M63 77H82M18 70V77M82 70V77'], ['L', 'M37 73.5V60.5'], ['L', 'M63 73.5V60.5'], ['A', 'M50 73.5A13 13 0 0 0 37 60.5'], ['A', 'M50 73.5A13 13 0 0 1 63 60.5'], ['T', 'M30 30H70V40H30Z']]
    },
    residencial: {
      why: 'O quarto: a mesma porta do isotipo abrindo para a cama.',
      p: [['W', 'M42 82H18V18H82V82H70'], ['L', 'M42 82V54'], ['A', 'M70 82A28 28 0 0 0 42 54'], ['D', c(42, 82, 2.6)], ['T', 'M52 18V48H76V18'], ['T', 'M56 23H72V29H56Z']]
    },
    corporativo: {
      why: 'Sala de reunião: mesa longa, cadeiras e a porta de entrada.',
      p: [['W', 'M18 30V18H82V82H18V58'], ['L', 'M18 58H46'], ['A', 'M18 30A28 28 0 0 1 46 58'], ['D', c(18, 58, 2.6)], ['T', 'M56 28H68V72H56Z'], ['K', c(50, 36, 2.4) + c(50, 50, 2.4) + c(50, 64, 2.4) + c(74, 36, 2.4) + c(74, 50, 2.4) + c(74, 64, 2.4)]]
    },
    faq: {
      why: 'A pergunta no centro da prancha, entre as marcas de corte.',
      p: [['W', 'M18 34V18H34'], ['W', 'M82 66V82H66'], ['W', 'M35 38A15 15 0 1 1 59.5 49.5L50 57V64'], ['D', c(50, 75, 3.6)]]
    },
    feedback: {
      why: 'O balão de fala construído como um cômodo: a voz do cliente tem lugar.',
      p: [['W', 'M18 18H82V66H44L28 82V66H18Z'], ['T', 'M32 35H68M32 47H58'], ['D', c(28, 82, 2.6)]]
    }
  };
  const DIRS = {
    porta: {
      label: 'A Porta',
      weight: 'Médio',
      concept: 'A porta é a assinatura da marca — está no isotipo. Cada destaque é um tipo de porta da arquitetura, e cada tipo conta o assunto: quem entra, como entra, o que vai e volta.',
      st: {
        W: {
          w: 5
        },
        L: {
          w: 2.8
        },
        A: {
          w: 2
        },
        Ad: {
          w: 2
        },
        Ld: {
          w: 2.4
        }
      },
      icons: {
        parceiros: {
          why: 'Porta de duas folhas: cada parceiro é metade da passagem.',
          p: [['O', 0, 0, 1.2], ['W', 'M14 62H26M74 62H86'], ['L', 'M26 62V38'], ['L', 'M74 62V38'], ['A', 'M50 62A24 24 0 0 0 26 38'], ['A', 'M50 62A24 24 0 0 1 74 38'], ['D', c(26, 62, 2.6) + c(74, 62, 2.6)]]
        },
        comercial: {
          why: 'Porta de correr, a da vitrine: a loja aberta para a rua.',
          p: [['O', 0, 0, 1.35], ['W', 'M14 58H30M70 58H86'], ['L', 'M30 53H54'], ['L', 'M46 63H70'], ['A', 'M40 42H60M55 37L60 42L55 47']]
        },
        residencial: {
          why: 'A porta do isotipo sob um telhado: a casa começa na entrada.',
          p: [['O', 0, 3], ['W', 'M18 40L50 14L82 40'], ['W', 'M14 76H34M68 76H86'], ['L', 'M34 76V42'], ['A', 'M68 76A34 34 0 0 0 34 42'], ['D', c(34, 76, 2.6)]]
        },
        corporativo: {
          why: 'Porta giratória: o fluxo contínuo do prédio de escritórios.',
          p: [['O', 0, 0, 1.12], ['W', 'M14 50H28M72 50H86'], ['W', 'M29.3 42.5A22 22 0 0 1 70.7 42.5M29.3 57.5A22 22 0 0 0 70.7 57.5'], ['L', 'M35.9 35.9L64.1 64.1M64.1 35.9L35.9 64.1'], ['D', c(50, 50, 2.8)]]
        },
        faq: {
          why: 'A dúvida mora no vão: o arco da porta vira o ponto de interrogação.',
          p: [['W', 'M18 76H40M60 76H82'], ['S', 'M36 36A14 14 0 1 1 57.1 48.1L50 54V62'], ['D', c(50, 76, 3.4)]]
        },
        feedback: {
          why: 'Porta vai-e-vem: abre para os dois lados, como o que vai e volta.',
          p: [['W', 'M14 50H34M66 50H86'], ['L', 'M34 50V18'], ['Ld', 'M34 50V82'], ['A', 'M66 50A32 32 0 0 0 34 18'], ['Ad', 'M66 50A32 32 0 0 1 34 82'], ['D', c(34, 50, 2.6)]]
        }
      }
    },
    planta: {
      label: 'Planta baixa',
      weight: 'Grosso',
      concept: 'O ambiente que projetamos, visto de cima, como no croqui. Paredes, porta e mobiliário contam de que espaço se trata — é o olhar do projetista.',
      st: {
        W: {
          w: 7
        },
        T: {
          w: 2.6
        }
      },
      icons: planta
    },
    plantafina: {
      label: 'Planta baixa · traço fino',
      weight: 'Fino',
      concept: 'As mesmas plantas com a caneta 0.1 do desenho executivo. Mais delicado e editorial; perde um pouco de leitura no tamanho real, ganha sofisticação.',
      st: {
        W: {
          w: 3
        },
        T: {
          w: 1.6
        },
        L: {
          w: 1.8
        },
        A: {
          w: 1.3
        }
      },
      icons: planta
    },
    selo: {
      label: 'Selo do isotipo',
      weight: 'Misto',
      concept: 'As paredes do isotipo viram a moldura fixa de todos os destaques; dentro, um símbolo fino muda conforme o assunto. É o que mais amarra os destaques à foto de perfil.',
      st: {
        W: {
          w: 5.5
        },
        T: {
          w: 2.6
        }
      },
      icons: (() => {
        const f = [['W', 'M40 82H18V18H82V36'], ['W', 'M74 82H82']];
        return {
          parceiros: {
            why: 'Dois anéis entrelaçados: uma aliança dentro da casa da marca.',
            p: [...f, ['T', c(43, 50, 10)], ['L', c(57, 50, 10)]]
          },
          comercial: {
            why: 'A sacola: o comércio, as lojas que projetamos.',
            p: [...f, ['T', 'M38 45H62L60 65H40Z'], ['L', 'M44 45V41A6 6 0 0 1 56 41V45']]
          },
          residencial: {
            why: 'A casinha: o lar como origem de todo projeto.',
            p: [...f, ['T', 'M36 50L50 37L64 50M40 46V64H60V46'], ['L', 'M46 64V57H54V64']]
          },
          corporativo: {
            why: 'O prédio: empresas, escritórios, quem trabalha ali.',
            p: [...f, ['T', 'M40 65V34H60V65'], ['K', c(45.5, 42, 1.8) + c(54.5, 42, 1.8) + c(45.5, 50, 1.8) + c(54.5, 50, 1.8)], ['L', 'M47 65V58H53V65']]
          },
          faq: {
            why: 'A interrogação no lugar onde, no isotipo, a porta se abre.',
            p: [...f, ['T', 'M43 42A7 7 0 1 1 53.5 48L50 51V55'], ['D', c(50, 61, 2.2)]]
          },
          feedback: {
            why: 'O balão de fala: o que o cliente tem a dizer.',
            p: [...f, ['T', 'M36 38H64V57H47L40 64V57H36Z'], ['L', 'M42 45H58M42 50H53']]
          }
        };
      })()
    },
    arcos: {
      label: 'Arcos mediterrâneos',
      weight: 'Médio',
      concept: 'A estética mediterrânea da marca em fachada: o arco caiado é a moldura de cada mundo. É a leitura mais imediata no tamanho pequeno.',
      st: {
        W: {
          w: 5.5
        }
      },
      icons: {
        parceiros: {
          why: 'Dois arcos que se cruzam: dois caminhos que passam a ser um.',
          p: [['W', 'M22 84V46A18 18 0 0 1 58 46V84'], ['W', 'M42 84V46A18 18 0 0 1 78 46V84'], ['T', 'M12 84H88']]
        },
        comercial: {
          why: 'A arcada: a galeria de lojas na praça.',
          p: [['W', 'M14 30H86'], ['T', 'M14 30V22H86V30'], ['W', 'M18 84V54A9 9 0 0 1 36 54V84'], ['W', 'M41 84V54A9 9 0 0 1 59 54V84'], ['W', 'M64 84V54A9 9 0 0 1 82 54V84'], ['T', 'M10 84H90']]
        },
        residencial: {
          why: 'A casa com porta em arco: o lar mediterrâneo.',
          p: [['W', 'M16 46L50 18L84 46'], ['W', 'M26 38V82H74V38'], ['L', 'M42 82V64A8 8 0 0 1 58 64V82'], ['T', 'M14 82H86']]
        },
        corporativo: {
          why: 'O edifício de janelas em arco: o escritório com alma.',
          p: [['W', 'M28 84V18H72V84'], ['T', 'M36 40V34A5 5 0 0 1 46 34V40ZM54 40V34A5 5 0 0 1 64 34V40ZM36 56V50A5 5 0 0 1 46 50V56ZM54 56V50A5 5 0 0 1 64 50V56Z'], ['L', 'M44 84V74A6 6 0 0 1 56 74V84'], ['T', 'M16 84H84']]
        },
        faq: {
          why: 'A pergunta emoldurada pelo arco: atravessar a dúvida.',
          p: [['W', 'M24 84V46A26 26 0 0 1 76 46V84'], ['S', 'M42 48A8.5 8.5 0 1 1 55 55L50 59V64'], ['D', c(50, 73, 3)], ['T', 'M14 84H86']]
        },
        feedback: {
          why: 'A estrela no arco: a avaliação que ilumina o caminho.',
          p: [['W', 'M24 84V46A26 26 0 0 1 76 46V84'], ['D', 'M50 48Q52 62 63 64Q52 66 50 80Q48 66 37 64Q48 62 50 48Z'], ['T', 'M14 84H86']]
        }
      }
    },
    detalhes: {
      label: 'Detalhes mediterrâneos',
      weight: 'Fino',
      concept: 'Objetos e elementos da arquitetura mediterrânea, cada um com um significado: a coluna que sustenta, a chave que abre, a oliveira que agradece. Mais simbólico e poético.',
      st: {
        W: {
          w: 3.4
        },
        T: {
          w: 2
        },
        L: {
          w: 2.4
        }
      },
      icons: {
        parceiros: {
          why: 'Duas colunas sustentam o mesmo arco: nenhuma fica de pé sozinha.',
          p: [['W', 'M28 40A22 22 0 0 1 72 40'], ['W', 'M22 40H34M66 40H78M22 80H34M66 80H78'], ['T', 'M25.5 40V80M30.5 40V80M69.5 40V80M74.5 40V80'], ['D', c(50, 18, 2.4)]]
        },
        comercial: {
          why: 'O toldo sobre a vitrine: o convite para entrar.',
          p: [['W', 'M18 28H82'], ['T', 'M18 28L14 44M82 28L86 44'], ['T', 'M14 44A9 9 0 0 0 32 44A9 9 0 0 0 50 44A9 9 0 0 0 68 44A9 9 0 0 0 86 44'], ['L', 'M34 28L32 44M50 28V44M66 28L68 44'], ['T', 'M22 56H78V82H22ZM50 56V82']]
        },
        residencial: {
          why: 'A janela com venezianas: luz filtrada, intimidade da casa.',
          p: [['W', 'M36 24H64V74H36Z'], ['T', 'M50 24V74M36 49H64'], ['T', 'M22 24H34V74H22ZM66 24H78V74H66Z'], ['L', 'M24 37H32M24 49H32M24 61H32M68 37H76M68 49H76M68 61H76'], ['W', 'M30 80H70']]
        },
        corporativo: {
          why: 'A coluna clássica: a solidez de quem sustenta uma empresa.',
          p: [['W', 'M32 20H68M30 82H70'], ['T', 'M38 20L41 27H59L62 20M36 76H64'], ['T', 'M42 27V76M58 27V76'], ['L', 'M50 27V76']]
        },
        faq: {
          why: 'A chave: toda resposta abre uma porta.',
          p: [['O', 0, 0], ['W', c(32, 50, 12)], ['D', c(32, 50, 3)], ['W', 'M44 50H84'], ['T', 'M72 50V60M80 50V62']]
        },
        feedback: {
          why: 'O ramo de oliveira: gratidão e reconhecimento mediterrâneos.',
          p: [['O', -5, 4, 1.12], ['T', 'M30 80C38 60 52 40 72 24'], ['D', leaf(37, 65, 37.1, 55.8, 30, 50, 29.9, 59.2) + leaf(42, 57.5, 48.3, 63.6, 57, 62, 50.6, 55.9) + leaf(46.5, 50.5, 46.9, 41.4, 40, 35.5, 39.6, 44.6) + leaf(52, 43.5, 58.6, 49.1, 67, 47, 60.4, 41.4) + leaf(58, 36.6, 59.9, 28.2, 54, 22, 52.1, 30.4) + leaf(72, 24, 79.2, 23, 81, 16, 73.8, 17)]]
        }
      }
    },
    mobiliario: {
      label: 'Mobiliário assinado',
      weight: 'Fino',
      concept: 'A marcenaria é protagonista: cada destaque é uma peça que desenhamos, em vista frontal. Fala do resultado — o móvel — e não do espaço.',
      st: {
        W: {
          w: 3.4
        },
        T: {
          w: 2.2
        },
        L: {
          w: 2.6
        }
      },
      icons: {
        parceiros: {
          why: 'Duas cadeiras frente a frente e a mesa: a conversa que vira projeto.',
          p: [['W', 'M24 30V78M76 30V78'], ['L', 'M24 56H40M76 56H60'], ['T', 'M40 56V78M60 56V78'], ['W', 'M44 62H56'], ['T', 'M50 62V78M16 78H84']]
        },
        comercial: {
          why: 'O balcão com banqueta e pendente: onde o cliente é recebido.',
          p: [['W', 'M16 46H64'], ['T', 'M20 46V80H60V46'], ['T', 'M40 14V24'], ['W', 'M33 30L36 24H44L47 30Z'], ['L', 'M70 58H84'], ['T', 'M72 58L70 80M82 58L84 80M71 70H83']]
        },
        residencial: {
          why: 'O sofá: o coração da sala de estar.',
          p: [['W', 'M26 52V38H74V52'], ['W', 'M18 50H26V72H18ZM74 50H82V72H74Z'], ['L', 'M26 58H74'], ['T', 'M50 38V52M26 72H74M22 72V78M78 72V78']]
        },
        corporativo: {
          why: 'A mesa de trabalho e a cadeira: foco, rotina, ergonomia.',
          p: [['W', 'M14 48H66'], ['T', 'M18 48V80M62 48V80'], ['L', 'M28 28H52V42H28Z'], ['T', 'M40 42V48'], ['W', 'M72 62H86'], ['T', 'M86 38V62M79 62V80M72 80H86']]
        },
        faq: {
          why: 'A luminária: toda pergunta merece luz.',
          p: [['W', 'M36 22H64L72 48H28Z'], ['T', 'M50 48V78'], ['W', 'M38 80H62'], ['L', 'M62 48V60'], ['D', c(62, 62, 2.4)]]
        },
        feedback: {
          why: 'O vaso com planta: o que cresce com cuidado e retorno.',
          p: [['W', 'M36 58H64L60 82H40Z'], ['T', 'M50 58V22'], ['D', leaf(50, 48, 44.1, 39.6, 34, 38, 39.9, 46.4) + leaf(50, 40, 60.1, 38.4, 66, 30, 55.9, 31.6) + leaf(50, 28, 54, 21, 50, 14, 46, 21)]]
        }
      }
    },
    geometria: {
      label: 'Geometria pura',
      weight: 'Grosso',
      concept: 'Círculo, quadrado e arco — as formas primárias da arquitetura. Cada destaque é a menor combinação de formas que conta o assunto; o canto reto do isotipo aparece onde dá.',
      st: {
        W: {
          w: 7
        }
      },
      icons: {
        parceiros: {
          why: 'Dois círculos sobrepostos: a interseção é o que construímos juntos.',
          p: [['D', 'M50 35A18 18 0 0 1 50 65A18 18 0 0 1 50 35Z'], ['W', c(40, 50, 18)], ['W', c(60, 50, 18)]]
        },
        comercial: {
          why: 'O quadrado com o vão em arco: a fachada da loja.',
          p: [['W', 'M20 20H80V80H20Z'], ['D', 'M38 80V56A12 12 0 0 1 62 56V80Z'], ['W', 'M20 36H80']]
        },
        residencial: {
          why: 'Triângulo sobre quadrado: o desenho de casa de toda criança.',
          p: [['W', 'M20 46L50 20L80 46'], ['W', 'M28 40V80H72V40'], ['D', c(50, 58, 6)]]
        },
        corporativo: {
          why: 'Retângulos escalonados: as torres de escritório.',
          p: [['W', 'M20 80V44H40V22H60V36H80V80Z'], ['W', 'M40 44V80M60 36V80'], ['D', 'M46 30H54V38H46Z']]
        },
        faq: {
          why: 'Três quartos de círculo e um ponto: a interrogação mínima.',
          p: [['W', 'M34 36A16 16 0 1 1 50 52V62'], ['D', c(50, 76, 4.5)]]
        },
        feedback: {
          why: 'Círculo com o canto reto do isotipo: o balão de fala da marca.',
          p: [['W', 'M26 48A24 24 0 1 1 50 72H26Z'], ['D', c(50, 48, 4.5)]]
        }
      }
    },
    cheio: {
      label: 'Cheio & vazio',
      weight: 'Sólido',
      concept: 'Arquitetura é feita de cheios e vazios. Formas sólidas com vãos recortados — o vão em arco é a assinatura. Contraste máximo: lê bem até no menor tamanho.',
      st: {
        X: {
          w: 5
        }
      },
      icons: {
        parceiros: {
          why: 'Um arco cheio e um vazado: duas naturezas, um mesmo desenho.',
          p: [['F', 'M20 82V48A16 16 0 0 1 52 48V82Z'], ['S', 'M48 82V48A16 16 0 0 1 80 48V82']]
        },
        comercial: {
          why: 'O letreiro e a arcada: a frente da loja.',
          p: [['F', 'M18 28H82V40H18Z'], ['F', 'M18 82V56A8 8 0 0 1 34 56V82ZM42 82V56A8 8 0 0 1 58 56V82ZM66 82V56A8 8 0 0 1 82 56V82Z'], ['D', 'M18 46H82V49H18Z']]
        },
        residencial: {
          why: 'A casa cheia, a porta em arco vazada: o lar que acolhe.',
          p: [['F', 'M20 46L50 20L80 46V82H20Z'], ['B', 'M42 82V64A8 8 0 0 1 58 64V82Z']]
        },
        corporativo: {
          why: 'A torre sólida com janelas em arco recortadas.',
          p: [['F', 'M30 82V18H70V82Z'], ['B', 'M38 34V29A4 4 0 0 1 46 29V34ZM54 34V29A4 4 0 0 1 62 29V34ZM38 50V45A4 4 0 0 1 46 45V50ZM54 50V45A4 4 0 0 1 62 45V50ZM38 66V61A4 4 0 0 1 46 61V66ZM54 66V61A4 4 0 0 1 62 61V66Z'], ['D', 'M44 82V75A6 6 0 0 1 56 75V82Z']]
        },
        faq: {
          why: 'A interrogação recortada no arco: a resposta é o vazio que deixa passar a luz.',
          p: [['F', 'M22 82V46A28 28 0 0 1 78 46V82Z'], ['X', 'M42 47A8.5 8.5 0 1 1 55 54L50 58V63'], ['B', c(50, 72, 3.4)]]
        },
        feedback: {
          why: 'A estrela vazada no arco: a avaliação que fica marcada.',
          p: [['F', 'M22 82V46A28 28 0 0 1 78 46V82Z'], ['B', 'M50 42Q52.5 58 65 61Q52.5 64 50 80Q47.5 64 35 61Q47.5 58 50 42Z']]
        }
      }
    },
    croqui: {
      label: 'Croqui de traço',
      weight: 'Fino',
      concept: 'O nome da marca: o croqui. Linhas soltas que passam do canto, como no primeiro esboço sobre a mesa. Mostra a mão do projetista antes do projeto pronto.',
      st: {
        T: {
          w: 2.6
        },
        L: {
          w: 2.6
        }
      },
      icons: {
        parceiros: {
          why: 'Dois quadrados esboçados que se sobrepõem: a área em comum.',
          p: [['T', 'M15 28H63M15 66H63M20 23V71M58 23V71'], ['L', 'M37 34H85M37 72H85M42 29V77M80 29V77']]
        },
        comercial: {
          why: 'A fachada da loja com toldo, riscada à mão.',
          p: [['T', 'M14 30H86M14 80H86M20 24V86M80 24V86'], ['L', 'M20 30L26 42H74L80 30'], ['T', 'M56 86V54H72V86']]
        },
        residencial: {
          why: 'A casa no primeiro traço: o telhado se cruza no alto.',
          p: [['T', 'M15.5 51.9L54.5 18.1M84.5 51.9L45.5 18.1M26 40V86M74 40V86M20 82H80'], ['L', 'M44 86V64H56V86M40 64H60']]
        },
        corporativo: {
          why: 'A torre esboçada, andar por andar.',
          p: [['T', 'M32 14V86M68 14V86M26 20H74M26 82H74M50 20V82'], ['L', 'M28 36H72M28 50H72M28 64H72']]
        },
        faq: {
          why: 'A interrogação feita de um só traço de lápis.',
          p: [['T', 'M35 38C35 22 65 20 65 37C65 49 50 47 50 62'], ['D', c(50, 76, 3.4)], ['T', 'M38 84H62']]
        },
        feedback: {
          why: 'O balão riscado: a conversa que nasce no rascunho.',
          p: [['T', 'M14 24H86M14 64H86M20 18V70M80 18V70'], ['L', 'M32 64L26 84L48 64']]
        }
      }
    }
  };
  const ST = {
    W: {
      k: 'ink',
      w: 5.5,
      cap: 'square',
      join: 'miter'
    },
    T: {
      k: 'ink',
      w: 2.4
    },
    L: {
      k: 'acc',
      w: 2.6
    },
    Ld: {
      k: 'acc',
      w: 2.2,
      dash: '3 4'
    },
    A: {
      k: 'acc',
      w: 1.8,
      o: .85
    },
    Ad: {
      k: 'acc',
      w: 1.8,
      o: .85,
      dash: '3 4'
    },
    S: {
      k: 'acc',
      w: 4
    },
    K: {
      k: 'ink',
      fill: 1
    },
    F: {
      k: 'ink',
      fill: 1
    },
    D: {
      k: 'acc',
      fill: 1
    },
    B: {
      k: 'bg',
      fill: 1
    },
    X: {
      k: 'bg',
      w: 5
    }
  };
  const sty = (dir, t) => Object.assign({}, ST[t], (DIRS[dir].st || {})[t]);
  const col = (s, ink, acc, bg) => s.k === 'ink' ? ink : s.k === 'bg' ? bg : acc;
  function svg(dir, id, ink, acc, bg) {
    let off = 'translate(0 0)';
    const parts = DIRS[dir].icons[id].p.map(([t, d, e, k0]) => {
      if (t === 'O') {
        const k = k0 || 1;
        off = `translate(${d + 50 - 50 * k} ${e + 50 - 50 * k}) scale(${k})`;
        return '';
      }
      const s = sty(dir, t),
        cl = col(s, ink, acc, bg);
      return s.fill ? `<path d="${d}" fill="${cl}"/>` : `<path d="${d}" fill="none" stroke="${cl}" stroke-width="${s.w}" stroke-linecap="${s.cap || 'round'}" stroke-linejoin="${s.join || 'round'}"${s.o ? ` opacity="${s.o}"` : ''}${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/>`;
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="${off}">${parts.join('')}</g></svg>`;
  }
  function paint(ctx, dir, id, ink, acc, bg) {
    ctx.save();
    DIRS[dir].icons[id].p.forEach(([t, d, e, k0]) => {
      if (t === 'O') {
        const k = k0 || 1;
        ctx.translate(d + 50 - 50 * k, e + 50 - 50 * k);
        ctx.scale(k, k);
        return;
      }
      const s = sty(dir, t),
        cl = col(s, ink, acc, bg),
        p = new Path2D(d);
      ctx.save();
      ctx.globalAlpha = s.o || 1;
      if (s.fill) {
        ctx.fillStyle = cl;
        ctx.fill(p);
      } else {
        ctx.strokeStyle = cl;
        ctx.lineWidth = s.w;
        ctx.lineCap = s.cap || 'round';
        ctx.lineJoin = s.join || 'round';
        ctx.setLineDash(s.dash ? s.dash.split(' ').map(Number) : []);
        ctx.stroke(p);
      }
      ctx.restore();
    });
    ctx.restore();
  }
  window.DC_IG_ICONS = {
    DIRS,
    svg,
    paint
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "brand-kit/ig-icons.js", error: String((e && e.message) || e) }); }

// components/core/ArchFrame.jsx
try { (() => {
const SHAPES = {
  arch: 'var(--radius-arch)',
  soft: 'var(--radius-arch-soft)',
  rect: 'var(--radius-none)',
  round: 'var(--radius-lg)'
};
function ArchFrame({
  src,
  alt = '',
  shape = 'arch',
  ratio = '3 / 4',
  label = 'Imagem',
  tone = 'stone',
  zoom = false,
  style,
  children
}) {
  const bg = {
    stone: 'var(--linho-200)',
    slate: 'var(--ardosia-300)',
    wine: 'var(--vinho-700)',
    night: 'var(--noite-800)'
  }[tone];
  const fg = tone === 'stone' || tone === 'slate' ? 'var(--noite-900)' : 'var(--linho-100)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: ratio,
      borderRadius: SHAPES[shape],
      overflow: 'hidden',
      background: bg,
      ...style
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
      transition: 'transform var(--duration-reveal) var(--ease-out)',
      transform: zoom ? 'scale(1.04)' : 'scale(1)'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      backgroundImage: 'var(--grain)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 10.5,
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      color: fg,
      opacity: .7
    }
  }, label)), children);
}
Object.assign(__ds_scope, { ArchFrame });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ArchFrame.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const TONES = {
  neutral: ['var(--linho-200)', 'var(--noite-900)'],
  brand: ['var(--vinho-800)', 'var(--linho-50)'],
  navy: ['var(--noite-900)', 'var(--linho-50)'],
  slate: ['var(--ardosia-100)', 'var(--ardosia-700)'],
  success: ['var(--feedback-success-bg)', 'var(--feedback-success)'],
  warning: ['var(--feedback-warning-bg)', 'var(--feedback-warning)'],
  danger: ['var(--feedback-danger-bg)', 'var(--feedback-danger)']
};
function Badge({
  children,
  tone = 'neutral',
  dot = false,
  style
}) {
  const [bg, fg] = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 22,
      padding: '0 10px',
      borderRadius: 'var(--radius-xs)',
      background: bg,
      color: fg,
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: 10.5,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: 'currentColor'
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
const {
  useState
} = React;
function Tooltip({
  label,
  placement = 'top',
  children,
  open: forced
}) {
  const [open, setOpen] = useState(false);
  const show = forced ?? open;
  const top = placement === 'top';
  return /*#__PURE__*/React.createElement("span", {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    style: {
      position: 'relative',
      display: 'inline-flex'
    }
  }, children, /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      left: '50%',
      [top ? 'bottom' : 'top']: 'calc(100% + 10px)',
      transform: 'translateX(-50%) translateY(' + (show ? 0 : top ? 4 : -4) + 'px)',
      opacity: show ? 1 : 0,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      padding: '7px 12px',
      background: 'var(--noite-900)',
      color: 'var(--linho-50)',
      borderRadius: 'var(--radius-xs)',
      fontFamily: 'var(--font-body)',
      fontSize: 12.5,
      letterSpacing: '.02em',
      transition: 'opacity var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out)',
      zIndex: 50
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  label,
  checked = false,
  onChange,
  name,
  value,
  disabled = false,
  description,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'flex-start',
      gap: 12,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .45 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    value: value,
    checked: checked,
    disabled: disabled,
    onChange: () => onChange && onChange(value),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      flexShrink: 0,
      width: 18,
      height: 18,
      marginTop: 2,
      borderRadius: '50%',
      border: '1px solid ' + (checked ? 'var(--vinho-800)' : 'var(--border-default)'),
      background: 'var(--surface-card)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'border-color var(--duration-fast) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--vinho-800)',
      transform: checked ? 'scale(1)' : 'scale(0)',
      transition: 'transform var(--duration-fast) var(--ease-out)'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--text-primary)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      fontWeight: 300,
      color: 'var(--text-secondary)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  label,
  checked = false,
  onChange,
  disabled = false,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .45 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    role: "switch",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'relative',
      width: 40,
      height: 22,
      borderRadius: 'var(--radius-pill)',
      background: checked ? 'var(--noite-900)' : 'var(--linho-300)',
      transition: 'background var(--duration-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: checked ? 21 : 3,
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: 'var(--linho-50)',
      boxShadow: 'var(--shadow-xs)',
      transition: 'left var(--duration-base) var(--ease-out)'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--text-primary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/icon/Icon.jsx
try { (() => {
// Paths copied verbatim from lucide-static@0.460.0 (ISC). See assets/icons/*.svg.
const ICONS = {
  "arrow-right": "<path d=\"M5 12h14\" /> <path d=\"m12 5 7 7-7 7\" />",
  "arrow-left": "<path d=\"m12 19-7-7 7-7\" /> <path d=\"M19 12H5\" />",
  "arrow-up-right": "<path d=\"M7 7h10v10\" /> <path d=\"M7 17 17 7\" />",
  "menu": "<line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\" /> <line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\" /> <line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\" />",
  "x": "<path d=\"M18 6 6 18\" /> <path d=\"m6 6 12 12\" />",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\" /> <path d=\"m21 21-4.3-4.3\" />",
  "heart": "<path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\" />",
  "phone": "<path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\" />",
  "mail": "<rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\" /> <path d=\"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7\" />",
  "map-pin": "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\" /> <circle cx=\"12\" cy=\"10\" r=\"3\" />",
  "instagram": "<rect width=\"20\" height=\"20\" x=\"2\" y=\"2\" rx=\"5\" ry=\"5\" /> <path d=\"M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z\" /> <line x1=\"17.5\" x2=\"17.51\" y1=\"6.5\" y2=\"6.5\" />",
  "calendar": "<path d=\"M8 2v4\" /> <path d=\"M16 2v4\" /> <rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /> <path d=\"M3 10h18\" />",
  "check": "<path d=\"M20 6 9 17l-5-5\" />",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\" />",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\" />",
  "chevron-left": "<path d=\"m15 18-6-6 6-6\" />",
  "plus": "<path d=\"M5 12h14\" /> <path d=\"M12 5v14\" />",
  "minus": "<path d=\"M5 12h14\" />",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 16v-4\" /> <path d=\"M12 8h.01\" />",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m9 12 2 2 4-4\" />",
  "sofa": "<path d=\"M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3\" /> <path d=\"M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z\" /> <path d=\"M4 18v2\" /> <path d=\"M20 18v2\" /> <path d=\"M12 4v9\" />",
  "lamp": "<path d=\"M8 2h8l4 10H4L8 2Z\" /> <path d=\"M12 12v6\" /> <path d=\"M8 22v-2c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v2H8Z\" />",
  "leaf": "<path d=\"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z\" /> <path d=\"M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12\" />",
  "gem": "<path d=\"M6 3h12l4 6-10 13L2 9Z\" /> <path d=\"M11 3 8 9l4 13 4-13-3-6\" /> <path d=\"M2 9h20\" />",
  "ruler": "<path d=\"M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z\" /> <path d=\"m14.5 12.5 2-2\" /> <path d=\"m11.5 9.5 2-2\" /> <path d=\"m8.5 6.5 2-2\" /> <path d=\"m17.5 15.5 2-2\" />",
  "pen-tool": "<path d=\"M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z\" /> <path d=\"m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18\" /> <path d=\"m2.3 2.3 7.286 7.286\" /> <circle cx=\"11\" cy=\"11\" r=\"2\" />",
  "image": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\" /> <circle cx=\"9\" cy=\"9\" r=\"2\" /> <path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\" />",
  "message-circle": "<path d=\"M7.9 20A9 9 0 1 0 4 16.1L2 22Z\" />",
  "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\" /> <circle cx=\"12\" cy=\"7\" r=\"4\" />",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <polyline points=\"12 6 12 12 16 14\" />",
  "share-2": "<circle cx=\"18\" cy=\"5\" r=\"3\" /> <circle cx=\"6\" cy=\"12\" r=\"3\" /> <circle cx=\"18\" cy=\"19\" r=\"3\" /> <line x1=\"8.59\" x2=\"15.42\" y1=\"13.51\" y2=\"17.49\" /> <line x1=\"15.41\" x2=\"8.59\" y1=\"6.51\" y2=\"10.49\" />",
  "download": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /> <polyline points=\"7 10 12 15 17 10\" /> <line x1=\"12\" x2=\"12\" y1=\"15\" y2=\"3\" />",
  "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\" /> <path d=\"M12 9v4\" /> <path d=\"M12 17h.01\" />",
  "house": "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\" /> <path d=\"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\" />"
};
function Icon({
  name,
  size = 20,
  strokeWidth = 1.25,
  color = 'currentColor',
  title,
  style,
  ...rest
}) {
  const body = ICONS[name];
  if (!body) return null;
  return React.createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    role: title ? 'img' : 'presentation',
    'aria-label': title,
    'aria-hidden': title ? undefined : true,
    style: {
      display: 'inline-block',
      flexShrink: 0,
      verticalAlign: 'middle',
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: body
    },
    ...rest
  });
}
const ICON_NAMES = Object.keys(ICONS);
Object.assign(__ds_scope, { Icon, ICON_NAMES });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icon/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const SIZES = {
  sm: {
    height: 'var(--control-height-sm)',
    padding: '0 18px',
    fontSize: '11px',
    gap: 8,
    icon: 14
  },
  md: {
    height: 'var(--control-height-md)',
    padding: '0 26px',
    fontSize: '12px',
    gap: 10,
    icon: 16
  },
  lg: {
    height: 'var(--control-height-lg)',
    padding: '0 36px',
    fontSize: '13px',
    gap: 12,
    icon: 18
  }
};
function palette(variant, hover, press) {
  switch (variant) {
    case 'secondary':
      return {
        background: press ? 'var(--noite-950)' : hover ? 'var(--action-secondary-hover)' : 'var(--action-secondary)',
        color: 'var(--text-on-dark)',
        border: '1px solid transparent'
      };
    case 'outline':
      return {
        background: hover ? 'var(--noite-900)' : 'transparent',
        color: hover ? 'var(--text-on-dark)' : 'var(--text-primary)',
        border: '1px solid var(--border-strong)'
      };
    case 'light':
      return {
        background: hover ? 'var(--linho-50)' : 'var(--linho-200)',
        color: 'var(--noite-900)',
        border: '1px solid transparent'
      };
    case 'ghost':
      return {
        background: 'transparent',
        color: hover ? 'var(--text-link-hover)' : 'var(--text-brand)',
        border: '1px solid transparent',
        padding: 0,
        height: 'auto'
      };
    default:
      return {
        background: press ? 'var(--action-primary-press)' : hover ? 'var(--action-primary-hover)' : 'var(--action-primary)',
        color: 'var(--text-on-dark)',
        border: '1px solid transparent'
      };
  }
}
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const s = SIZES[size] || SIZES.md;
  const p = palette(variant, hover && !disabled, press && !disabled);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      display: fullWidth ? 'flex' : 'inline-flex',
      width: fullWidth ? '100%' : undefined,
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      borderRadius: 'var(--radius-xs)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: s.fontSize,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      transition: 'background var(--duration-base) var(--ease-out), color var(--duration-base) var(--ease-out), transform var(--duration-fast) var(--ease-out)',
      transform: press && !disabled ? 'translateY(1px)' : 'none',
      opacity: disabled ? 0.4 : 1,
      ...p,
      ...style
    }
  }, rest), iconLeft && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: s.icon
  }), /*#__PURE__*/React.createElement("span", {
    style: variant === 'ghost' ? {
      borderBottom: '1px solid currentColor',
      paddingBottom: 3
    } : undefined
  }, children), iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.icon,
    style: {
      transition: 'transform var(--duration-base) var(--ease-out)',
      transform: hover && !disabled ? 'translateX(3px)' : 'none'
    }
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
const {
  useState
} = React;
function Card({
  image,
  imageLabel,
  shape = 'soft',
  ratio = '4 / 5',
  eyebrow,
  title,
  description,
  meta,
  variant = 'plain',
  onClick,
  style
}) {
  const [hover, setHover] = useState(false);
  const boxed = variant === 'boxed';
  return /*#__PURE__*/React.createElement("article", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      cursor: onClick ? 'pointer' : 'default',
      background: boxed ? 'var(--surface-card)' : 'transparent',
      padding: boxed ? 14 : 0,
      paddingBottom: boxed ? 22 : 0,
      border: boxed ? '1px solid var(--border-hairline)' : 'none',
      borderRadius: boxed ? 'var(--radius-sm)' : 0,
      boxShadow: boxed && hover ? 'var(--shadow-md)' : 'none',
      transition: 'box-shadow var(--duration-base) var(--ease-out)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.ArchFrame, {
    src: image,
    label: imageLabel,
    shape: shape,
    ratio: ratio,
    zoom: hover
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: boxed ? '0 6px' : 0
    }
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: 11,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 28,
      lineHeight: 1.1,
      color: 'var(--text-primary)',
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", null, title), onClick && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-up-right",
    size: 20,
    style: {
      color: 'var(--text-brand)',
      transition: 'transform var(--duration-base) var(--ease-out)',
      transform: hover ? 'translate(2px,-2px)' : 'none'
    }
  })), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-body)',
      fontWeight: 300,
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--text-secondary)'
    }
  }, description), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, meta)));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
function IconButton({
  icon,
  label,
  variant = 'outline',
  size = 'md',
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const dim = size === 'sm' ? 36 : size === 'lg' ? 56 : 44;
  const h = hover && !disabled;
  const v = {
    outline: {
      background: h ? 'var(--noite-900)' : 'transparent',
      color: h ? 'var(--text-on-dark)' : 'var(--text-primary)',
      border: '1px solid var(--border-default)'
    },
    filled: {
      background: h ? 'var(--action-primary-hover)' : 'var(--action-primary)',
      color: 'var(--text-on-dark)',
      border: '1px solid transparent'
    },
    ghost: {
      background: h ? 'var(--surface-sunken)' : 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid transparent'
    },
    glass: {
      background: h ? 'rgba(247,243,237,.32)' : 'rgba(247,243,237,.16)',
      color: 'var(--text-on-dark)',
      border: '1px solid var(--border-on-dark)',
      backdropFilter: 'blur(var(--blur-glass))',
      WebkitBackdropFilter: 'blur(var(--blur-glass))'
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: dim,
      height: dim,
      borderRadius: '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'background var(--duration-base) var(--ease-out), color var(--duration-base) var(--ease-out)',
      ...v,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: Math.round(dim * 0.42)
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
const {
  useState
} = React;
function Tag({
  children,
  selected = false,
  onClick,
  onRemove,
  style
}) {
  const [hover, setHover] = useState(false);
  const interactive = !!onClick;
  return /*#__PURE__*/React.createElement("span", {
    role: interactive ? 'button' : undefined,
    tabIndex: interactive ? 0 : undefined,
    "aria-pressed": interactive ? selected : undefined,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: 34,
      padding: onRemove ? '0 10px 0 16px' : '0 16px',
      borderRadius: 'var(--radius-pill)',
      border: '1px solid ' + (selected ? 'var(--noite-900)' : hover && interactive ? 'var(--border-strong)' : 'var(--border-default)'),
      background: selected ? 'var(--noite-900)' : 'transparent',
      color: selected ? 'var(--text-on-dark)' : 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      fontWeight: 400,
      cursor: interactive ? 'pointer' : 'default',
      userSelect: 'none',
      transition: 'all var(--duration-base) var(--ease-out)',
      ...style
    }
  }, children, onRemove && /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    "aria-label": "Remover",
    style: {
      display: 'inline-flex',
      cursor: 'pointer',
      opacity: .7
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 14
  })));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
const {
  useEffect
} = React;
function Dialog({
  open,
  onClose,
  eyebrow,
  title,
  children,
  footer,
  width = 560,
  inline = false
}) {
  useEffect(() => {
    if (!open || inline) return;
    const k = e => e.key === 'Escape' && onClose && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, inline, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: inline ? 'relative' : 'fixed',
      inset: inline ? undefined : 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'var(--surface-overlay)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: width,
      background: 'var(--surface-page)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-lg)',
      padding: '36px 40px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "Fechar",
    variant: "ghost",
    size: "sm",
    onClick: onClose,
    style: {
      position: 'absolute',
      top: 16,
      right: 16
    }
  }), (eyebrow || title) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      paddingRight: 32
    }
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: 11,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-brand)'
    }
  }, eyebrow), title && /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 300,
      fontSize: 38,
      lineHeight: 1.08,
      color: 'var(--text-primary)'
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 300,
      fontSize: 16,
      lineHeight: 1.65,
      color: 'var(--text-secondary)'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingTop: 8
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const TONES = {
  neutral: {
    icon: 'info',
    accent: 'var(--ardosia-300)'
  },
  success: {
    icon: 'circle-check',
    accent: 'var(--oliva-200)'
  },
  warning: {
    icon: 'triangle-alert',
    accent: 'var(--ocre-200)'
  },
  danger: {
    icon: 'triangle-alert',
    accent: 'var(--terracota-200)'
  }
};
function Toast({
  title,
  message,
  tone = 'neutral',
  action,
  onClose,
  style
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      width: 380,
      maxWidth: '100%',
      padding: '16px 16px 16px 18px',
      background: 'var(--surface-inverse)',
      color: 'var(--text-on-dark)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-lg)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 20,
    style: {
      color: t.accent,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, title && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      lineHeight: 1.15
    }
  }, title), message && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 300,
      fontSize: 14,
      lineHeight: 1.5,
      color: 'var(--text-on-dark-muted)'
    }
  }, message), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, action)), onClose && /*#__PURE__*/React.createElement("button", {
    "aria-label": "Fechar",
    onClick: onClose,
    style: {
      background: 'none',
      border: 0,
      padding: 2,
      cursor: 'pointer',
      color: 'var(--text-on-dark-muted)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16
  })));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  label,
  checked = false,
  onChange,
  disabled = false,
  description,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'flex-start',
      gap: 12,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .45 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      flexShrink: 0,
      width: 18,
      height: 18,
      marginTop: 2,
      borderRadius: 'var(--radius-xs)',
      border: '1px solid ' + (checked ? 'var(--vinho-800)' : 'var(--border-default)'),
      background: checked ? 'var(--vinho-800)' : 'var(--surface-card)',
      color: 'var(--linho-50)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all var(--duration-fast) var(--ease-out)'
    }
  }, checked && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 13,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--text-primary)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      fontWeight: 300,
      color: 'var(--text-secondary)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
const {
  useState
} = React;
function Input({
  label,
  hint,
  error,
  placeholder,
  value,
  defaultValue,
  onChange,
  type = 'text',
  variant = 'line',
  iconLeft,
  disabled = false,
  multiline = false,
  rows = 4,
  id,
  style
}) {
  const [focus, setFocus] = useState(false);
  const fid = id || (label ? 'in-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const line = variant === 'line';
  const borderColor = error ? 'var(--feedback-danger)' : focus ? 'var(--border-strong)' : 'var(--border-default)';
  const Field = multiline ? 'textarea' : 'input';
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      opacity: disabled ? .45 : 1,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: 11,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: multiline ? 'flex-start' : 'center',
      gap: 10,
      minHeight: 'var(--control-height-md)',
      padding: line ? '0' : '0 14px',
      background: line ? 'transparent' : 'var(--surface-card)',
      border: line ? 'none' : '1px solid ' + borderColor,
      borderBottom: '1px solid ' + borderColor,
      borderRadius: line ? 0 : 'var(--radius-xs)',
      transition: 'border-color var(--duration-base) var(--ease-out)',
      color: 'var(--text-secondary)'
    }
  }, iconLeft && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: 18,
    style: {
      marginTop: multiline ? 12 : 0
    }
  }), /*#__PURE__*/React.createElement(Field, {
    id: fid,
    type: multiline ? undefined : type,
    rows: multiline ? rows : undefined,
    placeholder: placeholder,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: 0,
      background: 'transparent',
      padding: multiline ? '12px 0' : 0,
      height: multiline ? 'auto' : 'var(--control-height-md)',
      resize: 'vertical',
      fontFamily: 'var(--font-body)',
      fontWeight: 300,
      fontSize: 16,
      color: 'var(--text-primary)'
    }
  })), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      color: error ? 'var(--feedback-danger)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
const {
  useState
} = React;
function Select({
  label,
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder,
  variant = 'line',
  disabled = false,
  hint,
  id,
  style
}) {
  const [focus, setFocus] = useState(false);
  const line = variant === 'line';
  const fid = id || (label ? 'sel-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const bc = focus ? 'var(--border-strong)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: fid,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      opacity: disabled ? .45 : 1,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
      fontSize: 11,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("select", {
    id: fid,
    value: value,
    defaultValue: value === undefined ? defaultValue ?? (placeholder ? '' : undefined) : undefined,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '100%',
      height: 'var(--control-height-md)',
      padding: line ? '0 28px 0 0' : '0 40px 0 14px',
      background: line ? 'transparent' : 'var(--surface-card)',
      border: line ? 'none' : '1px solid ' + bc,
      borderBottom: '1px solid ' + bc,
      borderRadius: line ? 0 : 'var(--radius-xs)',
      outline: 0,
      fontFamily: 'var(--font-body)',
      fontWeight: 300,
      fontSize: 16,
      color: 'var(--text-primary)',
      cursor: 'pointer'
    }
  }, placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), options.map(o => {
    const v = typeof o === 'string' ? o : o.value;
    const l = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 16,
    style: {
      position: 'absolute',
      right: line ? 2 : 14,
      pointerEvents: 'none',
      color: 'var(--text-secondary)'
    }
  })), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
const {
  useState
} = React;
function Tabs({
  items = [],
  value,
  onChange,
  variant = 'line',
  style
}) {
  const [hover, setHover] = useState(null);
  const serif = variant === 'serif';
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      gap: serif ? 32 : 28,
      borderBottom: serif ? 'none' : '1px solid var(--border-hairline)',
      flexWrap: 'wrap',
      ...style
    }
  }, items.map(it => {
    const id = typeof it === 'string' ? it : it.id;
    const lbl = typeof it === 'string' ? it : it.label;
    const active = id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      role: "tab",
      "aria-selected": active,
      onClick: () => onChange && onChange(id),
      onMouseEnter: () => setHover(id),
      onMouseLeave: () => setHover(null),
      style: {
        background: 'none',
        border: 0,
        padding: serif ? '0 0 6px' : '0 0 14px',
        marginBottom: serif ? 0 : -1,
        cursor: 'pointer',
        borderBottom: '1px solid ' + (active ? 'var(--vinho-800)' : 'transparent'),
        color: active ? 'var(--text-brand)' : hover === id ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontFamily: serif ? 'var(--font-display)' : 'var(--font-body)',
        fontStyle: serif && active ? 'italic' : 'normal',
        fontWeight: serif ? 400 : 500,
        fontSize: serif ? 30 : 12,
        letterSpacing: serif ? 0 : 'var(--tracking-label)',
        textTransform: serif ? 'none' : 'uppercase',
        transition: 'color var(--duration-base) var(--ease-out), border-color var(--duration-base) var(--ease-out)'
      }
    }, lbl);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// logo-anim/LogoReel.jsx
try { (() => {
// De.Croqui — animated imagotipos. A pencil draws each mark, then writes the name.
const MOTION = {
  enter: p => Easing.easeOutCubic(clamp(p, 0, 1)),
  draw: p => Easing.easeInOutSine(clamp(p, 0, 1)),
  pop: p => Easing.easeOutBack(clamp(p, 0, 1))
};
const W = 1920,
  H = 1080;
const THEMES = {
  linho: {
    paper: '#f7f3ed',
    ink: '#490b1a',
    ink2: '#142841',
    soft: '#798da6'
  },
  vinho: {
    paper: '#490b1a',
    ink: '#efe9df',
    ink2: '#e5ded2',
    soft: '#d9b8bc'
  },
  noite: {
    paper: '#142841',
    ink: '#efe9df',
    ink2: '#e5ded2',
    soft: '#aab8c9'
  }
};

// ---------- path sampling (deterministic, cached) ----------
const __pathCache = {};
function samplePath(d) {
  if (__pathCache[d]) return __pathCache[d];
  let svg = document.getElementById('__dc_sampler');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = '__dc_sampler';
    svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden');
    document.body.appendChild(svg);
  }
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', d);
  svg.appendChild(p);
  const L = p.getTotalLength();
  const pts = [];
  for (let i = 0; i <= 160; i++) {
    const q = p.getPointAtLength(L * i / 160);
    pts.push([q.x, q.y]);
  }
  svg.removeChild(p);
  return __pathCache[d] = {
    L,
    pts
  };
}
function pointAt(d, t) {
  const {
    pts
  } = samplePath(d);
  const f = clamp(t, 0, 1) * 160,
    i = Math.floor(f),
    k = f - i;
  const a = pts[i],
    b = pts[Math.min(i + 1, 160)];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

// ---------- leaf geometry for v7 ----------
function leaf(bx, by, dx, dy, len = 13, wid = 3.6) {
  const n = Math.hypot(dx, dy);
  dx /= n;
  dy /= n;
  const ex = bx + dx * len,
    ey = by + dy * len,
    px = -dy * wid,
    py = dx * wid,
    mx = (bx + ex) / 2,
    my = (by + ey) / 2;
  const f = v => v.toFixed(2);
  return `M${f(bx)} ${f(by)} Q${f(mx + px)} ${f(my + py)} ${f(ex)} ${f(ey)} Q${f(mx - px)} ${f(my - py)} ${f(bx)} ${f(by)}`;
}
const LEAVES = [[36, 68, -0.5, -0.87], [42, 56, 0.99, 0.12], [49, 47, -0.5, -0.87], [55, 39, 0.99, 0.12], [62, 31, -0.5, -0.87]].map(([x, y, dx, dy]) => leaf(x, y, dx, dy));

// ---------- concepts ----------
// strokes: {d, w, op, fill?}  dots: {cx, cy, r}  (iso coords 0..100)
const CONCEPTS = [{
  id: 'v4',
  scene: 'V4 Croqui',
  label: 'v4 · Traço de croqui',
  italic: true,
  underline: true,
  tagline: 'Estúdio de interiores',
  hero: true,
  strokes: [{
    d: 'M66 27 C52 20 31 28 30 50 C29 73 53 80 66 72',
    w: 1,
    op: 0.55,
    dur: 0.9
  }, {
    d: 'M70 30 C55 17 27 23 25 50 C23 77 52 85 70 70',
    w: 3.4,
    op: 1,
    dur: 1.35
  }],
  dots: [{
    cx: 77,
    cy: 66,
    r: 4.6
  }]
}, {
  id: 'v1',
  scene: 'V1 Arco',
  label: 'v1 · Arco & ponto',
  tagline: 'Interiores',
  strokes: [{
    d: 'M30 82 V46 A20 20 0 0 1 70 46 V82',
    w: 3.2,
    op: 1,
    dur: 1.3
  }],
  dots: [{
    cx: 50,
    cy: 76,
    r: 5
  }]
}, {
  id: 'v3',
  scene: 'V3 Janela',
  label: 'v3 · Janela',
  tagline: 'Interiores',
  strokes: [{
    d: 'M30 80 V44 A20 20 0 0 1 70 44 V80 Z',
    w: 3,
    op: 1,
    dur: 1.1
  }, {
    d: 'M50 24 V80',
    w: 1.6,
    op: 1,
    dur: 0.35
  }, {
    d: 'M30 56 H70',
    w: 1.6,
    op: 1,
    dur: 0.3
  }, {
    d: 'M24 86 H76',
    w: 3,
    op: 1,
    dur: 0.35
  }],
  dots: []
}, {
  id: 'v7',
  scene: 'V7 Oliveira',
  label: 'v7 · Ramo de oliveira',
  tagline: 'Interiores',
  strokes: [{
    d: 'M30 84 C38 64 50 44 68 24',
    w: 2.4,
    op: 1,
    dur: 0.8
  }, ...LEAVES.map(d => ({
    d,
    w: 1.4,
    op: 1,
    dur: 0.28,
    fill: true
  }))],
  dots: [{
    cx: 70,
    cy: 21,
    r: 3.6
  }]
}, {
  id: 'v8',
  scene: 'V8 Selo',
  label: 'v8 · Selo',
  tagline: 'Ateliê de interiores',
  ring: true,
  strokes: [{
    d: 'M50 3 A47 47 0 1 1 49.99 3',
    w: 1.4,
    op: 1,
    dur: 1.0
  }, {
    d: 'M50 20 A30 30 0 1 1 49.99 20',
    w: 0.8,
    op: 1,
    dur: 0.7
  }, {
    d: 'M40 66 V48 A10 10 0 0 1 60 48 V66 Z',
    w: 1.4,
    op: 1,
    dur: 0.6,
    fill: true
  }],
  dots: []
}, {
  id: 'v9',
  scene: 'V9 Arcada',
  label: 'v9 · Arcada',
  tagline: 'Interiores',
  stacked: true,
  strokes: [{
    d: 'M14 80 V54 A10 10 0 0 1 34 54 V80',
    w: 2.6,
    op: 1,
    dur: 0.5
  }, {
    d: 'M38 80 V40 A12 12 0 0 1 62 40 V80 Z',
    w: 2.6,
    op: 1,
    dur: 0.7,
    fill: true
  }, {
    d: 'M66 80 V54 A10 10 0 0 1 86 54 V80',
    w: 2.6,
    op: 1,
    dur: 0.5
  }, {
    d: 'M10 86 H90',
    w: 2.6,
    op: 1,
    dur: 0.4
  }],
  dots: []
}];

// ---------- layout ----------
const WORD_W = 640; // approximate width of "De.Croqui" at 150px Cormorant (measured at runtime)
function layoutFor(c, wordW) {
  if (c.stacked) {
    const S = 260;
    return {
      ix: W / 2 - S / 2,
      iy: 250,
      S,
      wx: W / 2 - wordW / 2,
      wy: 700,
      fs: 150,
      tx: W / 2,
      ty: 790,
      tAnchor: 'middle'
    };
  }
  const S = c.ring ? 330 : 300,
    gap = 70,
    total = S + gap + wordW,
    x0 = W / 2 - total / 2;
  return {
    ix: x0,
    iy: H / 2 - S / 2 - 10,
    S,
    wx: x0 + S + gap,
    wy: H / 2 + 40,
    fs: 150,
    tx: x0 + S + gap + 6,
    ty: H / 2 + 128,
    tAnchor: 'start'
  };
}
const toStage = (lay, [x, y]) => [lay.ix + x * lay.S / 100, lay.iy + y * lay.S / 100];

// ---------- per-concept timeline plan ----------
function buildPlan(c, lay, start, dur) {
  const segs = [];
  let t = start + (c.hero ? 0.7 : 0.55);
  const OFF = [W + 260, H + 220];
  let pos = OFF;
  segs.push({
    kind: 'move',
    from: OFF,
    to: toStage(lay, pointAt(c.strokes[0].d, 0)),
    t0: start,
    t1: t
  });
  c.strokes.forEach((s, i) => {
    const p0 = toStage(lay, pointAt(s.d, 0));
    if (i > 0) {
      const lift = 0.16;
      segs.push({
        kind: 'move',
        from: pos,
        to: p0,
        t0: t,
        t1: t + lift
      });
      t += lift;
    }
    segs.push({
      kind: 'draw',
      stroke: i,
      t0: t,
      t1: t + s.dur
    });
    t += s.dur;
    pos = toStage(lay, pointAt(s.d, 1));
  });
  c.dots.forEach((d, i) => {
    const p = toStage(lay, [d.cx, d.cy]);
    segs.push({
      kind: 'move',
      from: pos,
      to: p,
      t0: t,
      t1: t + 0.25
    });
    t += 0.25;
    segs.push({
      kind: 'tap',
      dot: i,
      at: p,
      t0: t,
      t1: t + 0.22
    });
    t += 0.22;
    pos = p;
  });
  const wStart = [lay.wx, lay.wy - lay.fs * 0.35];
  segs.push({
    kind: 'move',
    from: pos,
    to: wStart,
    t0: t,
    t1: t + 0.3
  });
  t += 0.3;
  const wd = c.hero ? 1.5 : 1.15;
  segs.push({
    kind: 'write',
    t0: t,
    t1: t + wd
  });
  t += wd;
  pos = [lay.wx + lay.wordW, lay.wy - lay.fs * 0.35];
  if (c.underline) {
    const ul = underlinePath(lay);
    const u0 = pointAt(ul, 0);
    segs.push({
      kind: 'move',
      from: pos,
      to: u0,
      t0: t,
      t1: t + 0.25
    });
    t += 0.25;
    segs.push({
      kind: 'under',
      t0: t,
      t1: t + 0.5
    });
    t += 0.5;
    pos = pointAt(ul, 1);
  }
  segs.push({
    kind: 'move',
    from: pos,
    to: OFF,
    t0: t,
    t1: t + 0.6,
    exit: true
  });
  const tagAt = t - 0.1;
  return {
    segs,
    tagAt,
    fadeAt: start + dur - 0.55,
    end: start + dur
  };
}
function underlinePath(lay) {
  const x = lay.wx,
    y = lay.wy + 34,
    w = lay.wordW;
  return `M${x + 4} ${y} C${x + w * 0.3} ${y - 12} ${x + w * 0.6} ${y + 9} ${x + w - 6} ${y - 6}`;
}
function segP(s, T) {
  return clamp((T - s.t0) / (s.t1 - s.t0), 0, 1);
}

// pencil state for a plan at T → {x, y, lift, ang}
function pencilFrom(plan, c, lay, T) {
  const segs = plan.segs;
  if (T < segs[0].t0) return null;
  let s = segs.find(g => T >= g.t0 && T < g.t1) || segs[segs.length - 1];
  const p = segP(s, T);
  if (s.kind === 'move') {
    const e = s.exit ? MOTION.draw(p) : s.t0 === segs[0].t0 ? MOTION.enter(p) : MOTION.draw(p);
    const x = s.from[0] + (s.to[0] - s.from[0]) * e,
      y = s.from[1] + (s.to[1] - s.from[1]) * e;
    const lift = Math.sin(Math.PI * e) * (s.exit || s.t0 === segs[0].t0 ? 1 : 0.6) + (s.exit ? e : 0);
    return {
      x,
      y,
      lift: Math.min(1, lift)
    };
  }
  if (s.kind === 'draw') {
    const [x, y] = toStage(lay, pointAt(c.strokes[s.stroke].d, MOTION.draw(p)));
    return {
      x,
      y,
      lift: 0
    };
  }
  if (s.kind === 'tap') {
    const k = Math.sin(Math.PI * p);
    return {
      x: s.at[0],
      y: s.at[1] - k * 16,
      lift: k * 0.4
    };
  }
  if (s.kind === 'write') {
    const e = MOTION.draw(p);
    const x = lay.wx + lay.wordW * e;
    const y = lay.wy - lay.fs * 0.32 + Math.sin(e * Math.PI * 18) * lay.fs * 0.22;
    return {
      x,
      y,
      lift: 0.05
    };
  }
  if (s.kind === 'under') {
    const [x, y] = pointAt(underlinePath(lay), MOTION.draw(p));
    return {
      x,
      y,
      lift: 0
    };
  }
  return null;
}

// ---------- visual pieces ----------
function Pencil({
  x,
  y,
  lift
}) {
  const ang = -38 - lift * 4,
    sc = 1 + lift * 0.06;
  const sx = 8 + lift * 26,
    sy = 6 + lift * 20;
  const body = (fillBody, fillLight, fillDark, wood, lead, metal, eraser) => /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("polygon", {
    points: "0,0 15,-5 15,5",
    fill: lead
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "15,-5 62,-17 62,17 15,5",
    fill: wood
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15 -5 L28 -8.5 L28 8.5 L15 5 Z",
    fill: lead,
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "62",
    y: "-17",
    width: "340",
    height: "34",
    fill: fillBody
  }), /*#__PURE__*/React.createElement("rect", {
    x: "62",
    y: "-17",
    width: "340",
    height: "11",
    fill: fillLight
  }), /*#__PURE__*/React.createElement("rect", {
    x: "62",
    y: "6",
    width: "340",
    height: "11",
    fill: fillDark
  }), /*#__PURE__*/React.createElement("rect", {
    x: "402",
    y: "-18",
    width: "40",
    height: "36",
    fill: metal
  }), /*#__PURE__*/React.createElement("path", {
    d: "M410 -18 V18 M418 -18 V18 M434 -18 V18",
    stroke: "rgba(20,40,65,.35)",
    strokeWidth: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "442",
    y: "-16",
    width: "30",
    height: "32",
    rx: "8",
    fill: eraser
  }), /*#__PURE__*/React.createElement("text", {
    x: "120",
    y: "5",
    fontFamily: "Jost",
    fontWeight: "500",
    fontSize: "11",
    letterSpacing: "3",
    fill: "rgba(231,201,160,.85)"
  }, "DE.CROQUI \xB7 N\xBA2"));
  return /*#__PURE__*/React.createElement("g", {
    transform: `translate(${x} ${y}) rotate(${ang}) scale(${sc})`
  }, /*#__PURE__*/React.createElement("g", {
    transform: `rotate(${-ang}) translate(${sx} ${sy}) rotate(${ang})`,
    opacity: 0.16 - lift * 0.06,
    filter: "url(#pencilBlur)"
  }, /*#__PURE__*/React.createElement("polygon", {
    points: "0,0 15,-5 62,-17 472,-17 472,17 62,17 15,5",
    fill: "#142841"
  })), body('#490b1a', '#621a2b', '#2e0610', '#e8cfa6', '#2b2b2e', '#a88a5a', '#d9b8bc'));
}
function ConceptMark({
  c,
  plan,
  lay,
  theme,
  T
}) {
  const fade = 1 - MOTION.draw((T - plan.fadeAt) / (plan.end - plan.fadeAt));
  if (T < plan.segs[0].t0 - 0.01 || T > plan.end + 0.01) return null;
  const drift = 1 + 0.035 * clamp((T - plan.segs[0].t0) / (plan.end - plan.segs[0].t0), 0, 1);
  const draws = plan.segs.filter(s => s.kind === 'draw');
  const taps = plan.segs.filter(s => s.kind === 'tap');
  const write = plan.segs.find(s => s.kind === 'write');
  const under = plan.segs.find(s => s.kind === 'under');
  const wp = MOTION.draw(segP(write, T));
  const tagP = MOTION.enter((T - plan.tagAt) / 0.7);
  const k = lay.S / 100;
  return /*#__PURE__*/React.createElement("g", {
    opacity: fade,
    transform: `translate(${W / 2} ${H / 2}) scale(${drift}) translate(${-W / 2} ${-H / 2})`
  }, /*#__PURE__*/React.createElement("g", {
    transform: `translate(${lay.ix} ${lay.iy}) scale(${k})`
  }, c.strokes.map((s, i) => {
    const p = MOTION.draw(segP(draws[i], T));
    const fp = s.fill ? MOTION.enter((T - draws[i].t1) / 0.35) : 0;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, s.fill && /*#__PURE__*/React.createElement("path", {
      d: s.d,
      fill: theme.ink,
      opacity: fp
    }), /*#__PURE__*/React.createElement("path", {
      d: s.d,
      fill: "none",
      stroke: theme.ink,
      strokeWidth: s.w,
      strokeOpacity: p > 0.001 ? s.op : 0,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      pathLength: "1",
      strokeDasharray: "1 1",
      strokeDashoffset: 1 - p
    }));
  }), c.dots.map((d, i) => {
    const p = MOTION.pop((T - taps[i].t0 - 0.08) / 0.3);
    return /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: d.cx,
      cy: d.cy,
      r: d.r * Math.max(0, p),
      fill: theme.ink
    });
  }), c.ring && (() => {
    const rp = MOTION.enter((T - draws[1].t1) / 0.9);
    return /*#__PURE__*/React.createElement("g", {
      opacity: rp,
      transform: `rotate(${(1 - rp) * -50} 50 50)`
    }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("path", {
      id: 'ring-' + c.id,
      d: "M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0"
    })), /*#__PURE__*/React.createElement("text", {
      fontFamily: "Jost",
      fontWeight: "500",
      fontSize: "7.4",
      letterSpacing: "2.6",
      fill: theme.ink
    }, /*#__PURE__*/React.createElement("textPath", {
      href: '#ring-' + c.id,
      textLength: "236",
      lengthAdjust: "spacing"
    }, "DE.CROQUI \xB7 INTERIORES \xB7 ATELI\xCA \xB7")));
  })()), /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("clipPath", {
    id: 'wclip-' + c.id
  }, /*#__PURE__*/React.createElement("rect", {
    x: lay.wx - 20,
    y: lay.wy - lay.fs * 1.1,
    width: (lay.wordW + 40) * wp,
    height: lay.fs * 1.5
  }))), /*#__PURE__*/React.createElement("text", {
    x: lay.wx,
    y: lay.wy,
    clipPath: `url(#wclip-${c.id})`,
    fontFamily: "Cormorant Garamond",
    fontStyle: c.italic ? 'italic' : 'normal',
    fontWeight: "400",
    fontSize: lay.fs,
    fill: c.hero ? theme.ink : theme.ink2,
    letterSpacing: "1.5"
  }, "De.Croqui"), under && segP(under, T) > 0.001 && /*#__PURE__*/React.createElement("path", {
    d: underlinePath(lay),
    fill: "none",
    stroke: theme.ink,
    strokeWidth: "2",
    strokeLinecap: "round",
    opacity: "0.6",
    pathLength: "1",
    strokeDasharray: "1 1",
    strokeDashoffset: 1 - MOTION.draw(segP(under, T))
  }), /*#__PURE__*/React.createElement("text", {
    x: lay.tx,
    y: lay.ty + (1 - tagP) * 14,
    opacity: tagP,
    textAnchor: lay.tAnchor,
    fontFamily: "Jost",
    fontWeight: "400",
    fontSize: "22",
    letterSpacing: "7",
    fill: theme.soft
  }, c.tagline.toUpperCase()));
}
function LogoReel({
  themeKey = 'linho',
  showPencil = true,
  showLabels = true
}) {
  const {
    T,
    CUES
  } = useComposition();
  const theme = THEMES[themeKey] || THEMES.linho;
  const [wordW, setWordW] = React.useState({
    it: WORD_W,
    up: WORD_W + 40
  });
  const measure = React.useRef(null),
    measureUp = React.useRef(null);
  React.useLayoutEffect(() => {
    const m = () => {
      if (measure.current && measureUp.current) {
        const a = measure.current.getComputedTextLength(),
          b = measureUp.current.getComputedTextLength();
        if (a > 100 && b > 100) setWordW({
          it: a,
          up: b
        });
      }
    };
    m();
    document.fonts && document.fonts.ready.then(m);
  }, []);
  const scenes = JSON.parse(window.OM_SCENES);
  const plans = CONCEPTS.map(c => {
    const i = scenes.findIndex(s => s.name === c.scene);
    if (i < 0) return null;
    const start = CUES[c.scene];
    const next = scenes[i + 1];
    const end = next ? CUES[next.name] : scenes.reduce((a, s) => a + (s.nat || s.dur), 0);
    const ww = c.italic ? wordW.it : wordW.up;
    const lay = {
      ...layoutFor(c, ww),
      wordW: ww
    };
    return {
      c,
      lay,
      plan: buildPlan(c, lay, start, end - start)
    };
  }).filter(Boolean);
  const active = plans.find(p => T >= p.plan.segs[0].t0 && T < p.plan.end);
  const pen = active && pencilFrom(active.plan, active.c, active.lay, T);
  const labelOp = active ? MOTION.enter((T - active.plan.segs[0].t0) / 0.6) * (1 - MOTION.draw((T - active.plan.fadeAt) / 0.5)) : 0;
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": 't=' + Math.floor(T) + 's',
    style: {
      position: 'absolute',
      inset: 0,
      background: theme.paper,
      backgroundImage: themeKey === 'linho' ? "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.08 0 0 0 0 0.1 0 0 0 0 0.16 0 0 0 .06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" : 'none'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: W,
    height: H,
    viewBox: `0 0 ${W} ${H}`,
    style: {
      position: 'absolute',
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("filter", {
    id: "pencilBlur",
    x: "-20%",
    y: "-50%",
    width: "140%",
    height: "200%"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    stdDeviation: "7"
  }))), /*#__PURE__*/React.createElement("text", {
    ref: measure,
    x: "-9999",
    y: "-9999",
    fontFamily: "Cormorant Garamond",
    fontStyle: "italic",
    fontSize: "150",
    letterSpacing: "1.5"
  }, "De.Croqui"), /*#__PURE__*/React.createElement("text", {
    ref: measureUp,
    x: "-9999",
    y: "-9999",
    fontFamily: "Cormorant Garamond",
    fontSize: "150",
    letterSpacing: "1.5"
  }, "De.Croqui"), plans.map(p => /*#__PURE__*/React.createElement(ConceptMark, {
    key: p.c.id,
    c: p.c,
    plan: p.plan,
    lay: p.lay,
    theme: theme,
    T: T
  })), showPencil && pen && /*#__PURE__*/React.createElement(Pencil, {
    x: pen.x,
    y: pen.y,
    lift: pen.lift
  })), showLabels && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 72,
      bottom: 60,
      opacity: labelOp,
      font: '500 18px/1 Jost, sans-serif',
      letterSpacing: '.22em',
      textTransform: 'uppercase',
      color: theme.soft
    }
  }, active ? active.c.label : ''));
}
Object.assign(window, {
  LogoReel,
  CONCEPTS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "logo-anim/LogoReel.jsx", error: String((e && e.message) || e) }); }

// logo-anim/PlantaReel.jsx
try { (() => {
// De.Croqui — v22 "Planta baixa" animated end card.
// Drafting grid → guides → walls → the door opens (the home welcomes you) → camera pulls back → name enters through the doorway.
const MOTION = {
  enter: p => Easing.easeOutCubic(clamp(p, 0, 1)),
  draw: p => Easing.easeInOutCubic(clamp(p, 0, 1)),
  swing: p => Easing.easeOutBack(clamp(p, 0, 1))
};
let PW = 1920,
  PH = 1080; // set per render by PlantaReel (horizontal 1920×1080 or vertical 1080×1920)
const PTHEMES = {
  linho: {
    paper: '#f7f3ed',
    wall: '#142841',
    door: '#490b1a',
    ink: '#490b1a',
    soft: '#4f627b',
    grid: 'rgba(20,40,65,.07)',
    guide: 'rgba(73,11,26,.35)'
  },
  vinho: {
    paper: '#490b1a',
    wall: '#efe9df',
    door: '#d9b8bc',
    ink: '#efe9df',
    soft: '#d9b8bc',
    grid: 'rgba(239,233,223,.07)',
    guide: 'rgba(239,233,223,.35)'
  },
  noite: {
    paper: '#142841',
    wall: '#efe9df',
    door: '#d9b8bc',
    ink: '#efe9df',
    soft: '#aab8c9',
    grid: 'rgba(239,233,223,.06)',
    guide: 'rgba(217,184,188,.4)'
  }
};
const seg = (T, a, b) => clamp((T - a) / (b - a), 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
function DraftGrid({
  T,
  C,
  th
}) {
  const p = MOTION.enter(seg(T, C.Grid, C.Grid + 0.9));
  const out = 1 - MOTION.draw(seg(T, C.Name + 0.2, C.Name + 1.2));
  const lines = [];
  for (let x = 0; x <= PW; x += 48) lines.push(/*#__PURE__*/React.createElement("line", {
    key: 'x' + x,
    x1: x,
    y1: 0,
    x2: x,
    y2: PH
  }));
  for (let y = 12; y <= PH; y += 48) lines.push(/*#__PURE__*/React.createElement("line", {
    key: 'y' + y,
    x1: 0,
    y1: y,
    x2: PW,
    y2: y
  }));
  return /*#__PURE__*/React.createElement("g", {
    stroke: th.grid,
    strokeWidth: "1",
    opacity: p * out
  }, lines);
}
function Plan({
  T,
  C,
  th
}) {
  // camera: big & centred while drafting → lockup position for the name
  const cam = MOTION.draw(seg(T, C.Name, C.Name + 1.3));
  const lock = window.__v22Lock || {
    ix: 520,
    iy: PH / 2 - 151,
    S1: 290
  };
  const S0 = PW < PH ? 760 : 600,
    S1 = lock.S1;
  const S = lerp(S0, S1, cam);
  const x = lerp(PW / 2 - S0 / 2, lock.ix, cam),
    y = lerp(PH / 2 - S0 / 2 + 10, lock.iy, cam);
  const k = S / 100;
  const wallP = MOTION.draw(seg(T, C.Walls + 0.1, C.Walls + 1.35));
  const stubP = MOTION.draw(seg(T, C.Walls + 1.2, C.Walls + 1.55));
  const leafIn = MOTION.enter(seg(T, C.Walls + 1.4, C.Walls + 1.75));
  const swing = MOTION.swing(seg(T, C.Door + 0.15, C.Door + 1.25));
  const arcP = clamp(swing, 0, 1);
  const ang = -90 * swing;
  const guides = MOTION.draw(seg(T, C.Grid + 0.5, C.Grid + 1.3)) * (1 - MOTION.draw(seg(T, C.Door + 1.1, C.Door + 1.7)));
  const dims = MOTION.enter(seg(T, C.Walls + 1.1, C.Walls + 1.7)) * (1 - MOTION.draw(seg(T, C.Name - 0.3, C.Name + 0.3)));
  const hint = MOTION.enter(seg(T, C.Door + 0.9, C.Door + 1.3)) * (1 - MOTION.draw(seg(T, C.Name - 0.2, C.Name + 0.4)));
  const sw = 4.4;
  // guides span the whole frame along the wall axes (in iso units relative to group)
  const gx0 = -x / k,
    gx1 = (PW - x) / k,
    gy0 = -y / k,
    gy1 = (PH - y) / k;
  const gl = (x1, y1, x2, y2, key) => /*#__PURE__*/React.createElement("line", {
    key: key,
    x1: x1,
    y1: y1,
    x2: x2,
    y2: y2,
    pathLength: "1",
    strokeDasharray: "1 1",
    strokeDashoffset: 1 - guides
  });
  return /*#__PURE__*/React.createElement("g", {
    transform: `translate(${x} ${y}) scale(${k})`
  }, /*#__PURE__*/React.createElement("g", {
    stroke: th.guide,
    strokeWidth: 1 / k,
    opacity: guides > 0.001 ? 1 : 0
  }, gl(18, 18, 18, gy0, 'a'), gl(18, 82, 18, gy1, 'b'), gl(18, 18, gx0, 18, 'c'), gl(82, 18, gx1, 18, 'd'), gl(82, 18, 82, gy0, 'e'), gl(18, 82, gx0, 82, 'f'), gl(82, 82, gx1, 82, 'g'), gl(82, 82, 82, gy1, 'h'), gl(40, 82, 40, gy1, 'i'), gl(74, 82, 74, gy1, 'j')), [[18, 18], [82, 18], [18, 82], [82, 82]].map(([cx, cy], i) => {
    const m = MOTION.swing(seg(T, C.Grid + 0.7 + i * 0.08, C.Grid + 1.1 + i * 0.08)) * (1 - MOTION.draw(seg(T, C.Door + 1.1, C.Door + 1.6)));
    return /*#__PURE__*/React.createElement("g", {
      key: i,
      transform: `translate(${cx} ${cy}) scale(${Math.max(0, m)})`,
      stroke: th.ink,
      strokeWidth: 1.4 / k
    }, /*#__PURE__*/React.createElement("line", {
      x1: "-3",
      y1: "0",
      x2: "3",
      y2: "0"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "0",
      y1: "-3",
      x2: "0",
      y2: "3"
    }));
  }), /*#__PURE__*/React.createElement("g", {
    opacity: dims,
    fill: th.soft,
    stroke: th.soft,
    strokeWidth: 1 / k,
    fontFamily: "Jost",
    fontSize: 19 / k,
    letterSpacing: 2 / k
  }, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "9",
    x2: "82",
    y2: "9"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6.5",
    x2: "18",
    y2: "11.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "82",
    y1: "6.5",
    x2: "82",
    y2: "11.5"
  }), /*#__PURE__*/React.createElement("text", {
    x: "50",
    y: "5",
    textAnchor: "middle",
    stroke: "none"
  }, "6,40"), /*#__PURE__*/React.createElement("line", {
    x1: "9",
    y1: "18",
    x2: "9",
    y2: "82"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6.5",
    y1: "18",
    x2: "11.5",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6.5",
    y1: "82",
    x2: "11.5",
    y2: "82"
  }), /*#__PURE__*/React.createElement("text", {
    x: "5",
    y: "50",
    textAnchor: "middle",
    stroke: "none",
    transform: "rotate(-90 5 50)"
  }, "6,40"), /*#__PURE__*/React.createElement("text", {
    x: "57",
    y: "93",
    textAnchor: "middle",
    stroke: "none"
  }, "porta 0,90")), /*#__PURE__*/React.createElement("path", {
    d: "M40 82 H18 V18 H82 V36",
    fill: "none",
    stroke: th.wall,
    strokeWidth: sw,
    strokeLinecap: "square",
    strokeLinejoin: "miter",
    pathLength: "1",
    strokeDasharray: "1 1",
    strokeDashoffset: 1 - wallP,
    opacity: wallP > 0.001 ? 1 : 0
  }), /*#__PURE__*/React.createElement("path", {
    d: "M74 82 H82",
    fill: "none",
    stroke: th.wall,
    strokeWidth: sw,
    strokeLinecap: "square",
    pathLength: "1",
    strokeDasharray: "1 1",
    strokeDashoffset: 1 - stubP,
    opacity: stubP > 0.001 ? 1 : 0
  }), /*#__PURE__*/React.createElement("path", {
    d: "M74 82 A34 34 0 0 0 40 48",
    fill: "none",
    stroke: th.door,
    strokeWidth: 1,
    strokeLinecap: "round",
    opacity: arcP > 0.001 ? 0.75 : 0,
    pathLength: "1",
    strokeDasharray: "1 1",
    strokeDashoffset: 1 - arcP
  }), /*#__PURE__*/React.createElement("g", {
    transform: `rotate(${ang} 40 82)`,
    opacity: leafIn
  }, /*#__PURE__*/React.createElement("line", {
    x1: "40",
    y1: "82",
    x2: 40 + 34 * leafIn,
    y2: "82",
    stroke: th.door,
    strokeWidth: "1.6",
    strokeLinecap: "round"
  })), /*#__PURE__*/React.createElement("circle", {
    cx: "40",
    cy: "82",
    r: 1.6 * leafIn,
    fill: th.door
  }), /*#__PURE__*/React.createElement("g", {
    opacity: hint,
    fontFamily: "Cormorant Garamond",
    fontStyle: "italic",
    fontSize: 34 / k,
    fill: th.ink
  }, /*#__PURE__*/React.createElement("text", {
    x: "44",
    y: "76",
    textAnchor: "start"
  }, "entre.")));
}
function NameBlock({
  T,
  C,
  th
}) {
  const lock = window.__v22Lock;
  if (!lock) return null;
  const s = lock.s || 1;
  const p = MOTION.enter(seg(T, C.Name + 0.75, C.Name + 1.75));
  const tp = MOTION.enter(seg(T, C.Name + 1.4, C.Name + 2.3));
  const ulIn = MOTION.draw(seg(T, C.Name + 1.2, C.Name + 1.9));
  const ulOut = MOTION.draw(seg(T, C.Name + 2.0, C.Name + 2.7));
  return /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("clipPath", {
    id: "v22clip"
  }, /*#__PURE__*/React.createElement("rect", {
    x: lock.wx - 6,
    y: lock.wy - 170 * s,
    width: lock.ww + 60,
    height: 240 * s
  }))), /*#__PURE__*/React.createElement("g", {
    clipPath: "url(#v22clip)"
  }, /*#__PURE__*/React.createElement("text", {
    x: lock.wx + (1 - p) * -lock.ww * 0.35,
    y: lock.wy,
    opacity: p,
    fontFamily: "Cormorant Garamond",
    fontWeight: "400",
    fontSize: 150 * s,
    letterSpacing: 1.5 * s,
    fill: th.ink
  }, "De.Croqui")), ulIn > 0.001 && ulOut < 0.999 && /*#__PURE__*/React.createElement("line", {
    x1: lock.wx + 4 + (lock.ww - 8) * ulOut,
    y1: lock.wy + 30 * s,
    x2: lock.wx + 4 + (lock.ww - 8) * ulIn,
    y2: lock.wy + 30 * s,
    stroke: th.wall,
    strokeOpacity: ".35",
    strokeWidth: "1.5"
  }), /*#__PURE__*/React.createElement("text", {
    x: lock.tx,
    textAnchor: lock.tAnchor,
    y: lock.wy + 78 * s + (1 - tp) * 12,
    opacity: tp,
    fontFamily: "Jost",
    fontWeight: "400",
    fontSize: 22 * s,
    letterSpacing: (7 + (1 - tp) * 10) * s,
    fill: th.soft
  }, "DESIGN DE INTERIORES"));
}
function PlantaReel({
  themeKey = 'linho',
  vertical = false
}) {
  if (vertical) {
    PW = 1080;
    PH = 1920;
  } else {
    PW = 1920;
    PH = 1080;
  }
  const {
    T,
    CUES,
    authoredTotal
  } = useComposition();
  const th = PTHEMES[themeKey] || PTHEMES.linho;
  const C = CUES;
  const mref = React.useRef(null);
  const [, force] = React.useState(0);
  React.useLayoutEffect(() => {
    const m = () => {
      if (!mref.current) return;
      const ww = mref.current.getComputedTextLength();
      if (ww < 100) return;
      if (vertical) {
        const S1 = 440,
          s = 1.4,
          w2 = ww * s;
        window.__v22Lock = {
          S1,
          s,
          ix: PW / 2 - S1 / 2,
          iy: PH / 2 - S1 - 40,
          wx: PW / 2 - w2 / 2,
          wy: PH / 2 + 230,
          ww: w2,
          tx: PW / 2,
          tAnchor: 'middle'
        };
      } else {
        const S1 = 290,
          gap = 64,
          total = S1 + gap + ww,
          ix = PW / 2 - total / 2;
        window.__v22Lock = {
          S1,
          ix,
          iy: PH / 2 - S1 / 2 - 6,
          wx: ix + S1 + gap,
          wy: PH / 2 + 82,
          ww,
          tx: ix + S1 + gap + 6,
          tAnchor: 'start'
        };
      }
      force(n => n + 1);
    };
    m();
    document.fonts && document.fonts.ready.then(m);
  }, []);
  const drift = 1 + 0.025 * seg(T, C.Name + 1.3, authoredTotal);
  const fadeAll = 1 - MOTION.draw(seg(T, authoredTotal - 0.6, authoredTotal));
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": 't=' + Math.floor(T) + 's',
    style: {
      position: 'absolute',
      inset: 0,
      background: th.paper
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: PW,
    height: PH,
    viewBox: `0 0 ${PW} ${PH}`,
    style: {
      position: 'absolute',
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("text", {
    ref: mref,
    x: "-9999",
    y: "-9999",
    fontFamily: "Cormorant Garamond",
    fontSize: "150",
    letterSpacing: "1.5"
  }, "De.Croqui"), /*#__PURE__*/React.createElement("g", {
    opacity: fadeAll,
    transform: `translate(${PW / 2} ${PH / 2}) scale(${drift}) translate(${-PW / 2} ${-PH / 2})`
  }, /*#__PURE__*/React.createElement(DraftGrid, {
    T: T,
    C: C,
    th: th
  }), /*#__PURE__*/React.createElement(Plan, {
    T: T,
    C: C,
    th: th
  }), /*#__PURE__*/React.createElement(NameBlock, {
    T: T,
    C: C,
    th: th
  }))));
}
Object.assign(window, {
  PlantaReel
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "logo-anim/PlantaReel.jsx", error: String((e && e.message) || e) }); }

// logo-anim/PlantaSound.jsx
try { (() => {
// De.Croqui — v22 sound design. Synthesised with Web Audio (no audio files), keyed to the composition cues
// so retiming scenes in the timeline keeps sound in sync. Same score renders offline to a .wav.
function v22Rng(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const v22Cache = new WeakMap();
function v22Assets(c) {
  let a = v22Cache.get(c);
  if (a) return a;
  const sr = c.sampleRate,
    r = v22Rng(7);
  const noise = c.createBuffer(1, sr * 2, sr);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
  const len = Math.floor(sr * 2.4),
    ir = c.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const x = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) x[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  a = {
    noise,
    ir
  };
  v22Cache.set(c, a);
  return a;
}
function v22Score(c, dest, t0, from, C, total, opts = {}) {
  const A = v22Assets(c);
  const master = c.createGain();
  master.gain.value = 0.9;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 3;
  master.connect(comp);
  comp.connect(dest);
  const verb = c.createConvolver();
  verb.buffer = A.ir;
  const wet = c.createGain();
  wet.gain.value = 0.32;
  verb.connect(wet);
  wet.connect(master);
  const dry = c.createGain();
  dry.connect(master);
  dry.connect(verb);
  const at = s => t0 + s,
    live = s => s >= from - 0.02;
  const env = (g, t, a, peak, d) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  };
  const noiseSrc = (t, dur) => {
    const s = c.createBufferSource();
    s.buffer = A.noise;
    s.loop = true;
    s.start(t, Math.abs(t) * 0.37 % 1.5);
    s.stop(t + dur + 0.1);
    return s;
  };
  // airy sweep — guides, door, camera
  const swish = (s, dur, f0, f1, peak) => {
    if (!live(s)) return;
    const t = at(s);
    const n = noiseSrc(t, dur);
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 0.9;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    env(g, t, dur * 0.35, peak, dur * 0.65);
    n.connect(f);
    f.connect(g);
    g.connect(dry);
  };
  // pencil tap — corner marks, dimension ticks
  const tap = (s, peak) => {
    if (!live(s)) return;
    const t = at(s);
    const n = noiseSrc(t, 0.06);
    const f = c.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 2200;
    const g = c.createGain();
    env(g, t, 0.003, peak, 0.045);
    n.connect(f);
    f.connect(g);
    g.connect(dry);
    const o = c.createOscillator();
    o.frequency.setValueAtTime(1800, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.03);
    const og = c.createGain();
    env(og, t, 0.002, peak * 0.4, 0.035);
    o.connect(og);
    og.connect(dry);
    o.start(t);
    o.stop(t + 0.1);
  };
  // graphite on paper — walls drawn
  const scratch = (s, dur, peak, seed) => {
    if (!live(s)) return;
    const t = at(s),
      r = v22Rng(seed);
    const n = noiseSrc(t, dur);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3200;
    bp.Q.value = 2.2;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    for (let k = 0; k * 0.035 < dur; k++) {
      g.gain.setTargetAtTime(peak * (0.45 + 0.55 * r()), t + k * 0.035, 0.012);
      bp.frequency.setTargetAtTime(2600 + 1400 * r(), t + k * 0.035, 0.02);
    }
    g.gain.setTargetAtTime(0.0001, t + dur, 0.03);
    n.connect(bp);
    bp.connect(hp);
    hp.connect(g);
    g.connect(dry);
  };
  // soft wooden stop — door leaf
  const thump = (s, peak) => {
    if (!live(s)) return;
    const t = at(s);
    const o = c.createOscillator();
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.18);
    const g = c.createGain();
    env(g, t, 0.005, peak, 0.25);
    o.connect(g);
    g.connect(dry);
    o.start(t);
    o.stop(t + 0.4);
    const n = noiseSrc(t, 0.08);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    const ng = c.createGain();
    env(ng, t, 0.003, peak * 0.5, 0.07);
    n.connect(lp);
    lp.connect(ng);
    ng.connect(dry);
  };
  // warm bell — "entre.", name, tagline
  const bell = (s, freq, peak, dur) => {
    if (!live(s)) return;
    const t = at(s);
    [[1, 1], [2.01, 0.25], [3, 0.08]].forEach(([m, a]) => {
      const o = c.createOscillator();
      o.frequency.value = freq * m;
      const g = c.createGain();
      env(g, t, 0.008, peak * a, dur / m);
      o.connect(g);
      g.connect(dry);
      o.start(t);
      o.stop(t + dur + 0.1);
    });
  };
  // optional bed — airy room tone (soft filtered noise, no pitch). Off by default.
  if (opts.bed === 'ar') {
    const pts = [[0, 0.0001], [C.Grid + 1.6, 0.018], [C.Name + 1.0, 0.026], [total - 0.8, 0.02], [total, 0.0001]];
    const lvl = s => {
      for (let i = 1; i < pts.length; i++) if (s <= pts[i][0]) {
        const [a, va] = pts[i - 1],
          [b, vb] = pts[i];
        return va + (vb - va) * (s - a) / (b - a || 1);
      }
      return 0.0001;
    };
    const ds = Math.max(from, 0);
    if (ds < total - 0.05) {
      const n = noiseSrc(at(ds), total - ds);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 900;
      bp.Q.value = 0.5;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2400;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, at(ds));
      g.gain.linearRampToValueAtTime(Math.max(lvl(ds), 0.0001), at(ds) + 0.25);
      pts.forEach(([s, v]) => {
        if (s > ds + 0.25) g.gain.linearRampToValueAtTime(v, at(s));
      });
      n.connect(bp);
      bp.connect(lp);
      lp.connect(g);
      g.connect(master);
    }
  }
  const G = C.Grid,
    W = C.Walls,
    D = C.Door,
    N = C.Name;
  swish(G, 1.2, 400, 2400, 0.05);
  swish(G + 0.5, 0.75, 1200, 6000, 0.09);
  swish(G + 0.62, 0.7, 1500, 5200, 0.06);
  for (let i = 0; i < 4; i++) tap(G + 0.74 + i * 0.08, 0.12);
  scratch(W + 0.1, 1.25, 0.11, 11);
  tap(W + 1.15, 0.06);
  tap(W + 1.25, 0.06);
  scratch(W + 1.2, 0.35, 0.09, 23);
  tap(W + 1.42, 0.1);
  thump(W + 1.45, 0.08);
  swish(D + 0.15, 1.0, 300, 900, 0.1);
  thump(D + 1.2, 0.12);
  bell(D + 0.9, 880, 0.05, 2.2);
  bell(D + 0.96, 1318.5, 0.03, 2.0);
  swish(N, 1.3, 1800, 250, 0.08);
  [146.83, 220, 329.63, 369.99, 554.37].forEach((f, i) => bell(N + 0.75 + i * 0.035, f, 0.075 - i * 0.008, 3.2));
  swish(N + 1.2, 0.7, 3000, 7000, 0.035);
  scratch(N + 1.25, 0.55, 0.04, 37);
  bell(N + 1.45, 1760, 0.018, 1.6);
}
const V22Sound = (() => {
  let ctx = null,
    bus = null,
    enabled = false,
    volume = 0.8,
    bed = 'nenhum',
    lastT = null,
    lastNow = 0,
    lastSeen = 0;
  const cues = () => window.__v22Cues || {
    C: {
      Grid: 0,
      Walls: 1.4,
      Door: 3.3,
      Name: 5.0,
      Hold: 7.6
    },
    total: 9.4
  };
  function stop() {
    if (bus) {
      const b = bus;
      try {
        b.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      } catch (e) {}
      setTimeout(() => b.disconnect(), 250);
      bus = null;
    }
  }
  function start(T) {
    stop();
    if (!ctx) return;
    bus = ctx.createGain();
    bus.gain.value = volume;
    bus.connect(ctx.destination);
    const {
      C,
      total
    } = cues();
    v22Score(ctx, bus, ctx.currentTime + 0.03 - T, T, C, total, {
      bed
    });
  }
  setInterval(() => {
    if (bus && performance.now() - lastSeen > 220) {
      stop();
      lastT = null;
    }
  }, 100);
  return {
    get enabled() {
      return enabled;
    },
    async enable(on) {
      enabled = on;
      if (on) {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        try {
          await Promise.race([ctx.resume(), new Promise(r => setTimeout(r, 300))]);
        } catch (e) {}
        if (ctx.state !== 'running') {
          const go = () => {
            ctx.resume();
            lastT = null;
          };
          window.addEventListener('pointerdown', go, {
            once: true
          });
        }
        lastT = null;
      } else {
        stop();
        lastT = null;
      }
    },
    setBed(v) {
      if (v === bed) return;
      bed = v;
      lastT = null;
    },
    setVolume(v) {
      volume = v;
      if (bus) bus.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
    },
    tick(T) {
      if (!enabled || !ctx || T === lastT) return;
      const now = performance.now();
      lastSeen = now;
      if (lastT == null || !bus) start(T);else {
        const exp = lastT + (now - lastNow) / 1000;
        if (T < lastT - 0.001 || Math.abs(T - exp) > 0.25) start(T);
      }
      lastT = T;
      lastNow = now;
    },
    async wav() {
      const {
          C,
          total
        } = cues(),
        sr = 48000;
      const oc = new OfflineAudioContext(2, Math.ceil(sr * total), sr);
      v22Score(oc, oc.destination, 0, 0, C, total, {
        bed
      });
      const buf = await oc.startRendering();
      const n = buf.length,
        out = new DataView(new ArrayBuffer(44 + n * 4)),
        L = buf.getChannelData(0),
        R = buf.getChannelData(1);
      const w = (o, s) => {
        for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i));
      };
      w(0, 'RIFF');
      out.setUint32(4, 36 + n * 4, true);
      w(8, 'WAVE');
      w(12, 'fmt ');
      out.setUint32(16, 16, true);
      out.setUint16(20, 1, true);
      out.setUint16(22, 2, true);
      out.setUint32(24, sr, true);
      out.setUint32(28, sr * 4, true);
      out.setUint16(32, 4, true);
      out.setUint16(34, 16, true);
      w(36, 'data');
      out.setUint32(40, n * 4, true);
      for (let i = 0, o = 44; i < n; i++, o += 4) {
        out.setInt16(o, Math.max(-1, Math.min(1, L[i])) * 0x7fff, true);
        out.setInt16(o + 2, Math.max(-1, Math.min(1, R[i])) * 0x7fff, true);
      }
      const url = URL.createObjectURL(new Blob([out], {
        type: 'audio/wav'
      }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'decroqui-logo-v22-som.wav';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
  };
})();
function PlantaSound() {
  const {
    T,
    CUES,
    authoredTotal
  } = useComposition();
  window.__v22Cues = {
    C: CUES,
    total: authoredTotal
  };
  React.useEffect(() => {
    V22Sound.tick(T);
  });
  return null;
}
function SoundControls() {
  const [on, setOn] = React.useState(V22Sound.enabled);
  const [busy, setBusy] = React.useState(false);
  const qs = new URLSearchParams(location.search);
  React.useEffect(() => {
    if (qs.get('som') === '1' && !V22Sound.enabled) V22Sound.enable(true).then(() => setOn(true));
  }, []);
  if (qs.get('embed') === '1') return null;
  const btn = {
    all: 'unset',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 2,
    background: 'rgba(239,233,223,.94)',
    color: '#142841',
    font: '500 11px/1 Jost, system-ui, sans-serif',
    letterSpacing: '.18em',
    textTransform: 'uppercase',
    boxShadow: '0 4px 18px rgba(11,23,38,.25)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 16,
      right: 16,
      zIndex: 2000,
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...btn,
      background: on ? '#490b1a' : btn.background,
      color: on ? '#efe9df' : btn.color
    },
    onClick: async () => {
      await V22Sound.enable(!on);
      setOn(!on);
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: on ? '#efe9df' : '#490b1a'
    }
  }), on ? 'Som ligado' : 'Ativar som'), /*#__PURE__*/React.createElement("button", {
    style: btn,
    onClick: async () => {
      setBusy(true);
      try {
        await V22Sound.wav();
      } finally {
        setBusy(false);
      }
    }
  }, busy ? 'Gerando…' : 'Baixar trilha .wav'));
}
Object.assign(window, {
  V22Sound,
  PlantaSound,
  SoundControls
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "logo-anim/PlantaSound.jsx", error: String((e && e.message) || e) }); }

// logo-anim/animations-v3.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).

/* BEGIN USAGE */
// animations-v3.jsx — continuous-composition animation engine.
//
// THE MODEL: the animation is ONE element tree rendered as a pure function
// of one authored-time axis. Nothing mounts or unmounts at section
// boundaries, so any element can move, morph, or persist across them by
// ordinary interpolation. The scene list (OM_SCENES) is the user-control
// view — names, order, playback durations — and the engine derives the cue
// table from it, so structure has exactly one source and cannot drift.
//
// API INDEX (every export is a window global):
//   <CompositionStage width height scenes={window.OM_SCENES}
//                     playback={window.OM_PLAYBACK} bg>
//     <Piece />   — ONE component, the whole animation
//   </CompositionStage>
//   useComposition() -> {T, CUES, time, duration, authoredTotal, playing}
//     T: authored seconds (warped per-section by user trims/speeds) —
//        key ALL choreography to T, never to wall-clock time
//     CUES: {SectionName: authoredStart} derived from OM_SCENES; an unknown
//        name returns NaN and raises a preview-only badge (never exports);
//        duplicate section names bind to the first occurrence
//   <Shot from={CUES.Build} to={CUES.Close}> — children visible between two
//     authored times (an authored hard cut in one line); children stay
//     mounted (media keeps its readiness) and are hidden outside the window
//   <Captions items={[{at, until?, text}, ...]} /> — ONE caption element,
//     at most one visible at a time, keyed to T; 'until' defaults to the
//     next item's 'at'; a last item with no 'until' stays to the end
//   WATERCOLOR (only when the Watercolor illustration skill is active —
//   otherwise ignore these entries). A painting is a function(p) written
//   against the paint kit, on a width x height sheet; it needs
//   watercolor_kit.js loaded by a <script> tag before this engine, must
//   be a stable function defined once (module scope, never an inline
//   arrow), and every component below renders <img> elements, so it all
//   exports by construction.
//   <WatercolorPainting painting={fn} from={CUES.X} to={CUES.Y} width height
//     seed scale quality style /> — the painting assembled from its own
//     STROKES: each wash / ink line / splatter is a separate layer
//     stacked over the paper, appearing in painting order between two
//     authored times (washes bloom in, ink draws tip to tail). This is the
//     default way to show a watercolor being painted. It keeps the sheet's
//     aspect ratio (size it with style, e.g. {position:'absolute', left,
//     top, width}). scale is the layers' render resolution over width x
//     height (default 1, a deliberate weight-over-dpi trade — raise it
//     toward the zoom factor if the composition zooms into the painting,
//     or toward the devicePixelRatio for a hero-sized sheet); quality is
//     0..1 layer image quality (default 0.92; 1 is the encoder's maximum).
//   useWatercolorLayers(fn, {width, height, seed, scale, quality}) -> L
//     (null if the kit isn't loaded — load watercolor_kit.js before the
//     engine — or if the painting fails to build) — the painting taken apart into strokes, for
//     choreography beyond in-order painting: L.count strokes, L.kind(i)
//     ('wash' | 'gradedWash' | 'glaze' | 'ink' | 'hatch' | 'splatter' |
//     'dryStroke' | 'reserve' | 'caption'), L.span(i) = the stroke's
//     {from, to} share of the painting's 0..1 timeline; call L.warm()
//     once after load so finished strokes pre-render off the critical
//     path (WatercolorPainting does this itself). Compose with:
//   <WatercolorSheet layers={L} style>children</WatercolorSheet> — the
//     paper the strokes sit on (keeps the sheet's aspect ratio), and
//   <WatercolorStroke index={i} at={0..1} style /> — stroke i as its own
//     element, placed where it was painted; at is its painting progress
//     (0 hidden, 1 finished — drive it from T with animate()); style lets
//     you move, scale, rotate, or fade the stroke (transform / opacity).
//     Strokes are paint, so they multiply: overlapping strokes darken
//     where they cross, as in the still image, within a few 8-bit levels
//     (tighter still at quality 1). The sheet clips to its
//     box — for strokes that fly in from outside it, set
//     style={{overflow: 'visible'}} on the WatercolorSheet. 'reserve' strokes
//     are erasures (lifted paper) — keep them where they were painted and
//     reveal them in order after the strokes they erase; moving an erase
//     around has no sensible meaning.
//   <WatercolorReveal painting={fn} from={CUES.X} to={CUES.Y} width height
//     seed steps scale format quality style />, or <WatercolorReveal
//     frames={[src, ...]} from to /> — the whole painting as ONE flat
//     image that paints on (frames pre-baked in the background, so it is
//     the lightest option and the one to zoom or pan over as a single
//     picture). Prefer WatercolorPainting when the strokes themselves
//     should appear one by one or be individually animated. format is
//     the image MIME type (default image/jpeg), quality 0..1 (default
//     0.88). Frames bake at width x height times scale (default: the
//     device pixel ratio, capped at 2) — if the composition zooms INTO
//     the painting, raise scale toward the maximum zoom so frames stay
//     crisp. The kit caps a sheet at ~12M pixels and the components clamp
//     scale to stay under it; exported video sharpness also depends on
//     the export dialog's own resolution choice.
//   Motion: Easing.{linear, easeIn|Out|InOutQuad/Cubic/Quart/Expo/Sine,
//     easeIn|Out|InOutBack, easeOutElastic}, interpolate(input, output, ease),
//     animate({from, to, start, end, ease}) -> fn(T), clamp(v, min, max)
//   Plumbing (rarely needed): Stage, PlaybackBar, TimelineContext,
//     useTime, useTimeline
//   Seek event (host/export transport): 'data-om-seek-to-time-frame',
//     detail {time, sync, playing} — the stage owns it; never implement it
//     yourself
//
// THE AUTHORING CONTRACT — this is what makes the host timeline's trim and
// speed gestures write back into YOUR file, so follow it exactly:
//   1. Declare the scene list as a JSON string literal in a plain inline
//      <script> of the main document (NOT type="text/babel", NOT a sibling
//      .jsx — only vanilla inline scripts are addressable for write-back):
//        <script>window.OM_SCENES = '[{"name":"Opening","dur":3,"desc":"The logo fades in and the title settles"},{"name":"Build","dur":5,"desc":"Bars grow to their final values"}]';</script>
//      Give every entry a "desc": one short plain-words sentence saying
//      what happens in that section. The user reads it in the timeline's
//      section popover — keep it true whenever you edit the section.
//   2. Pass the string through untouched:
//        <CompositionStage scenes={window.OM_SCENES} ...>
//   3. ALSO declare the playback setting the same way:
//        <script>window.OM_PLAYBACK = '{"mode":"loop"}';</script>
//      and pass it through untouched (values: '{"mode":"loop"}' or
//      '{"mode":"times","count":N}'; omitting keeps loop behavior but
//      leaves the host Repeat control read-only for this document).
//   IMPORTANT — the exportable-video contract: CompositionStage/Stage OWNS
//   it (the data-om-exportable-video-with-duration-secs attribute, the
//   data-om-seek-to-time-frame listener, the svg/foreignObject wrapper,
//   and font inlining). NEVER put the exportable attribute on any other
//   element — a second "exportable root" makes the host timeline and the
//   video exporter bind to the wrong element, and playback control /
//   export silently break.
//
// HOW TIME WORKS: each OM_SCENES entry is a named slice of the authored
// timeline. CUES.Name is that section's authored start (the running sum of
// authored lengths, in literal order). useComposition().T is the authored
// clock: when the user trims or speeds a section on the host timeline, the
// engine replays that section's SAME authored slice over the new playback
// length — your choreography retimes, never cuts off. The optional "nat"
// field on an entry is the engine's authored-length anchor — the host
// timeline stamps it on the first retime; don't set it by hand.
//
// CUE-FIRST DISCIPLINE (what makes a piece read as one continuous video):
//   1. Write the OM_SCENES literal FIRST — it is the piece's outline.
//   2. One helper component per section for readability, but ALL of them
//      render ALL the time inside the one tree, keyed to CUES — never
//      conditionally mounted per section.
//   3. Define exactly three motion helpers up front (e.g.
//      MOTION = {enter, draw, pop} wrapping Easing curves) and use no
//      easing or transform outside them; one caption element, one visible
//      at a time (<Captions> has this built in).
//   A shared element that crosses a boundary is just motion whose start
//   and end straddle a cue: animate({from, to, start: CUES.Build - 0.4,
//   end: CUES.Build + 0.6})(T) glides through the boundary, and a user
//   slowing either section slows the glide without breaking it.
//
// RENDER FROM T ONLY: the exporter seeks each frame with a synchronous
// commit and may serialize the stage the moment the seek event returns —
// anything painted from useEffect or your own requestAnimationFrame lags
// that commit and exports stale. Render everything visible from T and this
// is automatic. A seeked frame is a deterministic render at that time.
//
// HARD CUTS are content now, not structure: wrap a shot's elements in
// <Shot from to> (visibility toggles at the cues; children stay mounted so
// images and videos hold their readiness). Shot also doubles as the
// perf gate for heavy far-away beats.
//
// LOOP SEAMS are the one surviving boundary rule: a looping piece shows
// its last authored frame immediately before its first — make them match
// (settle your choreography by authoredTotal, open it at 0).
//
// DIAGNOSTICS: choreography that references an unknown section name (a
// rename or deletion in OM_SCENES) shows a badge below the stage in the
// preview, outside the exportable svg — visible in preview screenshots,
// never in the exported video. An OM_SCENES section with no choreography
// keyed to it is a valid empty beat, not an error.
/* END USAGE */

// ─────────────────────────────────────────────────────────────────────────────

// ── Easing functions (hand-rolled, Popmotion-style) ─────────────────────────
// All easings take t ∈ [0,1] and return eased t ∈ [0,1] (may overshoot for back/elastic).
const Easing = {
  linear: t => t,
  // Quad
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  // Cubic
  easeInCubic: t => t * t * t,
  easeOutCubic: t => --t * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  // Quart
  easeInQuart: t => t * t * t * t,
  easeOutQuart: t => 1 - --t * t * t * t,
  easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
  // Expo
  easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
    return 1 - 0.5 * Math.pow(2, -20 * t + 10);
  },
  // Sine
  easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: t => Math.sin(t * Math.PI / 2),
  easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  // Back (overshoot)
  easeOutBack: t => {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInBack: t => {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeInOutBack: t => {
    const c1 = 1.70158,
      c2 = c1 * 1.525;
    return t < 0.5 ? Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  // Elastic
  easeOutElastic: t => {
    const c4 = 2 * Math.PI / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

// ── Core interpolation helpers ──────────────────────────────────────────────

// Clamp a value to [min, max]
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// interpolate([0, 0.5, 1], [0, 100, 50], ease?) -> fn(t)
// Popmotion-style: linearly maps t across input keyframes to output values,
// with optional easing per segment (single fn or array of fns).
function interpolate(input, output, ease = Easing.linear) {
  return t => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const easeFn = Array.isArray(ease) ? ease[i] || Easing.linear : ease;
        const eased = easeFn(local);
        return output[i] + (output[i + 1] - output[i]) * eased;
      }
    }
    return output[output.length - 1];
  };
}

// animate({from, to, start, end, ease})(t) — simpler single-segment tween.
// Returns `from` before `start`, `to` after `end`.
function animate({
  from = 0,
  to = 1,
  start = 0,
  end = 1,
  ease = Easing.easeInOutCubic
}) {
  return t => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}

// ── Timeline context ────────────────────────────────────────────────────────

const TimelineContext = React.createContext({
  time: 0,
  duration: 10,
  playing: false
});
const useTime = () => React.useContext(TimelineContext).time;
const useTimeline = () => React.useContext(TimelineContext);

// How long a marked (detail.playing === true) host seek keeps the
// external-playback latch alive with no successor. The host play bar's
// seek pump is one-in-flight/latest-wins, so its inter-seek gap is tens
// of milliseconds in the worst case — 400ms is far above that, so a
// marked stream that dies mid-play decays the latch promptly.
var SS_EXT_PLAY_MS = 400;

// ── Font inlining ───────────────────────────────────────────────────────────
// Copy every @font-face rule from the page into a <style> inside the svg's
// foreignObject, with font URLs rewritten to data: URLs. Makes the svg
// self-describing so serializing it alone (video export fast path) still
// renders with the right fonts. Sets data-om-fonts-inlined on the svg when
// done so the exporter can wait for it.

function useInlineFontsInto(svgRef) {
  React.useEffect(() => {
    const svg = svgRef.current;
    const host = svg && svg.querySelector('foreignObject > div');
    if (!svg || !host) return;
    let cancelled = false;
    (async () => {
      const rules = [];
      for (const ss of document.styleSheets) {
        let cssRules;
        try {
          cssRules = ss.cssRules;
        } catch {
          // Cross-origin sheet without crossorigin attr (e.g. the standard
          // fonts.googleapis.com <link>) — fetch the CSS text directly and
          // regex-extract the @font-face blocks.
          if (ss.href) {
            try {
              const txt = await fetch(ss.href).then(r => {
                if (!r.ok) throw 0;
                return r.text();
              });
              for (const ff of txt.match(/@font-face\s*{[^}]*}/g) || []) rules.push({
                css: ff,
                base: ss.href
              });
            } catch {}
          }
          continue;
        }
        if (!cssRules) continue;
        for (const r of cssRules) {
          if (r.type === CSSRule.FONT_FACE_RULE) {
            rules.push({
              css: r.cssText,
              base: ss.href || location.href
            });
          }
        }
      }
      const toDataURL = url => fetch(url).then(r => {
        if (!r.ok) throw 0;
        return r.blob();
      }).then(b => new Promise(res => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = () => res(url);
        fr.readAsDataURL(b);
      })).catch(() => url);
      const parts = await Promise.all(rules.map(async ({
        css,
        base
      }) => {
        const re = /url\((['"]?)([^'")]+)\1\)/g;
        let out = css,
          m;
        while (m = re.exec(css)) {
          const u = m[2];
          if (u.startsWith('data:')) continue;
          let abs;
          try {
            abs = new URL(u, base).href;
          } catch {
            continue;
          }
          out = out.split(m[0]).join(`url("${await toDataURL(abs)}")`);
        }
        return out;
      }));
      if (cancelled || !parts.length) {
        svg.setAttribute('data-om-fonts-inlined', 'true');
        return;
      }
      const style = document.createElement('style');
      style.textContent = parts.join('\n');
      host.insertBefore(style, host.firstChild);
      svg.setAttribute('data-om-fonts-inlined', 'true');
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
function Stage({
  width = 1280,
  height = 720,
  duration = 10,
  background = '#f6f4ef',
  fps = 60,
  loop = true,
  autoplay = true,
  // Parsed playback object ({mode:'loop'} | {mode:'times',count:N}) or
  // null. When present it overrides the legacy loop prop — CompositionStage
  // passes the validated value from the OM_PLAYBACK authoring contract.
  playback = null,
  persistKey = 'animstage-v3',
  children
}) {
  // Props arrive as strings when Stage is mounted via <x-import> (DC
  // projects) — coerce so style={{width}} gets a number React can px-ify.
  width = +width || 1280;
  height = +height || 720;
  duration = +duration || 10;
  fps = +fps || 60;
  if (typeof loop === 'string') loop = loop !== 'false';
  if (typeof autoplay === 'string') autoplay = autoplay !== 'false';
  const playTimes = playback && playback.mode === 'times' ? playback.count : null;
  const loopEff = playback ? playback.mode === 'loop' : loop;
  const [time, setTime] = React.useState(() => {
    try {
      const v = parseFloat(localStorage.getItem(persistKey + ':t') || '0');
      return isFinite(v) ? clamp(v, 0, duration) : 0;
    } catch {
      return 0;
    }
  });
  const [playing, setPlaying] = React.useState(autoplay);
  // The external-playback latch: true while the HOST play bar is driving
  // time forward as genuine continuous playback (its play-loop seeks
  // carry detail.playing === true). The engine's own clock stays paused
  // the whole time — exactly one clock ever drives — so this is a
  // separate bit, not a second meaning for `playing`. Set and cleared
  // in the seek handler below; decays via SS_EXT_PLAY_MS when the
  // marked stream stops without a parting unmarked seek.
  const [extPlay, setExtPlay] = React.useState(false);
  const extPlayTimerRef = React.useRef(null);
  const [hoverTime, setHoverTime] = React.useState(null);
  const [scale, setScale] = React.useState(1);
  const stageRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(null);

  // Persist playhead
  React.useEffect(() => {
    try {
      localStorage.setItem(persistKey + ':t', String(time));
    } catch {}
  }, [time, persistKey]);

  // Auto-scale to fit viewport
  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const barH = 44; // playback bar height
      const s = Math.min(el.clientWidth / width, (el.clientHeight - barH) / height);
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [width, height]);

  // Passes completed since playback last started. Lives in a ref so the
  // per-frame wrap can count without re-running this effect; reset on
  // every (re)start so a fresh play (or a host restart) gets the full
  // run count again.
  const passesRef = React.useRef(0);

  // Animation loop
  React.useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    passesRef.current = 0;
    const step = ts => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime(t => {
        let next = t + dt;
        if (next >= duration) {
          if (playTimes !== null) {
            // Play N times then hold the last frame — the partial pass a
            // mid-timeline start produces counts as a pass, so the piece
            // never runs longer than N full durations.
            passesRef.current += 1;
            if (passesRef.current >= playTimes) {
              next = duration;
              setPlaying(false);
            } else {
              next = next % duration;
            }
          } else if (loopEff) {
            next = next % duration;
          } else {
            next = duration;
            setPlaying(false);
          }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing, duration, loopEff, playTimes]);

  // Keyboard: space = play/pause, ← → = seek
  React.useEffect(() => {
    const onKey = e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(p => !p);
      } else if (e.code === 'ArrowLeft') {
        setTime(t => clamp(t - (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.code === 'ArrowRight') {
        setTime(t => clamp(t + (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.key === '0' || e.code === 'Home') {
        setTime(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration]);

  // Video-export protocol + the editor's play bar: hosts dispatch this
  // event per frame; pause + sync the playhead so the frame shows exactly
  // that timestamp. The host play bar marks its play-loop seeks with
  // detail.playing === true — the mark latches extPlay (playback is
  // playback even when a host clock drives it), while ANY unmarked seek
  // (scrub, step, export frame, the transport's pause park) clears the
  // latch in the same commit it retimes, so a seeked frame still renders
  // exactly one scene's state. The engine's own clock pauses either way.
  React.useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    // Sync-seek capability: a dispatcher that marks its seek with
    // detail.sync === true gets the commit applied via ReactDOM.flushSync,
    // so the stage DOM reflects the seeked frame the moment dispatchEvent
    // returns. The video exporter keys off the data-om-sync-seek
    // advertisement to drop its two-display-refresh settle (that wait only
    // exists to let React's async commit land — serialization needs the
    // committed DOM, not the paint). Feature-detected: a runtime without
    // ReactDOM.flushSync never advertises and every seek takes the async
    // path. Unmarked seeks (scrubs, the host play bar) stay async — a
    // forced sync render per pointermove would tax the editor for no one.
    const canSyncSeek = typeof ReactDOM !== 'undefined' && typeof ReactDOM.flushSync === 'function';
    const onSeek = e => {
      const apply = () => {
        setPlaying(false);
        const hostPlay = !!(e.detail && e.detail.playing === true);
        if (extPlayTimerRef.current) {
          clearTimeout(extPlayTimerRef.current);
          extPlayTimerRef.current = null;
        }
        if (hostPlay) {
          // Watchdog: the latch is only as alive as its seek stream. If the
          // host stops without a parting seek (tab jank, bar unmount), the
          // latch decays on its own rather than stranding extPlaying true.
          extPlayTimerRef.current = setTimeout(() => {
            extPlayTimerRef.current = null;
            setExtPlay(false);
          }, SS_EXT_PLAY_MS);
        }
        setExtPlay(hostPlay);
        setTime(clamp(e.detail.time, 0, duration));
      };
      // flushSync is safe here: a native DOM listener runs outside React's
      // lifecycle, and the exporter's dispatchEvent is synchronous, so the
      // commit lands in the same JS task — the engine's own rAF loop can
      // never interleave between seek and serialize.
      if (canSyncSeek && e.detail && e.detail.sync === true) {
        ReactDOM.flushSync(apply);
      } else {
        apply();
      }
    };
    el.addEventListener('data-om-seek-to-time-frame', onSeek);
    if (canSyncSeek) el.setAttribute('data-om-sync-seek', 'true');
    return () => {
      el.removeEventListener('data-om-seek-to-time-frame', onSeek);
      el.removeAttribute('data-om-sync-seek');
      if (extPlayTimerRef.current) {
        clearTimeout(extPlayTimerRef.current);
        extPlayTimerRef.current = null;
      }
      // Drop the latch too: this cleanup runs on every duration change
      // (an agent edit can retime mid-host-play, no gesture involved) and
      // the new effect instance arms no watchdog — clearing only the
      // timer could strand extPlay true forever if the marked stream died
      // in the gap. Fail toward cut: the next marked seek re-latches.
      setExtPlay(false);
    };
  }, [duration]);

  // Inline @font-face rules into the svg's foreignObject so the svg is
  // self-describing — serializing it alone (for video export) then renders
  // with the right fonts. Sets data-om-fonts-inlined once done.
  useInlineFontsInto(canvasRef);
  const displayTime = hoverTime != null ? hoverTime : time;
  const ctxValue = React.useMemo(
  // extPlaying is ADDITIVE: "time is advancing under an external
  // driver's continuous playback". `playing` keeps meaning the
  // engine's OWN clock — the hidden PlaybackBar glyph (and through it
  // the host's clock-reporter/adoption channel) reads that — and
  // CompositionClock is the one consumer that widens to either.
  () => ({
    time: displayTime,
    duration,
    playing,
    extPlaying: extPlay,
    setTime,
    setPlaying
  }), [displayTime, duration, playing, extPlay]);
  return (
    /*#__PURE__*/
    // data-om-starter: inert presence marker — Claude Design's starter-usage
    // probe reads it; it renders nothing. Keep it on this root element.
    React.createElement("div", {
      ref: stageRef,
      "data-om-starter": "animations-v3",
      style: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#0a0a0a',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        minHeight: 0
      }
    }, /*#__PURE__*/React.createElement("svg", {
      ref: canvasRef,
      width: width,
      height: height,
      "data-om-exportable-video-with-duration-secs": duration,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        flexShrink: 0,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        display: 'block'
      }
    }, /*#__PURE__*/React.createElement("foreignObject", {
      x: "0",
      y: "0",
      width: "100%",
      height: "100%"
    }, /*#__PURE__*/React.createElement("div", {
      xmlns: "http://www.w3.org/1999/xhtml",
      style: {
        width,
        height,
        background,
        position: 'relative',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement(TimelineContext.Provider, {
      value: ctxValue
    }, children))))), /*#__PURE__*/React.createElement(PlaybackBar, {
      time: displayTime,
      actualTime: time,
      duration: duration,
      playing: playing,
      onPlayPause: () => setPlaying(p => !p),
      onReset: () => {
        setTime(0);
      },
      onSeek: t => setTime(t),
      onHover: t => setHoverTime(t)
    }))
  );
}

// ── Playback bar ────────────────────────────────────────────────────────────
// Play/pause, return-to-begin, scrub track, time display.
// Uses fixed-width time fields so layout doesn't thrash.

function PlaybackBar({
  time,
  duration,
  playing,
  onPlayPause,
  onReset,
  onSeek,
  onHover
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const timeFromEvent = React.useCallback(e => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    return x * duration;
  }, [duration]);
  const onTrackMove = e => {
    if (!trackRef.current) return;
    const t = timeFromEvent(e);
    if (dragging) {
      onSeek(t);
    } else {
      onHover(t);
    }
  };
  const onTrackLeave = () => {
    if (!dragging) onHover(null);
  };
  const onTrackDown = e => {
    setDragging(true);
    const t = timeFromEvent(e);
    onSeek(t);
    onHover(null);
  };
  React.useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(false);
    const onMove = e => {
      if (!trackRef.current) return;
      const t = timeFromEvent(e);
      onSeek(t);
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [dragging, timeFromEvent, onSeek]);
  const pct = duration > 0 ? time / duration * 100 : 0;
  const fmt = t => {
    const total = Math.max(0, t);
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    const cs = Math.floor(total * 100 % 100);
    return `${String(m).padStart(1, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };
  const mono = 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace';
  return /*#__PURE__*/React.createElement("div", {
    "data-omelette-chrome": true,
    style: {
      // Slimmed to visually match the host editor bar's basic row (the
      // single-scrubber look): transport first, tighter metrics, quieter
      // chrome. Shown only outside the app — the host bar suppresses this
      // whenever it is present.
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 12px',
      background: 'rgba(20,20,20,0.92)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',
      borderRadius: 6,
      color: '#f6f4ef',
      fontFamily: 'Inter, system-ui, sans-serif',
      userSelect: 'none',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    onClick: onPlayPause,
    title: "Play/pause (space)"
  }, playing ? /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "2",
    width: "3",
    height: "10",
    fill: "currentColor"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "8",
    y: "2",
    width: "3",
    height: "10",
    fill: "currentColor"
  })) : /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 2l9 5-9 5V2z",
    fill: "currentColor"
  }))), /*#__PURE__*/React.createElement(IconButton, {
    onClick: onReset,
    title: "Return to start (0)"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 2v10M12 2L5 7l7 5V2z",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: mono,
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums',
      width: 64,
      textAlign: 'right',
      color: '#f6f4ef'
    }
  }, fmt(time)), /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    onMouseMove: onTrackMove,
    onMouseLeave: onTrackLeave,
    onMouseDown: onTrackDown,
    style: {
      flex: 1,
      height: 22,
      position: 'relative',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 4,
      background: 'rgba(255,255,255,0.12)',
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      width: `${pct}%`,
      height: 4,
      background: 'oklch(72% 0.12 250)',
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: `${pct}%`,
      top: '50%',
      width: 12,
      height: 12,
      marginLeft: -6,
      marginTop: -6,
      background: '#fff',
      borderRadius: 6,
      boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: mono,
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums',
      width: 64,
      textAlign: 'left',
      color: 'rgba(246,244,239,0.55)'
    }
  }, fmt(duration)), typeof VideoEncoder !== 'undefined' && /*#__PURE__*/React.createElement(IconButton, {
    title: "Export video",
    onClick: () => window.parent.postMessage({
      type: 'omelette:request-video-export'
    }, '*')
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 2v7m0 0L4 6m3 3l3-3M2 12h10",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))));
}
function IconButton({
  children,
  onClick,
  title
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    title: title,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: 24,
      height: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 5,
      color: '#f6f4ef',
      cursor: 'pointer',
      padding: 0,
      transition: 'background 120ms'
    }
  }, children);
}

// ── Scene-list plumbing ──────────────────────────────────────────────────
// Guest-side validation of a scene list (the engine's own inputs: the
// authored prop, and host-dispatched updates). Mirrors the host parser's
// shape rules and constants — keep in sync with parseTimelineScenes in
// apps/web/src/shared/timeline.ts (16KB raw cap, 50 entries, dur finite in
// (0, 300]); returns null on any violation.
function ssParse(raw) {
  if (typeof raw !== 'string' || !raw || raw.length > 16 * 1024) return null;
  var parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 50) return null;
  for (var i = 0; i < parsed.length; i++) {
    var s = parsed[i];
    if (typeof s !== 'object' || s === null) return null;
    if (typeof s.name !== 'string' || typeof s.dur !== 'number') return null;
    if (!isFinite(s.dur) || s.dur <= 0 || s.dur > 300) return null;
  }
  return parsed;
}

// Guest-side validation of the playback value — mirrors the host parser
// (shared/timeline.ts parseTimelinePlayback): {"mode":"loop"} or
// {"mode":"times","count":1..99}, strict all-or-nothing, null otherwise.
// Callers treat null as the loop default.
function ppParse(raw) {
  if (typeof raw !== 'string' || !raw || raw.length > 256) return null;
  var parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  var keys = Object.keys(parsed);
  if (parsed.mode === 'loop') return keys.length === 1 ? {
    mode: 'loop'
  } : null;
  if (parsed.mode === 'times') {
    if (keys.length !== 2) return null;
    var c = parsed.count;
    if (typeof c !== 'number' || c !== Math.floor(c) || c < 1 || c > 99) return null;
    return {
      mode: 'times',
      count: c
    };
  }
  return null;
}

// Stamps the playback attribute VERBATIM from the authored raw string (the
// host's write-back anchors on that exact value) and listens for the
// host's post-write update event. Same shape as SceneSync; only rendered
// when the document authors a playback literal — an absent contract means
// the attribute stays absent and the document plays its default.
function PlaybackSync(props) {
  var ref = React.useRef(null);
  var raw = props.raw;
  var onUpdate = props.onUpdate;
  React.useEffect(function () {
    var el = ref.current;
    if (!el) return;
    var root = el.closest('[data-om-exportable-video-with-duration-secs]');
    if (!root) return;
    root.setAttribute('data-om-timeline-playback', raw);
    var onEvent = function (e) {
      var next = e && e.detail;
      if (ppParse(next)) onUpdate(next);
    };
    root.addEventListener('data-om-timeline-playback-update', onEvent);
    return function () {
      root.removeEventListener('data-om-timeline-playback-update', onEvent);
      root.removeAttribute('data-om-timeline-playback');
    };
  }, [raw, onUpdate]);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      display: 'none'
    }
  });
}

// Renders inside the Stage (so it can reach the exportable root via
// closest()): stamps the scenes attribute VERBATIM from the current raw
// string — the host's write-back anchors on that exact value — and listens
// for the host's post-write update event.
function SceneSync(props) {
  var ref = React.useRef(null);
  var raw = props.raw;
  var onUpdate = props.onUpdate;
  React.useEffect(function () {
    var el = ref.current;
    if (!el) return;
    var root = el.closest('[data-om-exportable-video-with-duration-secs]');
    if (!root) return;
    root.setAttribute('data-om-timeline-scenes', raw);
    var onEvent = function (e) {
      var next = e && e.detail;
      // Ignore anything that doesn't validate — a bad update must not tear
      // down a working composition.
      if (ssParse(next)) onUpdate(next);
    };
    root.addEventListener('data-om-timeline-scenes-update', onEvent);
    return function () {
      root.removeEventListener('data-om-timeline-scenes-update', onEvent);
      root.removeAttribute('data-om-timeline-scenes');
    };
  }, [raw, onUpdate]);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      display: 'none'
    }
  });
}

// ── Continuous composition ──────────────────────────────────────────────

var CompositionContext = React.createContext(null);
function useComposition() {
  var ctx = React.useContext(CompositionContext);
  if (!ctx) throw new Error('useComposition() must be called inside <CompositionStage>');
  return ctx;
}
function ccDerive(scenes) {
  var playStart = 0;
  var authStart = 0;
  var sections = [];
  var table = Object.create(null);
  for (var i = 0; i < scenes.length; i++) {
    var s = scenes[i];
    var nat = typeof s.nat === 'number' && isFinite(s.nat) && s.nat > 0 ? s.nat : s.dur;
    sections.push({
      name: s.name,
      playStart: playStart,
      dur: s.dur,
      authStart: authStart,
      nat: nat
    });
    if (!Object.prototype.hasOwnProperty.call(table, s.name)) {
      table[s.name] = Math.round(authStart * 1000) / 1000;
    }
    playStart += s.dur;
    authStart += nat;
  }
  return {
    sections: sections,
    table: table,
    total: Math.round(playStart * 1000) / 1000,
    authoredTotal: Math.round(authStart * 1000) / 1000
  };
}
function ccWarp(d, t) {
  var ss = d.sections;
  if (ss.length === 0) return 0;
  var idx = ss.length - 1;
  for (var i = 0; i < ss.length; i++) {
    if (t < ss[i].playStart + ss[i].dur) {
      idx = i;
      break;
    }
  }
  var s = ss[idx];
  var local = Math.min(Math.max(t - s.playStart, 0), s.dur);
  var T = s.authStart + (s.dur > 0 ? local * (s.nat / s.dur) : 0);
  return Math.min(T, d.authoredTotal);
}
var CC_META = Object.assign(Object.create(null), {
  toString: 1,
  toLocaleString: 1,
  valueOf: 1,
  toJSON: 1,
  then: 1,
  constructor: 1,
  hasOwnProperty: 1,
  isPrototypeOf: 1,
  propertyIsEnumerable: 1,
  default: 1
});
function ccCueProxy(table, unknownRef) {
  if (typeof Proxy !== 'function') return table;
  return new Proxy(table, {
    get: function (target, prop) {
      if (typeof prop !== 'string' || prop in target) return target[prop];
      if (CC_META[prop] || prop.indexOf('@@') === 0) return Object.prototype[prop];
      unknownRef.current[prop] = true;
      return NaN;
    }
  });
}
function CcUnknownWatch(props) {
  var tl = useTimeline();
  React.useEffect(function () {
    var next = Object.keys(props.unknownRef.current).sort().join(', ');
    if (next !== props.badge) props.setBadge(next);
  }, [tl.time]);
  return null;
}
function CompositionClock(props) {
  var tl = useTimeline();
  var d = props.derived;
  var T = ccWarp(d, tl.time);
  var value = React.useMemo(function () {
    return {
      T: T,
      CUES: props.cues,
      time: tl.time,
      duration: tl.duration,
      authoredTotal: d.authoredTotal,
      playing: tl.playing || tl.extPlaying === true
    };
  }, [T, props.cues, tl.time, tl.duration, d, tl.playing, tl.extPlaying]);
  return /*#__PURE__*/React.createElement(CompositionContext.Provider, {
    value: value
  }, props.children);
}
function Shot(props) {
  var c = useComposition();
  var from = +props.from;
  var to = props.to == null ? Infinity : +props.to;
  var on = isFinite(from) && c.T >= from && c.T < to;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      visibility: on ? 'visible' : 'hidden'
    }
  }, props.children);
}
var CAPTION_FADE = 0.18;
function Captions(props) {
  var c = useComposition();
  var t = c.T;
  var items = (props.items || []).filter(function (it) {
    return it && isFinite(+it.at);
  }).sort(function (a, b) {
    return a.at - b.at;
  });
  var active = null;
  var end = Infinity;
  for (var i = 0; i < items.length; i++) {
    if (t < items[i].at) break;
    active = items[i];
    end = typeof active.until === 'number' && isFinite(active.until) ? active.until : i + 1 < items.length ? items[i + 1].at : Infinity;
  }
  if (!active || t >= end) return null;
  var o = Math.min(1, (t - active.at) / CAPTION_FADE);
  if (isFinite(end)) o = Math.min(o, (end - t) / CAPTION_FADE);
  o = Math.max(0, Math.min(1, o));
  return /*#__PURE__*/React.createElement("div", {
    "data-om-caption": true,
    style: Object.assign({
      position: 'absolute',
      left: '8%',
      right: '8%',
      bottom: '7%',
      textAlign: 'center',
      opacity: o,
      pointerEvents: 'none',
      font: '500 30px Inter, system-ui, sans-serif',
      color: '#f6f4ef',
      textShadow: '0 1px 14px rgba(0,0,0,0.45)'
    }, props.style)
  }, active.text);
}
function CompositionStage(props) {
  var width = +props.width || 1280;
  var height = +props.height || 720;
  var bg = props.bg || '#0b0b0e';
  var autoplay = props.autoplay == null ? true : String(props.autoplay) !== 'false';
  var loop = props.loop == null ? true : String(props.loop) !== 'false';
  var state = React.useState(props.scenes);
  var raw = state[0];
  var setRaw = state[1];
  var scenes = React.useMemo(function () {
    return ssParse(raw);
  }, [raw]);
  var pstate = React.useState(props.playback);
  var praw = pstate[0];
  var setPraw = pstate[1];
  var pb = React.useMemo(function () {
    return ppParse(praw);
  }, [praw]);
  var unknownRef = React.useRef({});
  var badgeState = React.useState('');
  var badge = badgeState[0];
  var setBadge = badgeState[1];
  var derived = React.useMemo(function () {
    unknownRef.current = {};
    return scenes ? ccDerive(scenes) : null;
  }, [scenes]);
  var cues = React.useMemo(function () {
    return derived ? ccCueProxy(derived.table, unknownRef) : null;
  }, [derived]);
  React.useEffect(function () {
    var next = Object.keys(unknownRef.current).sort().join(', ');
    if (next !== badge) setBadge(next);
  });
  if (!scenes) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0b0e',
        color: '#c96442',
        font: '500 16px Inter, system-ui, sans-serif',
        textAlign: 'center'
      }
    }, "animations-v3: the scenes prop isn't a valid JSON scene list", /*#__PURE__*/React.createElement("br", null), "(expected '[", '{', "\"name\":\"\u2026\",\"dur\":N", '}', ", \u2026]')");
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Stage, {
    width: width,
    height: height,
    duration: derived.total,
    background: bg,
    autoplay: autoplay,
    loop: loop,
    playback: pb
  }, /*#__PURE__*/React.createElement(SceneSync, {
    raw: raw,
    onUpdate: setRaw
  }), typeof praw === 'string' && praw !== '' && /*#__PURE__*/React.createElement(PlaybackSync, {
    raw: praw,
    onUpdate: setPraw
  }), /*#__PURE__*/React.createElement(CompositionClock, {
    derived: derived,
    cues: cues
  }, props.children), /*#__PURE__*/React.createElement(CcUnknownWatch, {
    unknownRef: unknownRef,
    badge: badge,
    setBadge: setBadge
  })), badge !== '' &&
  /*#__PURE__*/
  // Sibling of Stage, outside the exportable <svg>: visible in the
  // preview (and its screenshots), never in the exported video.
  React.createElement("div", {
    "data-om-unknown-cues": true,
    style: {
      position: 'absolute',
      left: 12,
      bottom: 56,
      zIndex: 10,
      padding: '6px 10px',
      borderRadius: 6,
      background: 'rgba(0,0,0,0.72)',
      color: '#e8906a',
      font: '500 12px Inter, system-ui, sans-serif',
      pointerEvents: 'none'
    }
  }, "choreography references unknown section", badge.indexOf(',') >= 0 ? 's' : '', ": ", badge));
}

// Strokes as layers: paint multiplies, so stroke images stacked with
// mix-blend-mode:multiply over the paper reproduce the flat render.

var WC_PIXEL_CAP = 11000000;
function wcLayerOpts(props) {
  var w = +props.width || 900,
    h = +props.height || 1200;
  var askScale = +props.scale || 1;
  return {
    width: w,
    height: h,
    scale: Math.min(askScale, Math.sqrt(WC_PIXEL_CAP / (w * h))),
    seed: props.seed == null ? undefined : +props.seed,
    quality: props.quality == null ? undefined : +props.quality
  };
}
var wcWarned = {};
function wcWarnOnce(key, message, err) {
  if (wcWarned[key]) return;
  wcWarned[key] = true;
  console.warn(message, err);
}
function useWatercolorLayers(painting, opts) {
  var kit = window.WatercolorKit;
  if (typeof painting !== 'function' || !kit || typeof kit.layers !== 'function') return null;
  try {
    return kit.layers(painting, wcLayerOpts(opts || {}));
  } catch (e) {
    wcWarnOnce('layers:' + e, 'watercolor painting failed to build; rendering the fallback sheet', e);
    return null;
  }
}
var WatercolorSheetContext = React.createContext(null);
function WatercolorSheet(props) {
  var L = props.layers || null;
  var style = Object.assign({
    position: 'relative',
    display: 'block',
    width: '100%',
    aspectRatio: L ? L.width + ' / ' + L.height : '3 / 4',
    isolation: 'isolate',
    overflow: 'hidden'
  }, props.style);
  if (!L) {
    return /*#__PURE__*/React.createElement("div", {
      style: Object.assign(style, {
        background: '#f4f1e8',
        color: '#8a8270',
        font: '12px system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      })
    }, "watercolor-kit.js not loaded (or the painting failed to build)");
  }
  return /*#__PURE__*/React.createElement(WatercolorSheetContext.Provider, {
    value: L
  }, /*#__PURE__*/React.createElement("div", {
    style: style,
    "data-om-watercolor-sheet": true
  }, /*#__PURE__*/React.createElement("img", {
    src: L.paper,
    alt: props.alt || '',
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      display: 'block'
    }
  }), props.children));
}
function WatercolorStroke(props) {
  var fromSheet = React.useContext(WatercolorSheetContext);
  var L = props.layers || fromSheet;
  if (!L) return null;
  var i = +props.index;
  if (!(i >= 0) || i >= L.count) return null;
  var at = props.at == null ? 1 : clamp(+props.at, 0, 1);
  if (!(at > 0)) return null;
  var box, src;
  try {
    box = L.box(i);
    src = box ? L.src(i, at) : null;
  } catch (e) {
    wcWarnOnce('stroke:' + i + ':' + e, 'watercolor stroke ' + i + ' failed to render; skipping it', e);
    return null;
  }
  if (!box || !src) return null;
  var style = Object.assign({
    position: 'absolute',
    display: 'block',
    left: box.x * 100 + '%',
    top: box.y * 100 + '%',
    width: box.w * 100 + '%',
    height: box.h * 100 + '%',
    mixBlendMode: L.kind(i) === 'reserve' ? 'normal' : 'multiply',
    pointerEvents: 'none'
  }, props.style);
  return /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    "data-om-watercolor-stroke": i,
    "data-om-stroke-kind": L.kind(i),
    style: style
  });
}

// The default watercolor moment: the painting assembled from its strokes,
// each appearing in painting order (a pure function of T).
function WatercolorPainting(props) {
  var c = useComposition();
  var from = +props.from || 0;
  var to = props.to == null ? from + 6 : +props.to;
  var u = clamp((c.T - from) / Math.max(to - from, 0.001), 0, 1);
  var eased = Easing.easeInOutQuad(u);
  var L = useWatercolorLayers(props.painting, props);
  var tick = React.useState(0)[1];
  var warmed = React.useRef(null);
  React.useEffect(function () {
    if (!L || typeof L.warm !== 'function') return;
    var p = L.warm();
    if (warmed.current === p) return;
    var live = true;
    p.then(function () {
      warmed.current = p;
      if (live) tick(function (x) {
        return x + 1;
      });
    });
    return function () {
      live = false;
    };
  }, [L && L.paper, props.painting]);
  var strokes = [];
  if (L) {
    for (var i = 0; i < L.count; i++) {
      var sp = L.span(i);
      var at = clamp((eased - sp.from) / Math.max(sp.to - sp.from, 1e-6), 0, 1);
      if (at <= 0) break;
      strokes.push(/*#__PURE__*/React.createElement(WatercolorStroke, {
        key: i,
        layers: L,
        index: i,
        at: at
      }));
    }
  }
  return /*#__PURE__*/React.createElement(WatercolorSheet, {
    layers: L,
    style: props.style,
    alt: props.alt
  }, strokes);
}

// Paint-on watercolor reveal as a pure function of T — an <img> with a data:
// URL (the exporter serializes those as-is; a live canvas would export blank).
function WatercolorReveal(props) {
  var c = useComposition();
  var from = +props.from || 0;
  var to = props.to == null ? from + 6 : +props.to;
  var u = clamp((c.T - from) / Math.max(to - from, 0.001), 0, 1);
  var style = Object.assign({
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  }, props.style);
  var frames = Array.isArray(props.frames) && props.frames.length ? props.frames : null;
  var steps = frames ? frames.length - 1 : Math.max(1, Math.round(+props.steps || 36));
  var i = Math.min(steps, Math.round(Easing.easeInOutQuad(u) * steps));
  var painting = typeof props.painting === 'function' ? props.painting : null;
  var kit = window.WatercolorKit;
  var w = +props.width || 900,
    h = +props.height || 1200;
  var askScale = +props.scale || Math.min(2, window.devicePixelRatio || 1);
  var opts = {
    width: w,
    height: h,
    scale: Math.min(askScale, Math.sqrt(11000000 / (w * h))),
    seed: props.seed == null ? undefined : +props.seed,
    steps: steps,
    type: props.format || 'image/jpeg',
    quality: props.quality == null ? 0.88 : +props.quality
  };
  var key = opts.width + 'x' + opts.height + '#' + opts.seed + '@' + opts.scale + '/' + steps + ':' + opts.type + '/' + opts.quality;
  var cache = React.useRef({
    fn: null,
    key: '',
    frames: {},
    baking: false
  }).current;
  var tick = React.useState(0)[1];
  if (cache.fn !== painting && String(cache.fn) !== String(painting) || cache.key !== key) {
    cache.key = key;
    cache.frames = {};
    cache.baking = false;
  }
  cache.fn = painting;
  React.useEffect(function () {
    if (frames || cache.baking || !painting || !kit || typeof kit.bake !== 'function') return;
    cache.baking = true;
    var target = cache.frames;
    try {
      kit.bake(painting, opts, function (n, _t, url) {
        target[n] = url;
      }).then(function (all) {
        if (cache.frames !== target) return;
        for (var n = 0; n < all.length; n++) target[n] = all[n];
        tick(function (x) {
          return x + 1;
        });
      }).catch(function () {
        /* failed bake: the guarded lazy path below still renders */
      });
    } catch (e) {
      /* oversized painting: the guarded lazy path below still renders */
    }
  });
  if (frames) return /*#__PURE__*/React.createElement("img", {
    src: frames[i],
    alt: props.alt || '',
    style: style
  });
  if (!kit || !painting) {
    return /*#__PURE__*/React.createElement("div", {
      style: Object.assign({
        width: '100%',
        height: '100%',
        background: '#f4f1e8',
        color: '#8a8270',
        font: '12px system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }, props.style)
    }, "watercolor-kit.js not loaded (or no painting function)");
  }
  if (!cache.frames[i]) {
    try {
      cache.frames[i] = kit.frame(painting, Object.assign({}, opts, {
        at: i / steps
      }));
    } catch (e) {
      return /*#__PURE__*/React.createElement("div", {
        style: Object.assign({
          width: '100%',
          height: '100%',
          background: '#f4f1e8',
          color: '#8a8270',
          font: '12px system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }, props.style)
      }, "painting too large to render (", String(e && e.message).slice(0, 80), ")");
    }
  }
  return /*#__PURE__*/React.createElement("img", {
    src: cache.frames[i],
    alt: props.alt || '',
    style: style
  });
}
Object.assign(window, {
  Easing,
  interpolate,
  animate,
  clamp,
  TimelineContext,
  useTime,
  useTimeline,
  Stage,
  PlaybackBar,
  CompositionStage,
  useComposition,
  Shot,
  Captions,
  WatercolorReveal,
  WatercolorPainting,
  WatercolorSheet,
  WatercolorStroke,
  useWatercolorLayers
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "logo-anim/animations-v3.jsx", error: String((e && e.message) || e) }); }

// logo-anim/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // data-om-starter: inert presence marker — Claude Design's starter-usage
  // probe reads it. The closed panel renders nothing, so the marker rides
  // the <html> element as an attribute instead of a rendered node — zero
  // elements added, so page CSS (even structural selectors like
  // :nth-child) can never observe it. It records that the page WIRES a
  // tweaks panel, whether or not the panel is open. Keep this effect.
  React.useEffect(() => {
    document.documentElement.setAttribute('data-om-starter', 'tweaks-panel');
    return () => document.documentElement.removeAttribute('data-om-starter');
  }, []);
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "logo-anim/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Contact.jsx
try { (() => {
function ContactPage({
  notify
}) {
  const {
    Input,
    Select,
    Checkbox,
    Radio,
    Switch,
    Button,
    Dialog,
    ArchFrame,
    Icon
  } = window.DeCroquiDesignSystem_5f8fc8;
  const [rooms, setRooms] = React.useState({
    Salas: true,
    Cozinhas: false,
    Quartos: false,
    Banhos: false
  });
  const [plan, setPlan] = React.useState('projeto');
  const [news, setNews] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [err, setErr] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const submit = () => {
    if (!/.+@.+\..+/.test(email)) {
      setErr('Verifique o endereço de e-mail');
      return;
    }
    setErr('');
    setOpen(true);
  };
  return /*#__PURE__*/React.createElement("main", {
    style: {
      padding: '170px var(--gutter) 120px',
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 1.2fr',
      gap: 96
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '300 80px/1 var(--font-display)',
      letterSpacing: '-.015em'
    }
  }, "Vamos conversar sobre a ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: 'var(--text-brand)'
    }
  }, "sua casa.")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-lead)',
      color: 'var(--text-secondary)',
      maxWidth: 420
    }
  }, "Conte um pouco sobre o espa\xE7o e o que voc\xEA imagina. Respondemos em at\xE9 dois dias \xFAteis."), /*#__PURE__*/React.createElement(ArchFrame, {
    shape: "arch",
    ratio: "4 / 3.4",
    tone: "stone",
    label: "Foto \xB7 est\xFAdio",
    style: {
      maxWidth: 420
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      font: '300 15px/1.4 var(--font-body)',
      color: 'var(--text-secondary)'
    }
  }, [['map-pin', 'Rua Oscar Freire, 1200 — São Paulo'], ['mail', 'ola@decroqui.com'], ['instagram', '@decroqui']].map(([i, t]) => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: i,
    size: 18,
    style: {
      color: 'var(--vinho-800)'
    }
  }), t)))), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      submit();
    },
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 32,
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 28
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Nome",
    placeholder: "Como gostaria de ser chamado"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "E-mail",
    type: "email",
    placeholder: "voce@email.com",
    value: email,
    onChange: e => setEmail(e.target.value),
    error: err
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Tipo de projeto",
    placeholder: "Selecione",
    options: ['Residencial', 'Comercial', 'Hospitalidade']
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Cidade",
    placeholder: "S\xE3o Paulo"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1 var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, "Ambientes"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 28,
      flexWrap: 'wrap'
    }
  }, Object.keys(rooms).map(r => /*#__PURE__*/React.createElement(Checkbox, {
    key: r,
    label: r,
    checked: rooms[r],
    onChange: v => setRooms({
      ...rooms,
      [r]: v
    })
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1 var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, "Servi\xE7o"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Radio, {
    name: "plano",
    value: "consultoria",
    label: "Consultoria",
    description: "Uma visita, um croqui e uma paleta.",
    checked: plan === 'consultoria',
    onChange: setPlan
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "plano",
    value: "projeto",
    label: "Projeto completo",
    description: "Do conceito \xE0 obra entregue.",
    checked: plan === 'projeto',
    onChange: setPlan
  }))), /*#__PURE__*/React.createElement(Input, {
    label: "Conte-nos sobre o seu espa\xE7o",
    multiline: true,
    rows: 4,
    variant: "box",
    placeholder: "O que voc\xEA guarda, o que voc\xEA sonha\u2026"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Receber nosso caderno mensal",
    checked: news,
    onChange: setNews
  }), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    iconRight: "arrow-right"
  }, "Enviar pedido"))), /*#__PURE__*/React.createElement(Dialog, {
    open: open,
    onClose: () => setOpen(false),
    eyebrow: "Quase l\xE1",
    title: "Quer j\xE1 marcar a primeira conversa?",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => {
        setOpen(false);
        notify();
      }
    }, "Depois"), /*#__PURE__*/React.createElement(Button, {
      iconRight: "calendar",
      onClick: () => {
        setOpen(false);
        notify();
      }
    }, "Escolher hor\xE1rio"))
  }, "Recebemos seus dados. Se preferir, escolha j\xE1 um hor\xE1rio de 40 minutos para conversarmos por v\xEDdeo ou no est\xFAdio."));
}
window.ContactPage = ContactPage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Contact.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Footer.jsx
try { (() => {
function SiteFooter({
  go
}) {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--noite-900)',
      color: 'var(--linho-100)',
      padding: '88px var(--gutter) 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr',
      gap: 48
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/decroqui-imagotipo-horizontal-claro.svg",
    alt: "De.Croqui",
    style: {
      width: 300,
      maxWidth: '100%',
      height: 'auto',
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '300 15px/1.6 var(--font-body)',
      color: 'var(--ardosia-300)',
      maxWidth: 340
    }
  }, "Interiores com est\xE9tica mediterr\xE2nea. S\xE3o Paulo \xB7 Lisboa.")), [['Estúdio', [['portfolio', 'Portfólio'], ['estudio', 'Sobre nós'], ['contato', 'Contato']]], ['Siga', [['', 'Instagram'], ['', 'Pinterest'], ['', 'Caderno mensal']]]].map(([h, ls]) => /*#__PURE__*/React.createElement("div", {
    key: h,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1 var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--ardosia-300)',
      marginBottom: 6
    }
  }, h), ls.map(([id, l]) => /*#__PURE__*/React.createElement("a", {
    key: l,
    onClick: () => id && go(id),
    style: {
      cursor: 'pointer',
      color: 'var(--linho-100)',
      textDecoration: 'none',
      font: '300 16px/1 var(--font-body)'
    }
  }, l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '72px auto 0',
      paddingTop: 24,
      borderTop: '1px solid var(--border-on-dark)',
      display: 'flex',
      justifyContent: 'space-between',
      font: '400 12px/1 var(--font-body)',
      color: 'var(--ardosia-300)',
      letterSpacing: '.04em'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 De.Croqui Interiores"), /*#__PURE__*/React.createElement("span", null, "Feito \xE0 m\xE3o, desde o croqui.")));
}
window.SiteFooter = SiteFooter;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Footer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Header.jsx
try { (() => {
function SiteHeader({
  page,
  go,
  onDark
}) {
  const {
    Button,
    IconButton
  } = window.DeCroquiDesignSystem_5f8fc8;
  const fg = onDark ? 'var(--linho-50)' : 'var(--text-primary)';
  const links = [['portfolio', 'Portfólio'], ['estudio', 'Estúdio'], ['contato', 'Contato']];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '28px var(--gutter)',
      color: fg
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: () => go('home'),
    "aria-label": "De.Croqui \u2014 in\xEDcio",
    style: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: '../../assets/logo/decroqui-imagotipo-horizontal-' + (onDark ? 'claro' : 'escuro') + '.svg',
    alt: "De.Croqui",
    style: {
      height: 40,
      width: 'auto',
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 36
    }
  }, links.map(([id, l]) => /*#__PURE__*/React.createElement("a", {
    key: id,
    onClick: () => go(id),
    style: {
      cursor: 'pointer',
      color: fg,
      textDecoration: 'none',
      font: '500 12px/1 var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      paddingBottom: 4,
      borderBottom: '1px solid ' + (page === id ? 'currentColor' : 'transparent')
    }
  }, l)), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: onDark ? 'light' : 'primary',
    onClick: () => go('contato')
  }, "Agende uma conversa")));
}
window.SiteHeader = SiteHeader;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Home.jsx
try { (() => {
function Eyebrow({
  children,
  color = 'var(--text-brand)'
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1 var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color
    }
  }, children);
}
function HomePage({
  go,
  openProject
}) {
  const {
    Button,
    ArchFrame,
    Card,
    Icon
  } = window.DeCroquiDesignSystem_5f8fc8;
  const P = window.DC_PROJECTS;
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      minHeight: 760,
      background: 'var(--noite-900)',
      color: 'var(--linho-50)',
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      alignItems: 'end',
      gap: 64,
      padding: '160px var(--gutter) 72px',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 32,
      paddingBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    color: "var(--ardosia-300)"
  }, "Est\xFAdio de interiores \xB7 Brasil & Portugal"), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '300 96px/1 var(--font-display)',
      letterSpacing: '-.015em',
      color: 'var(--linho-50)'
    }
  }, "Casas que contam ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: 'var(--linho-200)'
    }
  }, "a sua hist\xF3ria.")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-lead)',
      color: 'var(--ardosia-200)',
      maxWidth: 460
    }
  }, "Do primeiro croqui \xE0 \xFAltima pe\xE7a, desenhamos interiores mediterr\xE2neos com pedra natural, metal, luz e plantas."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "light",
    iconRight: "arrow-right",
    onClick: () => go('contato')
  }, "Agende uma conversa"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: () => go('portfolio'),
    style: {
      color: 'var(--linho-50)'
    }
  }, "Ver portf\xF3lio"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 20,
      alignItems: 'end'
    }
  }, /*#__PURE__*/React.createElement(ArchFrame, {
    shape: "arch",
    ratio: "3 / 4.4",
    tone: "wine",
    label: "Foto \xB7 sala Casa Alecrim"
  }), /*#__PURE__*/React.createElement(ArchFrame, {
    shape: "arch",
    ratio: "3 / 4",
    tone: "slate",
    label: "Detalhe \xB7 travertino"
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '120px var(--gutter)',
      display: 'grid',
      gridTemplateColumns: '1fr 1.4fr',
      gap: 80,
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "O conceito antes da forma"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 40px/1.25 var(--font-display)',
      color: 'var(--text-primary)'
    }
  }, "Cada projeto come\xE7a por um croqui feito \xE0 m\xE3o, na sua casa, ouvindo o que voc\xEA guarda e o que voc\xEA sonha. \xC9 dele que nascem a paleta, os materiais e cada pe\xE7a.")), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '0 var(--gutter) 120px',
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'end',
      marginBottom: 40
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '300 56px/1.05 var(--font-display)'
    }
  }, "Projetos recentes"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    iconRight: "arrow-right",
    onClick: () => go('portfolio')
  }, "Todos os projetos")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 32
    }
  }, P.slice(0, 3).map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.id,
    eyebrow: p.type + ' · ' + p.place,
    title: p.name,
    imageLabel: 'Foto · ' + p.name,
    onClick: () => openProject(p.id)
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--linho-200)',
      padding: '100px var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 48
    }
  }, [['pen-tool', '01 · Croqui', 'Uma visita e uma conversa longa. Saímos com o primeiro desenho.'], ['gem', '02 · Matéria', 'Pedras, metais e tecidos escolhidos com você, na mão.'], ['house', '03 · Casa', 'Acompanhamos a obra até a última planta no lugar.']].map(([i, t, d]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      borderTop: '1px solid var(--border-strong)',
      paddingTop: 24
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: i,
    size: 28,
    style: {
      color: 'var(--vinho-800)'
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: '400 30px/1.1 var(--font-display)'
    }
  }, t), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-lead)',
      fontSize: 16,
      color: 'var(--text-secondary)'
    }
  }, d))))));
}
Object.assign(window, {
  HomePage,
  Eyebrow
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Portfolio.jsx
try { (() => {
function PortfolioPage({
  openProject
}) {
  const {
    Tag,
    Card,
    Tabs
  } = window.DeCroquiDesignSystem_5f8fc8;
  const [room, setRoom] = React.useState('Todos');
  const [type, setType] = React.useState('todos');
  const P = window.DC_PROJECTS.filter(p => (room === 'Todos' || p.room === room) && (type === 'todos' || p.type === type));
  return /*#__PURE__*/React.createElement("main", {
    style: {
      padding: '170px var(--gutter) 120px',
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 48,
      alignItems: 'end',
      marginBottom: 56
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '300 88px/1 var(--font-display)',
      letterSpacing: '-.015em'
    }
  }, "Portf\xF3lio"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-lead)',
      color: 'var(--text-secondary)',
      maxWidth: 440
    }
  }, "Resid\xEAncias, hot\xE9is e restaurantes desenhados entre o Brasil e o Mediterr\xE2neo.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 24,
      marginBottom: 48,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    items: [{
      id: 'todos',
      label: 'Todos'
    }, 'Residencial', 'Comercial', 'Hospitalidade'],
    value: type,
    onChange: setType,
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, ['Todos', 'Salas', 'Cozinhas', 'Quartos', 'Banhos'].map(r => /*#__PURE__*/React.createElement(Tag, {
    key: r,
    selected: room === r,
    onClick: () => setRoom(r)
  }, r)))), P.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'italic 300 28px/1.3 var(--font-display)',
      color: 'var(--text-secondary)',
      padding: '80px 0'
    }
  }, "Ainda n\xE3o h\xE1 projetos nesta combina\xE7\xE3o.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: '56px 32px'
    }
  }, P.map((p, i) => /*#__PURE__*/React.createElement(Card, {
    key: p.id,
    shape: i % 3 === 1 ? 'arch' : 'soft',
    eyebrow: p.type + ' · ' + p.year,
    title: p.name,
    meta: p.place,
    imageLabel: 'Foto · ' + p.name,
    onClick: () => openProject(p.id)
  }))));
}
window.PortfolioPage = PortfolioPage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Portfolio.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Project.jsx
try { (() => {
function ProjectPage({
  id,
  go,
  openProject
}) {
  const {
    ArchFrame,
    Tabs,
    Tag,
    Badge,
    Button,
    IconButton,
    Tooltip
  } = window.DeCroquiDesignSystem_5f8fc8;
  const all = window.DC_PROJECTS;
  const idx = Math.max(0, all.findIndex(p => p.id === id));
  const p = all[idx];
  const next = all[(idx + 1) % all.length];
  const [tab, setTab] = React.useState('conceito');
  const [saved, setSaved] = React.useState(false);
  const swatches = [['Travertino', 'var(--linho-300)'], ['Latão', 'var(--latao-500)'], ['Laca ardósia', 'var(--ardosia-500)'], ['Oliveira', 'var(--oliva-600)'], ['Vinho', 'var(--vinho-800)']];
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '160px var(--gutter) 64px',
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 64,
      alignItems: 'end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "navy"
  }, p.type), /*#__PURE__*/React.createElement(Badge, null, p.room)), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '300 96px/1 var(--font-display)',
      letterSpacing: '-.015em'
    }
  }, p.name), /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--type-lead)',
      color: 'var(--text-secondary)',
      maxWidth: 460
    }
  }, p.blurb)), /*#__PURE__*/React.createElement("dl", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 24,
      margin: 0,
      borderTop: '1px solid var(--border-strong)',
      paddingTop: 20
    }
  }, [['Local', p.place], ['Área', p.area], ['Ano', p.year]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("dt", {
    style: {
      font: '500 11px/1 var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: 10
    }
  }, k), /*#__PURE__*/React.createElement("dd", {
    style: {
      margin: 0,
      font: '400 24px/1.1 var(--font-display)'
    }
  }, v))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '0 var(--gutter)',
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(ArchFrame, {
    shape: "soft",
    ratio: "16 / 8",
    tone: p.tone,
    label: 'Foto principal · ' + p.name
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 20,
      right: 20,
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    variant: "glass",
    icon: "heart",
    label: saved ? 'Salvo' : 'Salvar',
    onClick: () => setSaved(!saved),
    style: saved ? {
      background: 'var(--vinho-800)'
    } : undefined
  }), /*#__PURE__*/React.createElement(IconButton, {
    variant: "glass",
    icon: "share-2",
    label: "Compartilhar"
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '80px var(--gutter) 100px',
      maxWidth: 'var(--container-max)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    items: [{
      id: 'conceito',
      label: 'Conceito'
    }, {
      id: 'materiais',
      label: 'Materiais'
    }, {
      id: 'galeria',
      label: 'Galeria'
    }],
    value: tab,
    onChange: setTab
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 48,
      minHeight: 300
    }
  }, tab === 'conceito' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.3fr 1fr',
      gap: 64
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 36px/1.3 var(--font-display)'
    }
  }, "\u201CQuer\xEDamos uma casa que parecesse ter estado sempre aqui.\u201D A partir dessa frase, o croqui inicial organizou a casa em torno de um p\xE1tio, com arcos que filtram a luz."), /*#__PURE__*/React.createElement(ArchFrame, {
    shape: "arch",
    ratio: "3 / 4",
    tone: "stone",
    label: "Croqui original"
  })), tab === 'materiais' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20
    }
  }, swatches.map(([n, c]) => /*#__PURE__*/React.createElement(Tooltip, {
    key: n,
    label: n
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 96,
      height: 128,
      background: c,
      backgroundImage: 'var(--grain)',
      borderRadius: 'var(--radius-arch-soft)',
      display: 'inline-block'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, p.materials.map(m => /*#__PURE__*/React.createElement(Tag, {
    key: m
  }, m)))), tab === 'galeria' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 20
    }
  }, ['Sala', 'Pátio', 'Detalhe de marcenaria'].map((l, i) => /*#__PURE__*/React.createElement(ArchFrame, {
    key: l,
    shape: i === 1 ? 'arch' : 'rect',
    ratio: "3 / 4",
    tone: ['stone', 'slate', 'wine'][i],
    label: l
  }))))), /*#__PURE__*/React.createElement("section", {
    onClick: () => openProject(next.id),
    style: {
      cursor: 'pointer',
      background: 'var(--vinho-800)',
      color: 'var(--linho-50)',
      padding: '80px var(--gutter)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'end'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1 var(--font-body)',
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--vinho-200)'
    }
  }, "Pr\xF3ximo projeto"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 72px/1 var(--font-display)',
      marginTop: 16
    }
  }, next.name)), /*#__PURE__*/React.createElement(Button, {
    variant: "light",
    iconRight: "arrow-right"
  }, "Ver")));
}
window.ProjectPage = ProjectPage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Project.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/data.js
try { (() => {
window.DC_PROJECTS = [{
  id: 'alecrim',
  name: 'Casa Alecrim',
  place: 'Trancoso, BA',
  year: '2026',
  room: 'Salas',
  type: 'Residencial',
  tone: 'stone',
  area: '320 m²',
  blurb: 'Uma casa de praia em cal e travertino, onde a luz da tarde desenha o espaço.',
  materials: ['Travertino', 'Cal', 'Linho cru', 'Latão escovado', 'Oliveira']
}, {
  id: 'cipreste',
  name: 'Apartamento Cipreste',
  place: 'São Paulo, SP',
  year: '2025',
  room: 'Cozinhas',
  type: 'Residencial',
  tone: 'slate',
  area: '180 m²',
  blurb: 'Uma cozinha-ateliê em mármore e laca azul, pensada para receber.',
  materials: ['Mármore Calacatta', 'Laca ardósia', 'Ferro']
}, {
  id: 'figueira',
  name: 'Suíte Figueira',
  place: 'Lisboa, PT',
  year: '2025',
  room: 'Quartos',
  type: 'Hospitalidade',
  tone: 'wine',
  area: '64 m²',
  blurb: 'Veludo vinho, gesso e madeira escura — um quarto de hotel com memória.',
  materials: ['Veludo', 'Gesso', 'Nogueira']
}, {
  id: 'oliva',
  name: 'Casa Oliva',
  place: 'Gramado, RS',
  year: '2024',
  room: 'Banhos',
  type: 'Residencial',
  tone: 'night',
  area: '410 m²',
  blurb: 'Banhos em pedra moledo e metais envelhecidos, voltados ao jardim.',
  materials: ['Pedra moledo', 'Latão envelhecido', 'Resina']
}, {
  id: 'loureiro',
  name: 'Restaurante Loureiro',
  place: 'Rio de Janeiro, RJ',
  year: '2024',
  room: 'Salas',
  type: 'Comercial',
  tone: 'slate',
  area: '220 m²',
  blurb: 'Arcos, azulejo artesanal e plantas pendentes.',
  materials: ['Azulejo', 'Terracota', 'Ferro']
}, {
  id: 'jasmim',
  name: 'Casa Jasmim',
  place: 'Campinas, SP',
  year: '2023',
  room: 'Quartos',
  type: 'Residencial',
  tone: 'stone',
  area: '260 m²',
  blurb: 'Um refúgio de linho e pedra para uma família de cinco.',
  materials: ['Linho', 'Travertino', 'Rattan']
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/data.js", error: String((e && e.message) || e) }); }

__ds_ns.ArchFrame = __ds_scope.ArchFrame;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
