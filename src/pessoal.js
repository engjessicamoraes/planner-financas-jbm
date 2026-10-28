/* Aba Pessoal — ajustes de outubro/2026
   1. Painel só com as faturas, seguido das anotações (o item Anotações sai do menu).
   2. Orçamento com análise fixa dos meses anteriores (gasto por categoria × teto).
   3. Dívidas adicionadas à mão com mês de início e fases de valor
      (ex.: 6 parcelas menores e depois parcelas cheias). */
(function(){
  'use strict';
  function $(s,r){return (r||document).querySelector(s);}
  function $$(s,r){return [].slice.call((r||document).querySelectorAll(s));}
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function R(v){return typeof RK==='function'?RK(v):'R$ '+(+v||0).toFixed(2);}
  function ANO(){return typeof ANO_PLANILHA!=='undefined'?ANO_PLANILHA:new Date().getFullYear();}
  function mesHoje(){var d=new Date();return d.getFullYear()>ANO()?13:d.getMonth()+1;}
  var MAB=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  /* ================= 1. Painel + Anotações ================= */
  function montarPainel(){
    var pg=$('#v-painel');if(!pg)return;
    var sub=$('.pg-sub',pg);if(sub)sub.textContent='Faturas do cartão e anotações';
    var box=$('#painel-anot');
    if(!box){
      box=document.createElement('div');box.id='painel-anot';
      box.innerHTML='<div class="pn-tit">Anotações</div>';
      pg.appendChild(box);
    }
    /* planner de gastos do mês */
    if(!$('#planner-diario-wrap')){
      var w=document.createElement('div');w.id='planner-diario-wrap';
      w.innerHTML='<div class="sec" style="margin-bottom:18px"><div class="sec-h"><div class="sec-t">Planner de gastos do mês</div></div><div style="padding:16px 18px"><div id="planner-diario"></div></div></div>';
      box.appendChild(w);
    }else if($('#planner-diario-wrap').parentNode!==box)box.appendChild($('#planner-diario-wrap'));
    /* blocos de anotações (os elementos são movidos, então os botões continuam funcionando) */
    ['anot-total-geral-box','anot-blocos','anot-btn-add-bloco'].forEach(function(id){var e=document.getElementById(id);if(e&&e.parentNode!==box)box.appendChild(e);});
    try{if(typeof window.renderPlanner==='function')window.renderPlanner();}catch(e){}
    try{if(typeof renderAnotacoes==='function')renderAnotacoes();}catch(e){}
  }

  /* ================= 2. Análise dos meses anteriores (Orçamento) ================= */
  var FORA=['Dani','SENGE','Trabalho / Empresa','Financiamentos','Movimentação financeira'];
  function metas(){
    var o={};try{o=JSON.parse(localStorage.getItem(typeof METAS_SK!=='undefined'?METAS_SK:'metas26v1')||'{}');}catch(e){}
    return o;
  }
  function mesesComDados(){
    var h=mesHoje(),r=[];
    for(var m=1;m<=Math.min(12,h);m++){
      var tem=(DB.items||[]).some(function(i){return i.mes===m&&(i.tipo==='cartao'||i.tipo==='saida');});
      if(tem)r.push(m);
    }
    return r.slice(-6);
  }
  function analise(){
    var pg=$('#v-orcamento');if(!pg||typeof getCatTots!=='function')return;
    var host=$('#orc-analise');
    if(!host){host=document.createElement('div');host.id='orc-analise';pg.appendChild(host);}
    var M=mesesComDados(),hoje=mesHoje(),T=metas();
    T=JSON.parse(JSON.stringify(T));delete T['Revisar categoria']; /* sem categoria não tem teto: só aparece para lembrar de classificar */
    if(!M.length){host.innerHTML='';return;}
    var tots={};M.forEach(function(m){tots[m]=getCatTots(m);});
    var cats={};M.forEach(function(m){Object.keys(tots[m]).forEach(function(c){if((tots[m][c]||0)>0.5&&FORA.indexOf(c)<0)cats[c]=1;});});
    var lista=Object.keys(cats).sort(function(a,b){
      var sa=M.reduce(function(s,m){return s+(tots[m][a]||0);},0),sb=M.reduce(function(s,m){return s+(tots[m][b]||0);},0);return sb-sa;});
    function proprio(m){return lista.reduce(function(s,c){return s+(tots[m][c]||0);},0);}
    function cel(v,teto){
      if(!(v>0.5))return '<td class="z">—</td>';
      var cls=teto>0?(v>teto*1.001?'acima':'ok'):'';
      return '<td class="'+cls+'">'+R(v).replace('R$ ','').replace('R$ ','')+'</td>';
    }
    var h='<div class="sec oa-sec"><div class="sec-h"><div><div class="sec-t">Análise dos meses anteriores</div>'
      +'<div class="oa-sub">Gasto por categoria (cartão e conta) comparado com o teto de cada uma. Vermelho = acima do teto; verde = dentro. Dani, SENGE, despesas da empresa e financiamentos ficam de fora.</div></div></div>';
    /* resumo mês a mês */
    h+='<div class="oa-meses">';
    M.forEach(function(m,k){
      var p=proprio(m),ant=k?proprio(M[k-1]):null;
      var acima=lista.filter(function(c){var t=+T[c]||0;return t>0&&(tots[m][c]||0)>t*1.001;})
        .map(function(c){return {c:c,d:(tots[m][c]||0)-(+T[c])};}).sort(function(a,b){return b.d-a.d;});
      var dentro=lista.filter(function(c){var t=+T[c]||0;return t>0&&(tots[m][c]||0)>0.5&&(tots[m][c]||0)<=t*1.001;});
      var varTxt=ant?((p>=ant?'+':'−')+Math.abs(Math.round((p/ant-1)*100))+'% em relação a '+MESES[M[k-1]-1].toLowerCase()):'';
      h+='<div class="oa-mes'+(m===hoje?' atual':'')+'"><div class="t">'+MESES[m-1]+(m===hoje?' <span>em andamento</span>':'')+'</div>'
        +'<div class="v">'+R(p)+'</div><div class="s">'+(varTxt||'gasto próprio no mês')+'</div>'
        +(acima.length?'<div class="l bad">Acima do teto: '+acima.slice(0,4).map(function(x){return esc(x.c)+' (+'+R(x.d)+')';}).join(', ')+(acima.length>4?' e mais '+(acima.length-4):'')+'</div>':'<div class="l good">Tudo dentro dos tetos.</div>')
        +(dentro.length?'<div class="l good">Dentro: '+dentro.slice(0,5).map(esc).join(', ')+(dentro.length>5?'…':'')+'</div>':'')
        +'</div>';
    });
    h+='</div>';
    /* tabela categoria × mês */
    h+='<div class="oa-tab-wrap"><table class="oa-tab"><thead><tr><th>Categoria</th><th>Teto</th>'+M.map(function(m){return '<th>'+MAB[m-1]+(m===hoje?'*':'')+'</th>';}).join('')+'<th>Média</th></tr></thead><tbody>';
    lista.forEach(function(c){
      var t=+T[c]||0,soma=M.reduce(function(s,m){return s+(tots[m][c]||0);},0),fech=M.filter(function(m){return m<hoje;});
      var med=fech.length?fech.reduce(function(s,m){return s+(tots[m][c]||0);},0)/fech.length:soma/M.length;
      h+='<tr><td class="c">'+(c==='Revisar categoria'?'Sem categoria <small>(ver Pendências)</small>':esc(c))+'</td><td class="t">'+(t?R(t).replace('R$ ','').replace('R$ ',''):'—')+'</td>'+M.map(function(m){return cel(tots[m][c]||0,t);}).join('')+cel(med,t)+'</tr>';
    });
    h+='<tr class="tot"><td class="c">Total próprio</td><td class="t">'+R(lista.reduce(function(s,c){return s+(+T[c]||0);},0)).replace('R$ ','').replace('R$ ','')+'</td>'
      +M.map(function(m){return '<td>'+R(proprio(m)).replace('R$ ','').replace('R$ ','')+'</td>';}).join('')+'<td></td></tr>';
    h+='</tbody></table></div><div class="oa-nota">* mês em andamento. A média considera só os meses já encerrados. Valores em R$.</div></div>';
    host.innerHTML=h;
  }

  /* ================= 3. Dívidas com início e fases ================= */
  function idx(a,m){return (a-ANO())*12+m;}
  function parseYM(s){var x=String(s||'').match(/^(\d{4})-(\d{2})/);return x?idx(+x[1],+x[2]):null;}
  function valorNoMes(f,i){
    if(f.sa&&f.sm&&i<idx(f.sa,f.sm))return 0;
    if(f.ea&&f.em&&i>idx(f.ea,f.em))return 0;
    if(f.fases&&f.fases.length){
      for(var k=0;k<f.fases.length;k++){var de=parseYM(f.fases[k].de),ate=parseYM(f.fases[k].ate);if(de!==null&&i>=de&&(ate===null||i<=ate))return +f.fases[k].v||0;}
      return 0;
    }
    return +f.v||0;
  }
  window.valorDividaNoMes=valorNoMes;
  if(typeof window.dividasMesDetalhadas==='function'){
    var _dmd=window.dividasMesDetalhadas;
    window.dividasMesDetalhadas=function(m,ano){
      var arr=_dmd.apply(this,arguments)||[];
      var custom=(typeof FINANC!=='undefined'&&FINANC.custom)||[];
      var i=idx(ano||ANO(),m);
      var semCustom=arr.filter(function(d){return d.key!=='custom';});
      custom.forEach(function(f){
        if((f.total||0)-(f.pagas||0)<=0&&!(f.sa&&f.sm))return;
        var v=valorNoMes(f,i);if(!v)return;
        semCustom.push({nome:f.n||'Financiamento adicional',n:null,vc:f.enc||'',val:v,pago:false,key:'custom'});
      });
      return semCustom;
    };
    try{dividasMesDetalhadas=window.dividasMesDetalhadas;}catch(e){}
  }
  /* as dívidas adicionadas também entram na lista de contratos (painel, Empresa › Dívidas) */
  function sincronizarAtivos(){
    if(typeof FINANC_ATIVOS==='undefined')return;
    for(var k=FINANC_ATIVOS.length-1;k>=0;k--)if(FINANC_ATIVOS[k]._custom)FINANC_ATIVOS.splice(k,1);
    ((typeof FINANC!=='undefined'&&FINANC.custom)||[]).forEach(function(f){
      if(!f.ea||!f.em)return;
      var hoje=idx(new Date().getFullYear(),new Date().getMonth()+1);
      FINANC_ATIVOS.push({n:f.n,v:valorNoMes(f,Math.max(hoje,f.sa?idx(f.sa,f.sm):hoje))||+f.v||0,enc:f.enc||'',em:f.em,ea:f.ea,sm:f.sm,sa:f.sa,_custom:f.id});
    });
  }

  /* ================= ganchos ================= */
  function depois(){
    var v=typeof vAtual!=='undefined'?vAtual:'';
    if(v==='anotacoes'){try{window.goTo('painel');}catch(e){}setTimeout(function(){var a=$('#painel-anot');if(a)a.scrollIntoView({behavior:'smooth',block:'start'});},200);return;}
    try{sincronizarAtivos();}catch(e){console.error(e);}
    try{if(v==='painel')montarPainel();}catch(e){console.error('painel',e);}
    try{if(v==='orcamento')analise();}catch(e){console.error('orçamento',e);}
  }
  var _r=window.render;if(typeof _r==='function'){window.render=function(){var x=_r.apply(this,arguments);setTimeout(depois,0);return x;};try{render=window.render;}catch(e){}}
  var _g=window.goTo;
  if(typeof _g==='function'){
    window.goTo=function(v){
      if(v==='anotacoes'){var x=_g.call(this,'painel');setTimeout(function(){depois();var a=$('#painel-anot');if(a)a.scrollIntoView({behavior:'smooth',block:'start'});},150);return x;}
      var y=_g.apply(this,arguments);setTimeout(depois,120);return y;
    };
    try{goTo=window.goTo;}catch(e){}
  }
  window.addEventListener('dados-atualizados',function(){setTimeout(depois,50);});

  var st=document.createElement('style');
  st.textContent=
    '.ni[data-v="anotacoes"]{display:none!important}'
   +'#v-painel #v40-alerta,#v-painel .p31-contas,#v-painel #p31 .p31-grid3>*:not(:first-child){display:none!important}'
   +'#v-painel #p31 .p31-grid3{grid-template-columns:minmax(0,1fr)!important;max-width:520px}'
   +'#painel-anot{margin-top:26px}#painel-anot .pn-tit{font:700 17px Outfit,Inter,sans-serif;color:var(--t,#27303B);margin:0 0 12px}'
   +'.oa-sec{margin-top:22px}.oa-sub{font-size:12px;color:var(--t3,#8A949F);margin-top:3px;line-height:1.45;font-weight:400}'
   +'.oa-meses{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;padding:14px 16px}'
   +'.oa-mes{border:1px solid var(--bd,#DDE1E6);border-radius:12px;padding:12px 14px;background:var(--card,#fff)}.oa-mes.atual{border-style:dashed}'
   +'.oa-mes .t{font-weight:700;font-size:13px}.oa-mes .t span{font-weight:500;font-size:11px;color:var(--t3,#8A949F)}'
   +'.oa-mes .v{font:700 19px Outfit,Inter,sans-serif;margin-top:4px;font-variant-numeric:tabular-nums}.oa-mes .s{font-size:11.5px;color:var(--t3,#8A949F)}'
   +'.oa-mes .l{font-size:11.5px;line-height:1.45;margin-top:7px}.oa-mes .l.bad{color:#B23B3B}.oa-mes .l.good{color:#2F7D59}'
   +'.oa-tab-wrap{overflow-x:auto;padding:0 16px 6px}.oa-tab{width:100%;border-collapse:collapse;font-size:12.5px;font-variant-numeric:tabular-nums}'
   +'.oa-tab th{font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--t3,#8A949F);text-align:right;padding:8px 8px;border-bottom:1px solid var(--bd,#DDE1E6);white-space:nowrap}'
   +'.oa-tab th:first-child,.oa-tab td.c{text-align:left}.oa-tab td{text-align:right;padding:7px 8px;border-bottom:1px solid var(--bds,#ECEFF2);white-space:nowrap}'
   +'.oa-tab td.t{color:var(--t3,#8A949F)}.oa-tab td.acima{color:#B23B3B;font-weight:600;background:#FDF5F5}.oa-tab td.ok{color:#2F7D59}.oa-tab td.z{color:#C2C8CE}'
   +'.oa-tab tr.tot td{font-weight:700;border-top:2px solid var(--bd,#DDE1E6)}.oa-nota{font-size:11px;color:var(--t3,#8A949F);padding:6px 16px 14px}';
  document.head.appendChild(st);
  setTimeout(depois,300);
})();
