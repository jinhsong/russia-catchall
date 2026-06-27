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
