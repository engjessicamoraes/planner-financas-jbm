/* Conferência permanente da fatura com o banco.
   Para os meses em que a fatura do banco está guardada no site (window.__FATURA_BANCO),
   compara lançamento a lançamento (data, valor e parcela; com até 3 dias de folga para os
   digitados à mão) e mostra, no resumo da fatura, quanto o site tem a mais ou a menos que o
   banco. A janela de revisão lista o que está sobrando, com Excluir ou Manter, e o que
   está faltando, com Incluir. */
(function(){
  'use strict';
  function $(s,r){return (r||document).querySelector(s);}
  function sv(x){return (Math.round((+x||0)*100)/100).toFixed(2);}
  function pn(p){var m=String(p||'').match(/(\d+)\s*\/\s*(\d+)/);return m?(+m[1])+'/'+(+m[2]):'';}
  function dias(a,b){return Math.abs(Math.round((new Date(a+'T12:00:00')-new Date(b+'T12:00:00'))/86400000));}
  function brl(v){return 'R$ '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function dm(d){return d?d.slice(8,10)+'/'+d.slice(5,7):'';}
  function banco(m){return (window.__FATURA_BANCO||{})[m]||null;}

  function conferir(m){
    var b=banco(m);if(!b||typeof DB==='undefined')return null;
    var livres=DB.items.filter(function(i){return i.mes===m&&i.tipo==='cartao';});
    var faltam=[];
    b.itens.forEach(function(r){
      var c={data:r[0],nome:r[1],valor:r[2],parcela:r[3]};
      var k=-1;
      for(var j=0;j<livres.length;j++){var i=livres[j];if(i.data===c.data&&sv(i.valor)===sv(c.valor)&&pn(i.parcela)===pn(c.parcela)){k=j;break;}}
      if(k<0)for(var j2=0;j2<livres.length;j2++){var i2=livres[j2];if(sv(i2.valor)===sv(c.valor)&&i2.data&&dias(i2.data,c.data)<=3&&(!i2.parcela||pn(i2.parcela)===pn(c.parcela))){k=j2;break;}}
      if(k>=0)livres.splice(k,1);else faltam.push(c);
    });
    var site=typeof faturaTotal==='function'?faturaTotal(m):0;
    var extras=livres.filter(function(i){return !i._mantido;}),mantidos=livres.filter(function(i){return i._mantido;});
    function soma(l){return l.reduce(function(a,i){return a+(+i.valor||0);},0);}
    return {banco:b.total,site:site,extras:extras,mantidos:mantidos,faltam:faltam,somaExtras:soma(extras),somaMantidos:soma(mantidos),somaFaltam:soma(faltam),fonte:b.fonte||''};
  }
  window.conferirFatura=conferir;

  function salvarERender(){try{dbSave();}catch(e){}try{render();}catch(e){}}

  function linha(i,botoes){
    return '<div class="cf40-li"><span class="d">'+esc(dm(i.data))+'</span><span class="n">'+esc(i.nome)
      +'<small>'+esc([i.cat,i.parcela?('parcela '+i.parcela):''].filter(Boolean).join(' · '))+'</small></span>'
      +'<b>'+brl(i.valor)+'</b><span class="bt">'+botoes+'</span></div>';
  }
  window.revisarFatura=function(m){
    var r=conferir(m);if(!r)return;
    var old=$('#cf40');if(old)old.remove();
    var ov=document.createElement('div');ov.id='cf40';
    var h='<div class="cf40-box"><div class="cf40-t">Fatura de '+(typeof MESES!=='undefined'?MESES[m-1]:m)+' × banco</div>'
      +'<div class="cf40-s">Banco: <b>'+brl(r.banco)+'</b> · Site: <b>'+brl(r.site)+'</b>'+(r.fonte?' <span>('+esc(r.fonte)+')</span>':'')+'</div>';
    if(r.extras.length){
      h+='<div class="cf40-h">No site, mas não na fatura do banco · '+brl(r.somaExtras)+'</div>'
        +'<div class="cf40-p">Se for uma compra repetida ou digitada com outro valor, exclua. Se for de outro cartão ou de propósito, mantenha.</div>'
        +r.extras.map(function(i){return linha(i,'<button data-cf-del="'+esc(i.id)+'">Excluir</button><button data-cf-keep="'+esc(i.id)+'">Manter</button>');}).join('');
    }
    if(r.faltam.length){
      h+='<div class="cf40-h">Na fatura do banco, mas não no site · '+brl(r.somaFaltam)+'</div>'
        +r.faltam.map(function(c,k){return linha(c,'<button data-cf-add="'+k+'">Incluir</button>');}).join('');
    }
    if(!r.extras.length&&!r.faltam.length)h+='<div class="cf40-ok">✓ Todos os lançamentos conferem com o banco.</div>';
    if(r.mantidos.length)h+='<div class="cf40-p" style="margin-top:10px">'+r.mantidos.length+' lançamento(s) mantido(s) de propósito somam '+brl(r.somaMantidos)+'. <a href="#" data-cf-unkeep="1">Voltar a revisar</a></div>';
    h+='<div class="cf40-f"><button id="cf40-ok">Concluir</button></div></div>';
    ov.innerHTML=h;document.body.appendChild(ov);
    ov.addEventListener('click',function(e){
      var t=e.target;if(!t||!t.getAttribute)return;
      var id;
      if((id=t.getAttribute('data-cf-del'))){DB.items=DB.items.filter(function(i){return String(i.id)!==id;});salvarERender();window.revisarFatura(m);return;}
      if((id=t.getAttribute('data-cf-keep'))){DB.items.forEach(function(i){if(String(i.id)===id)i._mantido=1;});salvarERender();window.revisarFatura(m);return;}
      if((id=t.getAttribute('data-cf-add'))!==null&&t.hasAttribute('data-cf-add')){
        var c=r.faltam[+id];var cat='Revisar categoria';try{if(typeof catCartao==='function')cat=catCartao(c.nome);}catch(x){}
        DB.items.push({id:(typeof mkId==='function'?mkId():'cf'+Date.now()),mes:m,nome:c.nome,valor:c.valor,cat:cat,tipo:'cartao',parcela:c.parcela||'',data:c.data,obs:'',_src:'fatura-pdf'});
        salvarERender();window.revisarFatura(m);return;}
      if(t.getAttribute('data-cf-unkeep')){e.preventDefault();DB.items.forEach(function(i){if(i.mes===m&&i._mantido)delete i._mantido;});salvarERender();window.revisarFatura(m);return;}
      if(t.id==='cf40-ok'||t===ov)ov.remove();
    });
  };

  function aviso(){
    var old=$('#cf40-aviso');
    if(typeof vAtual!=='undefined'&&vAtual!=='mes'){if(old)old.remove();return;}
    var m=typeof mesAtual!=='undefined'?mesAtual:null;
    var host=$('#resumo-fatura-host .rf-wrap');
    var r=m?conferir(m):null;
    if(!host||!r){if(old)old.remove();return;}
    var dif=Math.round((r.site-r.banco)*100)/100;
    var ok=!r.extras.length&&!r.faltam.length;
    var txt;
    if(ok)txt='✓ Confere com a fatura do banco ('+brl(r.banco)+')'+(r.mantidos.length?' · '+brl(r.somaMantidos)+' mantidos de propósito':'');
    else txt=(r.extras.length?r.extras.length+' lançamento(s) no site que não estão na fatura do banco ('+brl(r.somaExtras)+')':'')
      +(r.extras.length&&r.faltam.length?' e ':'')
      +(r.faltam.length?r.faltam.length+' da fatura que faltam no site ('+brl(r.somaFaltam)+')':'')
      +' · diferença de '+brl(Math.abs(dif));
    var html='<span class="dot"></span><span class="tx">'+txt+'</span>'+(ok?'':'<button type="button" id="cf40-rev">Revisar</button>');
    if(!old){old=document.createElement('div');old.id='cf40-aviso';}
    old.className='cf40-aviso '+(ok?'ok':'bad');old.innerHTML=html;
    var k=host.querySelector('.rf-kpis');
    if(k&&k.nextSibling!==old)k.parentNode.insertBefore(old,k.nextSibling);else if(!k&&old.parentNode!==host)host.appendChild(old);
    var b=$('#cf40-rev');if(b)b.onclick=function(){window.revisarFatura(m);};
  }
  function agendar(){setTimeout(aviso,120);}
  var st=document.createElement('style');
  st.textContent='.cf40-aviso{display:flex;align-items:center;gap:10px;margin-top:12px;padding:9px 12px;border-radius:10px;font-size:12.5px;border:1px solid var(--bd,#e0d8ce)}'
    +'.cf40-aviso .dot{width:8px;height:8px;border-radius:50%;flex:none}.cf40-aviso.ok .dot{background:var(--ok,#2F7D59)}.cf40-aviso.bad .dot{background:#C8902B}'
    +'.cf40-aviso.bad{background:rgba(200,144,43,.08)}.cf40-aviso .tx{flex:1;line-height:1.4}'
    +'.cf40-aviso button,.cf40-li button{border:1px solid var(--bd,#e0d8ce);background:var(--card,#fff);border-radius:8px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer;color:inherit}'
    +'#cf40{position:fixed;inset:0;z-index:99990;background:rgba(30,20,25,.45);display:flex;align-items:center;justify-content:center;padding:16px}'
    +'.cf40-box{background:var(--card,#fff);color:var(--t1,#2b2024);max-width:620px;width:100%;max-height:86vh;overflow:auto;border-radius:14px;padding:20px;font-family:Inter,Arial,sans-serif}'
    +'.cf40-t{font-weight:700;font-size:16px}.cf40-s{font-size:13px;margin:4px 0 8px}.cf40-s span{color:var(--t3,#a89080);font-size:11.5px}'
    +'.cf40-h{font-weight:700;font-size:13px;margin:14px 0 2px}.cf40-p{font-size:12px;color:var(--t2,#6d5a60);line-height:1.45;margin-bottom:4px}'
    +'.cf40-li{display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--bd,#e0d8ce);font-size:13px}'
    +'.cf40-li .d{width:42px;color:var(--t3,#a89080);font-size:12px;flex:none}.cf40-li .n{flex:1;min-width:0}.cf40-li small{display:block;color:var(--t3,#a89080);font-size:11px}'
    +'.cf40-li .bt{display:flex;gap:6px}.cf40-ok{margin:14px 0;color:var(--ok,#2F7D59);font-weight:600}'
    +'.cf40-f{text-align:right;margin-top:14px}#cf40-ok{background:var(--m,#4B1F39);color:#fff;border:0;border-radius:9px;padding:9px 16px;font-weight:600;cursor:pointer}'
    +'@media(max-width:560px){.cf40-li{flex-wrap:wrap}.cf40-li .bt{width:100%;justify-content:flex-end}}';
  document.head.appendChild(st);
  var _r=window.render;if(typeof _r==='function'){window.render=function(){var x=_r.apply(this,arguments);agendar();return x;};try{render=window.render;}catch(e){}}
  var _g=window.goTo;if(typeof _g==='function'){window.goTo=function(){var x=_g.apply(this,arguments);agendar();return x;};try{goTo=window.goTo;}catch(e){}}
  window.addEventListener('dados-atualizados',agendar);
  agendar();
})();
