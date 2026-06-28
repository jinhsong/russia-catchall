(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function currentCardSelector(){
    var card=Array.from(document.querySelectorAll('.card')).find(function(c){return !c.classList.contains('hide');});
    return card&&card.id ? '#'+card.id : '';
  }
  function validPrevTarget(sel){
    return ['#card-input','#card-results','#card-classify','#card-exception','#card-prenotif','#card-screen'].includes(sel);
  }
  function rememberNormal(sel){
    if(validPrevTarget(sel)) document.body.dataset.lastNormalCard=sel;
  }
  function fallbackSummaryPrev(){
    var last=document.body.dataset.lastNormalCard||'';
    if(validPrevTarget(last)) return last;
    if(state.screened) return '#card-screen';
    if(state.classifyDoc) return '#card-classify';
    if(state.exceptionChoice) return '#card-exception';
    if(state.preDone || state.prenotifDoc || (state.invoices&&state.invoices.length)) return '#card-prenotif';
    return '#card-results';
  }
  function prevFor(id){
    if(id==='card-results') return '#card-input';
    if(id==='card-classify') return '#card-results';
    if(id==='card-exception') return '#card-results';
    if(id==='card-prenotif') return '#card-exception';
    if(id==='card-screen') return '#card-results';
    if(id==='card-summary'){
      var remembered=document.body.dataset.lastSummarySource||'';
      if(validPrevTarget(remembered)) return remembered;
      return fallbackSummaryPrev();
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
      var target=prevFor(id); if(!target) return;
      var btn=card.querySelector('.btn-prev-step');
      if(btn){ btn.setAttribute('data-prev-target',target); return; }
      var html='<div class="toolbar prev-step-toolbar"><button type="button" class="btn ghost btn-prev-step" data-prev-target="'+target+'">← 이전 단계로 이동</button></div>';
      card.insertAdjacentHTML('beforeend',html);
    });
  }
  function patchShow(){
    if(typeof show!=='function' || show.__backNavPatch) return;
    var old=show;
    show=function(card){
      var from=currentCardSelector();
      rememberNormal(from);
      if(card==='#card-summary' && validPrevTarget(from)) document.body.dataset.lastSummarySource=from;
      if(validPrevTarget(card)) rememberNormal(card);
      if(card==='#card-prenotif' && document.body.dataset.prenotifDocVisible!=='1') hidePrenotifDoc();
      old.apply(this,arguments);
      if(card==='#card-prenotif' && document.body.dataset.prenotifDocVisible!=='1') setTimeout(hidePrenotifDoc,30);
      setTimeout(addButtons,40);
    };
    show.__backNavPatch=true;
  }
  function install(){
    patchShow();
    rememberNormal(currentCardSelector());
    addButtons();
    if(!document.body.dataset.prevStepBound){
      document.body.dataset.prevStepBound='1';
      document.addEventListener('click',function(e){
        var summaryBtn=e.target&&e.target.closest?e.target.closest('#go-summary,#cl-summary,#ex-summary,#pn-continue-flow,#btn-screen-next'):null;
        if(summaryBtn){
          var from=currentCardSelector();
          if(validPrevTarget(from)){
            document.body.dataset.lastSummarySource=from;
            rememberNormal(from);
          }
        }
      },true);
      document.addEventListener('click',function(e){
        var step=e.target&&e.target.closest?e.target.closest('#stepper button[data-card]'):null;
        if(step){
          var from=currentCardSelector();
          rememberNormal(from);
          if(step.dataset.card==='#card-summary' && validPrevTarget(from)) document.body.dataset.lastSummarySource=from;
        }
      },true);
      document.addEventListener('click',function(e){
        var b=e.target&&e.target.closest?e.target.closest('.btn-prev-step'):null;
        if(!b) return;
        e.preventDefault();
        if(b.closest('#card-prenotif')) hidePrenotifDoc();
        var target=b.closest('#card-summary') ? prevFor('card-summary') : b.getAttribute('data-prev-target');
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
