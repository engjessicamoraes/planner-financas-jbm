/* ============================================================
   ALERTAS DE VENCIMENTO E METAS DOS COFRINHOS — v40

   Alertas: usa a mesma conferência da tela "Contas do mês"
   (v31StatusContas) para listar o que está atrasado ou vence nos
   próximos 5 dias. O resumo aparece no Painel e é publicado na
   chave v40-vencimentos (sincronizada como financas/vencimentos),
   que o Planner lê para mostrar as contas junto com as tarefas.

   Cofrinhos: cada meta tem nome, valor-alvo, prazo e uma palavra
   para reconhecer os depósitos (lançamentos do tipo "cofre"). A
   tela mostra quanto falta, o ritmo dos últimos meses e o mês em
   que a meta será atingida nesse ritmo.
   ============================================================ */
(function(){
  'use strict';
  function $(s,r){return (r||document).querySelector(s);}
  function num(v){return parseFloat(v)||0;}
  var VENC_SK='v40-vencimentos',METAS_COFRE_SK='v40-metas-cofre';
  var DIAS_AVISO=5;

  function hojeISO(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function diasEntre(a,b){return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);}
  function dm(d){return d?d.slice(8,10)+'/'+d.slice(5,7):'';}

  /* ---------- vencimentos ---------- */
  function vencimentos(){
    if(typeof window.v31StatusContas!=='function')return [];
    var hoje=hojeISO(),ano=+hoje.slice(0,4),m=+hoje.slice(5,7);
    if(ano!==ANO_PLANILHA)return [];
    var meses=[m];if(m<12&&+hoje.slice(8,10)>=31-DIAS_AVISO)meses.push(m+1);
    var out=[];
    meses.forEach(function(mm){
      var s;try{s=window.v31StatusContas(mm);}catch(e){return;}
      (s.rows||[]).forEach(function(r){
        if(!r||!r.f||String(r.f.tipo).indexOf('entrada')===0)return;
        if(['pendente','atrasado'].indexOf(r.estado)<0)return;
        var d=diasEntre(hoje,r.venc);
        if(r.estado!=='atrasado'&&d>DIAS_AVISO)return;
        out.push({id:r.f.id+'-'+mm,nome:r.f.nome,valor:Math.round(num(r.previsto)*100)/100,venc:r.venc,dias:d,estado:r.estado==='atrasado'||d<0?'atrasado':'pendente'});
      });
    });
    return out.sort(function(a,b){return a.venc.localeCompare(b.venc);});
  }
  function quando(v){
    if(v.estado==='atrasado')return 'atrasada desde '+dm(v.venc);
    if(v.dias===0)return 'vence hoje';
    if(v.dias===1)return 'vence amanhã';
    return 'vence em '+v.dias+' dias ('+dm(v.venc)+')';
  }
  var ultimoPublicado=null;
  function publicar(lista){
    /* Só grava quando a lista muda, para não gerar envios à nuvem a cada tela. */
    var s=JSON.stringify(lista.map(function(v){return {id:v.id,nome:v.nome,valor:v.valor,venc:v.venc,estado:v.estado};}));
    if(s===ultimoPublicado)return;
    var atual=null;try{atual=JSON.parse(localStorage.getItem(VENC_SK)||'null');}catch(e){}
    if(atual&&JSON.stringify(atual.itens)===s){ultimoPublicado=s;return;}
    ultimoPublicado=s;
    try{localStorage.setItem(VENC_SK,JSON.stringify({dia:hojeISO(),itens:JSON.parse(s)}));}catch(e){}
  }
  function cartaoAlertas(lista){
    var atras=lista.filter(function(v){return v.estado==='atrasado';});
    var tot=lista.reduce(function(a,v){return a+v.valor;},0);
    var h='<div class="v40-alerta '+(atras.length?'bad':'')+'" id="v40-alerta"><div class="ah"><div><b>'+(atras.length?atras.length+' conta(s) atrasada(s)':'Contas dos próximos '+DIAS_AVISO+' dias')+'</b><span>'+lista.length+' conta(s) · '+RK(tot)+'</span></div><button class="bm-link" data-ir="fixas">Abrir contas do mês →</button></div><div class="al">';
    lista.slice(0,6).forEach(function(v){h+='<div class="ai '+v.estado+'"><i></i><span class="n">'+E(v.nome)+'</span><span class="q">'+quando(v)+'</span><span class="v">'+RK(v.valor)+'</span></div>';});
    return h+'</div></div>';
  }
  function mostrarAlertas(){
    var lista=vencimentos();publicar(lista);
    var pg=$('#v-painel');if(!pg)return;
    var velho=$('#v40-alerta',pg);if(velho)velho.remove();
    if(!lista.length)return;
    /* entra logo abaixo do cabeçalho da página, ocupando a largura toda */
    var alvo=$('.pg-sub',pg)||$('.pg-title',pg);
    while(alvo&&alvo.parentNode!==pg)alvo=alvo.parentNode;
    var box=document.createElement('div');box.innerHTML=cartaoAlertas(lista);
    if(alvo)pg.insertBefore(box.firstChild,alvo.nextSibling);else pg.insertBefore(box.firstChild,pg.firstChild);
  }

  /* ---------- metas dos cofrinhos ---------- */
  function metasCofre(){try{return JSON.parse(localStorage.getItem(METAS_COFRE_SK)||'[]')||[];}catch(e){return [];}}
  function salvarMetas(l){try{localStorage.setItem(METAS_COFRE_SK,JSON.stringify(l));}catch(e){}}
  function depositos(meta){
    var re=null;if(meta.palavra){try{re=new RegExp(meta.palavra,'i');}catch(e){re=new RegExp(meta.palavra.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');}}
    var dep=(DB.items||[]).filter(function(i){return i.tipo==='cofre'&&(!re||re.test(i.nome||''));});
    var resg=(DB.items||[]).filter(function(i){return ['entrada','outros','reembolso'].indexOf(i.tipo)>=0&&/resgate/i.test(i.nome||'')&&(!re||re.test(i.nome||''));});
    return {dep:dep,resg:resg};
  }
  function analisar(meta){
    var d=depositos(meta);
    var guardado=num(meta.inicial)+d.dep.reduce(function(a,i){return a+num(i.valor);},0)-d.resg.reduce(function(a,i){return a+num(i.valor);},0);
    var porMes={};d.dep.forEach(function(i){porMes[i.mes]=(porMes[i.mes]||0)+num(i.valor);});
    var hoje=new Date(),mAtual=hoje.getFullYear()===ANO_PLANILHA?hoje.getMonth()+1:12;
    var ult=[];for(var m=mAtual;m>=1&&ult.length<3;m--)ult.push(porMes[m]||0);
    var ritmo=ult.length?ult.reduce(function(a,v){return a+v;},0)/ult.length:0;
    var falta=Math.max(0,num(meta.alvo)-guardado);
    var previsao=null;
    if(falta<=0)previsao='atingida';
    else if(ritmo>0){var meses=Math.ceil(falta/ritmo);var dt=new Date(ANO_PLANILHA,mAtual-1+meses,1);previsao=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');}
    var necessario=null;
    if(meta.prazo&&falta>0){var p=meta.prazo.split('-');var mesesAte=(+p[0]-ANO_PLANILHA)*12+(+p[1])-mAtual;necessario=mesesAte>0?falta/mesesAte:falta;}
    return {guardado:guardado,falta:falta,ritmo:ritmo,previsao:previsao,necessario:necessario,pct:num(meta.alvo)>0?Math.min(100,Math.round(guardado/num(meta.alvo)*100)):0,n:d.dep.length};
  }
  function mesAno(s){if(!s)return '';var p=s.split('-');return MAB[+p[1]-1]+'/'+p[0];}
  function garantirPagina(){
    if(document.getElementById('v-cofrinhos'))return;
    var main=$('.main');if(!main)return;
    var p=document.createElement('div');p.className='page';p.id='v-cofrinhos';
    p.innerHTML='<div class="pg-title">Cofrinhos e metas</div><div class="pg-sub">Quanto já foi guardado, quanto falta e quando cada meta será atingida no ritmo atual</div><div class="bm-corpo"></div>';
    main.appendChild(p);
  }
  function renderCofrinhos(){
    var c=$('#v-cofrinhos .bm-corpo');if(!c)return;
    var metas=metasCofre();
    var semMeta=depositos({}).dep.reduce(function(a,i){return a+num(i.valor);},0);
    var h='<div class="v40-nota">Os depósitos são os lançamentos do tipo <b>Cofrinhos</b> na conta corrente. Para separar as metas, use uma palavra que apareça no nome do depósito (por exemplo, "reserva" ou "viagem"); deixe em branco para contar todos. No ano, os cofrinhos somam <b>'+RK(semMeta)+'</b>.</div>';
    if(!metas.length)h+='<div class="bm-card"><div class="bm-vazio">Nenhuma meta criada ainda. Crie a primeira abaixo.</div></div>';
    metas.forEach(function(m,idx){
      var a=analisar(m);
      var atraso=m.prazo&&a.previsao&&a.previsao!=='atingida'&&a.previsao>m.prazo;
      h+='<div class="bm-card"><div class="bm-card-h"><div><div class="t">'+E(m.nome)+'</div><div class="s">Meta de '+RK(m.alvo)+(m.prazo?' até '+mesAno(m.prazo):'')+(m.palavra?' · depósitos com "'+E(m.palavra)+'"':' · todos os depósitos')+'</div></div><button class="bm-mini" data-meta-del="'+idx+'">Excluir</button></div>'+
        '<div style="padding:14px 16px"><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>Guardado <b>'+RK(a.guardado)+'</b></span><span>'+a.pct+'%</span></div><div class="bm-bar" style="height:9px"><i style="width:'+a.pct+'%"></i></div>'+
        '<div class="bm-kpis" style="margin:14px 0 0">'+
          '<div class="bm-kpi"><div class="l">Falta</div><div class="v">'+RK(a.falta)+'</div></div>'+
          '<div class="bm-kpi"><div class="l">Ritmo recente</div><div class="v">'+RK(a.ritmo)+'</div><div class="s">média dos últimos 3 meses</div></div>'+
          '<div class="bm-kpi"><div class="l">Previsão</div><div class="v '+(a.previsao==='atingida'?'ok':(atraso?'bad':''))+'">'+(a.previsao==='atingida'?'Atingida':(a.previsao?mesAno(a.previsao):'—'))+'</div><div class="s">'+(a.previsao&&a.previsao!=='atingida'?(atraso?'depois do prazo':'no ritmo atual'):(a.ritmo?'':'sem depósitos recentes'))+'</div></div>'+
          '<div class="bm-kpi"><div class="l">Para cumprir o prazo</div><div class="v">'+(a.necessario!=null?RK(a.necessario)+'/mês':'—')+'</div><div class="s">'+(m.prazo?'até '+mesAno(m.prazo):'sem prazo definido')+'</div></div>'+
        '</div></div></div>';
    });
    h+='<div class="bm-card"><div class="bm-card-h"><div><div class="t">Nova meta</div></div></div><div class="v40-form-meta"><input id="cm-nome" placeholder="Nome (ex.: Reserva de emergência)"><input id="cm-alvo" type="number" step="0.01" placeholder="Valor-alvo"><input id="cm-prazo" type="month" title="Prazo"><input id="cm-inicial" type="number" step="0.01" placeholder="Já guardado antes (opcional)"><input id="cm-palavra" placeholder="Palavra no depósito (opcional)"><button class="v40-btn pri" id="cm-salvar">Criar meta</button></div></div>';
    c.innerHTML=h;
    $('#cm-salvar').onclick=function(){
      var nome=$('#cm-nome').value.trim(),alvo=num($('#cm-alvo').value);
      if(!nome||!alvo){toast('Informe o nome e o valor-alvo.');return;}
      var l=metasCofre();l.push({id:'mc'+Date.now().toString(36),nome:nome,alvo:alvo,prazo:$('#cm-prazo').value||'',inicial:num($('#cm-inicial').value),palavra:$('#cm-palavra').value.trim()});
      salvarMetas(l);renderCofrinhos();toast('Meta criada.');
    };
  }
  document.addEventListener('click',function(ev){
    var b=ev.target.closest&&ev.target.closest('[data-meta-del]');if(!b)return;
    var l=metasCofre(),i=+b.getAttribute('data-meta-del');
    if(l[i]&&confirm('Excluir a meta "'+l[i].nome+'"? Os depósitos não são apagados.')){l.splice(i,1);salvarMetas(l);renderCofrinhos();}
  });

  /* item no menu (grupo Planejamento) */
  function itemMenu(){
    var g=document.querySelector('section.nav-group[data-group="planejamento"] .nav-group-body');
    if(!g)return;
    var ja=g.querySelector('.ni[data-v="cofrinhos"]');
    if(ja){var orc=g.querySelector('.ni[data-v="orcamento"]');if(orc&&orc.nextSibling!==ja)orc.insertAdjacentElement('afterend',ja);return;}
    var d=document.createElement('div');d.className='ni';d.setAttribute('data-v','cofrinhos');d.setAttribute('tabindex','0');
    d.innerHTML='<svg viewBox="0 0 16 16"><path d="M3 8.5c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5c0 1.5-.8 2.8-2 3.6V14H9.5v-1.2h-3V14H5v-1.9c-1.2-.8-2-2.1-2-3.6z"/><line x1="7" y1="2" x2="9" y2="2"/></svg>Cofrinhos e metas';
    var orc=g.querySelector('.ni[data-v="orcamento"]');
    if(orc)orc.insertAdjacentElement('afterend',d);else g.appendChild(d);
    if(typeof vAtual!=='undefined'&&vAtual==='cofrinhos')d.classList.add('on');
  }

  garantirPagina();
  var _render=window.render;
  function depois(){
    try{
      itemMenu();
      var v=typeof vAtual!=='undefined'?vAtual:'';
      if(v==='painel')mostrarAlertas();else publicar(vencimentos());
      if(v==='cofrinhos'&&!document.querySelector('#v-cofrinhos .bm-card'))renderCofrinhos();
    }catch(e){console.error('v40 planejamento',e);}
  }
  /* Camadas antigas reorganizam o menu e o Painel logo após renderizar
     (com atraso de ~50 ms); por isso o ajuste roda de novo em seguida. */
  var timer=null;
  window.render=function(){
    var r=_render.apply(this,arguments);
    var v=typeof vAtual!=='undefined'?vAtual:'';
    if(v==='cofrinhos')try{renderCofrinhos();}catch(e){console.error(e);}
    depois();clearTimeout(timer);timer=setTimeout(depois,120);
    return r;
  };
  try{render=window.render;}catch(e){}
  /* Publica os vencimentos também ao abrir, mesmo sem trocar de tela. */
  setTimeout(depois,400);
  window.V40Planejamento={vencimentos:vencimentos,analisarMeta:analisar};
})();
