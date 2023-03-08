import lamejs from "lamejs";

var WebMMuxer=(()=>{var dt=Object.defineProperty;var he=Object.getOwnPropertyDescriptor;var oe=Object.getOwnPropertyNames,vt=Object.getOwnPropertySymbols;var Wt=Object.prototype.hasOwnProperty,le=Object.prototype.propertyIsEnumerable;var b=Math.pow,Ht=(a,t,i)=>t in a?dt(a,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):a[t]=i,Kt=(a,t)=>{for(var i in t||={})Wt.call(t,i)&&Ht(a,i,t[i]);if(vt)for(var i of vt(t))le.call(t,i)&&Ht(a,i,t[i]);return a};var de=(a,t)=>{for(var i in t)dt(a,i,{get:t[i],enumerable:!0})},ue=(a,t,i,s)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of oe(t))!Wt.call(a,r)&&r!==i&&dt(a,r,{get:()=>t[r],enumerable:!(s=he(t,r))||s.enumerable});return a};var fe=a=>ue(dt({},"__esModule",{value:!0}),a);var Vt=(a,t,i)=>{if(!t.has(a))throw TypeError("Cannot "+i)};var e=(a,t,i)=>(Vt(a,t,"read from private field"),i?i.call(a):t.get(a)),h=(a,t,i)=>{if(t.has(a))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(a):t.set(a,i)},m=(a,t,i,s)=>(Vt(a,t,"write to private field"),s?s.call(a,i):t.set(a,i),i);var d=(a,t,i)=>(Vt(a,t,"access private method"),i);var Ce={};de(Ce,{default:()=>ye});var _=class{constructor(t){this.value=t}},S=class{constructor(t){this.value=t}};var Dt=a=>a<1<<8?1:a<1<<16?2:a<1<<24?3:a<b(2,32)?4:a<b(2,40)?5:6,$t=a=>{if(a<(1<<7)-1)return 1;if(a<(1<<14)-1)return 2;if(a<(1<<21)-1)return 3;if(a<(1<<28)-1)return 4;if(a<b(2,35)-1)return 5;if(a<b(2,42)-1)return 6;throw new Error("EBML VINT size not supported "+a)};var x,u,ut,Yt,ft,Zt,it,Ft,mt,Xt,I=class{constructor(){h(this,ut);h(this,ft);h(this,it);h(this,mt);this.pos=0;h(this,x,new Uint8Array(8));h(this,u,new DataView(e(this,x).buffer));this.offsets=new WeakMap;this.dataOffsets=new WeakMap}writeEBMLVarInt(t,i=$t(t)){let s=0;switch(i){case 1:e(this,u).setUint8(s++,1<<7|t);break;case 2:e(this,u).setUint8(s++,1<<6|t>>8),e(this,u).setUint8(s++,t);break;case 3:e(this,u).setUint8(s++,1<<5|t>>16),e(this,u).setUint8(s++,t>>8),e(this,u).setUint8(s++,t);break;case 4:e(this,u).setUint8(s++,1<<4|t>>24),e(this,u).setUint8(s++,t>>16),e(this,u).setUint8(s++,t>>8),e(this,u).setUint8(s++,t);break;case 5:e(this,u).setUint8(s++,1<<3|t/b(2,32)&7),e(this,u).setUint8(s++,t>>24),e(this,u).setUint8(s++,t>>16),e(this,u).setUint8(s++,t>>8),e(this,u).setUint8(s++,t);break;case 6:e(this,u).setUint8(s++,1<<2|t/b(2,40)&3),e(this,u).setUint8(s++,t/b(2,32)|0),e(this,u).setUint8(s++,t>>24),e(this,u).setUint8(s++,t>>16),e(this,u).setUint8(s++,t>>8),e(this,u).setUint8(s++,t);break;default:throw new Error("Bad EBML VINT size "+i)}this.write(e(this,x).subarray(0,s))}writeEBML(t){var i,s;if(t!==null)if(t instanceof Uint8Array)this.write(t);else if(Array.isArray(t))for(let r of t)this.writeEBML(r);else if(this.offsets.set(t,this.pos),d(this,it,Ft).call(this,t.id),Array.isArray(t.data)){let r=this.pos,n=(i=t.size)!=null?i:4;this.seek(this.pos+n);let l=this.pos;this.dataOffsets.set(t,l),this.writeEBML(t.data);let f=this.pos-l,J=this.pos;this.seek(r),this.writeEBMLVarInt(f,n),this.seek(J)}else if(typeof t.data=="number"){let r=(s=t.size)!=null?s:Dt(t.data);this.writeEBMLVarInt(r),d(this,it,Ft).call(this,t.data,r)}else typeof t.data=="string"?(this.writeEBMLVarInt(t.data.length),d(this,mt,Xt).call(this,t.data)):t.data instanceof Uint8Array?(this.writeEBMLVarInt(t.data.byteLength,t.size),this.write(t.data)):t.data instanceof _?(this.writeEBMLVarInt(4),d(this,ut,Yt).call(this,t.data.value)):t.data instanceof S&&(this.writeEBMLVarInt(8),d(this,ft,Zt).call(this,t.data.value))}};x=new WeakMap,u=new WeakMap,ut=new WeakSet,Yt=function(t){e(this,u).setFloat32(0,t,!1),this.write(e(this,x).subarray(0,4))},ft=new WeakSet,Zt=function(t){e(this,u).setFloat64(0,t,!1),this.write(e(this,x))},it=new WeakSet,Ft=function(t,i=Dt(t)){let s=0;switch(i){case 6:e(this,u).setUint8(s++,t/b(2,40)|0);case 5:e(this,u).setUint8(s++,t/b(2,32)|0);case 4:e(this,u).setUint8(s++,t>>24);case 3:e(this,u).setUint8(s++,t>>16);case 2:e(this,u).setUint8(s++,t>>8);case 1:e(this,u).setUint8(s++,t);break;default:throw new Error("Bad UINT size "+i)}this.write(e(this,x).subarray(0,s))},mt=new WeakSet,Xt=function(t){this.write(new Uint8Array(t.split("").map(i=>i.charCodeAt(0))))};var T,N,tt=class extends I{constructor(){super();h(this,T,new ArrayBuffer(b(2,16)));h(this,N,new Uint8Array(e(this,T)))}ensureSize(i){let s=e(this,T).byteLength;for(;s<i;)s*=2;if(s===e(this,T).byteLength)return;let r=new ArrayBuffer(s),n=new Uint8Array(r);n.set(e(this,N),0),m(this,T,r),m(this,N,n)}write(i){this.ensureSize(this.pos+i.byteLength),e(this,N).set(i,this.pos),this.pos+=i.byteLength}seek(i){this.pos=i}finalize(){return this.ensureSize(this.pos),e(this,T).slice(0,this.pos)}};T=new WeakMap,N=new WeakMap;var M=b(2,24),me=2,st,p,et=class extends I{constructor(i){super();h(this,st,void 0);h(this,p,[]);m(this,st,i)}write(i){this.writeDataIntoChunks(i,this.pos),this.flushChunks(),this.pos+=i.byteLength}writeDataIntoChunks(i,s){let r=e(this,p).findIndex(R=>R.start<=s&&s<R.start+M);r===-1&&(r=this.createChunk(s));let n=e(this,p)[r],l=s-n.start,f=i.subarray(0,Math.min(M-l,i.byteLength));n.data.set(f,l);let J={start:l,end:l+f.byteLength};if(ce(n,J),n.written[0].start===0&&n.written[0].end===M&&(n.shouldFlush=!0),e(this,p).length>me){for(let R=0;R<e(this,p).length-1;R++)e(this,p)[R].shouldFlush=!0;this.flushChunks()}f.byteLength<i.byteLength&&this.writeDataIntoChunks(i.subarray(f.byteLength),s+f.byteLength)}createChunk(i){let r={start:Math.floor(i/M)*M,data:new Uint8Array(M),written:[],shouldFlush:!1};return e(this,p).push(r),e(this,p).sort((n,l)=>n.start-l.start),e(this,p).indexOf(r)}flushChunks(i=!1){for(let s=0;s<e(this,p).length;s++){let r=e(this,p)[s];if(!(!r.shouldFlush&&!i)){for(let n of r.written)e(this,st).write({type:"write",data:r.data.subarray(n.start,n.end),position:r.start+n.start});e(this,p).splice(s--,1)}}}seek(i){this.pos=i}finalize(){this.flushChunks(!0)}};st=new WeakMap,p=new WeakMap;var ce=(a,t)=>{let i=0,s=a.written.length-1,r=-1;for(;i<=s;){let n=Math.floor(i+(s-i+1)/2);a.written[n].start<=t.start?(i=n+1,r=n):s=n-1}for(a.written.splice(r+1,0,t),(r===-1||a.written[r].end<t.start)&&r++;r<a.written.length-1&&a.written[r].end>=a.written[r+1].start;)a.written[r].end=Math.max(a.written[r].end,a.written[r+1].end),a.written.splice(r+1,1)},U,rt,O=class extends I{constructor(i){super();h(this,U,[]);h(this,rt,void 0);m(this,rt,i)}write(i){e(this,U).push({data:i.slice(),start:this.pos}),this.pos+=i.byteLength}seek(i){this.pos=i}flush(i){if(e(this,U).length===0)return;let s=[],r=[...e(this,U)].sort((n,l)=>n.start-l.start);s.push({start:r[0].start,size:r[0].data.byteLength});for(let n=1;n<r.length;n++){let l=s[s.length-1],f=r[n];f.start<=l.start+l.size?l.size=Math.max(l.size,f.start+f.data.byteLength-l.start):s.push({start:f.start,size:f.data.byteLength})}for(let n of s){n.data=new Uint8Array(n.size);for(let f of e(this,U))n.start<=f.start&&f.start<n.start+n.size&&n.data.set(f.data,f.start-n.start);let l=i&&n===s[s.length-1];e(this,rt).call(this,n.data,n.start,l)}e(this,U).length=0}};U=new WeakMap,rt=new WeakMap;var z=1,ct=2,be=1,pe=2,Pt=b(2,15),Et=b(2,12),qt="https://github.com/Vanilagy/webm-muxer",Bt=6,Gt=5,we=["strict","offset","permissive"],o,c,W,K,w,$,D,F,Y,Z,P,y,E,X,g,C,q,B,G,Q,j,at,pt,Qt,wt,jt,yt,Lt,gt,Jt,Ct,It,kt,te,xt,ee,Tt,ie,L,bt,A,H,Ut,se,At,re,nt,_t,St,ae,k,V,ht,Mt,zt,ne,ot,Nt,lt,Ot,Rt=class{constructor(t){h(this,pt);h(this,wt);h(this,yt);h(this,gt);h(this,Ct);h(this,kt);h(this,xt);h(this,Tt);h(this,L);h(this,A);h(this,Ut);h(this,At);h(this,nt);h(this,St);h(this,k);h(this,ht);h(this,zt);h(this,ot);h(this,lt);h(this,o,void 0);h(this,c,void 0);h(this,W,void 0);h(this,K,void 0);h(this,w,void 0);h(this,$,void 0);h(this,D,void 0);h(this,F,void 0);h(this,Y,void 0);h(this,Z,void 0);h(this,P,void 0);h(this,y,void 0);h(this,E,void 0);h(this,X,0);h(this,g,[]);h(this,C,[]);h(this,q,void 0);h(this,B,void 0);h(this,G,-1);h(this,Q,-1);h(this,j,void 0);h(this,at,!1);if(d(this,pt,Qt).call(this,t),m(this,c,Kt({type:"webm",firstTimestampBehavior:"strict"},t)),t.target==="buffer")m(this,o,new tt);else if(t.target instanceof FileSystemWritableFileStream)m(this,o,new et(t.target));else if(typeof t.target=="function")m(this,o,new O(t.target));else throw new Error(`Invalid target: ${t.target}`);d(this,wt,jt).call(this)}addVideoChunk(t,i,s){let r=new Uint8Array(t.byteLength);t.copyTo(r),this.addVideoChunkRaw(r,t.type,s!=null?s:t.timestamp,i)}addVideoChunkRaw(t,i,s,r){if(d(this,lt,Ot).call(this),!e(this,c).video)throw new Error("No video track declared.");e(this,q)===void 0&&m(this,q,s),r&&d(this,Ut,se).call(this,r);let n=d(this,nt,_t).call(this,t,i,s,z);for(e(this,c).video.codec==="V_VP9"&&d(this,At,re).call(this,n),m(this,G,n.timestamp);e(this,C).length>0&&e(this,C)[0].timestamp<=n.timestamp;){let l=e(this,C).shift();d(this,k,V).call(this,l)}!e(this,c).audio||n.timestamp<=e(this,Q)?d(this,k,V).call(this,n):e(this,g).push(n),d(this,L,bt).call(this)}addAudioChunk(t,i,s){let r=new Uint8Array(t.byteLength);t.copyTo(r),this.addAudioChunkRaw(r,t.type,s!=null?s:t.timestamp,i)}addAudioChunkRaw(t,i,s,r){if(d(this,lt,Ot).call(this),!e(this,c).audio)throw new Error("No audio track declared.");e(this,B)===void 0&&m(this,B,s);let n=d(this,nt,_t).call(this,t,i,s,ct);for(m(this,Q,n.timestamp);e(this,g).length>0&&e(this,g)[0].timestamp<=n.timestamp;){let l=e(this,g).shift();d(this,k,V).call(this,l)}!e(this,c).video||n.timestamp<=e(this,G)?d(this,k,V).call(this,n):e(this,C).push(n),r!=null&&r.decoderConfig&&d(this,ht,Mt).call(this,e(this,Z),r.decoderConfig.description),d(this,L,bt).call(this)}finalize(){for(;e(this,g).length>0;)d(this,k,V).call(this,e(this,g).shift());for(;e(this,C).length>0;)d(this,k,V).call(this,e(this,C).shift());d(this,ot,Nt).call(this),e(this,o).writeEBML(e(this,P));let t=e(this,o).pos,i=e(this,o).pos-e(this,A,H);return e(this,o).seek(e(this,o).offsets.get(e(this,W))+4),e(this,o).writeEBMLVarInt(i,Bt),e(this,D).data=new S(e(this,X)),e(this,o).seek(e(this,o).offsets.get(e(this,D))),e(this,o).writeEBML(e(this,D)),e(this,w).data[0].data[1].data=e(this,o).offsets.get(e(this,P))-e(this,A,H),e(this,w).data[1].data[1].data=e(this,o).offsets.get(e(this,K))-e(this,A,H),e(this,w).data[2].data[1].data=e(this,o).offsets.get(e(this,$))-e(this,A,H),e(this,o).seek(e(this,o).offsets.get(e(this,w))),e(this,o).writeEBML(e(this,w)),e(this,o).seek(t),m(this,at,!0),e(this,o)instanceof tt?e(this,o).finalize():(e(this,o)instanceof et?e(this,o).finalize():e(this,o)instanceof O&&e(this,o).flush(!0),null)}};o=new WeakMap,c=new WeakMap,W=new WeakMap,K=new WeakMap,w=new WeakMap,$=new WeakMap,D=new WeakMap,F=new WeakMap,Y=new WeakMap,Z=new WeakMap,P=new WeakMap,y=new WeakMap,E=new WeakMap,X=new WeakMap,g=new WeakMap,C=new WeakMap,q=new WeakMap,B=new WeakMap,G=new WeakMap,Q=new WeakMap,j=new WeakMap,at=new WeakMap,pt=new WeakSet,Qt=function(t){if(t.type&&t.type!=="webm"&&t.type!=="matroska")throw new Error(`Invalid type: ${t.type}`);if(t.firstTimestampBehavior&&!we.includes(t.firstTimestampBehavior))throw new Error(`Invalid first timestamp behavior: ${t.firstTimestampBehavior}`)},wt=new WeakSet,jt=function(){d(this,yt,Lt).call(this),d(this,gt,Jt).call(this),d(this,Ct,It).call(this),d(this,kt,te).call(this),d(this,xt,ee).call(this),d(this,Tt,ie).call(this),d(this,L,bt).call(this)},yt=new WeakSet,Lt=function(){var i;let t={id:440786851,data:[{id:17030,data:1},{id:17143,data:1},{id:17138,data:4},{id:17139,data:8},{id:17026,data:(i=e(this,c).type)!=null?i:"webm"},{id:17031,data:2},{id:17029,data:2}]};e(this,o).writeEBML(t)},gt=new WeakSet,Jt=function(){let t=new Uint8Array([28,83,187,107]),i=new Uint8Array([21,73,169,102]),s=new Uint8Array([22,84,174,107]),r={id:290298740,data:[{id:19899,data:[{id:21419,data:t},{id:21420,size:5,data:0}]},{id:19899,data:[{id:21419,data:i},{id:21420,size:5,data:0}]},{id:19899,data:[{id:21419,data:s},{id:21420,size:5,data:0}]}]};m(this,w,r)},Ct=new WeakSet,It=function(){let t={id:17545,data:new S(0)};m(this,D,t);let i={id:357149030,data:[{id:2807729,data:1e6},{id:19840,data:qt},{id:22337,data:qt},t]};m(this,K,i)},kt=new WeakSet,te=function(){let t={id:374648427,data:[]};if(m(this,$,t),e(this,c).video){m(this,Y,{id:236,size:4,data:new Uint8Array(Et)});let i={id:21936,data:[{id:21937,data:2},{id:21946,data:2},{id:21947,data:2},{id:21945,data:0}]};m(this,F,i),t.data.push({id:174,data:[{id:215,data:z},{id:29637,data:z},{id:131,data:be},{id:134,data:e(this,c).video.codec},e(this,Y),e(this,c).video.frameRate?{id:2352003,data:1e9/e(this,c).video.frameRate}:null,{id:224,data:[{id:176,data:e(this,c).video.width},{id:186,data:e(this,c).video.height},e(this,c).video.alpha?{id:21440,data:1}:null,i]}]})}e(this,c).audio&&(m(this,Z,{id:236,size:4,data:new Uint8Array(Et)}),t.data.push({id:174,data:[{id:215,data:ct},{id:29637,data:ct},{id:131,data:pe},{id:134,data:e(this,c).audio.codec},e(this,Z),{id:225,data:[{id:181,data:new _(e(this,c).audio.sampleRate)},{id:159,data:e(this,c).audio.numberOfChannels},e(this,c).audio.bitDepth?{id:25188,data:e(this,c).audio.bitDepth}:null]}]}))},xt=new WeakSet,ee=function(){let t={id:408125543,size:Bt,data:[e(this,w),e(this,K),e(this,$)]};m(this,W,t),e(this,o).writeEBML(t)},Tt=new WeakSet,ie=function(){m(this,P,{id:475249515,data:[]})},L=new WeakSet,bt=function(){e(this,o)instanceof O&&e(this,o).flush(!1)},A=new WeakSet,H=function(){return e(this,o).dataOffsets.get(e(this,W))},Ut=new WeakSet,se=function(t){if(t.decoderConfig){if(t.decoderConfig.colorSpace){let i=t.decoderConfig.colorSpace;m(this,j,i),e(this,F).data=[{id:21937,data:{rgb:1,bt709:1,bt470bg:5,smpte170m:6}[i.matrix]},{id:21946,data:{bt709:1,smpte170m:6,"iec61966-2-1":13}[i.transfer]},{id:21947,data:{bt709:1,bt470bg:5,smpte170m:6}[i.primaries]},{id:21945,data:[1,2][Number(i.fullRange)]}];let s=e(this,o).pos;e(this,o).seek(e(this,o).offsets.get(e(this,F))),e(this,o).writeEBML(e(this,F)),e(this,o).seek(s)}t.decoderConfig.description&&d(this,ht,Mt).call(this,e(this,Y),t.decoderConfig.description)}},At=new WeakSet,re=function(t){if(t.type!=="key"||!e(this,j))return;let i=0;if(v(t.data,0,2)!==2)return;i+=2;let s=(v(t.data,i+1,i+2)<<1)+v(t.data,i+0,i+1);i+=2,s===3&&i++;let r=v(t.data,i+0,i+1);if(i++,r)return;let n=v(t.data,i+0,i+1);if(i++,n!==0)return;i+=2;let l=v(t.data,i+0,i+24);if(i+=24,l!==4817730)return;s>=2&&i++;let f={rgb:7,bt709:2,bt470bg:1,smpte170m:3}[e(this,j).matrix];ge(t.data,i+0,i+3,f)},nt=new WeakSet,_t=function(t,i,s,r){let n=d(this,St,ae).call(this,s,r);return{data:t,type:i,timestamp:n,trackNumber:r}},St=new WeakSet,ae=function(t,i){let s=i===z?e(this,q):e(this,B),r=i===z?e(this,G):e(this,Q);if(e(this,c).firstTimestampBehavior==="strict"&&r===-1&&t!==0)throw new Error(`The first chunk for your media track must have a timestamp of 0 (received ${t}). Non-zero first timestamps are often caused by directly piping frames or audio data from a MediaStreamTrack into the encoder. Their timestamps are typically relative to the age of the document, which is probably what you want. If you want to offset all timestamps of a track such that the first one is zero, set firstTimestampBehavior: 'offset' in the options. If you want to allow non-zero first timestamps, set firstTimestampBehavior: 'permissive'.`);if(e(this,c).firstTimestampBehavior==="offset"&&(t-=s),t<r)throw new Error(`Timestamps must be monotonically increasing (went from ${r} to ${t}).`);return t},k=new WeakSet,V=function(t){let i=Math.floor(t.timestamp/1e3);if(t.type!=="key"&&i-e(this,E)>=Pt)throw new Error(`Current Matroska cluster exceeded its maximum allowed length of ${Pt} milliseconds. In order to produce a correct WebM file, you must pass in a video key frame at least every ${Pt} milliseconds.`);let r=(t.trackNumber===z||!e(this,c).video)&&t.type==="key"&&i-e(this,E)>=1e3;(!e(this,y)||r)&&d(this,zt,ne).call(this,i);let n=new Uint8Array(4),l=new DataView(n.buffer);l.setUint8(0,128|t.trackNumber),l.setUint16(1,i-e(this,E),!1),l.setUint8(3,Number(t.type==="key")<<7);let f={id:163,data:[n,t.data]};e(this,o).writeEBML(f),m(this,X,Math.max(e(this,X),i))},ht=new WeakSet,Mt=function(t,i){let s=e(this,o).pos;e(this,o).seek(e(this,o).offsets.get(t)),t=[{id:25506,size:4,data:new Uint8Array(i)},{id:236,size:4,data:new Uint8Array(Et-2-4-i.byteLength)}],e(this,o).writeEBML(t),e(this,o).seek(s)},zt=new WeakSet,ne=function(t){e(this,y)&&d(this,ot,Nt).call(this),m(this,y,{id:524531317,size:Gt,data:[{id:231,data:t}]}),e(this,o).writeEBML(e(this,y)),m(this,E,t);let i=e(this,o).offsets.get(e(this,y))-e(this,A,H);e(this,P).data.push({id:187,data:[{id:179,data:t},e(this,c).video?{id:183,data:[{id:247,data:z},{id:241,data:i}]}:null,e(this,c).audio?{id:183,data:[{id:247,data:ct},{id:241,data:i}]}:null]})},ot=new WeakSet,Nt=function(){let t=e(this,o).pos-e(this,o).dataOffsets.get(e(this,y)),i=e(this,o).pos;e(this,o).seek(e(this,o).offsets.get(e(this,y))+4),e(this,o).writeEBMLVarInt(t,Gt),e(this,o).seek(i)},lt=new WeakSet,Ot=function(){if(e(this,at))throw new Error("Cannot add new video or audio chunks after the file has been finalized.")};var ye=Rt,v=(a,t,i)=>{let s=0;for(let r=t;r<i;r++){let n=Math.floor(r/8),l=a[n],f=7-(r&7),J=(l&1<<f)>>f;s<<=1,s|=J}return s},ge=(a,t,i,s)=>{for(let r=t;r<i;r++){let n=Math.floor(r/8),l=a[n],f=7-(r&7);l&=~(1<<f),l|=(s&1<<i-r-1)>>i-r-1<<f,a[n]=l}};return fe(Ce);})();
WebMMuxer = WebMMuxer.default;

