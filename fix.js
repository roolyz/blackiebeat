document.addEventListener('touchstart',function(e){
 var b=e.target&&e.target.closest?e.target.closest('button'):null;
 if(window.state!=='play'||b)e.stopImmediatePropagation();
},true);
document.addEventListener('touchend',function(e){
 if(window.state!=='play')e.stopImmediatePropagation();
},true);
