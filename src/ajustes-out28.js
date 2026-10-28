/* Ajustes pedidos em 28/10/2026, aplicados uma única vez depois que os dados da nuvem chegam:
   1. Tetos do Orçamento com as metas de corte combinadas (supermercado, restaurante, delivery,
      assinaturas, transporte, roupas e cuidados pessoais).
   2. Mensalidades do SENGE de janeiro a dezembro de 2027 em "A receber de clientes"
      (o contrato vai até dezembro de 2029; o site acompanha até 2027). */
(function(){
  'use strict';
  var FLAG='_ajustesOut28Em';
  var TETOS={'Supermercado':2200,'Mercadinho':300,'Restaurante':250,'Delivery':150,'Assinaturas / Apps':150,
    'Combustível':1100,'Carro / Transporte':420,'Vestuário':50,'Cuidados pessoais':50,'Farmácia':500,'Saúde':900};
  function nuvemPronta(){if(window.__modoLocal||!window.__motorFinancas)return true;var M=window.__motorFinancas;return !M.primeiro;}
  function aplicar(){
    if(typeof DB==='undefined'||!DB.items)return false;
    if(DB[FLAG])return true;
    /* 1. tetos */
    try{
      var k=typeof METAS_SK!=='undefined'?METAS_SK:'metas26v1';
      var o={};try{o=JSON.parse(localStorage.getItem(k)||'{}');}catch(e){}
      DB._metasAntesOut28=JSON.parse(JSON.stringify(o));
      Object.keys(TETOS).forEach(function(c){o[c]=TETOS[c];});
      localStorage.setItem(k,JSON.stringify(o));
    }catch(e){console.error('tetos',e);}
    /* 2. SENGE 2027 */
    var n=0;
    try{
      var P=DB.parcs=DB.parcs||[];
      var base=P.filter(function(p){return p.n==='SENGE'&&parseInt(p.mes,10)>=1;}).sort(function(a,b){return b.mes-a.mes;})[0];
      if(base){
        for(var m=1;m<=12;m++){
          var pv='2027-'+('0'+m).slice(-2);
          if(P.some(function(p){return p.n==='SENGE'&&p.previsto===pv;}))continue;
          P.push({id:(typeof mkId==='function'?mkId():'s'+Date.now()+m),n:'SENGE',ref:base.ref||'Mensalidade',v:+base.v,p:'-',s:'pendente',tipo:base.tipo||'mensal',mes:null,previsto:pv,obs:'Contrato até dezembro de 2029'});
          n++;
        }
      }
    }catch(e){console.error('senge',e);}
    DB[FLAG]=new Date().toISOString();
    try{dbSave();}catch(e){}
    try{render();}catch(e){}
    try{toast('Orçamento com as novas metas'+(n?' e '+n+' mensalidades do SENGE de 2027 em A receber':'')+'.');}catch(e){}
    return true;
  }
  var t=0,iv=setInterval(function(){t++;try{if(nuvemPronta()&&aplicar()){clearInterval(iv);}}catch(e){console.error(e);clearInterval(iv);}if(t>600)clearInterval(iv);},500);
})();
