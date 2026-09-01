var THEMES=[
 {name:'NEON TOKYO',bg:[.02,.02,.08],acc:[.15,.9,1],sun:[1,.2,.55],lanes:[[0,.95,1],[1,.3,.85],[.6,1,.3],[1,.65,.1]]},
 {name:'SUNSET RIDE',bg:[.06,.02,.05],acc:[1,.55,.2],sun:[1,.35,.15],lanes:[[1,.5,.15],[1,.2,.5],[1,.85,.3],[.9,.4,1]]},
 {name:'VOID PURPLE',bg:[.03,.01,.07],acc:[.7,.3,1],sun:[.4,.15,1],lanes:[[.7,.4,1],[1,.3,.7],[.4,.6,1],[1,.5,.9]]},
 {name:'TOXIC RAVE',bg:[.01,.04,.02],acc:[.3,1,.4],sun:[.6,1,.2],lanes:[[.3,1,.4],[.9,1,.2],[.2,1,.8],[1,1,.3]]},
 {name:'BLOOD MOON',bg:[.05,.01,.01],acc:[1,.2,.25],sun:[1,.15,.1],lanes:[[1,.3,.25],[1,.55,.1],[1,.2,.6],[1,.8,.4]]},
 {name:'DEEP ARCTIC',bg:[.01,.03,.06],acc:[.5,.85,1],sun:[.7,.95,1],lanes:[[.5,.9,1],[.3,.6,1],[.8,.95,1],[.4,1,.9]]}];
var theme=THEMES[0];
var STARS=[],si;
for(si=0;si<70;si++)STARS.push([(Math.random()-.5)*140,4+Math.random()*45,-60-Math.random()*70]);
var DIFFS=[
 {name:'EASY',pOff:.5,pHalf:0,pChord:0,pHold:0,appr:1.7,rate:1},
 {name:'NORMAL',pOff:.72,pHalf:.12,pChord:.06,pHold:.12,appr:1.35,rate:1},
 {name:'HARD',pOff:.95,pHalf:.3,pChord:.16,pHold:.22,appr:1.05,rate:1.08}];
function buildChart(beats,dur,d){
 var cfg=DIFFS[d],notes=[],lastT=[-1,-1,-1,-1],prevLane=-1,i;
 for(i=0;i<beats.length;i++){
  var t=beats[i];
  if(t<1.2||t>dur-0.6)continue;
  if(Math.random()>cfg.pOff)continue;
  var lane=Math.floor(Math.random()*4);
  if(lane===prevLane)lane=(lane+1+Math.floor(Math.random()*3))%4;
  if(t-lastT[lane]<0.22)continue;
  prevLane=lane;
  var hold=false,holdLen=0;
  var gapNext=(i+1<beats.length)?beats[i+1]-t:9;
  if(gapNext>0.9&&Math.random()<cfg.pHold){hold=true;holdLen=Math.min(gapNext*0.75,2);}
  notes.push({t:t,lane:lane,hold:hold,end:t+holdLen,judged:false,held:false,done:false,broken:false,missed:false});
  lastT[lane]=t+holdLen;
  if(Math.random()<cfg.pChord&&!hold){
   var l2=(lane+1+Math.floor(Math.random()*3))%4;
   if(t-lastT[l2]>=0.22){notes.push({t:t,lane:l2,hold:false,end:t,judged:false,held:false,done:false,broken:false,missed:false});lastT[l2]=t;}}
  if(cfg.pHalf>0&&gapNext>0.55&&Math.random()<cfg.pHalf){
   var tm=t+gapNext/2,l3=Math.floor(Math.random()*4);
   if(tm-lastT[l3]>=0.22&&tm<dur-0.6){notes.push({t:tm,lane:l3,hold:false,end:tm,judged:false,held:false,done:false,broken:false,missed:false});lastT[l3]=tm;}}}
 notes.sort(function(a,b){return a.t-b.t;});
 return notes;}
var LANEX=[-3.3,-1.1,1.1,3.3];
var state='lib',notes=[],beats=[],buffer=null,src=null,songStart=0,dur=0;
var score=0,combo=0,maxCombo=0,nPerf=0,nGreat=0,nGood=0,nMiss=0;
var curDiff=0,beatIdx=0,shake=0,swayX=0,lastLaneX=0,appr=1.4,fallS=43;
var songName='',songId='',currentSong=null;
var pressT=[-9,-9,-9,-9],touchCount=[0,0,0,0],keyDown=[false,false,false,false];
var scoreEl=$('score'),multEl=$('mult'),lvlEl=$('lvl'),comboEl=$('combo'),
judgeEl=$('judge'),countEl=$('count'),progEl=$('prog'),progF=$('progF'),
libEl=$('lib'),procEl=$('proc'),procTxt=$('procTxt'),resultEl=$('result'),
resTxt=$('resTxt'),rstBtn=$('rst');
function popJudge(txt,col){judgeEl.textContent=txt;judgeEl.style.color=col;
 judgeEl.style.textShadow='0 0 16px '+col;
 judgeEl.classList.remove('pop');void judgeEl.offsetWidth;judgeEl.classList.add('pop');}
