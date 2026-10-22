/* Fatura de outubro/2026 fechada, conferida com o PDF do Itaú (R$ 16.736,84).
   Entra uma única vez, depois que os dados da nuvem chegam, pela mesma conciliação da
   importação de PDF: substitui a leitura parcial de 18/10, reconhece pela data e pelo valor
   o que já estava lançado e remove as cópias repetidas que vieram de importações. Os
   lançamentos digitados à mão que não estão na fatura são mostrados para revisão. */
(function(){
  'use strict';
  var FLAG='_faturaOut26WebEm';
  /* Fatura de outubro/2026 fechada (PDF do Itaú de 22/10/2026): 206 lançamentos, total R$ 16.736,84. */
  var FLAG_F='_faturaOut26FechadaEm';
  var FECHADA=[
    ["2026-06-25", "ZZRSV RS BARRA SUL", 116.67, "4/4"],
    ["2026-06-29", "H&M - Praia de Bel", 98.91, "4/6"],
    ["2026-07-10", "ADIQPLU*DR CARLOS", 58.25, "4/4"],
    ["2026-07-22", "MERCADOLIVRE*MERCA", 50.63, "3/3"],
    ["2026-07-30", "DWJ COMERCIO DE AR", 93.33, "3/3"],
    ["2026-08-27", "BATERIAS FREITAS", 165.34, "2/3"],
    ["2026-08-27", "BATERIAS FREITAS", -0.02, ""],
    ["2026-08-28", "pgz*PALMEIRAS", 107.1, "2/5"],
    ["2026-08-28", "H&M - Iguatemi Por", 103.55, "2/4"],
    ["2026-08-28", "pgz*PALMEIRAS", -0.08, ""],
    ["2026-08-28", "H&M - Iguatemi Porto A", -0.03, ""],
    ["2026-09-08", "PARC*SAMSPORTOALEG", 253.13, "2/3"],
    ["2026-09-10", "ME.LINDA ALPHAVILL", 69.84, "2/3"],
    ["2026-09-10", "ME.LINDA ALPHAVILLE", -0.02, ""],
    ["2026-09-11", "LEROY MERLIN", 106.33, "2/2"],
    ["2026-09-16", "JONAS*PNEUS", 306.7, "2/6"],
    ["2026-09-16", "JONAS*PNEUS", -0.2, ""],
    ["2026-09-19", "RAIA3031", 128.22, "2/2"],
    ["2026-09-20", "Uber UBER *TRIP HELP.U", 4.33, ""],
    ["2026-09-20", "99*", 16.3, ""],
    ["2026-09-21", "BOURBON CANOAS", 56.48, ""],
    ["2026-09-22", "BISTEK SUPERMERCADOS", 161.47, ""],
    ["2026-09-22", "MAURICIO CAIO LTDA", 347.38, ""],
    ["2026-09-22", "WA LOHMANN RESTAURANTE", 63.59, ""],
    ["2026-09-23", "O MERCADINHO", 22.46, ""],
    ["2026-09-23", "ZAFFARI O. NMEYER", 84.68, ""],
    ["2026-09-23", "RAIA DROGASIL SA", 66.24, ""],
    ["2026-09-23", "EC *SHELLBOX", 268.86, ""],
    ["2026-09-23", "COMERCIO VEF", 20.26, ""],
    ["2026-09-24", "ZAFFARI MNO DEUS", 22.03, ""],
    ["2026-09-24", "APPLE.COM/BILL", 249.9, ""],
    ["2026-09-24", "BOURBON WALLIG", 170.75, ""],
    ["2026-09-24", "MARISA 686", 119.98, ""],
    ["2026-09-25", "IRMANDADE DA SANTA CAS", 51, ""],
    ["2026-09-25", "IRMANDADE DA SANTA", 202.15, "1/6"],
    ["2026-09-25", "O MERCADINHO", 9, ""],
    ["2026-09-25", "CARREFOUR CNS 42", 11.74, ""],
    ["2026-09-26", "OKIDOKI*MOINHOS", 77, ""],
    ["2026-09-26", "GOKEI SUSHI", 66.57, ""],
    ["2026-09-26", "PANVEL FILIAL 456", 71.99, ""],
    ["2026-09-26", "O MERCADINHO", 17.5, ""],
    ["2026-09-26", "SAMS CLUB POA CRISTAL", 3.42, ""],
    ["2026-09-26", "CARREFOUR CRISTAL", 96.54, ""],
    ["2026-09-26", "M BRASCO MOINHOS", 14, ""],
    ["2026-09-27", "CARREFOUR CNS 42", 7.39, ""],
    ["2026-09-27", "APPLE.COM/BILL", 27.98, ""],
    ["2026-09-27", "BOURBON CANOAS", 125.3, ""],
    ["2026-09-27", "PucCampus", 62, ""],
    ["2026-09-28", "ScheferEOliveira", 13.13, ""],
    ["2026-09-28", "ZAFFARI O. NMEYER", 85.15, ""],
    ["2026-09-28", "RAIA DROGASIL SA", 91.98, ""],
    ["2026-09-28", "FOMERIA", 51.06, ""],
    ["2026-09-29", "ZAFFARI O. NMEYER", 124.31, ""],
    ["2026-09-29", "EC *SHELLBOX", 98.41, ""],
    ["2026-09-30", "GABRIELLE MAGALHAES TU", 190.4, ""],
    ["2026-09-30", "O MERCADINHO", 7, ""],
    ["2026-09-30", "POSTO UNIVERSITARIO", 20, ""],
    ["2026-09-30", "RAIA DROGASIL SA", 31.83, ""],
    ["2026-10-01", "ZAFFARI O. NMEYER", 129.66, ""],
    ["2026-10-01", "RAIA DROGASIL SA", 81.62, ""],
    ["2026-10-01", "RG CASA DE CARNES E AS", 277.64, ""],
    ["2026-10-01", "Uber UBER *TRIP HELP.U", 27.05, ""],
    ["2026-10-01", "WilliamSanMartin", 64, ""],
    ["2026-10-01", "COMERCIO VEF", 10.38, ""],
    ["2026-10-01", "DAGOSTINI ALIMENTOS", 103.8, ""],
    ["2026-10-02", "ViniciusCarvalho", 6.89, ""],
    ["2026-10-02", "Parkplexgestaode", 22, ""],
    ["2026-10-02", "ViniciusCarvalho", 24.88, ""],
    ["2026-10-02", "EC *SHELLBOX", 267.82, ""],
    ["2026-10-02", "COMERCIO VEF", 4.79, ""],
    ["2026-10-03", "BOURBON CANOAS", 76.9, ""],
    ["2026-10-03", "BOURBON CANOAS", 120.63, ""],
    ["2026-10-03", "APPLE.COM/BILL", 43.98, ""],
    ["2026-10-03", "REGINA CREMA", 111, ""],
    ["2026-10-03", "CARREFOUR CNS 42", 161.06, ""],
    ["2026-10-03", "COMERCIO VEF", 4.99, ""],
    ["2026-10-04", "JoelAndreNeis", 50, ""],
    ["2026-10-04", "BOURBON CANOAS", 178.41, ""],
    ["2026-10-05", "RAIA DROGASIL SA", 89.36, ""],
    ["2026-10-05", "Uber UBER *TRIP HELP.U", 12.25, ""],
    ["2026-10-05", "SAO JOAO FARMACIAS", 23.1, ""],
    ["2026-10-05", "D GALETO E GATO", 40, ""],
    ["2026-10-05", "D GALETO E GATO", 69, ""],
    ["2026-10-06", "BISTEK SUPERMERCADOS", 252.38, ""],
    ["2026-10-07", "ZAFFARI MNO DEUS", 86.15, ""],
    ["2026-10-07", "ViniciusCarvalho", 10.29, ""],
    ["2026-10-07", "BOURBON CANOAS", 17.67, ""],
    ["2026-10-07", "EC *SHELLBOX", 224.67, ""],
    ["2026-10-08", "PucCampusHospital", 26, ""],
    ["2026-10-08", "99*", 17.9, ""],
    ["2026-10-08", "99Food *99Food", 35.89, ""],
    ["2026-10-09", "UNISUPER INCONFIDENCIA", 9.98, ""],
    ["2026-10-09", "APPLE.COM/BILL", 21.98, ""],
    ["2026-10-09", "CesarHenrique", 10, ""],
    ["2026-10-09", "CEA BAS 311 ECPC", 99.99, ""],
    ["2026-10-09", "SUPERLEGAL", 52.52, "1/6"],
    ["2026-10-09", "RD SAUDE ONLINE", 102.15, ""],
    ["2026-10-09", "MERCADO*MERCADOLIV", 99.86, "1/2"],
    ["2026-10-09", "DAGOSTINI ALIMENTOS", 25.84, ""],
    ["2026-10-10", "ScheferEOliveira", 35.44, ""],
    ["2026-10-10", "APPLE.COM/BILL", 10.99, ""],
    ["2026-10-10", "BOURBON CANOAS", 59.77, ""],
    ["2026-10-10", "PANVEL FILIAL 845", 51.95, "1/2"],
    ["2026-10-10", "ViniciusCarvalho", 11.96, ""],
    ["2026-10-10", "BANCA DO HOLANDES", 85.24, ""],
    ["2026-10-10", "LYON PARK", 15, ""],
    ["2026-10-11", "BOURBON CANOAS", 118.42, ""],
    ["2026-10-11", "APPLE.COM/BILL", 27.98, ""],
    ["2026-10-11", "ViniciusCarvalho", 12.98, ""],
    ["2026-10-11", "ViniciusCarvalho", 19.47, ""],
    ["2026-10-12", "BOURBON CANOAS", 108.27, ""],
    ["2026-10-12", "SAMS CLUB POA CRISTAL", 204.97, ""],
    ["2026-10-12", "MERCADO ITALIANO", 22.14, ""],
    ["2026-10-12", "ZAFFARI MNO DEUS", 55.4, ""],
    ["2026-10-13", "ViniciusCarvalho", 12.98, ""],
    ["2026-10-13", "LOJAS AMERICANAS 456", 62.45, ""],
    ["2026-10-13", "APPLE.COM/BILL", 5.5, ""],
    ["2026-10-13", "EC *SHELLBOX", 98.41, ""],
    ["2026-10-14", "ME.LINDA", 72.17, "1/3"],
    ["2026-10-14", "INSTITUTO DA MAMA DO R", 60, ""],
    ["2026-10-14", "ZAFFARI PARK CANOAS", 348.17, ""],
    ["2026-10-14", "PIXPAY *O MERCAD", 11, ""],
    ["2026-10-14", "SUPER BOM CAMPOS VEL", 32.66, ""],
    ["2026-10-15", "ZAFFARI O. NMEYER", 73.25, ""],
    ["2026-10-15", "RAIA1939", 70.26, "1/2"],
    ["2026-10-15", "RDSAUDE ONLINE", 68.77, ""],
    ["2026-10-15", "99*", 10.2, ""],
    ["2026-10-15", "99*", 13.01, ""],
    ["2026-10-15", "BOURBON CANOAS", 52, ""],
    ["2026-10-15", "PIXPAY *O MERCAD", 12.5, ""],
    ["2026-10-15", "TagItau *Recarga", 50, ""],
    ["2026-10-15", "EC *SHELLBOX", 196.82, ""],
    ["2026-10-16", "SIM POA CEARA", 16.89, ""],
    ["2026-10-16", "BISTEK SUPERMERCADOS", 177.34, ""],
    ["2026-10-16", "PANVEL FILIAL 885", 63.98, ""],
    ["2026-10-16", "BOURBON CANOAS", 111.14, ""],
    ["2026-10-16", "PATRIA CAR", 225, "1/2"],
    ["2026-10-16", "FOMERIA", 31.36, ""],
    ["2026-10-17", "ScheferEOliveira", 22.29, ""],
    ["2026-10-18", "BOURBON CANOAS", 136.09, ""],
    ["2026-10-18", "APPLE.COM/BILL", 16.49, ""],
    ["2026-10-18", "MdCarnesLtda", 86.19, ""],
    ["2026-10-18", "MERCADOLIVRE*MEC", 53.35, "1/6"],
    ["2026-10-18", "CARREFOUR CNS 42", 86.92, ""],
    ["2026-10-19", "RAIA DROGASIL SA", 83.99, ""],
    ["2026-10-19", "PANVEL FILIAL 845", 55.2, ""],
    ["2026-10-19", "EC *SHELLBOX", 250.39, ""],
    ["2026-10-20", "ZAFFARI MNO DEUS", 13.23, ""],
    ["2026-10-20", "ZAFFARI", 52.06, ""],
    ["2026-07-18", "AUT*TICPAYBIKEINCA", 88.57, "4/4"],
    ["2026-07-20", "WDDRONES E WDAGRO", 737.5, "4/12"],
    ["2026-07-22", "Azul Seguros", 266.45, "3/10"],
    ["2026-08-06", "BEAUTY HUB VAREJO", 66.17, "3/3"],
    ["2026-08-31", "MERCADOLIVRE*GHAIR", 24.83, "2/3"],
    ["2026-08-31", "MERCADO*GHAIROFICI", 31.94, "2/3"],
    ["2026-09-02", "RAIA DROGASIL SA", 186.58, "2/3"],
    ["2026-09-05", "ASAAS *SENGE", 59.68, "2/3"],
    ["2026-09-05", "ASAAS *SENGE RS", -0.04, ""],
    ["2026-09-06", "MERCADO*MERCADOLIV", 55.17, "2/2"],
    ["2026-09-06", "MERCADO*MERCADOLIVRE", -0.01, ""],
    ["2026-09-16", "MERCADOLIVRE*YAMAT", 67.47, "2/4"],
    ["2026-09-16", "SHOPEE *SHPSTECNOL", 51.07, "3/3"],
    ["2026-09-16", "SHOPEE *SHPSTECNOL", 51.07, "2/3"],
    ["2026-09-16", "MERCADOLIVRE*YAMATEC", -0.06, ""],
    ["2026-09-20", "PARC*GoogleG1SK003", 74.48, "2/8"],
    ["2026-09-21", "EC *MELIMAIS", 19.9, ""],
    ["2026-09-22", "DL*UberRides", 36.99, ""],
    ["2026-09-22", "DL*UberRides", 32.98, ""],
    ["2026-09-22", "CeA", 164.66, "1/3"],
    ["2026-09-22", "CeA", -0.04, ""],
    ["2026-09-24", "IFD*CARBONI E DIER COM", 56.53, ""],
    ["2026-09-27", "IFD*LINDOMAR FARIAS GU", 104.03, ""],
    ["2026-09-28", "APPLE.COM/BILL", 19.9, ""],
    ["2026-09-28", "IFD*DELIVERY ALLIANCE", 39.96, ""],
    ["2026-09-28", "BEAUTY HUB VAREJO", 70.58, "1/3"],
    ["2026-09-29", "IFD*CARBONI E DIER COM", 49.42, ""],
    ["2026-09-30", "DL*UberRides", 19.97, ""],
    ["2026-09-30", "DL*UberRides", 47.98, ""],
    ["2026-10-01", "MP *MELIMAIS", 0.5, ""],
    ["2026-10-04", "CeA", -217.08, ""],
    ["2026-10-05", "EC *CADERNOINT", 59.02, "2/4"],
    ["2026-10-05", "EC *CADERNOINT", 59.02, "3/4"],
    ["2026-10-05", "EC *CADERNOINT", 59.02, "4/4"],
    ["2026-10-05", "EC *CADERNOINT", 59.02, "1/4"],
    ["2026-10-05", "EC *CADERNOINTELI", -236.08, ""],
    ["2026-10-07", "IFD*CARBONI E DIER COM", 49.68, ""],
    ["2026-10-09", "MP *ALOASUSHIDELIVERY", 222.9, ""],
    ["2026-10-10", "PAYPAL *UBER BR", 198, ""],
    ["2026-10-10", "AMAZON BR *Amazon BR", 49.4, ""],
    ["2026-10-10", "PAYPAL *UBER BR", -198, ""],
    ["2026-10-13", "RENNER", 186.02, "1/3"],
    ["2026-10-14", "SENGE R*Sind. dos Eng", 817.92, ""],
    ["2026-10-14", "Google YouTube Super", 30, ""],
    ["2026-10-15", "IFD*CARBONI E DIER COM", 45.69, ""],
    ["2026-10-18", "Sams*SHOPPING SUL", 296.43, ""],
    ["2026-10-19", "PANVEL*DIGITAL", 31.49, "1/2"],
    ["2026-10-20", "Google YouTubePremium", 53.9, ""],
    ["2026-10-03", "AZUL LINHAS FMV2KT", 210.24, "1/3"],
    ["2026-10-03", "ITAU VIAGENS", 28.33, ""],
    ["2026-09-21", "ANTHROPIC", 108.4, ""],
    ["2026-09-29", "ANTHROPIC", 110.8, ""],
    ["2026-10-05", "ANTHROPIC* CLAUDE SUB", 116.64, ""],
    ["2026-10-17", "OPENAI *CHATGPT SUBSCR", 105.99, ""],
    ["2026-10-20", "ANTHROPIC", 238.95, ""],
    ["2026-10-20", "ANTHROPIC", 238.95, ""],
    ["2026-10-20", "Repasse de IOF (compras internacionais)", 32.23, ""]
  ];
  /* fatura do banco disponível para a conferência permanente (src/conferencia-fatura.js) */
  window.__FATURA_BANCO=window.__FATURA_BANCO||{};
  window.__FATURA_BANCO[10]={total:16736.84,itens:FECHADA,fonte:'PDF da fatura fechada (22/10/2026)'};
  function nuvemPronta(){
    if(window.__modoLocal||!window.__motorFinancas)return true;
    return !window.__motorFinancas.primeiro;
  }
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function brl(v){return 'R$ '+(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
  /* Lançamentos digitados à mão em outubro que não estão na fatura do banco: mostra para a revisão */
  function mostrarFora(fora){
    if(!fora||!fora.length)return;
    var ov=document.createElement('div');ov.id='fora26';
    ov.style.cssText='position:fixed;inset:0;z-index:99990;background:rgba(30,20,25,.45);display:flex;align-items:center;justify-content:center;padding:16px';
    var lin=fora.map(function(i){return '<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--bd,#e0d8ce)">'
      +'<span style="width:44px;color:var(--t3,#a89080);font-size:12px">'+esc((i.data||'').slice(8,10)+'/'+(i.data||'').slice(5,7))+'</span>'
      +'<span style="flex:1;font-size:13px">'+esc(i.nome)+'<br><small style="color:var(--t3,#a89080)">'+esc(i.cat||'')+'</small></span>'
      +'<b style="font-size:13px">'+brl(i.valor)+'</b>'
      +'<button data-del26="'+esc(i.id)+'" style="border:1px solid var(--bd,#e0d8ce);background:none;border-radius:8px;padding:5px 9px;font-size:12px;cursor:pointer">Excluir</button></div>';}).join('');
    var tot=fora.reduce(function(a,i){return a+(+i.valor||0);},0);
    ov.innerHTML='<div style="background:var(--card,#fff);color:var(--t1,#2b2024);max-width:560px;width:100%;max-height:85vh;overflow:auto;border-radius:14px;padding:20px;font-family:Inter,Arial,sans-serif">'
      +'<div style="font-weight:700;font-size:16px;margin-bottom:6px">Fatura de outubro conferida com o banco</div>'
      +'<div style="font-size:13px;line-height:1.5;margin-bottom:10px">Os lançamentos do banco somam <b>R$ 16.736,84</b>. Os lançamentos abaixo foram digitados no site, mas não aparecem na fatura, e somam <b>'+brl(tot)+'</b>. Se forem repetições de compras que já estão na fatura, exclua; se forem de outro cartão ou de outra fatura, pode manter.</div>'
      +lin+'<div style="text-align:right;margin-top:14px"><button id="fora26-ok" style="background:var(--m,#4B1F39);color:#fff;border:0;border-radius:9px;padding:9px 16px;font-weight:600;cursor:pointer">Concluir</button></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click',function(e){
      var id=e.target&&e.target.getAttribute&&e.target.getAttribute('data-del26');
      if(id){DB.items=DB.items.filter(function(i){return String(i.id)!==id;});try{dbSave();}catch(x){}try{render();}catch(x){}
        var row=e.target.parentNode;row.style.opacity='.4';e.target.disabled=true;e.target.textContent='Excluído';}
      if(e.target.id==='fora26-ok'||e.target===ov){ov.remove();}
    });
  }
  function rFatura(lista,parcial,total){
    var itens=lista.map(function(r){return {data:r[0],nome:r[1],valor:r[2],parcela:r[3],d:+r[0].slice(8),m:+r[0].slice(5,7)};});
    var soma=Math.round(itens.reduce(function(a,i){return a+i.valor;},0)*100)/100;
    var r={tipo:'fatura',mes:10,ano:2026,itens:itens,total:total,soma:soma,confere:Math.abs(soma-total)<0.011};
    if(parcial){r.origem='internet';r.parcial=true;r.status='aberta';r.fechamento='2026-10-21';}
    return r;
  }
  function aplicar(){
    if(typeof DB==='undefined'||!window.v31Aplicar||!DB.items)return false;
    var P=DB._faturasPdf||{};
    if(!DB[FLAG_F]){
      var ja=P[10]&&!P[10].parcial&&Math.abs((P[10].total||0)-16736.84)<0.011;
      var rep=null;
      if(!ja){
        rep=window.v31Aplicar.fatura(rFatura(FECHADA,false,16736.84));
        window.__faturaOut26Rel=rep;
      }
      DB[FLAG_F]=new Date().toISOString();
      if(!DB[FLAG])DB[FLAG]='substituída pela fatura fechada';
      try{dbSave();}catch(e){}
      try{render();}catch(e){}
      if(rep){
        try{toast('Fatura de outubro conferida com o banco: '+rep.novos+' incluído(s), '+rep.conferidos+' já estavam, '+rep.removidos+' repetido(s) removido(s).');}catch(e){}
        var fora=(rep.fora||[]).filter(function(i){return i.mes===10;});
        if(fora.length)setTimeout(function(){if(window.revisarFatura)window.revisarFatura(10);else mostrarFora(fora);},600);
      }
      return true;
    }
    return true;
  }
  var tentativas=0;
  var t=setInterval(function(){
    tentativas++;
    try{if(nuvemPronta()&&aplicar()){clearInterval(t);return;}}catch(e){console.error('fatura de outubro',e);clearInterval(t);return;}
    if(tentativas>600)clearInterval(t); /* 5 minutos esperando o login */
  },500);
})();
