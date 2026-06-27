(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function prevFor(id){
    if(id==='card-results') return '#card-input';
    if(id==='card-classify') return '#card-results';
    if(id==='card-exception') return '#card-results';
    if(id==='card-prenotif') return '#card-exception';
    if(id==='card-screen') return '#card-results';
    if(id==='card-summary'){
      if(state.preDone || state.prenotifDoc || (state.invoices&&state.invoices.length)) return '#card-prenotif';
      if(state.screened) return '#card-screen';
      if(state.classifyDoc) return '#card-classify';
      if(state.exceptionChoice) return '#card-exception';
      return '#card-results';
    }
    return '';
  }
  function hidePrenotifDoc(){
    var out=document.getElementById('prenotif-doc-out');
    if(out) out.innerHTML='';
    document.body.dataset.prenotifDocVisible='0';
  }
  function addButtons(){
    ['card-results','card-classify','card-exception','card-prenotif','card-screen','card-summary'].forEach(function(id){
      var card=document.getElementById(id); if(!card) return;
      if(card.querySelector('.btn-prev-step')) return;
      var target=prevFor(id); if(!target) return;
      var html='<div class="toolbar prev-step-toolbar"><button type="button" class="btn ghost btn-prev-step" data-prev-target="'+target+'">← 이전 단계로 이동</button></div>';
      card.insertAdjacentHTML('beforeend',html);
    });
  }
  function patchShow(){
    if(typeof show!=='function' || show.__backNavPatch) return;
    var old=show;
    show=function(card){
      if(card==='#card-prenotif' && document.body.dataset.prenotifDocVisible!=='1') hidePrenotifDoc();
      old.apply(this,arguments);
      if(card==='#card-prenotif' && document.body.dataset.prenotifDocVisible!=='1') setTimeout(hidePrenotifDoc,30);
      setTimeout(addButtons,40);
    };
    show.__backNavPatch=true;
  }
  function install(){
    patchShow(); addButtons();
    if(!document.body.dataset.prevStepBound){
      document.body.dataset.prevStepBound='1';
      document.addEventListener('click',function(e){
        var b=e.target&&e.target.closest?e.target.closest('.btn-prev-step'):null;
        if(!b) return;
        e.preventDefault();
        if(b.closest('#card-prenotif')) hidePrenotifDoc();
        var target=b.getAttribute('data-prev-target');
        if(target && typeof show==='function') show(target);
      },true);
      document.addEventListener('click',function(e){
        var b=e.target&&e.target.closest?e.target.closest('#btn-prenotif-save'):null;
        if(!b) return;
        document.body.dataset.prenotifDocVisible='1';
      },true);
      document.addEventListener('click',function(e){
        var b=e.target&&e.target.closest?e.target.closest('#ex-continue'):null;
        if(!b) return;
        document.body.dataset.prenotifDocVisible='0';
        setTimeout(hidePrenotifDoc,80);
      },true);
    }
  }
  onReady(function(){ install(); document.addEventListener('click',function(){setTimeout(install,50);},true); });
})();
