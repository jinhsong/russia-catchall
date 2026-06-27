(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function exText(){
    var ex=state.exceptionChoice||{};
    var extra=state.exceptionExtra||{};
    if(!ex.id) return '';
    var rows=[];
    var title=ex.title||'';
    if(ex.id==='consumer') title='소비자 통신기기';
    if(ex.id==='medical') title='의료기기';
    if(ex.id==='return') title='반송(제26조제1항제5호)';
    if(ex.id==='exhibition') title='전시회(제26조제1항제8호)';
    if(ex.id==='repair') title=ex.title||extra.repairType||'보정, 수리/검사, 시험';
    rows.push('<li>허가예외 종류: <b>'+esc(title)+'</b></li>');
    if(ex.id==='consumer'){
      var rel=ex.consumerReleased||extra.consumerReleased||'';
      if(rel==='yes') rows.push('<li>출시 여부: <b>이미 출시된 제품</b></li><li>사전신고 첨부: 오픈마켓 출시 증빙 및 결과 요약</li>');
      if(rel==='no') rows.push('<li>출시 여부: <b>미출시 제품</b></li><li>사전신고 첨부: 6개월 이내 출시 확약서(산업통상자원부), 결재본(eml 파일), 결과 요약</li><li>진행 안내: 확약서 서명 후 파트장 결재, 통상그룹 통보</li>');
    }
    if(ex.id==='repair'){
      rows.push('<li>사전신고 첨부: 수출물품 고유번호 증빙 및 결과 요약</li>');
      rows.push('<li>증빙 안내: 수출 물품 사진, 고유번호(시리얼번호, 각인번호 등)가 보이는 사진, 고유번호를 기재한 파일 제출 필요</li>');
      rows.push('<li>사후 제출: 1년 이내 재수입증명 또는 폐기증명서 제출 필요</li>');
    }
    return '<h3>허가예외 세부 확인</h3><ul>'+rows.join('')+'</ul>';
  }
  function prenotifText(){
    var d=state.prenotifDoc;
    if(!d) return '';
    return '<h3>사전신고 품의 자동작성</h3><ul><li>상태: <b>작성 완료</b></li><li>품의 제목: '+esc(d.title||'-')+'</li></ul>';
  }
  function inject(html){
    var add=exText()+prenotifText();
    if(!add) return html;
    if(html.indexOf('허가예외 세부 확인')>=0 || html.indexOf('사전신고 품의 자동작성')>=0) return html;
    var block='<section><h2>추가 확인 사항</h2>'+add+'</section>';
    var pos=html.lastIndexOf('</body>');
    if(pos>=0) return html.slice(0,pos)+block+html.slice(pos);
    return html+block;
  }
  function patch(){
    if(typeof reportHTML!=='function' || reportHTML.__summaryContentPatch) return;
    var old=reportHTML;
    reportHTML=function(){ return inject(old.apply(this,arguments)); };
    reportHTML.__summaryContentPatch=true;
  }
  onReady(function(){ patch(); document.addEventListener('click',function(){setTimeout(patch,30);},true); });
})();
