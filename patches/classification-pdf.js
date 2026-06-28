(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function addStyle(){
    if(document.getElementById('classification-pdf-style')) return;
    var css=''
      + '#cert-upload-panel summary{cursor:pointer;font-weight:900;list-style:none}'
      + '#cert-upload-panel summary::-webkit-details-marker{display:none}'
      + '#cert-upload-panel summary:after{content:"펼치기";float:right;font-size:12px;color:#6f471d;background:#fff8ec;border:1px solid #9a6a32;border-radius:999px;padding:4px 9px}'
      + '#cert-upload-panel[open] summary:after{content:"접기"}'
      + '.cert-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}'
      + '.cert-grid .full{grid-column:1/-1}'
      + '.cert-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}'
      + '@media(max-width:560px){.cert-grid{grid-template-columns:1fr}.cert-grid .full{grid-column:auto}.cert-actions .btn{width:100%}}';
    var s=document.createElement('style');
    s.id='classification-pdf-style';
    s.textContent=css;
    document.head.appendChild(s);
  }
  function normalize(v){ return String(v||'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').trim(); }
  function digits(v){ return String(v||'').replace(/[^0-9]/g,''); }
  function escLocal(v){ return typeof esc==='function'?esc(v):String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function noteLocal(type,html){ return typeof note==='function'?note(type,html):'<div class="note '+(type||'')+'">'+html+'</div>'; }
  function currentModelOptions(){
    return (state.lookups||state.models||[]).map(function(x){return typeof x==='string'?x:x.model;}).filter(Boolean);
  }
  function renderPanel(){
    var next=document.getElementById('results-next');
    if(!next) return;
    var old=document.getElementById('cert-upload-panel');
    if(old) old.remove();
    var models=currentModelOptions();
    var html='<details id="cert-upload-panel" class="mcard"><summary>판정서 PDF 첨부로 판정정보 불러오기</summary>'
      + '<div class="mbody">'
      + noteLocal('info','<b>판정서를 가지고 있는 경우 여기에 첨부해주시기 바랍니다.</b><br>텍스트 PDF 판정서에서 상황허가 대상품목 해당 여부, 모델명, 제품명/물품명, 판정발급번호, HS 번호를 파싱합니다.')
      + '<label class="fld" style="margin-top:10px">적용할 모델</label>'
      + '<select id="cert-target-model">'+models.map(function(m){return '<option value="'+escLocal(m)+'">'+escLocal(m)+'</option>';}).join('')+'</select>'
      + '<label class="fld" style="margin-top:10px">판정서 PDF</label>'
      + '<input type="file" id="cert-pdf-file" accept="application/pdf">'
      + '<div id="cert-parse-out" style="margin-top:12px"></div>'
      + '</div></details>';
    next.insertAdjacentHTML('beforebegin',html);
    bindPanel();
  }
  function bindPanel(){
    var inp=document.getElementById('cert-pdf-file');
    if(!inp || inp.dataset.bound) return;
    inp.dataset.bound='1';
    inp.addEventListener('change',function(){ if(inp.files&&inp.files[0]) parseFile(inp.files[0]); });
  }
  function loadScript(src){
    return new Promise(function(resolve,reject){
      var s=document.createElement('script');
      s.src=src;
      s.onload=resolve;
      s.onerror=function(){reject(new Error(src));};
      document.head.appendChild(s);
    });
  }
  async function ensurePdfJs(){
    if(window.pdfjsLib) return window.pdfjsLib;
    try{ await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'); }
    catch(e){ await loadScript('https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js'); }
    if(window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions){
      window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    return window.pdfjsLib;
  }
  function groupPageText(items){
    var rows=[];
    items.forEach(function(it){
      var s=normalize(it.str||'');
      if(!s) return;
      var x=it.transform&&it.transform[4] || 0;
      var y=it.transform&&it.transform[5] || 0;
      var row=rows.find(function(r){return Math.abs(r.y-y)<3;});
      if(!row){row={y:y,items:[]};rows.push(row);}
      row.items.push({x:x,s:s});
    });
    rows.sort(function(a,b){return b.y-a.y;});
    return rows.map(function(r){return r.items.sort(function(a,b){return a.x-b.x;}).map(function(x){return x.s;}).join(' ');}).join('\n');
  }
  async function extractPdfText(file){
    var lib=await ensurePdfJs();
    var buf=await file.arrayBuffer();
    var pdf=await lib.getDocument({data:buf}).promise;
    var pages=[];
    for(var p=1;p<=pdf.numPages;p++){
      var page=await pdf.getPage(p);
      var tc=await page.getTextContent();
      pages.push(groupPageText(tc.items||[]));
    }
    return pages.join('\n');
  }
  function checkedNear(label,ctx){
    if(!ctx) return false;
    var mark='[☑☒■●◆◼✓✔√▣]';
    var re1=new RegExp(mark+'\\s{0,8}'+label,'i');
    var re2=new RegExp(label+'\\s{0,8}'+mark,'i');
    var re3=new RegExp('(?:\\[x\\]|\\(x\\)|checked|선택|체크)\\s{0,10}'+label,'i');
    return re1.test(ctx)||re2.test(ctx)||re3.test(ctx);
  }
  function situationStatus(text){
    var flat=normalize(text).replace(/\s+/g,' ');
    var k=flat.search(/상황\s*허가\s*대상\s*품목|Catch[-\s]*all|catchall/i);
    if(k<0) return {valid:false,status:'',reason:'상황허가 대상품목 항목을 찾지 못했습니다.'};
    var ctx=flat.slice(Math.max(0,k-80),k+260);
    var yesLabel='(?:해\s*당|Yes|YES)';
    var noLabel='(?:비\s*해\s*당|No|NO)';
    var yes=checkedNear(yesLabel,ctx);
    var no=checkedNear(noLabel,ctx);
    if(yes&&!no) return {valid:true,status:'yes',ctx:ctx};
    if(no&&!yes) return {valid:true,status:'no',ctx:ctx};
    return {valid:false,status:'',ctx:ctx,reason:'상황허가 대상품목의 해당/비해당 체크 여부를 확인하지 못했습니다.'};
  }
  function lines(text){ return String(text||'').split(/\r?\n/).map(normalize).filter(Boolean); }
  function afterLabel(ls,regs){
    for(var i=0;i<ls.length;i++){
      for(var r=0;r<regs.length;r++){
        var re=regs[r];
        if(re.test(ls[i])){
          var v=normalize(ls[i].replace(re,'').replace(/^[:：\-\s]+/,''));
          if(v && !/^(Model|Name|Type|Specification|HS|Code)$/i.test(v)) return v;
          for(var j=i+1;j<Math.min(ls.length,i+4);j++){
            var n=normalize(ls[j]);
            if(n && !regs.some(function(x){return x.test(n);})) return n;
          }
        }
      }
    }
    return '';
  }
  function extractHs(text){
    var m=String(text).match(/(?:HS\s*(?:Code|번호|코드)|HSKCD)[^0-9]{0,40}([0-9][0-9\s.\-]{6,20})/i);
    if(m){var h=digits(m[1]); if(h.length>=6) return h.slice(0,10);}
    m=String(text).match(/\b(\d{10})\b/);
    return m?m[1]:'';
  }
  function extractNumber(text){
    var pats=[/판정\s*발급\s*번호[^A-Z0-9가-힣]{0,20}([A-Z0-9\-]{3,40})/i,/발급\s*번호[^A-Z0-9가-힣]{0,20}([A-Z0-9\-]{3,40})/i,/Issue\s*No\.?[^A-Z0-9]{0,20}([A-Z0-9\-]{3,40})/i,/Classification\s*No\.?[^A-Z0-9]{0,20}([A-Z0-9\-]{3,40})/i];
    for(var i=0;i<pats.length;i++){var m=String(text).match(pats[i]); if(m) return m[1];}
    return '';
  }
  function parseCertText(text,targetModel){
    var ls=lines(text);
    var status=situationStatus(text);
    if(!status.valid) return {valid:false,error:'유효한 상황허가 대상품목 판정서가 아닙니다. '+(status.reason||''),ctx:status.ctx||''};
    var item=afterLabel(ls,[/^(?:제품명|품목명|물품명|품명)\s*/i,/^(?:Name\s*of\s*Item|Item\s*Name)\s*/i]);
    var model=afterLabel(ls,[/^(?:모델명|모델)\s*/i,/^(?:Model\s*(?:Number|Name)?|Model\s*No\.?)\s*/i]);
    var hs=extractHs(text);
    var number=extractNumber(text);
    if(!model) model=targetModel||'';
    return {valid:true,isHae:status.status==='yes',situation:status.status==='yes'?'해당':'비해당',model:model,item:item,hs:hs,number:number,raw:text,ctx:status.ctx||''};
  }
  async function parseFile(file){
    var out=document.getElementById('cert-parse-out');
    if(!out) return;
    var target=document.getElementById('cert-target-model')?.value || '';
    out.innerHTML=noteLocal('info','판정서 PDF를 읽는 중입니다. 텍스트 PDF 기준으로 처리합니다.');
    try{
      var text=await extractPdfText(file);
      var parsed=parseCertText(text,target);
      if(!parsed.valid){
        out.innerHTML=noteLocal('danger','<b>'+escLocal(parsed.error)+'</b><br><span class="small">상황허가 대상품목 행에서 해당/비해당 체크를 확인할 수 있어야 합니다.</span>');
        return;
      }
      renderParsed(parsed,target);
    }catch(e){
      out.innerHTML=noteLocal('danger','PDF 파싱에 실패했습니다. 텍스트 PDF인지 확인해 주세요.<br><span class="small">'+escLocal(e.message||e)+'</span>');
    }
  }
  function fieldHtml(id,label,val){
    return '<div><label class="fld">'+escLocal(label)+'</label><input type="text" id="'+id+'" value="'+escLocal(val||'')+'"></div>';
  }
  function renderParsed(p,target){
    var out=document.getElementById('cert-parse-out');
    if(!out) return;
    out.innerHTML=noteLocal(p.isHae?'warn':'ok','판정서에서 상황허가 대상품목 <b>'+escLocal(p.situation)+'</b>으로 확인했습니다. 아래 값을 확인 후 반영하세요.')
      + '<div class="cert-grid">'
      + fieldHtml('cert-situation','상황허가 대상품목 해당 여부',p.situation)
      + fieldHtml('cert-model','모델명',p.model||target)
      + fieldHtml('cert-item','제품명/물품명',p.item)
      + fieldHtml('cert-hs','HS 번호',p.hs)
      + fieldHtml('cert-number','판정발급번호',p.number)
      + '</div>'
      + '<div class="cert-actions"><button type="button" class="btn primary" id="cert-apply">이 정보로 반영하고 다음 단계로 이동</button></div>';
    document.getElementById('cert-apply').onclick=function(){
      var data={
        isHae:p.isHae,
        model:document.getElementById('cert-model').value.trim() || target,
        item:document.getElementById('cert-item').value.trim(),
        hs:digits(document.getElementById('cert-hs').value).slice(0,10),
        number:document.getElementById('cert-number').value.trim()
      };
      applyParsed(data,target);
    };
  }
  function applyParsed(p,target){
    var idx=(state.lookups||[]).findIndex(function(x){return String(x.model||'')===String(target||p.model||'');});
    if(idx<0){ state.lookups=state.lookups||[]; idx=state.lookups.length; }
    var old=state.lookups[idx]||{};
    state.lookups[idx]={
      model:p.model||target||old.model||'',
      item:p.item||old.item||'',
      hs:p.hs||old.hs||'',
      spec:old.spec||'',
      result:p.isHae?'해당':'비해당',
      number:p.number||old.number||'',
      detDate:old.detDate||'',
      expiry:old.expiry||'',
      type:'판정서 PDF',
      isHae:!!p.isHae,
      expired:false,
      row:{},
      found:true,
      source:'판정서 PDF'
    };
    if(Array.isArray(state.models) && p.model && !state.models.includes(p.model)) state.models.push(p.model);
    if(typeof save==='function') save();
    if(typeof renderResults==='function') renderResults();
    setTimeout(function(){
      if(p.isHae){ if(typeof buildException==='function') buildException(); if(typeof show==='function') show('#card-exception'); }
      else{ if(typeof buildScreen==='function') buildScreen(); if(typeof show==='function') show('#card-screen'); }
    },60);
  }
  function patchRenderResults(){
    if(typeof renderResults!=='function' || renderResults.__classificationPdf) return;
    var old=renderResults;
    renderResults=function(){
      old.apply(this,arguments);
      setTimeout(renderPanel,20);
    };
    renderResults.__classificationPdf=true;
  }
  onReady(function(){ addStyle(); patchRenderResults(); renderPanel(); document.addEventListener('click',function(){setTimeout(function(){patchRenderResults();bindPanel();},40);},true); });
})();
