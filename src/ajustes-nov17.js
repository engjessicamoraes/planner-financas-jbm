/* Atualização de 17/11/2026, aplicada uma única vez depois que os dados da nuvem chegam:
   1. As duas renegociações do Itaú (cartão R$ 2.912,01 e CEP/conta R$ 1.649,92) foram quitadas
      antecipadamente em 17/11/2026 com o crédito da Mútua.
   2. Parcelas 28 (nov/2026) e 29 (dez/2026) do Jeep pagas antecipadamente.
   3. Nova dívida: Mútua — Empreender Mulher, R$ 40.000 creditados em nov/2026, 6 meses de
      carência e 36 parcelas decrescentes (R$ 1.635,30 a R$ 1.225,06), vencimento dia 30. */
(function(){
  'use strict';
  var FLAG='_ajustesNov17Em';
  var MUTUA=[1635.30,1623.58,1611.87,1600.15,1588.43,1576.71,1565.00,1553.28,1541.56,1529.84,1518.13,1506.41,
    1494.69,1482.97,1471.26,1459.54,1447.82,1436.10,1424.38,1412.66,1400.94,1389.23,1377.51,1365.79,
    1354.07,1342.36,1330.64,1318.92,1307.20,1295.49,1283.77,1272.05,1260.33,1248.62,1236.90,1225.06];
  function nuvemPronta(){if(window.__modoLocal||!window.__motorFinancas)return true;return !window.__motorFinancas.primeiro;}
  function aplicar(){
    if(typeof DB==='undefined'||!DB.items||typeof FINANC==='undefined')return false;
    if(DB[FLAG])return true;
    var feito=[];
    /* 1. renegociações quitadas */
    ['cartao_ren_1','cartao_ren_2'].forEach(function(k){var a=[];for(var i=1;i<=20;i++)a.push(i);FINANC[k+'_extras']=a;});
    FINANC.renegQuitadasEm='2026-11-17';
    DB.fixasStatus=DB.fixasStatus||{};
    (DB.fixas||[]).forEach(function(f){
      if(/renegocia/i.test(f.nome||'')||/^fx31-reneg/.test(f.id||'')){
        ['11','12'].forEach(function(m){DB.fixasStatus[m]=DB.fixasStatus[m]||{};DB.fixasStatus[m][f.id]='Não se aplica — contrato quitado em 17/11';});
        f.obs='Quitado antecipadamente em 17/11/2026';
      }
    });
    feito.push('renegociações quitadas');
    /* 2. Jeep: novembro e dezembro antecipados */
    var ex=FINANC.jeep_extras||[];[28,29].forEach(function(n){if(ex.indexOf(n)<0)ex.push(n);});FINANC.jeep_extras=ex;
    (DB.fixas||[]).forEach(function(f){
      if(/jeep/i.test(f.nome||'')||f.id==='fx31-jeep'){
        ['11','12'].forEach(function(m){DB.fixasStatus[m]=DB.fixasStatus[m]||{};DB.fixasStatus[m][f.id]='Pago antecipado em 17/11';});
      }
    });
    feito.push('Jeep nov e dez pagos');
    /* 3. Mútua — Empreender Mulher */
    FINANC.custom=FINANC.custom||[];
    if(!FINANC.custom.some(function(f){return /empreender/i.test(f.n||'');})){
      var fases=MUTUA.map(function(v,k){var idx=4+k;var a=2027+Math.floor(idx/12),m=(idx%12)+1;var ym=a+'-'+('0'+m).slice(-2);return {de:ym,ate:ym,v:v};});
      FINANC.custom.push({id:(typeof mkId==='function'?mkId():'mutua'+Date.now()),n:'Mútua — Empreender Mulher',v:1635.30,enc:'Abr/2030',pagas:0,total:36,custom:true,
        sm:5,sa:2027,em:4,ea:2030,fases:fases,
        obs:'R$ 40.000,00 creditados em nov/2026 (contrato R$ 41.087,40; taxa adm. R$ 52,00). Carência de 6 meses e 36 parcelas decrescentes, de R$ 1.635,30 a R$ 1.225,06, com vencimento no dia 30 (primeira prevista para 30/05/2027 — confirme no portal). Juros 0,4% a.m. + índice (IPCC/IGPM/IPCA). Usado para quitar as duas renegociações do Itaú.'});
      feito.push('Mútua incluída');
    }
    DB[FLAG]=new Date().toISOString();
    try{financSave();}catch(e){}
    try{dbSave();}catch(e){}
    try{render();}catch(e){}
    try{toast('Atualizado: '+feito.join(', ')+'.');}catch(e){}
    return true;
  }
  var t=0,iv=setInterval(function(){t++;try{if(nuvemPronta()&&aplicar())clearInterval(iv);}catch(e){console.error(e);clearInterval(iv);}if(t>600)clearInterval(iv);},500);
})();
