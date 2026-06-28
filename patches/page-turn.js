(function(){
  function onReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function addStyle(){
    if(document.getElementById('page-turn-patch-style')) return;
    var css=''
      + '.wrap{position:relative;overflow-x:hidden;overflow-y:visible;perspective:1100px;perspective-origin:50% 34%}'
      + '.card{will-change:transform,opacity,filter,box-shadow;transform-style:preserve-3d;backface-visibility:hidden}'
      + 'body.page-turning .card{pointer-events:none}'
      + 'body.page-turning .wrap:after{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(21,36,61,.08),transparent 24%,transparent 74%,rgba(21,36,61,.08));opacity:.55;animation:pageTurnShade .46s ease both;z-index:5}'
      + '.card.page-turn-current{display:block!important;position:relative;z-index:6;transform-origin:left center;animation:pageTurnOutLeft .44s cubic-bezier(.16,.84,.29,1) both;box-shadow:18px 18px 44px rgba(21,36,61,.18)!important}'
      + '.card.page-turn-next{display:block!important;position:relative;z-index:4;transform-origin:right center;animation:pageTurnInRight .48s cubic-bezier(.16,.84,.29,1) both}'
      + '.card.page-turn-current.back{animation-name:pageTurnOutRight;transform-origin:right center}'
      + '.card.page-turn-next.back{animation-name:pageTurnInLeft;transform-origin:left center}'
      + '@keyframes pageTurnShade{0%{opacity:0}38%{opacity:.62}100%{opacity:0}}'
      + '@keyframes pageTurnInRight{0%{opacity:.18;filter:brightness(.96);transform:translateX(76px) rotateY(-24deg) skewY(.5deg) scale(.965)}56%{opacity:.78;filter:brightness(.99);transform:translateX(10px) rotateY(-6deg) skewY(.1deg) scale(.993)}100%{opacity:1;filter:brightness(1);transform:translateX(0) rotateY(0) skewY(0) scale(1)}}'
      + '@keyframes pageTurnOutLeft{0%{opacity:1;filter:brightness(1);transform:translateX(0) rotateY(0) skewY(0) scale(1)}46%{opacity:.72;filter:brightness(.98);transform:translateX(-34px) rotateY(18deg) skewY(-.4deg) scale(.985)}100%{opacity:0;filter:brightness(.92);transform:translateX(-108px) rotateY(48deg) skewY(-.8deg) scale(.955)}}'
      + '@keyframes pageTurnInLeft{0%{opacity:.18;filter:brightness(.96);transform:translateX(-76px) rotateY(24deg) skewY(-.5deg) scale(.965)}56%{opacity:.78;filter:brightness(.99);transform:translateX(-10px) rotateY(6deg) skewY(-.1deg) scale(.993)}100%{opacity:1;filter:brightness(1);transform:translateX(0) rotateY(0) skewY(0) scale(1)}}'
      + '@keyframes pageTurnOutRight{0%{opacity:1;filter:brightness(1);transform:translateX(0) rotateY(0) skewY(0) scale(1)}46%{opacity:.72;filter:brightness(.98);transform:translateX(34px) rotateY(-18deg) skewY(.4deg) scale(.985)}100%{opacity:0;filter:brightness(.92);transform:translateX(108px) rotateY(-48deg) skewY(.8deg) scale(.955)}}'
      + '@media(max-width:560px){.wrap{perspective:780px}.card.page-turn-current{animation-duration:.30s}.card.page-turn-next{animation-duration:.34s}body.page-turning .wrap:after{opacity:.32}@keyframes pageTurnInRight{0%{opacity:.2;transform:translateX(38px) rotateY(-10deg) scale(.98)}100%{opacity:1;transform:translateX(0) rotateY(0) scale(1)}}@keyframes pageTurnOutLeft{0%{opacity:1;transform:translateX(0) rotateY(0) scale(1)}100%{opacity:0;transform:translateX(-48px) rotateY(18deg) scale(.97)}}@keyframes pageTurnInLeft{0%{opacity:.2;transform:translateX(-38px) rotateY(10deg) scale(.98)}100%{opacity:1;transform:translateX(0) rotateY(0) scale(1)}}@keyframes pageTurnOutRight{0%{opacity:1;transform:translateX(0) rotateY(0) scale(1)}100%{opacity:0;transform:translateX(48px) rotateY(-18deg) scale(.97)}}}'
      + '@media(prefers-reduced-motion:reduce){.card.page-turn-current,.card.page-turn-next,body.page-turning .wrap:after{animation:none!important}}';
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
      },500);
    };
    wrapped.__pageTurnPreview=true;
    show=wrapped;
    try{window.show=wrapped;}catch(e){}
  }
  onReady(function(){ addStyle(); wrapShow(); });
})();