function showHud(on){var d=on?'block':'none';
 scoreEl.style.display=d;multEl.style.display=d;lvlEl.style.display=d;
 progEl.style.display=on?'block':'none';rstBtn.style.display=on?'block':'none';}
function mult(){return 1+Math.min(7,Math.floor(combo/15));}
function laneHasTouch(l){return touchCount[l]>0||keyDown[l];}
function playSong(s){
 currentSong=s;songId=s.id;songName=s.name;
 libEl.style.display='none';resultEl.style.display='none';
 procEl.style.display='flex';
 procTxt.textContent='Loading "'+s.name+'"…';
 var fr=new FileReader();
 fr.onload=function(){
  ensureAudio();
  if(ac.state==='suspended')ac.resume();
  ac.decodeAudioData(fr.result).then(function(buf){
   procTxt.textContent='Detecting beats…';
   setTimeout(function(){
    try{
     var an=analyze(buf);
     var cfg=DIFFS[curDiff],r=cfg.rate,i;
     for(i=0;i<an.beats.length;i++)an.beats[i]=an.beats[i]/r;
     buffer=buf;dur=buf.duration/r;
     notes=buildChart(an.beats,dur,curDiff);
     beats=an.beats;
     appr=cfg.appr;fallS=60/appr;
     theme=THEMES[Math.floor(Math.random()*THEMES.length)];
     begin(Math.round(an.bpm*r));
    }catch(e){procTxt.textContent='Error: '+(e.message||e);}
   },40);
  },function(){procTxt.textContent='Could not decode this audio format.';});};
 fr.onerror=function(){procTxt.textContent='File read error.';};
 fr.readAsArrayBuffer(s.blob);}
function begin(bpmShow){
 score=0;combo=0;maxCombo=0;nPerf=0;nGreat=0;nGood=0;nMiss=0;
 beatIdx=0;parts.length=0;shake=0;lastLaneX=0;swayX=0;
 procEl.style.display='none';showHud(true);
 if(src){try{src.stop();}catch(e){}}
 src=ac.createBufferSource();src.buffer=buffer;
 src.playbackRate.value=DIFFS[curDiff].rate;
 src.connect(master);
 songStart=ac.currentTime+3.2;
 click(songStart-3,false);click(songStart-2,false);
 click(songStart-1,false);click(songStart-0.01,true);
 src.start(songStart);
 lvlEl.textContent=theme.name+' • ~'+bpmShow+' BPM • '+DIFFS[curDiff].name;
 state='play';}
function finish(){
 try{src.stop();}catch(e){}
 state='result';showHud(false);
 countEl.style.display='none';comboEl.style.display='none';
 var total=notes.length||1;
 var acc=(nPerf+nGreat*0.7+nGood*0.35)/total;
 var grade=acc>=0.97?'SS':acc>=0.92?'S':acc>=0.85?'A':acc>=0.7?'B':acc>=0.5?'C':(acc>=0.3?'D':'F');
 var best=getBest(songId),nb=score>best;
 if(nb)setBest(songId,score);
 resTxt.innerHTML='<div class="grade">'+grade+'</div>'+
  '<div class="big">'+score+'</div>'+
  (nb?'<div class="nb">★ NEW BEST ★</div>':'<div class="dim">best '+best+'</div>')+
  '<div class="dim">'+esc(songName)+' • '+DIFFS[curDiff].name+' • '+theme.name+'</div>'+
  '<div class="dim">PERFECT '+nPerf+' • GREAT '+nGreat+' • GOOD '+nGood+' • MISS '+nMiss+'</div>'+
  '<div class="dim">MAX COMBO '+maxCombo+' • ACCURACY '+Math.round(acc*100)+'%</div>';
 resultEl.style.display='flex';}
var currentSongs=[];
function renderList(){
 dbAll(function(err,songs){
  var box=$('list');
  if(err){box.innerHTML='<div class="tip">Storage error: '+esc(err)+'</div>';return;}
  if(!songs.length){box.innerHTML='<div class="tip">No songs yet.<br>Tap <b>＋ ADD YOUR MUSIC</b>.</div>';return;}
  var html='',i;
  for(i=0;i<songs.length;i++){var s=songs[i],b=getBest(s.id);
   html+='<div class="song"><div class="nm">'+esc(s.name)+'</div>'+
    '<div class="mb">'+(b?('BEST '+b):'&nbsp;')+'</div>'+
    '<button class="play" data-i="'+i+'">▶</button>'+
    '<button class="del" data-i="'+i+'">✕</button></div>';}
  box.innerHTML=html;currentSongs=songs;});}