let recLength = 0;
let recBuffersL = [];
let recBuffersR = [];
let sampleRate;

function init(config) {
  sampleRate = config.sampleRate;
}

function record(inputBuffer) {
  recBuffersL.push(inputBuffer[0]);
  recBuffersR.push(inputBuffer[1]);
  recLength += inputBuffer[0].length;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i += 1) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function floatTo16BitPCM(output, offset, input) {
  let writeOffset = offset;
  for (let i = 0; i < input.length; i += 1, writeOffset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(writeOffset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

function encodeWAV(samples, mono = false) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, "RIFF");
  /* file length */
  view.setUint32(4, 32 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, "WAVE");
  /* format chunk identifier */
  writeString(view, 12, "fmt ");
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, mono ? 1 : 2, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 4, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, "data");
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return view;
}

function mergeBuffers(recBuffers, length) {
  const result = new Float32Array(length);
  let offset = 0;

  for (let i = 0; i < recBuffers.length; i += 1) {
    result.set(recBuffers[i], offset);
    offset += recBuffers[i].length;
  }
  return result;
}

function interleave(inputL, inputR) {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);

  let index = 0;
  let inputIndex = 0;

  while (index < length) {
    result[(index += 1)] = inputL[inputIndex];
    result[(index += 1)] = inputR[inputIndex];
    inputIndex += 1;
  }

  return result;
}

