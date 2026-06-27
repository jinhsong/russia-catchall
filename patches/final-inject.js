(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function style(){
    if(document.getElementById('final-inject-style')) return;
    var css = '#results-queue{display:none!important}.faq-top{margin-left:auto;border-color:var(--copper);color:var(--copper);background:#fff}.faq-modal{position:fixed;inset:0;z-index:100;background:rgba(21,36,61,.42);display:none;align-items:center;justify-content:center;padding:18px}.faq-modal.show{display:flex}.faq-panel{width:min(920px,100%);max-height:86vh;overflow:auto;background:var(--panel);border:1px solid var(--line2);border-radius:16px;box-shadow:0 18px 60px rgba(21,36,61,.28);padding:22px}.faq-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}.faq-head h2{font-family:\'Noto Serif KR\',serif;font-size:20px;margin:0}.faq-list details{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:9px 0}.faq-list summary{cursor:pointer;font-weight:800;color:var(--ink)}.faq-list p{margin:8px 0 0;color:var(--soft);font-size:13.5px}.faq-close{min-width:42px}';
    var el=document.createElement('style'); el.id='final-inject-style'; el.textContent=css; document.head.appendChild(el);
  }
  function addFaq(){
    var top=document.querySelector('header .top');
    if(top && !document.getElementById('btn-faq')) top.insertAdjacentHTML('beforeend','<button class="btn sm faq-top" id="btn-faq" type="button">FAQ</button>');
    var sub=document.querySelector('#card-results .subtxt');
    if(sub) sub.textContent='모델별 판정 결과를 확인하고 다음 단계로 진행합니다.';
    if(!document.getElementById('faq-modal')){
      var qs=['이 도구는 무엇을 확인하는 건가요?|모델명 기준으로 상황허가 판정 상태, 허가예외 가능성, 사전신고 필요 여부, 의심징후 점검 여부를 정리해 결과 요약을 만들기 위한 내부 점검 도구입니다.','판정결과가 해당이면 바로 수출 가능한가요?|아닙니다. 해당 모델은 허가예외 또는 사전신고 가능 여부를 추가로 확인해야 합니다. 판단이 애매하거나 상황허가가 필요해 보이면 통상그룹 담당자에게 문의하세요.','판정결과가 없음 또는 만료이면 어떻게 하나요?|판정 신청 품의 단계에서 모델명, 품목명, HS코드, 사양, 무게, 용도 등을 입력해 품의 초안을 만든 뒤 결과 요약을 첨부해 진행하세요.','러시아 SERC 또는 SRR 거래는 의심징후 점검이 필요한가요?|판정 신청 단계에서 수입국이 러시아만이고 최종사용자가 SERC 또는 SRR 중 하나인 경우에는 의심징후 점검을 생략하고 결과 요약으로 진행할 수 있습니다.','러시아와 벨라루스를 동시에 선택하면 어떻게 하나요?|벨라루스가 포함되면 벨라루스 최종사용자를 별도로 입력해야 합니다. 러시아 SERC/SRR만으로는 벨라루스 거래자 정보가 충족되지 않습니다.','허가예외 해당 없음이면 어떻게 해야 하나요?|상황허가 대상입니다. 결과 요약을 다운로드한 뒤 통상그룹 담당자에게 전달하여 후속 검토를 요청하세요.','소비자 통신제품 허가예외를 선택하면 어떤 서류가 필요한가요?|이미 출시된 제품은 삼성닷컴 등 오픈마켓 판매 중 화면 캡처를 첨부합니다. 미출시 제품은 사전신고 품의 단계에서 필요한 첨부파일을 확인하세요.','의료기기 거래는 어떤 추가 증빙이 필요한가요?|설치 후 30일 내 설치확인서 1회, 설치 후 반기별 이행점검보고서 연 2회 등 최종사용자와 사용용도를 입증할 수 있는 추가 증빙이 필요합니다.','사전신고 단계에서 SERC와 SRR을 동시에 넣어도 되나요?|아니요. 사전신고 단계에서는 SERC 또는 SRR 중 하나만 선택해야 합니다. 선택한 값은 구매자, 최종수하인, 최종사용자에 동일하게 반영됩니다.','품목 후보는 사전신고 단계에서 다시 판단하나요?|아닙니다. 품목 판단은 2단계 판정결과 확인 기준으로 하고, 사전신고 단계에서는 확정된 품목 정보를 사용합니다.','의심징후는 기본값이 있나요?|없습니다. 예 또는 아니오를 사용자가 직접 선택해야 합니다. 미선택 항목이 있으면 결과 요약으로 넘어가지 않습니다.','우려거래자 확인 결과 No Matching List Found가 나오면 어떻게 체크하나요?|Tcode ZRMDD000940에서 No Matching List Found가 확인되면 해당 의심징후는 아니오로 체크하면 됩니다.','구매자, 최종수하인, 최종사용자 중 하나라도 SERC/SRR이 아니면 어떻게 되나요?|사전신고 이후 의심징후 단계로 이동합니다. 거래자 정보가 애매하거나 우려가 있으면 통상그룹에 문의하세요.','결과 요약은 어디에 사용하나요?|결과 요약을 다운로드해 품의나 후속 검토 자료에 첨부합니다. 상황허가 필요 건은 통상그룹 담당자에게 전달하세요.','판단이 애매하면 어떻게 해야 하나요?|자가 판단으로 종결하지 말고 결과 요약과 입력 내용을 통상그룹 담당자에게 공유해 검토를 요청하세요.'];
      document.body.insertAdjacentHTML('beforeend','<div class="faq-modal" id="faq-modal" aria-hidden="true"><div class="faq-panel"><div class="faq-head"><h2>자주 묻는 질문</h2><button class="btn sm faq-close" id="faq-close" type="button">닫기</button></div><div class="faq-list">'+qs.map(function(x,i){var a=x.split('|');return '<details '+(i===0?'open':'')+'><summary>'+(i+1)+'. '+a[0]+'</summary><p>'+a[1]+'</p></details>';}).join('')+'</div></div></div>');
    }
    var b=document.getElementById('btn-faq'),m=document.getElementById('faq-modal'),c=document.getElementById('faq-close');
    function open(){m.classList.add('show');m.setAttribute('aria-hidden','false');}
    function close(){m.classList.remove('show');m.setAttribute('aria-hidden','true');}
    if(b && !b.dataset.faqBound){b.dataset.faqBound='1'; b.onclick=open;}
    if(c && !c.dataset.faqBound){c.dataset.faqBound='1'; c.onclick=close;}
    if(m && !m.dataset.faqBound){m.dataset.faqBound='1'; m.addEventListener('click',function(e){if(e.target===m)close();});}
  }
  function extra(){ if(!state.exceptionExtra) state.exceptionExtra={}; return state.exceptionExtra; }
  function selectedEx(){ return document.querySelector('input[name="ex"]:checked')?.value || ''; }
  function drawExtra(){
    var old=document.getElementById('ex-extra-detail'); if(old) old.remove();
    var anchor=document.getElementById('ex-result'); if(!anchor) return;
    var id=selectedEx();
    if(id==='repair'){
      var saved=extra().repairType||'';
      anchor.insertAdjacentHTML('beforebegin','<div id="ex-extra-detail" class="note info"><b>세부 허가예외를 선택하세요.</b><div style="margin-top:8px"><label class="radio"><input type="radio" name="ex-repair-type" value="보정, 수리(제26조제1항제15호)" '+(saved==='보정, 수리(제26조제1항제15호)'?'checked':'')+'> <span><b>보정, 수리</b><br><span class="muted small">제26조제1항제15호</span></span></label><label class="radio"><input type="radio" name="ex-repair-type" value="검사, 시험(제26조제1항제16호)" '+(saved==='검사, 시험(제26조제1항제16호)'?'checked':'')+'> <span><b>검사, 시험</b><br><span class="muted small">제26조제1항제16호</span></span></label></div><div id="ex-repair-guide" style="margin-top:8px"></div></div>');
      var guide=function(){var v=document.querySelector('input[name="ex-repair-type"]:checked')?.value||'',g=document.getElementById('ex-repair-guide');if(!g)return;if(!v){g.innerHTML='';return;}g.innerHTML=note('warn','<b>'+v+' 증빙 안내</b><ul><li>수출 물품 사진, 고유번호(시리얼번호, 각인번호 등)가 보이는 사진, 고유번호를 기재한 파일 제출이 필요합니다.</li><li>추후 1년 이내 해당 물품에 대한 재수입증명 또는 폐기증명서 제출이 필요합니다.</li></ul>');};
      document.querySelectorAll('input[name="ex-repair-type"]').forEach(function(r){r.onchange=function(){extra().repairType=this.value;document.querySelectorAll('input[name="ex-repair-type"]').forEach(function(x){x.closest('.radio').classList.toggle('on',x.checked);});guide();save();};r.closest('.radio').classList.toggle('on',r.checked);});guide();
    }
    if(id==='consumer'){
      var saved2=extra().consumerReleased||'';
      anchor.insertAdjacentHTML('beforebegin','<div id="ex-extra-detail" class="note info"><b>이미 출시된 제품입니까?</b><div style="margin-top:8px"><label class="radio"><input type="radio" name="ex-consumer-released" value="yes" '+(saved2==='yes'?'checked':'')+'> <span><b>예</b><br><span class="muted small">사전신고 시 삼성닷컴 등 오픈마켓에서 판매 중인 화면 캡처를 첨부하세요.</span></span></label><label class="radio"><input type="radio" name="ex-consumer-released" value="no" '+(saved2==='no'?'checked':'')+'> <span><b>아니오</b><br><span class="muted small">미출시 제품입니다. 사전신고 품의 단계에서 필요한 첨부파일을 확인하세요.</span></span></label></div><div id="ex-consumer-guide" style="margin-top:8px"></div></div>');
      var guide2=function(){var v=document.querySelector('input[name="ex-consumer-released"]:checked')?.value||'',g=document.getElementById('ex-consumer-guide'); if(!g)return; if(v==='yes')g.innerHTML=note('ok','사전신고 시 <b>삼성닷컴 등 오픈마켓에서 판매 중인 화면 캡처</b>를 첨부해 주세요.'); if(v==='no')g.innerHTML=note('warn','미출시 제품으로 선택되었습니다. 사전신고 품의 단계에서 필요한 첨부파일을 확인해 주세요.');};
      document.querySelectorAll('input[name="ex-consumer-released"]').forEach(function(r){r.onchange=function(){extra().consumerReleased=this.value;document.querySelectorAll('input[name="ex-consumer-released"]').forEach(function(x){x.closest('.radio').classList.toggle('on',x.checked);});guide2();save();};r.closest('.radio').classList.toggle('on',r.checked);}); guide2();
    }
  }
  function patchException(){
    if(typeof buildException!=='function' || buildException.__finalStage1) return;
    var old=buildException;
    buildException=function(){
      old.apply(this,arguments);
      document.querySelectorAll('input[name="ex"]').forEach(function(r){r.addEventListener('change',function(){var er=document.getElementById('ex-result'); if(er)er.innerHTML=''; drawExtra();});});
      drawExtra();
      var btn=document.getElementById('ex-continue');
      if(btn) btn.onclick=function(){
        var checked=document.querySelector('input[name="ex"]:checked');
        if(!checked){alert('허가예외를 선택하세요.');return;}
        var opt=EXCEPTION_OPTIONS.find(function(o){return o.id===checked.value;});
        var ex=extra();
        if(opt.id==='repair'&&!ex.repairType){alert('보정·수리 또는 검사·시험 중 하나를 선택하세요.');return;}
        if(opt.id==='consumer'&&!ex.consumerReleased){alert('이미 출시된 제품인지 여부를 선택하세요.');return;}
        var choice=Object.assign({},opt);
        if(opt.id==='repair') choice.title=ex.repairType;
        if(opt.id==='consumer') choice.consumerReleased=ex.consumerReleased;
        state.exceptionChoice=choice; save();
        if(opt.id==='none'){document.getElementById('ex-result').innerHTML=note('danger','<b>허가예외 해당 없음</b><br>상황허가 대상입니다. 결과 요약 버튼을 눌러 점검 결과를 다운로드 하신 후 통상그룹 담당자에게 전달하여 주시기 바랍니다.');return;}
        buildPrenotif(exceptionTargets().map(function(x){return x.model;})); show('#card-prenotif');
      };
    };
    buildException.__finalStage1=true;
    try{ selectedException=function(){return state.exceptionChoice || EXCEPTION_OPTIONS.find(function(o){return state.exceptionChoice&&o.id===state.exceptionChoice.id;});}; }catch(e){}
  }
  onReady(function(){ style(); addFaq(); patchException(); });
})();
