(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  var savedContinue=null;
  function money(v){ var n=Number(v||0); return isFinite(n)?n.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:2}):''; }
  function total(q,p){ var a=Number(q||0), b=Number(p||0); return isFinite(a*b)?money(a*b):''; }
  function currentException(){ return state.exceptionChoice || (typeof selectedException==='function'?selectedException():null) || {}; }
  function exceptionExtra(){ return state.exceptionExtra || {}; }
  function exLabel(){
    var ex=currentException();
    if(ex.id==='consumer') return '소비자 통신기기';
    if(ex.id==='medical') return '의료기기';
    if(ex.id==='return') return '반송(제26조제1항제5호)';
    if(ex.id==='exhibition') return '전시회(제26조제1항제8호)';
    if(ex.id==='repair') return ex.title || ex.repairType || exceptionExtra().repairType || '보정, 수리(제26조제1항제15호)';
    return ex.title || '-';
  }
  function consumerReleased(){
    var ex=currentException();
    var extra=exceptionExtra();
    if(ex.id!=='consumer') return '';
    return ex.consumerReleased || extra.consumerReleased || '';
  }
  function isConsumerReleased(){ return consumerReleased()==='yes'; }
  function isConsumerUnreleased(){ return consumerReleased()==='no'; }
  function isRepairException(){ return currentException().id==='repair'; }
  function firstModel(){
    var rows=flattenRows();
    if(!rows.length) return '';
    return rows[0].model + (rows.length>1 ? ' 등 '+rows.length+'건' : '');
  }
  function countriesText(){
    var xs=(state.invoices||[]).map(function(x){return x.country;}).filter(Boolean);
    return Array.from(new Set(xs)).join(', ');
  }
  function firstEndUser(){ return (state.invoices&&state.invoices[0]&&state.invoices[0].endUser)||''; }
  function invNumberMap(){
    var map={}, seq=0;
    (state.invoices||[]).forEach(function(inv){ var key=inv.no||'인보이스'; if(!map[key]) map[key]=String(++seq); });
    return map;
  }
  function flattenRows(){
    var map=invNumberMap();
    var rows=[];
    (state.invoices||[]).forEach(function(inv){
      (inv.items||[]).forEach(function(it){
        var cs=(typeof candidates==='function'?candidates(it.model):[]) || [];
        var cand=cs[Number(it.candIdx||0)] || cs[0] || {};
        rows.push({
          no: map[inv.no||'인보이스'] || '',
          invoice: inv.no || '',
          endUser: inv.endUser || '',
          endUse: inv.endUse || '',
          item: cand.item || it.item || '',
          model: it.model || cand.model || '',
          number: cand.number || '',
          qty: it.qty || '',
          price: it.price || '',
          amount: total(it.qty,it.price),
          paid: it.paid || '유상'
        });
      });
    });
    return rows;
  }
  function validatePrenotifDoc(){
    var errs=[];
    if(typeof syncInvoices==='function') syncInvoices();
    (state.invoices||[]).forEach(function(inv,i){
      if(!inv.no) errs.push('인보이스 '+(i+1)+': 인보이스번호');
      if(!inv.country) errs.push('인보이스 '+(i+1)+': 목적국');
      if(!inv.endUser) errs.push('인보이스 '+(i+1)+': 최종사용자');
      if(!inv.endUse) errs.push('인보이스 '+(i+1)+': 최종사용용도');
      (inv.items||[]).forEach(function(it,j){
        if(!it.model) errs.push('인보이스 '+(i+1)+' 품목 '+(j+1)+': 모델명');
        if(!it.qty) errs.push('인보이스 '+(i+1)+' 품목 '+(j+1)+': 수량');
        if(it.price==='' || it.price==null) errs.push('인보이스 '+(i+1)+' 품목 '+(j+1)+': 단가');
      });
    });
    var ex=currentException();
    if(!ex.id) errs.push('허가예외 선택값');
    return errs;
  }
  function tableHtml(rows){
    return '<table><thead><tr><th>번호</th><th>인보이스번호</th><th>최종사용자</th><th>허가예외종류</th><th>최종사용용도</th><th>제품명</th><th>모델명</th><th>판정발급번호</th><th>수량(개)</th><th>단가(USD)</th><th>총액</th><th>유무상 여부</th></tr></thead><tbody>'+rows.map(function(r){return '<tr><td>'+esc(r.no)+'</td><td>'+esc(r.invoice)+'</td><td>'+esc(r.endUser)+'</td><td>'+esc(exLabel())+'</td><td>'+esc(r.endUse)+'</td><td>'+esc(r.item||'-')+'</td><td>'+esc(r.model)+'</td><td>'+esc(r.number||'-')+'</td><td>'+esc(r.qty)+'</td><td>'+esc(money(r.price))+'</td><td>'+esc(r.amount)+'</td><td>'+esc(r.paid)+'</td></tr>';}).join('')+'</tbody></table>';
  }
  function evidenceGuideHtml(){
    if(isConsumerReleased()){
      return '<p><b>소비자 통신기기 출시 증빙 안내</b></p><ul><li>이미 출시된 제품으로 선택한 경우, 사전신고 시 삼성닷컴 등 오픈마켓에서 판매 중임을 확인할 수 있는 화면 캡처를 첨부해 주세요.</li></ul>';
    }
    if(isConsumerUnreleased()){
      return '<p><b>소비자 통신기기 미출시 제품 안내</b></p><ul><li>6개월 이내 출시 확약서(산업통상자원부 제출)가 필요합니다.</li><li>확약서에 서명 후 파트장 결재 및 통상그룹 통보를 진행해 주세요.</li><li>사전신고 시 확약서와 결재본(eml 파일)을 함께 첨부해야 합니다.</li></ul>';
    }
    if(isRepairException()){
      return '<p><b>'+esc(exLabel())+' 증빙 안내</b></p><ul><li>수출 물품 사진, 고유번호(시리얼번호, 각인번호 등)가 보이는 사진, 고유번호를 기재한 파일 제출이 필요합니다.</li><li>추후 1년 이내 해당 물품에 대한 재수입증명 또는 폐기증명서 제출이 필요합니다.</li></ul>';
    }
    return '';
  }
  function attachmentsHtml(){
    if(isConsumerReleased()){
      return '<ul><li>첨부 1. 오픈마켓 출시 증빙</li><li>첨부 2. 결과 요약</li></ul>';
    }
    if(isConsumerUnreleased()){
      return '<ul><li>첨부 1. 6개월 이내 출시 확약서(산업통상자원부)</li><li>첨부 2. 6개월 이내 출시 확약서 결재파일</li><li>첨부 3. 결과 요약</li></ul>';
    }
    if(isRepairException()){
      return '<ul><li>첨부 1. 수출물품 고유번호 증빙</li><li>첨부 2. 결과 요약</li></ul>';
    }
    return '<ul><li>첨부 1. 결과 요약</li></ul>';
  }
  function buildDoc(){
    if(typeof syncInvoices==='function') syncInvoices();
    var rows=flattenRows();
    var title=(countriesText()||'{국가명}')+' '+(firstEndUser()||'{최종사용자}')+' 사전신고 신청 품의 '+(firstModel()||'{모델명 등}');
    var body='<p>'+(countriesText()||'{국가명}')+' 상황허가 대상품목 수출을 위한 사전신고 품의를 다음과 같이 상신합니다.</p><h4>1. 사전신고 신청건</h4>'+tableHtml(rows)+'<h4>2. 첨부파일</h4>'+evidenceGuideHtml()+attachmentsHtml();
    state.prenotifDoc={title:title,bodyHtml:body,rows:rows,createdAt:new Date().toISOString()};
    return state.prenotifDoc;
  }
  function copyPlain(text,btn){ if(typeof copyText==='function') return copyText(text,btn); navigator.clipboard.writeText(text); }
  function copyRich(el,btn){ if(typeof copyHtml==='function') return copyHtml(el,btn); copyPlain(el.innerText,btn); }
  function renderDoc(oldContinue){
    var out=document.getElementById('prenotif-doc-out');
    if(!out){
      var err=document.getElementById('pn-err');
      if(err) err.insertAdjacentHTML('afterend','<div id="prenotif-doc-out"></div>');
      out=document.getElementById('prenotif-doc-out');
    }
    var d=buildDoc();
    out.innerHTML='<div class="divider"></div>'+note('danger','<b>상신 전 반드시 확인하세요</b><ul><li>아래 제목과 본문을 복사하여 사전신고 품의에 사용하세요.</li><li>첨부파일 목록은 허가예외 선택값에 따라 자동 구성됩니다.</li><li>결과 요약은 다음 단계에서 다운로드 후 첨부하세요.</li></ul>')+'<div class="labelbar"><label class="fld">제목</label><button class="btn sm" id="copy-pn-title">제목 복사</button></div><div class="memo" id="prenotif-title" contenteditable="true" style="min-height:58px" aria-label="사전신고 품의 제목">'+esc(d.title)+'</div><div class="labelbar"><label class="fld">본문</label><button class="btn sm" id="copy-pn-body">본문 복사</button></div><div class="memo" id="prenotif-body" aria-readonly="true">'+d.bodyHtml+'</div><div class="toolbar"><button class="btn primary" id="pn-continue-flow">저장 · 다음 단계로 이동</button></div>';
    document.getElementById('prenotif-title').addEventListener('input',function(e){state.prenotifDoc.title=e.target.innerText.trim(); if(typeof save==='function') save();});
    document.getElementById('copy-pn-title').onclick=function(e){copyPlain(document.getElementById('prenotif-title').innerText.trim(),e.target);};
    document.getElementById('copy-pn-body').onclick=function(e){copyRich(document.getElementById('prenotif-body'),e.target);};
    document.getElementById('pn-continue-flow').onclick=function(){ if(typeof oldContinue==='function') oldContinue(); else {state.preDone=true; if(typeof buildSummary==='function') buildSummary(); if(typeof show==='function') show('#card-summary');} };
    if(typeof save==='function') save();
  }
  function refreshDocIfVisible(){
    if(document.getElementById('prenotif-doc-out')) renderDoc(savedContinue);
  }
  function invalidatePrenotifDoc(){
    if(state.prenotifDoc) delete state.prenotifDoc;
    if(typeof save==='function') save();
    setTimeout(refreshDocIfVisible,40);
  }
  function patchExceptionInvalidation(){
    if(document.body.dataset.prenotifExceptionInvalidation) return;
    document.body.dataset.prenotifExceptionInvalidation='1';
    document.addEventListener('change',function(e){
      var t=e.target;
      if(!t) return;
      if(t.name==='ex' || t.name==='ex-repair-type' || t.name==='ex-consumer-released') invalidatePrenotifDoc();
    },true);
    document.addEventListener('click',function(e){
      var t=e.target;
      if(t && t.id==='ex-continue') setTimeout(function(){ delete state.prenotifDoc; if(typeof save==='function') save(); },20);
    },true);
  }
  function install(){
    var btn=document.getElementById('btn-prenotif-save');
    if(!btn) return;
    if(btn.dataset.prenotifDocPatch){ refreshDocIfVisible(); return; }
    var old=btn.onclick;
    savedContinue=old;
    btn.dataset.prenotifDocPatch='1';
    btn.textContent='사전신고 품의 생성';
    btn.onclick=function(e){
      if(e) e.preventDefault();
      var errs=validatePrenotifDoc();
      var er=document.getElementById('pn-err');
      if(errs.length){ if(er) er.innerHTML=note('danger','입력을 확인하세요.<ul>'+errs.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>'); return; }
      if(er) er.innerHTML='';
      state.preDone=true;
      renderDoc(old);
    };
    refreshDocIfVisible();
  }
  onReady(function(){ install(); patchExceptionInvalidation(); document.addEventListener('click',function(){setTimeout(function(){install();refreshDocIfVisible();},30);},true); document.addEventListener('input',function(e){ if(e.target&&e.target.closest&&e.target.closest('#card-prenotif')) setTimeout(refreshDocIfVisible,80); },true); document.addEventListener('change',function(e){ if(e.target&&e.target.closest&&e.target.closest('#card-prenotif')) setTimeout(refreshDocIfVisible,80); },true); });
})();
