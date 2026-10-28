/* A receber de clientes — organização por mês e por etapa.
   - "Por mês": o que vence até o mês atual (inclusive atrasados) e os próximos meses.
   - "Por etapa": parcelas sem mês definido, que dependem de uma etapa do serviço;
     dá para marcar como recebida ou escolher o mês previsto ali mesmo.
   - "Recebidos": tudo o que já entrou, com opção de desmarcar.
   Cada linha tem uma caixa "Recebido" que marca e desmarca. */
(function(){
  'use strict';
  function $(s,r){return (r||document).querySelector(s);}
  function $$(s,r){return [].slice.call((r||document).querySelectorAll(s));}
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function R(v){return typeof RK==='function'?RK(v):'R$ '+(+v||0).toFixed(2);}
  function ANO(){return typeof ANO_PLANILHA!=='undefined'?ANO_PLANILHA:new Date().getFullYear();}
  /* índice do mês: 1–12 no ano da planilha; 13 em diante para o ano seguinte (campo "previsto": "2027-01") */
  function mesDe(p){
    var m=parseInt(p.mes,10);if(m>=1&&m<=12)return m;
    var pv=String(p.previsto||'').match(/^(\d{4})-(\d{2})/);if(pv){var i=(+pv[1]-ANO())*12+(+pv[2]);if(i>=1)return i;}
    return 0;
  }
  function nomeMes(i){return i<=12?MESES[i-1]:MESES[(i-1)%12]+' '+(ANO()+Math.floor((i-1)/12));}
  function definirMes(p,i){
    if(!i){p.mes=null;delete p.previsto;return;}
    if(i<=12){p.mes=i;delete p.previsto;return;}
    p.mes=null;var a=ANO()+Math.floor((i-1)/12),mm=((i-1)%12)+1;p.previsto=a+'-'+('0'+mm).slice(-2);
  }
  function mesHoje(){var d=new Date();var ano=typeof ANO_PLANILHA!=='undefined'?ANO_PLANILHA:d.getFullYear();return d.getFullYear()>ano?13:(d.getFullYear()<ano?0:d.getMonth()+1);}
  function desc(p){
    var r=(p.ref&&String(p.ref).trim()&&String(p.ref).trim()!=='-')?String(p.ref).trim():(p.tipo==='mensal'?'Mensalidade':'Etapa');
    return r+(p.p&&p.p!=='-'?' · parcela '+p.p:'');
  }
  function soma(l){return l.reduce(function(a,p){return a+(+p.v||0);},0);}
  var aba='mes',mesVer=0;

  function salvarERender(){try{dbSave();}catch(e){}try{if(typeof buildSb==='function')buildSb();}catch(e){}desenhar();}

  function linha(p,opc){
    var rec=p.s!=='pendente',m=mesDe(p);
    var mesSel='';
    if(opc.mesSel){
      mesSel='<select class="rc-mes" data-rc-mes="'+esc(p.id)+'" title="Mês previsto"><option value="">Sem mês</option>'
        +Array.apply(null,{length:24}).map(function(_,k){return k+1;}).map(function(i){return '<option value="'+i+'"'+(m===i?' selected':'')+'>'+nomeMes(i)+'</option>';}).join('')+'</select>';
    }
    return '<div class="rc-row'+(rec?' rec':' pend')+'">'
      +'<label class="rc-ck" title="Marcar ou desmarcar como recebido"><input type="checkbox" data-rc-ok="'+esc(p.id)+'"'+(rec?' checked':'')+'><span>'+(rec?'Recebido':'Receber')+'</span></label>'
      +'<div class="rc-d">'+(opc.cliente?'<b>'+esc(p.n||'Sem nome')+'</b> · ':'')+esc(desc(p))
      +(rec&&p.recebidoEm?'<small>recebido em '+esc(p.recebidoEm.slice(8,10)+'/'+p.recebidoEm.slice(5,7))+'</small>':'')+'</div>'
      +(opc.mesSel?mesSel:'<div class="rc-m">'+(m?nomeMes(m):'Sem mês')+'</div>')
      +'<div class="rc-v">'+R(p.v)+'</div>'
      +'<button class="c31-b" data-edit-parc="'+esc(p.id)+'" title="Editar">✎</button>'
      +'<button class="c31-b" data-del-parc="'+esc(p.id)+'" title="Excluir">×</button></div>';
  }
  function bloco(titulo,total,linhas,extra){
    return '<div class="rc-grp"><div class="rc-gh"><div class="nm">'+titulo+(extra?' <span>'+extra+'</span>':'')+'</div><div class="tt">'+R(total)+'</div></div>'+linhas+'</div>';
  }

  function desenhar(){
    var pg=$('#v-parcelamentos');if(!pg)return;
    var host=$('#ar32',pg);if(!host)return;
    var P=DB.parcs||[],hoje=mesHoje();
    var pend=P.filter(function(p){return p.s==='pendente';}),rec=P.filter(function(p){return p.s!=='pendente';});
    var semMes=pend.filter(function(p){return !mesDe(p);});
    var ateAgora=pend.filter(function(p){var m=mesDe(p);return m&&m<=hoje;});
    var proximos=pend.filter(function(p){var m=mesDe(p);return m&&m>hoje;});
    var meses={};P.forEach(function(p){var m=mesDe(p);if(m)(meses[m]=meses[m]||[]).push(p);});
    var ultimo=Math.max(12,Object.keys(meses).map(Number).reduce(function(a,b){return Math.max(a,b);},0));
    if(!mesVer)mesVer=Math.min(Math.max(hoje,1),ultimo);
    var h='<div class="ar32-bar"><div class="pd32-tabs">'
      +[['mes','Por mês'],['etapa','Por etapa ('+semMes.length+')'],['cliente','Por cliente']]
        .map(function(a){return '<button class="pd32-tab'+(aba===a[0]?' on':'')+'" data-rc-aba="'+a[0]+'">'+a[1]+'</button>';}).join('')
      +'</div><button class="pl-btn" id="rc-add">+ Adicionar</button></div>';

    if(aba==='mes'){
      var doMes=(meses[mesVer]||[]).slice().sort(function(a,b){return String(a.n).localeCompare(String(b.n))||String(a.p).localeCompare(String(b.p));});
      var previsto=soma(doMes),recebido=soma(doMes.filter(function(p){return p.s!=='pendente';})),falta=previsto-recebido;
      var nFalta=doMes.filter(function(p){return p.s==='pendente';}).length;
      h+='<div class="rc-nav"><button data-rc-mesnav="-1" aria-label="Mês anterior"'+(mesVer<=1?' disabled':'')+'>‹</button><div class="t">'+nomeMes(mesVer)+(mesVer<=12?' '+ANO():'')+'</div><button data-rc-mesnav="1" aria-label="Próximo mês"'+(mesVer>=ultimo?' disabled':'')+'>›</button></div>'
        +'<div class="rc-kpis3">'
        +'<div><div class="l">A receber no mês</div><div class="v">'+R(previsto)+'</div><div class="s">'+doMes.length+' parcela(s)</div></div>'
        +'<div class="ok"><div class="l">Recebido</div><div class="v">'+R(recebido)+'</div><div class="s">'+(doMes.length-nFalta)+' parcela(s)</div></div>'
        +'<div class="'+(nFalta?'bad':'ok')+'"><div class="l">Falta receber</div><div class="v">'+R(falta)+'</div><div class="s">'+(nFalta?nFalta+' parcela(s)':'tudo recebido ✓')+'</div></div>'
        +'</div>';
      /* faixa com os meses do ano: vermelho = falta receber, verde = tudo recebido */
      h+='<div class="rc-ano">';
      for(var i=1;i<=ultimo;i++){
        var l=meses[i]||[],f=soma(l.filter(function(p){return p.s==='pendente';}));
        var cls=!l.length?'vazio':(f>0.004?(i<=hoje?'bad':'fut'):'ok');
        h+='<button class="rc-chip '+cls+(i===mesVer?' on':'')+'" data-rc-mes-ir="'+i+'"><b>'+nomeMes(i).slice(0,3)+(i>12?'/'+String(ANO()+Math.floor((i-1)/12)).slice(2):'')+'</b><span>'+(!l.length?'—':(f>0.004?R(f):'✓'))+'</span></button>';
      }
      h+='</div>';
      h+='<div class="rc-mesview">';
      if(!doMes.length)h+='<div class="pl-empty">Nenhuma parcela prevista para '+nomeMes(mesVer)+'.</div>';
      else h+=bloco(nomeMes(mesVer),previsto,doMes.map(function(p){return linha(p,{cliente:true});}).join(''),nFalta?nFalta+' em aberto':'tudo recebido');
      h+='</div>';
      if(semMes.length)h+='<div class="rc-dica">Fora dos meses: '+semMes.length+' parcela(s) que dependem de etapa, somando '+R(soma(semMes))+'. <a href="#" data-rc-aba="etapa">Ver por etapa</a></div>';
    }else if(aba==='etapa'){
      h+='<div class="rc-dica">Parcelas que dependem de uma etapa do serviço (aprovação, emissão de certificado, entrega). Quando a etapa acontecer, marque como recebida; se já souber o mês, escolha ao lado.</div>';
      if(!semMes.length)h+='<div class="pl-empty">Nenhuma parcela sem mês.</div>';
      var porC={};semMes.forEach(function(p){(porC[p.n||'Sem nome']=porC[p.n||'Sem nome']||[]).push(p);});
      Object.keys(porC).sort().forEach(function(n){h+=bloco(esc(n),soma(porC[n]),porC[n].map(function(p){return linha(p,{mesSel:true});}).join(''));});
    }else if(aba==='recebido'){
      if(!rec.length)h+='<div class="pl-empty">Nada recebido ainda.</div>';
      var porR={};rec.forEach(function(p){var k=mesDe(p)||0;(porR[k]=porR[k]||[]).push(p);});
      Object.keys(porR).map(Number).sort(function(a,b){return b-a;}).forEach(function(m){
        h+=bloco(m?nomeMes(m):'Sem mês',soma(porR[m]),porR[m].map(function(p){return linha(p,{cliente:true});}).join(''));
      });
    }else{
      var porN={};P.forEach(function(p){(porN[p.n||'Sem nome']=porN[p.n||'Sem nome']||[]).push(p);});
      Object.keys(porN).sort().forEach(function(n){
        var l=porN[n].slice().sort(function(a,b){return (mesDe(a)||99)-(mesDe(b)||99);});
        var ab=soma(l.filter(function(p){return p.s==='pendente';}));
        h+=bloco(esc(n),soma(l),l.map(function(p){return linha(p,{mesSel:true});}).join(''),ab?R(ab)+' em aberto':'tudo recebido');
      });
    }
    host.innerHTML=h;
    host.classList.add('rc-on');
    $$('[data-rc-aba]',host).forEach(function(b){b.onclick=function(e){e.preventDefault();aba=this.getAttribute('data-rc-aba');desenhar();};});
    var faixa=$('.rc-ano',host),on=faixa&&$('.rc-chip.on',faixa);
    if(on)faixa.scrollLeft=Math.max(0,on.offsetLeft-faixa.offsetLeft-(faixa.clientWidth-on.offsetWidth)/2);
    $$('[data-rc-mesnav]',host).forEach(function(b){b.onclick=function(){mesVer+=parseInt(this.getAttribute('data-rc-mesnav'),10);desenhar();};});
    $$('[data-rc-mes-ir]',host).forEach(function(b){b.onclick=function(){mesVer=parseInt(this.getAttribute('data-rc-mes-ir'),10);desenhar();};});
    var add=$('#rc-add',host);if(add)add.onclick=function(){if(typeof abrirFormParc==='function')abrirFormParc();};
    $$('[data-rc-ok]',host).forEach(function(c){c.onchange=function(){
      var id=this.getAttribute('data-rc-ok'),p=(DB.parcs||[]).filter(function(x){return String(x.id)===id;})[0];if(!p)return;
      var antes={s:p.s,em:p.recebidoEm};
      if(this.checked){p.s='recebido';p.recebidoEm=new Date().toISOString().slice(0,10);}else{p.s='pendente';delete p.recebidoEm;}
      salvarERender();
      var msg=(this.checked?'Marcado como recebido: ':'Voltou para a receber: ')+(p.n||'')+' · '+R(p.v);
      if(typeof showUndo==='function')showUndo(msg,function(){p.s=antes.s;if(antes.em)p.recebidoEm=antes.em;else delete p.recebidoEm;salvarERender();});
      else try{toast(msg);}catch(e){}
    };});
    $$('[data-rc-mes]',host).forEach(function(s){s.onchange=function(){
      var id=this.getAttribute('data-rc-mes'),p=(DB.parcs||[]).filter(function(x){return String(x.id)===id;})[0];if(!p)return;
      var i=this.value?parseInt(this.value,10):0;definirMes(p,i);salvarERender();
      try{toast(i?'Previsto para '+nomeMes(i)+'.':'Parcela sem mês (por etapa).');}catch(e){}
    };});
  }
  window.renderReceberClientes=desenhar;

  /* o formulário de "Adicionar" deixa claro que dá para lançar sem mês */
  window.popularMesParcelamento=function(){var s=document.getElementById('p-mes');if(!s)return;
    s.innerHTML='<option value="">Sem mês — depende da etapa</option>'+MESES.map(function(n,i){return '<option value="'+(i+1)+'">'+n+' '+(typeof ANO_PLANILHA!=='undefined'?ANO_PLANILHA:'')+'</option>';}).join('');};
  try{popularMesParcelamento=window.popularMesParcelamento;}catch(e){}

  function depois(){if(typeof vAtual!=='undefined'&&vAtual==='parcelamentos')setTimeout(desenhar,0);}
  if(typeof window.renderParcelamentos==='function'){var _rp=window.renderParcelamentos;window.renderParcelamentos=function(){var x=_rp.apply(this,arguments);depois();return x;};try{renderParcelamentos=window.renderParcelamentos;}catch(e){}}
  var _r=window.render;if(typeof _r==='function'){window.render=function(){var x=_r.apply(this,arguments);depois();return x;};try{render=window.render;}catch(e){}}
  var _g=window.goTo;if(typeof _g==='function'){window.goTo=function(){var x=_g.apply(this,arguments);setTimeout(depois,90);return x;};try{goTo=window.goTo;}catch(e){}}
  window.addEventListener('dados-atualizados',depois);

  var st=document.createElement('style');
  st.textContent='#ar32.rc-on>.ar32-kpis{display:none}'
    +'.rc-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:6px 0 16px}'
    +'.rc-kpis>button{text-align:left;background:var(--card,#fff);border:1px solid var(--bd,#DDE1E6);border-radius:14px;padding:14px 16px;cursor:pointer;font:inherit;color:inherit}'
    +'.rc-kpis>button:hover{border-color:var(--m,#8D5F78)}'
    +'.rc-kpis .l{font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--t3,#8A949F)}'
    +'.rc-kpis .v{font:700 20px Outfit,Inter,sans-serif;margin-top:4px;font-variant-numeric:tabular-nums}.rc-kpis .v.ok{color:var(--ok,#2F7D59)}.rc-kpis .v.warn{color:#A8661B}'
    +'.rc-kpis .s{font-size:11.5px;color:var(--t3,#8A949F);margin-top:2px}'
    +'.rc-grp{background:var(--card,#fff);border:1px solid var(--bd,#DDE1E6);border-radius:14px;margin-bottom:10px;overflow:hidden}'
    +'.rc-gh{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:var(--bg,#F6F7F9);border-bottom:1px solid var(--bds,#ECEFF2)}'
    +'.rc-gh .nm{font-weight:700;font-size:13.5px}.rc-gh .nm span{font-weight:500;font-size:11.5px;color:var(--t3,#8A949F);margin-left:6px}.rc-gh .tt{font-weight:700;font-size:13.5px;font-variant-numeric:tabular-nums}'
    +'.rc-row{display:grid;grid-template-columns:104px minmax(0,1fr) 120px 110px 28px 28px;gap:10px;align-items:center;padding:8px 16px;border-bottom:1px solid var(--bds,#ECEFF2)}'
    +'.rc-row:last-child{border-bottom:0}.rc-d{font-size:13px;color:var(--t2,#5A6470);min-width:0}.rc-d b{color:var(--t,#27303B);font-weight:600}.rc-d small{display:block;font-size:11px;color:var(--ok,#2F7D59)}'
    +'.rc-m{font-size:12px;color:var(--t3,#8A949F)}.rc-v{text-align:right;font-weight:600;font-size:13px;font-variant-numeric:tabular-nums}'
    +'.rc-row.rec .rc-v{color:var(--ok,#2F7D59)}'
    +'.rc-ck{display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-size:12px;font-weight:600;color:var(--t2,#5A6470);user-select:none}'
    +'.rc-ck input{width:18px;height:18px;accent-color:var(--ok,#2F7D59);cursor:pointer;margin:0}.rc-row.rec .rc-ck{color:var(--ok,#2F7D59)}'
    +'.rc-mes{font:500 12px Inter,sans-serif;border:1px solid var(--bd,#DDE1E6);border-radius:8px;padding:5px 6px;background:var(--card,#fff);color:inherit;width:100%}'
    +'.rc-dica{font-size:12.5px;color:var(--t2,#5A6470);line-height:1.5;margin:4px 2px 12px}.rc-dica a{color:var(--m,#8D5F78);font-weight:600}'
    +'.rc-nav{display:flex;align-items:center;justify-content:center;gap:14px;margin:4px 0 12px}.rc-nav .t{font:700 18px Outfit,Inter,sans-serif;min-width:170px;text-align:center}'
    +'.rc-nav button{width:34px;height:34px;border-radius:10px;border:1px solid var(--bd,#DDE1E6);background:var(--card,#fff);font-size:18px;cursor:pointer;color:inherit}.rc-nav button:disabled{opacity:.35;cursor:default}'
    +'.rc-kpis3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:12px}'
    +'.rc-kpis3>div{background:var(--card,#fff);border:1px solid var(--bd,#DDE1E6);border-radius:14px;padding:13px 16px}'
    +'.rc-kpis3 .l{font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--t3,#8A949F)}'
    +'.rc-kpis3 .v{font:700 21px Outfit,Inter,sans-serif;margin-top:4px;font-variant-numeric:tabular-nums}.rc-kpis3 .s{font-size:11.5px;color:var(--t3,#8A949F);margin-top:2px}'
    +'.rc-kpis3 .ok .v,.rc-kpis3 .ok.v{color:#2F7D59}.rc-kpis3>.ok .v{color:#2F7D59}.rc-kpis3>.bad .v{color:#B23B3B}.rc-kpis3>.bad{border-color:#EBC4C4;background:#FDF5F5}.rc-kpis3>.ok:last-child{border-color:#BFE0CC;background:#F2FAF5}'
    +'.rc-ano{display:flex;gap:6px;overflow-x:auto;padding:2px 0 12px;margin-bottom:4px}'
    +'.rc-chip{flex:0 0 auto;min-width:74px;border:1px solid var(--bd,#DDE1E6);background:var(--card,#fff);border-radius:10px;padding:6px 8px;cursor:pointer;text-align:center;font:inherit;color:inherit}'
    +'.rc-chip b{display:block;font-size:11.5px}.rc-chip span{display:block;font-size:10.5px;font-variant-numeric:tabular-nums;margin-top:1px}'
    +'.rc-chip.bad{border-color:#EBC4C4;background:#FDF5F5}.rc-chip.bad span{color:#B23B3B;font-weight:600}.rc-chip.ok{border-color:#BFE0CC;background:#F2FAF5}.rc-chip.ok span{color:#2F7D59;font-weight:700}'
    +'.rc-chip.fut span{color:var(--t2,#5A6470)}.rc-chip.vazio{opacity:.5}.rc-chip.on{outline:2px solid var(--m,#8D5F78);outline-offset:1px}'
    +'.rc-mesview .rc-row.pend{background:#FDF5F5;box-shadow:inset 3px 0 0 #C24A4A}.rc-mesview .rc-row.pend .rc-v{color:#B23B3B}.rc-mesview .rc-row.pend .rc-ck{color:#B23B3B}'
    +'.rc-mesview .rc-row.rec{background:#F2FAF5;box-shadow:inset 3px 0 0 #2F7D59}.rc-mesview .rc-row.rec .rc-v{color:#2F7D59}'
    +'@media(max-width:800px){.rc-kpis3{grid-template-columns:1fr 1fr 1fr;gap:6px}.rc-kpis3>div{padding:10px}.rc-kpis3 .v{font-size:15px}.rc-kpis{grid-template-columns:1fr 1fr}.rc-row{grid-template-columns:auto minmax(0,1fr) auto;row-gap:6px}.rc-row .rc-d{grid-column:2/4}.rc-row .rc-m,.rc-row .rc-mes{grid-column:1/3}.rc-row .rc-v{grid-column:3/4}.rc-row .c31-b{display:none}}';
  document.head.appendChild(st);
  setTimeout(depois,200);
})();
