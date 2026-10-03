/* ============================================================
   ABA EMPRESA (B&M) — v40
   Telas: Painel B&M, Despesas da empresa, Dívidas da empresa e
   Relatório mensal. Receitas B&M e A receber de clientes já
   existiam e passam a ficar só nesta aba.

   Regras de classificação (ajustáveis pela usuária):
   - Despesa da empresa: lançamento de cartão ou conta na categoria
     "Trabalho / Empresa", ou marcado manualmente como empresa
     (campo escopo = 'empresa'); escopo = 'pessoal' tira da lista.
   - Repasses da B&M: entradas "Salário" que não vêm do SENGE.
   - Dívidas: Pronampe, FGI e Mútua começam como empresa; o resto
     como pessoal. A escolha fica na chave empresa26v1 (nuvem).
   ============================================================ */
(function(){
  'use strict';
  var EMP_SK='empresa26v1';
  var HOJE=new Date();
  var MES_HOJE=HOJE.getFullYear()===ANO_PLANILHA?HOJE.getMonth()+1:12;
  function $(s,r){return (r||document).querySelector(s);}
  function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function num(v){return parseFloat(v)||0;}

  /* ---------- configuração guardada na nuvem ---------- */
  function cfg(){try{return JSON.parse(localStorage.getItem(EMP_SK)||'{}')||{};}catch(e){return {};}}
  function salvarCfg(c){try{localStorage.setItem(EMP_SK,JSON.stringify(c));}catch(e){}}

  var CONTRATOS=[
    {k:'ape',nome:'Financiamento do apartamento',re:/\bape\b|apartamento|sfh/i,def:'pessoal'},
    {k:'jeep',nome:'Jeep',re:/jeep/i,def:'pessoal'},
    {k:'reneg',nome:'Renegociações Itaú (cartão e conta)',re:/renegocia/i,def:'pessoal'},
    {k:'pronampe',nome:'Pronampe',re:/pronampe/i,def:'empresa'},
    {k:'fgi',nome:'Empréstimo FGI',re:/\bfgi\b/i,def:'empresa'},
    {k:'mutua',nome:'Mútua — empréstimo profissional',re:/m[uú]tua/i,def:'empresa'}
  ];
  function contratoDe(nome){for(var i=0;i<CONTRATOS.length;i++)if(CONTRATOS[i].re.test(nome||''))return CONTRATOS[i];return null;}
  function escopoContrato(c){var d=cfg().dividas||{};return d[c.k]||c.def;}
  function setEscopoContrato(k,v){var c=cfg();c.dividas=c.dividas||{};c.dividas[k]=v;salvarCfg(c);}

  /* ---------- lançamentos ---------- */
  function ehDespesaEmpresa(i){
    if(!i||['cartao','saida','dani'].indexOf(i.tipo)<0)return false;
    if(i.escopo==='empresa')return true;
    if(i.escopo==='pessoal')return false;
    return i.cat==='Trabalho / Empresa';
  }
  function despesasEmpresa(mes){
    return (DB.items||[]).filter(function(i){return ehDespesaEmpresa(i)&&(!mes||i.mes===mes);});
  }
  function statusReemb(i){return i.reemb==='ok'?'ok':(i.reemb==='na'?'na':'pendente');}
  var ROT_REEMB={pendente:'A reembolsar',ok:'Reembolsado',na:'Não reembolsar'};
  function ehSenge(nome){return /senge|sind\.?\s*e\s*e|sindicato/i.test(nome||'');}
  function repassesMes(m){
    var lista=[];
    (ENTRADAS_BASE[m]||[]).forEach(function(e){if(e.t==='Salário'&&!ehSenge(e.n))lista.push({nome:e.n,valor:e.v,data:null,base:true});});
    (DB.items||[]).forEach(function(i){
      if(i.mes===m&&['entrada','reembolso','outros'].indexOf(i.tipo)>=0&&i.cat==='Salário'&&!ehSenge(i.nome))lista.push({nome:i.nome,valor:num(i.valor),data:i.data});
    });
    return lista;
  }
  function somaRepasses(m){return repassesMes(m).reduce(function(a,x){return a+num(x.valor);},0);}
  function meta(){try{return typeof v13MetaBM==='function'?v13MetaBM():180000;}catch(e){return 180000;}}

  /* ---------- dívidas ---------- */
  function dividas(){
    return (typeof FINANC_ATIVOS!=='undefined'?FINANC_ATIVOS:[]).map(function(f){
      var c=contratoDe(f.n);
      var restantes=Math.max(0,(f.ea-ANO_PLANILHA)*12+f.em-MES_HOJE+1);
      return {nome:f.n,parcela:num(f.v),fim:f.enc,restantes:restantes,estimado:restantes*num(f.v),
        contrato:c,escopo:c?escopoContrato(c):'pessoal',ativoNoMes:function(m){
          var ini=(f.sa?((f.sa-ANO_PLANILHA)*12+f.sm):-999),fim=(f.ea-ANO_PLANILHA)*12+f.em;return m>=ini&&m<=fim;}};
    });
  }
  function dividasEmpresa(){return dividas().filter(function(d){return d.escopo==='empresa';});}
  function parcelasEmpresaMes(m){return dividasEmpresa().filter(function(d){return d.ativoNoMes(m);}).reduce(function(a,d){return a+d.parcela;},0);}

  /* ---------- recebíveis ---------- */
  function parcs(){return DB.parcs||[];}
  function aReceber(){return parcs().filter(function(p){return p.s==='pendente';});}

  /* ---------- páginas ---------- */
  var PAGINAS={
    'bm-painel':{tit:'Painel B&M',sub:'Repasses, recebíveis, despesas e dívidas da empresa em '+ANO_PLANILHA},
    'bm-despesas':{tit:'Despesas da empresa',sub:'Gastos da B&M pagos com o cartão ou a conta pessoal'},
    'bm-dividas':{tit:'Dívidas da empresa',sub:'Contratos da B&M e classificação entre pessoal e empresa'},
    'bm-relatorio':{tit:'Relatório mensal',sub:'Resumo do mês da B&M, pronto para salvar em PDF ou enviar à contabilidade'}
  };
  function garantirPaginas(){
    var main=$('.main');if(!main)return;
    Object.keys(PAGINAS).forEach(function(v){
      if(document.getElementById('v-'+v))return;
      var p=document.createElement('div');p.className='page';p.id='v-'+v;
      p.innerHTML='<div class="pg-title bm-noprint">'+E(PAGINAS[v].tit)+'</div><div class="pg-sub bm-noprint">'+E(PAGINAS[v].sub)+'</div><div class="bm-corpo"></div>';
      main.appendChild(p);
    });
  }
  function corpo(v){return $('#v-'+v+' .bm-corpo');}
  function ir(v){try{goTo(v);}catch(e){}}

  function kpi(l,v,s,cls,barra){
    return '<div class="bm-kpi"><div class="l">'+l+'</div><div class="v '+(cls||'')+'">'+v+'</div>'+(barra!=null?'<div class="bm-bar"><i style="width:'+Math.max(0,Math.min(100,barra))+'%"></i></div>':'')+'<div class="s">'+s+'</div></div>';
  }

  function renderPainel(){
    var c=corpo('bm-painel');if(!c)return;
    var rep=[],desp=[],div=[],totRep=0,totDesp=0,mesesCom=0;
    for(var m=1;m<=12;m++){
      rep[m]=somaRepasses(m);desp[m]=despesasEmpresa(m).reduce(function(a,i){return a+num(i.valor);},0);div[m]=parcelasEmpresaMes(m);
      if(m<=MES_HOJE){totRep+=rep[m];totDesp+=desp[m];if(rep[m]>0)mesesCom++;}
    }
    var mt=meta(),pct=mt>0?Math.round(totRep/mt*100):0;
    var pend=aReceber(),totPend=pend.reduce(function(a,p){return a+num(p.v);},0);
    var dEmp=dividasEmpresa(),parcMes=dEmp.filter(function(d){return d.ativoNoMes(MES_HOJE);}).reduce(function(a,d){return a+d.parcela;},0);
    var reembPend=despesasEmpresa().filter(function(i){return i.mes<=MES_HOJE&&statusReemb(i)==='pendente';}).reduce(function(a,i){return a+num(i.valor);},0);
    var h='<div class="bm-kpis">';
    h+=kpi('Repasses da B&M no ano',RK(totRep),pct+'% da meta de '+RK(mt)+(mesesCom?' · média '+RK(totRep/mesesCom)+'/mês':''),'ok',pct);
    h+=kpi('A receber de clientes',RK(totPend),pend.length+' parcela(s) pendente(s)','m');
    h+=kpi('Despesas da empresa',RK(totDesp),'Jan a '+MAB[MES_HOJE-1]+' · '+RK(reembPend)+' a reembolsar','bad');
    h+=kpi('Dívidas da empresa',RK(parcMes)+'/mês',dEmp.length+' contrato(s) · cerca de '+RK(dEmp.reduce(function(a,d){return a+d.estimado;},0))+' em parcelas restantes','bad');
    h+='</div>';
    /* gráfico de barras: repasses x despesas + parcelas */
    var max=1;for(m=1;m<=12;m++)max=Math.max(max,rep[m],desp[m]+div[m]);
    h+='<div class="bm-card"><div class="bm-card-h"><div><div class="t">Mês a mês</div><div class="s">Repasses recebidos comparados às despesas e parcelas da empresa</div></div><div class="bm-leg"><span><i style="background:#8D5F78"></i>Repasses</span><span><i style="background:#E2B4A0"></i>Despesas + parcelas</span></div></div>';
    h+='<div class="bm-meses">';
    for(m=1;m<=12;m++){
      var hr=Math.round(rep[m]/max*100),hd=Math.round((desp[m]+div[m])/max*100);
      h+='<div class="bm-mes" title="'+MESES[m-1]+': repasses '+RK(rep[m])+' · despesas '+RK(desp[m])+' · parcelas '+RK(div[m])+'"><div class="r" style="height:'+(hr/2)+'%;opacity:'+(m>MES_HOJE?.35:1)+'"></div><div class="d" style="height:'+(hd/2)+'%;opacity:'+(m>MES_HOJE?.35:1)+'"></div></div>';
    }
    h+='</div><div class="bm-mes-l">'+MAB.map(function(x){return '<span>'+x+'</span>';}).join('')+'</div></div>';
    /* listas */
    h+='<div class="bm-grid2">';
    h+='<div class="bm-card"><div class="bm-card-h"><div><div class="t">Próximos recebimentos</div><div class="s">Parcelas de clientes ainda não recebidas</div></div><button class="bm-link" data-ir="parcelamentos">Ver todos →</button></div>';
    if(!pend.length)h+='<div class="bm-vazio">Nenhuma parcela pendente.</div>';
    pend.slice(0,6).forEach(function(p){h+='<div class="bm-row"><div class="n"><b>'+E(p.n)+'</b><small>'+E([p.ref,p.p?'parcela '+p.p:''].filter(Boolean).join(' · '))+'</small></div><div class="v">'+RK(p.v)+'</div></div>';});
    h+='</div>';
    h+='<div class="bm-card"><div class="bm-card-h"><div><div class="t">Pago pela conta pessoal</div><div class="s">Despesas da B&M ainda não reembolsadas</div></div><button class="bm-link" data-ir="bm-despesas">Conferir →</button></div>';
    var pendDesp=despesasEmpresa().filter(function(i){return i.mes<=MES_HOJE&&statusReemb(i)==='pendente';}).sort(function(a,b){return b.mes-a.mes||num(b.valor)-num(a.valor);});
    if(!pendDesp.length)h+='<div class="bm-vazio">Nada pendente de reembolso.</div>';
    pendDesp.slice(0,6).forEach(function(i){h+='<div class="bm-row"><div class="n"><b>'+E(i.nome)+'</b><small>'+MESES[i.mes-1]+' · '+(i.tipo==='saida'?'conta corrente':'cartão')+'</small></div><div class="v bad">'+RK(i.valor)+'</div></div>';});
    if(pendDesp.length>6)h+='<div class="bm-vazio">E mais '+(pendDesp.length-6)+' lançamento(s) · total '+RK(reembPend)+'</div>';
    h+='</div></div>';
    c.innerHTML=h;
  }

  var filtroDesp=0,buscaDesp='';
  function renderDespesas(){
    var c=corpo('bm-despesas');if(!c)return;
    var todas=despesasEmpresa();
    var meses={};todas.forEach(function(i){meses[i.mes]=1;});
    var lista=todas.filter(function(i){return !filtroDesp||i.mes===filtroDesp;}).sort(function(a,b){return b.mes-a.mes||String(b.data||'').localeCompare(String(a.data||''));});
    var tot=0,ok=0,pend=0;lista.forEach(function(i){var v=num(i.valor);tot+=v;var s=statusReemb(i);if(s==='ok')ok+=v;if(s==='pendente')pend+=v;});
    var h='<div class="v40-nota">Entram aqui os lançamentos da categoria <b>Trabalho / Empresa</b> e os que você marcar como da empresa. Clique na etiqueta de cada um para alternar entre <b>A reembolsar</b>, <b>Reembolsado</b> e <b>Não reembolsar</b>.</div>';
    h+='<div class="bm-kpis">'+kpi('Total no período',RK(tot),lista.length+' lançamento(s)','m')+kpi('A reembolsar',RK(pend),'Pago com dinheiro pessoal','bad')+kpi('Reembolsado',RK(ok),'Já devolvido pela B&M','ok')+kpi('Média mensal',RK(Object.keys(meses).length?todas.reduce(function(a,i){return a+num(i.valor);},0)/Object.keys(meses).length:0),'Considerando os meses com despesa','')+'</div>';
    h+='<div class="bm-filtros"><button data-fm="0" class="'+(!filtroDesp?'on':'')+'">Todos</button>';
    Object.keys(meses).map(Number).sort(function(a,b){return a-b;}).forEach(function(m){h+='<button data-fm="'+m+'" class="'+(filtroDesp===m?'on':'')+'">'+MAB[m-1]+'</button>';});
    h+='</div><div class="bm-card">';
    if(!lista.length)h+='<div class="bm-vazio">Nenhuma despesa da empresa neste período.</div>';
    lista.forEach(function(i){
      var s=statusReemb(i);
      h+='<div class="bm-row"><div class="n"><b>'+E(i.nome)+'</b><small>'+MESES[i.mes-1]+(i.data?' · '+i.data.split('-').reverse().join('/'):'')+' · '+(i.tipo==='saida'?'conta corrente':'cartão')+' · '+E(i.cat||'')+'</small></div>'+
        '<span class="bm-chip '+(s==='pendente'?'':s)+'" data-reemb="'+E(i.id)+'" title="Clique para alterar">'+ROT_REEMB[s]+'</span>'+
        '<div class="v">'+RK(i.valor)+'</div><button class="bm-mini" data-pessoal="'+E(i.id)+'" title="Tirar da empresa e tratar como gasto pessoal">Pessoal</button></div>';
    });
    h+='</div>';
    h+='<div class="bm-card"><div class="bm-card-h"><div><div class="t">Marcar outro lançamento como da empresa</div><div class="s">Busque pelo nome (ex.: CREA, ART, contador, combustível de visita técnica)</div></div></div><div style="padding:12px 16px"><input class="bm-busca" id="bm-busca" placeholder="Digite parte do nome do lançamento…" value="'+E(buscaDesp)+'"></div><div id="bm-busca-res"></div></div>';
    c.innerHTML=h;
    renderBusca();
    var inp=$('#bm-busca');if(inp)inp.oninput=function(){buscaDesp=inp.value;renderBusca();};
  }
  function renderBusca(){
    var box=$('#bm-busca-res');if(!box)return;
    var q=buscaDesp.trim().toLowerCase();
    if(q.length<2){box.innerHTML='';return;}
    var res=(DB.items||[]).filter(function(i){return ['cartao','saida'].indexOf(i.tipo)>=0&&!ehDespesaEmpresa(i)&&String(i.nome||'').toLowerCase().indexOf(q)>=0;}).slice(0,12);
    box.innerHTML=res.length?res.map(function(i){return '<div class="bm-row"><div class="n"><b>'+E(i.nome)+'</b><small>'+MESES[i.mes-1]+' · '+E(i.cat||'')+'</small></div><div class="v">'+RK(i.valor)+'</div><button class="bm-mini" data-empresa="'+E(i.id)+'">Marcar como empresa</button></div>';}).join(''):'<div class="bm-vazio">Nenhum lançamento pessoal com esse nome.</div>';
  }

  function renderDividas(){
    var c=corpo('bm-dividas');if(!c)return;
    var ds=dividas(),emp=ds.filter(function(d){return d.escopo==='empresa';});
    var h='<div class="bm-kpis">'+kpi('Parcelas da empresa',RK(emp.filter(function(d){return d.ativoNoMes(MES_HOJE);}).reduce(function(a,d){return a+d.parcela;},0))+'/mês',emp.length+' contrato(s)','bad')+
      kpi('Restante estimado',RK(emp.reduce(function(a,d){return a+d.estimado;},0)),'Parcela atual × meses restantes (sem juros futuros)','')+
      kpi('Parcelas pessoais',RK(ds.filter(function(d){return d.escopo!=='empresa'&&d.ativoNoMes(MES_HOJE);}).reduce(function(a,d){return a+d.parcela;},0))+'/mês','Ficam na aba Pessoal','m')+
      kpi('Último vencimento',emp.length?emp.slice().sort(function(a,b){return b.restantes-a.restantes;})[0].fim:'—','Contrato da empresa mais longo','')+'</div>';
    h+='<div class="bm-card"><div class="bm-card-h"><div><div class="t">Contratos</div><div class="s">Escolha se cada contrato é pessoal ou da empresa. A escolha vale em todos os aparelhos.</div></div><button class="bm-link" data-ir="financ">Ver parcelas →</button></div>';
    ds.forEach(function(d){
      h+='<div class="bm-row"><div class="n"><b>'+E(d.nome)+'</b><small>'+RK(d.parcela)+'/mês · até '+E(d.fim)+' · '+d.restantes+' parcela(s) restante(s)</small></div>'+
        (d.contrato?'<div class="v40-seg"><button data-esc="'+d.contrato.k+'|pessoal" class="'+(d.escopo!=='empresa'?'on':'')+'">Pessoal</button><button data-esc="'+d.contrato.k+'|empresa" class="'+(d.escopo==='empresa'?'on':'')+'">Empresa</button></div>':'')+'</div>';
    });
    h+='</div>';
    c.innerHTML=h;
  }

  var mesRel=0;
  function renderRelatorio(){
    var c=corpo('bm-relatorio');if(!c)return;
    if(!mesRel)mesRel=Math.max(1,MES_HOJE-(HOJE.getDate()<10?1:0));
    var m=mesRel;
    var rep=repassesMes(m),totRep=rep.reduce(function(a,x){return a+num(x.valor);},0);
    var recCli=(DB.recExtras||[]).filter(function(r){return r.data&&+String(r.data).slice(5,7)===m&&+String(r.data).slice(0,4)===ANO_PLANILHA;});
    var desp=despesasEmpresa(m),totDesp=desp.reduce(function(a,i){return a+num(i.valor);},0);
    var divs=dividasEmpresa().filter(function(d){return d.ativoNoMes(m);}),totDiv=divs.reduce(function(a,d){return a+d.parcela;},0);
    var pend=aReceber(),totPend=pend.reduce(function(a,p){return a+num(p.v);},0);
    var reemb=desp.filter(function(i){return statusReemb(i)==='pendente';}).reduce(function(a,i){return a+num(i.valor);},0);
    var res=totRep-totDesp-totDiv;
    var h='<div class="bm-acoes bm-noprint" style="margin-bottom:14px"><div class="bm-filtros" style="margin:0">';
    for(var k=1;k<=12;k++)h+='<button data-mr="'+k+'" class="'+(k===m?'on':'')+'">'+MAB[k-1]+'</button>';
    h+='</div><button class="v40-btn pri" id="bm-imprimir">Salvar em PDF / imprimir</button></div>';
    h+='<div class="bm-relatorio"><h2>B&M Soluções em Engenharia — '+MESES[m-1]+' de '+ANO_PLANILHA+'</h2><div class="sub">Relatório gerado em '+HOJE.toLocaleDateString('pt-BR')+' · Eng. Jéssica Moraes</div>';
    h+='<div class="bm-res"><div><span>Repasses recebidos</span><b style="color:var(--v40-ok)">'+RK(totRep)+'</b></div><div><span>Despesas da empresa</span><b style="color:var(--v40-erro)">'+RK(totDesp)+'</b></div><div><span>Parcelas de dívidas</span><b style="color:var(--v40-erro)">'+RK(totDiv)+'</b></div><div><span>Resultado</span><b style="color:'+(res>=0?'var(--v40-ok)':'var(--v40-erro)')+'">'+RK(res)+'</b></div></div>';
    function tabela(tit,linhas,cols,vazio,total){
      var t='<h3>'+tit+'</h3>';
      if(!linhas.length)return t+'<div class="bm-vazio" style="padding:6px 0">'+vazio+'</div>';
      t+='<table class="bm-tabela"><thead><tr>'+cols.map(function(x){return '<th>'+x+'</th>';}).join('')+'</tr></thead><tbody>';
      linhas.forEach(function(l){t+='<tr>'+l.map(function(x){return '<td>'+x+'</td>';}).join('')+'</tr>';});
      if(total!=null)t+='<tr class="tot"><td>Total</td>'+cols.slice(1,-1).map(function(){return '<td></td>';}).join('')+'<td>'+RK(total)+'</td></tr>';
      return t+'</tbody></table>';
    }
    h+=tabela('Repasses da B&M para a conta pessoal',rep.map(function(x){return [E(x.nome),x.data?x.data.split('-').reverse().join('/'):'—',RK(x.valor)];}),['Descrição','Data','Valor'],'Nenhum repasse lançado neste mês.',totRep);
    if(recCli.length)h+=tabela('Receitas detalhadas por cliente',recCli.map(function(r){return [E(r.cliente||'—'),E(r.servico||''),RK(r.valor)];}),['Cliente','Serviço','Valor'],'',recCli.reduce(function(a,r){return a+num(r.valor);},0));
    h+=tabela('Despesas da empresa',desp.map(function(i){return [E(i.nome),i.tipo==='saida'?'Conta':'Cartão',ROT_REEMB[statusReemb(i)],RK(i.valor)];}),['Descrição','Meio','Reembolso','Valor'],'Nenhuma despesa da empresa neste mês.',totDesp);
    h+=tabela('Parcelas de dívidas da empresa',divs.map(function(d){return [E(d.nome),'até '+E(d.fim),RK(d.parcela)];}),['Contrato','Término','Parcela'],'Nenhuma parcela da empresa neste mês.',totDiv);
    h+='<h3>Pendências</h3><table class="bm-tabela"><tbody><tr><td>A receber de clientes ('+pend.length+' parcela(s))</td><td>'+RK(totPend)+'</td></tr><tr><td>Despesas do mês ainda não reembolsadas</td><td>'+RK(reemb)+'</td></tr></tbody></table>';
    h+='<p style="font-size:11px;color:#8A949F;margin-top:18px">Repasses consideram as entradas classificadas como salário, exceto as do SENGE. Em janeiro e fevereiro as entradas foram lançadas de forma agregada e podem incluir outras fontes.</p></div>';
    c.innerHTML=h;
  }

  var RENDER={'bm-painel':renderPainel,'bm-despesas':renderDespesas,'bm-dividas':renderDividas,'bm-relatorio':renderRelatorio};

  /* Marca, em Dívidas e financiamentos, quais contratos são da empresa. */
  function marcarFinanc(){
    var pg=$('#v-financ');if(!pg)return;
    $$('.sec .sec-t',pg).forEach(function(t){
      if(t.querySelector('.v40-tag-emp'))return;
      var c=contratoDe(t.textContent);
      if(c&&escopoContrato(c)==='empresa'){var s=document.createElement('span');s.className='v40-tag-emp';s.textContent='Empresa';s.title='Contrato da B&M — veja em Empresa › Dívidas da empresa';s.setAttribute('data-ir','bm-dividas');t.appendChild(s);}
    });
    if(!$('#v40-nota-financ',pg)){
      var emp=CONTRATOS.filter(function(c){return escopoContrato(c)==='empresa';}).map(function(c){return c.nome.split(' —')[0];});
      if(emp.length){
        var n=document.createElement('div');n.id='v40-nota-financ';n.className='v40-nota';
        n.innerHTML='Os totais desta tela somam todos os contratos. Os da empresa (<b>'+E(emp.join(', '))+'</b>) também aparecem em <a data-ir="bm-dividas">Empresa › Dívidas da empresa</a>, onde a classificação pode ser alterada.';
        var sub=$('.pg-sub',pg);if(sub)sub.insertAdjacentElement('afterend',n);else pg.insertBefore(n,pg.firstChild);
      }
    }
  }

  /* ---------- eventos ---------- */
  document.addEventListener('click',function(ev){
    var t=ev.target.closest&&ev.target.closest('[data-ir],[data-fm],[data-reemb],[data-pessoal],[data-empresa],[data-esc],[data-mr],#bm-imprimir');
    if(!t)return;
    if(t.hasAttribute('data-ir')){ev.preventDefault();ir(t.getAttribute('data-ir'));return;}
    if(t.hasAttribute('data-fm')){filtroDesp=+t.getAttribute('data-fm');renderDespesas();return;}
    if(t.hasAttribute('data-mr')){mesRel=+t.getAttribute('data-mr');renderRelatorio();return;}
    if(t.id==='bm-imprimir'){window.print();return;}
    if(t.hasAttribute('data-esc')){var p=t.getAttribute('data-esc').split('|');setEscopoContrato(p[0],p[1]);renderDividas();toast(p[1]==='empresa'?'Contrato passou para a Empresa.':'Contrato passou para Pessoal.');return;}
    var id=t.getAttribute('data-reemb')||t.getAttribute('data-pessoal')||t.getAttribute('data-empresa');
    var it=(DB.items||[]).filter(function(i){return String(i.id)===id;})[0];if(!it)return;
    if(t.hasAttribute('data-reemb')){var s=statusReemb(it);it.reemb=s==='pendente'?'ok':(s==='ok'?'na':undefined);if(!it.reemb)delete it.reemb;}
    else if(t.hasAttribute('data-pessoal')){it.escopo='pessoal';toast('"'+it.nome+'" agora conta como gasto pessoal.');}
    else{it.escopo='empresa';toast('"'+it.nome+'" agora é despesa da empresa.');}
    dbSave();renderDespesas();
  });

  /* ---------- ganchos de navegação ---------- */
  garantirPaginas();
  var _render=window.render;
  window.render=function(){
    var r=_render.apply(this,arguments);
    try{
      var v=typeof vAtual!=='undefined'?vAtual:'';
      if(RENDER[v])RENDER[v]();
      if(v==='financ'){marcarFinanc();setTimeout(marcarFinanc,150);}
    }catch(e){console.error('Aba Empresa',e);}
    return r;
  };
  try{render=window.render;}catch(e){}

  window.BM={paginas:PAGINAS,ehDespesaEmpresa:ehDespesaEmpresa,despesasEmpresa:despesasEmpresa,repassesMes:repassesMes,dividas:dividas,contratos:CONTRATOS,escopoContrato:escopoContrato,setEscopoContrato:setEscopoContrato,MES_HOJE:MES_HOJE};
})();
