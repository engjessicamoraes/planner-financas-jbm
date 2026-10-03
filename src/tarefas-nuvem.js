/* Liga o motor de sincronização (nuvem.js) aos dados do Planner.
   Antes, o post-it não ia para a nuvem e a leitura só acontecia uma vez
   por sessão do navegador (marcador compartilhado com o Finanças). */
(function(){
  'use strict';
  if(!window.SyncNuvem||window.__modoLocal)return;
  var aviso=null,liberadoSemNuvem=false;
  function editando(){
    var a=document.activeElement;
    if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))return true;
    return !!document.querySelector('.modal.open,.modal.on,.overlay.open,.ov.open,[role="dialog"]:not([hidden])');
  }
  function pedirRecarga(){
    if(aviso)return;
    aviso=document.createElement('div');
    aviso.className='nv-aviso';
    aviso.innerHTML='Há alterações feitas em outro aparelho. <button type="button">Atualizar agora</button>';
    aviso.querySelector('button').onclick=function(){location.reload();};
    document.body.appendChild(aviso);
    /* Recarrega sozinho quando a página volta a ficar visível e nada está em edição. */
    document.addEventListener('visibilitychange',function(){
      if(document.visibilityState==='visible'&&!editando())location.reload();
    });
  }
  var motor=SyncNuvem.criar({
    caminho:'planner',
    chaves:[
      {k:'planner',ls:'pjm-v16',fmt:'jsonstr'},
      {k:'reuniao',ls:'pjm-mtg-v1',fmt:'jsonstr'},
      {k:'habitos',ls:'ht-v3',fmt:'jsonstr'},
      {k:'postit',ls:'pjm-postit-v1',fmt:'jsonstr'},
      {k:'capacidade',ls:'pjm-capacidade-dia',fmt:'raw'}
    ],
    podeAplicar:function(){return !editando();},
    aoReceber:function(chaves,primeiraLeitura){
      /* O Planner monta o estado ao abrir; dados novos exigem recarregar. */
      if(primeiraLeitura&&!liberadoSemNuvem){
        /* Trava contra recarga em sequência, caso a página regrave algo ao abrir. */
        var ult=+(sessionStorage.getItem('nv-recarga')||0);
        if(chaves.length&&Date.now()-ult>15000){
          try{sessionStorage.setItem('nv-recarga',String(Date.now()));}catch(e){}
          location.reload();return;
        }
        try{cloudHideGate();}catch(e){}
        return;
      }
      if(chaves.length)pedirRecarga();
    },
    aoFalharLeitura:function(){try{cloudHideGate();}catch(e){}}
  });
  window.__motorPlanner=motor;
  cloudSyncDown=window.cloudSyncDown=function(){
    if(typeof _cloudUser==='undefined'||!_cloudUser)return;
    motor.iniciar(_cloudUser.uid);
    /* Sem internet a nuvem não responde: depois de 4 s a tela é liberada com
       os dados deste aparelho, e o que chegar depois vira aviso de atualização. */
    setTimeout(function(){if(motor.primeiro){liberadoSemNuvem=true;try{cloudHideGate();}catch(e){}}},4000);
  };
  cloudWriteAll=window.cloudWriteAll=function(){motor.marcarTudo();motor.enviarTudo();};
  cloudScheduleWrite=window.cloudScheduleWrite=function(){motor.marcarTudo();};
  try{if(typeof _cloudUser!=='undefined'&&_cloudUser)motor.iniciar(_cloudUser.uid);}catch(e){}
  /* Mantém o selo "salvo/salvando" do cabeçalho em sintonia com o motor. */
  window.addEventListener('nuvem-status',function(ev){
    if(typeof setSaveStatus!=='function')return;
    var st=ev.detail.estado;
    if(st==='salvando'||st==='offline-pendente')setSaveStatus('salvando');
    else if(st==='erro')setSaveStatus('erro');
    else if(st==='ok'){try{__ultimoSalvo=ev.detail.salvoEm||Date.now();}catch(e){}setSaveStatus('ok');}
  });
})();
