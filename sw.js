/* ============================================================
   SERVICE WORKER — Finanças e Planner
   - Páginas do site: busca primeiro na rede (sempre a versão mais
     nova quando há internet) e usa a cópia guardada quando não há.
   - Bibliotecas externas (Firebase, fontes, leitor de PDF): usa a
     cópia guardada e atualiza em segundo plano.
   - A comunicação com o banco de dados e o login nunca passa pelo
     cache: vai direto ao Firebase.
   Ao alterar a lista de arquivos, aumente o número de VERSAO.
   ============================================================ */
var VERSAO='jbm-v41-1';
var PAGINAS=['./','./index.html','./tarefas.html','./manifest.webmanifest',
  './icones/icone-192.png','./icones/icone-512.png','./icones/apple-touch-icon.png','./icones/favicon-32.png'];
var EXTERNOS=/^https:\/\/(www\.gstatic\.com\/firebasejs\/|fonts\.googleapis\.com\/|fonts\.gstatic\.com\/|cdn\.jsdelivr\.net\/|cdnjs\.cloudflare\.com\/|unpkg\.com\/)/;

self.addEventListener('install',function(ev){
  ev.waitUntil(caches.open(VERSAO).then(function(c){return c.addAll(PAGINAS);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(ev){
  ev.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k!==VERSAO;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});

function redePrimeiro(req){
  return fetch(req).then(function(res){
    if(res&&res.ok){var copia=res.clone();caches.open(VERSAO).then(function(c){c.put(req,copia);});}
    return res;
  }).catch(function(){
    return caches.match(req,{ignoreSearch:true}).then(function(r){return r||caches.match('./index.html');});
  });
}
function cacheEAtualiza(req){
  return caches.open(VERSAO).then(function(c){
    return c.match(req).then(function(guardado){
      var rede=fetch(req).then(function(res){if(res&&(res.ok||res.type==='opaque'))c.put(req,res.clone());return res;}).catch(function(){return guardado;});
      return guardado||rede;
    });
  });
}
self.addEventListener('fetch',function(ev){
  var req=ev.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin===self.location.origin){
    if(/\/sw\.js$/.test(url.pathname))return;
    ev.respondWith(redePrimeiro(req));
    return;
  }
  if(EXTERNOS.test(req.url))ev.respondWith(cacheEAtualiza(req));
  /* Firebase (banco e login) e demais endereços seguem direto para a rede. */
});