function exportWAV(type) {
  const bufferL = mergeBuffers(recBuffersL, recLength);
  const bufferR = mergeBuffers(recBuffersR, recLength);
  const interleaved = interleave(bufferL, bufferR);
  const dataview = encodeWAV(interleaved);
  const audioBlob = new Blob([dataview], { type });

  postMessage(audioBlob);
}

async function exportOpus(type) {
    // TODO: support mono
    console.log("OPUS encoding ENTER");

    const channels = 2;
    let total_encoded_size = 0;
    let muxer = null;

	muxer = new WebMMuxer({
		target: 'buffer',
		audio: {
			codec: 'A_OPUS',
			sampleRate: sampleRate,
			numberOfChannels: channels
		}
	});

    const encoder = new AudioEncoder({
        error(e) {
            console.log(e);
        },
        output(chunk, meta) {
            total_encoded_size += chunk.byteLength;
            muxer.addAudioChunk(chunk, meta);
        },
    });

    const config = {
        numberOfChannels: channels,
        sampleRate: sampleRate,
        codec: "opus",
        bitrate: 64000,
        opus: { complexity: 9}
    };

    encoder.configure(config);

    const bufferL = mergeBuffers(recBuffersL, recLength);
    const bufferR = mergeBuffers(recBuffersR, recLength);

    const bufferL3 = new ArrayBuffer(recLength * 2);
    const bufferR3 = new ArrayBuffer(recLength * 2);

    const samplesL = new DataView(bufferL3);
    const samplesR = new DataView(bufferR3);

    floatTo16BitPCM(samplesL, 0, bufferL);
    floatTo16BitPCM(samplesR, 0, bufferR);

    const Mp3L = new Int16Array(bufferL3, 0, recLength);
    const Mp3R = new Int16Array(bufferR3, 0, recLength);

    var remaining = recLength;

    const samplesPerFrame = 1024;
    let base_time = 0;

    for (let i = 0; remaining >= samplesPerFrame; i += samplesPerFrame) {
        var left = Mp3L.subarray(i, i + samplesPerFrame);
        var right = Mp3R.subarray(i, i + samplesPerFrame);
        let planar_data = new Int16Array(samplesPerFrame * channels);

        planar_data.set(left, 0);
        planar_data.set(right, samplesPerFrame);

        base_time = (i * samplesPerFrame) / sampleRate;

        let audio_data = new AudioData({
            timestamp: 1000000 * base_time,
            data: planar_data,
            numberOfChannels: channels,
            numberOfFrames: samplesPerFrame,
            sampleRate: sampleRate,
            format: "s16-planar",
        });
        encoder.encode(audio_data);

        remaining -= samplesPerFrame;
    }

    if (remaining >= 0) {
        var left = Mp3L.subarray(recLength - remaining, recLength);
        var right = Mp3R.subarray(recLength - remaining, recLength);
        let planar_data = new Int16Array(remaining * channels);

        planar_data.set(left, 0);
        planar_data.set(right, remaining);

        base_time += samplesPerFrame;

        let audio_data = new AudioData({
            timestamp: 1000000 * base_time,
            data: planar_data,
            numberOfChannels: channels,
            numberOfFrames: remaining,
            sampleRate: sampleRate,
            format: "s16-planar",
        });
        encoder.encode(audio_data);
	    remaining = 0;
    }

    await encoder.flush();
    let buffer = muxer.finalize();

    console.log("OPUS encoding done.");

    const audioBlob = new Blob([buffer], { type });
    postMessage(audioBlob);
}