$('list').addEventListener('click',function(e){
 var t=e.target,i=t.getAttribute?t.getAttribute('data-i'):null;
 if(i===null)return;
 if(t.className==='play'&&currentSongs[i])playSong(currentSongs[i]);
 if(t.className==='del'&&currentSongs[i]){
  var s=currentSongs[i];
  if(confirm('Delete "'+s.name+'"?'))dbDel(s.id,function(){renderList();});}});
$('add').addEventListener('click',function(){$('pick').click();});
$('pick').addEventListener('change',function(){
 var files=this.files,self=this;
 if(!files.length)return;
 var pending=files.length,i;
 for(i=0;i<files.length;i++){
  (function(f){
   var song={id:'s'+Date.now()+Math.floor(Math.random()*1e6),name:f.name.replace(/\.[^.]+$/,''),blob:f};
   dbPut(song,function(err){
    if(err)alert('Save failed: '+err);
    pending--;
    if(pending===0){renderList();self.value='';}});
  })(files[i]);}});
var diffBtns=document.querySelectorAll('.diff button'),di;
for(di=0;di<diffBtns.length;di++){
 diffBtns[di].addEventListener('click',function(){
  for(var k=0;k<diffBtns.length;k++)diffBtns[k].classList.remove('on');
  this.classList.add('on');
  curDiff=+this.getAttribute('data-d');});}
$('replay').addEventListener('click',function(){if(currentSong)playSong(currentSong);});
$('tolib').addEventListener('click',function(){
 resultEl.style.display='none';libEl.style.display='flex';state='lib';renderList();});
rstBtn.addEventListener('click',function(){
 try{src.stop();}catch(e){}
 state='lib';showHud(false);
 countEl.style.display='none';comboEl.style.display='none';
 libEl.style.display='flex';renderList();});
function tapLane(lane){
 if(state!=='play'||!ac)return;
 var gt=ac.currentTime-songStart;
 if(gt<-1)return;
 pressT[lane]=ac.currentTime;lastLaneX=LANEX[lane];
 var best=null,bd=1e9,i;
 for(i=0;i<notes.length;i++){var nt=notes[i];
  if(nt.t-gt>0.35)break;
  if(nt.lane!==lane||nt.judged)continue;
  var dd=Math.abs(nt.t-gt);
  if(dd<bd){bd=dd;best=nt;}}
 if(!best||bd>0.2)return;
 best.judged=true;
 var tier;
 if(bd<=0.065){score+=300*mult();nPerf++;tier=2;popJudge('PERFECT','#4ff');}
 else if(bd<=0.13){score+=150*mult();nGreat++;tier=1;popJudge('GREAT','#7f6');}
 else{score+=60*mult();nGood++;tier=0;popJudge('GOOD','#fd6');}
 combo++;if(combo>maxCombo)maxCombo=combo;
 hitSound(tier,lane);vib(tier===2?15:8);
 burst(LANEX[lane],theme.lanes[lane],tier===2?26:14);
 if(best.hold)best.held=true;else best.done=true;}
addEventListener('touchstart',function(e){e.preventDefault();
 for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];
  var l=Math.max(0,Math.min(3,Math.floor(t.clientX/innerWidth*4)));
  touchCount[l]++;tapLane(l);}},{passive:false});
addEventListener('touchend',function(e){e.preventDefault();
 for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];
  var l=Math.max(0,Math.min(3,Math.floor(t.clientX/innerWidth*4)));
  touchCount[l]=Math.max(0,touchCount[l]-1);}},{passive:false});
addEventListener('touchcancel',function(){touchCount=[0,0,0,0];});
addEventListener('mousedown',function(e){
 tapLane(Math.max(0,Math.min(3,Math.floor(e.clientX/innerWidth*4))));});
addEventListener('keydown',function(e){
 var map={d:0,f:1,j:2,k:3},l=map[e.key.toLowerCase()];
 if(l!==undefined&&!keyDown[l]){keyDown[l]=true;tapLane(l);}});
addEventListener('keyup',function(e){
 var map={d:0,f:1,j:2,k:3},l=map[e.key.toLowerCase()];
 if(l!==undefined)keyDown[l]=false;});
document.addEventListener('visibilitychange',function(){
 if(!ac)return;
 if(document.hidden)ac.suspend();else if(state==='play')ac.resume();});
