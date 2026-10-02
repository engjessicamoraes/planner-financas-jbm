/* ============================================================
   CASCA DO FINANÇAS — v40
   - Barra superior fixa: Pessoal | Empresa | Tarefas, botão Lançar,
     indicador da nuvem e Configurações.
   - O contexto (Pessoal ou Empresa) define quais grupos aparecem no
     menu lateral e qual tela abre ao trocar de aba.
   - Botões de backup saem do menu lateral e vão para Configurações.
   - No celular: barra inferior com atalhos e botão "+".
   ============================================================ */
(function(){
  'use strict';
  function $(s,r){return (r||document).querySelector(s);}
  function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  var CTX_SK='v40-contexto';
  var VIEWS_EMPRESA=['receitas','parcelamentos','bm-painel','bm-despesas','bm-dividas','bm-relatorio'];
  var ICO={
    pessoal:'<svg viewBox="0 0 16 16"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>',
    empresa:'<svg viewBox="0 0 16 16"><rect x="2" y="6" width="12" height="9" rx="1"/><path d="M5 6V4a3 3 0 0 1 6 0v2"/></svg>',
    tarefas:'<svg viewBox="0 0 16 16"><path d="M3 8l3 3 7-7"/><rect x="1" y="1" width="14" height="14" rx="3"/></svg>',
    mais:'<svg viewBox="0 0 16 16"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>',
    cfg:'<svg viewBox="0 0 16 16"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/><circle cx="5" cy="4" r="1.6" fill="#4B1F39"/><circle cx="11" cy="8" r="1.6" fill="#4B1F39"/><circle cx="7" cy="12" r="1.6" fill="#4B1F39"/></svg>',
    painel:'<svg viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.3"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.3"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.3"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.3"/></svg>',
    mes:'<svg viewBox="0 0 16 16"><rect x="1.5" y="3" width="13" height="11.5" rx="2"/><line x1="5" y1="1.5" x2="5" y2="4.5"/><line x1="11" y1="1.5" x2="11" y2="4.5"/><line x1="1.5" y1="7.5" x2="14.5" y2="7.5"/></svg>',
    contas:'<svg viewBox="0 0 16 16"><path d="M3 2h10v12l-2-1.3L9 14l-2-1.3L5 14l-2-1.3z"/><line x1="5.5" y1="6" x2="10.5" y2="6"/><line x1="5.5" y1="9" x2="9" y2="9"/></svg>',
    receitas:'<svg viewBox="0 0 16 16"><polyline points="1,12 5,7 8,9 11,4 15,2"/></svg>',
    receber:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5v7M10.2 6.2c-.4-.8-1.2-1.2-2.2-1.2-1.2 0-2 .6-2 1.5 0 2 4.4 1 4.4 3 0 .9-.9 1.6-2.2 1.6-1 0-1.9-.4-2.3-1.2"/></svg>',
    despesas:'<svg viewBox="0 0 16 16"><rect x="1.5" y="3.5" width="13" height="9" rx="1.8"/><line x1="1.5" y1="6.5" x2="14.5" y2="6.5"/><line x1="4" y1="10" x2="7" y2="10"/></svg>',
    dividas:'<svg viewBox="0 0 16 16"><rect x="1" y="4" width="14" height="10" rx="2"/><path d="M5 4V3a3 3 0 0 1 6 0v1"/><line x1="8" y1="8" x2="8" y2="11"/></svg>',
    relatorio:'<svg viewBox="0 0 16 16"><path d="M3 2h7l3 3v9H3z"/><polyline points="10,2 10,5 13,5"/><line x1="5.5" y1="8" x2="10.5" y2="8"/><line x1="5.5" y1="11" x2="9" y2="11"/></svg>'
  };

  var contexto='pessoal';
  try{
    var h=(location.hash||'').replace('#','');
    if(h==='empresa'||h==='pessoal')contexto=h;
    else contexto=localStorage.getItem(CTX_SK)==='empresa'?'empresa':'pessoal';
  }catch(e){}

  /* ---------- barra superior ---------- */
  function montarTopo(){
    if($('#app-top'))return;
    var top=document.createElement('header');top.id='app-top';
    top.innerHTML=
      '<div class="at-brand"><div class="at-logo"><svg viewBox="0 0 16 16"><polyline points="1,12 5,7 8,9 11,4 15,2"/><polyline points="11,2 15,2 15,6"/></svg></div><div class="at-nome">Finanças '+ANO_PLANILHA+'<small>Eng. Jéssica Moraes · B&amp;M</small></div></div>'+
      '<nav class="appsw" aria-label="Área">'+
        '<a data-ctx="pessoal">'+ICO.pessoal+'Pessoal</a>'+
        '<a data-ctx="empresa">'+ICO.empresa+'Empresa</a>'+
        '<a href="tarefas.html">'+ICO.tarefas+'Tarefas</a>'+
      '</nav>'+
      '<div class="at-dir">'+
        '<button class="at-lancar" type="button" id="at-lancar">'+ICO.mais+'Lançar</button>'+
        '<button class="nv-pill" type="button" id="nv-pill" data-estado="local" title=""><i></i><span>…</span></button>'+
        '<button class="at-ico" type="button" id="at-cfg" title="Configurações, backup e importação" aria-label="Configurações">'+ICO.cfg+'</button>'+
      '</div>';
    document.body.insertBefore(top,document.body.firstChild);
    document.body.classList.add('v40');
    /* O botão ☰ do menu móvel (com seus eventos) passa para a barra nova. */
    moverBotaoMenu();
    $$('.appsw a[data-ctx]',top).forEach(function(a){a.onclick=function(){trocarContexto(a.getAttribute('data-ctx'),true);};});
    $('#at-lancar').onclick=lancarRapido;
    $('#at-cfg').onclick=abrirConfig;
    $('#nv-pill').onclick=abrirConfig;
    var pagHide=$('#aviso-modo-local');if(pagHide)pagHide.remove();
  }

  /* O botão ☰ do menu móvel (criado por uma camada anterior, com seus
     eventos) passa para a barra nova; a barra antiga fica oculta. */
  function moverBotaoMenu(){
    var top=$('#app-top'),mb=$('#mobile-appbar .mobile-menu-btn');
    if(top&&mb)top.insertBefore(mb,top.firstChild);
  }

  /* ---------- contexto Pessoal / Empresa ---------- */
  function aplicarClasse(){
    document.body.classList.toggle('ctx-empresa',contexto==='empresa');
    document.body.classList.toggle('ctx-pessoal',contexto!=='empresa');
    $$('#app-top .appsw a[data-ctx]').forEach(function(a){a.classList.toggle('on',a.getAttribute('data-ctx')===contexto);});
    var t=$('#sb-ctx-tit');
    if(t)t.innerHTML=contexto==='empresa'?'B&amp;M Soluções<small>Finanças da empresa</small>':'Finanças pessoais<small>Cartão, conta, contas e dívidas</small>';
    try{localStorage.setItem(CTX_SK,contexto);}catch(e){}
    try{history.replaceState(null,'','#'+contexto);}catch(e){}
    atualizarBottom();
  }
  function trocarContexto(c,navegar){
    contexto=c;aplicarClasse();
    if(navegar){
      if(c==='empresa')goTo('bm-painel');
      else goTo('painel');
    }
  }
  /* Ao navegar para uma tela da outra área (por um link interno), a aba acompanha. */
  function contextoDaView(v){return VIEWS_EMPRESA.indexOf(v)>=0?'empresa':'pessoal';}

  /* ---------- menu lateral ---------- */
  function itemNav(v,ico,rot){
    var d=document.createElement('div');d.className='ni';d.setAttribute('data-v',v);d.setAttribute('tabindex','0');
    d.innerHTML=ICO[ico]+rot;return d;
  }
  function arrumarMenu(){
    var nav=$('.sb-nav');if(!nav)return;
    if(!$('#sb-ctx-tit')){var t=document.createElement('div');t.id='sb-ctx-tit';t.className='sb-ctx-tit';nav.parentNode.insertBefore(t,nav);}
    var g=$('section.nav-group[data-group="empresa"] .nav-group-body',nav);
    if(g){
      var ordem=[['bm-painel','painel','Painel B&M'],['receitas'],['parcelamentos'],['bm-despesas','despesas','Despesas da empresa'],['bm-dividas','dividas','Dívidas da empresa'],['bm-relatorio','relatorio','Relatório mensal']];
      ordem.forEach(function(o){
        var n=$('.ni[data-v="'+o[0]+'"]',g)||$('.ni[data-v="'+o[0]+'"]');
        if(!n&&o[1])n=itemNav(o[0],o[1],o[2]);
        if(n)g.appendChild(n);
      });
    }
    var v=typeof vAtual!=='undefined'?vAtual:'';
    $$('.ni[data-v]').forEach(function(n){n.classList.toggle('on',n.getAttribute('data-v')===v&&v!=='mes');});
    aplicarClasse();
  }

  /* ---------- lançamento rápido ---------- */
  function lancarRapido(){
    try{
      var hoje=new Date();
      if(typeof vAtual!=='undefined'&&vAtual!=='mes'&&hoje.getFullYear()===ANO_PLANILHA){mesAtual=hoje.getMonth()+1;}
      abrirForm('cartao');
      if(hoje.getFullYear()===ANO_PLANILHA){var d=el('f-data');if(d){d.value=hoje.toISOString().slice(0,10);d.dispatchEvent(new Event('change'));d.dispatchEvent(new Event('input'));}}
      if(contexto==='empresa'){var c=el('f-cat');if(c){c.value='Trabalho / Empresa';c.dispatchEvent(new Event('change'));}}
      try{atualizarTituloModal();}catch(e){}
      var dica=el('v40-dica-emp');
      if(!dica){var w=el('f-cat-wrap');if(w){dica=document.createElement('div');dica.id='v40-dica-emp';dica.style.cssText='font-size:11px;color:#8A949F;margin-top:5px;line-height:1.4';dica.textContent='Gastos da B&M: use a categoria "Trabalho / Empresa" — eles aparecem na aba Empresa, em Despesas da empresa.';w.appendChild(dica);}}
    }catch(e){console.error(e);}
  }

  /* ---------- indicador da nuvem ---------- */
  function hhmm(ts){var d=new Date(ts);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
  var ROT={
    ok:function(d){return d.salvoEm?'Salvo às '+hhmm(d.salvoEm):'Sincronizado';},
    salvando:function(){return 'Salvando…';},
    offline:function(){return 'Sem conexão';},
    'offline-pendente':function(d){return 'Sem conexão · '+d.pendentes+' pendente(s)';},
    erro:function(){return 'Falha ao salvar';},
    local:function(){return 'Modo local';}
  };
  var DICA={
    ok:'Tudo o que está na tela já está na nuvem e aparece nos outros aparelhos.',
    salvando:'Enviando as últimas alterações para a nuvem.',
    offline:'Sem internet. O que você fizer fica guardado neste aparelho e é enviado ao reconectar.',
    'offline-pendente':'Sem internet. As alterações estão guardadas neste aparelho e serão enviadas ao reconectar.',
    erro:'A nuvem recusou a gravação. Os dados continuam neste aparelho e o envio é repetido automaticamente.',
    local:'O Firebase não carregou nesta sessão. As alterações ficam só neste navegador até você recarregar on-line.'
  };
  var ultimo={estado:window.__modoLocal?'local':'local',salvoEm:0,pendentes:0};
  function pintarPill(d){
    ultimo=d||ultimo;var p=$('#nv-pill');if(!p)return;
    p.setAttribute('data-estado',ultimo.estado);
    $('span',p).textContent=(ROT[ultimo.estado]||ROT.local)(ultimo);
    p.title=DICA[ultimo.estado]||'';
    var s=$('#v40-cfg-sync');if(s)s.innerHTML=infoSync();
  }
  window.addEventListener('nuvem-status',function(ev){if(ev.detail&&ev.detail.caminho==='financas')pintarPill(ev.detail);});
  function infoSync(){
    var d=ultimo;
    var u='';try{if(typeof _cloudUser!=='undefined'&&_cloudUser)u=_cloudUser.email||'';}catch(e){}
    return '<div class="v40-linha"><span>Situação</span><b>'+(ROT[d.estado]||ROT.local)(d)+'</b></div>'+
      '<div class="v40-linha"><span>Conta</span><b>'+(u?E(u):'não conectada')+'</b></div>'+
      '<p style="margin:8px 0 0">'+(DICA[d.estado]||'')+'</p>';
  }

  /* ---------- Configurações ---------- */
  function abrirConfig(){
    var m=$('#v40-cfg');
    if(!m){
      m=document.createElement('div');m.id='v40-cfg';m.className='v40-modal';
      m.innerHTML='<div class="v40-box" role="dialog" aria-label="Configurações"><header><h2>Configurações</h2><button class="v40-x" type="button" aria-label="Fechar">×</button></header>'+
        '<div class="v40-sec"><h3>Nuvem</h3><div id="v40-cfg-sync"></div><div class="v40-btns" style="margin-top:10px"><button class="v40-btn" data-acao="sync">Sincronizar agora</button><button class="v40-btn" data-acao="sair">Sair da conta</button></div></div>'+
        '<div class="v40-sec"><h3>Importar do banco</h3><p>Extrato da conta corrente ou fatura do cartão do Itaú em PDF. Lançamentos repetidos são ignorados.</p><div class="v40-btns"><button class="v40-btn pri" data-acao="pdf">Importar PDF do Itaú</button></div></div>'+
        '<div class="v40-sec"><h3>Cópias de segurança</h3><p>A nuvem já guarda tudo. Estas cópias servem para guardar uma versão em arquivo ou restaurar uma versão antiga.</p><div class="v40-btns"><button class="v40-btn" data-click="btn-exportar">Exportar backup (.json)</button><button class="v40-btn" data-click="btn-importar">Restaurar backup</button><button class="v40-btn" data-click="btn-salvar-html">Salvar cópia que abre sem internet</button><button class="v40-btn" data-click="btn-fs-link">Vincular arquivo no computador</button></div></div>'+
        '<div class="v40-sec"><h3>Pessoal ou empresa</h3><p>Classificação dos contratos de dívida. A escolha também pode ser feita em Empresa › Dívidas da empresa.</p><div id="v40-cfg-div"></div></div>'+
        '</div>';
      document.body.appendChild(m);
      m.addEventListener('click',function(ev){
        if(ev.target===m||ev.target.closest('.v40-x')){m.classList.remove('open');return;}
        var b=ev.target.closest('[data-click],[data-acao],[data-esc]');if(!b)return;
        if(b.hasAttribute('data-click')){var alvo=el(b.getAttribute('data-click'));if(alvo)alvo.click();return;}
        if(b.hasAttribute('data-esc')){setTimeout(pintarDividas,30);return;}
        var a=b.getAttribute('data-acao');
        if(a==='sync'){try{cloudWriteAll();toast('Sincronizando…');}catch(e){}}
        if(a==='sair'){if(confirm('Sair da conta neste aparelho? Os dados continuam na nuvem.')){try{firebase.auth().signOut().then(function(){location.reload();});}catch(e){}}}
        if(a==='pdf'){m.classList.remove('open');try{abrirImportFatura();}catch(e){toast('Abra a tela do mês para importar.');}}
      });
      document.addEventListener('keydown',function(e){if(e.key==='Escape')m.classList.remove('open');});
    }
    pintarPill();pintarDividas();
    m.classList.add('open');
  }
  function pintarDividas(){
    var box=$('#v40-cfg-div');if(!box||!window.BM)return;
    box.innerHTML=BM.contratos.map(function(c){var e=BM.escopoContrato(c);return '<div class="v40-linha"><span>'+E(c.nome)+'</span><div class="v40-seg"><button data-esc="'+c.k+'|pessoal" class="'+(e!=='empresa'?'on':'')+'">Pessoal</button><button data-esc="'+c.k+'|empresa" class="'+(e==='empresa'?'on':'')+'">Empresa</button></div></div>';}).join('');
  }

  /* ---------- barra inferior (celular) ---------- */
  function montarBottom(){
    if($('#v40-bottom'))return;
    var b=document.createElement('nav');b.id='v40-bottom';b.className='v40-bottom';b.setAttribute('aria-label','Atalhos');
    document.body.appendChild(b);
    b.addEventListener('click',function(ev){
      var a=ev.target.closest('a');if(!a)return;
      if(a.classList.contains('mais')){ev.preventDefault();lancarRapido();return;}
      var v=a.getAttribute('data-ir');if(v){ev.preventDefault();if(v==='mes'){var hoje=new Date();goTo('mes',hoje.getFullYear()===ANO_PLANILHA?hoje.getMonth()+1:mesAtual);}else goTo(v);}
    });
    atualizarBottom();
  }
  function atualizarBottom(){
    var b=$('#v40-bottom');if(!b)return;
    var itens=contexto==='empresa'?
      [['bm-painel','painel','Painel'],['receitas','receitas','Receitas'],null,['parcelamentos','receber','A receber'],['bm-despesas','despesas','Despesas']]:
      [['painel','painel','Painel'],['mes','mes','Mês'],null,['fixas','contas','Contas'],['financ','dividas','Dívidas']];
    var v=typeof vAtual!=='undefined'?vAtual:'';
    b.innerHTML=itens.map(function(i){
      if(!i)return '<a class="mais" href="#" aria-label="Novo lançamento"><span class="b">'+ICO.mais+'</span></a>';
      return '<a href="#" data-ir="'+i[0]+'" class="'+(v===i[0]?'on':'')+'">'+ICO[i[1]]+'<span>'+i[2]+'</span></a>';
    }).join('');
  }

  /* ---------- ganchos ---------- */
  function depoisDeRender(){
    try{
      var v=typeof vAtual!=='undefined'?vAtual:'';
      var c=contextoDaView(v);if(c!==contexto&&v!=='mes'){contexto=c;}
      arrumarMenu();moverBotaoMenu();
    }catch(e){console.error('v40 menu',e);}
  }
  var _render=window.render;
  window.render=function(){var r=_render.apply(this,arguments);depoisDeRender();return r;};
  try{render=window.render;}catch(e){}
  var _goTo=window.goTo;
  window.goTo=function(v,m){var r=_goTo.apply(this,arguments);setTimeout(depoisDeRender,60);return r;};
  try{goTo=window.goTo;}catch(e){}

  montarTopo();montarBottom();aplicarClasse();
  document.title='Finanças '+ANO_PLANILHA+' — Jéssica Moraes';
  /* Abre na tela inicial da área escolhida (Empresa abre no Painel B&M). */
  setTimeout(function(){
    try{
      if(contexto==='empresa'&&contextoDaView(vAtual)!=='empresa')goTo('bm-painel');
      else depoisDeRender();
    }catch(e){}
  },120);
  pintarPill(window.__modoLocal?{estado:'local',salvoEm:0,pendentes:0}:{estado:'salvando',salvoEm:0,pendentes:0});
  if(window.__motorFinancas&&window.__motorFinancas.ultimoStatus)pintarPill(window.__motorFinancas.ultimoStatus);
})();
