"use strict";
function $(i){return document.getElementById(i);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var canvas=$('c');
var gl=canvas.getContext('webgl',{antialias:true})||canvas.getContext('experimental-webgl');
if(!gl)throw new Error('WebGL not supported');
function resize(){var d=Math.min(devicePixelRatio||1,2);
 canvas.width=innerWidth*d;canvas.height=innerHeight*d;
 canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';
 gl.viewport(0,0,canvas.width,canvas.height);}
addEventListener('resize',resize);resize();
function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);
 if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o;}
function mk(vs,fs){var p=gl.createProgram();
 gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));
 gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));
 gl.linkProgram(p);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
 return p;}
var prog=mk(
"attribute vec3 aPos;attribute vec3 aNor;uniform mat4 uPV,uM;varying vec3 vN,vP;void main(){vec4 w=uM*vec4(aPos,1.);vP=w.xyz;vN=mat3(uM)*aNor;gl_Position=uPV*w;}",
"precision mediump float;varying vec3 vN,vP;uniform vec3 uCol,uEye,uFog,uEm;void main(){vec3 N=normalize(vN);vec3 L=normalize(vec3(.3,.8,.5));float d=max(dot(N,L),0.);vec3 c=uCol*(.4+.7*d)+uEm;float f=clamp((distance(vP,uEye)-45.)/85.,0.,1.);gl_FragColor=vec4(mix(c,uFog,f),1.);}");
var progP=mk(
"attribute vec3 aP;attribute vec3 aC;attribute float aS;uniform mat4 uPV;varying vec3 vC;void main(){vC=aC;vec4 p=uPV*vec4(aP,1.);gl_Position=p;gl_PointSize=clamp(aS*300./max(1.,p.w),1.,180.);}",
"precision mediump float;varying vec3 vC;void main(){vec2 d=gl_PointCoord-vec2(.5);float r=length(d)*2.;float a=pow(max(0.,1.-r),2.2);gl_FragColor=vec4(vC*a,a);}");
var V=[
-.5,-.5,.5,0,0,1, .5,-.5,.5,0,0,1, .5,.5,.5,0,0,1,
-.5,-.5,.5,0,0,1, .5,.5,.5,0,0,1, -.5,.5,.5,0,0,1,
.5,-.5,-.5,0,0,-1, -.5,-.5,-.5,0,0,-1, -.5,.5,-.5,0,0,-1,
.5,-.5,-.5,0,0,-1, -.5,.5,-.5,0,0,-1, .5,.5,-.5,0,0,-1,
.5,-.5,.5,1,0,0, .5,-.5,-.5,1,0,0, .5,.5,-.5,1,0,0,
.5,-.5,.5,1,0,0, .5,.5,-.5,1,0,0, .5,.5,.5,1,0,0,
-.5,-.5,-.5,-1,0,0, -.5,-.5,.5,-1,0,0, -.5,.5,.5,-1,0,0,
-.5,-.5,-.5,-1,0,0, -.5,.5,.5,-1,0,0, -.5,.5,-.5,-1,0,0,
-.5,.5,.5,0,1,0, .5,.5,.5,0,1,0, .5,.5,-.5,0,1,0,
-.5,.5,.5,0,1,0, .5,.5,-.5,0,1,0, -.5,.5,-.5,0,1,0,
-.5,-.5,-.5,0,-1,0, .5,-.5,-.5,0,-1,0, .5,-.5,.5,0,-1,0,
-.5,-.5,-.5,0,-1,0, .5,-.5,.5,0,-1,0, -.5,-.5,.5,0,-1,0];
gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(V),gl.STATIC_DRAW);
var bufP=gl.createBuffer();
var aPos=gl.getAttribLocation(prog,'aPos'),aNor=gl.getAttribLocation(prog,'aNor');
var uPV=gl.getUniformLocation(prog,'uPV'),uM=gl.getUniformLocation(prog,'uM'),
uCol=gl.getUniformLocation(prog,'uCol'),uEye=gl.getUniformLocation(prog,'uEye'),
uFog=gl.getUniformLocation(prog,'uFog'),uEm=gl.getUniformLocation(prog,'uEm');
var pP=gl.getAttribLocation(progP,'aP'),pC=gl.getAttribLocation(progP,'aC'),
pS=gl.getAttribLocation(progP,'aS'),uPVp=gl.getUniformLocation(progP,'uPV');
function offAll(){for(var i=0;i<6;i++)gl.disableVertexAttribArray(i);}
function useCube(){offAll();gl.useProgram(prog);
 gl.enableVertexAttribArray(aPos);gl.vertexAttribPointer(aPos,3,gl.FLOAT,false,24,0);
 gl.enableVertexAttribArray(aNor);gl.vertexAttribPointer(aNor,3,gl.FLOAT,false,24,12);}
