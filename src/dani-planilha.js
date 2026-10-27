/* Planilha do Dani: só o mês que está aberto na tela, no formato que a Jéssica envia
   para ele (título com o mês; colunas Local, Data, Parcela e Valor; total no fim).
   Gera um .xlsx de verdade, com bordas e formato de moeda, sem biblioteca externa. */
(function(){
  'use strict';
  var MES_AB=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  /* ---------- zip (sem compressão) ---------- */
  var CRC=(function(){var t=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
  function crc32(b){var c=0xFFFFFFFF;for(var i=0;i<b.length;i++)c=CRC[(c^b[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
  function utf8(s){return new TextEncoder().encode(s);}
  function zip(arquivos){
    var partes=[],central=[],pos=0;
    function u16(v){return [v&255,(v>>>8)&255];}
    function u32(v){return [v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];}
    arquivos.forEach(function(f){
      var nome=utf8(f.nome),dados=utf8(f.texto),crc=crc32(dados);
      var loc=[].concat(u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(crc),u32(dados.length),u32(dados.length),u16(nome.length),u16(0));
      partes.push(new Uint8Array(loc),nome,dados);
      central.push({nome:nome,crc:crc,tam:dados.length,pos:pos});
      pos+=loc.length+nome.length+dados.length;
    });
    var ini=pos,tamCentral=0;
    central.forEach(function(c){
      var h=[].concat(u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(c.crc),u32(c.tam),u32(c.tam),u16(c.nome.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(c.pos));
      partes.push(new Uint8Array(h),c.nome);tamCentral+=h.length+c.nome.length;
    });
    partes.push(new Uint8Array([].concat(u32(0x06054b50),u16(0),u16(0),u16(central.length),u16(central.length),u32(tamCentral),u32(ini),u16(0))));
    return new Blob(partes,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }

  /* ---------- planilha ---------- */
  function x(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function txt(ref,v,st){return '<c r="'+ref+'" t="inlineStr" s="'+st+'"><is><t xml:space="preserve">'+x(v)+'</t></is></c>';}
  function num(ref,v,st){return '<c r="'+ref+'" s="'+st+'"><v>'+(Math.round((+v||0)*100)/100)+'</v></c>';}
  function dataCurta(d){if(!d||!/^\d{4}-\d{2}-\d{2}/.test(d)||d.slice(0,4)<'2000')return '';return d.slice(8,10)+'/'+MES_AB[+d.slice(5,7)-1];}
  function parcela(p){var m=String(p||'').match(/(\d+)\s*\/\s*(\d+)/);return m?(('0'+m[1]).slice(-2)+'/'+('0'+m[2]).slice(-2)):'';}

  function montarXlsx(titulo,linhas){
    var rows=[],r=1;
    rows.push('<row r="1" ht="20" customHeight="1">'+txt('A1',titulo,1)+txt('B1','',1)+txt('C1','',1)+txt('D1','',1)+'</row>');
    rows.push('<row r="2">'+txt('A2','Local',2)+txt('B2','Data',2)+txt('C2','Parcela',2)+txt('D2','Valor',2)+'</row>');
    r=2;
    linhas.forEach(function(l){r++;rows.push('<row r="'+r+'">'+txt('A'+r,l.local,3)+txt('B'+r,l.data,3)+txt('C'+r,l.parcela,3)+num('D'+r,l.valor,4)+'</row>');});
    var ult=r;r++;
    var tot=linhas.reduce(function(a,l){return a+(+l.valor||0);},0);
    rows.push('<row r="'+r+'">'+txt('A'+r,'Total:',3)+txt('B'+r,'',3)+txt('C'+r,'',3)
      +'<c r="D'+r+'" s="5"><f>'+(ult>=3?'SUM(D3:D'+ult+')':'0')+'</f><v>'+(Math.round(tot*100)/100)+'</v></c></row>');
    var sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      +'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      +'<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>'
      +'<cols><col min="1" max="1" width="32" customWidth="1"/><col min="2" max="2" width="10" customWidth="1"/><col min="3" max="3" width="10" customWidth="1"/><col min="4" max="4" width="14" customWidth="1"/></cols>'
      +'<sheetData>'+rows.join('')+'</sheetData><mergeCells count="1"><mergeCell ref="A1:D1"/></mergeCells>'
      +'<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>';
    var b='<left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/>';
    var styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      +'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      +'<numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot;\\ #,##0.00;\\-&quot;R$&quot;\\ #,##0.00"/></numFmts>'
      +'<fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>'
      +'<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
      +'<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border>'+b+'</border></borders>'
      +'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
      +'<cellXfs count="6">'
      +'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
      +'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
      +'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
      +'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
      +'<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>'
      +'<xf numFmtId="164" fontId="1" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>'
      +'</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    var nomeAba=titulo.replace(/[\\\/\?\*\[\]:]/g,'').slice(0,31)||'Dani';
    return zip([
      {nome:'[Content_Types].xml',texto:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'},
      {nome:'_rels/.rels',texto:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
      {nome:'xl/workbook.xml',texto:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+x(nomeAba)+'" sheetId="1" r:id="rId1"/></sheets></workbook>'},
      {nome:'xl/_rels/workbook.xml.rels',texto:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
      {nome:'xl/worksheets/sheet1.xml',texto:sheet},
      {nome:'xl/styles.xml',texto:styles}
    ]);
  }

  function itensDani(m){
    return DB.items.filter(function(i){return i.mes===m&&(i.tipo==='dani'||(i.tipo==='cartao'&&i.cat==='Dani'));})
      .slice().sort(function(a,b){
        var da=a.data&&a.data>='2000'?a.data:'9999',db=b.data&&b.data>='2000'?b.data:'9999';
        return da<db?-1:da>db?1:0;
      });
  }
  function linhasDani(m){
    return itensDani(m).map(function(i){return {local:i.nome||'',data:dataCurta(i.data),parcela:parcela(i.parcela),valor:+i.valor||0};});
  }
  window.planilhaDani=function(m){
    m=m||(typeof mesAtual!=='undefined'?mesAtual:new Date().getMonth()+1);
    var linhas=linhasDani(m);
    if(!linhas.length){try{toast('Não há gastos do Dani em '+MESES[m-1]+'.');}catch(e){}return null;}
    var blob=montarXlsx(MESES[m-1],linhas);
    var ano=typeof ANO_PLANILHA!=='undefined'?ANO_PLANILHA:new Date().getFullYear();
    var url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='Dani - '+MESES[m-1]+' '+ano+'.xlsx';document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},2000);
    var tot=linhas.reduce(function(s,l){return s+l.valor;},0);
    try{toast('Planilha do Dani de '+MESES[m-1]+': '+linhas.length+' lançamentos, total '+RK(tot)+'.');}catch(e){}
    return {n:linhas.length,total:Math.round(tot*100)/100};
  };
  window.__daniXlsx={montar:montarXlsx,linhas:linhasDani};

  /* troca o botão antigo (que juntava todos os meses num CSV) pelo novo */
  function trocarBotao(){
    var b=document.getElementById('btn-exportar-dani');if(!b||b.getAttribute('data-v41'))return;
    var n=b.cloneNode(true);n.setAttribute('data-v41','1');
    n.title='Baixa uma planilha (Excel) só com os gastos do Dani do mês aberto na tela';
    var svg=n.querySelector('svg');n.textContent=' Planilha do mês';if(svg)n.insertBefore(svg,n.firstChild);
    n.addEventListener('click',function(ev){ev.preventDefault();window.planilhaDani();});
    b.parentNode.replaceChild(n,b);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',trocarBotao);else trocarBotao();
  window.addEventListener('load',trocarBotao);
  var _r=window.render;if(typeof _r==='function'){window.render=function(){var x=_r.apply(this,arguments);try{trocarBotao();}catch(e){}return x;};try{render=window.render;}catch(e){}}
})();
