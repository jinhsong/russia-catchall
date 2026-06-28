(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function addStyle(){
    if(document.getElementById('page-turn-patch-style')) return;
    var css=''
      + '.wrap{position:relative;overflow-x:hidden;overflow-y:visible}'
      + '.card{will-change:transform,opacity;transform-origin:center right}'
      + 'body.page-turning .card{pointer-events:none}'
      + '.card.page-turn-current{display:block!important;animation:pageTurnOutLeft .26s cubic-bezier(.22,.61,.36,1) both}'
      + '.card.page-turn-next{display:block!important;animation:pageTurnInRight .30s cubic-bezier(.22,.61,.36,1) both}'
      + '.card.page-turn-current.back{animation-name:pageTurnOutRight;transform-origin:center left}'
      + '.card.page-turn-next.back{animation-name:pageTurnInLeft;transform-origin:center left}'
      + '@keyframes pageTurnInRight{from{opacity:.35;transform:translateX(28px) rotateY(-3deg) scale(.985)}to{opacity:1;transform:translateX(0) rotateY(0) scale(1)}}'
      + '@keyframes pageTurnOutLeft{from{opacity:1;transform:translateX(0) rotateY(0) scale(1)}to{opacity:0;transform:translateX(-34px) rotateY(3deg) scale(.985)}}'
      + '@keyframes pageTurnInLeft{from{opacity:.35;transform:translateX(-28px) rotateY(3deg) scale(.985)}to{opacity:1;transform:translateX(0) rotateY(0) scale(1)}}'
      + '@keyframes pageTurnOutRight{from{opacity:1;transform:translateX(0) rotateY(0) scale(1)}to{opacity:0;transform:translateX(34px) rotateY(-3deg) scale(.985)}}'
      + '@media(max-width:560px){.card.page-turn-current{animation-duration:.20s}.card.page-turn-next{animation-duration:.24s}@keyframes pageTurnInRight{from{opacity:.25;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}@keyframes pageTurnOutLeft{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-22px)}}@keyframes pageTurnInLeft{from{opacity:.25;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}@keyframes pageTurnOutRight{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(22px)}}}'
      + '@media(prefers-reduced-motion:reduce){.card.page-turn-current,.card.page-turn-next{animation:none!important}}';
    var s=document.createElement('style');
    s.id='page-turn-patch-style';
    s.textContent=css;
    document.head.appendChild(s);
  }
  function cardIndex(sel){
    var ids=['#card-input','#card-results','#card-classify','#card-exception','#card-prenotif','#card-screen','#card-summary'];
    return ids.indexOf(sel);
  }
  function currentCard(){
    var cards=Array.from(document.querySelectorAll('.card'));
    return cards.find(function(c){return !c.classList.contains('hide');}) || null;
  }
  function idSel(el){ return el && el.id ? '#'+el.id : ''; }
  function wrapShow(){
    if(typeof show!=='function' || show.__pageTurnPreview) return;
    var original=show;
    var wrapped=function(card){
      var target=document.querySelector(card);
      var current=currentCard();
      if(!target || !current || current===target || window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        return original.apply(this,arguments);
      }
      var curSel=idSel(current), nextSel=card;
      var isBack=cardIndex(nextSel) < cardIndex(curSel);
      document.body.classList.add('page-turning');
      current.classList.remove('page-turn-current','page-turn-next','back');
      target.classList.remove('page-turn-current','page-turn-next','back','hide');
      current.classList.add('page-turn-current');
      target.classList.add('page-turn-next');
      if(isBack){current.classList.add('back'); target.classList.add('back');}
      setTimeout(function(){
        original.call(null,card);
        current.classList.remove('page-turn-current','page-turn-next','back');
        target.classList.remove('page-turn-current','page-turn-next','back');
        document.body.classList.remove('page-turning');
      },310);
    };
    wrapped.__pageTurnPreview=true;
    show=wrapped;
    try{window.show=wrapped;}catch(e){}
  }
  onReady(function(){ addStyle(); wrapShow(); });
})();
