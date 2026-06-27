(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function clean(v){ return String(v||'').trim().replace(/[\\/:*?"<>|\s]+/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,''); }
  function collectModels(){
    var arr=[];
    try{
      if(state.prenotifDoc && Array.isArray(state.prenotifDoc.rows)) arr=state.prenotifDoc.rows.map(function(r){return r.model;});
      if(!arr.length && Array.isArray(state.invoices)) state.invoices.forEach(function(inv){(inv.items||[]).forEach(function(it){if(it.model)arr.push(it.model);});});
      if(!arr.length && state.classifyDoc && Array.isArray(state.classifyDoc.items)) arr=state.classifyDoc.items.map(function(x){return x.model;});
      if(!arr.length && Array.isArray(state.preModels)) arr=state.preModels;
      if(!arr.length && Array.isArray(state.models)) arr=state.models;
      if(!arr.length && Array.isArray(state.lookups)) arr=state.lookups.map(function(x){return x.model;});
    }catch(e){}
    arr=arr.map(function(x){return String(x||'').trim();}).filter(Boolean);
    return Array.from(new Set(arr));
  }
  function modelPart(){
    var m=collectModels();
    if(!m.length) return '모델명';
    if(m.length===1) return clean(m[0]);
    return clean(m[0])+'_등_'+m.length+'건';
  }
  function stageName(){
    try{
      if(state.prenotifDoc || state.preDone || (Array.isArray(state.invoices)&&state.invoices.length&&state.invoices.some(function(inv){return inv.no||inv.country||inv.endUser;}))) return '사전신고';
      if(state.classifyDoc) return '판정신청';
      if(state.screened) return '의심징후';
      if(state.exceptionChoice) return '허가예외';
    }catch(e){}
    return '판정결과';
  }
  function filename(){ return '결과 요약_'+stageName()+'_'+modelPart()+'.html'; }
  function install(){
    var btn=document.getElementById('btn-download');
    if(!btn || btn.dataset.summaryFilenamePatch) return;
    btn.dataset.summaryFilenamePatch='1';
    btn.onclick=function(){
      var html=(typeof reportHTML==='function') ? reportHTML() : document.documentElement.outerHTML;
      var blob=new Blob([html],{type:'text/html;charset=utf-8'});
      var a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=filename();
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);
    };
  }
  onReady(function(){ install(); document.addEventListener('click',function(){setTimeout(install,50);},true); });
})();