async function exportAAC(type) {
    // TODO: support mono
    console.log("AAC encoding ENTER");

    const channels = 2;
    var buffer = [];
    let total_encoded_size = 0;

    const encoder = new AudioEncoder({
        error(e) {
            console.log(e);
        },
        output(chunk, meta) {
            total_encoded_size += chunk.byteLength;
            var frameData = new Uint8Array(chunk.byteLength);
            chunk.copyTo(frameData);
            buffer.push(frameData);
        },
    });

    const config = {
        numberOfChannels: channels,
        sampleRate: sampleRate,
        codec: "mp4a.40.2",
        aac: { format: 'adts' },
        bitrate: 96000
    };

    encoder.configure(config);

    const bufferL = mergeBuffers(recBuffersL, recLength);
    const bufferR = mergeBuffers(recBuffersR, recLength);

    const bufferL3 = new ArrayBuffer(recLength * 2);
    const bufferR3 = new ArrayBuffer(recLength * 2);

    const samplesL = new DataView(bufferL3);
    const samplesR = new DataView(bufferR3);

    floatTo16BitPCM(samplesL, 0, bufferL);
    floatTo16BitPCM(samplesR, 0, bufferR);

    const Mp3L = new Int16Array(bufferL3, 0, recLength);
    const Mp3R = new Int16Array(bufferR3, 0, recLength);

    var remaining = recLength;

    const samplesPerFrame = 1024;
    let base_time = 0;

    for (let i = 0; remaining >= samplesPerFrame; i += samplesPerFrame) {
        var left = Mp3L.subarray(i, i + samplesPerFrame);
        var right = Mp3R.subarray(i, i + samplesPerFrame);
        let planar_data = new Int16Array(samplesPerFrame * channels);

        planar_data.set(left, 0);
        planar_data.set(right, samplesPerFrame);

        base_time = (i * samplesPerFrame) / sampleRate;

        let audio_data = new AudioData({
            timestamp: 1000000 * base_time,
            data: planar_data,
            numberOfChannels: channels,
            numberOfFrames: samplesPerFrame,
            sampleRate: sampleRate,
            format: "s16-planar",
        });
        encoder.encode(audio_data);

        remaining -= samplesPerFrame;
    }

    if (remaining >= 0) {
        var left = Mp3L.subarray(recLength - remaining, recLength);
        var right = Mp3R.subarray(recLength - remaining, recLength);
        let planar_data = new Int16Array(remaining * channels);

        planar_data.set(left, 0);
        planar_data.set(right, remaining);

        base_time += samplesPerFrame;

        let audio_data = new AudioData({
            timestamp: 1000000 * base_time,
            data: planar_data,
            numberOfChannels: channels,
            numberOfFrames: remaining,
            sampleRate: sampleRate,
            format: "s16-planar",
        });
        encoder.encode(audio_data);
	    remaining = 0;
    }

    await encoder.flush();

    console.log("AAC encoding done.");

    const audioBlob = new Blob(buffer, { type });
    postMessage(audioBlob);

}


