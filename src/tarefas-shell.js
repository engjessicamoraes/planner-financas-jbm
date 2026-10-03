/* ============================================================
   PLANNER — integração com o Finanças (v40)
   - Seletor Pessoal | Empresa | Tarefas na barra superior, igual ao
     do Finanças, para circular entre as três áreas com um clique.
   - Cartão "Contas a vencer" na Agenda, com o que está atrasado ou
     vence nos próximos dias (publicado pelo Finanças na nuvem).
   ============================================================ */
(function(){
  'use strict';
  function $(s,r){return (r||document).querySelector(s);}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function R(v){return 'R$ '+(parseFloat(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
  var ICO={
    pessoal:'<svg viewBox="0 0 16 16"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>',
    empresa:'<svg viewBox="0 0 16 16"><rect x="2" y="6" width="12" height="9" rx="1"/><path d="M5 6V4a3 3 0 0 1 6 0v2"/></svg>',
    tarefas:'<svg viewBox="0 0 16 16"><path d="M3 8l3 3 7-7"/><rect x="1" y="1" width="14" height="14" rx="3"/></svg>'
  };

  /* ---------- seletor de áreas ---------- */
  function montarSeletor(){
    var nav=$('nav.nav');if(!nav||$('.appsw',nav))return;
    var sw=document.createElement('div');sw.className='appsw v40-tar';sw.setAttribute('aria-label','Área');
    sw.innerHTML='<a href="index.html#pessoal">'+ICO.pessoal+'Pessoal</a><a href="index.html#empresa">'+ICO.empresa+'Empresa</a><a class="on" href="tarefas.html">'+ICO.tarefas+'Tarefas</a>';
    var brand=$('.nav-brand',nav);
    if(brand)brand.insertAdjacentElement('afterend',sw);else nav.insertBefore(sw,nav.firstChild);
  }

  /* ---------- contas a vencer ---------- */
  var dados=null;
  try{dados=JSON.parse(localStorage.getItem('v40-vencimentos')||'null');}catch(e){}
  function dm(d){return d?d.slice(8,10)+'/'+d.slice(5,7):'';}
  function diasAte(d){var h=new Date();h.setHours(12,0,0,0);return Math.round((new Date(d+'T12:00:00')-h)/864e5);}
  function quando(v){
    var d=diasAte(v.venc);
    if(v.estado==='atrasado'||d<0)return 'atrasada desde '+dm(v.venc);
    if(d===0)return 'vence hoje';if(d===1)return 'vence amanhã';
    return 'vence em '+d+' dias ('+dm(v.venc)+')';
  }
  function cartao(){
    var itens=(dados&&dados.itens)||[];
    if(!itens.length)return null;
    var atras=itens.filter(function(v){return v.estado==='atrasado'||diasAte(v.venc)<0;}).length;
    var tot=itens.reduce(function(a,v){return a+(parseFloat(v.valor)||0);},0);
    var d=document.createElement('div');d.id='v40-contas';d.className='v40-contas'+(atras?' bad':'');
    var h='<div class="vh"><div><b>'+(atras?atras+' conta(s) atrasada(s)':'Contas a vencer')+'</b><span>'+itens.length+' conta(s) · '+R(tot)+'</span></div><a href="index.html#pessoal">Abrir no Finanças →</a></div>';
    itens.slice(0,5).forEach(function(v){
      var at=v.estado==='atrasado'||diasAte(v.venc)<0;
      h+='<div class="vi'+(at?' atrasado':'')+'"><i></i><span class="n">'+esc(v.nome)+'</span><span class="q">'+quando(v)+'</span><span class="v">'+R(v.valor)+'</span></div>';
    });
    d.innerHTML=h;return d;
  }
  function inserir(){
    var mod=document.getElementById('mod-agenda');if(!mod)return;
    var dash=mod.querySelector('.agenda-dash');if(!dash)return;
    var velho=document.getElementById('v40-contas');
    if(velho&&velho.previousElementSibling===dash&&velho.getAttribute('data-k')===chave())return;
    if(velho)velho.remove();
    var c=cartao();if(!c)return;
    c.setAttribute('data-k',chave());
    dash.insertAdjacentElement('afterend',c);
  }
  function chave(){return JSON.stringify(dados&&dados.itens||[]);}
  function observar(){
    var mod=document.getElementById('mod-agenda');if(!mod)return;
    new MutationObserver(function(){inserir();}).observe(mod,{childList:true,subtree:true});
    inserir();
  }
  /* Lê da nuvem a lista publicada pelo Finanças (vale para o celular que só abre o Planner). */
  function escutarNuvem(){
    try{
      if(window.__modoLocal||typeof firebase==='undefined')return;
      firebase.auth().onAuthStateChanged(function(u){
        if(!u)return;
        firebase.database().ref('users/'+u.uid+'/financas/vencimentos').on('value',function(s){
          var v=s.val();if(!v)return;
          dados=v;try{localStorage.setItem('v40-vencimentos',JSON.stringify(v));}catch(e){}
          inserir();
        });
      });
    }catch(e){console.warn('Contas a vencer indisponíveis',e);}
  }

  function iniciar(){document.body.classList.add('v40t');montarSeletor();observar();escutarNuvem();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