var MAXP=1000,pArr=new Float32Array(MAXP*7);
function usePts(){offAll();gl.useProgram(progP);
 if(pP>=0){gl.enableVertexAttribArray(pP);gl.vertexAttribPointer(pP,3,gl.FLOAT,false,28,0);}
 if(pC>=0){gl.enableVertexAttribArray(pC);gl.vertexAttribPointer(pC,3,gl.FLOAT,false,28,12);}
 if(pS>=0){gl.enableVertexAttribArray(pS);gl.vertexAttribPointer(pS,1,gl.FLOAT,false,28,24);}}
function perspective(fov,a,n,f){var t=1/Math.tan(fov/2),nf=1/(n-f);
 return new Float32Array([t/a,0,0,0,0,t,0,0,0,0,(f+n)*nf,-1,0,0,2*f*n*nf,0]);}
function lookAt(e,c,u){
 var zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2],l=Math.hypot(zx,zy,zz);zx/=l;zy/=l;zz/=l;
 var xx=u[1]*zz-u[2]*zy,xy=u[2]*zx-u[0]*zz,xz=u[0]*zy-u[1]*zx;
 l=Math.hypot(xx,xy,xz);xx/=l;xy/=l;xz/=l;
 var yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
 return new Float32Array([xx,yx,zx,0,xy,yy,zy,0,xz,yz,zz,0,
 -(xx*e[0]+xy*e[1]+xz*e[2]),-(yx*e[0]+yy*e[1]+yz*e[2]),-(zx*e[0]+zy*e[1]+zz*e[2]),1]);}
function mul(a,b){var o=new Float32Array(16),c,r;
 for(c=0;c<4;c++)for(r=0;r<4;r++)
 o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
 return o;}
function model(x,y,z,ry,rz,s1,s2,s3){
 var cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);
 return new Float32Array([cy*cz*s1,sz*s1,-sy*cz*s1,0,-cy*sz*s2,cz*s2,sy*sz*s2,0,sy*s3,0,cy*s3,0,x,y,z,1]);}
var PV=null;
function drawBox(x,y,z,ry,rz,s1,s2,s3,col,em){
 gl.uniformMatrix4fv(uM,false,model(x,y,z,ry,rz,s1,s2,s3));
 gl.uniform3fv(uCol,col);gl.uniform3fv(uEm,em||[0,0,0]);
 gl.drawArrays(gl.TRIANGLES,0,36);}
var glows=[];
function addGlow(x,y,z,r,g,b,s){if(glows.length<MAXP)glows.push([x,y,z,r,g,b,s]);}
var parts=[];
function burst(x,col,n){for(var i=0;i<n;i++){
 var a=Math.random()*Math.PI*2,r=Math.random()*.7+.3;
 parts.push({x:x+(Math.random()-.5)*1.2,y:.4,z:0,vx:Math.cos(a)*r*4,
 vy:Math.random()*5+2,vz:Math.sin(a)*r*3,life:.55+Math.random()*.3,max:.8,
 c:Math.random()<.3?[1,1,1]:col,s:.22+Math.random()*.3});}}
function flushPoints(){
 usePts();
 gl.uniformMatrix4fv(uPVp,false,PV);
 var n=0,i;
 for(i=0;i<glows.length&&n<MAXP;i++){var g=glows[i],d=n*7;
  pArr[d]=g[0];pArr[d+1]=g[1];pArr[d+2]=g[2];pArr[d+3]=g[3];pArr[d+4]=g[4];pArr[d+5]=g[5];pArr[d+6]=g[6];n++;}
 for(i=0;i<parts.length&&n<MAXP;i++){var p=parts[i],d2=n*7,a2=p.life/p.max;
  pArr[d2]=p.x;pArr[d2+1]=p.y;pArr[d2+2]=p.z;
  pArr[d2+3]=p.c[0]*a2;pArr[d2+4]=p.c[1]*a2;pArr[d2+5]=p.c[2]*a2;pArr[d2+6]=p.s;n++;}
 if(n>0){
  gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
  gl.bufferData(gl.ARRAY_BUFFER,pArr.subarray(0,n*7),gl.DYNAMIC_DRAW);
  gl.drawArrays(gl.POINTS,0,n);
  gl.disable(gl.BLEND);gl.depthMask(true);}
 glows.length=0;}
gl.enable(gl.DEPTH_TEST);
