(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  var banned=['6개월 이내 출시 확약서','산업통상자원부','확약서 결재파일','결재본(eml','파트장 결재','통상그룹 통보'];
  function hasBanned(txt){ return banned.some(function(x){return String(txt||'').indexOf(x)>=0;}); }
  function sanitizeBody(){
    var body=document.getElementById('prenotif-body');
    if(!body) return;
    var changed=false;
    Array.from(body.querySelectorAll('p')).forEach(function(p){
      if(hasBanned(p.textContent) || p.textContent.indexOf('소비자 통신기기 미출시 제품 안내')>=0){
        var n=p.nextElementSibling;
        if(n && n.tagName==='UL' && hasBanned(n.textContent)){ n.remove(); }
        p.remove(); changed=true;
      }
    });
    Array.from(body.querySelectorAll('li')).forEach(function(li){
      if(hasBanned(li.textContent)){ li.remove(); changed=true; }
    });
    Array.from(body.querySelectorAll('ul')).forEach(function(ul){
      var lis=Array.from(ul.querySelectorAll(':scope > li'));
      if(!lis.length){ ul.remove(); changed=true; return; }
      lis=Array.from(ul.querySelectorAll(':scope > li'));
      lis.forEach(function(li,i){
        if(/^첨부\s*\d+\./.test(li.textContent.trim())){
          li.textContent=li.textContent.replace(/^첨부\s*\d+\./,'첨부 '+(i+1)+'.');
          changed=true;
        }
      });
    });
    if(body.innerHTML.indexOf('첨부 3. 결과 요약')>=0){ body.innerHTML=body.innerHTML.replace(/첨부\s*3\.\s*결과 요약/g,'첨부 1. 결과 요약'); changed=true; }
    if(changed && state.prenotifDoc){ state.prenotifDoc.bodyHtml=body.innerHTML; if(typeof save==='function') save(); }
  }
  function patchCopy(){
    var copy=document.getElementById('copy-pn-body');
    if(copy && !copy.dataset.removePledgePatch){
      copy.dataset.removePledgePatch='1';
      copy.addEventListener('click',sanitizeBody,true);
    }
    var next=document.getElementById('pn-continue-flow');
    if(next && !next.dataset.removePledgePatch){
      next.dataset.removePledgePatch='1';
      next.addEventListener('click',sanitizeBody,true);
    }
  }
  function install(){ sanitizeBody(); patchCopy(); }
  onReady(function(){
    install();
    document.addEventListener('click',function(){setTimeout(install,30);},true);
    document.addEventListener('input',function(){setTimeout(install,80);},true);
    document.addEventListener('change',function(){setTimeout(install,80);},true);
    var mo=new MutationObserver(function(){setTimeout(install,30);});
    mo.observe(document.body,{childList:true,subtree:true});
  });
})();
