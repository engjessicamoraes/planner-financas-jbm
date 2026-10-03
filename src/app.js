/* Instala o service worker (abre mais rápido e funciona sem internet).
   Só roda em https; aberto direto do disco, o site segue como antes. */
(function(){
  if(!('serviceWorker' in navigator)||(location.protocol!=='https:'&&location.hostname!=='localhost'))return;
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('sw.js').catch(function(e){console.warn('Service worker não registrado',e);});
  });
})();