function exportMP3(type) {
  var buffer = [];
  const bufferL = mergeBuffers(recBuffersL, recLength);
  const bufferR = mergeBuffers(recBuffersR, recLength);

    // TODO: support mono output... but not even wave does supports it...
  const bufferL3 = new ArrayBuffer(recLength * 2);
  const bufferR3 = new ArrayBuffer(recLength * 2);

  const samplesL = new DataView(bufferL3);
  const samplesR = new DataView(bufferR3);

  floatTo16BitPCM(samplesL, 0, bufferL);
  floatTo16BitPCM(samplesR, 0, bufferR);

  const Mp3L = new Int16Array(bufferL3, 0, recLength);
  const Mp3R = new Int16Array(bufferR3, 0, recLength);

  const channels = 2;

  var mp3enc = new lamejs.Mp3Encoder(channels, sampleRate, 112);
  var remaining = recLength;

  const samplesPerFrame = 1152;

  for (let i = 0; remaining >= samplesPerFrame; i += samplesPerFrame) {
    var left = Mp3L.subarray(i, i + samplesPerFrame);
    var right = Mp3R.subarray(i, i + samplesPerFrame);
    var mp3buf = mp3enc.encodeBuffer(left, right);
    if (mp3buf.length > 0) {
        // console.log("remaining time:", Math.round(remaining / sampleRate),"s");
        buffer.push(new Int8Array(mp3buf));
    }
    remaining -= samplesPerFrame;
  }

  if (remaining >= 0) {
    var left = Mp3L.subarray(recLength - remaining, recLength);
    var right = Mp3R.subarray(recLength - remaining, recLength);

    var mp3buf = mp3enc.encodeBuffer(left, right);
    if (mp3buf.length > 0) {
        // console.log("remaining time:", Math.round(remaining / sampleRate),"s");
        buffer.push(new Int8Array(mp3buf));
    }
	remaining = 0;
  }

  var mp3buf = mp3enc.flush();
  if (mp3buf.length > 0) {
    buffer.push(new Int8Array(mp3buf));
  }

  console.log("MP3 encoding done.");

  const audioBlob = new Blob(buffer, { type });
  postMessage(audioBlob);
}

function clear() {
  recLength = 0;
  recBuffersL = [];
  recBuffersR = [];
}

/* exportOpus not supported yet... 44.1kHz not supported by Opus */
onmessage = function onmessage(e) {
  if (e.data.command) {
    switch (e.data.command) {
      case "init": {
        init(e.data.config);
        break;
      }
      case "record": {
        record(e.data.buffer);
        break;
      }
      case "exportWAV": {
        exportWAV(e.data.type);
        break;
      }
      case "exportMP3": {
        exportMP3(e.data.type);
        break;
      }
      case "exportOpus": {
        exportOpus(e.data.type);
        break;
      }
      case "exportAAC": {
        exportAAC(e.data.type);
        break;
      }
      case "clear": {
        clear();
        break;
      }
      default: {
        throw new Error("Unknown export worker command");
      }
    }
  }
};
