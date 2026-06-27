(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  var KEY='catchall_draft_v7';
  function readDraft(){ try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){return{};} }
  function applyDraft(){
    var d=readDraft();
    if(d.exceptionExtra && !state.exceptionExtra) state.exceptionExtra=d.exceptionExtra;
    if(d.prenotifDoc && !state.prenotifDoc) state.prenotifDoc=d.prenotifDoc;
  }
  function patchSnapshot(){
    if(typeof snapshot!=='function' || snapshot.__finalComplete) return;
    var old=snapshot;
    snapshot=function(){
      var d=old.apply(this,arguments)||{};
      d.exceptionExtra=state.exceptionExtra||{};
      d.prenotifDoc=state.prenotifDoc||null;
      return d;
    };
    snapshot.__finalComplete=true;
  }
  function exLabel(){
    var ex=state.exceptionChoice||{}, extra=state.exceptionExtra||{};
    if(ex.id==='consumer') return '소비자 통신기기';
    if(ex.id==='medical') return '의료기기';
    if(ex.id==='return') return '반송(제26조제1항제5호)';
    if(ex.id==='exhibition') return '전시회(제26조제1항제8호)';
    if(ex.id==='repair') return ex.title||extra.repairType||'보정, 수리/검사, 시험';
    return ex.title||'';
  }
  function consumerReleased(){
    var ex=state.exceptionChoice||{}, extra=state.exceptionExtra||{};
    if(ex.id!=='consumer') return '';
    return ex.consumerReleased||extra.consumerReleased||'';
  }
  function attachmentGuide(){
    var ex=state.exceptionChoice||{};
    var rel=consumerReleased();
    if(ex.id==='consumer'&&rel==='yes') return '<p><b>소비자 통신기기 출시 증빙 안내</b></p><ul><li>첨부 1. 오픈마켓 출시 증빙</li><li>첨부 2. 결과 요약</li></ul>';
    if(ex.id==='consumer'&&rel==='no') return '<p><b>소비자 통신기기 미출시 제품 안내</b></p><ul><li>첨부 1. 6개월 이내 출시 확약서(산업통상자원부)</li><li>첨부 2. 6개월 이내 출시 확약서 결재파일</li><li>첨부 3. 결과 요약</li></ul>';
    if(ex.id==='repair') return '<p><b>'+esc(exLabel())+' 증빙 안내</b></p><ul><li>수출 물품 사진, 고유번호(시리얼번호, 각인번호 등)가 보이는 사진, 고유번호를 기재한 파일 제출이 필요합니다.</li><li>추후 1년 이내 해당 물품에 대한 재수입증명 또는 폐기증명서 제출이 필요합니다.</li><li>첨부 1. 수출물품 고유번호 증빙</li><li>첨부 2. 결과 요약</li></ul>';
    return '';
  }
  function patchPrenotifDoc(){
    var btn=document.getElementById('btn-prenotif-save');
    if(!btn || btn.dataset.finalCompleteAttach) return;
    btn.dataset.finalCompleteAttach='1';
    btn.addEventListener('click',function(){
      setTimeout(function(){
        var body=document.getElementById('prenotif-body');
        var guide=attachmentGuide();
        if(!body || !guide) return;
        var html=body.innerHTML;
        html=html.replace(/<h4>2\. 첨부파일<\/h4>[\s\S]*?(?=<\/div>|$)/,'<h4>2. 첨부파일</h4>'+guide);
        body.innerHTML=html;
        if(state.prenotifDoc) state.prenotifDoc.bodyHtml=html;
        if(typeof save==='function') save();
      },80);
    },true);
  }
  function patchBuildSummary(){
    if(typeof buildSummary!=='function' || buildSummary.__finalComplete) return;
    var old=buildSummary;
    buildSummary=function(){
      old.apply(this,arguments);
      setTimeout(function(){
        var box=document.getElementById('summary-body');
        if(!box) return;
        var ex=state.exceptionChoice||{}, extra=state.exceptionExtra||{};
        var rows=[];
        if(ex.id){
          var title=exLabel();
          rows.push('<li>허가예외 종류: <b>'+esc(title)+'</b></li>');
          if(ex.id==='consumer'){
            var rel=ex.consumerReleased||extra.consumerReleased||'';
            if(rel==='yes') rows.push('<li>출시 여부: <b>이미 출시된 제품</b></li><li>첨부 안내: 오픈마켓 출시 증빙, 결과 요약</li>');
            if(rel==='no') rows.push('<li>출시 여부: <b>미출시 제품</b></li><li>첨부 안내: 6개월 이내 출시 확약서 및 결재본(eml 파일), 결과 요약</li>');
          }
          if(ex.id==='repair'){
            rows.push('<li>첨부 안내: 수출물품 고유번호 증빙, 결과 요약</li>');
            rows.push('<li>사후 제출: 1년 이내 재수입증명 또는 폐기증명서</li>');
          }
        }
        if(state.prenotifDoc) rows.push('<li>사전신고 품의 자동작성: <b>완료</b></li><li>품의 제목: '+esc(state.prenotifDoc.title||'-')+'</li>');
        if(rows.length && box.innerHTML.indexOf('추가 확인 사항')<0){
          box.insertAdjacentHTML('beforeend','<div class="mcard"><div class="mhead"><span class="mname">추가 확인 사항</span></div><div class="mbody"><ul>'+rows.join('')+'</ul></div></div>');
        }
      },50);
    };
    buildSummary.__finalComplete=true;
  }
  function install(){ applyDraft(); patchSnapshot(); patchPrenotifDoc(); patchBuildSummary(); }
  onReady(function(){ install(); document.addEventListener('click',function(){setTimeout(install,40);},true); document.addEventListener('input',function(){setTimeout(install,40);},true); });
})();
