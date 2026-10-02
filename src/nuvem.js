/* ============================================================
   SINCRONIZAÇÃO COM A NUVEM — v40
   Substitui o envio integral dos dados a cada alteração.

   Como funciona:
   1. A página escuta a nuvem em tempo real. Quando outro aparelho
      grava algo, a alteração chega aqui sem recarregar.
   2. Para cada bloco de dados (lançamentos, metas, saldos...), o site
      guarda a "base": a última versão que esteve igual nos dois lados.
   3. Ao gravar ou receber, faz uma mesclagem em três vias (base, este
      aparelho, nuvem): o que só um lado mudou é aceito; listas com
      "id" são mescladas item a item. Assim, um lançamento feito no
      celular não é apagado por uma edição feita no computador.
   4. A gravação usa transação do Firebase, que repete a mesclagem se
      a nuvem mudou no meio do caminho.
   5. O estado (salvo, salvando, sem conexão, falha) é publicado no
      evento "nuvem-status" para o indicador da barra superior.
   ============================================================ */
(function(){
  'use strict';
  if(window.SyncNuvem)return;

  /* ---------- utilitários de dados ---------- */
  function isObj(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
  function canon(x){
    if(x===undefined||x===null)return 'null';
    if(typeof x!=='object')return JSON.stringify(x);
    if(Array.isArray(x))return '['+x.map(canon).join(',')+']';
    return '{'+Object.keys(x).sort().map(function(k){return JSON.stringify(k)+':'+canon(x[k]);}).join(',')+'}';
  }
  function eq(a,b){return canon(a)===canon(b);}
  function intKey(k){return /^(0|[1-9][0-9]{0,8})$/.test(k);}
  /* Reproduz a forma como o Firebase devolve os dados: sem nulos, sem
     listas ou objetos vazios, e chaves numéricas densas viram lista. */
  function norm(x){
    if(x===undefined||x===null||typeof x==='function')return undefined;
    if(typeof x==='number')return isFinite(x)?x:undefined;
    if(typeof x!=='object')return x;
    var src={},n=0,max=-1,todasInt=true;
    Object.keys(x).forEach(function(k){
      var v=norm(x[k]);if(v===undefined)return;
      src[k]=v;n++;
      if(intKey(k)){if(+k>max)max=+k;}else todasInt=false;
    });
    if(!n)return undefined;
    if(todasInt&&n*2>max+1){
      var a=[];for(var i=0;i<=max;i++)a.push(src[i]===undefined?null:src[i]);
      return a;
    }
    if(Array.isArray(x)){var o={};Object.keys(src).forEach(function(k){o[k]=src[k];});return o;}
    return src;
  }
  function comId(a){return Array.isArray(a)&&a.length>0&&a.every(function(e){return isObj(e)&&e.id!==undefined&&e.id!==null;});}
  /* Mesclagem em três vias: b = base, l = este aparelho, r = nuvem. */
  function merge3(b,l,r){
    if(eq(l,r))return l;
    if(eq(b,l))return r;
    if(eq(b,r))return l;
    if(l===undefined)return r; /* excluído aqui e alterado lá: mantém a alteração */
    if(r===undefined)return l;
    if(isObj(l)&&isObj(r)){
      var bo=isObj(b)?b:{},out={},vistos={};
      Object.keys(l).concat(Object.keys(r)).forEach(function(k){
        if(vistos[k])return;vistos[k]=1;
        var m=merge3(bo[k],l[k],r[k]);
        if(m!==undefined)out[k]=m;
      });
      return out;
    }
    if(Array.isArray(l)&&Array.isArray(r)&&comId(l)&&comId(r)){
      var bm={},rm={},usados={},res=[];
      if(comId(b))b.forEach(function(e){bm[String(e.id)]=e;});
      r.forEach(function(e){rm[String(e.id)]=e;});
      l.forEach(function(e){
        var id=String(e.id);if(usados[id])return;usados[id]=1;
        var m=merge3(bm[id],e,rm[id]);if(m!==undefined)res.push(m);
      });
      r.forEach(function(e){
        var id=String(e.id);if(usados[id])return;usados[id]=1;
        var m=merge3(bm[id],undefined,e);if(m!==undefined)res.push(m);
      });
      return res;
    }
    return l; /* conflito no mesmo valor: prevalece a edição deste aparelho */
  }

  /* O Firebase não aceita . $ # [ ] / em chaves (ex.: "Carro / Transporte"). */
  function encKey(k){return String(k).replace(/[%.$#\[\]\/]/g,function(c){return '%'+c.charCodeAt(0).toString(16).toUpperCase();});}
  function decKey(k){return k.indexOf('%')<0?k:k.replace(/%(25|2E|24|23|5B|5D|2F)/g,function(m,h){return String.fromCharCode(parseInt(h,16));});}
  function paraNuvem(o){
    if(Array.isArray(o))return o.map(function(v){return v===undefined?null:paraNuvem(v);});
    if(isObj(o)){var r={};Object.keys(o).forEach(function(k){r[encKey(k)]=paraNuvem(o[k]);});return r;}
    return o;
  }
  function daNuvem(o){
    if(Array.isArray(o))return o.map(daNuvem);
    if(isObj(o)){var r={};Object.keys(o).forEach(function(k){r[decKey(k)]=daNuvem(o[k]);});return r;}
    return o;
  }

  /* ---------- armazenamento local ---------- */
  var setNativo=Storage.prototype.setItem,remNativo=Storage.prototype.removeItem;
  var interno=0;
  function lsSet(k,v){interno++;try{setNativo.call(localStorage,k,v);}finally{interno--;}}
  function lsDel(k){interno++;try{remNativo.call(localStorage,k);}finally{interno--;}}
  function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}

  /* ---------- motor ---------- */
  function Motor(cfg){
    this.cfg=cfg;
    this.porLs={};this.sujo={};this.enviando={};this.ultimoLocal={};
    this.ref=null;this.ligado=false;this.conectado=true;this.erro='';
    this.salvoEm=+(lsGet(this.chaveMeta('salvoEm'))||0);
    this.primeiro=true;this.timer=null;this.adiadas={};
    var self=this;
    cfg.chaves.forEach(function(s){self.porLs[s.ls]=s;});
  }
  Motor.prototype.chaveMeta=function(n){return '__nuvem__/'+this.cfg.caminho+'/'+n;};
  Motor.prototype.ler=function(s){
    var raw=lsGet(s.ls);if(raw===null||raw==='')return undefined;
    if(s.fmt==='raw')return raw;
    try{var v=JSON.parse(raw);return s.fmt==='json'?norm(v):v;}catch(e){return undefined;}
  };
  Motor.prototype.gravarLocal=function(s,v){
    if(v===undefined){lsDel(s.ls);return;}
    lsSet(s.ls,s.fmt==='raw'?String(v):JSON.stringify(v));
  };
  Motor.prototype.daNuvem=function(s,val){
    if(val===null||val===undefined)return undefined;
    if(s.fmt==='raw')return String(val);
    if(s.fmt==='jsonstr'){if(typeof val!=='string')return undefined;try{return JSON.parse(val);}catch(e){return undefined;}}
    return norm(daNuvem(val));
  };
  Motor.prototype.paraNuvem=function(s,v){
    if(s.fmt==='raw')return String(v);
    if(s.fmt==='jsonstr')return JSON.stringify(v);
    return paraNuvem(v);
  };
  Motor.prototype.getBase=function(s){
    var raw=lsGet(this.chaveMeta('base/'+s.k));
    if(raw===null)return null; /* null = ainda sem base (primeira vez neste aparelho) */
    try{return {v:raw==='__vazio__'?undefined:JSON.parse(raw)};}catch(e){return null;}
  };
  Motor.prototype.setBase=function(s,v){
    try{lsSet(this.chaveMeta('base/'+s.k),v===undefined?'__vazio__':JSON.stringify(v));}
    catch(e){console.warn('Sem espaço para guardar a base de sincronização',e);}
  };
  Motor.prototype.pendentes=function(){
    var self=this;return Object.keys(this.sujo).filter(function(k){return self.sujo[k];}).length+
      Object.keys(this.enviando).filter(function(k){return self.enviando[k];}).length;
  };
  Motor.prototype.status=function(){
    var st;
    if(!this.ligado)st='local';
    else if(this.erro)st='erro';
    else if(!this.conectado)st=this.pendentes()?'offline-pendente':'offline';
    else if(this.pendentes())st='salvando';
    else st='ok';
    var det={estado:st,salvoEm:this.salvoEm,pendentes:this.pendentes(),erro:this.erro,caminho:this.cfg.caminho};
    this.ultimoStatus=det;
    try{window.dispatchEvent(new CustomEvent('nuvem-status',{detail:det}));}catch(e){}
    return det;
  };
  Motor.prototype.marcar=function(lsKey){
    var s=this.porLs[lsKey];if(!s)return;
    this.sujo[s.k]=true;this.status();
    if(!this.ligado)return;
    var self=this;clearTimeout(this.timer);
    this.timer=setTimeout(function(){self.enviarTudo();},700);
  };
  Motor.prototype.marcarTudo=function(){
    var self=this;this.cfg.chaves.forEach(function(s){
      var v=self.ler(s),c=canon(v);
      if(self.ultimoLocal[s.k]!==c){self.ultimoLocal[s.k]=c;self.marcar(s.ls);}
    });
  };
  Motor.prototype.enviarTudo=function(){
    clearTimeout(this.timer);this.timer=null;
    var self=this;
    Object.keys(this.sujo).forEach(function(k){if(self.sujo[k])self.enviar(k);});
  };
  Motor.prototype.spec=function(k){return this.cfg.chaves.filter(function(s){return s.k===k;})[0];};
  Motor.prototype.enviar=function(k){
    var s=this.spec(k),self=this;
    if(!s||!this.ligado)return;
    if(this.primeiro){this.sujo[k]=true;return;} /* só envia depois de conhecer a nuvem */
    if(this.enviando[k]){this.reenviar=this.reenviar||{};this.reenviar[k]=true;return;}
    this.sujo[k]=false;this.enviando[k]=true;this.status();
    var localNoInicio=this.ler(s),resultado;
    var b=this.getBase(s);
    this.ref.child(s.k).transaction(function(cur){
      var remoto=self.daNuvem(s,cur);
      var base=b?b.v:remoto; /* sem base: este aparelho tem a última palavra */
      resultado=merge3(base,localNoInicio,remoto);
      if(resultado===undefined)return; /* nunca apaga um bloco inteiro: aborta */
      if(eq(resultado,remoto)&&cur!==null)return; /* nada a gravar */
      return self.paraNuvem(s,resultado);
    },function(err,committed,snap){
      self.enviando[k]=false;
      if(err){
        self.sujo[k]=true;
        self.erro=(err&&err.code)||String(err);
        console.warn('Falha ao salvar "'+k+'" na nuvem',err);
        self.status();
        clearTimeout(self.timerErro);
        self.timerErro=setTimeout(function(){self.erro='';self.enviarTudo();},15000);
        return;
      }
      self.erro='';
      var remoto=snap?self.daNuvem(s,snap.val()):undefined;
      if(committed||remoto!==undefined){
        self.setBase(s,remoto);
        var atual=self.ler(s);
        if(eq(atual,localNoInicio)&&!eq(atual,remoto)){
          self.gravarLocal(s,remoto);self.ultimoLocal[k]=canon(remoto);
          self.aplicar([k]);
        }else if(!eq(atual,localNoInicio)){self.sujo[k]=true;}
      }
      self.salvoEm=Date.now();lsSet(self.chaveMeta('salvoEm'),String(self.salvoEm));
      if(self.reenviar&&self.reenviar[k]){self.reenviar[k]=false;self.sujo[k]=true;}
      self.status();
      if(self.sujo[k])self.marcar(s.ls);
    },false);
  };
  Motor.prototype.aplicar=function(chaves,primeiraLeitura){
    var self=this;
    chaves.forEach(function(k){self.adiadas[k]=1;});
    var podeAgora=primeiraLeitura||(this.cfg.podeAplicar?this.cfg.podeAplicar():true);
    if(!podeAgora){clearTimeout(this.timerAplicar);this.timerAplicar=setTimeout(function(){self.aplicar([]);},1500);return;}
    var lista=Object.keys(this.adiadas);this.adiadas={};
    if(!lista.length&&!primeiraLeitura)return;
    try{this.cfg.aoReceber&&this.cfg.aoReceber(lista,!!primeiraLeitura);}catch(e){console.error('Falha ao aplicar dados da nuvem',e);}
  };
  Motor.prototype.receber=function(val){
    val=val||{};
    var self=this,mudou=[],primeiro=this.primeiro;
    var legadoPendente=this.cfg.chaveLegadoPendente&&lsGet(this.cfg.chaveLegadoPendente);
    this.cfg.chaves.forEach(function(s){
      if(self.sujo[s.k]||self.enviando[s.k])return; /* o envio em curso já mescla */
      var remoto=self.daNuvem(s,val[s.k]);
      var local=self.ler(s);
      var b=self.getBase(s);
      if(eq(local,remoto)){if(!b||!eq(b.v,remoto))self.setBase(s,remoto);return;}
      var resultado;
      if(!b){
        /* Primeira vez com este sistema: a nuvem vale, a menos que o
           sistema anterior tenha marcado alterações locais não enviadas. */
        if(remoto===undefined||legadoPendente)resultado=local;
        else resultado=remoto;
      }else resultado=merge3(b.v,local,remoto);
      if(!eq(resultado,local)){
        self.gravarLocal(s,resultado);self.ultimoLocal[s.k]=canon(resultado);mudou.push(s.k);
      }
      if(eq(resultado,remoto))self.setBase(s,remoto);
      else{
        if(!b)self.setBase(s,remoto);
        self.sujo[s.k]=true;
      }
    });
    if(legadoPendente&&this.cfg.chaveLegadoPendente)lsDel(this.cfg.chaveLegadoPendente);
    this.primeiro=false;
    if(this.pendentes())this.marcar(this.cfg.chaves[0].ls);
    this.status();
    if(mudou.length||primeiro)this.aplicar(mudou,primeiro);
  };
  Motor.prototype.iniciar=function(uid){
    if(this.ligado)return;
    var self=this;
    this.ligado=true;
    /* O que mudou antes do login é tratado pela mesclagem da primeira leitura. */
    this.sujo={};
    this.ref=firebase.database().ref('users/'+uid+'/'+this.cfg.caminho);
    this.cfg.chaves.forEach(function(s){self.ultimoLocal[s.k]=canon(self.ler(s));});
    this.ref.on('value',function(snap){self.receber(snap.val());},function(err){
      self.erro=(err&&err.code)||'sem permissão';self.status();
      console.warn('Falha ao escutar a nuvem',err);
      if(self.cfg.aoFalharLeitura)self.cfg.aoFalharLeitura(err);
    });
    firebase.database().ref('.info/connected').on('value',function(s){
      self.conectado=!!s.val();self.status();
      if(self.conectado&&self.pendentes())self.enviarTudo();
    });
    window.addEventListener('pagehide',function(){if(self.timer)self.enviarTudo();});
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&self.timer)self.enviarTudo();});
    /* Rede de segurança: alterações gravadas sem passar pelos ganchos. */
    setInterval(function(){self.marcarTudo();},4000);
    this.status();
  };

  var motores=[];
  /* Gancho único no localStorage: qualquer gravação numa chave
     sincronizada agenda o envio daquela chave. */
  var setAtual=Storage.prototype.setItem,remAtual=Storage.prototype.removeItem;
  Storage.prototype.setItem=function(k,v){
    var r=setAtual.call(this,k,v);
    if(!interno&&this===localStorage)motores.forEach(function(m){if(m.porLs[k]){m.ultimoLocal[m.porLs[k].k]=null;m.marcar(k);}});
    return r;
  };
  Storage.prototype.removeItem=function(k){
    var r=remAtual.call(this,k);
    if(!interno&&this===localStorage)motores.forEach(function(m){if(m.porLs[k])m.marcar(k);});
    return r;
  };

  window.SyncNuvem={
    criar:function(cfg){var m=new Motor(cfg);motores.push(m);return m;},
    motores:motores,
    _t:{merge3:merge3,norm:norm,eq:eq,canon:canon}
  };
})();
