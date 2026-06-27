(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function isRepairEvidenceText(txt){
    txt=String(txt||'');
    return txt.indexOf('증빙 안내')>=0 && txt.indexOf('수출 물품 사진')>=0 && txt.indexOf('재수입증명 또는 폐기증명서')>=0;
  }
  function sanitizeRepairEvidenceOnly(){
    var body=document.getElementById('prenotif-body');
    if(!body) return;
    var changed=false;
    Array.from(body.querySelectorAll('p')).forEach(function(p){
      var next=p.nextElementSibling;
      var combined=p.textContent + (next&&next.tagName==='UL' ? next.textContent : '');
      if(isRepairEvidenceText(combined)){
        if(next && next.tagName==='UL') next.remove();
        p.remove();
        changed=true;
      }
    });
    if(changed && state.prenotifDoc){
      state.prenotifDoc.bodyHtml=body.innerHTML;
      if(typeof save==='function') save();
    }
  }
  function install(){ sanitizeRepairEvidenceOnly(); }
  onReady(function(){
    install();
    document.addEventListener('click',function(){setTimeout(install,30);},true);
    document.addEventListener('input',function(){setTimeout(install,80);},true);
    document.addEventListener('change',function(){setTimeout(install,80);},true);
    var mo=new MutationObserver(function(){setTimeout(install,30);});
    mo.observe(document.body,{childList:true,subtree:true});
  });
})();
