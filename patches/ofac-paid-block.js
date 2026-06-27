(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  var OFAC_HS=new Set();
  var loaded=false;
  function norm(v){return String(v||'').replace(/[^0-9]/g,'');}
  function parseCsv(text){
    text=String(text||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
    return text.split('\n').map(function(x){return x.trim();}).filter(Boolean);
  }
  function extractHs(line,idx){
    var cells=String(line||'').split(',').map(function(x){return x.trim().replace(/^"|"$/g,'');});
    if(idx===0 && cells.some(function(c){return /hs|hsk|HS|HS코드|HSKCD/i.test(c);})) return '';
    for(var i=0;i<cells.length;i++){var h=norm(cells[i]); if(h.length>=4) return h;}
    return '';
  }
  async function fetchText(url){var r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw new Error(String(r.status)); return r.text();}
  async function loadOfac(){
    if(loaded) return;
    loaded=true;
    var stamp=Date.now();
    var local=location.pathname.replace(/[^/]*$/,'')+'data/ofac_hs.csv?v='+stamp;
    var raw='https://raw.githubusercontent.com/jinhsong/russia-catchall/faq-ui-preview-final/data/ofac_hs.csv?v='+stamp;
    var text='';
    try{text=await fetchText(local);}catch(e1){try{text=await fetchText(raw);}catch(e2){text='';}}
    parseCsv(text).forEach(function(line,idx){var h=extractHs(line,idx); if(h) OFAC_HS.add(h);});
  }
  function hsMatchesOfac(hs){
    hs=norm(hs);
    if(!hs || !OFAC_HS.size) return false;
    return Array.from(OFAC_HS).some(function(x){return hs.startsWith(x)||x.startsWith(hs);});
  }
  function candForItem(it){
    var cs=(typeof candidates==='function'?candidates(it&&it.model):[])||[];
    var idx=Number((it&&it.candIdx)||0);
    return cs[idx]||cs[0]||{};
  }
  function flattenInvoiceItems(){
    var rows=[];
    (state.invoices||[]).forEach(function(inv,iv){
      (inv.items||[]).forEach(function(it,ii){
        var cand=candForItem(it);
        rows.push({iv:iv,ii:ii,inv:inv,it:it,cand:cand,hs:norm(cand.hs||it.hs||''),model:(it&&it.model)||cand.model||''});
      });
    });
    return rows;
  }
  function paidValueForRow(row,domRow){
    var sel=domRow&&domRow.querySelector('select');
    return (sel&&sel.value) || row.it.paid || '유상';
  }
  function findDomRows(){
    return Array.from(document.querySelectorAll('#pn-invoices table.grid tr')).filter(function(tr){return tr.querySelector('td');});
  }
  function removeWarnings(){
    document.querySelectorAll('.ofac-paid-warning').forEach(function(x){x.remove();});
  }
  function renderWarnings(){
    removeWarnings();
    if(!OFAC_HS.size) return [];
    var blocks=[];
    var items=flattenInvoiceItems();
    var trs=findDomRows();
    items.forEach(function(row,idx){
      var tr=trs[idx];
      if(!tr) return;
      var paid=paidValueForRow(row,tr);
      if(hsMatchesOfac(row.hs) && paid==='유상'){
        blocks.push(row);
        var cell=tr.querySelector('td:nth-child(5)')||tr.lastElementChild||tr;
        cell.insertAdjacentHTML('beforeend','<div class="note danger ofac-paid-warning" style="margin-top:8px"><b>OFAC 관련 HS 유상 거래 제한</b><br>이 품목은 OFAC 관련 HS로 관리되는 품목입니다. 유상 거래로는 사전신고 진행이 불가합니다. 무상으로 변경하거나 통상그룹 검토를 요청하세요.<br><span class="small">모델: '+esc(row.model||'-')+' / HS: '+esc(row.hs||'-')+'</span></div>');
      }
    });
    var btn=document.getElementById('btn-prenotif-save');
    if(btn){
      btn.disabled=blocks.length>0;
      btn.title=blocks.length?'OFAC 관련 HS는 유상 거래로 사전신고 품의 생성이 불가합니다.':'';
      btn.style.opacity=blocks.length?'.55':'';
    }
    return blocks;
  }
  function blockIfNeeded(e){
    var blocks=renderWarnings();
    if(!blocks.length) return false;
    var er=document.getElementById('pn-err');
    if(er){
      er.innerHTML=note('danger','<b>OFAC 관련 HS 유상 거래 제한</b><br>아래 품목은 OFAC 관련 HS에 해당하여 <b>유상</b>으로 사전신고 품의를 생성할 수 없습니다.<ul>'+blocks.map(function(x){return '<li>'+esc(x.model||'-')+' / HS '+esc(x.hs||'-')+'</li>';}).join('')+'</ul><p>무상으로 변경하거나 통상그룹 검토를 요청하세요.</p>');
    }else alert('OFAC 관련 HS는 유상 거래로 사전신고 품의를 생성할 수 없습니다. 무상으로 변경하거나 통상그룹 검토를 요청하세요.');
    if(e){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();}
    return true;
  }
  function install(){
    loadOfac().then(function(){renderWarnings();}).catch(function(){});
    var btn=document.getElementById('btn-prenotif-save');
    if(btn && !btn.dataset.ofacPaidBlock){
      btn.dataset.ofacPaidBlock='1';
      btn.addEventListener('click',blockIfNeeded,true);
    }
  }
  onReady(function(){
    install();
    document.addEventListener('click',function(){setTimeout(install,40);},true);
    document.addEventListener('change',function(e){if(e.target&&e.target.closest&&e.target.closest('#card-prenotif'))setTimeout(renderWarnings,40);},true);
    document.addEventListener('input',function(e){if(e.target&&e.target.closest&&e.target.closest('#card-prenotif'))setTimeout(renderWarnings,80);},true);
  });
})();
