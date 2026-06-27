(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function isRepairContext(){
    try{
      var ex=state.exceptionChoice||{};
      var extra=state.exceptionExtra||{};
      return ex.id==='repair' && !!(ex.title||ex.repairType||extra.repairType);
    }catch(e){return false;}
  }
  function isEvidenceLine(txt){
    txt=String(txt||'');
    return txt.indexOf('수출 물품 사진')>=0 || txt.indexOf('재수입증명 또는 폐기증명서')>=0 || txt.indexOf('고유번호를 기재한 파일 제출')>=0;
  }
  function isEvidenceTitle(txt){
    txt=String(txt||'');
    return txt.indexOf('증빙 안내')>=0 && txt.indexOf('수출물품 고유번호 증빙')<0;
  }
  function ensureRepairAttachments(body){
    if(!isRepairContext()) return false;
    var changed=false;
    var text=body.textContent||'';
    if(text.indexOf('첨부 1. 수출물품 고유번호 증빙')>=0 && text.indexOf('첨부 2. 결과 요약')>=0) return false;
    var h4s=Array.from(body.querySelectorAll('h4'));
    var attachHead=h4s.find(function(h){return h.textContent.indexOf('첨부파일')>=0;});
    if(!attachHead) return false;
    var ul=attachHead.nextElementSibling;
    while(ul && ul.tagName!=='UL') ul=ul.nextElementSibling;
    if(!ul){
      attachHead.insertAdjacentHTML('afterend','<ul></ul>');
      ul=attachHead.nextElementSibling;
      changed=true;
    }
    if(ul.textContent.indexOf('수출물품 고유번호 증빙')<0){
      ul.insertAdjacentHTML('afterbegin','<li>첨부 1. 수출물품 고유번호 증빙</li>');
      changed=true;
    }
    if(ul.textContent.indexOf('결과 요약')<0){
      ul.insertAdjacentHTML('beforeend','<li>첨부 2. 결과 요약</li>');
      changed=true;
    }
    Array.from(ul.querySelectorAll('li')).forEach(function(li){
      if(li.textContent.indexOf('수출물품 고유번호 증빙')>=0) li.textContent='첨부 1. 수출물품 고유번호 증빙';
      if(li.textContent.indexOf('결과 요약')>=0) li.textContent='첨부 2. 결과 요약';
    });
    return changed;
  }
  function sanitizeRepairEvidenceOnly(){
    var body=document.getElementById('prenotif-body');
    if(!body) return;
    var changed=false;
    Array.from(body.querySelectorAll('p')).forEach(function(p){
      if(isEvidenceTitle(p.textContent)){
        p.remove();
        changed=true;
      }
    });
    Array.from(body.querySelectorAll('li')).forEach(function(li){
      if(isEvidenceLine(li.textContent)){
        li.remove();
        changed=true;
      }
    });
    Array.from(body.querySelectorAll('ul')).forEach(function(ul){
      if(!ul.querySelector('li')){ul.remove(); changed=true;}
    });
    if(ensureRepairAttachments(body)) changed=true;
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
