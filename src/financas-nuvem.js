/* Liga o motor de sincronização (nuvem.js) aos dados do Finanças.
   Substitui cloudSyncDown/cloudWriteAll/cloudScheduleWrite, que enviavam
   o bloco inteiro a cada alteração e só liam a nuvem ao abrir a página. */
(function(){
  'use strict';
  if(!window.SyncNuvem||window.__modoLocal)return;
  var motor=SyncNuvem.criar({
    caminho:'financas',
    chaveLegadoPendente:'fin_nuvem_pendente',
    chaves:[
      {k:'db',ls:SK,fmt:'json'},
      {k:'financ',ls:FINANC_SK,fmt:'json'},
      {k:'metas',ls:METAS_SK,fmt:'json'},
      {k:'saldo',ls:SALDO_SK,fmt:'json'},
      {k:'fatStatus',ls:FAT_STATUS_SK,fmt:'json'},
      {k:'cofre',ls:'cofre26v1',fmt:'json'},
      {k:'anotacoes',ls:'anot26v1',fmt:'json'},
      {k:'planner',ls:'pjm-planner-diario-v1',fmt:'json'},
      {k:'faturaInfo',ls:'pjm-fatura-info-v1',fmt:'json'},
      {k:'metaBM',ls:'metaBM26v1',fmt:'raw'},
      {k:'empresa',ls:'empresa26v1',fmt:'json'},
      {k:'metasCofre',ls:'v40-metas-cofre',fmt:'json'},
      {k:'vencimentos',ls:'v40-vencimentos',fmt:'json'}
    ],
    /* Não troca os dados na tela enquanto há um formulário aberto ou um campo em edição. */
    podeAplicar:function(){
      if(document.querySelector('.modal.open'))return false;
      var a=document.activeElement;
      return !(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
    },
    aoReceber:function(chaves,primeiraLeitura){
      if(chaves.length){
        try{cloudRefreshRuntime(montarBackupCompleto());}catch(e){console.error(e);try{render();}catch(x){}}
        try{window.dispatchEvent(new CustomEvent('dados-atualizados',{detail:{chaves:chaves}}));}catch(e){}
        if(!primeiraLeitura){try{toast('Atualizado com alterações feitas em outro aparelho.');}catch(e){}}
      }
      if(primeiraLeitura){try{cloudHideGate();}catch(e){}}
    },
    aoFalharLeitura:function(){try{cloudHideGate();}catch(e){}}
  });
  window.__motorFinancas=motor;
  cloudSyncDown=window.cloudSyncDown=function(){
    if(typeof _cloudUser==='undefined'||!_cloudUser){return;}
    motor.iniciar(_cloudUser.uid);
  };
  cloudWriteAll=window.cloudWriteAll=function(){motor.marcarTudo();motor.enviarTudo();};
  cloudScheduleWrite=window.cloudScheduleWrite=function(){motor.marcarTudo();};
  /* Se o login já tiver terminado antes deste script, inicia agora. */
  try{if(typeof _cloudUser!=='undefined'&&_cloudUser)motor.iniciar(_cloudUser.uid);}catch(e){}
})();
