(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function addStyle(){
    if(document.getElementById('button-style-patch')) return;
    var css=''
      + '.btn{min-height:42px;border-radius:12px;font-weight:900;letter-spacing:-.01em;transition:transform .12s ease,box-shadow .12s ease,background .12s ease,border-color .12s ease}'
      + '.btn:active{transform:translateY(1px)}'
      + '.btn.primary,#btn-lookup,#btn-prenotif-save,#pn-continue-flow,#btn-download{background:linear-gradient(135deg,#15243d,#243b63)!important;border-color:#15243d!important;color:#fff!important;box-shadow:0 8px 18px rgba(21,36,61,.22)!important}'
      + '#btn-prenotif-save.btn-generate-draft{font-size:14.5px;padding:13px 20px;border-radius:14px;margin-top:8px}'
      + '#btn-prenotif-save.btn-generate-draft:before{content:"✎ ";font-weight:900}'
      + '#pn-continue-flow:before{content:"✓ ";font-weight:900}'
      + '#btn-download:before{content:"⬇ ";font-weight:900}'
      + '#copy-pn-title,#copy-pn-body,.labelbar .btn.sm{background:#fff8ec!important;border-color:#9a6a32!important;color:#6f471d!important;box-shadow:0 3px 10px rgba(154,106,50,.12)!important}'
      + '.btn-prev-step{background:#fff8ec!important;border:1.5px solid #9a6a32!important;color:#7a4f1d!important;box-shadow:0 4px 12px rgba(154,106,50,.13)!important;font-weight:900!important}'
      + '.prev-step-toolbar{margin-top:18px;border-top:1px solid var(--line);padding-top:14px}'
      + '.toolbar{gap:10px}'
      + '@media(max-width:560px){.toolbar .btn{width:100%;min-height:48px;font-size:15px}.labelbar .btn.sm{width:auto;min-height:38px}.btn-prev-step{text-align:center;justify-content:center}.prev-step-toolbar .btn-prev-step{width:100%}#btn-prenotif-save.btn-generate-draft{width:100%;min-height:52px}}';
    var el=document.createElement('style');
    el.id='button-style-patch';
    el.textContent=css;
    document.head.appendChild(el);
  }
  function enhance(){
    var gen=document.getElementById('btn-prenotif-save');
    if(gen){ gen.classList.add('primary','btn-generate-draft'); }
    var cont=document.getElementById('pn-continue-flow');
    if(cont){ cont.classList.add('primary'); }
    document.querySelectorAll('.btn-prev-step').forEach(function(b){b.classList.add('btn-previous-emphasis');});
  }
  onReady(function(){ addStyle(); enhance(); document.addEventListener('click',function(){setTimeout(enhance,40);},true); document.addEventListener('change',function(){setTimeout(enhance,40);},true); });
})();

(function(){
  var hsSet=new Set(), tried=false;
  function n(v){return String(v||'').replace(/[^0-9]/g,'');}
  async function ft(u){var r=await fetch(u,{cache:'no-store'});if(!r.ok)throw new Error(String(r.status));return r.text();}
  async function load(){
    if(tried) return; tried=true;
    var p=location.pathname.replace(/[^/]*$/,'')+'data/ofac_hs.csv?v='+Date.now();
    var raw='https://raw.githubusercontent.com/jinhsong/russia-catchall/faq-ui-preview-final/data/ofac_hs.csv?v='+Date.now();
    var t=''; try{t=await ft(p);}catch(e){try{t=await ft(raw);}catch(_){t='';}}
    t.replace(/^\uFEFF/,'').split(/\r?\n/).forEach(function(line,i){
      if(!line.trim())return;
      if(i===0 && /hs|hsk|HS|HS코드|HSKCD/.test(line)) return;
      var h=n(line.split(',')[0]);
      if(!h){(line.match(/\d{4,10}/g)||[]).some(function(x){h=n(x);return !!h;});}
      if(h)hsSet.add(h);
    });
  }
  function isHit(h){h=n(h); if(!h||!hsSet.size)return false; return Array.from(hsSet).some(function(x){return h.startsWith(x)||x.startsWith(h);});}
  function cand(it){var cs=(typeof candidates==='function'?candidates(it&&it.model):[])||[];return cs[Number((it&&it.candIdx)||0)]||cs[0]||{};}
  function rows(){var a=[];(state.invoices||[]).forEach(function(inv,iv){(inv.items||[]).forEach(function(it,ii){var c=cand(it);a.push({iv:iv,ii:ii,it:it,c:c,hs:n(c.hs||it.hs||''),model:(it&&it.model)||c.model||''});});});return a;}
  function domRows(){return Array.from(document.querySelectorAll('#pn-invoices table.grid tr')).filter(function(tr){return tr.querySelector('td');});}
  function check(){
    document.querySelectorAll('.ofac-paid-warning').forEach(function(x){x.remove();});
    var bad=[], dr=domRows();
    rows().forEach(function(r,i){var tr=dr[i]; if(!tr)return; var sel=tr.querySelector('td:nth-child(5) select,select'); var paid=(sel&&sel.value)||r.it.paid||'유상'; if(isHit(r.hs)&&paid==='유상'){bad.push(r); var cell=tr.querySelector('td:nth-child(5)')||tr; cell.insertAdjacentHTML('beforeend',note('danger','<b>OFAC 관련 HS 유상 거래 제한</b><br>이 품목은 OFAC 관련 HS로 관리되는 품목입니다. 유상 거래로는 사전신고 진행이 불가합니다. 무상으로 변경하거나 통상그룹 검토를 요청하세요.<br><span class="small">모델: '+esc(r.model||'-')+' / HS: '+esc(r.hs||'-')+'</span>')); cell.lastElementChild.classList.add('ofac-paid-warning');}});
    var btn=document.getElementById('btn-prenotif-save'); if(btn){btn.disabled=bad.length>0;btn.style.opacity=bad.length?'.55':'';btn.title=bad.length?'OFAC 관련 HS는 유상 거래로 사전신고 품의 생성이 불가합니다.':'';}
    return bad;
  }
  function block(e){var bad=check(); if(!bad.length)return; var er=document.getElementById('pn-err'); if(er)er.innerHTML=note('danger','<b>OFAC 관련 HS 유상 거래 제한</b><br>OFAC 관련 HS 품목은 <b>유상</b>으로 사전신고 품의를 생성할 수 없습니다.<ul>'+bad.map(function(x){return '<li>'+esc(x.model||'-')+' / HS '+esc(x.hs||'-')+'</li>';}).join('')+'</ul><p>무상으로 변경하거나 통상그룹 검토를 요청하세요.</p>'); if(e){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();}}
  function install(){load().then(check); var b=document.getElementById('btn-prenotif-save'); if(b&&!b.dataset.ofacPaidBlock){b.dataset.ofacPaidBlock='1';b.addEventListener('click',block,true);}}
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn);else fn();}
  ready(function(){install();document.addEventListener('click',function(){setTimeout(install,50);},true);document.addEventListener('change',function(e){if(e.target&&e.target.closest&&e.target.closest('#card-prenotif'))setTimeout(check,50);},true);document.addEventListener('input',function(e){if(e.target&&e.target.closest&&e.target.closest('#card-prenotif'))setTimeout(check,80);},true);});
})();
