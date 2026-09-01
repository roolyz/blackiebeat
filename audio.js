var ac=null,master=null;
function ensureAudio(){
 if(ac)return;
 ac=new (window.AudioContext||window.webkitAudioContext)();
 master=ac.createGain();master.gain.value=.9;
 var comp=ac.createDynamicsCompressor();
 master.connect(comp);comp.connect(ac.destination);}
function env(g,t,v,d){g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);}
function click(t,hi){var o=ac.createOscillator(),g=ac.createGain();o.type='square';
 o.frequency.value=hi?1320:880;env(g,t,.28,.09);
 o.connect(g);g.connect(master);o.start(t);o.stop(t+.11);}
function hitSound(tier,lane){var t=ac.currentTime,fq=[392,494,587,659][lane];
 var o=ac.createOscillator(),g=ac.createGain();o.type='triangle';
 o.frequency.value=fq*(tier===2?2:1);env(g,t,tier===2?.2:.13,.16);
 o.connect(g);g.connect(master);o.start(t);o.stop(t+.18);}
function vib(ms){try{if(navigator.vibrate)navigator.vibrate(ms);}catch(e){}}
function analyze(buffer){
 var sr=buffer.sampleRate,ch0=buffer.getChannelData(0);
 var ch1=buffer.numberOfChannels>1?buffer.getChannelData(1):null;
 var N=ch0.length,W=Math.floor(sr*0.04),n=Math.floor(N/W);
 var envA=new Float32Array(n),lp=0,alpha=0.045,w,i,j;
 for(w=0;w<n;w++){
  var sum=0,base=w*W;
  for(i=0;i<W;i++){
   var s=ch0[base+i]+(ch1?ch1[base+i]:0);
   lp+=alpha*(s-lp);sum+=lp*lp;}
  envA[w]=Math.sqrt(sum/W);}
 var gMean=0;for(i=0;i<n;i++)gMean+=envA[i];gMean/=Math.max(1,n);
 var beats=[],lastT=-1;
 for(i=1;i<n-1;i++){
  if(envA[i]<envA[i-1]||envA[i]<envA[i+1])continue;
  var a=Math.max(0,i-25),b=Math.min(n,i+25),m=0;
  for(j=a;j<b;j++)m+=envA[j];m/=(b-a);
  var th=Math.max(m*1.25,gMean*0.9);
  if(envA[i]>th){var t=i*0.04;
   if(t-lastT>=0.22){beats.push(t);lastT=t;}}}
 if(beats.length<16){beats=[];
  for(var tt=1.0;tt<buffer.duration-1;tt+=0.55)beats.push(tt);}
 var gaps=[];
 for(i=1;i<Math.min(beats.length,400);i++){
  var g=beats[i]-beats[i-1];
  if(g>0.2&&g<1.5)gaps.push(g);}
 gaps.sort(function(x,y){return x-y;});
 var bpm=gaps.length?Math.round(60/gaps[gaps.length>>1]):120;
 return{beats:beats,bpm:bpm};}
function idb(cb){var r=indexedDB.open('beatstrike',1);
 r.onupgradeneeded=function(e){e.target.result.createObjectStore('songs',{keyPath:'id'});};
 r.onsuccess=function(e){cb(null,e.target.result);};
 r.onerror=function(){cb('storage error');};}
function dbPut(song,cb){idb(function(err,db){if(err)return cb(err);
 var tx=db.transaction('songs','readwrite');tx.objectStore('songs').put(song);
 tx.oncomplete=function(){cb(null);};tx.onerror=function(){cb('save error');};});}
function dbAll(cb){idb(function(err,db){if(err)return cb(err,[]);
 var rq=db.transaction('songs','readonly').objectStore('songs').getAll();
 rq.onsuccess=function(){cb(null,rq.result||[]);};
 rq.onerror=function(){cb('read error',[]);};});}
function dbDel(id,cb){idb(function(err,db){if(err)return cb(err);
 var tx=db.transaction('songs','readwrite');tx.objectStore('songs').delete(id);
 tx.oncomplete=function(){cb(null);};tx.onerror=function(){cb('delete error');};});}
function getBest(id){try{return +(localStorage.getItem('bsb_'+id)||0);}catch(e){return 0;}}
function setBest(id,v){try{localStorage.setItem('bsb_'+id,v);}catch(e){}}
