(()=>{var rx=Object.defineProperty;var et=(e,t)=>{for(var a in t)rx(e,a,{get:t[a],enumerable:!0})};var cw={};et(cw,{SingleFile:()=>ed,getPageData:()=>sW,helper:()=>jc,init:()=>ox,modules:()=>Fu,processors:()=>Ap,vendor:()=>vu});var Ap={};et(Ap,{compression:()=>oi,frameTree:()=>is,hooksFrames:()=>Pr,lazy:()=>Ao});var oi={};et(oi,{DEFAULT_MAX_APPENDED_DATA_LENGTH:()=>Im,DEFAULT_ZIP_WORKER_URI:()=>nv,PROCESS_OPTION_NAMES:()=>mj,configureZipWorker:()=>rv,createArchive:()=>sv,escapeHTML:()=>sc,process:()=>pj});var _m={};et(_m,{BlobReader:()=>Oa,BlobWriter:()=>Al,Data64URIReader:()=>qd,Data64URIWriter:()=>Yd,ERR_ABORTED:()=>Xb,ERR_AMBIGUOUS_ARCHIVE:()=>em,ERR_BAD_FORMAT:()=>Qn,ERR_CENTRAL_DIRECTORY_NOT_FOUND:()=>$h,ERR_CODEC_OUT_OF_MEMORY:()=>Xl,ERR_DUPLICATED_NAME:()=>vm,ERR_ENCRYPTED:()=>Jh,ERR_ENCRYPTED_CENTRAL_DIRECTORY:()=>tm,ERR_ENTRY_DATA_OUT_OF_BOUNDS:()=>Qh,ERR_EOCDR_LOCATOR_ZIP64_NOT_FOUND:()=>Il,ERR_EOCDR_NOT_FOUND:()=>Zh,ERR_EXTRAFIELD_ZIP64_NOT_FOUND:()=>uo,ERR_HTTP_RANGE:()=>Ia,ERR_HTTP_RESOURCE_CHANGED:()=>Vd,ERR_HTTP_STATUS:()=>Fh,ERR_INVALID_AUTHENTICATION_CODE:()=>_h,ERR_INVALID_BASE_URI:()=>ay,ERR_INVALID_CODEC_DEFINITION:()=>Nd,ERR_INVALID_CODEC_MODULE:()=>Iy,ERR_INVALID_COMMENT:()=>Sm,ERR_INVALID_COMMENT_TYPE:()=>eE,ERR_INVALID_COMPRESSED_DATA:()=>jh,ERR_INVALID_CRC32:()=>Zl,ERR_INVALID_DATE:()=>nE,ERR_INVALID_ENCRYPTION_STRENGTH:()=>iE,ERR_INVALID_ENTRY:()=>xE,ERR_INVALID_ENTRY_COMMENT:()=>tE,ERR_INVALID_ENTRY_COMMENT_TYPE:()=>aE,ERR_INVALID_ENTRY_NAME:()=>oE,ERR_INVALID_EXTRAFIELD:()=>cE,ERR_INVALID_EXTRAFIELD_DATA:()=>ac,ERR_INVALID_EXTRAFIELD_DATA_TYPE:()=>dE,ERR_INVALID_EXTRAFIELD_TYPE:()=>uE,ERR_INVALID_FILENAME_VALIDATION:()=>om,ERR_INVALID_FUNCTION_OPTION:()=>Wb,ERR_INVALID_GID:()=>EE,ERR_INVALID_LEVEL:()=>RE,ERR_INVALID_MAX_APPENDED_DATA_SIZE:()=>im,ERR_INVALID_MAX_WORKERS:()=>ty,ERR_INVALID_MSDOS_ATTRIBUTES:()=>TE,ERR_INVALID_MSDOS_DATA:()=>CE,ERR_INVALID_PASSWORD:()=>Kl,ERR_INVALID_PASSWORD_TYPE:()=>qb,ERR_INVALID_PASS_THROUGH_VALUE:()=>Yb,ERR_INVALID_READER:()=>bE,ERR_INVALID_READER_OPTIONS:()=>Kb,ERR_INVALID_SIGNAL:()=>Vb,ERR_INVALID_SIGNATURE_DATA:()=>_E,ERR_INVALID_STRICTNESS:()=>nm,ERR_INVALID_UID:()=>kE,ERR_INVALID_UNCOMPRESSED_SIZE:()=>Zo,ERR_INVALID_UNIX_EXTRA_FIELD_TYPE:()=>SE,ERR_INVALID_UNIX_ID_SIZE:()=>AE,ERR_INVALID_UNIX_MODE:()=>vE,ERR_INVALID_URI:()=>ny,ERR_INVALID_VERSION:()=>Am,ERR_ITERATOR_COMPLETED_TOO_SOON:()=>ak,ERR_LOCAL_FILE_HEADER_NOT_FOUND:()=>Vl,ERR_OVERLAPPING_ENTRY:()=>ql,ERR_RESERVED_COMPRESSION_METHOD:()=>Ly,ERR_SPLIT_ZIP_FILE:()=>Nl,ERR_UNDEFINED_COMPRESSION_METHOD:()=>gE,ERR_UNDEFINED_CRC32:()=>fE,ERR_UNDEFINED_READER:()=>wE,ERR_UNDEFINED_UNCOMPRESSED_SIZE:()=>pE,ERR_UNDETERMINED_SIZE:()=>FL,ERR_UNSAFE_FILENAME:()=>am,ERR_UNSUPPORTED_COMPRESSION:()=>Xo,ERR_UNSUPPORTED_CONTEXT:()=>zE,ERR_UNSUPPORTED_CRYPTO_API:()=>by,ERR_UNSUPPORTED_ENCRYPTION:()=>jl,ERR_UNSUPPORTED_ENCRYPTION_PASS_THROUGH:()=>lE,ERR_UNSUPPORTED_ENCRYPTION_USDZ:()=>rE,ERR_UNSUPPORTED_FORMAT:()=>nc,ERR_UNSUPPORTED_SPLIT_USDZ:()=>sE,ERR_UNSUPPORTED_UINT64:()=>rm,ERR_WORKER_STARTUP_TIMEOUT:()=>$l,ERR_WRITER_NOT_INITIALIZED:()=>nk,ERR_WRITER_SIZE_NOT_WRITABLE:()=>ok,ERR_ZIP_CRYPTO_LAST_MOD_DATE:()=>LE,ERR_ZIP_NOT_EMPTY:()=>yE,HttpRangeReader:()=>Qd,HttpReader:()=>Cl,Reader:()=>ya,SplitDataReader:()=>Rl,SplitDataWriter:()=>_l,TextReader:()=>kr,TextWriter:()=>Xd,Uint8ArrayReader:()=>Er,Uint8ArrayWriter:()=>Jo,VERSION:()=>AI,WARNING_APPENDED_DATA:()=>Dl,WARNING_CLAMPED_LAST_MODIFICATION_DATE:()=>jE,WARNING_COMPRESSED_PATCHED_DATA:()=>cm,WARNING_COMPRESSION_UNAVAILABLE:()=>IE,WARNING_DUPLICATE_FILENAME:()=>gm,WARNING_MALFORMED_EXTRA_FIELD:()=>ec,WARNING_MISMATCHED_CENTRAL_DIRECTORY_OFFSET:()=>mm,WARNING_MISMATCHED_LOCAL_FILE_HEADER_BIT_FLAG:()=>bm,WARNING_MISMATCHED_LOCAL_FILE_HEADER_COMPRESSION_METHOD:()=>ym,WARNING_MISMATCHED_LOCAL_FILE_HEADER_CRC32_OR_SIZES:()=>tc,WARNING_MISMATCHED_LOCAL_FILE_HEADER_FILENAME:()=>wm,WARNING_MISMATCHED_ZIP64_END_OF_CENTRAL_DIRECTORY:()=>Po,WARNING_MISSING_ZIP64_EXTRA_FIELD:()=>pm,WARNING_MULTIPLE_END_OF_CENTRAL_DIRECTORY:()=>fm,WARNING_PREPENDED_CENTRAL_DIRECTORY:()=>dm,WARNING_PREPENDED_DATA:()=>Ml,WARNING_TRAILING_CENTRAL_DIRECTORY_DATA:()=>hm,WARNING_UNKNOWN_VERSION:()=>lm,WARNING_UNKNOWN_ZIP64_EXTENSIBLE_DATA:()=>um,WARNING_UNSORTED_CENTRAL_DIRECTORY:()=>sm,WARNING_WRAPPED_ENTRIES_COUNT:()=>Ol,Writer:()=>yr,ZipReader:()=>Sr,ZipReaderStream:()=>Fl,ZipWriter:()=>co,ZipWriterStream:()=>oh,configure:()=>Rh,createBlobTempStream:()=>LI,createOPFSTempStream:()=>RI,createSyncAccessHandleTempStream:()=>OI,deflateRaw:()=>Rm,getMimeType:()=>vI,getRegisteredCodecs:()=>Ny,getSupportedCompressionMethods:()=>SI,inflateRaw:()=>qI,initStream:()=>St,isZipFile:()=>Wk,readUint8Array:()=>We,registerCodec:()=>G2,resetConfiguration:()=>o2,terminateWorkers:()=>f1,unregisterCodec:()=>W2});var XI={},{Array:Dt,Object:q,String:dw,Number:nt,BigInt:vt,Math:ae,Date:ta,Map:wa,Set:cn,Response:sx,URL:il,Error:N,Uint8Array:X,Uint16Array:lx,Uint32Array:cx,DataView:pa,Blob:qo,Promise:Fe,TextEncoder:hw,TextDecoder:rl,crypto:ga,btoa:mw,TransformStream:Xe,ReadableStream:Ot,WritableStream:ba,CompressionStream:pw,DecompressionStream:gw,navigator:or,Worker:Js,setTimeout:hh,clearTimeout:mh}=typeof globalThis<"u"?globalThis:self,Re=4294967295,le=65535,Wt=255,ei=8,dr=9,un=0,xr=99,hr=67324752,Lr=134695760,ux=808471376,kb=Lr,dx=134630224,ph=84233040,sn=33639248,Eb=101010256,ir=101075792,gh=117853008,dn=46,Yt=22,Rn=20,Bt=56,fw=Yt+Rn+Bt,vb=12,fh=20,mr=4,Ln=4,ti=1,wh=39169,bh=10,Sb=1,Wl=21589,Ab=28789,Tb=25461,yh=6534,kh=30837,sl=30805,Cb=22613,Rb=13,ll=1,hx=6,mx=2,px=4,gx=6,cl=8,ww=32,bd=64,ul=2048,dl=8192,hl=16,yd=1,kd=2,Ed=4,vd=32,Uo=61440,rr=16384,_b=40960,fx=32768,sr=73,Qs=420,Sd=2048,Ad=1024,Td=512,wx=10,bx=20,ml=45,bw=51,yx=20,yw=768,Bo="/",Gt=30,kx=0,pr=10,Ir=14,jr=18,Ex=22,vx=24,eo=4,pl=new ta(2107,11,31,23,59,58),Yo=new ta(1980,0,1),C=void 0,Oo=1/0,Vl="Local file header not found",ql="Overlapping entry found",uo="Zip64 extra field not found",hn="undefined",st="function",Eh="object",Nn="string",Sx="number",xb="boolean",Ce=new X,Lb=Symbol.asyncDispose||Symbol(),Ax="filenameEncoding",Tx="commentEncoding",Cx="decodeText",Rx="extractPrependedData",_x="extractAppendedData",Ib="password",jb="rawPassword",vh="passThrough",Nb="signal",xx="checkPasswordOnly",Lx="checkOverlappingEntryOnly",Ix="checkOverlappingEntry",Ob="checkAmbiguity",jx="checkLocalDirectory",Nx="checkLocalFilename",Ox="checkSignature",Dx="checkCrc32",Mx="checkAuthenticationCode",Db="useWebWorkers",Mb="useCompressionStream",Pb="preventClose",Px="encryptionStrength",Fx="extendedTimestamp",zx="ntfsTimestamp",Ux="keepOrder",Cd="level",Bx="bufferedWrite",Hx="createTempStream",Gx="dataDescriptorSignature",Fb="useUnicodeFileNames",zb="dataDescriptor",Wx="supportZip64SplitFile",Vx="encodeText",Ks="offset",Ko="usdz",qx="unixExtraFieldType",Yx="localExtraField",Kx="centralExtraField",Ub="strictness",Xx="filenameValidation",Zx="normalizeFilename",Bb="maxAppendedDataSize",$x="decryptCentralDirectory",Jx="signCentralDirectory",kw="entry",Hb="filename",Gb="comment",ho="strict",Sh="balanced",On="tolerant",Rd="compressed",Wb="Invalid option (must be a function)",Vb="Invalid signal (must be an AbortSignal instance)",qb="Invalid password (password must be a string, rawPassword must be a Uint8Array)",Yb="Invalid passThrough option (must be a boolean or 'compressed')",Kb="Invalid readerOptions (must be an object)",Xb="The operation was aborted",Qx="AbortError";function Yl(e){if(e&&typeof e!=st)throw new N(Wb);return e}function e2(e){if(e&&(typeof e!=Eh||Dt.isArray(e)))throw new N(Kb);return e}function Zb(e){if(e&&(typeof e.addEventListener!=st||typeof e.aborted!=xb))throw new N(Vb);return e||C}function gl(e){if(e&&e.aborted)throw e.reason===C?new DOMException(Xb,Qx):e.reason}function $b(e,t){if(e&&typeof e!=Nn||t&&!(t instanceof X))throw new N(qb)}function Ah(e){if(e!==C&&typeof e!=xb&&e!==Rd)throw new N(Yb);return e}function Jb(e,t,a){if(!nt.isInteger(e)||e<0||e>t)throw new N(a)}function nr(e,t,a){e!==C&&Jb(e,t,a)}function Nr(e){return typeof e==Nn&&e.trim()?nt(e):e}var Qb=256*1024,t2=64,ey=1,ty="Invalid maxWorkers (must be an integer greater than 0)",ay="Invalid baseURI (must be a string)",ny="Invalid URI (must be a string or a function returning a string)",oy=2;try{typeof or!=hn&&or.hardwareConcurrency&&(oy=or.hardwareConcurrency)}catch{}var Th={workerURI:"./core/web-worker-wasm.js",wasmURI:"./core/streams/zlib-wasm/zlib-streams.wasm",chunkSize:Qb,maxWorkers:oy,terminateWorkerTimeout:5e3,workerStarvationTimeout:5e3,workerStartupTimeout:5e3,useWebWorkers:!0,useCompressionStream:!0,CompressionStream:typeof pw!=hn&&pw,DecompressionStream:typeof gw!=hn&&gw},iy="maxWorkers",ry="baseURI",sy=["wasmURI","workerURI"],a2=["useCompressionStream","useWebWorkers"],ly=["chunkSize",iy,"terminateWorkerTimeout","workerStarvationTimeout","workerStartupTimeout"],cy=["createWorker","CompressionStream","DecompressionStream","CompressionStreamFallback","DecompressionStreamFallback"],uy=[ry,...sy,...a2,...ly,...cy],gr={...Th};function mo(){return gr}function Ch(e){return dy(e.chunkSize)}function dy(e){return e=Nr(e),nt.isInteger(e)&&e>=ey?ae.max(e,t2):Qb}function Rh(e){q.assign(gr,hy(my(e)))}function hy(e){let t={};for(let a of uy){let n=e[a];n!==C&&(t[a]=n2(a,n))}return t}function n2(e,t){if(ly.includes(e)){if(t=Nr(t),e==iy&&(!nt.isInteger(t)||t<ey))throw new N(ty)}else if(cy.includes(e))Yl(t);else if(e==ry){if(t&&typeof t!=Nn)throw new N(ay)}else if(sy.includes(e)&&t&&typeof t!=Nn&&typeof t!=st)throw new N(ny);return t}function my(e){e=e||{};let{CompressionStreamZlib:t,DecompressionStreamZlib:a}=e;if(t===C&&a===C)return e;let n=q.assign({},e);return n.CompressionStreamFallback===C&&(n.CompressionStreamFallback=t),n.DecompressionStreamFallback===C&&(n.DecompressionStreamFallback=a),n}function py(e){let t=hy(my(e));q.assign(Th,t),q.assign(gr,t)}function o2(){for(let e of uy)delete gr[e];q.assign(gr,Th)}function In(e,t){let a=new X(e.length+t.length);return a.set(e),a.set(t,e.length),a}function gy(e){return e.byteOffset||e.byteLength!=e.buffer.byteLength?new X(e):e}function me(e){return new pa(e.buffer,e.byteOffset,e.byteLength)}function fa(e){return!!e&&typeof e=="object"}var lr=[[],[],[],[],[],[],[],[]];for(let e=0;e<256;e++){let t=e;for(let a=0;a<8;a++)t=t&1?t>>>1^3988292384:t>>>1;lr[0][e]=t}for(let e=0;e<256;e++)for(let t=1;t<8;t++){let a=lr[t-1][e];lr[t][e]=a>>>8^lr[0][a&255]}var[Ew,i2,r2,s2,l2,c2,u2,d2]=lr,no=class{constructor(t){this.crc=t||-1}append(t){let a=this.crc|0,n=t.length|0,o=0;if(n>=8&&t.buffer){let i=new pa(t.buffer,t.byteOffset,n),r=n-8;for(;o<=r;o+=8){let s=a^i.getInt32(o,!0),l=i.getInt32(o+4,!0);a=d2[s&255]^u2[s>>>8&255]^c2[s>>>16&255]^l2[s>>>24&255]^s2[l&255]^r2[l>>>8&255]^i2[l>>>16&255]^Ew[l>>>24&255]}}for(;o<n;o++)a=a>>>8^Ew[(a^t[o])&255];this.crc=a}get(){return~this.crc}},fl=class extends Xe{constructor(){let t,a=new no;super({transform(n,o){a.append(n),o.enqueue(n)},flush(){let n=new X(4);new pa(n.buffer).setUint32(0,a.get()),t.value=n}}),t=this}};function el(e){if(typeof hw==hn){e=unescape(encodeURIComponent(e));let t=new X(e.length);for(let a=0;a<t.length;a++)t[a]=e.charCodeAt(a);return t}else return new hw().encode(e)}var ad=16,h2=60,Ht=64,Do=20,m2=16,p2=56,g2=new X([128]),f2=new X(1),vw=new Int32Array([1732584193,4023233417,2562383102,271733878,3285377520]),w2=54,b2=92,$e=new X(256),ne=new Int32Array(256),oe=new Int32Array(256),ie=new Int32Array(256),re=new Int32Array(256),Sw=!1;function y2(e,t){v2();let a=new Int32Array(h2),n=S2(e,a),o=new Int32Array(ad/4),i=fy(t),r=0,s=0,l=0,c=0;return{process(h,m){m&&i.update(h,0,h.length),u(h),m||i.update(h,0,h.length)},digest(){return i.digest()}};function u(h){let m=new pa(h.buffer,h.byteOffset,h.byteLength),p=h.length,g=0;for(;g+ad<=p;g+=ad)d(),m.setInt32(g,m.getInt32(g)^o[0]),m.setInt32(g+4,m.getInt32(g+4)^o[1]),m.setInt32(g+8,m.getInt32(g+8)^o[2]),m.setInt32(g+12,m.getInt32(g+12)^o[3]);if(g<p){d();for(let w=0;g<p;g++,w++)h[g]^=o[w>>2]>>>24-8*(w&3)}}function d(){r=r+1|0,r||(s=s+1|0,s||(l=l+1|0,l||(c=c+1|0)));let h=Xs(r)^a[0],m=Xs(s)^a[1],p=Xs(l)^a[2],g=Xs(c)^a[3],w=ne[h>>>24]^oe[m>>>16&255]^ie[p>>>8&255]^re[g&255]^a[4],f=ne[m>>>24]^oe[p>>>16&255]^ie[g>>>8&255]^re[h&255]^a[5],b=ne[p>>>24]^oe[g>>>16&255]^ie[h>>>8&255]^re[m&255]^a[6],y=ne[g>>>24]^oe[h>>>16&255]^ie[m>>>8&255]^re[p&255]^a[7];h=ne[w>>>24]^oe[f>>>16&255]^ie[b>>>8&255]^re[y&255]^a[8],m=ne[f>>>24]^oe[b>>>16&255]^ie[y>>>8&255]^re[w&255]^a[9],p=ne[b>>>24]^oe[y>>>16&255]^ie[w>>>8&255]^re[f&255]^a[10],g=ne[y>>>24]^oe[w>>>16&255]^ie[f>>>8&255]^re[b&255]^a[11],w=ne[h>>>24]^oe[m>>>16&255]^ie[p>>>8&255]^re[g&255]^a[12],f=ne[m>>>24]^oe[p>>>16&255]^ie[g>>>8&255]^re[h&255]^a[13],b=ne[p>>>24]^oe[g>>>16&255]^ie[h>>>8&255]^re[m&255]^a[14],y=ne[g>>>24]^oe[h>>>16&255]^ie[m>>>8&255]^re[p&255]^a[15],h=ne[w>>>24]^oe[f>>>16&255]^ie[b>>>8&255]^re[y&255]^a[16],m=ne[f>>>24]^oe[b>>>16&255]^ie[y>>>8&255]^re[w&255]^a[17],p=ne[b>>>24]^oe[y>>>16&255]^ie[w>>>8&255]^re[f&255]^a[18],g=ne[y>>>24]^oe[w>>>16&255]^ie[f>>>8&255]^re[b&255]^a[19],w=ne[h>>>24]^oe[m>>>16&255]^ie[p>>>8&255]^re[g&255]^a[20],f=ne[m>>>24]^oe[p>>>16&255]^ie[g>>>8&255]^re[h&255]^a[21],b=ne[p>>>24]^oe[g>>>16&255]^ie[h>>>8&255]^re[m&255]^a[22],y=ne[g>>>24]^oe[h>>>16&255]^ie[m>>>8&255]^re[p&255]^a[23],h=ne[w>>>24]^oe[f>>>16&255]^ie[b>>>8&255]^re[y&255]^a[24],m=ne[f>>>24]^oe[b>>>16&255]^ie[y>>>8&255]^re[w&255]^a[25],p=ne[b>>>24]^oe[y>>>16&255]^ie[w>>>8&255]^re[f&255]^a[26],g=ne[y>>>24]^oe[w>>>16&255]^ie[f>>>8&255]^re[b&255]^a[27],w=ne[h>>>24]^oe[m>>>16&255]^ie[p>>>8&255]^re[g&255]^a[28],f=ne[m>>>24]^oe[p>>>16&255]^ie[g>>>8&255]^re[h&255]^a[29],b=ne[p>>>24]^oe[g>>>16&255]^ie[h>>>8&255]^re[m&255]^a[30],y=ne[g>>>24]^oe[h>>>16&255]^ie[m>>>8&255]^re[p&255]^a[31],h=ne[w>>>24]^oe[f>>>16&255]^ie[b>>>8&255]^re[y&255]^a[32],m=ne[f>>>24]^oe[b>>>16&255]^ie[y>>>8&255]^re[w&255]^a[33],p=ne[b>>>24]^oe[y>>>16&255]^ie[w>>>8&255]^re[f&255]^a[34],g=ne[y>>>24]^oe[w>>>16&255]^ie[f>>>8&255]^re[b&255]^a[35],w=ne[h>>>24]^oe[m>>>16&255]^ie[p>>>8&255]^re[g&255]^a[36],f=ne[m>>>24]^oe[p>>>16&255]^ie[g>>>8&255]^re[h&255]^a[37],b=ne[p>>>24]^oe[g>>>16&255]^ie[h>>>8&255]^re[m&255]^a[38],y=ne[g>>>24]^oe[h>>>16&255]^ie[m>>>8&255]^re[p&255]^a[39];let E=40;n>10&&(h=ne[w>>>24]^oe[f>>>16&255]^ie[b>>>8&255]^re[y&255]^a[40],m=ne[f>>>24]^oe[b>>>16&255]^ie[y>>>8&255]^re[w&255]^a[41],p=ne[b>>>24]^oe[y>>>16&255]^ie[w>>>8&255]^re[f&255]^a[42],g=ne[y>>>24]^oe[w>>>16&255]^ie[f>>>8&255]^re[b&255]^a[43],w=ne[h>>>24]^oe[m>>>16&255]^ie[p>>>8&255]^re[g&255]^a[44],f=ne[m>>>24]^oe[p>>>16&255]^ie[g>>>8&255]^re[h&255]^a[45],b=ne[p>>>24]^oe[g>>>16&255]^ie[h>>>8&255]^re[m&255]^a[46],y=ne[g>>>24]^oe[h>>>16&255]^ie[m>>>8&255]^re[p&255]^a[47],E=48),n>12&&(h=ne[w>>>24]^oe[f>>>16&255]^ie[b>>>8&255]^re[y&255]^a[48],m=ne[f>>>24]^oe[b>>>16&255]^ie[y>>>8&255]^re[w&255]^a[49],p=ne[b>>>24]^oe[y>>>16&255]^ie[w>>>8&255]^re[f&255]^a[50],g=ne[y>>>24]^oe[w>>>16&255]^ie[f>>>8&255]^re[b&255]^a[51],w=ne[h>>>24]^oe[m>>>16&255]^ie[p>>>8&255]^re[g&255]^a[52],f=ne[m>>>24]^oe[p>>>16&255]^ie[g>>>8&255]^re[h&255]^a[53],b=ne[p>>>24]^oe[g>>>16&255]^ie[h>>>8&255]^re[m&255]^a[54],y=ne[g>>>24]^oe[h>>>16&255]^ie[m>>>8&255]^re[p&255]^a[55],E=56),o[0]=($e[w>>>24]<<24|$e[f>>>16&255]<<16|$e[b>>>8&255]<<8|$e[y&255])^a[E],o[1]=($e[f>>>24]<<24|$e[b>>>16&255]<<16|$e[y>>>8&255]<<8|$e[w&255])^a[E+1],o[2]=($e[b>>>24]<<24|$e[y>>>16&255]<<16|$e[w>>>8&255]<<8|$e[f&255])^a[E+2],o[3]=($e[y>>>24]<<24|$e[w>>>16&255]<<16|$e[f>>>8&255]<<8|$e[b&255])^a[E+3]}}function k2(e,t,a,n){let o=fy(e),i=new X(n),r=new X(t.length+4),s=new pa(r.buffer);r.set(t);for(let l=1,c=0;c<n;l++,c+=Do){s.setUint32(t.length,l),o.update(r,0,r.length);let u=o.digest(),d=u.slice();for(let h=1;h<a;h++){o.update(u,0,Do),u=o.digest();for(let m=0;m<Do;m++)d[m]^=u[m]}i.set(d.subarray(0,ae.min(Do,n-c)),c)}return i}function fy(e){let t=E2(),a=new X(Ht),n=new X(Ht);e.length>Ht&&(t.update(e,0,e.length),e=t.digest());for(let o=0;o<Ht;o++){let i=o<e.length?e[o]:0;a[o]=i^w2,n[o]=i^b2}return t.update(a,0,Ht),{update(o,i,r){t.update(o,i,r)},digest(){let o=t.digest();t.update(n,0,Ht),t.update(o,0,Do);let i=t.digest();return t.update(a,0,Ht),i}}}function E2(){let e=new Int32Array(vw),t=new Int32Array(m2),a=new X(Ht),n=new pa(a.buffer),o=new X(8),i=0,r=0;return{update:s,digest:l};function s(u,d,h){let m=d+h;if(r+=h,i){for(;d<m&&i<Ht;)a[i++]=u[d++];i==Ht&&(c(n,0),i=0)}if(d+Ht<=m){let p=new pa(u.buffer,u.byteOffset,u.byteLength);for(;d+Ht<=m;d+=Ht)c(p,d)}for(;d<m;)a[i++]=u[d++]}function l(){let u=r*8,d=ae.floor(u/4294967296),h=u>>>0;for(s(g2,0,1);i!=p2;)s(f2,0,1);o[0]=d>>>24,o[1]=d>>>16,o[2]=d>>>8,o[3]=d,o[4]=h>>>24,o[5]=h>>>16,o[6]=h>>>8,o[7]=h,s(o,0,8);let m=new X(Do),p=new pa(m.buffer);for(let g=0;g<e.length;g++)p.setInt32(4*g,e[g]);return e.set(vw),i=0,r=0,m}function c(u,d){for(let b=0;b<16;b++)t[b]=u.getInt32(d+4*b);let h=e[0],m=e[1],p=e[2],g=e[3],w=e[4],f;for(let b=0;b<15;b+=5)w=(h<<5|h>>>27)+((p^g)&m^g)+w+1518500249+t[b]|0,m=m<<30|m>>>2,g=(w<<5|w>>>27)+((m^p)&h^p)+g+1518500249+t[b+1]|0,h=h<<30|h>>>2,p=(g<<5|g>>>27)+((h^m)&w^m)+p+1518500249+t[b+2]|0,w=w<<30|w>>>2,m=(p<<5|p>>>27)+((w^h)&g^h)+m+1518500249+t[b+3]|0,g=g<<30|g>>>2,h=(m<<5|m>>>27)+((g^w)&p^w)+h+1518500249+t[b+4]|0,p=p<<30|p>>>2;w=(h<<5|h>>>27)+((p^g)&m^g)+w+1518500249+t[15]|0,m=m<<30|m>>>2,f=t[13]^t[8]^t[2]^t[0],f=f<<1|f>>>31,t[0]=f,g=(w<<5|w>>>27)+((m^p)&h^p)+g+1518500249+f|0,h=h<<30|h>>>2,f=t[14]^t[9]^t[3]^t[1],f=f<<1|f>>>31,t[1]=f,p=(g<<5|g>>>27)+((h^m)&w^m)+p+1518500249+f|0,w=w<<30|w>>>2,f=t[15]^t[10]^t[4]^t[2],f=f<<1|f>>>31,t[2]=f,m=(p<<5|p>>>27)+((w^h)&g^h)+m+1518500249+f|0,g=g<<30|g>>>2,f=t[0]^t[11]^t[5]^t[3],f=f<<1|f>>>31,t[3]=f,h=(m<<5|m>>>27)+((g^w)&p^w)+h+1518500249+f|0,p=p<<30|p>>>2;for(let b=20;b<40;b+=5)f=t[b-3&15]^t[b-8&15]^t[b-14&15]^t[b&15],f=f<<1|f>>>31,t[b&15]=f,w=(h<<5|h>>>27)+(m^p^g)+w+1859775393+f|0,m=m<<30|m>>>2,f=t[b-2&15]^t[b-7&15]^t[b-13&15]^t[b+1&15],f=f<<1|f>>>31,t[b+1&15]=f,g=(w<<5|w>>>27)+(h^m^p)+g+1859775393+f|0,h=h<<30|h>>>2,f=t[b-1&15]^t[b-6&15]^t[b-12&15]^t[b+2&15],f=f<<1|f>>>31,t[b+2&15]=f,p=(g<<5|g>>>27)+(w^h^m)+p+1859775393+f|0,w=w<<30|w>>>2,f=t[b&15]^t[b-5&15]^t[b-11&15]^t[b+3&15],f=f<<1|f>>>31,t[b+3&15]=f,m=(p<<5|p>>>27)+(g^w^h)+m+1859775393+f|0,g=g<<30|g>>>2,f=t[b+1&15]^t[b-4&15]^t[b-10&15]^t[b+4&15],f=f<<1|f>>>31,t[b+4&15]=f,h=(m<<5|m>>>27)+(p^g^w)+h+1859775393+f|0,p=p<<30|p>>>2;for(let b=40;b<60;b+=5)f=t[b-3&15]^t[b-8&15]^t[b-14&15]^t[b&15],f=f<<1|f>>>31,t[b&15]=f,w=(h<<5|h>>>27)+(m&p|(m|p)&g)+w+2400959708+f|0,m=m<<30|m>>>2,f=t[b-2&15]^t[b-7&15]^t[b-13&15]^t[b+1&15],f=f<<1|f>>>31,t[b+1&15]=f,g=(w<<5|w>>>27)+(h&m|(h|m)&p)+g+2400959708+f|0,h=h<<30|h>>>2,f=t[b-1&15]^t[b-6&15]^t[b-12&15]^t[b+2&15],f=f<<1|f>>>31,t[b+2&15]=f,p=(g<<5|g>>>27)+(w&h|(w|h)&m)+p+2400959708+f|0,w=w<<30|w>>>2,f=t[b&15]^t[b-5&15]^t[b-11&15]^t[b+3&15],f=f<<1|f>>>31,t[b+3&15]=f,m=(p<<5|p>>>27)+(g&w|(g|w)&h)+m+2400959708+f|0,g=g<<30|g>>>2,f=t[b+1&15]^t[b-4&15]^t[b-10&15]^t[b+4&15],f=f<<1|f>>>31,t[b+4&15]=f,h=(m<<5|m>>>27)+(p&g|(p|g)&w)+h+2400959708+f|0,p=p<<30|p>>>2;for(let b=60;b<80;b+=5)f=t[b-3&15]^t[b-8&15]^t[b-14&15]^t[b&15],f=f<<1|f>>>31,t[b&15]=f,w=(h<<5|h>>>27)+(m^p^g)+w+3395469782+f|0,m=m<<30|m>>>2,f=t[b-2&15]^t[b-7&15]^t[b-13&15]^t[b+1&15],f=f<<1|f>>>31,t[b+1&15]=f,g=(w<<5|w>>>27)+(h^m^p)+g+3395469782+f|0,h=h<<30|h>>>2,f=t[b-1&15]^t[b-6&15]^t[b-12&15]^t[b+2&15],f=f<<1|f>>>31,t[b+2&15]=f,p=(g<<5|g>>>27)+(w^h^m)+p+3395469782+f|0,w=w<<30|w>>>2,f=t[b&15]^t[b-5&15]^t[b-11&15]^t[b+3&15],f=f<<1|f>>>31,t[b+3&15]=f,m=(p<<5|p>>>27)+(g^w^h)+m+3395469782+f|0,g=g<<30|g>>>2,f=t[b+1&15]^t[b-4&15]^t[b-10&15]^t[b+4&15],f=f<<1|f>>>31,t[b+4&15]=f,h=(m<<5|m>>>27)+(p^g^w)+h+3395469782+f|0,p=p<<30|p>>>2;e[0]=e[0]+h|0,e[1]=e[1]+m|0,e[2]=e[2]+p|0,e[3]=e[3]+g|0,e[4]=e[4]+w|0}}function v2(){if(!Sw){let e=1,t=1;do e=(e^e<<1^(e&128?27:0))&255,t=(t^t<<1)&255,t=(t^t<<2)&255,t=(t^t<<4)&255,t&128&&(t^=9),$e[e]=(t^(t<<1|t>>7)^(t<<2|t>>6)^(t<<3|t>>5)^(t<<4|t>>4)^99)&255;while(e!=1);$e[0]=99;for(let a=0;a<256;a++){let n=$e[a],o=wy(n),i=o<<24|n<<16|n<<8|o^n;ne[a]=i,oe[a]=i>>>8|i<<24,ie[a]=i>>>16|i<<16,re[a]=i>>>24|i<<8}Sw=!0}}function S2(e,t){let a=e.length>>2,n=a+6,o=4*(n+1),i=1;for(let r=0;r<a;r++)t[r]=e[4*r]<<24|e[4*r+1]<<16|e[4*r+2]<<8|e[4*r+3];for(let r=a;r<o;r++){let s=t[r-1];r%a==0?(s=Aw(s<<8|s>>>24)^i<<24,i=wy(i)):a>6&&r%a==4&&(s=Aw(s)),t[r]=t[r-a]^s}return n}function Aw(e){return $e[e>>>24]<<24|$e[e>>>16&255]<<16|$e[e>>>8&255]<<8|$e[e&255]}function Xs(e){return e<<24|(e&65280)<<8|e>>>8&65280|e>>>24}function wy(e){return(e<<1^(e>>7)*27)&255}var A2=typeof ga!=hn&&typeof ga.getRandomValues==st,Kl="Invalid password",_h="Invalid authentication code",xh="zipjs-abort-check-password",by="Crypto API not supported";function yy(e){if(A2)return ga.getRandomValues(e);throw new N(by)}var Lh=16,T2="raw",ky={name:"PBKDF2"},C2={name:"HMAC"},R2="SHA-1",Ey=1e3,_2=q.assign({hash:C2},ky),x2=q.assign({iterations:Ey,hash:{name:R2}},ky),L2=["deriveBits"],fr=[8,12,16],I2=[16,24,32],Cn=10,_d=2,vy=typeof ga!=hn,wr=vy&&ga.subtle,j2=vy&&typeof wr!=hn,Tw=j2&&typeof wr.importKey==st&&typeof wr.deriveBits==st,N2=y2,xd=class extends Xe{constructor({password:t,rawPassword:a,encryptionStrength:n,checkPasswordOnly:o,checkAuthenticationCode:i=!0}){let r={};super({start(){Sy(r,t,a,n)},async transform(s,l){let{password:c,strength:u,resolveReady:d,ready:h}=r;if(c?(await O2(r,u,c,Vt(s,0,fr[u]+_d)),s=Vt(s,fr[u]+_d),o?(br(r),l.error(new N(xh))):d()):await h,r.discarded)return;let m=new X(s.length-Cn-(s.length-Cn)%Lh);l.enqueue(Ty(r,s,m,0,Cn,!0))},async flush(s){let{engine:l,pendingInput:c,ready:u}=r;if(l){if(await u,r.discarded)return;let d=Vt(c,c.length-Cn),h=new X(Vt(c,0,c.length-Cn));l.process(h,!0);let m=l.digest(),p=c.length<Cn?1:0;for(let g=0;g<Cn;g++)p|=m[g]^d[g];if(p&&i){s.error(new N(_h));return}s.enqueue(h)}}}),Ay(this,r)}},Ld=class extends Xe{constructor({password:t,rawPassword:a,encryptionStrength:n}){let o={};super({start(){Sy(o,t,a,n)},async transform(i,r){let{password:s,strength:l,resolveReady:c,ready:u}=o,d=Ce;if(s?(d=await D2(o,l,s),c()):await u,o.discarded)return;let h=new X(d.length+i.length-i.length%Lh);h.set(d,0),r.enqueue(Ty(o,i,h,d.length,0,!1))},async flush(i){let{engine:r,pendingInput:s,ready:l}=o;if(r){if(await l,o.discarded)return;let c=new X(s);r.process(c,!1);let u=Vt(r.digest(),0,Cn);i.enqueue(In(c,u))}}}),Ay(this,o)}};function Sy(e,t,a,n){q.assign(e,{ready:new Fe(o=>e.resolveReady=o),password:P2(t,a),strength:n-1,pendingInput:Ce,discarded:!1})}function Ay(e,t){let a=e.readable.getReader(),n=new Ot({async pull(o){try{let{value:i,done:r}=await a.read();r?o.close():o.enqueue(i)}catch(i){throw br(t),a.cancel(i).catch(()=>{}),i}},cancel(o){return br(t),a.cancel(o)}});q.defineProperty(e,"readable",{get(){return n}})}function Ty(e,t,a,n,o,i){let{engine:r,pendingInput:s}=e;s.length&&(t=In(s,t));let l=t.length-o,c=l-l%Lh;if(a=F2(a,n+c),c){let u=Vt(a,n,n+c);u.set(Vt(t,0,c)),r.process(u,i)}return e.pendingInput=Vt(t,c),a}async function O2(e,t,a,n){let o=await Cy(e,t,a,Vt(n,0,fr[t])),i=Vt(n,fr[t]);if(o[0]!=i[0]||o[1]!=i[1])throw br(e),new N(Kl)}function br(e){let{engine:t}=e;e.discarded=!0,t&&t.dispose&&t.dispose()}async function D2(e,t,a){let n=yy(new X(fr[t])),o=await Cy(e,t,a,n);return In(n,o)}async function Cy(e,t,a,n){e.password=null;let o=I2[t],i=await M2(a,n,o*2+_d);return e.engine=N2(Vt(i,0,o),Vt(i,o,o*2)),e.discarded&&br(e),Vt(i,o*2)}async function M2(e,t,a){if(Tw)try{let n=await wr.importKey(T2,e,_2,!1,L2);return new X(await wr.deriveBits(q.assign({salt:t},x2),n,a*8))}catch{Tw=!1}return k2(e,t,Ey,a)}function P2(e,t){return t===C?el(e):t}function F2(e,t){if(t&&t>e.length){let a=e;e=new X(t),e.set(a,0)}return e}function Vt(e,t,a){return e.subarray(t,a)}var Ho=12,Id=class extends Xe{constructor({password:t,rawPassword:a,passwordVerification:n,checkPasswordOnly:o}){super({start(){Ry(this,t,a,n)},transform(i,r){let s=this;if(s.password||s.rawPassword){let l=Cw(s,i.subarray(0,Ho));if(s.password=s.rawPassword=null,(l[Ho-1]^s.passwordVerification)!=0)throw new N(Kl);i=i.subarray(Ho)}o?r.error(new N(xh)):r.enqueue(Cw(s,i))}})}},jd=class extends Xe{constructor({password:t,rawPassword:a,passwordVerification:n}){super({start(){Ry(this,t,a,n)},transform(o,i){let r=this,s,l;if(r.password||r.rawPassword){r.password=r.rawPassword=null;let c=yy(new X(Ho));c[Ho-1]=r.passwordVerification,s=new X(o.length+c.length),s.set(Rw(r,c),0),l=Ho}else s=new X(o.length),l=0;s.set(Rw(r,o),l),i.enqueue(s)}})}};function Ry(e,t,a,n){q.assign(e,{password:t,rawPassword:a,passwordVerification:n}),z2(e,t,a)}function Cw(e,t){let a=new X(t.length);for(let n=0;n<t.length;n++)a[n]=_y(e)^t[n],wl(e,a[n]);return a}function Rw(e,t){let a=new X(t.length);for(let n=0;n<t.length;n++)a[n]=_y(e)^t[n],wl(e,t[n]);return a}function z2(e,t,a){let n=[305419896,591751049,878082192];if(q.assign(e,{cryptoKeys:n,crcKey0:new no(n[0]),crcKey2:new no(n[2])}),a)for(let o=0;o<a.length;o++)wl(e,a[o]);else for(let o=0;o<t.length;o++)wl(e,t.charCodeAt(o))}function wl(e,t){let[,a]=e.cryptoKeys;e.crcKey0.append([t]);let n=~e.crcKey0.get();a=_w(ae.imul(_w(a+xy(n)),134775813)+1),e.crcKey2.append([a>>>24]);let o=~e.crcKey2.get();e.cryptoKeys=[n,a,o]}function _y(e){let t=e.cryptoKeys[2]|2;return xy(ae.imul(t,t^1)>>>8)}function xy(e){return e&255}function _w(e){return e&4294967295}function oo(e){if(e instanceof Ot)return e;let t=e.getReader();return new Ot({async pull(a){try{let{value:n,done:o}=await t.read();o?a.close():a.enqueue(n)}catch(n){throw t.cancel(n).catch(()=>{}),n}},cancel(a){return t.cancel(a)}})}function io(e,t){e=oo(e);let a=t?{type:t}:{};if(U2())return new sx(e).blob().then(o=>t?new qo([o],a):o);let n=[];return e.pipeTo(new ba({write(o){n.push(o)}})).then(()=>new qo(n,a))}function U2(){return typeof qo.prototype.stream!=st||new qo([]).stream()instanceof Ot}function B2(e){if(e instanceof ba)return e;let t=e.getWriter();return new ba({write(a){return t.write(a)},close(){return t.close()},abort(a){return t.abort(a)}})}var Nd="Invalid codec definition",Ly="Reserved compression method",Iy="Invalid codec module",Xo="Compression method not supported",H2=[un,ei,dr,xr],Go=new wa,Or=new wa;function G2(e={}){let{compressionMethod:t,format:a,codecURI:n,CompressionStream:o,DecompressionStream:i,versionNeeded:r}=e;if(!nt.isInteger(t)||t<0||t>le||typeof a!=Nn||!a.length)throw new N(Nd);if(H2.includes(t))throw new N(Ly);let s=typeof o==st||typeof i==st;if(!s&&(typeof n!=Nn||!n.length))throw new N(Nd);Go.set(t,{compressionMethod:t,format:a,codecURI:n,versionNeeded:r}),s&&Oy(a,{CompressionStream:o,DecompressionStream:i})}function W2(e){let t=Go.get(e);if(t){Go.delete(e);let a;Go.forEach(n=>a=a||n.format==t.format),a||Or.delete(t.format)}}function jy(e){return Go.get(e)}function Ny(){return Dt.from(Go.values(),e=>q.assign({},e,Or.get(e.format)))}function Ih(e){return Or.get(e)}function Oy(e,t){let{CompressionStream:a,DecompressionStream:n}=t;if(typeof a!=st&&typeof n!=st)throw new N(Iy);Or.set(e,{CompressionStream:a,DecompressionStream:n})}async function V2(e,t){!Or.has(e)&&t&&Oy(e,await import(t))}var Zo="Invalid uncompressed size",jh="Invalid compressed data",Xl="Codec out of memory",Zl="Invalid CRC32",q2="Z_MEM_ERROR",Mo="deflate-raw",Od="deflate64-raw",ro="gzip",Dy=10,Dd=8,Y2=[31,139,8],Md=class extends Xe{constructor(t,{chunkSize:a,CompressionStreamFallback:n,CompressionStream:o}){super({});let{compressed:i,encrypted:r,useCompressionStream:s,zipCrypto:l,computeCrc32:c,level:u,deflate64:d,format:h,compressionMethod:m,inputSize:p}=t,g=this,w,f,b,y=super.readable,E=h&&Ih(h),k=zy(s,o,n),S=c&&i&&!d&&!E&&(!r||l)&&!!k;if((!r||l)&&c&&!S&&(w=new fl,y=rn(y,w)),i)if(E)y=cr(y,Fy(E.CompressionStream,h,{level:u,chunkSize:a,compressionMethod:m,uncompressedSize:p}));else if(S)b=new bl,y=cr(y,new k(ro,{level:u,chunkSize:a})),y=rn(y,b);else try{y=Uy(y,s,{level:u,chunkSize:a},o,n)}catch(T){if(!s&&n)throw kl(T);let v;try{v=new o(ro)}catch{throw kl(T)}y=cr(y,v),y=rn(y,new bl)}r&&(l?y=rn(y,new jd(t)):(f=new Ld(t),y=rn(y,f))),Py(g,y,()=>{(!r||l)&&c&&(g.crc32=S?b.crc32:new pa(w.value.buffer).getUint32(0))})}},bl=class extends Xe{constructor(){let t,a=Dy,n=new X(0);super({transform(o,i){if(a){let c=ae.min(a,o.length);if(a-=c,o=o.subarray(c),!o.length)return}let r=n.length+o.length;if(r<=Dd){n=In(n,o);return}let s=r-Dd,l=ae.min(s,n.length);i.enqueue(In(n.subarray(0,l),o.subarray(0,s-l))),n=In(n.subarray(l),o.subarray(s-l))},flush(){let o=me(n);t.crc32=o.getUint32(0,!0),t.uncompressedSize=o.getUint32(4,!0)}}),t=this}};function K2(e,t,a,n,o){let i=t.writable.getWriter(),r=t.readable.getReader(),s=n===C?new no:C,l=0,c=!1,u=!1,d,h,m=new Ot({start(E){h=E},pull(){b()},cancel(E){return u=!0,b(),r.cancel(E)}});return p(),g(),m;async function p(){let E=e.getReader();try{let k=new X(Dy);for(k.set(Y2),await i.write(k);;){await f(),await i.ready;let{value:v,done:A}=await Hy(E,o);if(A)break;await i.write(v)}s&&await i.write(new X(0));let S=new X(Dd),T=me(S);T.setUint32(0,s?s.get():n,!0),T.setUint32(4,a,!0),c=!0,await i.write(S),await i.close()}catch(k){await By(i,k),await yl(E,k)}}async function g(){try{for(;;){let{value:E,done:k}=await w();if(k)break;if(l+=E.length,l>a)throw new N(Zo);s&&s.append(E),h.enqueue(E)}u||(u=!0,h.close())}catch(E){y(E),await yl(r,E)}}function w(){return r.read().catch(E=>{if(c){if(!s)throw El(E,Zl);if(l!=a)throw El(E,Zo);return{done:!0}}throw Gy(E,o)})}function f(){if(!u&&h.desiredSize<=0)return new Fe(E=>d=E)}function b(){if(d){let E=d;d=C,E()}}function y(E){u||(u=!0,h.error(E),b())}}var Pd=class extends Xe{constructor(t,{chunkSize:a,DecompressionStreamFallback:n,DecompressionStream:o}){super({});let{zipCrypto:i,encrypted:r,checkCrc32:s,crc32:l,compressed:c,useCompressionStream:u,deflate64:d,format:h,compressionMethod:m,rawBitFlag:p,outputSize:g}=t,w,f,b,y=super.readable;if(r&&(i?y=rn(y,new Id(t)):(f=new xd(t),y=rn(y,f))),c){let E=new cn,k=h&&Ih(h),S;if(k)y=cr(y,Fy(k.DecompressionStream,h,{chunkSize:a,compressionMethod:m,rawBitFlag:p,uncompressedSize:g}),E);else{let T=zy(u,o,n);if(s&&!d&&l!==C&&g!==C&&T)try{S=new T(ro,{chunkSize:a})}catch{S=C}if(!S)try{y=Uy(y,u,{chunkSize:a,deflate64:d},o,n,E)}catch(v){if(d||g===C||!u&&n)throw kl(v);try{S=new o(ro)}catch{throw kl(v)}}}S?(b=!0,y=K2(y,S,g,l,E)):y=Z2(y,E)}s&&!b&&(w=new fl,y=rn(y,w)),Py(this,y,()=>{if(w){let E=new pa(w.value.buffer).getUint32(0,!1);if(l!=E)throw new N(Zl)}})}},xw=new wa;function Nh(e,t){if(!e)return!1;let a=xw.get(e);a||(a=new wa,xw.set(e,a));let n=a.get(t);if(n===C){try{new e(t),n=!0}catch{n=!1}a.set(t,n)}return n}function My(e){return Nh(e,Mo)}function X2(e){return Nh(e,ro)}function Py(e,t,a){t=rn(t,new Xe({flush:a})),q.defineProperty(e,"readable",{get(){return t}})}function Fy(e,t,a){if(!e)throw new N(Xo);return new e(t,a)}function zy(e,t,a){if(e&&t)return t;if(a&&a.requiresModule)return a}function Uy(e,t,a,n,o,i){let r=t&&n?n:o||n,s=a.deflate64?Od:Mo,l;try{l=new r(s,a)}catch(c){if(t&&o&&r!=o)l=new o(s,a);else throw c}return cr(e,l,i)}function rn(e,t){return oo(e).pipeThrough(t)}function cr(e,t,a){let n=t.writable.getWriter(),o=e.getReader();return i(),t.readable;async function i(){try{for(;;){await n.ready;let r=await Hy(o,a);if(r.done){await n.close();break}await n.write(r.value)}}catch(r){await By(n,r),await yl(o,r)}}}async function By(e,t){try{await e.abort(t)}catch{}}async function yl(e,t){try{await e.cancel(t)}catch{}}function Hy(e,t){let a=e.read();return t?a.catch(n=>{throw t.add(n),n}):a}function Gy(e,t){return t.has(e)?e:El(e,Wy(e)?Xl:jh)}function kl(e){return Wy(e)?El(e,Xl):e}function Wy(e){return fa(e)&&e.code==q2}function El(e,t){let a=new N(t);return a.cause=e,a}function Z2(e,t){let a=e.getReader();return new Ot({async pull(n){try{let{value:o,done:i}=await a.read();i?n.close():n.enqueue(o)}catch(o){throw await yl(a,o),Gy(o,t)}},cancel(n){return a.cancel(n)}})}var $2=256*1024,J2="message",Q2="start",e1="pull",Lw="data",t1="ack",a1="close",Oh="deflate",Vy="inflate",Fd=class extends Xe{constructor(t,a){super({});let n=this,{codecType:o}=t,i;o.startsWith(Oh)?i=Md:o.startsWith(Vy)&&(i=Pd),n.outputSize=0;let r=0,s=new i(t,a),l=super.readable,c=new Xe({transform(d,h){d&&d.length&&(r+=d.length,h.enqueue(d))},flush(){q.assign(n,{inputSize:r})}}),u=new Xe({transform(d,h){if(d&&d.length&&(h.enqueue(d),n.outputSize+=d.length,t.outputSize!==C&&n.outputSize>t.outputSize))throw new N(Zo)},flush(){let{crc32:d}=s;q.assign(n,{crc32:d,inputSize:r})}});q.defineProperty(n,"readable",{get(){return l.pipeThrough(c).pipeThrough(s).pipeThrough(u)}})}},vl=class extends Xe{constructor(t){let a=[],n=0,o=0;(!nt.isFinite(t)||t<1)&&(t=$2),super({transform(s,l){for(a.push(s),n+=s.length;n>t;)o+=t,l.enqueue(i())},flush(s){n&&(o+=n,s.enqueue(r(a,n)))}}),q.defineProperty(this,"outputSize",{get:()=>o});function i(){let s=new X(t),l=0;for(;l<t;){let c=a[0],u=t-l;c.length<=u?(s.set(c,l),l+=c.length,a.shift()):(s.set(c.subarray(0,u),l),a[0]=c.subarray(u),l+=u)}return n-=t,s}function r(s,l){let c=new X(l),u=0;for(let d of s)c.set(d,u),u+=d.length;return c}}},$l="Worker startup timeout",ur,Dh,zd,Iw=()=>{};function n1(e){zd=e}async function o1(e){let{CompressionStream:t,CompressionStreamFallback:a}=e;return a&&!a.requiresModule||My(t)||X2(t)?!0:a?await qy(e):!1}async function qy(e){if(Iw)try{return await Iw(e),!0}catch{}return!1}function i1(){ur=C,Dh=!1}function jw(e){e.createWorker?Dh=!0:ur=!1}var to=class{constructor(t,{readable:a,writable:n},o,i){let{options:r,config:s,streamOptions:l,useWebWorkers:c,workerURI:u}=o,{createWorker:d}=o,{signal:h}=l;return Dh&&(d=C),q.assign(t,{busy:!0,generation:(t.generation||0)+1,readable:a.pipeThrough(new vl(Ch(s))).pipeThrough(new Ud(l),{signal:h}),writable:n,options:q.assign({},r),workerOptions:o,workerURI:u,createWorker:d,terminate(){return new Fe(m=>{let{worker:p,busy:g}=t;g?(t.terminateResolvers=t.terminateResolvers||[],t.terminateResolvers.push(m)):(p&&(p.terminate(),t.worker=null),m()),t.interface=null})},onTaskFinished(){if(t.busy){let{terminateResolvers:m,worker:p}=t;m&&(t.terminateResolvers=null,p&&(t.terminated=!0,p.terminate())),t.busy=!1;let g=i(t);m&&m.forEach(w=>w(g))}}}),ur===C&&(ur=typeof Js!=hn),(c&&zd&&(ur&&u||d)?zd:Yy)(t,s)}},Ud=class extends Xe{constructor({onstart:t,onprogress:a,size:n,onend:o}){let i=0;super({async start(){t&&await nd(t,n)},async transform(r,s){i+=r.length,a&&await nd(a,i,n),s.enqueue(r)},async flush(){o&&await nd(o,i)}})}};async function nd(e,...t){try{await e(...t)}catch{}}function Yy(e,t){return{run:()=>Bd(e,t)}}async function Bd({options:e,readable:t,writable:a,onTaskFinished:n,workerOptions:o},i){let r,s,l;try{if(e.compressed&&!e.format){let p=e.codecType.startsWith(Oh),g=p?i.CompressionStreamFallback:i.DecompressionStreamFallback,w=p?i.CompressionStream:i.DecompressionStream;e.useCompressionStream?g&&g.requiresModule&&!My(w)&&await c():!await c()&&(!g||g.requiresModule)&&(e.useCompressionStream=!0)}e.encrypted&&!e.zipCrypto&&await c(),r=new Fd(e,i),s=new vl(Ch(i));let{signal:u}=o.streamOptions;await t.pipeThrough(r).pipeThrough(s).pipeTo(a,{preventClose:!0,preventAbort:!0,signal:u});let{crc32:d,inputSize:h,outputSize:m}=r;return{crc32:d,inputSize:h,outputSize:m}}catch(u){if(r){let d=s?s.outputSize:0;if(o.outputSize=d,fa(u))try{u.outputSize=d}catch{}}throw u}finally{n()}function c(){return l||(l=qy(i)),l}}var Nw={type:"module"},Hd="error",r1="messageerror",Ow="abort",Dw,od,Mw;n1(s1);function s1(e,t){let{baseURI:a,chunkSize:n,workerStartupTimeout:o}=t,{wasmURI:i}=t;if(!e.interface){typeof i==st&&(i=i());let r;try{r=tl(e.workerURI,a,e)}catch{return jw(e),Yy(e,t)}q.assign(e,{worker:r,workerAlive:!1,terminated:!1,startupError:null,interface:{run:async()=>{try{return await l1(e,{chunkSize:n,wasmURI:i,baseURI:a,workerStartupTimeout:o})}catch(s){if(s&&s.workerStartupFailed)return jw(e),Pw(e),Bd(e,t);if(s&&s.codecImportFailed){if(e.reader)return Pw(e),Bd(e,t);e.onTaskFinished()}throw s}}}})}return e.interface}async function l1(e,t){if(!e.worker){let{startupError:h}=e;e.startupError=null;let m=h||new N($l);throw m.workerStartupFailed=!0,m}let a,n,o=new Fe((h,m)=>{a=h,n=p=>{let{outputSize:g,workerOptions:w}=e;if(w.outputSize=g,fa(p))try{p.outputSize=g}catch{}m(p)}});q.assign(e,{reader:null,writer:null,outputSize:0,destinationFailed:!1,destinationError:null,resolveResult:a,rejectResult:n,result:o});let{readable:i,options:r}=e,{writable:s,closed:l,abortPipe:c}=c1(e.writable,e);try{Gd({type:Q2,options:r,config:t},e)}catch(h){c();try{await l}catch{}throw e.onTaskFinished(),h}q.assign(e,{reader:i.getReader(),writer:s.getWriter()});let{workerStartupTimeout:u}=t;!e.workerAlive&&nt.isFinite(u)&&u>=0&&(e.startupTimeout=hh(()=>u1(e),u));try{let h=await o;return await d(),await l,h}catch(h){await d(),c();try{await l}catch{}let{outputSize:m,workerOptions:p,destinationFailed:g,destinationError:w}=e;p.outputSize=m;let f=fa(h)&&(h.codecImportFailed||h.workerStartupFailed),b=g&&!f?w:h;if(fa(b))try{b.outputSize=m}catch{}throw b}async function d(){if(!s.locked)try{await s.getWriter().close()}catch{}}}function c1(e,t){let a=new AbortController,n,{writable:o,readable:i}=new Xe({transform(l,c){t.outputSize+=l.length,c.enqueue(l)}}),r=i.pipeTo(e,{preventClose:!0,preventAbort:!0,signal:a.signal});r.catch(l=>{n||q.assign(t,{destinationFailed:!0,destinationError:l})});let{signal:s}=t.workerOptions.streamOptions;if(s){let l=()=>a.abort(s.reason),c=()=>s.removeEventListener(Ow,l);s.addEventListener(Ow,l),r.then(c,c)}return{writable:o,closed:r,abortPipe:()=>{n=!0,a.abort()}}}function Pw(e){let{reader:t}=e;t&&t.releaseLock(),e.reader=null,e.writer=null}function Mh(e){let{worker:t}=e;if(t)try{t.terminate()}catch{}e.interface=null}function tl(e,t,a,n,o=!0){let{createWorker:i}=a,r,s,l;if(i)r=i();else if(od===C||Dw!==e){let c=typeof e==st;c?s=e(o):s=e;let u=s.startsWith("data:"),d=s.startsWith("blob:");if(u||d){n===C&&(n=!1),n&&(l=Nw);try{r=new Js(s,l)}catch(h){if(d)try{il.revokeObjectURL(s)}catch{}if(c&&d)return tl(e,t,a,n,!1);if(n)throw h;return tl(e,t,a,!0,!1)}}else{n===C&&(n=!0),n&&(l=Nw);try{s=new il(s,t)}catch{}try{r=new Js(s,l)}catch(h){if(n)return tl(e,t,a,!1,o);throw h}}Dw=e,od=s,Mw=l}else r=new Js(od,Mw);return r.addEventListener(J2,c=>{a.workerAlive=!0,Ky(a),d1(c,a)}),r.addEventListener(Hd,c=>Fw(c,a)),r.addEventListener(r1,c=>Fw(c,a)),r}function u1(e){if(e.startupTimeout=null,e.workerAlive)return;let{rejectResult:t,writer:a}=e;if(Mh(e),e.worker=null,t){let n=new N($l);n.workerStartupFailed=!0,t(n),a&&a.releaseLock()}}function Ky(e){let{startupTimeout:t}=e;t&&(mh(t),e.startupTimeout=null)}function Fw(e,t){e.preventDefault&&e.preventDefault(),Ky(t);let{workerAlive:a,rejectResult:n,writer:o,onTaskFinished:i}=t;Mh(t),a||(t.worker=null);let r=e.error||new N(e.message||Hd);a||(r=q.assign(new N(r.message||Hd),{workerStartupFailed:!0}),t.startupError=r),n&&(n(r),o&&o.releaseLock(),a&&i())}function Gd(e,{worker:t,writer:a}){try{let{value:n}=e;if(n){e.value=gy(n);try{t.postMessage(e,[e.value.buffer])}catch{t.postMessage(e)}}else t.postMessage(e)}catch(n){throw a&&a.releaseLock(),n}}async function d1({data:e},t){let{type:a,value:n,messageId:o,result:i,error:r,errorValue:s}=e,{reader:l,writer:c,resolveResult:u,rejectResult:d,onTaskFinished:h,generation:m}=t,p=()=>t.generation!=m;try{if(r)g(h1(r,s));else{if(a==e1){let{value:b,done:y}=await l.read();p()||Gd({type:Lw,value:b,done:y,messageId:o},t)}if(a==Lw){let b=new X(n);await c.ready,await c.write(b),p()||Gd({type:t1,messageId:o},t)}a==a1&&w(i)}}catch(b){p()||(Mh(t),g(b))}function g(b){p()||(d(b),f(),fa(b)&&b.codecImportFailed||h())}function w(b){p()||(u(b),f(),h())}function f(){c&&c.releaseLock()}}function h1(e,t){let{message:a,stack:n,code:o,name:i,outputSize:r,cause:s,codecImportFailed:l}=e,c;if(t?c=t.value:c=q.assign(new N(a),{stack:n,code:o,name:i}),fa(c))try{r!==C&&(c.outputSize=r),l&&(c.codecImportFailed=!0),s&&(fa(c.cause)||(c.cause=q.assign(new N(s.message),{name:s.name})),s.code!==C&&c.cause.code!==s.code&&(c.cause.code=s.code)),t&&(c.name!==i&&(c.name=i),c.code!==o&&(c.code=o))}catch{}return c}var _n=[],ao=[],Wo,al,zw=0;async function Xy(e,t){let{options:a,config:n}=t,{useWebWorkers:o,useCompressionStream:i,compressed:r,checkCrc32:s,computeCrc32:l,encrypted:c,format:u,codecURI:d}=a,{workerURI:h,createWorker:m,maxWorkers:p}=n;u&&(d&&(a.codecURI=m1(d,n.baseURI)),await V2(u,a.codecURI));let g=!r&&!s&&!l&&!c,w=u===C||!!a.codecURI;return t.useWebWorkers=!g&&w&&(o||o===C&&n.useWebWorkers),t.workerURI=t.useWebWorkers&&h?h:C,t.createWorker=t.useWebWorkers&&m?m:C,a.useCompressionStream=i||i===C&&n.useCompressionStream,(await f()).run();async function f(){let y=_n.find(E=>!E.busy);if(y)return Wd(y),new to(y,e,t,b);if(_n.length<p){let E={indexWorker:zw};return zw++,_n.push(E),new to(E,e,t,b)}else return new Fe(E=>{ao.push({resolve:E,stream:e,workerOptions:t}),al=n.workerStarvationTimeout,Sl()})}function b(y){if(Ph(),y.terminated)return y.terminated=!1,Zy();if(ao.length){let[{resolve:E,stream:k,workerOptions:S}]=ao.splice(0,1);E(new to(y,k,S,b)),Sl()}else y.worker?(Wd(y),g1(y,t)):_n=_n.filter(E=>E!=y)}}function m1(e,t){try{return new il(e,t).toString()}catch{return e}}function Sl(){!Wo&&ao.length&&nt.isFinite(al)&&al>=0&&(Wo=hh(p1,al))}function Ph(){Wo&&(mh(Wo),Wo=null)}function p1(){if(Wo=null,ao.length){let[{resolve:e,stream:t,workerOptions:a}]=ao.splice(0,1);e(new to({},t,$y(a),Jy)),Sl()}}function Zy(){let e=ao.splice(0).map(({resolve:t,stream:a,workerOptions:n})=>new Fe(o=>{t(new to({},a,$y(n),()=>{Jy(),o()}))}));return Ph(),Fe.all(e)}function $y(e){return q.assign({},e,{useWebWorkers:!1,workerURI:C,createWorker:C})}function Jy(){Ph(),Sl()}function g1(e,t){let{config:a}=t,{terminateWorkerTimeout:n}=a;nt.isFinite(n)&&n>=0&&(e.terminateTimeout=hh(async()=>{_n=_n.filter(o=>o!=e);try{await e.terminate()}catch{}},n))}function Wd(e){let{terminateTimeout:t}=e;t&&(mh(t),e.terminateTimeout=null)}async function f1(){await Fe.allSettled([Zy(),..._n.map(e=>(Wd(e),e.terminate()))]),i1()}var w1="\0\u263A\u263B\u2665\u2666\u2663\u2660\u2022\u25D8\u25CB\u25D9\u2642\u2640\u266A\u266B\u263C\u25BA\u25C4\u2195\u203C\xB6\xA7\u25AC\u21A8\u2191\u2193\u2192\u2190\u221F\u2194\u25B2\u25BC !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\u2302\xC7\xFC\xE9\xE2\xE4\xE0\xE5\xE7\xEA\xEB\xE8\xEF\xEE\xEC\xC4\xC5\xC9\xE6\xC6\xF4\xF6\xF2\xFB\xF9\xFF\xD6\xDC\xA2\xA3\xA5\u20A7\u0192\xE1\xED\xF3\xFA\xF1\xD1\xAA\xBA\xBF\u2310\xAC\xBD\xBC\xA1\xAB\xBB\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u255E\u255F\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256B\u256A\u2518\u250C\u2588\u2584\u258C\u2590\u2580\u03B1\xDF\u0393\u03C0\u03A3\u03C3\xB5\u03C4\u03A6\u0398\u03A9\u03B4\u221E\u03C6\u03B5\u2229\u2261\xB1\u2265\u2264\u2320\u2321\xF7\u2248\xB0\u2219\xB7\u221A\u207F\xB2\u25A0\xA0".split("");function b1(e){let t="";for(let a=0;a<e.length;a++)t+=w1[e[a]];return t}function nl(e,t){return Qy(e,t,!0)}function Uw(e){if(e.some(t=>t>127))try{return new rl("utf-8",{fatal:!0}).decode(e),!0}catch{return!1}else return!1}function y1(e,t){return Qy(e,t,!1)}function Qy(e,t,a){return t&&t.trim().toLowerCase()=="cp437"?b1(e):new rl(t,{ignoreBOM:a}).decode(e)}var Fh="HTTP error ",ek=200,tk=299,Ia="HTTP Range not supported",Vd="HTTP resource changed",ak="Writer iterator completed too soon",nk="Writer not initialized",ok="Invalid writer (size must be writable)",k1="text/plain",E1="Content-Length",v1="Content-Encoding",ik="Content-Range",S1="Accept-Ranges",A1="Range",T1="Etag",C1="Last-Modified",R1="HEAD",Jl="GET",rk="bytes",_1=256*1024,x1=16*1024*1024,zh="writable",Bw=Symbol(),$o=class{constructor(){this.size=0}init(){this.initialized=!0}},ya=class extends $o{get readable(){return this.createReadable()}createReadable({offset:t=0,size:a,chunkSize:n=Ch(mo())}={}){let o=this,i=0;return n=dy(n),new Ot({async pull(r){let s=a===C?n:ae.min(n,a-i),l=await We(o,t+i,s);l.length&&(r.enqueue(l),i+=l.length),(a!==C&&i>=a||!l.length&&s)&&r.close()}})}},yr=class extends $o{constructor(){super();let t=this,a=new ba({write(n){if(!t.initialized)throw new N(nk);return t.writeUint8Array(gy(n))}});q.defineProperty(t,zh,{get(){return a}})}writeUint8Array(){}},qd=class extends ya{constructor(t){super();let a=t.length;for(;t.charAt(a-1)=="=";)a--;let n=t.indexOf(",")+1;q.assign(this,{dataURI:t,dataStart:n,size:ae.floor((a-n)*.75)})}readUint8Array(t,a){let{dataStart:n,dataURI:o}=this,i=new X(a),r=ae.floor(t/3)*4,s=atob(o.substring(r+n,ae.ceil((t+a)/3)*4+n)),l=t-ae.floor(r/4)*3,c=0;for(let u=l;u<l+a&&u<s.length;u++)i[u-l]=s.charCodeAt(u),c++;return c<i.length?i.subarray(0,c):i}},Yd=class extends yr{constructor(t){super(),q.assign(this,{contentType:t,data:"data:"+(t||"")+";base64,",pendingCharacters:""})}writeUint8Array(t){let a=this,n,o=a.pendingCharacters,i=a.pendingCharacters.length;for(a.pendingCharacters="",n=0;n<ae.floor((i+t.length)/3)*3-i;n++)o+=dw.fromCharCode(t[n]);for(;n<t.length;n++)a.pendingCharacters+=dw.fromCharCode(t[n]);o.length>2?a.data+=mw(o):a.pendingCharacters=o+a.pendingCharacters}getData(){return this.data+mw(this.pendingCharacters)}},Kd,sk;function L1(){sk=(async()=>{try{let t=new qo([new X(3)]).slice(1,2).stream().getReader(),a=0,n=await t.read();for(;!n.done;)a+=n.value.length,n=await t.read();Kd=a==1}catch{Kd=!1}})()}var Oa=class extends ya{constructor(t){super(),q.assign(this,{sourceBlob:t,size:t.size}),sk||L1()}createReadable(t){let a=this,{sourceBlob:n,size:o}=a,{offset:i=0,size:r=o-i}=t||{};if(typeof n.stream==st){if(!i&&r>=o)return oo(n.stream());if(Kd)return oo(n.slice(i,i+r).stream())}return super.createReadable(t)}async readUint8Array(t,a){let n=this,o=t+a,s=await(!t&&o>=n.size?n.sourceBlob:n.sourceBlob.slice(t,o)).arrayBuffer();return s.byteLength>a&&(s=s.slice(t,o)),new X(s)}},Al=class extends $o{constructor(t){super();let a=this,n=new Xe;q.defineProperty(a,zh,{get(){return n.writable}}),a.contentType=t,a.blobPromise=io(n.readable,t),a.blobPromise.catch(()=>{})}getData(){return this.blobPromise}},kr=class extends Oa{constructor(t){super(new qo([t],{type:k1}))}},Xd=class extends Al{constructor(t){super(),q.assign(this,{encoding:t,utf8:!t||t.toLowerCase()=="utf-8"})}async getData(){let{encoding:t,utf8:a}=this,n=await super.getData();return n.text&&a?n.text():y1(new X(await n.arrayBuffer()),t)}},Zd=class extends ya{constructor(t,a){super(),lk(this,t,a)}async init(){await ck(this,Tl,Hw),super.init()}createReadable(t){let a=this,{useRangeHeader:n,forceRangeRequests:o,size:i,eocdCache:r}=a;if((n||o)&&i!==C){let{offset:s=0,size:l=i-s}=t||{},c=r&&s>=i-r.length;if(l>0&&s<i&&!c)return I1(a,s,ae.min(l,i-s))}return super.createReadable(t)}readUint8Array(t,a){return uk(this,t,a,Tl,Hw)}},$d=class extends ya{constructor(t,a){super(),lk(this,t,a)}async init(){await ck(this,Jd,Gw),super.init()}readUint8Array(t,a){return uk(this,t,a,Jd,Gw)}};function lk(e,t,a){let{preventHeadRequest:n,useRangeHeader:o,forceRangeRequests:i,combineSizeEocd:r,checkResourceChanges:s=!0,maximumRangeSize:l=x1,fetch:c}=a;a=q.assign({},a),delete a.preventHeadRequest,delete a.useRangeHeader,delete a.forceRangeRequests,delete a.combineSizeEocd,delete a.checkResourceChanges,delete a.maximumRangeSize,delete a.useXHR,delete a.fetch,q.assign(e,{url:t,options:a,preventHeadRequest:n,useRangeHeader:o,forceRangeRequests:i,combineSizeEocd:r,checkResourceChanges:s,maximumRangeSize:l,fetch:c})}async function ck(e,t,a){let{url:n,preventHeadRequest:o,useRangeHeader:i,forceRangeRequests:r,combineSizeEocd:s}=e;if(j1(n)&&(i||r)&&(typeof o==hn||o)){let l=await t(Jl,e,Hh(e,s?-65557:void 0)),c=l.headers.get(S1);if(!r&&(!c||c.toLowerCase()!=rk))throw new N(Ia);{let u;s&&l.status==206&&(u=new X(await l.arrayBuffer())),Bh(e,l);let d=dk(l);d===C?await Ww(e,t,a):e.size=d,u&&u.length&&Uh(l)===e.size-u.length&&(e.eocdCache=u)}}else await Ww(e,t,a)}async function uk(e,t,a,n,o){let{useRangeHeader:i,forceRangeRequests:r,eocdCache:s,size:l,options:c}=e;if(i||r){if(t>=l||a===0)return Ce;{if(t+a>l&&(a=l-t),s&&t>=l-s.length){let m=t-(l-s.length);return s.slice(m,m+a)}let u=await n(Jl,e,Hh(e,t,a));if(u.status!=206)throw new N(Ia);let d=Uh(u);if(d!==C&&d!=t)throw new N(Ia);mk(e,u),Bh(e,u);let h=new X(await u.arrayBuffer());if(h.length!=a)throw new N(Ia);return h}}else{let{data:u}=e;return u||await o(e,c),e.data.subarray(t,t+a)}}function I1(e,t,a){let n,o=t,i=0,r=a;return new Ot({start(){return s()},async pull(c){n||await s();let{value:u,done:d}=await n.read();if(d)throw new N(Ia);let h=u.length>i?u.subarray(0,i):u;i-=h.length,r-=h.length,h.length&&c.enqueue(h),i||(await l(),r||c.close())},cancel(c){return n&&n.cancel(c)}});async function s(){let c=ae.min(e.maximumRangeSize,r),u=await Tl(Jl,e,Hh(e,o,c));if(u.status!=206)throw new N(Ia);let d=Uh(u);if(d!==C&&d!=o)throw new N(Ia);mk(e,u),Bh(e,u),o+=c,i=c,n=u.body.getReader()}async function l(){let c=n;n=C,await c.cancel()}}function Uh(e){let t=e.headers.get(ik);if(t){let a=nt(t.trim().split(/[\s-]+/)[1]);if(!nt.isNaN(a))return a}}function dk(e){let t=e.headers.get(ik);if(t){let a=t.trim().split(/\s*\/\s*/)[1];if(a&&a!="*"){let n=nt(a);if(!nt.isNaN(n))return n}}}function hk({headers:e}){return{etag:e.get(T1)||C,lastModified:e.get(C1)||C}}function Bh(e,t){let{checkResourceChanges:a,resourceValidators:n}=e;a&&!n&&t.status==206&&(e.resourceValidators=hk(t))}function mk(e,t){let{checkResourceChanges:a,resourceValidators:n,size:o}=e;if(a){let i=dk(t);if(i!==C&&o!==C&&i!=o)throw new N(Vd);if(n){let r=hk(t);if(q.entries(n).some(([l,c])=>c!==C&&r[l]!==C&&c!=r[l]))throw new N(Vd)}}}function Hh(e,t=0,a=1){return q.assign({},Gh(e),{[A1]:rk+"="+(t<0?t:t+"-"+(t+a-1))})}function Gh({options:e}){let{headers:t}=e;if(t)return Symbol.iterator in t?q.fromEntries(t):t}async function Hw(e){await pk(e,Tl)}async function Gw(e){await pk(e,Jd)}async function pk(e,t){let a=await t(Jl,e,Gh(e));e.data=new X(await a.arrayBuffer()),e.size=e.data.length}async function Ww(e,t,a){if(e.preventHeadRequest)await a(e,e.options);else{let n=await t(R1,e,Gh(e)),o=n.headers.get(E1);o&&!n.headers.get(v1)?e.size=nt(o):await a(e,e.options)}}async function Tl(e,{fetch:t=fetch,options:a,url:n},o){let i=await t(n,q.assign({},a,{method:e,headers:o}));if(i.status>=ek&&i.status<=tk)return i;throw i.status==416?new N(Ia):new N(Fh+(i.statusText||i.status))}function Jd(e,{url:t},a){return new Fe((n,o)=>{let i=new XMLHttpRequest;if(i.addEventListener("load",()=>{if(i.status>=ek&&i.status<=tk){let r=[];i.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach(s=>{let l=s.trim().split(/\s*:\s*/);l[0]=l[0].trim().replace(/^[a-z]|-[a-z]/g,c=>c.toUpperCase()),r.push(l)}),n({status:i.status,arrayBuffer:()=>i.response,headers:new wa(r)})}else o(i.status==416?new N(Ia):new N(Fh+(i.statusText||i.status)))},!1),i.addEventListener("error",r=>o(r.detail?r.detail.error:new N("Network error")),!1),i.open(e,t),a)for(let r of q.entries(a))i.setRequestHeader(r[0],r[1]);i.responseType="arraybuffer",i.send()})}var Cl=class extends ya{constructor(t,a={}){super(),q.assign(this,{url:t,reader:a.useXHR&&!a.fetch?new $d(t,a):new Zd(t,a)})}set size(t){}get size(){return this.reader.size}async init(){await this.reader.init(),super.init()}createReadable(t){return this.reader.createReadable(t)}readUint8Array(t,a){return this.reader.readUint8Array(t,a)}},Qd=class extends Cl{constructor(t,a={}){super(t,q.assign({},a,{useRangeHeader:!0}))}},Er=class extends ya{constructor(t){super(),t=new X(t.buffer,t.byteOffset,t.byteLength),q.assign(this,{array:t,size:t.length})}readUint8Array(t,a){return this.array.slice(t,t+a)}},Jo=class extends yr{constructor(t){super(),this.defaultBufferSize=t||_1}init(t=0){q.assign(this,{offset:0,array:new X(t>0?t:this.defaultBufferSize)}),super.init()}writeUint8Array(t){let a=this,n=a.offset+t.length;if(n>a.array.length){let o=a.array.length?a.array.length*2:a.defaultBufferSize;for(;o<n;)o*=2;let i=a.array;a.array=new X(o),a.array.set(i)}a.array.set(t,a.offset),a.offset+=t.length}getData(){return this.offset===this.array.length?this.array:this.array.slice(0,this.offset)}},Rl=class extends ya{constructor(t){super(),this.readers=t}async init(){let t=this;t.lastDiskNumber=0;let a=t.readers=await Fe.all(t.readers.map(N1));t.diskOffsets=a.map(n=>{let o=t.size;return t.size+=n.size,o}),super.init()}getDiskOffset(t){let{diskOffsets:a,size:n}=this,o=a[t];return o===C?n:o}async readUint8Array(t,a){let n=this,{readers:o}=this,i,r=0,s=t;for(;o[r]&&s>=o[r].size;)s-=o[r].size,r++;let l=o[r];if(l){let c=l.size;if(s+a<=c)i=await We(l,s,a);else{let u=c-s,d=await We(l,s,u),h=await n.readUint8Array(t+u,a-u);i=In(d,h)}}else i=Ce;return n.lastDiskNumber=ae.max(r,n.lastDiskNumber),i}},_l=class extends $o{constructor(t,a=4294967295){super();let n=this;q.assign(n,{diskNumber:0,diskOffset:0,size:0,maxSize:a,availableSize:a});let o,i,r,s=new ba({async write(d){if(d===Bw){r&&await c();return}let{availableSize:h}=n;if(r)d.length>=h?(await l(d.subarray(0,h)),await c(),d.length>h&&await this.write(d.subarray(h))):await l(d);else{let{value:m,done:p}=await t.next();if(p&&!m)throw new N(ak);o=m,o.size=0,o.maxSize&&(n.maxSize=o.maxSize),n.availableSize=n.maxSize,await St(o),i=m.writable,r=i.getWriter(),await this.write(d)}},async close(){r&&(await r.ready,await u())},async abort(d){r&&await r.abort(d)}});q.defineProperty(n,zh,{get(){return s}});async function l(d){let h=d.length;h&&(await r.ready,await r.write(d),o.size+=h,n.availableSize-=h)}async function c(){await u(),n.diskOffset+=o.size,n.diskNumber++,r=null,n.availableSize=n.maxSize}async function u(){await r.close()}}async closeDisk(){let t=this.writable.getWriter();try{await t.ready,await t.write(Bw)}finally{t.releaseLock()}}},so=class{constructor(t){return Dt.isArray(t)&&(t=new Rl(t)),(t instanceof Ot||typeof t.getReader==st)&&(t={readable:oo(t)}),t}},xl=class{constructor(t){t.writable===C&&typeof t.next==st&&(t=new _l(t)),(t instanceof ba||typeof t.getWriter==st)&&(t={writable:B2(t)});try{t.size=t.size===C?0:t.size}catch{throw new N(ok)}return t}};function gk(e){return!!(e&&e.getData)}function j1(e){let{baseURI:t}=mo(),{protocol:a}=new il(e,t);return a=="http:"||a=="https:"}async function St(e,t){if(e.init&&!e.initialized)await e.init(t);else return Fe.resolve()}async function N1(e){return e=new so(e),await St(e),(e.size===C||!e.readUint8Array)&&(e=new Oa(await io(e.readable)),await St(e)),e}function We(e,t,a){return e.readUint8Array(t,a)}function fk(e,t){return e.createReadable?e.createReadable(t):e.readUint8Array?ya.prototype.createReadable.call(e,t):e.readable}function _t(e,t,a){if(!e.some(n=>n.reason==t)){let n={reason:t};a!==C&&(n.filename=a),e.push(n)}}var wk="filename",bk="rawFilename",Wh="comment",yk="rawComment",Vh="uncompressedSize",kk="compressedSize",Ek="offset",vk="diskNumberStart",vr="lastModDate",Ll="rawLastModDate",qh="lastAccessDate",Sk="rawLastAccessDate",Yh="creationDate",Ak="rawCreationDate",Tk="internalFileAttributes",Ck="externalFileAttributes",Rk="msdosAttributesRaw",_k="msdosAttributes",xk="msDosCompatible",Kh="zip64",Lk="encrypted",Ik="version",jk="versionMadeBy",Nk="zipCrypto",Vo="directory",Ok="executable",O1="symlink",Dk="compressionMethod",eh="signature",D1="crc32",Ql="extraField",M1="extraFieldInfoZip",P1="extraFieldUnix",F1="extraFieldUnixType1",z1="extraFieldPkwareUnix",Mk="uid",Pk="gid",Fk="unixMode",zk="setuid",Uk="setgid",Bk="sticky",U1="bitFlag",B1="rawBitFlag",H1="filenameLength",G1="extraFieldLength",W1="unixExternalUpper",V1="filenameUTF8",q1="commentUTF8",Y1="rawExtraField",K1="extraFieldZip64",X1="extraFieldUnicodePath",Z1="extraFieldUnicodeComment",$1="extraFieldAES",J1="extraFieldNTFS",Q1="extraFieldExtendedTimestamp",eL="extraFieldUSDZ",tL=[wk,bk,Vh,kk,vr,Ll,Wh,yk,qh,Sk,Yh,Ak,Ek,vk,Tk,Ck,Rk,_k,xk,Kh,Lk,Ik,jk,Nk,Vo,Ok,O1,Dk,eh,D1,Ql,P1,M1,F1,z1,Mk,Pk,Fk,W1,zk,Uk,Bk,U1,B1,H1,G1,V1,q1,Y1,K1,X1,Z1,$1,J1,Q1,eL],lo=class{constructor(t){tL.forEach(a=>this[a]=t[a])}},aL=new cn([ti,wh,bh,Wl,Ab,Tb,yh,kh,sl,Cb,Rb]);function nL(e){if(e){let t=new wa;if(e.forEach((a,n)=>{aL.has(n)||t.set(n,a.data)}),t.size)return t}}function Xh(e,t,a){return e?t?12:16+a*4:0}var Qn="File format is not recognized",Zh="End of central directory not found",Il="End of Zip64 central directory locator not found",$h="Central directory header not found",Jh="File contains encrypted entry",jl="Encryption method not supported",Nl="Split zip file",Qh="Entry data out of bounds",em="Ambiguous archive",tm="Encrypted central directory is not supported",am="Unsafe filename",nm="Invalid strictness (must be 'strict', 'balanced' or 'tolerant')",om="Invalid filenameValidation (must be 'strict', 'balanced' or 'tolerant')",im="Invalid maxAppendedDataSize (must be a number greater than or equal to 0)",rm="64-bit value exceeds Number.MAX_SAFE_INTEGER",sm="unsorted central directory",lm="unknown version needed to extract",cm="compressed patched data",ec="malformed extra field",um="unknown zip64 extensible data",Ol="wrapped entries count",Dl="appended data",Ml="prepended data",dm="prepended central directory",hm="trailing central directory data",mm="mismatched central directory offset",pm="missing zip64 extra field",gm="duplicate filename",Po="mismatched zip64 end of central directory record",fm="multiple end of central directory records",wm="mismatched local file header (filename)",bm="mismatched local file header (general purpose bit flag)",ym="mismatched local file header (compression method)",tc="mismatched local file header (crc32 or sizes)",oL=63,iL=/^[a-zA-Z]:/,rL=/(^|[\\/])\.\.([\\/]|$)/,Vw="utf-8",sL="UTF8",qw="cp437",Yw=ll|cl|bd|ul,Hk=1,Gk=[[Vh,Re],[kk,Re],[Ek,Re],[vk,le]],Kw={[le]:{getValue:ce,bytes:4},[Re]:{getValue:jt,bytes:8}},lL=vt(nt.MAX_SAFE_INTEGER),cL=64,uL=1032,Xw=0,km=1,Pl=2,Sr=class{constructor(t,a={}){q.assign(this,{reader:new so(t),options:a||{},readRanges:{indexes:new cn,sortedRanges:[],pendingRanges:[]},entriesMissingZip64ExtraField:new WeakSet})}async*getEntriesGenerator(t={}){let a=this,{reader:n}=a;if(await St(n),(n.size===C||!n.readUint8Array)&&(n=new Oa(await io(n.readable)),await St(n)),n.size<Yt)throw new N(Qn);let o=a.warnings=[],i=Em(t,a.options),r=i==ho,s=i!=On,l=Zk(Je(a,t,Bb),i),c=IL(Je(a,t,Xx),i),u=Je(a,t,Zx),{endOfDirectoryInfo:d,endOfDirectoryReachingEndCount:h}=await $k(n,s,l);if(!d)throw await CL(n)?new N(Nl):new N(Zh);s&&h>1&&ol(fm);let m=me(d),p=ce(m,12),g=ce(m,16),w=d.offset,f=pe(m,20),b=w+Yt+f,y=n.size-b;y>l&&ol(Dl),y>0&&_t(o,Dl);let E=pe(m,4),k=n.lastDiskNumber||0,S=pe(m,6),T=pe(m,10),v=0,A,x,_,O,z=Bt,U,K=g==Re||p==Re||T==le||S==le;if(g!=Re&&S!=le&&(g+=Fo(n,S)),K){let be=d.offset>=Rn?await We(n,d.offset-Rn,Rn):Ce,V=me(be);if(be.length==Rn&&ce(V,0)==gh){g=Fo(n,ce(V,4))+jt(V,8);let he=await We(n,g,Bt),Se=me(he);if(he.length<Bt||ce(Se,0)!=ir){let te=d.offset-Rn,He=te-Bt;if(await zl(n,He,ir)||(He=await mL(n,te)),He!==C&&He>=0&&g!=He){let ut=g;g=He,g>ut&&(v=g-ut),he=await We(n,g,Bt),Se=me(he)}}if(he.length<Bt||ce(Se,0)!=ir)throw new N(Il);if(_=!0,O=jt(Se,4)>Bt-12,O){let te=ae.min(jt(Se,4)-(Bt-12),n.size-g-Bt);if(te>0){z+=te;let He=await We(n,g+Bt,te);U=wL(He)}}E==le?E=ce(Se,16):E!=ce(Se,16)&&ea(r,o,Po),S==le?S=ce(Se,20):S!=ce(Se,20)&&ea(r,o,Po),T==le?T=jt(Se,32):T!=jt(Se,32)&&ea(r,o,Po),p==Re?p=jt(Se,40):p!=jt(Se,40)&&ea(r,o,Po),g=Fo(n,S)+jt(Se,48)+v}else if(g==Re||p==Re||S==le)throw new N(Il)}let L=p,D=d.offset-(_?z+Rn:0);if(k!=E)throw new N(Nl);if(g<0)throw new N(Qn);let B=0,W=g<n.size?await We(n,g,p):Ce,Y=me(W);if(p){let be=D-p;if(g!=be&&S==E){let V=W.length>=4&&(ce(Y,B)==sn||!!(U&&U.compressedSize)||id(Y));if(!V&&be<0)throw new N(Qn);let he=!V;if(be>=0&&be+4<=n.size){let Se=await $w(n,be);if(!Se){let te=await hL(n,D),He=te-p;te!==C&&He>=0&&await $w(n,He)&&(be=He,Se=!0)}V&&(he=Se)}if(he&&be!=g){let Se=g;g=be,W=await We(n,g,p),Y=me(W);let te=g-Se,{localHeaderFound:He,shiftedLocalHeaderFound:ut}=await pL(n,W,Y,te);te>0&&!(He&&!ut)?(v+=te,A=V):(ea(r,o,mm),te<0&&!He&&ut&&(v+=te))}}if(W.length<4)throw new N(Qn)}else!T&&g<D&&S==E&&(v+=D-g,g=D);let H=D-g;if(p!=H&&H>=0&&S==E&&(p=H,W=await We(n,g,p),Y=me(W)),g<0||g>=n.size)throw new N(Qn);a.directoryOffset=g,a.directoryLength=L;let Q=ob(a,t,$x),se,de;if(Q&&T&&W.length>=4&&ce(Y,0)!=sn&&(O||id(Y))){let be=fL(U,L,W.length);de=W.subarray(be),W=await Q(W.subarray(0,be),U),Y=me(W),L=W.length,se=!0}U&&!se&&(W.length<4||ce(Y,0)==sn)&&_t(o,um),x=g;let ue=Je(a,t,Ax),Ae=Je(a,t,Tx),j=new cn,De,Ze=-1/0,Me=!r&&!_;!T&&Me&&(T=Zw(Y,W,B),T&&_t(o,Ol));let qe=q.assign({},a.options,t,{[Ub]:i});delete qe[Ob];for(let be=0;be<T;be++){let V=new th(n,qe);if(B+dn>W.length||ce(Y,B)!=sn)throw be==0&&!se&&(O||id(Y))?new N(tm):new N($h);Vk(V,Y,B+6);let he=!!V.bitFlag.languageEncodingFlag,Se=B+dn,He=Se+V.filenameLength+V.extraFieldLength,ut=pe(Y,B+4),Lt=ut>>8==0,da=ut>>8==3,Jt=pe(Y,B+32),_a=He+Jt,wt=new X(W.subarray(Se,_a)),It=wt.subarray(0,V.filenameLength),Ut=wt.subarray(V.filenameLength+V.extraFieldLength),Ke=he||!ue&&Uw(It),it=he||!Ae&&Uw(Ut),en=ce(Y,B+38),Rt=en&Wt,tn={readOnly:!!(Rt&yd),hidden:!!(Rt&kd),system:!!(Rt&Ed),directory:!!(Rt&hl),archive:!!(Rt&vd)},xa=ce(Y,B+42),ha=ob(a,t,Cx)||nl,R=Ke?Vw:ue||qw,M=it?Vw:Ae||qw,G=ha(It,R,Hb);G===C&&(G=nl(It,R));let Te=ha(Ut,M,Gb);Te===C&&(Te=nl(Ut,M)),q.assign(V,{index:be,decryptedDirectory:se,versionMadeBy:ut,msDosCompatible:Lt,zip64:!1,compressedSize:0,uncompressedSize:0,commentLength:Jt,offset:xa,diskNumberStart:pe(Y,B+34),internalFileAttributes:pe(Y,B+36),externalFileAttributes:en,msdosAttributesRaw:Rt,msdosAttributes:tn,rawFilename:It,filenameUTF8:Ke,commentUTF8:it,rawExtraField:wt.subarray(V.filenameLength,V.filenameLength+V.extraFieldLength),rawComment:Ut,filename:G,comment:Te});let Pe;try{Pe=qk(V,V,Y,B+6)}catch(Qe){if(r||Qe.message!=uo)throw Qe;V.zip64ExtraFieldMissing=!0,_t(o,pm,V.filename)}if(G=V.filename,u){let Qe=u(G);Qe!==C&&(G=V.filename=Qe)}if(jL(G,c)){let Qe=new N(am);throw Qe.filename=G,Qe}if(Pe&&_t(o,ec,G),V.zip64ExtraFieldMissing&&V.offset==Re)x=0;else{V.offset+=v;let Qe=Fo(n,V.diskNumberStart)+V.offset;x=ae.min(Qe,x),Qe<Ze&&_t(o,sm,G),Ze=Qe}(V.version&Wt)>oL&&_t(o,lm,G),(V.rawBitFlag&ww)==ww&&_t(o,cm,G),j.has(V.filename)&&(De=!0),j.add(V.filename);let Ee=V.externalFileAttributes>>16&le;V.unixMode===C&&(Ee&(Qs|sr|rr))!=0&&(V.unixMode=Ee);let rt=!!(V.unixMode&Sd),I=!!(V.unixMode&Ad),F=!!(V.unixMode&Td),ve=((V.unixMode===C?Ee:V.unixMode)&Uo)==_b,Ue=V.unixMode!==C&&(V.unixMode&Uo)==rr,La=(Ee&Uo)==rr,er=Ue||La||Lt&&tn.directory||V.filename.endsWith(Bo),td=!ve&&!er&&(V.unixMode!==C?(V.unixMode&sr)!=0:da&&(Ee&sr)!=0);q.assign(V,{setuid:rt,setgid:I,sticky:F,symlink:ve,unixExternalUpper:Ee,executable:td,directory:er,zipCrypto:V.encrypted&&!V.extraFieldAES});let Qt=new lo(V);if(V.zip64ExtraFieldMissing&&a.entriesMissingZip64ExtraField.add(Qt),Qt.getData=(Qe,Ys)=>V.getData(Qe,Qt,a,Ys),Qt.arrayBuffer=async Qe=>{let Ys=new Xe,uw=io(Ys.readable).then(ix=>ix.arrayBuffer());return uw.catch(()=>{}),await V.getData(Ys,Qt,a,q.assign({},Qe,{preventClose:!1})),uw},B=_a,be==T-1&&Me){let Qe=Zw(Y,W,B);Qe&&(T+=Qe,_t(o,Ol))}let{onprogress:Jn}=t;if(Jn)try{await Jn(be+1,T,new lo(V))}catch{}yield Qt}let $=B,Ie=rd(W.subarray(B))||(se?rd(de):C);if(!Ie&&!se){let be=g+B,V=ae.min(D-be,6+le);V>=6&&(Ie=rd(await We(n,be,V)))}Ie&&(a.digitalSignature=Ie,$=B+6+Ie.length),(B!=L&&$!=L||!se&&B!=p&&$!=p)&&ea(r,o,hm),De&&ea(r,o,gm);let at=Je(a,t,Rx),we=Je(a,t,_x),je=(r||at)&&T&&x==Ln&&await RL(n)?Ln:0;return r&&(v>0||T&&x>je)&&ol(Ml),(v>0||T&&x>Ln)&&_t(o,Ml),A&&_t(o,dm),at&&(a.prependedData=x>je?await We(n,je,x-je):Ce),a.comment=f?await We(n,w+Yt,f):Ce,we&&(a.appendedData=b<n.size?await We(n,b,n.size-b):Ce),!0}async getEntries(t={}){let a=[];for await(let n of this.getEntriesGenerator(t))a.push(n);return a}async close(){let{reader:t}=this;!t.readUint8Array&&t.readable&&!t.readable.locked&&await t.readable.cancel()}[Lb](){return this.close()}},Fl=class{constructor(t={}){let a,{readable:n,writable:o}=new Xe({start(l){a=l}}),i=new Sr(n,t),r=i.getEntriesGenerator(),s=new cn;this.readable=new Ot({async pull(l){let{done:c,value:u}=await r.next();if(c)return l.close();let d=dL(u,s),h={...u,readable:d.readable};delete h.getData,q.defineProperties(h,{localDirectory:{get:()=>u.localDirectory,enumerable:!0},warnings:{get:()=>u.warnings,enumerable:!0}}),l.enqueue(h)},async cancel(l){let c=Dt.from(s);s.clear(),a.error(l),await Fe.allSettled(c.map(u=>u.cancel(l))),await Fe.allSettled([r.return(),i.close()])}}),this.writable=o}};function dL(e,t){let{readable:a,writable:n}=new Xe,o,i={cancel:async s=>{t.delete(i),await(o?o.cancel(s):a.cancel(s))}};return i.readable=new Ot({async pull(s){o||(o=a.getReader(),t.add(i),r());let{done:l,value:c}=await o.read();l?s.close():s.enqueue(c)},cancel:s=>i.cancel(s)},{highWaterMark:0}),i;async function r(){try{await e.getData(n,{preventClose:!1})}catch(s){try{await n.abort(s)}catch{}}finally{t.delete(i)}}}async function Wk(e,t={}){if(e=new so(e),await St(e),(e.size===C||!e.readUint8Array)&&(e=new Oa(await io(e.readable)),await St(e)),e.size<Yt)return!1;let a=Em(t,{}),n=a!=On,o=Zk(t[Bb],a),{endOfDirectoryInfo:i,endOfDirectoryReachingEndCount:r}=await $k(e,n,o);if(!i||a==ho&&r>1)return!1;let s=pe(me(i),20),l=i.offset+Yt+s;return e.size-l<=o}var th=class{constructor(t,a){q.assign(this,{reader:t,options:a})}async getData(t,a,n,o={}){let i=this,{readRanges:r,directoryOffset:s}=n;if(i.zip64ExtraFieldMissing)throw new N(uo);let l=mo(),{reader:c,index:u,offset:d,diskNumberStart:h,extraFieldAES:m,extraFieldZip64:p,compressionMethod:g,bitFlag:w,rawBitFlag:f,crc32:b,rawLastModDate:y,uncompressedSize:E,compressedSize:k}=i,{dataDescriptor:S}=w,T=a.localDirectory={},v=a.warnings=[],A=Fo(c,h)+d,x=await We(c,A,Gt),_=me(x),O=Je(i,o,Ib),z=Je(i,o,jb),U=Ah(Je(i,o,vh)),K=!!U,L=U===!0;if($b(O,z),O=O&&O.length?O:C,z=z&&z.length?z:C,m&&m.originalCompressionMethod!=xr)throw new N(Xo);if(x.length<Gt||ce(_,0)!=hr)throw new N(Vl);Vk(T,_,4);let{extraFieldLength:D,filenameLength:B}=T,W=T.dataOffset=A+Gt+B+D,Y=Je(i,o,jx),H=Em(o,i.options),Q=xL(Y,H),se=Je(i,o,Nx),de=LL(se===C?Y:se,H),ue=Ce;if(de&&(B||D)){let Ke=await We(c,A+Gt,B+D);ue=Ke.subarray(0,B),T.rawExtraField=Ke.subarray(B)}else T.rawExtraField=D?await We(c,A+Gt+B,D):Ce;de&&(T.rawFilename=ue),qk(i,T,_,4,!0)&&_t(v,ec),OL(i,T,ue,de,Q?C:v);let{lastAccessDate:Ae,creationDate:j,uid:De,gid:Ze}=T;Ae&&a.lastAccessDate===C&&(a.lastAccessDate=Ae),j&&a.creationDate===C&&(a.creationDate=j),De!==C&&a.uid===C&&(a.uid=De),Ze!==C&&a.gid===C&&(a.gid=Ze);let Me=Je(i,o,xx),qe=i.encrypted&&(!L||Me),$=qe&&!m;if(L||(a.zipCrypto=$),qe&&(i.rawBitFlag&bd)==bd)throw new N(jl);let Ie=K?C:jy(g);if(g!=un&&g!=ei&&g!=dr&&!Ie&&!K)throw new N(Xo);if(qe){if(!$&&(m.strength<1||m.strength>3))throw new N(jl);if(!O&&!z)throw new N(Jh)}if(W+k>ae.min(c.size,s))throw new N(Qh);let at=k,we=Zb(Je(i,o,Nb));gl(we);let je=Je(i,o,Ix),be=Je(i,o,Lx);be&&(je=!0);let{onstart:V,onprogress:he,onend:Se}=o,te=g!=un&&!K,He=K?k-Xh(qe,$,m&&m.strength):E,ut=g==dr,Lt=Je(i,o,Mb);ut&&(Lt=!1);let da=Je(i,o,Dx),Jt=(da===C?Je(i,o,Ox):da)&&!K&&(!qe||$||m&&m.vendorVersion==Hk),_a={options:{codecType:Vy,password:O,rawPassword:z,zipCrypto:$,encryptionStrength:m&&m.strength,checkCrc32:Jt,checkAuthenticationCode:Je(i,o,Mx),passwordVerification:$&&(S?y>>>8&Wt:b>>>24&Wt),outputSize:He,crc32:b,compressed:te,encrypted:qe,useWebWorkers:Je(i,o,Db),useCompressionStream:Lt,deflate64:ut,format:Ie?Ie.format:C,codecURI:Ie?Ie.codecURI:C,compressionMethod:g,rawBitFlag:f,checkPasswordOnly:Me},config:l,streamOptions:{signal:we,size:at,onstart:V,onprogress:he,onend:Se}};je&&(await vL({reader:c,fileEntry:a,index:u,offset:A,crc32:b,compressedSize:k,uncompressedSize:E,dataOffset:W,dataDescriptor:S||T.bitFlag.dataDescriptor,extraFieldZip64:p||T.extraFieldZip64,readRanges:r}),DL(i,T,Q?C:v));let wt,It,Ut;try{if(!be){Me&&(t=new ba),t=new xl(t),await St(t,_L(He,k,te)),{writable:wt}=t;let Ke=oo(c.createReadable({offset:W,size:at})),{outputSize:it}=await Xy({readable:Ke,writable:wt},_a);if(gl(we),it!=He)throw q.assign(new N(Zo),{outputSize:it});t.size+=it}}catch(Ke){if(fa(Ke)&&Ke.outputSize!==C&&(t.size+=Ke.outputSize),!Me||!fa(Ke)||Ke.message!=xh)throw It=Ke,Ut=!0,Ke}finally{if(!(!gk(t)&&Je(i,o,Pb))&&wt&&!wt.locked){let it=wt.getWriter();if(Ut)try{await it.abort(It)}catch{}else await it.close()}}return Me||be?C:t.getData?t.getData():wt}};function id(e){return e.byteLength>=4&&ce(e,0)==dx}function Zw(e,t,a){let n=0;for(;a+dn<=t.length&&ce(e,a)==sn;)a+=dn+pe(e,a+28)+pe(e,a+30)+pe(e,a+32),n++;return n%(le+1)?0:n}function $w(e,t){return zl(e,t,sn)}async function zl(e,t,a){if(t<0||t+4>e.size)return!1;let n=await We(e,t,4);return ce(me(n),0)==a}async function hL(e,t){let a=ae.max(0,t-(6+le)),n=await We(e,a,t-a),o=me(n);for(let i=n.length-6;i>=0;i--)if(ce(o,i)==ph&&i+6+pe(o,i+4)==n.length)return a+i}async function mL(e,t){let a=ae.max(0,t-(Bt+le)),n=await We(e,a,t-a),o=me(n);for(let i=n.length-Bt;i>=0;i--)if(ce(o,i)==ir&&i+12+nt(o.getBigUint64(i+4,!0))==n.length)return a+i}async function pL(e,t,a,n){let o={localHeaderFound:!1,shiftedLocalHeaderFound:!1},i=0;for(;i+dn<=t.length&&ce(a,i)==sn;){let r=gL(t,a,i);if(r!==C){let s=await zl(e,r,hr),l=await zl(e,r+n,hr);if(i||(o={localHeaderFound:s,shiftedLocalHeaderFound:l}),s!=l)return{localHeaderFound:s,shiftedLocalHeaderFound:l}}i+=dn+pe(a,i+28)+pe(a,i+30)+pe(a,i+32)}return o}function gL(e,t,a){let n=ce(t,a+42);if(n!=Re)return n;let o=a+dn+pe(t,a+28),i=ae.min(o+pe(t,a+30),e.length);for(;o+4<=i;){let r=pe(t,o),s=pe(t,o+2);if(r==ti){let l=o+4;return ce(t,a+24)==Re&&(l+=8),ce(t,a+20)==Re&&(l+=8),l+8<=i?jt(t,l):C}o+=4+s}return C}function rd(e){if(e.length>=6){let t=me(e);if(ce(t,0)==ph){let a=pe(t,4);if(6+a<=e.length)return new X(e.subarray(6,6+a))}}}function fL(e,t,a){let n=e&&e.compressedSize?e.compressedSize:t;return n>0&&n<=a?n:a}function wL(e){let t={rawExtensibleData:e};if(e.length>=28){let a=me(e),n=pe(a,26);q.assign(t,{compressionMethod:pe(a,0),compressedSize:jt(a,2),uncompressedSize:jt(a,10),encryptionAlgorithm:pe(a,18),bitLength:pe(a,20),flags:pe(a,22),hashAlgorithm:pe(a,24),hashData:e.subarray(28,28+n)})}return t}function Vk(e,t,a){let n=e.rawBitFlag=pe(t,a+2),o=(n&ll)==ll,i=ce(t,a+6);q.assign(e,{encrypted:o,version:pe(t,a),bitFlag:{level:(n&hx)>>1,dataDescriptor:(n&cl)==cl,languageEncodingFlag:(n&ul)==ul},rawLastModDate:i,lastModDate:ML(i),filenameLength:pe(t,a+22),extraFieldLength:pe(t,a+24)})}function qk(e,t,a,n,o){let{rawExtraField:i}=t,r=t.extraField=new wa,s=me(i),l=0,c=!1;try{for(;l<i.length;){let v=pe(s,l),A=pe(s,l+2);r.set(v,{type:v,data:i.slice(l+4,l+4+A)}),l+=4+A}}catch{c=!0}l>i.length&&(c=!0);let u=pe(a,n+4);q.assign(t,{signature:ce(a,n+pr),crc32:ce(a,n+pr),compressedSize:ce(a,n+Ir),uncompressedSize:ce(a,n+jr)});let d=r.get(ti),h;d?(bL(d,t,o)||(c=!0),t.extraFieldZip64=d):Gk.some(([v,A])=>t[v]==A)&&(o?c=!0:h=!0);let m=r.get(Ab);m&&(Jw(m,wk,bk,t,e),t.extraFieldUnicodePath=m);let p=r.get(Tb);p&&(Jw(p,Wh,yk,t,e),t.extraFieldUnicodeComment=p);let g=r.get(wh);g&&(u==xr||t.encrypted)&&g.data.length>=7?(yL(g,t,u),t.extraFieldAES=g):(g&&(c=!0),t.compressionMethod=u);let w=r.get(Rb);w&&(Qw(w,t),t.extraFieldPkwareUnix=w);let f=r.get(Cb);f&&(Qw(f,t),t.extraFieldUnixType1=f);let b=r.get(Wl);b&&(EL(b,t,o),t.extraFieldExtendedTimestamp=b);let y=r.get(bh);y&&(kL(y,t),t.extraFieldNTFS=y);let E=r.get(kh),k;E&&(k=eb(E,t,!0),t.extraFieldInfoZip=E);let S=r.get(sl);S&&(eb(S,k?{}:t,!1),t.extraFieldUnix=S);let T=r.get(yh);if(T&&(t.extraFieldUSDZ=T),h)throw new N(uo);return c}function bL(e,t,a){t.zip64=!0;let n=me(e.data),o=Gk.filter(([s,l])=>t[s]==l),i=o.reduce((s,[,l])=>s+Kw[l].bytes,0);if(e.data.length<i){if(a)return!1;throw new N(uo)}let r=[];try{for(let s=0,l=0;s<o.length;s++){let[,c]=o[s],u=Kw[c];r.push(u.getValue(n,l)),l+=u.bytes}}catch(s){if(a)return!1;throw s}return o.forEach(([s],l)=>{t[s]=e[s]=r[l]}),!0}function Jw(e,t,a,n,o){if(e.data.length<5){e.valid=!1;return}let i=me(e.data),r=new no;r.append(o[a]);let s=me(new X(4));s.setUint32(0,r.get(),!0);let l=ce(i,1),c=jn(i,0);q.assign(e,{version:c,[t]:nl(e.data.subarray(5)),valid:c==1&&!o.bitFlag.languageEncodingFlag&&l==ce(s,0)}),e.valid&&(n[t]=e[t],n[t+sL]=!0)}function yL(e,t,a){let n=me(e.data),o=jn(n,4);q.assign(e,{vendorVersion:jn(n,0),vendorId:jn(n,2),strength:o,originalCompressionMethod:a,compressionMethod:pe(n,5)}),t.compressionMethod=e.compressionMethod,e.vendorVersion!=Hk&&(t.crc32=C)}function kL(e,t){let a=me(e.data),n=4,o;try{for(;n<e.data.length&&!o;){let i=pe(a,n),r=pe(a,n+2);i==Sb&&(o=e.data.slice(n+4,n+4+r)),n+=4+r}}catch{}if(o&&o.length==24){let i=me(o),r=i.getBigUint64(0,!0),s=i.getBigUint64(8,!0),l=i.getBigUint64(16,!0);q.assign(e,{rawLastModDate:r,rawLastAccessDate:s,rawCreationDate:l});let c=ld(r),u=ld(s),d=ld(l),h={lastModDate:c,lastAccessDate:u,creationDate:d};q.assign(e,h),q.assign(t,h,{rawLastAccessDate:s,rawCreationDate:l})}}function Qw(e,t){if(e.data.length<8)return;let a=me(e.data),n=new ta((ce(a,0)|0)*1e3),o=new ta((ce(a,4)|0)*1e3),i={lastAccessDate:n,lastModDate:o};e.data.length>=12&&(i.uid=pe(a,8),i.gid=pe(a,10)),q.assign(e,i),q.assign(t,i)}function eb(e,t,a){try{let n=me(e.data),o,i;if(a){let r=0,s=jn(n,r++),l=jn(n,r++);o=tb(e.data.subarray(r,r+l)),r+=l;let c=jn(n,r++);i=tb(e.data.subarray(r,r+c)),q.assign(e,{version:s,uid:o,gid:i})}else e.data.length>=4&&(o=pe(n,0),i=pe(n,2),q.assign(e,{uid:o,gid:i}));return o!==C&&(t.uid=o),i!==C&&(t.gid=i),o!==C||i!==C}catch{}}function tb(e){let t=new X(4);return t.set(e,0),new pa(t.buffer,t.byteOffset,4).getUint32(0,!0)}function EL(e,t,a){if(!e.data.length)return;let n=me(e.data),o=jn(n,0),i=[],r=[];a?((o&1)==1&&(i.push(vr),r.push(Ll)),(o&2)==2&&(i.push(qh),r.push(Sk)),(o&4)==4&&(i.push(Yh),r.push(Ak))):e.data.length>=5&&(i.push(vr),r.push(Ll));let s=1;i.forEach((l,c)=>{if(e.data.length>=s+4){let u=ce(n,s);t[l]=e[l]=new ta((u|0)*1e3);let d=r[c];e[d]=u}s+=4})}async function vL({reader:e,fileEntry:t,index:a,offset:n,crc32:o,compressedSize:i,uncompressedSize:r,dataOffset:s,dataDescriptor:l,extraFieldZip64:c,readRanges:u}){let d=0;if(l){let w=!!c,f=await Yk(e,s+i,{crc32:o,compressedSize:i,uncompressedSize:r,zip64:w});f?(t.localDirectory.dataDescriptor=f,d=Ul(f.zip64,f.signature)):d=Ul(w,!1)}let h={start:n,end:s+i+d,fileEntry:t},{indexes:m,sortedRanges:p,pendingRanges:g}=u;if(!m.has(a)){let w=SL(p,h)||g.find(f=>ah(h,f));if(w){let f=new N(ql);throw f.overlappingEntry=w.fileEntry,f}m.add(a),g.push(h),g.length*g.length>p.length&&(g.sort((f,b)=>f.start-b.start),u.sortedRanges=AL(p,g),g.length=0)}}function SL(e,t){let a=0,n=e.length;for(;a<n;){let r=a+n>>>1;e[r].start<t.start?a=r+1:n=r}let o=e[a-1],i=e[a];if(o&&ah(t,o))return o;if(i&&ah(t,i))return i}function ah(e,t){return e.start<t.end&&t.start<e.end}function AL(e,t){let a=[],n=0,o=0;for(;n<e.length||o<t.length;)o==t.length||n<e.length&&e[n].start<t[o].start?a.push(e[n++]):a.push(t[o++]);return a}async function Yk(e,t,{crc32:a,compressedSize:n,uncompressedSize:o,zip64:i}){let r=fh+mr,s=ae.min(r,ae.max(0,e.size-t)),l=s?await We(e,t,s):Ce,c=me(l),u=[[i,!0],[i,!1],[!i,!0],[!i,!1]].map(([d,h])=>sd(c,d,h)).filter(d=>d&&d.compressedSize==n&&d.uncompressedSize==o);return u.find(d=>d.crc32==a)||u[0]||sd(c,i,!0)||sd(c,i,!1)}async function TL(e,t,{crc32:a,compressedSize:n,uncompressedSize:o,extraFieldZip64:i}){let r=await Yk(e,t,{crc32:a,compressedSize:n,uncompressedSize:o,zip64:!!i});if(r&&r.compressedSize==n&&r.uncompressedSize==o)return Ul(r.zip64,r.signature)}function sd(e,t,a){let n=a?mr:0;if(e.byteLength<Ul(t,a)||a&&ce(e,0)!=kb)return C;let o=ce(e,n),i,r;try{t?(i=jt(e,n+4),r=jt(e,n+12)):(i=ce(e,n+4),r=ce(e,n+8))}catch{return C}return{signature:a,zip64:t,crc32:o,compressedSize:i,uncompressedSize:r}}function Ul(e,t){return(e?fh:vb)+(t?mr:0)}function Fo(e,t){return e.getDiskOffset?e.getDiskOffset(t):0}async function CL(e){return await Kk(e)==Lr}async function RL(e){let t=await Kk(e);return t==Lr||t==ux}async function Kk(e){let t=await We(e,0,Ln);return ce(me(t))}function Xk(e){return e===ho||e===Sh||e===On}function _L(e,t,a){return ae.min(e,a?t*uL:t)}function Em(e,t){return ab(e,ab(t,Sh))}function ab(e,t){let a=e[Ub];if(a!==C){if(!Xk(a))throw new N(nm);return a}let n=e[Ob];return n===C?t:n?ho:t==On?On:Sh}function xL(e,t){return e===C?t!=On:!!e}function LL(e,t){return e===C?t==ho:!!e}function IL(e,t){if(e===C)return t;if(!Xk(e))throw new N(om);return e}function jL(e,t){if(t==On)return!1;let a=e.split("/");return a.length>1&&a[a.length-1]===""&&a.pop(),rL.test(e)||e.startsWith("/")||e.startsWith("\\")||iL.test(e)?!0:t==ho&&(a.includes(".")||a.includes("")||e.includes("\0"))}function Zk(e,t){if(e!==C){let a=Nr(e);if(typeof a!=Sx||nt.isNaN(a)||a<0)throw new N(im);return a}return t==ho?0:t==On?1/0:le}async function $k(e,t,a){let{size:n}=e,o=ae.min(n,Yt+le),i={remaining:cL},r,s,l=0;for await(let[c,u,d,h,m]of Jk(e,o)){let p=pe(c,h+20);if(m+Yt+p==n){let g=await Qk(e,c,u,h,m,n,i);if(g==Pl){if(r||(r=nh(d,h,m)),l++,!t||l>1)break}else g==km&&!s&&(s=nh(d,h,m))}}return r||(r=s),r||(r=await NL(e,a,i)),{endOfDirectoryInfo:r,endOfDirectoryReachingEndCount:l}}async function NL(e,t,a){let{size:n}=e,o=ae.min(n,t==1/0?n:Yt+le+t),i,r;for await(let[s,l,c,u,d]of Jk(e,o)){let h=nh(c,u,d);i||(i=h);let m=await Qk(e,s,l,u,d,n,a);if(m==Pl)return h;m==km&&!r&&(r=h)}return r||i}async function*Jk(e,t){let a=e.size-t,n=await We(e,a,t),o=me(n);for(let i=n.length-Yt;i>=0;i--)ce(o,i)==Eb&&(yield[o,a,n,i,a+i])}function nh(e,t,a){return{offset:a,buffer:new X(e.subarray(t,t+Yt)).buffer}}async function Qk(e,t,a,n,o,i,r){let s=pe(t,n+10),l=ce(t,n+12),c=ce(t,n+16);if(s==le||l==Re||c==Re)return await nb(e,t,a,o-Rn,i,r)==gh?Pl:Xw;if(!s&&!l)return km;let u=pe(t,n+6);for(let d of[o-l,Fo(e,u)+c])if(await nb(e,t,a,d,i,r)==sn)return Pl;return Xw}async function nb(e,t,a,n,o,i){if(n<0||n+4>o)return C;if(n>=a)return ce(t,n-a);if(i.remaining>0){i.remaining--;let r=await We(e,n,4);return ce(me(r),0)}return C}function OL(e,t,a,n,o){let{rawFilename:i}=e,r=!o,s=e.decryptedDirectory&&(t.rawBitFlag&dl)==dl;n&&!s&&(a.length!=i.length||a.some((l,c)=>l!=i[c]))&&ea(r,o,wm),(t.rawBitFlag&Yw)!=(e.rawBitFlag&Yw)&&ea(r,o,bm),t.compressionMethod!=e.compressionMethod&&ea(r,o,ym),!t.bitFlag.dataDescriptor&&!s&&(t.crc32||t.compressedSize||t.uncompressedSize)&&(t.crc32!=e.crc32||t.compressedSize!=e.compressedSize||t.uncompressedSize!=e.uncompressedSize)&&ea(r,o,tc)}function DL(e,t,a){let{dataDescriptor:n}=t,o=e.decryptedDirectory&&(t.rawBitFlag&dl)==dl;n&&!o&&(e.crc32!==C&&n.crc32!=e.crc32||n.compressedSize!=e.compressedSize||n.uncompressedSize!=e.uncompressedSize)&&ea(!a,a,tc)}function ea(e,t,a){e?ol(a):_t(t,a)}function ol(e){let t=new N(em);throw t.reason=e,t}function Je(e,t,a){return t[a]===C?e.options[a]:t[a]}function ob(e,t,a){return Yl(Je(e,t,a))}function ML(e){let t=(e&4294901760)>>16,a=e&le,n=new ta(1980+((t&65024)>>9),((t&480)>>5)-1,t&31,(a&63488)>>11,(a&2016)>>5,(a&31)*2,0);return n<Yo?Yo:n}function ld(e){return new ta(nt(e/vt(1e4)-vt(116444736e5)))}function jn(e,t){return e.getUint8(t)}function pe(e,t){return e.getUint16(t,!0)}function ce(e,t){return e.getUint32(t,!0)}function jt(e,t){let a=e.getBigUint64(t,!0);if(a>lL)throw new N(rm);return nt(a)}var PL=q.freeze({__proto__:null,ERR_AMBIGUOUS_ARCHIVE:em,ERR_BAD_FORMAT:Qn,ERR_CENTRAL_DIRECTORY_NOT_FOUND:$h,ERR_CODEC_OUT_OF_MEMORY:Xl,ERR_ENCRYPTED:Jh,ERR_ENCRYPTED_CENTRAL_DIRECTORY:tm,ERR_ENTRY_DATA_OUT_OF_BOUNDS:Qh,ERR_EOCDR_LOCATOR_ZIP64_NOT_FOUND:Il,ERR_EOCDR_NOT_FOUND:Zh,ERR_EXTRAFIELD_ZIP64_NOT_FOUND:uo,ERR_INVALID_AUTHENTICATION_CODE:_h,ERR_INVALID_COMPRESSED_DATA:jh,ERR_INVALID_CRC32:Zl,ERR_INVALID_FILENAME_VALIDATION:om,ERR_INVALID_MAX_APPENDED_DATA_SIZE:im,ERR_INVALID_PASSWORD:Kl,ERR_INVALID_STRICTNESS:nm,ERR_INVALID_UNCOMPRESSED_SIZE:Zo,ERR_LOCAL_FILE_HEADER_NOT_FOUND:Vl,ERR_OVERLAPPING_ENTRY:ql,ERR_SPLIT_ZIP_FILE:Nl,ERR_UNSAFE_FILENAME:am,ERR_UNSUPPORTED_COMPRESSION:Xo,ERR_UNSUPPORTED_ENCRYPTION:jl,ERR_UNSUPPORTED_UINT64:rm,ERR_WORKER_STARTUP_TIMEOUT:$l,WARNING_APPENDED_DATA:Dl,WARNING_COMPRESSED_PATCHED_DATA:cm,WARNING_DUPLICATE_FILENAME:gm,WARNING_MALFORMED_EXTRA_FIELD:ec,WARNING_MISMATCHED_CENTRAL_DIRECTORY_OFFSET:mm,WARNING_MISMATCHED_LOCAL_FILE_HEADER_BIT_FLAG:bm,WARNING_MISMATCHED_LOCAL_FILE_HEADER_COMPRESSION_METHOD:ym,WARNING_MISMATCHED_LOCAL_FILE_HEADER_CRC32_OR_SIZES:tc,WARNING_MISMATCHED_LOCAL_FILE_HEADER_FILENAME:wm,WARNING_MISMATCHED_ZIP64_END_OF_CENTRAL_DIRECTORY:Po,WARNING_MISSING_ZIP64_EXTRA_FIELD:pm,WARNING_MULTIPLE_END_OF_CENTRAL_DIRECTORY:fm,WARNING_PREPENDED_CENTRAL_DIRECTORY:dm,WARNING_PREPENDED_DATA:Ml,WARNING_TRAILING_CENTRAL_DIRECTORY_DATA:hm,WARNING_UNKNOWN_VERSION:lm,WARNING_UNKNOWN_ZIP64_EXTENSIBLE_DATA:um,WARNING_UNSORTED_CENTRAL_DIRECTORY:sm,WARNING_WRAPPED_ENTRIES_COUNT:Ol,ZipReader:Sr,ZipReaderStream:Fl,getEntryDataDescriptorLength:TL,isZipFile:Wk}),vm="File already exists",Sm="Zip file comment exceeds 64KB",eE="Invalid zip file comment (must be a Uint8Array)",tE="File entry comment exceeds 64KB",aE="Invalid file entry comment (must be a string)",nE="Invalid date (must be a valid Date instance)",oE="File entry name exceeds 64KB",Am="Version exceeds 65535",iE="The strength must equal 1, 2, or 3",rE="Encryption is not supported in USDZ files",sE="Split zip files are not supported in USDZ files",lE="Encryption is not supported when the 'passThrough' option is set to true (use 'compressed' instead)",cE="Invalid extra field (must be a Map)",uE="Invalid extra field type (must be integer 0..65535)",dE="Invalid extra field data (must be a Uint8Array)",ac="Extra field data exceeds 64KB",hE=-2147483648,mE=2147483647,ib=vt(0),rb=vt("0x7fffffffffffffff"),nc="Zip64 is not supported (set the 'zip64' option to 'true')",pE="Undefined uncompressed size",gE="Undefined compression method",fE="Undefined CRC32",FL="Undetermined size",wE="Undefined reader",bE="Invalid reader (must be a Reader instance, a ReadableStream instance, or an object with a 'readable' property)",yE="Zip file not empty",kE="Invalid uid (must be integer 0..2^32-1)",EE="Invalid gid (must be integer 0..2^32-1)",vE="Invalid UNIX mode (must be integer 0..65535)",SE="Invalid unixExtraFieldType (must be 'infozip' or 'unix')",AE="uid/gid must be 0..65535 for unixExtraFieldType 'unix' (use 'infozip' for larger ids)",TE="Invalid msdosAttributesRaw (must be integer 0..255)",CE="Invalid msdosAttributes (must be an object with boolean flags)",RE="Invalid level (must be integer 0..9)",_E="Signature data exceeds 64KB",xE="Invalid entry option (must be an entry returned by ZipReader#getEntries())",LE="The last modification date of an entry encrypted with ZipCrypto cannot be changed when passThrough is set",IE="compression unavailable",jE="clamped last modification date",sb=new X([7,0,2,0,65,69,3,0,0]),zL=4,UL=9,BL=67,HL=32,GL=126,WL=1,Bl="infozip",Hl="unix",VL=[8,9,5,3],qL=9,cd=0,lb=[],co=class{constructor(t,a={}){t=new xl(t);let{availableSize:n=Oo,maxSize:o=Oo}=t,i=n>0&&n!==Oo&&o>0&&o!==Oo;if(i&&a[Ko])throw new N(sE);q.assign(this,{writer:t,addSplitZipSignature:i,options:a,fileEntries:new wa,filenames:new cn,offset:a[Ks]===C?t.size||t.writable.size||0:a[Ks],initialOffset:a[Ks]===C?0:a[Ks]-(t.size||t.writable.size||0),pendingAddFileCalls:new cn,pendingErrors:[],warnings:[],bufferedWrites:0,directWrites:0,lastFileEntry:C,archiveClosed:!1})}prependZip(t){return ud(this,KL(this,t))}appendZip(t,a={}){return ud(this,NE(this,t,a))}add(t="",a,n={}){let o=this,{pendingAddFileCalls:i}=o,r=XL(o,t,a,n);i.add(r);let s=()=>i.delete(r);return Fe.prototype.then.call(r,s,s),ud(o,r)}remove(t){let{filenames:a,fileEntries:n}=this;if(typeof t==Nn&&(t=n.get(t)),t&&t.filename!==C){let{filename:o}=t;if(a.has(o)&&n.has(o))return a.delete(o),n.delete(o),!0}return!1}async close(t=Ce,a={}){let n=this,{pendingAddFileCalls:o,writer:i}=this,{writable:r}=i;if(n.archiveClosed)return cb(i);if(!(t instanceof X))throw new N(eE);if(ke(t)>le)throw new N(Sm);for(;o.size;)await Fe.allSettled(Dt.from(o));await Fe.allSettled(n.pendingErrors.map(c=>c.recorded));let s=n.pendingErrors.filter(c=>c.failed&&!c.observed);if(s.length){let c=s.map(d=>d.error);s.forEach(d=>d.observed=!0);let[u]=c;try{u.entryErrors=c}catch{}throw u}return await uI(n,t,a),n.archiveClosed=!0,!gk(i)&&ye(n,a,Pb)||await r.getWriter().close(),cb(i)}[Lb](){return this.close()}},oh=class{constructor(t={}){let{readable:a,writable:n}=new Xe;this.readable=a,this.zipWriter=new co(n,t),this.pendingAddFileCalls=new cn}transform(t){let a=this.zipWriter,n,{readable:o,writable:i}=new Xe({start(s){n=s},flush:()=>{r()}});return ub(this,this.zipWriter.add(t,o),s=>n.error(s)),{readable:this.readable,writable:i};async function r(){try{await a.close()}catch(s){await dd(a,s)}}}writable(t){let a,{readable:n,writable:o}=new Xe({start(i){a=i}});return ub(this,this.zipWriter.add(t,n),i=>a.error(i)),o}async close(t=C,a={}){let{zipWriter:n}=this,i=(await Fe.allSettled(Dt.from(this.pendingAddFileCalls))).filter(r=>r.status=="rejected").map(r=>r.reason);if(i.length){let[r]=i;try{r.entryErrors=i}catch{}throw await dd(n,r),r}try{return await n.close(t,a)}catch(r){throw await dd(n,r),r}}},ih=class extends Fe{then(t,a){let{watcher:n}=this;return n&&(n.observed=!0),super.then(t,a)}};function cb(e){return e.getData?e.getData():e.writable}function ud(e,t){let a=new ih((o,i)=>Fe.prototype.then.call(t,o,i)),n={};return a.watcher=n,n.recorded=Fe.prototype.then.call(a,C,o=>q.assign(n,{failed:!0,error:o})),e.pendingErrors.push(n),a}async function NE(e,t,a={}){let{pendingAddFileCalls:n,filenames:o,fileEntries:i}=e,r=Yl(a.filter),s=e2(a.readerOptions);for(;n.size;)await Fe.allSettled(Dt.from(n));let l,c=new Fe(h=>l=h);n.add(c);let u=[],d;try{t=new so(t),await St(t),(t.size===C||!t.readUint8Array)&&(t=new Oa(await io(t.readable)),await St(t));let{ZipReader:h,getEntryDataDescriptorLength:m}=await Fe.resolve().then(function(){return PL}),p=new h(t,s),g=[],w;try{w=await p.getEntries();for(let k of w)(!r||await r(k,YL(i,k.filename)))&&g.push(k)}finally{await p.close()}await St(e.writer);let{directoryOffset:f,entriesMissingZip64ExtraField:b}=p;g.forEach(k=>{let{filename:S}=k;if(b.has(k))throw new N(uo);if(o.has(S))throw new N(vm);o.add(S),u.push(S)}),e.writerLocked=!0;let{lockWriter:y}=e;e.lockWriter=new Fe(k=>d=()=>{e.writerLocked=!1,k()}),await y,e.addSplitZipSignature&&(delete e.addSplitZipSignature,(r||!await gI(t))&&(await Da(e.writer,DE()),e.offset+=Ln));let E=await fI(e,t,w,g,f,!!r,m);g.forEach(k=>{let{version:S,rawLastModDate:T,rawFilename:v,rawBitFlag:A,uncompressedSize:x,compressedSize:_,extraFieldZip64:O}=k,{compressionMethod:z,rawExtraField:U}=k;U=OE(U||Ce),k.extraFieldAES&&(z=xr);let K=ke(U),L=!!O&&O.uncompressedSize!==C,D=!!O&&O.compressedSize!==C,{headerArray:B,headerView:W}=FE({version:S,bitFlag:A,compressionMethod:z,uncompressedSize:x,compressedSize:_,rawLastModDate:T,rawFilename:v,zip64CompressedSize:D,zip64UncompressedSize:L,extraFieldLength:K}),{crc32:Y}=k;Y!==C&&bt(W,pr,Y);let{offset:H,diskNumberStart:Q}=E.get(k);i.set(k.filename,q.assign({},k,{zip64Enabled:!0,zip64UncompressedSize:L,zip64CompressedSize:D,offset:H,diskNumberStart:Q,zip64DiskNumberStart:!1,rawExtraFieldZip64:Ce,rawExtraFieldAES:Ce,rawExtraFieldExtendedTimestamp:Ce,rawExtraFieldNTFS:Ce,rawExtraFieldUnix:Ce,rawCentralExtraFieldUnix:Ce,rawExtraField:U,rawCentralExtraField:Ce,headerArray:B,headerView:W}))})}catch(h){throw u.forEach(m=>o.delete(m)),h}finally{l(),n.delete(c),d&&d()}}function YL(e,t){let a=e.get(t);return a?new lo(a):C}async function KL(e,t){if(e.filenames.size)throw new N(yE);await NE(e,t)}async function XL(e,t,a,n){n=q.assign({},n);let o=n[kw];if(o!==C){let{entryOptions:i,passThroughOptions:r}=$L(o,Ah(ye(e,n,vh)),ye(e,n,vr));delete n[kw],n=q.assign(i,r,n)}if(ye(e,n,Vo)&&!t.endsWith(Bo)&&(t+=Bo),e.filenames.has(t))throw new N(vm);e.filenames.add(t),cd<mo().maxWorkers?cd++:await new Fe(i=>lb.push(i));try{return await ZL(e,t,a,n)}catch(i){throw e.filenames.delete(t),i}finally{let i=lb.shift();i?i():cd--}}async function dd(e,t){try{await e.writer.writable.abort(t)}catch{}}function ub(e,t,a){e.pendingAddFileCalls.add(t),t.catch(n=>{try{a(n)}catch{}})}async function ZL(e,t,a,n){let o=QL(e,t,n);({name:t}=o);let i=eI(e,t,n),{comment:r}=i,s=n[Ql];e.fileEntries.set(t,C);let l=e.lastFileEntry,c={},u;i.resolvedOptions.keepOrder&&(c.lockFileEntry=new Fe(h=>u=h)),e.lastFileEntry=c;let d;try{let{resolvedOptions:h}=i;h.level!=0&&h.compressionMethod===C&&!h.passThroughCompression&&!await o1(mo())&&(h.level=0,_t(e.warnings,IE,t));let m=await tI(e,a,i,n);({reader:a}=m);let p=Ar(e.writer),g=ln(e.writer),w=n.crc32===C?n[eh]:n.crc32,f=m.resolvedOptions.encrypted&&!h.zipCrypto;if(h.passThroughCompression&&!h.passThroughEncryption&&f&&(w=C),h.passThroughCompression&&a&&!f&&w===C)throw new N(fE);n=q.assign({},n,o.resolvedOptions,i.resolvedOptions,m.resolvedOptions,{signature:n[eh],crc32:w,offset:e.offset-p,diskNumberStart:g,[Ko]:e.options[Ko]});let b=iI(n);b.lastModDateClamped&&_t(e.warnings,jE,t);let y=sI(n),E=ke(b.localHeaderArray,y.dataDescriptorArray);d=await nI(e,t,a,{headerInfo:b,dataDescriptorInfo:y,metadataSize:E,fileEntry:c,previousFileEntry:l,releaseLockFileEntry:u},n)}catch(h){throw e.fileEntries.delete(t),h}finally{u&&u(l&&l.lockFileEntry)}return q.assign(d,{name:t,comment:r,extraField:s}),new lo(d)}function $L(e,t,a){if(e===null||typeof e!=Eh||Dt.isArray(e))throw new N(xE);let{externalFileAttributes:n,versionMadeBy:o,comment:i,lastModDate:r,rawLastModDate:s,creationDate:l,lastAccessDate:c,uncompressedSize:u,encrypted:d,zipCrypto:h,crc32:m,compressionMethod:p,extraFieldAES:g,extraFieldUnix:w,internalFileAttributes:f,extraField:b,bitFlag:y,directory:E,uid:k,gid:S}=e,T={externalFileAttributes:n,versionMadeBy:o,comment:i,lastModDate:r,creationDate:l,lastAccessDate:c,internalFileAttributes:f,directory:E};y&&y.languageEncodingFlag&&(T[Fb]=!0);let v=nL(b);v&&(T[Ql]=v),(k!==C||S!==C)&&q.assign(T,{uid:k,gid:S,unixExtraFieldType:w?Hl:Bl});let A={};if(t&&!E){if(q.assign(A,{uncompressedSize:u,crc32:m,compressionMethod:p}),t!==Rd&&q.assign(A,{encrypted:d,zipCrypto:h,encryptionStrength:g?g.strength:C}),y&&(A.dataDescriptor=y.dataDescriptor,A[Cd]=VL[y.level]),a===C)A.rawLastModDate=s;else if(t!==Rd&&h&&(!y||y.dataDescriptor)&&a instanceof ta&&JL(a)!=(s>>>8&Wt))throw new N(LE)}return{entryOptions:T,passThroughOptions:A}}function JL(e){let t=new ta(ae.ceil(ae.floor(e.getTime()/1e3)/2)*2e3);return t<Yo?t=Yo:t>pl&&(t=pl),(t.getHours()<<3|t.getMinutes()>>3)&Wt}function QL(e,t,a){let n=ye(e,a,xk),o=ye(e,a,jk,n?yx:yw),i=ye(e,a,Ok),r=zo(e,a,Mk),s=zo(e,a,Pk),l=zo(e,a,Fk),c=ye(e,a,qx),u=ye(e,a,zk),d=ye(e,a,Uk),h=ye(e,a,Bk);if(nr(r,Re,kE),nr(s,Re,EE),nr(l,le,vE),c!==C&&c!==Bl&&c!==Hl)throw new N(SE);if(c===Hl&&(r!==C&&r>le||s!==C&&s>le))throw new N(AE);c===C&&(r!==C||s!==C)&&(c=Bl);let m=zo(e,a,Rk),p=ye(e,a,_k),g=r!==C||s!==C||l!==C||c||i,w=m!==C||p!==C;if(g?(n=!1,o=o&Wt|yw):w&&(n=!0,o=o&Wt),nr(m,Wt,TE),p&&(typeof p!==Eh||Dt.isArray(p)))throw new N(CE);if(o>le)throw new N(Am);let f=ye(e,a,Ck),b=f!==C;b||(f=0),!a[Vo]&&t.endsWith(Bo)&&(a[Vo]=!0);let y=ye(e,a,Vo);if(y?(t.endsWith(Bo)||(t+=Bo),b||(f=hl,n||(f|=(rr|sr|Qs)<<16))):!n&&!b&&(i?f=(sr|Qs)<<16:f=Qs<<16),!n){let S=l!==C||!!(u||d||h),T=f>>16&le;l=l===C?T:l&le,u?l|=Sd:u=!!(l&Sd),d?l|=Ad:d=!!(l&Ad),h?l|=Td:h=!!(l&Td),(!b||S)&&(y?l=l&~Uo|rr:l&Uo||(l|=fx),f=(l&le)<<16|f&le)}({msdosAttributesRaw:m,msdosAttributes:p}=rI(m,p)),w&&(f=f&Re|m&Wt);let E=f>>16&le,k=l!==C&&(l&Uo)==_b;return{name:t,resolvedOptions:{versionMadeBy:o,msDosCompatible:!!n,externalFileAttributes:f,unixExternalUpper:E,uid:r,gid:s,unixMode:l,unixExtraFieldType:c,symlink:k,setuid:u,setgid:d,sticky:h,msdosAttributesRaw:m,msdosAttributes:p}}}function eI(e,t,a){let n=rh(e,a,Vx)||el,o=n(t,Hb);if(o===C&&(o=el(t)),ke(o)>le)throw new N(oE);let i=a[Wh]||"";if(typeof i!=Nn)throw new N(aE);let r=n(i,Gb);if(r===C&&(r=el(i)),ke(r)>le)throw new N(tE);let s=ye(e,a,Ik);if(s!==C&&s>le)throw new N(Am);let l=pd(e,a,vr,new ta),c=ye(e,a,Ll),u=pd(e,a,qh),d=pd(e,a,Yh),h=ye(e,a,Tk,0),m=Ah(ye(e,a,vh)),p=!!m,g=m===!0,w=ye(e,a,Ib),f=ye(e,a,jb);$b(w,f),w=w&&w.length?w:C,f=f&&f.length?f:C;let b=zo(e,a,Px,3),y=ye(e,a,Nk),E=ye(e,a,Fx,!0),k=ye(e,a,zx),S=ye(e,a,Ux,!0),T=ye(e,a,Db),v=ye(e,a,Bx),A=rh(e,a,Hx),x=ye(e,a,Gx,!0),_=Zb(ye(e,a,Nb));gl(_);let O=ye(e,a,Fb,!fb(o)||!fb(r)),z=ye(e,a,Dk),U=p||z===C?C:jy(z);if(!p&&z!==C&&z!==un&&z!==ei&&!U)throw new N(Xo);let K=zo(e,a,Cd);if(nr(K,qL,RE),e.options[Ko]){if(w!==C||f!==C)throw new N(rE);K===C&&z===C&&(K=0)}p&&(K=Nr(a[Cd]));let L=ye(e,a,Mb),D=ye(e,a,zb);v&&D===C&&(D=!1),(D===C||y&&!g)&&(D=!0),K!==C&&K!=6&&(L=!1);let B=ye(e,a,Kh);if(!y&&(w!==C||f!==C)&&!(nt.isInteger(b)&&b>=1&&b<=3))throw new N(iE);let W=hd(a[Ql]),Y=hd(a[Yx]),H=hd(a[Kx]);return{comment:i,resolvedOptions:{rawFilename:o,rawComment:r,version:s,lastModDate:l,rawLastModDate:c,lastAccessDate:u,creationDate:d,internalFileAttributes:h,passThroughCompression:p,passThroughEncryption:g,password:w,rawPassword:f,encryptionStrength:b,zipCrypto:y,extendedTimestamp:E,ntfsTimestamp:k,keepOrder:S,useWebWorkers:T,bufferedWrite:v,createTempStream:A,dataDescriptorSignature:x,signal:_,useUnicodeFileNames:O,compressionMethod:z,format:U?U.format:C,codecURI:U?U.codecURI:C,codecVersionNeeded:U?U.versionNeeded:C,level:K,useCompressionStream:L,dataDescriptor:D,zip64:B,rawExtraField:W,rawLocalExtraField:Y,rawCentralExtraField:H}}}function hd(e){if(!e)return Ce;if(!(e instanceof wa))throw new N(cE);let t=0,a=0;e.forEach((i,r)=>{if(Jb(r,le,uE),!(i instanceof X))throw new N(dE);if(ke(i)>le)throw new N(ac);t+=4+ke(i)});let n=new X(t),o=me(n);return e.forEach((i,r)=>{ja(o,a,r),ja(o,a+2,ke(i)),Rr(n,i,a+4),a+=4+ke(i)}),n}async function tI(e,t,{resolvedOptions:a},n){if(a.passThroughCompression&&!t&&!ye(e,n,Vo))throw new N(wE);let o;if(t){if(t=new so(t),await St(t),!t.readUint8Array&&!t.readable)throw new N(bE);({size:o}=t)}return q.assign({reader:t},aI(e,!!t,o,a,n))}function aI(e,t,a,n,o){let{passThroughCompression:i,passThroughEncryption:r,zipCrypto:s,password:l,rawPassword:c,encryptionStrength:u}=n,{dataDescriptor:d,zip64:h,level:m,compressionMethod:p}=n,g=0,w=0,f=!1;if(i&&t){if(w=o[Vh],w===C)throw new N(pE);if(p===C)throw new N(gE)}let b=h===!0,y=ye(e,o,Lk);if(t&&r&&!y&&ke(l,c))throw new N(lE);let E=t&&(!!(l&&ke(l)||c&&ke(c))||r&&y);t||(m=0,p=un);let k=Xh(E,s,u);t&&(i?(o.uncompressedSize=w,g=a===C?gb(w)+k:a+(r?0:k)):a===C?(d=!0,(h||h===C)&&(h=f=!0,g=Re+1)):(o.uncompressedSize=w=a,g=(sh(p,m)?gb(w):w)+k));let S=!E&&(!t||a===0&&!i)&&!sh(p,m);S&&ye(e,o,zb)===C&&(d=!1);let T=b||f||w>=Re,v=b||g>=Re;if(T||v){if(h===!1)throw new N(nc);h=!0}return h=h||!1,{maximumCompressedSize:g,resolvedOptions:{dataDescriptor:d,emptyEntry:S,zip64:h,zip64Enabled:b,unknownSize:f,zip64UncompressedSize:T,zip64CompressedSize:v,uncompressedSize:w,level:m,compressionMethod:p,encrypted:E}}}async function nI(e,t,a,n,o){let{fileEntries:i,writer:r}=e,{keepOrder:s,dataDescriptor:l,emptyEntry:c,signal:u}=o,{headerInfo:d,fileEntry:h,previousFileEntry:m,releaseLockFileEntry:p}=n,g=e.options[Ko],w=h,f,b,y,E,k,S,T=0,v,A=s&&m?m.lockFileEntry:C;i.set(t,w);try{o.bufferedWrite||!s||e.writerLocked||e.bufferedWrites||e.directWrites||!l&&!c?(f=!0,e.bufferedWrites++,o.createTempStream?v=await o.createTempStream():v=new Xe(C,C,{highWaterMark:Oo}),v.size=0,await St(r)):(b=!0,e.directWrites++,v=r,await A,await x()),await St(v);let O=Ar(r);e.addSplitZipSignature&&!f&&await mb(e,r),g&&!f&&db(n,e.offset-O);let{localHeaderArray:z}=d;f||await _();let U=ln(r),K=Tr(e,r);if(w.diskNumberStart=U,f||(k=!0,S=r.size,await Da(v,z)),w=await oI(a,v,w,n,mo(),o),f||(k=!1),i.set(t,w),w.filename=t,f){if(await Fe.all([v.writable.getWriter().close(),A]),await x(),e.addSplitZipSignature&&await mb(e,r),E=!0,S=r.size,await _(),w.diskNumberStart=ln(r),w.offset=Tr(e,r),g){let L=n.metadataSize;db(n,e.offset-Ar(r)),w.size+=n.metadataSize-L}cI(w,d.localHeaderView,o),await Da(r,d.localHeaderArray),await ME(v.readable,r,u,L=>T+=L),r.size+=v.size,E=!1}else w.diskNumberStart=U,w.offset=K;return e.offset+=w.size,w}catch(O){if(E||k){if(e.hasCorruptedEntries=!0,O)try{O.corruptedEntry=!0}catch{}e.offset+=r.size-S,f&&(e.offset+=T)}throw i.delete(t),O}finally{if(f&&e.bufferedWrites--,b&&e.directWrites--,p&&p(A),y&&y(),f&&v&&v.dispose)try{await v.dispose()}catch{}}async function x(){e.writerLocked=!0;let{lockWriter:O}=e;e.lockWriter=new Fe(z=>y=()=>{e.writerLocked=!1,z()}),await O}async function _(){Qo(r,ke(d.localHeaderArray))&&await r.closeDisk()}}async function oI(e,t,{diskNumberStart:a,lockFileEntry:n},o,i,r){let{headerInfo:s,dataDescriptorInfo:l,metadataSize:c}=o,{headerArray:u,headerView:d,lastModDate:h,rawLastModDate:m,encrypted:p,compressed:g,version:w,compressionMethod:f,rawExtraFieldZip64:b,localExtraFieldZip64Length:y,rawExtraFieldExtendedTimestamp:E,extraFieldExtendedTimestampFlag:k,extraFieldExtendedTimestampTime:S,rawExtraFieldNTFS:T,rawExtraFieldUnix:v,rawCentralExtraFieldUnix:A,rawExtraFieldAES:x}=s,{dataDescriptorArray:_}=l,{rawFilename:O,lastAccessDate:z,creationDate:U,password:K,rawPassword:L,level:D,useUnicodeFileNames:B,zip64:W,zip64Enabled:Y,zip64UncompressedSize:H,zip64CompressedSize:Q,zipCrypto:se,dataDescriptor:de,directory:ue,executable:Ae,versionMadeBy:j,rawComment:De,rawExtraField:Ze,rawCentralExtraField:Me,useWebWorkers:qe,onstart:$,onprogress:Ie,onend:at,signal:we,encryptionStrength:je,extendedTimestamp:be,msDosCompatible:V,internalFileAttributes:he,externalFileAttributes:Se,uid:te,gid:He,unixMode:ut,symlink:Lt,setuid:da,setgid:Jt,sticky:_a,unixExternalUpper:wt,msdosAttributesRaw:It,msdosAttributes:Ut,useCompressionStream:Ke,passThroughCompression:it,passThroughEncryption:en,format:Rt,codecURI:tn}=r,xa={lockFileEntry:n,versionMadeBy:j,zip64:W,zip64Enabled:Y,directory:!!ue,executable:!!Ae,filenameUTF8:!!B,rawFilename:O,commentUTF8:!!B,rawComment:De,rawExtraFieldZip64:b,localExtraFieldZip64Length:y,rawExtraFieldExtendedTimestamp:E,rawExtraFieldNTFS:T,rawExtraFieldUnix:v,rawCentralExtraFieldUnix:A,rawExtraFieldAES:x,rawExtraField:Ze,rawCentralExtraField:Me,extendedTimestamp:be,msDosCompatible:V,internalFileAttributes:he,externalFileAttributes:Se,diskNumberStart:a,uid:te,gid:He,unixMode:ut,symlink:!!Lt,setuid:da,setgid:Jt,sticky:_a,unixExternalUpper:wt,msdosAttributesRaw:It,msdosAttributes:Ut},{crc32:ha,uncompressedSize:R}=r,M=0;it||(R=0);let{writable:G}=t;if(e){let Te=e.size,Pe=oo(fk(e,{size:Te})),Ee={options:{codecType:Oh,inputSize:Te,level:D,rawPassword:L,password:K,encryptionStrength:je,zipCrypto:p&&se,passwordVerification:p&&se&&m>>8&Wt,computeCrc32:!it,compressed:g&&!it,encrypted:p&&!en,useWebWorkers:qe,useCompressionStream:Ke,format:Rt,codecURI:tn,compressionMethod:f},config:i,streamOptions:{signal:we,size:Te,onstart:$,onprogress:Ie,onend:at}};try{let rt=await Xy({readable:Pe,writable:G},Ee);if(M=rt.outputSize,t.size+=M,gl(we),it||(R=rt.inputSize,(!p||se)&&(ha=rt.crc32)),!Q&&M>=Re||!H&&R>=Re)throw new N(nc)}catch(rt){let{outputSize:I}=Ee;throw I!==C?t.size+=I:fa(rt)&&rt.outputSize!==C&&(t.size+=rt.outputSize),rt}}return lI({crc32:ha,compressedSize:M,uncompressedSize:R,headerInfo:s,dataDescriptorInfo:l},r),de&&await Da(t,_),q.assign(xa,{uncompressedSize:R,compressedSize:M,lastModDate:h,rawLastModDate:m,creationDate:U,lastAccessDate:z,encrypted:!!p,zipCrypto:!!se,size:c+M,compressionMethod:f,version:w,headerArray:u,headerView:d,signature:ha,crc32:p&&!se&&!it?C:ha,extraFieldExtendedTimestampFlag:k,extraFieldExtendedTimestampTime:S,zip64UncompressedSize:H,zip64CompressedSize:Q}),xa}function iI(e){let{rawFilename:t,lastModDate:a,rawLastModDate:n,lastAccessDate:o,creationDate:i,level:r,zip64:s,zipCrypto:l,useUnicodeFileNames:c,dataDescriptor:u,directory:d,rawExtraField:h,rawLocalExtraField:m,encryptionStrength:p,extendedTimestamp:g,ntfsTimestamp:w,passThroughCompression:f,encrypted:b,zip64UncompressedSize:y,zip64CompressedSize:E,uncompressedSize:k,unknownSize:S,crc32:T}=e,{version:v,compressionMethod:A}=e,x=!d&&sh(A,r),_,O=f||!x,z=s&&(e.bufferedWrite||!u||!y&&!E||O&&!S),U=z||s&&u&&(y||E);if(s&&(y||E)){let je=Nt(20);if(je.writeUint16(ti),je.writeUint16(16),_=je.array,z&&(je.writeUint64(k),O)){let be=Xh(b,l,p);je.writeUint64(f?0:k+be)}}else _=Ce;let K;if(b&&!l){let we=Nt(ke(sb)+2);we.writeUint16(wh),we.writeBytes(sb),K=we.array,K[8]=p}else K=Ce;let L,D,B,W;if(g){let we=$s(a),je=yI(we);if(je){let V=9+(o?4:0)+(i?4:0),he=Nt(V);B=1+(o?2:0)+(i?4:0),W=we,he.writeUint16(Wl),he.writeUint16(V-4),he.writeUint8(B),he.writeUint32(we),o&&he.writeUint32(pb($s(o))),i&&he.writeUint32(pb($s(i))),D=he.array}else D=Ce;if(w===C?!je||!!(o||i):w)try{let V=md(a),he=Nt(36);he.writeUint16(bh),he.writeUint16(32),he.skip(4),he.writeUint16(Sb),he.writeUint16(24),he.writeUint64(V),he.writeUint64(o?md(o):V),he.writeUint64(i?md(i):V),L=he.array}catch{L=Ce}else L=Ce}else L=D=Ce;let Y,H;try{let{uid:we,gid:je,unixExtraFieldType:be}=e;if(be==Bl&&(we!==C||je!==C)){let V=hb(we===C?0:we),he=hb(je===C?0:je),Se=3+V.length+he.length,te=Nt(4+Se);te.writeUint16(kh),te.writeUint16(Se),te.writeUint8(1),te.writeUint8(V.length),te.writeBytes(V),te.writeUint8(he.length),te.writeBytes(he),Y=H=te.array}else if(be==Hl&&(we!==C||je!==C)){let V=Nt(8);V.writeUint16(sl),V.writeUint16(4),V.writeUint16((we===C?0:we)&le),V.writeUint16((je===C?0:je)&le),Y=V.array;let he=Nt(4);he.writeUint16(sl),he.writeUint16(0),H=he.array}else Y=H=Ce}catch{Y=H=Ce}A===C&&(A=x?ei:un),v===C&&(v=A==un&&!d&&!b?wx:bx);let{codecVersionNeeded:Q}=e;x&&Q!==C&&(v=v>Q?v:Q),s&&(v=v>ml?v:ml),b&&!l&&(v=v>bw?v:bw,f&&T!==C&&(K[zL]=WL),ja(me(K),UL,A),A=xr);let se=U?ke(_):0,de=se+ke(K,D,L,Y,h,m),ue=e[Ko]?BL:0;if(de+ue>le)throw new N(ac);let Ae=new ta(ae.ceil(ae.floor(a.getTime()/1e3)/2)*2e3),j=Ae<Yo?Yo:Ae>pl?pl:Ae,De=ke(D)?new ta($s(a)*1e3):ke(L)?a:j,{headerArray:Ze,headerView:Me,rawLastModDate:qe}=FE({version:v,bitFlag:EI(r,c,u,b,A),compressionMethod:A,uncompressedSize:k,lastModDate:j,rawLastModDate:n,rawFilename:t,zip64CompressedSize:E,zip64UncompressedSize:y,extraFieldLength:de}),$=Nt(Gt+ke(t)+de),Ie=$.array,at=me(Ie);return $.writeUint32(hr),$.writeBytes(Ze),$.writeBytes(t),U&&$.writeBytes(_),$.writeBytes(K),$.writeBytes(D),$.writeBytes(L),$.writeBytes(Y),$.writeBytes(h),$.writeBytes(m),u&&(E||bt(at,Ir+eo,0),y||bt(at,jr+eo,0)),{localHeaderArray:Ie,localHeaderView:at,headerArray:Ze,headerView:Me,lastModDate:De,lastModDateClamped:De===j&&Ae.getTime()!=j.getTime(),rawLastModDate:qe,encrypted:b,compressed:x,version:v,compressionMethod:A,extraFieldExtendedTimestampFlag:B,extraFieldExtendedTimestampTime:W,rawExtraFieldZip64:Ce,localExtraFieldZip64Length:se,rawExtraFieldExtendedTimestamp:D,rawExtraFieldNTFS:L,rawExtraFieldUnix:Y,rawCentralExtraFieldUnix:H,rawExtraFieldAES:K,extraFieldLength:de}}function db(e,t){let{headerInfo:a}=e,{localHeaderArray:n,extraFieldLength:o}=a,i=64-(t+ke(n))%64;i<4&&(i+=64);let r=new X(i),s=me(r);ja(s,0,yh),ja(s,2,i-4);let l=n;a.localHeaderArray=n=new X(ke(l)+i),Rr(n,l),Rr(n,r,ke(l));let c=me(n);ja(c,28,o+i),a.localHeaderView=c,e.metadataSize+=i}function hb(e){let t=new X(4);me(t).setUint32(0,e,!0);let n=4;for(;n>1&&t[n-1]===0;)n--;return t.subarray(0,n)}function rI(e,t){if(e!==C)e=e&Wt;else if(t!==C){let{readOnly:a,hidden:n,system:o,directory:i,archive:r}=t,s=0;a&&(s|=yd),n&&(s|=kd),o&&(s|=Ed),i&&(s|=hl),r&&(s|=vd),e=s&Wt}return t===C&&(t={readOnly:!!(e&yd),hidden:!!(e&kd),system:!!(e&Ed),directory:!!(e&hl),archive:!!(e&vd)}),{msdosAttributesRaw:e,msdosAttributes:t}}function sI({zip64:e,dataDescriptor:t,dataDescriptorSignature:a}){let n=Ce,o,i=0,r=e?fh:vb;return a&&(r+=mr),t&&(n=new X(r),o=me(n),a&&(i=mr,bt(o,0,kb))),{dataDescriptorArray:n,dataDescriptorView:o,dataDescriptorOffset:i}}function lI({crc32:e,compressedSize:t,uncompressedSize:a,headerInfo:n,dataDescriptorInfo:o},{zip64:i,zipCrypto:r,passThroughCompression:s,dataDescriptor:l}){let{headerView:c,encrypted:u}=n,{dataDescriptorView:d,dataDescriptorOffset:h}=o;(!u||r||s)&&e!==C&&(bt(c,pr,e),l&&bt(d,h,e)),i?l&&(Cr(d,h+4,vt(t)),Cr(d,h+12,vt(a))):(bt(c,Ir,t),bt(c,jr,a),l&&(bt(d,h+4,t),bt(d,h+8,a)))}function cI({rawFilename:e,encrypted:t,zip64:a,localExtraFieldZip64Length:n,crc32:o,compressedSize:i,uncompressedSize:r,zip64UncompressedSize:s,zip64CompressedSize:l},c,{dataDescriptor:u,passThroughCompression:d}){if(u||((!t||d&&o!==C)&&bt(c,pr+eo,o),l||bt(c,Ir+eo,i),s||bt(c,jr+eo,r)),a&&n){let h=Gt+ke(e)+4;Cr(c,h,vt(r)),Cr(c,h+8,vt(i))}}async function uI(e,t,a){let{directoryDataLength:n,zip64Entries:o}=dI(e.fileEntries),{directoryStart:i,directoryEnd:r,directoryArray:s}=await hI(e,n,a),l=await mI(e,s,a);await pI(e,t,a,{directoryStart:i,directoryEnd:r,directoryDataLength:n,signatureLength:l,zip64Entries:o})}function dI(e){let t=0,a=!1;for(let[,n]of e){let{rawFilename:o,rawExtraFieldAES:i,rawComment:r,rawExtraFieldNTFS:s,rawCentralExtraFieldUnix:l,rawExtraField:c,rawCentralExtraField:u,extraFieldExtendedTimestampFlag:d,extraFieldExtendedTimestampTime:h,zip64Enabled:m,uncompressedSize:p,compressedSize:g}=n,{zip64UncompressedSize:w,zip64CompressedSize:f}=n;m||(w&&p<Re&&(w=n.zip64UncompressedSize=!1),f&&g<Re&&(f=n.zip64CompressedSize=!1)),a=a||w||f;let b=n.offset>=Re,y=n.diskNumberStart>=le,E;if(b||y||w||f){let T=4+(w?8:0)+(f?8:0)+(b?8:0)+(y?4:0),v=Nt(T);v.writeUint16(ti),v.writeUint16(T-4),w&&v.writeUint64(p),f&&v.writeUint64(g),b&&v.writeUint64(n.offset),y&&v.writeUint32(n.diskNumberStart),E=v.array}else E=Ce;n.rawExtraFieldZip64=E,n.zip64Offset=b,n.zip64DiskNumberStart=y;let k;if(h===C)k=Ce;else{let T=Nt(9);T.writeUint16(Wl),T.writeUint16(5),T.writeUint8(d),T.writeUint32(h),k=T.array}n.rawExtraFieldExtendedTimestamp=k;let S=ke(E,i,s,l,k,c,u);if(S>le)throw new N(ac);t+=dn+ke(o,r)+S}return{directoryDataLength:t,zip64Entries:a}}async function hI(e,t,a){let{fileEntries:n,writer:o}=e,i=new X(t);await St(o);let r=0,s=0,l=ln(o),c=Ar(o),u=0;for(let[d,h]of Dt.from(n.values()).entries()){let{offset:m,rawFilename:p,rawExtraFieldZip64:g,rawExtraFieldAES:w,rawExtraFieldExtendedTimestamp:f,rawExtraFieldNTFS:b,rawCentralExtraFieldUnix:y,rawExtraField:E,rawCentralExtraField:k,rawComment:S,versionMadeBy:T,headerArray:v,headerView:A,zip64UncompressedSize:x,zip64CompressedSize:_,zip64DiskNumberStart:O,zip64Offset:z,internalFileAttributes:U,externalFileAttributes:K,diskNumberStart:L,uncompressedSize:D,compressedSize:B}=h,W=ke(g,w,f,b,y,E,k),Y=dn+ke(p,S)+W;Qo(o,r+Y-s)&&(await Da(o,i.slice(s,r)),s=r,u=0,await o.closeDisk()),d==0&&(l=ln(o),c=Ar(o)),x||bt(A,jr,D),_||bt(A,Ir,B),(z||O)&&h.version<ml&&ja(A,kx,ml);let H=Nt(Y);if(H.writeUint32(sn),H.writeUint16(T),H.writeBytes(v.subarray(0,Gt-4-2)),H.writeUint16(W),H.writeUint16(ke(S)),H.writeUint16(O?le:L),H.writeUint16(U),H.writeUint32(K),H.writeUint32(z?Re:m),H.writeBytes(p),H.writeBytes(g),H.writeBytes(w),H.writeBytes(f),H.writeBytes(b),H.writeBytes(y),H.writeBytes(E),H.writeBytes(k),H.writeBytes(S),Rr(i,H.array,r),r+=Y,u++,a.onprogress)try{await a.onprogress(d+1,n.size,new lo(h))}catch{}}return await Da(o,s?i.slice(s):i),{directoryStart:{diskNumber:l,diskOffset:c},directoryEnd:{diskNumber:ln(o),entriesLength:u},directoryArray:i}}async function mI(e,t,a){let n=rh(e,a,Jx);if(n){let o=await n(t),i=ke(o);if(i>le)throw new N(_E);let r=Nt(6+i);r.writeUint32(ph),r.writeUint16(i),r.writeBytes(o);let{writer:s}=e;return Qo(s,ke(r.array))&&await s.closeDisk(),await Da(s,r.array),6+i}return 0}async function pI(e,t,a,n){let{writer:o}=e,{directoryStart:i,directoryEnd:r,signatureLength:s,zip64Entries:l}=n,{directoryDataLength:c}=n,u=e.fileEntries.size,d=i.diskNumber,h=Tr(e,i),m=ke(t);if(m>le)throw new N(Sm);let p=ye(e,a,Kh),g=ln(o);if(Qo(o,(p?fw:Yt)+m)&&g++,h>=Re||c>=Re||u>=le||g>=le){if(p===!1)throw new N(nc);p=!0}else p===C&&l&&(p=!0);let w=Nt(p?fw:Yt);Qo(o,ke(w.array)+m)&&await o.closeDisk(),g=ln(o);let f=g==r.diskNumber?r.entriesLength:0;p&&(w.writeUint32(ir),w.writeUint64(44),w.writeUint16(45),w.writeUint16(45),w.writeUint32(g),w.writeUint32(d),w.writeUint64(f),w.writeUint64(u),w.writeUint64(c),w.writeUint64(h),w.writeUint32(gh),w.writeUint32(g),w.writeUint64(vt(Tr(e,o))+vt(c)+vt(s)),w.writeUint32(g+1),ye(e,a,Wx,!0)&&(g=le,d=le),f=le,u=le,h=Re,c=Re),w.writeUint32(Eb),w.writeUint16(g),w.writeUint16(d),w.writeUint16(f),w.writeUint16(u),w.writeUint32(c),w.writeUint32(h),w.writeUint16(m),await Da(o,w.array),m&&await Da(o,t)}function Nt(e){let t=new X(e),a=me(t),n=0;return{array:t,writeUint8:o=>{kI(a,n,o),n+=1},writeUint16:o=>{ja(a,n,o),n+=2},writeUint32:o=>{bt(a,n,o),n+=4},writeUint64:o=>{Cr(a,n,vt(o)),n+=8},writeBytes:o=>{Rr(t,o,n),n+=ke(o)},skip:o=>n+=o}}function ln(e){let{diskNumber:t=0}=e;return t}function Ar(e){let{diskOffset:t=0}=e;return t}function Qo(e,t){let{availableSize:a=Oo}=e;return t>a}function Tr(e,{diskNumber:t=0,diskOffset:a=0}){return e.offset-a-(t?e.initialOffset:0)}async function gI(e){let t=await We(e,0,Ln);return PE(me(t),0)==Lr}function OE(e){let t=me(e),a=0;for(;a+4<=ke(e);){let n=4+Gl(t,a+2);if(Gl(t,a)==ti)return OE(In(e.subarray(0,a),e.subarray(ae.min(a+n,ke(e)))));a+=n}return e}async function fI(e,t,a,n,o,i,r){let{writer:s}=e,l=new wa;if(s.closeDisk||i){let c=Dt.from(a).sort((g,w)=>xn(t,g)-xn(t,w)),u=wI(t,c,o),d=new cn(n),h=new wa;for(let g=0;g<c.length;g++){let w=c[g];if(d.has(w)){let f=xn(t,w),b=await bI(t,f);if(b===C)throw new N(Vl);let y=f+b+w.compressedSize;if(w.bitFlag.dataDescriptor){let E=await r(t,y,w);y=E===C?ae.max(y,u[g]):y+E}if(y>u[g])throw new N(ql);u[g]=y,h.set(w,b)}}let m=0,p;for(let g=0;g<c.length;g++){let w=c[g];if(d.has(w)){let f=xn(t,w);f<m?l.set(w,p):(i||await Zs(e,t,m,f-m),s.closeDisk&&Qo(s,h.get(w))&&await s.closeDisk(),p={offset:Tr(e,s),diskNumberStart:ln(s)},l.set(w,p),await Zs(e,t,f,u[g]-f),m=u[g])}}i||await Zs(e,t,m,o-m)}else{let c=e.offset;await Zs(e,t,0,o),a.forEach(u=>l.set(u,{offset:c+xn(t,u),diskNumberStart:0}))}return l}function wI(e,t,a){let n=new Dt(t.length),o=a;for(let i=t.length-1;i>=0;i--){let r=xn(e,t[i]),s=t[i+1];s&&xn(e,s)>r&&(o=ae.min(xn(e,s),a)),n[i]=o}return n}async function Zs(e,t,a,n){if(n>0){let{writer:o}=e,i=0;try{await ME(fk(t,{offset:a,size:n}),o,C,r=>i+=r)}catch(r){if(i){e.hasCorruptedEntries=!0;try{r.corruptedEntry=!0}catch{}}throw r}finally{o.size+=i,e.offset+=i}}}async function bI(e,t){let a=t>=0&&t+Gt<=e.size?await We(e,t,Gt):Ce;if(ke(a)<Gt)return C;let n=me(a);return PE(n,0)!=hr?C:Gt+Gl(n,Ex+eo)+Gl(n,vx+eo)}function xn(e,{offset:t,diskNumberStart:a}){return t+(e.getDiskOffset?e.getDiskOffset(a):0)}function DE(){let e=new X(Ln);return bt(me(e),0,Lr),e}async function mb(e,t){delete e.addSplitZipSignature,await Da(t,DE()),e.offset+=Ln}async function Da(e,t){let{writable:a}=e,n=a.getWriter();try{await n.ready,e.size+=ke(t),await n.write(t)}finally{n.releaseLock()}}async function ME(e,t,a,n){let o=t.writable.getWriter();try{await e.pipeTo(new ba({async write(i){await o.ready,await o.write(i),n(ke(i))}}),{preventClose:!0,preventAbort:!0,signal:a})}finally{o.releaseLock()}}function md(e){if(e){let t=(vt(e.getTime())+vt(116444736e5))*vt(1e4);return t<ib?ib:t>rb?rb:t}}function $s(e){return ae.floor(e.getTime()/1e3)}function yI(e){return e>=hE&&e<=mE}function pb(e){return ae.min(mE,ae.max(hE,e))}function ye(e,t,a,n){let o=t[a]===C?e.options[a]:t[a];return o===C?n:o}function pd(e,t,a,n){let o=ye(e,t,a,n);if(o===null)return n;if(o!==C&&(typeof o.getTime!=st||nt.isNaN(o.getTime())))throw new N(nE);return o}function rh(e,t,a){return Yl(ye(e,t,a))}function zo(e,t,a,n){return Nr(ye(e,t,a,n))}function gb(e){return e+5*(ae.floor(e/16383)+1)}function sh(e,t){return e===C?t===C||t>0:e!==un}function Gl(e,t){return e.getUint16(t,!0)}function PE(e,t){return e.getUint32(t,!0)}function kI(e,t,a){e.setUint8(t,a)}function ja(e,t,a){e.setUint16(t,a,!0)}function bt(e,t,a){e.setUint32(t,a,!0)}function Cr(e,t,a){e.setBigUint64(t,a,!0)}function Rr(e,t,a){e.set(t,a)}function ke(...e){let t=0;return e.forEach(a=>a&&(t+=a.length)),t}function FE({version:e,bitFlag:t,compressionMethod:a,uncompressedSize:n,compressedSize:o,lastModDate:i,rawLastModDate:r,rawFilename:s,zip64CompressedSize:l,zip64UncompressedSize:c,extraFieldLength:u}){let d=Nt(Gt-4),h=d.array,m=me(h);if(d.writeUint16(e),d.writeUint16(t),d.writeUint16(a),r===C){let p=new cx(1),g=me(p);ja(g,0,(i.getHours()<<6|i.getMinutes())<<5|i.getSeconds()/2),ja(g,2,(i.getFullYear()-1980<<4|i.getMonth()+1)<<5|i.getDate()),r=p[0]}return d.writeUint32(r),d.skip(4),l||o!==C?d.writeUint32(l?Re:o):d.skip(4),c||n!==C?d.writeUint32(c?Re:n):d.skip(4),d.writeUint16(ke(s)),d.writeUint16(u),{headerArray:h,headerView:m,rawLastModDate:r}}function fb(e){return e.every(t=>t>=HL&&t<=GL)}function EI(e,t,a,n,o){let i=0;return t&&(i=i|ul),a&&(i=i|cl),(o==ei||o==dr)&&(e>=0&&e<=3&&(i=i|gx),e>3&&e<=5&&(i=i|px),e==9&&(i=i|mx)),n&&(i=i|ll),i}function vI(){return"application/octet-stream"}function SI(){let{CompressionStream:e,DecompressionStream:t,CompressionStreamFallback:a,DecompressionStreamFallback:n}=mo(),o=[{compressionMethod:un,compression:!0,decompression:!0,registered:!1},{compressionMethod:ei,compression:Tn(a,Mo)||Tn(e,Mo)||Tn(e,ro),decompression:Tn(n,Mo)||Tn(t,Mo)||Tn(t,ro),registered:!1},{compressionMethod:dr,compression:!1,decompression:Tn(n,Od)||Tn(t,Od),registered:!1}];for(let i of Ny()){let r=Ih(i.format);o.push({compressionMethod:i.compressionMethod,compression:r?typeof r.CompressionStream==st:C,decompression:r?typeof r.DecompressionStream==st:C,registered:!0})}return o}function Tn(e,t){if(!e)return!1;let{supportedFormats:a}=e;return a?a.includes(t):Nh(e,t)}var AI="2.23.0",TI=1024*1024,CI=".zip.js-temp";function RI(e={}){let{thresholdBytes:t=TI,directoryName:a=CI,getDirectory:n=()=>or.storage.getDirectory()}=e,o;function i(){return o||(o=Fe.resolve(n()).then(r=>r.getDirectoryHandle(a,{create:!0}))),o}return function(){let r=[],s=0,l=!1,c,u,d,h;async function m(){let b=await i();c=_I(),u=await b.getFileHandle(c,{create:!0}),d=(await u.createWritable()).getWriter(),l=!0;for(let y of r)await d.write(y);r.length=0}let p=new ba({async write(b){l?await d.write(b):(r.push(b),s+=b.length,s>t&&await m())},async close(){d&&(await d.close(),d=null)}}),g=0,w=new Ot({async pull(b){if(l){h||(h=(await u.getFile()).stream().getReader());let{value:y,done:E}=await h.read();E?b.close():b.enqueue(y)}else g<r.length?b.enqueue(r[g++]):b.close()},async cancel(b){h&&await h.cancel(b)}},{highWaterMark:0});async function f(){if(d){try{await d.close()}catch{}d=null}if(c){try{await(await i()).removeEntry(c)}catch{}u=c=null}r.length=0}return{writable:p,readable:w,dispose:f}}}function _I(){return ga.randomUUID?ga.randomUUID():Dt.from(ga.getRandomValues(new X(16)),e=>e.toString(16).padStart(2,"0")).join("")}var xI=1024*1024;function LI(e={}){let{thresholdBytes:t=xI}=e;return function(){let a=[],n=0,o=!1,i,r,s;async function l(){let m=new Xe;r=io(m.readable),i=m.writable.getWriter(),o=!0;for(let p of a)await i.write(p);a.length=0}let c=new ba({async write(m){o?await i.write(m):(a.push(m),n+=m.length,n>t&&await l())},async close(){i&&(await i.close(),i=null)}}),u=0,d=new Ot({async pull(m){if(o){s||(s=(await r).stream().getReader());let{value:p,done:g}=await s.read();g?m.close():m.enqueue(p)}else u<a.length?m.enqueue(a[u++]):m.close()},async cancel(m){s&&await s.cancel(m)}},{highWaterMark:0});async function h(){if(i){try{await i.abort()}catch{}i=null}r&&(r.catch(()=>{}),r=null),a.length=0}return{writable:c,readable:d,dispose:h}}}var II=1024*1024,jI=".zip.js-temp",NI=512*1024,zE="createSyncAccessHandle is only available in dedicated workers";function OI(e={}){let{thresholdBytes:t=II,directoryName:a=jI,getDirectory:n}=e;if(!n&&(typeof FileSystemFileHandle>"u"||!FileSystemFileHandle.prototype.createSyncAccessHandle))throw new N(zE);let o=n||(()=>or.storage.getDirectory()),i;function r(){return i||(i=Fe.resolve(o()).then(s=>s.getDirectoryHandle(a,{create:!0}))),i}return function(){let s=[],l=0,c=!1,u,d,h=0,m=0;async function p(){let y=await r();u=DI(),d=await(await y.getFileHandle(u,{create:!0})).createSyncAccessHandle(),c=!0;for(let k of s)d.write(k,{at:h}),h+=k.length;s.length=0}let g=new ba({async write(y){c?(d.write(y,{at:h}),h+=y.length):(s.push(y),l+=y.length,l>t&&await p())},close(){d&&d.flush()}}),w=0,f=new Ot({pull(y){if(c){let E=h-m;if(E<=0){y.close();return}let k=new X(ae.min(NI,E)),S=d.read(k,{at:m});S?(m+=S,y.enqueue(k.subarray(0,S))):y.close()}else w<s.length?y.enqueue(s[w++]):y.close()}},{highWaterMark:0});async function b(){if(d){try{d.close()}catch{}d=null}if(u){try{await(await r()).removeEntry(u)}catch{}u=null}s.length=0}return{writable:g,readable:f,dispose:b}}}function DI(){return ga.randomUUID?ga.randomUUID():Dt.from(ga.getRandomValues(new X(16)),e=>e.toString(16).padStart(2,"0")).join("")}try{py({baseURI:XI.url})}catch{}var Et=X,qt=lx,Tm=Int32Array,oc=new Et([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),ic=new Et([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),lh=new Et([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),UE=function(e,t){for(var a=new qt(31),n=0;n<31;++n)a[n]=t+=1<<e[n-1];for(var o=new Tm(a[30]),n=1;n<30;++n)for(var i=a[n];i<a[n+1];++i)o[i]=i-a[n]<<5|n;return{b:a,r:o}},BE=UE(oc,2),HE=BE.b,ch=BE.r;HE[28]=258,ch[258]=28;var GE=UE(ic,0),MI=GE.b,wb=GE.r,uh=new qt(32768);for(Ne=0;Ne<32768;++Ne)an=(Ne&43690)>>1|(Ne&21845)<<1,an=(an&52428)>>2|(an&13107)<<2,an=(an&61680)>>4|(an&3855)<<4,uh[Ne]=((an&65280)>>8|(an&255)<<8)>>1;var an,Ne,Na=(function(e,t,a){for(var n=e.length,o=0,i=new qt(t);o<n;++o)e[o]&&++i[e[o]-1];var r=new qt(t);for(o=1;o<t;++o)r[o]=r[o-1]+i[o-1]<<1;var s;if(a){s=new qt(1<<t);var l=15-t;for(o=0;o<n;++o)if(e[o])for(var c=o<<4|e[o],u=t-e[o],d=r[e[o]-1]++<<u,h=d|(1<<u)-1;d<=h;++d)s[uh[d]>>l]=c}else for(s=new qt(n),o=0;o<n;++o)e[o]&&(s[o]=uh[r[e[o]-1]++]>>15-e[o]);return s}),Dn=new Et(288);for(Ne=0;Ne<144;++Ne)Dn[Ne]=8;var Ne;for(Ne=144;Ne<256;++Ne)Dn[Ne]=9;var Ne;for(Ne=256;Ne<280;++Ne)Dn[Ne]=7;var Ne;for(Ne=280;Ne<288;++Ne)Dn[Ne]=8;var Ne,_r=new Et(32);for(Ne=0;Ne<32;++Ne)_r[Ne]=5;var Ne,PI=Na(Dn,9,0),FI=Na(Dn,9,1),zI=Na(_r,5,0),UI=Na(_r,5,1),gd=function(e){for(var t=e[0],a=1;a<e.length;++a)e[a]>t&&(t=e[a]);return t},ma=function(e,t,a){var n=t/8|0;return(e[n]|e[n+1]<<8)>>(t&7)&a},fd=function(e,t){var a=t/8|0;return(e[a]|e[a+1]<<8|e[a+2]<<16)>>(t&7)},Cm=function(e){return(e+7)/8|0},WE=function(e,t,a){return(a==null||a>e.length)&&(a=e.length),new Et(e.subarray(t,a))},BI=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],on=function(e,t,a){var n=new N(t||BI[e]);if(n.code=e,N.captureStackTrace&&N.captureStackTrace(n,on),!a)throw n;return n},HI=function(e,t,a,n){var o=e.length,i=n?n.length:0;if(!o||t.f&&!t.l)return a||new Et(0);var r=!a,s=r||t.i!=2,l=t.i;r&&(a=new Et(o*3));var c=function(qe){var $=a.length;if(qe>$){var Ie=new Et(ae.max($*2,qe));Ie.set(a),a=Ie}},u=t.f||0,d=t.p||0,h=t.b||0,m=t.l,p=t.d,g=t.m,w=t.n,f=o*8;do{if(!m){u=ma(e,d,1);var b=ma(e,d+1,3);if(d+=3,b)if(b==1)m=FI,p=UI,g=9,w=5;else if(b==2){var S=ma(e,d,31)+257,T=ma(e,d+10,15)+4,v=S+ma(e,d+5,31)+1;d+=14;for(var A=new Et(v),x=new Et(19),_=0;_<T;++_)x[lh[_]]=ma(e,d+_*3,7);d+=T*3;for(var O=gd(x),z=(1<<O)-1,U=Na(x,O,1),_=0;_<v;){var K=U[ma(e,d,z)];d+=K&15;var y=K>>4;if(y<16)A[_++]=y;else{var L=0,D=0;for(y==16?(D=3+ma(e,d,3),d+=2,L=A[_-1]):y==17?(D=3+ma(e,d,7),d+=3):y==18&&(D=11+ma(e,d,127),d+=7);D--;)A[_++]=L}}var B=A.subarray(0,S),W=A.subarray(S);g=gd(B),w=gd(W),m=Na(B,g,1),p=Na(W,w,1)}else on(1);else{var y=Cm(d)+4,E=e[y-4]|e[y-3]<<8,k=y+E;if(k>o){l&&on(0);break}s&&c(h+E),a.set(e.subarray(y,k),h),t.b=h+=E,t.p=d=k*8,t.f=u;continue}if(d>f){l&&on(0);break}}s&&c(h+131072);for(var Y=(1<<g)-1,H=(1<<w)-1,Q=d;;Q=d){var L=m[fd(e,d)&Y],se=L>>4;if(d+=L&15,d>f){l&&on(0);break}if(L||on(2),se<256)a[h++]=se;else if(se==256){Q=d,m=null;break}else{var de=se-254;if(se>264){var _=se-257,ue=oc[_];de=ma(e,d,(1<<ue)-1)+HE[_],d+=ue}var Ae=p[fd(e,d)&H],j=Ae>>4;Ae||on(3),d+=Ae&15;var W=MI[j];if(j>3){var ue=ic[j];W+=fd(e,d)&(1<<ue)-1,d+=ue}if(d>f){l&&on(0);break}s&&c(h+131072);var De=h+de;if(h<W){var Ze=i-W,Me=ae.min(W,De);for(Ze+h<0&&on(3);h<Me;++h)a[h]=n[Ze+h]}for(;h<De;++h)a[h]=a[h-W]}}t.l=m,t.p=Q,t.b=h,t.f=u,m&&(u=1,t.m=g,t.d=p,t.n=w)}while(!u);return h!=a.length&&r?WE(a,0,h):a.subarray(0,h)},nn=function(e,t,a){a<<=t&7;var n=t/8|0;e[n]|=a,e[n+1]|=a>>8},tr=function(e,t,a){a<<=t&7;var n=t/8|0;e[n]|=a,e[n+1]|=a>>8,e[n+2]|=a>>16},wd=function(e,t){for(var a=[],n=0;n<e.length;++n)e[n]&&a.push({s:n,f:e[n]});var o=a.length,i=a.slice();if(!o)return{t:qE,l:0};if(o==1){var r=new Et(a[0].s+1);return r[a[0].s]=1,{t:r,l:1}}a.sort(function(k,S){return k.f-S.f}),a.push({s:-1,f:25001});var s=a[0],l=a[1],c=0,u=1,d=2;for(a[0]={s:-1,f:s.f+l.f,l:s,r:l};u!=o-1;)s=a[a[c].f<a[d].f?c++:d++],l=a[c!=u&&a[c].f<a[d].f?c++:d++],a[u++]={s:-1,f:s.f+l.f,l:s,r:l};for(var h=i[0].s,n=1;n<o;++n)i[n].s>h&&(h=i[n].s);var m=new qt(h+1),p=dh(a[u-1],m,0);if(p>t){var n=0,g=0,w=p-t,f=1<<w;for(i.sort(function(S,T){return m[T.s]-m[S.s]||S.f-T.f});n<o;++n){var b=i[n].s;if(m[b]>t)g+=f-(1<<p-m[b]),m[b]=t;else break}for(g>>=w;g>0;){var y=i[n].s;m[y]<t?g-=1<<t-m[y]++-1:++n}for(;n>=0&&g;--n){var E=i[n].s;m[E]==t&&(--m[E],++g)}p=t}return{t:new Et(m),l:p}},dh=function(e,t,a){return e.s==-1?ae.max(dh(e.l,t,a+1),dh(e.r,t,a+1)):t[e.s]=a},bb=function(e){for(var t=e.length;t&&!e[--t];);for(var a=new qt(++t),n=0,o=e[0],i=1,r=function(l){a[n++]=l},s=1;s<=t;++s)if(e[s]==o&&s!=t)++i;else{if(!o&&i>2){for(;i>138;i-=138)r(32754);i>2&&(r(i>10?i-11<<5|28690:i-3<<5|12305),i=0)}else if(i>3){for(r(o),--i;i>6;i-=6)r(8304);i>2&&(r(i-3<<5|8208),i=0)}for(;i--;)r(o);i=1,o=e[s]}return{c:a.subarray(0,n),n:t}},ar=function(e,t){for(var a=0,n=0;n<t.length;++n)a+=e[n]*t[n];return a},VE=function(e,t,a){var n=a.length,o=Cm(t+2);e[o]=n&255,e[o+1]=n>>8,e[o+2]=e[o]^255,e[o+3]=e[o+1]^255;for(var i=0;i<n;++i)e[o+i+4]=a[i];return(o+4+n)*8},yb=function(e,t,a,n,o,i,r,s,l,c,u){nn(t,u++,a),++o[256];for(var d=wd(o,15),h=d.t,m=d.l,p=wd(i,15),g=p.t,w=p.l,f=bb(h),b=f.c,y=f.n,E=bb(g),k=E.c,S=E.n,T=new qt(19),v=0;v<b.length;++v)++T[b[v]&31];for(var v=0;v<k.length;++v)++T[k[v]&31];for(var A=wd(T,7),x=A.t,_=A.l,O=19;O>4&&!x[lh[O-1]];--O);var z=c+5<<3,U=ar(o,Dn)+ar(i,_r)+r,K=ar(o,h)+ar(i,g)+r+14+3*O+ar(T,x)+2*T[16]+3*T[17]+7*T[18];if(l>=0&&z<=U&&z<=K)return VE(t,u,e.subarray(l,l+c));var L,D,B,W;if(nn(t,u,1+(K<U)),u+=2,K<U){L=Na(h,m,0),D=h,B=Na(g,w,0),W=g;var Y=Na(x,_,0);nn(t,u,y-257),nn(t,u+5,S-1),nn(t,u+10,O-4),u+=14;for(var v=0;v<O;++v)nn(t,u+3*v,x[lh[v]]);u+=3*O;for(var H=[b,k],Q=0;Q<2;++Q)for(var se=H[Q],v=0;v<se.length;++v){var de=se[v]&31;nn(t,u,Y[de]),u+=x[de],de>15&&(nn(t,u,se[v]>>5&127),u+=se[v]>>12)}}else L=PI,D=Dn,B=zI,W=_r;for(var v=0;v<s;++v){var ue=n[v];if(ue>255){var de=ue>>18&31;tr(t,u,L[de+257]),u+=D[de+257],de>7&&(nn(t,u,ue>>23&31),u+=oc[de]);var Ae=ue&31;tr(t,u,B[Ae]),u+=W[Ae],Ae>3&&(tr(t,u,ue>>5&8191),u+=ic[Ae])}else tr(t,u,L[ue]),u+=D[ue]}return tr(t,u,L[256]),u+D[256]},GI=new Tm([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),qE=new Et(0),WI=function(e,t,a,n,o,i){var r=i.z||e.length,s=new Et(n+r+5*(1+ae.ceil(r/7e3))+o),l=s.subarray(n,s.length-o),c=i.l,u=(i.r||0)&7;if(t){u&&(l[0]=i.r>>3);for(var d=GI[t-1],h=d>>13,m=d&8191,p=(1<<a)-1,g=i.p||new qt(32768),w=i.h||new qt(p+1),f=ae.ceil(a/3),b=2*f,y=function(at){return(e[at]^e[at+1]<<f^e[at+2]<<b)&p},E=new Tm(25e3),k=new qt(288),S=new qt(32),T=0,v=0,A=i.i||0,x=0,_=i.w||0,O=0;A+2<r;++A){var z=y(A),U=A&32767,K=w[z];if(g[U]=K,w[z]=U,_<=A){var L=r-A;if((T>7e3||x>24576)&&(L>423||!c)){u=yb(e,l,0,E,k,S,v,x,O,A-O,u),x=T=v=0,O=A;for(var D=0;D<286;++D)k[D]=0;for(var D=0;D<30;++D)S[D]=0}var B=2,W=0,Y=m,H=U-K&32767;if(L>2&&z==y(A-H))for(var Q=ae.min(h,L)-1,se=ae.min(32767,A),de=ae.min(258,L);H<=se&&--Y&&U!=K;){if(e[A+B]==e[A+B-H]){for(var ue=0;ue<de&&e[A+ue]==e[A+ue-H];++ue);if(ue>B){if(B=ue,W=H,ue>Q)break;for(var Ae=ae.min(H,ue-2),j=0,D=0;D<Ae;++D){var De=A-H+D&32767,Ze=g[De],Me=De-Ze&32767;Me>j&&(j=Me,K=De)}}}U=K,K=g[U],H+=U-K&32767}if(W){E[x++]=268435456|ch[B]<<18|wb[W];var qe=ch[B]&31,$=wb[W]&31;v+=oc[qe]+ic[$],++k[257+qe],++S[$],_=A+B,++T}else E[x++]=e[A],++k[e[A]]}}for(A=ae.max(A,_);A<r;++A)E[x++]=e[A],++k[e[A]];u=yb(e,l,c,E,k,S,v,x,O,A-O,u),c||(i.r=u&7|l[u/8|0]<<3,u-=7,i.h=w,i.p=g,i.i=A,i.w=_)}else{for(var A=i.w||0;A<r+c;A+=65535){var Ie=A+65535;Ie>=r&&(l[u/8|0]=c,Ie=r),u=VE(l,u+1,e.subarray(A,Ie))}i.i=r}return WE(s,0,n+Cm(u)+o)},VI=function(e,t,a,n,o){if(!o&&(o={l:1},t.dictionary)){var i=t.dictionary.subarray(-32768),r=new Et(i.length+e.length);r.set(i),r.set(e,i.length),e=r,o.w=i.length}return WI(e,t.level==null?6:t.level,t.mem==null?o.l?ae.ceil(ae.max(8,ae.min(13,ae.log(e.length)))*1.5):20:12+t.mem,a,n,o)};function Rm(e,t){return VI(e,t||{},0,0)}function qI(e,t){return HI(e,{i:2},t&&t.out,t&&t.dictionary)}var YI=typeof rl<"u"&&new rl,KI=0;try{YI.decode(qE,{stream:!0}),KI=1}catch{}py({workerURI:null});async function xm(e,{password:t,prompt:a=()=>{},zipOptions:n={useWebWorkers:!0},noBlobURL:o,entries:i,pagePath:r="",excludedPaths:s,aliases:l}={}){let c={gif:"image/gif",jpg:"image/jpeg",png:"image/png",tif:"image/tiff",tiff:"image/tiff",bmp:"image/bmp",ico:"image/vnd.microsoft.icon",webp:"image/webp",svg:"image/svg+xml",avi:"video/x-msvideo",ogv:"video/ogg",mp4:"video/mp4",mpeg:"video/mpeg",ts:"video/mp2t",webm:"video/webm","3gp":"video/3gpp","3g2":"video/3gpp",mp3:"audio/mpeg",oga:"audio/ogg",mid:"audio/midi",midi:"audio/midi",opus:"audio/opus",wav:"audio/wav",weba:"audio/webm",heif:"image/heif",heic:"image/heic",avif:"image/avif",jxl:"image/jxl",apng:"image/apng",mov:"video/quicktime",otf:"font/otf",ttf:"font/ttf",woff:"font/woff",woff2:"font/woff2",eot:"application/vnd.ms-fontobject",pdf:"application/pdf"},u=/stylesheet_[0-9]+\.css/,d=/scripts\/[0-9]+\.js/,h=/^([0-9_]+\/)?index\.html$/,m=/index\.html$/,p=/frames\//,g=/^frames\/\d+\/index.html/,w=/manifest\.json$/,f=";charset=utf-8",b=/([{}()^$&.*?/+|[\\\\]|\]|-)/g,y;if(!i){let L;e.readUint8Array?L=e:(Array.isArray(e)&&(e=new Blob([new Uint8Array(e)])),L=new zip.BlobReader(e)),y=new zip.ZipReader(L,n),i=await y.getEntries()}if(i=i.filter(L=>L.filename!="page.pdf"),l){let L=i;i=i.map(D=>{let B=l[D.filename],W=B&&L.find(Y=>Y.filename==B);return W?{filename:D.filename,comment:W.comment,encrypted:W.encrypted,uncompressedSize:W.uncompressedSize,getData:(Y,H)=>W.getData(Y,H)}:D})}r?i=i.filter(L=>L.filename.startsWith(r)):s&&(i=i.filter(L=>!s.some(D=>L.filename.startsWith(D))));let E=Object.assign({password:t},n),k,S,T,v=[],A=[],x=[];await Promise.all(i.map(async L=>{let D=L.filename.substring(r.length),B,W,Y,H,Q={};if(!E.password&&L.encrypted&&(E.password=a("Please enter the password to view the page")),D.match(m)||D.match(u)||D.match(d))D.match(m)?A.push(Q):x.push(Q),B=new zip.TextWriter,L.uncompressedSize>0?Y=await L.getData(B,E):Y="",D.match(m)?H="text/html"+f:D.match(u)?H="text/css"+f:D.match(d)&&(H="text/javascript"+f);else{v.push(Q);let Ae=D.match(/\.([^.]+)/);if(Ae&&Ae[1]&&c[Ae[1]]?H=c[Ae[1]]:H="application/octet-stream",D.match(p)||o)W=await L.getData(new zip.Data64URIWriter(H),E);else{let j=await L.getData(new zip.BlobWriter(H),E);W=URL.createObjectURL(j)}}let se=D.match(/^([0-9_]+\/)?(.*)$/)[2],de="",ue=D.match(/(.*\/)[^/]+$/);ue&&ue[1]&&(de=ue[1]),Object.assign(Q,{prefixPath:de,filename:D,name:se,url:L.comment,content:W,mimeType:H,textContent:Y,parentResources:[]})})),y&&await y.close(),A.sort(U),x.sort(K),v=v.sort(U).concat(...x).concat(...A);for(let L of v){let{filename:D,prefixPath:B}=L,{textContent:W}=L;W!==void 0&&(D.match(h)&&(S=W),D.match(d)||(v.forEach(Y=>{let{filename:H,parentResources:Q,content:se}=Y;if(H.startsWith(B)&&H!=L.filename){let de=H.substring(B.length);de.match(w)||W.includes(de)&&(Q.push(L.filename),Y.textContent===void 0&&(W=z(W,de,se)))}}),L.textContent=W))}for(let L of v){let{textContent:D,prefixPath:B,filename:W}=L;if(D!==void 0){if(!W.match(d)){let Y=W;for(let H of v){let{filename:Q}=H;if(Q.startsWith(B)&&Q!=Y){let se=Q.substring(B.length);se.match(w)||D.indexOf(se)!=-1&&(H.content=await _(H),D=z(D,se,H.content))}}L.textContent=D,L.content=await _(L)}W.match(h)&&(k=D,T=L.url)}}return{docContent:k,origDocContent:S,resources:v,url:T};async function _(L){return L.filename.match(p)&&!L.filename.match(g)||o?await O(L.textContent,L.mimeType):URL.createObjectURL(new Blob([L.textContent],{type:L.mimeType}))}async function O(L,D){let B=new Blob([L],{type:D}),W=new Uint8Array(await B.arrayBuffer()),Y="";for(let H=0;H<W.length;H+=8192)Y+=String.fromCharCode(...W.subarray(H,H+8192));return("data:"+(B.type||"application/octet-stream")+";base64,"+btoa(Y)).replace(f,"")}function z(L,D,B){if(typeof L.replaceAll=="function")return L.replaceAll(D,B);{let W=new RegExp(D.replace(b,"\\$1"),"g");return L.replace(W,B)}}function U(L,D){let B=D.filename.length-L.filename.length;return B||D.filename.localeCompare(L.filename)}function K(L,D){let B=L.filename.length-D.filename.length;return B||L.filename.localeCompare(D.filename)}}async function Lm(e,t,{disableFramePointerEvents:a,inPlace:n}={}){function o(r){let s=r.doctype,l="";return s&&(l="<!DOCTYPE "+s.nodeName,s.publicId?(l+=' PUBLIC "'+s.publicId+'"',s.systemId&&(l+=' "'+s.systemId+'"')):s.systemId&&(l+=' SYSTEM "'+s.systemId+'"'),s.internalSubset&&(l+=" ["+s.internalSubset+"]"),l+=">"),l}t=t.replace(/<noscript/gi,"<template disabled-noscript"),t=t.replace(/<\/noscript/gi,"</template");let i=e.implementation.createHTMLDocument("");if(i.open(),i.write(t),i.close(),a&&i.querySelectorAll("iframe").forEach(r=>{let s="pointer-events";(r.style.getPropertyValue(s)!="none"||r.style.getPropertyPriority(s)!="important")&&r.style.setProperty("--sf-"+s,r.style.getPropertyValue(s),r.style.getPropertyPriority(s)),r.style.setProperty(s,"none","important")}),n&&i.compatMode==e.compatMode&&!i.querySelector("script")){await Promise.all(Array.from(i.querySelectorAll("link[rel~=stylesheet][href]")).map(l=>new Promise(c=>{let u=e.createElement("link");u.rel="preload",u.as="style",u.href=l.getAttribute("href"),u.onload=c,u.onerror=c,e.head.appendChild(u),setTimeout(c,500)})));let r=e.documentElement,s=e.adoptNode(i.documentElement);for(;r.attributes.length;)r.removeAttribute(r.attributes[0].name);if(Array.from(s.attributes).forEach(l=>r.setAttribute(l.name,l.value)),r.replaceChildren(...s.childNodes),e.querySelector("link[rel~=stylesheet][href]")){let l=e.createElement("style");l.textContent="html{visibility:hidden}",e.head.appendChild(l);let c=Date.now();for(;Date.now()-c<500&&Array.from(e.querySelectorAll("link[rel~=stylesheet][href]")).some(u=>!u.sheet);)await new Promise(u=>setTimeout(u,10));l.remove()}}else e.open(),e.write(o(i)),e.write(i.documentElement.outerHTML),e.close();e.querySelectorAll("template[disabled-noscript]").forEach(r=>{let s=e.createElement("noscript");r.removeAttribute("disabled-noscript"),Array.from(r.attributes).forEach(l=>s.setAttribute(l.name,l.value)),s.textContent=r.innerHTML,r.parentElement.replaceChild(s,r)}),e.documentElement.setAttribute("data-sfz",""),e.querySelectorAll("link[rel*=icon]").forEach(r=>r.replaceWith(r.cloneNode(!0)))}async function YE(e,{extract:t,display:a}){let n="pages/",o="sfz-",i="sfz-pages.json",r="sfz-toc.html",s="#sfz/",l="?toc",c="data-sfz-target",u=/:target(?![\w-])/g,d="data-sfz-visited",h=/:visited(?![\w-])/g,m="#551a8b",p="data-sfz-unarchived",g="a["+p+']::after{content:" \\2197";font-size:.75em;opacity:.7}',w="Not saved in this archive",f=["http:","https:"],b=100,{zip:y,document:E,location:k,history:S,CSS:T,URL:v,setTimeout:A,clearTimeout:x}=globalThis,_=new Map,O=new Map,z=new Map,U=new Set,K=Math.random().toString(36).substring(2),L,D,B,W,Y=0;try{S.scrollRestoration="manual"}catch{}y.configure({useWebWorkers:!0});let Q=await new y.ZipReader(e.readUint8Array?e:new y.BlobReader(e)).getEntries(),se=Q.find(I=>I.filename==i);if(!se)throw new Error("Pages data not found");let de=JSON.parse(await se.getData(new y.TextWriter)),ue=Q.find(I=>I.filename==r),{pages:Ae}=de,j=de.pageTransitions||"auto",De=new Map(Object.entries(de.aliases||{}));return Ae.forEach(I=>{O.set(Ee(I.url),I.path),I.originalUrls&&I.originalUrls.forEach(F=>O.set(Ee(F),I.path))}),Ze(),D=wt(),D===null&&(D=It()),Ie(!0);function Ze(){globalThis.addEventListener("click",qe,!0),globalThis.addEventListener("auxclick",qe,!0),globalThis.addEventListener("mouseover",ut,!0),globalThis.addEventListener("hashchange",Me)}function Me(){$().catch(I=>globalThis.console.error(I))}function qe(I){if(I.type=="auxclick"&&I.button!=1)return;let F=Lt(I.target);if(F&&F.href){let ee=rt(F.href);if(ee&&ee.startsWith(s)&&Ee(F.href)==Ee(k.href))return;let ve=O.get(Ee(F.href));if(ve===void 0&&ee&&Ee(F.href)==Ee(k.href)&&(ve=L),ve!==void 0)if(I.preventDefault(),I.type=="auxclick"||I.metaKey||I.ctrlKey||I.shiftKey||I.altKey)globalThis.open(Ee(k.href)+s+ve+(ee||""));else{let Ue=k.hash;k.hash=s+ve+(ee||""),k.hash==Ue&&ee&&(M(),Rt(ee))}}}async function $(){M(),z.set(D,Ut());let I=Ke(),F=wt(),{routed:ee,path:ve,fragment:Ue}=at();ee&&ve!=L&&je(ve)&&E.startViewTransition&&da()&&!_a()?await E.startViewTransition(er).updateCallbackDone:await er();async function er(){let Qt=await Ie();Qt&&Pe(),td(Qt)}function td(Qt){if(F!==null){D=F;let Jn=z.get(F);if(Jn&&(it(Jn.elements),globalThis.scrollTo(Jn.x,Jn.y)),Ue){let Qe=tn(Ue);Qe&&xa(Qe)}}else D=It(),Qt&&it(I),Ue?Rt(Ue):Qt&&globalThis.scrollTo(0,0)}}async function Ie(I){let{routed:F,path:ee,fragment:ve}=at();if(!F&&!I||ee==L||!je(ee))return!1;let Ue=await be(ee);return L=ee,await a(E,Ue,{inPlace:!0}),Ze(),ee==l&&te(),U.add(ee),ha(),de.markUnarchivedLinks&&R(),I&&(ve?Rt(ve):!F&&k.hash&&Rt(k.hash)),!0}function at(){let I=k.hash,F=!I||I.startsWith(s),ee=F&&ue?l:Ae[0].path,ve;return F&&I&&({path:ee,fragment:ve}=we(I)),{routed:F,path:ee,fragment:ve}}function we(I){let F=I.substring(s.length),ee=F.indexOf("#");return{path:decodeURIComponent(ee==-1?F:F.substring(0,ee)),fragment:ee==-1?void 0:F.substring(ee)}}function je(I){return I==l?!!ue:!!Ae.find(F=>F.path==I)}function be(I){if(!_.has(I)){let F=V(I);F.catch(()=>_.delete(I)),_.set(I,F)}return _.get(I)}async function V(I){if(I==l)return ue.getData(new y.TextWriter);let F=Q.filter(ve=>Se(ve.filename,I)&&!De.has(ve.filename)).concat(he(I)),{docContent:ee}=await t(null,{entries:F,pagePath:I});return ee}function he(I){return Array.from(De).filter(([F])=>Se(F,I)).map(([F,ee])=>{let ve=Q.find(Ue=>Ue.filename==ee);return ve&&{filename:F,comment:ve.comment,encrypted:ve.encrypted,uncompressedSize:ve.uncompressedSize,getData:(Ue,La)=>ve.getData(Ue,La)}}).filter(Boolean)}function Se(I,F){return F==""?!I.startsWith(n)&&!I.startsWith(o):I.startsWith(F)}function te(){let I=new Map;Ae.forEach(F=>I.set(new v(F.path+"index.html",Ee(k.href)).href,F.path)),E.querySelectorAll("a[href]").forEach(F=>{let ee=rt(F.href),ve=I.get(Ee(F.href));ve!==void 0&&F.setAttribute("href",s+ve+(ee||""))})}function He(I){let F=rt(I);return F&&F.startsWith(s)&&Ee(I)==Ee(k.href)?we(F).path:O.get(Ee(I))}function ut(I){let F=Lt(I.target);if(F&&F.href){let ee=He(F.href);ee!==void 0&&ee!=L&&!_.has(ee)&&(x(W),W=A(()=>be(ee).catch(()=>{}),b))}}function Lt(I){for(;I&&I.tagName!="A";)I=I.parentNode;return I}function da(){return j=="fade"?!0:j=="none"?!1:Array.from(E.styleSheets).some(I=>{try{return Jt(I.cssRules)}catch{return!1}})}function Jt(I){return Array.from(I).some(F=>F.navigation=="auto"||F.cssRules&&F.cssRules.length&&Jt(F.cssRules))}function _a(){return!!(globalThis.matchMedia&&globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches)}function wt(){let I=S.state;return I&&I.sfzSession==K&&typeof I.sfzEntry=="number"?I.sfzEntry:null}function It(){let I=Y++;try{S.replaceState({sfzSession:K,sfzEntry:I},"")}catch{}return I}function Ut(){return{x:globalThis.scrollX,y:globalThis.scrollY,elements:Ke()}}function Ke(){let I=[];return E.querySelectorAll("*").forEach(F=>{if(F.scrollTop||F.scrollLeft){let ee=en(F);ee&&I.push({path:ee,top:F.scrollTop,left:F.scrollLeft})}}),I}function it(I){I.forEach(({path:F,top:ee,left:ve})=>{let Ue;try{Ue=E.querySelector(F)}catch{}Ue&&(Ue.scrollTop=ee,Ue.scrollLeft=ve)})}function en(I){let F=[];for(;I&&I.parentElement;){if(I.id&&T)return F.unshift("#"+T.escape(I.id)),F.join(">");let ee=I.parentElement;F.unshift(I.tagName+":nth-child("+(Array.from(ee.children).indexOf(I)+1)+")"),I=ee}return F.join(">")}function Rt(I){let F=tn(I);F&&(xa(F),F.scrollIntoView())}function tn(I){let F=decodeURIComponent(I.substring(1)),ee=E.getElementById(F);return!ee&&T&&(ee=E.querySelector("a[name="+T.escape(F)+"]")),ee}function xa(I){let F=G(u,c);F&&(I.setAttribute(c,""),B=E.createElement("style"),B.textContent=F,E.head.appendChild(B))}function ha(){let I=E.createElement("style");I.textContent="a["+d+"]{color:"+m+"}"+G(h,d),E.head.appendChild(I),E.querySelectorAll("a[href]").forEach(F=>{let ee=He(F.href);ee!==void 0&&U.has(ee)&&F.setAttribute(d,"")})}function R(){let I=E.createElement("style");I.textContent=g,E.head.appendChild(I),E.querySelectorAll("a[href]").forEach(F=>{f.includes(F.protocol)&&O.get(Ee(F.href))===void 0&&Ee(F.href)!=Ee(k.href)&&(F.setAttribute(p,""),F.hasAttribute("title")||F.setAttribute("title",w))})}function M(){if(B){let I=E.querySelector("["+c+"]");I&&I.removeAttribute(c),B.remove(),B=void 0}}function G(I,F){let ee="";return Array.from(E.styleSheets).forEach(ve=>{try{ee+=Te(ve.cssRules,I,F)}catch{}}),ee}function Te(I,F,ee){let ve="";return Array.from(I).forEach(Ue=>{if(Ue.cssRules&&Ue.cssRules.length){let La=Te(Ue.cssRules,F,ee);La&&(ve+=Ue.cssText.substring(0,Ue.cssText.indexOf("{")+1)+La+"}")}else if(Ue.selectorText){let La=Ue.selectorText.replace(F,"["+ee+"]");La!=Ue.selectorText&&(ve+=La+"{"+Ue.style.cssText+"}")}}),ve}function Pe(){let I=E.querySelector("h1")||E.body;I&&(I.setAttribute("tabindex","-1"),I.focus({preventScroll:!0}))}function Ee(I){let F=I.indexOf("#");return F==-1?I:I.substring(0,F)}function rt(I){let F=I.indexOf("#");return F==-1?void 0:I.substring(F)}}var Im=16361;var{Blob:Nm,fetch:ZI,TextEncoder:Ma,DOMParser:KE}=globalThis,$I=["application/javascript","application/x-javascript","application/ecmascript","application/json","application/ld+json","application/manifest+json","application/xml","application/xhtml+xml","application/rss+xml","application/atom+xml","image/svg+xml"],JI="text/",QI=[".jpg",".jpeg",".png",".apng",".gif",".webp",".avif",".heif",".heic",".jxl",".pdf",".woff",".woff2",".mp4",".webm",".avi",".mpeg",".mov",".ts",".ogv",".mp3",".ogg",".oga",".weba",".m4a",".aac",".opus",".flac"],ej="/lib/single-file-zip.min.js",nv="/lib/single-file-z-worker.js",tj=2e3,cc=[["<script type=sfz-data>","<\/script>"],["<style type=sfz-data>","</style>"],["<noframes>","</noframes>"],["<noembed>","</noembed>"],["<iframe>","</iframe>"],["<xmp>","</xmp>"],["<svg><![CDATA[","]]></svg>"],["<plaintext>","</plaintext>"]],Fm=[["<!--","-->"],...cc],XE="sfz-data",po=`	
\f\r />`,zm=[[["<script"],["<\/script",po]],[["<style"],["</style",po]],[["<noframes"],["</noframes",po]],[["<noembed"],["</noembed",po]],[["<iframe"],["</iframe",po]],[["<xmp"],["</xmp",po]],[["<![CDATA["],["]]>"]],[["<plaintext"],["</plaintext",po]]],dc=[[["<!--"],["-->"],["--!>"],["<!-",void 0,!0]],...zm],Om=new Uint32Array(256).map((e,t)=>{let a=t;for(let n=0;n<8;n++)a=a&1?3988292384^a>>>1:a>>>1;return a}),rc=12,ZE=4,Um=8,Bm=25,ov=2,aj=65535,nj="page.pdf",$E=1024,iv=12,JE=1,Hm=new Uint8Array([116,69,88,116,90,73,80,0]),oj=754974720,Dm=12,QE="<!DOCTYPE html>",ij="SingleFile: the page data contains every HTML tag that could hide an embedded file, the archive was written without its",rj="PNG image",sj="PDF document",lj=67324752,cj=33639248,uj=101010256,dj=101075792,hj=117853008,go=globalThis.browser,mj=["createRootDirectory","declareAppendedData","disableCompression","embeddedImage","embeddedPdf","extractDataFromPage","includeBOM","insertCanonicalLink","insertMetaCSP","insertMetaNoIndex","insertTextBody","maxAppendedDataLength","password","preventAppendedData","selfExtractingArchive","url","zipScript","zipWorkerURI"];function rv(e){let t=go&&go.runtime&&go.runtime.getURL?{workerURI:e.zipWorkerURI||nv,workerStartupTimeout:tj}:{useWebWorkers:!1};return Rh(t),t}async function pj(e,t,a=new Date){let n,o=!!(go&&go.runtime&&go.runtime.getURL);return rv(t),t.zipScript?n=t.zipScript:o&&(n=await(await ZI(go.runtime.getURL(ej))).text()),sv(e,t,n,i=>(e.url=t.url,e.archiveTime=new Date().toISOString(),gv(i,e,{password:t.password,disableCompression:t.disableCompression},t.createRootDirectory?String(Date.now())+"_"+(t.tabId||0)+"/":"",t.url)),a)}async function sv(e,t,a,n,o=new Date){let i={bufferedWrite:!0,keepOrder:!0,lastModDate:o,useCompressionStream:!0},r=new co(new Jo,i);await n(r);let s=await r.close();return Dr(e,t,a,s,i)}async function Dr(e,t,a,n,o){let{lastModDate:i}=o,r=new Jo;r.init();let s,l,c,u,d;t.embeddedImage&&(t.embeddedImage=new Uint8Array(t.embeddedImage));let h;if(t.embeddedImage&&t.selfExtractingArchive&&(h=Tj(e,t,i),h||pv(t,"embeddedImage",rj)),t.embeddedImage){let b=mv(t.embeddedImage);if(await Mt(r.writable,t.embeddedImage.slice(0,Um+Bm)),t.selfExtractingArchive)u=h.endTag,h.startHTMLData.pdfEntry&&(d=h.startHTMLData.pdfEntry,d.offset+=r.offset+iv),await Mt(r.writable,h.htmlData),await Mt(r.writable,h.htmlDataCRC);else if(t.embeddedPdf){let y=new Uint8Array([...uc(t.embeddedPdf.length+4),116,69,88,116,80,68,70,0,...new Uint8Array(t.embeddedPdf)]);await Mt(r.writable,y),await Mt(r.writable,Mm(y,4))}await Mt(r.writable,b),await Mt(r.writable,new Uint8Array(4)),c=r.offset,await Mt(r.writable,Hm),t.selfExtractingArchive&&await Mt(r.writable,new Ma().encode(u))}if(t.selfExtractingArchive){let b=await kj(e,r,a,t,i);s=b.extraDataOffset,d=d||b.pdfEntry}else!t.embeddedImage&&t.embeddedPdf&&await Mt(r.writable,new Uint8Array(t.embeddedPdf));let m=r.offset,p=new co({writable:r.writable,size:m},o);if(await p.appendZip(new Er(n)),d&&(new DataView(d.centralRecord.buffer).setUint32(42,d.offset,!0),await Mt(r.writable,d.centralRecord)),await p.close(void 0,{preventClose:!0}),d&&!yj(r,d.centralRecord.length))return t.preventEmbeddedPdfEntry=!0,Dr(e,t,a,n,o);let g=r.getData(),w=g.length-ov;if(t.selfExtractingArchive){let b=[],y=-1;if(!t.extractDataFromPageTags||t.extractDataFromPageTags[0]!="<plaintext>"){let T=g.subarray(m);if(t.extractDataFromPageTags){let v=dv(t.extractDataFromPageTags);if(ni(T,zm[v]))return Pm(T,e,t,a,n,o,v+1)}else if(ni(T,dc[0]))return Pm(T,e,t,a,n,o)}if(t.extractDataFromPage){for(let T=m;T<w;T++){let v=g[T];y=y>>>8^Om[(y^v)&255],v==10?b.push(0):v==13&&(T+1<w&&g[T+1]==10?(T++,y=y>>>8^Om[(y^10)&255],b.push(2)):b.push(1))}y=(y^-1)>>>0}let E="";t.preventAppendedData||(t.extractDataFromPageTags?E+=t.extractDataFromPageTags[1]:E+="-->");let k=t.preventAppendedData||t.embeddedImage?"":"</body></html>";if(t.extractDataFromPage){let T=new Uint32Array(3+Math.ceil(b.length/16));T[0]=y,T[1]=w-m,T[2]=b.length,b.forEach((x,_)=>T[3+(_>>4)]|=x<<(_&15)*2);let v=new Uint8Array(T.length*4),A=new DataView(v.buffer);if(T.forEach((x,_)=>A.setUint32(_*4,x,!0)),l="<sfz-extra-data>"+_j(Rm(v))+"</sfz-extra-data>",t.preventAppendedData||l.length>gj(t)-E.length-k.length-(t.embeddedImage?rc+ZE+JE:0)){if(!t.extraDataSize)return t.preventAppendedData=!0,t.extraDataSize=ev(l.length),Dr(e,t,a,n,o)}else E+=l}E+=k;let S=new Ma().encode(E);t.embeddedImage&&!wj(g,c,r.offset+S.length-c-4,h.tagIndex)&&(S=Mr(S,new Uint8Array(JE).fill(32))),await Mt(r.writable,S)}await r.writable.close();let f=await r.getData();if(t.extractDataFromPage&&t.extraDataSize!==void 0)if(t.extraDataSize>=l.length)f.set(new Ma().encode(l),m-s);else return t.extraDataSize=ev(l.length),Dr(e,t,a,n,o);if(t.declareAppendedData){let b=f.length-g.length+(t.embeddedImage?ZE+rc:0);b&&b<=aj&&fj(f,w,b,t)&&new DataView(f.buffer,f.byteOffset).setUint16(w,b,!0)}if(t.embeddedImage){let b=r.offset-c-4;if(t.selfExtractingArchive&&b>=oj)throw new Error("SingleFile: the embedded PNG chunk is too large to be hidden from the HTML parser");return f.set(uc(b),c-4),new Nm([f,Mm(f,c),t.embeddedImage.slice(t.embeddedImage.length-rc)],{type:"application/octet-stream"})}else return new Nm([f],{type:"application/octet-stream"})}function gj(e){return e.maxAppendedDataLength===void 0?16361:e.maxAppendedDataLength}function fj(e,t,a,n){if(n.extractDataFromPageTags&&n.extractDataFromPageTags[0]=="<plaintext>")return!0;let o=e.slice(t-Dm,t+ov);new DataView(o.buffer).setUint16(Dm,a,!0);let i=n.extractDataFromPageTags?dv(n.extractDataFromPageTags)+1:0;return!ni(o,dc[i])}function wj(e,t,a,n){let o=t-4,i=Mr(e.subarray(Math.max(0,o-Dm),o),uc(a),e.subarray(t,t+Hm.length));return!ni(i,dc[n])}function Mm(e,t=0){let a=new Uint8Array(4);return cv(a,lv(e,t)),a}function lv(e,t=0){let a=-1;for(;t<e.length;t++)a=a>>>8^Om[(a^e[t])&255];return(a^-1)>>>0}function bj(e,t=new Date){let a=new Ma().encode(nj),n=lv(e),o=t.getHours()<<11|t.getMinutes()<<5|t.getSeconds()>>1,i=Math.max(0,t.getFullYear()-1980)<<9|t.getMonth()+1<<5|t.getDate(),r=new Uint8Array(30+a.length),s=new DataView(r.buffer);s.setUint32(0,lj,!0),s.setUint16(4,20,!0),s.setUint16(10,o,!0),s.setUint16(12,i,!0),s.setUint32(14,n,!0),s.setUint32(18,e.length,!0),s.setUint32(22,e.length,!0),s.setUint16(26,a.length,!0),r.set(a,30);let l=new Uint8Array(46+a.length),c=new DataView(l.buffer);return c.setUint32(0,cj,!0),c.setUint16(4,768,!0),c.setUint16(6,20,!0),c.setUint16(12,o,!0),c.setUint16(14,i,!0),c.setUint32(16,n,!0),c.setUint32(20,e.length,!0),c.setUint32(24,e.length,!0),c.setUint16(28,a.length,!0),c.setUint32(38,33188<<16,!0),l.set(a,46),{localHeader:r,centralRecord:l}}function yj(e,t){let a=new DataView(e.array.buffer),n=e.offset-22;if(a.getUint32(n,!0)!=uj)return!1;let o=a.getUint16(n+8,!0),i=a.getUint16(n+10,!0),r=a.getUint32(n+12,!0),s=n-20,l;if(s>=0&&a.getUint32(s,!0)==hj){if(l=Number(a.getBigUint64(s+8,!0))+t,a.getUint32(l,!0)!=dj)return!1}else if(o+1>=65535||i+1>=65535||r+t>=4294967295)return!1;return o!=65535&&a.setUint16(n+8,o+1,!0),i!=65535&&a.setUint16(n+10,i+1,!0),r!=4294967295&&a.setUint32(n+12,r+t,!0),l!==void 0&&(a.setBigUint64(s+8,BigInt(l),!0),a.setBigUint64(l+24,a.getBigUint64(l+24,!0)+1n,!0),a.setBigUint64(l+32,a.getBigUint64(l+32,!0)+1n,!0),a.setBigUint64(l+40,a.getBigUint64(l+40,!0)+BigInt(t),!0)),!0}function ai(e){return e.toString().replace(/^[ \t]*\/\/.*$/gm,"").replace(/\n|\t/g,"")}function ev(e){return Math.ceil(e*1.01)+32}function uc(e){let t=new Uint8Array(4);return cv(t,e),t}function cv(e,t){e[0]=t>>24,e[1]=t>>16,e[2]=t>>8,e[3]=t}async function kj(e,t,a,n,o){let i="",r;if(!n.embeddedImage){let d=uv(e,n,o);d.pdfEntry&&(r=d.pdfEntry,r.offset+=t.offset),await Mt(t.writable,d.htmlArray)}if(i+="<div id=sfz-wait-message>Please wait...</div>",n.extractDataFromPage?(i+="<div id=sfz-error-message><strong>Error</strong>: Cannot extract the data of the page.",i+=' The file is still a valid ZIP file, you can rename it with a "zip" extension and unzip it to display the page and its resources.</div>'):(i+="<div id=sfz-error-message><strong>Error</strong>: Cannot open the page from the filesystem.",i+="<ul style='line-height:20px;'>",i+=`<li style='margin-bottom:10px'><strong>Chrome/Edge/Brave</strong>: Install <a href='https://www.getsinglefile.com'>SingleFile</a> and enable the option "Allow access to file URLs" in the details page of the extension.</li>`,i+='<li><strong>Safari</strong>: Select "Security > Disable Local File Restrictions" in the "Develop > Developer settings" menu.</li></ul></div>'),e.tocContent&&(i+=e.tocContent),n.insertTextBody&&!n.password){let d=new KE().parseFromString(e.content,"text/html");d.body.querySelectorAll("style, script, noscript").forEach(m=>m.remove());let h="";n.extractDataFromPage&&(h+=(e.title||"")+`

`),h+=d.body.innerText,d.body.querySelectorAll("single-file-note").forEach(m=>{let p=m.querySelector("template");if(p){let g=new KE().parseFromString(p.innerHTML,"text/html");h+=`
`+g.body.querySelector("textarea").value}}),h=h.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n +/g,`
`).replace(/\n\n\n+/g,`

`).trim(),i+=`
<main hidden>
`+h+`
</main>
`}let s=n.multiPageArchive?"("+ai(YE)+")(content,{extract:"+ai(xm)+",display:"+ai(Lm)+"})":"("+ai(xm)+")(content,{prompt}).then(({docContent}) => "+ai(Lm)+"(document,docContent))";a="<script>"+a+"document.currentScript.remove();globalThis.bootstrap=(()=>{let bootstrapStarted;return async content=>{if (bootstrapStarted) return bootstrapStarted; bootstrapStarted = "+s+";return bootstrapStarted;}})();("+ai(Rj)+')().then(globalThis.bootstrap).then(() => document.dispatchEvent(new CustomEvent("single-file-display-infobar"))).catch(error => {console.error(error);const waitMessage = document.getElementById("sfz-wait-message");if (waitMessage) { waitMessage.remove(); }const errorMessage = document.getElementById("sfz-error-message");if (errorMessage) { errorMessage.hidden = false; document.body.hidden = false; }});<\/script>',i+=a;let l="";if(n.extractDataFromPage&&n.extraDataSize){let d="<sfz-extra-data></sfz-extra-data>";l+=d+new Array(n.extraDataSize-d.length).fill(" ").join("")}i+=l;let c=Ej(n.extractDataFromPageTags||Fm[0]);i+=c;let u=c.length+l.length;return await Mt(t.writable,new Ma().encode(i)),{extraDataOffset:u,pdfEntry:r}}function Ej([e]){if(e=="<!--")return e+XE;let t=e.indexOf(">");return e.slice(0,t)+" id="+XE+e.slice(t)}function uv(e,t,a,n=""){let o="";t.includeBOM&&!t.extractDataFromPage&&!t.embeddedImage&&(o="\uFEFF");let i=t.embeddedImage?"":e.doctype,s="<html data-sfz><meta charset="+(t.extractDataFromPage?"windows-1252":"utf-8")+">",l=t.embeddedImage?Um+Bm+iv:0,c=o+i+s;l+new Ma().encode(c).length>$E&&(c=o+QE+s);let u=e.comment&&!t.embeddedImage&&!t.password?"<!--"+Sj(e.comment)+"-->":"",d=vj(e,t),h,m;if(t.embeddedPdf){let p=new Uint8Array(t.embeddedPdf);m=t.preventEmbeddedPdfEntry?void 0:bj(p,a);let g=m?m.localHeader:new Uint8Array(0),w=lc(Mr(g,p));if(w==-1)pv(t,"embeddedPdf",sj),m=void 0;else{let[f,b]=Fm[w],y=new Ma().encode(c+f);l+y.length+g.length>$E&&(y=new Ma().encode(o+QE+s+f));let E=new Ma().encode(b+u+d+n);h=new Uint8Array(y.length+g.length+p.length+E.length),h.set(y),h.set(g,y.length),h.set(p,y.length+g.length),h.set(E,y.length+g.length+p.length),m&&(m.offset=y.length)}}return t.embeddedPdf||(h=new Ma().encode(c+u+d+n)),{htmlArray:h,pdfEntry:m}}function vj(e,t){let a="",n=t.password?"":sc(e.title||"");return a+="<title>"+n+"</title>",t.insertCanonicalLink&&!t.password&&(a+='<link rel=canonical href="'+sc(t.url)+'">'),t.insertMetaNoIndex&&(a+="<meta name=robots content=noindex>"),e.viewport&&(a+='<meta name=viewport content="'+sc(e.viewport)+'">'),t.insertMetaCSP&&(a+=`<meta http-equiv=content-security-policy content=${JSON.stringify("default-src 'none';connect-src 'self' data: blob:;font-src 'self' data: blob:;img-src 'self' data: blob:;style-src 'self' 'unsafe-inline' data: blob:;frame-src 'self' data: blob:;media-src 'self' data: blob:;script-src 'self' 'unsafe-inline' data: blob:;object-src 'self' data: blob:;form-action 'none';base-uri 'none'")}>`),a+="<style>@keyframes display-wait-message{0%{opacity:0}100%{opacity:1}}body{color:transparent}div{color:initial}body>:not(#sfz-wait-message,#sfz-error-message){display:none}</style>",a+="<body hidden>",a}function Sj(e){let t=e.replace(/--(!?)>/g,"--$1 >");return(t.startsWith(">")||t.startsWith("->"))&&(t=" "+t),t.endsWith("<!-")&&(t+=" "),t}function sc(e){return Array.from(e).map(t=>{let a=t.codePointAt(0);return a<32||a>126||t=="&"||t=="<"||t==">"||t=='"'?"&#"+a+";":t}).join("")}function dv(e){let t=cc.findIndex(([a])=>a==e[0]);if(t==-1)throw new Error("Unknown data tags: "+e[0]);return t}function Pm(e,t,a,n,o,i,r=0){return!(cc[r][0]=="<plaintext>")&&ni(e,zm[r])?Pm(e,t,a,n,o,i,r+1):(a.extractDataFromPageTags=cc[r],a.extractDataFromPageTags[0]=="<plaintext>"&&(a.preventAppendedData=!0),Dr(t,a,n,o,i))}function lc(e,t=0){let a=dc.slice(t,-1).findIndex(n=>!ni(e,n));return a==-1?-1:a+t}function ni(e,t){let a=new Map;for(let n of t){let[o,,i]=n;if(i){if(av(e,n,e.length-o.length))return!0}else{let r=o.charCodeAt(0);tv(a,r,n);let s=hv(r);s!=-1&&tv(a,s,n)}}for(let[n,o]of a)for(let i=e.indexOf(n);i!=-1;i=e.indexOf(n,i+1))for(let r=0;r<o.length;r++)if(av(e,o[r],i))return!0;return!1}function tv(e,t,a){e.has(t)||e.set(t,[]),e.get(t).push(a)}function av(e,[t,a],n){let o=t.length;if(n<0||n+o>e.length)return!1;for(let i=0;i<o;i++){let r=t.charCodeAt(i),s=e[n+i];if(s!=r&&s!=hv(r))return!1}return a===void 0||Aj(a,e[n+o])}function Aj(e,t){return t!==void 0&&e.includes(String.fromCharCode(t))}function hv(e){let t=e|32;return t>=97&&t<=122?e^32:-1}function Mr(...e){let t=new Uint8Array(e.reduce((n,o)=>n+o.length,0)),a=0;return e.forEach(n=>{t.set(n,a),a+=n.length}),t}function Tj(e,t,a){let n=Mr(mv(t.embeddedImage),new Uint8Array(4),Hm),o=lc(n);for(;o!=-1;){let[i,r]=Fm[o],s=uv(e,t,a,i),l=new Uint8Array([...uc(s.htmlArray.length+4),116,69,88,116,80,78,71,0,...s.htmlArray]),c=Mm(l,4),u=Mr(c,n);if(o==0&&(c[0]==62||c[0]==45&&c[1]==62)||lc(u,o)!=o)o=lc(n,o+1);else return{tagIndex:o,endTag:r,startHTMLData:s,htmlData:l,htmlDataCRC:c}}}function mv(e){return e.slice(Um+Bm,e.length-rc)}function pv(e,t,a){delete e[t],console.warn(ij,a)}async function Mt(e,t){let a=e.getWriter();await a.ready,await a.write(t),a.releaseLock()}async function gv(e,t,a,n,o){let i={};for(let s of Object.keys(t.resources))for(let l of t.resources[s])l.password=a.password,l.url&&!l.url.startsWith("data:")&&(i[l.name]=l.url);let r=JSON.stringify({originalUrl:t.url,title:t.title,archiveTime:t.archiveTime,indexFilename:"index.html",resources:i},null,2);await Promise.all([Promise.all([jm(e,n,{name:"index.html",extension:".html",content:t.content,url:o,password:a.password},a.disableCompression),jm(e,n,{name:"manifest.json",extension:".json",content:r,password:a.password},a.disableCompression)]),Promise.all(Object.keys(t.resources).map(async s=>Promise.all(t.resources[s].map(l=>s=="frames"?(l.archiveTime=t.archiveTime,gv(e,l,a,n+l.name,l.url)):jm(e,n,l,a.disableCompression)))))])}async function jm(e,t,a,n){let o=typeof a.content=="string"?new kr(a.content):new Oa(new Nm([new Uint8Array(a.content)])),i={password:a.password,bufferedWrite:!0};a.password||(i.comment=a.url&&a.url.startsWith("data:")?"data:":a.url),(n||!Cj(a.contentType)&&QI.includes(a.extension))&&(i.level=0),await e.add(t+a.name,o,i)}function Cj(e){return!!e&&(e.startsWith(JI)||$I.includes(e))}async function Rj(){let e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",t="sfz-data",a=["script","style","noframes","noembed","iframe","xmp","svg","plaintext"],{Blob:n,XMLHttpRequest:o,NodeFilter:i,document:r,zip:s,location:l}=globalThis,c=new Map([[65533,0],[8364,128],[8218,130],[402,131],[8222,132],[8230,133],[8224,134],[8225,135],[710,136],[8240,137],[352,138],[8249,139],[338,140],[381,142],[8216,145],[8217,146],[8220,147],[8221,148],[8226,149],[8211,150],[8212,151],[732,152],[8482,153],[353,154],[8250,155],[339,156],[382,158],[376,159]]),u=new Uint32Array(256).map((f,b)=>{let y=b;for(let E=0;E<8;E++)y=y&1?3988292384^y>>>1:y>>>1;return y});return new Promise((f,b)=>{let y=!1;k();async function E(){try{await d(r),r.body.querySelectorAll("meta, style").forEach(T=>r.head.appendChild(T));let S=m();h("sfz-wait-message",2),f(S)}catch(S){console.error(S),h("sfz-error-message",2),b(S)}}function k(){let S=new o;S.responseType="blob",S.open("GET",""),S.onerror=()=>E(),S.send(),S.onreadystatechange=()=>{if(S.readyState===2&&!y)if(S.status===200){y=!0;let T=S.getResponseHeader("Accept-Ranges")==="bytes";S.abort(),h("sfz-wait-message",2,!0),T?f(new s.HttpRangeReader(l.href,{useXHR:!0,combineSizeEocd:!0})):k()}else S.abort(),E()},y&&(S.onload=()=>{S.status===200?f(S.response):E()})}});function d(f){return new Promise(b=>{f.readyState==="complete"||f.readyState==="interactive"?b():f.addEventListener("DOMContentLoaded",()=>b())})}function h(f,b=0,y){let E=r.getElementById(f);E&&(Array.from(r.body.childNodes).forEach(k=>{k.id!=f&&(k.id=="sfz-wait-message"||k.id=="sfz-error-message"?k.hidden=!0:y||k.remove())}),E.hidden=!1,r.body.hidden=!1,E.style="opacity: 0; animation: 0s linear "+b+"s display-wait-message 1 normal forwards")}function m(){let f=r.querySelector("sfz-extra-data");if(f){let b=s.inflateRaw(w(f.textContent)),y=new DataView(b.buffer,b.byteOffset,b.length&-4),E=Array.from(r.querySelectorAll("[id="+t+"]")).filter(S=>a.includes(S.localName)),k=0;if(!E.length){let S=r.createTreeWalker(r,i.SHOW_COMMENT);for(;S.nextNode();)S.currentNode.data.startsWith(t)&&E.push(S.currentNode);k=t.length}if(E.length>1)throw new Error("Multiple zip data candidates found");if(E.length)return p(E[0],y,k)}throw new Error("Extra zip data not found")}function p(f,b,y){let E=b.getUint32(0,!0),k=b.getUint32(4,!0),S=b.getUint32(8,!0),T=new Uint8Array(k+2),{textContent:v}=f,A=0,x=0,_=-1;for(let z=y;z<v.length&&A<k;z++){let U=v.charCodeAt(z);if(U==10){let K=b.getUint32(12+(x>>4)*4,!0)>>>(x&15)*2&3;if(x++,K==3)throw new Error("Unsupported newline code in the extracted zip data");K==0?O(10):(O(13),K==2&&O(10))}else O(U>255?c.get(U):U)}if(_=(_^-1)>>>0,A!=k||x!=S||_!=E)throw new Error("Invalid checksum of the extracted zip data");return new n([new Uint8Array(g(T)),T],{type:"application/octet-stream"});function O(z){T[A]=z,_=_>>>8^u[(_^z)&255],A++}}function g(f){let b=new DataView(f.buffer,f.byteOffset,f.length),y=f.length-22,E=y-20;if(y<0||b.getUint32(y,!0)!=101010256)return 0;let k=b.getUint32(y+16,!0),S=y-b.getUint32(y+12,!0),T=33639248;return E>=0&&b.getUint32(E,!0)==117853008&&(k=b.getUint32(E+8,!0)+b.getUint32(E+12,!0)*4294967296,S=E-56,T=101075792),S<0||b.getUint32(S,!0)!=T?0:Math.max(0,k-S)}function w(f){f=String(f).replace(/[^A-Za-z0-9+/=]/g,"");let b=f.length,y=[];for(let E=0;E<b;E+=4){let k=e.indexOf(f[E]),S=e.indexOf(f[E+1]),T=e.indexOf(f[E+2]),v=e.indexOf(f[E+3]),A=k<<18|S<<12|(T&63)<<6|v&63;y.push(A>>16&255),f[E+2]!=="="&&y.push(A>>8&255),f[E+3]!=="="&&y.push(A&255)}return new Uint8Array(y)}}var mn="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function _j(e){let t="",a=e.length,n=0;for(;n+2<a;n+=3){let i=e[n]<<16|e[n+1]<<8|e[n+2];t+=mn[i>>18&63]+mn[i>>12&63]+mn[i>>6&63]+mn[i&63]}let o=a-n;if(o===1){let i=e[n]<<16;t+=mn[i>>18&63]+mn[i>>12&63]+"=="}else if(o===2){let i=e[n]<<16|e[n+1]<<8;t+=mn[i>>18&63]+mn[i>>12&63]+mn[i>>6&63]+"="}return t}var is={};et(is,{TIMEOUT_INIT_REQUEST_MESSAGE:()=>Qv,cleanup:()=>LO,getAsync:()=>_O,getSync:()=>xO,initResponse:()=>vp});var Ao={};et(Ao,{process:()=>fp,resetZoomLevel:()=>wO});var Pr={};et(Pr,{IMAGE_LOADED_EVENT:()=>pc,LOAD_IMAGE_EVENT:()=>mc,getFontsData:()=>qm,getWorkletsData:()=>Ym,loadDeferredContentEnd:()=>Xm,loadDeferredContentResetZoomLevel:()=>Zm,loadDeferredContentStart:()=>Km});var xj="single-file-load-deferred-content-start",Lj="single-file-load-deferred-content-end",Ij="single-file-load-deferred-content-keep-zoom-level-start",jj="single-file-load-deferred-content-keep-zoom-level-end",Nj="single-file-load-deferred-content-keep-zoom-level-reset",Oj="single-file-load-deferred-content-reset",Dj="single-file-block-cookies-start",Mj="single-file-block-cookies-end",Pj="single-file-dispatch-scroll-event-start",Fj="single-file-dispatch-scroll-event-end",zj="single-file-block-storage-start",Uj="single-file-block-storage-end",mc="single-file-load-image",pc="single-file-image-loaded",Bj="single-file-new-font-face",Hj="single-file-delete-font",Gj="single-file-clear-fonts",Wj="single-file-new-worklet",Gm="_singleFile_fontFaces",Wm="_singleFile_worklets",aa=globalThis.CustomEvent,pt=globalThis.document,Vj=globalThis.Document,Vm=globalThis.JSON,qj=globalThis.MutationObserver,ii,hc;globalThis.window[Gm]?ii=globalThis.window[Gm]:ii=globalThis.window[Gm]=new Map;globalThis.window[Wm]?hc=globalThis.window[Wm]:hc=globalThis.window[Wm]=new Map;fv();new qj(fv).observe(pt,{childList:!0});function fv(){pt instanceof Vj&&(pt.addEventListener(Bj,Yj),pt.addEventListener(Hj,Kj),pt.addEventListener(Gj,Xj),pt.addEventListener(Wj,Zj))}function Yj(e){let t=e.detail,a=Object.assign({},t);delete a.src,ii.set(Vm.stringify(a),t)}function Kj(e){let t=e.detail,a=Object.assign({},t);delete a.src,ii.delete(Vm.stringify(a))}function Xj(){ii.clear()}function Zj(e){let t=e.detail;hc.set(t.moduleURL,t)}function qm(){return Array.from(ii.values())}function Ym(){return Array.from(hc.values())}function Km(e){e.loadDeferredContentBlockCookies&&pt.dispatchEvent(new aa(Dj)),e.loadDeferredContentBlockStorage&&pt.dispatchEvent(new aa(zj)),e.loadDeferredContentDispatchScrollEvent&&pt.dispatchEvent(new aa(Pj));let t=Vm.stringify({minZoomFactor:e.loadDeferredContentMinZoomFactor});e.loadDeferredContentKeepZoomLevel?pt.dispatchEvent(new aa(Ij,{detail:t})):pt.dispatchEvent(new aa(xj,{detail:t}))}function Xm(e){e.loadDeferredContentBlockCookies&&pt.dispatchEvent(new aa(Mj)),e.loadDeferredContentBlockStorage&&pt.dispatchEvent(new aa(Uj)),e.loadDeferredContentDispatchScrollEvent&&pt.dispatchEvent(new aa(Fj)),e.loadDeferredContentKeepZoomLevel?pt.dispatchEvent(new aa(jj)):pt.dispatchEvent(new aa(Lj))}function Zm(e){e.loadDeferredContentKeepZoomLevel?pt.dispatchEvent(new aa(Nj)):pt.dispatchEvent(new aa(Oj))}var jc={};et(jc,{ASSIGNED_SLOT_ATTRIBUTE_NAME:()=>pi,ASSIGNED_SLOT_SEPARATOR:()=>vc,ASYNC_SCRIPT_ATTRIBUTE_NAME:()=>bc,CANVAS_ATTRIBUTE_NAME:()=>bi,COMMENT_HEADER:()=>fc,COMMENT_HEADER_LEGACY:()=>up,CUSTOM_STYLESHEET_ATTRIBUTE_NAME:()=>Kr,DEFAULT_REPLACED_CHARACTERS:()=>Qm,DEFAULT_REPLACEMENT_CHARACTER:()=>Tv,DEFAULT_REPLACEMENT_CHARACTERS:()=>ep,EMPTY_RESOURCE:()=>vo,HIDDEN_CONTENT_ATTRIBUTE_NAME:()=>ui,HIDDEN_FRAME_ATTRIBUTE_NAME:()=>ko,IMAGE_ATTRIBUTE_NAME:()=>gi,INFOBAR_TAGNAME:()=>Xr,INPUT_CHECKED_ATTRIBUTE_NAME:()=>yi,INPUT_VALUE_ATTRIBUTE_NAME:()=>Pn,INVALID_ELEMENT_ATTRIBUTE_NAME:()=>cp,LAZY_SRC_ATTRIBUTE_NAME:()=>Hr,LINK_STYLESHEET_ATTRIBUTE_NAME:()=>Ei,MESSAGE_PREFIX:()=>yo,NESTING_END_MARKER:()=>Zr,NESTING_RECREATED_ATTRIBUTE_NAME:()=>Sc,NESTING_START_MARKER:()=>Fn,NESTING_TRACK_ID_ATTRIBUTE_NAME:()=>At,NO_SCRIPT_PROPERTY_NAME:()=>wc,ON_AFTER_CAPTURE_EVENT_NAME:()=>Vr,ON_BEFORE_CAPTURE_EVENT_NAME:()=>Wr,POSTER_ATTRIBUTE_NAME:()=>fi,PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME:()=>di,REMOVED_CONTENT_ATTRIBUTE_NAME:()=>ci,SELECTED_CONTENT_ATTRIBUTE_NAME:()=>lp,SHADOW_ROOT_ATTRIBUTE_NAME:()=>hi,SINGLE_FILE_UI_ELEMENT_CLASS:()=>Eo,SLOT_ATTRIBUTE_NAME:()=>mi,STYLESHEET_ATTRIBUTE_NAME:()=>ki,STYLE_ATTRIBUTE_NAME:()=>Yr,VIDEO_ATTRIBUTE_NAME:()=>wi,WAIT_FOR_USERSCRIPT_PROPERTY_NAME:()=>bo,WIN_ID_ATTRIBUTE_NAME:()=>qr,appendInfobar:()=>mp,digest:()=>ka,fixInvalidNesting:()=>xc,flatten:()=>Ai,getContentSize:()=>Un,getDataURI:()=>as,getElementCharacters:()=>Hv,getFontStretch:()=>Si,getFontWeight:()=>zn,getMarkerCharacters:()=>Gv,getNestingMarkerData:()=>_c,getPosterDataURI:()=>Ac,getPseudoElementCharacters:()=>Gr,getShadowRoot:()=>Qr,getStylesheetsInCascadeOrder:()=>ts,getValidFilename:()=>si,initDoc:()=>Cc,initUserScriptHandler:()=>Tc,markInvalidNesting:()=>Rc,normalizeFontFamily:()=>So,normalizeOptions:()=>dp,normalizeSerializedCSSText:()=>qv,parseDocContent:()=>Ic,postProcessDoc:()=>es,preProcessDoc:()=>$r,removeNestingMarkers:()=>Jr,removeQuotes:()=>vi,serialize:()=>Lc});var gc={};et(gc,{process:()=>Fr});var wv="[\\x20\\t\\r\\n\\f]",$j=new RegExp("\\\\([\\da-f]{1,6}"+wv+"?|("+wv+")|.)","ig");function Fr(e){return e.replace($j,(t,a,n)=>{let o="0x"+a-65536;return o!==o||n?a:o<0?String.fromCharCode(o+65536):String.fromCharCode(o>>10|55296,o&1023|56320)})}var fo={};et(fo,{process:()=>zr,serialize:()=>pn});function zr(e){function t(y){return y===" "||y==="	"||y===`
`||y==="\f"||y==="\r"}function a(y){let E,k=y.exec(e.substring(g));if(k)return E=k[0],g+=E.length,E}let n=e.length,o=/^[ \t\n\r\u000c]+/,i=/^[, \t\n\r\u000c]+/,r=/^[^ \t\n\r\u000c]+/,s=/[,]+$/,l=/^\d+$/,c=/^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/,u,d,h,m,p,g=0,w=[];for(;;){if(a(i),g>=n)return w;u=a(r),d=[],u.slice(-1)===","?(u=u.replace(s,""),b()):f()}function f(){for(a(o),h="",m="in descriptor";;){if(p=e.charAt(g),m==="in descriptor")if(t(p))h&&(d.push(h),h="",m="after descriptor");else if(p===","){g+=1,h&&d.push(h),b();return}else if(p==="(")h=h+p,m="in parens";else if(p===""){h&&d.push(h),b();return}else h=h+p;else if(m==="in parens")if(p===")")h=h+p,m="in descriptor";else if(p===""){d.push(h),b();return}else h=h+p;else if(m==="after descriptor"&&!t(p))if(p===""){b();return}else m="in descriptor",g-=1;g+=1}}function b(){let y=!1,E,k,S,T,v,A,x,_,O,z={};for(T=0;T<d.length;T++)v=d[T],A=v[v.length-1],x=v.substring(0,v.length-1),_=parseInt(x,10),O=parseFloat(x),l.test(x)&&A==="w"?((E||k!==void 0)&&(y=!0),_===0?y=!0:E=_):c.test(x)&&A==="x"?((E||k!==void 0||S)&&(y=!0),O<0?y=!0:k=O):l.test(x)&&A==="h"?((S||k!==void 0)&&(y=!0),_===0?y=!0:S=_):y=!0;z.url=u,y?z.descriptors=d.slice():(E&&(z.w=E),k!==void 0&&(z.d=k),S&&(z.h=S)),w.push(z)}}function pn(e){return e.map(function(t){let a=t.descriptors?t.descriptors.slice():[];return t.w&&a.push(t.w+"w"),t.h&&a.push(t.h+"h"),t.d!==void 0&&a.push(t.d+"x"),[t.url].concat(a).join(" ")}).join(", ")}var Jj=[1732584193,4023233417,2562383102,271733878,3285377520],Qj=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],eN=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298],tN=[0xcbbb9d5dc1059ed8n,0x629a292a367cd507n,0x9159015a3070dd17n,0x152fecd8f70e5939n,0x67332667ffc00b31n,0x8eb44a8768581511n,0xdb0c2e0d64f98fa7n,0x47b5481dbefa4fa4n],aN=[0x6a09e667f3bcc908n,0xbb67ae8584caa73bn,0x3c6ef372fe94f82bn,0xa54ff53a5f1d36f1n,0x510e527fade682d1n,0x9b05688c2b3e6c1fn,0x1f83d9abfb41bd6bn,0x5be0cd19137e2179n],nN=[0x428a2f98d728ae22n,0x7137449123ef65cdn,0xb5c0fbcfec4d3b2fn,0xe9b5dba58189dbbcn,0x3956c25bf348b538n,0x59f111f1b605d019n,0x923f82a4af194f9bn,0xab1c5ed5da6d8118n,0xd807aa98a3030242n,0x12835b0145706fben,0x243185be4ee4b28cn,0x550c7dc3d5ffb4e2n,0x72be5d74f27b896fn,0x80deb1fe3b1696b1n,0x9bdc06a725c71235n,0xc19bf174cf692694n,0xe49b69c19ef14ad2n,0xefbe4786384f25e3n,0x0fc19dc68b8cd5b5n,0x240ca1cc77ac9c65n,0x2de92c6f592b0275n,0x4a7484aa6ea6e483n,0x5cb0a9dcbd41fbd4n,0x76f988da831153b5n,0x983e5152ee66dfabn,0xa831c66d2db43210n,0xb00327c898fb213fn,0xbf597fc7beef0ee4n,0xc6e00bf33da88fc2n,0xd5a79147930aa725n,0x06ca6351e003826fn,0x142929670a0e6e70n,0x27b70a8546d22ffcn,0x2e1b21385c26c926n,0x4d2c6dfc5ac42aedn,0x53380d139d95b3dfn,0x650a73548baf63den,0x766a0abb3c77b2a8n,0x81c2c92e47edaee6n,0x92722c851482353bn,0xa2bfe8a14cf10364n,0xa81a664bbc423001n,0xc24b8b70d0f89791n,0xc76c51a30654be30n,0xd192e819d6ef5218n,0xd69906245565a910n,0xf40e35855771202an,0x106aa07032bbd1b8n,0x19a4c116b8d2d0c8n,0x1e376c085141ab53n,0x2748774cdf8eeb99n,0x34b0bcb5e19b48a8n,0x391c0cb3c5c95a63n,0x4ed8aa4ae3418acbn,0x5b9cca4f7763e373n,0x682e6ff3d6b2b8a3n,0x748f82ee5defb2fcn,0x78a5636f43172f60n,0x84c87814a1f0ab72n,0x8cc702081a6439ecn,0x90befffa23631e28n,0xa4506cebde82bde9n,0xbef9a3f7b2c67915n,0xc67178f2e372532bn,0xca273eceea26619cn,0xd186b8c721c0c207n,0xeada7dd6cde0eb1en,0xf57d4f7fee6ed178n,0x06f067aa72176fban,0x0a637dc5a2c898a6n,0x113f9804bef90daen,0x1b710b35131c471bn,0x28db77f523047d84n,0x32caab7b40c72493n,0x3c9ebe0a15c9bebcn,0x431d67c49c100d4cn,0x4cc5d4becb3e42b6n,0x597f299cfc657e2an,0x5fcb6fab3ad6faecn,0x6c44198c4a475817n],wo=0xffffffffffffffffn;function yv(e,t){if(e=="SHA-1")return oN(t);if(e=="SHA-256")return iN(t);if(e=="SHA-384")return bv(t,tN,6);if(e=="SHA-512")return bv(t,aN,8);throw new Error("Unsupported algorithm: "+e)}function oN(e){let t=Int32Array.from(Jj),a=new Int32Array(80),n=$m(e,64);for(let o=0;o<n.byteLength;o+=64){for(let u=0;u<16;u++)a[u]=n.getUint32(o+u*4);for(let u=16;u<80;u++){let d=a[u-3]^a[u-8]^a[u-14]^a[u-16];a[u]=d<<1|d>>>31}let[i,r,s,l,c]=t;for(let u=0;u<80;u++){let d,h;u<20?(d=r&s|~r&l,h=1518500249):u<40?(d=r^s^l,h=1859775393):u<60?(d=r&s|r&l|s&l,h=2400959708):(d=r^s^l,h=3395469782);let m=(i<<5|i>>>27)+d+c+h+a[u]|0;c=l,l=s,s=r<<30|r>>>2,r=i,i=m}t[0]+=i,t[1]+=r,t[2]+=s,t[3]+=l,t[4]+=c}return kv(t)}function iN(e){let t=Int32Array.from(Qj),a=new Int32Array(64),n=$m(e,64);for(let o=0;o<n.byteLength;o+=64){for(let m=0;m<16;m++)a[m]=n.getUint32(o+m*4);for(let m=16;m<64;m++){let p=a[m-15],g=a[m-2],w=Pa(p,7)^Pa(p,18)^p>>>3,f=Pa(g,17)^Pa(g,19)^g>>>10;a[m]=a[m-16]+w+a[m-7]+f}let[i,r,s,l,c,u,d,h]=t;for(let m=0;m<64;m++){let p=Pa(c,6)^Pa(c,11)^Pa(c,25),g=c&u^~c&d,w=h+p+g+eN[m]+a[m]|0,f=Pa(i,2)^Pa(i,13)^Pa(i,22),b=i&r^i&s^r&s,y=f+b|0;h=d,d=u,u=c,c=l+w|0,l=s,s=r,r=i,i=w+y|0}t[0]+=i,t[1]+=r,t[2]+=s,t[3]+=l,t[4]+=c,t[5]+=u,t[6]+=d,t[7]+=h}return kv(t)}function bv(e,t,a){let n=Array.from(t),o=new Array(80),i=$m(e,128);for(let l=0;l<i.byteLength;l+=128){for(let b=0;b<16;b++)o[b]=BigInt(i.getUint32(l+b*8))<<32n|BigInt(i.getUint32(l+b*8+4));for(let b=16;b<80;b++){let y=o[b-15],E=o[b-2],k=Fa(y,1n)^Fa(y,8n)^y>>7n,S=Fa(E,19n)^Fa(E,61n)^E>>6n;o[b]=o[b-16]+k+o[b-7]+S&wo}let[c,u,d,h,m,p,g,w]=n;for(let b=0;b<80;b++){let y=Fa(m,14n)^Fa(m,18n)^Fa(m,41n),E=m&p^~m&g,k=w+y+E+nN[b]+o[b]&wo,S=Fa(c,28n)^Fa(c,34n)^Fa(c,39n),T=c&u^c&d^u&d,v=S+T&wo;w=g,g=p,p=m,m=h+k&wo,h=d,d=u,u=c,c=k+v&wo}[c,u,d,h,m,p,g,w].forEach((b,y)=>n[y]=n[y]+b&wo)}let r=new ArrayBuffer(a*8),s=new DataView(r);for(let l=0;l<a;l++)s.setUint32(l*8,Number(n[l]>>32n)),s.setUint32(l*8+4,Number(n[l]&0xffffffffn));return r}function $m(e,t){let a=Math.ceil((e.length+1+t/8)/t)*t,n=new Uint8Array(a);n.set(e),n[e.length]=128;let o=new DataView(n.buffer);return o.setUint32(a-8,Math.floor(e.length/536870912)),o.setUint32(a-4,e.length<<3),o}function Pa(e,t){return e>>>t|e<<32-t}function Fa(e,t){return(e>>t|e<<64n-t)&wo}function kv(e){let t=new ArrayBuffer(e.length*4),a=new DataView(t);return e.forEach((n,o)=>a.setUint32(o*4,n)),t}var Le="single-file-",fc="Page saved with SingleFile",Jm="SingleFile",bo="_singleFile_waitForUserScript",yo="__frameTree__::",wc="singleFileDisabledNoscript";var ri="single-file-infobar",sN=`
.infobar,
.infobar .infobar-icon,
.infobar .infobar-link-icon {
  min-inline-size: 28px;
  min-block-size: 28px;
  box-sizing: border-box;
}

.infobar,
.infobar .infobar-close-icon,
.infobar .infobar-link-icon {
  opacity: 0.7;
  transition: opacity 250ms;
}

.infobar:hover,
.infobar .infobar-close-icon:hover,
.infobar .infobar-link-icon:hover {
  opacity: 1;
}

.infobar,
.infobar-content {
  display: flex;
}

.infobar {
  position: fixed;
  max-height: calc(100% - 32px);
  top: 16px;
  right: 16px;
  margin-inline-start: 16px;
  margin-block-end: 16px;
  color: #2d2d2d;
  background-color: #737373;
  border: 2px solid;
  border-color: #eee;
  border-radius: 16px;
  z-index: 2147483647;
}

.infobar:valid, .infobar:not(:focus-within):not(.infobar-focus) .infobar-content {
  display: none;
}

.infobar:focus-within, .infobar.infobar-focus {
  background-color: #f9f9f9;
  border-color: #878787;
  border-radius: 8px;
  opacity: 1;
  transition-property: opacity, background-color, border-color, border-radius, color;
}

.infobar-content {
  border: 2px solid;
  border-color: #f9f9f9;
  border-radius: 6px;
  background-color: #f9f9f9;
  overflow: auto;
}

.infobar-content span {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  line-height: 18px;
  word-break: break-word;
  white-space: pre-wrap;
  margin-inline: 4px;
  margin-block: 4px;
}

.infobar .infobar-icon,
.infobar .infobar-close-icon,
.infobar .infobar-link-icon {
  cursor: pointer;
  background-position: center;
  background-repeat: no-repeat;
}

.infobar .infobar-close-icon,
.infobar .infobar-link-icon {
  align-self: flex-start;
}

.infobar .infobar-icon {
  position: absolute;
  min-inline-size: 24px;
  min-block-size: 24px;
}

.infobar:focus-within .infobar-icon, .infobar.infobar-focus .infobar-icon {
  z-index: -1;
  background-image: none;
  margin: 4px;
}

.infobar .infobar-close-icon {
  min-inline-size: 22px;
  min-block-size: 22px;
}

.infobar .infobar-icon {
  background-color: transparent;
  background-size: 70%;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABABAMAAABYR2ztAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHADIRLMaOHwAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAPUExURQAAAIqKioyNjY2OjvDw8L2y1DEAAAABdFJOUwBA5thmAAAAAWJLR0QB/wIt3gAAAGNJREFUSMdjYCAJsLi4OBCQx6/CBQwIGIDPCBcXAkYQUsACU+AwlBVQHg6Eg5pgZBGOboIJZugDFwRwoJECJCUOhJI1wZwzqmBUwagCuipgIqTABG9h7YIKaKGAURAFEF/6AQAO4HqSoDP8bgAAAABJRU5ErkJggg==);
}

.infobar .infobar-link-icon {
  right: 4px;
  background-size: 60%;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAgMAAADXB5lNAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHAB8H+DhhoQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAJUExURQAAAICHi4qKioTuJAkAAAABdFJOUwBA5thmAAAAAWJLR0QCZgt8ZAAAAJJJREFUOI3t070NRCEMA2CnYAOyDyPwpHj/Va7hJ3FzV7zy3ET5JIwoAF6Jk4wzAJAkzxAYG9YRTgB+24wBgKmfrGAKTcEfAY4KRlRoIeBTgKOCERVaCPgU4Khge2GqKOBTgKOCERVaAEC/4PNcnyoSWHpjqkhwKxbcig0Q6AorXYF/+A6eIYD1lVbwG/jdA6/kA2THRAURVubcAAAAAElFTkSuQmCC);
}

.infobar .infobar-close-icon {
  appearance: none;
  background-size: 80%;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAgMAAADXB5lNAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHAB8VC4EQ6QAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAJUExURQAAAICHi4qKioTuJAkAAAABdFJOUwBA5thmAAAAAWJLR0QCZgt8ZAAAAJtJREFUOI3NkrsBgCAMRLFwBPdxBArcfxXFkO8rbKWAAJfHJ9faf9vuYX/749T5NmShm3bEwbe2SxeuM4+2oxDL1cDoKtVUjRy+tH78Cv2CS+wIiQNC1AEhk4AQeUTMWUJMfUJMSEJMSEY8kIx4IONroaYAimNxsXp1PA7PxwfVL8QnowwoVC0lig07wDDVUjAdbAnjwtow/z/bDW7eI4M2KruJAAAAAElFTkSuQmCC);
}
`,lN=`
.infobar::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background-color: #dd6a00;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
  animation-name: flash;
  animation-duration: .5s;
  animation-timing-function: cubic-bezier(0.39, 0.58, 0.57, 1);
  animation-delay: 1s;
  animation-iteration-count: 2;
  transition: visibility 0s 999999s;
}

.infobar:focus-within::before, .infobar.infobar-focus::before {
  visibility: hidden;
  transition-delay: 0s;
}

.infobar::after {
  content: "";
  position: absolute;
  inset: -2px;
  border: 2px solid #dd6a00;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
  animation-name: ripple;
  animation-duration: 3s;
  animation-timing-function: ease-out;
  animation-delay: 2s;
  animation-iteration-count: 3;
  transition: visibility 0s 999999s;
}

.infobar:focus-within::after, .infobar.infobar-focus::after {
  visibility: hidden;
  transition-delay: 0s;
}

@keyframes flash {
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  45%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .infobar::before,
  .infobar::after {
    animation-name: none;
  }
}
`;function Ev(e,t,a){if(!e.querySelector(ri)){let n;t.infobarContent?n=t.infobarContent.replace(/\\n/g,`
`).replace(/\\t/g,"	"):t.saveDate&&(n=t.saveDate),n=n||"No info";let o=e.body.tagName=="BODY"?e.body:e.documentElement,i=uN(e,ri,o),r=e.createElement("style");r.textContent=`${ri}::before,${ri}::after{content:none !important}`,i.appendChild(r);let s;if(a)s=i.attachShadow({mode:"open"});else{let w=e.createElement("template");w.setAttribute("shadowrootmode","open"),i.appendChild(w),s=w}let l=e.createElement("div"),c=e.createElement("style");c.textContent=sN,t.animateInfobar&&(c.textContent+=lN),t.infobarPositionAbsolute&&(c.textContent+=".infobar { position: absolute; }",getComputedStyle(o).position=="static"&&o.style.setProperty("position","relative","important")),t.infobarPositionTop?c.textContent+=`.infobar { top: ${t.infobarPositionTop}; bottom: auto; }`:t.infobarPositionBottom&&(c.textContent+=`.infobar { bottom: ${t.infobarPositionBottom}; top: auto; }`),t.infobarPositionRight?c.textContent+=`.infobar { right: ${t.infobarPositionRight}; left: auto; }`:t.infobarPositionLeft&&(c.textContent+=`.infobar { left: ${t.infobarPositionLeft}; right: auto; }`),c.textContent=c.textContent.replace(/ {2}/g,"").replace(/\n/g,"").replace(/: /g,":").replace(/, /g,","),l.appendChild(c);let u=e.createElement("form");u.classList.add("infobar"),t.openInfobar&&u.classList.add("infobar-focus"),l.appendChild(u);let d=e.createElement("span");d.tabIndex=-1,d.classList.add("infobar-icon"),u.appendChild(d);let h=e.createElement("span");h.tabIndex=-1,h.classList.add("infobar-content");let m=e.createElement("input");m.type="checkbox",m.required=!0,m.classList.add("infobar-close-icon"),m.title="Close",h.appendChild(m);let p=e.createElement("span");p.textContent=n,h.appendChild(p);let g=e.createElement("a");if(g.classList.add("infobar-link-icon"),g.target="_blank",g.rel="noopener noreferrer",g.title="Open source URL: "+t.saveUrl,g.href=t.saveUrl,h.appendChild(g),u.appendChild(h),a)s.appendChild(l);else{let w=e.createElement("script"),f=Sv.toString()+";";f+=vv.toString()+";",f+="("+cN.toString()+")(document, "+JSON.stringify(Jm)+");",w.textContent=f,l.appendChild(w),s.innerHTML=l.outerHTML}}}function vv(e,t=Jm){let a=e.evaluate("//comment()",e,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null),n=a&&a.singleNodeValue;if(n&&n.nodeType==Node.COMMENT_NODE&&n.textContent.includes(t)){let o=n.textContent.split(`
`),[,,i,...r]=o,s=i.match(/^ url: (.*) ?$/),l=s&&s[1];if(l){let c,u;if(r.length&&(u=r[0].split("saved date: ")[1],u&&r.shift(),r.length>1)){let d=r[0].split("info: ")[1].trim();for(let h=1;h<r.length-1;h++)d+=`
`+r[h].trim();c=d.trim()}return{saveUrl:l,infobarContent:c,saveDate:u}}}}function Sv(e,{saveUrl:t,infobarContent:a,saveDate:n}){if(t){let i=e.querySelector("single-file-infobar").shadowRoot,r=i.querySelector(".infobar-content span");r.textContent=a||n;let s=i.querySelector(".infobar-content .infobar-link-icon");s.href=t,s.title="Open source URL: "+t}}function cN(e,t){let a=vv(e,t);a&&a.saveUrl&&Sv(e,a)}function uN(e,t,a){let n=e.createElement(t);return a.appendChild(n),Array.from(getComputedStyle(n)).forEach(o=>n.style.setProperty(o,"initial","important")),n}var Qm=["~","+","?","%","*",":","|",'"',"<",">","\\\\","\0-","\x7F"],Tv="_",ep=["\uFF5E","\uFF0B","\uFF1F","\uFF05","\uFF0A","\uFF1A","\uFF5C","\uFF02","\uFF1C","\uFF1E","\uFF3C"],hN=["[","]","^","-","\\"];function si(e,t=Qm,a="_",n=ep){return n.forEach((o,i)=>{o&&t[i]!==void 0&&o!=t[i]&&(e=e.replace(Av(t[i],""),o))}),t.forEach((o,i)=>{n[i]||(e=e.replace(Av(o,"+"),a))}),e=e.replace(/\.\.\//g,"").replace(/^\/+/,"").replace(/\/+/g,"/").replace(/\/$/,"").replace(/\.$/,"").replace(/\.\//g,"."+a).replace(/\/\./g,"/"+a),e}function Av(e,t){let a="["+mN(e)+"]"+t;try{return new RegExp(a,"gu")}catch{return new RegExp(a,"g")}}function mN(e){return e.length==1&&hN.includes(e)?"\\"+e:e}var Wr=Le+"on-before-capture",Vr=Le+"on-after-capture",Cv=Le+"request-get-adopted-stylesheets",Rv=Le+"response-get-adopted-stylesheets",pN=Le+"unregister-request-get-adopted-stylesheets",gN=Le+"clear-adopted-stylesheets-cache",fN=Le+"user-script-init",ci="data-"+Le+"removed-content",ui="data-"+Le+"hidden-content",np="data-"+Le+"kept-content",ko="data-"+Le+"hidden-frame",di="data-"+Le+"preserved-space-element",hi="data-"+Le+"shadow-root-element",mi="data-"+Le+"slot",pi="data-"+Le+"assigned-slot",vc=".",qr="data-"+Le+"win-id",gi="data-"+Le+"image",fi="data-"+Le+"poster",wi="data-"+Le+"video",bi="data-"+Le+"canvas",Yr="data-"+Le+"movable-style",Pn="data-"+Le+"input-value",yi="data-"+Le+"input-checked",Hr="data-"+Le+"lazy-loaded-src",ki="data-"+Le+"stylesheet",Ei="data-"+Le+"link-stylesheet",Ur="data-"+Le+"disabled-noscript",lp="data-"+Le+"selected-content",cp="data-"+Le+"invalid-element",bc="data-"+Le+"async-script",Kr="data-"+Le+"custom-stylesheet",tp="*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)",wN=["NOSCRIPT","DISABLED-NOSCRIPT","META","LINK","STYLE","TITLE","TEMPLATE","SOURCE","OBJECT","SCRIPT","HEAD","BODY"],bN="[popover][id], dialog[id]",Mv=["popovertarget","commandfor"],yN=Mv.map(e=>"["+e+"]").join(","),kN=["SCRIPT","NOSCRIPT","META","LINK","TEMPLATE"],EN=[":before",":after"],vN=["block","flow-root","list-item","inline-block","table-cell","table-caption"],SN=["block","flow-root","list-item","flex","grid","table"],_v=/^'(.*?)'$/,AN=/^"(.*?)"$/,TN={regular:"400",normal:"400",bold:"700",bolder:"700",lighter:"100"},CN={"ultra-condensed":"50%","extra-condensed":"62.5%",condensed:"75%","semi-condensed":"87.5%",normal:"100%","semi-expanded":"112.5%",expanded:"125%","extra-expanded":"150%","ultra-expanded":"200%"},up="Archive processed by SingleFile",Pv=1,RN=3,li=/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g,_N=/(url|image-set|-webkit-image-set|linear-gradient|radial-gradient|conic-gradient)\([^)]*\)/g,Fv=/\\/,xN=/\s+/,LN=". ",xv={none:"",disc:"",circle:"",square:"","disclosure-open":"","disclosure-closed":"",decimal:"0123456789","decimal-leading-zero":"0123456789","lower-alpha":"abcdefghijklmnopqrstuvwxyz","lower-latin":"abcdefghijklmnopqrstuvwxyz","upper-alpha":"ABCDEFGHIJKLMNOPQRSTUVWXYZ","upper-latin":"ABCDEFGHIJKLMNOPQRSTUVWXYZ","lower-roman":"ivxlcdm","upper-roman":"IVXLCDM","lower-greek":"\u03B1\u03B2\u03B3\u03B4\u03B5\u03B6\u03B7\u03B8\u03B9\u03BA\u03BB\u03BC\u03BD\u03BE\u03BF\u03C0\u03C1\u03C3\u03C4\u03C5\u03C6\u03C7\u03C8\u03C9"},IN=/(\(\s*[a-z-]+\s*(?::|<=?|>=?|=)\s*)(-?)infinity\s*\*\s*1([a-z%]+)/gi,jN="3.40282e38",NN=65248,ON="\u3000",Eo="single-file-ui-element",Xr=ri,vo="data:,",DN=["image/webp","image/jpeg"],MN=.8,At="data-sf-nesting-track-id",Fn=At+"-start ",Zr=At+"-end ",Sc=At+"-recreated",PN="s",zv="http://www.w3.org/1999/xhtml",FN=["SCRIPT","STYLE","TEXTAREA","TITLE","XMP","IFRAME","NOEMBED","NOFRAMES","PLAINTEXT","NOSCRIPT"],Uv=128,Lv=["password","woleetKey","saveToGDrive","saveToDropbox","saveWithCompanion","forceWebAuthFlow","saveWithWebDAV","webDAVURL","webDAVUser","webDAVPassword","saveWithMCP","mcpServerUrl","mcpAuthToken","saveToGitHub","githubToken","githubUser","githubRepository","githubBranch","saveToRestFormApi","saveToRestFormApiUrl","saveToRestFormApiToken","saveToRestFormApiFileFieldName","saveToRestFormApiUrlFieldName","saveToS3","S3Domain","S3Region","S3Bucket","S3AccessKey","S3SecretKey"],Iv={loadDeferredImages:"loadDeferredContent",loadDeferredImagesMaxIdleTime:"loadDeferredContentMaxIdleTime",loadDeferredImagesBlockCookies:"loadDeferredContentBlockCookies",loadDeferredImagesBlockStorage:"loadDeferredContentBlockStorage",loadDeferredImagesKeepZoomLevel:"loadDeferredContentKeepZoomLevel",loadDeferredImagesDispatchScrollEvent:"loadDeferredContentDispatchScrollEvent",loadDeferredImagesBeforeFrames:"loadDeferredContentBeforeFrames",blockAlternativeImages:"removeAlternativeImages"},Bv=(e,t,a)=>globalThis.addEventListener(e,t,a),zN=(e,t,a)=>globalThis.removeEventListener(e,t,a),UN=e=>{try{globalThis.dispatchEvent(e)}catch{}},yc=globalThis.JSON,jv=globalThis.crypto,BN=globalThis.TextEncoder,HN=globalThis.Blob,Br=globalThis.CustomEvent,GN=globalThis.MutationObserver,op=globalThis.URL,WN=globalThis.DOMParser,ip=globalThis.Uint8Array,VN=globalThis.btoa,Nv=globalThis.FileReader;function dp(e){let t=e;return e&&Object.keys(Iv).forEach(a=>{let n=Iv[a];e[a]!==void 0&&e[n]===void 0&&(t==e&&(t=Object.assign({},e)),t[n]=e[a])}),t}function Ac(e){if(e.width&&e.height){for(let a of DN){let n=e.toDataURL(a,MN);if(n.startsWith("data:"+a))return n}let t=e.toDataURL("image/png");if(t!=vo)return t}}var ap;function Tc(){Bv(fN,qN),ap||(ap=new GN(Tc),ap.observe(globalThis.document,{childList:!0}))}function qN({detail:e}){globalThis[bo]=async(t,a)=>{let n=Object.assign({},a);delete n.win,delete n.doc,delete n.onprogress,delete n.frames,delete n.taskId,delete n._migratedTemplateFormat,Lv.forEach(u=>delete n[u]);let o;try{o=e=="jsonDetail"?yc.stringify({options:n}):{options:n}}catch{}let i=new Br(t+"-request",{cancelable:!0,detail:o}),r=t+"-response",s,l=new Promise(u=>s=u),c=u=>{if(u.detail)try{let d=typeof u.detail=="string"?yc.parse(u.detail):u.detail;d.options&&(Lv.forEach(h=>delete d.options[h]),Object.assign(a,d.options))}catch{}s()};Bv(r,c),UN(i),i.defaultPrevented&&await l,zN(r,c)}}function Cc(e){e.querySelectorAll("meta[http-equiv=refresh]").forEach(t=>{t.removeAttribute("http-equiv"),t.setAttribute("disabled-http-equiv","refresh")})}function $r(e,t,a){e.querySelectorAll("noscript:not(["+Ur+"])").forEach(s=>{s.setAttribute(Ur,s.textContent),s.textContent=""}),Cc(e),a.customStylesheet&&KN(e,a.customStylesheet),e.head&&e.head.querySelectorAll(tp).forEach(s=>s.hidden=!0),e.querySelectorAll("svg foreignObject").forEach(s=>{let l=s.querySelectorAll("html > head > "+tp+", html > body > "+tp);l.length&&(Array.from(s.childNodes).forEach(c=>c.remove()),l.forEach(c=>s.appendChild(c)))});let n=new Map,o;if(t&&e.documentElement){Rc(e);try{e.dispatchEvent(new Br(gN))}catch{}o=rp(t,e,e.documentElement,a),a.removeUnusedFonts&&e.defaultView&&eO(t,e.documentElement,o),a.moveStylesInHead&&e.querySelectorAll("body style, body ~ style").forEach(s=>{let l=Pt(t,s);l&&Wv(s,l)&&(s.setAttribute(Yr,""),o.markedElements.push(s))})}else o={canvases:[],images:[],posters:[],videos:[],usedFonts:[],usedFontsCharacters:new Map,shadowRoots:[],markedElements:[]};hp(e);let i=nO(e,o.markedElements),r="";if(e.referrer)try{r=new op("/",new op(e.referrer).origin).href}catch{}return{canvases:o.canvases,fonts:lO(),worklets:cO(),stylesheets:oO(e,o.markedElements),linkStylesheets:i,images:o.images,posters:o.posters,videos:o.videos,usedFonts:Array.from(o.usedFonts.values()),usedFontsCharacters:tO(o.usedFontsCharacters),shadowRoots:o.shadowRoots,referrer:r,markedElements:o.markedElements,invalidElements:n,scrollPosition:{x:t.scrollX,y:t.scrollY},adoptedStyleSheets:XN(e.adoptedStyleSheets),manifestData:a.manifest?YN(e,t):void 0}}function YN(e,t){let a={url:e.documentURI,timings:{}};try{let n=new Date(e.lastModified);isNaN(n)||(a.lastModified=n.toISOString())}catch{}try{let n=t.performance;a.timeOrigin=new Date(n.timeOrigin).toISOString();let[o]=n.getEntriesByType("navigation");o&&(a.navigation=Ov(o),a.navigation.type=o.type,a.navigation.redirectCount=o.redirectCount),n.getEntriesByType("resource").forEach(i=>a.timings[i.name]=Ov(i))}catch{}try{a.environment={userAgent:t.navigator.userAgent,viewport:{width:t.innerWidth,height:t.innerHeight,devicePixelRatio:t.devicePixelRatio},media:{prefersColorScheme:t.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light",prefersReducedMotion:t.matchMedia("(prefers-reduced-motion: reduce)").matches?"reduce":"no-preference"}}}catch{}return a}function Ov(e){let t={transferSize:e.transferSize,encodedBodySize:e.encodedBodySize,decodedBodySize:e.decodedBodySize,nextHopProtocol:e.nextHopProtocol};return e.responseStatus&&(t.status=e.responseStatus),t}function KN(e,t){let a=e.body||e.documentElement;if(a){let n=e.createElement("style");n.setAttribute(Kr,""),n.textContent=t,a.appendChild(n)}}function Rc(e){e.body&&(Jr(e),Dv(e,e.body,"",()=>Lc(e)),kc(e.body).forEach((t,a)=>Dv(e,t,PN+a,()=>t.innerHTML)))}function Dv(e,t,a,n){a?Array.from(t.children).forEach((m,p)=>c(m,p,a)):c(t);let o=Ic(n()),i=u(t),r=u(o.documentElement),s=new Set,l=[];Object.keys(i).forEach(m=>{if(m in r){let p=i[m].parentElement?.getAttribute(At)||null,g=r[m]?.parentElement?.getAttribute(At)||null;if(p!==g){let w=i[m];for(;w&&w!==t;){let f=w.getAttribute(At);f&&s.add(f),w=w.parentElement}}}else d(i[m])&&(s.add(m),l.push(i[m]))}),l.forEach(m=>{let p=m.getAttribute(At);m.prepend(e.createComment(Fn+p)),m.append(e.createComment(Zr+p))}),hp(t),a?Array.from(t.children).forEach(m=>h(m,s)):h(t,s);function c(m,p=0,g=""){let w=g?`${g}.${p+1}`:`${p+1}`,f=m.tagName.toUpperCase();g&&(f=="BODY"||f=="HEAD"||f=="HTML")||m.setAttribute(At,w),Array.from(m.children).forEach((b,y)=>c(b,y,w))}function u(m){let p={};return m.getAttribute?g(m):Array.from(m.children).forEach(g),p;function g(w){if(w.getAttribute){let f=w.getAttribute(At);f&&(p[f]=w),Array.from(w.children).forEach(g)}}}function d(m){if(m.namespaceURI!=zv)return!1;let p=m.parentElement;for(;p;){let g=p.tagName.toUpperCase();if(g=="TEMPLATE"||FN.includes(g))return!1;p=p.parentElement}return!0}function h(m,p){let g=m.getAttribute(At);g&&!p.has(g)&&m.removeAttribute(At),Array.from(m.children).forEach(w=>h(w,p))}}function kc(e,t=[]){return Array.from(e.children).forEach(a=>{if(a.namespaceURI==zv&&!a.classList.contains(Eo)&&a.tagName.toLowerCase()!=Xr){let n=Qr(a);n&&(t.push(n),kc(n,t))}kc(a,t)}),t}function _c(e){return encodeURIComponent(yc.stringify({tag:e.localName,attributes:Array.from(e.attributes).filter(t=>t.name!=Sc).map(t=>[t.name,t.value])}))}function hp(e){let t=(e.ownerDocument||e).createTreeWalker(e,Uv);for(;t.nextNode();){let a=t.currentNode;if(a.data.startsWith(Fn)){let n=a.data.substring(Fn.length).split(" ")[0];a.data=Fn+n+" "+_c(a.parentNode)}}}function Jr(e){e.body&&[e,...kc(e.body)].forEach(t=>{let a=[],n=e.createTreeWalker(t,Uv);for(;n.nextNode();)(n.currentNode.data.startsWith(Fn)||n.currentNode.data.startsWith(Zr))&&a.push(n.currentNode);a.forEach(o=>o.remove())})}function xc(e,t,a=!1,n={}){let o=t+"-start ",i=t+"-end ",r=t+"-recreated";e.currentScript&&e.currentScript.remove();let s=[];n.rootElement?s.push(n.rootElement):e.body&&l(e.body),s.forEach(d=>{c(d),n.recreateOnly||u(d)}),a||s.forEach(d=>{let h=Array.from(d.querySelectorAll("["+t+"]"));d.getAttribute&&d.getAttribute(t)&&h.push(d),h.forEach(m=>m.removeAttribute(t))});function l(d){s.push(d),d.querySelectorAll("*").forEach(h=>{h.shadowRoot&&l(h.shadowRoot)})}function c(d){let h=[],m=e.createTreeWalker(d,128);for(;m.nextNode();)m.currentNode.data.startsWith(o)&&h.push(m.currentNode);h.forEach(p=>{let g=p.data.indexOf(" ",o.length),w,f;if(g!=-1){let b=p.data.substring(o.length,g);for(w=p.nextSibling;w&&!(w.nodeType==8&&w.data==i+b);)w=w.nextSibling;try{f=globalThis.JSON.parse(decodeURIComponent(p.data.substring(g+1)))}catch{}}if(w&&f){let b=e.createElement(f.tag);for(f.attributes.forEach(([y,E])=>{try{b.setAttribute(y,E)}catch{}}),a&&b.setAttribute(r,""),p.before(b);p.nextSibling!=w;)b.appendChild(p.nextSibling);p.remove(),w.remove()}})}function u(d){let h={},m=[];d.getAttribute?g(d):Array.from(d.children).forEach(g),m.forEach(w=>{let f=w.getAttribute(t),b=h[f];if(b!=w)(!a||n.mergeCopies)&&(b.contains(w)?w.replaceWith(...w.childNodes):(b.append(...w.childNodes),w.remove()));else{let y=f.split(".");if(y.length>1){let E=y.slice(0,-1).join("."),k=h[E];if(k&&w.parentElement!==k&&!w.contains(k)){let S=[],T=w.nextSibling;for(;T&&T.nodeType!=1;)S.push(T),T=T.nextSibling;k.appendChild(w),T&&h[T.getAttribute(t)]===T&&p(T)==E&&k.append(...S)}}}});function p(w){return w.getAttribute(t).split(".").slice(0,-1).join(".")}function g(w){let f=w.getAttribute(t);f&&(f in h||(h[f]=w),m.push(w)),Array.from(w.children).forEach(g)}}}function rp(e,t,a,n,o={usedFonts:new Map,usedFontsCharacters:new Map,canvases:[],images:[],posters:[],videos:[],shadowRoots:[],markedElements:[]},i=new Map,r){return a.childNodes&&Array.from(a.childNodes).filter(l=>l instanceof e.HTMLElement||l instanceof e.SVGElement||l instanceof globalThis.HTMLElement||l instanceof globalThis.SVGElement).forEach(l=>{let c,u,d,h;if(!n.autoSaveExternalSave&&(n.removeHiddenElements||n.removeUnusedFonts||n.removeUnusedGlyphs||n.compressHTML)&&(d=Pt(e,l),(n.removeHiddenElements||n.removeUnusedFonts||n.removeUnusedGlyphs)&&(h=!!l.closest("html > head")),(l instanceof e.HTMLElement||l instanceof globalThis.HTMLElement)&&n.removeHiddenElements&&(u=(r||h)&&wN.includes(l.tagName.toUpperCase())||l.closest("details")||aO(l,t,o),u||(c=r||Wv(l,d),c&&!kN.includes(l.tagName.toUpperCase())&&(l.setAttribute(ui,""),o.markedElements.push(l)))),!c)){if(n.compressHTML&&d){let p=d.getPropertyValue("white-space");p&&p.startsWith("pre")&&(l.setAttribute(di,""),o.markedElements.push(l))}if((n.removeUnusedFonts||n.removeUnusedGlyphs)&&t.defaultView&&!h){let p=Hv(e,l,d);gn(d,o.usedFonts,o.usedFontsCharacters,p);let g=Pt(e,l,":before");gn(g,o.usedFonts,o.usedFontsCharacters,Gr(g,l));let w=Pt(e,l,":after");gn(w,o.usedFonts,o.usedFontsCharacters,Gr(w,l));let f=d?d.getPropertyValue("display"):"",b=l.tagName.toUpperCase();if(f=="list-item"){let y=Pt(e,l,"::marker");gn(y,o.usedFonts,o.usedFontsCharacters,Gv(y,d,l))}vN.includes(f)&&(gn(Pt(e,l,":first-letter"),o.usedFonts,o.usedFontsCharacters,p),gn(Pt(e,l,"::first-line"),o.usedFonts,o.usedFontsCharacters,p)),(b=="INPUT"||b=="TEXTAREA")&&l.getAttribute("placeholder")&&gn(Pt(e,l,"::placeholder"),o.usedFonts,o.usedFontsCharacters,{characters:l.getAttribute("placeholder")}),b=="INPUT"&&l.type=="file"&&gn(Pt(e,l,"::file-selector-button"),o.usedFonts)}}$N(e,t,l,n,o,c,d);let m=!(l instanceof e.SVGElement||l instanceof globalThis.SVGElement)&&Qr(l);if(m&&!l.classList.contains(Eo)&&l.tagName.toLowerCase()!=Xr){let p={};l.setAttribute(hi,o.shadowRoots.length),o.markedElements.push(l),o.shadowRoots.push(p);try{if(m.adoptedStyleSheets){let g=w=>p.adoptedStyleSheets=w.detail.adoptedStyleSheets;m.addEventListener(Rv,g),m.dispatchEvent(new Br(Cv,{bubbles:!0})),p.adoptedStyleSheets||l.dispatchEvent(new Br(Cv,{bubbles:!0})),m.removeEventListener(Rv,g)}}catch{}rp(e,t,m,n,o,i,c),hp(m),m.slotAssignment=="manual"&&(p.slotAssignment=m.slotAssignment,m.querySelectorAll("slot").forEach((g,w)=>{g.setAttribute(mi,w),o.markedElements.push(g),g.assignedNodes().filter(f=>f.nodeType==Pv).forEach((f,b)=>{f.setAttribute(pi,w+vc+b),o.markedElements.push(f)})})),p.content=m.innerHTML,p.mode=m.mode,p.delegatesFocus=m.delegatesFocus,p.clonable=m.clonable,p.serializable=m.serializable;try{m.adoptedStyleSheets&&m.dispatchEvent(new Br(pN,{bubbles:!0}))}catch{}}rp(e,t,l,n,o,i,c),!n.autoSaveExternalSave&&n.removeHiddenElements&&r&&(u||l.getAttribute(np)==""?l.parentElement&&(l.parentElement.setAttribute(np,""),o.markedElements.push(l.parentElement)):c&&(l.setAttribute(ci,""),o.markedElements.push(l)))}),o}function XN(e,t=new Map){if(e){let a=[];for(let n of Array.from(e))if(t.has(n))a.push(t.get(n));else{let o="";if(n&&n.cssRules)for(let i of n.cssRules)o+=Vv(i)+`
`;t.set(n,o),a.push(o)}return a}else return[]}function ZN(e,t,a){let n=e.createElement("canvas");return n.width=t.width,n.height=t.height,n.toDataURL("image/png")==a}function $N(e,t,a,n,o,i,r){let s=a.tagName&&a.tagName.toUpperCase();if(s=="CANVAS"){let l=r||Pt(e,a),c={backgroundColor:l&&l.getPropertyValue("background-color")};try{let u=a.toDataURL("image/png"),d=l?l.getPropertyValue("background-image"):a.style.getPropertyValue("background-image");d&&d!="none"&&ZN(t,a,u)?c.blank=!0:c.dataURI=u}catch{}o.canvases.push(c),a.setAttribute(bi,o.canvases.length-1),o.markedElements.push(a)}if(s=="IMG"){let l={currentSrc:i?vo:n.loadDeferredContent&&a.getAttribute(Hr)||a.currentSrc};if(!i&&a.parentElement&&a.parentElement.tagName.toUpperCase()=="PICTURE"&&(l.sourceSize=iO(e,a.parentElement,l.currentSrc)),o.images.push(l),a.setAttribute(gi,o.images.length-1),o.markedElements.push(a),a.removeAttribute(Hr),r=r||Pt(e,a),r&&a.complete){l.size=sO(e,a,r);let c=r.getPropertyValue("box-shadow"),u=r.getPropertyValue("background-image");(!c||c=="none")&&(!u||u=="none")&&(l.size.pxWidth>1||l.size.pxHeight>1)&&(l.replaceable=!0,l.backgroundColor=r.getPropertyValue("background-color"),l.objectFit=r.getPropertyValue("object-fit"),l.boxSizing=r.getPropertyValue("box-sizing"),l.objectPosition=r.getPropertyValue("object-position"))}}if(s=="VIDEO"){let l=a.currentSrc;if(l&&!l.startsWith("blob:")&&!l.startsWith("data:")){let c=Pt(e,a),u=!!c&&SN.includes(c.getPropertyValue("display"));o.videos.push({blockLevel:u,linkOffset:dO(t,a,u),src:l,size:{pxWidth:a.clientWidth,pxHeight:a.clientHeight,videoWidth:a.videoWidth,videoHeight:a.videoHeight},currentTime:a.currentTime}),a.setAttribute(wi,o.videos.length-1)}if(n.blockVideos&&!a.getAttribute("poster")){let c=t.createElement("canvas"),u=c.getContext("2d");c.width=a.videoWidth,c.height=a.videoHeight;try{u.drawImage(a,0,0,c.width,c.height);let d=Ac(c);d&&(o.posters.push(d),a.setAttribute(fi,o.posters.length-1),o.markedElements.push(a))}catch{}}}s=="INPUT"&&(a.type!="password"&&(a.setAttribute(Pn,a.value),o.markedElements.push(a)),(a.type=="radio"||a.type=="checkbox")&&(a.setAttribute(yi,a.checked),o.markedElements.push(a))),s=="TEXTAREA"&&(a.setAttribute(Pn,a.value),o.markedElements.push(a)),s=="SELECT"&&a.querySelectorAll("option").forEach(l=>{l.selected&&(l.setAttribute(Pn,""),o.markedElements.push(l))}),s=="SCRIPT"&&(a.async&&a.getAttribute("async")!=""&&a.getAttribute("async")!="async"&&(a.setAttribute(bc,""),o.markedElements.push(a)),a.textContent=a.textContent.replace(/<\/script>/gi,"<\\/script>"))}function gn(e,t,a,n){if(e){let o=e.getPropertyValue("font-style")||"normal";e.getPropertyValue("font-family").split(",").forEach(i=>{if(i=So(i),i){let r=zn(e.getPropertyValue("font-weight")),s=e.getPropertyValue("font-variant")||"normal",l=Si(e.getPropertyValue("font-stretch")||"normal"),c=[i,r,o,s,l];t.set(yc.stringify(c),c),a&&n&&JN(a,i,o,n)}})}}function JN(e,t,a,n){let o=t+"|"+a,i=e.get(o);i||(i={fontFamily:t,fontStyle:a,charCodes:new Set,unknown:!1},e.set(o,i)),n.unknown&&(i.unknown=!0);for(let r of n.characters)i.charCodes.add(r.codePointAt(0))}function Hv(e,t,a){let n="",o=t.tagName&&t.tagName.toUpperCase();return(o=="INPUT"||o=="TEXTAREA"||o=="BUTTON")&&(n+=(t.value||"")+(t.getAttribute("placeholder")||"")),t.childNodes&&Array.from(t.childNodes).forEach(i=>{i.nodeType==RN?n+=i.data:i.nodeType==Pv&&!(i instanceof e.HTMLElement||i instanceof e.SVGElement||i instanceof globalThis.HTMLElement||i instanceof globalThis.SVGElement)&&(n+=i.textContent)}),Ec({characters:n},a,t)}function Gv(e,t,a){let n=e&&e.getPropertyValue("content");if(n=="none")return{characters:""};if(n&&n!="normal")return Gr(e,a);let o=t?t.getPropertyValue("list-style-type").trim():"";if(Object.prototype.hasOwnProperty.call(xv,o)){let r=xv[o];return Ec({characters:r?r+LN:""},e||t,a)}li.lastIndex=0;let i=li.exec(o);if(i&&i[0]==o){let r=i[1]===void 0?i[2]:i[1];return Ec({characters:r,unknown:Fv.test(r)},e||t,a)}return{characters:"",unknown:!0}}function Ec(e,t,a){let n=t&&t.getPropertyValue("text-transform");if(!n||n=="none"||!e.characters)return e;let o=e.characters,i=o,r=e.unknown,s=a&&a.closest&&a.closest("[lang]"),l=s&&s.getAttribute("lang");return n.trim().split(xN).forEach(c=>{try{c=="uppercase"||c=="capitalize"?i+=o.toUpperCase()+(l?o.toLocaleUpperCase(l):""):c=="lowercase"?i+=o.toLowerCase()+(l?o.toLocaleLowerCase(l):""):c=="full-width"?i+=QN(o):r=!0}catch{r=!0}}),{characters:i,unknown:r}}function QN(e){let t="";for(let a of e){let n=a.codePointAt(0);n==32?t+=ON:n>32&&n<127?t+=String.fromCodePoint(n+NN):t+=a}return t}function eO(e,t,a){EN.forEach(n=>{let o=Pt(e,t,n),i=Gr(o,t);(i.characters||i.unknown)&&gn(o,a.usedFonts,a.usedFontsCharacters,i)})}function Gr(e,t){let a=e&&e.getPropertyValue("content");if(!a||a=="none"||a=="normal")return{characters:""};let n="";li.lastIndex=0;let o=li.exec(a);for(;o;)n+=o[1]===void 0?o[2]:o[1],o=li.exec(a);let i=a.replace(li,"").replace(_N,"").trim();return Ec({characters:n,unknown:!!i||Fv.test(n)},e,t)}function tO(e){return Array.from(e.values()).map(t=>{let a=[];return Array.from(t.charCodes).sort((n,o)=>n-o).forEach(n=>{let o=a[a.length-1];o&&n==o[1]+1?o[1]=n:a.push([n,n])}),[t.fontFamily,t.fontStyle,a,t.unknown?1:0]})}function Qr(e){let t=globalThis.chrome;if(e.openOrClosedShadowRoot)return e.openOrClosedShadowRoot;if(t&&t.dom&&t.dom.openOrClosedShadowRoot)try{return t.dom.openOrClosedShadowRoot(e)}catch{return e.shadowRoot}else return e.shadowRoot}function mp(e,t,a){return Ev(e,t,a)}function So(e=""){return vi(Fr(e.trim())).toLowerCase()}function aO(e,t,a){let n=e.closest(bN);return n?(a.invokedIds||(a.invokedIds=new Set,t.querySelectorAll(yN).forEach(o=>Mv.forEach(i=>{o.hasAttribute(i)&&a.invokedIds.add(o.getAttribute(i))}))),a.invokedIds.has(n.id)):!1}function Wv(e,t){let a=!1;if(t){let n=t.getPropertyValue("display"),o=t.getPropertyValue("opacity"),i=t.getPropertyValue("visibility");if(a=n=="none",!a&&(o=="0"||i=="hidden")&&e.getBoundingClientRect){let r=e.getBoundingClientRect();a=!r.width&&!r.height}}return!!a}function es(e,t,a){if(Jr(e),e.querySelectorAll("style["+Kr+"]").forEach(n=>n.remove()),e.querySelectorAll("["+Ur+"]").forEach(n=>{n.textContent=n.getAttribute(Ur),n.removeAttribute(Ur)}),e.querySelectorAll("meta[disabled-http-equiv]").forEach(n=>{n.setAttribute("http-equiv",n.getAttribute("disabled-http-equiv")),n.removeAttribute("disabled-http-equiv")}),e.head&&e.head.querySelectorAll("*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)").forEach(n=>n.removeAttribute("hidden")),!t){let n=[ci,ko,ui,di,gi,fi,wi,bi,Pn,yi,hi,mi,pi,ki,Ei,bc];t=e.querySelectorAll(n.map(o=>"["+o+"]").join(","))}t.forEach(n=>{n.removeAttribute(ci),n.removeAttribute(ui),n.removeAttribute(np),n.removeAttribute(ko),n.removeAttribute(di),n.removeAttribute(gi),n.removeAttribute(fi),n.removeAttribute(wi),n.removeAttribute(bi),n.removeAttribute(Pn),n.removeAttribute(yi),n.removeAttribute(hi),n.removeAttribute(mi),n.removeAttribute(pi),n.removeAttribute(ki),n.removeAttribute(Ei),n.removeAttribute(bc),n.removeAttribute(Yr)}),a&&a.forEach((n,o)=>n.replaceWith(o))}function nO(e,t){let a=Array.from(e.querySelectorAll("link[rel*=stylesheet]"));return a.forEach((n,o)=>{n.setAttribute(Ei,o),t.push(n)}),a}function Vv(e){return qv(e.cssText)}function qv(e){return e.replace(IN,"$1$2"+jN+"$3")}function oO(e,t){if(e){let a=[];return e.querySelectorAll("style").forEach((n,o)=>{try{if(!n.sheet.disabled){let i=e.createElement("style");i.textContent=n.textContent,e.body.appendChild(i);let r=i.sheet;i.remove();let s=Array.from(r.cssRules).map(c=>c.cssText).join(`
`),l=Array.from(n.sheet.cssRules).map(c=>c.cssText).join(`
`);(!r||s!=l)&&(n.setAttribute(ki,o),t.push(n),a[o]=Array.from(n.sheet.cssRules).map(Vv).join(`
`))}}catch{}}),a}}function iO(e,t,a){if(a){let n=t.ownerDocument.baseURI,o=Array.from(t.querySelectorAll(":scope > source")).find(i=>{let r=i.getAttribute("media");return(!r||e.matchMedia(r).matches)&&rO(i.getAttribute("srcset"),n).includes(a)});if(o&&(o.hasAttribute("width")||o.hasAttribute("height")))return{width:o.getAttribute("width"),height:o.getAttribute("height")}}}function rO(e,t){let a=[];if(e)try{zr(e).forEach(n=>{try{a.push(new op(n.url,t).href)}catch{}})}catch{}return a}function sO(e,t,a){let n=t.naturalWidth,o=t.naturalHeight;if(!n&&!o){let i=t.getAttribute("style")==null;if(a=a||Pt(e,t),a){let r=!1;if(a.getPropertyValue("box-sizing")=="content-box"){let g=t.style.getPropertyValue("box-sizing"),w=t.style.getPropertyPriority("box-sizing"),f=t.clientWidth;t.style.setProperty("box-sizing","border-box","important"),r=t.clientWidth!=f,g?t.style.setProperty("box-sizing",g,w):t.style.removeProperty("box-sizing")}let s,l,c,u,d,h,m,p;s=Mn("padding-left",a),l=Mn("padding-right",a),c=Mn("padding-top",a),u=Mn("padding-bottom",a),r?(d=Mn("border-left-width",a),h=Mn("border-right-width",a),m=Mn("border-top-width",a),p=Mn("border-bottom-width",a)):d=h=m=p=0,n=Math.max(0,t.clientWidth-s-l-d-h),o=Math.max(0,t.clientHeight-c-u-m-p),i&&t.removeAttribute("style")}}return{pxWidth:n,pxHeight:o}}function Mn(e,t){if(t.getPropertyValue(e).endsWith("px"))return parseFloat(t.getPropertyValue(e))}function lO(){return qm()}function cO(){return Ym()}function Lc(e){let t=e.doctype,a="";return t&&(a="<!DOCTYPE "+t.nodeName,t.publicId?(a+=' PUBLIC "'+t.publicId+'"',t.systemId&&(a+=' "'+t.systemId+'"')):t.systemId&&(a+=' SYSTEM "'+t.systemId+'"'),t.internalSubset&&(a+=" ["+t.internalSubset+"]"),a+="> "),a+e.documentElement.outerHTML}function vi(e){return e.match(_v)?e=e.replace(_v,"$1"):e=e.replace(AN,"$1"),e.trim()}function zn(e){return TN[e.toLowerCase().trim()]||e}function Si(e){return CN[e]||e}function ts(e){let t=[],a=new Map;e.forEach((r,s)=>{let l={stylesheetInfo:r,key:s,index:t.length};t.push(l),r.stylesheet&&r.stylesheet.children&&a.set(r.stylesheet.children,l)});let n=new Set;t.forEach(r=>Yv(r,a).forEach(s=>n.add(s)));let o=[],i=new Set;return t.filter(r=>!n.has(r)).forEach(r=>sp(r,a,o,i)),t.filter(r=>!i.has(r)).forEach(r=>sp(r,a,o,i)),o}function sp(e,t,a,n){n.has(e)||(n.add(e),Yv(e,t).forEach(o=>sp(o,t,a,n)),a.push(e))}function Yv(e,t){let a=[],n=e.stylesheetInfo.stylesheet;return n&&n.children&&n.children.forEach(o=>{if(o.type=="Atrule"&&o.name=="import"&&o.prelude&&o.prelude.children&&o.prelude.children.head){let i=t.get(o.prelude.children.head.data.importedChildren);i&&a.push(i)}}),a}function Un(e){return new HN([e]).size}async function as(e){if(Nv){let t=new Nv;return t.readAsDataURL(e),new Promise((a,n)=>{t.addEventListener("load",()=>a(t.result),!1),t.addEventListener("error",n,!1)})}else{let t=new ip(await e.arrayBuffer()),a="";for(let n=0;n<t.length;n+=8192)a+=String.fromCharCode(...t.subarray(n,n+8192));return"data:"+(e.type||"application/octet-stream")+";base64,"+VN(a)}}async function ka(e,t){try{let a=typeof t=="string"?new BN("utf-8").encode(t):t instanceof ip?t:new ip(t),n=globalThis.crypto&&jv.subtle?await jv.subtle.digest(e,a):yv(e,a);return uO(n)}catch{return""}}function uO(e){let t=[],a=new DataView(e);for(let n=0;n<a.byteLength;n+=4){let i=a.getUint32(n).toString(16),r="00000000",s=(r+i).slice(-r.length);t.push(s)}return t.join("")}function Ai(e){return e.flat?e.flat():e.reduce((t,a)=>t.concat(Array.isArray(a)?Ai(a):a),[])}function dO(e,t,a){let n={top:0,left:0};if(t.parentNode){let o=e.createElement("a");o.style.setProperty("position","absolute","important"),o.style.setProperty("margin","0","important"),o.style.setProperty("padding","0","important"),o.style.setProperty("border","0","important"),o.style.setProperty("width","0","important"),o.style.setProperty("height","0","important"),a&&o.style.setProperty("display","block","important"),t.insertAdjacentElement("beforebegin",o);let i=o.getBoundingClientRect(),r=t.getBoundingClientRect();n.top=Math.round(r.top-i.top),n.left=Math.round(r.left-i.left),o.remove()}return n}function Pt(e,t,a){try{return e.getComputedStyle(t,a)}catch{}}function Ic(e,t){let a=new WN().parseFromString(e,"text/html");a.head||a.documentElement.insertBefore(a.createElement("HEAD"),a.body);let n=a.querySelector("base");return(!n||!n.getAttribute("href"))&&(n&&n.remove(),n=a.createElement("base"),n.setAttribute("href",t),a.head.insertBefore(n,a.head.firstChild)),a}var Nc={LAZY_SRC_ATTRIBUTE_NAME:Hr,SINGLE_FILE_UI_ELEMENT_CLASS:Eo},hO=10,mO="attributes",pO="childList",gO=["STYLE","LINK"],Kt=globalThis.browser,Ft=globalThis.document,fO=globalThis.MutationObserver,za=new Map,pp;Kt&&Kt.runtime&&Kt.runtime.onMessage&&Kt.runtime.onMessage.addListener&&Kt.runtime.onMessage.addListener(e=>{if(e.method=="singlefile.lazyTimeout.onTimeout"){let t=za.get(e.type);if(t){za.delete(e.type);try{t.callback()}catch{gp(e.type)}}}});async function fp(e){if(Ft.documentElement){za.clear();let t=Ft.body?Math.max(Ft.body.scrollHeight,Ft.documentElement.scrollHeight):Ft.documentElement.scrollHeight,a=Ft.body?Math.max(Ft.body.scrollWidth,Ft.documentElement.scrollWidth):Ft.documentElement.scrollWidth;if(t>globalThis.innerHeight||a>globalThis.innerWidth){let n=Math.max(t-globalThis.innerHeight*1.5,0),o=Math.max(a-globalThis.innerWidth*1.5,0);if(globalThis.scrollY<n||globalThis.scrollX<o)return bO(e)}}}function wO(e){Zm(e)}function bO(e){return pp=0,new Promise(async t=>{let a,n=new Set,o=new fO(async u=>{let d=u.filter(p=>p.type==mO),h=u.filter(p=>p.type==pO&&Array.from(p.addedNodes).some(g=>g.tagName&&gO.includes(g.tagName.toUpperCase())&&(!g.classList||!g.classList.contains(Nc.SINGLE_FILE_UI_ELEMENT_CLASS))));(d.filter(p=>{if(p.attributeName=="src"&&(p.target.setAttribute(Nc.LAZY_SRC_ATTRIBUTE_NAME,p.target.src),p.target.addEventListener("load",r)),p.attributeName=="src"||p.attributeName=="srcset"||p.target.tagName&&p.target.tagName.toUpperCase()=="SOURCE")return!p.target.classList||!p.target.classList.contains(Nc.SINGLE_FILE_UI_ELEMENT_CLASS)}).length||h.length)&&(a=!0,await Dc(o,e,c),n.size||await Oc(o,e,c))});await i(e.loadDeferredContentMaxIdleTime*2),await Dc(o,e,c),o.observe(Ft,{subtree:!0,childList:!0,attributes:!0}),Ft.addEventListener(mc,s),Ft.addEventListener(pc,l),Km(e);async function i(u){await Mc("idleTimeout",async()=>{a?pp<hO&&(pp++,Ti("idleTimeout"),await i(Math.max(500,u/2))):(Ti("loadTimeout"),Ti("maxTimeout"),wp(o,e,c))},u)}function r(u){let d=u.target;d.removeAttribute(Nc.LAZY_SRC_ATTRIBUTE_NAME),d.removeEventListener("load",r)}async function s(u){a=!0,await Dc(o,e,c),await Oc(o,e,c),u.detail&&n.add(u.detail)}async function l(u){await Dc(o,e,c),await Oc(o,e,c),n.delete(u.detail),n.size||await Oc(o,e,c)}function c(u){o.disconnect(),Ft.removeEventListener(mc,s),Ft.removeEventListener(pc,l),t(u)}})}async function Oc(e,t,a){await Mc("loadTimeout",()=>wp(e,t,a),t.loadDeferredContentMaxIdleTime)}async function Dc(e,t,a){await Mc("maxTimeout",async()=>{await Ti("loadTimeout"),await wp(e,t,a)},t.loadDeferredContentMaxIdleTime*10)}async function wp(e,t,a){await Ti("idleTimeout"),Xm(t),await Mc("endTimeout",async()=>{await Ti("maxTimeout"),a()},t.loadDeferredContentMaxIdleTime/2),e.disconnect()}async function Mc(e,t,a){if(Kt&&Kt.runtime&&Kt.runtime.sendMessage){if(!za.get(e)||!za.get(e).pending){let n={callback:t,pending:!0};za.set(e,n);try{await Kt.runtime.sendMessage({method:"singlefile.lazyTimeout.setTimeout",type:e,delay:a})}catch{Kv(e,t,a)}n.pending=!1}}else Kv(e,t,a)}function Kv(e,t,a){let n=za.get(e);n&&globalThis.clearTimeout(n),za.set(e,t),globalThis.setTimeout(t,a)}async function Ti(e){if(Kt&&Kt.runtime&&Kt.runtime.sendMessage)try{await Kt.runtime.sendMessage({method:"singlefile.lazyTimeout.clearTimeout",type:e})}catch{gp(e)}else gp(e)}function gp(e){let t=za.get(e);za.delete(e),t&&globalThis.clearTimeout(t)}var Ba={ON_BEFORE_CAPTURE_EVENT_NAME:Wr,ON_AFTER_CAPTURE_EVENT_NAME:Vr,WIN_ID_ATTRIBUTE_NAME:qr,HIDDEN_FRAME_ATTRIBUTE_NAME:ko,WAIT_FOR_USERSCRIPT_PROPERTY_NAME:bo,preProcessDoc:$r,serialize:Lc,postProcessDoc:es,getShadowRoot:Qr},yO='iframe, frame, object[type="text/html"][data]',kO="*",Zv="singlefile.frameTree.initRequest",bp="singlefile.frameTree.ackInitRequest",$v="singlefile.frameTree.cleanupRequest",Ep="singlefile.frameTree.initResponse",Jv="singlefile.frameTree.getOptions",EO=["removeHiddenElements","removeUnusedFonts","compressHTML","autoSaveExternalSave","moveStylesInHead","blockVideos","customStylesheet","manifest","loadDeferredContent","loadDeferredContentMaxIdleTime","loadDeferredContentKeepZoomLevel","loadDeferredContentMinZoomFactor","loadDeferredContentDispatchScrollEvent","loadDeferredContentBlockCookies","loadDeferredContentBlockStorage"],Xv="*",Qv=2e3,vO=1e4,SO="0",To=".",Ci=globalThis.window==globalThis.top,Xt=globalThis.browser,eS=!!(Xt&&Xt.runtime&&Xt.runtime.sendMessage),yp=globalThis.top,AO=globalThis.MessageChannel,Ua=globalThis.document,ns=globalThis.JSON,TO=globalThis.MutationObserver,CO=globalThis.DOMParser,Tt=globalThis.sessions;Tt||(Tt=globalThis.sessions=new Map);var na;Ci&&(na=SO,Xt&&Xt.runtime&&Xt.runtime.onMessage&&Xt.runtime.onMessage.addListener&&Xt.runtime.onMessage.addListener(e=>{if(e.method==Ep)return vp(e),Promise.resolve({});if(e.method==bp)return os("requestTimeouts",e.sessionId,e.windowId),rS(e.sessionId,e.windowId),Promise.resolve({});if(e.method==Jv){let t=Tt.get(e.sessionId);if(t)return Promise.resolve({options:t.options})}}));tS();Tc();new TO(tS).observe(Ua,{childList:!0});function tS(){globalThis.addEventListener("message",RO,!0)}async function RO(e){if(typeof e.data=="string"&&e.data.startsWith(yo)){e.preventDefault(),e.stopPropagation();let t=ns.parse(e.data.substring(yo.length));if(t.method==Zv)e.source&&Uc(e.source,{method:bp,windowId:t.windowId,sessionId:t.sessionId}),Ci||(globalThis.stop(),!t.options&&eS&&(t.options=await IO(t.sessionId)),t.options&&(t.options.loadDeferredContent&&fp(t.options),await oS(t)));else if(t.method==bp)os("requestTimeouts",t.sessionId,t.windowId),rS(t.sessionId,t.windowId);else if(t.method==$v)iS(t);else if(t.method==Ep&&Tt.get(t.sessionId)){let a=e.ports[0];a.onmessage=n=>vp(n.data)}}}function _O(e){let t=aS();return e=nS(e),new Promise(a=>{Tt.set(t,{frames:[],requestTimeouts:{},responseTimeouts:{},options:e,resolve:n=>{n.sessionId=t,a(n)}}),oS({windowId:na,sessionId:t,options:e})})}function xO(e){let t=aS();e=nS(e),Tt.set(t,{frames:[],requestTimeouts:{},responseTimeouts:{},options:e}),jO({windowId:na,sessionId:t,options:e});let a=Tt.get(t).frames;return a.sessionId=t,a}function LO(e){Tt.delete(e),iS({windowId:na,sessionId:e,options:{sessionId:e}})}function aS(){return globalThis.crypto.getRandomValues(new Uint32Array(32)).join("")}function nS(e){return ns.parse(ns.stringify(e,EO))}async function IO(e){try{let t=await Xt.runtime.sendMessage({method:Jv,sessionId:e});return t&&t.options}catch{}}function jO(e){let t=e.sessionId;delete globalThis._singleFile_cleaningUp,Ci||(na=globalThis.frameId=e.windowId),Pc(Ua,e.options,na,t,!1),Ci||(Ri({frames:[Bc(Ua,globalThis,na,e.options,e.scrolling)],sessionId:t,requestedFrameId:Fc(Ua)&&na}),zc(Ua))}async function oS(e){let t=e.sessionId;delete globalThis._singleFile_cleaningUp,Ci||(na=globalThis.frameId=e.windowId),Pc(Ua,e.options,na,t,e.waitForFrames!==!1),Ci||(Ri({frames:[Bc(Ua,globalThis,na,e.options,e.scrolling)],sessionId:t,requestedFrameId:Fc(Ua)&&na}),zc(Ua))}function iS(e){if(!globalThis._singleFile_cleaningUp){globalThis._singleFile_cleaningUp=!0;let t=e.sessionId;sS(Hc(Ua),e.windowId,t)}}function vp(e){e.frames.forEach(a=>os("responseTimeouts",e.sessionId,a.windowId));let t=Tt.get(e.sessionId);t&&(e.requestedFrameId&&(t.requestedFrameId=e.requestedFrameId),e.frames.forEach(n=>{let o=t.frames.find(i=>n.windowId==i.windowId);o||(o={windowId:n.windowId},t.frames.push(o)),o.processed||(o.content=n.content,o.baseURI=n.baseURI,o.title=n.title,o.url=n.url,o.canvases=n.canvases,o.fonts=n.fonts,o.worklets=n.worklets,o.stylesheets=n.stylesheets,o.images=n.images,o.posters=n.posters,o.videos=n.videos,o.usedFonts=n.usedFonts,o.usedFontsCharacters=n.usedFontsCharacters,o.shadowRoots=n.shadowRoots,o.processed=n.processed,o.scrollPosition=n.scrollPosition,o.scrolling=n.scrolling,o.adoptedStyleSheets=n.adoptedStyleSheets,o.manifestData=n.manifestData)}),t.frames.filter(n=>!n.processed).length||(t.frames=t.frames.sort((n,o)=>o.windowId.split(To).length-n.windowId.split(To).length),t.resolve&&(t.requestedFrameId&&t.frames.forEach(n=>{n.windowId==t.requestedFrameId&&(n.requestedFrame=!0)}),t.resolve(t.frames))))}function Pc(e,t,a,n,o){let i=Hc(e);PO(i,t),NO(e,i,t,a,n,o),i.length&&OO(e,i,t,a,n,o)}function NO(e,t,a,n,o,i){let r=[],s;Tt.get(o)?s=Tt.get(o).requestTimeouts:(s={},Tt.set(o,{requestTimeouts:s})),t.forEach((l,c)=>{if(kp(l))return;let u=n+To+c;l.setAttribute(Ba.WIN_ID_ATTRIBUTE_NAME,u),r.push({windowId:u})}),Ri({frames:r,sessionId:o,requestedFrameId:Fc(e)&&n}),t.forEach((l,c)=>{if(kp(l))return;let u=n+To+c;try{Uc(l.contentWindow,{method:Zv,windowId:u,sessionId:o,options:eS?void 0:a,scrolling:l.scrolling,waitForFrames:i})}catch{}DO(o,u,()=>MO(l,u,a,o)),s[u]=globalThis.setTimeout(()=>Ri({frames:[Sp(o,u)||{windowId:u,processed:!0}],sessionId:o}),Qv)}),zc(e)}function OO(e,t,a,n,o,i){let r=[];t.forEach((s,l)=>{if(kp(s))return;let c=n+To+l,u,d;try{u=s.contentDocument,d=s.contentWindow,d.stop()}catch{}if(u)try{os("requestTimeouts",o,c),Pc(u,a,c,o,i),r.push(Bc(u,d,c,a,s.scrolling))}catch{r.push({windowId:c,processed:!0})}else if(!i){let h=Sp(o,c);h&&(os("requestTimeouts",o,c),r.push(h))}}),Ri({frames:r,sessionId:o,requestedFrameId:Fc(e)&&n}),zc(e)}function Fc(e){let t=e.documentElement.dataset;return t&&t.requestedFrameId}function zc(e){let t=e.documentElement.dataset;t&&delete t.requestedFrameId}function os(e,t,a){let n=Tt.get(t);if(n&&n[e]){let o=n[e][a];o&&(globalThis.clearTimeout(o),delete n[e][a])}}function rS(e,t){let a=Tt.get(e);a&&a.responseTimeouts&&(a.responseTimeouts[t]=globalThis.setTimeout(()=>Ri({frames:[Sp(e,t)||{windowId:t,processed:!0}],sessionId:e}),vO))}function DO(e,t,a){let n=Tt.get(e);n&&(n.frameFallbacks||(n.frameFallbacks={}),n.frameFallbacks[t]=a)}function Sp(e,t){let a=Tt.get(e),n=a&&a.frameFallbacks&&a.frameFallbacks[t];if(n)return n()}function MO(e,t,a,n){let o=e.getAttribute("srcdoc");if(o)try{let i=new CO().parseFromString(o,"text/html");return Pc(i,a,t,n,!1),Bc(i,globalThis,t,a,e.scrolling)}catch{}}function sS(e,t,a){e.forEach((n,o)=>{let i=t+To+o;n.removeAttribute(Ba.WIN_ID_ATTRIBUTE_NAME),n.removeAttribute(Ba.HIDDEN_FRAME_ATTRIBUTE_NAME);try{Uc(n.contentWindow,{method:$v,windowId:i,sessionId:a})}catch{}}),e.forEach((n,o)=>{let i=t+To+o,r;try{r=n.contentDocument}catch{}if(r)try{sS(Hc(r),i,a)}catch{}})}function Ri(e){e.method=Ep;try{yp.singlefile.processors.frameTree.initResponse(e)}catch{Uc(yp,e,!0)}}function Uc(e,t,a){if(e==yp&&Xt&&Xt.runtime&&Xt.runtime.sendMessage)Xt.runtime.sendMessage(t);else if(a){let n=new AO;e.postMessage(yo+ns.stringify({method:t.method,sessionId:t.sessionId}),Xv,[n.port2]),n.port1.postMessage(t)}else e.postMessage(yo+ns.stringify(t),Xv)}function Bc(e,t,a,n,o){let i=Ba.preProcessDoc(e,t,n),r=Ba.serialize(e);Ba.postProcessDoc(e,i.markedElements,i.invalidElements);let s=e.baseURI.split("#")[0];return{windowId:a,content:r,baseURI:s,url:e.documentURI,title:e.title,canvases:i.canvases,fonts:i.fonts,worklets:i.worklets,stylesheets:i.stylesheets,images:i.images,posters:i.posters,videos:i.videos,usedFonts:i.usedFonts,usedFontsCharacters:i.usedFontsCharacters,shadowRoots:i.shadowRoots,scrollPosition:i.scrollPosition,scrolling:o,adoptedStyleSheets:i.adoptedStyleSheets,manifestData:i.manifestData,processed:!0}}function Hc(e){let t=Array.from(e.querySelectorAll(yO));return e.querySelectorAll(kO).forEach(a=>{let n=Ba.getShadowRoot(a);n&&(t=t.concat(...Hc(n)))}),t}function PO(e,t){e.forEach(a=>{t.removeHiddenElements&&FO(a)?a.setAttribute(Ba.HIDDEN_FRAME_ATTRIBUTE_NAME,""):a.removeAttribute(Ba.HIDDEN_FRAME_ATTRIBUTE_NAME)})}function kp(e){return e.getAttribute(Ba.HIDDEN_FRAME_ATTRIBUTE_NAME)==""}function FO(e){try{let a=e.ownerDocument.defaultView.getComputedStyle(e);if(a.getPropertyValue("display")=="none"||a.getPropertyValue("visibility")=="hidden")return!0;let n=e.getBoundingClientRect();return!n.width&&!n.height}catch{return!1}}var vu={};et(vu,{MIMEType:()=>vs,cssUnescape:()=>gc,fontPropertyParser:()=>yu,mediaQueryParser:()=>Eu,srcsetParser:()=>fo,zip:()=>_m});var yu={};et(yu,{parse:()=>Mg});var xt={};et(xt,{Lexer:()=>og,List:()=>bn,OffsetToLocation:()=>pA,TokenStream:()=>gA,clone:()=>Yn,createLexer:()=>CB,createSyntax:()=>HA,definitionSyntax:()=>RA,find:()=>ot,findAll:()=>Ng,findLast:()=>RB,fork:()=>LB,fromPlainObject:()=>xB,generate:()=>ge,ident:()=>eC,isCustomProperty:()=>fu,keyword:()=>cs,lexer:()=>Es,parse:()=>Ve,property:()=>Xp,string:()=>C0,toPlainObject:()=>_B,tokenNames:()=>iu,tokenTypes:()=>uA,tokenize:()=>TB,url:()=>H0,vendorPrefix:()=>oM,version:()=>vB,walk:()=>ra});var zO=Object.create,cg=Object.defineProperty,UO=Object.getOwnPropertyDescriptor,BO=Object.getOwnPropertyNames,HO=Object.getPrototypeOf,GO=Object.prototype.hasOwnProperty,Fi=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports),J=(e,t)=>{for(var a in t)cg(e,a,{get:t[a],enumerable:!0})},WO=(e,t,a,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of BO(t))!GO.call(e,o)&&o!==a&&cg(e,o,{get:()=>t[o],enumerable:!(n=UO(t,o))||n.enumerable});return e},VO=(e,t,a)=>(a=e!=null?zO(HO(e)):{},WO(t||!e||!e.__esModule?cg(a,"default",{value:e,enumerable:!0}):a,e)),qO=Fi(e=>{var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");e.encode=function(a){if(0<=a&&a<t.length)return t[a];throw new TypeError("Must be between 0 and 63: "+a)},e.decode=function(a){var n=65,o=90,i=97,r=122,s=48,l=57,c=43,u=47,d=26,h=52;return n<=a&&a<=o?a-n:i<=a&&a<=r?a-i+d:s<=a&&a<=l?a-s+h:a==c?62:a==u?63:-1}}),YO=Fi(e=>{var t=qO(),a=5,n=1<<a,o=n-1,i=n;function r(l){return l<0?(-l<<1)+1:(l<<1)+0}function s(l){var c=(l&1)===1,u=l>>1;return c?-u:u}e.encode=function(l){var c="",u,d=r(l);do u=d&o,d>>>=a,d>0&&(u|=i),c+=t.encode(u);while(d>0);return c},e.decode=function(l,c,u){var d=l.length,h=0,m=0,p,g;do{if(c>=d)throw new Error("Expected more digits in base 64 VLQ value.");if(g=t.decode(l.charCodeAt(c++)),g===-1)throw new Error("Invalid base64 digit: "+l.charAt(c-1));p=!!(g&i),g&=o,h=h+(g<<m),m+=a}while(p);u.value=s(h),u.rest=c}}),ug=Fi(e=>{function t(v,A,x){if(A in v)return v[A];if(arguments.length===3)return x;throw new Error('"'+A+'" is a required argument.')}e.getArg=t;var a=/^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/,n=/^data:.+\,.+$/;function o(v){var A=v.match(a);return A?{scheme:A[1],auth:A[2],host:A[3],port:A[4],path:A[5]}:null}e.urlParse=o;function i(v){var A="";return v.scheme&&(A+=v.scheme+":"),A+="//",v.auth&&(A+=v.auth+"@"),v.host&&(A+=v.host),v.port&&(A+=":"+v.port),v.path&&(A+=v.path),A}e.urlGenerate=i;var r=32;function s(v){var A=[];return function(x){for(var _=0;_<A.length;_++)if(A[_].input===x){var O=A[0];return A[0]=A[_],A[_]=O,A[0].result}var z=v(x);return A.unshift({input:x,result:z}),A.length>r&&A.pop(),z}}var l=s(function(v){var A=v,x=o(v);if(x){if(!x.path)return v;A=x.path}for(var _=e.isAbsolute(A),O=[],z=0,U=0;;)if(z=U,U=A.indexOf("/",z),U===-1){O.push(A.slice(z));break}else for(O.push(A.slice(z,U));U<A.length&&A[U]==="/";)U++;for(var K,L=0,U=O.length-1;U>=0;U--)K=O[U],K==="."?O.splice(U,1):K===".."?L++:L>0&&(K===""?(O.splice(U+1,L),L=0):(O.splice(U,2),L--));return A=O.join("/"),A===""&&(A=_?"/":"."),x?(x.path=A,i(x)):A});e.normalize=l;function c(v,A){v===""&&(v="."),A===""&&(A=".");var x=o(A),_=o(v);if(_&&(v=_.path||"/"),x&&!x.scheme)return _&&(x.scheme=_.scheme),i(x);if(x||A.match(n))return A;if(_&&!_.host&&!_.path)return _.host=A,i(_);var O=A.charAt(0)==="/"?A:l(v.replace(/\/+$/,"")+"/"+A);return _?(_.path=O,i(_)):O}e.join=c,e.isAbsolute=function(v){return v.charAt(0)==="/"||a.test(v)};function u(v,A){v===""&&(v="."),v=v.replace(/\/$/,"");for(var x=0;A.indexOf(v+"/")!==0;){var _=v.lastIndexOf("/");if(_<0||(v=v.slice(0,_),v.match(/^([^\/]+:\/)?\/*$/)))return A;++x}return Array(x+1).join("../")+A.substr(v.length+1)}e.relative=u;var d=(function(){var v=Object.create(null);return!("__proto__"in v)})();function h(v){return v}function m(v){return g(v)?"$"+v:v}e.toSetString=d?h:m;function p(v){return g(v)?v.slice(1):v}e.fromSetString=d?h:p;function g(v){if(!v)return!1;var A=v.length;if(A<9||v.charCodeAt(A-1)!==95||v.charCodeAt(A-2)!==95||v.charCodeAt(A-3)!==111||v.charCodeAt(A-4)!==116||v.charCodeAt(A-5)!==111||v.charCodeAt(A-6)!==114||v.charCodeAt(A-7)!==112||v.charCodeAt(A-8)!==95||v.charCodeAt(A-9)!==95)return!1;for(var x=A-10;x>=0;x--)if(v.charCodeAt(x)!==36)return!1;return!0}function w(v,A,x){var _=E(v.source,A.source);return _!==0||(_=v.originalLine-A.originalLine,_!==0)||(_=v.originalColumn-A.originalColumn,_!==0||x)||(_=v.generatedColumn-A.generatedColumn,_!==0)||(_=v.generatedLine-A.generatedLine,_!==0)?_:E(v.name,A.name)}e.compareByOriginalPositions=w;function f(v,A,x){var _;return _=v.originalLine-A.originalLine,_!==0||(_=v.originalColumn-A.originalColumn,_!==0||x)||(_=v.generatedColumn-A.generatedColumn,_!==0)||(_=v.generatedLine-A.generatedLine,_!==0)?_:E(v.name,A.name)}e.compareByOriginalPositionsNoSource=f;function b(v,A,x){var _=v.generatedLine-A.generatedLine;return _!==0||(_=v.generatedColumn-A.generatedColumn,_!==0||x)||(_=E(v.source,A.source),_!==0)||(_=v.originalLine-A.originalLine,_!==0)||(_=v.originalColumn-A.originalColumn,_!==0)?_:E(v.name,A.name)}e.compareByGeneratedPositionsDeflated=b;function y(v,A,x){var _=v.generatedColumn-A.generatedColumn;return _!==0||x||(_=E(v.source,A.source),_!==0)||(_=v.originalLine-A.originalLine,_!==0)||(_=v.originalColumn-A.originalColumn,_!==0)?_:E(v.name,A.name)}e.compareByGeneratedPositionsDeflatedNoLine=y;function E(v,A){return v===A?0:v===null?1:A===null?-1:v>A?1:-1}function k(v,A){var x=v.generatedLine-A.generatedLine;return x!==0||(x=v.generatedColumn-A.generatedColumn,x!==0)||(x=E(v.source,A.source),x!==0)||(x=v.originalLine-A.originalLine,x!==0)||(x=v.originalColumn-A.originalColumn,x!==0)?x:E(v.name,A.name)}e.compareByGeneratedPositionsInflated=k;function S(v){return JSON.parse(v.replace(/^\)]}'[^\n]*\n/,""))}e.parseSourceMapInput=S;function T(v,A,x){if(A=A||"",v&&(v[v.length-1]!=="/"&&A[0]!=="/"&&(v+="/"),A=v+A),x){var _=o(x);if(!_)throw new Error("sourceMapURL could not be parsed");if(_.path){var O=_.path.lastIndexOf("/");O>=0&&(_.path=_.path.substring(0,O+1))}A=c(i(_),A)}return l(A)}e.computeSourceURL=T}),KO=Fi(e=>{var t=ug(),a=Object.prototype.hasOwnProperty,n=typeof Map<"u";function o(){this._array=[],this._set=n?new Map:Object.create(null)}o.fromArray=function(i,r){for(var s=new o,l=0,c=i.length;l<c;l++)s.add(i[l],r);return s},o.prototype.size=function(){return n?this._set.size:Object.getOwnPropertyNames(this._set).length},o.prototype.add=function(i,r){var s=n?i:t.toSetString(i),l=n?this.has(i):a.call(this._set,s),c=this._array.length;(!l||r)&&this._array.push(i),l||(n?this._set.set(i,c):this._set[s]=c)},o.prototype.has=function(i){if(n)return this._set.has(i);var r=t.toSetString(i);return a.call(this._set,r)},o.prototype.indexOf=function(i){if(n){var r=this._set.get(i);if(r>=0)return r}else{var s=t.toSetString(i);if(a.call(this._set,s))return this._set[s]}throw new Error('"'+i+'" is not in the set.')},o.prototype.at=function(i){if(i>=0&&i<this._array.length)return this._array[i];throw new Error("No element indexed by "+i)},o.prototype.toArray=function(){return this._array.slice()},e.ArraySet=o}),XO=Fi(e=>{var t=ug();function a(o,i){var r=o.generatedLine,s=i.generatedLine,l=o.generatedColumn,c=i.generatedColumn;return s>r||s==r&&c>=l||t.compareByGeneratedPositionsInflated(o,i)<=0}function n(){this._array=[],this._sorted=!0,this._last={generatedLine:-1,generatedColumn:0}}n.prototype.unsortedForEach=function(o,i){this._array.forEach(o,i)},n.prototype.add=function(o){a(this._last,o)?(this._last=o,this._array.push(o)):(this._sorted=!1,this._array.push(o))},n.prototype.toArray=function(){return this._sorted||(this._array.sort(t.compareByGeneratedPositionsInflated),this._sorted=!0),this._array},e.MappingList=n}),ZO=Fi(e=>{var t=YO(),a=ug(),n=KO().ArraySet,o=XO().MappingList;function i(r){r||(r={}),this._file=a.getArg(r,"file",null),this._sourceRoot=a.getArg(r,"sourceRoot",null),this._skipValidation=a.getArg(r,"skipValidation",!1),this._ignoreInvalidMapping=a.getArg(r,"ignoreInvalidMapping",!1),this._sources=new n,this._names=new n,this._mappings=new o,this._sourcesContents=null}i.prototype._version=3,i.fromSourceMap=function(r,s){var l=r.sourceRoot,c=new i(Object.assign(s||{},{file:r.file,sourceRoot:l}));return r.eachMapping(function(u){var d={generated:{line:u.generatedLine,column:u.generatedColumn}};u.source!=null&&(d.source=u.source,l!=null&&(d.source=a.relative(l,d.source)),d.original={line:u.originalLine,column:u.originalColumn},u.name!=null&&(d.name=u.name)),c.addMapping(d)}),r.sources.forEach(function(u){var d=u;l!==null&&(d=a.relative(l,u)),c._sources.has(d)||c._sources.add(d);var h=r.sourceContentFor(u);h!=null&&c.setSourceContent(u,h)}),c},i.prototype.addMapping=function(r){var s=a.getArg(r,"generated"),l=a.getArg(r,"original",null),c=a.getArg(r,"source",null),u=a.getArg(r,"name",null);!this._skipValidation&&this._validateMapping(s,l,c,u)===!1||(c!=null&&(c=String(c),this._sources.has(c)||this._sources.add(c)),u!=null&&(u=String(u),this._names.has(u)||this._names.add(u)),this._mappings.add({generatedLine:s.line,generatedColumn:s.column,originalLine:l!=null&&l.line,originalColumn:l!=null&&l.column,source:c,name:u}))},i.prototype.setSourceContent=function(r,s){var l=r;this._sourceRoot!=null&&(l=a.relative(this._sourceRoot,l)),s!=null?(this._sourcesContents||(this._sourcesContents=Object.create(null)),this._sourcesContents[a.toSetString(l)]=s):this._sourcesContents&&(delete this._sourcesContents[a.toSetString(l)],Object.keys(this._sourcesContents).length===0&&(this._sourcesContents=null))},i.prototype.applySourceMap=function(r,s,l){var c=s;if(s==null){if(r.file==null)throw new Error(`SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`);c=r.file}var u=this._sourceRoot;u!=null&&(c=a.relative(u,c));var d=new n,h=new n;this._mappings.unsortedForEach(function(m){if(m.source===c&&m.originalLine!=null){var p=r.originalPositionFor({line:m.originalLine,column:m.originalColumn});p.source!=null&&(m.source=p.source,l!=null&&(m.source=a.join(l,m.source)),u!=null&&(m.source=a.relative(u,m.source)),m.originalLine=p.line,m.originalColumn=p.column,p.name!=null&&(m.name=p.name))}var g=m.source;g!=null&&!d.has(g)&&d.add(g);var w=m.name;w!=null&&!h.has(w)&&h.add(w)},this),this._sources=d,this._names=h,r.sources.forEach(function(m){var p=r.sourceContentFor(m);p!=null&&(l!=null&&(m=a.join(l,m)),u!=null&&(m=a.relative(u,m)),this.setSourceContent(m,p))},this)},i.prototype._validateMapping=function(r,s,l,c){if(s&&typeof s.line!="number"&&typeof s.column!="number"){var u="original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.";if(this._ignoreInvalidMapping)return typeof console<"u"&&console.warn&&console.warn(u),!1;throw new Error(u)}if(!(r&&"line"in r&&"column"in r&&r.line>0&&r.column>=0&&!s&&!l&&!c)){if(r&&"line"in r&&"column"in r&&s&&"line"in s&&"column"in s&&r.line>0&&r.column>=0&&s.line>0&&s.column>=0&&l)return;var u="Invalid mapping: "+JSON.stringify({generated:r,source:l,original:s,name:c});if(this._ignoreInvalidMapping)return typeof console<"u"&&console.warn&&console.warn(u),!1;throw new Error(u)}},i.prototype._serializeMappings=function(){for(var r=0,s=1,l=0,c=0,u=0,d=0,h="",m,p,g,w,f=this._mappings.toArray(),b=0,y=f.length;b<y;b++){if(p=f[b],m="",p.generatedLine!==s)for(r=0;p.generatedLine!==s;)m+=";",s++;else if(b>0){if(!a.compareByGeneratedPositionsInflated(p,f[b-1]))continue;m+=","}m+=t.encode(p.generatedColumn-r),r=p.generatedColumn,p.source!=null&&(w=this._sources.indexOf(p.source),m+=t.encode(w-d),d=w,m+=t.encode(p.originalLine-1-c),c=p.originalLine-1,m+=t.encode(p.originalColumn-l),l=p.originalColumn,p.name!=null&&(g=this._names.indexOf(p.name),m+=t.encode(g-u),u=g)),h+=m}return h},i.prototype._generateSourcesContent=function(r,s){return r.map(function(l){if(!this._sourcesContents)return null;s!=null&&(l=a.relative(s,l));var c=a.toSetString(l);return Object.prototype.hasOwnProperty.call(this._sourcesContents,c)?this._sourcesContents[c]:null},this)},i.prototype.toJSON=function(){var r={version:this._version,sources:this._sources.toArray(),names:this._names.toArray(),mappings:this._serializeMappings()};return this._file!=null&&(r.file=this._file),this._sourceRoot!=null&&(r.sourceRoot=this._sourceRoot),this._sourcesContents&&(r.sourcesContent=this._generateSourcesContent(r.sources,r.sourceRoot)),r},i.prototype.toString=function(){return JSON.stringify(this.toJSON())},e.SourceMapGenerator=i}),_i=null,bn=class Sa{static createItem(t){return{prev:null,next:null,data:t}}constructor(){this.head=null,this.tail=null,this.cursor=null}createItem(t){return Sa.createItem(t)}allocateCursor(t,a){let n;return _i!==null?(n=_i,_i=_i.cursor,n.prev=t,n.next=a,n.cursor=this.cursor):n={prev:t,next:a,cursor:this.cursor},this.cursor=n,n}releaseCursor(){let{cursor:t}=this;this.cursor=t.cursor,t.prev=null,t.next=null,t.cursor=_i,_i=t}updateCursors(t,a,n,o){let{cursor:i}=this;for(;i!==null;)i.prev===t&&(i.prev=a),i.next===n&&(i.next=o),i=i.cursor}*[Symbol.iterator](){for(let t=this.head;t!==null;t=t.next)yield t.data}get size(){let t=0;for(let a=this.head;a!==null;a=a.next)t++;return t}get isEmpty(){return this.head===null}get first(){return this.head&&this.head.data}get last(){return this.tail&&this.tail.data}fromArray(t){let a=null;this.head=null;for(let n of t){let o=Sa.createItem(n);a!==null?a.next=o:this.head=o,o.prev=a,a=o}return this.tail=a,this}toArray(){return[...this]}toJSON(){return[...this]}forEach(t,a=this){let n=this.allocateCursor(null,this.head);for(;n.next!==null;){let o=n.next;n.next=o.next,t.call(a,o.data,o,this)}this.releaseCursor()}forEachRight(t,a=this){let n=this.allocateCursor(this.tail,null);for(;n.prev!==null;){let o=n.prev;n.prev=o.prev,t.call(a,o.data,o,this)}this.releaseCursor()}reduce(t,a,n=this){let o=this.allocateCursor(null,this.head),i=a,r;for(;o.next!==null;)r=o.next,o.next=r.next,i=t.call(n,i,r.data,r,this);return this.releaseCursor(),i}reduceRight(t,a,n=this){let o=this.allocateCursor(this.tail,null),i=a,r;for(;o.prev!==null;)r=o.prev,o.prev=r.prev,i=t.call(n,i,r.data,r,this);return this.releaseCursor(),i}some(t,a=this){for(let n=this.head;n!==null;n=n.next)if(t.call(a,n.data,n,this))return!0;return!1}map(t,a=this){let n=new Sa;for(let o=this.head;o!==null;o=o.next)n.appendData(t.call(a,o.data,o,this));return n}filter(t,a=this){let n=new Sa;for(let o=this.head;o!==null;o=o.next)t.call(a,o.data,o,this)&&n.appendData(o.data);return n}nextUntil(t,a,n=this){if(t===null)return;let o=this.allocateCursor(null,t);for(;o.next!==null;){let i=o.next;if(o.next=i.next,a.call(n,i.data,i,this))break}this.releaseCursor()}prevUntil(t,a,n=this){if(t===null)return;let o=this.allocateCursor(t,null);for(;o.prev!==null;){let i=o.prev;if(o.prev=i.prev,a.call(n,i.data,i,this))break}this.releaseCursor()}clear(){this.head=null,this.tail=null}copy(){let t=new Sa;for(let a of this)t.appendData(a);return t}prepend(t){return this.updateCursors(null,t,this.head,t),this.head!==null?(this.head.prev=t,t.next=this.head):this.tail=t,this.head=t,this}prependData(t){return this.prepend(Sa.createItem(t))}append(t){return this.insert(t)}appendData(t){return this.insert(Sa.createItem(t))}insert(t,a=null){if(a!==null)if(this.updateCursors(a.prev,t,a,t),a.prev===null){if(this.head!==a)throw new Error("before doesn't belong to list");this.head=t,a.prev=t,t.next=a,this.updateCursors(null,t)}else a.prev.next=t,t.prev=a.prev,a.prev=t,t.next=a;else this.updateCursors(this.tail,t,null,t),this.tail!==null?(this.tail.next=t,t.prev=this.tail):this.head=t,this.tail=t;return this}insertData(t,a){return this.insert(Sa.createItem(t),a)}remove(t){if(this.updateCursors(t,t.prev,t,t.next),t.prev!==null)t.prev.next=t.next;else{if(this.head!==t)throw new Error("item doesn't belong to list");this.head=t.next}if(t.next!==null)t.next.prev=t.prev;else{if(this.tail!==t)throw new Error("item doesn't belong to list");this.tail=t.prev}return t.prev=null,t.next=null,t}push(t){this.insert(Sa.createItem(t))}pop(){return this.tail!==null?this.remove(this.tail):null}unshift(t){this.prepend(Sa.createItem(t))}shift(){return this.head!==null?this.remove(this.head):null}prependList(t){return this.insertList(t,this.head)}appendList(t){return this.insertList(t)}insertList(t,a){return t.head===null?this:(a!=null?(this.updateCursors(a.prev,t.tail,a,t.head),a.prev!==null?(a.prev.next=t.head,t.head.prev=a.prev):this.head=t.head,a.prev=t.tail,t.tail.next=a):(this.updateCursors(this.tail,t.tail,null,t.head),this.tail!==null?(this.tail.next=t.head,t.head.prev=this.tail):this.head=t.head,this.tail=t.tail),t.head=null,t.tail=null,this)}replace(t,a){"head"in a?this.insertList(a,t):this.insert(a,t),this.remove(t)}};function ys(e,t){let a=Object.create(SyntaxError.prototype),n=new Error;return Object.assign(a,{name:e,message:t,get stack(){return(n.stack||"").replace(/^(.+\n){1,3}/,`${e}: ${t}
`)}})}var Tp=100,lS=60,cS="    ";function uS({source:e,line:t,column:a,baseLine:n,baseColumn:o},i){function r(p,g){return c.slice(p,g).map((w,f)=>String(p+f+1).padStart(h)+" |"+w).join(`
`)}let s=`
`.repeat(Math.max(n-1,0)),l=" ".repeat(Math.max(o-1,0)),c=(s+l+e).split(/\r\n?|\n|\f/),u=Math.max(1,t-i)-1,d=Math.min(t+i,c.length+1),h=Math.max(4,String(d).length)+1,m=0;a+=(cS.length-1)*(c[t-1].substr(0,a-1).match(/\t/g)||[]).length,a>Tp&&(m=a-lS+3,a=lS-2);for(let p=u;p<=d;p++)p>=0&&p<c.length&&(c[p]=c[p].replace(/\t/g,cS),c[p]=(m>0&&c[p].length>m?"\u2026":"")+c[p].substr(m,Tp-2)+(c[p].length>m+Tp-1?"\u2026":""));return[r(u,t),new Array(a+h+2).join("-")+"^",r(t,d)].filter(Boolean).join(`
`).replace(/^(\s+\d+\s+\|\n)+/,"").replace(/\n(\s+\d+\s+\|)+$/,"")}function dS(e,t,a,n,o,i=1,r=1){return Object.assign(ys("SyntaxError",e),{source:t,offset:a,line:n,column:o,sourceFragment(s){return uS({source:t,line:n,column:o,baseLine:i,baseColumn:r},isNaN(s)?0:s)},get formattedMessage(){return`Parse error: ${e}
`+uS({source:t,line:n,column:o,baseLine:i,baseColumn:r},2)}})}var uA={};J(uA,{AtKeyword:()=>eD,BadString:()=>nD,BadUrl:()=>iD,CDC:()=>hD,CDO:()=>dD,Colon:()=>mD,Comma:()=>gD,Comment:()=>vD,Delim:()=>rD,Dimension:()=>cD,EOF:()=>$O,Function:()=>QO,Hash:()=>tD,Ident:()=>JO,LeftCurlyBracket:()=>kD,LeftParenthesis:()=>bD,LeftSquareBracket:()=>fD,Number:()=>sD,Percentage:()=>lD,RightCurlyBracket:()=>ED,RightParenthesis:()=>yD,RightSquareBracket:()=>wD,Semicolon:()=>pD,String:()=>aD,Url:()=>oD,WhiteSpace:()=>uD});var $O=0,JO=1,QO=2,eD=3,tD=4,aD=5,nD=6,oD=7,iD=8,rD=9,sD=10,lD=11,cD=12,uD=13,dD=14,hD=15,mD=16,pD=17,gD=18,fD=19,wD=20,bD=21,yD=22,kD=23,ED=24,vD=25;function yt(e){return e>=48&&e<=57}function Vn(e){return yt(e)||e>=65&&e<=70||e>=97&&e<=102}function dg(e){return e>=65&&e<=90}function SD(e){return e>=97&&e<=122}function AD(e){return dg(e)||SD(e)}function TD(e){return e>=128}function nu(e){return AD(e)||TD(e)||e===95}function hg(e){return nu(e)||yt(e)||e===45}function CD(e){return e>=0&&e<=8||e===11||e>=14&&e<=31||e===127}function ou(e){return e===10||e===13||e===12}function _o(e){return ou(e)||e===32||e===9}function Aa(e,t){return!(e!==92||ou(t)||t===0)}function $c(e,t,a){return e===45?nu(t)||t===45||Aa(t,a):nu(e)?!0:e===92?Aa(e,t):!1}function Cp(e,t,a){return e===43||e===45?yt(t)?2:t===46&&yt(a)?3:0:e===46?yt(t)?2:0:yt(e)?1:0}function dA(e){return e===65279||e===65534?1:0}var qp=new Array(128),RD=128,Jc=130,hA=131,mg=132,mA=133;for(let e=0;e<qp.length;e++)qp[e]=_o(e)&&Jc||yt(e)&&hA||nu(e)&&mg||CD(e)&&mA||e||RD;function Rp(e){return e<128?qp[e]:mg}function Di(e,t){return t<e.length?e.charCodeAt(t):0}function Yp(e,t,a){return a===13&&Di(e,t+1)===10?2:1}function Mi(e,t,a){let n=e.charCodeAt(t);return dg(n)&&(n=n|32),n===a}function fs(e,t,a,n){if(a-t!==n.length||t<0||a>e.length)return!1;for(let o=t;o<a;o++){let i=n.charCodeAt(o-t),r=e.charCodeAt(o);if(dg(r)&&(r=r|32),r!==i)return!1}return!0}function _D(e,t){for(;t>=0&&_o(e.charCodeAt(t));t--);return t+1}function Gc(e,t){for(;t<e.length&&_o(e.charCodeAt(t));t++);return t}function _p(e,t){for(;t<e.length&&yt(e.charCodeAt(t));t++);return t}function xo(e,t){if(t+=2,Vn(Di(e,t-1))){for(let n=Math.min(e.length,t+5);t<n&&Vn(Di(e,t));t++);let a=Di(e,t);_o(a)&&(t+=Yp(e,t,a))}return t}function Wc(e,t){for(;t<e.length;t++){let a=e.charCodeAt(t);if(!hg(a)){if(Aa(a,Di(e,t+1))){t=xo(e,t)-1;continue}break}}return t}function hu(e,t){let a=e.charCodeAt(t);if((a===43||a===45)&&(a=e.charCodeAt(t+=1)),yt(a)&&(t=_p(e,t+1),a=e.charCodeAt(t)),a===46&&yt(e.charCodeAt(t+1))&&(t+=2,t=_p(e,t)),Mi(e,t,101)){let n=0;a=e.charCodeAt(t+1),(a===45||a===43)&&(n=1,a=e.charCodeAt(t+2)),yt(a)&&(t=_p(e,t+1+n+1))}return t}function xp(e,t){for(;t<e.length;t++){let a=e.charCodeAt(t);if(a===41){t++;break}Aa(a,Di(e,t+1))&&(t=xo(e,t))}return t}function pg(e){if(e.length===1&&!Vn(e.charCodeAt(0)))return e[0];let t=parseInt(e,16);return(t===0||t>=55296&&t<=57343||t>1114111)&&(t=65533),String.fromCodePoint(t)}var iu=["EOF-token","ident-token","function-token","at-keyword-token","hash-token","string-token","bad-string-token","url-token","bad-url-token","delim-token","number-token","percentage-token","dimension-token","whitespace-token","CDO-token","CDC-token","colon-token","semicolon-token","comma-token","[-token","]-token","(-token",")-token","{-token","}-token","comment-token"];function ru(e=null,t){return e===null||e.length<t?new Uint32Array(Math.max(t+1024,16384)):e}var hS=10,xD=12,mS=13;function pS(e){let t=e.source,a=t.length,n=t.length>0?dA(t.charCodeAt(0)):0,o=ru(e.lines,a),i=ru(e.columns,a),r=e.startLine,s=e.startColumn;for(let l=n;l<a;l++){let c=t.charCodeAt(l);o[l]=r,i[l]=s++,(c===hS||c===mS||c===xD)&&(c===mS&&l+1<a&&t.charCodeAt(l+1)===hS&&(l++,o[l]=r,i[l]=s),r++,s=1)}o[a]=r,i[a]=s,e.lines=o,e.columns=i,e.computed=!0}var pA=class{constructor(e,t,a,n){this.setSource(e,t,a,n),this.lines=null,this.columns=null}setSource(e="",t=0,a=1,n=1){this.source=e,this.startOffset=t,this.startLine=a,this.startColumn=n,this.computed=!1}getLocation(e,t){return this.computed||pS(this),{source:t,offset:this.startOffset+e,line:this.lines[e],column:this.columns[e]}}getLocationRange(e,t,a){return this.computed||pS(this),{source:a,start:{offset:this.startOffset+e,line:this.lines[e],column:this.columns[e]},end:{offset:this.startOffset+t,line:this.lines[t],column:this.columns[t]}}}},Ea=134217727,va=27,ks=1,mu=2,Wn=new Uint8Array(32);Wn[2]=22;Wn[21]=22;Wn[19]=20;Wn[23]=24;var Ta=new Uint8Array(32);Ta[2]=ks;Ta[21]=ks;Ta[19]=ks;Ta[23]=ks;Ta[22]=mu;Ta[20]=mu;Ta[24]=mu;function gS(e,t,a){return e<t?t:e>a?a:e}var gA=class{constructor(e,t){this.setSource(e,t)}reset(){this.eof=!1,this.tokenIndex=-1,this.tokenType=0,this.tokenStart=this.firstCharOffset,this.tokenEnd=this.firstCharOffset}setSource(e="",t=()=>{}){e=String(e||"");let a=e.length,n=ru(this.offsetAndType,e.length+1),o=ru(this.balance,e.length+1),i=0,r=-1,s=0,l=e.length;this.offsetAndType=null,this.balance=null,o.fill(0,0,a+1),t(e,(c,u,d)=>{let h=i++;if(n[h]=c<<va|d,r===-1&&(r=u),o[h]=l,c===s){let m=o[l];o[l]=h,l=m,s=Wn[n[m]>>>va]}else this.isBlockOpenerTokenType(c)&&(l=h,s=Wn[c])}),n[i]=0<<va|a,o[i]=i;for(let c=0;c<i;c++){let u=o[c];if(u<=c){let d=o[u];d!==c&&(o[c]=d)}else u>i&&(o[c]=i)}this.source=e,this.firstCharOffset=r===-1?0:r,this.tokenCount=i,this.offsetAndType=n,this.balance=o,this.reset(),this.next()}lookupType(e){return e+=this.tokenIndex,e<this.tokenCount?this.offsetAndType[e]>>>va:0}lookupTypeNonSC(e){for(let t=this.tokenIndex;t<this.tokenCount;t++){let a=this.offsetAndType[t]>>>va;if(a!==13&&a!==25&&e--===0)return a}return 0}lookupOffset(e){return e+=this.tokenIndex,e<this.tokenCount?this.offsetAndType[e-1]&Ea:this.source.length}lookupOffsetNonSC(e){for(let t=this.tokenIndex;t<this.tokenCount;t++){let a=this.offsetAndType[t]>>>va;if(a!==13&&a!==25&&e--===0)return t-this.tokenIndex}return 0}lookupValue(e,t){return e+=this.tokenIndex,e<this.tokenCount?fs(this.source,this.offsetAndType[e-1]&Ea,this.offsetAndType[e]&Ea,t):!1}getTokenStart(e){return e===this.tokenIndex?this.tokenStart:e>0?e<this.tokenCount?this.offsetAndType[e-1]&Ea:this.offsetAndType[this.tokenCount]&Ea:this.firstCharOffset}getTokenEnd(e){return e===this.tokenIndex?this.tokenEnd:this.offsetAndType[gS(e,0,this.tokenCount)]&Ea}getTokenType(e){return e===this.tokenIndex?this.tokenType:this.offsetAndType[gS(e,0,this.tokenCount)]>>>va}substrToCursor(e){return this.source.substring(e,this.tokenStart)}isBlockOpenerTokenType(e){return Ta[e]===ks}isBlockCloserTokenType(e){return Ta[e]===mu}getBlockTokenPairIndex(e){let t=this.getTokenType(e);if(Ta[t]===1){let a=this.balance[e],n=this.getTokenType(a);return Wn[t]===n?a:-1}else if(Ta[t]===2){let a=this.balance[e],n=this.getTokenType(a);return Wn[n]===t?a:-1}return-1}isBalanceEdge(e){return this.balance[this.tokenIndex]<e}isDelim(e,t){return t?this.lookupType(t)===9&&this.source.charCodeAt(this.lookupOffset(t))===e:this.tokenType===9&&this.source.charCodeAt(this.tokenStart)===e}skip(e){let t=this.tokenIndex+e;t<this.tokenCount?(this.tokenIndex=t,this.tokenStart=this.offsetAndType[t-1]&Ea,t=this.offsetAndType[t],this.tokenType=t>>>va,this.tokenEnd=t&Ea):(this.tokenIndex=this.tokenCount,this.next())}next(){let e=this.tokenIndex+1;e<this.tokenCount?(this.tokenIndex=e,this.tokenStart=this.tokenEnd,e=this.offsetAndType[e],this.tokenType=e>>>va,this.tokenEnd=e&Ea):(this.eof=!0,this.tokenIndex=this.tokenCount,this.tokenType=0,this.tokenStart=this.tokenEnd=this.source.length)}skipSC(){for(;this.tokenType===13||this.tokenType===25;)this.next()}skipUntilBalanced(e,t){let a=e,n=0,o=0;e:for(;a<this.tokenCount;a++){if(n=this.balance[a],n<e)break e;switch(o=a>0?this.offsetAndType[a-1]&Ea:this.firstCharOffset,t(this.source.charCodeAt(o))){case 1:break e;case 2:a++;break e;default:this.isBlockOpenerTokenType(this.offsetAndType[a]>>>va)&&(a=n)}}this.skip(a-this.tokenIndex)}forEachToken(e){for(let t=0,a=this.firstCharOffset;t<this.tokenCount;t++){let n=a,o=this.offsetAndType[t],i=o&Ea,r=o>>>va;a=i,e(r,n,i,t)}}dump(){let e=new Array(this.tokenCount);return this.forEachToken((t,a,n,o)=>{e[o]={idx:o,type:iu[t],chunk:this.source.substring(a,n),balance:this.balance[o]}}),e}};function fA(e,t){function a(d){return d<s?e.charCodeAt(d):0}function n(){if(c=hu(e,c),$c(a(c),a(c+1),a(c+2))){u=12,c=Wc(e,c);return}if(a(c)===37){u=11,c++;return}u=10}function o(){let d=c;if(c=Wc(e,c),fs(e,d,c,"url")&&a(c)===40){if(c=Gc(e,c+1),a(c)===34||a(c)===39){u=2,c=d+4;return}r();return}if(a(c)===40){u=2,c++;return}u=1}function i(d){for(d||(d=a(c++)),u=5;c<e.length;c++){let h=e.charCodeAt(c);switch(Rp(h)){case d:c++;return;case Jc:if(ou(h)){c+=Yp(e,c,h),u=6;return}break;case 92:if(c===e.length-1)break;let m=a(c+1);ou(m)?c+=Yp(e,c+1,m):Aa(h,m)&&(c=xo(e,c)-1);break}}}function r(){for(u=7,c=Gc(e,c);c<e.length;c++){let d=e.charCodeAt(c);switch(Rp(d)){case 41:c++;return;case Jc:if(c=Gc(e,c),a(c)===41||c>=e.length){c<e.length&&c++;return}c=xp(e,c),u=8;return;case 34:case 39:case 40:case mA:c=xp(e,c),u=8;return;case 92:if(Aa(d,a(c+1))){c=xo(e,c)-1;break}c=xp(e,c),u=8;return}}}e=String(e||"");let s=e.length,l=dA(a(0)),c=l,u;for(;c<s;){let d=e.charCodeAt(c);switch(Rp(d)){case Jc:u=13,c=Gc(e,c+1);break;case 34:i();break;case 35:hg(a(c+1))||Aa(a(c+1),a(c+2))?(u=4,c=Wc(e,c+1)):(u=9,c++);break;case 39:i();break;case 40:u=21,c++;break;case 41:u=22,c++;break;case 43:Cp(d,a(c+1),a(c+2))?n():(u=9,c++);break;case 44:u=18,c++;break;case 45:Cp(d,a(c+1),a(c+2))?n():a(c+1)===45&&a(c+2)===62?(u=15,c=c+3):$c(d,a(c+1),a(c+2))?o():(u=9,c++);break;case 46:Cp(d,a(c+1),a(c+2))?n():(u=9,c++);break;case 47:a(c+1)===42?(u=25,c=e.indexOf("*/",c+2),c=c===-1?e.length:c+2):(u=9,c++);break;case 58:u=16,c++;break;case 59:u=17,c++;break;case 60:a(c+1)===33&&a(c+2)===45&&a(c+3)===45?(u=14,c=c+4):(u=9,c++);break;case 64:$c(a(c+1),a(c+2),a(c+3))?(u=3,c=Wc(e,c+1)):(u=9,c++);break;case 91:u=19,c++;break;case 92:Aa(d,a(c+1))?o():(u=9,c++);break;case 93:u=20,c++;break;case 123:u=23,c++;break;case 125:u=24,c++;break;case hA:n();break;case mg:o();break;default:u=9,c++}t(u,l,l=c)}}function LD(e){let t=this.createList(),a=!1,n={recognizer:e};for(;!this.eof;){switch(this.tokenType){case 25:this.next();continue;case 13:a=!0,this.next();continue}let o=e.getNode.call(this,n);if(o===void 0)break;a&&(e.onWhiteSpace&&e.onWhiteSpace.call(this,o,t,n),a=!1),t.push(o)}return a&&e.onWhiteSpace&&e.onWhiteSpace.call(this,null,t,n),t}var ID="function";function pu(e){return e&&typeof e.tokenize===ID?e.tokenize:fA}var xi=()=>{},jD=33,ND=35,Lp=59,fS=123,wS=0,OD={createList(){return[]},createSingleNodeList(e){return[e]},getFirstListNode(e){return e&&e[0]||null},getLastListNode(e){return e&&e.length>0?e[e.length-1]:null}},DD={createList(){return new bn},createSingleNodeList(e){return new bn().appendData(e)},getFirstListNode(e){return e&&e.first},getLastListNode(e){return e&&e.last}};function MD(e){return function(){return this[e]()}}function Ip(e){let t=Object.create(null);for(let a of Object.keys(e)){let n=e[a],o=n.parse||n;o&&(t[a]=o)}return t}function PD(e){let t={context:Object.create(null),features:Object.assign(Object.create(null),e.features),scope:Object.assign(Object.create(null),e.scope),atrule:Ip(e.atrule),pseudo:Ip(e.pseudo),node:Ip(e.node),tokenize:pu(e)};for(let[a,n]of Object.entries(e.parseContext))switch(typeof n){case"function":t.context[a]=n;break;case"string":t.context[a]=MD(n);break}return{config:t,...t,...t.node}}function FD(e){let t="",a="<unknown>",n=!1,o=xi,i=!1,r=new pA,s=Object.assign(new gA,PD(e||{}),{parseAtrulePrelude:!0,parseRulePrelude:!0,parseValue:!0,parseCustomProperty:!1,readSequence:LD,consumeUntilBalanceEnd:()=>0,consumeUntilLeftCurlyBracket(c){return c===fS?1:0},consumeUntilLeftCurlyBracketOrSemicolon(c){return c===fS||c===Lp?1:0},consumeUntilExclamationMarkOrSemicolon(c){return c===jD||c===Lp?1:0},consumeUntilSemicolonIncluded(c){return c===Lp?2:0},createList:xi,createSingleNodeList:xi,getFirstListNode:xi,getLastListNode:xi,parseWithFallback(c,u){let d=this.tokenIndex;try{return c.call(this)}catch(h){if(i)throw h;this.skip(d-this.tokenIndex);let m=u.call(this);return i=!0,o(h,m),i=!1,m}},lookupNonWSType(c){let u;do if(u=this.lookupType(c++),u!==13&&u!==25)return u;while(u!==wS);return wS},charCodeAt(c){return c>=0&&c<t.length?t.charCodeAt(c):0},substring(c,u){return t.substring(c,u)},substrToCursor(c){return this.source.substring(c,this.tokenStart)},cmpChar(c,u){return Mi(t,c,u)},cmpStr(c,u,d){return fs(t,c,u,d)},consume(c){let u=this.tokenStart;return this.eat(c),this.substrToCursor(u)},consumeFunctionName(){let c=t.substring(this.tokenStart,this.tokenEnd-1);return this.eat(2),c},consumeNumber(c){let u=t.substring(this.tokenStart,hu(t,this.tokenStart));return this.eat(c),u},eat(c){if(this.tokenType!==c){let u=iu[c].slice(0,-6).replace(/-/g," ").replace(/^./,m=>m.toUpperCase()),d=`${/[[\](){}]/.test(u)?`"${u}"`:u} is expected`,h=this.tokenStart;switch(c){case 1:this.tokenType===2||this.tokenType===7?(h=this.tokenEnd-1,d="Identifier is expected but function found"):d="Identifier is expected";break;case 4:this.isDelim(ND)&&(this.next(),h++,d="Name is expected");break;case 11:this.tokenType===10&&(h=this.tokenEnd,d="Percent sign is expected");break}this.error(d,h)}this.next()},eatIdent(c){(this.tokenType!==1||this.lookupValue(0,c)===!1)&&this.error(`Identifier "${c}" is expected`),this.next()},eatDelim(c){this.isDelim(c)||this.error(`Delim "${String.fromCharCode(c)}" is expected`),this.next()},getLocation(c,u){return n?r.getLocationRange(c,u,a):null},getLocationFromList(c){if(n){let u=this.getFirstListNode(c),d=this.getLastListNode(c);return r.getLocationRange(u!==null?u.loc.start.offset-r.startOffset:this.tokenStart,d!==null?d.loc.end.offset-r.startOffset:this.tokenStart,a)}return null},error(c,u){let d=typeof u<"u"&&u<t.length?r.getLocation(u):this.eof?r.getLocation(_D(t,t.length-1)):r.getLocation(this.tokenStart);throw new dS(c||"Unexpected input",t,d.offset,d.line,d.column,r.startLine,r.startColumn)}}),l=()=>({filename:a,source:t,tokenCount:s.tokenCount,getTokenType:c=>s.getTokenType(c),getTokenTypeName:c=>iu[s.getTokenType(c)],getTokenStart:c=>s.getTokenStart(c),getTokenEnd:c=>s.getTokenEnd(c),getTokenValue:c=>s.source.substring(s.getTokenStart(c),s.getTokenEnd(c)),substring:(c,u)=>s.source.substring(c,u),balance:s.balance.subarray(0,s.tokenCount+1),isBlockOpenerTokenType:s.isBlockOpenerTokenType,isBlockCloserTokenType:s.isBlockCloserTokenType,getBlockTokenPairIndex:c=>s.getBlockTokenPairIndex(c),getLocation:c=>r.getLocation(c,a),getRangeLocation:(c,u)=>r.getLocationRange(c,u,a)});return Object.assign(function(c,u){t=c,u=u||{},s.setSource(t,s.tokenize),r.setSource(t,u.offset,u.line,u.column),a=u.filename||"<unknown>",n=!!u.positions,o=typeof u.onParseError=="function"?u.onParseError:xi,i=!1,s.parseAtrulePrelude="parseAtrulePrelude"in u?!!u.parseAtrulePrelude:!0,s.parseRulePrelude="parseRulePrelude"in u?!!u.parseRulePrelude:!0,s.parseValue="parseValue"in u?!!u.parseValue:!0,s.parseCustomProperty="parseCustomProperty"in u?!!u.parseCustomProperty:!1;let{context:d="default",list:h=!0,onComment:m,onToken:p}=u;if(!(d in s.context))throw new Error("Unknown context `"+d+"`");Object.assign(s,h?DD:OD),Array.isArray(p)?s.forEachToken((w,f,b)=>{p.push({type:w,start:f,end:b})}):typeof p=="function"&&s.forEachToken(p.bind(l())),typeof m=="function"&&s.forEachToken((w,f,b)=>{if(w===25){let y=s.getLocation(f,b),E=fs(t,b-2,b,"*/")?t.slice(f+2,b-2):t.slice(f+2,b);m(E,y)}});let g=s.context[d].call(s,u);return s.eof||s.error(),g},{SyntaxError:dS,config:s.config})}var zD=VO(ZO(),1),bS=new Set(["Atrule","Selector","Declaration"]);function UD(e){let t=new zD.SourceMapGenerator,a={line:1,column:0},n={line:0,column:0},o={line:1,column:0},i={generated:o},r=1,s=0,l=!1,c=e.node;e.node=function(h){if(h.loc&&h.loc.start&&bS.has(h.type)){let m=h.loc.start.line,p=h.loc.start.column-1;(n.line!==m||n.column!==p)&&(n.line=m,n.column=p,a.line=r,a.column=s,l&&(l=!1,(a.line!==o.line||a.column!==o.column)&&t.addMapping(i)),l=!0,t.addMapping({source:h.loc.source,original:n,generated:a}))}c.call(this,h),l&&bS.has(h.type)&&(o.line=r,o.column=s)};let u=e.emit;e.emit=function(h,m,p){for(let g=0;g<h.length;g++)h.charCodeAt(g)===10?(r++,s=0):s++;u(h,m,p)};let d=e.result;return e.result=function(){return l&&t.addMapping(i),{css:d(),map:t}},e}var Kp={};J(Kp,{safe:()=>yA,spec:()=>WD});var BD=43,HD=45,jp=(e,t)=>(e===9&&(e=t),typeof e=="string"&&(e=Math.min(e.charCodeAt(0),128)<<6),e<<1),wA=[[1,1],[1,2],[1,7],[1,8],[1,"-"],[1,10],[1,11],[1,12],[1,15],[1,21],[3,1],[3,2],[3,7],[3,8],[3,"-"],[3,10],[3,11],[3,12],[3,15],[4,1],[4,2],[4,7],[4,8],[4,"-"],[4,10],[4,11],[4,12],[4,15],[12,1],[12,2],[12,7],[12,8],[12,"-"],[12,10],[12,11],[12,12],[12,15],["#",1],["#",2],["#",7],["#",8],["#","-"],["#",10],["#",11],["#",12],["#",15],["-",1],["-",2],["-",7],["-",8],["-","-"],["-",10],["-",11],["-",12],["-",15],[10,1],[10,2],[10,7],[10,8],[10,10],[10,11],[10,12],[10,"%"],[10,15],["@",1],["@",2],["@",7],["@",8],["@","-"],["@",15],[".",10],[".",11],[".",12],["+",10],["+",11],["+",12],["/","*"]],GD=wA.concat([[1,4],[12,4],[4,4],[3,21],[3,5],[3,16],[11,11],[11,12],[11,2],[11,"-"],[22,1],[22,2],[22,11],[22,12],[22,4],[22,"-"]]);function bA(e){let t=new Set(e.map(([a,n])=>jp(a)<<16|jp(n)));return function(a,n,o){let i=jp(n,o),r=o.charCodeAt(0),s=r===HD&&n!==1&&n!==2&&n!==15||r===BD?t.has((a&65534)<<16|r<<7):t.has((a&65534)<<16|i);return i|s}}var WD=bA(wA),yA=bA(GD),VD=92;function qD(e,t){if(typeof t=="function"){let a=null;e.children.forEach(n=>{a!==null&&t.call(this,a),this.node(n),a=n});return}e.children.forEach(this.node,this)}function YD(e){let t=new Map;for(let[a,n]of Object.entries(e.node))typeof(n.generate||n)=="function"&&t.set(a,n.generate||n);return function(a,n){let o="",i=0,r={node(l){if(t.has(l.type))t.get(l.type).call(s,l);else throw new Error("Unknown node type: "+l.type)},tokenBefore:yA,token(l,c,u){i=this.tokenBefore(i,l,c),!u&&i&1&&this.emit(" ",13,!0),this.emit(c,l,!1),l===9&&c.charCodeAt(0)===VD&&this.emit(`
`,13,!0)},emit(l){o+=l},result(){return o}};n&&(typeof n.decorator=="function"&&(r=n.decorator(r)),n.sourceMap&&(r=UD(r)),n.mode in Kp&&(r.tokenBefore=Kp[n.mode]));let s={node:l=>r.node(l),children:qD,token:(l,c)=>r.token(l,c),tokenize:function(l){return pu(e)(l,(c,u,d)=>{r.token(c,l.slice(u,d),u!==0)})}};return r.node(a),r.result()}}function KD(e){return{fromPlainObject(t){return e(t,{enter(a){a.children&&!(a.children instanceof bn)&&(a.children=new bn().fromArray(a.children))}}),t},toPlainObject(t){return e(t,{leave(a){a.children&&a.children instanceof bn&&(a.children=a.children.toArray())}}),t}}}var{hasOwnProperty:gg}=Object.prototype,ss=function(){};function yS(e){return typeof e=="function"?e:ss}function kS(e,t){return function(a,n,o){a.type===t&&e.call(this,a,n,o)}}function XD(e,t){let a=t.structure,n=[];for(let o in a){if(gg.call(a,o)===!1)continue;let i=a[o],r={name:o,type:!1,nullable:!1};Array.isArray(i)||(i=[i]);for(let s of i)s===null?r.nullable=!0:typeof s=="string"?r.type="node":Array.isArray(s)&&(r.type="list");r.type&&n.push(r)}return n.length?{context:t.walkContext,fields:n}:null}function ZD(e){let t={};for(let a in e.node)if(gg.call(e.node,a)){let n=e.node[a];if(!n.structure)throw new Error("Missed `structure` field in `"+a+"` node type definition");t[a]=XD(a,n)}return t}function ES(e,t){let a=e.fields.slice(),n=e.context,o=typeof n=="string";return t&&a.reverse(),function(i,r,s,l){let c;o&&(c=r[n],r[n]=i);for(let u of a){let d=i[u.name];if(!u.nullable||d){if(u.type==="list"){if(t?d.reduceRight(l,!1):d.reduce(l,!1))return!0}else if(s(d))return!0}}o&&(r[n]=c)}}function vS({StyleSheet:e,Atrule:t,Rule:a,Block:n,DeclarationList:o}){return{Atrule:{StyleSheet:e,Atrule:t,Rule:a,Block:n},Rule:{StyleSheet:e,Atrule:t,Rule:a,Block:n},Declaration:{StyleSheet:e,Atrule:t,Rule:a,Block:n,DeclarationList:o}}}function $D(e){let t=ZD(e),a={},n={},o=Symbol("break-walk"),i=Symbol("skip-node");for(let c in t)gg.call(t,c)&&t[c]!==null&&(a[c]=ES(t[c],!1),n[c]=ES(t[c],!0));let r=vS(a),s=vS(n),l=function(c,u){function d(f,b,y){let E=h.call(w,f,b,y);return E===o?!0:E===i?!1:!!(p.hasOwnProperty(f.type)&&p[f.type](f,w,d,g)||m.call(w,f,b,y)===o)}let h=ss,m=ss,p=a,g=(f,b,y,E)=>f||d(b,y,E),w={break:o,skip:i,root:c,stylesheet:null,atrule:null,atrulePrelude:null,rule:null,selector:null,block:null,declaration:null,function:null};if(typeof u=="function")h=u;else if(u&&(h=yS(u.enter),m=yS(u.leave),u.reverse&&(p=n),u.visit)){if(r.hasOwnProperty(u.visit))p=u.reverse?s[u.visit]:r[u.visit];else if(!t.hasOwnProperty(u.visit))throw new Error("Bad value `"+u.visit+"` for `visit` option (should be: "+Object.keys(t).sort().join(", ")+")");h=kS(h,u.visit),m=kS(m,u.visit)}if(h===ss&&m===ss)throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");d(c)};return l.break=o,l.skip=i,l.find=function(c,u){let d=null;return l(c,function(h,m,p){if(u.call(this,h,m,p))return d=h,o}),d},l.findLast=function(c,u){let d=null;return l(c,{reverse:!0,enter(h,m,p){if(u.call(this,h,m,p))return d=h,o}}),d},l.findAll=function(c,u){let d=[];return l(c,function(h,m,p){u.call(this,h,m,p)&&d.push(h)}),d},l}function JD(e){return e}function QD(e){let{min:t,max:a,comma:n}=e;return t===0&&a===0?n?"#?":"*":t===0&&a===1?"?":t===1&&a===0?n?"#":"+":t===1&&a===1?"":(n?"#":"")+(t===a?"{"+t+"}":"{"+t+","+(a!==0?a:"")+"}")}function eM(e){if(e.type==="Range")return" ["+(e.min===null?"-\u221E":e.min)+","+(e.max===null?"\u221E":e.max)+"]";throw new Error("Unknown node type `"+e.type+"`")}function tM(e,t,a,n){let o=e.combinator===" "||n?e.combinator:" "+e.combinator+" ",i=e.terms.map(r=>su(r,t,a,n)).join(o);return e.explicit||a?(n||i[0]===","?"[":"[ ")+i+(n?"]":" ]"):i}function su(e,t,a,n){let o;switch(e.type){case"Group":o=tM(e,t,a,n)+(e.disallowEmpty?"!":"");break;case"Multiplier":return su(e.term,t,a,n)+t(QD(e),e);case"Boolean":o="<boolean-expr["+su(e.term,t,a,n)+"]>";break;case"Type":o="<"+e.name+(e.opts?t(eM(e.opts),e.opts):"")+">";break;case"Property":o="<'"+e.name+"'>";break;case"Keyword":o=e.name;break;case"AtKeyword":o="@"+e.name;break;case"Function":o=e.name+"(";break;case"String":case"Token":o=e.value;break;case"Comma":o=",";break;default:throw new Error("Unknown node type `"+e.type+"`")}return t(o,e)}function gu(e,t){let a=JD,n=!1,o=!1;return typeof t=="function"?a=t:t&&(n=!!t.forceBraces,o=!!t.compact,typeof t.decorate=="function"&&(a=t.decorate)),su(e,a,n,o)}var SS={offset:0,line:1,column:1};function aM(e,t){let a=e.tokens,n=e.longestMatch,o=n<a.length&&a[n].node||null,i=o!==t?o:null,r=0,s=0,l=0,c="",u,d;for(let h=0;h<a.length;h++){let m=a[h].value;h===n&&(s=m.length,r=c.length),i!==null&&a[h].node===i&&(h<=n?l++:l=0),c+=m}return n===a.length||l>1?(u=Vc(i||t,"end")||ls(SS,c),d=ls(u)):(u=Vc(i,"start")||ls(Vc(t,"start")||SS,c.slice(0,r)),d=Vc(i,"end")||ls(u,c.substr(r,s))),{css:c,mismatchOffset:r,mismatchLength:s,start:u,end:d}}function Vc(e,t){let a=e&&e.loc&&e.loc[t];return a?"line"in a?ls(a):a:null}function ls({offset:e,line:t,column:a},n){let o={offset:e,line:t,column:a};if(n){let i=n.split(/\n|\r\n?|\f/);o.offset+=n.length,o.line+=i.length-1,o.column=i.length===1?o.column+n.length:i.pop().length+1}return o}var rs=function(e,t){let a=ys("SyntaxReferenceError",e+(t?" `"+t+"`":""));return a.reference=t,a},AS=function(e){let t=ys("UnsupportedMatchingTree",`Matching for a tree with ${e}() is not supported`);return t.code=`ERR_LEXER_${e.toUpperCase()}_MATCH_UNSUPPORTED`,t},nM=function(e,t,a,n){let o=ys("SyntaxMatchError",e),{css:i,mismatchOffset:r,mismatchLength:s,start:l,end:c}=aM(n,a);return o.rawMessage=e,o.syntax=t?gu(t):"<generic>",o.css=i,o.mismatchOffset=r,o.mismatchLength=s,o.message=e+`
  syntax: `+o.syntax+`
   value: `+(i||"<empty string>")+`
  --------`+new Array(o.mismatchOffset+1).join("-")+"^",Object.assign(o,l),o.loc={source:a&&a.loc&&a.loc.source||"<unknown>",start:l,end:c},o},qc=new Map,Li=new Map,lu=45,cs=iM,Xp=rM,oM=fg;function fu(e,t){return t=t||0,e.length-t>=2&&e.charCodeAt(t)===lu&&e.charCodeAt(t+1)===lu}function fg(e,t){if(t=t||0,e.length-t>=3&&e.charCodeAt(t)===lu&&e.charCodeAt(t+1)!==lu){let a=e.indexOf("-",t+2);if(a!==-1)return e.substring(t,a+1)}return""}function iM(e){if(qc.has(e))return qc.get(e);let t=e.toLowerCase(),a=qc.get(t);if(a===void 0){let n=fu(t,0),o=n?"":fg(t,0);a=Object.freeze({basename:t.substr(o.length),name:t,prefix:o,vendor:o,custom:n})}return qc.set(e,a),a}function rM(e){if(Li.has(e))return Li.get(e);let t=e,a=e[0];a==="/"?a=e[1]==="/"?"//":"/":a!=="_"&&a!=="*"&&a!=="$"&&a!=="#"&&a!=="+"&&a!=="&"&&(a="");let n=fu(t,a.length);if(!n&&(t=t.toLowerCase(),Li.has(t))){let s=Li.get(t);return Li.set(e,s),s}let o=n?"":fg(t,a.length),i=t.substr(0,a.length+o.length),r=Object.freeze({basename:t.substr(i.length),name:t.substr(a.length),hack:a,vendor:o,prefix:i,custom:n});return Li.set(e,r),r}var wg=["initial","inherit","unset","revert","revert-layer","revert-rule"],ws=43,Ha=45,Np=110,Ii=!0,sM=!1;function Zp(e,t){return e!==null&&e.type===9&&e.value.charCodeAt(0)===t}function ms(e,t,a){for(;e!==null&&(e.type===13||e.type===25);)e=a(++t);return t}function Gn(e,t,a,n){if(!e)return 0;let o=e.value.charCodeAt(t);if(o===ws||o===Ha){if(a)return 0;t++}for(;t<e.value.length;t++)if(!yt(e.value.charCodeAt(t)))return 0;return n+1}function Op(e,t,a){let n=!1,o=ms(e,t,a);if(e=a(o),e===null)return t;if(e.type!==10)if(Zp(e,ws)||Zp(e,Ha)){if(n=!0,o=ms(a(++o),o,a),e=a(o),e===null||e.type!==10)return 0}else return t;if(!n){let i=e.value.charCodeAt(0);if(i!==ws&&i!==Ha)return 0}return Gn(e,n?0:1,n,o)}function lM(e,t){let a=0;if(!e)return 0;if(e.type===10)return Gn(e,0,sM,a);if(e.type===1&&e.value.charCodeAt(0)===Ha){if(!Mi(e.value,1,Np))return 0;switch(e.value.length){case 2:return Op(t(++a),a,t);case 3:return e.value.charCodeAt(2)!==Ha?0:(a=ms(t(++a),a,t),e=t(a),Gn(e,0,Ii,a));default:return e.value.charCodeAt(2)!==Ha?0:Gn(e,3,Ii,a)}}else if(e.type===1||Zp(e,ws)&&t(a+1).type===1){if(e.type!==1&&(e=t(++a)),e===null||!Mi(e.value,0,Np))return 0;switch(e.value.length){case 1:return Op(t(++a),a,t);case 2:return e.value.charCodeAt(1)!==Ha?0:(a=ms(t(++a),a,t),e=t(a),Gn(e,0,Ii,a));default:return e.value.charCodeAt(1)!==Ha?0:Gn(e,2,Ii,a)}}else if(e.type===12){let n=e.value.charCodeAt(0),o=n===ws||n===Ha?1:0,i=o;for(;i<e.value.length&&yt(e.value.charCodeAt(i));i++);return i===o||!Mi(e.value,i,Np)?0:i+1===e.value.length?Op(t(++a),a,t):e.value.charCodeAt(i+1)!==Ha?0:i+2===e.value.length?(a=ms(t(++a),a,t),e=t(a),Gn(e,0,Ii,a)):Gn(e,i+2,Ii,a)}return 0}var cM=43,kA=45,EA=63,uM=117;function $p(e,t){return e!==null&&e.type===9&&e.value.charCodeAt(0)===t}function dM(e,t){return e.value.charCodeAt(0)===t}function us(e,t,a){let n=0;for(let o=t;o<e.value.length;o++){let i=e.value.charCodeAt(o);if(i===kA&&a&&n!==0)return us(e,t+n+1,!1),6;if(!Vn(i)||++n>6)return 0}return n}function Yc(e,t,a){if(!e)return 0;for(;$p(a(t),EA);){if(++e>6)return 0;t++}return t}function hM(e,t){let a=0;if(e===null||e.type!==1||!Mi(e.value,0,uM)||(e=t(++a),e===null))return 0;if($p(e,cM))return e=t(++a),e===null?0:e.type===1?Yc(us(e,0,!0),++a,t):$p(e,EA)?Yc(1,++a,t):0;if(e.type===10){let n=us(e,1,!0);return n===0?0:(e=t(++a),e===null?a:e.type===12||e.type===10?!dM(e,kA)||!us(e,1,!1)?0:a+1:Yc(n,a,t))}return e.type===12?Yc(us(e,1,!0),++a,t):0}var bg=["calc(","-moz-calc(","-webkit-calc("],yg=["min(","max(","clamp("],kg=["round(","mod(","rem("],mM=["sin(","cos(","tan("],pM=["asin(","acos(","atan(","atan2("],gM=["pow(","sqrt(","log(","exp(","sign("],Eg=["hypot("],vg=["abs("],TS=[...bg,...yg,...kg,...mM,...gM,...Eg,...vg],fM=[...bg,...yg,...kg,...Eg,...vg],fn=[...bg,...yg,...kg,...pM,...Eg,...vg],Sg=new Map([[2,22],[21,22],[19,20],[23,24]]);function Ca(e,t){return t<e.length?e.charCodeAt(t):0}function vA(e,t){return fs(e,0,e.length,t)}function SA(e,t){for(let a=0;a<t.length;a++)if(vA(e,t[a]))return!0;return!1}function AA(e,t){return t!==e.length-2?!1:Ca(e,t)===92&&yt(Ca(e,t+1))}function wu(e,t,a){if(e&&e.type==="Range"){let n=Number(a!==void 0&&a!==t.length?t.substr(0,a):t);if(isNaN(n)||e.min!==null&&n<e.min&&typeof e.min!="string"||e.max!==null&&n>e.max&&typeof e.max!="string")return!0}return!1}function wM(e,t){let a=0,n=[],o=0;e:do{switch(e.type){case 24:case 22:case 20:if(e.type!==a)break e;if(a=n.pop(),n.length===0){o++;break e}break;case 2:case 21:case 19:case 23:n.push(a),a=Sg.get(e.type);break}o++}while(e=t(o));return o}function oa(e,t){return function(a,n,o){return a===null?0:a.type===2&&SA(a.value,t)?wM(a,n):e(a,n,o)}}function Ye(e){return function(t){return t===null||t.type!==e?0:1}}function bM(e){if(e===null||e.type!==1)return 0;let t=e.value.toLowerCase();return SA(t,wg)||vA(t,"default")?0:1}function TA(e){return e===null||e.type!==1||Ca(e.value,0)!==45||Ca(e.value,1)!==45?0:1}function yM(e){return!TA(e)||e.value==="--"?0:1}function kM(e){if(e===null||e.type!==4)return 0;let t=e.value.length;if(t!==4&&t!==5&&t!==7&&t!==9)return 0;for(let a=1;a<t;a++)if(!Vn(Ca(e.value,a)))return 0;return 1}function EM(e){return e===null||e.type!==4||!$c(Ca(e.value,1),Ca(e.value,2),Ca(e.value,3))?0:1}function vM(e,t){if(!e)return 0;let a=0,n=[],o=0;e:do{switch(e.type){case 6:case 8:break e;case 24:case 22:case 20:if(e.type!==a)break e;a=n.pop();break;case 17:if(a===0)break e;break;case 9:if(a===0&&e.value==="!")break e;break;case 2:case 21:case 19:case 23:n.push(a),a=Sg.get(e.type);break}o++}while(e=t(o));return o}function SM(e,t){if(!e)return 0;let a=0,n=[],o=0;e:do{switch(e.type){case 6:case 8:break e;case 24:case 22:case 20:if(e.type!==a)break e;a=n.pop();break;case 2:case 21:case 19:case 23:n.push(a),a=Sg.get(e.type);break}o++}while(e=t(o));return o}function wn(e){return e&&(e=new Set(e)),function(t,a,n){if(t===null||t.type!==12)return 0;let o=hu(t.value,0);if(e!==null){let i=t.value.indexOf("\\",o),r=i===-1||!AA(t.value,i)?t.value.substr(o):t.value.substring(o,i);if(e.has(r.toLowerCase())===!1)return 0}return wu(n,t.value,o)?0:1}}function AM(e,t,a){return e===null||e.type!==11||wu(a,e.value,e.value.length-1)?0:1}function CA(e){return typeof e!="function"&&(e=function(){return 0}),function(t,a,n){return t!==null&&t.type===10&&Number(t.value)===0?1:e(t,a,n)}}function TM(e,t,a){if(e===null)return 0;let n=hu(e.value,0);return n!==e.value.length&&!AA(e.value,n)||wu(a,e.value,n)?0:1}function CM(e,t,a){if(e===null||e.type!==10)return 0;let n=Ca(e.value,0)===43||Ca(e.value,0)===45?1:0;for(;n<e.value.length;n++)if(!yt(Ca(e.value,n)))return 0;return wu(a,e.value,n)?0:1}var RM={"ident-token":Ye(1),"function-token":Ye(2),"at-keyword-token":Ye(3),"hash-token":Ye(4),"string-token":Ye(5),"bad-string-token":Ye(6),"url-token":Ye(7),"bad-url-token":Ye(8),"delim-token":Ye(9),"number-token":Ye(10),"percentage-token":Ye(11),"dimension-token":Ye(12),"whitespace-token":Ye(13),"CDO-token":Ye(14),"CDC-token":Ye(15),"colon-token":Ye(16),"semicolon-token":Ye(17),"comma-token":Ye(18),"[-token":Ye(19),"]-token":Ye(20),"(-token":Ye(21),")-token":Ye(22),"{-token":Ye(23),"}-token":Ye(24)},_M={string:Ye(5),ident:Ye(1),percentage:oa(AM,fM),zero:CA(),number:oa(TM,TS),integer:oa(CM,TS),"custom-ident":bM,"dashed-ident":TA,"custom-property-name":yM,"hex-color":kM,"id-selector":EM,"an-plus-b":lM,urange:hM,"declaration-value":vM,"any-value":SM},xM=["length","angle","time","frequency","resolution","flex","decibel","semitones"];function LM(e){let{angle:t,decibel:a,frequency:n,flex:o,length:i,resolution:r,semitones:s,time:l}=e||{};return{dimension:oa(wn(null),fn),angle:oa(wn(t),fn),decibel:oa(wn(a),fn),frequency:oa(wn(n),fn),flex:oa(wn(o),fn),length:oa(CA(wn(i)),fn),resolution:oa(wn(r),fn),semitones:oa(wn(s),fn),time:oa(wn(l),fn)}}function IM(e){let t=new Set;for(let a of xM)if(Array.isArray(e[a]))for(let n of e[a])t.add(n.toLowerCase());return function(a){return a===null?0:a.type===9&&a.value==="%"||a.type===1&&t.has(a.value.toLowerCase())?1:0}}function jM(e){return{...RM,..._M,...LM(e),"attr-unit":IM(e)}}var Jp={};J(Jp,{angle:()=>OM,decibel:()=>zM,flex:()=>FM,frequency:()=>MM,length:()=>NM,resolution:()=>PM,semitones:()=>UM,time:()=>DM});var NM=["cm","mm","q","in","pt","pc","px","em","rem","ex","rex","cap","rcap","ch","rch","ic","ric","lh","rlh","vw","svw","lvw","dvw","vh","svh","lvh","dvh","vi","svi","lvi","dvi","vb","svb","lvb","dvb","vmin","svmin","lvmin","dvmin","vmax","svmax","lvmax","dvmax","cqw","cqh","cqi","cqb","cqmin","cqmax"],OM=["deg","grad","rad","turn"],DM=["s","ms"],MM=["hz","khz"],PM=["dpi","dpcm","dppx","x"],FM=["fr"],zM=["db"],UM=["st"],RA={};J(RA,{SyntaxError:()=>_A,generate:()=>gu,parse:()=>_g,walk:()=>NA});function _A(e,t,a){return Object.assign(ys("SyntaxError",e),{input:t,offset:a,rawMessage:e,message:e+`
  `+t+`
--`+new Array((a||t.length)+1).join("-")+"^"})}var BM=9,HM=10,GM=12,WM=13,VM=32,CS=new Uint8Array(128).map((e,t)=>/[a-zA-Z0-9\-]/.test(String.fromCharCode(t))?1:0),qM=class{constructor(e){this.str=e,this.pos=0}charCodeAt(e){return e<this.str.length?this.str.charCodeAt(e):0}charCode(){return this.charCodeAt(this.pos)}isNameCharCode(e=this.charCode()){return e<128&&CS[e]===1}nextCharCode(){return this.charCodeAt(this.pos+1)}nextNonWsCode(e){return this.charCodeAt(this.findWsEnd(e))}skipWs(){this.pos=this.findWsEnd(this.pos)}findWsEnd(e){for(;e<this.str.length;e++){let t=this.str.charCodeAt(e);if(t!==WM&&t!==HM&&t!==GM&&t!==VM&&t!==BM)break}return e}substringToPos(e){return this.str.substring(this.pos,this.pos=e)}eat(e){this.charCode()!==e&&this.error("Expect `"+String.fromCharCode(e)+"`"),this.pos++}peek(){return this.pos<this.str.length?this.str.charAt(this.pos++):""}error(e){throw new _A(e,this.str,this.pos)}scanSpaces(){return this.substringToPos(this.findWsEnd(this.pos))}scanWord(){let e=this.pos;for(;e<this.str.length;e++){let t=this.str.charCodeAt(e);if(t>=128||CS[t]===0)break}return this.pos===e&&this.error("Expect a keyword"),this.substringToPos(e)}scanNumber(){let e=this.pos;for(;e<this.str.length;e++){let t=this.str.charCodeAt(e);if(t<48||t>57)break}return this.pos===e&&this.error("Expect a number"),this.substringToPos(e)}scanString(){let e=this.str.indexOf("'",this.pos+1);return e===-1&&(this.pos=this.str.length,this.error("Expect an apostrophe")),this.substringToPos(e+1)}},YM=9,KM=10,XM=12,ZM=13,$M=32,xA=33,Ag=35,RS=38,cu=39,LA=40,IA=41,jA=42,Tg=43,Cg=44,_S=45,Rg=60,Qp=62,uu=63,JM=64,bs=91,Pi=93,du=123,xS=124,eg=125,LS=8734,IS={" ":1,"&&":2,"||":3,"|":4};function jS(e){let t=null,a=null;return e.eat(du),e.skipWs(),t=e.scanNumber(e),e.skipWs(),e.charCode()===Cg?(e.pos++,e.skipWs(),e.charCode()!==eg&&(a=e.scanNumber(e),e.skipWs())):a=t,e.eat(eg),{min:Number(t),max:a?Number(a):0}}function QM(e){let t=null,a=!1;switch(e.charCode()){case jA:e.pos++,t={min:0,max:0};break;case Tg:e.pos++,t={min:1,max:0};break;case uu:e.pos++,t={min:0,max:1};break;case Ag:e.pos++,a=!0,e.charCode()===du?t=jS(e):e.charCode()===uu?(e.pos++,t={min:0,max:0}):t={min:1,max:0};break;case du:t=jS(e);break;default:return null}return{type:"Multiplier",comma:a,min:t.min,max:t.max,term:null}}function qn(e,t){let a=QM(e);return a!==null?(a.term=t,e.charCode()===Ag&&e.charCodeAt(e.pos-1)===Tg||e.charCode()===uu&&e.charCodeAt(e.pos-1)===eg?qn(e,a):a):t}function Dp(e){let t=e.peek();return t===""?null:qn(e,{type:"Token",value:t})}function eP(e){let t;return e.eat(Rg),e.eat(cu),t=e.scanWord(),e.eat(cu),e.eat(Qp),qn(e,{type:"Property",name:t})}function tP(e){let t=null,a=null,n=1;return e.eat(bs),e.charCode()===_S&&(e.peek(),n=-1),n==-1&&e.charCode()===LS?e.peek():(t=n*Number(e.scanNumber(e)),e.isNameCharCode()&&(t+=e.scanWord())),e.skipWs(),e.eat(Cg),e.skipWs(),e.charCode()===LS?e.peek():(n=1,e.charCode()===_S&&(e.peek(),n=-1),a=n*Number(e.scanNumber(e)),e.isNameCharCode()&&(a+=e.scanWord())),e.eat(Pi),{type:"Range",min:t,max:a}}function aP(e){let t,a=null;if(e.eat(Rg),t=e.scanWord(),t==="boolean-expr"){e.eat(bs);let n=bu(e,Pi);return e.eat(Pi),e.eat(Qp),qn(e,{type:"Boolean",term:n.terms.length===1?n.terms[0]:n})}return e.charCode()===LA&&e.nextCharCode()===IA&&(e.pos+=2,t+="()"),e.charCodeAt(e.findWsEnd(e.pos))===bs&&(e.skipWs(),a=tP(e)),e.eat(Qp),qn(e,{type:"Type",name:t,opts:a})}function nP(e){let t=e.scanWord();return e.charCode()===LA?(e.pos++,{type:"Function",name:t}):qn(e,{type:"Keyword",name:t})}function oP(e,t){function a(o,i){return{type:"Group",terms:o,combinator:i,disallowEmpty:!1,explicit:!1}}let n;for(t=Object.keys(t).sort((o,i)=>IS[o]-IS[i]);t.length>0;){n=t.shift();let o=0,i=0;for(;o<e.length;o++){let r=e[o];r.type==="Combinator"&&(r.value===n?(i===-1&&(i=o-1),e.splice(o,1),o--):(i!==-1&&o-i>1&&(e.splice(i,o-i,a(e.slice(i,o),n)),o=i+1),i=-1))}i!==-1&&t.length&&e.splice(i,o-i,a(e.slice(i,o),n))}return n}function bu(e,t=-1){let a=Object.create(null),n=[],o=null,i=e.pos,r=!1;for(;e.charCode()!==t;){let s=r?bu(e,IA):rP(e);if(!s)break;if(s.type!=="Spaces"){if(r){if(s.terms.length===0){r=!1;continue}if(s.combinator===" "){for(;s.terms.length>1;)a[" "]=!0,n.push({type:"Combinator",value:" "},s.terms.shift());s=s.terms[0]}}s.type==="Combinator"?((o===null||o.type==="Combinator")&&(e.pos=i,e.error("Unexpected combinator")),a[s.value]=!0):o!==null&&o.type!=="Combinator"&&(a[" "]=!0,n.push({type:"Combinator",value:" "})),n.push(s),o=s,i=e.pos,r=s.type==="Function"}}return o!==null&&o.type==="Combinator"&&(e.pos-=i,e.error("Unexpected combinator")),{type:"Group",terms:n,combinator:oP(n,a)||" ",disallowEmpty:!1,explicit:!1}}function iP(e){let t;return e.eat(bs),t=bu(e,Pi),e.eat(Pi),t.explicit=!0,e.charCode()===xA&&(e.pos++,t.disallowEmpty=!0),t}function rP(e){let t=e.charCode();switch(t){case Pi:break;case bs:return qn(e,iP(e));case Rg:return e.nextCharCode()===cu?eP(e):aP(e);case xS:return{type:"Combinator",value:e.substringToPos(e.pos+(e.nextCharCode()===xS?2:1))};case RS:return e.pos++,e.eat(RS),{type:"Combinator",value:"&&"};case Cg:return e.pos++,{type:"Comma"};case cu:return qn(e,{type:"String",value:e.scanString()});case $M:case YM:case KM:case ZM:case XM:return{type:"Spaces",value:e.scanSpaces()};case JM:return t=e.nextCharCode(),e.isNameCharCode(t)?(e.pos++,{type:"AtKeyword",name:e.scanWord()}):Dp(e);case jA:case Tg:case uu:case Ag:case xA:break;case du:if(t=e.nextCharCode(),t<48||t>57)return Dp(e);break;default:return e.isNameCharCode(t)?nP(e):Dp(e)}}function _g(e){let t=new qM(e),a=bu(t);return t.pos!==e.length&&t.error("Unexpected input"),a.terms.length===1&&a.terms[0].type==="Group"?a.terms[0]:a}var ds=function(){};function NS(e){return typeof e=="function"?e:ds}function NA(e,t,a){function n(r){switch(o.call(a,r),r.type){case"Group":r.terms.forEach(n);break;case"Multiplier":case"Boolean":n(r.term);break;case"Type":case"Property":case"Keyword":case"AtKeyword":case"Function":case"String":case"Token":case"Comma":break;default:throw new Error("Unknown type: "+r.type)}i.call(a,r)}let o=ds,i=ds;if(typeof t=="function"?o=t:t&&(o=NS(t.enter),i=NS(t.leave)),o===ds&&i===ds)throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");n(e,a)}var sP={decorator(e){let t=[],a=null;return{...e,node(n){let o=a;a=n,e.node.call(this,n),a=o},emit(n,o,i){t.push({type:o,value:n,node:i?null:a})},result(){return t}}}};function lP(e,t){let a=[];return pu(t)(e,(n,o,i)=>a.push({type:n,value:e.slice(o,i),node:null})),a}function cP(e,t){return typeof e=="string"?lP(e,t):t.generate(e,sP)}var Oe={type:"Match"},Ge={type:"Mismatch"},xg={type:"DisallowEmpty"},uP=40,dP=41;function Ct(e,t,a){return t===Oe&&a===Ge||e===Oe&&t===Oe&&a===Oe?e:(e.type==="If"&&e.else===Ge&&t===Oe&&(t=e.then,e=e.match),{type:"If",match:e,then:t,else:a})}function OA(e){return e.length>2&&e.charCodeAt(e.length-2)===uP&&e.charCodeAt(e.length-1)===dP}function OS(e){return e.type==="Keyword"||e.type==="AtKeyword"||e.type==="Function"||e.type==="Type"&&OA(e.name)}function Bn(e,t=" ",a=!1){return{type:"Group",terms:e,combinator:t,disallowEmpty:!1,explicit:a}}function ps(e,t,a=new Set){if(!a.has(e))switch(a.add(e),e.type){case"If":e.match=ps(e.match,t,a),e.then=ps(e.then,t,a),e.else=ps(e.else,t,a);break;case"Type":return t[e.name]||e}return e}function tg(e,t,a){switch(e){case" ":{let n=Oe;for(let o=t.length-1;o>=0;o--){let i=t[o];n=Ct(i,n,Ge)}return n}case"|":{let n=Ge,o=null;for(let i=t.length-1;i>=0;i--){let r=t[i];if(OS(r)&&(o===null&&i>0&&OS(t[i-1])&&(o=Object.create(null),n=Ct({type:"Enum",map:o},Oe,n)),o!==null)){let s=(OA(r.name)?r.name.slice(0,-1):r.name).toLowerCase();if(!(s in o)){o[s]=r;continue}}o=null,n=Ct(r,Oe,n)}return n}case"&&":{if(t.length>5)return{type:"MatchOnce",terms:t,all:!0};let n=Ge;for(let o=t.length-1;o>=0;o--){let i=t[o],r;t.length>1?r=tg(e,t.filter(function(s){return s!==i}),!1):r=Oe,n=Ct(i,r,n)}return n}case"||":{if(t.length>5)return{type:"MatchOnce",terms:t,all:!1};let n=a?Oe:Ge;for(let o=t.length-1;o>=0;o--){let i=t[o],r;t.length>1?r=tg(e,t.filter(function(s){return s!==i}),!0):r=Oe,n=Ct(i,r,n)}return n}}}function hP(e){let t=Oe,a=Ni(e.term);if(e.max===0)a=Ct(a,xg,Ge),t=Ct(a,null,Ge),t.then=Ct(Oe,Oe,t),e.comma&&(t.then.else=Ct({type:"Comma",syntax:e},t,Ge));else for(let n=e.min||1;n<=e.max;n++)e.comma&&t!==Oe&&(t=Ct({type:"Comma",syntax:e},t,Ge)),t=Ct(a,Ct(Oe,Oe,t),Ge);if(e.min===0)t=Ct(Oe,Oe,t);else for(let n=0;n<e.min-1;n++)e.comma&&t!==Oe&&(t=Ct({type:"Comma",syntax:e},t,Ge)),t=Ct(a,t,Ge);return t}function Ni(e){if(typeof e=="function")return{type:"Generic",fn:e};switch(e.type){case"Group":{let t=tg(e.combinator,e.terms.map(Ni),!1);return e.disallowEmpty&&(t=Ct(t,xg,Ge)),t}case"Multiplier":return hP(e);case"Boolean":{let t=Ni(e.term),a=Ni(Bn([Bn([{type:"Keyword",name:"not"},{type:"Type",name:"!boolean-group"}]),Bn([{type:"Type",name:"!boolean-group"},Bn([{type:"Multiplier",comma:!1,min:0,max:0,term:Bn([{type:"Keyword",name:"and"},{type:"Type",name:"!boolean-group"}])},{type:"Multiplier",comma:!1,min:0,max:0,term:Bn([{type:"Keyword",name:"or"},{type:"Type",name:"!boolean-group"}])}],"|")])],"|")),n=Ni(Bn([{type:"Type",name:"!term"},Bn([{type:"Token",value:"("},{type:"Type",name:"!self"},{type:"Token",value:")"}]),{type:"Type",name:"general-enclosed"}],"|"));return ps(n,{"!term":t,"!self":a}),ps(a,{"!boolean-group":n}),a}case"Type":case"Property":return{type:e.type,name:e.name,syntax:e};case"Keyword":return{type:e.type,name:e.name.toLowerCase(),syntax:e};case"AtKeyword":return{type:e.type,name:"@"+e.name.toLowerCase(),syntax:e};case"Function":return{type:e.type,name:e.name.toLowerCase()+"(",syntax:e};case"String":return e.value.length===3?{type:"Token",value:e.value.charAt(1),syntax:e}:{type:e.type,value:e.value.substr(1,e.value.length-2).replace(/\\'/g,"'"),syntax:e};case"Token":return{type:e.type,value:e.value,syntax:e};case"Comma":return{type:e.type,syntax:e};default:throw new Error("Unknown node type:",e.type)}}function Kc(e,t){return typeof e=="string"&&(e=_g(e)),{type:"MatchGraph",match:Ni(e),syntax:t||null,source:e}}var{hasOwnProperty:DS}=Object.prototype,mP=0,pP=1,ag=2,DA=3,MS="Match",gP="Mismatch",fP="Maximum iteration number exceeded (please fill an issue on https://github.com/csstree/csstree/issues)",PS=15e4,wP=0;function bP(e){let t=null,a=null,n=e;for(;n!==null;)a=n.prev,n.prev=t,t=n,n=a;return t}function Mp(e,t){if(e.length!==t.length)return!1;for(let a=0;a<e.length;a++){let n=t.charCodeAt(a),o=e.charCodeAt(a);if(o>=65&&o<=90&&(o=o|32),o!==n)return!1}return!0}function yP(e){return e.type!==9?!1:e.value!=="?"}function FS(e){return e===null?!0:e.type===18||e.type===2||e.type===21||e.type===19||e.type===23||yP(e)}function zS(e){return e===null?!0:e.type===22||e.type===20||e.type===24||e.type===9&&e.value==="/"}function kP(e,t,a){function n(){do b++,f=b<e.length?e[b]:null;while(f!==null&&(f.type===13||f.type===25))}function o(k){let S=b+k;return S<e.length?e[S]:null}function i(k,S){return{nextState:k,matchStack:E,syntaxStack:d,thenStack:h,tokenIndex:b,prev:S}}function r(k){h={nextState:k,matchStack:E,syntaxStack:d,prev:h}}function s(k){m=i(k,m)}function l(){E={type:pP,syntax:t.syntax,token:f,prev:E},n(),p=null,b>y&&(y=b)}function c(){d={syntax:t.syntax,opts:t.syntax.opts||d!==null&&d.opts||null,prev:d},E={type:ag,syntax:t.syntax,token:E.token,prev:E}}function u(){E.type===ag?E=E.prev:E={type:DA,syntax:d.syntax,token:E.token,prev:E},d=d.prev}let d=null,h=null,m=null,p=null,g=0,w=null,f=null,b=-1,y=0,E={type:mP,syntax:null,token:null,prev:null};for(n();w===null&&++g<PS;)switch(t.type){case"Match":if(h===null){if(f!==null&&(b!==e.length-1||f.value!=="\\0"&&f.value!=="\\9")){t=Ge;break}w=MS;break}if(t=h.nextState,t===xg)if(h.matchStack===E){t=Ge;break}else t=Oe;for(;h.syntaxStack!==d;)u();h=h.prev;break;case"Mismatch":if(p!==null&&p!==!1)(m===null||b>m.tokenIndex)&&(m=p,p=!1);else if(m===null){w=gP;break}t=m.nextState,h=m.thenStack,d=m.syntaxStack,E=m.matchStack,b=m.tokenIndex,f=b<e.length?e[b]:null,m=m.prev;break;case"MatchGraph":t=t.match;break;case"If":t.else!==Ge&&s(t.else),t.then!==Oe&&r(t.then),t=t.match;break;case"MatchOnce":t={type:"MatchOnceBuffer",syntax:t,index:0,mask:0};break;case"MatchOnceBuffer":{let T=t.syntax.terms;if(t.index===T.length){if(t.mask===0||t.syntax.all){t=Ge;break}t=Oe;break}if(t.mask===(1<<T.length)-1){t=Oe;break}for(;t.index<T.length;t.index++){let v=1<<t.index;if((t.mask&v)===0){s(t),r({type:"AddMatchOnce",syntax:t.syntax,mask:t.mask|v}),t=T[t.index++];break}}break}case"AddMatchOnce":t={type:"MatchOnceBuffer",syntax:t.syntax,index:0,mask:t.mask};break;case"Enum":if(f!==null){let T=f.value.toLowerCase();if(T.indexOf("\\")!==-1&&(T=T.replace(/\\[09].*$/,"")),DS.call(t.map,T)){t=t.map[T];break}}t=Ge;break;case"Generic":{let T=d!==null?d.opts:null,v=b+Math.floor(t.fn(f,o,T));if(!isNaN(v)&&v>b){for(;b<v;)l();t=Oe}else t=Ge;break}case"Type":case"Property":{let T=t.type==="Type"?"types":"properties",v=DS.call(a,T)?a[T][t.name]:null;if(!v||!v.match)throw new Error("Bad syntax reference: "+(t.type==="Type"?"<"+t.name+">":"<'"+t.name+"'>"));if(p!==!1&&f!==null&&t.type==="Type"&&(t.name==="custom-ident"&&f.type===1||t.name==="length"&&f.value==="0")){p===null&&(p=i(t,m)),t=Ge;break}c(),t=v.matchRef||v.match;break}case"Keyword":{let T=t.name;if(f!==null){let v=f.value;if(v.indexOf("\\")!==-1&&(v=v.replace(/\\[09].*$/,"")),Mp(v,T)){l(),t=Oe;break}}t=Ge;break}case"AtKeyword":case"Function":if(f!==null&&Mp(f.value,t.name)){l(),t=Oe;break}t=Ge;break;case"Token":if(f!==null&&f.value===t.value){l(),t=Oe;break}t=Ge;break;case"Comma":f!==null&&f.type===18?FS(E.token)?t=Ge:(l(),t=zS(f)?Ge:Oe):t=FS(E.token)||zS(f)?Oe:Ge;break;case"String":let k="",S=b;for(;S<e.length&&k.length<t.value.length;S++)k+=e[S].value;if(Mp(k,t.value)){for(;b<S;)l();t=Oe}else t=Ge;break;default:throw new Error("Unknown node type: "+t.type)}switch(wP+=g,w){case null:console.warn("[csstree-match] BREAK after "+PS+" iterations"),w=fP,E=null;break;case MS:for(;d!==null;)u();break;default:E=null}return{tokens:e,reason:w,iterations:g,match:E,longestMatch:y}}function US(e,t,a){let n=kP(e,t,a||{});if(n.match===null)return n;let o=n.match,i=n.match={syntax:t.syntax||null,match:[]},r=[i];for(o=bP(o).prev;o!==null;){switch(o.type){case ag:i.match.push(i={syntax:o.syntax,match:[]}),r.push(i);break;case DA:r.pop(),i=r[r.length-1];break;default:i.match.push({syntax:o.syntax||null,token:o.token.value,node:o.token.node})}o=o.prev}return n}var MA={};J(MA,{getTrace:()=>PA,isKeyword:()=>SP,isProperty:()=>vP,isType:()=>EP});function PA(e){function t(o){return o===null?!1:o.type==="Type"||o.type==="Property"||o.type==="Keyword"}function a(o){if(Array.isArray(o.match)){for(let i=0;i<o.match.length;i++)if(a(o.match[i]))return t(o.syntax)&&n.unshift(o.syntax),!0}else if(o.node===e)return n=t(o.syntax)?[o.syntax]:[],!0;return!1}let n=null;return this.matched!==null&&a(this.matched),n}function EP(e,t){return Lg(this,e,a=>a.type==="Type"&&a.name===t)}function vP(e,t){return Lg(this,e,a=>a.type==="Property"&&a.name===t)}function SP(e){return Lg(this,e,t=>t.type==="Keyword")}function Lg(e,t,a){let n=PA.call(e,t);return n===null?!1:n.some(a)}function FA(e){return"node"in e?e.node:FA(e.match[0])}function zA(e){return"node"in e?e.node:zA(e.match[e.match.length-1])}function BS(e,t,a,n,o){function i(s){if(s.syntax!==null&&s.syntax.type===n&&s.syntax.name===o){let l=FA(s),c=zA(s);e.syntax.walk(t,function(u,d,h){if(u===l){let m=new bn;do{if(m.appendData(d.data),d.data===c)break;d=d.next}while(d!==null);r.push({parent:h,nodes:m})}})}Array.isArray(s.match)&&s.match.forEach(i)}let r=[];return a.matched!==null&&i(a.matched),r}var{hasOwnProperty:gs}=Object.prototype;function Pp(e){return typeof e=="number"&&isFinite(e)&&Math.floor(e)===e&&e>=0}function HS(e){return!!e&&Pp(e.offset)&&Pp(e.line)&&Pp(e.column)}function AP(e,t){return function(a,n){if(!a||a.constructor!==Object)return n(a,"Type of node should be an Object");for(let o in a){let i=!0;if(gs.call(a,o)!==!1){if(o==="type")a.type!==e&&n(a,"Wrong node type `"+a.type+"`, expected `"+e+"`");else if(o==="loc"){if(a.loc===null)continue;if(a.loc&&a.loc.constructor===Object)if(typeof a.loc.source!="string")o+=".source";else if(!HS(a.loc.start))o+=".start";else if(!HS(a.loc.end))o+=".end";else continue;i=!1}else if(t.hasOwnProperty(o)){i=!1;for(let r=0;!i&&r<t[o].length;r++){let s=t[o][r];switch(s){case String:i=typeof a[o]=="string";break;case Boolean:i=typeof a[o]=="boolean";break;case null:i=a[o]===null;break;default:typeof s=="string"?i=a[o]&&a[o].type===s:Array.isArray(s)&&(i=a[o]instanceof bn)}}}else n(a,"Unknown field `"+o+"` for "+e+" node type");i||n(a,"Bad value for `"+e+"."+o+"`")}}for(let o in t)gs.call(t,o)&&gs.call(a,o)===!1&&n(a,"Field `"+e+"."+o+"` is missed")}}function UA(e,t){let a=[];for(let n=0;n<e.length;n++){let o=e[n];if(o===String||o===Boolean)a.push(o.name.toLowerCase());else if(o===null)a.push("null");else if(typeof o=="string")a.push(o);else if(Array.isArray(o))a.push("List<"+(UA(o,t)||"any")+">");else throw new Error("Wrong value `"+o+"` in `"+t+"` structure definition")}return a.join(" | ")}function TP(e,t){let a=t.structure,n={type:String,loc:!0},o={type:'"'+e+'"'};for(let i in a){if(gs.call(a,i)===!1)continue;let r=n[i]=Array.isArray(a[i])?a[i].slice():[a[i]];o[i]=UA(r,e+"."+i)}return{docs:o,check:AP(e,n)}}function CP(e){let t={};if(e.node){for(let a in e.node)if(gs.call(e.node,a)){let n=e.node[a];if(n.structure)t[a]=TP(a,n);else throw new Error("Missed `structure` field in `"+a+"` node type definition")}}return t}function ng(e,t,a){let n={};for(let o in e)e[o].syntax&&(n[o]=a?e[o].syntax:gu(e[o].syntax,{compact:t}));return n}function RP(e,t,a){let n={};for(let[o,i]of Object.entries(e))n[o]={prelude:i.prelude&&(a?i.prelude.syntax:gu(i.prelude.syntax,{compact:t})),descriptors:i.descriptors&&ng(i.descriptors,t,a)};return n}function _P(e){for(let t=0;t<e.length;t++)if(e[t].value.toLowerCase()==="var(")return!0;return!1}function xP(e){let t=e.terms[0];return e.explicit===!1&&e.terms.length===1&&t.type==="Multiplier"&&t.comma===!0}function LP(e){for(let t=0;t<e.length;t++)if(e[t].value.toLowerCase()==="env(")return!0;return!1}function ia(e,t,a){return{matched:e,iterations:a,error:t,...MA}}function ji(e,t,a,n){let o=cP(a,e.syntax),i;return _P(o)?ia(null,new AS("var")):LP(o)?ia(null,new AS("env")):(n&&(i=US(o,e.cssWideKeywordsSyntax,e)),(!n||!i.match)&&(i=US(o,t.match,e),!i.match)?ia(null,new nM(i.reason,t.syntax,a,i),i.iterations):ia(i.match,null,i.iterations))}var og=class{constructor(e,t,a){if(this.cssWideKeywords=wg,this.syntax=t,this.generic=!1,this.units={...Jp},this.atrules=Object.create(null),this.properties=Object.create(null),this.types=Object.create(null),this.structure=a||CP(e),e){if(e.cssWideKeywords&&(this.cssWideKeywords=e.cssWideKeywords),e.units)for(let n of Object.keys(Jp))Array.isArray(e.units[n])&&(this.units[n]=e.units[n]);if(e.types)for(let[n,o]of Object.entries(e.types))this.addType_(n,o);if(e.generic){this.generic=!0;for(let[n,o]of Object.entries(jM(this.units)))this.addType_(n,o)}if(e.atrules)for(let[n,o]of Object.entries(e.atrules))this.addAtrule_(n,o);if(e.properties)for(let[n,o]of Object.entries(e.properties))this.addProperty_(n,o)}this.cssWideKeywordsSyntax=Kc(this.cssWideKeywords.join(" |  "))}checkStructure(e){function t(o,i){n.push({node:o,message:i})}let a=this.structure,n=[];return this.syntax.walk(e,function(o){a.hasOwnProperty(o.type)?a[o.type].check(o,t):t(o,"Unknown node type `"+o.type+"`")}),n.length?n:!1}createDescriptor(e,t,a,n=null){let o={type:t,name:a},i={type:t,name:a,parent:n,serializable:typeof e=="string"||e&&typeof e.type=="string",syntax:null,match:null,matchRef:null};return typeof e=="function"?i.match=Kc(e,o):(typeof e=="string"?Object.defineProperty(i,"syntax",{get(){return Object.defineProperty(i,"syntax",{value:_g(e)}),i.syntax}}):i.syntax=e,Object.defineProperty(i,"match",{get(){return Object.defineProperty(i,"match",{value:Kc(i.syntax,o)}),i.match}}),t==="Property"&&Object.defineProperty(i,"matchRef",{get(){let r=i.syntax,s=xP(r)?Kc({...r,terms:[r.terms[0].term]},o):null;return Object.defineProperty(i,"matchRef",{value:s}),s}})),i}addAtrule_(e,t){t&&(this.atrules[e]={type:"Atrule",name:e,prelude:t.prelude?this.createDescriptor(t.prelude,"AtrulePrelude",e):null,descriptors:t.descriptors?Object.keys(t.descriptors).reduce((a,n)=>(a[n]=this.createDescriptor(t.descriptors[n],"AtruleDescriptor",n,e),a),Object.create(null)):null})}addProperty_(e,t){t&&(this.properties[e]=this.createDescriptor(t,"Property",e))}addType_(e,t){t&&(this.types[e]=this.createDescriptor(t,"Type",e))}checkAtruleName(e){if(!this.getAtrule(e))return new rs("Unknown at-rule","@"+e)}checkAtrulePrelude(e,t){let a=this.checkAtruleName(e);if(a)return a;let n=this.getAtrule(e);if(!n.prelude&&t)return new SyntaxError("At-rule `@"+e+"` should not contain a prelude");if(n.prelude&&!t&&!ji(this,n.prelude,"",!1).matched)return new SyntaxError("At-rule `@"+e+"` should contain a prelude")}checkAtruleDescriptorName(e,t){let a=this.checkAtruleName(e);if(a)return a;let n=this.getAtrule(e),o=cs(t);if(!n.descriptors)return new SyntaxError("At-rule `@"+e+"` has no known descriptors");if(!n.descriptors[o.name]&&!n.descriptors[o.basename])return new rs("Unknown at-rule descriptor",t)}checkPropertyName(e){if(!this.getProperty(e))return new rs("Unknown property",e)}matchAtrulePrelude(e,t){let a=this.checkAtrulePrelude(e,t);if(a)return ia(null,a);let n=this.getAtrule(e);return n.prelude?ji(this,n.prelude,t||"",!1):ia(null,null)}matchAtruleDescriptor(e,t,a){let n=this.checkAtruleDescriptorName(e,t);if(n)return ia(null,n);let o=this.getAtrule(e),i=cs(t);return ji(this,o.descriptors[i.name]||o.descriptors[i.basename],a,!1)}matchDeclaration(e){return e.type!=="Declaration"?ia(null,new Error("Not a Declaration node")):this.matchProperty(e.property,e.value)}matchProperty(e,t){if(!this.getProperty(e)&&Xp(e).custom)return ia(null,new Error("Lexer matching doesn't applicable for custom properties"));let a=this.checkPropertyName(e);return a?ia(null,a):ji(this,this.getProperty(e),t,!0)}matchType(e,t){let a=this.getType(e);return a?ji(this,a,t,!1):ia(null,new rs("Unknown type",e))}match(e,t){return typeof e!="string"&&(!e||!e.type)?ia(null,new rs("Bad syntax")):((typeof e=="string"||!e.match)&&(e=this.createDescriptor(e,"Type","anonymous")),ji(this,e,t,!1))}findValueFragments(e,t,a,n){return BS(this,t,this.matchProperty(e,t),a,n)}findDeclarationValueFragments(e,t,a){return BS(this,e.value,this.matchDeclaration(e),t,a)}findAllFragments(e,t,a){let n=[];return this.syntax.walk(e,{visit:"Declaration",enter:o=>{n.push.apply(n,this.findDeclarationValueFragments(o,t,a))}}),n}getAtrule(e,t=!0){let a=cs(e);return(a.vendor&&t?this.atrules[a.name]||this.atrules[a.basename]:this.atrules[a.name])||null}getAtrulePrelude(e,t=!0){let a=this.getAtrule(e,t);return a&&a.prelude||null}getAtruleDescriptor(e,t){let a=this.getAtrule(e),n=cs(t);return(a&&a.descriptors?a.descriptors[n.name]||a.descriptors[n.basename]:null)||null}getProperty(e,t=!0){let a=Xp(e);return(a.vendor&&t?this.properties[a.name]||this.properties[a.basename]:this.properties[a.name])||null}getType(e){return hasOwnProperty.call(this.types,e)?this.types[e]:null}validate(){function e(s,l){return l?`<${s}>`:`<'${s}'>`}function t(s,l,c,u){if(c.has(l))return c.get(l);c.set(l,!1),u.syntax!==null&&NA(u.syntax,function(d){if(d.type!=="Type"&&d.type!=="Property")return;let h=d.type==="Type"?s.types:s.properties,m=d.type==="Type"?n:o;hasOwnProperty.call(h,d.name)?t(s,d.name,m,h[d.name])&&(a.push(`${e(l,c===n)} used broken syntax definition ${e(d.name,d.type==="Type")}`),c.set(l,!0)):(a.push(`${e(l,c===n)} used missed syntax definition ${e(d.name,d.type==="Type")}`),c.set(l,!0))},this)}let a=[],n=new Map,o=new Map;for(let s in this.types)t(this,s,n,this.types[s]);for(let s in this.properties)t(this,s,o,this.properties[s]);let i=[...n.keys()].filter(s=>n.get(s)),r=[...o.keys()].filter(s=>o.get(s));return i.length||r.length?{errors:a,types:i,properties:r}:null}dump(e,t){return{generic:this.generic,cssWideKeywords:this.cssWideKeywords,units:this.units,types:ng(this.types,!t,e),properties:ng(this.properties,!t,e),atrules:RP(this.atrules,!t,e)}}toString(){return JSON.stringify(this.dump())}};function Fp(e,t){return typeof t=="string"&&/^\s*\|/.test(t)?typeof e=="string"?e+t:t.replace(/^\s*\|\s*/,""):t||null}function IP(e,t){let a=Object.create(null);for(let n of Object.keys(e))t.includes(n)&&(a[n]=e[n]);return a}function zp(e,t,a){let n={...e};for(let[o,i]of Object.entries(t))n[o]={...n[o],...a?IP(i,a):i};return n}function ig(e,t){let a={...e};for(let[n,o]of Object.entries(t))switch(n){case"generic":a[n]=!!o;break;case"cssWideKeywords":a[n]=e[n]?[...e[n],...o]:o||[];break;case"units":a[n]={...e[n]};for(let[i,r]of Object.entries(o))a[n][i]=Array.isArray(r)?r:[];break;case"atrules":a[n]={...e[n]};for(let[i,r]of Object.entries(o)){let s=a[n][i]||{},l=a[n][i]={prelude:s.prelude||null,descriptors:{...s.descriptors}};if(r){l.prelude=r.prelude?Fp(l.prelude,r.prelude):l.prelude||null;for(let[c,u]of Object.entries(r.descriptors||{}))l.descriptors[c]=u?Fp(l.descriptors[c],u):null;Object.keys(l.descriptors).length||(l.descriptors=null)}}break;case"types":case"properties":a[n]={...e[n]};for(let[i,r]of Object.entries(o))a[n][i]=Fp(a[n][i],r);break;case"parseContext":a[n]={...e[n],...o};break;case"scope":case"features":a[n]=zp(e[n],o);break;case"atrule":case"pseudo":a[n]=zp(e[n],o,["parse"]);break;case"node":a[n]=zp(e[n],o,["name","structure","parse","generate","walkContext"]);break;case"tokenize":typeof o=="function"&&(a[n]=o);break}return a}function BA(e){let t=FD(e),a=$D(e),n=YD(e),{fromPlainObject:o,toPlainObject:i}=KD(a),r={lexer:null,createLexer:s=>new og(s,r,r.lexer.structure),tokenize:pu(e),parse:t,generate:n,walk:a,find:a.find,findLast:a.findLast,findAll:a.findAll,fromPlainObject:o,toPlainObject:i,fork(s){let l=ig({},e);return BA(typeof s=="function"?s(l):ig(l,s))}};return r.lexer=new og({generic:e.generic,cssWideKeywords:e.cssWideKeywords,units:e.units,types:e.types,atrules:e.atrules,properties:e.properties,node:e.node},r),r}var HA=e=>BA(ig({},e)),jP={generic:!0,cssWideKeywords:["initial","inherit","unset","revert","revert-layer","revert-rule"],units:{angle:["deg","grad","rad","turn"],decibel:["db"],flex:["fr"],frequency:["hz","khz"],length:["cm","mm","q","in","pt","pc","px","em","rem","ex","rex","cap","rcap","ch","rch","ic","ric","lh","rlh","vw","svw","lvw","dvw","vh","svh","lvh","dvh","vi","svi","lvi","dvi","vb","svb","lvb","dvb","vmin","svmin","lvmin","dvmin","vmax","svmax","lvmax","dvmax","cqw","cqh","cqi","cqb","cqmin","cqmax"],resolution:["dpi","dpcm","dppx","x"],semitones:["st"],time:["s","ms"]},types:{"abs()":"abs( <calc-sum> )","absolute-size":"xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large","acos()":"acos( <calc-sum> )","alpha-value":"<number>|<percentage>","an+b":"odd|even|<integer>|<n-dimension>|'+'? \u2020 n|-n|<ndashdigit-dimension>|'+'? \u2020 <ndashdigit-ident>|<dashndashdigit-ident>|<n-dimension> <signed-integer>|'+'? \u2020 n <signed-integer>|-n <signed-integer>|<ndash-dimension> <signless-integer>|'+'? \u2020 n- <signless-integer>|-n- <signless-integer>|<n-dimension> ['+'|'-'] <signless-integer>|'+'? \u2020 n ['+'|'-'] <signless-integer>|-n ['+'|'-'] <signless-integer>","anchor()":"anchor( <anchor-name>?&&<anchor-side> , <length-percentage>? )","anchor-name":"<dashed-ident>","anchor-side":"inside|outside|top|left|right|bottom|start|end|self-start|self-end|<percentage>|center","anchor-size":"width|height|block|inline|self-block|self-inline","anchor-size()":"anchor-size( [<anchor-name>||<anchor-size>]? , <length-percentage>? )","angle-percentage":"<angle>|<percentage>","angular-color-hint":"<angle-percentage>|<zero>","angular-color-stop":"<color> <color-stop-angle>?","angular-color-stop-list":"<angular-color-stop> , [<angular-color-hint>? , <angular-color-stop>]#?","animateable-feature":"scroll-position|contents|<custom-ident>","animation-action":"none|play|play-once|play-forwards|play-backwards|pause|reset|replay","asin()":"asin( <calc-sum> )","atan()":"atan( <calc-sum> )","atan2()":"atan2( <calc-sum> , <calc-sum> )",attachment:"scroll|fixed|local","attr()":"attr( <attr-name> <attr-type>? , <declaration-value>? )","attr-matcher":"['~'|'|'|'^'|'$'|'*']? '='","attr-modifier":"i|s","attr-type":"type( <syntax> )|raw-string|number|<attr-unit>","attribute-selector":"'[' <wq-name> ']'|'[' <wq-name> <attr-matcher> [<string-token>|<ident-token>] <attr-modifier>? ']'","auto-repeat":"repeat( [auto-fill|auto-fit] , [<line-names>? <fixed-size>]+ <line-names>? )","auto-track-list":"[<line-names>? [<fixed-size>|<fixed-repeat>]]* <line-names>? <auto-repeat> [<line-names>? [<fixed-size>|<fixed-repeat>]]* <line-names>?",axis:"block|inline|x|y","baseline-position":"[first|last]? baseline","basic-shape":"<inset()>|<xywh()>|<rect()>|<circle()>|<ellipse()>|<polygon()>|<path()>|shape( )","basic-shape-rect":"<inset()>|<rect()>|<xywh()>","bg-clip":"<visual-box>|border-area|text","bg-image":"<image>|none","bg-layer":"<bg-image>||<bg-position> [/ <bg-size>]?||<repeat-style>||<attachment>||<visual-box>||<visual-box>","bg-position":"[[left|center|right|top|bottom|<length-percentage>]|[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]|[center|[left|right] <length-percentage>?]&&[center|[top|bottom] <length-percentage>?]]","bg-size":"[<length-percentage [0,\u221E]>|auto]{1,2}|cover|contain","blend-mode":"normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity","blur()":"blur( <length>? )","brightness()":"brightness( [<number>|<percentage>]? )","calc()":"calc( <calc-sum> )","calc-constant":"e|pi|infinity|-infinity|NaN","calc-product":"<calc-value> ['*' <calc-value>|'/' <number>]*","calc-size()":"calc-size( <calc-size-basis> , <calc-sum> )","calc-size-basis":"<intrinsic-size-keyword>|<calc-size()>|any|<calc-sum>","calc-sum":"<calc-product> [['+'|'-'] <calc-product>]*","calc-value":"<number>|<dimension>|<percentage>|<calc-constant>|( <calc-sum> )","cf-final-image":"<image>|<color>","cf-mixing-image":"<percentage>?&&<image>","circle()":"circle( <radial-size>? [at <position>]? )","clamp()":"clamp( <calc-sum>#{3} )","class-selector":"'.' <ident-token>","clip-source":"<url>",color:"<color-base>|currentColor|<system-color>|<device-cmyk()>|<light-dark()>|<-non-standard-color>","color()":"color( <colorspace-params> [/ [<alpha-value>|none]]? )","color-base":"<hex-color>|<color-function>|<named-color>|<color-mix()>|transparent","color-function":"<rgb()>|<rgba()>|<hsl()>|<hsla()>|<hwb()>|<lab()>|<lch()>|<oklab()>|<oklch()>|<alpha()>|<color()>","color-interpolation-method":"in [<rectangular-color-space>|<polar-color-space> <hue-interpolation-method>?|<custom-color-space>]","color-mix()":"color-mix( <color-interpolation-method> , [<color>&&<percentage [0,100]>?]#{2} )","color-stop":"<color-stop-length>|<color-stop-angle>","color-stop-angle":"[<angle-percentage>|<zero>]{1,2}","color-stop-length":"<length-percentage>{1,2}","color-stop-list":"<linear-color-stop> , [<linear-color-hint>? , <linear-color-stop>]#?","colorspace-params":"[<predefined-rgb-params>|<xyz-params>]",combinator:"'>'|'+'|'~'|['|' '|']","common-lig-values":"[common-ligatures|no-common-ligatures]","compat-auto":"searchfield|textarea|checkbox|radio|menulist|listbox|meter|progress-bar|button","compat-special":"textfield|menulist-button","complex-selector":"<complex-selector-unit> [<combinator>? <complex-selector-unit>]*","complex-selector-list":"<complex-selector>#","composite-style":"clear|copy|source-over|source-in|source-out|source-atop|destination-over|destination-in|destination-out|destination-atop|xor","compositing-operator":"add|subtract|intersect|exclude","compound-selector":"[<type-selector>? <subclass-selector>*]!","compound-selector-list":"<compound-selector>#","conic-gradient()":"conic-gradient( [<conic-gradient-syntax>] )","conic-gradient-syntax":"[[[from [<angle>|<zero>]]? [at <position>]?]||<color-interpolation-method>]? , <angular-color-stop-list>","container-condition":"not <query-in-parens>|<query-in-parens> [[and <query-in-parens>]*|[or <query-in-parens>]*]","container-name":"<custom-ident>","container-query":"not <query-in-parens>|<query-in-parens> [[and <query-in-parens>]*|[or <query-in-parens>]*]","content-distribution":"space-between|space-around|space-evenly|stretch","content-list":"[<string>|contents|<image>|<counter>|<quote>|<target>|<leader()>|<attr()>]+","content-position":"center|start|end|flex-start|flex-end","content-replacement":"<image>","contextual-alt-values":"[contextual|no-contextual]","contrast()":"contrast( [<number>|<percentage>]? )","coord-box":"content-box|padding-box|border-box|fill-box|stroke-box|view-box","corner-shape-value":"round|scoop|bevel|notch|square|squircle|<superellipse()>","cos()":"cos( <calc-sum> )",counter:"<counter()>|<counters()>","counter()":"counter( <counter-name> , <counter-style>? )","counter-name":"<custom-ident>","counter-style":"<counter-style-name>|symbols( )","counter-style-name":"<custom-ident>","counters()":"counters( <counter-name> , <string> , <counter-style>? )","cross-fade()":"cross-fade( <cf-mixing-image> , <cf-final-image>? )","cubic-bezier()":"cubic-bezier( [<number [0,1]> , <number>]#{2} )","cubic-bezier-easing-function":"ease|ease-in|ease-out|ease-in-out|cubic-bezier( <number [0,1]> , <number> , <number [0,1]> , <number> )","cursor-predefined":"auto|default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|e-resize|n-resize|ne-resize|nw-resize|s-resize|se-resize|sw-resize|w-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|col-resize|row-resize|all-scroll|zoom-in|zoom-out|grab|grabbing","custom-color-space":"<dashed-ident>","custom-params":"<dashed-ident> [<number>|<percentage>|none]+",dasharray:"[[<length-percentage>|<number>]+]#","dashndashdigit-ident":"<ident-token>","deprecated-system-color":"ActiveBorder|ActiveCaption|AppWorkspace|Background|ButtonHighlight|ButtonShadow|CaptionText|InactiveBorder|InactiveCaption|InactiveCaptionText|InfoBackground|InfoText|Menu|MenuText|Scrollbar|ThreeDDarkShadow|ThreeDFace|ThreeDHighlight|ThreeDLightShadow|ThreeDShadow|Window|WindowFrame|WindowText","discretionary-lig-values":"[discretionary-ligatures|no-discretionary-ligatures]","display-box":"contents|none","display-inside":"flow|flow-root|table|flex|grid|ruby","display-internal":"table-row-group|table-header-group|table-footer-group|table-row|table-cell|table-column-group|table-column|table-caption|ruby-base|ruby-text|ruby-base-container|ruby-text-container","display-legacy":"inline-block|inline-list-item|inline-table|inline-flex|inline-grid","display-listitem":"<display-outside>?&&[flow|flow-root]?&&list-item","display-outside":"block|inline|run-in","drop-shadow()":"drop-shadow( [<color>?&&<length>{2,3}] )","dynamic-range-limit-mix()":"dynamic-range-limit-mix( [<'dynamic-range-limit'>&&<percentage [0,100]>]#{2,} )","easing-function":"<linear-easing-function>|<cubic-bezier-easing-function>|<step-easing-function>","east-asian-variant-values":"[jis78|jis83|jis90|jis04|simplified|traditional]","east-asian-width-values":"[full-width|proportional-width]","element()":"element( <custom-ident> , [first|start|last|first-except]? )|element( <id-selector> )","ellipse()":"ellipse( <radial-size>? [at <position>]? )","env()":"env( <custom-ident> , <declaration-value>? )","exp()":"exp( <calc-sum> )","explicit-track-list":"[<line-names>? <track-size>]+ <line-names>?","family-name":"<string>|<custom-ident>+","feature-tag-value":"<string> [<integer>|on|off]?","feature-type":"@stylistic|@historical-forms|@styleset|@character-variant|@swash|@ornaments|@annotation","feature-value-block":"<feature-type> '{' <feature-value-declaration-list> '}'","feature-value-block-list":"<feature-value-block>+","feature-value-declaration":"<custom-ident> : <integer>+ ;","feature-value-declaration-list":"<feature-value-declaration>","feature-value-name":"<custom-ident>","filter-function":"<blur()>|<brightness()>|<contrast()>|<drop-shadow()>|<grayscale()>|<hue-rotate()>|<invert()>|<opacity()>|<saturate()>|<sepia()>","filter-value-list":"[<filter-function>|<url>]+","final-bg-layer":"<bg-image>||<bg-position> [/ <bg-size>]?||<repeat-style>||<attachment>||<visual-box>||<visual-box>||<'background-color'>","fit-content()":"fit-content( <length-percentage [0,\u221E]> )","fixed-breadth":"<length-percentage>","fixed-repeat":"repeat( [<integer [1,\u221E]>] , [<line-names>? <fixed-size>]+ <line-names>? )","fixed-size":"<fixed-breadth>|minmax( <fixed-breadth> , <track-breadth> )|minmax( <inflexible-breadth> , <fixed-breadth> )","font-stretch-absolute":"normal|ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded|<percentage>","font-variant-css2":"normal|small-caps","font-weight-absolute":"normal|bold|<number [1,1000]>","font-width-css3":"normal|ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded","form-control-identifier":"select","frequency-percentage":"<frequency>|<percentage>","generic-complete":"serif|sans-serif|system-ui|cursive|fantasy|math|monospace","general-enclosed":"[<function-token> <any-value>? )]|[( <any-value>? )]","generic-family":"<generic-script-specific>|<generic-complete>|<generic-incomplete>|<-non-standard-generic-family>","generic-incomplete":"ui-serif|ui-sans-serif|ui-monospace|ui-rounded","geometry-box":"<shape-box>|fill-box|stroke-box|view-box",gradient:"<linear-gradient()>|<repeating-linear-gradient()>|<radial-gradient()>|<repeating-radial-gradient()>|<conic-gradient()>|<repeating-conic-gradient()>|<-legacy-gradient>","grayscale()":"grayscale( [<number>|<percentage>]? )","grid-line":"auto|<custom-ident>|[<integer>&&<custom-ident>?]|[span&&[<integer>||<custom-ident>]]","historical-lig-values":"[historical-ligatures|no-historical-ligatures]","hsl()":"<legacy-hsl-syntax>|<modern-hsl-syntax>","hsla()":"<legacy-hsla-syntax>|<modern-hsla-syntax>",hue:"<number>|<angle>","hue-interpolation-method":"[shorter|longer|increasing|decreasing] hue","hue-rotate()":"hue-rotate( [<angle>|<zero>]? )","hwb()":"<legacy-hwb-syntax>|<modern-hwb-syntax>","hypot()":"hypot( <calc-sum># )",image:"<url>|<image()>|<image-set()>|<element()>|<paint()>|<cross-fade()>|<gradient>","image()":"image( <image-tags>? [<image-src>? , <color>?]! )","image-set()":"image-set( <image-set-option># )","image-set-option":"[<image>|<string>] [<resolution>||type( <string> )]","image-src":"<url>|<string>","image-tags":"ltr|rtl","inflexible-breadth":"<length-percentage>|min-content|max-content|auto","inset()":"inset( <length-percentage>{1,4} [round <'border-radius'>]? )","invert()":"invert( [<number>|<percentage>]? )","keyframe-block":"<keyframe-selector># { <declaration-list> }","keyframe-selector":"from|to|<percentage [0,100]>|<timeline-range-name> <percentage>","keyframes-name":"<custom-ident>|<string>","lab()":"<legacy-lab-syntax>|<modern-lab-syntax>","layer()":"layer( <layer-name> )","layer-name":"<ident> ['.' <ident>]*","lch()":"<legacy-lch-syntax>|<modern-lch-syntax>","leader()":"leader( <leader-type> )","leader-type":"dotted|solid|space|<string>","length-percentage":"<length>|<percentage>","light-dark()":"light-dark( <color> , <color> )","line-name-list":"[<line-names>|<name-repeat>]+","line-names":"'[' <custom-ident>* ']'","line-style":"none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset","line-width":"<length>|thin|medium|thick","linear()":"linear( [<number>&&<percentage>{0,2}]# )","linear-color-hint":"<length-percentage>","linear-color-stop":"<color> <color-stop-length>?","linear-easing-function":"linear|<linear()>","linear-gradient()":"linear-gradient( [<linear-gradient-syntax>] )","linear-gradient-syntax":"[[<angle>|<zero>|to <side-or-corner>]||<color-interpolation-method>]? , <color-stop-list>","log()":"log( <calc-sum> , <calc-sum>? )","mask-layer":"<mask-reference>||<position> [/ <bg-size>]?||<repeat-style>||<geometry-box>||[<geometry-box>|no-clip]||<compositing-operator>||<masking-mode>","mask-position":"[<length-percentage>|left|center|right] [<length-percentage>|top|center|bottom]?","mask-reference":"none|<image>|<mask-source>","mask-source":"<url>","masking-mode":"alpha|luminance|match-source","matrix()":"matrix( <number>#{6} )","matrix3d()":"matrix3d( <number>#{16} )","max()":"max( <calc-sum># )","media-and":"<media-in-parens> [and <media-in-parens>]+","media-condition":"<media-not>|<media-and>|<media-or>|<media-in-parens>","media-condition-without-or":"<media-not>|<media-and>|<media-in-parens>","media-feature":"( [<mf-plain>|<mf-boolean>|<mf-range>] )","media-in-parens":"( <media-condition> )|<media-feature>|<general-enclosed>","media-not":"not <media-in-parens>","media-or":"<media-in-parens> [or <media-in-parens>]+","media-query":"<media-condition>|[not|only]? <media-type> [and <media-condition-without-or>]?","media-query-list":"<media-query>#","media-type":"<ident>","mf-boolean":"<mf-name>","mf-name":"<ident>","mf-plain":"<mf-name> : <mf-value>","mf-range":"<mf-name> ['<'|'>']? '='? <mf-value>|<mf-value> ['<'|'>']? '='? <mf-name>|<mf-value> '<' '='? <mf-name> '<' '='? <mf-value>|<mf-value> '>' '='? <mf-name> '>' '='? <mf-value>","mf-value":"<number>|<dimension>|<ident>|<ratio>","min()":"min( <calc-sum># )","minmax()":"minmax( [<length-percentage>|min-content|max-content|auto] , [<length-percentage>|<flex>|min-content|max-content|auto] )","mod()":"mod( <calc-sum> , <calc-sum> )","n-dimension":"<dimension-token>","name-repeat":"repeat( [<integer [1,\u221E]>|auto-fill] , <line-names>+ )","named-color":"aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen","namespace-prefix":"<ident>","ndash-dimension":"<dimension-token>","ndashdigit-dimension":"<dimension-token>","ndashdigit-ident":"<ident-token>","ns-prefix":"[<ident-token>|'*']? '|'","number-percentage":"<number>|<percentage>","numeric-figure-values":"[lining-nums|oldstyle-nums]","numeric-fraction-values":"[diagonal-fractions|stacked-fractions]","numeric-spacing-values":"[proportional-nums|tabular-nums]","offset-path":"<ray()>|<url>|<basic-shape>","oklab()":"<legacy-oklab-syntax>|<modern-oklab-syntax>","oklch()":"<legacy-oklch-syntax>|<modern-oklch-syntax>","opacity()":"opacity( [<number>|<percentage>]? )","opacity-value":"<number>|<percentage>","outline-line-style":"none|dotted|dashed|solid|double|groove|ridge|inset|outset","outline-radius":"<length>|<percentage>","overflow-position":"unsafe|safe","page-body":"<declaration>? [; <page-body>]?|<page-margin-box> <page-body>","page-margin-box":"<page-margin-box-type> '{' <declaration-list> '}'","page-margin-box-type":"@top-left-corner|@top-left|@top-center|@top-right|@top-right-corner|@bottom-left-corner|@bottom-left|@bottom-center|@bottom-right|@bottom-right-corner|@left-top|@left-middle|@left-bottom|@right-top|@right-middle|@right-bottom","page-selector":"<pseudo-page>+|<ident> <pseudo-page>*","page-selector-list":"[<page-selector>#]?","page-size":"A5|A4|A3|B5|B4|JIS-B5|JIS-B4|letter|legal|ledger",paint:"none|<color>|<url> [none|<color>]?|context-fill|context-stroke","paint()":"paint( <ident> , <declaration-value>? )","paint-box":"<visual-box>|fill-box|stroke-box","palette-identifier":"<dashed-ident>","palette-mix()":"palette-mix( <color-interpolation-method> , [[normal|light|dark|<palette-identifier>|<palette-mix()>]&&<percentage [0,100]>?]#{2} )","path()":"path( <'fill-rule'>? , <string> )","perspective()":"perspective( [<length [0,\u221E]>|none] )","polar-color-space":"hsl|hwb|lch|oklch","polygon()":"polygon( <'fill-rule'>? , [<length-percentage> <length-percentage>]# )",position:"[[left|center|right]||[top|center|bottom]|[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]?|[[left|right] <length-percentage>]&&[[top|bottom] <length-percentage>]]","position-area":"[[left|center|right|span-left|span-right|x-start|x-end|span-x-start|span-x-end|x-self-start|x-self-end|span-x-self-start|span-x-self-end|span-all]||[top|center|bottom|span-top|span-bottom|y-start|y-end|span-y-start|span-y-end|y-self-start|y-self-end|span-y-self-start|span-y-self-end|span-all]|[block-start|center|block-end|span-block-start|span-block-end|span-all]||[inline-start|center|inline-end|span-inline-start|span-inline-end|span-all]|[self-block-start|center|self-block-end|span-self-block-start|span-self-block-end|span-all]||[self-inline-start|center|self-inline-end|span-self-inline-start|span-self-inline-end|span-all]|[start|center|end|span-start|span-end|span-all]{1,2}|[self-start|center|self-end|span-self-start|span-self-end|span-all]{1,2}]","pow()":"pow( <calc-sum> , <calc-sum> )","predefined-rgb":"srgb|srgb-linear|display-p3|display-p3-linear|a98-rgb|prophoto-rgb|rec2020","predefined-rgb-params":"<predefined-rgb> [<number>|<percentage>|none]{3}","pseudo-class-selector":"':' <ident-token>|':' <function-token> <any-value> ')'","pseudo-element-selector":"':' <pseudo-class-selector>|<legacy-pseudo-element-selector>","pseudo-page":": [left|right|first|blank]","query-in-parens":"( <container-condition> )|( <size-feature> )|style( <style-query> )|<general-enclosed>",quote:"open-quote|close-quote|no-open-quote|no-close-quote","radial-extent":"closest-corner|closest-side|farthest-corner|farthest-side","radial-gradient()":"radial-gradient( [<radial-gradient-syntax>] )","radial-gradient-syntax":"[[[<radial-shape>||<radial-size>]? [at <position>]?]||<color-interpolation-method>]? , <color-stop-list>","radial-shape":"circle|ellipse","radial-size":"<radial-extent>|<length [0,\u221E]>|<length-percentage [0,\u221E]>{2}",ratio:"<number [0,\u221E]> [/ <number [0,\u221E]>]?","ray()":"ray( <angle>&&<ray-size>?&&contain?&&[at <position>]? )","ray-size":"closest-side|closest-corner|farthest-side|farthest-corner|sides","rect()":"rect( [<length-percentage>|auto]{4} [round <'border-radius'>]? )","rectangular-color-space":"srgb|srgb-linear|display-p3|display-p3-linear|a98-rgb|prophoto-rgb|rec2020|lab|oklab|xyz|xyz-d50|xyz-d65","relative-selector":"<combinator>? <complex-selector>","relative-selector-list":"<relative-selector>#","relative-size":"larger|smaller","rem()":"rem( <calc-sum> , <calc-sum> )","repeat-style":"repeat-x|repeat-y|[repeat|space|round|no-repeat]{1,2}","repeating-conic-gradient()":"repeating-conic-gradient( [<conic-gradient-syntax>] )","repeating-linear-gradient()":"repeating-linear-gradient( [<linear-gradient-syntax>] )","repeating-radial-gradient()":"repeating-radial-gradient( [<radial-gradient-syntax>] )","reversed-counter-name":"reversed( <counter-name> )","rgb()":"<legacy-rgb-syntax>|<modern-rgb-syntax>","rgba()":"<legacy-rgba-syntax>|<modern-rgba-syntax>","rotate()":"rotate( [<angle>|<zero>] )","rotate3d()":"rotate3d( <number> , <number> , <number> , [<angle>|<zero>] )","rotateX()":"rotateX( [<angle>|<zero>] )","rotateY()":"rotateY( [<angle>|<zero>] )","rotateZ()":"rotateZ( [<angle>|<zero>] )","round()":"round( <rounding-strategy>? , <calc-sum> , <calc-sum> )","rounding-strategy":"nearest|up|down|to-zero","saturate()":"saturate( [<number>|<percentage>]? )","scale()":"scale( [<number>|<percentage>]#{1,2} )","scale3d()":"scale3d( [<number>|<percentage>]#{3} )","scaleX()":"scaleX( [<number>|<percentage>] )","scaleY()":"scaleY( [<number>|<percentage>] )","scaleZ()":"scaleZ( [<number>|<percentage>] )","scope-end":"<forgiving-selector-list>","scope-start":"<forgiving-selector-list>","scroll()":"scroll( [<scroller>||<axis>]? )",scroller:"root|nearest|self","scroll-state-feature":"<media-query-list>","scroll-state-in-parens":"( <scroll-state-query> )|( <scroll-state-feature> )|<general-enclosed>","scroll-state-query":"not <scroll-state-in-parens>|<scroll-state-in-parens> [[and <scroll-state-in-parens>]*|[or <scroll-state-in-parens>]*]|<scroll-state-feature>","selector-list":"<complex-selector-list>","self-position":"center|start|end|self-start|self-end|flex-start|flex-end","sepia()":"sepia( [<number>|<percentage>]? )",shadow:"inset?&&<length>{2,4}&&<color>?","shadow-t":"[<length>{2,3}&&<color>?]",shape:"rect( <top> , <right> , <bottom> , <left> )|rect( <top> <right> <bottom> <left> )","shape-box":"<visual-box>|margin-box","side-or-corner":"[left|right]||[top|bottom]","sign()":"sign( <calc-sum> )","signed-integer":"<number-token>","signless-integer":"<number-token>","sin()":"sin( <calc-sum> )","single-animation":"<'animation-duration'>||<easing-function>||<'animation-delay'>||<single-animation-iteration-count>||<single-animation-direction>||<single-animation-fill-mode>||<single-animation-play-state>||[none|<keyframes-name>]||<single-animation-timeline>","single-animation-composition":"replace|add|accumulate","single-animation-direction":"normal|reverse|alternate|alternate-reverse","single-animation-fill-mode":"none|forwards|backwards|both","single-animation-iteration-count":"infinite|<number>","single-animation-play-state":"running|paused","single-animation-timeline":"auto|none|<dashed-ident>|<scroll()>|<view()>","single-transition":"[none|<single-transition-property>]||<time>||<easing-function>||<time>||<transition-behavior-value>","single-transition-property":"all|<custom-ident>",size:"closest-side|farthest-side|closest-corner|farthest-corner|<length>|<length-percentage>{2}","size-feature":"<mf-plain>|<mf-boolean>|<mf-range>","skew()":"skew( [<angle>|<zero>] , [<angle>|<zero>]? )","skewX()":"skewX( [<angle>|<zero>] )","skewY()":"skewY( [<angle>|<zero>] )","sqrt()":"sqrt( <calc-sum> )","step-position":"jump-start|jump-end|jump-none|jump-both|start|end","step-easing-function":"step-start|step-end|<steps()>","steps()":"steps( <integer> , <step-position>? )","style-feature":"<declaration>","style-in-parens":"( <style-condition> )|( <style-feature> )|<general-enclosed>","style-query":"<style-condition>|<style-feature>","subclass-selector":"<id-selector>|<class-selector>|<attribute-selector>|<pseudo-class-selector>","superellipse()":"superellipse( [<number>|infinity|-infinity] )","supports-condition":"not <supports-in-parens>|<supports-in-parens> [and <supports-in-parens>]*|<supports-in-parens> [or <supports-in-parens>]*","supports-decl":"( <declaration> )","supports-feature":"<supports-selector-fn>|<supports-font-tech-fn>|<supports-font-format-fn>|<supports-at-rule-fn>|<supports-named-feature-fn>|<supports-env-fn>|<supports-decl>","supports-in-parens":"( <supports-condition> )|<supports-feature>|<general-enclosed>","supports-selector-fn":"selector( <complex-selector> )",symbol:"<string>|<image>|<custom-ident>","symbols()":"symbols( <symbols-type>? [<string>|<image>]+ )","symbols-type":"cyclic|numeric|alphabetic|symbolic|fixed","system-color":"AccentColor|AccentColorText|ActiveText|ButtonBorder|ButtonFace|ButtonText|Canvas|CanvasText|Field|FieldText|GrayText|Highlight|HighlightText|LinkText|Mark|MarkText|SelectedItem|SelectedItemText|VisitedText","system-family-name":"caption|icon|menu|message-box|small-caption|status-bar","tan()":"tan( <calc-sum> )",target:"<target-counter()>|<target-counters()>|<target-text()>","target-counter()":"target-counter( [<string>|<url>] , <custom-ident> , <counter-style>? )","target-counters()":"target-counters( [<string>|<url>] , <custom-ident> , <string> , <counter-style>? )","target-text()":"target-text( [<string>|<url>] , [content|before|after|first-letter]? )","text-edge":"[text|cap|ex|ideographic|ideographic-ink] [text|alphabetic|ideographic|ideographic-ink]?","time-percentage":"<time>|<percentage>","timeline-range-name":"cover|contain|entry|exit|entry-crossing|exit-crossing","track-breadth":"<length-percentage>|<flex>|min-content|max-content|auto","track-list":"[<line-names>? [<track-size>|<track-repeat>]]+ <line-names>?","track-repeat":"repeat( [<integer [1,\u221E]>] , [<line-names>? <track-size>]+ <line-names>? )","track-size":"<track-breadth>|minmax( <inflexible-breadth> , <track-breadth> )|fit-content( <length-percentage> )","transform-function":"<matrix()>|<translate()>|<translateX()>|<translateY()>|<scale()>|<scaleX()>|<scaleY()>|<rotate()>|<skew()>|<skewX()>|<skewY()>|<matrix3d()>|<translate3d()>|<translateZ()>|<scale3d()>|<scaleZ()>|<rotate3d()>|<rotateX()>|<rotateY()>|<rotateZ()>|<perspective()>","transform-list":"<transform-function>+","transition-behavior-value":"normal|allow-discrete","translate()":"translate( <length-percentage> , <length-percentage>? )","translate3d()":"translate3d( <length-percentage> , <length-percentage> , <length> )","translateX()":"translateX( <length-percentage> )","translateY()":"translateY( <length-percentage> )","translateZ()":"translateZ( <length> )","try-size":"most-width|most-height|most-block-size|most-inline-size","try-tactic":"flip-block||flip-inline||flip-start","type-or-unit":"string|color|url|integer|number|length|angle|time|frequency|cap|ch|em|ex|ic|lh|rlh|rem|vb|vi|vw|vh|vmin|vmax|mm|Q|cm|in|pt|pc|px|deg|grad|rad|turn|ms|s|Hz|kHz|%","type-selector":"<wq-name>|<ns-prefix>? '*'","var()":"var( <custom-property-name> , <declaration-value>? )","view()":"view( [<axis>||<'view-timeline-inset'>]? )","viewport-length":"auto|<length-percentage>","visual-box":"content-box|padding-box|border-box","wq-name":"<ns-prefix>? <ident-token>","xywh()":"xywh( <length-percentage>{2} <length-percentage [0,\u221E]>{2} [round <'border-radius'>]? )",xyz:"xyz|xyz-d50|xyz-d65","xyz-params":"<xyz-space> [<number>|<percentage>|none]{3}","-legacy-gradient":"<-webkit-gradient()>|<-legacy-linear-gradient>|<-legacy-repeating-linear-gradient>|<-legacy-radial-gradient>|<-legacy-repeating-radial-gradient>","-legacy-linear-gradient":"-moz-linear-gradient( <-legacy-linear-gradient-arguments> )|-webkit-linear-gradient( <-legacy-linear-gradient-arguments> )|-o-linear-gradient( <-legacy-linear-gradient-arguments> )","-legacy-repeating-linear-gradient":"-moz-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )|-webkit-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )|-o-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )","-legacy-linear-gradient-arguments":"[<angle>|<side-or-corner>]? , <color-stop-list>","-legacy-radial-gradient":"-moz-radial-gradient( <-legacy-radial-gradient-arguments> )|-webkit-radial-gradient( <-legacy-radial-gradient-arguments> )|-o-radial-gradient( <-legacy-radial-gradient-arguments> )","-legacy-repeating-radial-gradient":"-moz-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )|-webkit-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )|-o-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )","-legacy-radial-gradient-arguments":"[<position> ,]? [[[<-legacy-radial-gradient-shape>||<-legacy-radial-gradient-size>]|[<length>|<percentage>]{2}] ,]? <color-stop-list>","-legacy-radial-gradient-size":"closest-side|closest-corner|farthest-side|farthest-corner|contain|cover","-legacy-radial-gradient-shape":"circle|ellipse","-non-standard-font":"-apple-system-body|-apple-system-headline|-apple-system-subheadline|-apple-system-caption1|-apple-system-caption2|-apple-system-footnote|-apple-system-short-body|-apple-system-short-headline|-apple-system-short-subheadline|-apple-system-short-caption1|-apple-system-short-footnote|-apple-system-tall-body","-non-standard-color":"-moz-ButtonDefault|-moz-ButtonHoverFace|-moz-ButtonHoverText|-moz-CellHighlight|-moz-CellHighlightText|-moz-Combobox|-moz-ComboboxText|-moz-Dialog|-moz-DialogText|-moz-dragtargetzone|-moz-EvenTreeRow|-moz-Field|-moz-FieldText|-moz-html-CellHighlight|-moz-html-CellHighlightText|-moz-mac-accentdarkestshadow|-moz-mac-accentdarkshadow|-moz-mac-accentface|-moz-mac-accentlightesthighlight|-moz-mac-accentlightshadow|-moz-mac-accentregularhighlight|-moz-mac-accentregularshadow|-moz-mac-chrome-active|-moz-mac-chrome-inactive|-moz-mac-focusring|-moz-mac-menuselect|-moz-mac-menushadow|-moz-mac-menutextselect|-moz-MenuHover|-moz-MenuHoverText|-moz-MenuBarText|-moz-MenuBarHoverText|-moz-nativehyperlinktext|-moz-OddTreeRow|-moz-win-communicationstext|-moz-win-mediatext|-moz-activehyperlinktext|-moz-default-background-color|-moz-default-color|-moz-hyperlinktext|-moz-visitedhyperlinktext|-webkit-activelink|-webkit-focus-ring-color|-webkit-link|-webkit-text","-non-standard-image-rendering":"optimize-contrast|-moz-crisp-edges|-o-crisp-edges|-webkit-optimize-contrast","-non-standard-overflow":"overlay|-moz-scrollbars-none|-moz-scrollbars-horizontal|-moz-scrollbars-vertical|-moz-hidden-unscrollable","-non-standard-size":"intrinsic|min-intrinsic|-webkit-fill-available|-webkit-fit-content|-webkit-min-content|-webkit-max-content|-moz-available|-moz-fit-content|-moz-min-content|-moz-max-content","-webkit-gradient()":"-webkit-gradient( <-webkit-gradient-type> , <-webkit-gradient-point> [, <-webkit-gradient-point>|, <-webkit-gradient-radius> , <-webkit-gradient-point>] [, <-webkit-gradient-radius>]? [, <-webkit-gradient-color-stop>]* )","-webkit-gradient-color-stop":"from( <color> )|color-stop( [<number-zero-one>|<percentage>] , <color> )|to( <color> )","-webkit-gradient-point":"[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]","-webkit-gradient-radius":"<length>|<percentage>","-webkit-gradient-type":"linear|radial","-webkit-mask-box-repeat":"repeat|stretch|round","-ms-filter-function-list":"<-ms-filter-function>+","-ms-filter-function":"<-ms-filter-function-progid>|<-ms-filter-function-legacy>","-ms-filter-function-progid":"'progid:' [<ident-token> '.']* [<ident-token>|<function-token> <any-value>? )]","-ms-filter-function-legacy":"<ident-token>|<function-token> <any-value>? )",age:"child|young|old","attr-name":"<wq-name>","attr-fallback":"<any-value>",autospace:"no-autospace|[ideograph-alpha||ideograph-numeric||punctuation]||[insert|replace]",bottom:"<length>|auto","generic-voice":"[<age>? <gender> <integer>?]",gender:"male|female|neutral","font-features-tech":"features-opentype|features-aat|features-graphite","font-format":"<string>|collection|embedded-opentype|opentype|svg|truetype|woff|woff2","font-tech":"<font-features-tech>|<color-font-tech>|variations|palettes|incremental","color-font-tech":"color-COLRv0|color-COLRv1|color-SVG|color-sbix|color-CBDT","generic-script-specific":"generic( kai )|generic( fangsong )|generic( nastaliq )","-non-standard-generic-family":"-apple-system|BlinkMacSystemFont","intrinsic-size-keyword":"min-content|max-content|fit-content",left:"<length>|auto","device-cmyk()":"<legacy-device-cmyk-syntax>|<modern-device-cmyk-syntax>","legacy-device-cmyk-syntax":"device-cmyk( <number>#{4} )","modern-device-cmyk-syntax":"device-cmyk( <cmyk-component>{4} [/ [<alpha-value>|none]]? )","param()":"param( <dashed-ident> , <declaration-value>? )","cmyk-component":"<number>|<percentage>|none","color-space":"<rectangular-color-space>|<polar-color-space>|<custom-color-space>",right:"<length>|auto","forgiving-selector-list":"<complex-real-selector-list>","forgiving-relative-selector-list":"<relative-real-selector-list>","complex-real-selector-list":"<complex-real-selector>#","simple-selector-list":"<simple-selector>#","relative-real-selector-list":"<relative-real-selector>#","complex-selector-unit":"[<compound-selector>? <pseudo-compound-selector>*]!","complex-real-selector":"<compound-selector> [<combinator>? <compound-selector>]*","relative-real-selector":"<combinator>? <complex-real-selector>","pseudo-compound-selector":"<pseudo-element-selector> <pseudo-class-selector>*","simple-selector":"<type-selector>|<subclass-selector>","legacy-pseudo-element-selector":"':' [before|after|first-line|first-letter]","svg-length":"<percentage>|<length>|<number>","svg-writing-mode":"lr-tb|rl-tb|tb-rl|lr|rl|tb",top:"<length>|auto",x:"<number>",y:"<number>",declaration:"<ident-token> : <declaration-value>? ['!' important]?","declaration-list":"[<declaration>? ';']* <declaration>?",url:"url( <string> <url-modifier>* )|<url-token>","url-modifier":"<ident>|<function-token> <any-value> )","number-zero-one":"<number [0,1]>","number-one-or-greater":"<number [1,\u221E]>","rgb-component":"r|g|b|alpha","legacy-rgb-syntax":"rgb( <percentage>#{3} , <alpha-value>? )|rgb( <number>#{3} , <alpha-value>? )|rgb( [<number>|<percentage>|none]{3} [/ [<alpha-value>|none]]? )","modern-rgb-syntax":"rgb( from <color> [<number>|<percentage>|<rgb-component>]{3} [/ [<alpha-value>|<rgb-component>]]? )","legacy-rgba-syntax":"rgba( <percentage>#{3} , <alpha-value>? )|rgba( <number>#{3} , <alpha-value>? )|rgba( [<number>|<percentage>|none]{3} [/ [<alpha-value>|none]]? )","modern-rgba-syntax":"rgba( from <color> [<number>|<percentage>|<rgb-component>]{3} [/ [<alpha-value>|<rgb-component>]]? )","hsl-component":"h|s|l|alpha","legacy-hsl-syntax":"hsl( <hue> , <percentage> , <percentage> , <alpha-value>? )|hsl( [<hue>|none] [<percentage>|<number>|none] [<percentage>|<number>|none] [/ [<alpha-value>|none]]? )","modern-hsl-syntax":"hsl( from <color> [<hue>|<percentage>|<number>|<hsl-component>|none] [<percentage>|<number>|<hsl-component>|none] [<percentage>|<number>|<hsl-component>|none] [/ [<alpha-value>|<hsl-component>|none]]? )","legacy-hsla-syntax":"hsla( <hue> , <percentage> , <percentage> , <alpha-value>? )|hsla( [<hue>|none] [<percentage>|<number>|none] [<percentage>|<number>|none] [/ [<alpha-value>|none]]? )","modern-hsla-syntax":"hsla( from <color> [<hue>|<percentage>|<number>|<hsl-component>|none] [<percentage>|<number>|<hsl-component>|none] [<percentage>|<number>|<hsl-component>|none] [/ [<alpha-value>|<hsl-component>|none]]? )","hwb-component":"h|w|b","legacy-hwb-syntax":"hwb( [<hue>|none] [<percentage>|<number>|none] [<percentage>|<number>|none] [/ [<alpha-value>|none]]? )","modern-hwb-syntax":"hwb( from <color> [<hue>|<percentage>|<number>|<hwb-component>|none] [<percentage>|<number>|<hwb-component>|none] [<percentage>|<number>|<hwb-component>|none] [/ [<alpha-value>|<hwb-component>|none]]? )","lab-component":"l|a|b|alpha","legacy-lab-syntax":"lab( [<percentage>|<number>|none] [<percentage>|<number>|none] [<percentage>|<number>|none] [/ [<alpha-value>|none]]? )","modern-lab-syntax":"lab( from <color> [<number>|<percentage>|<lab-component>]{3} [/ [<alpha-value>|<lab-component>]]? )","legacy-oklab-syntax":"oklab( [<percentage>|<number>|none] [<percentage>|<number>|none] [<percentage>|<number>|none] [/ [<alpha-value>|none]]? )","modern-oklab-syntax":"oklab( from <color> [<number>|<percentage>|<lab-component>]{3} [/ [<alpha-value>|<lab-component>]]? )","lch-component":"l|c|h|alpha","legacy-lch-syntax":"lch( [<percentage>|<number>|none] [<percentage>|<number>|none] [<hue>|none] [/ [<alpha-value>|none]]? )","modern-lch-syntax":"lch( from <color> [<number>|<percentage>|<lch-component>]{3} [/ [<alpha-value>|<lch-component>]]? )","legacy-oklch-syntax":"oklch( [<percentage>|<number>|none] [<percentage>|<number>|none] [<hue>|none] [/ [<alpha-value>|none]]? )","modern-oklch-syntax":"oklch( from <color> [<number>|<percentage>|<lch-component>]{3} [/ [<alpha-value>|<lch-component>]]? )","alpha()":"alpha( [from <color>] [/ [<alpha-value>|none]]? )","xyz-space":"xyz|xyz-d50|xyz-d65","style-condition":"not <style-in-parens>|<style-in-parens> [[and <style-in-parens>]*|[or <style-in-parens>]*]","supports-font-tech-fn":"font-tech( <font-tech> )","supports-font-format-fn":"font-format( <font-format> )","supports-at-rule-fn":"at-rule( <at-keyword-token> )","supports-named-feature-fn":"named-feature( <ident> )","supports-env-fn":"env( <ident> )","-non-standard-display":"-ms-inline-flexbox|-ms-grid|-ms-inline-grid|-webkit-flex|-webkit-inline-flex|-webkit-box|-webkit-inline-box|-moz-inline-stack|-moz-box|-moz-inline-box","inset-area":"[[left|center|right|span-left|span-right|x-start|x-end|span-x-start|span-x-end|x-self-start|x-self-end|span-x-self-start|span-x-self-end|span-all]||[top|center|bottom|span-top|span-bottom|y-start|y-end|span-y-start|span-y-end|y-self-start|y-self-end|span-y-self-start|span-y-self-end|span-all]|[block-start|center|block-end|span-block-start|span-block-end|span-all]||[inline-start|center|inline-end|span-inline-start|span-inline-end|span-all]|[self-block-start|self-block-end|span-self-block-start|span-self-block-end|span-all]||[self-inline-start|self-inline-end|span-self-inline-start|span-self-inline-end|span-all]|[start|center|end|span-start|span-end|span-all]{1,2}|[self-start|center|self-end|span-self-start|span-self-end|span-all]{1,2}]",syntax:"'*'|<syntax-component> [<syntax-combinator> <syntax-component>]*|<syntax-string>","syntax-component":"<syntax-single-component> <syntax-multiplier>?|'<' transform-list '>'","syntax-single-component":"'<' <syntax-type-name> '>'|<ident>","syntax-type-name":"angle|color|custom-ident|image|integer|length|length-percentage|number|percentage|resolution|string|time|url|transform-function","syntax-combinator":"'|'","syntax-multiplier":"'#'|'+'","syntax-string":"<string>"},properties:{"--*":"<declaration-value>","-ms-accelerator":"false|true","-ms-block-progression":"tb|rl|bt|lr","-ms-content-zoom-chaining":"none|chained","-ms-content-zoom-limit":"<'-ms-content-zoom-limit-min'> <'-ms-content-zoom-limit-max'>","-ms-content-zoom-limit-max":"<percentage>","-ms-content-zoom-limit-min":"<percentage>","-ms-content-zoom-snap":"<'-ms-content-zoom-snap-type'>||<'-ms-content-zoom-snap-points'>","-ms-content-zoom-snap-points":"snapInterval( <percentage> , <percentage> )|snapList( <percentage># )","-ms-content-zoom-snap-type":"none|proximity|mandatory","-ms-content-zooming":"none|zoom","-ms-filter":"<string>","-ms-flow-from":"[none|<custom-ident>]#","-ms-flow-into":"[none|<custom-ident>]#","-ms-grid-columns":"none|<track-list>|<auto-track-list>","-ms-grid-rows":"none|<track-list>|<auto-track-list>","-ms-high-contrast-adjust":"auto|none","-ms-hyphenate-limit-chars":"auto|<integer>{1,3}","-ms-hyphenate-limit-lines":"no-limit|<integer>","-ms-hyphenate-limit-zone":"<percentage>|<length>","-ms-ime-align":"auto|after","-ms-overflow-style":"auto|none|scrollbar|-ms-autohiding-scrollbar","-ms-scroll-chaining":"chained|none","-ms-scroll-limit":"<'-ms-scroll-limit-x-min'> <'-ms-scroll-limit-y-min'> <'-ms-scroll-limit-x-max'> <'-ms-scroll-limit-y-max'>","-ms-scroll-limit-x-max":"auto|<length>","-ms-scroll-limit-x-min":"<length>","-ms-scroll-limit-y-max":"auto|<length>","-ms-scroll-limit-y-min":"<length>","-ms-scroll-rails":"none|railed","-ms-scroll-snap-points-x":"snapInterval( <length-percentage> , <length-percentage> )|snapList( <length-percentage># )","-ms-scroll-snap-points-y":"snapInterval( <length-percentage> , <length-percentage> )|snapList( <length-percentage># )","-ms-scroll-snap-type":"none|proximity|mandatory","-ms-scroll-snap-x":"<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-x'>","-ms-scroll-snap-y":"<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-y'>","-ms-scroll-translation":"none|vertical-to-horizontal","-ms-scrollbar-3dlight-color":"<color>","-ms-scrollbar-arrow-color":"<color>","-ms-scrollbar-base-color":"<color>","-ms-scrollbar-darkshadow-color":"<color>","-ms-scrollbar-face-color":"<color>","-ms-scrollbar-highlight-color":"<color>","-ms-scrollbar-shadow-color":"<color>","-ms-scrollbar-track-color":"<color>","-ms-text-autospace":"none|ideograph-alpha|ideograph-numeric|ideograph-parenthesis|ideograph-space","-ms-touch-select":"grippers|none","-ms-user-select":"none|element|text","-ms-wrap-flow":"auto|both|start|end|maximum|clear","-ms-wrap-margin":"<length>","-ms-wrap-through":"wrap|none","-moz-appearance":"none|button|button-arrow-down|button-arrow-next|button-arrow-previous|button-arrow-up|button-bevel|button-focus|caret|checkbox|checkbox-container|checkbox-label|checkmenuitem|dualbutton|groupbox|listbox|listitem|menuarrow|menubar|menucheckbox|menuimage|menuitem|menuitemtext|menulist|menulist-button|menulist-text|menulist-textfield|menupopup|menuradio|menuseparator|meterbar|meterchunk|progressbar|progressbar-vertical|progresschunk|progresschunk-vertical|radio|radio-container|radio-label|radiomenuitem|range|range-thumb|resizer|resizerpanel|scale-horizontal|scalethumbend|scalethumb-horizontal|scalethumbstart|scalethumbtick|scalethumb-vertical|scale-vertical|scrollbarbutton-down|scrollbarbutton-left|scrollbarbutton-right|scrollbarbutton-up|scrollbarthumb-horizontal|scrollbarthumb-vertical|scrollbartrack-horizontal|scrollbartrack-vertical|searchfield|separator|sheet|spinner|spinner-downbutton|spinner-textfield|spinner-upbutton|splitter|statusbar|statusbarpanel|tab|tabpanel|tabpanels|tab-scroll-arrow-back|tab-scroll-arrow-forward|textfield|textfield-multiline|toolbar|toolbarbutton|toolbarbutton-dropdown|toolbargripper|toolbox|tooltip|treeheader|treeheadercell|treeheadersortarrow|treeitem|treeline|treetwisty|treetwistyopen|treeview|-moz-mac-unified-toolbar|-moz-win-borderless-glass|-moz-win-browsertabbar-toolbox|-moz-win-communicationstext|-moz-win-communications-toolbox|-moz-win-exclude-glass|-moz-win-glass|-moz-win-mediatext|-moz-win-media-toolbox|-moz-window-button-box|-moz-window-button-box-maximized|-moz-window-button-close|-moz-window-button-maximize|-moz-window-button-minimize|-moz-window-button-restore|-moz-window-frame-bottom|-moz-window-frame-left|-moz-window-frame-right|-moz-window-titlebar|-moz-window-titlebar-maximized","-moz-binding":"<url>|none","-moz-border-bottom-colors":"<color>+|none","-moz-border-left-colors":"<color>+|none","-moz-border-right-colors":"<color>+|none","-moz-border-top-colors":"<color>+|none","-moz-context-properties":"none|[fill|fill-opacity|stroke|stroke-opacity]#","-moz-float-edge":"border-box|content-box|margin-box|padding-box","-moz-force-broken-image-icon":"0|1","-moz-orient":"inline|block|horizontal|vertical","-moz-outline-radius":"<outline-radius>{1,4} [/ <outline-radius>{1,4}]?","-moz-outline-radius-bottomleft":"<outline-radius>","-moz-outline-radius-bottomright":"<outline-radius>","-moz-outline-radius-topleft":"<outline-radius>","-moz-outline-radius-topright":"<outline-radius>","-moz-stack-sizing":"ignore|stretch-to-fit","-moz-text-blink":"none|blink","-moz-user-focus":"ignore|normal|select-after|select-before|select-menu|select-same|select-all|none","-moz-user-input":"auto|none|enabled|disabled","-moz-user-modify":"read-only|read-write|write-only","-moz-window-dragging":"drag|no-drag","-moz-window-shadow":"default|menu|tooltip|sheet|none","-webkit-appearance":"none|button|button-bevel|caps-lock-indicator|caret|checkbox|default-button|inner-spin-button|listbox|listitem|media-controls-background|media-controls-fullscreen-background|media-current-time-display|media-enter-fullscreen-button|media-exit-fullscreen-button|media-fullscreen-button|media-mute-button|media-overlay-play-button|media-play-button|media-seek-back-button|media-seek-forward-button|media-slider|media-sliderthumb|media-time-remaining-display|media-toggle-closed-captions-button|media-volume-slider|media-volume-slider-container|media-volume-sliderthumb|menulist|menulist-button|menulist-text|menulist-textfield|meter|progress-bar|progress-bar-value|push-button|radio|scrollbarbutton-down|scrollbarbutton-left|scrollbarbutton-right|scrollbarbutton-up|scrollbargripper-horizontal|scrollbargripper-vertical|scrollbarthumb-horizontal|scrollbarthumb-vertical|scrollbartrack-horizontal|scrollbartrack-vertical|searchfield|searchfield-cancel-button|searchfield-decoration|searchfield-results-button|searchfield-results-decoration|slider-horizontal|slider-vertical|sliderthumb-horizontal|sliderthumb-vertical|square-button|textarea|textfield|-apple-pay-button","-webkit-border-after":"<'border-top'>","-webkit-border-after-color":"<'border-top-color'>","-webkit-border-after-style":"<'border-top-style'>","-webkit-border-after-width":"<'border-top-width'>","-webkit-border-before":"<'border-top'>","-webkit-border-before-color":"<'border-top-color'>","-webkit-border-before-style":"<'border-top-style'>","-webkit-border-before-width":"<'border-top-width'>","-webkit-border-end":"<'border-top'>","-webkit-border-end-color":"<'border-top-color'>","-webkit-border-end-style":"<'border-top-style'>","-webkit-border-end-width":"<'border-top-width'>","-webkit-border-start":"<'border-top'>","-webkit-border-start-color":"<'border-top-color'>","-webkit-border-start-style":"<'border-top-style'>","-webkit-border-start-width":"<'border-top-width'>","-webkit-box-reflect":"[above|below|right|left]? <length>? <image>?","-webkit-line-clamp":"none|<integer>","-webkit-mask":"[<mask-reference>||<position> [/ <bg-size>]?||<repeat-style>||[<visual-box>|border|padding|content|text]||[<visual-box>|border|padding|content]]#","-webkit-mask-attachment":"<attachment>#","-webkit-mask-clip":"[<coord-box>|no-clip|border|padding|content|text]#","-webkit-mask-composite":"<composite-style>#","-webkit-mask-image":"<mask-reference>#","-webkit-mask-origin":"[<coord-box>|border|padding|content]#","-webkit-mask-position":"<position>#","-webkit-mask-position-x":"[<length-percentage>|left|center|right]#","-webkit-mask-position-y":"[<length-percentage>|top|center|bottom]#","-webkit-mask-repeat":"<repeat-style>#","-webkit-mask-repeat-x":"repeat|no-repeat|space|round","-webkit-mask-repeat-y":"repeat|no-repeat|space|round","-webkit-mask-size":"<bg-size>#","-webkit-overflow-scrolling":"auto|touch","-webkit-tap-highlight-color":"<color>","-webkit-text-fill-color":"<color>","-webkit-text-stroke":"<length>||<color>","-webkit-text-stroke-color":"<color>","-webkit-text-stroke-width":"<length>","-webkit-touch-callout":"default|none","-webkit-user-modify":"read-only|read-write|read-write-plaintext-only","-webkit-user-select":"auto|none|text|all","accent-color":"auto|<color>","align-content":"normal|<baseline-position>|<content-distribution>|<overflow-position>? <content-position>","align-items":"normal|stretch|<baseline-position>|[<overflow-position>? <self-position>]|anchor-center","align-self":"auto|normal|stretch|<baseline-position>|<overflow-position>? <self-position>|anchor-center","align-tracks":"[normal|<baseline-position>|<content-distribution>|<overflow-position>? <content-position>]#","alignment-baseline":"auto|baseline|before-edge|text-before-edge|middle|central|after-edge|text-after-edge|ideographic|alphabetic|hanging|mathematical",all:"initial|inherit|unset|revert|revert-layer","anchor-name":"none|<dashed-ident>#","anchor-scope":"none|all|<dashed-ident>#",animation:"<single-animation>#","animation-composition":"<single-animation-composition>#","animation-delay":"<time>#","animation-direction":"<single-animation-direction>#","animation-duration":"[auto|<time [0s,\u221E]>]#","animation-fill-mode":"<single-animation-fill-mode>#","animation-iteration-count":"<single-animation-iteration-count>#","animation-name":"[none|<keyframes-name>]#","animation-play-state":"<single-animation-play-state>#","animation-range":"[<'animation-range-start'> <'animation-range-end'>?]#","animation-range-end":"[normal|<length-percentage>|<timeline-range-name> <length-percentage>?]#","animation-range-start":"[normal|<length-percentage>|<timeline-range-name> <length-percentage>?]#","animation-timeline":"<single-animation-timeline>#","animation-timing-function":"<easing-function>#","animation-trigger":"[none|[<dashed-ident> <animation-action>+]+]#",appearance:"none|auto|<compat-auto>|<compat-special>","aspect-ratio":"auto||<ratio>","backdrop-filter":"none|<filter-value-list>","backface-visibility":"visible|hidden",background:"<bg-layer>#? , <final-bg-layer>","background-attachment":"<attachment>#","background-blend-mode":"<blend-mode>#","background-clip":"<bg-clip>#","background-color":"<color>","background-image":"<bg-image>#","background-origin":"<visual-box>#","background-position":"<bg-position>#","background-position-x":"[center|[[left|right|x-start|x-end]? <length-percentage>?]!]#","background-position-y":"[center|[[top|bottom|y-start|y-end]? <length-percentage>?]!]#","background-repeat":"<repeat-style>#","background-size":"<bg-size>#","baseline-shift":"baseline|sub|super|<svg-length>","baseline-source":"auto|first|last","block-size":"<'width'>",border:"<line-width>||<line-style>||<color>","border-block":"<'border-top'>","border-block-color":"<'border-top-color'>{1,2}","border-block-end":"<'border-top'>","border-block-end-color":"<'border-top-color'>","border-block-end-style":"<'border-top-style'>","border-block-end-width":"<'border-top-width'>","border-block-start":"<'border-top'>","border-block-start-color":"<'border-top-color'>","border-block-start-style":"<'border-top-style'>","border-block-start-width":"<'border-top-width'>","border-block-style":"<'border-top-style'>{1,2}","border-block-width":"<'border-top-width'>{1,2}","border-bottom":"<line-width>||<line-style>||<color>","border-bottom-color":"<'border-top-color'>","border-bottom-left-radius":"<length-percentage [0,\u221E]>{1,2}","border-bottom-right-radius":"<length-percentage [0,\u221E]>{1,2}","border-bottom-style":"<line-style>","border-bottom-width":"<line-width>","border-collapse":"separate|collapse","border-color":"<color>{1,4}","border-end-end-radius":"<'border-top-left-radius'>","border-end-start-radius":"<'border-top-left-radius'>","border-image":"<'border-image-source'>||<'border-image-slice'> [/ <'border-image-width'>|/ <'border-image-width'>? / <'border-image-outset'>]?||<'border-image-repeat'>","border-image-outset":"[<length [0,\u221E]>|<number [0,\u221E]>]{1,4}","border-image-repeat":"[stretch|repeat|round|space]{1,2}","border-image-slice":"[<number [0,\u221E]>|<percentage [0,\u221E]>]{1,4}&&fill?","border-image-source":"none|<image>","border-image-width":"[<length-percentage [0,\u221E]>|<number [0,\u221E]>|auto]{1,4}","border-inline":"<'border-top'>","border-inline-color":"<'border-top-color'>{1,2}","border-inline-end":"<'border-top'>","border-inline-end-color":"<'border-top-color'>","border-inline-end-style":"<'border-top-style'>","border-inline-end-width":"<'border-top-width'>","border-inline-start":"<'border-top'>","border-inline-start-color":"<'border-top-color'>","border-inline-start-style":"<'border-top-style'>","border-inline-start-width":"<'border-top-width'>","border-inline-style":"<'border-top-style'>{1,2}","border-inline-width":"<'border-top-width'>{1,2}","border-left":"<line-width>||<line-style>||<color>","border-left-color":"<color>","border-left-style":"<line-style>","border-left-width":"<line-width>","border-radius":"<length-percentage [0,\u221E]>{1,4} [/ <length-percentage [0,\u221E]>{1,4}]?","border-right":"<line-width>||<line-style>||<color>","border-right-color":"<color>","border-right-style":"<line-style>","border-right-width":"<line-width>","border-shape":"none|[<basic-shape> <geometry-box>?]{1,2}","border-spacing":"<length>{1,2}","border-start-end-radius":"<'border-top-left-radius'>","border-start-start-radius":"<'border-top-left-radius'>","border-style":"<line-style>{1,4}","border-top":"<line-width>||<line-style>||<color>","border-top-color":"<color>","border-top-left-radius":"<length-percentage [0,\u221E]>{1,2}","border-top-right-radius":"<length-percentage [0,\u221E]>{1,2}","border-top-style":"<line-style>","border-top-width":"<line-width>","border-width":"<line-width>{1,4}",bottom:"auto|<length-percentage>|<anchor()>|<anchor-size()>","box-align":"start|center|end|baseline|stretch","box-decoration-break":"slice|clone","box-direction":"normal|reverse|inherit","box-flex":"<number>","box-flex-group":"<integer>","box-lines":"single|multiple","box-ordinal-group":"<integer>","box-orient":"horizontal|vertical|inline-axis|block-axis|inherit","box-pack":"start|center|end|justify","box-shadow":"none|<shadow>#","box-sizing":"content-box|border-box","break-after":"auto|avoid|always|all|avoid-page|page|left|right|recto|verso|avoid-column|column|avoid-region|region","break-before":"auto|avoid|always|all|avoid-page|page|left|right|recto|verso|avoid-column|column|avoid-region|region","break-inside":"auto|avoid|avoid-page|avoid-column|avoid-region","caption-side":"top|bottom",caret:"<'caret-color'>||<'caret-animation'>||<'caret-shape'>","caret-animation":"auto|manual","caret-color":"auto|<color>","caret-shape":"auto|bar|block|underscore",clear:"none|left|right|both|inline-start|inline-end",clip:"<shape>|auto","clip-path":"<clip-source>|[<basic-shape>||<geometry-box>]|none","clip-rule":"nonzero|evenodd",color:"<color>","color-interpolation-filters":"auto|sRGB|linearRGB","color-scheme":"normal|[light|dark|<custom-ident>]+&&only?","column-count":"<integer>|auto","column-fill":"auto|balance","column-gap":"normal|<length-percentage>","column-height":"auto|<length [0,\u221E]>","column-rule":"<'column-rule-width'>||<'column-rule-style'>||<'column-rule-color'>","column-rule-color":"<color>","column-rule-style":"<line-style>","column-rule-width":"<line-width>","column-span":"none|all","column-width":"auto|<length [0,\u221E]>","column-wrap":"auto|nowrap|wrap",columns:"[<'column-width'>||<'column-count'>] [/ <'column-height'>]?",contain:"none|strict|content|[[size||inline-size]||layout||style||paint]","contain-intrinsic-block-size":"auto? [none|<length>]","contain-intrinsic-height":"auto? [none|<length>]","contain-intrinsic-inline-size":"auto? [none|<length>]","contain-intrinsic-size":"[auto? [none|<length>]]{1,2}","contain-intrinsic-width":"auto? [none|<length>]",container:"<'container-name'> [/ <'container-type'>]?","container-name":"none|<custom-ident>+","container-type":"normal||[size|inline-size]",content:"normal|none|[<content-replacement>|<content-list>] [/ [<string>|<counter>|<attr()>]+]?","content-visibility":"visible|auto|hidden","corner-block-end-shape":"<corner-shape-value>{1,2}","corner-block-start-shape":"<corner-shape-value>{1,2}","corner-bottom-shape":"<corner-shape-value>{1,2}","corner-bottom-left-shape":"<corner-shape-value>","corner-bottom-right-shape":"<corner-shape-value>","corner-end-end-shape":"<corner-shape-value>","corner-end-start-shape":"<corner-shape-value>","corner-inline-end-shape":"<corner-shape-value>{1,2}","corner-inline-start-shape":"<corner-shape-value>{1,2}","corner-left-shape":"<corner-shape-value>{1,2}","corner-right-shape":"<corner-shape-value>{1,2}","corner-shape":"<corner-shape-value>{1,4}","corner-start-start-shape":"<corner-shape-value>","corner-start-end-shape":"<corner-shape-value>","corner-top-shape":"<corner-shape-value>{1,2}","corner-top-left-shape":"<corner-shape-value>","corner-top-right-shape":"<corner-shape-value>","counter-increment":"[<counter-name> <integer>?]+|none","counter-reset":"[<counter-name> <integer>?|<reversed-counter-name> <integer>?]+|none","counter-set":"[<counter-name> <integer>?]+|none",cursor:"[[<url> [<x> <y>]? ,]* [auto|default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|e-resize|n-resize|ne-resize|nw-resize|s-resize|se-resize|sw-resize|w-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|col-resize|row-resize|all-scroll|zoom-in|zoom-out|grab|grabbing|hand|-webkit-grab|-webkit-grabbing|-webkit-zoom-in|-webkit-zoom-out|-moz-grab|-moz-grabbing|-moz-zoom-in|-moz-zoom-out]]",cx:"<length>|<percentage>",cy:"<length>|<percentage>",d:"none|path( <string> )",direction:"ltr|rtl",display:"[<display-outside>||<display-inside>]|<display-listitem>|<display-internal>|<display-box>|<display-legacy>|<-non-standard-display>","dominant-baseline":"auto|use-script|no-change|reset-size|ideographic|alphabetic|hanging|mathematical|central|middle|text-after-edge|text-before-edge","dynamic-range-limit":"standard|no-limit|constrained|<dynamic-range-limit-mix()>","empty-cells":"show|hide","field-sizing":"content|fixed",fill:"<paint>","fill-opacity":"<number-zero-one>|<percentage>","fill-rule":"nonzero|evenodd",filter:"none|<filter-value-list>|<-ms-filter-function-list>",flex:"none|[<'flex-grow'> <'flex-shrink'>?||<'flex-basis'>]","flex-basis":"content|<'width'>","flex-direction":"row|row-reverse|column|column-reverse","flex-flow":"<'flex-direction'>||<'flex-wrap'>","flex-grow":"<number>","flex-line-count":"<integer [1,\u221E]>","flex-shrink":"<number>","flex-wrap":"nowrap|[wrap|wrap-reverse]||balance",float:"left|right|none|inline-start|inline-end","flood-color":"<color>","flood-opacity":"<'opacity'>",font:"[[<'font-style'>||<font-variant-css2>||<'font-weight'>||<font-width-css3>]? <'font-size'> [/ <'line-height'>]? <'font-family'>#]|<system-family-name>|<-non-standard-font>","font-family":"[<family-name>|<generic-family>]#","font-feature-settings":"normal|<feature-tag-value>#","font-kerning":"auto|normal|none","font-language-override":"normal|<string>","font-optical-sizing":"auto|none","font-palette":"normal|light|dark|<palette-identifier>|<palette-mix()>","font-size":"<absolute-size>|<relative-size>|<length-percentage [0,\u221E]>|math","font-size-adjust":"none|[ex-height|cap-height|ch-width|ic-width|ic-height]? [from-font|<number>]","font-smooth":"auto|never|always|<absolute-size>|<length>","font-stretch":"<font-stretch-absolute>","font-style":"normal|italic|oblique <angle>?","font-synthesis":"none|[weight||style||small-caps||position]","font-synthesis-position":"auto|none","font-synthesis-small-caps":"auto|none","font-synthesis-style":"auto|none","font-synthesis-weight":"auto|none","font-variant":"normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>||stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )||[small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps]||<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero||<east-asian-variant-values>||<east-asian-width-values>||ruby]","font-variant-alternates":"normal|[stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )]","font-variant-caps":"normal|small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps","font-variant-east-asian":"normal|[<east-asian-variant-values>||<east-asian-width-values>||ruby]","font-variant-emoji":"normal|text|emoji|unicode","font-variant-ligatures":"normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>]","font-variant-numeric":"normal|[<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero]","font-variant-position":"normal|sub|super","font-variation-settings":"normal|[<string> <number>]#","font-weight":"<font-weight-absolute>|bolder|lighter","font-width":"normal|<percentage [0,\u221E]>|ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded","forced-color-adjust":"auto|none|preserve-parent-color","frame-sizing":"auto|content-width|content-height|content-block-size|content-inline-size",gap:"<'row-gap'> <'column-gap'>?",grid:"<'grid-template'>|<'grid-template-rows'> / [auto-flow&&dense?] <'grid-auto-columns'>?|[auto-flow&&dense?] <'grid-auto-rows'>? / <'grid-template-columns'>","grid-area":"<grid-line> [/ <grid-line>]{0,3}","grid-auto-columns":"<track-size>+","grid-auto-flow":"[row|column]||dense","grid-auto-rows":"<track-size>+","grid-column":"<grid-line> [/ <grid-line>]?","grid-column-end":"<grid-line>","grid-column-gap":"<length-percentage>","grid-column-start":"<grid-line>","grid-gap":"<'grid-row-gap'> <'grid-column-gap'>?","grid-row":"<grid-line> [/ <grid-line>]?","grid-row-end":"<grid-line>","grid-row-gap":"<length-percentage>","grid-row-start":"<grid-line>","grid-template":"none|[<'grid-template-rows'> / <'grid-template-columns'>]|[<line-names>? <string> <track-size>? <line-names>?]+ [/ <explicit-track-list>]?","grid-template-areas":"none|<string>+","grid-template-columns":"none|<track-list>|<auto-track-list>|subgrid <line-name-list>?","grid-template-rows":"none|<track-list>|<auto-track-list>|subgrid <line-name-list>?","hanging-punctuation":"none|[first||[force-end|allow-end]||last]",height:"auto|<length-percentage [0,\u221E]>|min-content|max-content|fit-content|fit-content( <length-percentage [0,\u221E]> )|<calc-size()>|<anchor-size()>|stretch|<-non-standard-size>","hyphenate-character":"auto|<string>","hyphenate-limit-chars":"[auto|<integer>]{1,3}",hyphens:"none|manual|auto","image-orientation":"from-image|<angle>|[<angle>? flip]","image-rendering":"auto|crisp-edges|pixelated|smooth|optimizeSpeed|optimizeQuality|<-non-standard-image-rendering>","image-resolution":"[from-image||<resolution>]&&snap?","ime-mode":"auto|normal|active|inactive|disabled","initial-letter":"normal|[<number> <integer>?]","initial-letter-align":"[auto|alphabetic|hanging|ideographic]","inline-size":"<'width'>",inset:"<'top'>{1,4}","inset-block":"<'top'>{1,2}","inset-block-end":"<'top'>","inset-block-start":"<'top'>","inset-inline":"<'top'>{1,2}","inset-inline-end":"<'top'>","inset-inline-start":"<'top'>","interpolate-size":"numeric-only|allow-keywords",isolation:"auto|isolate",interactivity:"auto|inert","interest-delay":"<'interest-delay-start'>{1,2}","interest-delay-end":"normal|<time>","interest-delay-start":"normal|<time>","justify-content":"normal|<content-distribution>|<overflow-position>? [<content-position>|left|right]","justify-items":"normal|stretch|<baseline-position>|<overflow-position>? [<self-position>|left|right]|legacy|legacy&&[left|right|center]|anchor-center","justify-self":"auto|normal|stretch|<baseline-position>|<overflow-position>? [<self-position>|left|right]|anchor-center","justify-tracks":"[normal|<content-distribution>|<overflow-position>? [<content-position>|left|right]]#",left:"auto|<length-percentage>|<anchor()>|<anchor-size()>","letter-spacing":"normal|<length-percentage>","lighting-color":"<color>","line-break":"auto|loose|normal|strict|anywhere","line-clamp":"none|<integer>","line-height":"normal|<number>|<length>|<percentage>","line-height-step":"<length>","link-parameters":"none|<param()>#","list-style":"<'list-style-type'>||<'list-style-position'>||<'list-style-image'>","list-style-image":"<image>|none","list-style-position":"inside|outside","list-style-type":"<counter-style>|<string>|none",margin:"<'margin-top'>{1,4}","margin-block":"<'margin-top'>{1,2}","margin-block-end":"<'margin-top'>","margin-block-start":"<'margin-top'>","margin-bottom":"<length-percentage>|auto|<anchor-size()>","margin-inline":"<'margin-top'>{1,2}","margin-inline-end":"<'margin-top'>","margin-inline-start":"<'margin-top'>","margin-left":"<length-percentage>|auto|<anchor-size()>","margin-right":"<length-percentage>|auto|<anchor-size()>","margin-top":"<length-percentage>|auto|<anchor-size()>","margin-trim":"none|in-flow|all",marker:"none|<url>","marker-end":"none|<url>","marker-mid":"none|<url>","marker-start":"none|<url>",mask:"<mask-layer>#","mask-border":"<'mask-border-source'>||<'mask-border-slice'> [/ <'mask-border-width'>? [/ <'mask-border-outset'>]?]?||<'mask-border-repeat'>||<'mask-border-mode'>","mask-border-mode":"luminance|alpha","mask-border-outset":"[<length>|<number>]{1,4}","mask-border-repeat":"[stretch|repeat|round|space]{1,2}","mask-border-slice":"<number-percentage>{1,4} fill?","mask-border-source":"none|<image>","mask-border-width":"[<length-percentage>|<number>|auto]{1,4}","mask-clip":"[<coord-box>|no-clip]#","mask-composite":"<compositing-operator>#","mask-image":"<mask-reference>#","mask-mode":"<masking-mode>#","mask-origin":"<coord-box>#","mask-position":"<position>#","mask-repeat":"<repeat-style>#","mask-size":"<bg-size>#","mask-type":"luminance|alpha","masonry-auto-flow":"[pack|next]||[definite-first|ordered]","math-depth":"auto-add|add( <integer> )|<integer>","math-shift":"normal|compact","math-style":"normal|compact","max-block-size":"<'max-width'>","max-height":"none|<length-percentage [0,\u221E]>|min-content|max-content|fit-content|fit-content( <length-percentage [0,\u221E]> )|<calc-size()>|<anchor-size()>|stretch|<-non-standard-size>","max-inline-size":"<'max-width'>","max-lines":"none|<integer>","max-width":"none|<length-percentage [0,\u221E]>|min-content|max-content|fit-content|fit-content( <length-percentage [0,\u221E]> )|<calc-size()>|<anchor-size()>|stretch|<-non-standard-size>","min-block-size":"<'min-width'>","min-height":"auto|<length-percentage [0,\u221E]>|min-content|max-content|fit-content|fit-content( <length-percentage [0,\u221E]> )|<calc-size()>|<anchor-size()>|stretch|<-non-standard-size>","min-inline-size":"<'min-width'>","min-width":"auto|<length-percentage [0,\u221E]>|min-content|max-content|fit-content|fit-content( <length-percentage [0,\u221E]> )|<calc-size()>|<anchor-size()>|stretch|<-non-standard-size>","mix-blend-mode":"<blend-mode>|plus-darker|plus-lighter","object-fit":"fill|contain|cover|none|scale-down","object-position":"<position>","object-view-box":"none|<basic-shape-rect>",offset:"[<'offset-position'>? [<'offset-path'> [<'offset-distance'>||<'offset-rotate'>]?]?]! [/ <'offset-anchor'>]?","offset-anchor":"auto|<position>","offset-distance":"<length-percentage>","offset-path":"none|<offset-path>||<coord-box>","offset-position":"normal|auto|<position>","offset-rotate":"[auto|reverse]||<angle>",opacity:"<opacity-value>",order:"<integer>",orphans:"<integer>",outline:"<'outline-width'>||<'outline-style'>||<'outline-color'>","outline-color":"auto|<color>","outline-offset":"<length>","outline-style":"auto|<outline-line-style>","outline-width":"<line-width>",overflow:"[visible|hidden|clip|scroll|auto]{1,2}|<-non-standard-overflow>","overflow-anchor":"auto|none","overflow-block":"visible|hidden|clip|scroll|auto|<-non-standard-overflow>","overflow-clip-box":"padding-box|content-box","overflow-clip-margin":"<visual-box>||<length [0,\u221E]>","overflow-inline":"visible|hidden|clip|scroll|auto|<-non-standard-overflow>","overflow-wrap":"normal|break-word|anywhere","overflow-x":"visible|hidden|clip|scroll|auto|<-non-standard-overflow>","overflow-y":"visible|hidden|clip|scroll|auto|<-non-standard-overflow>",overlay:"none|auto","overscroll-behavior":"[contain|none|auto]{1,2}","overscroll-behavior-block":"contain|none|auto","overscroll-behavior-inline":"contain|none|auto","overscroll-behavior-x":"contain|none|auto","overscroll-behavior-y":"contain|none|auto",padding:"<'padding-top'>{1,4}","padding-block":"<'padding-top'>{1,2}","padding-block-end":"<'padding-top'>","padding-block-start":"<'padding-top'>","padding-bottom":"<length-percentage [0,\u221E]>","padding-inline":"<'padding-top'>{1,2}","padding-inline-end":"<'padding-top'>","padding-inline-start":"<'padding-top'>","padding-left":"<length-percentage [0,\u221E]>","padding-right":"<length-percentage [0,\u221E]>","padding-top":"<length-percentage [0,\u221E]>",page:"auto|<custom-ident>","page-break-after":"auto|always|avoid|left|right|recto|verso","page-break-before":"auto|always|avoid|left|right|recto|verso","page-break-inside":"auto|avoid","paint-order":"normal|[fill||stroke||markers]","path-length":"none|<length> [0 , \u221E]",perspective:"none|<length>","perspective-origin":"<position>","place-content":"<'align-content'> <'justify-content'>?","place-items":"<'align-items'> <'justify-items'>?","place-self":"<'align-self'> <'justify-self'>?","pointer-events":"auto|none|visiblePainted|visibleFill|visibleStroke|visible|painted|fill|stroke|all|inherit",position:"static|relative|absolute|sticky|fixed|-webkit-sticky","position-anchor":"normal|auto|none|<anchor-name>|match-parent","position-area":"none|<position-area>","position-try":"<'position-try-order'>? <'position-try-fallbacks'>","position-try-fallbacks":"none|[[<dashed-ident>||<try-tactic>]|<'position-area'>]#","position-try-order":"normal|<try-size>","position-visibility":"always|[anchors-valid||anchors-visible||no-overflow]","print-color-adjust":"economy|exact",quotes:"none|auto|[<string> <string>]+",r:"<length>|<percentage>","reading-flow":"normal|source-order|flex-visual|flex-flow|grid-rows|grid-columns|grid-order","reading-order":"<integer>",resize:"none|both|horizontal|vertical|block|inline",right:"auto|<length-percentage>|<anchor()>|<anchor-size()>",rotate:"none|<angle>|[x|y|z|<number>{3}]&&<angle>","row-gap":"normal|<length-percentage>","ruby-align":"start|center|space-between|space-around","ruby-merge":"separate|collapse|auto","ruby-overhang":"auto|none","ruby-position":"[alternate||[over|under]]|inter-character",rx:"<length-percentage>|auto",ry:"<length-percentage>|auto",scale:"none|[<number>|<percentage>]{1,3}","scroll-behavior":"auto|smooth","scroll-initial-target":"none|nearest","scroll-margin":"<length>{1,4}","scroll-margin-block":"<length>{1,2}","scroll-margin-block-end":"<length>","scroll-margin-block-start":"<length>","scroll-margin-bottom":"<length>","scroll-margin-inline":"<length>{1,2}","scroll-margin-inline-end":"<length>","scroll-margin-inline-start":"<length>","scroll-margin-left":"<length>","scroll-margin-right":"<length>","scroll-margin-top":"<length>","scroll-marker-group":"none|before|after","scroll-padding":"[auto|<length-percentage>]{1,4}","scroll-padding-block":"[auto|<length-percentage>]{1,2}","scroll-padding-block-end":"auto|<length-percentage>","scroll-padding-block-start":"auto|<length-percentage>","scroll-padding-bottom":"auto|<length-percentage>","scroll-padding-inline":"[auto|<length-percentage>]{1,2}","scroll-padding-inline-end":"auto|<length-percentage>","scroll-padding-inline-start":"auto|<length-percentage>","scroll-padding-left":"auto|<length-percentage>","scroll-padding-right":"auto|<length-percentage>","scroll-padding-top":"auto|<length-percentage>","scroll-snap-align":"[none|start|end|center]{1,2}","scroll-snap-coordinate":"none|<position>#","scroll-snap-destination":"<position>","scroll-snap-points-x":"none|repeat( <length-percentage> )","scroll-snap-points-y":"none|repeat( <length-percentage> )","scroll-snap-stop":"normal|always","scroll-snap-type":"none|[x|y|block|inline|both] [mandatory|proximity]?","scroll-snap-type-x":"none|mandatory|proximity","scroll-snap-type-y":"none|mandatory|proximity","scroll-target-group":"none|auto","scroll-timeline":"[<'scroll-timeline-name'> <'scroll-timeline-axis'>?]#","scroll-timeline-axis":"[block|inline|x|y]#","scroll-timeline-name":"[none|<dashed-ident>]#","scrollbar-color":"auto|<color>{2}","scrollbar-gutter":"auto|stable&&both-edges?","scrollbar-width":"auto|thin|none","shape-image-threshold":"<opacity-value>","shape-margin":"<length-percentage>","shape-outside":"none|[<shape-box>||<basic-shape>]|<image>","shape-rendering":"auto|optimizeSpeed|crispEdges|geometricPrecision","speak-as":"normal|spell-out||digits||[literal-punctuation|no-punctuation]","stop-color":"<'color'>","stop-opacity":"<'opacity'>",stroke:"<paint>","stroke-color":"<color>","stroke-dasharray":"none|[<svg-length>+]#","stroke-dashoffset":"<svg-length>","stroke-linecap":"butt|round|square","stroke-linejoin":"miter|round|bevel","stroke-miterlimit":"<number-one-or-greater>","stroke-opacity":"<'opacity'>","stroke-width":"<svg-length>","tab-size":"<integer>|<length>","table-layout":"auto|fixed","text-align":"start|end|left|right|center|justify|match-parent","text-align-last":"auto|start|end|left|right|center|justify","text-anchor":"start|middle|end","text-autospace":"normal|<autospace>|auto","text-box":"normal|<'text-box-trim'>||<'text-box-edge'>","text-box-edge":"auto|<text-edge>","text-box-trim":"none|trim-start|trim-end|trim-both","text-combine-upright":"none|all|[digits <integer>?]","text-decoration":"<'text-decoration-line'>||<'text-decoration-style'>||<'text-decoration-color'>||<'text-decoration-thickness'>","text-decoration-color":"<color>","text-decoration-inset":"<length-percentage>{1,2}|auto","text-decoration-line":"none|[underline||overline||line-through||blink]|spelling-error|grammar-error","text-decoration-skip":"none|[objects||[spaces|[leading-spaces||trailing-spaces]]||edges||box-decoration]","text-decoration-skip-ink":"auto|all|none","text-decoration-style":"solid|double|dotted|dashed|wavy","text-decoration-thickness":"auto|from-font|<length>|<percentage>","text-emphasis":"<'text-emphasis-style'>||<'text-emphasis-color'>","text-emphasis-color":"<color>","text-emphasis-position":"auto|[over|under]&&[right|left]?","text-emphasis-style":"none|[[filled|open]||[dot|circle|double-circle|triangle|sesame]]|<string>","text-fit":"[none|grow|shrink] [consistent|per-line|per-line-all]? <percentage>?","text-indent":"<length-percentage>&&hanging?&&each-line?","text-justify":"auto|inter-character|inter-word|none","text-orientation":"mixed|upright|sideways","text-overflow":"[clip|ellipsis|<string>]{1,2}","text-rendering":"auto|optimizeSpeed|optimizeLegibility|geometricPrecision","text-shadow":"none|<shadow-t>#","text-size-adjust":"none|auto|<percentage>","text-spacing-trim":"space-all|normal|space-first|trim-start","text-transform":"none|[capitalize|uppercase|lowercase]||full-width||full-size-kana|math-auto","text-underline-offset":"auto|<length>|<percentage>","text-underline-position":"auto|from-font|[under||[left|right]]","text-wrap":"<'text-wrap-mode'>||<'text-wrap-style'>","text-wrap-mode":"wrap|nowrap","text-wrap-style":"auto|balance|stable|pretty","timeline-scope":"none|<dashed-ident>#","timeline-trigger":"none|[<'timeline-trigger-name'> <'timeline-trigger-source'> <'timeline-trigger-activation-range'> ['/' <'timeline-trigger-active-range'>]?]#","timeline-trigger-activation-range":"[<'timeline-trigger-activation-range-start'> <'timeline-trigger-activation-range-end'>?]#","timeline-trigger-activation-range-end":"[normal|<length-percentage>|<timeline-range-name> <length-percentage>?]#","timeline-trigger-activation-range-start":"[normal|<length-percentage>|<timeline-range-name> <length-percentage>?]#","timeline-trigger-active-range":"[<'timeline-trigger-active-range-start'> <'timeline-trigger-active-range-end'>?]#","timeline-trigger-active-range-end":"[auto|normal|<length-percentage>|<timeline-range-name> <length-percentage>?]#","timeline-trigger-active-range-start":"[auto|normal|<length-percentage>|<timeline-range-name> <length-percentage>?]#","timeline-trigger-name":"none|<dashed-ident>#","timeline-trigger-source":"<single-animation-timeline>#",top:"auto|<length-percentage>|<anchor()>|<anchor-size()>","touch-action":"auto|none|[[pan-x|pan-left|pan-right]||[pan-y|pan-up|pan-down]||pinch-zoom]|manipulation",transform:"none|<transform-list>","transform-box":"content-box|border-box|fill-box|stroke-box|view-box","transform-origin":"[<length-percentage>|left|center|right|top|bottom]|[[<length-percentage>|left|center|right]&&[<length-percentage>|top|center|bottom]] <length>?","transform-style":"flat|preserve-3d",transition:"<single-transition>#","transition-behavior":"<transition-behavior-value>#","transition-delay":"<time>#","transition-duration":"<time>#","transition-property":"none|<single-transition-property>#","transition-timing-function":"<easing-function>#",translate:"none|<length-percentage> [<length-percentage> <length>?]?","trigger-scope":"none|all|<dashed-ident>#","unicode-bidi":"normal|embed|isolate|bidi-override|isolate-override|plaintext|-moz-isolate|-moz-isolate-override|-moz-plaintext|-webkit-isolate|-webkit-isolate-override|-webkit-plaintext","user-select":"auto|text|none|all","vector-effect":"none|non-scaling-stroke|non-scaling-size|non-rotation|fixed-position","vertical-align":"baseline|sub|super|text-top|text-bottom|middle|top|bottom|<percentage>|<length>","view-timeline":"[<'view-timeline-name'> [<'view-timeline-axis'>||<'view-timeline-inset'>]?]#","view-timeline-axis":"[block|inline|x|y]#","view-timeline-inset":"[[auto|<length-percentage>]{1,2}]#","view-timeline-name":"[none|<dashed-ident>]#","view-transition-class":"none|<custom-ident>+","view-transition-name":"none|<custom-ident>|match-element","view-transition-scope":"none|all",visibility:"visible|hidden|collapse","white-space":"normal|pre|pre-wrap|pre-line|<'white-space-collapse'>||<'text-wrap-mode'>","white-space-collapse":"collapse|preserve|preserve-breaks|preserve-spaces|break-spaces",widows:"<integer>",width:"auto|<length-percentage [0,\u221E]>|min-content|max-content|fit-content|fit-content( <length-percentage [0,\u221E]> )|<calc-size()>|<anchor-size()>|stretch|<-non-standard-size>","will-change":"auto|<animateable-feature>#","word-break":"normal|break-all|keep-all|break-word|auto-phrase","word-spacing":"normal|<length>","word-wrap":"normal|break-word","writing-mode":"horizontal-tb|vertical-rl|vertical-lr|sideways-rl|sideways-lr|<svg-writing-mode>",x:"<length>|<percentage>",y:"<length>|<percentage>","z-index":"auto|<integer>",zoom:"normal|reset|<number [0,\u221E]>||<percentage [0,\u221E]>","-moz-background-clip":"padding|border","-moz-border-radius-bottomleft":"<'border-bottom-left-radius'>","-moz-border-radius-bottomright":"<'border-bottom-right-radius'>","-moz-border-radius-topleft":"<'border-top-left-radius'>","-moz-border-radius-topright":"<'border-bottom-right-radius'>","-moz-control-character-visibility":"visible|hidden","-moz-osx-font-smoothing":"auto|grayscale","-moz-user-select":"none|text|all|-moz-none","-ms-flex-align":"start|end|center|baseline|stretch","-ms-flex-item-align":"auto|start|end|center|baseline|stretch","-ms-flex-line-pack":"start|end|center|justify|distribute|stretch","-ms-flex-negative":"<'flex-shrink'>","-ms-flex-pack":"start|end|center|justify|distribute","-ms-flex-order":"<integer>","-ms-flex-positive":"<'flex-grow'>","-ms-flex-preferred-size":"<'flex-basis'>","-ms-interpolation-mode":"nearest-neighbor|bicubic","-ms-grid-column-align":"start|end|center|stretch","-ms-grid-row-align":"start|end|center|stretch","-ms-hyphenate-limit-last":"none|always|column|page|spread","-webkit-background-clip":"[<visual-box>|border|padding|content|text]#","-webkit-column-break-after":"always|auto|avoid","-webkit-column-break-before":"always|auto|avoid","-webkit-column-break-inside":"always|auto|avoid","-webkit-font-smoothing":"auto|none|antialiased|subpixel-antialiased","-webkit-mask-box-image":"[<url>|<gradient>|none] [<length-percentage>{4} <-webkit-mask-box-repeat>{2}]?","-webkit-print-color-adjust":"economy|exact","-webkit-text-security":"none|circle|disc|square","-webkit-user-drag":"none|element|auto",behavior:"<url>+",cue:"<'cue-before'> <'cue-after'>?","cue-after":"<url> <decibel>?|none","cue-before":"<url> <decibel>?|none","glyph-orientation-horizontal":"<angle>","glyph-orientation-vertical":"<angle>",kerning:"auto|<svg-length>",pause:"<'pause-before'> <'pause-after'>?","pause-after":"<time>|none|x-weak|weak|medium|strong|x-strong","pause-before":"<time>|none|x-weak|weak|medium|strong|x-strong","position-try-options":"<'position-try-fallbacks'>",rest:"<'rest-before'> <'rest-after'>?","rest-after":"<time>|none|x-weak|weak|medium|strong|x-strong","rest-before":"<time>|none|x-weak|weak|medium|strong|x-strong",speak:"auto|never|always","voice-balance":"<number>|left|center|right|leftwards|rightwards","voice-duration":"auto|<time>","voice-family":"[[<family-name>|<generic-voice>] ,]* [<family-name>|<generic-voice>]|preserve","voice-pitch":"<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]","voice-range":"<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]","voice-rate":"[normal|x-slow|slow|medium|fast|x-fast]||<percentage>","voice-stress":"normal|strong|moderate|none|reduced","voice-volume":"silent|[[x-soft|soft|medium|loud|x-loud]||<decibel>]","white-space-trim":"none|discard-before||discard-after||discard-inner"},atrules:{charset:{prelude:"<string>",descriptors:null},"counter-style":{prelude:"<counter-style-name>",descriptors:{"additive-symbols":"[<integer [0,\u221E]>&&<symbol>]#",fallback:"<counter-style-name>",negative:"<symbol> <symbol>?",pad:"<integer [0,\u221E]>&&<symbol>",prefix:"<symbol>",range:"[[<integer>|infinite]{2}]#|auto","speak-as":"auto|bullets|numbers|words|spell-out|<counter-style-name>",suffix:"<symbol>",symbols:"<symbol>+",system:"cyclic|numeric|alphabetic|symbolic|additive|[fixed <integer>?]|[extends <counter-style-name>]"}},container:{prelude:"[<container-name>]? <container-condition>",descriptors:null},document:{prelude:"[<url>|url-prefix( <string> )|domain( <string> )|media-document( <string> )|regexp( <string> )]#",descriptors:null},"font-face":{prelude:null,descriptors:{"ascent-override":"normal|<percentage>","descent-override":"normal|<percentage>","font-display":"auto|block|swap|fallback|optional","font-family":"<family-name>","font-feature-settings":"normal|<feature-tag-value>#","font-stretch":"<font-stretch-absolute>{1,2}","font-style":"normal|italic|oblique <angle>{0,2}","font-variation-settings":"normal|[<string> <number>]#","font-weight":"<font-weight-absolute>{1,2}","line-gap-override":"normal|<percentage>","size-adjust":"<percentage>",src:"[<url> [format( <string># )]?|local( <family-name> )]#","unicode-range":"<urange>#"}},"font-feature-values":{prelude:"<family-name>#",descriptors:{"font-display":"auto|block|swap|fallback|optional"}},"font-palette-values":{prelude:"<dashed-ident>",descriptors:{"base-palette":"light|dark|<integer [0,\u221E]>","font-family":"<family-name>#","override-colors":"[<integer [0,\u221E]> <color>]#"}},import:{prelude:"[<string>|<url>] [layer|layer( <layer-name> )]? [supports( [<supports-condition>|<declaration>] )]? <media-query-list>?",descriptors:null},keyframes:{prelude:"<keyframes-name>",descriptors:null},layer:{prelude:"[<layer-name>#|<layer-name>?]",descriptors:null},media:{prelude:"<media-query-list>",descriptors:null},namespace:{prelude:"<namespace-prefix>? [<string>|<url>]",descriptors:null},page:{prelude:"<page-selector-list>",descriptors:{bleed:"auto|<length>",marks:"none|[crop||cross]","page-orientation":"upright|rotate-left|rotate-right",size:"<length [0,\u221E]>{1,2}|auto|[<page-size>||[portrait|landscape]]","margin-top":"<'margin-top'>","margin-right":"<'margin-right'>","margin-bottom":"<'margin-bottom'>","margin-left":"<'margin-left'>",margin:"<'margin'>"}},"position-try":{prelude:"<dashed-ident>",descriptors:{top:"<'top'>",left:"<'left'>",bottom:"<'bottom'>",right:"<'right'>","inset-block-start":"<'inset-block-start'>","inset-block-end":"<'inset-block-end'>","inset-inline-start":"<'inset-inline-start'>","inset-inline-end":"<'inset-inline-end'>","inset-block":"<'inset-block'>","inset-inline":"<'inset-inline'>",inset:"<'inset'>","margin-top":"<'margin-top'>","margin-left":"<'margin-left'>","margin-bottom":"<'margin-bottom'>","margin-right":"<'margin-right'>","margin-block-start":"<'margin-block-start'>","margin-block-end":"<'margin-block-end'>","margin-inline-start":"<'margin-inline-start'>","margin-inline-end":"<'margin-inline-end'>",margin:"<'margin'>","margin-block":"<'margin-block'>","margin-inline":"<'margin-inline'>",width:"<'width'>",height:"<'height'>","min-width":"<'min-width'>","min-height":"<'min-height'>","max-width":"<'max-width'>","max-height":"<'max-height'>","block-size":"<'block-size'>","inline-size":"<'inline-size'>","min-block-size":"<'min-block-size'>","min-inline-size":"<'min-inline-size'>","max-block-size":"<'max-block-size'>","max-inline-size":"<'max-inline-size'>","align-self":"<'align-self'>|anchor-center","justify-self":"<'justify-self'>|anchor-center"}},property:{prelude:"<custom-property-name>",descriptors:{inherits:"true|false","initial-value":"<declaration-value>?",syntax:"<string>"}},scope:{prelude:"[( <scope-start> )]? [to ( <scope-end> )]?",descriptors:null},"starting-style":{prelude:null,descriptors:null},supports:{prelude:"<supports-condition>",descriptors:null},"view-transition":{prelude:null,descriptors:{navigation:"auto|none",types:"none|<custom-ident>+"}}}},Ig={};J(Ig,{AnPlusB:()=>GA,AtKeyword:()=>VA,Atrule:()=>YA,AtrulePrelude:()=>XA,AttributeSelector:()=>$A,Block:()=>eT,Brackets:()=>rT,CDC:()=>lT,CDO:()=>uT,ClassSelector:()=>hT,Combinator:()=>pT,Comment:()=>fT,Condition:()=>bT,Declaration:()=>kT,DeclarationList:()=>ST,Dimension:()=>TT,Feature:()=>RT,FeatureFunction:()=>xT,FeatureRange:()=>IT,Function:()=>NT,GeneralEnclosed:()=>DT,Hash:()=>PT,IdSelector:()=>BT,Identifier:()=>zT,Layer:()=>GT,LayerList:()=>VT,MediaQuery:()=>YT,MediaQueryList:()=>XT,NestingSelector:()=>$T,Nth:()=>QT,Number:()=>t0,Operator:()=>n0,Parentheses:()=>i0,Percentage:()=>s0,PseudoClassSelector:()=>c0,PseudoElementSelector:()=>d0,Ratio:()=>m0,Raw:()=>g0,Rule:()=>w0,Scope:()=>y0,Selector:()=>E0,SelectorList:()=>S0,String:()=>T0,StyleSheet:()=>I0,SupportsDeclaration:()=>N0,TypeSelector:()=>D0,UnicodeRange:()=>P0,Url:()=>B0,Value:()=>Y0,WhiteSpace:()=>X0});var GA={};J(GA,{generate:()=>MP,name:()=>OP,parse:()=>WA,structure:()=>DP});var Ga=43,Zt=45,Qc=110,Ro=!0,NP=!1;function eu(e,t){let a=this.tokenStart+e,n=this.charCodeAt(a);for((n===Ga||n===Zt)&&(t&&this.error("Number sign is not allowed"),a++);a<this.tokenEnd;a++)yt(this.charCodeAt(a))||this.error("Integer is expected",a)}function Oi(e){return eu.call(this,0,e)}function Hn(e,t){if(!this.cmpChar(this.tokenStart+e,t)){let a="";switch(t){case Qc:a="N is expected";break;case Zt:a="HyphenMinus is expected";break}this.error(a,this.tokenStart+e)}}function Up(){let e=0,t=0,a=this.tokenType;for(;a===13||a===25;)a=this.lookupType(++e);if(a!==10)if(this.isDelim(Ga,e)||this.isDelim(Zt,e)){t=this.isDelim(Ga,e)?Ga:Zt;do a=this.lookupType(++e);while(a===13||a===25);a!==10&&(this.skip(e),Oi.call(this,Ro))}else return null;return e>0&&this.skip(e),t===0&&(a=this.charCodeAt(this.tokenStart),a!==Ga&&a!==Zt&&this.error("Number sign is expected")),Oi.call(this,t!==0),t===Zt?"-"+this.consume(10):this.consume(10)}var OP="AnPlusB",DP={a:[String,null],b:[String,null]};function WA(){let e=this.tokenStart,t=null,a=null;if(this.tokenType===10)Oi.call(this,NP),a=this.consume(10);else if(this.tokenType===1&&this.cmpChar(this.tokenStart,Zt))switch(t="-1",Hn.call(this,1,Qc),this.tokenEnd-this.tokenStart){case 2:this.next(),a=Up.call(this);break;case 3:Hn.call(this,2,Zt),this.next(),this.skipSC(),Oi.call(this,Ro),a="-"+this.consume(10);break;default:Hn.call(this,2,Zt),eu.call(this,3,Ro),this.next(),a=this.substrToCursor(e+2)}else if(this.tokenType===1||this.isDelim(Ga)&&this.lookupType(1)===1){let n=0;switch(t="1",this.isDelim(Ga)&&(n=1,this.next()),Hn.call(this,0,Qc),this.tokenEnd-this.tokenStart){case 1:this.next(),a=Up.call(this);break;case 2:Hn.call(this,1,Zt),this.next(),this.skipSC(),Oi.call(this,Ro),a="-"+this.consume(10);break;default:Hn.call(this,1,Zt),eu.call(this,2,Ro),this.next(),a=this.substrToCursor(e+n+1)}}else if(this.tokenType===12){let n=this.charCodeAt(this.tokenStart),o=n===Ga||n===Zt,i=this.tokenStart+o;for(;i<this.tokenEnd&&yt(this.charCodeAt(i));i++);i===this.tokenStart+o&&this.error("Integer is expected",this.tokenStart+o),Hn.call(this,i-this.tokenStart,Qc),t=this.substring(e,i),i+1===this.tokenEnd?(this.next(),a=Up.call(this)):(Hn.call(this,i-this.tokenStart+1,Zt),i+2===this.tokenEnd?(this.next(),this.skipSC(),Oi.call(this,Ro),a="-"+this.consume(10)):(eu.call(this,i-this.tokenStart+2,Ro),this.next(),a=this.substrToCursor(i+1)))}else this.error();return t!==null&&t.charCodeAt(0)===Ga&&(t=t.substr(1)),a!==null&&a.charCodeAt(0)===Ga&&(a=a.substr(1)),{type:"AnPlusB",loc:this.getLocation(e,this.tokenStart),a:t,b:a}}function MP(e){if(e.a){let t=e.a==="+1"&&"n"||e.a==="1"&&"n"||e.a==="-1"&&"-n"||e.a+"n";if(e.b){let a=e.b[0]==="-"||e.b[0]==="+"?e.b:"+"+e.b;this.tokenize(t+a)}else this.tokenize(t)}else this.tokenize(e.b)}var VA={};J(VA,{generate:()=>zP,name:()=>PP,parse:()=>qA,structure:()=>FP});var PP="AtKeyword",FP={name:String};function qA(){let e=this.tokenStart;return this.eat(3),{type:"AtKeyword",loc:this.getLocation(e,this.tokenStart),name:this.substrToCursor(e+1)}}function zP(e){this.token(3,"@"+e.name)}var YA={};J(YA,{generate:()=>WP,name:()=>BP,parse:()=>KA,structure:()=>GP,walkContext:()=>HP});function GS(){return this.Raw(this.consumeUntilLeftCurlyBracketOrSemicolon,!0)}function UP(){for(let e=1,t;t=this.lookupType(e);e++){if(t===24)return!0;if(t===23||t===3)return!1}return!1}var BP="Atrule",HP="atrule",GP={name:String,prelude:["AtrulePrelude","Raw",null],block:["Block",null]};function KA(e=!1,{allowNestedRules:t=!1}={}){let a=this.tokenStart,n,o,i=null,r=null;switch(this.eat(3),n=this.substrToCursor(a+1),o=n.toLowerCase(),this.skipSC(),this.eof===!1&&this.tokenType!==23&&this.tokenType!==17&&(this.parseAtrulePrelude?i=this.parseWithFallback(this.AtrulePrelude.bind(this,n,e),GS):i=GS.call(this,this.tokenIndex),this.skipSC()),this.tokenType){case 17:this.next();break;case 23:hasOwnProperty.call(this.atrule,o)&&typeof this.atrule[o].block=="function"?r=this.atrule[o].block.call(this,e,{allowNestedRules:t}):r=this.Block(e||UP.call(this),{allowNestedRules:t});break}return{type:"Atrule",loc:this.getLocation(a,this.tokenStart),name:n,prelude:i,block:r}}function WP(e){this.token(3,"@"+e.name),e.prelude!==null&&this.node(e.prelude),e.block?this.node(e.block):this.token(17,";")}var XA={};J(XA,{generate:()=>KP,name:()=>VP,parse:()=>ZA,structure:()=>YP,walkContext:()=>qP});var VP="AtrulePrelude",qP="atrulePrelude",YP={children:[[]]};function ZA(e){let t=null;return e!==null&&(e=e.toLowerCase()),this.skipSC(),hasOwnProperty.call(this.atrule,e)&&typeof this.atrule[e].prelude=="function"?t=this.atrule[e].prelude.call(this):t=this.readSequence(this.scope.AtrulePrelude),this.skipSC(),this.eof!==!0&&this.tokenType!==23&&this.tokenType!==17&&this.error("Semicolon or block is expected"),{type:"AtrulePrelude",loc:this.getLocationFromList(t),children:t}}function KP(e){this.children(e)}var $A={};J($A,{generate:()=>aF,name:()=>eF,parse:()=>QA,structure:()=>tF});var XP=36,JA=42,tu=61,ZP=94,rg=124,$P=126;function JP(){this.eof&&this.error("Unexpected end of input");let e=this.tokenStart,t=!1;return this.isDelim(JA)?(t=!0,this.next()):this.isDelim(rg)||this.eat(1),this.isDelim(rg)?this.charCodeAt(this.tokenStart+1)!==tu?(this.next(),this.eat(1)):t&&this.error("Identifier is expected",this.tokenEnd):t&&this.error("Vertical line is expected"),{type:"Identifier",loc:this.getLocation(e,this.tokenStart),name:this.substrToCursor(e)}}function QP(){let e=this.tokenStart,t=this.charCodeAt(e);return t!==tu&&t!==$P&&t!==ZP&&t!==XP&&t!==JA&&t!==rg&&this.error("Attribute selector (=, ~=, ^=, $=, *=, |=) is expected"),this.next(),t!==tu&&(this.isDelim(tu)||this.error("Equal sign is expected"),this.next()),this.substrToCursor(e)}var eF="AttributeSelector",tF={name:"Identifier",matcher:[String,null],value:["String","Identifier",null],flags:[String,null]};function QA(){let e=this.tokenStart,t,a=null,n=null,o=null;return this.eat(19),this.skipSC(),t=JP.call(this),this.skipSC(),this.tokenType!==20&&(this.tokenType!==1&&(a=QP.call(this),this.skipSC(),n=this.tokenType===5?this.String():this.Identifier(),this.skipSC()),this.tokenType===1&&(o=this.consume(1),this.skipSC())),this.eat(20),{type:"AttributeSelector",loc:this.getLocation(e,this.tokenStart),name:t,matcher:a,value:n,flags:o}}function aF(e){this.token(9,"["),this.node(e.name),e.matcher!==null&&(this.tokenize(e.matcher),this.node(e.value)),e.flags!==null&&this.token(1,e.flags),this.token(9,"]")}var eT={};J(eT,{generate:()=>mF,name:()=>uF,parse:()=>iT,structure:()=>hF,walkContext:()=>dF});var tT=38,nF=46,aT=42,nT=43,oF=62,iF=126,rF=new Set([tT,nF,aT,nT,oF,iF]);function oT(){return this.Raw(null,!0)}function WS(){return this.parseWithFallback(this.Rule,oT)}function VS(){return this.Raw(this.consumeUntilSemicolonIncluded,!0)}function sF(){if(this.tokenType===17)return VS.call(this,this.tokenIndex);let e=this.parseWithFallback(this.Declaration,VS);return this.tokenType===17&&this.next(),e}function lF(){if(this.tokenType!==1)return!1;let e=this.lookupTypeNonSC(1);if(e!==16&&e!==17&&e!==24)return!0;if(e===16){let t=this.lookupTypeNonSC(2);if(t===1||t===2){let a=3,n;for(;a<=15;){if(n=this.lookupType(a),n===23)return!0;if(n===17||n===24)return!1;if(n===13||n===25){a++;continue}else a++}}return!1}return!1}function cF(){if(this.tokenType===9&&rF.has(this.source.charCodeAt(this.tokenStart))){let e=this.source.charCodeAt(this.tokenStart);if(e===aT||e===nT||e===tT){let t=this.lookupType(1),a=this.lookupTypeNonSC(1);if(t===1&&a===1)return!1}return!0}return this.tokenType===4?!0:this.tokenType===19||this.tokenType===16||lF.call(this)}var uF="Block",dF="block",hF={children:[["Atrule","Rule","Declaration"]]};function iT(e,{allowNestedRules:t=!1}={}){let a=this.tokenStart,n=this.createList();this.eat(23);e:for(;!this.eof;)switch(this.tokenType){case 24:break e;case 13:case 25:this.next();break;case 3:n.push(this.parseWithFallback(this.Atrule.bind(this,e,{allowNestedRules:t}),oT));break;default:e?t&&cF.call(this)?n.push(WS.call(this)):n.push(sF.call(this)):n.push(WS.call(this))}return this.eof||this.eat(24),{type:"Block",loc:this.getLocation(a,this.tokenStart),children:n}}function mF(e){this.token(23,"{"),this.children(e,t=>{t.type==="Declaration"&&this.token(17,";")}),this.token(24,"}")}var rT={};J(rT,{generate:()=>fF,name:()=>pF,parse:()=>sT,structure:()=>gF});var pF="Brackets",gF={children:[[]]};function sT(e,t){let a=this.tokenStart,n=null;return this.eat(19),n=e.call(this,t),this.eof||this.eat(20),{type:"Brackets",loc:this.getLocation(a,this.tokenStart),children:n}}function fF(e){this.token(9,"["),this.children(e),this.token(9,"]")}var lT={};J(lT,{generate:()=>yF,name:()=>wF,parse:()=>cT,structure:()=>bF});var wF="CDC",bF={};function cT(){let e=this.tokenStart;return this.eat(15),{type:"CDC",loc:this.getLocation(e,this.tokenStart)}}function yF(){this.token(15,"-->")}var uT={};J(uT,{generate:()=>vF,name:()=>kF,parse:()=>dT,structure:()=>EF});var kF="CDO",EF={};function dT(){let e=this.tokenStart;return this.eat(14),{type:"CDO",loc:this.getLocation(e,this.tokenStart)}}function vF(){this.token(14,"<!--")}var hT={};J(hT,{generate:()=>CF,name:()=>AF,parse:()=>mT,structure:()=>TF});var SF=46,AF="ClassSelector",TF={name:String};function mT(){return this.eatDelim(SF),{type:"ClassSelector",loc:this.getLocation(this.tokenStart-1,this.tokenEnd),name:this.consume(1)}}function CF(e){this.token(9,"."),this.token(1,e.name)}var pT={};J(pT,{generate:()=>jF,name:()=>LF,parse:()=>gT,structure:()=>IF});var RF=43,qS=47,_F=62,xF=126,LF="Combinator",IF={name:String};function gT(){let e=this.tokenStart,t;switch(this.tokenType){case 13:t=" ";break;case 9:switch(this.charCodeAt(this.tokenStart)){case _F:case RF:case xF:this.next();break;case qS:this.next(),this.eatIdent("deep"),this.eatDelim(qS);break;default:this.error("Combinator is expected")}t=this.substrToCursor(e);break}return{type:"Combinator",loc:this.getLocation(e,this.tokenStart),name:t}}function jF(e){this.tokenize(e.name)}var fT={};J(fT,{generate:()=>PF,name:()=>DF,parse:()=>wT,structure:()=>MF});var NF=42,OF=47,DF="Comment",MF={value:String};function wT(){let e=this.tokenStart,t=this.tokenEnd;return this.eat(25),t-e+2>=2&&this.charCodeAt(t-2)===NF&&this.charCodeAt(t-1)===OF&&(t-=2),{type:"Comment",loc:this.getLocation(e,this.tokenStart),value:this.substring(e+2,t)}}function PF(e){this.token(25,"/*"+e.value+"*/")}var bT={};J(bT,{generate:()=>HF,name:()=>zF,parse:()=>yT,structure:()=>UF});var FF=new Set([16,22,0]),zF="Condition",UF={kind:String,children:[["Identifier","Feature","FeatureFunction","FeatureRange","SupportsDeclaration"]]};function YS(e){return this.lookupTypeNonSC(1)===1&&FF.has(this.lookupTypeNonSC(2))?this.Feature(e):this.FeatureRange(e)}var BF={media:YS,container:YS,supports(){return this.lookupTypeNonSC(1)===1&&this.lookupTypeNonSC(2)===16?this.SupportsDeclaration():null}};function yT(e="media"){let t=this.createList();e:for(;!this.eof;)switch(this.tokenType){case 25:case 13:this.next();continue;case 1:t.push(this.Identifier());break;case 21:{let a=this.parseWithFallback(()=>BF[e].call(this,e),()=>null);a||(a=this.parseWithFallback(()=>{this.eat(21);let n=this.Condition(e);return this.eat(22),n},()=>this.GeneralEnclosed(e))),t.push(a);break}case 2:{let a=this.parseWithFallback(()=>this.FeatureFunction(e),()=>null);a||(a=this.GeneralEnclosed(e)),t.push(a);break}default:break e}return t.isEmpty&&this.error("Condition is expected"),{type:"Condition",loc:this.getLocationFromList(t),kind:e,children:t}}function HF(e){e.children.forEach(t=>{t.type==="Condition"?(this.token(21,"("),this.node(t),this.token(22,")")):this.node(t)})}var kT={};J(kT,{generate:()=>ez,name:()=>$F,parse:()=>vT,structure:()=>QF,walkContext:()=>JF});var ET=33,GF=35,WF=36,VF=38,qF=42,YF=43,KS=47;function KF(){return this.Raw(this.consumeUntilExclamationMarkOrSemicolon,!0)}function XF(){return this.Raw(this.consumeUntilExclamationMarkOrSemicolon,!1)}function ZF(){let e=this.tokenIndex,t=this.Value();return t.type!=="Raw"&&this.eof===!1&&this.tokenType!==17&&this.isDelim(ET)===!1&&this.isBalanceEdge(e)===!1&&this.error(),t}var $F="Declaration",JF="declaration",QF={important:[Boolean,String],property:String,value:["Value","Raw"]};function vT(){let e=this.tokenStart,t=this.tokenIndex,a=tz.call(this),n=fu(a),o=n?this.parseCustomProperty:this.parseValue,i=n?XF:KF,r=!1,s;this.skipSC(),this.eat(16);let l=this.tokenIndex;if(n||this.skipSC(),o?s=this.parseWithFallback(ZF,i):s=i.call(this,this.tokenIndex),n&&s.type==="Value"&&s.children.isEmpty){for(let c=l-this.tokenIndex;c<=0;c++)if(this.lookupType(c)===13){s.children.appendData({type:"WhiteSpace",loc:null,value:" "});break}}return this.isDelim(ET)&&(r=az.call(this),this.skipSC()),this.eof===!1&&this.tokenType!==17&&this.isBalanceEdge(t)===!1&&this.error(),{type:"Declaration",loc:this.getLocation(e,this.tokenStart),important:r,property:a,value:s}}function ez(e){this.token(1,e.property),this.token(16,":"),this.node(e.value),e.important&&(this.token(9,"!"),this.token(1,e.important===!0?"important":e.important))}function tz(){let e=this.tokenStart;if(this.tokenType===9)switch(this.charCodeAt(this.tokenStart)){case qF:case WF:case YF:case GF:case VF:this.next();break;case KS:this.next(),this.isDelim(KS)&&this.next();break}return this.tokenType===4?this.eat(4):this.eat(1),this.substrToCursor(e)}function az(){this.eat(9),this.skipSC();let e=this.cmpStr(this.tokenStart,this.tokenEnd,"important"),t=this.consume(1);return e?!0:t}var ST={};J(ST,{generate:()=>pz,name:()=>hz,parse:()=>AT,structure:()=>mz});var nz=38,oz=46,iz=42,rz=43,sz=62,lz=126,cz=new Set([nz,oz,iz,rz,sz,lz]);function Bp(){return this.Raw(this.consumeUntilSemicolonIncluded,!0)}function uz(){if(this.tokenType!==1)return!1;let e=this.lookupTypeNonSC(1);return e===23?!0:e===17||e===18||e===24?!1:e===16&&this.lookupTypeNonSC(2)===1?this.lookupTypeNonSC(3)===23:!1}function dz(){return this.tokenType===9&&cz.has(this.source.charCodeAt(this.tokenStart))||this.tokenType===4||this.tokenType===19||this.tokenType===16||uz.call(this)}var hz="DeclarationList",mz={children:[["Declaration","Atrule","Rule"]]};function AT(){let e=this.createList();for(;!this.eof;)switch(this.tokenType){case 13:case 25:case 17:this.next();break;case 3:e.push(this.parseWithFallback(this.Atrule.bind(this,!0),Bp));break;default:dz.call(this)?e.push(this.parseWithFallback(this.Rule,Bp)):e.push(this.parseWithFallback(this.Declaration,Bp))}return{type:"DeclarationList",loc:this.getLocationFromList(e),children:e}}function pz(e){this.children(e,t=>{t.type==="Declaration"&&this.token(17,";")})}var TT={};J(TT,{generate:()=>wz,name:()=>gz,parse:()=>CT,structure:()=>fz});var gz="Dimension",fz={value:String,unit:String};function CT(){let e=this.tokenStart,t=this.consumeNumber(12);return{type:"Dimension",loc:this.getLocation(e,this.tokenStart),value:t,unit:this.substring(e+t.length,this.tokenStart)}}function wz(e){this.token(12,e.value+e.unit)}var RT={};J(RT,{generate:()=>Ez,name:()=>yz,parse:()=>_T,structure:()=>kz});var bz=47,yz="Feature",kz={kind:String,name:String,value:["Identifier","Number","Dimension","Ratio","Function",null]};function _T(e){let t=this.tokenStart,a,n=null;if(this.eat(21),this.skipSC(),a=this.consume(1),this.skipSC(),this.tokenType!==22){switch(this.eat(16),this.skipSC(),this.tokenType){case 10:this.lookupNonWSType(1)===9?n=this.Ratio():n=this.Number();break;case 12:n=this.Dimension();break;case 1:n=this.Identifier();break;case 2:n=this.parseWithFallback(()=>{let o=this.Function(this.readSequence,this.scope.Value);return this.skipSC(),this.isDelim(bz)&&this.error(),o},()=>this.Ratio());break;default:this.error("Number, dimension, ratio or identifier is expected")}this.skipSC()}return this.eof||this.eat(22),{type:"Feature",loc:this.getLocation(t,this.tokenStart),kind:e,name:a,value:n}}function Ez(e){this.token(21,"("),this.token(1,e.name),e.value!==null&&(this.token(16,":"),this.node(e.value)),this.token(22,")")}var xT={};J(xT,{generate:()=>Tz,name:()=>vz,parse:()=>LT,structure:()=>Sz});var vz="FeatureFunction",Sz={kind:String,feature:String,value:["Declaration","Selector","Identifier","String","AtKeyword","Raw"]};function Az(e,t){let a=(this.features[e]||{})[t];return typeof a!="function"&&this.error(`Unknown feature ${t}()`),a}function LT(e="unknown"){let t=this.tokenStart,a=this.consumeFunctionName(),n=Az.call(this,e,a.toLowerCase());this.skipSC();let o=this.parseWithFallback(()=>{let i=this.tokenIndex,r=n.call(this);return this.skipSC(),this.eof===!1&&this.isBalanceEdge(i)===!1&&this.error(),r},()=>this.Raw(null,!1));return this.eof||this.eat(22),{type:"FeatureFunction",loc:this.getLocation(t,this.tokenStart),kind:e,feature:a,value:o}}function Tz(e){this.token(2,e.feature+"("),this.node(e.value),this.token(22,")")}var IT={};J(IT,{generate:()=>Lz,name:()=>_z,parse:()=>jT,structure:()=>xz});var XS=47,Cz=60,ZS=61,Rz=62,_z="FeatureRange",xz={kind:String,left:["Identifier","Number","Dimension","Ratio","Function"],leftComparison:String,middle:["Identifier","Number","Dimension","Ratio","Function"],rightComparison:[String,null],right:["Identifier","Number","Dimension","Ratio","Function",null]};function Hp(){switch(this.skipSC(),this.tokenType){case 10:return this.isDelim(XS,this.lookupOffsetNonSC(1))?this.Ratio():this.Number();case 12:return this.Dimension();case 1:return this.Identifier();case 2:return this.parseWithFallback(()=>{let e=this.Function(this.readSequence,this.scope.Value);return this.skipSC(),this.isDelim(XS)&&this.error(),e},()=>this.Ratio());default:this.error("Number, dimension, ratio or identifier is expected")}}function $S(e){if(this.skipSC(),this.isDelim(Cz)||this.isDelim(Rz)){let t=this.source[this.tokenStart];return this.next(),this.isDelim(ZS)?(this.next(),t+"="):t}if(this.isDelim(ZS))return"=";this.error(`Expected ${e?'":", ':""}"<", ">", "=" or ")"`)}function jT(e="unknown"){let t=this.tokenStart;this.skipSC(),this.eat(21);let a=Hp.call(this),n=$S.call(this,a.type==="Identifier"),o=Hp.call(this),i=null,r=null;return this.lookupNonWSType(0)!==22&&(i=$S.call(this),r=Hp.call(this)),this.skipSC(),this.eat(22),{type:"FeatureRange",loc:this.getLocation(t,this.tokenStart),kind:e,left:a,leftComparison:n,middle:o,rightComparison:i,right:r}}function Lz(e){this.token(21,"("),this.node(e.left),this.tokenize(e.leftComparison),this.node(e.middle),e.right&&(this.tokenize(e.rightComparison),this.node(e.right)),this.token(22,")")}var NT={};J(NT,{generate:()=>Oz,name:()=>Iz,parse:()=>OT,structure:()=>Nz,walkContext:()=>jz});var Iz="Function",jz="function",Nz={name:String,children:[[]]};function OT(e,t){let a=this.tokenStart,n=this.consumeFunctionName(),o=n.toLowerCase(),i;return i=t.hasOwnProperty(o)?t[o].call(this,t):e.call(this,t),this.eof||this.eat(22),{type:"Function",loc:this.getLocation(a,this.tokenStart),name:n,children:i}}function Oz(e){this.token(2,e.name+"("),this.children(e),this.token(22,")")}var DT={};J(DT,{generate:()=>Pz,name:()=>Dz,parse:()=>MT,structure:()=>Mz});var Dz="GeneralEnclosed",Mz={kind:String,function:[String,null],children:[[]]};function MT(e){let t=this.tokenStart,a=null;this.tokenType===2?a=this.consumeFunctionName():this.eat(21);let n=this.parseWithFallback(()=>{let o=this.tokenIndex,i=this.readSequence(this.scope.Value);return this.eof===!1&&this.isBalanceEdge(o)===!1&&this.error(),i},()=>this.createSingleNodeList(this.Raw(null,!1)));return this.eof||this.eat(22),{type:"GeneralEnclosed",loc:this.getLocation(t,this.tokenStart),kind:e,function:a,children:n}}function Pz(e){e.function?this.token(2,e.function+"("):this.token(21,"("),this.children(e),this.token(22,")")}var PT={};J(PT,{generate:()=>Bz,name:()=>zz,parse:()=>FT,structure:()=>Uz,xxx:()=>Fz});var Fz="XXX",zz="Hash",Uz={value:String};function FT(){let e=this.tokenStart;return this.eat(4),{type:"Hash",loc:this.getLocation(e,this.tokenStart),value:this.substrToCursor(e+1)}}function Bz(e){this.token(4,"#"+e.value)}var zT={};J(zT,{generate:()=>Wz,name:()=>Hz,parse:()=>UT,structure:()=>Gz});var Hz="Identifier",Gz={name:String};function UT(){return{type:"Identifier",loc:this.getLocation(this.tokenStart,this.tokenEnd),name:this.consume(1)}}function Wz(e){this.token(1,e.name)}var BT={};J(BT,{generate:()=>Yz,name:()=>Vz,parse:()=>HT,structure:()=>qz});var Vz="IdSelector",qz={name:String};function HT(){let e=this.tokenStart;return this.eat(4),{type:"IdSelector",loc:this.getLocation(e,this.tokenStart),name:this.substrToCursor(e+1)}}function Yz(e){this.token(9,"#"+e.name)}var GT={};J(GT,{generate:()=>$z,name:()=>Xz,parse:()=>WT,structure:()=>Zz});var Kz=46,Xz="Layer",Zz={name:String};function WT(){let e=this.tokenStart,t=this.consume(1);for(;this.isDelim(Kz);)this.eat(9),t+="."+this.consume(1);return{type:"Layer",loc:this.getLocation(e,this.tokenStart),name:t}}function $z(e){this.tokenize(e.name)}var VT={};J(VT,{generate:()=>eU,name:()=>Jz,parse:()=>qT,structure:()=>Qz});var Jz="LayerList",Qz={children:[["Layer"]]};function qT(){let e=this.createList();for(this.skipSC();!this.eof&&(e.push(this.Layer()),this.lookupTypeNonSC(0)===18);)this.skipSC(),this.next(),this.skipSC();return{type:"LayerList",loc:this.getLocationFromList(e),children:e}}function eU(e){this.children(e,()=>this.token(18,","))}var YT={};J(YT,{generate:()=>nU,name:()=>tU,parse:()=>KT,structure:()=>aU});var tU="MediaQuery",aU={modifier:[String,null],mediaType:[String,null],condition:["Condition",null]};function KT(){let e=this.tokenStart,t=null,a=null,n=null;if(this.skipSC(),this.tokenType===1&&this.lookupTypeNonSC(1)!==21){let o=this.consume(1),i=o.toLowerCase();switch(i==="not"||i==="only"?(this.skipSC(),t=i,a=this.consume(1)):a=o,this.lookupTypeNonSC(0)){case 1:{this.skipSC(),this.eatIdent("and"),n=this.Condition("media");break}case 23:case 17:case 18:case 0:break;default:this.error("Identifier or parenthesis is expected")}}else switch(this.tokenType){case 1:case 21:case 2:{n=this.Condition("media");break}case 23:case 17:case 0:break;default:this.error("Identifier or parenthesis is expected")}return{type:"MediaQuery",loc:this.getLocation(e,this.tokenStart),modifier:t,mediaType:a,condition:n}}function nU(e){e.mediaType?(e.modifier&&this.token(1,e.modifier),this.token(1,e.mediaType),e.condition&&(this.token(1,"and"),this.node(e.condition))):e.condition&&this.node(e.condition)}var XT={};J(XT,{generate:()=>rU,name:()=>oU,parse:()=>ZT,structure:()=>iU});var oU="MediaQueryList",iU={children:[["MediaQuery"]]};function ZT(){let e=this.createList();for(this.skipSC();!this.eof&&(e.push(this.MediaQuery()),this.tokenType===18);)this.next();return{type:"MediaQueryList",loc:this.getLocationFromList(e),children:e}}function rU(e){this.children(e,()=>this.token(18,","))}var $T={};J($T,{generate:()=>uU,name:()=>lU,parse:()=>JT,structure:()=>cU});var sU=38,lU="NestingSelector",cU={};function JT(){let e=this.tokenStart;return this.eatDelim(sU),{type:"NestingSelector",loc:this.getLocation(e,this.tokenStart)}}function uU(){this.token(9,"&")}var QT={};J(QT,{generate:()=>mU,name:()=>dU,parse:()=>e0,structure:()=>hU});var dU="Nth",hU={nth:["AnPlusB","Identifier"],selector:["SelectorList",null]};function e0(){this.skipSC();let e=this.tokenStart,t=e,a=null,n;return this.lookupValue(0,"odd")||this.lookupValue(0,"even")?n=this.Identifier():n=this.AnPlusB(),t=this.tokenStart,this.skipSC(),this.lookupValue(0,"of")&&(this.next(),a=this.SelectorList(),t=this.tokenStart),{type:"Nth",loc:this.getLocation(e,t),nth:n,selector:a}}function mU(e){this.node(e.nth),e.selector!==null&&(this.token(1,"of"),this.node(e.selector))}var t0={};J(t0,{generate:()=>fU,name:()=>pU,parse:()=>a0,structure:()=>gU});var pU="Number",gU={value:String};function a0(){return{type:"Number",loc:this.getLocation(this.tokenStart,this.tokenEnd),value:this.consume(10)}}function fU(e){this.token(10,e.value)}var n0={};J(n0,{generate:()=>yU,name:()=>wU,parse:()=>o0,structure:()=>bU});var wU="Operator",bU={value:String};function o0(){let e=this.tokenStart;return this.next(),{type:"Operator",loc:this.getLocation(e,this.tokenStart),value:this.substrToCursor(e)}}function yU(e){this.tokenize(e.value)}var i0={};J(i0,{generate:()=>vU,name:()=>kU,parse:()=>r0,structure:()=>EU});var kU="Parentheses",EU={children:[[]]};function r0(e,t){let a=this.tokenStart,n=null;return this.eat(21),n=e.call(this,t),this.eof||this.eat(22),{type:"Parentheses",loc:this.getLocation(a,this.tokenStart),children:n}}function vU(e){this.token(21,"("),this.children(e),this.token(22,")")}var s0={};J(s0,{generate:()=>TU,name:()=>SU,parse:()=>l0,structure:()=>AU});var SU="Percentage",AU={value:String};function l0(){return{type:"Percentage",loc:this.getLocation(this.tokenStart,this.tokenEnd),value:this.consumeNumber(11)}}function TU(e){this.token(11,e.value+"%")}var c0={};J(c0,{generate:()=>xU,name:()=>CU,parse:()=>u0,structure:()=>_U,walkContext:()=>RU});var CU="PseudoClassSelector",RU="function",_U={name:String,children:[["Raw"],null]};function u0(){let e=this.tokenStart,t=null,a,n;return this.eat(16),this.tokenType===2?(a=this.consumeFunctionName(),n=a.toLowerCase(),this.lookupNonWSType(0)==22?t=this.createList():hasOwnProperty.call(this.pseudo,n)?(this.skipSC(),t=this.pseudo[n].call(this),this.skipSC()):(t=this.createList(),t.push(this.Raw(null,!1))),this.eat(22)):a=this.consume(1),{type:"PseudoClassSelector",loc:this.getLocation(e,this.tokenStart),name:a,children:t}}function xU(e){this.token(16,":"),e.children===null?this.token(1,e.name):(this.token(2,e.name+"("),this.children(e),this.token(22,")"))}var d0={};J(d0,{generate:()=>NU,name:()=>LU,parse:()=>h0,structure:()=>jU,walkContext:()=>IU});var LU="PseudoElementSelector",IU="function",jU={name:String,children:[["Raw"],null]};function h0(){let e=this.tokenStart,t=null,a,n;return this.eat(16),this.eat(16),this.tokenType===2?(a=this.consumeFunctionName(),n=a.toLowerCase(),this.lookupNonWSType(0)==22?t=this.createList():hasOwnProperty.call(this.pseudo,n)?(this.skipSC(),t=this.pseudo[n].call(this),this.skipSC()):(t=this.createList(),t.push(this.Raw(null,!1))),this.eat(22)):a=this.consume(1),{type:"PseudoElementSelector",loc:this.getLocation(e,this.tokenStart),name:a,children:t}}function NU(e){this.token(16,":"),this.token(16,":"),e.children===null?this.token(1,e.name):(this.token(2,e.name+"("),this.children(e),this.token(22,")"))}var m0={};J(m0,{generate:()=>MU,name:()=>OU,parse:()=>p0,structure:()=>DU});var JS=47;function QS(){switch(this.skipSC(),this.tokenType){case 10:return this.Number();case 2:return this.Function(this.readSequence,this.scope.Value);default:this.error("Number of function is expected")}}var OU="Ratio",DU={left:["Number","Function"],right:["Number","Function",null]};function p0(){let e=this.tokenStart,t=QS.call(this),a=null;return this.skipSC(),this.isDelim(JS)&&(this.eatDelim(JS),a=QS.call(this)),{type:"Ratio",loc:this.getLocation(e,this.tokenStart),left:t,right:a}}function MU(e){this.node(e.left),this.token(9,"/"),e.right?this.node(e.right):this.node(10,1)}var g0={};J(g0,{generate:()=>UU,name:()=>FU,parse:()=>f0,structure:()=>zU});function PU(){return this.tokenIndex>0&&this.lookupType(-1)===13?this.tokenIndex>1?this.getTokenStart(this.tokenIndex-1):this.firstCharOffset:this.tokenStart}var FU="Raw",zU={value:String};function f0(e,t){let a=this.getTokenStart(this.tokenIndex),n;return this.skipUntilBalanced(this.tokenIndex,e||this.consumeUntilBalanceEnd),t&&this.tokenStart>a?n=PU.call(this):n=this.tokenStart,{type:"Raw",loc:this.getLocation(a,n),value:this.substring(a,n)}}function UU(e){this.tokenize(e.value)}var w0={};J(w0,{generate:()=>VU,name:()=>HU,parse:()=>b0,structure:()=>WU,walkContext:()=>GU});function eA(){return this.Raw(this.consumeUntilLeftCurlyBracket,!0)}function BU(){let e=this.SelectorList();return e.type!=="Raw"&&this.eof===!1&&this.tokenType!==23&&this.error(),e}var HU="Rule",GU="rule",WU={prelude:["SelectorList","Raw"],block:["Block"]};function b0(){let e=this.tokenIndex,t=this.tokenStart,a,n;return this.parseRulePrelude?a=this.parseWithFallback(BU,eA):a=eA.call(this,e),n=this.Block(!0,{allowNestedRules:!0}),{type:"Rule",loc:this.getLocation(t,this.tokenStart),prelude:a,block:n}}function VU(e){this.node(e.prelude),this.node(e.block)}var y0={};J(y0,{generate:()=>KU,name:()=>qU,parse:()=>k0,structure:()=>YU});var qU="Scope",YU={root:["SelectorList","Raw",null],limit:["SelectorList","Raw",null]};function k0(){let e=null,t=null;this.skipSC();let a=this.tokenStart;return this.tokenType===21&&(this.next(),this.skipSC(),e=this.parseWithFallback(this.SelectorList,()=>this.Raw(!1,!0)),this.skipSC(),this.eat(22)),this.lookupNonWSType(0)===1&&(this.skipSC(),this.eatIdent("to"),this.skipSC(),this.eat(21),this.skipSC(),t=this.parseWithFallback(this.SelectorList,()=>this.Raw(!1,!0)),this.skipSC(),this.eat(22)),{type:"Scope",loc:this.getLocation(a,this.tokenStart),root:e,limit:t}}function KU(e){e.root&&(this.token(21,"("),this.node(e.root),this.token(22,")")),e.limit&&(this.token(1,"to"),this.token(21,"("),this.node(e.limit),this.token(22,")"))}var E0={};J(E0,{generate:()=>$U,name:()=>XU,parse:()=>v0,structure:()=>ZU});var XU="Selector",ZU={children:[["TypeSelector","IdSelector","ClassSelector","AttributeSelector","PseudoClassSelector","PseudoElementSelector","Combinator"]]};function v0(){let e=this.readSequence(this.scope.Selector);return this.getFirstListNode(e)===null&&this.error("Selector is expected"),{type:"Selector",loc:this.getLocationFromList(e),children:e}}function $U(e){this.children(e)}var S0={};J(S0,{generate:()=>t5,name:()=>JU,parse:()=>A0,structure:()=>e5,walkContext:()=>QU});var JU="SelectorList",QU="selector",e5={children:[["Selector","Raw"]]};function A0(){let e=this.createList();for(;!this.eof;){if(e.push(this.Selector()),this.tokenType===18){this.next();continue}break}return{type:"SelectorList",loc:this.getLocationFromList(e),children:e}}function t5(e){this.children(e,()=>this.token(18,","))}var T0={};J(T0,{generate:()=>o5,name:()=>a5,parse:()=>L0,structure:()=>n5});var C0={};J(C0,{decode:()=>jg,encode:()=>x0});var sg=92,R0=34,_0=39;function jg(e){let t=e.length,a=e.charCodeAt(0),n=a===R0||a===_0?1:0,o=n===1&&t>1&&e.charCodeAt(t-1)===a?t-2:t-1,i="";for(let r=n;r<=o;r++){let s=e.charCodeAt(r);if(s===sg){if(r===o){r!==t-1&&(i=e.substr(r+1));break}if(s=e.charCodeAt(++r),Aa(sg,s)){let l=r-1,c=xo(e,l);r=c-1,i+=pg(e.substring(l+1,c))}else s===13&&e.charCodeAt(r+1)===10&&r++}else i+=e[r]}return i}function x0(e,t){let a=t?"'":'"',n=t?_0:R0,o="",i=!1;for(let r=0;r<e.length;r++){let s=e.charCodeAt(r);if(s===0){o+="\uFFFD";continue}if(s<=31||s===127){o+="\\"+s.toString(16),i=!0;continue}s===n||s===sg?(o+="\\"+e.charAt(r),i=!1):(i&&(Vn(s)||_o(s))&&(o+=" "),o+=e.charAt(r),i=!1)}return a+o+a}var a5="String",n5={value:String};function L0(){return{type:"String",loc:this.getLocation(this.tokenStart,this.tokenEnd),value:jg(this.consume(5))}}function o5(e){this.token(5,x0(e.value))}var I0={};J(I0,{generate:()=>c5,name:()=>r5,parse:()=>j0,structure:()=>l5,walkContext:()=>s5});var i5=33;function tA(){return this.Raw(null,!1)}var r5="StyleSheet",s5="stylesheet",l5={children:[["Comment","CDO","CDC","Atrule","Rule","Raw"]]};function j0(){let e=this.tokenStart,t=this.createList(),a;for(;!this.eof;){switch(this.tokenType){case 13:this.next();continue;case 25:if(this.charCodeAt(this.tokenStart+2)!==i5){this.next();continue}a=this.Comment();break;case 14:a=this.CDO();break;case 15:a=this.CDC();break;case 3:a=this.parseWithFallback(this.Atrule,tA);break;default:a=this.parseWithFallback(this.Rule,tA)}t.push(a)}return{type:"StyleSheet",loc:this.getLocation(e,this.tokenStart),children:t}}function c5(e){this.children(e)}var N0={};J(N0,{generate:()=>h5,name:()=>u5,parse:()=>O0,structure:()=>d5});var u5="SupportsDeclaration",d5={declaration:"Declaration"};function O0(){let e=this.tokenStart;this.eat(21),this.skipSC();let t=this.Declaration();return this.eof||this.eat(22),{type:"SupportsDeclaration",loc:this.getLocation(e,this.tokenStart),declaration:t}}function h5(e){this.token(21,"("),this.node(e.declaration),this.token(22,")")}var D0={};J(D0,{generate:()=>g5,name:()=>m5,parse:()=>M0,structure:()=>p5});var aA=42,nA=124;function Gp(){if(this.tokenType!==1&&this.isDelim(aA)===!1&&this.error("Identifier or asterisk is expected"),this.isDelim(aA)){let e=this.tokenStart+1;this.next(),this.tokenType===1&&this.tokenStart===e&&this.error("Whitespace is required between universal selector and type selector");return}this.next()}var m5="TypeSelector",p5={name:String};function M0(){let e=this.tokenStart;return this.isDelim(nA)?(this.next(),Gp.call(this)):(Gp.call(this),this.isDelim(nA)&&(this.next(),Gp.call(this))),{type:"TypeSelector",loc:this.getLocation(e,this.tokenStart),name:this.substrToCursor(e)}}function g5(e){this.tokenize(e.name)}var P0={};J(P0,{generate:()=>k5,name:()=>b5,parse:()=>U0,structure:()=>y5});var F0=43,z0=45,lg=63;function hs(e,t){let a=0;for(let n=this.tokenStart+e;n<this.tokenEnd;n++){let o=this.charCodeAt(n);if(o===z0&&t&&a!==0)return hs.call(this,e+a+1,!1),-1;Vn(o)||this.error(t&&a!==0?"Hyphen minus"+(a<6?" or hex digit":"")+" is expected":a<6?"Hex digit is expected":"Unexpected input",n),++a>6&&this.error("Too many hex digits",n)}return this.next(),a}function Xc(e){let t=0;for(;this.isDelim(lg);)++t>e&&this.error("Too many question marks"),this.next()}function f5(e){this.charCodeAt(this.tokenStart)!==e&&this.error((e===F0?"Plus sign":"Hyphen minus")+" is expected")}function w5(){let e=0;switch(this.tokenType){case 10:if(e=hs.call(this,1,!0),this.isDelim(lg)){Xc.call(this,6-e);break}if(this.tokenType===12||this.tokenType===10){f5.call(this,z0),hs.call(this,1,!1);break}break;case 12:e=hs.call(this,1,!0),e>0&&Xc.call(this,6-e);break;default:if(this.eatDelim(F0),this.tokenType===1){e=hs.call(this,0,!0),e>0&&Xc.call(this,6-e);break}if(this.isDelim(lg)){this.next(),Xc.call(this,5);break}this.error("Hex digit or question mark is expected")}}var b5="UnicodeRange",y5={value:String};function U0(){let e=this.tokenStart;return this.eatIdent("u"),w5.call(this),{type:"UnicodeRange",loc:this.getLocation(e,this.tokenStart),value:this.substrToCursor(e)}}function k5(e){this.tokenize(e.value)}var B0={};J(B0,{generate:()=>R5,name:()=>T5,parse:()=>q0,structure:()=>C5});var H0={};J(H0,{decode:()=>W0,encode:()=>V0});var E5=32,au=92,v5=34,S5=39,A5=40,G0=41;function W0(e){let t=e.length,a=4,n=e.charCodeAt(t-1)===G0?t-2:t-1,o="";for(;a<n&&_o(e.charCodeAt(a));)a++;for(;a<n&&_o(e.charCodeAt(n));){let i=0;for(;n-i>a&&e.charCodeAt(n-i-1)===au;)i++;if(i%2===1)break;n--}for(let i=a;i<=n;i++){let r=e.charCodeAt(i);if(r===au){if(i===n){i!==t-1&&(o+=e.substr(i+1));break}if(r=e.charCodeAt(++i),Aa(au,r)){let s=i-1,l=xo(e,s);i=l-1,o+=pg(e.substring(s+1,l))}else r===13&&e.charCodeAt(i+1)===10&&i++}else{let s=e.indexOf("\\",i),l=s===-1?n+1:Math.min(s,n+1);o+=e.slice(i,l),i=l-1}}return o}function V0(e){let t=!1;return"url("+e.replace(/[^\x00-\x20\x7f"'()\\]+|[\s\S]/g,a=>{let n=a.charCodeAt(0);if(n===0)return"\uFFFD";if(n<=31||n===127)return t=!0,"\\"+n.toString(16);if(n===E5||n===au||n===v5||n===S5||n===A5||n===G0)return t=!1,"\\"+a;let o=t&&Vn(n)?" ":"";return t=!1,o+a})+")"}var T5="Url",C5={value:String};function q0(){let e=this.tokenStart,t;switch(this.tokenType){case 7:t=W0(this.consume(7));break;case 2:this.cmpStr(this.tokenStart,this.tokenEnd,"url(")||this.error("Function name must be `url`"),this.eat(2),this.skipSC(),t=jg(this.consume(5)),this.skipSC(),this.eof||this.eat(22);break;default:this.error("Url or Function is expected")}return{type:"Url",loc:this.getLocation(e,this.tokenStart),value:t}}function R5(e){this.token(7,V0(e.value))}var Y0={};J(Y0,{generate:()=>L5,name:()=>_5,parse:()=>K0,structure:()=>x5});var _5="Value",x5={children:[[]]};function K0(){let e=this.tokenStart,t=this.readSequence(this.scope.Value);return{type:"Value",loc:this.getLocation(e,this.tokenStart),children:t}}function L5(e){this.children(e)}var X0={};J(X0,{generate:()=>O5,name:()=>j5,parse:()=>Z0,structure:()=>N5});var I5=Object.freeze({type:"WhiteSpace",loc:null,value:" "}),j5="WhiteSpace",N5={value:String};function Z0(){return this.eat(13),I5}function O5(e){this.token(13,e.value)}var D5={generic:!0,cssWideKeywords:wg,...jP,node:Ig},$0={};J($0,{AtrulePrelude:()=>B5,Selector:()=>J5,Value:()=>tB});var M5=35,P5=42,oA=43,F5=45,z5=47,U5=117;function J0(e){switch(this.tokenType){case 4:return this.Hash();case 18:return this.Operator();case 21:return this.Parentheses(this.readSequence,e.recognizer);case 19:return this.Brackets(this.readSequence,e.recognizer);case 5:return this.String();case 12:return this.Dimension();case 11:return this.Percentage();case 10:return this.Number();case 2:return this.cmpStr(this.tokenStart,this.tokenEnd,"url(")?this.Url():this.Function(this.readSequence,e.recognizer);case 7:return this.Url();case 1:return this.cmpChar(this.tokenStart,U5)&&this.cmpChar(this.tokenStart+1,oA)?this.UnicodeRange():this.Identifier();case 9:{let t=this.charCodeAt(this.tokenStart);if(t===z5||t===P5||t===oA||t===F5)return this.Operator();t===M5&&this.error("Hex or identifier is expected",this.tokenStart+1);break}}}var B5={getNode:J0},H5=35,G5=38,W5=42,V5=43,q5=47,iA=46,Y5=62,K5=124,X5=126;function Z5(e,t){t.last!==null&&t.last.type!=="Combinator"&&e!==null&&e.type!=="Combinator"&&t.push({type:"Combinator",loc:null,name:" "})}function $5(){switch(this.tokenType){case 19:return this.AttributeSelector();case 4:return this.IdSelector();case 16:return this.lookupType(1)===16?this.PseudoElementSelector():this.PseudoClassSelector();case 1:return this.TypeSelector();case 10:case 11:return this.Percentage();case 12:this.charCodeAt(this.tokenStart)===iA&&this.error("Identifier is expected",this.tokenStart+1);break;case 9:{switch(this.charCodeAt(this.tokenStart)){case V5:case Y5:case X5:case q5:return this.Combinator();case iA:return this.ClassSelector();case W5:case K5:return this.TypeSelector();case H5:return this.IdSelector();case G5:return this.NestingSelector()}break}}}var J5={onWhiteSpace:Z5,getNode:$5};function Q5(){return this.createSingleNodeList(this.Raw(null,!1))}function eB(){let e=this.createList();if(this.skipSC(),e.push(this.Identifier()),this.skipSC(),this.tokenType===18){e.push(this.Operator());let t=this.tokenIndex,a=this.parseCustomProperty?this.Value(null):this.Raw(this.consumeUntilExclamationMarkOrSemicolon,!1);if(a.type==="Value"&&a.children.isEmpty){for(let n=t-this.tokenIndex;n<=0;n++)if(this.lookupType(n)===13){a.children.appendData({type:"WhiteSpace",loc:null,value:" "});break}}e.push(a)}return e}function rA(e){return e!==null&&e.type==="Operator"&&(e.value[e.value.length-1]==="-"||e.value[e.value.length-1]==="+")}var tB={getNode:J0,onWhiteSpace(e,t){rA(e)&&(e.value=" "+e.value),rA(t.last)&&(t.last.value+=" ")},expression:Q5,var:eB},aB=new Set(["none","and","not","or"]),nB={parse:{prelude(){let e=this.createList();if(this.tokenType===1){let t=this.substring(this.tokenStart,this.tokenEnd);aB.has(t.toLowerCase())||e.push(this.Identifier())}return e.push(this.Condition("container")),e},block(e=!1){return this.Block(e)}}},oB={parse:{prelude:null,block(){return this.Block(!0)}}};function sA(e,t){return this.parseWithFallback(()=>{try{return e.call(this)}finally{this.skipSC(),this.lookupNonWSType(0)!==22&&this.error()}},t||(()=>this.Raw(null,!0)))}var lA={layer(){this.skipSC();let e=this.createList(),t=sA.call(this,this.Layer);return(t.type!=="Raw"||t.value!=="")&&e.push(t),e},supports(){this.skipSC();let e=this.createList(),t=sA.call(this,this.tokenType===1&&this.lookupTypeNonSC(1)===16?this.Declaration:()=>this.Condition("supports"));return(t.type!=="Raw"||t.value!=="")&&e.push(t),e}},iB={parse:{prelude(){let e=this.createList();switch(this.tokenType){case 5:e.push(this.String());break;case 7:case 2:e.push(this.Url());break;default:this.error("String or url() is expected")}return this.skipSC(),this.tokenType===1&&this.cmpStr(this.tokenStart,this.tokenEnd,"layer")?e.push(this.Identifier()):this.tokenType===2&&this.cmpStr(this.tokenStart,this.tokenEnd,"layer(")&&e.push(this.Function(null,lA)),this.skipSC(),this.tokenType===2&&this.cmpStr(this.tokenStart,this.tokenEnd,"supports(")&&e.push(this.Function(null,lA)),(this.lookupNonWSType(0)===1||this.lookupNonWSType(0)===21)&&e.push(this.MediaQueryList()),e},block:null}},rB={parse:{prelude(){return this.createSingleNodeList(this.LayerList())},block(e=!1,{allowNestedRules:t=!1}={}){return this.Block(e,{allowNestedRules:t})}}},sB={parse:{prelude(){return this.createSingleNodeList(this.MediaQueryList())},block(e=!1,{allowNestedRules:t=!1}={}){return this.Block(e,{allowNestedRules:t})}}},lB={parse:{prelude(){return this.createSingleNodeList(this.SelectorList())},block(){return this.Block(!0)}}},cB={parse:{prelude(){return this.createSingleNodeList(this.SelectorList())},block(){return this.Block(!0)}}},uB={parse:{prelude(){return this.createSingleNodeList(this.Scope())},block(e=!1){return this.Block(e)}}},dB={parse:{prelude:null,block(e=!1){return this.Block(e)}}},hB={parse:{prelude(){return this.createSingleNodeList(this.Condition("supports"))},block(e=!1){return this.Block(e)}}},mB={container:nB,"font-face":oB,import:iB,layer:rB,media:sB,nest:lB,page:cB,scope:uB,"starting-style":dB,supports:hB};function pB(){let e=this.createList();this.skipSC();e:for(;!this.eof;){switch(this.tokenType){case 1:e.push(this.Identifier());break;case 5:e.push(this.String());break;case 18:e.push(this.Operator());break;case 22:break e;default:this.error("Identifier, string or comma is expected")}this.skipSC()}return e}var Co={parse(){return this.createSingleNodeList(this.SelectorList())}},Wp={parse(){return this.createSingleNodeList(this.Selector())}},gB={parse(){return this.createSingleNodeList(this.Identifier())}},fB={parse:pB},Zc={parse(){return this.createSingleNodeList(this.Nth())}},wB={dir:gB,has:Co,lang:fB,matches:Co,is:Co,"-moz-any":Co,"-webkit-any":Co,where:Co,not:Co,"nth-child":Zc,"nth-last-child":Zc,"nth-last-of-type":Zc,"nth-of-type":Zc,slotted:Wp,host:Wp,"host-context":Wp},Q0={};J(Q0,{AnPlusB:()=>WA,AtKeyword:()=>qA,Atrule:()=>KA,AtrulePrelude:()=>ZA,AttributeSelector:()=>QA,Block:()=>iT,Brackets:()=>sT,CDC:()=>cT,CDO:()=>dT,ClassSelector:()=>mT,Combinator:()=>gT,Comment:()=>wT,Condition:()=>yT,Declaration:()=>vT,DeclarationList:()=>AT,Dimension:()=>CT,Feature:()=>_T,FeatureFunction:()=>LT,FeatureRange:()=>jT,Function:()=>OT,GeneralEnclosed:()=>MT,Hash:()=>FT,IdSelector:()=>HT,Identifier:()=>UT,Layer:()=>WT,LayerList:()=>qT,MediaQuery:()=>KT,MediaQueryList:()=>ZT,NestingSelector:()=>JT,Nth:()=>e0,Number:()=>a0,Operator:()=>o0,Parentheses:()=>r0,Percentage:()=>l0,PseudoClassSelector:()=>u0,PseudoElementSelector:()=>h0,Ratio:()=>p0,Raw:()=>f0,Rule:()=>b0,Scope:()=>k0,Selector:()=>v0,SelectorList:()=>A0,String:()=>L0,StyleSheet:()=>j0,SupportsDeclaration:()=>O0,TypeSelector:()=>M0,UnicodeRange:()=>U0,Url:()=>q0,Value:()=>K0,WhiteSpace:()=>Z0});function Vp(){return this.Identifier()}function bB(){switch(this.tokenType){case 1:return this.Identifier();case 5:return this.String();default:this.error("Identifier or string is expected")}}var yB={parseContext:{default:"StyleSheet",stylesheet:"StyleSheet",atrule:"Atrule",atrulePrelude(e){return this.AtrulePrelude(e.atrule?String(e.atrule):null)},mediaQueryList:"MediaQueryList",mediaQuery:"MediaQuery",condition(e){return this.Condition(e.kind)},rule:"Rule",selectorList:"SelectorList",selector:"Selector",block(){return this.Block(!0)},declarationList:"DeclarationList",declaration:"Declaration",value:"Value"},features:{supports:{selector(){return this.Selector()},"font-tech":Vp,"font-format":bB,"at-rule"(){return this.AtKeyword()},"named-feature":Vp,env:Vp},container:{style(){return this.Declaration()}}},scope:$0,atrule:mB,pseudo:wB,node:Q0,tokenize:fA},kB={node:Ig},EB=HA({...D5,...yB,...kB}),vB="4.1.1";function Yn(e){let t={};for(let a of Object.keys(e)){let n=e[a];n&&(Array.isArray(n)||n instanceof bn?n=n.map(Yn):n.constructor===Object&&(n=Yn(n))),t[a]=n}return t}var eC={};J(eC,{decode:()=>SB,encode:()=>AB});var cA=92;function SB(e){let t=e.length-1,a="";for(let n=0;n<e.length;n++){let o=e.charCodeAt(n);if(o===cA){if(n===t)break;if(o=e.charCodeAt(++n),Aa(cA,o)){let i=n-1,r=xo(e,i);n=r-1,a+=pg(e.substring(i+1,r))}else o===13&&e.charCodeAt(n+1)===10&&n++}else a+=e[n]}return a}function AB(e){let t="";if(e.length===1&&e.charCodeAt(0)===45)return"\\-";for(let a=0;a<e.length;a++){let n=e.charCodeAt(a);if(n===0){t+="\uFFFD";continue}if(n<=31||n===127||n>=48&&n<=57&&(a===0||a===1&&e.charCodeAt(0)===45)){t+="\\"+n.toString(16)+" ";continue}hg(n)?t+=e.charAt(a):t+="\\"+e.charAt(a)}return t}var{tokenize:TB,parse:Ve,generate:ge,lexer:Es,createLexer:CB,walk:ra,find:ot,findLast:RB,findAll:Ng,toPlainObject:_B,fromPlainObject:xB,fork:LB}=EB;var IB=new Set(["inherit","initial","unset"]),jB=new Set(["caption","icon","menu","message-box","small-caption","status-bar"]),NB=new Set(["normal","bold","bolder","lighter","100","200","300","400","500","600","700","800","900"]),OB=new Set(["normal","italic","oblique"]),DB=new Set(["normal","small-caps"]),MB=new Set(["normal","condensed","semi-condensed","extra-condensed","ultra-condensed","expanded","semi-expanded","extra-expanded","ultra-expanded"]),PB=new Set(["Dimension","Identifier","Percentage","Number","Function","UnaryExpression"]),FB=new Set(["style","variant","weight","stretch"]),zB=new Set(["deg","grad","rad","turn"]),tC="Operator",Og="Identifier",aC="Number",UB="Dimension",nC="Function",zi="normal",BB="oblique",HB=1,GB=1e3,WB="/",VB=",",qB="[parse-css-font] ";function Mg(e){let t=ge(e),a=t.toLowerCase();if(jB.has(a))return{system:t};if(IB.has(a))return{global:t};let n=[],o;if([!0,!1].forEach(r=>{try{n.push(YB(e.children,r))}catch(s){o=s}}),!n.length)throw o;let[i]=n;return i.family=Array.from(new Set(n.flatMap(r=>r.family))),i}function YB(e,t){let a={lineHeight:zi,stretch:zi,style:zi,variant:zi,weight:zi},n={style:!1,variant:!1,weight:!1,stretch:!1};for(let o=e.head;o;o=o.next){let i=o.data.name||o.data.value||ge(o.data),r=i.toLowerCase(),s=o.data.type==Og||o.data.type==aC;if(s&&r===zi){FB.forEach(l=>{n[l]||(a[l]=i)});continue}if(s&&NB.has(r)){n.weight||(a.weight=i,n.weight=!0);continue}if(t&&!n.weight&&(o.data.type==aC&&Number(r)>=HB&&Number(r)<=GB||o.data.type==nC)){a.weight=i,n.weight=!0;continue}if(s&&OB.has(r)){if(!n.style){a.style=i,n.style=!0;let l=o.next&&o.next.data;r==BB&&l&&(l.type==UB&&zB.has(l.unit.toLowerCase())||t&&l.type==nC)&&(a.style+=" "+ge(l),o=o.next)}continue}if(s&&DB.has(r)){n.variant||(a.variant=i,n.variant=!0);continue}if(s&&MB.has(r)){n.stretch||(a.stretch=i,n.stretch=!0);continue}if(PB.has(o.data.type)){if(a.size=ge(o.data),o=o.next,o&&o.data.type==tC&&o.data.value==WB&&o.next&&(a.lineHeight=ge(o.next.data),o=o.next.next),!o)throw Dg("Missing required font-family.");a.family=[];let l="";for(;o;){for(;o&&o.data.type==tC&&o.data.value==VB;)o=o.next;if(o)if(o.data.type==Og)for(;o&&o.data.type==Og;)l+=" "+ge(o.data),o=o.next;else l=KB(ge(o.data)),o=o.next;l=l.trim(),l&&(a.family.push(l),l="")}return a}throw Dg("Unknown or unsupported font token: "+i)}throw Dg("Missing required font-size.")}function Dg(e){return new Error(qB+e)}function KB(e){return e&&((e[0]==='"'&&e[e.length-1]==='"'||e[0]==="'"&&e[e.length-1]==="'")&&(e=e.slice(1,-1)),Fr(e).trim())}var Eu={};et(Eu,{parseMediaList:()=>Pg});function XB(e,t=0){let a=[{mode:"normal",character:null}],n=[],o=0,i="",r=null,s=null,l=t,c=e;e[0]==="("&&e[e.length-1]===")"&&(c=e.substring(1,e.length-1),l++);for(let u=0;u<c.length;u++){let d=c[u];if((d==="'"||d==='"')&&(a[o].isCalculationEnabled===!0?(a.push({mode:"string",isCalculationEnabled:!1,character:d}),o++):a[o].mode==="string"&&a[o].character===d&&c[u-1]!=="\\"&&(a.pop(),o--)),d==="{"?(a.push({mode:"interpolation",isCalculationEnabled:!0}),o++):d==="}"&&(a.pop(),o--),a[o].mode==="normal"&&d===":"){let h=c.substring(u+1);s={type:"value",before:/^(\s*)/.exec(h)[1],after:/(\s*)$/.exec(h)[1],value:h.trim()},s.sourceIndex=s.before.length+u+1+l,r={type:"colon",sourceIndex:u+l,after:s.before,value:":"};break}i+=d}return i={type:"media-feature",before:/^(\s*)/.exec(i)[1],after:/(\s*)$/.exec(i)[1],value:i.trim()},i.sourceIndex=i.before.length+l,n.push(i),r!==null&&(r.before=i.after,n.push(r)),s!==null&&n.push(s),n}function oC(e,t=0){let a=[],n=0,o=!1,i;function r(){return{before:"",after:"",value:""}}i=r();for(let s=0;s<e.length;s++){let l=e[s];o?(i.value+=l,(l==="{"||l==="(")&&n++,(l===")"||l==="}")&&n--):l.search(/\s/)!==-1?i.before+=l:(l==="("&&(i.type="media-feature-expression",n++),i.value=l,i.sourceIndex=t+s,o=!0),o&&n===0&&(l===")"||s===e.length-1||e[s+1].search(/\s/)!==-1)&&(["not","only","and"].indexOf(i.value)!==-1&&(i.type="keyword"),i.type==="media-feature-expression"&&(i.nodes=XB(i.value,i.sourceIndex)),a.push(Array.isArray(i.nodes)?new Lo(i):new ku(i)),i=r(),o=!1)}for(let s=0;s<a.length;s++)if(i=a[s],s>0&&(a[s-1].after=i.before),i.type===void 0){if(s>0){if(a[s-1].type==="media-feature-expression"){i.type="keyword";continue}if(a[s-1].value==="not"||a[s-1].value==="only"){i.type="media-type";continue}if(a[s-1].value==="and"){i.type="media-feature-expression";continue}a[s-1].type==="media-type"&&(a[s+1]?i.type=a[s+1].type==="media-feature-expression"?"keyword":"media-feature-expression":i.type="media-feature-expression")}if(s===0){if(!a[s+1]){i.type="media-type";continue}if(a[s+1]&&(a[s+1].type==="media-feature-expression"||a[s+1].type==="keyword")){i.type="media-type";continue}if(a[s+2]){if(a[s+2].type==="media-feature-expression"){i.type="media-type",a[s+1].type="keyword";continue}if(a[s+2].type==="keyword"){i.type="keyword",a[s+1].type="media-type";continue}}if(a[s+3]&&a[s+3].type==="media-feature-expression"){i.type="keyword",a[s+1].type="media-type",a[s+2].type="keyword";continue}}}return a}function Pg(e){let t=[],a=0,n=0,o=/^(\s*)url\s*\(/.exec(e);if(o!==null){let s=o[0].length,l=1;for(;l>0;){let c=e[s];c==="("&&l++,c===")"&&l--,s++}t.unshift(new ku({type:"url",value:e.substring(0,s).trim(),sourceIndex:o[1].length,before:o[1],after:/^(\s*)/.exec(e.substring(s))[1]})),a=s}for(let s=a;s<e.length;s++){let l=e[s];if(l==="("&&n++,l===")"&&n--,n===0&&l===","){let c=e.substring(a,s),u=/^(\s*)/.exec(c)[1];t.push(new Lo({type:"media-query",value:c.trim(),sourceIndex:a+u.length,nodes:oC(c,a),before:u,after:/(\s*)$/.exec(c)[1]})),a=s+1}}let i=e.substring(a),r=/^(\s*)/.exec(i)[1];return t.push(new Lo({type:"media-query",value:i.trim(),sourceIndex:a+r.length,nodes:oC(i,a),before:r,after:/(\s*)$/.exec(i)[1]})),t}function Lo(e){this.constructor(e),this.nodes=e.nodes,this.after===void 0&&(this.after=this.nodes.length>0?this.nodes[this.nodes.length-1].after:""),this.before===void 0&&(this.before=this.nodes.length>0?this.nodes[0].before:""),this.sourceIndex===void 0&&(this.sourceIndex=this.before.length),this.nodes.forEach(t=>{t.parent=this})}Lo.prototype=Object.create(ku.prototype);Lo.constructor=ku;Lo.prototype.walk=function(t,a){let n=typeof t=="string"||t instanceof RegExp,o=n?a:t,i=typeof t=="string"?new RegExp(t):t;for(let r=0;r<this.nodes.length;r++){let s=this.nodes[r];if((n?i.test(s.type):!0)&&o&&o(s,r,this.nodes)===!1||s.nodes&&s.walk(t,a)===!1)return!1}return!0};Lo.prototype.each=function(t=()=>{}){for(let a=0;a<this.nodes.length;a++){let n=this.nodes[a];if(t(n,a,this.nodes)===!1)return!1}return!0};function ku(e){this.after=e.after,this.before=e.before,this.type=e.type,this.value=e.value,this.sourceIndex=e.sourceIndex}var Ra,iC,rC,vs;Ra={},Ra.removeLeadingAndTrailingHTTPWhitespace=e=>e.replace(/^[ \t\n\r]+/,"").replace(/[ \t\n\r]+$/,""),Ra.removeTrailingHTTPWhitespace=e=>e.replace(/[ \t\n\r]+$/,""),Ra.isHTTPWhitespaceChar=e=>e===" "||e==="	"||e===`
`||e==="\r",Ra.solelyContainsHTTPTokenCodePoints=e=>/^[-!#$%&'*+.^_`|~A-Za-z0-9]*$/.test(e),Ra.soleyContainsHTTPQuotedStringTokenCodePoints=e=>/^[\t\u0020-\u007E\u0080-\u00FF]*$/.test(e),Ra.asciiLowercase=e=>e.replace(/[A-Z]/g,t=>t.toLowerCase()),Ra.collectAnHTTPQuotedString=(e,t)=>{let a="";for(t++;;){for(;t<e.length&&e[t]!=='"'&&e[t]!=="\\";)a+=e[t],++t;if(t>=e.length)break;let n=e[t];if(++t,n==="\\"){if(t>=e.length){a+="\\";break}a+=e[t],++t}else break}return[a,t]};{let{solelyContainsHTTPTokenCodePoints:e}=Ra;rC=t=>{let a=`${t.type}/${t.subtype}`;if(t.parameters.size===0)return a;for(let[n,o]of t.parameters)a+=";",a+=n,a+="=",(!e(o)||o.length===0)&&(o=o.replace(/(["\\])/g,"\\$1"),o=`"${o}"`),a+=o;return a}}{let{removeLeadingAndTrailingHTTPWhitespace:e,removeTrailingHTTPWhitespace:t,isHTTPWhitespaceChar:a,solelyContainsHTTPTokenCodePoints:n,soleyContainsHTTPQuotedStringTokenCodePoints:o,asciiLowercase:i,collectAnHTTPQuotedString:r}=Ra;iC=s=>{s=e(s);let l=0,c="";for(;l<s.length&&s[l]!=="/";)c+=s[l],++l;if(c.length===0||!n(c)||l>=s.length)return null;++l;let u="";for(;l<s.length&&s[l]!==";";)u+=s[l],++l;if(u=t(u),u.length===0||!n(u))return null;let d={type:i(c),subtype:i(u),parameters:new Map};for(;l<s.length;){for(++l;a(s[l]);)++l;let h="";for(;l<s.length&&s[l]!==";"&&s[l]!=="=";)h+=s[l],++l;if(h=i(h),l<s.length){if(s[l]===";")continue;++l}let m=null;if(s[l]==='"')for([m,l]=r(s,l);l<s.length&&s[l]!==";";)++l;else{for(m="";l<s.length&&s[l]!==";";)m+=s[l],++l;if(m=t(m),m==="")continue}h.length>0&&n(h)&&o(m)&&!d.parameters.has(h)&&d.parameters.set(h,m)}return d}}{let e=iC,t=rC,{asciiLowercase:a,solelyContainsHTTPTokenCodePoints:n,soleyContainsHTTPQuotedStringTokenCodePoints:o}=Ra;vs=class{constructor(s){s=String(s);let l=e(s);if(l===null)throw new Error(`Could not parse MIME type string "${s}"`);this._type=l.type,this._subtype=l.subtype,this._parameters=new i(l.parameters)}static parse(s){try{return new this(s)}catch{return null}}get essence(){return`${this.type}/${this.subtype}`}get type(){return this._type}set type(s){if(s=a(String(s)),s.length===0)throw new Error("Invalid type: must be a non-empty string");if(!n(s))throw new Error(`Invalid type ${s}: must contain only HTTP token code points`);this._type=s}get subtype(){return this._subtype}set subtype(s){if(s=a(String(s)),s.length===0)throw new Error("Invalid subtype: must be a non-empty string");if(!n(s))throw new Error(`Invalid subtype ${s}: must contain only HTTP token code points`);this._subtype=s}get parameters(){return this._parameters}toString(){return t(this)}isJavaScript({allowParameters:s=!1}={}){switch(this._type){case"text":switch(this._subtype){case"ecmascript":case"javascript":case"javascript1.0":case"javascript1.1":case"javascript1.2":case"javascript1.3":case"javascript1.4":case"javascript1.5":case"jscript":case"livescript":case"x-ecmascript":case"x-javascript":return s||this._parameters.size===0;default:return!1}case"application":switch(this._subtype){case"ecmascript":case"javascript":case"x-ecmascript":case"x-javascript":return s||this._parameters.size===0;default:return!1}default:return!1}}isXML(){return this._subtype==="xml"&&(this._type==="text"||this._type==="application")||this._subtype.endsWith("+xml")}isHTML(){return this._subtype==="html"&&this._type==="text"}};class i{constructor(s){this._map=s}get size(){return this._map.size}get(s){return s=a(String(s)),this._map.get(s)}has(s){return s=a(String(s)),this._map.has(s)}set(s,l){if(s=a(String(s)),l=String(l),!n(s))throw new Error(`Invalid MIME type parameter name "${s}": only HTTP token code points are valid.`);if(!o(l))throw new Error(`Invalid MIME type parameter value "${l}": only HTTP quoted-string token code points are valid.`);return this._map.set(s,l)}clear(){this._map.clear()}delete(s){return s=a(String(s)),this._map.delete(s)}forEach(s,l){this._map.forEach(s,l)}keys(){return this._map.keys()}values(){return this._map.values()}entries(){return this._map.entries()}[Symbol.iterator](){return this._map[Symbol.iterator]()}}}var Fu={};et(Fu,{cssRulesMinifier:()=>Ms,fontsMinifier:()=>Ts,htmlMinifier:()=>Us,imagesAltMinifier:()=>Fs,mediasAltMinifier:()=>Cs,serializer:()=>Bs,templateFormatter:()=>Wi});var Ts={};et(Ts,{process:()=>p3});var ZB=/\\(?:([0-9a-fA-F]{1,6})(?:\r\n|[ \n\r\t\f])?|([^\n\r\f]))/g;function yn(e){return e.indexOf("\\")===-1?e:e.replace(ZB,(t,a,n)=>{if(a===void 0)return n;let o=parseInt(a,16);return o===0||o>1114111||o>=55296&&o<=57343?"\uFFFD":String.fromCodePoint(o)})}function _e(e){return typeof e=="string"?yn(e).toLowerCase():e}var $B="Rule",JB="Atrule",QB=["font-face","keyframes"],e3=/^-[^-]+-/;function kn(e){if(e.block&&e.block.children){if(e.type==$B)return e.block.children;if(e.type==JB&&typeof e.name=="string"&&!QB.includes(_e(e.name).replace(e3,"")))return e.block.children}}var gt={normalizeFontFamily:So,flatten:Ai,getFontWeight:zn,getFontStretch:Si,getStylesheetsInCascadeOrder:ts,removeQuotes:vi},t3=["media","supports","layer","container"],a3=["font-stretch","font-width"],sC=["fontStretch","legacyFontStretch"],fC=/\s*,\s*/,wC=/\s+/g,n3=/^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(deg|grad|rad|turn)?$/,o3={deg:1,grad:.9,rad:180/Math.PI,turn:360},i3="normal",r3="italic",s3="oblique",sa=14,Bg=100,Hg=400,Ss=500,lC=1e3,Ui=100,Su=200,cC=700,Fg=600,l3=100,c3=[{getStretchDistance:hC,getStyleDistance:CC,getWeightDistance:mC},{getStretchDistance:hC,getStyleDistance:S3,getWeightDistance:mC},{getStretchDistance:A3,getStyleDistance:T3,getWeightDistance:C3}],bC=/-/,Au=/\?/g,u3=/^U\+/i,d3=/var\(\s*(--[^\s,)]+)\s*(?:,[^)]*)?\)/g,yC=/^var\(\s*(--[^\s,)]+)\s*(?:,(.*))?\)$/,h3=/^--/,kC=[9,10,12,13],uC=13,m3="var(--)";function p3(e,t,a,n){let o={rules:{processed:0,discarded:0},fonts:{processed:0,discarded:0}},i={declared:[],used:[]},r=new Map,s=e.createElement("style"),l="";e.body.appendChild(s),t.forEach(f=>{f.stylesheet&&f.stylesheet.children&&Gg(f.stylesheet.children,r)}),a.forEach(f=>SC(f.children,r)),n=Object.assign({},n,{customProperties:r}),gt.getStylesheetsInCascadeOrder(t).forEach(({stylesheetInfo:f})=>{if(f.stylesheet){let b=f.stylesheet.children;b&&(o.processed+=b.size,o.discarded+=b.size,EC(b,i,n),l=NC(e,b,s,l))}}),a.forEach(f=>{let b=IC(f,n);b.length&&i.used.push(b),l=OC(f.children,s,l)}),s.remove(),l+=e.body.innerText,i.used=i.used.map(f=>f.map(b=>TC(b,n))),i.used=i.used.map(f=>gt.flatten(f));let c=i.used.find(f=>f.find(b=>b.match(/^var\(--/))),u=!n.usedFonts||!n.usedFonts.length,d,h,m;u?d=[]:(h=new Map,i.used.forEach(f=>f.forEach(b=>dC(b,i,h,n))),c&&i.declared.forEach(f=>dC(f.fontFamily,i,h,n)),d=i.declared.filter(f=>!h.has(f.fontFamily)),m=E3(i.declared,h));let p=w3(n),g=new Set;for(let f of l)g.add(f.codePointAt(0));p.forEach(f=>f.forEach(b=>b.ranges.forEach(([y,E])=>{for(let k=y;k<=E;k++)kC.includes(k)||g.add(k)})));let w=Array.from(g).sort((f,b)=>f-b);return t.forEach(f=>{if(f.stylesheet){let b=f.stylesheet.children;b&&(Vg(b,i.declared,d,m,w,p),o.rules.discarded-=b.size)}}),o}function dC(e,t,a,n){if(t.declared.find(o=>o.fontFamily==e)){let o=n.usedFonts.filter(i=>i[0]==e);o.length&&a.set(e,o)}}function EC(e,t,a,n=!0){e.forEach(o=>{if(o.type=="Atrule"&&o.name=="font-face"){if(n){let i=gt.normalizeFontFamily(En(o.block.children,"font-family"));if(i){let r=En(o.block.children,"font-weight")||"400",s=En(o.block.children,"font-style")||"normal",l=En(o.block.children,"font-variant")||"normal",c=En(o.block.children,a3)||"normal",u=En(o.block.children,"font-stretch")||"normal",d=En(o.block.children,"unicode-range");r.split(",").forEach(h=>t.declared.push({fontFamily:i,fontWeight:gt.getFontWeight(gt.removeQuotes(h)),fontStyle:s,fontVariant:l,fontStretch:c,legacyFontStretch:u,unicodeRange:d,ruleData:o}))}}}else{let i=kn(o);if(i){let r=IC(o.block,a);r.length&&t.used.push(r),EC(i,t,a,n&&vC(o))}}})}function vC(e){return e.type=="Atrule"&&typeof e.name=="string"&&t3.includes(_e(e.name))}function Gg(e,t){e.forEach(a=>{if(a.type=="Atrule"&&a.name=="import"&&a.prelude&&a.prelude.children&&a.prelude.children.head.data.importedChildren)Gg(a.prelude.children.head.data.importedChildren,t);else{let n=kn(a);n&&(SC(n,t),Gg(n,t))}})}function SC(e,t){e&&e.forEach(a=>{if(a.property&&a.property.match(h3))try{let n=ge(a.value).trim();if(n){let o=t.get(a.property);o||(o=new Set,t.set(a.property,o)),o.add(n)}}catch{}})}function AC(e,t){let a=new Set;if(globalThis.getComputedStyle&&t.doc){let o=globalThis.getComputedStyle(t.doc.body).getPropertyValue(e);o&&o.trim()&&a.add(o.trim())}let n=t.customProperties&&t.customProperties.get(e);if(n&&n.forEach(o=>a.add(o)),a.size)return Array.from(a)}function TC(e,t,a=new Set){let n=e.match(yC);if(n){let o=n[1],i=n[2];if(!a.has(o)){let r=new Set(a);r.add(o);let s=AC(o,t);if(s){let l=gt.flatten(s.map(u=>Wg(u,t,r))),c=i?Wg(i,t,r):[];if(!l.concat(c).some(g3))return l.concat(c)}}}return e}function g3(e){return typeof e=="string"&&e.startsWith("var(")}function Wg(e,t,a){let n=f3(e).map(o=>qg(o)).filter(o=>o);return t?gt.flatten(n.map(o=>TC(o,t,a))):n}function f3(e){let t=[],a=0,n,o=0;for(let i=0;i<e.length;i++){let r=e.charAt(i);n?r==n&&e.charAt(i-1)!="\\"&&(n=null):r=='"'||r=="'"?n=r:r=="("?a++:r==")"?a--:r==","&&!a&&(t.push(e.substring(o,i)),o=i+1)}return t.push(e.substring(o)),t}function Vg(e,t,a,n,o,i){let r=[];for(let s=e.head;s;s=s.next){let l=s.data;if(l.type=="Atrule"&&l.name=="import"&&l.prelude&&l.prelude.children&&l.prelude.children.head.data.importedChildren)Vg(l.prelude.children.head.data.importedChildren,t,a,n,o,i);else if(vC(l)&&l.block&&l.block.children)Vg(l.block.children,t,a,n,o,i);else if(l.type=="Atrule"&&l.name=="font-face"){let c=gt.normalizeFontFamily(En(l.block.children,"font-family"));if(c){let d=En(l.block.children,"unicode-range"),h=L3(t,l);(a.find(m=>m.fontFamily==c)||!x3(o,d)||!I3(o,d,h)||!b3(l,c,d,i,n)||!k3(l,c,n))&&r.push(s)}let u=[];for(let d=l.block.children.head;d;d=d.next)d.data.property=="font-display"&&u.push(d);u.length&&u.forEach(d=>l.block.children.remove(d))}}r.forEach(s=>e.remove(s))}function w3(e){let t=new Map;return e.usedFontsCharacters&&e.usedFontsCharacters.length&&e.usedFontsCharacters.forEach(([a,n,o,i])=>{let r=t.get(a);r||(r=[],t.set(a,r)),r.push({fontStyle:n,ranges:o||[],unknown:!!i})}),t}function b3(e,t,a,n,o){if(!a||!n||!n.size)return!0;let i=n.get(t);if(!i||!i.length)return!0;let r=o&&o.get(t);if(!r||!r.candidates.has(e)||i.find(c=>!r.rulesByStyle.has(c.fontStyle)))return!0;let s=i.filter(c=>r.rulesByStyle.get(c.fontStyle).has(e));if(!s.length||s.find(c=>c.unknown)||!s.find(c=>c.ranges.length))return!0;let l=Yg(a);return l.length?!!s.find(c=>c.ranges.find(u=>l.find(d=>y3(u,d)))):!0}function y3(e,t){let a=Math.max(e[0],t[0]),n=Math.min(e[1],t[1]);if(a>n)return!1;if(a>uC||n>uC)return!0;for(let o=a;o<=n;o++)if(!kC.includes(o))return!0;return!1}function k3(e,t,a){let n=a&&a.get(t);return!n||!n.candidates.has(e)||n.rules.has(e)}function E3(e,t){let a=new Map;return t.forEach((n,o)=>{let i=e.filter(c=>c.fontFamily==o),s=(i.some(c=>c.legacyFontStretch!=c.fontStretch)?sC:sC.slice(0,1)).map(c=>i.map(u=>({ruleData:u.ruleData,weight:RC(u.fontWeight),style:xC(u.fontStyle),stretch:_C(u[c])})).filter(u=>u.weight&&u.style&&u.stretch)),l={candidates:new Set(gt.flatten(s).map(c=>c.ruleData)),rules:new Set,rulesByStyle:new Map};n.forEach(([,c,u,,d])=>{let h=l.rulesByStyle.get(u);h||(h=new Set,l.rulesByStyle.set(u,h)),s.forEach(m=>c3.forEach(p=>v3(m,c,u,d,p).forEach(g=>{h.add(g.ruleData),l.rules.add(g.ruleData)})))}),a.set(o,l)}),a}function v3(e,t,a,n,o){let i=Ug(e.map(d=>d.stretch)),r=Ug(e.map(d=>d.style.range)),s=Ug(e.map(d=>d.weight)),l=n&&_C(n);e.length&&l&&l[0]==l[1]&&(e=zg(e,d=>d.stretch,d=>o.getStretchDistance(d.stretch,l[0],i)));let c=a&&xC(a);e.length&&c&&c.range[0]==c.range[1]&&(e=zg(e,d=>d.style.range,d=>o.getStyleDistance(d.style,c,r)));let u=t&&RC(String(t));return e.length&&u&&u[0]==u[1]&&(e=zg(e,d=>d.weight,d=>o.getWeightDistance(d.weight,u[0],s))),e}function zg(e,t,a){let n=e.map(a),o=Math.min(...n.map(r=>r.distance)),i=n.filter(r=>r.distance==o&&r.value!==void 0).map(r=>r.value);return e.filter((r,s)=>n[s].distance==o||i.some(l=>As(t(r),l)))}function Ug(e){return[Math.min(...e.map(([t])=>t)),Math.max(...e.map(([,t])=>t))]}function hC([e,t],a,[n,o]){return As([e,t],a)?{distance:0,value:a}:a>Bg?e>a?{distance:e-a,value:e}:{distance:Math.max(a,o)-t,value:t}:t<a?{distance:a-t,value:t}:{distance:e-Math.min(a,n),value:e}}function CC({range:[e,t]},{range:[a]},[n,o]){return As([e,t],a)?{distance:0,value:a}:a>=sa?e>a?{distance:e-a,value:e}:{distance:Math.max(a,o)-t,value:t}:a>=0?t>=0&&t<a?{distance:a-t,value:t}:e>a?{distance:e,value:e}:{distance:Math.max(a,o)-t,value:t}:a>-sa?e>a&&e<=0?{distance:e-a,value:e}:t<a?{distance:-t,value:t}:{distance:e-Math.min(a,n),value:e}:t<a?{distance:a-t,value:t}:{distance:e-Math.min(a,n),value:e}}function S3(e,t,a){return e.italic&&!t.italic?{distance:1/0}:CC(e,t,a)}function mC([e,t],a,[n,o]){return As([e,t],a)?{distance:0,value:a}:a>=Hg&&a<=Ss?e>a&&e<=Ss?{distance:e-a,value:e}:t<a?{distance:Ss-t,value:t}:{distance:e-Math.min(a,n),value:e}:a<Hg?t<a?{distance:a-t,value:t}:{distance:e-Math.min(a,n),value:e}:e>a?{distance:e-a,value:e}:{distance:Math.max(a,o)-t,value:t}}function A3([e,t],a){return a<e?{distance:e-a+(a>Bg?0:lC)}:a>t?{distance:a-t+(a<=Bg?0:lC)}:{distance:0}}function T3({italic:e,range:[t,a]},n){let[o]=n.range;if(e?n.italic:!n.italic&&(o==t||o==a))return{distance:0};if(!n.italic&&o==0)return e?{distance:cC}:t>=0?{distance:t}:{distance:a>=0?0:Su-a};if(n.italic)return t>=sa?{distance:t-sa+1}:a>=sa?{distance:1}:{distance:(a>0?Ui:Ui+Su)+sa-a};if(e)return{distance:cC};if(o>=sa||o<=-sa){let i=Math.sign(o),[r,s]=i>0?[t,a]:[-a,-t],l=i*o;return r>=l?{distance:r-l}:s>=l?{distance:0}:{distance:(s>0?Ui:Ui+Su)+l-s}}else{let i=o>0?1:-1,[r,s]=i>0?[t,a]:[-a,-t],l=i*o;return r>l?{distance:Ui+r-l}:s>=l?{distance:0}:{distance:(s>0?0:Ui+Su)+l-s}}}function C3([e,t],a){return As([e,t],a)?{distance:0}:a<Hg?{distance:t<a?a-t:e-a+Fg}:a>Ss?{distance:e>a?e-a:a-t+Fg}:e>a?{distance:e-a+(e<=Ss?0:Fg)}:{distance:a-t+l3}}function As([e,t],a){return e<=a&&a<=t}function RC(e){return Kg(e,t=>Number(gt.getFontWeight(t)))}function _C(e){return Kg(e,t=>(t=gt.getFontStretch(t.toLowerCase()),t.endsWith("%")?Number(t.slice(0,-1)):NaN))}function xC(e){let t=String(e).trim().toLowerCase().split(wC);if(t.length==1&&t[0]==i3)return{italic:!1,range:[0,0]};if(t.length==1&&t[0]==r3)return{italic:!0,range:[sa,sa]};if(t[0]==s3){let a=t.length==1?[sa,sa]:Kg(t.slice(1).join(" "),R3);if(a)return{italic:!1,range:a}}}function R3(e){let t=e.match(n3);return t&&(t[2]||Number(t[1])==0)?Number(t[1])*o3[t[2]||"deg"]:NaN}function Kg(e,t){let a=String(e).trim().split(wC).map(t);if(a.length&&a.length<=2&&a.every(Number.isFinite))return[Math.min(...a),Math.max(...a)]}function En(e,t){let a=LC(e,t);if(a!==void 0)return a.toLowerCase()}function LC(e,t){let a=Array.isArray(t)?t:[t],n;if(e&&(n=e.filter(o=>a.includes(o.property)).tail),n)try{return gt.removeQuotes(ge(n.data.value))}catch{}}function IC(e,t){let a=e.children.filter(i=>i.property=="font-family").tail,n=[];a&&(a.data.value.children?jC(a.data.value,n):(a=ge(a.data.value),a&&n.push(qg(a))));let o=e.children.filter(i=>i.property=="font").tail;if(o&&o.data&&o.data.value){let i=ge(o.data.value);try{let r=o.data.value,s=_3(i,t);s!=i&&(r=Ve(s,{context:"value"})),Mg(r).family.forEach(c=>n.push(qg(c)))}catch{i.includes("var(")&&n.push(m3)}}return n}function _3(e,t){return e.replace(d3,(a,n)=>{let o=AC(n,t);return o&&o.length==1?o[0]:a})}function qg(e=""){return e.match(yC)?e.trim():gt.normalizeFontFamily(e)}function jC(e,t){let a=e.children.head;for(;a;)if(a.data.type=="Identifier"){let n=a.data.name,o=a.next;for(;o&&o.data.type=="Identifier";)n+=" "+o.data.name,o=o.next;t.push(gt.normalizeFontFamily(n)),a=o}else if(a.data.type=="Function"&&a.data.name=="var"&&a.data.children){let n=a.data.children.head.data.name;t.push("var("+n+")");let o=a.data.children.head.next;for(;o&&o.data.type=="Operator"&&o.data.value==",";)o=o.next;let i=o;i&&(i.data.children?jC(i.data,t):Wg(String(i.data.value)).forEach(r=>t.push(r))),a=a.next}else a.data.type=="String"?(t.push(gt.normalizeFontFamily(a.data.value)),a=a.next):(a.data.type=="Number"&&t.push(gt.normalizeFontFamily(String(a.data.value))),a=a.next)}function NC(e,t,a,n){return t.forEach(o=>{let i=kn(o);i&&(n=OC(i,a,n),n=NC(e,i,a,n))}),n}function OC(e,t,a){let n=pC(e,"content",t),o=pC(e,"quotes",t);return a.includes(n)||(a+=n),a.includes(o)||(a+=o),a}function pC(e,t,a){let n=LC(e,t)||"";return n?(a.textContent='tmp { content:"'+n+'"}',a.sheet&&a.sheet.cssRules?gt.removeQuotes(a.sheet.cssRules[0].style.getPropertyValue("content")):n):""}function x3(e,t){if(t){let a=t.split(fC),n=a.filter(o=>{let i=o.split(bC);if(i.length==2)i[0]=Wa(i[0]),i[1]=Wa(i[1]);else if(i.length==1)if(i[0].includes("?")){let r=i[0],s=r;i[0]=Wa(r.replace(Au,"0")),i[1]=Wa(s.replace(Au,"F"))}else i[0]&&(i[0]=i[1]=Wa(i[0]));if(!i[0]||e.find(r=>r>=i[0]&&r<=i[1]))return!0});return!!(!a.length||n.length)}return!0}function L3(e,t){let a=e.findIndex(l=>l.ruleData==t);if(a==-1)return[];let{fontFamily:n,fontWeight:o,fontStyle:i,fontStretch:r,legacyFontStretch:s}=e[a];return e.slice(a+1).filter(l=>l.ruleData!=t&&l.fontFamily==n&&l.fontWeight==o&&l.fontStyle==i&&l.fontStretch==r&&l.legacyFontStretch==s).map(l=>l.unicodeRange)}function I3(e,t,a){if(!a.length)return!0;let n=gt.flatten(a.map(i=>Yg(i)));if(!n.length)return!0;let o=Yg(t);return!!e.find(i=>(!o.length||o.find(r=>gC(i,r)))&&!n.find(r=>gC(i,r)))}function gC(e,t){return e>=t[0]&&e<=t[1]}function Yg(e){let t=[];return e&&e.split(fC).forEach(a=>{let n=a.split(bC),o,i;n.length==2?(o=Wa(n[0]),i=Wa(n[1])):n.length==1&&n[0]&&(n[0].includes("?")?(o=Wa(n[0].replace(Au,"0")),i=Wa(n[0].replace(Au,"F"))):o=i=Wa(n[0])),Number.isInteger(o)&&Number.isInteger(i)&&t.push([o,i])}),t}function Wa(e){return e=e.replace(u3,""),parseInt(e,16)}var Cs={};et(Cs,{process:()=>M3});function DC(e){return Pg(e)}function Xg(e){if(!e||!e.nodes)return!1;for(let t of e.nodes)if(t&&t.type==="keyword"&&t.value&&t.value.toLowerCase()==="not")return!0;return!1}function j3(e,t){for(let a=t-1;a>=0;a--){let n=e.nodes[a];if(n){if(n.type==="operator"&&n.value===",")break;if(n.type==="keyword"&&n.value&&n.value.toLowerCase()==="not")return!0}}return!1}function Zg(e,t=[]){for(let a=0;a<e.nodes.length;a++){let n=e.nodes[a];if(n.type=="media-query"){Zg(n,t);continue}if(n.type=="media-type"){let o=j3(e,a);t.push({not:o,value:n.value})}}return t}function MC(e){if(!e||!e.nodes)return!1;for(let t of e.nodes)if(t&&(t.type==="media-feature-expression"||t.type==="keyword"&&t.value&&t.value.toLowerCase()==="and"))return!0;return!!Xg(e)}var N3={flatten:Ai},$g="all",O3="screen",D3="print";function M3(e,{keepPrintStyleSheets:t}={}){let a={processed:0,discarded:0};return e.forEach((n,o)=>{n.stylesheet&&(PC(n.mediaText||$g,t)&&n.stylesheet.children?Jg(n.stylesheet.children,a,t).forEach(({cssRules:r,cssRule:s})=>r.remove(s)):(e.delete(o),o.element&&o.element.remove()))}),a}function Jg(e,t,a,n=[]){for(let o=e.head;o;o=o.next){let i=o.data;i.type=="Atrule"&&i.name=="media"&&i.block&&i.block.children&&i.prelude&&i.prelude.children?(t.processed++,PC(ge(i.prelude),a)?Jg(i.block.children,t,a,n):(n.push({cssRules:e,cssRule:o}),t.discarded++)):kn(i)&&Jg(i.block.children,t,a,n)}return n}function PC(e,t){let a;try{a=DC(e);for(let o of a)if(!(!o||!o.nodes)&&(MC(o)||Xg(o)))return!0}catch{return!0}let n=N3.flatten(a.filter(o=>o&&o.nodes).map(o=>Zg(o)));return(!n||!n.length)&&(n=[{not:!1,value:$g}]),n.some(o=>!o.not&&(o.value==O3||o.value==$g||t&&o.value==D3))}var Ms={};et(Ms,{VALIDITY_INVALID:()=>Lu,VALIDITY_UNKNOWN:()=>_s,VALIDITY_VALID:()=>Io,getValueValidity:()=>rR,isUnsupportedPropertyValue:()=>C4,process:()=>R4});var Tu=new Set(["after","before","first-letter","first-line"]),P3=new Set(["host","host-context"]),F3=new Set(["slotted"]);function Cu(e,t={a:0,b:0,c:0}){if(!e||!e.type)return t;switch(e.type){case"Selector":Rs(e.children,a=>Cu(a,t));break;case"IdSelector":t.a++;break;case"ClassSelector":t.b++;break;case"AttributeSelector":t.b++;break;case"TypeSelector":e.name!=="*"&&t.c++;break;case"PseudoElementSelector":t.c++,F3.has(_e(e.name))&&FC(t,e);break;case"PseudoClassSelector":{let a=_e(e.name);if(a==="where")break;if(Tu.has(a)){t.c++;break}if(P3.has(a)){t.b++,FC(t,e);break}if(a==="is"||a==="not"||a==="has"){Rs(e.children,n=>{n.type==="SelectorList"&&Qg(t,zC(n))});break}if(a==="nth-child"||a==="nth-last-child"){t.b++,Rs(e.children,n=>{n.type==="Nth"&&n.selector&&Qg(t,zC(n.selector))});break}t.b++;break}case"Combinator":case"Raw":break}return t}function FC(e,t){Rs(t.children,a=>{a.type==="Selector"&&Qg(e,Cu(a,{a:0,b:0,c:0}))})}function Qg(e,t){e.a+=t.a,e.b+=t.b,e.c+=t.c}function Rs(e,t){if(!e)return;let a=e.head;for(;a;)t(a.data),a=a.next}function zC(e){let t={a:0,b:0,c:0};return Rs(e.children,a=>{let n=Cu(a,{a:0,b:0,c:0});(n.a>t.a||n.a===t.a&&n.b>t.b||n.a===t.a&&n.b===t.b&&n.c>t.c)&&(t=n)}),t}function UC(e){let t={a:0,b:0,c:0},a=[];return ra(e,{enter(n){if(a.push(n),n.type==="Selector"){if(a.some(r=>r.type==="PseudoClassSelector"&&r.name.toLowerCase()==="where"))return;let i=Cu(n);(i.a>t.a||i.a===t.a&&i.b>t.b||i.a===t.a&&i.b===t.b&&i.c>t.c)&&(t=i)}},leave(){a.pop()}}),t}var z3=new Set(["after","before","first-letter","first-line","placeholder","selection","part","marker"]);function HC(e){if(!e)return{include:[],exclude:[]};let t=U3(e);if(!t)return{include:[],exclude:[]};let a=BC(t.root),n=BC(t.limit);function o(i){let r=!1;return ra(i,{visit:"PseudoElementSelector",enter(){r=!0}}),r||ra(i,{visit:"PseudoClassSelector",enter(s){let l=(s.name||"").toLowerCase();z3.has(l)&&(r=!0)}}),r}for(let i of a)if(o(i.data))throw new Error("Pseudo-elements are not allowed in @scope prelude (scope-start)");for(let i of n)if(o(i.data))throw new Error("Pseudo-elements are not allowed in @scope prelude (scope-end)");return{include:a,exclude:n}}function U3(e){if(!e||!e.children)return null;for(let t=e.children.head;t;t=t.next)if(t.data&&t.data.type==="Scope")return t.data;return null}function BC(e){if(!e||!e.children)return[];let t=[];for(let a=e.children.head;a;a=a.next){let n=a.data;t.push({data:n,text:ge(n)})}return t}var B3=["root","scope","empty","first-child","last-child","only-child","first-of-type","last-of-type","only-of-type"],H3=["nth-child","nth-last-child","heading","nth-of-type","nth-last-of-type"],G3=["not","is","where","has"],W3=["is","where"],V3=["open"];function Ru(e,t){if(t.normalizedSelectorText||(t.normalizedSelectorText=new WeakMap),t.normalizedSelectorText.has(e))return t.normalizedSelectorText.get(e);let a=q3(e.data);ef(a);let n=ge(a);return(!n||!n.trim())&&(n="*"),t.normalizedSelectorText.set(e,n),n}function q3(e){return e.children?Yn(e):Ve(ge(e),{context:"selectorList"})}function ef(e){let t=e.children.head;for(;t;){let a=t.next,n=t.data;n.type==="NestingSelector"?e.children.replace(t,Ve(":scope",{context:"selector"}).children.head):n.type==="TypeSelector"&&typeof n.name=="string"&&n.name.includes("|")?n.name=n.name.substring(n.name.lastIndexOf("|")+1):n.type==="PseudoElementSelector"?e.children.remove(t):n.type==="PseudoClassSelector"?af(n)?GC(e.children,t):n.children&&W3.includes(n.name.toLowerCase())&&ef(n.children.head.data):n.type==="AttributeSelector"?tf(n)&&GC(e.children,t):n.type==="Selector"&&ef(n),t=a}}function GC(e,t){t.prev==null||t.prev.data.type=="Combinator"||t.prev.data.type=="WhiteSpace"?e.replace(t,Ve("*",{context:"selector"}).children.head):e.remove(t)}function tf(e){return!!e.name&&V3.includes(_e(e.name.name))}function af(e){return e.children?!H3.includes(e.name.toLowerCase())&&!G3.includes(e.name.toLowerCase()):!B3.includes(_e(e.name))}var Ns=!1,WC=new Set(["not","is","where","has","nth-child","nth-last-child"]),XC="media",K3="supports",X3=new Set(["container"]),Ou="Rule",vn="Atrule",Z3="NestingSelector",xu="PseudoClassSelector",$3="AttributeSelector",Kn="Declaration",Bi="Raw",J3="Value",ZC="Identifier",$C="PseudoElementSelector",Os="layer",cf="scope",Q3=new Set([Os,cf]),e4="import",JC="font-face",uf="keyframes",df="Combinator",QC="TypeSelector",t4="style",eR="selectorList",a4={context:"atrulePrelude",atrule:cf},n4="stylesheet",o4="selector",i4="declarationList",r4="SyntaxReferenceError",s4="SyntaxMatchError",hf="var",tR="Function",Io="valid",_s="unknown",Lu="invalid",mf="Failed to parse CSS",aR="Failed to match selector",pf=",",l4=":",c4=":is(",u4=")",d4=":not(*)",gf=":scope",h4="scope",nR=" ",nf="|",m4="selector(",p4=")",of="-",Hi="--",g4=/--[^\s,;:(){}'"!*+/\\]+/g,f4=".",w4="\0",Iu="|",oR="revert-rule",b4=["revert-layer",oR],y4=/(^|[^-\w])revert-(layer|rule)([^-\w]|$)/i,k4="namespace",E4="Url",v4="String",Ls=1/0,iR="{",S4="}",Is="",rf=0,sf=1,A4=/\\(?![0-9a-fA-F]{1,6}\s|[^0-9a-zA-Z])/,T4="\0",lf=null,VC=1/0;function C4(e,t){let a=Es.matchProperty(e,t);return!!(!a.matched&&a.error&&a.error.name!==r4)}function rR(e,t){let a=t.children.size===1?t.children.head.data:null,n=a&&typeof a.name=="string"?a.name:null;if(n&&A4.test(n))return Lu;if(globalThis.CSS&&globalThis.CSS.supports){let r;try{r=globalThis.CSS.supports(e,ge(t))}catch{return _s}return r?Io:_s}let o=!!(n&&n.startsWith(of));if(ot(t,r=>r.type===tR&&_e(r.name)===hf)||n&&yn(n).toLowerCase()===oR)return Io;let i;try{i=Es.matchProperty(e,t)}catch{return _s}return i.matched?Io:i.error&&i.error.name===s4&&!o&&!e.startsWith(of)?Lu:_s}function R4(e,t,a){let n={doc:e,stats:{processed:0,discarded:0,discardedCustomProperties:0},matchedElements:new Set,revertLayerElements:new Set,revertLayerRules:new WeakMap,revertLayerDeclarations:new WeakMap,hasIndeterminateRevertLayer:!1,matchedSelectors:new Map,matchingSelectors:new Map,scopeProximities:new Map,scopeProximityKeys:new Map,layerDeclarationCounter:0,anonymousLayerCounter:0,layerOrder:new Map,layerComparisons:new Map,selectorData:new Map,selectorTexts:new Map,nestingParentTexts:new Map,nestingParentNodes:new Map,scopedSelectorTexts:new Map,supportedSelectors:new Map,valueValidities:new Map,baselineValues:new Map,preludeTexts:new Map,rulesCounter:0,scopeIdCounter:0};return _4(t,n),x4(t,n),L4(n),v6(t,a,n),I4(t,n),n.stats}function _4(e,t){e.forEach((a,n)=>{!a.scoped&&a.stylesheet&&!n.urlNode&&Be(a.stylesheet)&&js(a.stylesheet.children,{layerStack:[],conditionalStack:sR(a)},t)})}function sR(e){return e.mediaText?[{name:XC,prelude:e.mediaText}]:[]}function x4(e,t){e.forEach((a,n)=>{!a.scoped&&a.stylesheet&&!n.urlNode&&Be(a.stylesheet)&&Gi(a.stylesheet.children,e,{ancestorsSelectors:[],layerStack:[],scopeStack:[],conditionalStack:sR(a),ownerElement:H4(n),hasDefaultNamespace:pR(a.stylesheet.children)},t)})}function L4(e){let t=new Set;e.matchedElements.forEach(a=>e6(a,t,e)),e.hasIndeterminateRevertLayer||A6(t,e)}function I4(e,t){e.forEach((a,n)=>{!a.scoped&&a.stylesheet&&!n.urlNode&&Be(a.stylesheet)&&_u(a.stylesheet.children,t)})}function js(e,t,a){let{layerStack:n,conditionalStack:o}=t;for(let i=e.head;i;i=i.next){let r=i.data;if(r.type===vn&&_e(r.name)===Os)j4(r,n,o,a);else if(Du(r))N4(r,t,a);else if(r.type===vn&&Be(r.block)){let s=uR(o,r,a);js(r.block.children,{layerStack:n,conditionalStack:s},a)}else r.type===Ou&&Be(r.block)&&js(r.block.children,t,a)}}function j4(e,t,a,n){if(e.block){let o=lR(e,n);ju(t,o,a,n),js(e.block.children,{layerStack:[...t,...o],conditionalStack:a},n)}else e.prelude&&kf(e.prelude,n).split(pf).forEach(o=>ju(t,ff(o),a,n))}function N4(e,t,a){let n=e.prelude.children.head.data,o=dR(t.conditionalStack,n),i=hR(e,n,a),{layerStack:r}=t;i&&(ju(r,i,o,a),r=[...r,...i]),js(n.importedChildren,{layerStack:r,conditionalStack:o},a)}function lR(e,t){return e.layerSegments||(e.layerSegments=e.prelude?ff(kf(e.prelude,t)):[cR(t)]),e.layerSegments}function ff(e){let t=e.trim(),a=[],n=Is;for(let o=0;o<t.length;o++){let i=t.charAt(o);i==="\\"&&o+1<t.length?(n+=i+t.charAt(o+1),o++):i===f4?(a.push(yn(n)),n=Is):n+=i}return a.push(yn(n)),a}function cR(e){return T4+e.anonymousLayerCounter++}function uR(e,t,a){return!Q3.has(_e(t.name))?[...e,{name:t.name,prelude:kf(t.prelude,a)}]:e}function dR(e,t){let a=[...e];return t.importedMediaText&&a.push({name:XC,prelude:t.importedMediaText}),t.importedSupportsCondition!==void 0&&a.push({name:K3,prelude:t.importedSupportsCondition}),a}function hR(e,t,a){if(t.importedLayerName!==void 0)return ff(t.importedLayerName);if(!t.anonymousLayerSegments){let n=ot(e.prelude,o=>o.type===ZC&&_e(o.name)===Os);t.anonymousLayerSegments=n?[cR(a)]:null}return t.anonymousLayerSegments}function Du(e){return e.type===vn&&_e(e.name)===e4&&Be(e.prelude)&&!!e.prelude.children.head.data.importedChildren}function ju(e,t,a,n){let o=n.layerDeclarationCounter++,i=!a.some(s=>!X3.has(_e(s.name))),r=[...e,...t];for(let s=e.length+1;s<=r.length;s++){let l=jo(r.slice(0,s)),c=n.layerOrder.get(l);c?i&&c.firstCertain===VC&&(c.firstCertain=o):n.layerOrder.set(l,{first:o,firstCertain:i?o:VC})}}function Gi(e,t,a,n){let o=new Set,i=!1,r;for(let s=e.head;s;s=s.next)n.stats.processed++,s.data.type===Kn?i&&(r===void 0&&(r=n.rulesCounter++),s.data.order=r):(O4(s.data,s,t,a,o,n),i=!0,r=void 0);o.forEach(s=>e.remove(s))}function O4(e,t,a,n,o,i){let r=_e(e.name);Du(e)?D4(e,t,a,n,o,i):e.type===vn&&r===Os&&Be(e.block)?M4(e,t,a,n,o,i):e.type===vn&&r===cf&&Be(e.block)?F4(e,t,a,n,o,i):e.type===vn&&r!==JC&&r!==uf&&!r.startsWith(of)&&Be(e.block)?W4(e,t,a,n,o,i):e.type===Ou&&Be(e.prelude)&&V4(e,t,a,n,o,i)}function D4(e,t,a,n,o,i){let r=e.prelude.children.head.data,s=dR(n.conditionalStack,r),l=hR(e,r,i),c=l?[...n.layerStack,...l]:n.layerStack;Gi(r.importedChildren,a,{...n,layerStack:c,conditionalStack:s,hasDefaultNamespace:n.hasDefaultNamespace||pR(r.importedChildren)},i)}function M4(e,t,a,n,o,i){let r=lR(e,i),s=[...n.layerStack,...r];i.layerOrder.has(jo(s))||ju(n.layerStack,r,n.conditionalStack,i);let l={...n,layerStack:s};Mu(e),Gi(e.block.children,a,l,i),Be(e.block)||mR(e,t,o,i)}function mR(e,t,a,n){Be(e.prelude)?e.block=null:(n.stats.discarded++,a.add(t))}function P4(e){let{prelude:t}=e;return t&&t.type===Bi?Ve(ge(t),a4):t}function F4(e,t,a,n,o,i){let r;try{let l=HC(P4(e));r=z4(l,n,i)}catch(l){Ns&&console.error(mf,{ruleData:e,error:l})}if(!r){i.stats.discarded++,o.add(t);return}let s={...n,scopeStack:[...n.scopeStack||[],r],hasUnqueryableSelector:n.hasUnqueryableSelector||r.hasUnqueryableSelector,hasNestedUnqueryablePseudoClass:n.hasNestedUnqueryablePseudoClass||r.hasNestedUnqueryablePseudoClass};Mu(e),Gi(e.block.children,a,s,i),Be(e.block)||(i.stats.discarded++,o.add(t))}function z4(e,t,a){let n=t.scopeStack||[],o=e&&e.include?e.include:[],i=e&&e.exclude?e.exclude:[],r=qC(o,t.hasDefaultNamespace),s=qC(i,t.hasDefaultNamespace),l=[];o.length?(l=U4(o,n,a),!l.length&&r.hasNestedUnqueryablePseudoClass&&(l=n.length?Array.from(n[n.length-1].rootElements):gR(a))):l=G4(t.ownerElement,a);let c=Array.from(new Set(l.filter(Boolean)));if(!c.length)return null;let u=B4(i,c,a,t.hasDefaultNamespace);return{id:a.scopeIdCounter++,rootElements:new Set(c),stopElements:u,hasUnqueryableSelector:r.hasUnqueryableSelector||s.hasUnqueryableSelector,hasNestedUnqueryablePseudoClass:r.hasNestedUnqueryablePseudoClass}}function qC(e,t){let a={hasUnqueryableSelector:!1,hasNestedUnqueryablePseudoClass:!1};return e.forEach(n=>{let{hasUnqueryableSelector:o,hasNestedUnqueryablePseudoClass:i}=wf(n.data,t);a.hasUnqueryableSelector||=o,a.hasNestedUnqueryablePseudoClass||=i}),a}function U4(e,t,a){let n=new Set;return e.forEach(o=>{let i=Ru(o,a),r=t.length?bR(bf(i,a),t):xR(a.doc,i);vR(r,t).forEach(s=>n.add(s))}),Array.from(n)}function B4(e,t,a,n){let o=new Map;return!e.length||!t.length||e.forEach(i=>{let{hasUnqueryableSelector:r,hasNestedUnqueryablePseudoClass:s}=wf(i.data,n);if(!r&&!s){let l=bf(Ru(i,a),a);t.forEach(c=>{let u=o.get(c)||new Set;yf(c,l).forEach(d=>u.add(d)),u.size&&o.set(c,u)})}}),o}function pR(e){for(let t=e.head;t;t=t.next){let a=t.data;if(a.type===vn&&a.name&&_e(a.name)===k4){let n=a.prelude&&a.prelude.children&&a.prelude.children.head;if(n&&(n.data.type===E4||n.data.type===v4))return!0}}return!1}function H4(e){return e&&e.element?e.element:e&&e.nodeType===1?e:null}function G4(e,t){return e&&e.parentElement?[e.parentElement]:gR(t)}function gR(e){let t=[];return e.doc&&e.doc.documentElement&&t.push(e.doc.documentElement),!t.length&&e.doc&&e.doc.body&&t.push(e.doc.body),!t.length&&e.doc&&e.doc.children&&t.push(...Array.from(e.doc.children).filter(a=>a.nodeType===1)),t}function W4(e,t,a,n,o,i){let r=uR(n.conditionalStack,e,i),s={...n,conditionalStack:r};Mu(e),Gi(e.block.children,a,s,i),Be(e.block)||(i.stats.discarded++,o.add(t))}function V4(e,t,a,n,o,i){if(e.order=i.rulesCounter++,!X4(e.prelude,i))return;Mu(e);let r=Y4(e,q4(e,n,i),i);!S6(e,r,o,t,i)&&Be(e.block)&&J4(e,a,n,i)}function q4(e,t,a){let n=[],{ancestorsSelectors:o,scopeStack:i}=t;for(let r=e.prelude.children.head,s=0;r;r=r.next,s++){let l=wf(r.data,t.hasDefaultNamespace),{startsWithCombinator:c}=l,u=l.hasUnqueryableSelector||!!t.hasUnqueryableSelector,d=l.hasNestedUnqueryablePseudoClass||!!t.hasNestedUnqueryablePseudoClass;u&&(e.hasUnqueryableSelector=!0),d&&(e.hasNestedUnqueryablePseudoClass=!0);let h=b6(r,o,a);Q4(r,h,e,t,a);let m=c&&!(o&&o.length)&&!!(i&&i.length),p=m6(r,h,i,a,m);d&&n6(e,a),p.length?u?a6(e,p,a):$4(p,r,a):d||n.push(r)}return n}function Y4(e,t,a){if(!t.length||t.length===e.prelude.children.size||!K4(e))return t;let n=new Set(t),o={a:0,b:0,c:0};for(let i=e.prelude.children.head;i;i=i.next)if(!n.has(i)&&!TR(i.data)){let{specificity:r}=a.selectorData.get(i);YC(r,o)>0&&(o=r)}return t.filter(i=>YC(a.selectorData.get(i).specificity,o)<=0)}function K4(e){if(Be(e.block)){for(let t=e.block.children.head;t;t=t.next)if(t.data.type!==Kn)return!0}return!1}function YC(e,t){return e.a-t.a||e.b-t.b||e.c-t.c}function wf(e,t){let a=!!t,n=!1,o=!1,i=0;ra(e,{enter(s){s.type===$C?(a=!0,i&&(n=!0)):s.type===xu?((Tu.has(_e(s.name))||af(s))&&(a=!0,i&&(n=!0)),WC.has(s.name.toLowerCase())&&i++):(s.type===$3&&tf(s)||s.type===QC&&typeof s.name=="string"&&s.name.includes(nf))&&(a=!0,i&&(n=!0))},leave(s){s.type===xu&&WC.has(s.name.toLowerCase())&&i--}});let r=e.children.head.data;return o=r&&r.type===df,{hasUnqueryableSelector:a,hasNestedUnqueryablePseudoClass:n,startsWithCombinator:o}}function X4(e,t){if(!globalThis.CSS||!globalThis.CSS.supports)return!0;for(let a=e.children.head;a;a=a.next)if(!Z4(a.data,t))return!1;return!0}function Z4(e,t){let a=Yn(e);ra(a,{visit:QC,enter(i){typeof i.name=="string"&&i.name.includes(nf)&&(i.name=i.name.substring(i.name.lastIndexOf(nf)+1))}});let n=ge(a),o=a.children&&a.children.head&&a.children.head.data;if(o&&o.type===df&&(n=gf+n),!t.supportedSelectors.has(n)){let i;try{i=globalThis.CSS.supports(m4+n+p4)}catch{i=!0}t.supportedSelectors.set(n,i)}return t.supportedSelectors.get(n)}function $4(e,t,a){e.forEach(n=>{a.matchedElements.add(n);let o=a.matchingSelectors.get(n);o||(o=[],a.matchingSelectors.set(n,o),n.matchingSelectors=o),o.push(t)})}function J4(e,t,a,n){let o={...a,ancestorsSelectors:[...a.ancestorsSelectors,e.prelude],hasUnqueryableSelector:!!e.hasUnqueryableSelector,hasNestedUnqueryablePseudoClass:!!e.hasNestedUnqueryablePseudoClass};Gi(e.block.children,t,o,n)}function Q4(e,t,a,n,o){let{layerStack:i,scopeStack:r,conditionalStack:s}=n;o.selectorData.set(e,{specificity:UC(t===null?e.data:t.data),rule:a,layerStack:i,scopeStack:r,conditionalStack:s})}function e6(e,t,a){let n=s6(e,a),o=new Map;n.forEach(r=>{let{selector:s}=r,l=h6(s,a),c=r6(l);o.has(c)||o.set(c,[]),o.get(c).push(r)});let i=!1;o.forEach(r=>{r.sort((l,c)=>k6(l,c,a));let s=new Map;r.forEach(l=>{let{property:c}=l.declaration.data;s.has(c)||s.set(c,[]),s.get(c).push(l)}),s.forEach(l=>{if(t6(l,a)){l.forEach(c=>t.add(c.declaration));return}for(let c=l.length-1;c>=0;c--){let{declaration:u,validity:d}=l[c];if(t.add(u),d===Io&&(i||=wR(u,a),l6(u,a)))break}})}),(i||a.revertLayerElements.has(e))&&n.forEach(({declaration:r})=>t.add(r))}function t6(e,t){let a=[new Map,new Map];return e.forEach(({declaration:n,selector:o})=>{if(o){let{layerStack:i}=t.selectorData.get(o);a[n.data.important?sf:rf].set(jo(i),i)}}),a.some(n=>{let o=Array.from(n.values());for(let i=0;i<o.length;i++)for(let r=i+1;r<o.length;r++)if(RR(o[i],o[r],t)===lf)return!0;return!1})}function a6(e,t,a){fR(e,a)&&t.forEach(n=>a.revertLayerElements.add(n))}function n6(e,t){fR(e,t)&&(t.hasIndeterminateRevertLayer=!0)}function fR(e,t){let a=t.revertLayerRules.get(e);return a===void 0&&(a=o6(e,t),t.revertLayerRules.set(e,a)),a}function o6(e,t){if(!Be(e.block))return!1;for(let a=e.block.children.head;a;a=a.next)if(a.data.type===Kn&&wR(a,t))return!0;return!1}function wR(e,t){let a=t.revertLayerDeclarations.get(e);return a===void 0&&(a=i6(e),t.revertLayerDeclarations.set(e,a)),a}function i6(e){let{value:t}=e.data;return t?t.type===Bi?y4.test(yn(t.value)):!!ot(t,a=>a.type===ZC&&b4.includes(yn(a.name).toLowerCase())):!1}function r6(e){return e.map(t=>`${t.name}:${t.prelude}`).join(Iu)}function s6(e,t){let a=t.matchingSelectors.get(e),n=[];a.forEach(r=>{let s=t.selectorData.get(r),l=s.rule;if(Be(l.block)){let c=d6(e,r,t),u=l.block.children;for(let d=u.head;d;d=d.next){let{type:h,value:m,order:p}=d.data;h===Kn&&m&&i(d,s.specificity,!1,r,p===void 0?l.order:p,c)}}});let o=R6(e);for(let r of o)i(r.declaration,r.specificity,!0);return n;function i(r,s,l,c,u,d){let{property:h,value:m}=r.data;if(m.type===J3&&Be(m)){let p=u6(h,m,t);p!==Lu&&n.push({declaration:r,selector:c,specificity:s,isInline:l,order:u,proximity:d,validity:p})}}}function l6(e,t){let{property:a,value:n}=e.data;return a.startsWith(Hi)?!0:(t.baselineValues.has(n)||t.baselineValues.set(n,c6(a,n)),t.baselineValues.get(n))}function c6(e,t){if(ot(t,a=>a.type===tR&&_e(a.name)===hf))return!0;try{return!!Es.matchProperty(e,t).matched}catch{return!1}}function u6(e,t,a){return e.startsWith(Hi)?Io:(a.valueValidities.has(t)||a.valueValidities.set(t,rR(e,t)),a.valueValidities.get(t))}function d6(e,t,a){let n=a.scopeProximities.get(a.scopeProximityKeys.get(t)),o=n&&n.get(e);return o===void 0?Ls:o}function h6(e,t){let a=[];if(e){let n=t.selectorData.get(e);n&&n.conditionalStack&&(a=n.conditionalStack)}return a}function m6(e,t,a,n,o){let i=Ru(t===null?e:t,n);o?i=gf+i:a&&a.length&&(i=bf(i,n));let r=p6(i,a);a&&a.length&&n.scopeProximityKeys.set(e,r);let s=n.matchedSelectors.get(r);if(s)return s;let l;if(a&&a.length){let c=new Map;l=bR(i,a,c),l=vR(l,a),n.scopeProximities.set(r,c)}else l=xR(n.doc,i);return n.matchedSelectors.set(r,l),l}function bf(e,t){if(!t.scopedSelectorTexts.has(e)){let a=e;try{a=Ds(e,eR).children.toArray().map(o=>ot(o,r=>r.type===xu&&_e(r.name)===h4)?ge(o):gf+nR+ge(o)).join(pf)}catch{Ns&&console.warn(mf,e)}t.scopedSelectorTexts.set(e,a)}return t.scopedSelectorTexts.get(e)}function p6(e,t){if(!t||!t.length)return e;let a=t.map(n=>n.id).join(Iu);return`${e}${Iu}${a}`}function bR(e,t,a){let n=t[t.length-1],o=Array.from(n.rootElements);if(!o.length)return[];let i=new Set;return o.forEach(r=>{let s=n.stopElements&&n.stopElements.get(r);yf(r,e).forEach(l=>{let c=SR(l,r,s);if(c!==Ls&&(i.add(l),a)){let u=a.get(l);(u===void 0||c<u)&&a.set(l,c)}})}),Array.from(i)}function yf(e,t){let a=new Set;if(!e||e.nodeType!==1)return[];yR(e,t)&&a.add(e);let n;try{n=e.querySelectorAll(t)}catch{Ns&&console.error(aR,{root:e,selectorText:t}),n=kR([e],t,!0)}for(let o of n)a.add(o);return Array.from(a)}function yR(e,t){if(!e||e.nodeType!==1)return!1;try{return e.matches(t)}catch{return!1}}function kR(e,t,a){let n=[],o=new Set,i=[];for(e.forEach(r=>{r&&r.nodeType===1&&i.push({node:r,include:!a})});i.length;){let{node:r,include:s}=i.pop();if(!(!r||o.has(r))){o.add(r),s&&yR(r,t)&&n.push(r);for(let l=r.firstElementChild;l;l=l.nextElementSibling)i.push({node:l,include:!0})}}return n}function ER(e){return e?e.nodeType===9||e.nodeType===11?e.documentElement?[e.documentElement]:e.children?Array.from(e.children).filter(t=>t.nodeType===1):[]:[e]:[]}function vR(e,t){return!t||!t.length?e:e.filter(a=>g6(a,t))}function g6(e,t){if(!e)return!1;for(let a=0;a<t.length;a++)if(!f6(e,t[a]))return!1;return!0}function f6(e,t){let{rootElements:a,stopElements:n}=t;for(let o=e;o&&o.nodeType===1;o=o.parentElement)if(a.has(o)&&SR(e,o,n&&n.get(o))!==Ls)return!0;return!1}function SR(e,t,a){let n=[];for(let o=e;o&&o.nodeType===1;o=o.parentElement)if(n.push(o),o===t)return w6(n,a)?Ls:n.length-1;return Ls}function w6(e,t){return!!t&&e.some(a=>t.has(a))}function b6(e,t,a){if(!t||!t.length)return null;let n=CR(_R(e.data,a),AR(t,a),a);return{data:Ds(n,eR)}}function AR(e,t){let a=e[e.length-1];if(!t.nestingParentTexts.has(a)){let n=e.length>1?AR(e.slice(0,-1),t):null,o=[];for(let i=a.children.head;i;i=i.next)if(!TR(i.data)){let r=_R(i.data,t);o.push(n===null?r:CR(r,n,t))}t.nestingParentTexts.set(a,o.length?c4+o.join(pf)+u4:d4)}return t.nestingParentTexts.get(a)}function TR(e){return!!ot(e,t=>t.type===$C||t.type===xu&&Tu.has(_e(t.name)))}function CR(e,t,a){let n=Ds(e),o=!1;if(ra(n,{visit:Z3,enter(r,s,l){o=!0,l.insertData(y6(t,a),s),l.remove(s)}}),o)return ge(n);let i=n.children.head.data.type===df;return t+(i?Is:nR)+e}function y6(e,t){return t.nestingParentNodes.has(e)||t.nestingParentNodes.set(e,Ds(e).children.head.data),Yn(t.nestingParentNodes.get(e))}function k6(e,t,a){let n=e.declaration.data.important?sf:rf,o=t.declaration.data.important?sf:rf;if(n!==o)return n-o;if(e.isInline&&!t.isInline)return 1;if(!e.isInline&&t.isInline)return-1;let i=e.selector?a.selectorData.get(e.selector):null,r=t.selector?a.selectorData.get(t.selector):null;if(i&&r){let s=RR(i.layerStack,r.layerStack,a);if(s)return n?-s:s;let l=e.specificity,c=t.specificity;return l.a!==c.a?l.a-c.a:l.b!==c.b?l.b-c.b:l.c!==c.c?l.c-c.c:e.proximity!==t.proximity?t.proximity-e.proximity:e.order!==t.order?e.order-t.order:0}else{let s=e.specificity,l=t.specificity;return s.a!==l.a?s.a-l.a:s.b!==l.b?s.b-l.b:s.c!==l.c?s.c-l.c:0}}function RR(e,t,a){let n=e.length===0,o=t.length===0;if(n&&o)return 0;if(n)return 1;if(o)return-1;let i=jo(e),r=jo(t);if(i===r)return 0;let s=i+Iu+r;return a.layerComparisons.has(s)||a.layerComparisons.set(s,E6(e,t,a)),a.layerComparisons.get(s)}function E6(e,t,a){let n=Math.min(e.length,t.length);for(let o=0;o<n;o++)if(e[o]!==t[o]){let i=a.layerOrder.get(jo(e.slice(0,o+1))),r=a.layerOrder.get(jo(t.slice(0,o+1)));return!i||!r?lf:i.firstCertain<r.first?-1:r.firstCertain<i.first?1:lf}return t.length-e.length}function v6(e,t,a){let n={references:new Set,customValues:new Map,removableDeclarations:[]};e.forEach((i,r)=>{i.stylesheet&&Be(i.stylesheet)&&xs(i.stylesheet.children,!i.scoped&&!r.urlNode,n)}),t&&t.forEach(i=>{Be(i)&&xs(i.children,!1,n)}),a.doc.querySelectorAll("svg, svg *").forEach(i=>{for(let r of i.attributes)r.value.includes(hf+"(")&&Nu(r.value,s=>n.references.add(s))});let o=[...n.references];for(;o.length;){let i=n.customValues.get(o.pop());i&&i.forEach(r=>Nu(r,s=>{n.references.has(s)||(n.references.add(s),o.push(s))}))}n.removableDeclarations.forEach(({name:i,item:r,list:s})=>{n.references.has(i)||(s.remove(r),a.stats.discardedCustomProperties++)})}function xs(e,t,a){for(let n=e.head;n;n=n.next){let o=n.data;if(o.type===Kn){let i=o.value.type===Bi?o.value.value:ge(o.value);if(o.property.startsWith(Hi)){let r=yn(o.property),s=a.customValues.get(r);s||(s=[],a.customValues.set(r,s)),s.push(i),t&&a.removableDeclarations.push({name:r,item:n,list:e})}else Nu(i,r=>a.references.add(r))}else Du(o)?xs(o.prelude.children.head.data.importedChildren,t,a):o.type===Ou?Be(o.block)&&xs(o.block.children,t,a):o.type===vn&&(o.prelude&&Nu(ge(o.prelude),i=>a.references.add(i)),Be(o.block)&&xs(o.block.children,t&&_e(o.name)!==uf,a))}}function Nu(e,t){if(e.includes(Hi))for(let a of e.matchAll(g4))t(yn(a[0]))}function _u(e,t){let a=new Set;for(let n=e.head;n;n=n.next){let o=n.data;o.type===Ou?(Be(o.block)&&_u(o.block.children,t),Be(o.block)||(t.stats.discarded++,a.add(n))):Du(o)?_u(o.prelude.children.head.data.importedChildren,t):o.type===vn&&o.block&&_e(o.name)!==JC&&_e(o.name)!==uf&&(_u(o.block.children,t),Be(o.block)||(_e(o.name)===Os?mR(o,n,a,t):(t.stats.discarded++,a.add(n))))}a.forEach(n=>e.remove(n))}function S6(e,t,a,n,o){return t&&t.length&&t.forEach(i=>e.prelude.children.remove(i)),Be(e.prelude)?!1:(o.stats.discarded++,a.add(n),!0)}function A6(e,t){let a=new Map,n=new Set;t.matchedElements.forEach(o=>{let i=t.matchingSelectors.get(o);i&&i.forEach(r=>{let s=t.selectorData.get(r).rule;if(Be(s.block)){let l=s.block.children;for(let c=l.head;c;c=c.next)if(c.data.type===Kn){a.set(c,l);let{property:u,value:d}=c.data;(u&&u.startsWith(Hi)||d&&d.type===Bi||s.hasUnqueryableSelector)&&n.add(c)}}})}),a.forEach((o,i)=>{!e.has(i)&&!n.has(i)&&o.remove(i)})}function Mu(e){let t=[];if(Be(e.block))for(let a=e.block.children.head;a;a=a.next){let n=T6(a.data);if(n!==null)try{let o=Ds(n,n4);for(let i=o.children.head;i;i=i.next)t.push(i)}catch(o){Ns&&console.warn(mf,n,o)}else t.push(a)}e.block.children.clear(),t.forEach(a=>e.block.children.appendData(a.data))}function T6(e){return e.type===Bi&&KC(e.value)?e.value:e.type===Kn&&!e.property.startsWith(Hi)&&e.value.type===Bi&&KC(e.value.value)&&e.value.value.trimStart().indexOf(iR)>0?e.property+l4+e.value.value:null}function KC(e){let t=e.indexOf(iR);return t!==-1&&t<e.indexOf(S4)}function Be(e){return!!(e&&e.children&&e.children.head)}function _R(e,t){return t.selectorTexts.has(e)||t.selectorTexts.set(e,ge(e)),t.selectorTexts.get(e)}function kf(e,t){return e?(t.preludeTexts.has(e)||t.preludeTexts.set(e,ge(e)),t.preludeTexts.get(e)):Is}function jo(e){return e.join(w4)}function Ds(e,t=o4){return Ve(e,{context:t})}function xR(e,t){if(!e)return[];let a=e.nodeType===9||e.nodeType===11,n=!!(t&&t.indexOf(":scope")!==-1);if(a&&n)return C6(e,t);try{return Array.from(e.querySelectorAll(t))}catch{Ns&&console.warn(aR,t,e.nodeType===1&&e.tagName?e.tagName:Is);let o=ER(e);return kR(o,t,!1)}}function C6(e,t){let a=ER(e);if(!a.length)return[];let n=new Set;return a.forEach(o=>{yf(o,t).forEach(i=>n.add(i))}),Array.from(n)}function R6(e){let t=e.getAttribute(t4);if(t){let a;try{a=Ve(t,{context:i4})}catch{return[]}let n=[];for(let o=a.children&&a.children.head;o;o=o.next)o.data.type===Kn&&n.push({declaration:o,specificity:{a:1,b:0,c:0},isInline:!0});return n}else return[]}var Fs={};et(Fs,{process:()=>_6});var Ps="data:,";function _6(e){e.querySelectorAll("picture").forEach(t=>{let a=t.querySelector("img");if(a){let{src:n,srcset:o}=LR(a);if(!n){let i=x6(Array.from(t.querySelectorAll("source")).reverse());n=i.src,o||(o=i.srcset)}IR({src:n,srcset:o},a,t)}}),e.querySelectorAll(":not(picture) > img[srcset]").forEach(t=>IR(LR(t),t))}function LR(e){let t=e.getAttribute("src");t==Ps&&(t=null);let a=Ef(e.getAttribute("srcset"));return a==Ps&&(a=null),{src:t,srcset:a}}function x6(e){let t=e.find(o=>o.src),a=t&&t.src,n=t&&t.srcset;return a||(t=e.find(o=>Ef(o.src)),a=t&&t.src,a==Ps&&(a=null)),n||(t=e.find(o=>Ef(o.srcset)),n=t&&t.srcset,n==Ps&&(n=null)),{src:a,srcset:n}}function IR(e,t,a){e.src?t.setAttribute("src",e.src):t.getAttribute("srcset")||(t.setAttribute("src",Ps),e.srcset?t.setAttribute("srcset",e.srcset):(t.removeAttribute("srcset"),t.removeAttribute("sizes"))),a&&a.querySelectorAll("source").forEach(n=>n.remove())}function Ef(e){if(e)try{let t=zr(e);if(t.length)return t.find(a=>a.url).url}catch{}}var Us={};et(Us,{process:()=>B6});var L6=["allowfullscreen","async","autofocus","autoplay","checked","compact","controls","declare","default","defaultchecked","defaultmuted","defaultselected","defer","disabled","enabled","formnovalidate","hidden","indeterminate","inert","ismap","itemscope","loop","multiple","muted","nohref","noresize","noshade","novalidate","nowrap","open","pauseonexit","readonly","required","reversed","scoped","seamless","selected","sortable","truespeed","typemustmatch","visible"],I6=["SCRIPT","STYLE","PRE","TEXTAREA"],j6=["id","class","style","lang","dir","onclick","ondblclick","onmousedown","onmouseup","onmouseover","onmousemove","onmouseout","onkeypress","onkeydown","onkeyup"],N6={FORM:{method:"get"},SCRIPT:{language:"javascript",type:"text/javascript",charset:e=>!e.getAttribute("src")},STYLE:{media:"all",type:"text/css"},LINK:{media:"all"}},O6=/[ \t\f\r]+/g,D6=/[ \t\f\r]{2,}|[\t\f\r]/g,M6=/\n{2,}/g,P6=/^\s+$/,F6=4294967295,Pu=1,vf=3,z6=8,U6=[H6,G6,W6,q6,Y6,K6,X6];function B6(e,t){Z6(e);let a=e.createTreeWalker(e.documentElement,F6,null,!1),n=a.nextNode();for(;n;){let o=U6.find(r=>r(n,t)),i=n;n=a.nextNode(),o&&i.remove()}}function H6(e){e.nodeType==Pu&&Array.from(e.attributes).forEach(t=>{L6.includes(t.name)&&e.setAttribute(t.name,"")})}function G6(e){e.nodeType==vf&&e.previousSibling&&e.previousSibling.nodeType==vf&&(e.textContent=e.previousSibling.textContent+e.textContent,e.previousSibling.remove())}function W6(e,t){if(e.nodeType==vf){let a=e.parentElement;if(!(a.getAttribute(t.PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME)=="")){let o=e.textContent,i=jR(a);for(;i;)a=a.parentElement,i=a&&jR(a);if((!a||i)&&o.length>1){let r=V6(e),s;r==" "?s=o.replace(D6," "):s=o.replace(O6,r),s=s.replace(M6,`
`),s!=o&&(e.textContent=s)}}}}function V6(e){return e.parentElement&&zs(e.parentElement)=="HEAD"?`
`:" "}function jR(e){return e&&!I6.includes(zs(e))}function q6(e){if(e.nodeType==z6&&zs(e.parentElement)!="HTML")return!e.textContent.toLowerCase().trim().startsWith("[if")}function Y6(e){e.nodeType==Pu&&Array.from(e.attributes).forEach(t=>{if(j6.includes(t.name.toLowerCase())){let a=e.getAttribute(t.name);(a==""||(a||"").match(P6))&&e.removeAttribute(t.name)}})}function K6(e){if(e.nodeType==Pu){let t=N6[zs(e)];t&&Object.keys(t).forEach(a=>{let n=t[a];(typeof n=="function"?n(e):e.getAttribute(a)==n)&&e.removeAttribute(a)})}}function X6(e){if(e.nodeType==Pu&&zs(e)=="SCRIPT"&&e.type=="application/ld+json"&&e.textContent.trim())try{e.textContent=JSON.stringify(JSON.parse(e.textContent))}catch{}}function Z6(e){e.querySelectorAll("style, script:not([src])").forEach(t=>{!t.textContent.trim()&&t.parentElement==e.head&&t.remove()})}function zs(e){return e.tagName&&e.tagName.toUpperCase()}var Bs={};et(Bs,{process:()=>tH});var $6=["AREA","BASE","BASEFONT","BGSOUND","BR","COL","COMMAND","EMBED","FRAME","HR","IMG","INPUT","KEYGEN","LINK","META","PARAM","SOURCE","TRACK","WBR"];var J6=[{tagName:"HEAD",accept:e=>!e.childNodes.length||e.childNodes[0].nodeType==1},{tagName:"BODY",accept:e=>!e.childNodes.length}],Q6=[{tagName:"HTML",accept:e=>!e||e.nodeType!=8},{tagName:"HEAD",accept:e=>!e||e.nodeType!=8&&(e.nodeType!=3||!Sf(e.textContent))},{tagName:"BODY",accept:e=>!e||e.nodeType!=8},{tagName:"LI",accept:(e,t)=>!e&&t.parentElement&&(dt(t.parentElement)=="UL"||dt(t.parentElement)=="OL")||e&&["LI"].includes(dt(e))},{tagName:"DT",accept:e=>!e||["DT","DD"].includes(dt(e))},{tagName:"P",accept:e=>e&&["ADDRESS","ARTICLE","ASIDE","BLOCKQUOTE","DETAILS","DIV","DL","FIELDSET","FIGCAPTION","FIGURE","FOOTER","FORM","H1","H2","H3","H4","H5","H6","HEADER","HR","MAIN","NAV","OL","P","PRE","SECTION","TABLE","UL"].includes(dt(e))},{tagName:"DD",accept:e=>!e||["DT","DD"].includes(dt(e))},{tagName:"RT",accept:e=>!e||["RT","RP"].includes(dt(e))},{tagName:"RP",accept:e=>!e||["RT","RP"].includes(dt(e))},{tagName:"OPTGROUP",accept:e=>!e||["OPTGROUP"].includes(dt(e))},{tagName:"OPTION",accept:e=>!e||["OPTION","OPTGROUP"].includes(dt(e))},{tagName:"COLGROUP",accept:e=>!e||e.nodeType!=8&&(e.nodeType!=3||!Sf(e.textContent))},{tagName:"CAPTION",accept:e=>!e||e.nodeType!=8&&(e.nodeType!=3||!Sf(e.textContent))},{tagName:"THEAD",accept:e=>!e||["TBODY","TFOOT"].includes(dt(e))},{tagName:"TBODY",accept:e=>!e||["TBODY","TFOOT"].includes(dt(e))},{tagName:"TFOOT",accept:e=>!e},{tagName:"TR",accept:e=>!e||["TR"].includes(dt(e))},{tagName:"TD",accept:e=>!e||["TD","TH"].includes(dt(e))},{tagName:"TH",accept:e=>!e||["TD","TH"].includes(dt(e))}],eH=["STYLE","SCRIPT","XMP","IFRAME","NOEMBED","NOFRAMES","PLAINTEXT","NOSCRIPT"];function tH(e,t,a){let n=e.doctype,o="";return n&&(o="<!DOCTYPE "+n.nodeName,n.publicId?(o+=' PUBLIC "'+n.publicId+'"',n.systemId&&(o+=' "'+n.systemId+'"')):n.systemId&&(o+=' SYSTEM "'+n.systemId+'"'),n.internalSubset&&(o+=" ["+n.internalSubset+"]"),o+="> "),o+NR(e.documentElement,t,a)}function NR(e,t,a){if(e.nodeType==3)return aH(e);if(e.nodeType==8)return nH(e);if(e.nodeType==1)return oH(e,t,a)}function aH(e){let t=e.parentNode,a;return t&&t.nodeType==1&&(a=dt(t)),!a||eH.includes(a)?a=="SCRIPT"&&(!t.type||t.type=="text/javascript")||a=="STYLE"?e.textContent.replace(/<\//gi,"<\\/"):e.textContent:e.textContent.replace(/&/g,"&amp;").replace(/\u00a0/g,"&nbsp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function nH(e){return"<!--"+e.textContent+"-->"}function oH(e,t,a){let n=dt(e),o=t&&J6.find(s=>n==dt(s)&&s.accept(e)),i="";return(!o||e.attributes.length)&&(i="<"+n.toLowerCase(),Array.from(e.attributes).forEach(s=>i+=iH(s,e,t)),i+=">"),n=="TEMPLATE"&&!e.childNodes.length?i+=e.innerHTML:Array.from(e.childNodes).forEach(s=>i+=NR(s,t,a)),!(a&&a.has(e)||t&&Q6.find(s=>n==dt(s)&&s.accept(e.nextSibling,e)))&&!$6.includes(n)&&(i+="</"+n.toLowerCase()+">"),i}function iH(e,t,a){let n=e.name,o="";if(!n.match(/["'>/=]/)){let i=e.value;a&&n=="class"&&(i=Array.from(t.classList).map(u=>u.trim()).join(" "));let r;i=i.replace(/&/g,"&amp;").replace(/\u00a0/g,"&nbsp;"),i.includes('"')&&(i.includes("'")||!a?i=i.replace(/"/g,"&quot;"):r=!0);let s=!a||i.match(/[ \t\n\f\r'"`=<>]/);o+=" ";let l=e.namespaceURI,c=e.localName||n;l?l=="http://www.w3.org/XML/1998/namespace"?o+="xml:"+c:l=="http://www.w3.org/2000/xmlns/"?c==="xmlns"?o+="xmlns":o+="xmlns:"+c:l=="http://www.w3.org/1999/xlink"?o+="xlink:"+c:e.prefix?o+=e.prefix+":"+c:o+=n:o+=n,i!=""&&(o+="=",s&&(o+=r?"'":'"'),o+=i,s&&(o+=r?"'":'"'))}return o}function Sf(e){return!!e.match(/^[ \t\n\f\r]/)}function dt(e){return e.tagName&&e.tagName.toUpperCase()}var Wi={};et(Wi,{evalTemplate:()=>FR,formatFilename:()=>gH});function rH(e,t){function a(){this.constructor=e}a.prototype=t.prototype,e.prototype=new a}function Hs(e,t,a,n){this.message=e,this.expected=t,this.found=a,this.location=n,this.name="SyntaxError",typeof Error.captureStackTrace=="function"&&Error.captureStackTrace(this,Hs)}rH(Hs,Error);Hs.buildMessage=function(e,t){var a={literal:function(c){return'"'+o(c.text)+'"'},class:function(c){var u="",d;for(d=0;d<c.parts.length;d++)u+=c.parts[d]instanceof Array?i(c.parts[d][0])+"-"+i(c.parts[d][1]):i(c.parts[d]);return"["+(c.inverted?"^":"")+u+"]"},any:function(){return"any character"},end:function(){return"end of input"},other:function(c){return c.description}};function n(c){return c.charCodeAt(0).toString(16).toUpperCase()}function o(c){return c.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\0/g,"\\0").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/[\x00-\x0F]/g,function(u){return"\\x0"+n(u)}).replace(/[\x10-\x1F\x7F-\x9F]/g,function(u){return"\\x"+n(u)})}function i(c){return c.replace(/\\/g,"\\\\").replace(/\]/g,"\\]").replace(/\^/g,"\\^").replace(/-/g,"\\-").replace(/\0/g,"\\0").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/[\x00-\x0F]/g,function(u){return"\\x0"+n(u)}).replace(/[\x10-\x1F\x7F-\x9F]/g,function(u){return"\\x"+n(u)})}function r(c){return a[c.type](c)}function s(c){var u=new Array(c.length),d,h;for(d=0;d<c.length;d++)u[d]=r(c[d]);if(u.sort(),u.length>0){for(d=1,h=1;d<u.length;d++)u[d-1]!==u[d]&&(u[h]=u[d],h++);u.length=h}switch(u.length){case 1:return u[0];case 2:return u[0]+" or "+u[1];default:return u.slice(0,-1).join(", ")+", or "+u[u.length-1]}}function l(c){return c?'"'+o(c)+'"':"end of input"}return"Expected "+s(e)+" but "+l(t)+" found."};async function OR(e,t){t=t!==void 0?t:{};var a={},n={start:ut},o=ut,i=function(R){return R.join("")},r="|",s=we("|",!1),l=function(R){return R},c="%",u=we("%",!1),d="<",h=we("<",!1),m=">",p=we(">",!1),g=function(R,M,G){return t.callFunction(R,M,G)},w="{",f=we("{",!1),b="}",y=we("}",!1),E=function(R,M){return t.getVariableValue(R,M)},k="[",S=we("[",!1),T="]",v=we("]",!1),A=function(R,M){return{length:R,unit:M}},x="ch",_=we("ch",!1),O=/^[a-z0-9-]/,z=je([["a","z"],["0","9"],"-"],!1,!1),U=function(){return at()},K=/^[0-9]/,L=je([["0","9"]],!1,!1),D=function(){return Number(at())},B="\\\\%",W=we("\\\\%",!1),Y="\\\\{",H=we("\\\\{",!1),Q="\\\\|",se=we("\\\\|",!1),de="\\\\>",ue=we("\\\\>",!1),Ae=be(),j=0,De=0,Ze=[{line:1,column:1}],Me=0,qe=[],$=0,Ie;if("startRule"in t){if(!(t.startRule in n))throw new Error(`Can't start parsing from rule "`+t.startRule+'".');o=n[t.startRule]}function at(){return e.substring(De,j)}function we(R,M){return{type:"literal",text:R,ignoreCase:M}}function je(R,M,G){return{type:"class",parts:R,inverted:M,ignoreCase:G}}function be(){return{type:"any"}}function V(){return{type:"end"}}function he(R){var M=Ze[R],G;if(M)return M;for(G=R-1;!Ze[G];)G--;for(M=Ze[G],M={line:M.line,column:M.column};G<R;)e.charCodeAt(G)===10?(M.line++,M.column=1):M.column++,G++;return Ze[R]=M,M}function Se(R,M){var G=he(R),Te=he(M);return{start:{offset:R,line:G.line,column:G.column},end:{offset:M,line:Te.line,column:Te.column}}}function te(R){j<Me||(j>Me&&(Me=j,qe=[]),qe.push(R))}function He(R,M,G){return new Hs(Hs.buildMessage(R,M),R,M,G)}async function ut(){var R;return R=await Lt(),R}async function Lt(){var R,M,G;for(R=j,M=[],G=await da();G!==a;)M.push(G),G=await da();return M!==a&&(De=R,M=i(M)),R=M,R}async function da(){var R;return R=await It(),R===a&&(R=await Ut(),R===a&&(R=tn())),R}async function Jt(){var R,M,G;return R=j,e.charCodeAt(j)===124?(M=r,j++):(M=a,$===0&&te(s)),M!==a?(G=await Lt(),G!==a?(De=R,M=l(G),R=M):(j=R,R=a)):(j=R,R=a),R}async function _a(){var R,M;if(R=[],M=await Jt(),M!==a)for(;M!==a;)R.push(M),M=await Jt();else R=a;return R}async function wt(){var R,M,G;return R=j,M=await Lt(),M!==a?(G=await _a(),G===a&&(G=null),G!==a?(M=[M,G],R=M):(j=R,R=a)):(j=R,R=a),R}async function It(){var R,M,G,Te,Pe,Ee,rt;return R=j,e.charCodeAt(j)===37?(M=c,j++):(M=a,$===0&&te(u)),M!==a?(G=en(),G!==a?(e.charCodeAt(j)===60?(Te=d,j++):(Te=a,$===0&&te(h)),Te!==a?(Pe=await wt(),Pe!==a?(e.charCodeAt(j)===62?(Ee=m,j++):(Ee=a,$===0&&te(p)),Ee!==a?(rt=Ke(),rt===a&&(rt=null),rt!==a?(De=R,M=await g(G,Pe,rt),R=M):(j=R,R=a)):(j=R,R=a)):(j=R,R=a)):(j=R,R=a)):(j=R,R=a)):(j=R,R=a),R}async function Ut(){var R,M,G,Te,Pe;return R=j,e.charCodeAt(j)===123?(M=w,j++):(M=a,$===0&&te(f)),M!==a?(G=en(),G!==a?(e.charCodeAt(j)===125?(Te=b,j++):(Te=a,$===0&&te(y)),Te!==a?(Pe=Ke(),Pe===a&&(Pe=null),Pe!==a?(De=R,M=await E(G,Pe),R=M):(j=R,R=a)):(j=R,R=a)):(j=R,R=a)):(j=R,R=a),R}function Ke(){var R,M,G,Te,Pe;return R=j,e.charCodeAt(j)===91?(M=k,j++):(M=a,$===0&&te(S)),M!==a?(G=Rt(),G!==a?(Te=it(),Te!==a?(e.charCodeAt(j)===93?(Pe=T,j++):(Pe=a,$===0&&te(v)),Pe!==a?(De=R,M=A(G,Te),R=M):(j=R,R=a)):(j=R,R=a)):(j=R,R=a)):(j=R,R=a),R}function it(){var R;return e.substr(j,2)===x?(R=x,j+=2):(R=a,$===0&&te(_)),R===a&&(R=null),R}function en(){var R,M,G;if(R=j,M=[],O.test(e.charAt(j))?(G=e.charAt(j),j++):(G=a,$===0&&te(z)),G!==a)for(;G!==a;)M.push(G),O.test(e.charAt(j))?(G=e.charAt(j),j++):(G=a,$===0&&te(z));else M=a;return M!==a&&(De=R,M=U()),R=M,R}function Rt(){var R,M,G;if(R=j,M=[],K.test(e.charAt(j))?(G=e.charAt(j),j++):(G=a,$===0&&te(L)),G!==a)for(;G!==a;)M.push(G),K.test(e.charAt(j))?(G=e.charAt(j),j++):(G=a,$===0&&te(L));else M=a;return M!==a&&(De=R,M=D()),R=M,R}function tn(){var R,M,G;if(R=j,M=[],G=xa(),G!==a)for(;G!==a;)M.push(G),G=xa();else M=a;return M!==a&&(De=R,M=U()),R=M,R}function xa(){var R,M,G,Te,Pe,Ee;return R=j,M=j,$++,e.charCodeAt(j)===37?(G=c,j++):(G=a,$===0&&te(u)),$--,G===a?M=void 0:(j=M,M=a),M!==a?(G=j,$++,e.charCodeAt(j)===123?(Te=w,j++):(Te=a,$===0&&te(f)),$--,Te===a?G=void 0:(j=G,G=a),G!==a?(Te=j,$++,e.charCodeAt(j)===124?(Pe=r,j++):(Pe=a,$===0&&te(s)),$--,Pe===a?Te=void 0:(j=Te,Te=a),Te!==a?(Pe=j,$++,e.charCodeAt(j)===62?(Ee=m,j++):(Ee=a,$===0&&te(p)),$--,Ee===a?Pe=void 0:(j=Pe,Pe=a),Pe!==a?(Ee=ha(),Ee!==a?(M=[M,G,Te,Pe,Ee],R=M):(j=R,R=a)):(j=R,R=a)):(j=R,R=a)):(j=R,R=a)):(j=R,R=a),R}function ha(){var R;return e.substr(j,3)===B?(R=B,j+=3):(R=a,$===0&&te(W)),R===a&&(e.substr(j,3)===Y?(R=Y,j+=3):(R=a,$===0&&te(H)),R===a&&(e.substr(j,3)===Q?(R=Q,j+=3):(R=a,$===0&&te(se)),R===a&&(e.substr(j,3)===de?(R=de,j+=3):(R=a,$===0&&te(ue)),R===a&&(e.length>j?(R=e.charAt(j),j++):(R=a,$===0&&te(Ae)))))),R}if(Ie=await o(),Ie!==a&&j===e.length)return Ie;throw Ie!==a&&j<e.length&&te(V()),He(qe,Me<e.length?e.charAt(Me):null,Me<e.length?Se(Me,Me+1):Se(Me,Me))}var sH=globalThis.Blob,lH=globalThis.URL,cH=globalThis.Intl,uH=globalThis.URLSearchParams,dH=globalThis.navigator,hH=/([{}()^$&.*?/+|[\\\\]|\]|-)/g,PR={"\u{1F600}":"grinning-face","\u{1F603}":"grinning-face-with-big-eyes","\u{1F604}":"grinning-face-with-smiling-eyes","\u{1F601}":"beaming-face-with-smiling-eyes","\u{1F606}":"grinning-squinting-face","\u{1F605}":"grinning-face-with-sweat","\u{1F923}":"rolling-on-the-floor-laughing","\u{1F602}":"face-with-tears-of-joy","\u{1F642}":"slightly-smiling-face","\u{1F643}":"upside-down-face","\u{1FAE0}":"melting-face","\u{1F609}":"winking-face","\u{1F60A}":"smiling-face-with-smiling-eyes","\u{1F607}":"smiling-face-with-halo","\u{1F970}":"smiling-face-with-hearts","\u{1F60D}":"smiling-face-with-heart-eyes","\u{1F929}":"star-struck","\u{1F618}":"face-blowing-a-kiss","\u{1F617}":"kissing-face","\u263A":"smiling-face","\u{1F61A}":"kissing-face-with-closed-eyes","\u{1F619}":"kissing-face-with-smiling-eyes","\u{1F972}":"smiling-face-with-tear","\u{1F60B}":"face-savoring-food","\u{1F61B}":"face-with-tongue","\u{1F61C}":"winking-face-with-tongue","\u{1F92A}":"zany-face","\u{1F61D}":"squinting-face-with-tongue","\u{1F911}":"money-mouth-face","\u{1F917}":"smiling-face-with-open-hands","\u{1F92D}":"face-with-hand-over-mouth","\u{1FAE2}":"face-with-open-eyes-and-hand-over-mouth","\u{1FAE3}":"face-with-peeking-eye","\u{1F92B}":"shushing-face","\u{1F914}":"thinking-face","\u{1FAE1}":"saluting-face","\u{1F910}":"zipper-mouth-face","\u{1F928}":"face-with-raised-eyebrow","\u{1F610}":"neutral-face","\u{1F611}":"expressionless-face","\u{1F636}":"face-without-mouth","\u{1FAE5}":"dotted-line-face","\u{1F636}\u200D\u{1F32B}\uFE0F":"face-in-clouds","\u{1F60F}":"smirking-face","\u{1F612}":"unamused-face","\u{1F644}":"face-with-rolling-eyes","\u{1F62C}":"grimacing-face","\u{1F62E}\u200D\u{1F4A8}":"face-exhaling","\u{1F925}":"lying-face","\u{1FAE8}":"\u229B-shaking-face","\u{1F60C}":"relieved-face","\u{1F614}":"pensive-face","\u{1F62A}":"sleepy-face","\u{1F924}":"drooling-face","\u{1F634}":"sleeping-face","\u{1F637}":"face-with-medical-mask","\u{1F912}":"face-with-thermometer","\u{1F915}":"face-with-head-bandage","\u{1F922}":"nauseated-face","\u{1F92E}":"face-vomiting","\u{1F927}":"sneezing-face","\u{1F975}":"hot-face","\u{1F976}":"cold-face","\u{1F974}":"woozy-face","\u{1F635}":"face-with-crossed-out-eyes","\u{1F635}\u200D\u{1F4AB}":"face-with-spiral-eyes","\u{1F92F}":"exploding-head","\u{1F920}":"cowboy-hat-face","\u{1F973}":"partying-face","\u{1F978}":"disguised-face","\u{1F60E}":"smiling-face-with-sunglasses","\u{1F913}":"nerd-face","\u{1F9D0}":"face-with-monocle","\u{1F615}":"confused-face","\u{1FAE4}":"face-with-diagonal-mouth","\u{1F61F}":"worried-face","\u{1F641}":"slightly-frowning-face","\u2639":"frowning-face","\u{1F62E}":"face-with-open-mouth","\u{1F62F}":"hushed-face","\u{1F632}":"astonished-face","\u{1F633}":"flushed-face","\u{1F97A}":"pleading-face","\u{1F979}":"face-holding-back-tears","\u{1F626}":"frowning-face-with-open-mouth","\u{1F627}":"anguished-face","\u{1F628}":"fearful-face","\u{1F630}":"anxious-face-with-sweat","\u{1F625}":"sad-but-relieved-face","\u{1F622}":"crying-face","\u{1F62D}":"loudly-crying-face","\u{1F631}":"face-screaming-in-fear","\u{1F616}":"confounded-face","\u{1F623}":"persevering-face","\u{1F61E}":"disappointed-face","\u{1F613}":"downcast-face-with-sweat","\u{1F629}":"weary-face","\u{1F62B}":"tired-face","\u{1F971}":"yawning-face","\u{1F624}":"face-with-steam-from-nose","\u{1F621}":"enraged-face","\u{1F620}":"angry-face","\u{1F92C}":"face-with-symbols-on-mouth","\u{1F608}":"smiling-face-with-horns","\u{1F47F}":"angry-face-with-horns","\u{1F480}":"skull","\u2620":"skull-and-crossbones","\u{1F4A9}":"pile-of-poo","\u{1F921}":"clown-face","\u{1F479}":"ogre","\u{1F47A}":"goblin","\u{1F47B}":"ghost","\u{1F47D}":"alien","\u{1F47E}":"alien-monster","\u{1F916}":"robot","\u{1F63A}":"grinning-cat","\u{1F638}":"grinning-cat-with-smiling-eyes","\u{1F639}":"cat-with-tears-of-joy","\u{1F63B}":"smiling-cat-with-heart-eyes","\u{1F63C}":"cat-with-wry-smile","\u{1F63D}":"kissing-cat","\u{1F640}":"weary-cat","\u{1F63F}":"crying-cat","\u{1F63E}":"pouting-cat","\u{1F648}":"see-no-evil-monkey","\u{1F649}":"hear-no-evil-monkey","\u{1F64A}":"speak-no-evil-monkey","\u{1F48C}":"love-letter","\u{1F498}":"heart-with-arrow","\u{1F49D}":"heart-with-ribbon","\u{1F496}":"sparkling-heart","\u{1F497}":"growing-heart","\u{1F493}":"beating-heart","\u{1F49E}":"revolving-hearts","\u{1F495}":"two-hearts","\u{1F49F}":"heart-decoration","\u2763":"heart-exclamation","\u{1F494}":"broken-heart","\u2764\uFE0F\u200D\u{1F525}":"heart-on-fire","\u2764\uFE0F\u200D\u{1FA79}":"mending-heart","\u2764":"red-heart","\u{1FA77}":"\u229B-pink-heart","\u{1F9E1}":"orange-heart","\u{1F49B}":"yellow-heart","\u{1F49A}":"green-heart","\u{1F499}":"blue-heart","\u{1FA75}":"\u229B-light-blue-heart","\u{1F49C}":"purple-heart","\u{1F90E}":"brown-heart","\u{1F5A4}":"black-heart","\u{1FA76}":"\u229B-grey-heart","\u{1F90D}":"white-heart","\u{1F48B}":"kiss-mark","\u{1F4AF}":"hundred-points","\u{1F4A2}":"anger-symbol","\u{1F4A5}":"collision","\u{1F4AB}":"dizzy","\u{1F4A6}":"sweat-droplets","\u{1F4A8}":"dashing-away","\u{1F573}":"hole","\u{1F4AC}":"speech-balloon","\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F":"eye-in-speech-bubble","\u{1F5E8}":"left-speech-bubble","\u{1F5EF}":"right-anger-bubble","\u{1F4AD}":"thought-balloon","\u{1F4A4}":"zzz","\u{1F44B}":"waving-hand","\u{1F91A}":"raised-back-of-hand","\u{1F590}":"hand-with-fingers-splayed","\u270B":"raised-hand","\u{1F596}":"vulcan-salute","\u{1FAF1}":"rightwards-hand","\u{1FAF2}":"leftwards-hand","\u{1FAF3}":"palm-down-hand","\u{1FAF4}":"palm-up-hand","\u{1FAF7}":"\u229B-leftwards-pushing-hand","\u{1FAF8}":"\u229B-rightwards-pushing-hand","\u{1F44C}":"ok-hand","\u{1F90C}":"pinched-fingers","\u{1F90F}":"pinching-hand","\u270C":"victory-hand","\u{1F91E}":"crossed-fingers","\u{1FAF0}":"hand-with-index-finger-and-thumb-crossed","\u{1F91F}":"love-you-gesture","\u{1F918}":"sign-of-the-horns","\u{1F919}":"call-me-hand","\u{1F448}":"backhand-index-pointing-left","\u{1F449}":"backhand-index-pointing-right","\u{1F446}":"backhand-index-pointing-up","\u{1F595}":"middle-finger","\u{1F447}":"backhand-index-pointing-down","\u261D":"index-pointing-up","\u{1FAF5}":"index-pointing-at-the-viewer","\u{1F44D}":"thumbs-up","\u{1F44E}":"thumbs-down","\u270A":"raised-fist","\u{1F44A}":"oncoming-fist","\u{1F91B}":"left-facing-fist","\u{1F91C}":"right-facing-fist","\u{1F44F}":"clapping-hands","\u{1F64C}":"raising-hands","\u{1FAF6}":"heart-hands","\u{1F450}":"open-hands","\u{1F932}":"palms-up-together","\u{1F91D}":"handshake","\u{1F64F}":"folded-hands","\u270D":"writing-hand","\u{1F485}":"nail-polish","\u{1F933}":"selfie","\u{1F4AA}":"flexed-biceps","\u{1F9BE}":"mechanical-arm","\u{1F9BF}":"mechanical-leg","\u{1F9B5}":"leg","\u{1F9B6}":"foot","\u{1F442}":"ear","\u{1F9BB}":"ear-with-hearing-aid","\u{1F443}":"nose","\u{1F9E0}":"brain","\u{1FAC0}":"anatomical-heart","\u{1FAC1}":"lungs","\u{1F9B7}":"tooth","\u{1F9B4}":"bone","\u{1F440}":"eyes","\u{1F441}":"eye","\u{1F445}":"tongue","\u{1F444}":"mouth","\u{1FAE6}":"biting-lip","\u{1F476}":"baby","\u{1F9D2}":"child","\u{1F466}":"boy","\u{1F467}":"girl","\u{1F9D1}":"person","\u{1F471}":"person-blond-hair","\u{1F468}":"man","\u{1F9D4}":"person-beard","\u{1F9D4}\u200D\u2642\uFE0F":"man-beard","\u{1F9D4}\u200D\u2640\uFE0F":"woman-beard","\u{1F468}\u200D\u{1F9B0}":"man-red-hair","\u{1F468}\u200D\u{1F9B1}":"man-curly-hair","\u{1F468}\u200D\u{1F9B3}":"man-white-hair","\u{1F468}\u200D\u{1F9B2}":"man-bald","\u{1F469}":"woman","\u{1F469}\u200D\u{1F9B0}":"woman-red-hair","\u{1F9D1}\u200D\u{1F9B0}":"person-red-hair","\u{1F469}\u200D\u{1F9B1}":"woman-curly-hair","\u{1F9D1}\u200D\u{1F9B1}":"person-curly-hair","\u{1F469}\u200D\u{1F9B3}":"woman-white-hair","\u{1F9D1}\u200D\u{1F9B3}":"person-white-hair","\u{1F469}\u200D\u{1F9B2}":"woman-bald","\u{1F9D1}\u200D\u{1F9B2}":"person-bald","\u{1F471}\u200D\u2640\uFE0F":"woman-blond-hair","\u{1F471}\u200D\u2642\uFE0F":"man-blond-hair","\u{1F9D3}":"older-person","\u{1F474}":"old-man","\u{1F475}":"old-woman","\u{1F64D}":"person-frowning","\u{1F64D}\u200D\u2642\uFE0F":"man-frowning","\u{1F64D}\u200D\u2640\uFE0F":"woman-frowning","\u{1F64E}":"person-pouting","\u{1F64E}\u200D\u2642\uFE0F":"man-pouting","\u{1F64E}\u200D\u2640\uFE0F":"woman-pouting","\u{1F645}":"person-gesturing-no","\u{1F645}\u200D\u2642\uFE0F":"man-gesturing-no","\u{1F645}\u200D\u2640\uFE0F":"woman-gesturing-no","\u{1F646}":"person-gesturing-ok","\u{1F646}\u200D\u2642\uFE0F":"man-gesturing-ok","\u{1F646}\u200D\u2640\uFE0F":"woman-gesturing-ok","\u{1F481}":"person-tipping-hand","\u{1F481}\u200D\u2642\uFE0F":"man-tipping-hand","\u{1F481}\u200D\u2640\uFE0F":"woman-tipping-hand","\u{1F64B}":"person-raising-hand","\u{1F64B}\u200D\u2642\uFE0F":"man-raising-hand","\u{1F64B}\u200D\u2640\uFE0F":"woman-raising-hand","\u{1F9CF}":"deaf-person","\u{1F9CF}\u200D\u2642\uFE0F":"deaf-man","\u{1F9CF}\u200D\u2640\uFE0F":"deaf-woman","\u{1F647}":"person-bowing","\u{1F647}\u200D\u2642\uFE0F":"man-bowing","\u{1F647}\u200D\u2640\uFE0F":"woman-bowing","\u{1F926}":"person-facepalming","\u{1F926}\u200D\u2642\uFE0F":"man-facepalming","\u{1F926}\u200D\u2640\uFE0F":"woman-facepalming","\u{1F937}":"person-shrugging","\u{1F937}\u200D\u2642\uFE0F":"man-shrugging","\u{1F937}\u200D\u2640\uFE0F":"woman-shrugging","\u{1F9D1}\u200D\u2695\uFE0F":"health-worker","\u{1F468}\u200D\u2695\uFE0F":"man-health-worker","\u{1F469}\u200D\u2695\uFE0F":"woman-health-worker","\u{1F9D1}\u200D\u{1F393}":"student","\u{1F468}\u200D\u{1F393}":"man-student","\u{1F469}\u200D\u{1F393}":"woman-student","\u{1F9D1}\u200D\u{1F3EB}":"teacher","\u{1F468}\u200D\u{1F3EB}":"man-teacher","\u{1F469}\u200D\u{1F3EB}":"woman-teacher","\u{1F9D1}\u200D\u2696\uFE0F":"judge","\u{1F468}\u200D\u2696\uFE0F":"man-judge","\u{1F469}\u200D\u2696\uFE0F":"woman-judge","\u{1F9D1}\u200D\u{1F33E}":"farmer","\u{1F468}\u200D\u{1F33E}":"man-farmer","\u{1F469}\u200D\u{1F33E}":"woman-farmer","\u{1F9D1}\u200D\u{1F373}":"cook","\u{1F468}\u200D\u{1F373}":"man-cook","\u{1F469}\u200D\u{1F373}":"woman-cook","\u{1F9D1}\u200D\u{1F527}":"mechanic","\u{1F468}\u200D\u{1F527}":"man-mechanic","\u{1F469}\u200D\u{1F527}":"woman-mechanic","\u{1F9D1}\u200D\u{1F3ED}":"factory-worker","\u{1F468}\u200D\u{1F3ED}":"man-factory-worker","\u{1F469}\u200D\u{1F3ED}":"woman-factory-worker","\u{1F9D1}\u200D\u{1F4BC}":"office-worker","\u{1F468}\u200D\u{1F4BC}":"man-office-worker","\u{1F469}\u200D\u{1F4BC}":"woman-office-worker","\u{1F9D1}\u200D\u{1F52C}":"scientist","\u{1F468}\u200D\u{1F52C}":"man-scientist","\u{1F469}\u200D\u{1F52C}":"woman-scientist","\u{1F9D1}\u200D\u{1F4BB}":"technologist","\u{1F468}\u200D\u{1F4BB}":"man-technologist","\u{1F469}\u200D\u{1F4BB}":"woman-technologist","\u{1F9D1}\u200D\u{1F3A4}":"singer","\u{1F468}\u200D\u{1F3A4}":"man-singer","\u{1F469}\u200D\u{1F3A4}":"woman-singer","\u{1F9D1}\u200D\u{1F3A8}":"artist","\u{1F468}\u200D\u{1F3A8}":"man-artist","\u{1F469}\u200D\u{1F3A8}":"woman-artist","\u{1F9D1}\u200D\u2708\uFE0F":"pilot","\u{1F468}\u200D\u2708\uFE0F":"man-pilot","\u{1F469}\u200D\u2708\uFE0F":"woman-pilot","\u{1F9D1}\u200D\u{1F680}":"astronaut","\u{1F468}\u200D\u{1F680}":"man-astronaut","\u{1F469}\u200D\u{1F680}":"woman-astronaut","\u{1F9D1}\u200D\u{1F692}":"firefighter","\u{1F468}\u200D\u{1F692}":"man-firefighter","\u{1F469}\u200D\u{1F692}":"woman-firefighter","\u{1F46E}":"police-officer","\u{1F46E}\u200D\u2642\uFE0F":"man-police-officer","\u{1F46E}\u200D\u2640\uFE0F":"woman-police-officer","\u{1F575}":"detective","\u{1F575}\uFE0F\u200D\u2642\uFE0F":"man-detective","\u{1F575}\uFE0F\u200D\u2640\uFE0F":"woman-detective","\u{1F482}":"guard","\u{1F482}\u200D\u2642\uFE0F":"man-guard","\u{1F482}\u200D\u2640\uFE0F":"woman-guard","\u{1F977}":"ninja","\u{1F477}":"construction-worker","\u{1F477}\u200D\u2642\uFE0F":"man-construction-worker","\u{1F477}\u200D\u2640\uFE0F":"woman-construction-worker","\u{1FAC5}":"person-with-crown","\u{1F934}":"prince","\u{1F478}":"princess","\u{1F473}":"person-wearing-turban","\u{1F473}\u200D\u2642\uFE0F":"man-wearing-turban","\u{1F473}\u200D\u2640\uFE0F":"woman-wearing-turban","\u{1F472}":"person-with-skullcap","\u{1F9D5}":"woman-with-headscarf","\u{1F935}":"person-in-tuxedo","\u{1F935}\u200D\u2642\uFE0F":"man-in-tuxedo","\u{1F935}\u200D\u2640\uFE0F":"woman-in-tuxedo","\u{1F470}":"person-with-veil","\u{1F470}\u200D\u2642\uFE0F":"man-with-veil","\u{1F470}\u200D\u2640\uFE0F":"woman-with-veil","\u{1F930}":"pregnant-woman","\u{1FAC3}":"pregnant-man","\u{1FAC4}":"pregnant-person","\u{1F931}":"breast-feeding","\u{1F469}\u200D\u{1F37C}":"woman-feeding-baby","\u{1F468}\u200D\u{1F37C}":"man-feeding-baby","\u{1F9D1}\u200D\u{1F37C}":"person-feeding-baby","\u{1F47C}":"baby-angel","\u{1F385}":"santa-claus","\u{1F936}":"mrs-claus","\u{1F9D1}\u200D\u{1F384}":"mx-claus","\u{1F9B8}":"superhero","\u{1F9B8}\u200D\u2642\uFE0F":"man-superhero","\u{1F9B8}\u200D\u2640\uFE0F":"woman-superhero","\u{1F9B9}":"supervillain","\u{1F9B9}\u200D\u2642\uFE0F":"man-supervillain","\u{1F9B9}\u200D\u2640\uFE0F":"woman-supervillain","\u{1F9D9}":"mage","\u{1F9D9}\u200D\u2642\uFE0F":"man-mage","\u{1F9D9}\u200D\u2640\uFE0F":"woman-mage","\u{1F9DA}":"fairy","\u{1F9DA}\u200D\u2642\uFE0F":"man-fairy","\u{1F9DA}\u200D\u2640\uFE0F":"woman-fairy","\u{1F9DB}":"vampire","\u{1F9DB}\u200D\u2642\uFE0F":"man-vampire","\u{1F9DB}\u200D\u2640\uFE0F":"woman-vampire","\u{1F9DC}":"merperson","\u{1F9DC}\u200D\u2642\uFE0F":"merman","\u{1F9DC}\u200D\u2640\uFE0F":"mermaid","\u{1F9DD}":"elf","\u{1F9DD}\u200D\u2642\uFE0F":"man-elf","\u{1F9DD}\u200D\u2640\uFE0F":"woman-elf","\u{1F9DE}":"genie","\u{1F9DE}\u200D\u2642\uFE0F":"man-genie","\u{1F9DE}\u200D\u2640\uFE0F":"woman-genie","\u{1F9DF}":"zombie","\u{1F9DF}\u200D\u2642\uFE0F":"man-zombie","\u{1F9DF}\u200D\u2640\uFE0F":"woman-zombie","\u{1F9CC}":"troll","\u{1F486}":"person-getting-massage","\u{1F486}\u200D\u2642\uFE0F":"man-getting-massage","\u{1F486}\u200D\u2640\uFE0F":"woman-getting-massage","\u{1F487}":"person-getting-haircut","\u{1F487}\u200D\u2642\uFE0F":"man-getting-haircut","\u{1F487}\u200D\u2640\uFE0F":"woman-getting-haircut","\u{1F6B6}":"person-walking","\u{1F6B6}\u200D\u2642\uFE0F":"man-walking","\u{1F6B6}\u200D\u2640\uFE0F":"woman-walking","\u{1F9CD}":"person-standing","\u{1F9CD}\u200D\u2642\uFE0F":"man-standing","\u{1F9CD}\u200D\u2640\uFE0F":"woman-standing","\u{1F9CE}":"person-kneeling","\u{1F9CE}\u200D\u2642\uFE0F":"man-kneeling","\u{1F9CE}\u200D\u2640\uFE0F":"woman-kneeling","\u{1F9D1}\u200D\u{1F9AF}":"person-with-white-cane","\u{1F468}\u200D\u{1F9AF}":"man-with-white-cane","\u{1F469}\u200D\u{1F9AF}":"woman-with-white-cane","\u{1F9D1}\u200D\u{1F9BC}":"person-in-motorized-wheelchair","\u{1F468}\u200D\u{1F9BC}":"man-in-motorized-wheelchair","\u{1F469}\u200D\u{1F9BC}":"woman-in-motorized-wheelchair","\u{1F9D1}\u200D\u{1F9BD}":"person-in-manual-wheelchair","\u{1F468}\u200D\u{1F9BD}":"man-in-manual-wheelchair","\u{1F469}\u200D\u{1F9BD}":"woman-in-manual-wheelchair","\u{1F3C3}":"person-running","\u{1F3C3}\u200D\u2642\uFE0F":"man-running","\u{1F3C3}\u200D\u2640\uFE0F":"woman-running","\u{1F483}":"woman-dancing","\u{1F57A}":"man-dancing","\u{1F574}":"person-in-suit-levitating","\u{1F46F}":"people-with-bunny-ears","\u{1F46F}\u200D\u2642\uFE0F":"men-with-bunny-ears","\u{1F46F}\u200D\u2640\uFE0F":"women-with-bunny-ears","\u{1F9D6}":"person-in-steamy-room","\u{1F9D6}\u200D\u2642\uFE0F":"man-in-steamy-room","\u{1F9D6}\u200D\u2640\uFE0F":"woman-in-steamy-room","\u{1F9D7}":"person-climbing","\u{1F9D7}\u200D\u2642\uFE0F":"man-climbing","\u{1F9D7}\u200D\u2640\uFE0F":"woman-climbing","\u{1F93A}":"person-fencing","\u{1F3C7}":"horse-racing","\u26F7":"skier","\u{1F3C2}":"snowboarder","\u{1F3CC}":"person-golfing","\u{1F3CC}\uFE0F\u200D\u2642\uFE0F":"man-golfing","\u{1F3CC}\uFE0F\u200D\u2640\uFE0F":"woman-golfing","\u{1F3C4}":"person-surfing","\u{1F3C4}\u200D\u2642\uFE0F":"man-surfing","\u{1F3C4}\u200D\u2640\uFE0F":"woman-surfing","\u{1F6A3}":"person-rowing-boat","\u{1F6A3}\u200D\u2642\uFE0F":"man-rowing-boat","\u{1F6A3}\u200D\u2640\uFE0F":"woman-rowing-boat","\u{1F3CA}":"person-swimming","\u{1F3CA}\u200D\u2642\uFE0F":"man-swimming","\u{1F3CA}\u200D\u2640\uFE0F":"woman-swimming","\u26F9":"person-bouncing-ball","\u26F9\uFE0F\u200D\u2642\uFE0F":"man-bouncing-ball","\u26F9\uFE0F\u200D\u2640\uFE0F":"woman-bouncing-ball","\u{1F3CB}":"person-lifting-weights","\u{1F3CB}\uFE0F\u200D\u2642\uFE0F":"man-lifting-weights","\u{1F3CB}\uFE0F\u200D\u2640\uFE0F":"woman-lifting-weights","\u{1F6B4}":"person-biking","\u{1F6B4}\u200D\u2642\uFE0F":"man-biking","\u{1F6B4}\u200D\u2640\uFE0F":"woman-biking","\u{1F6B5}":"person-mountain-biking","\u{1F6B5}\u200D\u2642\uFE0F":"man-mountain-biking","\u{1F6B5}\u200D\u2640\uFE0F":"woman-mountain-biking","\u{1F938}":"person-cartwheeling","\u{1F938}\u200D\u2642\uFE0F":"man-cartwheeling","\u{1F938}\u200D\u2640\uFE0F":"woman-cartwheeling","\u{1F93C}":"people-wrestling","\u{1F93C}\u200D\u2642\uFE0F":"men-wrestling","\u{1F93C}\u200D\u2640\uFE0F":"women-wrestling","\u{1F93D}":"person-playing-water-polo","\u{1F93D}\u200D\u2642\uFE0F":"man-playing-water-polo","\u{1F93D}\u200D\u2640\uFE0F":"woman-playing-water-polo","\u{1F93E}":"person-playing-handball","\u{1F93E}\u200D\u2642\uFE0F":"man-playing-handball","\u{1F93E}\u200D\u2640\uFE0F":"woman-playing-handball","\u{1F939}":"person-juggling","\u{1F939}\u200D\u2642\uFE0F":"man-juggling","\u{1F939}\u200D\u2640\uFE0F":"woman-juggling","\u{1F9D8}":"person-in-lotus-position","\u{1F9D8}\u200D\u2642\uFE0F":"man-in-lotus-position","\u{1F9D8}\u200D\u2640\uFE0F":"woman-in-lotus-position","\u{1F6C0}":"person-taking-bath","\u{1F6CC}":"person-in-bed","\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1}":"people-holding-hands","\u{1F46D}":"women-holding-hands","\u{1F46B}":"woman-and-man-holding-hands","\u{1F46C}":"men-holding-hands","\u{1F48F}":"kiss","\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}":"kiss-woman,-man","\u{1F468}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}":"kiss-man,-man","\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}":"kiss-woman,-woman","\u{1F491}":"couple-with-heart","\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F468}":"couple-with-heart-woman,-man","\u{1F468}\u200D\u2764\uFE0F\u200D\u{1F468}":"couple-with-heart-man,-man","\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F469}":"couple-with-heart-woman,-woman","\u{1F46A}":"family","\u{1F468}\u200D\u{1F469}\u200D\u{1F466}":"family-man,-woman,-boy","\u{1F468}\u200D\u{1F469}\u200D\u{1F467}":"family-man,-woman,-girl","\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}":"family-man,-woman,-girl,-boy","\u{1F468}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466}":"family-man,-woman,-boy,-boy","\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F467}":"family-man,-woman,-girl,-girl","\u{1F468}\u200D\u{1F468}\u200D\u{1F466}":"family-man,-man,-boy","\u{1F468}\u200D\u{1F468}\u200D\u{1F467}":"family-man,-man,-girl","\u{1F468}\u200D\u{1F468}\u200D\u{1F467}\u200D\u{1F466}":"family-man,-man,-girl,-boy","\u{1F468}\u200D\u{1F468}\u200D\u{1F466}\u200D\u{1F466}":"family-man,-man,-boy,-boy","\u{1F468}\u200D\u{1F468}\u200D\u{1F467}\u200D\u{1F467}":"family-man,-man,-girl,-girl","\u{1F469}\u200D\u{1F469}\u200D\u{1F466}":"family-woman,-woman,-boy","\u{1F469}\u200D\u{1F469}\u200D\u{1F467}":"family-woman,-woman,-girl","\u{1F469}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}":"family-woman,-woman,-girl,-boy","\u{1F469}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466}":"family-woman,-woman,-boy,-boy","\u{1F469}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F467}":"family-woman,-woman,-girl,-girl","\u{1F468}\u200D\u{1F466}":"family-man,-boy","\u{1F468}\u200D\u{1F466}\u200D\u{1F466}":"family-man,-boy,-boy","\u{1F468}\u200D\u{1F467}":"family-man,-girl","\u{1F468}\u200D\u{1F467}\u200D\u{1F466}":"family-man,-girl,-boy","\u{1F468}\u200D\u{1F467}\u200D\u{1F467}":"family-man,-girl,-girl","\u{1F469}\u200D\u{1F466}":"family-woman,-boy","\u{1F469}\u200D\u{1F466}\u200D\u{1F466}":"family-woman,-boy,-boy","\u{1F469}\u200D\u{1F467}":"family-woman,-girl","\u{1F469}\u200D\u{1F467}\u200D\u{1F466}":"family-woman,-girl,-boy","\u{1F469}\u200D\u{1F467}\u200D\u{1F467}":"family-woman,-girl,-girl","\u{1F5E3}":"speaking-head","\u{1F464}":"bust-in-silhouette","\u{1F465}":"busts-in-silhouette","\u{1FAC2}":"people-hugging","\u{1F463}":"footprints","\u{1F9B0}":"red-hair","\u{1F9B1}":"curly-hair","\u{1F9B3}":"white-hair","\u{1F9B2}":"bald","\u{1F435}":"monkey-face","\u{1F412}":"monkey","\u{1F98D}":"gorilla","\u{1F9A7}":"orangutan","\u{1F436}":"dog-face","\u{1F415}":"dog","\u{1F9AE}":"guide-dog","\u{1F415}\u200D\u{1F9BA}":"service-dog","\u{1F429}":"poodle","\u{1F43A}":"wolf","\u{1F98A}":"fox","\u{1F99D}":"raccoon","\u{1F431}":"cat-face","\u{1F408}":"cat","\u{1F408}\u200D\u2B1B":"black-cat","\u{1F981}":"lion","\u{1F42F}":"tiger-face","\u{1F405}":"tiger","\u{1F406}":"leopard","\u{1F434}":"horse-face","\u{1FACE}":"\u229B-moose","\u{1FACF}":"\u229B-donkey","\u{1F40E}":"horse","\u{1F984}":"unicorn","\u{1F993}":"zebra","\u{1F98C}":"deer","\u{1F9AC}":"bison","\u{1F42E}":"cow-face","\u{1F402}":"ox","\u{1F403}":"water-buffalo","\u{1F404}":"cow","\u{1F437}":"pig-face","\u{1F416}":"pig","\u{1F417}":"boar","\u{1F43D}":"pig-nose","\u{1F40F}":"ram","\u{1F411}":"ewe","\u{1F410}":"goat","\u{1F42A}":"camel","\u{1F42B}":"two-hump-camel","\u{1F999}":"llama","\u{1F992}":"giraffe","\u{1F418}":"elephant","\u{1F9A3}":"mammoth","\u{1F98F}":"rhinoceros","\u{1F99B}":"hippopotamus","\u{1F42D}":"mouse-face","\u{1F401}":"mouse","\u{1F400}":"rat","\u{1F439}":"hamster","\u{1F430}":"rabbit-face","\u{1F407}":"rabbit","\u{1F43F}":"chipmunk","\u{1F9AB}":"beaver","\u{1F994}":"hedgehog","\u{1F987}":"bat","\u{1F43B}":"bear","\u{1F43B}\u200D\u2744\uFE0F":"polar-bear","\u{1F428}":"koala","\u{1F43C}":"panda","\u{1F9A5}":"sloth","\u{1F9A6}":"otter","\u{1F9A8}":"skunk","\u{1F998}":"kangaroo","\u{1F9A1}":"badger","\u{1F43E}":"paw-prints","\u{1F983}":"turkey","\u{1F414}":"chicken","\u{1F413}":"rooster","\u{1F423}":"hatching-chick","\u{1F424}":"baby-chick","\u{1F425}":"front-facing-baby-chick","\u{1F426}":"bird","\u{1F427}":"penguin","\u{1F54A}":"dove","\u{1F985}":"eagle","\u{1F986}":"duck","\u{1F9A2}":"swan","\u{1F989}":"owl","\u{1F9A4}":"dodo","\u{1FAB6}":"feather","\u{1F9A9}":"flamingo","\u{1F99A}":"peacock","\u{1F99C}":"parrot","\u{1FABD}":"\u229B-wing","\u{1F426}\u200D\u2B1B":"\u229B-black-bird","\u{1FABF}":"\u229B-goose","\u{1F438}":"frog","\u{1F40A}":"crocodile","\u{1F422}":"turtle","\u{1F98E}":"lizard","\u{1F40D}":"snake","\u{1F432}":"dragon-face","\u{1F409}":"dragon","\u{1F995}":"sauropod","\u{1F996}":"t-rex","\u{1F433}":"spouting-whale","\u{1F40B}":"whale","\u{1F42C}":"dolphin","\u{1F9AD}":"seal","\u{1F41F}":"fish","\u{1F420}":"tropical-fish","\u{1F421}":"blowfish","\u{1F988}":"shark","\u{1F419}":"octopus","\u{1F41A}":"spiral-shell","\u{1FAB8}":"coral","\u{1FABC}":"\u229B-jellyfish","\u{1F40C}":"snail","\u{1F98B}":"butterfly","\u{1F41B}":"bug","\u{1F41C}":"ant","\u{1F41D}":"honeybee","\u{1FAB2}":"beetle","\u{1F41E}":"lady-beetle","\u{1F997}":"cricket","\u{1FAB3}":"cockroach","\u{1F577}":"spider","\u{1F578}":"spider-web","\u{1F982}":"scorpion","\u{1F99F}":"mosquito","\u{1FAB0}":"fly","\u{1FAB1}":"worm","\u{1F9A0}":"microbe","\u{1F490}":"bouquet","\u{1F338}":"cherry-blossom","\u{1F4AE}":"white-flower","\u{1FAB7}":"lotus","\u{1F3F5}":"rosette","\u{1F339}":"rose","\u{1F940}":"wilted-flower","\u{1F33A}":"hibiscus","\u{1F33B}":"sunflower","\u{1F33C}":"blossom","\u{1F337}":"tulip","\u{1FABB}":"\u229B-hyacinth","\u{1F331}":"seedling","\u{1FAB4}":"potted-plant","\u{1F332}":"evergreen-tree","\u{1F333}":"deciduous-tree","\u{1F334}":"palm-tree","\u{1F335}":"cactus","\u{1F33E}":"sheaf-of-rice","\u{1F33F}":"herb","\u2618":"shamrock","\u{1F340}":"four-leaf-clover","\u{1F341}":"maple-leaf","\u{1F342}":"fallen-leaf","\u{1F343}":"leaf-fluttering-in-wind","\u{1FAB9}":"empty-nest","\u{1FABA}":"nest-with-eggs","\u{1F344}":"mushroom","\u{1F347}":"grapes","\u{1F348}":"melon","\u{1F349}":"watermelon","\u{1F34A}":"tangerine","\u{1F34B}":"lemon","\u{1F34C}":"banana","\u{1F34D}":"pineapple","\u{1F96D}":"mango","\u{1F34E}":"red-apple","\u{1F34F}":"green-apple","\u{1F350}":"pear","\u{1F351}":"peach","\u{1F352}":"cherries","\u{1F353}":"strawberry","\u{1FAD0}":"blueberries","\u{1F95D}":"kiwi-fruit","\u{1F345}":"tomato","\u{1FAD2}":"olive","\u{1F965}":"coconut","\u{1F951}":"avocado","\u{1F346}":"eggplant","\u{1F954}":"potato","\u{1F955}":"carrot","\u{1F33D}":"ear-of-corn","\u{1F336}":"hot-pepper","\u{1FAD1}":"bell-pepper","\u{1F952}":"cucumber","\u{1F96C}":"leafy-green","\u{1F966}":"broccoli","\u{1F9C4}":"garlic","\u{1F9C5}":"onion","\u{1F95C}":"peanuts","\u{1FAD8}":"beans","\u{1F330}":"chestnut","\u{1FADA}":"\u229B-ginger-root","\u{1FADB}":"\u229B-pea-pod","\u{1F35E}":"bread","\u{1F950}":"croissant","\u{1F956}":"baguette-bread","\u{1FAD3}":"flatbread","\u{1F968}":"pretzel","\u{1F96F}":"bagel","\u{1F95E}":"pancakes","\u{1F9C7}":"waffle","\u{1F9C0}":"cheese-wedge","\u{1F356}":"meat-on-bone","\u{1F357}":"poultry-leg","\u{1F969}":"cut-of-meat","\u{1F953}":"bacon","\u{1F354}":"hamburger","\u{1F35F}":"french-fries","\u{1F355}":"pizza","\u{1F32D}":"hot-dog","\u{1F96A}":"sandwich","\u{1F32E}":"taco","\u{1F32F}":"burrito","\u{1FAD4}":"tamale","\u{1F959}":"stuffed-flatbread","\u{1F9C6}":"falafel","\u{1F95A}":"egg","\u{1F373}":"cooking","\u{1F958}":"shallow-pan-of-food","\u{1F372}":"pot-of-food","\u{1FAD5}":"fondue","\u{1F963}":"bowl-with-spoon","\u{1F957}":"green-salad","\u{1F37F}":"popcorn","\u{1F9C8}":"butter","\u{1F9C2}":"salt","\u{1F96B}":"canned-food","\u{1F371}":"bento-box","\u{1F358}":"rice-cracker","\u{1F359}":"rice-ball","\u{1F35A}":"cooked-rice","\u{1F35B}":"curry-rice","\u{1F35C}":"steaming-bowl","\u{1F35D}":"spaghetti","\u{1F360}":"roasted-sweet-potato","\u{1F362}":"oden","\u{1F363}":"sushi","\u{1F364}":"fried-shrimp","\u{1F365}":"fish-cake-with-swirl","\u{1F96E}":"moon-cake","\u{1F361}":"dango","\u{1F95F}":"dumpling","\u{1F960}":"fortune-cookie","\u{1F961}":"takeout-box","\u{1F980}":"crab","\u{1F99E}":"lobster","\u{1F990}":"shrimp","\u{1F991}":"squid","\u{1F9AA}":"oyster","\u{1F366}":"soft-ice-cream","\u{1F367}":"shaved-ice","\u{1F368}":"ice-cream","\u{1F369}":"doughnut","\u{1F36A}":"cookie","\u{1F382}":"birthday-cake","\u{1F370}":"shortcake","\u{1F9C1}":"cupcake","\u{1F967}":"pie","\u{1F36B}":"chocolate-bar","\u{1F36C}":"candy","\u{1F36D}":"lollipop","\u{1F36E}":"custard","\u{1F36F}":"honey-pot","\u{1F37C}":"baby-bottle","\u{1F95B}":"glass-of-milk","\u2615":"hot-beverage","\u{1FAD6}":"teapot","\u{1F375}":"teacup-without-handle","\u{1F376}":"sake","\u{1F37E}":"bottle-with-popping-cork","\u{1F377}":"wine-glass","\u{1F378}":"cocktail-glass","\u{1F379}":"tropical-drink","\u{1F37A}":"beer-mug","\u{1F37B}":"clinking-beer-mugs","\u{1F942}":"clinking-glasses","\u{1F943}":"tumbler-glass","\u{1FAD7}":"pouring-liquid","\u{1F964}":"cup-with-straw","\u{1F9CB}":"bubble-tea","\u{1F9C3}":"beverage-box","\u{1F9C9}":"mate","\u{1F9CA}":"ice","\u{1F962}":"chopsticks","\u{1F37D}":"fork-and-knife-with-plate","\u{1F374}":"fork-and-knife","\u{1F944}":"spoon","\u{1F52A}":"kitchen-knife","\u{1FAD9}":"jar","\u{1F3FA}":"amphora","\u{1F30D}":"globe-showing-europe-africa","\u{1F30E}":"globe-showing-americas","\u{1F30F}":"globe-showing-asia-australia","\u{1F310}":"globe-with-meridians","\u{1F5FA}":"world-map","\u{1F5FE}":"map-of-japan","\u{1F9ED}":"compass","\u{1F3D4}":"snow-capped-mountain","\u26F0":"mountain","\u{1F30B}":"volcano","\u{1F5FB}":"mount-fuji","\u{1F3D5}":"camping","\u{1F3D6}":"beach-with-umbrella","\u{1F3DC}":"desert","\u{1F3DD}":"desert-island","\u{1F3DE}":"national-park","\u{1F3DF}":"stadium","\u{1F3DB}":"classical-building","\u{1F3D7}":"building-construction","\u{1F9F1}":"brick","\u{1FAA8}":"rock","\u{1FAB5}":"wood","\u{1F6D6}":"hut","\u{1F3D8}":"houses","\u{1F3DA}":"derelict-house","\u{1F3E0}":"house","\u{1F3E1}":"house-with-garden","\u{1F3E2}":"office-building","\u{1F3E3}":"japanese-post-office","\u{1F3E4}":"post-office","\u{1F3E5}":"hospital","\u{1F3E6}":"bank","\u{1F3E8}":"hotel","\u{1F3E9}":"love-hotel","\u{1F3EA}":"convenience-store","\u{1F3EB}":"school","\u{1F3EC}":"department-store","\u{1F3ED}":"factory","\u{1F3EF}":"japanese-castle","\u{1F3F0}":"castle","\u{1F492}":"wedding","\u{1F5FC}":"tokyo-tower","\u{1F5FD}":"statue-of-liberty","\u26EA":"church","\u{1F54C}":"mosque","\u{1F6D5}":"hindu-temple","\u{1F54D}":"synagogue","\u26E9":"shinto-shrine","\u{1F54B}":"kaaba","\u26F2":"fountain","\u26FA":"tent","\u{1F301}":"foggy","\u{1F303}":"night-with-stars","\u{1F3D9}":"cityscape","\u{1F304}":"sunrise-over-mountains","\u{1F305}":"sunrise","\u{1F306}":"cityscape-at-dusk","\u{1F307}":"sunset","\u{1F309}":"bridge-at-night","\u2668":"hot-springs","\u{1F3A0}":"carousel-horse","\u{1F6DD}":"playground-slide","\u{1F3A1}":"ferris-wheel","\u{1F3A2}":"roller-coaster","\u{1F488}":"barber-pole","\u{1F3AA}":"circus-tent","\u{1F682}":"locomotive","\u{1F683}":"railway-car","\u{1F684}":"high-speed-train","\u{1F685}":"bullet-train","\u{1F686}":"train","\u{1F687}":"metro","\u{1F688}":"light-rail","\u{1F689}":"station","\u{1F68A}":"tram","\u{1F69D}":"monorail","\u{1F69E}":"mountain-railway","\u{1F68B}":"tram-car","\u{1F68C}":"bus","\u{1F68D}":"oncoming-bus","\u{1F68E}":"trolleybus","\u{1F690}":"minibus","\u{1F691}":"ambulance","\u{1F692}":"fire-engine","\u{1F693}":"police-car","\u{1F694}":"oncoming-police-car","\u{1F695}":"taxi","\u{1F696}":"oncoming-taxi","\u{1F697}":"automobile","\u{1F698}":"oncoming-automobile","\u{1F699}":"sport-utility-vehicle","\u{1F6FB}":"pickup-truck","\u{1F69A}":"delivery-truck","\u{1F69B}":"articulated-lorry","\u{1F69C}":"tractor","\u{1F3CE}":"racing-car","\u{1F3CD}":"motorcycle","\u{1F6F5}":"motor-scooter","\u{1F9BD}":"manual-wheelchair","\u{1F9BC}":"motorized-wheelchair","\u{1F6FA}":"auto-rickshaw","\u{1F6B2}":"bicycle","\u{1F6F4}":"kick-scooter","\u{1F6F9}":"skateboard","\u{1F6FC}":"roller-skate","\u{1F68F}":"bus-stop","\u{1F6E3}":"motorway","\u{1F6E4}":"railway-track","\u{1F6E2}":"oil-drum","\u26FD":"fuel-pump","\u{1F6DE}":"wheel","\u{1F6A8}":"police-car-light","\u{1F6A5}":"horizontal-traffic-light","\u{1F6A6}":"vertical-traffic-light","\u{1F6D1}":"stop-sign","\u{1F6A7}":"construction","\u2693":"anchor","\u{1F6DF}":"ring-buoy","\u26F5":"sailboat","\u{1F6F6}":"canoe","\u{1F6A4}":"speedboat","\u{1F6F3}":"passenger-ship","\u26F4":"ferry","\u{1F6E5}":"motor-boat","\u{1F6A2}":"ship","\u2708":"airplane","\u{1F6E9}":"small-airplane","\u{1F6EB}":"airplane-departure","\u{1F6EC}":"airplane-arrival","\u{1FA82}":"parachute","\u{1F4BA}":"seat","\u{1F681}":"helicopter","\u{1F69F}":"suspension-railway","\u{1F6A0}":"mountain-cableway","\u{1F6A1}":"aerial-tramway","\u{1F6F0}":"satellite","\u{1F680}":"rocket","\u{1F6F8}":"flying-saucer","\u{1F6CE}":"bellhop-bell","\u{1F9F3}":"luggage","\u231B":"hourglass-done","\u23F3":"hourglass-not-done","\u231A":"watch","\u23F0":"alarm-clock","\u23F1":"stopwatch","\u23F2":"timer-clock","\u{1F570}":"mantelpiece-clock","\u{1F55B}":"twelve-o-clock","\u{1F567}":"twelve-thirty","\u{1F550}":"one-o-clock","\u{1F55C}":"one-thirty","\u{1F551}":"two-o-clock","\u{1F55D}":"two-thirty","\u{1F552}":"three-o-clock","\u{1F55E}":"three-thirty","\u{1F553}":"four-o-clock","\u{1F55F}":"four-thirty","\u{1F554}":"five-o-clock","\u{1F560}":"five-thirty","\u{1F555}":"six-o-clock","\u{1F561}":"six-thirty","\u{1F556}":"seven-o-clock","\u{1F562}":"seven-thirty","\u{1F557}":"eight-o-clock","\u{1F563}":"eight-thirty","\u{1F558}":"nine-o-clock","\u{1F564}":"nine-thirty","\u{1F559}":"ten-o-clock","\u{1F565}":"ten-thirty","\u{1F55A}":"eleven-o-clock","\u{1F566}":"eleven-thirty","\u{1F311}":"new-moon","\u{1F312}":"waxing-crescent-moon","\u{1F313}":"first-quarter-moon","\u{1F314}":"waxing-gibbous-moon","\u{1F315}":"full-moon","\u{1F316}":"waning-gibbous-moon","\u{1F317}":"last-quarter-moon","\u{1F318}":"waning-crescent-moon","\u{1F319}":"crescent-moon","\u{1F31A}":"new-moon-face","\u{1F31B}":"first-quarter-moon-face","\u{1F31C}":"last-quarter-moon-face","\u{1F321}":"thermometer","\u2600":"sun","\u{1F31D}":"full-moon-face","\u{1F31E}":"sun-with-face","\u{1FA90}":"ringed-planet","\u2B50":"star","\u{1F31F}":"glowing-star","\u{1F320}":"shooting-star","\u{1F30C}":"milky-way","\u2601":"cloud","\u26C5":"sun-behind-cloud","\u26C8":"cloud-with-lightning-and-rain","\u{1F324}":"sun-behind-small-cloud","\u{1F325}":"sun-behind-large-cloud","\u{1F326}":"sun-behind-rain-cloud","\u{1F327}":"cloud-with-rain","\u{1F328}":"cloud-with-snow","\u{1F329}":"cloud-with-lightning","\u{1F32A}":"tornado","\u{1F32B}":"fog","\u{1F32C}":"wind-face","\u{1F300}":"cyclone","\u{1F308}":"rainbow","\u{1F302}":"closed-umbrella","\u2602":"umbrella","\u2614":"umbrella-with-rain-drops","\u26F1":"umbrella-on-ground","\u26A1":"high-voltage","\u2744":"snowflake","\u2603":"snowman","\u26C4":"snowman-without-snow","\u2604":"comet","\u{1F525}":"fire","\u{1F4A7}":"droplet","\u{1F30A}":"water-wave","\u{1F383}":"jack-o-lantern","\u{1F384}":"christmas-tree","\u{1F386}":"fireworks","\u{1F387}":"sparkler","\u{1F9E8}":"firecracker","\u2728":"sparkles","\u{1F388}":"balloon","\u{1F389}":"party-popper","\u{1F38A}":"confetti-ball","\u{1F38B}":"tanabata-tree","\u{1F38D}":"pine-decoration","\u{1F38E}":"japanese-dolls","\u{1F38F}":"carp-streamer","\u{1F390}":"wind-chime","\u{1F391}":"moon-viewing-ceremony","\u{1F9E7}":"red-envelope","\u{1F380}":"ribbon","\u{1F381}":"wrapped-gift","\u{1F397}":"reminder-ribbon","\u{1F39F}":"admission-tickets","\u{1F3AB}":"ticket","\u{1F396}":"military-medal","\u{1F3C6}":"trophy","\u{1F3C5}":"sports-medal","\u{1F947}":"1st-place-medal","\u{1F948}":"2nd-place-medal","\u{1F949}":"3rd-place-medal","\u26BD":"soccer-ball","\u26BE":"baseball","\u{1F94E}":"softball","\u{1F3C0}":"basketball","\u{1F3D0}":"volleyball","\u{1F3C8}":"american-football","\u{1F3C9}":"rugby-football","\u{1F3BE}":"tennis","\u{1F94F}":"flying-disc","\u{1F3B3}":"bowling","\u{1F3CF}":"cricket-game","\u{1F3D1}":"field-hockey","\u{1F3D2}":"ice-hockey","\u{1F94D}":"lacrosse","\u{1F3D3}":"ping-pong","\u{1F3F8}":"badminton","\u{1F94A}":"boxing-glove","\u{1F94B}":"martial-arts-uniform","\u{1F945}":"goal-net","\u26F3":"flag-in-hole","\u26F8":"ice-skate","\u{1F3A3}":"fishing-pole","\u{1F93F}":"diving-mask","\u{1F3BD}":"running-shirt","\u{1F3BF}":"skis","\u{1F6F7}":"sled","\u{1F94C}":"curling-stone","\u{1F3AF}":"bullseye","\u{1FA80}":"yo-yo","\u{1FA81}":"kite","\u{1F52B}":"water-pistol","\u{1F3B1}":"pool-8-ball","\u{1F52E}":"crystal-ball","\u{1FA84}":"magic-wand","\u{1F3AE}":"video-game","\u{1F579}":"joystick","\u{1F3B0}":"slot-machine","\u{1F3B2}":"game-die","\u{1F9E9}":"puzzle-piece","\u{1F9F8}":"teddy-bear","\u{1FA85}":"pi\xF1ata","\u{1FAA9}":"mirror-ball","\u{1FA86}":"nesting-dolls","\u2660":"spade-suit","\u2665":"heart-suit","\u2666":"diamond-suit","\u2663":"club-suit","\u265F":"chess-pawn","\u{1F0CF}":"joker","\u{1F004}":"mahjong-red-dragon","\u{1F3B4}":"flower-playing-cards","\u{1F3AD}":"performing-arts","\u{1F5BC}":"framed-picture","\u{1F3A8}":"artist-palette","\u{1F9F5}":"thread","\u{1FAA1}":"sewing-needle","\u{1F9F6}":"yarn","\u{1FAA2}":"knot","\u{1F453}":"glasses","\u{1F576}":"sunglasses","\u{1F97D}":"goggles","\u{1F97C}":"lab-coat","\u{1F9BA}":"safety-vest","\u{1F454}":"necktie","\u{1F455}":"t-shirt","\u{1F456}":"jeans","\u{1F9E3}":"scarf","\u{1F9E4}":"gloves","\u{1F9E5}":"coat","\u{1F9E6}":"socks","\u{1F457}":"dress","\u{1F458}":"kimono","\u{1F97B}":"sari","\u{1FA71}":"one-piece-swimsuit","\u{1FA72}":"briefs","\u{1FA73}":"shorts","\u{1F459}":"bikini","\u{1F45A}":"woman-s-clothes","\u{1FAAD}":"\u229B-folding-hand-fan","\u{1F45B}":"purse","\u{1F45C}":"handbag","\u{1F45D}":"clutch-bag","\u{1F6CD}":"shopping-bags","\u{1F392}":"backpack","\u{1FA74}":"thong-sandal","\u{1F45E}":"man-s-shoe","\u{1F45F}":"running-shoe","\u{1F97E}":"hiking-boot","\u{1F97F}":"flat-shoe","\u{1F460}":"high-heeled-shoe","\u{1F461}":"woman-s-sandal","\u{1FA70}":"ballet-shoes","\u{1F462}":"woman-s-boot","\u{1FAAE}":"\u229B-hair-pick","\u{1F451}":"crown","\u{1F452}":"woman-s-hat","\u{1F3A9}":"top-hat","\u{1F393}":"graduation-cap","\u{1F9E2}":"billed-cap","\u{1FA96}":"military-helmet","\u26D1":"rescue-worker-s-helmet","\u{1F4FF}":"prayer-beads","\u{1F484}":"lipstick","\u{1F48D}":"ring","\u{1F48E}":"gem-stone","\u{1F507}":"muted-speaker","\u{1F508}":"speaker-low-volume","\u{1F509}":"speaker-medium-volume","\u{1F50A}":"speaker-high-volume","\u{1F4E2}":"loudspeaker","\u{1F4E3}":"megaphone","\u{1F4EF}":"postal-horn","\u{1F514}":"bell","\u{1F515}":"bell-with-slash","\u{1F3BC}":"musical-score","\u{1F3B5}":"musical-note","\u{1F3B6}":"musical-notes","\u{1F399}":"studio-microphone","\u{1F39A}":"level-slider","\u{1F39B}":"control-knobs","\u{1F3A4}":"microphone","\u{1F3A7}":"headphone","\u{1F4FB}":"radio","\u{1F3B7}":"saxophone","\u{1FA97}":"accordion","\u{1F3B8}":"guitar","\u{1F3B9}":"musical-keyboard","\u{1F3BA}":"trumpet","\u{1F3BB}":"violin","\u{1FA95}":"banjo","\u{1F941}":"drum","\u{1FA98}":"long-drum","\u{1FA87}":"maracas","\u{1FA88}":"flute","\u{1F4F1}":"mobile-phone","\u{1F4F2}":"mobile-phone-with-arrow","\u260E":"telephone","\u{1F4DE}":"telephone-receiver","\u{1F4DF}":"pager","\u{1F4E0}":"fax-machine","\u{1F50B}":"battery","\u{1FAAB}":"low-battery","\u{1F50C}":"electric-plug","\u{1F4BB}":"laptop","\u{1F5A5}":"desktop-computer","\u{1F5A8}":"printer","\u2328":"keyboard","\u{1F5B1}":"computer-mouse","\u{1F5B2}":"trackball","\u{1F4BD}":"computer-disk","\u{1F4BE}":"floppy-disk","\u{1F4BF}":"optical-disk","\u{1F4C0}":"dvd","\u{1F9EE}":"abacus","\u{1F3A5}":"movie-camera","\u{1F39E}":"film-frames","\u{1F4FD}":"film-projector","\u{1F3AC}":"clapper-board","\u{1F4FA}":"television","\u{1F4F7}":"camera","\u{1F4F8}":"camera-with-flash","\u{1F4F9}":"video-camera","\u{1F4FC}":"videocassette","\u{1F50D}":"magnifying-glass-tilted-left","\u{1F50E}":"magnifying-glass-tilted-right","\u{1F56F}":"candle","\u{1F4A1}":"light-bulb","\u{1F526}":"flashlight","\u{1F3EE}":"red-paper-lantern","\u{1FA94}":"diya-lamp","\u{1F4D4}":"notebook-with-decorative-cover","\u{1F4D5}":"closed-book","\u{1F4D6}":"open-book","\u{1F4D7}":"green-book","\u{1F4D8}":"blue-book","\u{1F4D9}":"orange-book","\u{1F4DA}":"books","\u{1F4D3}":"notebook","\u{1F4D2}":"ledger","\u{1F4C3}":"page-with-curl","\u{1F4DC}":"scroll","\u{1F4C4}":"page-facing-up","\u{1F4F0}":"newspaper","\u{1F5DE}":"rolled-up-newspaper","\u{1F4D1}":"bookmark-tabs","\u{1F516}":"bookmark","\u{1F3F7}":"label","\u{1F4B0}":"money-bag","\u{1FA99}":"coin","\u{1F4B4}":"yen-banknote","\u{1F4B5}":"dollar-banknote","\u{1F4B6}":"euro-banknote","\u{1F4B7}":"pound-banknote","\u{1F4B8}":"money-with-wings","\u{1F4B3}":"credit-card","\u{1F9FE}":"receipt","\u{1F4B9}":"chart-increasing-with-yen","\u2709":"envelope","\u{1F4E7}":"e-mail","\u{1F4E8}":"incoming-envelope","\u{1F4E9}":"envelope-with-arrow","\u{1F4E4}":"outbox-tray","\u{1F4E5}":"inbox-tray","\u{1F4E6}":"package","\u{1F4EB}":"closed-mailbox-with-raised-flag","\u{1F4EA}":"closed-mailbox-with-lowered-flag","\u{1F4EC}":"open-mailbox-with-raised-flag","\u{1F4ED}":"open-mailbox-with-lowered-flag","\u{1F4EE}":"postbox","\u{1F5F3}":"ballot-box-with-ballot","\u270F":"pencil","\u2712":"black-nib","\u{1F58B}":"fountain-pen","\u{1F58A}":"pen","\u{1F58C}":"paintbrush","\u{1F58D}":"crayon","\u{1F4DD}":"memo","\u{1F4BC}":"briefcase","\u{1F4C1}":"file-folder","\u{1F4C2}":"open-file-folder","\u{1F5C2}":"card-index-dividers","\u{1F4C5}":"calendar","\u{1F4C6}":"tear-off-calendar","\u{1F5D2}":"spiral-notepad","\u{1F5D3}":"spiral-calendar","\u{1F4C7}":"card-index","\u{1F4C8}":"chart-increasing","\u{1F4C9}":"chart-decreasing","\u{1F4CA}":"bar-chart","\u{1F4CB}":"clipboard","\u{1F4CC}":"pushpin","\u{1F4CD}":"round-pushpin","\u{1F4CE}":"paperclip","\u{1F587}":"linked-paperclips","\u{1F4CF}":"straight-ruler","\u{1F4D0}":"triangular-ruler","\u2702":"scissors","\u{1F5C3}":"card-file-box","\u{1F5C4}":"file-cabinet","\u{1F5D1}":"wastebasket","\u{1F512}":"locked","\u{1F513}":"unlocked","\u{1F50F}":"locked-with-pen","\u{1F510}":"locked-with-key","\u{1F511}":"key","\u{1F5DD}":"old-key","\u{1F528}":"hammer","\u{1FA93}":"axe","\u26CF":"pick","\u2692":"hammer-and-pick","\u{1F6E0}":"hammer-and-wrench","\u{1F5E1}":"dagger","\u2694":"crossed-swords","\u{1F4A3}":"bomb","\u{1FA83}":"boomerang","\u{1F3F9}":"bow-and-arrow","\u{1F6E1}":"shield","\u{1FA9A}":"carpentry-saw","\u{1F527}":"wrench","\u{1FA9B}":"screwdriver","\u{1F529}":"nut-and-bolt","\u2699":"gear","\u{1F5DC}":"clamp","\u2696":"balance-scale","\u{1F9AF}":"white-cane","\u{1F517}":"link","\u26D3":"chains","\u{1FA9D}":"hook","\u{1F9F0}":"toolbox","\u{1F9F2}":"magnet","\u{1FA9C}":"ladder","\u2697":"alembic","\u{1F9EA}":"test-tube","\u{1F9EB}":"petri-dish","\u{1F9EC}":"dna","\u{1F52C}":"microscope","\u{1F52D}":"telescope","\u{1F4E1}":"satellite-antenna","\u{1F489}":"syringe","\u{1FA78}":"drop-of-blood","\u{1F48A}":"pill","\u{1FA79}":"adhesive-bandage","\u{1FA7C}":"crutch","\u{1FA7A}":"stethoscope","\u{1FA7B}":"x-ray","\u{1F6AA}":"door","\u{1F6D7}":"elevator","\u{1FA9E}":"mirror","\u{1FA9F}":"window","\u{1F6CF}":"bed","\u{1F6CB}":"couch-and-lamp","\u{1FA91}":"chair","\u{1F6BD}":"toilet","\u{1FAA0}":"plunger","\u{1F6BF}":"shower","\u{1F6C1}":"bathtub","\u{1FAA4}":"mouse-trap","\u{1FA92}":"razor","\u{1F9F4}":"lotion-bottle","\u{1F9F7}":"safety-pin","\u{1F9F9}":"broom","\u{1F9FA}":"basket","\u{1F9FB}":"roll-of-paper","\u{1FAA3}":"bucket","\u{1F9FC}":"soap","\u{1FAE7}":"bubbles","\u{1FAA5}":"toothbrush","\u{1F9FD}":"sponge","\u{1F9EF}":"fire-extinguisher","\u{1F6D2}":"shopping-cart","\u{1F6AC}":"cigarette","\u26B0":"coffin","\u{1FAA6}":"headstone","\u26B1":"funeral-urn","\u{1F9FF}":"nazar-amulet","\u{1FAAC}":"hamsa","\u{1F5FF}":"moai","\u{1FAA7}":"placard","\u{1FAAA}":"identification-card","\u{1F3E7}":"atm-sign","\u{1F6AE}":"litter-in-bin-sign","\u{1F6B0}":"potable-water","\u267F":"wheelchair-symbol","\u{1F6B9}":"men-s-room","\u{1F6BA}":"women-s-room","\u{1F6BB}":"restroom","\u{1F6BC}":"baby-symbol","\u{1F6BE}":"water-closet","\u{1F6C2}":"passport-control","\u{1F6C3}":"customs","\u{1F6C4}":"baggage-claim","\u{1F6C5}":"left-luggage","\u26A0":"warning","\u{1F6B8}":"children-crossing","\u26D4":"no-entry","\u{1F6AB}":"prohibited","\u{1F6B3}":"no-bicycles","\u{1F6AD}":"no-smoking","\u{1F6AF}":"no-littering","\u{1F6B1}":"non-potable-water","\u{1F6B7}":"no-pedestrians","\u{1F4F5}":"no-mobile-phones","\u{1F51E}":"no-one-under-eighteen","\u2622":"radioactive","\u2623":"biohazard","\u2B06":"up-arrow","\u2197":"up-right-arrow","\u27A1":"right-arrow","\u2198":"down-right-arrow","\u2B07":"down-arrow","\u2199":"down-left-arrow","\u2B05":"left-arrow","\u2196":"up-left-arrow","\u2195":"up-down-arrow","\u2194":"left-right-arrow","\u21A9":"right-arrow-curving-left","\u21AA":"left-arrow-curving-right","\u2934":"right-arrow-curving-up","\u2935":"right-arrow-curving-down","\u{1F503}":"clockwise-vertical-arrows","\u{1F504}":"counterclockwise-arrows-button","\u{1F519}":"back-arrow","\u{1F51A}":"end-arrow","\u{1F51B}":"on!-arrow","\u{1F51C}":"soon-arrow","\u{1F51D}":"top-arrow","\u{1F6D0}":"place-of-worship","\u269B":"atom-symbol","\u{1F549}":"om","\u2721":"star-of-david","\u2638":"wheel-of-dharma","\u262F":"yin-yang","\u271D":"latin-cross","\u2626":"orthodox-cross","\u262A":"star-and-crescent","\u262E":"peace-symbol","\u{1F54E}":"menorah","\u{1F52F}":"dotted-six-pointed-star","\u{1FAAF}":"\u229B-khanda","\u2648":"aries","\u2649":"taurus","\u264A":"gemini","\u264B":"cancer","\u264C":"leo","\u264D":"virgo","\u264E":"libra","\u264F":"scorpio","\u2650":"sagittarius","\u2651":"capricorn","\u2652":"aquarius","\u2653":"pisces","\u26CE":"ophiuchus","\u{1F500}":"shuffle-tracks-button","\u{1F501}":"repeat-button","\u{1F502}":"repeat-single-button","\u25B6":"play-button","\u23E9":"fast-forward-button","\u23ED":"next-track-button","\u23EF":"play-or-pause-button","\u25C0":"reverse-button","\u23EA":"fast-reverse-button","\u23EE":"last-track-button","\u{1F53C}":"upwards-button","\u23EB":"fast-up-button","\u{1F53D}":"downwards-button","\u23EC":"fast-down-button","\u23F8":"pause-button","\u23F9":"stop-button","\u23FA":"record-button","\u23CF":"eject-button","\u{1F3A6}":"cinema","\u{1F505}":"dim-button","\u{1F506}":"bright-button","\u{1F4F6}":"antenna-bars","\u{1F6DC}":"\u229B-wireless","\u{1F4F3}":"vibration-mode","\u{1F4F4}":"mobile-phone-off","\u2640":"female-sign","\u2642":"male-sign","\u26A7":"transgender-symbol","\u2716":"multiply","\u2795":"plus","\u2796":"minus","\u2797":"divide","\u{1F7F0}":"heavy-equals-sign","\u267E":"infinity","\u203C":"double-exclamation-mark","\u2049":"exclamation-question-mark","\u2753":"red-question-mark","\u2754":"white-question-mark","\u2755":"white-exclamation-mark","\u2757":"red-exclamation-mark","\u3030":"wavy-dash","\u{1F4B1}":"currency-exchange","\u{1F4B2}":"heavy-dollar-sign","\u2695":"medical-symbol","\u267B":"recycling-symbol","\u269C":"fleur-de-lis","\u{1F531}":"trident-emblem","\u{1F4DB}":"name-badge","\u{1F530}":"japanese-symbol-for-beginner","\u2B55":"hollow-red-circle","\u2705":"check-mark-button","\u2611":"check-box-with-check","\u2714":"check-mark","\u274C":"cross-mark","\u274E":"cross-mark-button","\u27B0":"curly-loop","\u27BF":"double-curly-loop","\u303D":"part-alternation-mark","\u2733":"eight-spoked-asterisk","\u2734":"eight-pointed-star","\u2747":"sparkle","\xA9":"copyright","\xAE":"registered","\u2122":"trade-mark","#\uFE0F\u20E3":"keycap-#","*\uFE0F\u20E3":"keycap-*","0\uFE0F\u20E3":"keycap-0","1\uFE0F\u20E3":"keycap-1","2\uFE0F\u20E3":"keycap-2","3\uFE0F\u20E3":"keycap-3","4\uFE0F\u20E3":"keycap-4","5\uFE0F\u20E3":"keycap-5","6\uFE0F\u20E3":"keycap-6","7\uFE0F\u20E3":"keycap-7","8\uFE0F\u20E3":"keycap-8","9\uFE0F\u20E3":"keycap-9","\u{1F51F}":"keycap-10","\u{1F520}":"input-latin-uppercase","\u{1F521}":"input-latin-lowercase","\u{1F522}":"input-numbers","\u{1F523}":"input-symbols","\u{1F524}":"input-latin-letters","\u{1F170}":"a-button-(blood-type)","\u{1F18E}":"ab-button-(blood-type)","\u{1F171}":"b-button-(blood-type)","\u{1F191}":"cl-button","\u{1F192}":"cool-button","\u{1F193}":"free-button",\u2139:"information","\u{1F194}":"id-button","\u24C2":"circled-m","\u{1F195}":"new-button","\u{1F196}":"ng-button","\u{1F17E}":"o-button-(blood-type)","\u{1F197}":"ok-button","\u{1F17F}":"p-button","\u{1F198}":"sos-button","\u{1F199}":"up!-button","\u{1F19A}":"vs-button","\u{1F201}":"japanese-here-button","\u{1F202}":"japanese-service-charge-button","\u{1F237}":"japanese-monthly-amount-button","\u{1F236}":"japanese-not-free-of-charge-button","\u{1F22F}":"japanese-reserved-button","\u{1F250}":"japanese-bargain-button","\u{1F239}":"japanese-discount-button","\u{1F21A}":"japanese-free-of-charge-button","\u{1F232}":"japanese-prohibited-button","\u{1F251}":"japanese-acceptable-button","\u{1F238}":"japanese-application-button","\u{1F234}":"japanese-passing-grade-button","\u{1F233}":"japanese-vacancy-button","\u3297":"japanese-congratulations-button","\u3299":"japanese-secret-button","\u{1F23A}":"japanese-open-for-business-button","\u{1F235}":"japanese-no-vacancy-button","\u{1F534}":"red-circle","\u{1F7E0}":"orange-circle","\u{1F7E1}":"yellow-circle","\u{1F7E2}":"green-circle","\u{1F535}":"blue-circle","\u{1F7E3}":"purple-circle","\u{1F7E4}":"brown-circle","\u26AB":"black-circle","\u26AA":"white-circle","\u{1F7E5}":"red-square","\u{1F7E7}":"orange-square","\u{1F7E8}":"yellow-square","\u{1F7E9}":"green-square","\u{1F7E6}":"blue-square","\u{1F7EA}":"purple-square","\u{1F7EB}":"brown-square","\u2B1B":"black-large-square","\u2B1C":"white-large-square","\u25FC":"black-medium-square","\u25FB":"white-medium-square","\u25FE":"black-medium-small-square","\u25FD":"white-medium-small-square","\u25AA":"black-small-square","\u25AB":"white-small-square","\u{1F536}":"large-orange-diamond","\u{1F537}":"large-blue-diamond","\u{1F538}":"small-orange-diamond","\u{1F539}":"small-blue-diamond","\u{1F53A}":"red-triangle-pointed-up","\u{1F53B}":"red-triangle-pointed-down","\u{1F4A0}":"diamond-with-a-dot","\u{1F518}":"radio-button","\u{1F533}":"white-square-button","\u{1F532}":"black-square-button","\u{1F3C1}":"chequered-flag","\u{1F6A9}":"triangular-flag","\u{1F38C}":"crossed-flags","\u{1F3F4}":"black-flag","\u{1F3F3}":"white-flag","\u{1F3F3}\uFE0F\u200D\u{1F308}":"rainbow-flag","\u{1F3F3}\uFE0F\u200D\u26A7\uFE0F":"transgender-flag","\u{1F3F4}\u200D\u2620\uFE0F":"pirate-flag","\u{1F1E6}\u{1F1E8}":"flag-ascension-island","\u{1F1E6}\u{1F1E9}":"flag-andorra","\u{1F1E6}\u{1F1EA}":"flag-united-arab-emirates","\u{1F1E6}\u{1F1EB}":"flag-afghanistan","\u{1F1E6}\u{1F1EC}":"flag-antigua-and-barbuda","\u{1F1E6}\u{1F1EE}":"flag-anguilla","\u{1F1E6}\u{1F1F1}":"flag-albania","\u{1F1E6}\u{1F1F2}":"flag-armenia","\u{1F1E6}\u{1F1F4}":"flag-angola","\u{1F1E6}\u{1F1F6}":"flag-antarctica","\u{1F1E6}\u{1F1F7}":"flag-argentina","\u{1F1E6}\u{1F1F8}":"flag-american-samoa","\u{1F1E6}\u{1F1F9}":"flag-austria","\u{1F1E6}\u{1F1FA}":"flag-australia","\u{1F1E6}\u{1F1FC}":"flag-aruba","\u{1F1E6}\u{1F1FD}":"flag-\xE5land-islands","\u{1F1E6}\u{1F1FF}":"flag-azerbaijan","\u{1F1E7}\u{1F1E6}":"flag-bosnia-and-herzegovina","\u{1F1E7}\u{1F1E7}":"flag-barbados","\u{1F1E7}\u{1F1E9}":"flag-bangladesh","\u{1F1E7}\u{1F1EA}":"flag-belgium","\u{1F1E7}\u{1F1EB}":"flag-burkina-faso","\u{1F1E7}\u{1F1EC}":"flag-bulgaria","\u{1F1E7}\u{1F1ED}":"flag-bahrain","\u{1F1E7}\u{1F1EE}":"flag-burundi","\u{1F1E7}\u{1F1EF}":"flag-benin","\u{1F1E7}\u{1F1F1}":"flag-st-barthelemy","\u{1F1E7}\u{1F1F2}":"flag-bermuda","\u{1F1E7}\u{1F1F3}":"flag-brunei","\u{1F1E7}\u{1F1F4}":"flag-bolivia","\u{1F1E7}\u{1F1F6}":"flag-caribbean-netherlands","\u{1F1E7}\u{1F1F7}":"flag-brazil","\u{1F1E7}\u{1F1F8}":"flag-bahamas","\u{1F1E7}\u{1F1F9}":"flag-bhutan","\u{1F1E7}\u{1F1FB}":"flag-bouvet-island","\u{1F1E7}\u{1F1FC}":"flag-botswana","\u{1F1E7}\u{1F1FE}":"flag-belarus","\u{1F1E7}\u{1F1FF}":"flag-belize","\u{1F1E8}\u{1F1E6}":"flag-canada","\u{1F1E8}\u{1F1E8}":"flag-cocos-(keeling)-islands","\u{1F1E8}\u{1F1E9}":"flag-congo---kinshasa","\u{1F1E8}\u{1F1EB}":"flag-central-african-republic","\u{1F1E8}\u{1F1EC}":"flag-congo---brazzaville","\u{1F1E8}\u{1F1ED}":"flag-switzerland","\u{1F1E8}\u{1F1EE}":"flag-c\xF4te-d-ivoire","\u{1F1E8}\u{1F1F0}":"flag-cook-islands","\u{1F1E8}\u{1F1F1}":"flag-chile","\u{1F1E8}\u{1F1F2}":"flag-cameroon","\u{1F1E8}\u{1F1F3}":"flag-china","\u{1F1E8}\u{1F1F4}":"flag-colombia","\u{1F1E8}\u{1F1F5}":"flag-clipperton-island","\u{1F1E8}\u{1F1F7}":"flag-costa-rica","\u{1F1E8}\u{1F1FA}":"flag-cuba","\u{1F1E8}\u{1F1FB}":"flag-cape-verde","\u{1F1E8}\u{1F1FC}":"flag-cura\xE7ao","\u{1F1E8}\u{1F1FD}":"flag-christmas-island","\u{1F1E8}\u{1F1FE}":"flag-cyprus","\u{1F1E8}\u{1F1FF}":"flag-czechia","\u{1F1E9}\u{1F1EA}":"flag-germany","\u{1F1E9}\u{1F1EC}":"flag-diego-garcia","\u{1F1E9}\u{1F1EF}":"flag-djibouti","\u{1F1E9}\u{1F1F0}":"flag-denmark","\u{1F1E9}\u{1F1F2}":"flag-dominica","\u{1F1E9}\u{1F1F4}":"flag-dominican-republic","\u{1F1E9}\u{1F1FF}":"flag-algeria","\u{1F1EA}\u{1F1E6}":"flag-ceuta-and-melilla","\u{1F1EA}\u{1F1E8}":"flag-ecuador","\u{1F1EA}\u{1F1EA}":"flag-estonia","\u{1F1EA}\u{1F1EC}":"flag-egypt","\u{1F1EA}\u{1F1ED}":"flag-western-sahara","\u{1F1EA}\u{1F1F7}":"flag-eritrea","\u{1F1EA}\u{1F1F8}":"flag-spain","\u{1F1EA}\u{1F1F9}":"flag-ethiopia","\u{1F1EA}\u{1F1FA}":"flag-european-union","\u{1F1EB}\u{1F1EE}":"flag-finland","\u{1F1EB}\u{1F1EF}":"flag-fiji","\u{1F1EB}\u{1F1F0}":"flag-falkland-islands","\u{1F1EB}\u{1F1F2}":"flag-micronesia","\u{1F1EB}\u{1F1F4}":"flag-faroe-islands","\u{1F1EB}\u{1F1F7}":"flag-france","\u{1F1EC}\u{1F1E6}":"flag-gabon","\u{1F1EC}\u{1F1E7}":"flag-united-kingdom","\u{1F1EC}\u{1F1E9}":"flag-grenada","\u{1F1EC}\u{1F1EA}":"flag-georgia","\u{1F1EC}\u{1F1EB}":"flag-french-guiana","\u{1F1EC}\u{1F1EC}":"flag-guernsey","\u{1F1EC}\u{1F1ED}":"flag-ghana","\u{1F1EC}\u{1F1EE}":"flag-gibraltar","\u{1F1EC}\u{1F1F1}":"flag-greenland","\u{1F1EC}\u{1F1F2}":"flag-gambia","\u{1F1EC}\u{1F1F3}":"flag-guinea","\u{1F1EC}\u{1F1F5}":"flag-guadeloupe","\u{1F1EC}\u{1F1F6}":"flag-equatorial-guinea","\u{1F1EC}\u{1F1F7}":"flag-greece","\u{1F1EC}\u{1F1F8}":"flag-south-georgia-and-south-sandwich-islands","\u{1F1EC}\u{1F1F9}":"flag-guatemala","\u{1F1EC}\u{1F1FA}":"flag-guam","\u{1F1EC}\u{1F1FC}":"flag-guinea-bissau","\u{1F1EC}\u{1F1FE}":"flag-guyana","\u{1F1ED}\u{1F1F0}":"flag-hong-kong-sar-china","\u{1F1ED}\u{1F1F2}":"flag-heard-and-mcdonald-islands","\u{1F1ED}\u{1F1F3}":"flag-honduras","\u{1F1ED}\u{1F1F7}":"flag-croatia","\u{1F1ED}\u{1F1F9}":"flag-haiti","\u{1F1ED}\u{1F1FA}":"flag-hungary","\u{1F1EE}\u{1F1E8}":"flag-canary-islands","\u{1F1EE}\u{1F1E9}":"flag-indonesia","\u{1F1EE}\u{1F1EA}":"flag-ireland","\u{1F1EE}\u{1F1F1}":"flag-israel","\u{1F1EE}\u{1F1F2}":"flag-isle-of-man","\u{1F1EE}\u{1F1F3}":"flag-india","\u{1F1EE}\u{1F1F4}":"flag-british-indian-ocean-territory","\u{1F1EE}\u{1F1F6}":"flag-iraq","\u{1F1EE}\u{1F1F7}":"flag-iran","\u{1F1EE}\u{1F1F8}":"flag-iceland","\u{1F1EE}\u{1F1F9}":"flag-italy","\u{1F1EF}\u{1F1EA}":"flag-jersey","\u{1F1EF}\u{1F1F2}":"flag-jamaica","\u{1F1EF}\u{1F1F4}":"flag-jordan","\u{1F1EF}\u{1F1F5}":"flag-japan","\u{1F1F0}\u{1F1EA}":"flag-kenya","\u{1F1F0}\u{1F1EC}":"flag-kyrgyzstan","\u{1F1F0}\u{1F1ED}":"flag-cambodia","\u{1F1F0}\u{1F1EE}":"flag-kiribati","\u{1F1F0}\u{1F1F2}":"flag-comoros","\u{1F1F0}\u{1F1F3}":"flag-st-kitts-and-nevis","\u{1F1F0}\u{1F1F5}":"flag-north-korea","\u{1F1F0}\u{1F1F7}":"flag-south-korea","\u{1F1F0}\u{1F1FC}":"flag-kuwait","\u{1F1F0}\u{1F1FE}":"flag-cayman-islands","\u{1F1F0}\u{1F1FF}":"flag-kazakhstan","\u{1F1F1}\u{1F1E6}":"flag-laos","\u{1F1F1}\u{1F1E7}":"flag-lebanon","\u{1F1F1}\u{1F1E8}":"flag-st-lucia","\u{1F1F1}\u{1F1EE}":"flag-liechtenstein","\u{1F1F1}\u{1F1F0}":"flag-sri-lanka","\u{1F1F1}\u{1F1F7}":"flag-liberia","\u{1F1F1}\u{1F1F8}":"flag-lesotho","\u{1F1F1}\u{1F1F9}":"flag-lithuania","\u{1F1F1}\u{1F1FA}":"flag-luxembourg","\u{1F1F1}\u{1F1FB}":"flag-latvia","\u{1F1F1}\u{1F1FE}":"flag-libya","\u{1F1F2}\u{1F1E6}":"flag-morocco","\u{1F1F2}\u{1F1E8}":"flag-monaco","\u{1F1F2}\u{1F1E9}":"flag-moldova","\u{1F1F2}\u{1F1EA}":"flag-montenegro","\u{1F1F2}\u{1F1EB}":"flag-st-martin","\u{1F1F2}\u{1F1EC}":"flag-madagascar","\u{1F1F2}\u{1F1ED}":"flag-marshall-islands","\u{1F1F2}\u{1F1F0}":"flag-north-macedonia","\u{1F1F2}\u{1F1F1}":"flag-mali","\u{1F1F2}\u{1F1F2}":"flag-myanmar-(burma)","\u{1F1F2}\u{1F1F3}":"flag-mongolia","\u{1F1F2}\u{1F1F4}":"flag-macao-sar-china","\u{1F1F2}\u{1F1F5}":"flag-northern-mariana-islands","\u{1F1F2}\u{1F1F6}":"flag-martinique","\u{1F1F2}\u{1F1F7}":"flag-mauritania","\u{1F1F2}\u{1F1F8}":"flag-montserrat","\u{1F1F2}\u{1F1F9}":"flag-malta","\u{1F1F2}\u{1F1FA}":"flag-mauritius","\u{1F1F2}\u{1F1FB}":"flag-maldives","\u{1F1F2}\u{1F1FC}":"flag-malawi","\u{1F1F2}\u{1F1FD}":"flag-mexico","\u{1F1F2}\u{1F1FE}":"flag-malaysia","\u{1F1F2}\u{1F1FF}":"flag-mozambique","\u{1F1F3}\u{1F1E6}":"flag-namibia","\u{1F1F3}\u{1F1E8}":"flag-new-caledonia","\u{1F1F3}\u{1F1EA}":"flag-niger","\u{1F1F3}\u{1F1EB}":"flag-norfolk-island","\u{1F1F3}\u{1F1EC}":"flag-nigeria","\u{1F1F3}\u{1F1EE}":"flag-nicaragua","\u{1F1F3}\u{1F1F1}":"flag-netherlands","\u{1F1F3}\u{1F1F4}":"flag-norway","\u{1F1F3}\u{1F1F5}":"flag-nepal","\u{1F1F3}\u{1F1F7}":"flag-nauru","\u{1F1F3}\u{1F1FA}":"flag-niue","\u{1F1F3}\u{1F1FF}":"flag-new-zealand","\u{1F1F4}\u{1F1F2}":"flag-oman","\u{1F1F5}\u{1F1E6}":"flag-panama","\u{1F1F5}\u{1F1EA}":"flag-peru","\u{1F1F5}\u{1F1EB}":"flag-french-polynesia","\u{1F1F5}\u{1F1EC}":"flag-papua-new-guinea","\u{1F1F5}\u{1F1ED}":"flag-philippines","\u{1F1F5}\u{1F1F0}":"flag-pakistan","\u{1F1F5}\u{1F1F1}":"flag-poland","\u{1F1F5}\u{1F1F2}":"flag-st-pierre-and-miquelon","\u{1F1F5}\u{1F1F3}":"flag-pitcairn-islands","\u{1F1F5}\u{1F1F7}":"flag-puerto-rico","\u{1F1F5}\u{1F1F8}":"flag-palestinian-territories","\u{1F1F5}\u{1F1F9}":"flag-portugal","\u{1F1F5}\u{1F1FC}":"flag-palau","\u{1F1F5}\u{1F1FE}":"flag-paraguay","\u{1F1F6}\u{1F1E6}":"flag-qatar","\u{1F1F7}\u{1F1EA}":"flag-reunion","\u{1F1F7}\u{1F1F4}":"flag-romania","\u{1F1F7}\u{1F1F8}":"flag-serbia","\u{1F1F7}\u{1F1FA}":"flag-russia","\u{1F1F7}\u{1F1FC}":"flag-rwanda","\u{1F1F8}\u{1F1E6}":"flag-saudi-arabia","\u{1F1F8}\u{1F1E7}":"flag-solomon-islands","\u{1F1F8}\u{1F1E8}":"flag-seychelles","\u{1F1F8}\u{1F1E9}":"flag-sudan","\u{1F1F8}\u{1F1EA}":"flag-sweden","\u{1F1F8}\u{1F1EC}":"flag-singapore","\u{1F1F8}\u{1F1ED}":"flag-st-helena","\u{1F1F8}\u{1F1EE}":"flag-slovenia","\u{1F1F8}\u{1F1EF}":"flag-svalbard-and-jan-mayen","\u{1F1F8}\u{1F1F0}":"flag-slovakia","\u{1F1F8}\u{1F1F1}":"flag-sierra-leone","\u{1F1F8}\u{1F1F2}":"flag-san-marino","\u{1F1F8}\u{1F1F3}":"flag-senegal","\u{1F1F8}\u{1F1F4}":"flag-somalia","\u{1F1F8}\u{1F1F7}":"flag-suriname","\u{1F1F8}\u{1F1F8}":"flag-south-sudan","\u{1F1F8}\u{1F1F9}":"flag-s\xE3o-tome-and-pr\xEDncipe","\u{1F1F8}\u{1F1FB}":"flag-el-salvador","\u{1F1F8}\u{1F1FD}":"flag-sint-maarten","\u{1F1F8}\u{1F1FE}":"flag-syria","\u{1F1F8}\u{1F1FF}":"flag-eswatini","\u{1F1F9}\u{1F1E6}":"flag-tristan-da-cunha","\u{1F1F9}\u{1F1E8}":"flag-turks-and-caicos-islands","\u{1F1F9}\u{1F1E9}":"flag-chad","\u{1F1F9}\u{1F1EB}":"flag-french-southern-territories","\u{1F1F9}\u{1F1EC}":"flag-togo","\u{1F1F9}\u{1F1ED}":"flag-thailand","\u{1F1F9}\u{1F1EF}":"flag-tajikistan","\u{1F1F9}\u{1F1F0}":"flag-tokelau","\u{1F1F9}\u{1F1F1}":"flag-timor-leste","\u{1F1F9}\u{1F1F2}":"flag-turkmenistan","\u{1F1F9}\u{1F1F3}":"flag-tunisia","\u{1F1F9}\u{1F1F4}":"flag-tonga","\u{1F1F9}\u{1F1F7}":"flag-turkey","\u{1F1F9}\u{1F1F9}":"flag-trinidad-and-tobago","\u{1F1F9}\u{1F1FB}":"flag-tuvalu","\u{1F1F9}\u{1F1FC}":"flag-taiwan","\u{1F1F9}\u{1F1FF}":"flag-tanzania","\u{1F1FA}\u{1F1E6}":"flag-ukraine","\u{1F1FA}\u{1F1EC}":"flag-uganda","\u{1F1FA}\u{1F1F2}":"flag-us-outlying-islands","\u{1F1FA}\u{1F1F3}":"flag-united-nations","\u{1F1FA}\u{1F1F8}":"flag-united-states","\u{1F1FA}\u{1F1FE}":"flag-uruguay","\u{1F1FA}\u{1F1FF}":"flag-uzbekistan","\u{1F1FB}\u{1F1E6}":"flag-vatican-city","\u{1F1FB}\u{1F1E8}":"flag-st-vincent-and-grenadines","\u{1F1FB}\u{1F1EA}":"flag-venezuela","\u{1F1FB}\u{1F1EC}":"flag-british-virgin-islands","\u{1F1FB}\u{1F1EE}":"flag-us-virgin-islands","\u{1F1FB}\u{1F1F3}":"flag-vietnam","\u{1F1FB}\u{1F1FA}":"flag-vanuatu","\u{1F1FC}\u{1F1EB}":"flag-wallis-and-futuna","\u{1F1FC}\u{1F1F8}":"flag-samoa","\u{1F1FD}\u{1F1F0}":"flag-kosovo","\u{1F1FE}\u{1F1EA}":"flag-yemen","\u{1F1FE}\u{1F1F9}":"flag-mayotte","\u{1F1FF}\u{1F1E6}":"flag-south-africa","\u{1F1FF}\u{1F1F2}":"flag-zambia","\u{1F1FF}\u{1F1FC}":"flag-zimbabwe","\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}":"flag-england","\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}":"flag-scotland","\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}":"flag-wales"},mH=Object.keys(PR),pH=`
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Please pull this list from, and only from https://publicsuffix.org/list/public_suffix_list.dat,
// rather than any other VCS sites. Pulling from any other URL is not guaranteed to be supported.

// Instructions on pulling and using this list can be found at https://publicsuffix.org/list/.

// ===BEGIN ICANN DOMAINS===

// ac : http://nic.ac/rules.htm
ac
com.ac
edu.ac
gov.ac
net.ac
mil.ac
org.ac

// ad : https://en.wikipedia.org/wiki/.ad
ad
nom.ad

// ae : https://tdra.gov.ae/en/aeda/ae-policies
ae
co.ae
net.ae
org.ae
sch.ae
ac.ae
gov.ae
mil.ae

// aero : see https://www.information.aero/index.php?id=66
aero
accident-investigation.aero
accident-prevention.aero
aerobatic.aero
aeroclub.aero
aerodrome.aero
agents.aero
aircraft.aero
airline.aero
airport.aero
air-surveillance.aero
airtraffic.aero
air-traffic-control.aero
ambulance.aero
amusement.aero
association.aero
author.aero
ballooning.aero
broker.aero
caa.aero
cargo.aero
catering.aero
certification.aero
championship.aero
charter.aero
civilaviation.aero
club.aero
conference.aero
consultant.aero
consulting.aero
control.aero
council.aero
crew.aero
design.aero
dgca.aero
educator.aero
emergency.aero
engine.aero
engineer.aero
entertainment.aero
equipment.aero
exchange.aero
express.aero
federation.aero
flight.aero
fuel.aero
gliding.aero
government.aero
groundhandling.aero
group.aero
hanggliding.aero
homebuilt.aero
insurance.aero
journal.aero
journalist.aero
leasing.aero
logistics.aero
magazine.aero
maintenance.aero
media.aero
microlight.aero
modelling.aero
navigation.aero
parachuting.aero
paragliding.aero
passenger-association.aero
pilot.aero
press.aero
production.aero
recreation.aero
repbody.aero
res.aero
research.aero
rotorcraft.aero
safety.aero
scientist.aero
services.aero
show.aero
skydiving.aero
software.aero
student.aero
trader.aero
trading.aero
trainer.aero
union.aero
workinggroup.aero
works.aero

// af : http://www.nic.af/help.jsp
af
gov.af
com.af
org.af
net.af
edu.af

// ag : http://www.nic.ag/prices.htm
ag
com.ag
org.ag
net.ag
co.ag
nom.ag

// ai : http://nic.com.ai/
ai
off.ai
com.ai
net.ai
org.ai

// al : http://www.ert.gov.al/ert_alb/faq_det.html?Id=31
al
com.al
edu.al
gov.al
mil.al
net.al
org.al

// am : https://www.amnic.net/policy/en/Policy_EN.pdf
am
co.am
com.am
commune.am
net.am
org.am

// ao : https://en.wikipedia.org/wiki/.ao
// http://www.dns.ao/REGISTR.DOC
ao
ed.ao
gv.ao
og.ao
co.ao
pb.ao
it.ao

// aq : https://en.wikipedia.org/wiki/.aq
aq

// ar : https://nic.ar/es/nic-argentina/normativa
ar
bet.ar
com.ar
coop.ar
edu.ar
gob.ar
gov.ar
int.ar
mil.ar
musica.ar
mutual.ar
net.ar
org.ar
senasa.ar
tur.ar

// arpa : https://en.wikipedia.org/wiki/.arpa
// Confirmed by registry <iana-questions@icann.org> 2008-06-18
arpa
e164.arpa
in-addr.arpa
ip6.arpa
iris.arpa
uri.arpa
urn.arpa

// as : https://en.wikipedia.org/wiki/.as
as
gov.as

// asia : https://en.wikipedia.org/wiki/.asia
asia

// at : https://en.wikipedia.org/wiki/.at
// Confirmed by registry <it@nic.at> 2008-06-17
at
ac.at
co.at
gv.at
or.at
sth.ac.at

// au : https://en.wikipedia.org/wiki/.au
// http://www.auda.org.au/
au
// 2LDs
com.au
net.au
org.au
edu.au
gov.au
asn.au
id.au
// Historic 2LDs (closed to new registration, but sites still exist)
info.au
conf.au
oz.au
// CGDNs - http://www.cgdn.org.au/
act.au
nsw.au
nt.au
qld.au
sa.au
tas.au
vic.au
wa.au
// 3LDs
act.edu.au
catholic.edu.au
// eq.edu.au - Removed at the request of the Queensland Department of Education
nsw.edu.au
nt.edu.au
qld.edu.au
sa.edu.au
tas.edu.au
vic.edu.au
wa.edu.au
// act.gov.au  Bug 984824 - Removed at request of Greg Tankard
// nsw.gov.au  Bug 547985 - Removed at request of <Shae.Donelan@services.nsw.gov.au>
// nt.gov.au  Bug 940478 - Removed at request of Greg Connors <Greg.Connors@nt.gov.au>
qld.gov.au
sa.gov.au
tas.gov.au
vic.gov.au
wa.gov.au
// 4LDs
// education.tas.edu.au - Removed at the request of the Department of Education Tasmania
schools.nsw.edu.au

// aw : https://en.wikipedia.org/wiki/.aw
aw
com.aw

// ax : https://en.wikipedia.org/wiki/.ax
ax

// az : https://en.wikipedia.org/wiki/.az
az
com.az
net.az
int.az
gov.az
org.az
edu.az
info.az
pp.az
mil.az
name.az
pro.az
biz.az

// ba : http://nic.ba/users_data/files/pravilnik_o_registraciji.pdf
ba
com.ba
edu.ba
gov.ba
mil.ba
net.ba
org.ba

// bb : https://en.wikipedia.org/wiki/.bb
bb
biz.bb
co.bb
com.bb
edu.bb
gov.bb
info.bb
net.bb
org.bb
store.bb
tv.bb

// bd : https://en.wikipedia.org/wiki/.bd
*.bd

// be : https://en.wikipedia.org/wiki/.be
// Confirmed by registry <tech@dns.be> 2008-06-08
be
ac.be

// bf : https://en.wikipedia.org/wiki/.bf
bf
gov.bf

// bg : https://en.wikipedia.org/wiki/.bg
// https://www.register.bg/user/static/rules/en/index.html
bg
a.bg
b.bg
c.bg
d.bg
e.bg
f.bg
g.bg
h.bg
i.bg
j.bg
k.bg
l.bg
m.bg
n.bg
o.bg
p.bg
q.bg
r.bg
s.bg
t.bg
u.bg
v.bg
w.bg
x.bg
y.bg
z.bg
0.bg
1.bg
2.bg
3.bg
4.bg
5.bg
6.bg
7.bg
8.bg
9.bg

// bh : https://en.wikipedia.org/wiki/.bh
bh
com.bh
edu.bh
net.bh
org.bh
gov.bh

// bi : https://en.wikipedia.org/wiki/.bi
// http://whois.nic.bi/
bi
co.bi
com.bi
edu.bi
or.bi
org.bi

// biz : https://en.wikipedia.org/wiki/.biz
biz

// bj : https://nic.bj/bj-suffixes.txt
// submitted by registry <contact@nic.bj>
bj
africa.bj
agro.bj
architectes.bj
assur.bj
avocats.bj
co.bj
com.bj
eco.bj
econo.bj
edu.bj
info.bj
loisirs.bj
money.bj
net.bj
org.bj
ote.bj
resto.bj
restaurant.bj
tourism.bj
univ.bj

// bm : http://www.bermudanic.bm/dnr-text.txt
bm
com.bm
edu.bm
gov.bm
net.bm
org.bm

// bn : http://www.bnnic.bn/faqs
bn
com.bn
edu.bn
gov.bn
net.bn
org.bn

// bo : https://nic.bo/delegacion2015.php#h-1.10
bo
com.bo
edu.bo
gob.bo
int.bo
org.bo
net.bo
mil.bo
tv.bo
web.bo
// Social Domains
academia.bo
agro.bo
arte.bo
blog.bo
bolivia.bo
ciencia.bo
cooperativa.bo
democracia.bo
deporte.bo
ecologia.bo
economia.bo
empresa.bo
indigena.bo
industria.bo
info.bo
medicina.bo
movimiento.bo
musica.bo
natural.bo
nombre.bo
noticias.bo
patria.bo
politica.bo
profesional.bo
plurinacional.bo
pueblo.bo
revista.bo
salud.bo
tecnologia.bo
tksat.bo
transporte.bo
wiki.bo

// br : http://registro.br/dominio/categoria.html
// Submitted by registry <fneves@registro.br>
br
9guacu.br
abc.br
adm.br
adv.br
agr.br
aju.br
am.br
anani.br
aparecida.br
app.br
arq.br
art.br
ato.br
b.br
barueri.br
belem.br
bhz.br
bib.br
bio.br
blog.br
bmd.br
boavista.br
bsb.br
campinagrande.br
campinas.br
caxias.br
cim.br
cng.br
cnt.br
com.br
contagem.br
coop.br
coz.br
cri.br
cuiaba.br
curitiba.br
def.br
des.br
det.br
dev.br
ecn.br
eco.br
edu.br
emp.br
enf.br
eng.br
esp.br
etc.br
eti.br
far.br
feira.br
flog.br
floripa.br
fm.br
fnd.br
fortal.br
fot.br
foz.br
fst.br
g12.br
geo.br
ggf.br
goiania.br
gov.br
// gov.br 26 states + df https://en.wikipedia.org/wiki/States_of_Brazil
ac.gov.br
al.gov.br
am.gov.br
ap.gov.br
ba.gov.br
ce.gov.br
df.gov.br
es.gov.br
go.gov.br
ma.gov.br
mg.gov.br
ms.gov.br
mt.gov.br
pa.gov.br
pb.gov.br
pe.gov.br
pi.gov.br
pr.gov.br
rj.gov.br
rn.gov.br
ro.gov.br
rr.gov.br
rs.gov.br
sc.gov.br
se.gov.br
sp.gov.br
to.gov.br
gru.br
imb.br
ind.br
inf.br
jab.br
jampa.br
jdf.br
joinville.br
jor.br
jus.br
leg.br
lel.br
log.br
londrina.br
macapa.br
maceio.br
manaus.br
maringa.br
mat.br
med.br
mil.br
morena.br
mp.br
mus.br
natal.br
net.br
niteroi.br
*.nom.br
not.br
ntr.br
odo.br
ong.br
org.br
osasco.br
palmas.br
poa.br
ppg.br
pro.br
psc.br
psi.br
pvh.br
qsl.br
radio.br
rec.br
recife.br
rep.br
ribeirao.br
rio.br
riobranco.br
riopreto.br
salvador.br
sampa.br
santamaria.br
santoandre.br
saobernardo.br
saogonca.br
seg.br
sjc.br
slg.br
slz.br
sorocaba.br
srv.br
taxi.br
tc.br
tec.br
teo.br
the.br
tmp.br
trd.br
tur.br
tv.br
udi.br
vet.br
vix.br
vlog.br
wiki.br
zlg.br

// bs : http://www.nic.bs/rules.html
bs
com.bs
net.bs
org.bs
edu.bs
gov.bs

// bt : https://en.wikipedia.org/wiki/.bt
bt
com.bt
edu.bt
gov.bt
net.bt
org.bt

// bv : No registrations at this time.
// Submitted by registry <jarle@uninett.no>
bv

// bw : https://en.wikipedia.org/wiki/.bw
// http://www.gobin.info/domainname/bw.doc
// list of other 2nd level tlds ?
bw
co.bw
org.bw

// by : https://en.wikipedia.org/wiki/.by
// http://tld.by/rules_2006_en.html
// list of other 2nd level tlds ?
by
gov.by
mil.by
// Official information does not indicate that com.by is a reserved
// second-level domain, but it's being used as one (see www.google.com.by and
// www.yahoo.com.by, for example), so we list it here for safety's sake.
com.by

// http://hoster.by/
of.by

// bz : https://en.wikipedia.org/wiki/.bz
// http://www.belizenic.bz/
bz
com.bz
net.bz
org.bz
edu.bz
gov.bz

// ca : https://en.wikipedia.org/wiki/.ca
ca
// ca geographical names
ab.ca
bc.ca
mb.ca
nb.ca
nf.ca
nl.ca
ns.ca
nt.ca
nu.ca
on.ca
pe.ca
qc.ca
sk.ca
yk.ca
// gc.ca: https://en.wikipedia.org/wiki/.gc.ca
// see also: http://registry.gc.ca/en/SubdomainFAQ
gc.ca

// cat : https://en.wikipedia.org/wiki/.cat
cat

// cc : https://en.wikipedia.org/wiki/.cc
cc

// cd : https://en.wikipedia.org/wiki/.cd
// see also: https://www.nic.cd/domain/insertDomain_2.jsp?act=1
cd
gov.cd

// cf : https://en.wikipedia.org/wiki/.cf
cf

// cg : https://en.wikipedia.org/wiki/.cg
cg

// ch : https://en.wikipedia.org/wiki/.ch
ch

// ci : https://en.wikipedia.org/wiki/.ci
// http://www.nic.ci/index.php?page=charte
ci
org.ci
or.ci
com.ci
co.ci
edu.ci
ed.ci
ac.ci
net.ci
go.ci
asso.ci
a\xE9roport.ci
int.ci
presse.ci
md.ci
gouv.ci

// ck : https://en.wikipedia.org/wiki/.ck
*.ck
!www.ck

// cl : https://www.nic.cl
// Confirmed by .CL registry <hsalgado@nic.cl>
cl
co.cl
gob.cl
gov.cl
mil.cl

// cm : https://en.wikipedia.org/wiki/.cm plus bug 981927
cm
co.cm
com.cm
gov.cm
net.cm

// cn : https://en.wikipedia.org/wiki/.cn
// Submitted by registry <tanyaling@cnnic.cn>
cn
ac.cn
com.cn
edu.cn
gov.cn
net.cn
org.cn
mil.cn
\u516C\u53F8.cn
\u7F51\u7EDC.cn
\u7DB2\u7D61.cn
// cn geographic names
ah.cn
bj.cn
cq.cn
fj.cn
gd.cn
gs.cn
gz.cn
gx.cn
ha.cn
hb.cn
he.cn
hi.cn
hl.cn
hn.cn
jl.cn
js.cn
jx.cn
ln.cn
nm.cn
nx.cn
qh.cn
sc.cn
sd.cn
sh.cn
sn.cn
sx.cn
tj.cn
xj.cn
xz.cn
yn.cn
zj.cn
hk.cn
mo.cn
tw.cn

// co : https://en.wikipedia.org/wiki/.co
// Submitted by registry <tecnico@uniandes.edu.co>
co
arts.co
com.co
edu.co
firm.co
gov.co
info.co
int.co
mil.co
net.co
nom.co
org.co
rec.co
web.co

// com : https://en.wikipedia.org/wiki/.com
com

// coop : https://en.wikipedia.org/wiki/.coop
coop

// cr : http://www.nic.cr/niccr_publico/showRegistroDominiosScreen.do
cr
ac.cr
co.cr
ed.cr
fi.cr
go.cr
or.cr
sa.cr

// cu : https://en.wikipedia.org/wiki/.cu
cu
com.cu
edu.cu
org.cu
net.cu
gov.cu
inf.cu

// cv : https://en.wikipedia.org/wiki/.cv
// cv : http://www.dns.cv/tldcv_portal/do?com=DS;5446457100;111;+PAGE(4000018)+K-CAT-CODIGO(RDOM)+RCNT(100); <- registration rules
cv
com.cv
edu.cv
int.cv
nome.cv
org.cv

// cw : http://www.una.cw/cw_registry/
// Confirmed by registry <registry@una.net> 2013-03-26
cw
com.cw
edu.cw
net.cw
org.cw

// cx : https://en.wikipedia.org/wiki/.cx
// list of other 2nd level tlds ?
cx
gov.cx

// cy : http://www.nic.cy/
// Submitted by registry Panayiotou Fotia <cydns@ucy.ac.cy>
// namespace policies URL https://www.nic.cy/portal//sites/default/files/symfonia_gia_eggrafi.pdf
cy
ac.cy
biz.cy
com.cy
ekloges.cy
gov.cy
ltd.cy
mil.cy
net.cy
org.cy
press.cy
pro.cy
tm.cy

// cz : https://en.wikipedia.org/wiki/.cz
cz

// de : https://en.wikipedia.org/wiki/.de
// Confirmed by registry <ops@denic.de> (with technical
// reservations) 2008-07-01
de

// dj : https://en.wikipedia.org/wiki/.dj
dj

// dk : https://en.wikipedia.org/wiki/.dk
// Confirmed by registry <robert@dk-hostmaster.dk> 2008-06-17
dk

// dm : https://en.wikipedia.org/wiki/.dm
dm
com.dm
net.dm
org.dm
edu.dm
gov.dm

// do : https://en.wikipedia.org/wiki/.do
do
art.do
com.do
edu.do
gob.do
gov.do
mil.do
net.do
org.do
sld.do
web.do

// dz : http://www.nic.dz/images/pdf_nic/charte.pdf
dz
art.dz
asso.dz
com.dz
edu.dz
gov.dz
org.dz
net.dz
pol.dz
soc.dz
tm.dz

// ec : http://www.nic.ec/reg/paso1.asp
// Submitted by registry <vabboud@nic.ec>
ec
com.ec
info.ec
net.ec
fin.ec
k12.ec
med.ec
pro.ec
org.ec
edu.ec
gov.ec
gob.ec
mil.ec

// edu : https://en.wikipedia.org/wiki/.edu
edu

// ee : http://www.eenet.ee/EENet/dom_reeglid.html#lisa_B
ee
edu.ee
gov.ee
riik.ee
lib.ee
med.ee
com.ee
pri.ee
aip.ee
org.ee
fie.ee

// eg : https://en.wikipedia.org/wiki/.eg
eg
com.eg
edu.eg
eun.eg
gov.eg
mil.eg
name.eg
net.eg
org.eg
sci.eg

// er : https://en.wikipedia.org/wiki/.er
*.er

// es : https://www.nic.es/site_ingles/ingles/dominios/index.html
es
com.es
nom.es
org.es
gob.es
edu.es

// et : https://en.wikipedia.org/wiki/.et
et
com.et
gov.et
org.et
edu.et
biz.et
name.et
info.et
net.et

// eu : https://en.wikipedia.org/wiki/.eu
eu

// fi : https://en.wikipedia.org/wiki/.fi
fi
// aland.fi : https://en.wikipedia.org/wiki/.ax
// This domain is being phased out in favor of .ax. As there are still many
// domains under aland.fi, we still keep it on the list until aland.fi is
// completely removed.
// TODO: Check for updates (expected to be phased out around Q1/2009)
aland.fi

// fj : http://domains.fj/
// Submitted by registry <garth.miller@cocca.org.nz> 2020-02-11
fj
ac.fj
biz.fj
com.fj
gov.fj
info.fj
mil.fj
name.fj
net.fj
org.fj
pro.fj

// fk : https://en.wikipedia.org/wiki/.fk
*.fk

// fm : https://en.wikipedia.org/wiki/.fm
com.fm
edu.fm
net.fm
org.fm
fm

// fo : https://en.wikipedia.org/wiki/.fo
fo

// fr : https://www.afnic.fr/ https://www.afnic.fr/wp-media/uploads/2022/12/afnic-naming-policy-2023-01-01.pdf
fr
asso.fr
com.fr
gouv.fr
nom.fr
prd.fr
tm.fr
// Other SLDs now selfmanaged out of AFNIC range. Former "domaines sectoriels", still registration suffixes
avoues.fr
cci.fr
greta.fr
huissier-justice.fr

// ga : https://en.wikipedia.org/wiki/.ga
ga

// gb : This registry is effectively dormant
// Submitted by registry <Damien.Shaw@ja.net>
gb

// gd : https://en.wikipedia.org/wiki/.gd
edu.gd
gov.gd
gd

// ge : http://www.nic.net.ge/policy_en.pdf
ge
com.ge
edu.ge
gov.ge
org.ge
mil.ge
net.ge
pvt.ge

// gf : https://en.wikipedia.org/wiki/.gf
gf

// gg : http://www.channelisles.net/register-domains/
// Confirmed by registry <nigel@channelisles.net> 2013-11-28
gg
co.gg
net.gg
org.gg

// gh : https://en.wikipedia.org/wiki/.gh
// see also: http://www.nic.gh/reg_now.php
// Although domains directly at second level are not possible at the moment,
// they have been possible for some time and may come back.
gh
com.gh
edu.gh
gov.gh
org.gh
mil.gh

// gi : http://www.nic.gi/rules.html
gi
com.gi
ltd.gi
gov.gi
mod.gi
edu.gi
org.gi

// gl : https://en.wikipedia.org/wiki/.gl
// http://nic.gl
gl
co.gl
com.gl
edu.gl
net.gl
org.gl

// gm : http://www.nic.gm/htmlpages%5Cgm-policy.htm
gm

// gn : http://psg.com/dns/gn/gn.txt
// Submitted by registry <randy@psg.com>
gn
ac.gn
com.gn
edu.gn
gov.gn
org.gn
net.gn

// gov : https://en.wikipedia.org/wiki/.gov
gov

// gp : http://www.nic.gp/index.php?lang=en
gp
com.gp
net.gp
mobi.gp
edu.gp
org.gp
asso.gp

// gq : https://en.wikipedia.org/wiki/.gq
gq

// gr : https://grweb.ics.forth.gr/english/1617-B-2005.html
// Submitted by registry <segred@ics.forth.gr>
gr
com.gr
edu.gr
net.gr
org.gr
gov.gr

// gs : https://en.wikipedia.org/wiki/.gs
gs

// gt : https://www.gt/sitio/registration_policy.php?lang=en
gt
com.gt
edu.gt
gob.gt
ind.gt
mil.gt
net.gt
org.gt

// gu : http://gadao.gov.gu/register.html
// University of Guam : https://www.uog.edu
// Submitted by uognoc@triton.uog.edu
gu
com.gu
edu.gu
gov.gu
guam.gu
info.gu
net.gu
org.gu
web.gu

// gw : https://en.wikipedia.org/wiki/.gw
// gw : https://nic.gw/regras/
gw

// gy : https://en.wikipedia.org/wiki/.gy
// http://registry.gy/
gy
co.gy
com.gy
edu.gy
gov.gy
net.gy
org.gy

// hk : https://www.hkirc.hk
// Submitted by registry <hk.tech@hkirc.hk>
hk
com.hk
edu.hk
gov.hk
idv.hk
net.hk
org.hk
\u516C\u53F8.hk
\u6559\u80B2.hk
\u654E\u80B2.hk
\u653F\u5E9C.hk
\u500B\u4EBA.hk
\u4E2A\u4EBA.hk
\u7B87\u4EBA.hk
\u7DB2\u7EDC.hk
\u7F51\u7EDC.hk
\u7EC4\u7E54.hk
\u7DB2\u7D61.hk
\u7F51\u7D61.hk
\u7EC4\u7EC7.hk
\u7D44\u7E54.hk
\u7D44\u7EC7.hk

// hm : https://en.wikipedia.org/wiki/.hm
hm

// hn : http://www.nic.hn/politicas/ps02,,05.html
hn
com.hn
edu.hn
org.hn
net.hn
mil.hn
gob.hn

// hr : http://www.dns.hr/documents/pdf/HRTLD-regulations.pdf
hr
iz.hr
from.hr
name.hr
com.hr

// ht : http://www.nic.ht/info/charte.cfm
ht
com.ht
shop.ht
firm.ht
info.ht
adult.ht
net.ht
pro.ht
org.ht
med.ht
art.ht
coop.ht
pol.ht
asso.ht
edu.ht
rel.ht
gouv.ht
perso.ht

// hu : http://www.domain.hu/domain/English/sld.html
// Confirmed by registry <pasztor@iszt.hu> 2008-06-12
hu
co.hu
info.hu
org.hu
priv.hu
sport.hu
tm.hu
2000.hu
agrar.hu
bolt.hu
casino.hu
city.hu
erotica.hu
erotika.hu
film.hu
forum.hu
games.hu
hotel.hu
ingatlan.hu
jogasz.hu
konyvelo.hu
lakas.hu
media.hu
news.hu
reklam.hu
sex.hu
shop.hu
suli.hu
szex.hu
tozsde.hu
utazas.hu
video.hu

// id : https://pandi.id/en/domain/registration-requirements/
id
ac.id
biz.id
co.id
desa.id
go.id
mil.id
my.id
net.id
or.id
ponpes.id
sch.id
web.id

// ie : https://en.wikipedia.org/wiki/.ie
ie
gov.ie

// il :         http://www.isoc.org.il/domains/
// see also:    https://en.isoc.org.il/il-cctld/registration-rules
// ISOC-IL      (operated by .il Registry)
il
ac.il
co.il
gov.il
idf.il
k12.il
muni.il
net.il
org.il
// xn--4dbrk0ce ("Israel", Hebrew) : IL
\u05D9\u05E9\u05E8\u05D0\u05DC
// xn--4dbgdty6c.xn--4dbrk0ce.
\u05D0\u05E7\u05D3\u05DE\u05D9\u05D4.\u05D9\u05E9\u05E8\u05D0\u05DC
// xn--5dbhl8d.xn--4dbrk0ce.
\u05D9\u05E9\u05D5\u05D1.\u05D9\u05E9\u05E8\u05D0\u05DC
// xn--8dbq2a.xn--4dbrk0ce.
\u05E6\u05D4\u05DC.\u05D9\u05E9\u05E8\u05D0\u05DC
// xn--hebda8b.xn--4dbrk0ce.
\u05DE\u05DE\u05E9\u05DC.\u05D9\u05E9\u05E8\u05D0\u05DC

// im : https://www.nic.im/
// Submitted by registry <info@nic.im>
im
ac.im
co.im
com.im
ltd.co.im
net.im
org.im
plc.co.im
tt.im
tv.im

// in : https://en.wikipedia.org/wiki/.in
// see also: https://registry.in/policies
// Please note, that nic.in is not an official eTLD, but used by most
// government institutions.
in
5g.in
6g.in
ac.in
ai.in
am.in
bihar.in
biz.in
business.in
ca.in
cn.in
co.in
com.in
coop.in
cs.in
delhi.in
dr.in
edu.in
er.in
firm.in
gen.in
gov.in
gujarat.in
ind.in
info.in
int.in
internet.in
io.in
me.in
mil.in
net.in
nic.in
org.in
pg.in
post.in
pro.in
res.in
travel.in
tv.in
uk.in
up.in
us.in

// info : https://en.wikipedia.org/wiki/.info
info

// int : https://en.wikipedia.org/wiki/.int
// Confirmed by registry <iana-questions@icann.org> 2008-06-18
int
eu.int

// io : http://www.nic.io/rules.htm
// list of other 2nd level tlds ?
io
com.io

// iq : http://www.cmc.iq/english/iq/iqregister1.htm
iq
gov.iq
edu.iq
mil.iq
com.iq
org.iq
net.iq

// ir : http://www.nic.ir/Terms_and_Conditions_ir,_Appendix_1_Domain_Rules
// Also see http://www.nic.ir/Internationalized_Domain_Names
// Two <iran>.ir entries added at request of <tech-team@nic.ir>, 2010-04-16
ir
ac.ir
co.ir
gov.ir
id.ir
net.ir
org.ir
sch.ir
// xn--mgba3a4f16a.ir (<iran>.ir, Persian YEH)
\u0627\u06CC\u0631\u0627\u0646.ir
// xn--mgba3a4fra.ir (<iran>.ir, Arabic YEH)
\u0627\u064A\u0631\u0627\u0646.ir

// is : http://www.isnic.is/domain/rules.php
// Confirmed by registry <marius@isgate.is> 2008-12-06
is
net.is
com.is
edu.is
gov.is
org.is
int.is

// it : https://en.wikipedia.org/wiki/.it
it
gov.it
edu.it
// Reserved geo-names (regions and provinces):
// https://www.nic.it/sites/default/files/archivio/docs/Regulation_assignation_v7.1.pdf
// Regions
abr.it
abruzzo.it
aosta-valley.it
aostavalley.it
bas.it
basilicata.it
cal.it
calabria.it
cam.it
campania.it
emilia-romagna.it
emiliaromagna.it
emr.it
friuli-v-giulia.it
friuli-ve-giulia.it
friuli-vegiulia.it
friuli-venezia-giulia.it
friuli-veneziagiulia.it
friuli-vgiulia.it
friuliv-giulia.it
friulive-giulia.it
friulivegiulia.it
friulivenezia-giulia.it
friuliveneziagiulia.it
friulivgiulia.it
fvg.it
laz.it
lazio.it
lig.it
liguria.it
lom.it
lombardia.it
lombardy.it
lucania.it
mar.it
marche.it
mol.it
molise.it
piedmont.it
piemonte.it
pmn.it
pug.it
puglia.it
sar.it
sardegna.it
sardinia.it
sic.it
sicilia.it
sicily.it
taa.it
tos.it
toscana.it
trentin-sud-tirol.it
trentin-s\xFCd-tirol.it
trentin-sudtirol.it
trentin-s\xFCdtirol.it
trentin-sued-tirol.it
trentin-suedtirol.it
trentino-a-adige.it
trentino-aadige.it
trentino-alto-adige.it
trentino-altoadige.it
trentino-s-tirol.it
trentino-stirol.it
trentino-sud-tirol.it
trentino-s\xFCd-tirol.it
trentino-sudtirol.it
trentino-s\xFCdtirol.it
trentino-sued-tirol.it
trentino-suedtirol.it
trentino.it
trentinoa-adige.it
trentinoaadige.it
trentinoalto-adige.it
trentinoaltoadige.it
trentinos-tirol.it
trentinostirol.it
trentinosud-tirol.it
trentinos\xFCd-tirol.it
trentinosudtirol.it
trentinos\xFCdtirol.it
trentinosued-tirol.it
trentinosuedtirol.it
trentinsud-tirol.it
trentins\xFCd-tirol.it
trentinsudtirol.it
trentins\xFCdtirol.it
trentinsued-tirol.it
trentinsuedtirol.it
tuscany.it
umb.it
umbria.it
val-d-aosta.it
val-daosta.it
vald-aosta.it
valdaosta.it
valle-aosta.it
valle-d-aosta.it
valle-daosta.it
valleaosta.it
valled-aosta.it
valledaosta.it
vallee-aoste.it
vall\xE9e-aoste.it
vallee-d-aoste.it
vall\xE9e-d-aoste.it
valleeaoste.it
vall\xE9eaoste.it
valleedaoste.it
vall\xE9edaoste.it
vao.it
vda.it
ven.it
veneto.it
// Provinces
ag.it
agrigento.it
al.it
alessandria.it
alto-adige.it
altoadige.it
an.it
ancona.it
andria-barletta-trani.it
andria-trani-barletta.it
andriabarlettatrani.it
andriatranibarletta.it
ao.it
aosta.it
aoste.it
ap.it
aq.it
aquila.it
ar.it
arezzo.it
ascoli-piceno.it
ascolipiceno.it
asti.it
at.it
av.it
avellino.it
ba.it
balsan-sudtirol.it
balsan-s\xFCdtirol.it
balsan-suedtirol.it
balsan.it
bari.it
barletta-trani-andria.it
barlettatraniandria.it
belluno.it
benevento.it
bergamo.it
bg.it
bi.it
biella.it
bl.it
bn.it
bo.it
bologna.it
bolzano-altoadige.it
bolzano.it
bozen-sudtirol.it
bozen-s\xFCdtirol.it
bozen-suedtirol.it
bozen.it
br.it
brescia.it
brindisi.it
bs.it
bt.it
bulsan-sudtirol.it
bulsan-s\xFCdtirol.it
bulsan-suedtirol.it
bulsan.it
bz.it
ca.it
cagliari.it
caltanissetta.it
campidano-medio.it
campidanomedio.it
campobasso.it
carbonia-iglesias.it
carboniaiglesias.it
carrara-massa.it
carraramassa.it
caserta.it
catania.it
catanzaro.it
cb.it
ce.it
cesena-forli.it
cesena-forl\xEC.it
cesenaforli.it
cesenaforl\xEC.it
ch.it
chieti.it
ci.it
cl.it
cn.it
co.it
como.it
cosenza.it
cr.it
cremona.it
crotone.it
cs.it
ct.it
cuneo.it
cz.it
dell-ogliastra.it
dellogliastra.it
en.it
enna.it
fc.it
fe.it
fermo.it
ferrara.it
fg.it
fi.it
firenze.it
florence.it
fm.it
foggia.it
forli-cesena.it
forl\xEC-cesena.it
forlicesena.it
forl\xECcesena.it
fr.it
frosinone.it
ge.it
genoa.it
genova.it
go.it
gorizia.it
gr.it
grosseto.it
iglesias-carbonia.it
iglesiascarbonia.it
im.it
imperia.it
is.it
isernia.it
kr.it
la-spezia.it
laquila.it
laspezia.it
latina.it
lc.it
le.it
lecce.it
lecco.it
li.it
livorno.it
lo.it
lodi.it
lt.it
lu.it
lucca.it
macerata.it
mantova.it
massa-carrara.it
massacarrara.it
matera.it
mb.it
mc.it
me.it
medio-campidano.it
mediocampidano.it
messina.it
mi.it
milan.it
milano.it
mn.it
mo.it
modena.it
monza-brianza.it
monza-e-della-brianza.it
monza.it
monzabrianza.it
monzaebrianza.it
monzaedellabrianza.it
ms.it
mt.it
na.it
naples.it
napoli.it
no.it
novara.it
nu.it
nuoro.it
og.it
ogliastra.it
olbia-tempio.it
olbiatempio.it
or.it
oristano.it
ot.it
pa.it
padova.it
padua.it
palermo.it
parma.it
pavia.it
pc.it
pd.it
pe.it
perugia.it
pesaro-urbino.it
pesarourbino.it
pescara.it
pg.it
pi.it
piacenza.it
pisa.it
pistoia.it
pn.it
po.it
pordenone.it
potenza.it
pr.it
prato.it
pt.it
pu.it
pv.it
pz.it
ra.it
ragusa.it
ravenna.it
rc.it
re.it
reggio-calabria.it
reggio-emilia.it
reggiocalabria.it
reggioemilia.it
rg.it
ri.it
rieti.it
rimini.it
rm.it
rn.it
ro.it
roma.it
rome.it
rovigo.it
sa.it
salerno.it
sassari.it
savona.it
si.it
siena.it
siracusa.it
so.it
sondrio.it
sp.it
sr.it
ss.it
suedtirol.it
s\xFCdtirol.it
sv.it
ta.it
taranto.it
te.it
tempio-olbia.it
tempioolbia.it
teramo.it
terni.it
tn.it
to.it
torino.it
tp.it
tr.it
trani-andria-barletta.it
trani-barletta-andria.it
traniandriabarletta.it
tranibarlettaandria.it
trapani.it
trento.it
treviso.it
trieste.it
ts.it
turin.it
tv.it
ud.it
udine.it
urbino-pesaro.it
urbinopesaro.it
va.it
varese.it
vb.it
vc.it
ve.it
venezia.it
venice.it
verbania.it
vercelli.it
verona.it
vi.it
vibo-valentia.it
vibovalentia.it
vicenza.it
viterbo.it
vr.it
vs.it
vt.it
vv.it

// je : http://www.channelisles.net/register-domains/
// Confirmed by registry <nigel@channelisles.net> 2013-11-28
je
co.je
net.je
org.je

// jm : http://www.com.jm/register.html
*.jm

// jo : http://www.dns.jo/Registration_policy.aspx
jo
com.jo
org.jo
net.jo
edu.jo
sch.jo
gov.jo
mil.jo
name.jo

// jobs : https://en.wikipedia.org/wiki/.jobs
jobs

// jp : https://en.wikipedia.org/wiki/.jp
// http://jprs.co.jp/en/jpdomain.html
// Submitted by registry <info@jprs.jp>
jp
// jp organizational type names
ac.jp
ad.jp
co.jp
ed.jp
go.jp
gr.jp
lg.jp
ne.jp
or.jp
// jp prefecture type names
aichi.jp
akita.jp
aomori.jp
chiba.jp
ehime.jp
fukui.jp
fukuoka.jp
fukushima.jp
gifu.jp
gunma.jp
hiroshima.jp
hokkaido.jp
hyogo.jp
ibaraki.jp
ishikawa.jp
iwate.jp
kagawa.jp
kagoshima.jp
kanagawa.jp
kochi.jp
kumamoto.jp
kyoto.jp
mie.jp
miyagi.jp
miyazaki.jp
nagano.jp
nagasaki.jp
nara.jp
niigata.jp
oita.jp
okayama.jp
okinawa.jp
osaka.jp
saga.jp
saitama.jp
shiga.jp
shimane.jp
shizuoka.jp
tochigi.jp
tokushima.jp
tokyo.jp
tottori.jp
toyama.jp
wakayama.jp
yamagata.jp
yamaguchi.jp
yamanashi.jp
\u6803\u6728.jp
\u611B\u77E5.jp
\u611B\u5A9B.jp
\u5175\u5EAB.jp
\u718A\u672C.jp
\u8328\u57CE.jp
\u5317\u6D77\u9053.jp
\u5343\u8449.jp
\u548C\u6B4C\u5C71.jp
\u9577\u5D0E.jp
\u9577\u91CE.jp
\u65B0\u6F5F.jp
\u9752\u68EE.jp
\u9759\u5CA1.jp
\u6771\u4EAC.jp
\u77F3\u5DDD.jp
\u57FC\u7389.jp
\u4E09\u91CD.jp
\u4EAC\u90FD.jp
\u4F50\u8CC0.jp
\u5927\u5206.jp
\u5927\u962A.jp
\u5948\u826F.jp
\u5BAE\u57CE.jp
\u5BAE\u5D0E.jp
\u5BCC\u5C71.jp
\u5C71\u53E3.jp
\u5C71\u5F62.jp
\u5C71\u68A8.jp
\u5CA9\u624B.jp
\u5C90\u961C.jp
\u5CA1\u5C71.jp
\u5CF6\u6839.jp
\u5E83\u5CF6.jp
\u5FB3\u5CF6.jp
\u6C96\u7E04.jp
\u6ECB\u8CC0.jp
\u795E\u5948\u5DDD.jp
\u798F\u4E95.jp
\u798F\u5CA1.jp
\u798F\u5CF6.jp
\u79CB\u7530.jp
\u7FA4\u99AC.jp
\u9999\u5DDD.jp
\u9AD8\u77E5.jp
\u9CE5\u53D6.jp
\u9E7F\u5150\u5CF6.jp
// jp geographic type names
// http://jprs.jp/doc/rule/saisoku-1.html
*.kawasaki.jp
*.kitakyushu.jp
*.kobe.jp
*.nagoya.jp
*.sapporo.jp
*.sendai.jp
*.yokohama.jp
!city.kawasaki.jp
!city.kitakyushu.jp
!city.kobe.jp
!city.nagoya.jp
!city.sapporo.jp
!city.sendai.jp
!city.yokohama.jp
// 4th level registration
aisai.aichi.jp
ama.aichi.jp
anjo.aichi.jp
asuke.aichi.jp
chiryu.aichi.jp
chita.aichi.jp
fuso.aichi.jp
gamagori.aichi.jp
handa.aichi.jp
hazu.aichi.jp
hekinan.aichi.jp
higashiura.aichi.jp
ichinomiya.aichi.jp
inazawa.aichi.jp
inuyama.aichi.jp
isshiki.aichi.jp
iwakura.aichi.jp
kanie.aichi.jp
kariya.aichi.jp
kasugai.aichi.jp
kira.aichi.jp
kiyosu.aichi.jp
komaki.aichi.jp
konan.aichi.jp
kota.aichi.jp
mihama.aichi.jp
miyoshi.aichi.jp
nishio.aichi.jp
nisshin.aichi.jp
obu.aichi.jp
oguchi.aichi.jp
oharu.aichi.jp
okazaki.aichi.jp
owariasahi.aichi.jp
seto.aichi.jp
shikatsu.aichi.jp
shinshiro.aichi.jp
shitara.aichi.jp
tahara.aichi.jp
takahama.aichi.jp
tobishima.aichi.jp
toei.aichi.jp
togo.aichi.jp
tokai.aichi.jp
tokoname.aichi.jp
toyoake.aichi.jp
toyohashi.aichi.jp
toyokawa.aichi.jp
toyone.aichi.jp
toyota.aichi.jp
tsushima.aichi.jp
yatomi.aichi.jp
akita.akita.jp
daisen.akita.jp
fujisato.akita.jp
gojome.akita.jp
hachirogata.akita.jp
happou.akita.jp
higashinaruse.akita.jp
honjo.akita.jp
honjyo.akita.jp
ikawa.akita.jp
kamikoani.akita.jp
kamioka.akita.jp
katagami.akita.jp
kazuno.akita.jp
kitaakita.akita.jp
kosaka.akita.jp
kyowa.akita.jp
misato.akita.jp
mitane.akita.jp
moriyoshi.akita.jp
nikaho.akita.jp
noshiro.akita.jp
odate.akita.jp
oga.akita.jp
ogata.akita.jp
semboku.akita.jp
yokote.akita.jp
yurihonjo.akita.jp
aomori.aomori.jp
gonohe.aomori.jp
hachinohe.aomori.jp
hashikami.aomori.jp
hiranai.aomori.jp
hirosaki.aomori.jp
itayanagi.aomori.jp
kuroishi.aomori.jp
misawa.aomori.jp
mutsu.aomori.jp
nakadomari.aomori.jp
noheji.aomori.jp
oirase.aomori.jp
owani.aomori.jp
rokunohe.aomori.jp
sannohe.aomori.jp
shichinohe.aomori.jp
shingo.aomori.jp
takko.aomori.jp
towada.aomori.jp
tsugaru.aomori.jp
tsuruta.aomori.jp
abiko.chiba.jp
asahi.chiba.jp
chonan.chiba.jp
chosei.chiba.jp
choshi.chiba.jp
chuo.chiba.jp
funabashi.chiba.jp
futtsu.chiba.jp
hanamigawa.chiba.jp
ichihara.chiba.jp
ichikawa.chiba.jp
ichinomiya.chiba.jp
inzai.chiba.jp
isumi.chiba.jp
kamagaya.chiba.jp
kamogawa.chiba.jp
kashiwa.chiba.jp
katori.chiba.jp
katsuura.chiba.jp
kimitsu.chiba.jp
kisarazu.chiba.jp
kozaki.chiba.jp
kujukuri.chiba.jp
kyonan.chiba.jp
matsudo.chiba.jp
midori.chiba.jp
mihama.chiba.jp
minamiboso.chiba.jp
mobara.chiba.jp
mutsuzawa.chiba.jp
nagara.chiba.jp
nagareyama.chiba.jp
narashino.chiba.jp
narita.chiba.jp
noda.chiba.jp
oamishirasato.chiba.jp
omigawa.chiba.jp
onjuku.chiba.jp
otaki.chiba.jp
sakae.chiba.jp
sakura.chiba.jp
shimofusa.chiba.jp
shirako.chiba.jp
shiroi.chiba.jp
shisui.chiba.jp
sodegaura.chiba.jp
sosa.chiba.jp
tako.chiba.jp
tateyama.chiba.jp
togane.chiba.jp
tohnosho.chiba.jp
tomisato.chiba.jp
urayasu.chiba.jp
yachimata.chiba.jp
yachiyo.chiba.jp
yokaichiba.chiba.jp
yokoshibahikari.chiba.jp
yotsukaido.chiba.jp
ainan.ehime.jp
honai.ehime.jp
ikata.ehime.jp
imabari.ehime.jp
iyo.ehime.jp
kamijima.ehime.jp
kihoku.ehime.jp
kumakogen.ehime.jp
masaki.ehime.jp
matsuno.ehime.jp
matsuyama.ehime.jp
namikata.ehime.jp
niihama.ehime.jp
ozu.ehime.jp
saijo.ehime.jp
seiyo.ehime.jp
shikokuchuo.ehime.jp
tobe.ehime.jp
toon.ehime.jp
uchiko.ehime.jp
uwajima.ehime.jp
yawatahama.ehime.jp
echizen.fukui.jp
eiheiji.fukui.jp
fukui.fukui.jp
ikeda.fukui.jp
katsuyama.fukui.jp
mihama.fukui.jp
minamiechizen.fukui.jp
obama.fukui.jp
ohi.fukui.jp
ono.fukui.jp
sabae.fukui.jp
sakai.fukui.jp
takahama.fukui.jp
tsuruga.fukui.jp
wakasa.fukui.jp
ashiya.fukuoka.jp
buzen.fukuoka.jp
chikugo.fukuoka.jp
chikuho.fukuoka.jp
chikujo.fukuoka.jp
chikushino.fukuoka.jp
chikuzen.fukuoka.jp
chuo.fukuoka.jp
dazaifu.fukuoka.jp
fukuchi.fukuoka.jp
hakata.fukuoka.jp
higashi.fukuoka.jp
hirokawa.fukuoka.jp
hisayama.fukuoka.jp
iizuka.fukuoka.jp
inatsuki.fukuoka.jp
kaho.fukuoka.jp
kasuga.fukuoka.jp
kasuya.fukuoka.jp
kawara.fukuoka.jp
keisen.fukuoka.jp
koga.fukuoka.jp
kurate.fukuoka.jp
kurogi.fukuoka.jp
kurume.fukuoka.jp
minami.fukuoka.jp
miyako.fukuoka.jp
miyama.fukuoka.jp
miyawaka.fukuoka.jp
mizumaki.fukuoka.jp
munakata.fukuoka.jp
nakagawa.fukuoka.jp
nakama.fukuoka.jp
nishi.fukuoka.jp
nogata.fukuoka.jp
ogori.fukuoka.jp
okagaki.fukuoka.jp
okawa.fukuoka.jp
oki.fukuoka.jp
omuta.fukuoka.jp
onga.fukuoka.jp
onojo.fukuoka.jp
oto.fukuoka.jp
saigawa.fukuoka.jp
sasaguri.fukuoka.jp
shingu.fukuoka.jp
shinyoshitomi.fukuoka.jp
shonai.fukuoka.jp
soeda.fukuoka.jp
sue.fukuoka.jp
tachiarai.fukuoka.jp
tagawa.fukuoka.jp
takata.fukuoka.jp
toho.fukuoka.jp
toyotsu.fukuoka.jp
tsuiki.fukuoka.jp
ukiha.fukuoka.jp
umi.fukuoka.jp
usui.fukuoka.jp
yamada.fukuoka.jp
yame.fukuoka.jp
yanagawa.fukuoka.jp
yukuhashi.fukuoka.jp
aizubange.fukushima.jp
aizumisato.fukushima.jp
aizuwakamatsu.fukushima.jp
asakawa.fukushima.jp
bandai.fukushima.jp
date.fukushima.jp
fukushima.fukushima.jp
furudono.fukushima.jp
futaba.fukushima.jp
hanawa.fukushima.jp
higashi.fukushima.jp
hirata.fukushima.jp
hirono.fukushima.jp
iitate.fukushima.jp
inawashiro.fukushima.jp
ishikawa.fukushima.jp
iwaki.fukushima.jp
izumizaki.fukushima.jp
kagamiishi.fukushima.jp
kaneyama.fukushima.jp
kawamata.fukushima.jp
kitakata.fukushima.jp
kitashiobara.fukushima.jp
koori.fukushima.jp
koriyama.fukushima.jp
kunimi.fukushima.jp
miharu.fukushima.jp
mishima.fukushima.jp
namie.fukushima.jp
nango.fukushima.jp
nishiaizu.fukushima.jp
nishigo.fukushima.jp
okuma.fukushima.jp
omotego.fukushima.jp
ono.fukushima.jp
otama.fukushima.jp
samegawa.fukushima.jp
shimogo.fukushima.jp
shirakawa.fukushima.jp
showa.fukushima.jp
soma.fukushima.jp
sukagawa.fukushima.jp
taishin.fukushima.jp
tamakawa.fukushima.jp
tanagura.fukushima.jp
tenei.fukushima.jp
yabuki.fukushima.jp
yamato.fukushima.jp
yamatsuri.fukushima.jp
yanaizu.fukushima.jp
yugawa.fukushima.jp
anpachi.gifu.jp
ena.gifu.jp
gifu.gifu.jp
ginan.gifu.jp
godo.gifu.jp
gujo.gifu.jp
hashima.gifu.jp
hichiso.gifu.jp
hida.gifu.jp
higashishirakawa.gifu.jp
ibigawa.gifu.jp
ikeda.gifu.jp
kakamigahara.gifu.jp
kani.gifu.jp
kasahara.gifu.jp
kasamatsu.gifu.jp
kawaue.gifu.jp
kitagata.gifu.jp
mino.gifu.jp
minokamo.gifu.jp
mitake.gifu.jp
mizunami.gifu.jp
motosu.gifu.jp
nakatsugawa.gifu.jp
ogaki.gifu.jp
sakahogi.gifu.jp
seki.gifu.jp
sekigahara.gifu.jp
shirakawa.gifu.jp
tajimi.gifu.jp
takayama.gifu.jp
tarui.gifu.jp
toki.gifu.jp
tomika.gifu.jp
wanouchi.gifu.jp
yamagata.gifu.jp
yaotsu.gifu.jp
yoro.gifu.jp
annaka.gunma.jp
chiyoda.gunma.jp
fujioka.gunma.jp
higashiagatsuma.gunma.jp
isesaki.gunma.jp
itakura.gunma.jp
kanna.gunma.jp
kanra.gunma.jp
katashina.gunma.jp
kawaba.gunma.jp
kiryu.gunma.jp
kusatsu.gunma.jp
maebashi.gunma.jp
meiwa.gunma.jp
midori.gunma.jp
minakami.gunma.jp
naganohara.gunma.jp
nakanojo.gunma.jp
nanmoku.gunma.jp
numata.gunma.jp
oizumi.gunma.jp
ora.gunma.jp
ota.gunma.jp
shibukawa.gunma.jp
shimonita.gunma.jp
shinto.gunma.jp
showa.gunma.jp
takasaki.gunma.jp
takayama.gunma.jp
tamamura.gunma.jp
tatebayashi.gunma.jp
tomioka.gunma.jp
tsukiyono.gunma.jp
tsumagoi.gunma.jp
ueno.gunma.jp
yoshioka.gunma.jp
asaminami.hiroshima.jp
daiwa.hiroshima.jp
etajima.hiroshima.jp
fuchu.hiroshima.jp
fukuyama.hiroshima.jp
hatsukaichi.hiroshima.jp
higashihiroshima.hiroshima.jp
hongo.hiroshima.jp
jinsekikogen.hiroshima.jp
kaita.hiroshima.jp
kui.hiroshima.jp
kumano.hiroshima.jp
kure.hiroshima.jp
mihara.hiroshima.jp
miyoshi.hiroshima.jp
naka.hiroshima.jp
onomichi.hiroshima.jp
osakikamijima.hiroshima.jp
otake.hiroshima.jp
saka.hiroshima.jp
sera.hiroshima.jp
seranishi.hiroshima.jp
shinichi.hiroshima.jp
shobara.hiroshima.jp
takehara.hiroshima.jp
abashiri.hokkaido.jp
abira.hokkaido.jp
aibetsu.hokkaido.jp
akabira.hokkaido.jp
akkeshi.hokkaido.jp
asahikawa.hokkaido.jp
ashibetsu.hokkaido.jp
ashoro.hokkaido.jp
assabu.hokkaido.jp
atsuma.hokkaido.jp
bibai.hokkaido.jp
biei.hokkaido.jp
bifuka.hokkaido.jp
bihoro.hokkaido.jp
biratori.hokkaido.jp
chippubetsu.hokkaido.jp
chitose.hokkaido.jp
date.hokkaido.jp
ebetsu.hokkaido.jp
embetsu.hokkaido.jp
eniwa.hokkaido.jp
erimo.hokkaido.jp
esan.hokkaido.jp
esashi.hokkaido.jp
fukagawa.hokkaido.jp
fukushima.hokkaido.jp
furano.hokkaido.jp
furubira.hokkaido.jp
haboro.hokkaido.jp
hakodate.hokkaido.jp
hamatonbetsu.hokkaido.jp
hidaka.hokkaido.jp
higashikagura.hokkaido.jp
higashikawa.hokkaido.jp
hiroo.hokkaido.jp
hokuryu.hokkaido.jp
hokuto.hokkaido.jp
honbetsu.hokkaido.jp
horokanai.hokkaido.jp
horonobe.hokkaido.jp
ikeda.hokkaido.jp
imakane.hokkaido.jp
ishikari.hokkaido.jp
iwamizawa.hokkaido.jp
iwanai.hokkaido.jp
kamifurano.hokkaido.jp
kamikawa.hokkaido.jp
kamishihoro.hokkaido.jp
kamisunagawa.hokkaido.jp
kamoenai.hokkaido.jp
kayabe.hokkaido.jp
kembuchi.hokkaido.jp
kikonai.hokkaido.jp
kimobetsu.hokkaido.jp
kitahiroshima.hokkaido.jp
kitami.hokkaido.jp
kiyosato.hokkaido.jp
koshimizu.hokkaido.jp
kunneppu.hokkaido.jp
kuriyama.hokkaido.jp
kuromatsunai.hokkaido.jp
kushiro.hokkaido.jp
kutchan.hokkaido.jp
kyowa.hokkaido.jp
mashike.hokkaido.jp
matsumae.hokkaido.jp
mikasa.hokkaido.jp
minamifurano.hokkaido.jp
mombetsu.hokkaido.jp
moseushi.hokkaido.jp
mukawa.hokkaido.jp
muroran.hokkaido.jp
naie.hokkaido.jp
nakagawa.hokkaido.jp
nakasatsunai.hokkaido.jp
nakatombetsu.hokkaido.jp
nanae.hokkaido.jp
nanporo.hokkaido.jp
nayoro.hokkaido.jp
nemuro.hokkaido.jp
niikappu.hokkaido.jp
niki.hokkaido.jp
nishiokoppe.hokkaido.jp
noboribetsu.hokkaido.jp
numata.hokkaido.jp
obihiro.hokkaido.jp
obira.hokkaido.jp
oketo.hokkaido.jp
okoppe.hokkaido.jp
otaru.hokkaido.jp
otobe.hokkaido.jp
otofuke.hokkaido.jp
otoineppu.hokkaido.jp
oumu.hokkaido.jp
ozora.hokkaido.jp
pippu.hokkaido.jp
rankoshi.hokkaido.jp
rebun.hokkaido.jp
rikubetsu.hokkaido.jp
rishiri.hokkaido.jp
rishirifuji.hokkaido.jp
saroma.hokkaido.jp
sarufutsu.hokkaido.jp
shakotan.hokkaido.jp
shari.hokkaido.jp
shibecha.hokkaido.jp
shibetsu.hokkaido.jp
shikabe.hokkaido.jp
shikaoi.hokkaido.jp
shimamaki.hokkaido.jp
shimizu.hokkaido.jp
shimokawa.hokkaido.jp
shinshinotsu.hokkaido.jp
shintoku.hokkaido.jp
shiranuka.hokkaido.jp
shiraoi.hokkaido.jp
shiriuchi.hokkaido.jp
sobetsu.hokkaido.jp
sunagawa.hokkaido.jp
taiki.hokkaido.jp
takasu.hokkaido.jp
takikawa.hokkaido.jp
takinoue.hokkaido.jp
teshikaga.hokkaido.jp
tobetsu.hokkaido.jp
tohma.hokkaido.jp
tomakomai.hokkaido.jp
tomari.hokkaido.jp
toya.hokkaido.jp
toyako.hokkaido.jp
toyotomi.hokkaido.jp
toyoura.hokkaido.jp
tsubetsu.hokkaido.jp
tsukigata.hokkaido.jp
urakawa.hokkaido.jp
urausu.hokkaido.jp
uryu.hokkaido.jp
utashinai.hokkaido.jp
wakkanai.hokkaido.jp
wassamu.hokkaido.jp
yakumo.hokkaido.jp
yoichi.hokkaido.jp
aioi.hyogo.jp
akashi.hyogo.jp
ako.hyogo.jp
amagasaki.hyogo.jp
aogaki.hyogo.jp
asago.hyogo.jp
ashiya.hyogo.jp
awaji.hyogo.jp
fukusaki.hyogo.jp
goshiki.hyogo.jp
harima.hyogo.jp
himeji.hyogo.jp
ichikawa.hyogo.jp
inagawa.hyogo.jp
itami.hyogo.jp
kakogawa.hyogo.jp
kamigori.hyogo.jp
kamikawa.hyogo.jp
kasai.hyogo.jp
kasuga.hyogo.jp
kawanishi.hyogo.jp
miki.hyogo.jp
minamiawaji.hyogo.jp
nishinomiya.hyogo.jp
nishiwaki.hyogo.jp
ono.hyogo.jp
sanda.hyogo.jp
sannan.hyogo.jp
sasayama.hyogo.jp
sayo.hyogo.jp
shingu.hyogo.jp
shinonsen.hyogo.jp
shiso.hyogo.jp
sumoto.hyogo.jp
taishi.hyogo.jp
taka.hyogo.jp
takarazuka.hyogo.jp
takasago.hyogo.jp
takino.hyogo.jp
tamba.hyogo.jp
tatsuno.hyogo.jp
toyooka.hyogo.jp
yabu.hyogo.jp
yashiro.hyogo.jp
yoka.hyogo.jp
yokawa.hyogo.jp
ami.ibaraki.jp
asahi.ibaraki.jp
bando.ibaraki.jp
chikusei.ibaraki.jp
daigo.ibaraki.jp
fujishiro.ibaraki.jp
hitachi.ibaraki.jp
hitachinaka.ibaraki.jp
hitachiomiya.ibaraki.jp
hitachiota.ibaraki.jp
ibaraki.ibaraki.jp
ina.ibaraki.jp
inashiki.ibaraki.jp
itako.ibaraki.jp
iwama.ibaraki.jp
joso.ibaraki.jp
kamisu.ibaraki.jp
kasama.ibaraki.jp
kashima.ibaraki.jp
kasumigaura.ibaraki.jp
koga.ibaraki.jp
miho.ibaraki.jp
mito.ibaraki.jp
moriya.ibaraki.jp
naka.ibaraki.jp
namegata.ibaraki.jp
oarai.ibaraki.jp
ogawa.ibaraki.jp
omitama.ibaraki.jp
ryugasaki.ibaraki.jp
sakai.ibaraki.jp
sakuragawa.ibaraki.jp
shimodate.ibaraki.jp
shimotsuma.ibaraki.jp
shirosato.ibaraki.jp
sowa.ibaraki.jp
suifu.ibaraki.jp
takahagi.ibaraki.jp
tamatsukuri.ibaraki.jp
tokai.ibaraki.jp
tomobe.ibaraki.jp
tone.ibaraki.jp
toride.ibaraki.jp
tsuchiura.ibaraki.jp
tsukuba.ibaraki.jp
uchihara.ibaraki.jp
ushiku.ibaraki.jp
yachiyo.ibaraki.jp
yamagata.ibaraki.jp
yawara.ibaraki.jp
yuki.ibaraki.jp
anamizu.ishikawa.jp
hakui.ishikawa.jp
hakusan.ishikawa.jp
kaga.ishikawa.jp
kahoku.ishikawa.jp
kanazawa.ishikawa.jp
kawakita.ishikawa.jp
komatsu.ishikawa.jp
nakanoto.ishikawa.jp
nanao.ishikawa.jp
nomi.ishikawa.jp
nonoichi.ishikawa.jp
noto.ishikawa.jp
shika.ishikawa.jp
suzu.ishikawa.jp
tsubata.ishikawa.jp
tsurugi.ishikawa.jp
uchinada.ishikawa.jp
wajima.ishikawa.jp
fudai.iwate.jp
fujisawa.iwate.jp
hanamaki.iwate.jp
hiraizumi.iwate.jp
hirono.iwate.jp
ichinohe.iwate.jp
ichinoseki.iwate.jp
iwaizumi.iwate.jp
iwate.iwate.jp
joboji.iwate.jp
kamaishi.iwate.jp
kanegasaki.iwate.jp
karumai.iwate.jp
kawai.iwate.jp
kitakami.iwate.jp
kuji.iwate.jp
kunohe.iwate.jp
kuzumaki.iwate.jp
miyako.iwate.jp
mizusawa.iwate.jp
morioka.iwate.jp
ninohe.iwate.jp
noda.iwate.jp
ofunato.iwate.jp
oshu.iwate.jp
otsuchi.iwate.jp
rikuzentakata.iwate.jp
shiwa.iwate.jp
shizukuishi.iwate.jp
sumita.iwate.jp
tanohata.iwate.jp
tono.iwate.jp
yahaba.iwate.jp
yamada.iwate.jp
ayagawa.kagawa.jp
higashikagawa.kagawa.jp
kanonji.kagawa.jp
kotohira.kagawa.jp
manno.kagawa.jp
marugame.kagawa.jp
mitoyo.kagawa.jp
naoshima.kagawa.jp
sanuki.kagawa.jp
tadotsu.kagawa.jp
takamatsu.kagawa.jp
tonosho.kagawa.jp
uchinomi.kagawa.jp
utazu.kagawa.jp
zentsuji.kagawa.jp
akune.kagoshima.jp
amami.kagoshima.jp
hioki.kagoshima.jp
isa.kagoshima.jp
isen.kagoshima.jp
izumi.kagoshima.jp
kagoshima.kagoshima.jp
kanoya.kagoshima.jp
kawanabe.kagoshima.jp
kinko.kagoshima.jp
kouyama.kagoshima.jp
makurazaki.kagoshima.jp
matsumoto.kagoshima.jp
minamitane.kagoshima.jp
nakatane.kagoshima.jp
nishinoomote.kagoshima.jp
satsumasendai.kagoshima.jp
soo.kagoshima.jp
tarumizu.kagoshima.jp
yusui.kagoshima.jp
aikawa.kanagawa.jp
atsugi.kanagawa.jp
ayase.kanagawa.jp
chigasaki.kanagawa.jp
ebina.kanagawa.jp
fujisawa.kanagawa.jp
hadano.kanagawa.jp
hakone.kanagawa.jp
hiratsuka.kanagawa.jp
isehara.kanagawa.jp
kaisei.kanagawa.jp
kamakura.kanagawa.jp
kiyokawa.kanagawa.jp
matsuda.kanagawa.jp
minamiashigara.kanagawa.jp
miura.kanagawa.jp
nakai.kanagawa.jp
ninomiya.kanagawa.jp
odawara.kanagawa.jp
oi.kanagawa.jp
oiso.kanagawa.jp
sagamihara.kanagawa.jp
samukawa.kanagawa.jp
tsukui.kanagawa.jp
yamakita.kanagawa.jp
yamato.kanagawa.jp
yokosuka.kanagawa.jp
yugawara.kanagawa.jp
zama.kanagawa.jp
zushi.kanagawa.jp
aki.kochi.jp
geisei.kochi.jp
hidaka.kochi.jp
higashitsuno.kochi.jp
ino.kochi.jp
kagami.kochi.jp
kami.kochi.jp
kitagawa.kochi.jp
kochi.kochi.jp
mihara.kochi.jp
motoyama.kochi.jp
muroto.kochi.jp
nahari.kochi.jp
nakamura.kochi.jp
nankoku.kochi.jp
nishitosa.kochi.jp
niyodogawa.kochi.jp
ochi.kochi.jp
okawa.kochi.jp
otoyo.kochi.jp
otsuki.kochi.jp
sakawa.kochi.jp
sukumo.kochi.jp
susaki.kochi.jp
tosa.kochi.jp
tosashimizu.kochi.jp
toyo.kochi.jp
tsuno.kochi.jp
umaji.kochi.jp
yasuda.kochi.jp
yusuhara.kochi.jp
amakusa.kumamoto.jp
arao.kumamoto.jp
aso.kumamoto.jp
choyo.kumamoto.jp
gyokuto.kumamoto.jp
kamiamakusa.kumamoto.jp
kikuchi.kumamoto.jp
kumamoto.kumamoto.jp
mashiki.kumamoto.jp
mifune.kumamoto.jp
minamata.kumamoto.jp
minamioguni.kumamoto.jp
nagasu.kumamoto.jp
nishihara.kumamoto.jp
oguni.kumamoto.jp
ozu.kumamoto.jp
sumoto.kumamoto.jp
takamori.kumamoto.jp
uki.kumamoto.jp
uto.kumamoto.jp
yamaga.kumamoto.jp
yamato.kumamoto.jp
yatsushiro.kumamoto.jp
ayabe.kyoto.jp
fukuchiyama.kyoto.jp
higashiyama.kyoto.jp
ide.kyoto.jp
ine.kyoto.jp
joyo.kyoto.jp
kameoka.kyoto.jp
kamo.kyoto.jp
kita.kyoto.jp
kizu.kyoto.jp
kumiyama.kyoto.jp
kyotamba.kyoto.jp
kyotanabe.kyoto.jp
kyotango.kyoto.jp
maizuru.kyoto.jp
minami.kyoto.jp
minamiyamashiro.kyoto.jp
miyazu.kyoto.jp
muko.kyoto.jp
nagaokakyo.kyoto.jp
nakagyo.kyoto.jp
nantan.kyoto.jp
oyamazaki.kyoto.jp
sakyo.kyoto.jp
seika.kyoto.jp
tanabe.kyoto.jp
uji.kyoto.jp
ujitawara.kyoto.jp
wazuka.kyoto.jp
yamashina.kyoto.jp
yawata.kyoto.jp
asahi.mie.jp
inabe.mie.jp
ise.mie.jp
kameyama.mie.jp
kawagoe.mie.jp
kiho.mie.jp
kisosaki.mie.jp
kiwa.mie.jp
komono.mie.jp
kumano.mie.jp
kuwana.mie.jp
matsusaka.mie.jp
meiwa.mie.jp
mihama.mie.jp
minamiise.mie.jp
misugi.mie.jp
miyama.mie.jp
nabari.mie.jp
shima.mie.jp
suzuka.mie.jp
tado.mie.jp
taiki.mie.jp
taki.mie.jp
tamaki.mie.jp
toba.mie.jp
tsu.mie.jp
udono.mie.jp
ureshino.mie.jp
watarai.mie.jp
yokkaichi.mie.jp
furukawa.miyagi.jp
higashimatsushima.miyagi.jp
ishinomaki.miyagi.jp
iwanuma.miyagi.jp
kakuda.miyagi.jp
kami.miyagi.jp
kawasaki.miyagi.jp
marumori.miyagi.jp
matsushima.miyagi.jp
minamisanriku.miyagi.jp
misato.miyagi.jp
murata.miyagi.jp
natori.miyagi.jp
ogawara.miyagi.jp
ohira.miyagi.jp
onagawa.miyagi.jp
osaki.miyagi.jp
rifu.miyagi.jp
semine.miyagi.jp
shibata.miyagi.jp
shichikashuku.miyagi.jp
shikama.miyagi.jp
shiogama.miyagi.jp
shiroishi.miyagi.jp
tagajo.miyagi.jp
taiwa.miyagi.jp
tome.miyagi.jp
tomiya.miyagi.jp
wakuya.miyagi.jp
watari.miyagi.jp
yamamoto.miyagi.jp
zao.miyagi.jp
aya.miyazaki.jp
ebino.miyazaki.jp
gokase.miyazaki.jp
hyuga.miyazaki.jp
kadogawa.miyazaki.jp
kawaminami.miyazaki.jp
kijo.miyazaki.jp
kitagawa.miyazaki.jp
kitakata.miyazaki.jp
kitaura.miyazaki.jp
kobayashi.miyazaki.jp
kunitomi.miyazaki.jp
kushima.miyazaki.jp
mimata.miyazaki.jp
miyakonojo.miyazaki.jp
miyazaki.miyazaki.jp
morotsuka.miyazaki.jp
nichinan.miyazaki.jp
nishimera.miyazaki.jp
nobeoka.miyazaki.jp
saito.miyazaki.jp
shiiba.miyazaki.jp
shintomi.miyazaki.jp
takaharu.miyazaki.jp
takanabe.miyazaki.jp
takazaki.miyazaki.jp
tsuno.miyazaki.jp
achi.nagano.jp
agematsu.nagano.jp
anan.nagano.jp
aoki.nagano.jp
asahi.nagano.jp
azumino.nagano.jp
chikuhoku.nagano.jp
chikuma.nagano.jp
chino.nagano.jp
fujimi.nagano.jp
hakuba.nagano.jp
hara.nagano.jp
hiraya.nagano.jp
iida.nagano.jp
iijima.nagano.jp
iiyama.nagano.jp
iizuna.nagano.jp
ikeda.nagano.jp
ikusaka.nagano.jp
ina.nagano.jp
karuizawa.nagano.jp
kawakami.nagano.jp
kiso.nagano.jp
kisofukushima.nagano.jp
kitaaiki.nagano.jp
komagane.nagano.jp
komoro.nagano.jp
matsukawa.nagano.jp
matsumoto.nagano.jp
miasa.nagano.jp
minamiaiki.nagano.jp
minamimaki.nagano.jp
minamiminowa.nagano.jp
minowa.nagano.jp
miyada.nagano.jp
miyota.nagano.jp
mochizuki.nagano.jp
nagano.nagano.jp
nagawa.nagano.jp
nagiso.nagano.jp
nakagawa.nagano.jp
nakano.nagano.jp
nozawaonsen.nagano.jp
obuse.nagano.jp
ogawa.nagano.jp
okaya.nagano.jp
omachi.nagano.jp
omi.nagano.jp
ookuwa.nagano.jp
ooshika.nagano.jp
otaki.nagano.jp
otari.nagano.jp
sakae.nagano.jp
sakaki.nagano.jp
saku.nagano.jp
sakuho.nagano.jp
shimosuwa.nagano.jp
shinanomachi.nagano.jp
shiojiri.nagano.jp
suwa.nagano.jp
suzaka.nagano.jp
takagi.nagano.jp
takamori.nagano.jp
takayama.nagano.jp
tateshina.nagano.jp
tatsuno.nagano.jp
togakushi.nagano.jp
togura.nagano.jp
tomi.nagano.jp
ueda.nagano.jp
wada.nagano.jp
yamagata.nagano.jp
yamanouchi.nagano.jp
yasaka.nagano.jp
yasuoka.nagano.jp
chijiwa.nagasaki.jp
futsu.nagasaki.jp
goto.nagasaki.jp
hasami.nagasaki.jp
hirado.nagasaki.jp
iki.nagasaki.jp
isahaya.nagasaki.jp
kawatana.nagasaki.jp
kuchinotsu.nagasaki.jp
matsuura.nagasaki.jp
nagasaki.nagasaki.jp
obama.nagasaki.jp
omura.nagasaki.jp
oseto.nagasaki.jp
saikai.nagasaki.jp
sasebo.nagasaki.jp
seihi.nagasaki.jp
shimabara.nagasaki.jp
shinkamigoto.nagasaki.jp
togitsu.nagasaki.jp
tsushima.nagasaki.jp
unzen.nagasaki.jp
ando.nara.jp
gose.nara.jp
heguri.nara.jp
higashiyoshino.nara.jp
ikaruga.nara.jp
ikoma.nara.jp
kamikitayama.nara.jp
kanmaki.nara.jp
kashiba.nara.jp
kashihara.nara.jp
katsuragi.nara.jp
kawai.nara.jp
kawakami.nara.jp
kawanishi.nara.jp
koryo.nara.jp
kurotaki.nara.jp
mitsue.nara.jp
miyake.nara.jp
nara.nara.jp
nosegawa.nara.jp
oji.nara.jp
ouda.nara.jp
oyodo.nara.jp
sakurai.nara.jp
sango.nara.jp
shimoichi.nara.jp
shimokitayama.nara.jp
shinjo.nara.jp
soni.nara.jp
takatori.nara.jp
tawaramoto.nara.jp
tenkawa.nara.jp
tenri.nara.jp
uda.nara.jp
yamatokoriyama.nara.jp
yamatotakada.nara.jp
yamazoe.nara.jp
yoshino.nara.jp
aga.niigata.jp
agano.niigata.jp
gosen.niigata.jp
itoigawa.niigata.jp
izumozaki.niigata.jp
joetsu.niigata.jp
kamo.niigata.jp
kariwa.niigata.jp
kashiwazaki.niigata.jp
minamiuonuma.niigata.jp
mitsuke.niigata.jp
muika.niigata.jp
murakami.niigata.jp
myoko.niigata.jp
nagaoka.niigata.jp
niigata.niigata.jp
ojiya.niigata.jp
omi.niigata.jp
sado.niigata.jp
sanjo.niigata.jp
seiro.niigata.jp
seirou.niigata.jp
sekikawa.niigata.jp
shibata.niigata.jp
tagami.niigata.jp
tainai.niigata.jp
tochio.niigata.jp
tokamachi.niigata.jp
tsubame.niigata.jp
tsunan.niigata.jp
uonuma.niigata.jp
yahiko.niigata.jp
yoita.niigata.jp
yuzawa.niigata.jp
beppu.oita.jp
bungoono.oita.jp
bungotakada.oita.jp
hasama.oita.jp
hiji.oita.jp
himeshima.oita.jp
hita.oita.jp
kamitsue.oita.jp
kokonoe.oita.jp
kuju.oita.jp
kunisaki.oita.jp
kusu.oita.jp
oita.oita.jp
saiki.oita.jp
taketa.oita.jp
tsukumi.oita.jp
usa.oita.jp
usuki.oita.jp
yufu.oita.jp
akaiwa.okayama.jp
asakuchi.okayama.jp
bizen.okayama.jp
hayashima.okayama.jp
ibara.okayama.jp
kagamino.okayama.jp
kasaoka.okayama.jp
kibichuo.okayama.jp
kumenan.okayama.jp
kurashiki.okayama.jp
maniwa.okayama.jp
misaki.okayama.jp
nagi.okayama.jp
niimi.okayama.jp
nishiawakura.okayama.jp
okayama.okayama.jp
satosho.okayama.jp
setouchi.okayama.jp
shinjo.okayama.jp
shoo.okayama.jp
soja.okayama.jp
takahashi.okayama.jp
tamano.okayama.jp
tsuyama.okayama.jp
wake.okayama.jp
yakage.okayama.jp
aguni.okinawa.jp
ginowan.okinawa.jp
ginoza.okinawa.jp
gushikami.okinawa.jp
haebaru.okinawa.jp
higashi.okinawa.jp
hirara.okinawa.jp
iheya.okinawa.jp
ishigaki.okinawa.jp
ishikawa.okinawa.jp
itoman.okinawa.jp
izena.okinawa.jp
kadena.okinawa.jp
kin.okinawa.jp
kitadaito.okinawa.jp
kitanakagusuku.okinawa.jp
kumejima.okinawa.jp
kunigami.okinawa.jp
minamidaito.okinawa.jp
motobu.okinawa.jp
nago.okinawa.jp
naha.okinawa.jp
nakagusuku.okinawa.jp
nakijin.okinawa.jp
nanjo.okinawa.jp
nishihara.okinawa.jp
ogimi.okinawa.jp
okinawa.okinawa.jp
onna.okinawa.jp
shimoji.okinawa.jp
taketomi.okinawa.jp
tarama.okinawa.jp
tokashiki.okinawa.jp
tomigusuku.okinawa.jp
tonaki.okinawa.jp
urasoe.okinawa.jp
uruma.okinawa.jp
yaese.okinawa.jp
yomitan.okinawa.jp
yonabaru.okinawa.jp
yonaguni.okinawa.jp
zamami.okinawa.jp
abeno.osaka.jp
chihayaakasaka.osaka.jp
chuo.osaka.jp
daito.osaka.jp
fujiidera.osaka.jp
habikino.osaka.jp
hannan.osaka.jp
higashiosaka.osaka.jp
higashisumiyoshi.osaka.jp
higashiyodogawa.osaka.jp
hirakata.osaka.jp
ibaraki.osaka.jp
ikeda.osaka.jp
izumi.osaka.jp
izumiotsu.osaka.jp
izumisano.osaka.jp
kadoma.osaka.jp
kaizuka.osaka.jp
kanan.osaka.jp
kashiwara.osaka.jp
katano.osaka.jp
kawachinagano.osaka.jp
kishiwada.osaka.jp
kita.osaka.jp
kumatori.osaka.jp
matsubara.osaka.jp
minato.osaka.jp
minoh.osaka.jp
misaki.osaka.jp
moriguchi.osaka.jp
neyagawa.osaka.jp
nishi.osaka.jp
nose.osaka.jp
osakasayama.osaka.jp
sakai.osaka.jp
sayama.osaka.jp
sennan.osaka.jp
settsu.osaka.jp
shijonawate.osaka.jp
shimamoto.osaka.jp
suita.osaka.jp
tadaoka.osaka.jp
taishi.osaka.jp
tajiri.osaka.jp
takaishi.osaka.jp
takatsuki.osaka.jp
tondabayashi.osaka.jp
toyonaka.osaka.jp
toyono.osaka.jp
yao.osaka.jp
ariake.saga.jp
arita.saga.jp
fukudomi.saga.jp
genkai.saga.jp
hamatama.saga.jp
hizen.saga.jp
imari.saga.jp
kamimine.saga.jp
kanzaki.saga.jp
karatsu.saga.jp
kashima.saga.jp
kitagata.saga.jp
kitahata.saga.jp
kiyama.saga.jp
kouhoku.saga.jp
kyuragi.saga.jp
nishiarita.saga.jp
ogi.saga.jp
omachi.saga.jp
ouchi.saga.jp
saga.saga.jp
shiroishi.saga.jp
taku.saga.jp
tara.saga.jp
tosu.saga.jp
yoshinogari.saga.jp
arakawa.saitama.jp
asaka.saitama.jp
chichibu.saitama.jp
fujimi.saitama.jp
fujimino.saitama.jp
fukaya.saitama.jp
hanno.saitama.jp
hanyu.saitama.jp
hasuda.saitama.jp
hatogaya.saitama.jp
hatoyama.saitama.jp
hidaka.saitama.jp
higashichichibu.saitama.jp
higashimatsuyama.saitama.jp
honjo.saitama.jp
ina.saitama.jp
iruma.saitama.jp
iwatsuki.saitama.jp
kamiizumi.saitama.jp
kamikawa.saitama.jp
kamisato.saitama.jp
kasukabe.saitama.jp
kawagoe.saitama.jp
kawaguchi.saitama.jp
kawajima.saitama.jp
kazo.saitama.jp
kitamoto.saitama.jp
koshigaya.saitama.jp
kounosu.saitama.jp
kuki.saitama.jp
kumagaya.saitama.jp
matsubushi.saitama.jp
minano.saitama.jp
misato.saitama.jp
miyashiro.saitama.jp
miyoshi.saitama.jp
moroyama.saitama.jp
nagatoro.saitama.jp
namegawa.saitama.jp
niiza.saitama.jp
ogano.saitama.jp
ogawa.saitama.jp
ogose.saitama.jp
okegawa.saitama.jp
omiya.saitama.jp
otaki.saitama.jp
ranzan.saitama.jp
ryokami.saitama.jp
saitama.saitama.jp
sakado.saitama.jp
satte.saitama.jp
sayama.saitama.jp
shiki.saitama.jp
shiraoka.saitama.jp
soka.saitama.jp
sugito.saitama.jp
toda.saitama.jp
tokigawa.saitama.jp
tokorozawa.saitama.jp
tsurugashima.saitama.jp
urawa.saitama.jp
warabi.saitama.jp
yashio.saitama.jp
yokoze.saitama.jp
yono.saitama.jp
yorii.saitama.jp
yoshida.saitama.jp
yoshikawa.saitama.jp
yoshimi.saitama.jp
aisho.shiga.jp
gamo.shiga.jp
higashiomi.shiga.jp
hikone.shiga.jp
koka.shiga.jp
konan.shiga.jp
kosei.shiga.jp
koto.shiga.jp
kusatsu.shiga.jp
maibara.shiga.jp
moriyama.shiga.jp
nagahama.shiga.jp
nishiazai.shiga.jp
notogawa.shiga.jp
omihachiman.shiga.jp
otsu.shiga.jp
ritto.shiga.jp
ryuoh.shiga.jp
takashima.shiga.jp
takatsuki.shiga.jp
torahime.shiga.jp
toyosato.shiga.jp
yasu.shiga.jp
akagi.shimane.jp
ama.shimane.jp
gotsu.shimane.jp
hamada.shimane.jp
higashiizumo.shimane.jp
hikawa.shimane.jp
hikimi.shimane.jp
izumo.shimane.jp
kakinoki.shimane.jp
masuda.shimane.jp
matsue.shimane.jp
misato.shimane.jp
nishinoshima.shimane.jp
ohda.shimane.jp
okinoshima.shimane.jp
okuizumo.shimane.jp
shimane.shimane.jp
tamayu.shimane.jp
tsuwano.shimane.jp
unnan.shimane.jp
yakumo.shimane.jp
yasugi.shimane.jp
yatsuka.shimane.jp
arai.shizuoka.jp
atami.shizuoka.jp
fuji.shizuoka.jp
fujieda.shizuoka.jp
fujikawa.shizuoka.jp
fujinomiya.shizuoka.jp
fukuroi.shizuoka.jp
gotemba.shizuoka.jp
haibara.shizuoka.jp
hamamatsu.shizuoka.jp
higashiizu.shizuoka.jp
ito.shizuoka.jp
iwata.shizuoka.jp
izu.shizuoka.jp
izunokuni.shizuoka.jp
kakegawa.shizuoka.jp
kannami.shizuoka.jp
kawanehon.shizuoka.jp
kawazu.shizuoka.jp
kikugawa.shizuoka.jp
kosai.shizuoka.jp
makinohara.shizuoka.jp
matsuzaki.shizuoka.jp
minamiizu.shizuoka.jp
mishima.shizuoka.jp
morimachi.shizuoka.jp
nishiizu.shizuoka.jp
numazu.shizuoka.jp
omaezaki.shizuoka.jp
shimada.shizuoka.jp
shimizu.shizuoka.jp
shimoda.shizuoka.jp
shizuoka.shizuoka.jp
susono.shizuoka.jp
yaizu.shizuoka.jp
yoshida.shizuoka.jp
ashikaga.tochigi.jp
bato.tochigi.jp
haga.tochigi.jp
ichikai.tochigi.jp
iwafune.tochigi.jp
kaminokawa.tochigi.jp
kanuma.tochigi.jp
karasuyama.tochigi.jp
kuroiso.tochigi.jp
mashiko.tochigi.jp
mibu.tochigi.jp
moka.tochigi.jp
motegi.tochigi.jp
nasu.tochigi.jp
nasushiobara.tochigi.jp
nikko.tochigi.jp
nishikata.tochigi.jp
nogi.tochigi.jp
ohira.tochigi.jp
ohtawara.tochigi.jp
oyama.tochigi.jp
sakura.tochigi.jp
sano.tochigi.jp
shimotsuke.tochigi.jp
shioya.tochigi.jp
takanezawa.tochigi.jp
tochigi.tochigi.jp
tsuga.tochigi.jp
ujiie.tochigi.jp
utsunomiya.tochigi.jp
yaita.tochigi.jp
aizumi.tokushima.jp
anan.tokushima.jp
ichiba.tokushima.jp
itano.tokushima.jp
kainan.tokushima.jp
komatsushima.tokushima.jp
matsushige.tokushima.jp
mima.tokushima.jp
minami.tokushima.jp
miyoshi.tokushima.jp
mugi.tokushima.jp
nakagawa.tokushima.jp
naruto.tokushima.jp
sanagochi.tokushima.jp
shishikui.tokushima.jp
tokushima.tokushima.jp
wajiki.tokushima.jp
adachi.tokyo.jp
akiruno.tokyo.jp
akishima.tokyo.jp
aogashima.tokyo.jp
arakawa.tokyo.jp
bunkyo.tokyo.jp
chiyoda.tokyo.jp
chofu.tokyo.jp
chuo.tokyo.jp
edogawa.tokyo.jp
fuchu.tokyo.jp
fussa.tokyo.jp
hachijo.tokyo.jp
hachioji.tokyo.jp
hamura.tokyo.jp
higashikurume.tokyo.jp
higashimurayama.tokyo.jp
higashiyamato.tokyo.jp
hino.tokyo.jp
hinode.tokyo.jp
hinohara.tokyo.jp
inagi.tokyo.jp
itabashi.tokyo.jp
katsushika.tokyo.jp
kita.tokyo.jp
kiyose.tokyo.jp
kodaira.tokyo.jp
koganei.tokyo.jp
kokubunji.tokyo.jp
komae.tokyo.jp
koto.tokyo.jp
kouzushima.tokyo.jp
kunitachi.tokyo.jp
machida.tokyo.jp
meguro.tokyo.jp
minato.tokyo.jp
mitaka.tokyo.jp
mizuho.tokyo.jp
musashimurayama.tokyo.jp
musashino.tokyo.jp
nakano.tokyo.jp
nerima.tokyo.jp
ogasawara.tokyo.jp
okutama.tokyo.jp
ome.tokyo.jp
oshima.tokyo.jp
ota.tokyo.jp
setagaya.tokyo.jp
shibuya.tokyo.jp
shinagawa.tokyo.jp
shinjuku.tokyo.jp
suginami.tokyo.jp
sumida.tokyo.jp
tachikawa.tokyo.jp
taito.tokyo.jp
tama.tokyo.jp
toshima.tokyo.jp
chizu.tottori.jp
hino.tottori.jp
kawahara.tottori.jp
koge.tottori.jp
kotoura.tottori.jp
misasa.tottori.jp
nanbu.tottori.jp
nichinan.tottori.jp
sakaiminato.tottori.jp
tottori.tottori.jp
wakasa.tottori.jp
yazu.tottori.jp
yonago.tottori.jp
asahi.toyama.jp
fuchu.toyama.jp
fukumitsu.toyama.jp
funahashi.toyama.jp
himi.toyama.jp
imizu.toyama.jp
inami.toyama.jp
johana.toyama.jp
kamiichi.toyama.jp
kurobe.toyama.jp
nakaniikawa.toyama.jp
namerikawa.toyama.jp
nanto.toyama.jp
nyuzen.toyama.jp
oyabe.toyama.jp
taira.toyama.jp
takaoka.toyama.jp
tateyama.toyama.jp
toga.toyama.jp
tonami.toyama.jp
toyama.toyama.jp
unazuki.toyama.jp
uozu.toyama.jp
yamada.toyama.jp
arida.wakayama.jp
aridagawa.wakayama.jp
gobo.wakayama.jp
hashimoto.wakayama.jp
hidaka.wakayama.jp
hirogawa.wakayama.jp
inami.wakayama.jp
iwade.wakayama.jp
kainan.wakayama.jp
kamitonda.wakayama.jp
katsuragi.wakayama.jp
kimino.wakayama.jp
kinokawa.wakayama.jp
kitayama.wakayama.jp
koya.wakayama.jp
koza.wakayama.jp
kozagawa.wakayama.jp
kudoyama.wakayama.jp
kushimoto.wakayama.jp
mihama.wakayama.jp
misato.wakayama.jp
nachikatsuura.wakayama.jp
shingu.wakayama.jp
shirahama.wakayama.jp
taiji.wakayama.jp
tanabe.wakayama.jp
wakayama.wakayama.jp
yuasa.wakayama.jp
yura.wakayama.jp
asahi.yamagata.jp
funagata.yamagata.jp
higashine.yamagata.jp
iide.yamagata.jp
kahoku.yamagata.jp
kaminoyama.yamagata.jp
kaneyama.yamagata.jp
kawanishi.yamagata.jp
mamurogawa.yamagata.jp
mikawa.yamagata.jp
murayama.yamagata.jp
nagai.yamagata.jp
nakayama.yamagata.jp
nanyo.yamagata.jp
nishikawa.yamagata.jp
obanazawa.yamagata.jp
oe.yamagata.jp
oguni.yamagata.jp
ohkura.yamagata.jp
oishida.yamagata.jp
sagae.yamagata.jp
sakata.yamagata.jp
sakegawa.yamagata.jp
shinjo.yamagata.jp
shirataka.yamagata.jp
shonai.yamagata.jp
takahata.yamagata.jp
tendo.yamagata.jp
tozawa.yamagata.jp
tsuruoka.yamagata.jp
yamagata.yamagata.jp
yamanobe.yamagata.jp
yonezawa.yamagata.jp
yuza.yamagata.jp
abu.yamaguchi.jp
hagi.yamaguchi.jp
hikari.yamaguchi.jp
hofu.yamaguchi.jp
iwakuni.yamaguchi.jp
kudamatsu.yamaguchi.jp
mitou.yamaguchi.jp
nagato.yamaguchi.jp
oshima.yamaguchi.jp
shimonoseki.yamaguchi.jp
shunan.yamaguchi.jp
tabuse.yamaguchi.jp
tokuyama.yamaguchi.jp
toyota.yamaguchi.jp
ube.yamaguchi.jp
yuu.yamaguchi.jp
chuo.yamanashi.jp
doshi.yamanashi.jp
fuefuki.yamanashi.jp
fujikawa.yamanashi.jp
fujikawaguchiko.yamanashi.jp
fujiyoshida.yamanashi.jp
hayakawa.yamanashi.jp
hokuto.yamanashi.jp
ichikawamisato.yamanashi.jp
kai.yamanashi.jp
kofu.yamanashi.jp
koshu.yamanashi.jp
kosuge.yamanashi.jp
minami-alps.yamanashi.jp
minobu.yamanashi.jp
nakamichi.yamanashi.jp
nanbu.yamanashi.jp
narusawa.yamanashi.jp
nirasaki.yamanashi.jp
nishikatsura.yamanashi.jp
oshino.yamanashi.jp
otsuki.yamanashi.jp
showa.yamanashi.jp
tabayama.yamanashi.jp
tsuru.yamanashi.jp
uenohara.yamanashi.jp
yamanakako.yamanashi.jp
yamanashi.yamanashi.jp

// ke : http://www.kenic.or.ke/index.php/en/ke-domains/ke-domains
ke
ac.ke
co.ke
go.ke
info.ke
me.ke
mobi.ke
ne.ke
or.ke
sc.ke

// kg : http://www.domain.kg/dmn_n.html
kg
org.kg
net.kg
com.kg
edu.kg
gov.kg
mil.kg

// kh : http://www.mptc.gov.kh/dns_registration.htm
*.kh

// ki : http://www.ki/dns/index.html
ki
edu.ki
biz.ki
net.ki
org.ki
gov.ki
info.ki
com.ki

// km : https://en.wikipedia.org/wiki/.km
// http://www.domaine.km/documents/charte.doc
km
org.km
nom.km
gov.km
prd.km
tm.km
edu.km
mil.km
ass.km
com.km
// These are only mentioned as proposed suggestions at domaine.km, but
// https://en.wikipedia.org/wiki/.km says they're available for registration:
coop.km
asso.km
presse.km
medecin.km
notaires.km
pharmaciens.km
veterinaire.km
gouv.km

// kn : https://en.wikipedia.org/wiki/.kn
// http://www.dot.kn/domainRules.html
kn
net.kn
org.kn
edu.kn
gov.kn

// kp : http://www.kcce.kp/en_index.php
kp
com.kp
edu.kp
gov.kp
org.kp
rep.kp
tra.kp

// kr : https://en.wikipedia.org/wiki/.kr
// see also: http://domain.nida.or.kr/eng/registration.jsp
kr
ac.kr
co.kr
es.kr
go.kr
hs.kr
kg.kr
mil.kr
ms.kr
ne.kr
or.kr
pe.kr
re.kr
sc.kr
// kr geographical names
busan.kr
chungbuk.kr
chungnam.kr
daegu.kr
daejeon.kr
gangwon.kr
gwangju.kr
gyeongbuk.kr
gyeonggi.kr
gyeongnam.kr
incheon.kr
jeju.kr
jeonbuk.kr
jeonnam.kr
seoul.kr
ulsan.kr

// kw : https://www.nic.kw/policies/
// Confirmed by registry <nic.tech@citra.gov.kw>
kw
com.kw
edu.kw
emb.kw
gov.kw
ind.kw
net.kw
org.kw

// ky : http://www.icta.ky/da_ky_reg_dom.php
// Confirmed by registry <kysupport@perimeterusa.com> 2008-06-17
ky
com.ky
edu.ky
net.ky
org.ky

// kz : https://en.wikipedia.org/wiki/.kz
// see also: http://www.nic.kz/rules/index.jsp
kz
org.kz
edu.kz
net.kz
gov.kz
mil.kz
com.kz

// la : https://en.wikipedia.org/wiki/.la
// Submitted by registry <gavin.brown@nic.la>
la
int.la
net.la
info.la
edu.la
gov.la
per.la
com.la
org.la

// lb : https://en.wikipedia.org/wiki/.lb
// Submitted by registry <randy@psg.com>
lb
com.lb
edu.lb
gov.lb
net.lb
org.lb

// lc : https://en.wikipedia.org/wiki/.lc
// see also: http://www.nic.lc/rules.htm
lc
com.lc
net.lc
co.lc
org.lc
edu.lc
gov.lc

// li : https://en.wikipedia.org/wiki/.li
li

// lk : https://www.nic.lk/index.php/domain-registration/lk-domain-naming-structure
lk
gov.lk
sch.lk
net.lk
int.lk
com.lk
org.lk
edu.lk
ngo.lk
soc.lk
web.lk
ltd.lk
assn.lk
grp.lk
hotel.lk
ac.lk

// lr : http://psg.com/dns/lr/lr.txt
// Submitted by registry <randy@psg.com>
lr
com.lr
edu.lr
gov.lr
org.lr
net.lr

// ls : http://www.nic.ls/
// Confirmed by registry <lsadmin@nic.ls>
ls
ac.ls
biz.ls
co.ls
edu.ls
gov.ls
info.ls
net.ls
org.ls
sc.ls

// lt : https://en.wikipedia.org/wiki/.lt
lt
// gov.lt : http://www.gov.lt/index_en.php
gov.lt

// lu : http://www.dns.lu/en/
lu

// lv : http://www.nic.lv/DNS/En/generic.php
lv
com.lv
edu.lv
gov.lv
org.lv
mil.lv
id.lv
net.lv
asn.lv
conf.lv

// ly : http://www.nic.ly/regulations.php
ly
com.ly
net.ly
gov.ly
plc.ly
edu.ly
sch.ly
med.ly
org.ly
id.ly

// ma : https://en.wikipedia.org/wiki/.ma
// http://www.anrt.ma/fr/admin/download/upload/file_fr782.pdf
ma
co.ma
net.ma
gov.ma
org.ma
ac.ma
press.ma

// mc : http://www.nic.mc/
mc
tm.mc
asso.mc

// md : https://en.wikipedia.org/wiki/.md
md

// me : https://en.wikipedia.org/wiki/.me
me
co.me
net.me
org.me
edu.me
ac.me
gov.me
its.me
priv.me

// mg : http://nic.mg/nicmg/?page_id=39
mg
org.mg
nom.mg
gov.mg
prd.mg
tm.mg
edu.mg
mil.mg
com.mg
co.mg

// mh : https://en.wikipedia.org/wiki/.mh
mh

// mil : https://en.wikipedia.org/wiki/.mil
mil

// mk : https://en.wikipedia.org/wiki/.mk
// see also: http://dns.marnet.net.mk/postapka.php
mk
com.mk
org.mk
net.mk
edu.mk
gov.mk
inf.mk
name.mk

// ml : http://www.gobin.info/domainname/ml-template.doc
// see also: https://en.wikipedia.org/wiki/.ml
ml
com.ml
edu.ml
gouv.ml
gov.ml
net.ml
org.ml
presse.ml

// mm : https://en.wikipedia.org/wiki/.mm
*.mm

// mn : https://en.wikipedia.org/wiki/.mn
mn
gov.mn
edu.mn
org.mn

// mo : http://www.monic.net.mo/
mo
com.mo
net.mo
org.mo
edu.mo
gov.mo

// mobi : https://en.wikipedia.org/wiki/.mobi
mobi

// mp : http://www.dot.mp/
// Confirmed by registry <dcamacho@saipan.com> 2008-06-17
mp

// mq : https://en.wikipedia.org/wiki/.mq
mq

// mr : https://en.wikipedia.org/wiki/.mr
mr
gov.mr

// ms : http://www.nic.ms/pdf/MS_Domain_Name_Rules.pdf
ms
com.ms
edu.ms
gov.ms
net.ms
org.ms

// mt : https://www.nic.org.mt/go/policy
// Submitted by registry <help@nic.org.mt>
mt
com.mt
edu.mt
net.mt
org.mt

// mu : https://en.wikipedia.org/wiki/.mu
mu
com.mu
net.mu
org.mu
gov.mu
ac.mu
co.mu
or.mu

// museum : https://welcome.museum/wp-content/uploads/2018/05/20180525-Registration-Policy-MUSEUM-EN_VF-2.pdf https://welcome.museum/buy-your-dot-museum-2/
museum

// mv : https://en.wikipedia.org/wiki/.mv
// "mv" included because, contra Wikipedia, google.mv exists.
mv
aero.mv
biz.mv
com.mv
coop.mv
edu.mv
gov.mv
info.mv
int.mv
mil.mv
museum.mv
name.mv
net.mv
org.mv
pro.mv

// mw : http://www.registrar.mw/
mw
ac.mw
biz.mw
co.mw
com.mw
coop.mw
edu.mw
gov.mw
int.mw
museum.mw
net.mw
org.mw

// mx : http://www.nic.mx/
// Submitted by registry <farias@nic.mx>
mx
com.mx
org.mx
gob.mx
edu.mx
net.mx

// my : http://www.mynic.my/
// Available strings: https://mynic.my/resources/domains/buying-a-domain/
my
biz.my
com.my
edu.my
gov.my
mil.my
name.my
net.my
org.my

// mz : http://www.uem.mz/
// Submitted by registry <antonio@uem.mz>
mz
ac.mz
adv.mz
co.mz
edu.mz
gov.mz
mil.mz
net.mz
org.mz

// na : http://www.na-nic.com.na/
// http://www.info.na/domain/
na
info.na
pro.na
name.na
school.na
or.na
dr.na
us.na
mx.na
ca.na
in.na
cc.na
tv.na
ws.na
mobi.na
co.na
com.na
org.na

// name : has 2nd-level tlds, but there's no list of them
name

// nc : http://www.cctld.nc/
nc
asso.nc
nom.nc

// ne : https://en.wikipedia.org/wiki/.ne
ne

// net : https://en.wikipedia.org/wiki/.net
net

// nf : https://en.wikipedia.org/wiki/.nf
nf
com.nf
net.nf
per.nf
rec.nf
web.nf
arts.nf
firm.nf
info.nf
other.nf
store.nf

// ng : http://www.nira.org.ng/index.php/join-us/register-ng-domain/189-nira-slds
ng
com.ng
edu.ng
gov.ng
i.ng
mil.ng
mobi.ng
name.ng
net.ng
org.ng
sch.ng

// ni : http://www.nic.ni/
ni
ac.ni
biz.ni
co.ni
com.ni
edu.ni
gob.ni
in.ni
info.ni
int.ni
mil.ni
net.ni
nom.ni
org.ni
web.ni

// nl : https://en.wikipedia.org/wiki/.nl
//      https://www.sidn.nl/
//      ccTLD for the Netherlands
nl

// no : https://www.norid.no/en/om-domenenavn/regelverk-for-no/
// Norid geographical second level domains : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-b/
// Norid category second level domains : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-c/
// Norid category second-level domains managed by parties other than Norid : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-d/
// RSS feed: https://teknisk.norid.no/en/feed/
no
// Norid category second level domains : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-c/
fhs.no
vgs.no
fylkesbibl.no
folkebibl.no
museum.no
idrett.no
priv.no
// Norid category second-level domains managed by parties other than Norid : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-d/
mil.no
stat.no
dep.no
kommune.no
herad.no
// Norid geographical second level domains : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-b/
// counties
aa.no
ah.no
bu.no
fm.no
hl.no
hm.no
jan-mayen.no
mr.no
nl.no
nt.no
of.no
ol.no
oslo.no
rl.no
sf.no
st.no
svalbard.no
tm.no
tr.no
va.no
vf.no
// primary and lower secondary schools per county
gs.aa.no
gs.ah.no
gs.bu.no
gs.fm.no
gs.hl.no
gs.hm.no
gs.jan-mayen.no
gs.mr.no
gs.nl.no
gs.nt.no
gs.of.no
gs.ol.no
gs.oslo.no
gs.rl.no
gs.sf.no
gs.st.no
gs.svalbard.no
gs.tm.no
gs.tr.no
gs.va.no
gs.vf.no
// cities
akrehamn.no
\xE5krehamn.no
algard.no
\xE5lg\xE5rd.no
arna.no
brumunddal.no
bryne.no
bronnoysund.no
br\xF8nn\xF8ysund.no
drobak.no
dr\xF8bak.no
egersund.no
fetsund.no
floro.no
flor\xF8.no
fredrikstad.no
hokksund.no
honefoss.no
h\xF8nefoss.no
jessheim.no
jorpeland.no
j\xF8rpeland.no
kirkenes.no
kopervik.no
krokstadelva.no
langevag.no
langev\xE5g.no
leirvik.no
mjondalen.no
mj\xF8ndalen.no
mo-i-rana.no
mosjoen.no
mosj\xF8en.no
nesoddtangen.no
orkanger.no
osoyro.no
os\xF8yro.no
raholt.no
r\xE5holt.no
sandnessjoen.no
sandnessj\xF8en.no
skedsmokorset.no
slattum.no
spjelkavik.no
stathelle.no
stavern.no
stjordalshalsen.no
stj\xF8rdalshalsen.no
tananger.no
tranby.no
vossevangen.no
// communities
afjord.no
\xE5fjord.no
agdenes.no
al.no
\xE5l.no
alesund.no
\xE5lesund.no
alstahaug.no
alta.no
\xE1lt\xE1.no
alaheadju.no
\xE1laheadju.no
alvdal.no
amli.no
\xE5mli.no
amot.no
\xE5mot.no
andebu.no
andoy.no
and\xF8y.no
andasuolo.no
ardal.no
\xE5rdal.no
aremark.no
arendal.no
\xE5s.no
aseral.no
\xE5seral.no
asker.no
askim.no
askvoll.no
askoy.no
ask\xF8y.no
asnes.no
\xE5snes.no
audnedaln.no
aukra.no
aure.no
aurland.no
aurskog-holand.no
aurskog-h\xF8land.no
austevoll.no
austrheim.no
averoy.no
aver\xF8y.no
balestrand.no
ballangen.no
balat.no
b\xE1l\xE1t.no
balsfjord.no
bahccavuotna.no
b\xE1hccavuotna.no
bamble.no
bardu.no
beardu.no
beiarn.no
bajddar.no
b\xE1jddar.no
baidar.no
b\xE1id\xE1r.no
berg.no
bergen.no
berlevag.no
berlev\xE5g.no
bearalvahki.no
bearalv\xE1hki.no
bindal.no
birkenes.no
bjarkoy.no
bjark\xF8y.no
bjerkreim.no
bjugn.no
bodo.no
bod\xF8.no
badaddja.no
b\xE5d\xE5ddj\xE5.no
budejju.no
bokn.no
bremanger.no
bronnoy.no
br\xF8nn\xF8y.no
bygland.no
bykle.no
barum.no
b\xE6rum.no
bo.telemark.no
b\xF8.telemark.no
bo.nordland.no
b\xF8.nordland.no
bievat.no
biev\xE1t.no
bomlo.no
b\xF8mlo.no
batsfjord.no
b\xE5tsfjord.no
bahcavuotna.no
b\xE1hcavuotna.no
dovre.no
drammen.no
drangedal.no
dyroy.no
dyr\xF8y.no
donna.no
d\xF8nna.no
eid.no
eidfjord.no
eidsberg.no
eidskog.no
eidsvoll.no
eigersund.no
elverum.no
enebakk.no
engerdal.no
etne.no
etnedal.no
evenes.no
evenassi.no
even\xE1\u0161\u0161i.no
evje-og-hornnes.no
farsund.no
fauske.no
fuossko.no
fuoisku.no
fedje.no
fet.no
finnoy.no
finn\xF8y.no
fitjar.no
fjaler.no
fjell.no
flakstad.no
flatanger.no
flekkefjord.no
flesberg.no
flora.no
fla.no
fl\xE5.no
folldal.no
forsand.no
fosnes.no
frei.no
frogn.no
froland.no
frosta.no
frana.no
fr\xE6na.no
froya.no
fr\xF8ya.no
fusa.no
fyresdal.no
forde.no
f\xF8rde.no
gamvik.no
gangaviika.no
g\xE1\u014Bgaviika.no
gaular.no
gausdal.no
gildeskal.no
gildesk\xE5l.no
giske.no
gjemnes.no
gjerdrum.no
gjerstad.no
gjesdal.no
gjovik.no
gj\xF8vik.no
gloppen.no
gol.no
gran.no
grane.no
granvin.no
gratangen.no
grimstad.no
grong.no
kraanghke.no
kr\xE5anghke.no
grue.no
gulen.no
hadsel.no
halden.no
halsa.no
hamar.no
hamaroy.no
habmer.no
h\xE1bmer.no
hapmir.no
h\xE1pmir.no
hammerfest.no
hammarfeasta.no
h\xE1mm\xE1rfeasta.no
haram.no
hareid.no
harstad.no
hasvik.no
aknoluokta.no
\xE1k\u014Boluokta.no
hattfjelldal.no
aarborte.no
haugesund.no
hemne.no
hemnes.no
hemsedal.no
heroy.more-og-romsdal.no
her\xF8y.m\xF8re-og-romsdal.no
heroy.nordland.no
her\xF8y.nordland.no
hitra.no
hjartdal.no
hjelmeland.no
hobol.no
hob\xF8l.no
hof.no
hol.no
hole.no
holmestrand.no
holtalen.no
holt\xE5len.no
hornindal.no
horten.no
hurdal.no
hurum.no
hvaler.no
hyllestad.no
hagebostad.no
h\xE6gebostad.no
hoyanger.no
h\xF8yanger.no
hoylandet.no
h\xF8ylandet.no
ha.no
h\xE5.no
ibestad.no
inderoy.no
inder\xF8y.no
iveland.no
jevnaker.no
jondal.no
jolster.no
j\xF8lster.no
karasjok.no
karasjohka.no
k\xE1r\xE1\u0161johka.no
karlsoy.no
galsa.no
g\xE1ls\xE1.no
karmoy.no
karm\xF8y.no
kautokeino.no
guovdageaidnu.no
klepp.no
klabu.no
kl\xE6bu.no
kongsberg.no
kongsvinger.no
kragero.no
krager\xF8.no
kristiansand.no
kristiansund.no
krodsherad.no
kr\xF8dsherad.no
kvalsund.no
rahkkeravju.no
r\xE1hkker\xE1vju.no
kvam.no
kvinesdal.no
kvinnherad.no
kviteseid.no
kvitsoy.no
kvits\xF8y.no
kvafjord.no
kv\xE6fjord.no
giehtavuoatna.no
kvanangen.no
kv\xE6nangen.no
navuotna.no
n\xE1vuotna.no
kafjord.no
k\xE5fjord.no
gaivuotna.no
g\xE1ivuotna.no
larvik.no
lavangen.no
lavagis.no
loabat.no
loab\xE1t.no
lebesby.no
davvesiida.no
leikanger.no
leirfjord.no
leka.no
leksvik.no
lenvik.no
leangaviika.no
lea\u014Bgaviika.no
lesja.no
levanger.no
lier.no
lierne.no
lillehammer.no
lillesand.no
lindesnes.no
lindas.no
lind\xE5s.no
lom.no
loppa.no
lahppi.no
l\xE1hppi.no
lund.no
lunner.no
luroy.no
lur\xF8y.no
luster.no
lyngdal.no
lyngen.no
ivgu.no
lardal.no
lerdal.no
l\xE6rdal.no
lodingen.no
l\xF8dingen.no
lorenskog.no
l\xF8renskog.no
loten.no
l\xF8ten.no
malvik.no
masoy.no
m\xE5s\xF8y.no
muosat.no
muos\xE1t.no
mandal.no
marker.no
marnardal.no
masfjorden.no
meland.no
meldal.no
melhus.no
meloy.no
mel\xF8y.no
meraker.no
mer\xE5ker.no
moareke.no
mo\xE5reke.no
midsund.no
midtre-gauldal.no
modalen.no
modum.no
molde.no
moskenes.no
moss.no
mosvik.no
malselv.no
m\xE5lselv.no
malatvuopmi.no
m\xE1latvuopmi.no
namdalseid.no
aejrie.no
namsos.no
namsskogan.no
naamesjevuemie.no
n\xE5\xE5mesjevuemie.no
laakesvuemie.no
nannestad.no
narvik.no
narviika.no
naustdal.no
nedre-eiker.no
nes.akershus.no
nes.buskerud.no
nesna.no
nesodden.no
nesseby.no
unjarga.no
unj\xE1rga.no
nesset.no
nissedal.no
nittedal.no
nord-aurdal.no
nord-fron.no
nord-odal.no
norddal.no
nordkapp.no
davvenjarga.no
davvenj\xE1rga.no
nordre-land.no
nordreisa.no
raisa.no
r\xE1isa.no
nore-og-uvdal.no
notodden.no
naroy.no
n\xE6r\xF8y.no
notteroy.no
n\xF8tter\xF8y.no
odda.no
oksnes.no
\xF8ksnes.no
oppdal.no
oppegard.no
oppeg\xE5rd.no
orkdal.no
orland.no
\xF8rland.no
orskog.no
\xF8rskog.no
orsta.no
\xF8rsta.no
os.hedmark.no
os.hordaland.no
osen.no
osteroy.no
oster\xF8y.no
ostre-toten.no
\xF8stre-toten.no
overhalla.no
ovre-eiker.no
\xF8vre-eiker.no
oyer.no
\xF8yer.no
oygarden.no
\xF8ygarden.no
oystre-slidre.no
\xF8ystre-slidre.no
porsanger.no
porsangu.no
pors\xE1\u014Bgu.no
porsgrunn.no
radoy.no
rad\xF8y.no
rakkestad.no
rana.no
ruovat.no
randaberg.no
rauma.no
rendalen.no
rennebu.no
rennesoy.no
rennes\xF8y.no
rindal.no
ringebu.no
ringerike.no
ringsaker.no
rissa.no
risor.no
ris\xF8r.no
roan.no
rollag.no
rygge.no
ralingen.no
r\xE6lingen.no
rodoy.no
r\xF8d\xF8y.no
romskog.no
r\xF8mskog.no
roros.no
r\xF8ros.no
rost.no
r\xF8st.no
royken.no
r\xF8yken.no
royrvik.no
r\xF8yrvik.no
rade.no
r\xE5de.no
salangen.no
siellak.no
saltdal.no
salat.no
s\xE1l\xE1t.no
s\xE1lat.no
samnanger.no
sande.more-og-romsdal.no
sande.m\xF8re-og-romsdal.no
sande.vestfold.no
sandefjord.no
sandnes.no
sandoy.no
sand\xF8y.no
sarpsborg.no
sauda.no
sauherad.no
sel.no
selbu.no
selje.no
seljord.no
sigdal.no
siljan.no
sirdal.no
skaun.no
skedsmo.no
ski.no
skien.no
skiptvet.no
skjervoy.no
skjerv\xF8y.no
skierva.no
skierv\xE1.no
skjak.no
skj\xE5k.no
skodje.no
skanland.no
sk\xE5nland.no
skanit.no
sk\xE1nit.no
smola.no
sm\xF8la.no
snillfjord.no
snasa.no
sn\xE5sa.no
snoasa.no
snaase.no
sn\xE5ase.no
sogndal.no
sokndal.no
sola.no
solund.no
songdalen.no
sortland.no
spydeberg.no
stange.no
stavanger.no
steigen.no
steinkjer.no
stjordal.no
stj\xF8rdal.no
stokke.no
stor-elvdal.no
stord.no
stordal.no
storfjord.no
omasvuotna.no
strand.no
stranda.no
stryn.no
sula.no
suldal.no
sund.no
sunndal.no
surnadal.no
sveio.no
svelvik.no
sykkylven.no
sogne.no
s\xF8gne.no
somna.no
s\xF8mna.no
sondre-land.no
s\xF8ndre-land.no
sor-aurdal.no
s\xF8r-aurdal.no
sor-fron.no
s\xF8r-fron.no
sor-odal.no
s\xF8r-odal.no
sor-varanger.no
s\xF8r-varanger.no
matta-varjjat.no
m\xE1tta-v\xE1rjjat.no
sorfold.no
s\xF8rfold.no
sorreisa.no
s\xF8rreisa.no
sorum.no
s\xF8rum.no
tana.no
deatnu.no
time.no
tingvoll.no
tinn.no
tjeldsund.no
dielddanuorri.no
tjome.no
tj\xF8me.no
tokke.no
tolga.no
torsken.no
tranoy.no
tran\xF8y.no
tromso.no
troms\xF8.no
tromsa.no
romsa.no
trondheim.no
troandin.no
trysil.no
trana.no
tr\xE6na.no
trogstad.no
tr\xF8gstad.no
tvedestrand.no
tydal.no
tynset.no
tysfjord.no
divtasvuodna.no
divttasvuotna.no
tysnes.no
tysvar.no
tysv\xE6r.no
tonsberg.no
t\xF8nsberg.no
ullensaker.no
ullensvang.no
ulvik.no
utsira.no
vadso.no
vads\xF8.no
cahcesuolo.no
\u010D\xE1hcesuolo.no
vaksdal.no
valle.no
vang.no
vanylven.no
vardo.no
vard\xF8.no
varggat.no
v\xE1rgg\xE1t.no
vefsn.no
vaapste.no
vega.no
vegarshei.no
veg\xE5rshei.no
vennesla.no
verdal.no
verran.no
vestby.no
vestnes.no
vestre-slidre.no
vestre-toten.no
vestvagoy.no
vestv\xE5g\xF8y.no
vevelstad.no
vik.no
vikna.no
vindafjord.no
volda.no
voss.no
varoy.no
v\xE6r\xF8y.no
vagan.no
v\xE5gan.no
voagat.no
vagsoy.no
v\xE5gs\xF8y.no
vaga.no
v\xE5g\xE5.no
valer.ostfold.no
v\xE5ler.\xF8stfold.no
valer.hedmark.no
v\xE5ler.hedmark.no

// np : http://www.mos.com.np/register.html
*.np

// nr : http://cenpac.net.nr/dns/index.html
// Submitted by registry <technician@cenpac.net.nr>
nr
biz.nr
info.nr
gov.nr
edu.nr
org.nr
net.nr
com.nr

// nu : https://en.wikipedia.org/wiki/.nu
nu

// nz : https://en.wikipedia.org/wiki/.nz
// Submitted by registry <jay@nzrs.net.nz>
nz
ac.nz
co.nz
cri.nz
geek.nz
gen.nz
govt.nz
health.nz
iwi.nz
kiwi.nz
maori.nz
mil.nz
m\u0101ori.nz
net.nz
org.nz
parliament.nz
school.nz

// om : https://en.wikipedia.org/wiki/.om
om
co.om
com.om
edu.om
gov.om
med.om
museum.om
net.om
org.om
pro.om

// onion : https://tools.ietf.org/html/rfc7686
onion

// org : https://en.wikipedia.org/wiki/.org
org

// pa : http://www.nic.pa/
// Some additional second level "domains" resolve directly as hostnames, such as
// pannet.pa, so we add a rule for "pa".
pa
ac.pa
gob.pa
com.pa
org.pa
sld.pa
edu.pa
net.pa
ing.pa
abo.pa
med.pa
nom.pa

// pe : https://www.nic.pe/InformeFinalComision.pdf
pe
edu.pe
gob.pe
nom.pe
mil.pe
org.pe
com.pe
net.pe

// pf : http://www.gobin.info/domainname/formulaire-pf.pdf
pf
com.pf
org.pf
edu.pf

// pg : https://en.wikipedia.org/wiki/.pg
*.pg

// ph : http://www.domains.ph/FAQ2.asp
// Submitted by registry <jed@email.com.ph>
ph
com.ph
net.ph
org.ph
gov.ph
edu.ph
ngo.ph
mil.ph
i.ph

// pk : http://pk5.pknic.net.pk/pk5/msgNamepk.PK
pk
com.pk
net.pk
edu.pk
org.pk
fam.pk
biz.pk
web.pk
gov.pk
gob.pk
gok.pk
gon.pk
gop.pk
gos.pk
info.pk

// pl http://www.dns.pl/english/index.html
// Submitted by registry
pl
com.pl
net.pl
org.pl
// pl functional domains (http://www.dns.pl/english/index.html)
aid.pl
agro.pl
atm.pl
auto.pl
biz.pl
edu.pl
gmina.pl
gsm.pl
info.pl
mail.pl
miasta.pl
media.pl
mil.pl
nieruchomosci.pl
nom.pl
pc.pl
powiat.pl
priv.pl
realestate.pl
rel.pl
sex.pl
shop.pl
sklep.pl
sos.pl
szkola.pl
targi.pl
tm.pl
tourism.pl
travel.pl
turystyka.pl
// Government domains
gov.pl
ap.gov.pl
griw.gov.pl
ic.gov.pl
is.gov.pl
kmpsp.gov.pl
konsulat.gov.pl
kppsp.gov.pl
kwp.gov.pl
kwpsp.gov.pl
mup.gov.pl
mw.gov.pl
oia.gov.pl
oirm.gov.pl
oke.gov.pl
oow.gov.pl
oschr.gov.pl
oum.gov.pl
pa.gov.pl
pinb.gov.pl
piw.gov.pl
po.gov.pl
pr.gov.pl
psp.gov.pl
psse.gov.pl
pup.gov.pl
rzgw.gov.pl
sa.gov.pl
sdn.gov.pl
sko.gov.pl
so.gov.pl
sr.gov.pl
starostwo.gov.pl
ug.gov.pl
ugim.gov.pl
um.gov.pl
umig.gov.pl
upow.gov.pl
uppo.gov.pl
us.gov.pl
uw.gov.pl
uzs.gov.pl
wif.gov.pl
wiih.gov.pl
winb.gov.pl
wios.gov.pl
witd.gov.pl
wiw.gov.pl
wkz.gov.pl
wsa.gov.pl
wskr.gov.pl
wsse.gov.pl
wuoz.gov.pl
wzmiuw.gov.pl
zp.gov.pl
zpisdn.gov.pl
// pl regional domains (http://www.dns.pl/english/index.html)
augustow.pl
babia-gora.pl
bedzin.pl
beskidy.pl
bialowieza.pl
bialystok.pl
bielawa.pl
bieszczady.pl
boleslawiec.pl
bydgoszcz.pl
bytom.pl
cieszyn.pl
czeladz.pl
czest.pl
dlugoleka.pl
elblag.pl
elk.pl
glogow.pl
gniezno.pl
gorlice.pl
grajewo.pl
ilawa.pl
jaworzno.pl
jelenia-gora.pl
jgora.pl
kalisz.pl
kazimierz-dolny.pl
karpacz.pl
kartuzy.pl
kaszuby.pl
katowice.pl
kepno.pl
ketrzyn.pl
klodzko.pl
kobierzyce.pl
kolobrzeg.pl
konin.pl
konskowola.pl
kutno.pl
lapy.pl
lebork.pl
legnica.pl
lezajsk.pl
limanowa.pl
lomza.pl
lowicz.pl
lubin.pl
lukow.pl
malbork.pl
malopolska.pl
mazowsze.pl
mazury.pl
mielec.pl
mielno.pl
mragowo.pl
naklo.pl
nowaruda.pl
nysa.pl
olawa.pl
olecko.pl
olkusz.pl
olsztyn.pl
opoczno.pl
opole.pl
ostroda.pl
ostroleka.pl
ostrowiec.pl
ostrowwlkp.pl
pila.pl
pisz.pl
podhale.pl
podlasie.pl
polkowice.pl
pomorze.pl
pomorskie.pl
prochowice.pl
pruszkow.pl
przeworsk.pl
pulawy.pl
radom.pl
rawa-maz.pl
rybnik.pl
rzeszow.pl
sanok.pl
sejny.pl
slask.pl
slupsk.pl
sosnowiec.pl
stalowa-wola.pl
skoczow.pl
starachowice.pl
stargard.pl
suwalki.pl
swidnica.pl
swiebodzin.pl
swinoujscie.pl
szczecin.pl
szczytno.pl
tarnobrzeg.pl
tgory.pl
turek.pl
tychy.pl
ustka.pl
walbrzych.pl
warmia.pl
warszawa.pl
waw.pl
wegrow.pl
wielun.pl
wlocl.pl
wloclawek.pl
wodzislaw.pl
wolomin.pl
wroclaw.pl
zachpomor.pl
zagan.pl
zarow.pl
zgora.pl
zgorzelec.pl

// pm : https://www.afnic.fr/wp-media/uploads/2022/12/afnic-naming-policy-2023-01-01.pdf
pm

// pn : http://www.government.pn/PnRegistry/policies.htm
pn
gov.pn
co.pn
org.pn
edu.pn
net.pn

// post : https://en.wikipedia.org/wiki/.post
post

// pr : http://www.nic.pr/index.asp?f=1
pr
com.pr
net.pr
org.pr
gov.pr
edu.pr
isla.pr
pro.pr
biz.pr
info.pr
name.pr
// these aren't mentioned on nic.pr, but on https://en.wikipedia.org/wiki/.pr
est.pr
prof.pr
ac.pr

// pro : http://registry.pro/get-pro
pro
aaa.pro
aca.pro
acct.pro
avocat.pro
bar.pro
cpa.pro
eng.pro
jur.pro
law.pro
med.pro
recht.pro

// ps : https://en.wikipedia.org/wiki/.ps
// http://www.nic.ps/registration/policy.html#reg
ps
edu.ps
gov.ps
sec.ps
plo.ps
com.ps
org.ps
net.ps

// pt : https://www.dns.pt/en/domain/pt-terms-and-conditions-registration-rules/
pt
net.pt
gov.pt
org.pt
edu.pt
int.pt
publ.pt
com.pt
nome.pt

// pw : https://en.wikipedia.org/wiki/.pw
pw
co.pw
ne.pw
or.pw
ed.pw
go.pw
belau.pw

// py : http://www.nic.py/pautas.html#seccion_9
// Submitted by registry
py
com.py
coop.py
edu.py
gov.py
mil.py
net.py
org.py

// qa : http://domains.qa/en/
qa
com.qa
edu.qa
gov.qa
mil.qa
name.qa
net.qa
org.qa
sch.qa

// re : https://www.afnic.fr/wp-media/uploads/2022/12/afnic-naming-policy-2023-01-01.pdf
re
asso.re
com.re
nom.re

// ro : http://www.rotld.ro/
ro
arts.ro
com.ro
firm.ro
info.ro
nom.ro
nt.ro
org.ro
rec.ro
store.ro
tm.ro
www.ro

// rs : https://www.rnids.rs/en/domains/national-domains
rs
ac.rs
co.rs
edu.rs
gov.rs
in.rs
org.rs

// ru : https://cctld.ru/files/pdf/docs/en/rules_ru-rf.pdf
// Submitted by George Georgievsky <gug@cctld.ru>
ru

// rw : https://www.ricta.org.rw/sites/default/files/resources/registry_registrar_contract_0.pdf
rw
ac.rw
co.rw
coop.rw
gov.rw
mil.rw
net.rw
org.rw

// sa : http://www.nic.net.sa/
sa
com.sa
net.sa
org.sa
gov.sa
med.sa
pub.sa
edu.sa
sch.sa

// sb : http://www.sbnic.net.sb/
// Submitted by registry <lee.humphries@telekom.com.sb>
sb
com.sb
edu.sb
gov.sb
net.sb
org.sb

// sc : http://www.nic.sc/
sc
com.sc
gov.sc
net.sc
org.sc
edu.sc

// sd : http://www.isoc.sd/sudanic.isoc.sd/billing_pricing.htm
// Submitted by registry <admin@isoc.sd>
sd
com.sd
net.sd
org.sd
edu.sd
med.sd
tv.sd
gov.sd
info.sd

// se : https://en.wikipedia.org/wiki/.se
// Submitted by registry <patrik.wallstrom@iis.se>
se
a.se
ac.se
b.se
bd.se
brand.se
c.se
d.se
e.se
f.se
fh.se
fhsk.se
fhv.se
g.se
h.se
i.se
k.se
komforb.se
kommunalforbund.se
komvux.se
l.se
lanbib.se
m.se
n.se
naturbruksgymn.se
o.se
org.se
p.se
parti.se
pp.se
press.se
r.se
s.se
t.se
tm.se
u.se
w.se
x.se
y.se
z.se

// sg : http://www.nic.net.sg/page/registration-policies-procedures-and-guidelines
sg
com.sg
net.sg
org.sg
gov.sg
edu.sg
per.sg

// sh : http://nic.sh/rules.htm
sh
com.sh
net.sh
gov.sh
org.sh
mil.sh

// si : https://en.wikipedia.org/wiki/.si
si

// sj : No registrations at this time.
// Submitted by registry <jarle@uninett.no>
sj

// sk : https://en.wikipedia.org/wiki/.sk
// list of 2nd level domains ?
sk

// sl : http://www.nic.sl
// Submitted by registry <adam@neoip.com>
sl
com.sl
net.sl
edu.sl
gov.sl
org.sl

// sm : https://en.wikipedia.org/wiki/.sm
sm

// sn : https://en.wikipedia.org/wiki/.sn
sn
art.sn
com.sn
edu.sn
gouv.sn
org.sn
perso.sn
univ.sn

// so : http://sonic.so/policies/
so
com.so
edu.so
gov.so
me.so
net.so
org.so

// sr : https://en.wikipedia.org/wiki/.sr
sr

// ss : https://registry.nic.ss/
// Submitted by registry <technical@nic.ss>
ss
biz.ss
com.ss
edu.ss
gov.ss
me.ss
net.ss
org.ss
sch.ss

// st : http://www.nic.st/html/policyrules/
st
co.st
com.st
consulado.st
edu.st
embaixada.st
mil.st
net.st
org.st
principe.st
saotome.st
store.st

// su : https://en.wikipedia.org/wiki/.su
su

// sv : http://www.svnet.org.sv/niveldos.pdf
sv
com.sv
edu.sv
gob.sv
org.sv
red.sv

// sx : https://en.wikipedia.org/wiki/.sx
// Submitted by registry <jcvignes@openregistry.com>
sx
gov.sx

// sy : https://en.wikipedia.org/wiki/.sy
// see also: http://www.gobin.info/domainname/sy.doc
sy
edu.sy
gov.sy
net.sy
mil.sy
com.sy
org.sy

// sz : https://en.wikipedia.org/wiki/.sz
// http://www.sispa.org.sz/
sz
co.sz
ac.sz
org.sz

// tc : https://en.wikipedia.org/wiki/.tc
tc

// td : https://en.wikipedia.org/wiki/.td
td

// tel: https://en.wikipedia.org/wiki/.tel
// http://www.telnic.org/
tel

// tf : https://www.afnic.fr/wp-media/uploads/2022/12/afnic-naming-policy-2023-01-01.pdf
tf

// tg : https://en.wikipedia.org/wiki/.tg
// http://www.nic.tg/
tg

// th : https://en.wikipedia.org/wiki/.th
// Submitted by registry <krit@thains.co.th>
th
ac.th
co.th
go.th
in.th
mi.th
net.th
or.th

// tj : http://www.nic.tj/policy.html
tj
ac.tj
biz.tj
co.tj
com.tj
edu.tj
go.tj
gov.tj
int.tj
mil.tj
name.tj
net.tj
nic.tj
org.tj
test.tj
web.tj

// tk : https://en.wikipedia.org/wiki/.tk
tk

// tl : https://en.wikipedia.org/wiki/.tl
tl
gov.tl

// tm : http://www.nic.tm/local.html
tm
com.tm
co.tm
org.tm
net.tm
nom.tm
gov.tm
mil.tm
edu.tm

// tn : http://www.registre.tn/fr/
// https://whois.ati.tn/
tn
com.tn
ens.tn
fin.tn
gov.tn
ind.tn
info.tn
intl.tn
mincom.tn
nat.tn
net.tn
org.tn
perso.tn
tourism.tn

// to : https://en.wikipedia.org/wiki/.to
// Submitted by registry <egullich@colo.to>
to
com.to
gov.to
net.to
org.to
edu.to
mil.to

// tr : https://nic.tr/
// https://nic.tr/forms/eng/policies.pdf
// https://nic.tr/index.php?USRACTN=PRICELST
tr
av.tr
bbs.tr
bel.tr
biz.tr
com.tr
dr.tr
edu.tr
gen.tr
gov.tr
info.tr
mil.tr
k12.tr
kep.tr
name.tr
net.tr
org.tr
pol.tr
tel.tr
tsk.tr
tv.tr
web.tr
// Used by Northern Cyprus
nc.tr
// Used by government agencies of Northern Cyprus
gov.nc.tr

// tt : http://www.nic.tt/
tt
co.tt
com.tt
org.tt
net.tt
biz.tt
info.tt
pro.tt
int.tt
coop.tt
jobs.tt
mobi.tt
travel.tt
museum.tt
aero.tt
name.tt
gov.tt
edu.tt

// tv : https://en.wikipedia.org/wiki/.tv
// Not listing any 2LDs as reserved since none seem to exist in practice,
// Wikipedia notwithstanding.
tv

// tw : https://en.wikipedia.org/wiki/.tw
tw
edu.tw
gov.tw
mil.tw
com.tw
net.tw
org.tw
idv.tw
game.tw
ebiz.tw
club.tw
\u7DB2\u8DEF.tw
\u7D44\u7E54.tw
\u5546\u696D.tw

// tz : http://www.tznic.or.tz/index.php/domains
// Submitted by registry <manager@tznic.or.tz>
tz
ac.tz
co.tz
go.tz
hotel.tz
info.tz
me.tz
mil.tz
mobi.tz
ne.tz
or.tz
sc.tz
tv.tz

// ua : https://hostmaster.ua/policy/?ua
// Submitted by registry <dk@cctld.ua>
ua
// ua 2LD
com.ua
edu.ua
gov.ua
in.ua
net.ua
org.ua
// ua geographic names
// https://hostmaster.ua/2ld/
cherkassy.ua
cherkasy.ua
chernigov.ua
chernihiv.ua
chernivtsi.ua
chernovtsy.ua
ck.ua
cn.ua
cr.ua
crimea.ua
cv.ua
dn.ua
dnepropetrovsk.ua
dnipropetrovsk.ua
donetsk.ua
dp.ua
if.ua
ivano-frankivsk.ua
kh.ua
kharkiv.ua
kharkov.ua
kherson.ua
khmelnitskiy.ua
khmelnytskyi.ua
kiev.ua
kirovograd.ua
km.ua
kr.ua
kropyvnytskyi.ua
krym.ua
ks.ua
kv.ua
kyiv.ua
lg.ua
lt.ua
lugansk.ua
luhansk.ua
lutsk.ua
lv.ua
lviv.ua
mk.ua
mykolaiv.ua
nikolaev.ua
od.ua
odesa.ua
odessa.ua
pl.ua
poltava.ua
rivne.ua
rovno.ua
rv.ua
sb.ua
sebastopol.ua
sevastopol.ua
sm.ua
sumy.ua
te.ua
ternopil.ua
uz.ua
uzhgorod.ua
uzhhorod.ua
vinnica.ua
vinnytsia.ua
vn.ua
volyn.ua
yalta.ua
zakarpattia.ua
zaporizhzhe.ua
zaporizhzhia.ua
zhitomir.ua
zhytomyr.ua
zp.ua
zt.ua

// ug : https://www.registry.co.ug/
ug
co.ug
or.ug
ac.ug
sc.ug
go.ug
ne.ug
com.ug
org.ug

// uk : https://en.wikipedia.org/wiki/.uk
// Submitted by registry <Michael.Daly@nominet.org.uk>
uk
ac.uk
co.uk
gov.uk
ltd.uk
me.uk
net.uk
nhs.uk
org.uk
plc.uk
police.uk
*.sch.uk

// us : https://en.wikipedia.org/wiki/.us
us
dni.us
fed.us
isa.us
kids.us
nsn.us
// us geographic names
ak.us
al.us
ar.us
as.us
az.us
ca.us
co.us
ct.us
dc.us
de.us
fl.us
ga.us
gu.us
hi.us
ia.us
id.us
il.us
in.us
ks.us
ky.us
la.us
ma.us
md.us
me.us
mi.us
mn.us
mo.us
ms.us
mt.us
nc.us
nd.us
ne.us
nh.us
nj.us
nm.us
nv.us
ny.us
oh.us
ok.us
or.us
pa.us
pr.us
ri.us
sc.us
sd.us
tn.us
tx.us
ut.us
vi.us
vt.us
va.us
wa.us
wi.us
wv.us
wy.us
// The registrar notes several more specific domains available in each state,
// such as state.*.us, dst.*.us, etc., but resolution of these is somewhat
// haphazard; in some states these domains resolve as addresses, while in others
// only subdomains are available, or even nothing at all. We include the
// most common ones where it's clear that different sites are different
// entities.
k12.ak.us
k12.al.us
k12.ar.us
k12.as.us
k12.az.us
k12.ca.us
k12.co.us
k12.ct.us
k12.dc.us
k12.fl.us
k12.ga.us
k12.gu.us
// k12.hi.us  Bug 614565 - Hawaii has a state-wide DOE login
k12.ia.us
k12.id.us
k12.il.us
k12.in.us
k12.ks.us
k12.ky.us
k12.la.us
k12.ma.us
k12.md.us
k12.me.us
k12.mi.us
k12.mn.us
k12.mo.us
k12.ms.us
k12.mt.us
k12.nc.us
// k12.nd.us  Bug 1028347 - Removed at request of Travis Rosso <trossow@nd.gov>
k12.ne.us
k12.nh.us
k12.nj.us
k12.nm.us
k12.nv.us
k12.ny.us
k12.oh.us
k12.ok.us
k12.or.us
k12.pa.us
k12.pr.us
// k12.ri.us  Removed at request of Kim Cournoyer <netsupport@staff.ri.net>
k12.sc.us
// k12.sd.us  Bug 934131 - Removed at request of James Booze <James.Booze@k12.sd.us>
k12.tn.us
k12.tx.us
k12.ut.us
k12.vi.us
k12.vt.us
k12.va.us
k12.wa.us
k12.wi.us
// k12.wv.us  Bug 947705 - Removed at request of Verne Britton <verne@wvnet.edu>
k12.wy.us
cc.ak.us
cc.al.us
cc.ar.us
cc.as.us
cc.az.us
cc.ca.us
cc.co.us
cc.ct.us
cc.dc.us
cc.de.us
cc.fl.us
cc.ga.us
cc.gu.us
cc.hi.us
cc.ia.us
cc.id.us
cc.il.us
cc.in.us
cc.ks.us
cc.ky.us
cc.la.us
cc.ma.us
cc.md.us
cc.me.us
cc.mi.us
cc.mn.us
cc.mo.us
cc.ms.us
cc.mt.us
cc.nc.us
cc.nd.us
cc.ne.us
cc.nh.us
cc.nj.us
cc.nm.us
cc.nv.us
cc.ny.us
cc.oh.us
cc.ok.us
cc.or.us
cc.pa.us
cc.pr.us
cc.ri.us
cc.sc.us
cc.sd.us
cc.tn.us
cc.tx.us
cc.ut.us
cc.vi.us
cc.vt.us
cc.va.us
cc.wa.us
cc.wi.us
cc.wv.us
cc.wy.us
lib.ak.us
lib.al.us
lib.ar.us
lib.as.us
lib.az.us
lib.ca.us
lib.co.us
lib.ct.us
lib.dc.us
// lib.de.us  Issue #243 - Moved to Private section at request of Ed Moore <Ed.Moore@lib.de.us>
lib.fl.us
lib.ga.us
lib.gu.us
lib.hi.us
lib.ia.us
lib.id.us
lib.il.us
lib.in.us
lib.ks.us
lib.ky.us
lib.la.us
lib.ma.us
lib.md.us
lib.me.us
lib.mi.us
lib.mn.us
lib.mo.us
lib.ms.us
lib.mt.us
lib.nc.us
lib.nd.us
lib.ne.us
lib.nh.us
lib.nj.us
lib.nm.us
lib.nv.us
lib.ny.us
lib.oh.us
lib.ok.us
lib.or.us
lib.pa.us
lib.pr.us
lib.ri.us
lib.sc.us
lib.sd.us
lib.tn.us
lib.tx.us
lib.ut.us
lib.vi.us
lib.vt.us
lib.va.us
lib.wa.us
lib.wi.us
// lib.wv.us  Bug 941670 - Removed at request of Larry W Arnold <arnold@wvlc.lib.wv.us>
lib.wy.us
// k12.ma.us contains school districts in Massachusetts. The 4LDs are
//  managed independently except for private (PVT), charter (CHTR) and
//  parochial (PAROCH) schools.  Those are delegated directly to the
//  5LD operators.   <k12-ma-hostmaster _ at _ rsuc.gweep.net>
pvt.k12.ma.us
chtr.k12.ma.us
paroch.k12.ma.us
// Merit Network, Inc. maintains the registry for =~ /(k12|cc|lib).mi.us/ and the following
//    see also: http://domreg.merit.edu
//    see also: whois -h whois.domreg.merit.edu help
ann-arbor.mi.us
cog.mi.us
dst.mi.us
eaton.mi.us
gen.mi.us
mus.mi.us
tec.mi.us
washtenaw.mi.us

// uy : http://www.nic.org.uy/
uy
com.uy
edu.uy
gub.uy
mil.uy
net.uy
org.uy

// uz : http://www.reg.uz/
uz
co.uz
com.uz
net.uz
org.uz

// va : https://en.wikipedia.org/wiki/.va
va

// vc : https://en.wikipedia.org/wiki/.vc
// Submitted by registry <kshah@ca.afilias.info>
vc
com.vc
net.vc
org.vc
gov.vc
mil.vc
edu.vc

// ve : https://registro.nic.ve/
// Submitted by registry nic@nic.ve and nicve@conatel.gob.ve
ve
arts.ve
bib.ve
co.ve
com.ve
e12.ve
edu.ve
firm.ve
gob.ve
gov.ve
info.ve
int.ve
mil.ve
net.ve
nom.ve
org.ve
rar.ve
rec.ve
store.ve
tec.ve
web.ve

// vg : https://en.wikipedia.org/wiki/.vg
vg

// vi : http://www.nic.vi/newdomainform.htm
// http://www.nic.vi/Domain_Rules/body_domain_rules.html indicates some other
// TLDs are "reserved", such as edu.vi and gov.vi, but doesn't actually say they
// are available for registration (which they do not seem to be).
vi
co.vi
com.vi
k12.vi
net.vi
org.vi

// vn : https://www.vnnic.vn/en/domain/cctld-vn
// https://vnnic.vn/sites/default/files/tailieu/vn.cctld.domains.txt
vn
ac.vn
ai.vn
biz.vn
com.vn
edu.vn
gov.vn
health.vn
id.vn
info.vn
int.vn
io.vn
name.vn
net.vn
org.vn
pro.vn

// vn geographical names
angiang.vn
bacgiang.vn
backan.vn
baclieu.vn
bacninh.vn
baria-vungtau.vn
bentre.vn
binhdinh.vn
binhduong.vn
binhphuoc.vn
binhthuan.vn
camau.vn
cantho.vn
caobang.vn
daklak.vn
daknong.vn
danang.vn
dienbien.vn
dongnai.vn
dongthap.vn
gialai.vn
hagiang.vn
haiduong.vn
haiphong.vn
hanam.vn
hanoi.vn
hatinh.vn
haugiang.vn
hoabinh.vn
hungyen.vn
khanhhoa.vn
kiengiang.vn
kontum.vn
laichau.vn
lamdong.vn
langson.vn
laocai.vn
longan.vn
namdinh.vn
nghean.vn
ninhbinh.vn
ninhthuan.vn
phutho.vn
phuyen.vn
quangbinh.vn
quangnam.vn
quangngai.vn
quangninh.vn
quangtri.vn
soctrang.vn
sonla.vn
tayninh.vn
thaibinh.vn
thainguyen.vn
thanhhoa.vn
thanhphohochiminh.vn
thuathienhue.vn
tiengiang.vn
travinh.vn
tuyenquang.vn
vinhlong.vn
vinhphuc.vn
yenbai.vn

// vu : https://en.wikipedia.org/wiki/.vu
// http://www.vunic.vu/
vu
com.vu
edu.vu
net.vu
org.vu

// wf : https://www.afnic.fr/wp-media/uploads/2022/12/afnic-naming-policy-2023-01-01.pdf
wf

// ws : https://en.wikipedia.org/wiki/.ws
// http://samoanic.ws/index.dhtml
ws
com.ws
net.ws
org.ws
gov.ws
edu.ws

// yt : https://www.afnic.fr/wp-media/uploads/2022/12/afnic-naming-policy-2023-01-01.pdf
yt

// IDN ccTLDs
// When submitting patches, please maintain a sort by ISO 3166 ccTLD, then
// U-label, and follow this format:
// // A-Label ("<Latin renderings>", <language name>[, variant info]) : <ISO 3166 ccTLD>
// // [sponsoring org]
// U-Label

// xn--mgbaam7a8h ("Emerat", Arabic) : AE
// http://nic.ae/english/arabicdomain/rules.jsp
\u0627\u0645\u0627\u0631\u0627\u062A

// xn--y9a3aq ("hye", Armenian) : AM
// ISOC AM (operated by .am Registry)
\u0570\u0561\u0575

// xn--54b7fta0cc ("Bangla", Bangla) : BD
\u09AC\u09BE\u0982\u09B2\u09BE

// xn--90ae ("bg", Bulgarian) : BG
\u0431\u0433

// xn--mgbcpq6gpa1a ("albahrain", Arabic) : BH
\u0627\u0644\u0628\u062D\u0631\u064A\u0646

// xn--90ais ("bel", Belarusian/Russian Cyrillic) : BY
// Operated by .by registry
\u0431\u0435\u043B

// xn--fiqs8s ("Zhongguo/China", Chinese, Simplified) : CN
// CNNIC
// http://cnnic.cn/html/Dir/2005/10/11/3218.htm
\u4E2D\u56FD

// xn--fiqz9s ("Zhongguo/China", Chinese, Traditional) : CN
// CNNIC
// http://cnnic.cn/html/Dir/2005/10/11/3218.htm
\u4E2D\u570B

// xn--lgbbat1ad8j ("Algeria/Al Jazair", Arabic) : DZ
\u0627\u0644\u062C\u0632\u0627\u0626\u0631

// xn--wgbh1c ("Egypt/Masr", Arabic) : EG
// http://www.dotmasr.eg/
\u0645\u0635\u0631

// xn--e1a4c ("eu", Cyrillic) : EU
// https://eurid.eu
\u0435\u044E

// xn--qxa6a ("eu", Greek) : EU
// https://eurid.eu
\u03B5\u03C5

// xn--mgbah1a3hjkrd ("Mauritania", Arabic) : MR
\u0645\u0648\u0631\u064A\u062A\u0627\u0646\u064A\u0627

// xn--node ("ge", Georgian Mkhedruli) : GE
\u10D2\u10D4

// xn--qxam ("el", Greek) : GR
// Hellenic Ministry of Infrastructure, Transport, and Networks
\u03B5\u03BB

// xn--j6w193g ("Hong Kong", Chinese) : HK
// https://www.hkirc.hk
// Submitted by registry <hk.tech@hkirc.hk>
// https://www.hkirc.hk/content.jsp?id=30#!/34
\u9999\u6E2F
\u516C\u53F8.\u9999\u6E2F
\u6559\u80B2.\u9999\u6E2F
\u653F\u5E9C.\u9999\u6E2F
\u500B\u4EBA.\u9999\u6E2F
\u7DB2\u7D61.\u9999\u6E2F
\u7D44\u7E54.\u9999\u6E2F

// xn--2scrj9c ("Bharat", Kannada) : IN
// India
\u0CAD\u0CBE\u0CB0\u0CA4

// xn--3hcrj9c ("Bharat", Oriya) : IN
// India
\u0B2D\u0B3E\u0B30\u0B24

// xn--45br5cyl ("Bharatam", Assamese) : IN
// India
\u09AD\u09BE\u09F0\u09A4

// xn--h2breg3eve ("Bharatam", Sanskrit) : IN
// India
\u092D\u093E\u0930\u0924\u092E\u094D

// xn--h2brj9c8c ("Bharot", Santali) : IN
// India
\u092D\u093E\u0930\u094B\u0924

// xn--mgbgu82a ("Bharat", Sindhi) : IN
// India
\u0680\u0627\u0631\u062A

// xn--rvc1e0am3e ("Bharatam", Malayalam) : IN
// India
\u0D2D\u0D3E\u0D30\u0D24\u0D02

// xn--h2brj9c ("Bharat", Devanagari) : IN
// India
\u092D\u093E\u0930\u0924

// xn--mgbbh1a ("Bharat", Kashmiri) : IN
// India
\u0628\u0627\u0631\u062A

// xn--mgbbh1a71e ("Bharat", Arabic) : IN
// India
\u0628\u06BE\u0627\u0631\u062A

// xn--fpcrj9c3d ("Bharat", Telugu) : IN
// India
\u0C2D\u0C3E\u0C30\u0C24\u0C4D

// xn--gecrj9c ("Bharat", Gujarati) : IN
// India
\u0AAD\u0ABE\u0AB0\u0AA4

// xn--s9brj9c ("Bharat", Gurmukhi) : IN
// India
\u0A2D\u0A3E\u0A30\u0A24

// xn--45brj9c ("Bharat", Bengali) : IN
// India
\u09AD\u09BE\u09B0\u09A4

// xn--xkc2dl3a5ee0h ("India", Tamil) : IN
// India
\u0B87\u0BA8\u0BCD\u0BA4\u0BBF\u0BAF\u0BBE

// xn--mgba3a4f16a ("Iran", Persian) : IR
\u0627\u06CC\u0631\u0627\u0646

// xn--mgba3a4fra ("Iran", Arabic) : IR
\u0627\u064A\u0631\u0627\u0646

// xn--mgbtx2b ("Iraq", Arabic) : IQ
// Communications and Media Commission
\u0639\u0631\u0627\u0642

// xn--mgbayh7gpa ("al-Ordon", Arabic) : JO
// National Information Technology Center (NITC)
// Royal Scientific Society, Al-Jubeiha
\u0627\u0644\u0627\u0631\u062F\u0646

// xn--3e0b707e ("Republic of Korea", Hangul) : KR
\uD55C\uAD6D

// xn--80ao21a ("Kaz", Kazakh) : KZ
\u049B\u0430\u0437

// xn--q7ce6a ("Lao", Lao) : LA
\u0EA5\u0EB2\u0EA7

// xn--fzc2c9e2c ("Lanka", Sinhalese-Sinhala) : LK
// https://nic.lk
\u0DBD\u0D82\u0D9A\u0DCF

// xn--xkc2al3hye2a ("Ilangai", Tamil) : LK
// https://nic.lk
\u0B87\u0BB2\u0B99\u0BCD\u0B95\u0BC8

// xn--mgbc0a9azcg ("Morocco/al-Maghrib", Arabic) : MA
\u0627\u0644\u0645\u063A\u0631\u0628

// xn--d1alf ("mkd", Macedonian) : MK
// MARnet
\u043C\u043A\u0434

// xn--l1acc ("mon", Mongolian) : MN
\u043C\u043E\u043D

// xn--mix891f ("Macao", Chinese, Traditional) : MO
// MONIC / HNET Asia (Registry Operator for .mo)
\u6FB3\u9580

// xn--mix082f ("Macao", Chinese, Simplified) : MO
\u6FB3\u95E8

// xn--mgbx4cd0ab ("Malaysia", Malay) : MY
\u0645\u0644\u064A\u0633\u064A\u0627

// xn--mgb9awbf ("Oman", Arabic) : OM
\u0639\u0645\u0627\u0646

// xn--mgbai9azgqp6j ("Pakistan", Urdu/Arabic) : PK
\u067E\u0627\u06A9\u0633\u062A\u0627\u0646

// xn--mgbai9a5eva00b ("Pakistan", Urdu/Arabic, variant) : PK
\u067E\u0627\u0643\u0633\u062A\u0627\u0646

// xn--ygbi2ammx ("Falasteen", Arabic) : PS
// The Palestinian National Internet Naming Authority (PNINA)
// http://www.pnina.ps
\u0641\u0644\u0633\u0637\u064A\u0646

// xn--90a3ac ("srb", Cyrillic) : RS
// https://www.rnids.rs/en/domains/national-domains
\u0441\u0440\u0431
\u043F\u0440.\u0441\u0440\u0431
\u043E\u0440\u0433.\u0441\u0440\u0431
\u043E\u0431\u0440.\u0441\u0440\u0431
\u043E\u0434.\u0441\u0440\u0431
\u0443\u043F\u0440.\u0441\u0440\u0431
\u0430\u043A.\u0441\u0440\u0431

// xn--p1ai ("rf", Russian-Cyrillic) : RU
// https://cctld.ru/files/pdf/docs/en/rules_ru-rf.pdf
// Submitted by George Georgievsky <gug@cctld.ru>
\u0440\u0444

// xn--wgbl6a ("Qatar", Arabic) : QA
// http://www.ict.gov.qa/
\u0642\u0637\u0631

// xn--mgberp4a5d4ar ("AlSaudiah", Arabic) : SA
// http://www.nic.net.sa/
\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629

// xn--mgberp4a5d4a87g ("AlSaudiah", Arabic, variant)  : SA
\u0627\u0644\u0633\u0639\u0648\u062F\u06CC\u0629

// xn--mgbqly7c0a67fbc ("AlSaudiah", Arabic, variant) : SA
\u0627\u0644\u0633\u0639\u0648\u062F\u06CC\u06C3

// xn--mgbqly7cvafr ("AlSaudiah", Arabic, variant) : SA
\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0647

// xn--mgbpl2fh ("sudan", Arabic) : SD
// Operated by .sd registry
\u0633\u0648\u062F\u0627\u0646

// xn--yfro4i67o Singapore ("Singapore", Chinese) : SG
\u65B0\u52A0\u5761

// xn--clchc0ea0b2g2a9gcd ("Singapore", Tamil) : SG
\u0B9A\u0BBF\u0B99\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0BC2\u0BB0\u0BCD

// xn--ogbpf8fl ("Syria", Arabic) : SY
\u0633\u0648\u0631\u064A\u0629

// xn--mgbtf8fl ("Syria", Arabic, variant) : SY
\u0633\u0648\u0631\u064A\u0627

// xn--o3cw4h ("Thai", Thai) : TH
// http://www.thnic.co.th
\u0E44\u0E17\u0E22
\u0E28\u0E36\u0E01\u0E29\u0E32.\u0E44\u0E17\u0E22
\u0E18\u0E38\u0E23\u0E01\u0E34\u0E08.\u0E44\u0E17\u0E22
\u0E23\u0E31\u0E10\u0E1A\u0E32\u0E25.\u0E44\u0E17\u0E22
\u0E17\u0E2B\u0E32\u0E23.\u0E44\u0E17\u0E22
\u0E40\u0E19\u0E47\u0E15.\u0E44\u0E17\u0E22
\u0E2D\u0E07\u0E04\u0E4C\u0E01\u0E23.\u0E44\u0E17\u0E22

// xn--pgbs0dh ("Tunisia", Arabic) : TN
// http://nic.tn
\u062A\u0648\u0646\u0633

// xn--kpry57d ("Taiwan", Chinese, Traditional) : TW
// http://www.twnic.net/english/dn/dn_07a.htm
\u53F0\u7063

// xn--kprw13d ("Taiwan", Chinese, Simplified) : TW
// http://www.twnic.net/english/dn/dn_07a.htm
\u53F0\u6E7E

// xn--nnx388a ("Taiwan", Chinese, variant) : TW
\u81FA\u7063

// xn--j1amh ("ukr", Cyrillic) : UA
\u0443\u043A\u0440

// xn--mgb2ddes ("AlYemen", Arabic) : YE
\u0627\u0644\u064A\u0645\u0646

// xxx : http://icmregistry.com
xxx

// ye : http://www.y.net.ye/services/domain_name.htm
ye
com.ye
edu.ye
gov.ye
net.ye
mil.ye
org.ye

// za : https://www.zadna.org.za/content/page/domain-information/
ac.za
agric.za
alt.za
co.za
edu.za
gov.za
grondar.za
law.za
mil.za
net.za
ngo.za
nic.za
nis.za
nom.za
org.za
school.za
tm.za
web.za

// zm : https://zicta.zm/
// Submitted by registry <info@zicta.zm>
zm
ac.zm
biz.zm
co.zm
com.zm
edu.zm
gov.zm
info.zm
mil.zm
net.zm
org.zm
sch.zm

// zw : https://www.potraz.gov.zw/
// Confirmed by registry <bmtengwa@potraz.gov.zw> 2017-01-25
zw
ac.zw
co.zw
gov.zw
mil.zw
org.zw


// newGTLDs

// List of new gTLDs imported from https://www.icann.org/resources/registries/gtlds/v2/gtlds.json on 2023-10-20T15:11:50Z
// This list is auto-generated, don't edit it manually.
// aaa : American Automobile Association, Inc.
// https://www.iana.org/domains/root/db/aaa.html
aaa

// aarp : AARP
// https://www.iana.org/domains/root/db/aarp.html
aarp

// abb : ABB Ltd
// https://www.iana.org/domains/root/db/abb.html
abb

// abbott : Abbott Laboratories, Inc.
// https://www.iana.org/domains/root/db/abbott.html
abbott

// abbvie : AbbVie Inc.
// https://www.iana.org/domains/root/db/abbvie.html
abbvie

// abc : Disney Enterprises, Inc.
// https://www.iana.org/domains/root/db/abc.html
abc

// able : Able Inc.
// https://www.iana.org/domains/root/db/able.html
able

// abogado : Registry Services, LLC
// https://www.iana.org/domains/root/db/abogado.html
abogado

// abudhabi : Abu Dhabi Systems and Information Centre
// https://www.iana.org/domains/root/db/abudhabi.html
abudhabi

// academy : Binky Moon, LLC
// https://www.iana.org/domains/root/db/academy.html
academy

// accenture : Accenture plc
// https://www.iana.org/domains/root/db/accenture.html
accenture

// accountant : dot Accountant Limited
// https://www.iana.org/domains/root/db/accountant.html
accountant

// accountants : Binky Moon, LLC
// https://www.iana.org/domains/root/db/accountants.html
accountants

// aco : ACO Severin Ahlmann GmbH & Co. KG
// https://www.iana.org/domains/root/db/aco.html
aco

// actor : Dog Beach, LLC
// https://www.iana.org/domains/root/db/actor.html
actor

// ads : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/ads.html
ads

// adult : ICM Registry AD LLC
// https://www.iana.org/domains/root/db/adult.html
adult

// aeg : Aktiebolaget Electrolux
// https://www.iana.org/domains/root/db/aeg.html
aeg

// aetna : Aetna Life Insurance Company
// https://www.iana.org/domains/root/db/aetna.html
aetna

// afl : Australian Football League
// https://www.iana.org/domains/root/db/afl.html
afl

// africa : ZA Central Registry NPC trading as Registry.Africa
// https://www.iana.org/domains/root/db/africa.html
africa

// agakhan : Fondation Aga Khan (Aga Khan Foundation)
// https://www.iana.org/domains/root/db/agakhan.html
agakhan

// agency : Binky Moon, LLC
// https://www.iana.org/domains/root/db/agency.html
agency

// aig : American International Group, Inc.
// https://www.iana.org/domains/root/db/aig.html
aig

// airbus : Airbus S.A.S.
// https://www.iana.org/domains/root/db/airbus.html
airbus

// airforce : Dog Beach, LLC
// https://www.iana.org/domains/root/db/airforce.html
airforce

// airtel : Bharti Airtel Limited
// https://www.iana.org/domains/root/db/airtel.html
airtel

// akdn : Fondation Aga Khan (Aga Khan Foundation)
// https://www.iana.org/domains/root/db/akdn.html
akdn

// alibaba : Alibaba Group Holding Limited
// https://www.iana.org/domains/root/db/alibaba.html
alibaba

// alipay : Alibaba Group Holding Limited
// https://www.iana.org/domains/root/db/alipay.html
alipay

// allfinanz : Allfinanz Deutsche Verm\xF6gensberatung Aktiengesellschaft
// https://www.iana.org/domains/root/db/allfinanz.html
allfinanz

// allstate : Allstate Fire and Casualty Insurance Company
// https://www.iana.org/domains/root/db/allstate.html
allstate

// ally : Ally Financial Inc.
// https://www.iana.org/domains/root/db/ally.html
ally

// alsace : Region Grand Est
// https://www.iana.org/domains/root/db/alsace.html
alsace

// alstom : ALSTOM
// https://www.iana.org/domains/root/db/alstom.html
alstom

// amazon : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/amazon.html
amazon

// americanexpress : American Express Travel Related Services Company, Inc.
// https://www.iana.org/domains/root/db/americanexpress.html
americanexpress

// americanfamily : AmFam, Inc.
// https://www.iana.org/domains/root/db/americanfamily.html
americanfamily

// amex : American Express Travel Related Services Company, Inc.
// https://www.iana.org/domains/root/db/amex.html
amex

// amfam : AmFam, Inc.
// https://www.iana.org/domains/root/db/amfam.html
amfam

// amica : Amica Mutual Insurance Company
// https://www.iana.org/domains/root/db/amica.html
amica

// amsterdam : Gemeente Amsterdam
// https://www.iana.org/domains/root/db/amsterdam.html
amsterdam

// analytics : Campus IP LLC
// https://www.iana.org/domains/root/db/analytics.html
analytics

// android : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/android.html
android

// anquan : Beijing Qihu Keji Co., Ltd.
// https://www.iana.org/domains/root/db/anquan.html
anquan

// anz : Australia and New Zealand Banking Group Limited
// https://www.iana.org/domains/root/db/anz.html
anz

// aol : Oath Inc.
// https://www.iana.org/domains/root/db/aol.html
aol

// apartments : Binky Moon, LLC
// https://www.iana.org/domains/root/db/apartments.html
apartments

// app : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/app.html
app

// apple : Apple Inc.
// https://www.iana.org/domains/root/db/apple.html
apple

// aquarelle : Aquarelle.com
// https://www.iana.org/domains/root/db/aquarelle.html
aquarelle

// arab : League of Arab States
// https://www.iana.org/domains/root/db/arab.html
arab

// aramco : Aramco Services Company
// https://www.iana.org/domains/root/db/aramco.html
aramco

// archi : Identity Digital Limited
// https://www.iana.org/domains/root/db/archi.html
archi

// army : Dog Beach, LLC
// https://www.iana.org/domains/root/db/army.html
army

// art : UK Creative Ideas Limited
// https://www.iana.org/domains/root/db/art.html
art

// arte : Association Relative \xE0 la T\xE9l\xE9vision Europ\xE9enne G.E.I.E.
// https://www.iana.org/domains/root/db/arte.html
arte

// asda : Wal-Mart Stores, Inc.
// https://www.iana.org/domains/root/db/asda.html
asda

// associates : Binky Moon, LLC
// https://www.iana.org/domains/root/db/associates.html
associates

// athleta : The Gap, Inc.
// https://www.iana.org/domains/root/db/athleta.html
athleta

// attorney : Dog Beach, LLC
// https://www.iana.org/domains/root/db/attorney.html
attorney

// auction : Dog Beach, LLC
// https://www.iana.org/domains/root/db/auction.html
auction

// audi : AUDI Aktiengesellschaft
// https://www.iana.org/domains/root/db/audi.html
audi

// audible : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/audible.html
audible

// audio : XYZ.COM LLC
// https://www.iana.org/domains/root/db/audio.html
audio

// auspost : Australian Postal Corporation
// https://www.iana.org/domains/root/db/auspost.html
auspost

// author : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/author.html
author

// auto : XYZ.COM LLC
// https://www.iana.org/domains/root/db/auto.html
auto

// autos : XYZ.COM LLC
// https://www.iana.org/domains/root/db/autos.html
autos

// avianca : Avianca Inc.
// https://www.iana.org/domains/root/db/avianca.html
avianca

// aws : AWS Registry LLC
// https://www.iana.org/domains/root/db/aws.html
aws

// axa : AXA Group Operations SAS
// https://www.iana.org/domains/root/db/axa.html
axa

// azure : Microsoft Corporation
// https://www.iana.org/domains/root/db/azure.html
azure

// baby : XYZ.COM LLC
// https://www.iana.org/domains/root/db/baby.html
baby

// baidu : Baidu, Inc.
// https://www.iana.org/domains/root/db/baidu.html
baidu

// banamex : Citigroup Inc.
// https://www.iana.org/domains/root/db/banamex.html
banamex

// bananarepublic : The Gap, Inc.
// https://www.iana.org/domains/root/db/bananarepublic.html
bananarepublic

// band : Dog Beach, LLC
// https://www.iana.org/domains/root/db/band.html
band

// bank : fTLD Registry Services LLC
// https://www.iana.org/domains/root/db/bank.html
bank

// bar : Punto 2012 Sociedad Anonima Promotora de Inversion de Capital Variable
// https://www.iana.org/domains/root/db/bar.html
bar

// barcelona : Municipi de Barcelona
// https://www.iana.org/domains/root/db/barcelona.html
barcelona

// barclaycard : Barclays Bank PLC
// https://www.iana.org/domains/root/db/barclaycard.html
barclaycard

// barclays : Barclays Bank PLC
// https://www.iana.org/domains/root/db/barclays.html
barclays

// barefoot : Gallo Vineyards, Inc.
// https://www.iana.org/domains/root/db/barefoot.html
barefoot

// bargains : Binky Moon, LLC
// https://www.iana.org/domains/root/db/bargains.html
bargains

// baseball : MLB Advanced Media DH, LLC
// https://www.iana.org/domains/root/db/baseball.html
baseball

// basketball : F\xE9d\xE9ration Internationale de Basketball (FIBA)
// https://www.iana.org/domains/root/db/basketball.html
basketball

// bauhaus : Werkhaus GmbH
// https://www.iana.org/domains/root/db/bauhaus.html
bauhaus

// bayern : Bayern Connect GmbH
// https://www.iana.org/domains/root/db/bayern.html
bayern

// bbc : British Broadcasting Corporation
// https://www.iana.org/domains/root/db/bbc.html
bbc

// bbt : BB&T Corporation
// https://www.iana.org/domains/root/db/bbt.html
bbt

// bbva : BANCO BILBAO VIZCAYA ARGENTARIA, S.A.
// https://www.iana.org/domains/root/db/bbva.html
bbva

// bcg : The Boston Consulting Group, Inc.
// https://www.iana.org/domains/root/db/bcg.html
bcg

// bcn : Municipi de Barcelona
// https://www.iana.org/domains/root/db/bcn.html
bcn

// beats : Beats Electronics, LLC
// https://www.iana.org/domains/root/db/beats.html
beats

// beauty : XYZ.COM LLC
// https://www.iana.org/domains/root/db/beauty.html
beauty

// beer : Registry Services, LLC
// https://www.iana.org/domains/root/db/beer.html
beer

// bentley : Bentley Motors Limited
// https://www.iana.org/domains/root/db/bentley.html
bentley

// berlin : dotBERLIN GmbH & Co. KG
// https://www.iana.org/domains/root/db/berlin.html
berlin

// best : BestTLD Pty Ltd
// https://www.iana.org/domains/root/db/best.html
best

// bestbuy : BBY Solutions, Inc.
// https://www.iana.org/domains/root/db/bestbuy.html
bestbuy

// bet : Identity Digital Limited
// https://www.iana.org/domains/root/db/bet.html
bet

// bharti : Bharti Enterprises (Holding) Private Limited
// https://www.iana.org/domains/root/db/bharti.html
bharti

// bible : American Bible Society
// https://www.iana.org/domains/root/db/bible.html
bible

// bid : dot Bid Limited
// https://www.iana.org/domains/root/db/bid.html
bid

// bike : Binky Moon, LLC
// https://www.iana.org/domains/root/db/bike.html
bike

// bing : Microsoft Corporation
// https://www.iana.org/domains/root/db/bing.html
bing

// bingo : Binky Moon, LLC
// https://www.iana.org/domains/root/db/bingo.html
bingo

// bio : Identity Digital Limited
// https://www.iana.org/domains/root/db/bio.html
bio

// black : Identity Digital Limited
// https://www.iana.org/domains/root/db/black.html
black

// blackfriday : Registry Services, LLC
// https://www.iana.org/domains/root/db/blackfriday.html
blackfriday

// blockbuster : Dish DBS Corporation
// https://www.iana.org/domains/root/db/blockbuster.html
blockbuster

// blog : Knock Knock WHOIS There, LLC
// https://www.iana.org/domains/root/db/blog.html
blog

// bloomberg : Bloomberg IP Holdings LLC
// https://www.iana.org/domains/root/db/bloomberg.html
bloomberg

// blue : Identity Digital Limited
// https://www.iana.org/domains/root/db/blue.html
blue

// bms : Bristol-Myers Squibb Company
// https://www.iana.org/domains/root/db/bms.html
bms

// bmw : Bayerische Motoren Werke Aktiengesellschaft
// https://www.iana.org/domains/root/db/bmw.html
bmw

// bnpparibas : BNP Paribas
// https://www.iana.org/domains/root/db/bnpparibas.html
bnpparibas

// boats : XYZ.COM LLC
// https://www.iana.org/domains/root/db/boats.html
boats

// boehringer : Boehringer Ingelheim International GmbH
// https://www.iana.org/domains/root/db/boehringer.html
boehringer

// bofa : Bank of America Corporation
// https://www.iana.org/domains/root/db/bofa.html
bofa

// bom : N\xFAcleo de Informa\xE7\xE3o e Coordena\xE7\xE3o do Ponto BR - NIC.br
// https://www.iana.org/domains/root/db/bom.html
bom

// bond : ShortDot SA
// https://www.iana.org/domains/root/db/bond.html
bond

// boo : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/boo.html
boo

// book : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/book.html
book

// booking : Booking.com B.V.
// https://www.iana.org/domains/root/db/booking.html
booking

// bosch : Robert Bosch GMBH
// https://www.iana.org/domains/root/db/bosch.html
bosch

// bostik : Bostik SA
// https://www.iana.org/domains/root/db/bostik.html
bostik

// boston : Registry Services, LLC
// https://www.iana.org/domains/root/db/boston.html
boston

// bot : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/bot.html
bot

// boutique : Binky Moon, LLC
// https://www.iana.org/domains/root/db/boutique.html
boutique

// box : Intercap Registry Inc.
// https://www.iana.org/domains/root/db/box.html
box

// bradesco : Banco Bradesco S.A.
// https://www.iana.org/domains/root/db/bradesco.html
bradesco

// bridgestone : Bridgestone Corporation
// https://www.iana.org/domains/root/db/bridgestone.html
bridgestone

// broadway : Celebrate Broadway, Inc.
// https://www.iana.org/domains/root/db/broadway.html
broadway

// broker : Dog Beach, LLC
// https://www.iana.org/domains/root/db/broker.html
broker

// brother : Brother Industries, Ltd.
// https://www.iana.org/domains/root/db/brother.html
brother

// brussels : DNS.be vzw
// https://www.iana.org/domains/root/db/brussels.html
brussels

// build : Plan Bee LLC
// https://www.iana.org/domains/root/db/build.html
build

// builders : Binky Moon, LLC
// https://www.iana.org/domains/root/db/builders.html
builders

// business : Binky Moon, LLC
// https://www.iana.org/domains/root/db/business.html
business

// buy : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/buy.html
buy

// buzz : DOTSTRATEGY CO.
// https://www.iana.org/domains/root/db/buzz.html
buzz

// bzh : Association www.bzh
// https://www.iana.org/domains/root/db/bzh.html
bzh

// cab : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cab.html
cab

// cafe : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cafe.html
cafe

// cal : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/cal.html
cal

// call : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/call.html
call

// calvinklein : PVH gTLD Holdings LLC
// https://www.iana.org/domains/root/db/calvinklein.html
calvinklein

// cam : Cam Connecting SARL
// https://www.iana.org/domains/root/db/cam.html
cam

// camera : Binky Moon, LLC
// https://www.iana.org/domains/root/db/camera.html
camera

// camp : Binky Moon, LLC
// https://www.iana.org/domains/root/db/camp.html
camp

// canon : Canon Inc.
// https://www.iana.org/domains/root/db/canon.html
canon

// capetown : ZA Central Registry NPC trading as ZA Central Registry
// https://www.iana.org/domains/root/db/capetown.html
capetown

// capital : Binky Moon, LLC
// https://www.iana.org/domains/root/db/capital.html
capital

// capitalone : Capital One Financial Corporation
// https://www.iana.org/domains/root/db/capitalone.html
capitalone

// car : XYZ.COM LLC
// https://www.iana.org/domains/root/db/car.html
car

// caravan : Caravan International, Inc.
// https://www.iana.org/domains/root/db/caravan.html
caravan

// cards : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cards.html
cards

// care : Binky Moon, LLC
// https://www.iana.org/domains/root/db/care.html
care

// career : dotCareer LLC
// https://www.iana.org/domains/root/db/career.html
career

// careers : Binky Moon, LLC
// https://www.iana.org/domains/root/db/careers.html
careers

// cars : XYZ.COM LLC
// https://www.iana.org/domains/root/db/cars.html
cars

// casa : Registry Services, LLC
// https://www.iana.org/domains/root/db/casa.html
casa

// case : Digity, LLC
// https://www.iana.org/domains/root/db/case.html
case

// cash : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cash.html
cash

// casino : Binky Moon, LLC
// https://www.iana.org/domains/root/db/casino.html
casino

// catering : Binky Moon, LLC
// https://www.iana.org/domains/root/db/catering.html
catering

// catholic : Pontificium Consilium de Comunicationibus Socialibus (PCCS) (Pontifical Council for Social Communication)
// https://www.iana.org/domains/root/db/catholic.html
catholic

// cba : COMMONWEALTH BANK OF AUSTRALIA
// https://www.iana.org/domains/root/db/cba.html
cba

// cbn : The Christian Broadcasting Network, Inc.
// https://www.iana.org/domains/root/db/cbn.html
cbn

// cbre : CBRE, Inc.
// https://www.iana.org/domains/root/db/cbre.html
cbre

// cbs : CBS Domains Inc.
// https://www.iana.org/domains/root/db/cbs.html
cbs

// center : Binky Moon, LLC
// https://www.iana.org/domains/root/db/center.html
center

// ceo : XYZ.COM LLC
// https://www.iana.org/domains/root/db/ceo.html
ceo

// cern : European Organization for Nuclear Research ("CERN")
// https://www.iana.org/domains/root/db/cern.html
cern

// cfa : CFA Institute
// https://www.iana.org/domains/root/db/cfa.html
cfa

// cfd : ShortDot SA
// https://www.iana.org/domains/root/db/cfd.html
cfd

// chanel : Chanel International B.V.
// https://www.iana.org/domains/root/db/chanel.html
chanel

// channel : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/channel.html
channel

// charity : Public Interest Registry
// https://www.iana.org/domains/root/db/charity.html
charity

// chase : JPMorgan Chase Bank, National Association
// https://www.iana.org/domains/root/db/chase.html
chase

// chat : Binky Moon, LLC
// https://www.iana.org/domains/root/db/chat.html
chat

// cheap : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cheap.html
cheap

// chintai : CHINTAI Corporation
// https://www.iana.org/domains/root/db/chintai.html
chintai

// christmas : XYZ.COM LLC
// https://www.iana.org/domains/root/db/christmas.html
christmas

// chrome : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/chrome.html
chrome

// church : Binky Moon, LLC
// https://www.iana.org/domains/root/db/church.html
church

// cipriani : Hotel Cipriani Srl
// https://www.iana.org/domains/root/db/cipriani.html
cipriani

// circle : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/circle.html
circle

// cisco : Cisco Technology, Inc.
// https://www.iana.org/domains/root/db/cisco.html
cisco

// citadel : Citadel Domain LLC
// https://www.iana.org/domains/root/db/citadel.html
citadel

// citi : Citigroup Inc.
// https://www.iana.org/domains/root/db/citi.html
citi

// citic : CITIC Group Corporation
// https://www.iana.org/domains/root/db/citic.html
citic

// city : Binky Moon, LLC
// https://www.iana.org/domains/root/db/city.html
city

// claims : Binky Moon, LLC
// https://www.iana.org/domains/root/db/claims.html
claims

// cleaning : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cleaning.html
cleaning

// click : Internet Naming Company LLC
// https://www.iana.org/domains/root/db/click.html
click

// clinic : Binky Moon, LLC
// https://www.iana.org/domains/root/db/clinic.html
clinic

// clinique : The Est\xE9e Lauder Companies Inc.
// https://www.iana.org/domains/root/db/clinique.html
clinique

// clothing : Binky Moon, LLC
// https://www.iana.org/domains/root/db/clothing.html
clothing

// cloud : Aruba PEC S.p.A.
// https://www.iana.org/domains/root/db/cloud.html
cloud

// club : Registry Services, LLC
// https://www.iana.org/domains/root/db/club.html
club

// clubmed : Club M\xE9diterran\xE9e S.A.
// https://www.iana.org/domains/root/db/clubmed.html
clubmed

// coach : Binky Moon, LLC
// https://www.iana.org/domains/root/db/coach.html
coach

// codes : Binky Moon, LLC
// https://www.iana.org/domains/root/db/codes.html
codes

// coffee : Binky Moon, LLC
// https://www.iana.org/domains/root/db/coffee.html
coffee

// college : XYZ.COM LLC
// https://www.iana.org/domains/root/db/college.html
college

// cologne : dotKoeln GmbH
// https://www.iana.org/domains/root/db/cologne.html
cologne

// comcast : Comcast IP Holdings I, LLC
// https://www.iana.org/domains/root/db/comcast.html
comcast

// commbank : COMMONWEALTH BANK OF AUSTRALIA
// https://www.iana.org/domains/root/db/commbank.html
commbank

// community : Binky Moon, LLC
// https://www.iana.org/domains/root/db/community.html
community

// company : Binky Moon, LLC
// https://www.iana.org/domains/root/db/company.html
company

// compare : Registry Services, LLC
// https://www.iana.org/domains/root/db/compare.html
compare

// computer : Binky Moon, LLC
// https://www.iana.org/domains/root/db/computer.html
computer

// comsec : VeriSign, Inc.
// https://www.iana.org/domains/root/db/comsec.html
comsec

// condos : Binky Moon, LLC
// https://www.iana.org/domains/root/db/condos.html
condos

// construction : Binky Moon, LLC
// https://www.iana.org/domains/root/db/construction.html
construction

// consulting : Dog Beach, LLC
// https://www.iana.org/domains/root/db/consulting.html
consulting

// contact : Dog Beach, LLC
// https://www.iana.org/domains/root/db/contact.html
contact

// contractors : Binky Moon, LLC
// https://www.iana.org/domains/root/db/contractors.html
contractors

// cooking : Registry Services, LLC
// https://www.iana.org/domains/root/db/cooking.html
cooking

// cool : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cool.html
cool

// corsica : Collectivit\xE9 de Corse
// https://www.iana.org/domains/root/db/corsica.html
corsica

// country : Internet Naming Company LLC
// https://www.iana.org/domains/root/db/country.html
country

// coupon : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/coupon.html
coupon

// coupons : Binky Moon, LLC
// https://www.iana.org/domains/root/db/coupons.html
coupons

// courses : Registry Services, LLC
// https://www.iana.org/domains/root/db/courses.html
courses

// cpa : American Institute of Certified Public Accountants
// https://www.iana.org/domains/root/db/cpa.html
cpa

// credit : Binky Moon, LLC
// https://www.iana.org/domains/root/db/credit.html
credit

// creditcard : Binky Moon, LLC
// https://www.iana.org/domains/root/db/creditcard.html
creditcard

// creditunion : DotCooperation LLC
// https://www.iana.org/domains/root/db/creditunion.html
creditunion

// cricket : dot Cricket Limited
// https://www.iana.org/domains/root/db/cricket.html
cricket

// crown : Crown Equipment Corporation
// https://www.iana.org/domains/root/db/crown.html
crown

// crs : Federated Co-operatives Limited
// https://www.iana.org/domains/root/db/crs.html
crs

// cruise : Viking River Cruises (Bermuda) Ltd.
// https://www.iana.org/domains/root/db/cruise.html
cruise

// cruises : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cruises.html
cruises

// cuisinella : SCHMIDT GROUPE S.A.S.
// https://www.iana.org/domains/root/db/cuisinella.html
cuisinella

// cymru : Nominet UK
// https://www.iana.org/domains/root/db/cymru.html
cymru

// cyou : ShortDot SA
// https://www.iana.org/domains/root/db/cyou.html
cyou

// dabur : Dabur India Limited
// https://www.iana.org/domains/root/db/dabur.html
dabur

// dad : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/dad.html
dad

// dance : Dog Beach, LLC
// https://www.iana.org/domains/root/db/dance.html
dance

// data : Dish DBS Corporation
// https://www.iana.org/domains/root/db/data.html
data

// date : dot Date Limited
// https://www.iana.org/domains/root/db/date.html
date

// dating : Binky Moon, LLC
// https://www.iana.org/domains/root/db/dating.html
dating

// datsun : NISSAN MOTOR CO., LTD.
// https://www.iana.org/domains/root/db/datsun.html
datsun

// day : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/day.html
day

// dclk : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/dclk.html
dclk

// dds : Registry Services, LLC
// https://www.iana.org/domains/root/db/dds.html
dds

// deal : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/deal.html
deal

// dealer : Intercap Registry Inc.
// https://www.iana.org/domains/root/db/dealer.html
dealer

// deals : Binky Moon, LLC
// https://www.iana.org/domains/root/db/deals.html
deals

// degree : Dog Beach, LLC
// https://www.iana.org/domains/root/db/degree.html
degree

// delivery : Binky Moon, LLC
// https://www.iana.org/domains/root/db/delivery.html
delivery

// dell : Dell Inc.
// https://www.iana.org/domains/root/db/dell.html
dell

// deloitte : Deloitte Touche Tohmatsu
// https://www.iana.org/domains/root/db/deloitte.html
deloitte

// delta : Delta Air Lines, Inc.
// https://www.iana.org/domains/root/db/delta.html
delta

// democrat : Dog Beach, LLC
// https://www.iana.org/domains/root/db/democrat.html
democrat

// dental : Binky Moon, LLC
// https://www.iana.org/domains/root/db/dental.html
dental

// dentist : Dog Beach, LLC
// https://www.iana.org/domains/root/db/dentist.html
dentist

// desi : Desi Networks LLC
// https://www.iana.org/domains/root/db/desi.html
desi

// design : Registry Services, LLC
// https://www.iana.org/domains/root/db/design.html
design

// dev : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/dev.html
dev

// dhl : Deutsche Post AG
// https://www.iana.org/domains/root/db/dhl.html
dhl

// diamonds : Binky Moon, LLC
// https://www.iana.org/domains/root/db/diamonds.html
diamonds

// diet : XYZ.COM LLC
// https://www.iana.org/domains/root/db/diet.html
diet

// digital : Binky Moon, LLC
// https://www.iana.org/domains/root/db/digital.html
digital

// direct : Binky Moon, LLC
// https://www.iana.org/domains/root/db/direct.html
direct

// directory : Binky Moon, LLC
// https://www.iana.org/domains/root/db/directory.html
directory

// discount : Binky Moon, LLC
// https://www.iana.org/domains/root/db/discount.html
discount

// discover : Discover Financial Services
// https://www.iana.org/domains/root/db/discover.html
discover

// dish : Dish DBS Corporation
// https://www.iana.org/domains/root/db/dish.html
dish

// diy : Lifestyle Domain Holdings, Inc.
// https://www.iana.org/domains/root/db/diy.html
diy

// dnp : Dai Nippon Printing Co., Ltd.
// https://www.iana.org/domains/root/db/dnp.html
dnp

// docs : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/docs.html
docs

// doctor : Binky Moon, LLC
// https://www.iana.org/domains/root/db/doctor.html
doctor

// dog : Binky Moon, LLC
// https://www.iana.org/domains/root/db/dog.html
dog

// domains : Binky Moon, LLC
// https://www.iana.org/domains/root/db/domains.html
domains

// dot : Dish DBS Corporation
// https://www.iana.org/domains/root/db/dot.html
dot

// download : dot Support Limited
// https://www.iana.org/domains/root/db/download.html
download

// drive : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/drive.html
drive

// dtv : Dish DBS Corporation
// https://www.iana.org/domains/root/db/dtv.html
dtv

// dubai : Dubai Smart Government Department
// https://www.iana.org/domains/root/db/dubai.html
dubai

// dunlop : The Goodyear Tire & Rubber Company
// https://www.iana.org/domains/root/db/dunlop.html
dunlop

// dupont : DuPont Specialty Products USA, LLC
// https://www.iana.org/domains/root/db/dupont.html
dupont

// durban : ZA Central Registry NPC trading as ZA Central Registry
// https://www.iana.org/domains/root/db/durban.html
durban

// dvag : Deutsche Verm\xF6gensberatung Aktiengesellschaft DVAG
// https://www.iana.org/domains/root/db/dvag.html
dvag

// dvr : DISH Technologies L.L.C.
// https://www.iana.org/domains/root/db/dvr.html
dvr

// earth : Interlink Systems Innovation Institute K.K.
// https://www.iana.org/domains/root/db/earth.html
earth

// eat : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/eat.html
eat

// eco : Big Room Inc.
// https://www.iana.org/domains/root/db/eco.html
eco

// edeka : EDEKA Verband kaufm\xE4nnischer Genossenschaften e.V.
// https://www.iana.org/domains/root/db/edeka.html
edeka

// education : Binky Moon, LLC
// https://www.iana.org/domains/root/db/education.html
education

// email : Binky Moon, LLC
// https://www.iana.org/domains/root/db/email.html
email

// emerck : Merck KGaA
// https://www.iana.org/domains/root/db/emerck.html
emerck

// energy : Binky Moon, LLC
// https://www.iana.org/domains/root/db/energy.html
energy

// engineer : Dog Beach, LLC
// https://www.iana.org/domains/root/db/engineer.html
engineer

// engineering : Binky Moon, LLC
// https://www.iana.org/domains/root/db/engineering.html
engineering

// enterprises : Binky Moon, LLC
// https://www.iana.org/domains/root/db/enterprises.html
enterprises

// epson : Seiko Epson Corporation
// https://www.iana.org/domains/root/db/epson.html
epson

// equipment : Binky Moon, LLC
// https://www.iana.org/domains/root/db/equipment.html
equipment

// ericsson : Telefonaktiebolaget L M Ericsson
// https://www.iana.org/domains/root/db/ericsson.html
ericsson

// erni : ERNI Group Holding AG
// https://www.iana.org/domains/root/db/erni.html
erni

// esq : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/esq.html
esq

// estate : Binky Moon, LLC
// https://www.iana.org/domains/root/db/estate.html
estate

// etisalat : Emirates Telecommunications Corporation (trading as Etisalat)
// https://www.iana.org/domains/root/db/etisalat.html
etisalat

// eurovision : European Broadcasting Union (EBU)
// https://www.iana.org/domains/root/db/eurovision.html
eurovision

// eus : Puntueus Fundazioa
// https://www.iana.org/domains/root/db/eus.html
eus

// events : Binky Moon, LLC
// https://www.iana.org/domains/root/db/events.html
events

// exchange : Binky Moon, LLC
// https://www.iana.org/domains/root/db/exchange.html
exchange

// expert : Binky Moon, LLC
// https://www.iana.org/domains/root/db/expert.html
expert

// exposed : Binky Moon, LLC
// https://www.iana.org/domains/root/db/exposed.html
exposed

// express : Binky Moon, LLC
// https://www.iana.org/domains/root/db/express.html
express

// extraspace : Extra Space Storage LLC
// https://www.iana.org/domains/root/db/extraspace.html
extraspace

// fage : Fage International S.A.
// https://www.iana.org/domains/root/db/fage.html
fage

// fail : Binky Moon, LLC
// https://www.iana.org/domains/root/db/fail.html
fail

// fairwinds : FairWinds Partners, LLC
// https://www.iana.org/domains/root/db/fairwinds.html
fairwinds

// faith : dot Faith Limited
// https://www.iana.org/domains/root/db/faith.html
faith

// family : Dog Beach, LLC
// https://www.iana.org/domains/root/db/family.html
family

// fan : Dog Beach, LLC
// https://www.iana.org/domains/root/db/fan.html
fan

// fans : ZDNS International Limited
// https://www.iana.org/domains/root/db/fans.html
fans

// farm : Binky Moon, LLC
// https://www.iana.org/domains/root/db/farm.html
farm

// farmers : Farmers Insurance Exchange
// https://www.iana.org/domains/root/db/farmers.html
farmers

// fashion : Registry Services, LLC
// https://www.iana.org/domains/root/db/fashion.html
fashion

// fast : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/fast.html
fast

// fedex : Federal Express Corporation
// https://www.iana.org/domains/root/db/fedex.html
fedex

// feedback : Top Level Spectrum, Inc.
// https://www.iana.org/domains/root/db/feedback.html
feedback

// ferrari : Fiat Chrysler Automobiles N.V.
// https://www.iana.org/domains/root/db/ferrari.html
ferrari

// ferrero : Ferrero Trading Lux S.A.
// https://www.iana.org/domains/root/db/ferrero.html
ferrero

// fidelity : Fidelity Brokerage Services LLC
// https://www.iana.org/domains/root/db/fidelity.html
fidelity

// fido : Rogers Communications Canada Inc.
// https://www.iana.org/domains/root/db/fido.html
fido

// film : Motion Picture Domain Registry Pty Ltd
// https://www.iana.org/domains/root/db/film.html
film

// final : N\xFAcleo de Informa\xE7\xE3o e Coordena\xE7\xE3o do Ponto BR - NIC.br
// https://www.iana.org/domains/root/db/final.html
final

// finance : Binky Moon, LLC
// https://www.iana.org/domains/root/db/finance.html
finance

// financial : Binky Moon, LLC
// https://www.iana.org/domains/root/db/financial.html
financial

// fire : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/fire.html
fire

// firestone : Bridgestone Licensing Services, Inc
// https://www.iana.org/domains/root/db/firestone.html
firestone

// firmdale : Firmdale Holdings Limited
// https://www.iana.org/domains/root/db/firmdale.html
firmdale

// fish : Binky Moon, LLC
// https://www.iana.org/domains/root/db/fish.html
fish

// fishing : Registry Services, LLC
// https://www.iana.org/domains/root/db/fishing.html
fishing

// fit : Registry Services, LLC
// https://www.iana.org/domains/root/db/fit.html
fit

// fitness : Binky Moon, LLC
// https://www.iana.org/domains/root/db/fitness.html
fitness

// flickr : Flickr, Inc.
// https://www.iana.org/domains/root/db/flickr.html
flickr

// flights : Binky Moon, LLC
// https://www.iana.org/domains/root/db/flights.html
flights

// flir : FLIR Systems, Inc.
// https://www.iana.org/domains/root/db/flir.html
flir

// florist : Binky Moon, LLC
// https://www.iana.org/domains/root/db/florist.html
florist

// flowers : XYZ.COM LLC
// https://www.iana.org/domains/root/db/flowers.html
flowers

// fly : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/fly.html
fly

// foo : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/foo.html
foo

// food : Lifestyle Domain Holdings, Inc.
// https://www.iana.org/domains/root/db/food.html
food

// football : Binky Moon, LLC
// https://www.iana.org/domains/root/db/football.html
football

// ford : Ford Motor Company
// https://www.iana.org/domains/root/db/ford.html
ford

// forex : Dog Beach, LLC
// https://www.iana.org/domains/root/db/forex.html
forex

// forsale : Dog Beach, LLC
// https://www.iana.org/domains/root/db/forsale.html
forsale

// forum : Fegistry, LLC
// https://www.iana.org/domains/root/db/forum.html
forum

// foundation : Public Interest Registry
// https://www.iana.org/domains/root/db/foundation.html
foundation

// fox : FOX Registry, LLC
// https://www.iana.org/domains/root/db/fox.html
fox

// free : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/free.html
free

// fresenius : Fresenius Immobilien-Verwaltungs-GmbH
// https://www.iana.org/domains/root/db/fresenius.html
fresenius

// frl : FRLregistry B.V.
// https://www.iana.org/domains/root/db/frl.html
frl

// frogans : OP3FT
// https://www.iana.org/domains/root/db/frogans.html
frogans

// frontier : Frontier Communications Corporation
// https://www.iana.org/domains/root/db/frontier.html
frontier

// ftr : Frontier Communications Corporation
// https://www.iana.org/domains/root/db/ftr.html
ftr

// fujitsu : Fujitsu Limited
// https://www.iana.org/domains/root/db/fujitsu.html
fujitsu

// fun : Radix FZC DMCC
// https://www.iana.org/domains/root/db/fun.html
fun

// fund : Binky Moon, LLC
// https://www.iana.org/domains/root/db/fund.html
fund

// furniture : Binky Moon, LLC
// https://www.iana.org/domains/root/db/furniture.html
furniture

// futbol : Dog Beach, LLC
// https://www.iana.org/domains/root/db/futbol.html
futbol

// fyi : Binky Moon, LLC
// https://www.iana.org/domains/root/db/fyi.html
fyi

// gal : Asociaci\xF3n puntoGAL
// https://www.iana.org/domains/root/db/gal.html
gal

// gallery : Binky Moon, LLC
// https://www.iana.org/domains/root/db/gallery.html
gallery

// gallo : Gallo Vineyards, Inc.
// https://www.iana.org/domains/root/db/gallo.html
gallo

// gallup : Gallup, Inc.
// https://www.iana.org/domains/root/db/gallup.html
gallup

// game : XYZ.COM LLC
// https://www.iana.org/domains/root/db/game.html
game

// games : Dog Beach, LLC
// https://www.iana.org/domains/root/db/games.html
games

// gap : The Gap, Inc.
// https://www.iana.org/domains/root/db/gap.html
gap

// garden : Registry Services, LLC
// https://www.iana.org/domains/root/db/garden.html
garden

// gay : Registry Services, LLC
// https://www.iana.org/domains/root/db/gay.html
gay

// gbiz : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/gbiz.html
gbiz

// gdn : Joint Stock Company "Navigation-information systems"
// https://www.iana.org/domains/root/db/gdn.html
gdn

// gea : GEA Group Aktiengesellschaft
// https://www.iana.org/domains/root/db/gea.html
gea

// gent : Easyhost BV
// https://www.iana.org/domains/root/db/gent.html
gent

// genting : Resorts World Inc Pte. Ltd.
// https://www.iana.org/domains/root/db/genting.html
genting

// george : Wal-Mart Stores, Inc.
// https://www.iana.org/domains/root/db/george.html
george

// ggee : GMO Internet, Inc.
// https://www.iana.org/domains/root/db/ggee.html
ggee

// gift : DotGift, LLC
// https://www.iana.org/domains/root/db/gift.html
gift

// gifts : Binky Moon, LLC
// https://www.iana.org/domains/root/db/gifts.html
gifts

// gives : Public Interest Registry
// https://www.iana.org/domains/root/db/gives.html
gives

// giving : Public Interest Registry
// https://www.iana.org/domains/root/db/giving.html
giving

// glass : Binky Moon, LLC
// https://www.iana.org/domains/root/db/glass.html
glass

// gle : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/gle.html
gle

// global : Identity Digital Limited
// https://www.iana.org/domains/root/db/global.html
global

// globo : Globo Comunica\xE7\xE3o e Participa\xE7\xF5es S.A
// https://www.iana.org/domains/root/db/globo.html
globo

// gmail : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/gmail.html
gmail

// gmbh : Binky Moon, LLC
// https://www.iana.org/domains/root/db/gmbh.html
gmbh

// gmo : GMO Internet, Inc.
// https://www.iana.org/domains/root/db/gmo.html
gmo

// gmx : 1&1 Mail & Media GmbH
// https://www.iana.org/domains/root/db/gmx.html
gmx

// godaddy : Go Daddy East, LLC
// https://www.iana.org/domains/root/db/godaddy.html
godaddy

// gold : Binky Moon, LLC
// https://www.iana.org/domains/root/db/gold.html
gold

// goldpoint : YODOBASHI CAMERA CO.,LTD.
// https://www.iana.org/domains/root/db/goldpoint.html
goldpoint

// golf : Binky Moon, LLC
// https://www.iana.org/domains/root/db/golf.html
golf

// goo : NTT Resonant Inc.
// https://www.iana.org/domains/root/db/goo.html
goo

// goodyear : The Goodyear Tire & Rubber Company
// https://www.iana.org/domains/root/db/goodyear.html
goodyear

// goog : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/goog.html
goog

// google : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/google.html
google

// gop : Republican State Leadership Committee, Inc.
// https://www.iana.org/domains/root/db/gop.html
gop

// got : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/got.html
got

// grainger : Grainger Registry Services, LLC
// https://www.iana.org/domains/root/db/grainger.html
grainger

// graphics : Binky Moon, LLC
// https://www.iana.org/domains/root/db/graphics.html
graphics

// gratis : Binky Moon, LLC
// https://www.iana.org/domains/root/db/gratis.html
gratis

// green : Identity Digital Limited
// https://www.iana.org/domains/root/db/green.html
green

// gripe : Binky Moon, LLC
// https://www.iana.org/domains/root/db/gripe.html
gripe

// grocery : Wal-Mart Stores, Inc.
// https://www.iana.org/domains/root/db/grocery.html
grocery

// group : Binky Moon, LLC
// https://www.iana.org/domains/root/db/group.html
group

// guardian : The Guardian Life Insurance Company of America
// https://www.iana.org/domains/root/db/guardian.html
guardian

// gucci : Guccio Gucci S.p.a.
// https://www.iana.org/domains/root/db/gucci.html
gucci

// guge : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/guge.html
guge

// guide : Binky Moon, LLC
// https://www.iana.org/domains/root/db/guide.html
guide

// guitars : XYZ.COM LLC
// https://www.iana.org/domains/root/db/guitars.html
guitars

// guru : Binky Moon, LLC
// https://www.iana.org/domains/root/db/guru.html
guru

// hair : XYZ.COM LLC
// https://www.iana.org/domains/root/db/hair.html
hair

// hamburg : Hamburg Top-Level-Domain GmbH
// https://www.iana.org/domains/root/db/hamburg.html
hamburg

// hangout : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/hangout.html
hangout

// haus : Dog Beach, LLC
// https://www.iana.org/domains/root/db/haus.html
haus

// hbo : HBO Registry Services, Inc.
// https://www.iana.org/domains/root/db/hbo.html
hbo

// hdfc : HOUSING DEVELOPMENT FINANCE CORPORATION LIMITED
// https://www.iana.org/domains/root/db/hdfc.html
hdfc

// hdfcbank : HDFC Bank Limited
// https://www.iana.org/domains/root/db/hdfcbank.html
hdfcbank

// health : Registry Services, LLC
// https://www.iana.org/domains/root/db/health.html
health

// healthcare : Binky Moon, LLC
// https://www.iana.org/domains/root/db/healthcare.html
healthcare

// help : Innovation service Limited
// https://www.iana.org/domains/root/db/help.html
help

// helsinki : City of Helsinki
// https://www.iana.org/domains/root/db/helsinki.html
helsinki

// here : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/here.html
here

// hermes : HERMES INTERNATIONAL
// https://www.iana.org/domains/root/db/hermes.html
hermes

// hiphop : Dot Hip Hop, LLC
// https://www.iana.org/domains/root/db/hiphop.html
hiphop

// hisamitsu : Hisamitsu Pharmaceutical Co.,Inc.
// https://www.iana.org/domains/root/db/hisamitsu.html
hisamitsu

// hitachi : Hitachi, Ltd.
// https://www.iana.org/domains/root/db/hitachi.html
hitachi

// hiv : Internet Naming Company LLC
// https://www.iana.org/domains/root/db/hiv.html
hiv

// hkt : PCCW-HKT DataCom Services Limited
// https://www.iana.org/domains/root/db/hkt.html
hkt

// hockey : Binky Moon, LLC
// https://www.iana.org/domains/root/db/hockey.html
hockey

// holdings : Binky Moon, LLC
// https://www.iana.org/domains/root/db/holdings.html
holdings

// holiday : Binky Moon, LLC
// https://www.iana.org/domains/root/db/holiday.html
holiday

// homedepot : Home Depot Product Authority, LLC
// https://www.iana.org/domains/root/db/homedepot.html
homedepot

// homegoods : The TJX Companies, Inc.
// https://www.iana.org/domains/root/db/homegoods.html
homegoods

// homes : XYZ.COM LLC
// https://www.iana.org/domains/root/db/homes.html
homes

// homesense : The TJX Companies, Inc.
// https://www.iana.org/domains/root/db/homesense.html
homesense

// honda : Honda Motor Co., Ltd.
// https://www.iana.org/domains/root/db/honda.html
honda

// horse : Registry Services, LLC
// https://www.iana.org/domains/root/db/horse.html
horse

// hospital : Binky Moon, LLC
// https://www.iana.org/domains/root/db/hospital.html
hospital

// host : Radix FZC DMCC
// https://www.iana.org/domains/root/db/host.html
host

// hosting : XYZ.COM LLC
// https://www.iana.org/domains/root/db/hosting.html
hosting

// hot : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/hot.html
hot

// hotels : Booking.com B.V.
// https://www.iana.org/domains/root/db/hotels.html
hotels

// hotmail : Microsoft Corporation
// https://www.iana.org/domains/root/db/hotmail.html
hotmail

// house : Binky Moon, LLC
// https://www.iana.org/domains/root/db/house.html
house

// how : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/how.html
how

// hsbc : HSBC Global Services (UK) Limited
// https://www.iana.org/domains/root/db/hsbc.html
hsbc

// hughes : Hughes Satellite Systems Corporation
// https://www.iana.org/domains/root/db/hughes.html
hughes

// hyatt : Hyatt GTLD, L.L.C.
// https://www.iana.org/domains/root/db/hyatt.html
hyatt

// hyundai : Hyundai Motor Company
// https://www.iana.org/domains/root/db/hyundai.html
hyundai

// ibm : International Business Machines Corporation
// https://www.iana.org/domains/root/db/ibm.html
ibm

// icbc : Industrial and Commercial Bank of China Limited
// https://www.iana.org/domains/root/db/icbc.html
icbc

// ice : IntercontinentalExchange, Inc.
// https://www.iana.org/domains/root/db/ice.html
ice

// icu : ShortDot SA
// https://www.iana.org/domains/root/db/icu.html
icu

// ieee : IEEE Global LLC
// https://www.iana.org/domains/root/db/ieee.html
ieee

// ifm : ifm electronic gmbh
// https://www.iana.org/domains/root/db/ifm.html
ifm

// ikano : Ikano S.A.
// https://www.iana.org/domains/root/db/ikano.html
ikano

// imamat : Fondation Aga Khan (Aga Khan Foundation)
// https://www.iana.org/domains/root/db/imamat.html
imamat

// imdb : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/imdb.html
imdb

// immo : Binky Moon, LLC
// https://www.iana.org/domains/root/db/immo.html
immo

// immobilien : Dog Beach, LLC
// https://www.iana.org/domains/root/db/immobilien.html
immobilien

// inc : Intercap Registry Inc.
// https://www.iana.org/domains/root/db/inc.html
inc

// industries : Binky Moon, LLC
// https://www.iana.org/domains/root/db/industries.html
industries

// infiniti : NISSAN MOTOR CO., LTD.
// https://www.iana.org/domains/root/db/infiniti.html
infiniti

// ing : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/ing.html
ing

// ink : Registry Services, LLC
// https://www.iana.org/domains/root/db/ink.html
ink

// institute : Binky Moon, LLC
// https://www.iana.org/domains/root/db/institute.html
institute

// insurance : fTLD Registry Services LLC
// https://www.iana.org/domains/root/db/insurance.html
insurance

// insure : Binky Moon, LLC
// https://www.iana.org/domains/root/db/insure.html
insure

// international : Binky Moon, LLC
// https://www.iana.org/domains/root/db/international.html
international

// intuit : Intuit Administrative Services, Inc.
// https://www.iana.org/domains/root/db/intuit.html
intuit

// investments : Binky Moon, LLC
// https://www.iana.org/domains/root/db/investments.html
investments

// ipiranga : Ipiranga Produtos de Petroleo S.A.
// https://www.iana.org/domains/root/db/ipiranga.html
ipiranga

// irish : Binky Moon, LLC
// https://www.iana.org/domains/root/db/irish.html
irish

// ismaili : Fondation Aga Khan (Aga Khan Foundation)
// https://www.iana.org/domains/root/db/ismaili.html
ismaili

// ist : Istanbul Metropolitan Municipality
// https://www.iana.org/domains/root/db/ist.html
ist

// istanbul : Istanbul Metropolitan Municipality
// https://www.iana.org/domains/root/db/istanbul.html
istanbul

// itau : Itau Unibanco Holding S.A.
// https://www.iana.org/domains/root/db/itau.html
itau

// itv : ITV Services Limited
// https://www.iana.org/domains/root/db/itv.html
itv

// jaguar : Jaguar Land Rover Ltd
// https://www.iana.org/domains/root/db/jaguar.html
jaguar

// java : Oracle Corporation
// https://www.iana.org/domains/root/db/java.html
java

// jcb : JCB Co., Ltd.
// https://www.iana.org/domains/root/db/jcb.html
jcb

// jeep : FCA US LLC.
// https://www.iana.org/domains/root/db/jeep.html
jeep

// jetzt : Binky Moon, LLC
// https://www.iana.org/domains/root/db/jetzt.html
jetzt

// jewelry : Binky Moon, LLC
// https://www.iana.org/domains/root/db/jewelry.html
jewelry

// jio : Reliance Industries Limited
// https://www.iana.org/domains/root/db/jio.html
jio

// jll : Jones Lang LaSalle Incorporated
// https://www.iana.org/domains/root/db/jll.html
jll

// jmp : Matrix IP LLC
// https://www.iana.org/domains/root/db/jmp.html
jmp

// jnj : Johnson & Johnson Services, Inc.
// https://www.iana.org/domains/root/db/jnj.html
jnj

// joburg : ZA Central Registry NPC trading as ZA Central Registry
// https://www.iana.org/domains/root/db/joburg.html
joburg

// jot : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/jot.html
jot

// joy : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/joy.html
joy

// jpmorgan : JPMorgan Chase Bank, National Association
// https://www.iana.org/domains/root/db/jpmorgan.html
jpmorgan

// jprs : Japan Registry Services Co., Ltd.
// https://www.iana.org/domains/root/db/jprs.html
jprs

// juegos : Internet Naming Company LLC
// https://www.iana.org/domains/root/db/juegos.html
juegos

// juniper : JUNIPER NETWORKS, INC.
// https://www.iana.org/domains/root/db/juniper.html
juniper

// kaufen : Dog Beach, LLC
// https://www.iana.org/domains/root/db/kaufen.html
kaufen

// kddi : KDDI CORPORATION
// https://www.iana.org/domains/root/db/kddi.html
kddi

// kerryhotels : Kerry Trading Co. Limited
// https://www.iana.org/domains/root/db/kerryhotels.html
kerryhotels

// kerrylogistics : Kerry Trading Co. Limited
// https://www.iana.org/domains/root/db/kerrylogistics.html
kerrylogistics

// kerryproperties : Kerry Trading Co. Limited
// https://www.iana.org/domains/root/db/kerryproperties.html
kerryproperties

// kfh : Kuwait Finance House
// https://www.iana.org/domains/root/db/kfh.html
kfh

// kia : KIA MOTORS CORPORATION
// https://www.iana.org/domains/root/db/kia.html
kia

// kids : DotKids Foundation Limited
// https://www.iana.org/domains/root/db/kids.html
kids

// kim : Identity Digital Limited
// https://www.iana.org/domains/root/db/kim.html
kim

// kinder : Ferrero Trading Lux S.A.
// https://www.iana.org/domains/root/db/kinder.html
kinder

// kindle : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/kindle.html
kindle

// kitchen : Binky Moon, LLC
// https://www.iana.org/domains/root/db/kitchen.html
kitchen

// kiwi : DOT KIWI LIMITED
// https://www.iana.org/domains/root/db/kiwi.html
kiwi

// koeln : dotKoeln GmbH
// https://www.iana.org/domains/root/db/koeln.html
koeln

// komatsu : Komatsu Ltd.
// https://www.iana.org/domains/root/db/komatsu.html
komatsu

// kosher : Kosher Marketing Assets LLC
// https://www.iana.org/domains/root/db/kosher.html
kosher

// kpmg : KPMG International Cooperative (KPMG International Genossenschaft)
// https://www.iana.org/domains/root/db/kpmg.html
kpmg

// kpn : Koninklijke KPN N.V.
// https://www.iana.org/domains/root/db/kpn.html
kpn

// krd : KRG Department of Information Technology
// https://www.iana.org/domains/root/db/krd.html
krd

// kred : KredTLD Pty Ltd
// https://www.iana.org/domains/root/db/kred.html
kred

// kuokgroup : Kerry Trading Co. Limited
// https://www.iana.org/domains/root/db/kuokgroup.html
kuokgroup

// kyoto : Academic Institution: Kyoto Jyoho Gakuen
// https://www.iana.org/domains/root/db/kyoto.html
kyoto

// lacaixa : Fundaci\xF3n Bancaria Caixa d\u2019Estalvis i Pensions de Barcelona, \u201Cla Caixa\u201D
// https://www.iana.org/domains/root/db/lacaixa.html
lacaixa

// lamborghini : Automobili Lamborghini S.p.A.
// https://www.iana.org/domains/root/db/lamborghini.html
lamborghini

// lamer : The Est\xE9e Lauder Companies Inc.
// https://www.iana.org/domains/root/db/lamer.html
lamer

// lancaster : LANCASTER
// https://www.iana.org/domains/root/db/lancaster.html
lancaster

// land : Binky Moon, LLC
// https://www.iana.org/domains/root/db/land.html
land

// landrover : Jaguar Land Rover Ltd
// https://www.iana.org/domains/root/db/landrover.html
landrover

// lanxess : LANXESS Corporation
// https://www.iana.org/domains/root/db/lanxess.html
lanxess

// lasalle : Jones Lang LaSalle Incorporated
// https://www.iana.org/domains/root/db/lasalle.html
lasalle

// lat : XYZ.COM LLC
// https://www.iana.org/domains/root/db/lat.html
lat

// latino : Dish DBS Corporation
// https://www.iana.org/domains/root/db/latino.html
latino

// latrobe : La Trobe University
// https://www.iana.org/domains/root/db/latrobe.html
latrobe

// law : Registry Services, LLC
// https://www.iana.org/domains/root/db/law.html
law

// lawyer : Dog Beach, LLC
// https://www.iana.org/domains/root/db/lawyer.html
lawyer

// lds : IRI Domain Management, LLC
// https://www.iana.org/domains/root/db/lds.html
lds

// lease : Binky Moon, LLC
// https://www.iana.org/domains/root/db/lease.html
lease

// leclerc : A.C.D. LEC Association des Centres Distributeurs Edouard Leclerc
// https://www.iana.org/domains/root/db/leclerc.html
leclerc

// lefrak : LeFrak Organization, Inc.
// https://www.iana.org/domains/root/db/lefrak.html
lefrak

// legal : Binky Moon, LLC
// https://www.iana.org/domains/root/db/legal.html
legal

// lego : LEGO Juris A/S
// https://www.iana.org/domains/root/db/lego.html
lego

// lexus : TOYOTA MOTOR CORPORATION
// https://www.iana.org/domains/root/db/lexus.html
lexus

// lgbt : Identity Digital Limited
// https://www.iana.org/domains/root/db/lgbt.html
lgbt

// lidl : Schwarz Domains und Services GmbH & Co. KG
// https://www.iana.org/domains/root/db/lidl.html
lidl

// life : Binky Moon, LLC
// https://www.iana.org/domains/root/db/life.html
life

// lifeinsurance : American Council of Life Insurers
// https://www.iana.org/domains/root/db/lifeinsurance.html
lifeinsurance

// lifestyle : Lifestyle Domain Holdings, Inc.
// https://www.iana.org/domains/root/db/lifestyle.html
lifestyle

// lighting : Binky Moon, LLC
// https://www.iana.org/domains/root/db/lighting.html
lighting

// like : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/like.html
like

// lilly : Eli Lilly and Company
// https://www.iana.org/domains/root/db/lilly.html
lilly

// limited : Binky Moon, LLC
// https://www.iana.org/domains/root/db/limited.html
limited

// limo : Binky Moon, LLC
// https://www.iana.org/domains/root/db/limo.html
limo

// lincoln : Ford Motor Company
// https://www.iana.org/domains/root/db/lincoln.html
lincoln

// link : Nova Registry Ltd
// https://www.iana.org/domains/root/db/link.html
link

// lipsy : Lipsy Ltd
// https://www.iana.org/domains/root/db/lipsy.html
lipsy

// live : Dog Beach, LLC
// https://www.iana.org/domains/root/db/live.html
live

// living : Lifestyle Domain Holdings, Inc.
// https://www.iana.org/domains/root/db/living.html
living

// llc : Identity Digital Limited
// https://www.iana.org/domains/root/db/llc.html
llc

// llp : Intercap Registry Inc.
// https://www.iana.org/domains/root/db/llp.html
llp

// loan : dot Loan Limited
// https://www.iana.org/domains/root/db/loan.html
loan

// loans : Binky Moon, LLC
// https://www.iana.org/domains/root/db/loans.html
loans

// locker : Orange Domains LLC
// https://www.iana.org/domains/root/db/locker.html
locker

// locus : Locus Analytics LLC
// https://www.iana.org/domains/root/db/locus.html
locus

// lol : XYZ.COM LLC
// https://www.iana.org/domains/root/db/lol.html
lol

// london : Dot London Domains Limited
// https://www.iana.org/domains/root/db/london.html
london

// lotte : Lotte Holdings Co., Ltd.
// https://www.iana.org/domains/root/db/lotte.html
lotte

// lotto : Identity Digital Limited
// https://www.iana.org/domains/root/db/lotto.html
lotto

// love : Merchant Law Group LLP
// https://www.iana.org/domains/root/db/love.html
love

// lpl : LPL Holdings, Inc.
// https://www.iana.org/domains/root/db/lpl.html
lpl

// lplfinancial : LPL Holdings, Inc.
// https://www.iana.org/domains/root/db/lplfinancial.html
lplfinancial

// ltd : Binky Moon, LLC
// https://www.iana.org/domains/root/db/ltd.html
ltd

// ltda : InterNetX, Corp
// https://www.iana.org/domains/root/db/ltda.html
ltda

// lundbeck : H. Lundbeck A/S
// https://www.iana.org/domains/root/db/lundbeck.html
lundbeck

// luxe : Registry Services, LLC
// https://www.iana.org/domains/root/db/luxe.html
luxe

// luxury : Luxury Partners, LLC
// https://www.iana.org/domains/root/db/luxury.html
luxury

// madrid : Comunidad de Madrid
// https://www.iana.org/domains/root/db/madrid.html
madrid

// maif : Mutuelle Assurance Instituteur France (MAIF)
// https://www.iana.org/domains/root/db/maif.html
maif

// maison : Binky Moon, LLC
// https://www.iana.org/domains/root/db/maison.html
maison

// makeup : XYZ.COM LLC
// https://www.iana.org/domains/root/db/makeup.html
makeup

// man : MAN SE
// https://www.iana.org/domains/root/db/man.html
man

// management : Binky Moon, LLC
// https://www.iana.org/domains/root/db/management.html
management

// mango : PUNTO FA S.L.
// https://www.iana.org/domains/root/db/mango.html
mango

// map : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/map.html
map

// market : Dog Beach, LLC
// https://www.iana.org/domains/root/db/market.html
market

// marketing : Binky Moon, LLC
// https://www.iana.org/domains/root/db/marketing.html
marketing

// markets : Dog Beach, LLC
// https://www.iana.org/domains/root/db/markets.html
markets

// marriott : Marriott Worldwide Corporation
// https://www.iana.org/domains/root/db/marriott.html
marriott

// marshalls : The TJX Companies, Inc.
// https://www.iana.org/domains/root/db/marshalls.html
marshalls

// mattel : Mattel Sites, Inc.
// https://www.iana.org/domains/root/db/mattel.html
mattel

// mba : Binky Moon, LLC
// https://www.iana.org/domains/root/db/mba.html
mba

// mckinsey : McKinsey Holdings, Inc.
// https://www.iana.org/domains/root/db/mckinsey.html
mckinsey

// med : Medistry LLC
// https://www.iana.org/domains/root/db/med.html
med

// media : Binky Moon, LLC
// https://www.iana.org/domains/root/db/media.html
media

// meet : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/meet.html
meet

// melbourne : The Crown in right of the State of Victoria, represented by its Department of State Development, Business and Innovation
// https://www.iana.org/domains/root/db/melbourne.html
melbourne

// meme : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/meme.html
meme

// memorial : Dog Beach, LLC
// https://www.iana.org/domains/root/db/memorial.html
memorial

// men : Exclusive Registry Limited
// https://www.iana.org/domains/root/db/men.html
men

// menu : Dot Menu Registry, LLC
// https://www.iana.org/domains/root/db/menu.html
menu

// merckmsd : MSD Registry Holdings, Inc.
// https://www.iana.org/domains/root/db/merckmsd.html
merckmsd

// miami : Registry Services, LLC
// https://www.iana.org/domains/root/db/miami.html
miami

// microsoft : Microsoft Corporation
// https://www.iana.org/domains/root/db/microsoft.html
microsoft

// mini : Bayerische Motoren Werke Aktiengesellschaft
// https://www.iana.org/domains/root/db/mini.html
mini

// mint : Intuit Administrative Services, Inc.
// https://www.iana.org/domains/root/db/mint.html
mint

// mit : Massachusetts Institute of Technology
// https://www.iana.org/domains/root/db/mit.html
mit

// mitsubishi : Mitsubishi Corporation
// https://www.iana.org/domains/root/db/mitsubishi.html
mitsubishi

// mlb : MLB Advanced Media DH, LLC
// https://www.iana.org/domains/root/db/mlb.html
mlb

// mls : The Canadian Real Estate Association
// https://www.iana.org/domains/root/db/mls.html
mls

// mma : MMA IARD
// https://www.iana.org/domains/root/db/mma.html
mma

// mobile : Dish DBS Corporation
// https://www.iana.org/domains/root/db/mobile.html
mobile

// moda : Dog Beach, LLC
// https://www.iana.org/domains/root/db/moda.html
moda

// moe : Interlink Systems Innovation Institute K.K.
// https://www.iana.org/domains/root/db/moe.html
moe

// moi : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/moi.html
moi

// mom : XYZ.COM LLC
// https://www.iana.org/domains/root/db/mom.html
mom

// monash : Monash University
// https://www.iana.org/domains/root/db/monash.html
monash

// money : Binky Moon, LLC
// https://www.iana.org/domains/root/db/money.html
money

// monster : XYZ.COM LLC
// https://www.iana.org/domains/root/db/monster.html
monster

// mormon : IRI Domain Management, LLC
// https://www.iana.org/domains/root/db/mormon.html
mormon

// mortgage : Dog Beach, LLC
// https://www.iana.org/domains/root/db/mortgage.html
mortgage

// moscow : Foundation for Assistance for Internet Technologies and Infrastructure Development (FAITID)
// https://www.iana.org/domains/root/db/moscow.html
moscow

// moto : Motorola Trademark Holdings, LLC
// https://www.iana.org/domains/root/db/moto.html
moto

// motorcycles : XYZ.COM LLC
// https://www.iana.org/domains/root/db/motorcycles.html
motorcycles

// mov : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/mov.html
mov

// movie : Binky Moon, LLC
// https://www.iana.org/domains/root/db/movie.html
movie

// msd : MSD Registry Holdings, Inc.
// https://www.iana.org/domains/root/db/msd.html
msd

// mtn : MTN Dubai Limited
// https://www.iana.org/domains/root/db/mtn.html
mtn

// mtr : MTR Corporation Limited
// https://www.iana.org/domains/root/db/mtr.html
mtr

// music : DotMusic Limited
// https://www.iana.org/domains/root/db/music.html
music

// nab : National Australia Bank Limited
// https://www.iana.org/domains/root/db/nab.html
nab

// nagoya : GMO Registry, Inc.
// https://www.iana.org/domains/root/db/nagoya.html
nagoya

// natura : NATURA COSM\xC9TICOS S.A.
// https://www.iana.org/domains/root/db/natura.html
natura

// navy : Dog Beach, LLC
// https://www.iana.org/domains/root/db/navy.html
navy

// nba : NBA REGISTRY, LLC
// https://www.iana.org/domains/root/db/nba.html
nba

// nec : NEC Corporation
// https://www.iana.org/domains/root/db/nec.html
nec

// netbank : COMMONWEALTH BANK OF AUSTRALIA
// https://www.iana.org/domains/root/db/netbank.html
netbank

// netflix : Netflix, Inc.
// https://www.iana.org/domains/root/db/netflix.html
netflix

// network : Binky Moon, LLC
// https://www.iana.org/domains/root/db/network.html
network

// neustar : NeuStar, Inc.
// https://www.iana.org/domains/root/db/neustar.html
neustar

// new : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/new.html
new

// news : Dog Beach, LLC
// https://www.iana.org/domains/root/db/news.html
news

// next : Next plc
// https://www.iana.org/domains/root/db/next.html
next

// nextdirect : Next plc
// https://www.iana.org/domains/root/db/nextdirect.html
nextdirect

// nexus : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/nexus.html
nexus

// nfl : NFL Reg Ops LLC
// https://www.iana.org/domains/root/db/nfl.html
nfl

// ngo : Public Interest Registry
// https://www.iana.org/domains/root/db/ngo.html
ngo

// nhk : Japan Broadcasting Corporation (NHK)
// https://www.iana.org/domains/root/db/nhk.html
nhk

// nico : DWANGO Co., Ltd.
// https://www.iana.org/domains/root/db/nico.html
nico

// nike : NIKE, Inc.
// https://www.iana.org/domains/root/db/nike.html
nike

// nikon : NIKON CORPORATION
// https://www.iana.org/domains/root/db/nikon.html
nikon

// ninja : Dog Beach, LLC
// https://www.iana.org/domains/root/db/ninja.html
ninja

// nissan : NISSAN MOTOR CO., LTD.
// https://www.iana.org/domains/root/db/nissan.html
nissan

// nissay : Nippon Life Insurance Company
// https://www.iana.org/domains/root/db/nissay.html
nissay

// nokia : Nokia Corporation
// https://www.iana.org/domains/root/db/nokia.html
nokia

// norton : NortonLifeLock Inc.
// https://www.iana.org/domains/root/db/norton.html
norton

// now : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/now.html
now

// nowruz : Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
// https://www.iana.org/domains/root/db/nowruz.html
nowruz

// nowtv : Starbucks (HK) Limited
// https://www.iana.org/domains/root/db/nowtv.html
nowtv

// nra : NRA Holdings Company, INC.
// https://www.iana.org/domains/root/db/nra.html
nra

// nrw : Minds + Machines GmbH
// https://www.iana.org/domains/root/db/nrw.html
nrw

// ntt : NIPPON TELEGRAPH AND TELEPHONE CORPORATION
// https://www.iana.org/domains/root/db/ntt.html
ntt

// nyc : The City of New York by and through the New York City Department of Information Technology & Telecommunications
// https://www.iana.org/domains/root/db/nyc.html
nyc

// obi : OBI Group Holding SE & Co. KGaA
// https://www.iana.org/domains/root/db/obi.html
obi

// observer : Fegistry, LLC
// https://www.iana.org/domains/root/db/observer.html
observer

// office : Microsoft Corporation
// https://www.iana.org/domains/root/db/office.html
office

// okinawa : BRregistry, Inc.
// https://www.iana.org/domains/root/db/okinawa.html
okinawa

// olayan : Competrol (Luxembourg) Sarl
// https://www.iana.org/domains/root/db/olayan.html
olayan

// olayangroup : Competrol (Luxembourg) Sarl
// https://www.iana.org/domains/root/db/olayangroup.html
olayangroup

// oldnavy : The Gap, Inc.
// https://www.iana.org/domains/root/db/oldnavy.html
oldnavy

// ollo : Dish DBS Corporation
// https://www.iana.org/domains/root/db/ollo.html
ollo

// omega : The Swatch Group Ltd
// https://www.iana.org/domains/root/db/omega.html
omega

// one : One.com A/S
// https://www.iana.org/domains/root/db/one.html
one

// ong : Public Interest Registry
// https://www.iana.org/domains/root/db/ong.html
ong

// onl : iRegistry GmbH
// https://www.iana.org/domains/root/db/onl.html
onl

// online : Radix FZC DMCC
// https://www.iana.org/domains/root/db/online.html
online

// ooo : INFIBEAM AVENUES LIMITED
// https://www.iana.org/domains/root/db/ooo.html
ooo

// open : American Express Travel Related Services Company, Inc.
// https://www.iana.org/domains/root/db/open.html
open

// oracle : Oracle Corporation
// https://www.iana.org/domains/root/db/oracle.html
oracle

// orange : Orange Brand Services Limited
// https://www.iana.org/domains/root/db/orange.html
orange

// organic : Identity Digital Limited
// https://www.iana.org/domains/root/db/organic.html
organic

// origins : The Est\xE9e Lauder Companies Inc.
// https://www.iana.org/domains/root/db/origins.html
origins

// osaka : Osaka Registry Co., Ltd.
// https://www.iana.org/domains/root/db/osaka.html
osaka

// otsuka : Otsuka Holdings Co., Ltd.
// https://www.iana.org/domains/root/db/otsuka.html
otsuka

// ott : Dish DBS Corporation
// https://www.iana.org/domains/root/db/ott.html
ott

// ovh : M\xE9diaBC
// https://www.iana.org/domains/root/db/ovh.html
ovh

// page : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/page.html
page

// panasonic : Panasonic Holdings Corporation
// https://www.iana.org/domains/root/db/panasonic.html
panasonic

// paris : City of Paris
// https://www.iana.org/domains/root/db/paris.html
paris

// pars : Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
// https://www.iana.org/domains/root/db/pars.html
pars

// partners : Binky Moon, LLC
// https://www.iana.org/domains/root/db/partners.html
partners

// parts : Binky Moon, LLC
// https://www.iana.org/domains/root/db/parts.html
parts

// party : Blue Sky Registry Limited
// https://www.iana.org/domains/root/db/party.html
party

// pay : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/pay.html
pay

// pccw : PCCW Enterprises Limited
// https://www.iana.org/domains/root/db/pccw.html
pccw

// pet : Identity Digital Limited
// https://www.iana.org/domains/root/db/pet.html
pet

// pfizer : Pfizer Inc.
// https://www.iana.org/domains/root/db/pfizer.html
pfizer

// pharmacy : National Association of Boards of Pharmacy
// https://www.iana.org/domains/root/db/pharmacy.html
pharmacy

// phd : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/phd.html
phd

// philips : Koninklijke Philips N.V.
// https://www.iana.org/domains/root/db/philips.html
philips

// phone : Dish DBS Corporation
// https://www.iana.org/domains/root/db/phone.html
phone

// photo : Registry Services, LLC
// https://www.iana.org/domains/root/db/photo.html
photo

// photography : Binky Moon, LLC
// https://www.iana.org/domains/root/db/photography.html
photography

// photos : Binky Moon, LLC
// https://www.iana.org/domains/root/db/photos.html
photos

// physio : PhysBiz Pty Ltd
// https://www.iana.org/domains/root/db/physio.html
physio

// pics : XYZ.COM LLC
// https://www.iana.org/domains/root/db/pics.html
pics

// pictet : Pictet Europe S.A.
// https://www.iana.org/domains/root/db/pictet.html
pictet

// pictures : Binky Moon, LLC
// https://www.iana.org/domains/root/db/pictures.html
pictures

// pid : Top Level Spectrum, Inc.
// https://www.iana.org/domains/root/db/pid.html
pid

// pin : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/pin.html
pin

// ping : Ping Registry Provider, Inc.
// https://www.iana.org/domains/root/db/ping.html
ping

// pink : Identity Digital Limited
// https://www.iana.org/domains/root/db/pink.html
pink

// pioneer : Pioneer Corporation
// https://www.iana.org/domains/root/db/pioneer.html
pioneer

// pizza : Binky Moon, LLC
// https://www.iana.org/domains/root/db/pizza.html
pizza

// place : Binky Moon, LLC
// https://www.iana.org/domains/root/db/place.html
place

// play : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/play.html
play

// playstation : Sony Interactive Entertainment Inc.
// https://www.iana.org/domains/root/db/playstation.html
playstation

// plumbing : Binky Moon, LLC
// https://www.iana.org/domains/root/db/plumbing.html
plumbing

// plus : Binky Moon, LLC
// https://www.iana.org/domains/root/db/plus.html
plus

// pnc : PNC Domain Co., LLC
// https://www.iana.org/domains/root/db/pnc.html
pnc

// pohl : Deutsche Verm\xF6gensberatung Aktiengesellschaft DVAG
// https://www.iana.org/domains/root/db/pohl.html
pohl

// poker : Identity Digital Limited
// https://www.iana.org/domains/root/db/poker.html
poker

// politie : Politie Nederland
// https://www.iana.org/domains/root/db/politie.html
politie

// porn : ICM Registry PN LLC
// https://www.iana.org/domains/root/db/porn.html
porn

// pramerica : Prudential Financial, Inc.
// https://www.iana.org/domains/root/db/pramerica.html
pramerica

// praxi : Praxi S.p.A.
// https://www.iana.org/domains/root/db/praxi.html
praxi

// press : Radix FZC DMCC
// https://www.iana.org/domains/root/db/press.html
press

// prime : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/prime.html
prime

// prod : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/prod.html
prod

// productions : Binky Moon, LLC
// https://www.iana.org/domains/root/db/productions.html
productions

// prof : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/prof.html
prof

// progressive : Progressive Casualty Insurance Company
// https://www.iana.org/domains/root/db/progressive.html
progressive

// promo : Identity Digital Limited
// https://www.iana.org/domains/root/db/promo.html
promo

// properties : Binky Moon, LLC
// https://www.iana.org/domains/root/db/properties.html
properties

// property : Digital Property Infrastructure Limited
// https://www.iana.org/domains/root/db/property.html
property

// protection : XYZ.COM LLC
// https://www.iana.org/domains/root/db/protection.html
protection

// pru : Prudential Financial, Inc.
// https://www.iana.org/domains/root/db/pru.html
pru

// prudential : Prudential Financial, Inc.
// https://www.iana.org/domains/root/db/prudential.html
prudential

// pub : Dog Beach, LLC
// https://www.iana.org/domains/root/db/pub.html
pub

// pwc : PricewaterhouseCoopers LLP
// https://www.iana.org/domains/root/db/pwc.html
pwc

// qpon : dotQPON LLC
// https://www.iana.org/domains/root/db/qpon.html
qpon

// quebec : PointQu\xE9bec Inc
// https://www.iana.org/domains/root/db/quebec.html
quebec

// quest : XYZ.COM LLC
// https://www.iana.org/domains/root/db/quest.html
quest

// racing : Premier Registry Limited
// https://www.iana.org/domains/root/db/racing.html
racing

// radio : European Broadcasting Union (EBU)
// https://www.iana.org/domains/root/db/radio.html
radio

// read : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/read.html
read

// realestate : dotRealEstate LLC
// https://www.iana.org/domains/root/db/realestate.html
realestate

// realtor : Real Estate Domains LLC
// https://www.iana.org/domains/root/db/realtor.html
realtor

// realty : Internet Naming Company LLC
// https://www.iana.org/domains/root/db/realty.html
realty

// recipes : Binky Moon, LLC
// https://www.iana.org/domains/root/db/recipes.html
recipes

// red : Identity Digital Limited
// https://www.iana.org/domains/root/db/red.html
red

// redstone : Redstone Haute Couture Co., Ltd.
// https://www.iana.org/domains/root/db/redstone.html
redstone

// redumbrella : Travelers TLD, LLC
// https://www.iana.org/domains/root/db/redumbrella.html
redumbrella

// rehab : Dog Beach, LLC
// https://www.iana.org/domains/root/db/rehab.html
rehab

// reise : Binky Moon, LLC
// https://www.iana.org/domains/root/db/reise.html
reise

// reisen : Binky Moon, LLC
// https://www.iana.org/domains/root/db/reisen.html
reisen

// reit : National Association of Real Estate Investment Trusts, Inc.
// https://www.iana.org/domains/root/db/reit.html
reit

// reliance : Reliance Industries Limited
// https://www.iana.org/domains/root/db/reliance.html
reliance

// ren : ZDNS International Limited
// https://www.iana.org/domains/root/db/ren.html
ren

// rent : XYZ.COM LLC
// https://www.iana.org/domains/root/db/rent.html
rent

// rentals : Binky Moon, LLC
// https://www.iana.org/domains/root/db/rentals.html
rentals

// repair : Binky Moon, LLC
// https://www.iana.org/domains/root/db/repair.html
repair

// report : Binky Moon, LLC
// https://www.iana.org/domains/root/db/report.html
report

// republican : Dog Beach, LLC
// https://www.iana.org/domains/root/db/republican.html
republican

// rest : Punto 2012 Sociedad Anonima Promotora de Inversion de Capital Variable
// https://www.iana.org/domains/root/db/rest.html
rest

// restaurant : Binky Moon, LLC
// https://www.iana.org/domains/root/db/restaurant.html
restaurant

// review : dot Review Limited
// https://www.iana.org/domains/root/db/review.html
review

// reviews : Dog Beach, LLC
// https://www.iana.org/domains/root/db/reviews.html
reviews

// rexroth : Robert Bosch GMBH
// https://www.iana.org/domains/root/db/rexroth.html
rexroth

// rich : iRegistry GmbH
// https://www.iana.org/domains/root/db/rich.html
rich

// richardli : Pacific Century Asset Management (HK) Limited
// https://www.iana.org/domains/root/db/richardli.html
richardli

// ricoh : Ricoh Company, Ltd.
// https://www.iana.org/domains/root/db/ricoh.html
ricoh

// ril : Reliance Industries Limited
// https://www.iana.org/domains/root/db/ril.html
ril

// rio : Empresa Municipal de Inform\xE1tica SA - IPLANRIO
// https://www.iana.org/domains/root/db/rio.html
rio

// rip : Dog Beach, LLC
// https://www.iana.org/domains/root/db/rip.html
rip

// rocher : Ferrero Trading Lux S.A.
// https://www.iana.org/domains/root/db/rocher.html
rocher

// rocks : Dog Beach, LLC
// https://www.iana.org/domains/root/db/rocks.html
rocks

// rodeo : Registry Services, LLC
// https://www.iana.org/domains/root/db/rodeo.html
rodeo

// rogers : Rogers Communications Canada Inc.
// https://www.iana.org/domains/root/db/rogers.html
rogers

// room : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/room.html
room

// rsvp : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/rsvp.html
rsvp

// rugby : World Rugby Strategic Developments Limited
// https://www.iana.org/domains/root/db/rugby.html
rugby

// ruhr : dotSaarland GmbH
// https://www.iana.org/domains/root/db/ruhr.html
ruhr

// run : Binky Moon, LLC
// https://www.iana.org/domains/root/db/run.html
run

// rwe : RWE AG
// https://www.iana.org/domains/root/db/rwe.html
rwe

// ryukyu : BRregistry, Inc.
// https://www.iana.org/domains/root/db/ryukyu.html
ryukyu

// saarland : dotSaarland GmbH
// https://www.iana.org/domains/root/db/saarland.html
saarland

// safe : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/safe.html
safe

// safety : Safety Registry Services, LLC.
// https://www.iana.org/domains/root/db/safety.html
safety

// sakura : SAKURA Internet Inc.
// https://www.iana.org/domains/root/db/sakura.html
sakura

// sale : Dog Beach, LLC
// https://www.iana.org/domains/root/db/sale.html
sale

// salon : Binky Moon, LLC
// https://www.iana.org/domains/root/db/salon.html
salon

// samsclub : Wal-Mart Stores, Inc.
// https://www.iana.org/domains/root/db/samsclub.html
samsclub

// samsung : SAMSUNG SDS CO., LTD
// https://www.iana.org/domains/root/db/samsung.html
samsung

// sandvik : Sandvik AB
// https://www.iana.org/domains/root/db/sandvik.html
sandvik

// sandvikcoromant : Sandvik AB
// https://www.iana.org/domains/root/db/sandvikcoromant.html
sandvikcoromant

// sanofi : Sanofi
// https://www.iana.org/domains/root/db/sanofi.html
sanofi

// sap : SAP AG
// https://www.iana.org/domains/root/db/sap.html
sap

// sarl : Binky Moon, LLC
// https://www.iana.org/domains/root/db/sarl.html
sarl

// sas : Research IP LLC
// https://www.iana.org/domains/root/db/sas.html
sas

// save : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/save.html
save

// saxo : Saxo Bank A/S
// https://www.iana.org/domains/root/db/saxo.html
saxo

// sbi : STATE BANK OF INDIA
// https://www.iana.org/domains/root/db/sbi.html
sbi

// sbs : ShortDot SA
// https://www.iana.org/domains/root/db/sbs.html
sbs

// sca : SVENSKA CELLULOSA AKTIEBOLAGET SCA (publ)
// https://www.iana.org/domains/root/db/sca.html
sca

// scb : The Siam Commercial Bank Public Company Limited ("SCB")
// https://www.iana.org/domains/root/db/scb.html
scb

// schaeffler : Schaeffler Technologies AG & Co. KG
// https://www.iana.org/domains/root/db/schaeffler.html
schaeffler

// schmidt : SCHMIDT GROUPE S.A.S.
// https://www.iana.org/domains/root/db/schmidt.html
schmidt

// scholarships : Scholarships.com, LLC
// https://www.iana.org/domains/root/db/scholarships.html
scholarships

// school : Binky Moon, LLC
// https://www.iana.org/domains/root/db/school.html
school

// schule : Binky Moon, LLC
// https://www.iana.org/domains/root/db/schule.html
schule

// schwarz : Schwarz Domains und Services GmbH & Co. KG
// https://www.iana.org/domains/root/db/schwarz.html
schwarz

// science : dot Science Limited
// https://www.iana.org/domains/root/db/science.html
science

// scot : Dot Scot Registry Limited
// https://www.iana.org/domains/root/db/scot.html
scot

// search : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/search.html
search

// seat : SEAT, S.A. (Sociedad Unipersonal)
// https://www.iana.org/domains/root/db/seat.html
seat

// secure : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/secure.html
secure

// security : XYZ.COM LLC
// https://www.iana.org/domains/root/db/security.html
security

// seek : Seek Limited
// https://www.iana.org/domains/root/db/seek.html
seek

// select : Registry Services, LLC
// https://www.iana.org/domains/root/db/select.html
select

// sener : Sener Ingenier\xEDa y Sistemas, S.A.
// https://www.iana.org/domains/root/db/sener.html
sener

// services : Binky Moon, LLC
// https://www.iana.org/domains/root/db/services.html
services

// seven : Seven West Media Ltd
// https://www.iana.org/domains/root/db/seven.html
seven

// sew : SEW-EURODRIVE GmbH & Co KG
// https://www.iana.org/domains/root/db/sew.html
sew

// sex : ICM Registry SX LLC
// https://www.iana.org/domains/root/db/sex.html
sex

// sexy : Internet Naming Company LLC
// https://www.iana.org/domains/root/db/sexy.html
sexy

// sfr : Societe Francaise du Radiotelephone - SFR
// https://www.iana.org/domains/root/db/sfr.html
sfr

// shangrila : Shangri\u2010La International Hotel Management Limited
// https://www.iana.org/domains/root/db/shangrila.html
shangrila

// sharp : Sharp Corporation
// https://www.iana.org/domains/root/db/sharp.html
sharp

// shaw : Shaw Cablesystems G.P.
// https://www.iana.org/domains/root/db/shaw.html
shaw

// shell : Shell Information Technology International Inc
// https://www.iana.org/domains/root/db/shell.html
shell

// shia : Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
// https://www.iana.org/domains/root/db/shia.html
shia

// shiksha : Identity Digital Limited
// https://www.iana.org/domains/root/db/shiksha.html
shiksha

// shoes : Binky Moon, LLC
// https://www.iana.org/domains/root/db/shoes.html
shoes

// shop : GMO Registry, Inc.
// https://www.iana.org/domains/root/db/shop.html
shop

// shopping : Binky Moon, LLC
// https://www.iana.org/domains/root/db/shopping.html
shopping

// shouji : Beijing Qihu Keji Co., Ltd.
// https://www.iana.org/domains/root/db/shouji.html
shouji

// show : Binky Moon, LLC
// https://www.iana.org/domains/root/db/show.html
show

// showtime : CBS Domains Inc.
// https://www.iana.org/domains/root/db/showtime.html
showtime

// silk : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/silk.html
silk

// sina : Sina Corporation
// https://www.iana.org/domains/root/db/sina.html
sina

// singles : Binky Moon, LLC
// https://www.iana.org/domains/root/db/singles.html
singles

// site : Radix FZC DMCC
// https://www.iana.org/domains/root/db/site.html
site

// ski : Identity Digital Limited
// https://www.iana.org/domains/root/db/ski.html
ski

// skin : XYZ.COM LLC
// https://www.iana.org/domains/root/db/skin.html
skin

// sky : Sky International AG
// https://www.iana.org/domains/root/db/sky.html
sky

// skype : Microsoft Corporation
// https://www.iana.org/domains/root/db/skype.html
skype

// sling : DISH Technologies L.L.C.
// https://www.iana.org/domains/root/db/sling.html
sling

// smart : Smart Communications, Inc. (SMART)
// https://www.iana.org/domains/root/db/smart.html
smart

// smile : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/smile.html
smile

// sncf : Soci\xE9t\xE9 Nationale SNCF
// https://www.iana.org/domains/root/db/sncf.html
sncf

// soccer : Binky Moon, LLC
// https://www.iana.org/domains/root/db/soccer.html
soccer

// social : Dog Beach, LLC
// https://www.iana.org/domains/root/db/social.html
social

// softbank : SoftBank Group Corp.
// https://www.iana.org/domains/root/db/softbank.html
softbank

// software : Dog Beach, LLC
// https://www.iana.org/domains/root/db/software.html
software

// sohu : Sohu.com Limited
// https://www.iana.org/domains/root/db/sohu.html
sohu

// solar : Binky Moon, LLC
// https://www.iana.org/domains/root/db/solar.html
solar

// solutions : Binky Moon, LLC
// https://www.iana.org/domains/root/db/solutions.html
solutions

// song : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/song.html
song

// sony : Sony Corporation
// https://www.iana.org/domains/root/db/sony.html
sony

// soy : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/soy.html
soy

// spa : Asia Spa and Wellness Promotion Council Limited
// https://www.iana.org/domains/root/db/spa.html
spa

// space : Radix FZC DMCC
// https://www.iana.org/domains/root/db/space.html
space

// sport : SportAccord
// https://www.iana.org/domains/root/db/sport.html
sport

// spot : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/spot.html
spot

// srl : InterNetX, Corp
// https://www.iana.org/domains/root/db/srl.html
srl

// stada : STADA Arzneimittel AG
// https://www.iana.org/domains/root/db/stada.html
stada

// staples : Staples, Inc.
// https://www.iana.org/domains/root/db/staples.html
staples

// star : Star India Private Limited
// https://www.iana.org/domains/root/db/star.html
star

// statebank : STATE BANK OF INDIA
// https://www.iana.org/domains/root/db/statebank.html
statebank

// statefarm : State Farm Mutual Automobile Insurance Company
// https://www.iana.org/domains/root/db/statefarm.html
statefarm

// stc : Saudi Telecom Company
// https://www.iana.org/domains/root/db/stc.html
stc

// stcgroup : Saudi Telecom Company
// https://www.iana.org/domains/root/db/stcgroup.html
stcgroup

// stockholm : Stockholms kommun
// https://www.iana.org/domains/root/db/stockholm.html
stockholm

// storage : XYZ.COM LLC
// https://www.iana.org/domains/root/db/storage.html
storage

// store : Radix FZC DMCC
// https://www.iana.org/domains/root/db/store.html
store

// stream : dot Stream Limited
// https://www.iana.org/domains/root/db/stream.html
stream

// studio : Dog Beach, LLC
// https://www.iana.org/domains/root/db/studio.html
studio

// study : Registry Services, LLC
// https://www.iana.org/domains/root/db/study.html
study

// style : Binky Moon, LLC
// https://www.iana.org/domains/root/db/style.html
style

// sucks : Vox Populi Registry Ltd.
// https://www.iana.org/domains/root/db/sucks.html
sucks

// supplies : Binky Moon, LLC
// https://www.iana.org/domains/root/db/supplies.html
supplies

// supply : Binky Moon, LLC
// https://www.iana.org/domains/root/db/supply.html
supply

// support : Binky Moon, LLC
// https://www.iana.org/domains/root/db/support.html
support

// surf : Registry Services, LLC
// https://www.iana.org/domains/root/db/surf.html
surf

// surgery : Binky Moon, LLC
// https://www.iana.org/domains/root/db/surgery.html
surgery

// suzuki : SUZUKI MOTOR CORPORATION
// https://www.iana.org/domains/root/db/suzuki.html
suzuki

// swatch : The Swatch Group Ltd
// https://www.iana.org/domains/root/db/swatch.html
swatch

// swiss : Swiss Confederation
// https://www.iana.org/domains/root/db/swiss.html
swiss

// sydney : State of New South Wales, Department of Premier and Cabinet
// https://www.iana.org/domains/root/db/sydney.html
sydney

// systems : Binky Moon, LLC
// https://www.iana.org/domains/root/db/systems.html
systems

// tab : Tabcorp Holdings Limited
// https://www.iana.org/domains/root/db/tab.html
tab

// taipei : Taipei City Government
// https://www.iana.org/domains/root/db/taipei.html
taipei

// talk : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/talk.html
talk

// taobao : Alibaba Group Holding Limited
// https://www.iana.org/domains/root/db/taobao.html
taobao

// target : Target Domain Holdings, LLC
// https://www.iana.org/domains/root/db/target.html
target

// tatamotors : Tata Motors Ltd
// https://www.iana.org/domains/root/db/tatamotors.html
tatamotors

// tatar : Limited Liability Company "Coordination Center of Regional Domain of Tatarstan Republic"
// https://www.iana.org/domains/root/db/tatar.html
tatar

// tattoo : Registry Services, LLC
// https://www.iana.org/domains/root/db/tattoo.html
tattoo

// tax : Binky Moon, LLC
// https://www.iana.org/domains/root/db/tax.html
tax

// taxi : Binky Moon, LLC
// https://www.iana.org/domains/root/db/taxi.html
taxi

// tci : Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
// https://www.iana.org/domains/root/db/tci.html
tci

// tdk : TDK Corporation
// https://www.iana.org/domains/root/db/tdk.html
tdk

// team : Binky Moon, LLC
// https://www.iana.org/domains/root/db/team.html
team

// tech : Radix FZC DMCC
// https://www.iana.org/domains/root/db/tech.html
tech

// technology : Binky Moon, LLC
// https://www.iana.org/domains/root/db/technology.html
technology

// temasek : Temasek Holdings (Private) Limited
// https://www.iana.org/domains/root/db/temasek.html
temasek

// tennis : Binky Moon, LLC
// https://www.iana.org/domains/root/db/tennis.html
tennis

// teva : Teva Pharmaceutical Industries Limited
// https://www.iana.org/domains/root/db/teva.html
teva

// thd : Home Depot Product Authority, LLC
// https://www.iana.org/domains/root/db/thd.html
thd

// theater : Binky Moon, LLC
// https://www.iana.org/domains/root/db/theater.html
theater

// theatre : XYZ.COM LLC
// https://www.iana.org/domains/root/db/theatre.html
theatre

// tiaa : Teachers Insurance and Annuity Association of America
// https://www.iana.org/domains/root/db/tiaa.html
tiaa

// tickets : XYZ.COM LLC
// https://www.iana.org/domains/root/db/tickets.html
tickets

// tienda : Binky Moon, LLC
// https://www.iana.org/domains/root/db/tienda.html
tienda

// tips : Binky Moon, LLC
// https://www.iana.org/domains/root/db/tips.html
tips

// tires : Binky Moon, LLC
// https://www.iana.org/domains/root/db/tires.html
tires

// tirol : punkt Tirol GmbH
// https://www.iana.org/domains/root/db/tirol.html
tirol

// tjmaxx : The TJX Companies, Inc.
// https://www.iana.org/domains/root/db/tjmaxx.html
tjmaxx

// tjx : The TJX Companies, Inc.
// https://www.iana.org/domains/root/db/tjx.html
tjx

// tkmaxx : The TJX Companies, Inc.
// https://www.iana.org/domains/root/db/tkmaxx.html
tkmaxx

// tmall : Alibaba Group Holding Limited
// https://www.iana.org/domains/root/db/tmall.html
tmall

// today : Binky Moon, LLC
// https://www.iana.org/domains/root/db/today.html
today

// tokyo : GMO Registry, Inc.
// https://www.iana.org/domains/root/db/tokyo.html
tokyo

// tools : Binky Moon, LLC
// https://www.iana.org/domains/root/db/tools.html
tools

// top : .TOP Registry
// https://www.iana.org/domains/root/db/top.html
top

// toray : Toray Industries, Inc.
// https://www.iana.org/domains/root/db/toray.html
toray

// toshiba : TOSHIBA Corporation
// https://www.iana.org/domains/root/db/toshiba.html
toshiba

// total : TotalEnergies SE
// https://www.iana.org/domains/root/db/total.html
total

// tours : Binky Moon, LLC
// https://www.iana.org/domains/root/db/tours.html
tours

// town : Binky Moon, LLC
// https://www.iana.org/domains/root/db/town.html
town

// toyota : TOYOTA MOTOR CORPORATION
// https://www.iana.org/domains/root/db/toyota.html
toyota

// toys : Binky Moon, LLC
// https://www.iana.org/domains/root/db/toys.html
toys

// trade : Elite Registry Limited
// https://www.iana.org/domains/root/db/trade.html
trade

// trading : Dog Beach, LLC
// https://www.iana.org/domains/root/db/trading.html
trading

// training : Binky Moon, LLC
// https://www.iana.org/domains/root/db/training.html
training

// travel : Dog Beach, LLC
// https://www.iana.org/domains/root/db/travel.html
travel

// travelers : Travelers TLD, LLC
// https://www.iana.org/domains/root/db/travelers.html
travelers

// travelersinsurance : Travelers TLD, LLC
// https://www.iana.org/domains/root/db/travelersinsurance.html
travelersinsurance

// trust : Internet Naming Company LLC
// https://www.iana.org/domains/root/db/trust.html
trust

// trv : Travelers TLD, LLC
// https://www.iana.org/domains/root/db/trv.html
trv

// tube : Latin American Telecom LLC
// https://www.iana.org/domains/root/db/tube.html
tube

// tui : TUI AG
// https://www.iana.org/domains/root/db/tui.html
tui

// tunes : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/tunes.html
tunes

// tushu : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/tushu.html
tushu

// tvs : T V SUNDRAM IYENGAR  & SONS LIMITED
// https://www.iana.org/domains/root/db/tvs.html
tvs

// ubank : National Australia Bank Limited
// https://www.iana.org/domains/root/db/ubank.html
ubank

// ubs : UBS AG
// https://www.iana.org/domains/root/db/ubs.html
ubs

// unicom : China United Network Communications Corporation Limited
// https://www.iana.org/domains/root/db/unicom.html
unicom

// university : Binky Moon, LLC
// https://www.iana.org/domains/root/db/university.html
university

// uno : Radix FZC DMCC
// https://www.iana.org/domains/root/db/uno.html
uno

// uol : UBN INTERNET LTDA.
// https://www.iana.org/domains/root/db/uol.html
uol

// ups : UPS Market Driver, Inc.
// https://www.iana.org/domains/root/db/ups.html
ups

// vacations : Binky Moon, LLC
// https://www.iana.org/domains/root/db/vacations.html
vacations

// vana : Lifestyle Domain Holdings, Inc.
// https://www.iana.org/domains/root/db/vana.html
vana

// vanguard : The Vanguard Group, Inc.
// https://www.iana.org/domains/root/db/vanguard.html
vanguard

// vegas : Dot Vegas, Inc.
// https://www.iana.org/domains/root/db/vegas.html
vegas

// ventures : Binky Moon, LLC
// https://www.iana.org/domains/root/db/ventures.html
ventures

// verisign : VeriSign, Inc.
// https://www.iana.org/domains/root/db/verisign.html
verisign

// versicherung : tldbox GmbH
// https://www.iana.org/domains/root/db/versicherung.html
versicherung

// vet : Dog Beach, LLC
// https://www.iana.org/domains/root/db/vet.html
vet

// viajes : Binky Moon, LLC
// https://www.iana.org/domains/root/db/viajes.html
viajes

// video : Dog Beach, LLC
// https://www.iana.org/domains/root/db/video.html
video

// vig : VIENNA INSURANCE GROUP AG Wiener Versicherung Gruppe
// https://www.iana.org/domains/root/db/vig.html
vig

// viking : Viking River Cruises (Bermuda) Ltd.
// https://www.iana.org/domains/root/db/viking.html
viking

// villas : Binky Moon, LLC
// https://www.iana.org/domains/root/db/villas.html
villas

// vin : Binky Moon, LLC
// https://www.iana.org/domains/root/db/vin.html
vin

// vip : Registry Services, LLC
// https://www.iana.org/domains/root/db/vip.html
vip

// virgin : Virgin Enterprises Limited
// https://www.iana.org/domains/root/db/virgin.html
virgin

// visa : Visa Worldwide Pte. Limited
// https://www.iana.org/domains/root/db/visa.html
visa

// vision : Binky Moon, LLC
// https://www.iana.org/domains/root/db/vision.html
vision

// viva : Saudi Telecom Company
// https://www.iana.org/domains/root/db/viva.html
viva

// vivo : Telefonica Brasil S.A.
// https://www.iana.org/domains/root/db/vivo.html
vivo

// vlaanderen : DNS.be vzw
// https://www.iana.org/domains/root/db/vlaanderen.html
vlaanderen

// vodka : Registry Services, LLC
// https://www.iana.org/domains/root/db/vodka.html
vodka

// volkswagen : Volkswagen Group of America Inc.
// https://www.iana.org/domains/root/db/volkswagen.html
volkswagen

// volvo : Volvo Holding Sverige Aktiebolag
// https://www.iana.org/domains/root/db/volvo.html
volvo

// vote : Monolith Registry LLC
// https://www.iana.org/domains/root/db/vote.html
vote

// voting : Valuetainment Corp.
// https://www.iana.org/domains/root/db/voting.html
voting

// voto : Monolith Registry LLC
// https://www.iana.org/domains/root/db/voto.html
voto

// voyage : Binky Moon, LLC
// https://www.iana.org/domains/root/db/voyage.html
voyage

// wales : Nominet UK
// https://www.iana.org/domains/root/db/wales.html
wales

// walmart : Wal-Mart Stores, Inc.
// https://www.iana.org/domains/root/db/walmart.html
walmart

// walter : Sandvik AB
// https://www.iana.org/domains/root/db/walter.html
walter

// wang : Zodiac Wang Limited
// https://www.iana.org/domains/root/db/wang.html
wang

// wanggou : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/wanggou.html
wanggou

// watch : Binky Moon, LLC
// https://www.iana.org/domains/root/db/watch.html
watch

// watches : Identity Digital Limited
// https://www.iana.org/domains/root/db/watches.html
watches

// weather : International Business Machines Corporation
// https://www.iana.org/domains/root/db/weather.html
weather

// weatherchannel : International Business Machines Corporation
// https://www.iana.org/domains/root/db/weatherchannel.html
weatherchannel

// webcam : dot Webcam Limited
// https://www.iana.org/domains/root/db/webcam.html
webcam

// weber : Saint-Gobain Weber SA
// https://www.iana.org/domains/root/db/weber.html
weber

// website : Radix FZC DMCC
// https://www.iana.org/domains/root/db/website.html
website

// wedding : Registry Services, LLC
// https://www.iana.org/domains/root/db/wedding.html
wedding

// weibo : Sina Corporation
// https://www.iana.org/domains/root/db/weibo.html
weibo

// weir : Weir Group IP Limited
// https://www.iana.org/domains/root/db/weir.html
weir

// whoswho : Who's Who Registry
// https://www.iana.org/domains/root/db/whoswho.html
whoswho

// wien : punkt.wien GmbH
// https://www.iana.org/domains/root/db/wien.html
wien

// wiki : Registry Services, LLC
// https://www.iana.org/domains/root/db/wiki.html
wiki

// williamhill : William Hill Organization Limited
// https://www.iana.org/domains/root/db/williamhill.html
williamhill

// win : First Registry Limited
// https://www.iana.org/domains/root/db/win.html
win

// windows : Microsoft Corporation
// https://www.iana.org/domains/root/db/windows.html
windows

// wine : Binky Moon, LLC
// https://www.iana.org/domains/root/db/wine.html
wine

// winners : The TJX Companies, Inc.
// https://www.iana.org/domains/root/db/winners.html
winners

// wme : William Morris Endeavor Entertainment, LLC
// https://www.iana.org/domains/root/db/wme.html
wme

// wolterskluwer : Wolters Kluwer N.V.
// https://www.iana.org/domains/root/db/wolterskluwer.html
wolterskluwer

// woodside : Woodside Petroleum Limited
// https://www.iana.org/domains/root/db/woodside.html
woodside

// work : Registry Services, LLC
// https://www.iana.org/domains/root/db/work.html
work

// works : Binky Moon, LLC
// https://www.iana.org/domains/root/db/works.html
works

// world : Binky Moon, LLC
// https://www.iana.org/domains/root/db/world.html
world

// wow : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/wow.html
wow

// wtc : World Trade Centers Association, Inc.
// https://www.iana.org/domains/root/db/wtc.html
wtc

// wtf : Binky Moon, LLC
// https://www.iana.org/domains/root/db/wtf.html
wtf

// xbox : Microsoft Corporation
// https://www.iana.org/domains/root/db/xbox.html
xbox

// xerox : Xerox DNHC LLC
// https://www.iana.org/domains/root/db/xerox.html
xerox

// xfinity : Comcast IP Holdings I, LLC
// https://www.iana.org/domains/root/db/xfinity.html
xfinity

// xihuan : Beijing Qihu Keji Co., Ltd.
// https://www.iana.org/domains/root/db/xihuan.html
xihuan

// xin : Elegant Leader Limited
// https://www.iana.org/domains/root/db/xin.html
xin

// xn--11b4c3d : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--11b4c3d.html
\u0915\u0949\u092E

// xn--1ck2e1b : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--1ck2e1b.html
\u30BB\u30FC\u30EB

// xn--1qqw23a : Guangzhou YU Wei Information Technology Co., Ltd.
// https://www.iana.org/domains/root/db/xn--1qqw23a.html
\u4F5B\u5C71

// xn--30rr7y : Excellent First Limited
// https://www.iana.org/domains/root/db/xn--30rr7y.html
\u6148\u5584

// xn--3bst00m : Eagle Horizon Limited
// https://www.iana.org/domains/root/db/xn--3bst00m.html
\u96C6\u56E2

// xn--3ds443g : TLD REGISTRY LIMITED OY
// https://www.iana.org/domains/root/db/xn--3ds443g.html
\u5728\u7EBF

// xn--3pxu8k : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--3pxu8k.html
\u70B9\u770B

// xn--42c2d9a : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--42c2d9a.html
\u0E04\u0E2D\u0E21

// xn--45q11c : Zodiac Gemini Ltd
// https://www.iana.org/domains/root/db/xn--45q11c.html
\u516B\u5366

// xn--4gbrim : Helium TLDs Ltd
// https://www.iana.org/domains/root/db/xn--4gbrim.html
\u0645\u0648\u0642\u0639

// xn--55qw42g : China Organizational Name Administration Center
// https://www.iana.org/domains/root/db/xn--55qw42g.html
\u516C\u76CA

// xn--55qx5d : China Internet Network Information Center (CNNIC)
// https://www.iana.org/domains/root/db/xn--55qx5d.html
\u516C\u53F8

// xn--5su34j936bgsg : Shangri\u2010La International Hotel Management Limited
// https://www.iana.org/domains/root/db/xn--5su34j936bgsg.html
\u9999\u683C\u91CC\u62C9

// xn--5tzm5g : Global Website TLD Asia Limited
// https://www.iana.org/domains/root/db/xn--5tzm5g.html
\u7F51\u7AD9

// xn--6frz82g : Identity Digital Limited
// https://www.iana.org/domains/root/db/xn--6frz82g.html
\u79FB\u52A8

// xn--6qq986b3xl : Tycoon Treasure Limited
// https://www.iana.org/domains/root/db/xn--6qq986b3xl.html
\u6211\u7231\u4F60

// xn--80adxhks : Foundation for Assistance for Internet Technologies and Infrastructure Development (FAITID)
// https://www.iana.org/domains/root/db/xn--80adxhks.html
\u043C\u043E\u0441\u043A\u0432\u0430

// xn--80aqecdr1a : Pontificium Consilium de Comunicationibus Socialibus (PCCS) (Pontifical Council for Social Communication)
// https://www.iana.org/domains/root/db/xn--80aqecdr1a.html
\u043A\u0430\u0442\u043E\u043B\u0438\u043A

// xn--80asehdb : CORE Association
// https://www.iana.org/domains/root/db/xn--80asehdb.html
\u043E\u043D\u043B\u0430\u0439\u043D

// xn--80aswg : CORE Association
// https://www.iana.org/domains/root/db/xn--80aswg.html
\u0441\u0430\u0439\u0442

// xn--8y0a063a : China United Network Communications Corporation Limited
// https://www.iana.org/domains/root/db/xn--8y0a063a.html
\u8054\u901A

// xn--9dbq2a : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--9dbq2a.html
\u05E7\u05D5\u05DD

// xn--9et52u : RISE VICTORY LIMITED
// https://www.iana.org/domains/root/db/xn--9et52u.html
\u65F6\u5C1A

// xn--9krt00a : Sina Corporation
// https://www.iana.org/domains/root/db/xn--9krt00a.html
\u5FAE\u535A

// xn--b4w605ferd : Temasek Holdings (Private) Limited
// https://www.iana.org/domains/root/db/xn--b4w605ferd.html
\u6DE1\u9A6C\u9521

// xn--bck1b9a5dre4c : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--bck1b9a5dre4c.html
\u30D5\u30A1\u30C3\u30B7\u30E7\u30F3

// xn--c1avg : Public Interest Registry
// https://www.iana.org/domains/root/db/xn--c1avg.html
\u043E\u0440\u0433

// xn--c2br7g : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--c2br7g.html
\u0928\u0947\u091F

// xn--cck2b3b : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--cck2b3b.html
\u30B9\u30C8\u30A2

// xn--cckwcxetd : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--cckwcxetd.html
\u30A2\u30DE\u30BE\u30F3

// xn--cg4bki : SAMSUNG SDS CO., LTD
// https://www.iana.org/domains/root/db/xn--cg4bki.html
\uC0BC\uC131

// xn--czr694b : Internet DotTrademark Organisation Limited
// https://www.iana.org/domains/root/db/xn--czr694b.html
\u5546\u6807

// xn--czrs0t : Binky Moon, LLC
// https://www.iana.org/domains/root/db/xn--czrs0t.html
\u5546\u5E97

// xn--czru2d : Zodiac Aquarius Limited
// https://www.iana.org/domains/root/db/xn--czru2d.html
\u5546\u57CE

// xn--d1acj3b : The Foundation for Network Initiatives \u201CThe Smart Internet\u201D
// https://www.iana.org/domains/root/db/xn--d1acj3b.html
\u0434\u0435\u0442\u0438

// xn--eckvdtc9d : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--eckvdtc9d.html
\u30DD\u30A4\u30F3\u30C8

// xn--efvy88h : Guangzhou YU Wei Information Technology Co., Ltd.
// https://www.iana.org/domains/root/db/xn--efvy88h.html
\u65B0\u95FB

// xn--fct429k : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--fct429k.html
\u5BB6\u96FB

// xn--fhbei : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--fhbei.html
\u0643\u0648\u0645

// xn--fiq228c5hs : TLD REGISTRY LIMITED OY
// https://www.iana.org/domains/root/db/xn--fiq228c5hs.html
\u4E2D\u6587\u7F51

// xn--fiq64b : CITIC Group Corporation
// https://www.iana.org/domains/root/db/xn--fiq64b.html
\u4E2D\u4FE1

// xn--fjq720a : Binky Moon, LLC
// https://www.iana.org/domains/root/db/xn--fjq720a.html
\u5A31\u4E50

// xn--flw351e : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/xn--flw351e.html
\u8C37\u6B4C

// xn--fzys8d69uvgm : PCCW Enterprises Limited
// https://www.iana.org/domains/root/db/xn--fzys8d69uvgm.html
\u96FB\u8A0A\u76C8\u79D1

// xn--g2xx48c : Nawang Heli(Xiamen) Network Service Co., LTD.
// https://www.iana.org/domains/root/db/xn--g2xx48c.html
\u8D2D\u7269

// xn--gckr3f0f : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--gckr3f0f.html
\u30AF\u30E9\u30A6\u30C9

// xn--gk3at1e : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--gk3at1e.html
\u901A\u8CA9

// xn--hxt814e : Zodiac Taurus Limited
// https://www.iana.org/domains/root/db/xn--hxt814e.html
\u7F51\u5E97

// xn--i1b6b1a6a2e : Public Interest Registry
// https://www.iana.org/domains/root/db/xn--i1b6b1a6a2e.html
\u0938\u0902\u0917\u0920\u0928

// xn--imr513n : Internet DotTrademark Organisation Limited
// https://www.iana.org/domains/root/db/xn--imr513n.html
\u9910\u5385

// xn--io0a7i : China Internet Network Information Center (CNNIC)
// https://www.iana.org/domains/root/db/xn--io0a7i.html
\u7F51\u7EDC

// xn--j1aef : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--j1aef.html
\u043A\u043E\u043C

// xn--jlq480n2rg : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--jlq480n2rg.html
\u4E9A\u9A6C\u900A

// xn--jvr189m : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--jvr189m.html
\u98DF\u54C1

// xn--kcrx77d1x4a : Koninklijke Philips N.V.
// https://www.iana.org/domains/root/db/xn--kcrx77d1x4a.html
\u98DE\u5229\u6D66

// xn--kput3i : Beijing RITT-Net Technology Development Co., Ltd
// https://www.iana.org/domains/root/db/xn--kput3i.html
\u624B\u673A

// xn--mgba3a3ejt : Aramco Services Company
// https://www.iana.org/domains/root/db/xn--mgba3a3ejt.html
\u0627\u0631\u0627\u0645\u0643\u0648

// xn--mgba7c0bbn0a : Competrol (Luxembourg) Sarl
// https://www.iana.org/domains/root/db/xn--mgba7c0bbn0a.html
\u0627\u0644\u0639\u0644\u064A\u0627\u0646

// xn--mgbaakc7dvf : Emirates Telecommunications Corporation (trading as Etisalat)
// https://www.iana.org/domains/root/db/xn--mgbaakc7dvf.html
\u0627\u062A\u0635\u0627\u0644\u0627\u062A

// xn--mgbab2bd : CORE Association
// https://www.iana.org/domains/root/db/xn--mgbab2bd.html
\u0628\u0627\u0632\u0627\u0631

// xn--mgbca7dzdo : Abu Dhabi Systems and Information Centre
// https://www.iana.org/domains/root/db/xn--mgbca7dzdo.html
\u0627\u0628\u0648\u0638\u0628\u064A

// xn--mgbi4ecexp : Pontificium Consilium de Comunicationibus Socialibus (PCCS) (Pontifical Council for Social Communication)
// https://www.iana.org/domains/root/db/xn--mgbi4ecexp.html
\u0643\u0627\u062B\u0648\u0644\u064A\u0643

// xn--mgbt3dhd : Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
// https://www.iana.org/domains/root/db/xn--mgbt3dhd.html
\u0647\u0645\u0631\u0627\u0647

// xn--mk1bu44c : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--mk1bu44c.html
\uB2F7\uCEF4

// xn--mxtq1m : Net-Chinese Co., Ltd.
// https://www.iana.org/domains/root/db/xn--mxtq1m.html
\u653F\u5E9C

// xn--ngbc5azd : International Domain Registry Pty. Ltd.
// https://www.iana.org/domains/root/db/xn--ngbc5azd.html
\u0634\u0628\u0643\u0629

// xn--ngbe9e0a : Kuwait Finance House
// https://www.iana.org/domains/root/db/xn--ngbe9e0a.html
\u0628\u064A\u062A\u0643

// xn--ngbrx : League of Arab States
// https://www.iana.org/domains/root/db/xn--ngbrx.html
\u0639\u0631\u0628

// xn--nqv7f : Public Interest Registry
// https://www.iana.org/domains/root/db/xn--nqv7f.html
\u673A\u6784

// xn--nqv7fs00ema : Public Interest Registry
// https://www.iana.org/domains/root/db/xn--nqv7fs00ema.html
\u7EC4\u7EC7\u673A\u6784

// xn--nyqy26a : Stable Tone Limited
// https://www.iana.org/domains/root/db/xn--nyqy26a.html
\u5065\u5EB7

// xn--otu796d : Jiang Yu Liang Cai Technology Company Limited
// https://www.iana.org/domains/root/db/xn--otu796d.html
\u62DB\u8058

// xn--p1acf : Rusnames Limited
// https://www.iana.org/domains/root/db/xn--p1acf.html
\u0440\u0443\u0441

// xn--pssy2u : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--pssy2u.html
\u5927\u62FF

// xn--q9jyb4c : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/xn--q9jyb4c.html
\u307F\u3093\u306A

// xn--qcka1pmc : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/xn--qcka1pmc.html
\u30B0\u30FC\u30B0\u30EB

// xn--rhqv96g : Stable Tone Limited
// https://www.iana.org/domains/root/db/xn--rhqv96g.html
\u4E16\u754C

// xn--rovu88b : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--rovu88b.html
\u66F8\u7C4D

// xn--ses554g : KNET Co., Ltd.
// https://www.iana.org/domains/root/db/xn--ses554g.html
\u7F51\u5740

// xn--t60b56a : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--t60b56a.html
\uB2F7\uB137

// xn--tckwe : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--tckwe.html
\u30B3\u30E0

// xn--tiq49xqyj : Pontificium Consilium de Comunicationibus Socialibus (PCCS) (Pontifical Council for Social Communication)
// https://www.iana.org/domains/root/db/xn--tiq49xqyj.html
\u5929\u4E3B\u6559

// xn--unup4y : Binky Moon, LLC
// https://www.iana.org/domains/root/db/xn--unup4y.html
\u6E38\u620F

// xn--vermgensberater-ctb : Deutsche Verm\xF6gensberatung Aktiengesellschaft DVAG
// https://www.iana.org/domains/root/db/xn--vermgensberater-ctb.html
verm\xF6gensberater

// xn--vermgensberatung-pwb : Deutsche Verm\xF6gensberatung Aktiengesellschaft DVAG
// https://www.iana.org/domains/root/db/xn--vermgensberatung-pwb.html
verm\xF6gensberatung

// xn--vhquv : Binky Moon, LLC
// https://www.iana.org/domains/root/db/xn--vhquv.html
\u4F01\u4E1A

// xn--vuq861b : Beijing Tele-info Technology Co., Ltd.
// https://www.iana.org/domains/root/db/xn--vuq861b.html
\u4FE1\u606F

// xn--w4r85el8fhu5dnra : Kerry Trading Co. Limited
// https://www.iana.org/domains/root/db/xn--w4r85el8fhu5dnra.html
\u5609\u91CC\u5927\u9152\u5E97

// xn--w4rs40l : Kerry Trading Co. Limited
// https://www.iana.org/domains/root/db/xn--w4rs40l.html
\u5609\u91CC

// xn--xhq521b : Guangzhou YU Wei Information Technology Co., Ltd.
// https://www.iana.org/domains/root/db/xn--xhq521b.html
\u5E7F\u4E1C

// xn--zfr164b : China Organizational Name Administration Center
// https://www.iana.org/domains/root/db/xn--zfr164b.html
\u653F\u52A1

// xyz : XYZ.COM LLC
// https://www.iana.org/domains/root/db/xyz.html
xyz

// yachts : XYZ.COM LLC
// https://www.iana.org/domains/root/db/yachts.html
yachts

// yahoo : Oath Inc.
// https://www.iana.org/domains/root/db/yahoo.html
yahoo

// yamaxun : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/yamaxun.html
yamaxun

// yandex : Yandex Europe B.V.
// https://www.iana.org/domains/root/db/yandex.html
yandex

// yodobashi : YODOBASHI CAMERA CO.,LTD.
// https://www.iana.org/domains/root/db/yodobashi.html
yodobashi

// yoga : Registry Services, LLC
// https://www.iana.org/domains/root/db/yoga.html
yoga

// yokohama : GMO Registry, Inc.
// https://www.iana.org/domains/root/db/yokohama.html
yokohama

// you : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/you.html
you

// youtube : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/youtube.html
youtube

// yun : Beijing Qihu Keji Co., Ltd.
// https://www.iana.org/domains/root/db/yun.html
yun

// zappos : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/zappos.html
zappos

// zara : Industria de Dise\xF1o Textil, S.A. (INDITEX, S.A.)
// https://www.iana.org/domains/root/db/zara.html
zara

// zero : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/zero.html
zero

// zip : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/zip.html
zip

// zone : Binky Moon, LLC
// https://www.iana.org/domains/root/db/zone.html
zone

// zuerich : Kanton Z\xFCrich (Canton of Zurich)
// https://www.iana.org/domains/root/db/zuerich.html
zuerich


// ===END ICANN DOMAINS===
// ===BEGIN PRIVATE DOMAINS===
// (Note: these are in alphabetical order by company name)

// 1GB LLC : https://www.1gb.ua/
// Submitted by 1GB LLC <noc@1gb.com.ua>
cc.ua
inf.ua
ltd.ua

// 611coin : https://611project.org/
611.to

// Aaron Marais' Gitlab pages: https://lab.aaronleem.co.za
// Submitted by Aaron Marais <its_me@aaronleem.co.za>
graphox.us

// accesso Technology Group, plc. : https://accesso.com/
// Submitted by accesso Team <accessoecommerce@accesso.com>
*.devcdnaccesso.com

// Acorn Labs : https://acorn.io
// Submitted by Craig Jellick <domains@acorn.io>
*.on-acorn.io

// ActiveTrail: https://www.activetrail.biz/
// Submitted by Ofer Kalaora <postmaster@activetrail.com>
activetrail.biz

// Adobe : https://www.adobe.com/
// Submitted by Ian Boston <boston@adobe.com> and Lars Trieloff <trieloff@adobe.com>
adobeaemcloud.com
*.dev.adobeaemcloud.com
hlx.live
adobeaemcloud.net
hlx.page
hlx3.page

// Adobe Developer Platform : https://developer.adobe.com
// Submitted by Jesse MacFadyen<jessem@adobe.com>
adobeio-static.net
adobeioruntime.net

// Agnat sp. z o.o. : https://domena.pl
// Submitted by Przemyslaw Plewa <it-admin@domena.pl>
beep.pl

// Airkit : https://www.airkit.com/
// Submitted by Grant Cooksey <security@airkit.com>
airkitapps.com
airkitapps-au.com
airkitapps.eu

// Aiven: https://aiven.io/
// Submitted by Etienne Stalmans <security@aiven.io>
aivencloud.com

// Akamai : https://www.akamai.com/
// Submitted by Akamai Team <publicsuffixlist@akamai.com>
akadns.net
akamai.net
akamai-staging.net
akamaiedge.net
akamaiedge-staging.net
akamaihd.net
akamaihd-staging.net
akamaiorigin.net
akamaiorigin-staging.net
akamaized.net
akamaized-staging.net
edgekey.net
edgekey-staging.net
edgesuite.net
edgesuite-staging.net

// alboto.ca : http://alboto.ca
// Submitted by Anton Avramov <avramov@alboto.ca>
barsy.ca

// Alces Software Ltd : http://alces-software.com
// Submitted by Mark J. Titorenko <mark.titorenko@alces-software.com>
*.compute.estate
*.alces.network

// all-inkl.com : https://all-inkl.com
// Submitted by Werner Kaltofen <wk@all-inkl.com>
kasserver.com

// Altervista: https://www.altervista.org
// Submitted by Carlo Cannas <tech_staff@altervista.it>
altervista.org

// alwaysdata : https://www.alwaysdata.com
// Submitted by Cyril <admin@alwaysdata.com>
alwaysdata.net

// Amaze Software : https://amaze.co
// Submitted by Domain Admin <domainadmin@amaze.co>
myamaze.net

// Amazon : https://www.amazon.com/
// Submitted by AWS Security <psl-maintainers@amazon.com>
// Subsections of Amazon/subsidiaries will appear until "concludes" tag

// Amazon CloudFront
// Submitted by Donavan Miller <donavanm@amazon.com>
// Reference: 54144616-fd49-4435-8535-19c6a601bdb3
cloudfront.net

// Amazon EC2
// Submitted by Luke Wells <psl-maintainers@amazon.com>
// Reference: 4c38fa71-58ac-4768-99e5-689c1767e537
*.compute.amazonaws.com
*.compute-1.amazonaws.com
*.compute.amazonaws.com.cn
us-east-1.amazonaws.com

// Amazon S3
// Submitted by Luke Wells <psl-maintainers@amazon.com>
// Reference: d068bd97-f0a9-4838-a6d8-954b622ef4ae
s3.cn-north-1.amazonaws.com.cn
s3.dualstack.ap-northeast-1.amazonaws.com
s3.dualstack.ap-northeast-2.amazonaws.com
s3.ap-northeast-2.amazonaws.com
s3-website.ap-northeast-2.amazonaws.com
s3.dualstack.ap-south-1.amazonaws.com
s3.ap-south-1.amazonaws.com
s3-website.ap-south-1.amazonaws.com
s3.dualstack.ap-southeast-1.amazonaws.com
s3.dualstack.ap-southeast-2.amazonaws.com
s3.dualstack.ca-central-1.amazonaws.com
s3.ca-central-1.amazonaws.com
s3-website.ca-central-1.amazonaws.com
s3.dualstack.eu-central-1.amazonaws.com
s3.eu-central-1.amazonaws.com
s3-website.eu-central-1.amazonaws.com
s3.dualstack.eu-west-1.amazonaws.com
s3.dualstack.eu-west-2.amazonaws.com
s3.eu-west-2.amazonaws.com
s3-website.eu-west-2.amazonaws.com
s3.dualstack.eu-west-3.amazonaws.com
s3.eu-west-3.amazonaws.com
s3-website.eu-west-3.amazonaws.com
s3.amazonaws.com
s3-ap-northeast-1.amazonaws.com
s3-ap-northeast-2.amazonaws.com
s3-ap-south-1.amazonaws.com
s3-ap-southeast-1.amazonaws.com
s3-ap-southeast-2.amazonaws.com
s3-ca-central-1.amazonaws.com
s3-eu-central-1.amazonaws.com
s3-eu-west-1.amazonaws.com
s3-eu-west-2.amazonaws.com
s3-eu-west-3.amazonaws.com
s3-external-1.amazonaws.com
s3-fips-us-gov-west-1.amazonaws.com
s3-sa-east-1.amazonaws.com
s3-us-east-2.amazonaws.com
s3-us-gov-west-1.amazonaws.com
s3-us-west-1.amazonaws.com
s3-us-west-2.amazonaws.com
s3-website-ap-northeast-1.amazonaws.com
s3-website-ap-southeast-1.amazonaws.com
s3-website-ap-southeast-2.amazonaws.com
s3-website-eu-west-1.amazonaws.com
s3-website-sa-east-1.amazonaws.com
s3-website-us-east-1.amazonaws.com
s3-website-us-west-1.amazonaws.com
s3-website-us-west-2.amazonaws.com
s3.dualstack.sa-east-1.amazonaws.com
s3.dualstack.us-east-1.amazonaws.com
s3.dualstack.us-east-2.amazonaws.com
s3.us-east-2.amazonaws.com
s3-website.us-east-2.amazonaws.com

// Analytics on AWS
// Submitted by AWS Security <psl-maintainers@amazon.com>
// Reference: c02c3a80-f8a0-4fd2-b719-48ea8b7c28de
analytics-gateway.ap-northeast-1.amazonaws.com
analytics-gateway.eu-west-1.amazonaws.com
analytics-gateway.us-east-1.amazonaws.com
analytics-gateway.us-east-2.amazonaws.com
analytics-gateway.us-west-2.amazonaws.com

// AWS Cloud9
// Submitted by: AWS Security <psl-maintainers@amazon.com>
// Reference: 05c44955-977c-4b57-938a-f2af92733f9f
webview-assets.aws-cloud9.af-south-1.amazonaws.com
vfs.cloud9.af-south-1.amazonaws.com
webview-assets.cloud9.af-south-1.amazonaws.com
webview-assets.aws-cloud9.ap-east-1.amazonaws.com
vfs.cloud9.ap-east-1.amazonaws.com
webview-assets.cloud9.ap-east-1.amazonaws.com
webview-assets.aws-cloud9.ap-northeast-1.amazonaws.com
vfs.cloud9.ap-northeast-1.amazonaws.com
webview-assets.cloud9.ap-northeast-1.amazonaws.com
webview-assets.aws-cloud9.ap-northeast-2.amazonaws.com
vfs.cloud9.ap-northeast-2.amazonaws.com
webview-assets.cloud9.ap-northeast-2.amazonaws.com
webview-assets.aws-cloud9.ap-northeast-3.amazonaws.com
vfs.cloud9.ap-northeast-3.amazonaws.com
webview-assets.cloud9.ap-northeast-3.amazonaws.com
webview-assets.aws-cloud9.ap-south-1.amazonaws.com
vfs.cloud9.ap-south-1.amazonaws.com
webview-assets.cloud9.ap-south-1.amazonaws.com
webview-assets.aws-cloud9.ap-southeast-1.amazonaws.com
vfs.cloud9.ap-southeast-1.amazonaws.com
webview-assets.cloud9.ap-southeast-1.amazonaws.com
webview-assets.aws-cloud9.ap-southeast-2.amazonaws.com
vfs.cloud9.ap-southeast-2.amazonaws.com
webview-assets.cloud9.ap-southeast-2.amazonaws.com
webview-assets.aws-cloud9.ca-central-1.amazonaws.com
vfs.cloud9.ca-central-1.amazonaws.com
webview-assets.cloud9.ca-central-1.amazonaws.com
webview-assets.aws-cloud9.eu-central-1.amazonaws.com
vfs.cloud9.eu-central-1.amazonaws.com
webview-assets.cloud9.eu-central-1.amazonaws.com
webview-assets.aws-cloud9.eu-north-1.amazonaws.com
vfs.cloud9.eu-north-1.amazonaws.com
webview-assets.cloud9.eu-north-1.amazonaws.com
webview-assets.aws-cloud9.eu-south-1.amazonaws.com
vfs.cloud9.eu-south-1.amazonaws.com
webview-assets.cloud9.eu-south-1.amazonaws.com
webview-assets.aws-cloud9.eu-west-1.amazonaws.com
vfs.cloud9.eu-west-1.amazonaws.com
webview-assets.cloud9.eu-west-1.amazonaws.com
webview-assets.aws-cloud9.eu-west-2.amazonaws.com
vfs.cloud9.eu-west-2.amazonaws.com
webview-assets.cloud9.eu-west-2.amazonaws.com
webview-assets.aws-cloud9.eu-west-3.amazonaws.com
vfs.cloud9.eu-west-3.amazonaws.com
webview-assets.cloud9.eu-west-3.amazonaws.com
webview-assets.aws-cloud9.me-south-1.amazonaws.com
vfs.cloud9.me-south-1.amazonaws.com
webview-assets.cloud9.me-south-1.amazonaws.com
webview-assets.aws-cloud9.sa-east-1.amazonaws.com
vfs.cloud9.sa-east-1.amazonaws.com
webview-assets.cloud9.sa-east-1.amazonaws.com
webview-assets.aws-cloud9.us-east-1.amazonaws.com
vfs.cloud9.us-east-1.amazonaws.com
webview-assets.cloud9.us-east-1.amazonaws.com
webview-assets.aws-cloud9.us-east-2.amazonaws.com
vfs.cloud9.us-east-2.amazonaws.com
webview-assets.cloud9.us-east-2.amazonaws.com
webview-assets.aws-cloud9.us-west-1.amazonaws.com
vfs.cloud9.us-west-1.amazonaws.com
webview-assets.cloud9.us-west-1.amazonaws.com
webview-assets.aws-cloud9.us-west-2.amazonaws.com
vfs.cloud9.us-west-2.amazonaws.com
webview-assets.cloud9.us-west-2.amazonaws.com

// AWS Elastic Beanstalk
// Submitted by Luke Wells <psl-maintainers@amazon.com>
// Reference: aa202394-43a0-4857-b245-8db04549137e
cn-north-1.eb.amazonaws.com.cn
cn-northwest-1.eb.amazonaws.com.cn
elasticbeanstalk.com
ap-northeast-1.elasticbeanstalk.com
ap-northeast-2.elasticbeanstalk.com
ap-northeast-3.elasticbeanstalk.com
ap-south-1.elasticbeanstalk.com
ap-southeast-1.elasticbeanstalk.com
ap-southeast-2.elasticbeanstalk.com
ca-central-1.elasticbeanstalk.com
eu-central-1.elasticbeanstalk.com
eu-west-1.elasticbeanstalk.com
eu-west-2.elasticbeanstalk.com
eu-west-3.elasticbeanstalk.com
sa-east-1.elasticbeanstalk.com
us-east-1.elasticbeanstalk.com
us-east-2.elasticbeanstalk.com
us-gov-west-1.elasticbeanstalk.com
us-west-1.elasticbeanstalk.com
us-west-2.elasticbeanstalk.com

// (AWS) Elastic Load Balancing
// Submitted by Luke Wells <psl-maintainers@amazon.com>
// Reference: 12a3d528-1bac-4433-a359-a395867ffed2
*.elb.amazonaws.com.cn
*.elb.amazonaws.com

// AWS Global Accelerator
// Submitted by Daniel Massaguer <psl-maintainers@amazon.com>
// Reference: d916759d-a08b-4241-b536-4db887383a6a
awsglobalaccelerator.com

// eero
// Submitted by Yue Kang <eero-dynamic-dns@amazon.com>
// Reference: 264afe70-f62c-4c02-8ab9-b5281ed24461
eero.online
eero-stage.online

// concludes Amazon

// Amune : https://amune.org/
// Submitted by Team Amune <cert@amune.org>
t3l3p0rt.net
tele.amune.org

// Apigee : https://apigee.com/
// Submitted by Apigee Security Team <security@apigee.com>
apigee.io

// Apphud : https://apphud.com
// Submitted by Alexander Selivanov <alex@apphud.com>
siiites.com

// Appspace : https://www.appspace.com
// Submitted by Appspace Security Team <security@appspace.com>
appspacehosted.com
appspaceusercontent.com

// Appudo UG (haftungsbeschr\xE4nkt) : https://www.appudo.com
// Submitted by Alexander Hochbaum <admin@appudo.com>
appudo.net

// Aptible : https://www.aptible.com/
// Submitted by Thomas Orozco <thomas@aptible.com>
on-aptible.com

// ASEINet : https://www.aseinet.com/
// Submitted by Asei SEKIGUCHI <mail@aseinet.com>
user.aseinet.ne.jp
gv.vc
d.gv.vc

// Asociaci\xF3n Amigos de la Inform\xE1tica "Euskalamiga" : http://encounter.eus/
// Submitted by Hector Martin <marcan@euskalencounter.org>
user.party.eus

// Association potager.org : https://potager.org/
// Submitted by Lunar <jardiniers@potager.org>
pimienta.org
poivron.org
potager.org
sweetpepper.org

// ASUSTOR Inc. : http://www.asustor.com
// Submitted by Vincent Tseng <vincenttseng@asustor.com>
myasustor.com

// Atlassian : https://atlassian.com
// Submitted by Sam Smyth <devloop@atlassian.com>
cdn.prod.atlassian-dev.net

// Authentick UG (haftungsbeschr\xE4nkt) : https://authentick.net
// Submitted by Lukas Reschke <lukas@authentick.net>
translated.page

// Autocode : https://autocode.com
// Submitted by Jacob Lee <jacob@autocode.com>
autocode.dev

// AVM : https://avm.de
// Submitted by Andreas Weise <a.weise@avm.de>
myfritz.net

// AVStack Pte. Ltd. : https://avstack.io
// Submitted by Jasper Hugo <jasper@avstack.io>
onavstack.net

// AW AdvisorWebsites.com Software Inc : https://advisorwebsites.com
// Submitted by James Kennedy <domains@advisorwebsites.com>
*.awdev.ca
*.advisor.ws

// AZ.pl sp. z.o.o: https://az.pl
// Submitted by Krzysztof Wolski <krzysztof.wolski@home.eu>
ecommerce-shop.pl

// b-data GmbH : https://www.b-data.io
// Submitted by Olivier Benz <olivier.benz@b-data.ch>
b-data.io

// backplane : https://www.backplane.io
// Submitted by Anthony Voutas <anthony@backplane.io>
backplaneapp.io

// Balena : https://www.balena.io
// Submitted by Petros Angelatos <petrosagg@balena.io>
balena-devices.com

// University of Banja Luka : https://unibl.org
// Domains for Republic of Srpska administrative entity.
// Submitted by Marko Ivanovic <kormang@hotmail.rs>
rs.ba

// Banzai Cloud
// Submitted by Janos Matyas <info@banzaicloud.com>
*.banzai.cloud
app.banzaicloud.io
*.backyards.banzaicloud.io

// BASE, Inc. : https://binc.jp
// Submitted by Yuya NAGASAWA <public-suffix-list@binc.jp>
base.ec
official.ec
buyshop.jp
fashionstore.jp
handcrafted.jp
kawaiishop.jp
supersale.jp
theshop.jp
shopselect.net
base.shop

// BeagleBoard.org Foundation : https://beagleboard.org
// Submitted by Jason Kridner <jkridner@beagleboard.org>
beagleboard.io

// Beget Ltd
// Submitted by Lev Nekrasov <lnekrasov@beget.com>
*.beget.app

// BetaInABox
// Submitted by Adrian <adrian@betainabox.com>
betainabox.com

// BinaryLane : http://www.binarylane.com
// Submitted by Nathan O'Sullivan <nathan@mammoth.com.au>
bnr.la

// Bitbucket : http://bitbucket.org
// Submitted by Andy Ortlieb <aortlieb@atlassian.com>
bitbucket.io

// Blackbaud, Inc. : https://www.blackbaud.com
// Submitted by Paul Crowder <paul.crowder@blackbaud.com>
blackbaudcdn.net

// Blatech : http://www.blatech.net
// Submitted by Luke Bratch <luke@bratch.co.uk>
of.je

// Blue Bite, LLC : https://bluebite.com
// Submitted by Joshua Weiss <admin.engineering@bluebite.com>
bluebite.io

// Boomla : https://boomla.com
// Submitted by Tibor Halter <thalter@boomla.com>
boomla.net

// Boutir : https://www.boutir.com
// Submitted by Eric Ng Ka Ka <ngkaka@boutir.com>
boutir.com

// Boxfuse : https://boxfuse.com
// Submitted by Axel Fontaine <axel@boxfuse.com>
boxfuse.io

// bplaced : https://www.bplaced.net/
// Submitted by Miroslav Bozic <security@bplaced.net>
square7.ch
bplaced.com
bplaced.de
square7.de
bplaced.net
square7.net

// Brendly : https://brendly.rs
// Submitted by Dusan Radovanovic <dusan.radovanovic@brendly.rs>
shop.brendly.rs

// BrowserSafetyMark
// Submitted by Dave Tharp <browsersafetymark.io@quicinc.com>
browsersafetymark.io

// Bytemark Hosting : https://www.bytemark.co.uk
// Submitted by Paul Cammish <paul.cammish@bytemark.co.uk>
uk0.bigv.io
dh.bytemark.co.uk
vm.bytemark.co.uk

// Caf.js Labs LLC : https://www.cafjs.com
// Submitted by Antonio Lain <antlai@cafjs.com>
cafjs.com

// callidomus : https://www.callidomus.com/
// Submitted by Marcus Popp <admin@callidomus.com>
mycd.eu

// Canva Pty Ltd : https://canva.com/
// Submitted by Joel Aquilina <publicsuffixlist@canva.com>
canva-apps.cn
canva-apps.com

// Carrd : https://carrd.co
// Submitted by AJ <aj@carrd.co>
drr.ac
uwu.ai
carrd.co
crd.co
ju.mp

// CentralNic : http://www.centralnic.com/names/domains
// Submitted by registry <gavin.brown@centralnic.com>
ae.org
br.com
cn.com
com.de
com.se
de.com
eu.com
gb.net
hu.net
jp.net
jpn.com
mex.com
ru.com
sa.com
se.net
uk.com
uk.net
us.com
za.bz
za.com

// No longer operated by CentralNic, these entries should be adopted and/or removed by current operators
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
ar.com
hu.com
kr.com
no.com
qc.com
uy.com

// Africa.com Web Solutions Ltd : https://registry.africa.com
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
africa.com

// iDOT Services Limited : http://www.domain.gr.com
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
gr.com

// Radix FZC : http://domains.in.net
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
in.net
web.in

// US REGISTRY LLC : http://us.org
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
us.org

// co.com Registry, LLC : https://registry.co.com
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
co.com

// Roar Domains LLC : https://roar.basketball/
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
aus.basketball
nz.basketball

// BRS Media : https://brsmedia.com/
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
radio.am
radio.fm

// c.la : http://www.c.la/
c.la

// certmgr.org : https://certmgr.org
// Submitted by B. Blechschmidt <hostmaster@certmgr.org>
certmgr.org

// Cityhost LLC  : https://cityhost.ua
// Submitted by Maksym Rivtin <support@cityhost.net.ua>
cx.ua

// Civilized Discourse Construction Kit, Inc. : https://www.discourse.org/
// Submitted by Rishabh Nambiar & Michael Brown <team@discourse.org>
discourse.group
discourse.team

// Clever Cloud : https://www.clever-cloud.com/
// Submitted by Quentin Adam <noc@clever-cloud.com>
cleverapps.io

// Clerk : https://www.clerk.dev
// Submitted by Colin Sidoti <systems@clerk.dev>
clerk.app
clerkstage.app
*.lcl.dev
*.lclstage.dev
*.stg.dev
*.stgstage.dev

// ClickRising : https://clickrising.com/
// Submitted by Umut Gumeli <infrastructure-publicsuffixlist@clickrising.com>
clickrising.net

// Cloud66 : https://www.cloud66.com/
// Submitted by Khash Sajadi <khash@cloud66.com>
c66.me
cloud66.ws
cloud66.zone

// CloudAccess.net : https://www.cloudaccess.net/
// Submitted by Pawel Panek <noc@cloudaccess.net>
jdevcloud.com
wpdevcloud.com
cloudaccess.host
freesite.host
cloudaccess.net

// cloudControl : https://www.cloudcontrol.com/
// Submitted by Tobias Wilken <tw@cloudcontrol.com>
cloudcontrolled.com
cloudcontrolapp.com

// Cloudera, Inc. : https://www.cloudera.com/
// Submitted by Kedarnath Waikar <security@cloudera.com>
*.cloudera.site

// Cloudflare, Inc. : https://www.cloudflare.com/
// Submitted by Cloudflare Team <publicsuffixlist@cloudflare.com>
cf-ipfs.com
cloudflare-ipfs.com
trycloudflare.com
pages.dev
r2.dev
workers.dev

// Clovyr : https://clovyr.io
// Submitted by Patrick Nielsen <patrick@clovyr.io>
wnext.app

// co.ca : http://registry.co.ca/
co.ca

// Co & Co : https://co-co.nl/
// Submitted by Govert Versluis <govert@co-co.nl>
*.otap.co

// i-registry s.r.o. : http://www.i-registry.cz/
// Submitted by Martin Semrad <semrad@i-registry.cz>
co.cz

// CDN77.com : http://www.cdn77.com
// Submitted by Jan Krpes <jan.krpes@cdn77.com>
c.cdn77.org
cdn77-ssl.net
r.cdn77.net
rsc.cdn77.org
ssl.origin.cdn77-secure.org

// Cloud DNS Ltd : http://www.cloudns.net
// Submitted by Aleksander Hristov <noc@cloudns.net>
cloudns.asia
cloudns.biz
cloudns.club
cloudns.cc
cloudns.eu
cloudns.in
cloudns.info
cloudns.org
cloudns.pro
cloudns.pw
cloudns.us

// CNPY : https://cnpy.gdn
// Submitted by Angelo Gladding <angelo@lahacker.net>
cnpy.gdn

// Codeberg e. V. : https://codeberg.org
// Submitted by Moritz Marquardt <git@momar.de>
codeberg.page

// CoDNS B.V.
co.nl
co.no

// Combell.com : https://www.combell.com
// Submitted by Thomas Wouters <thomas.wouters@combellgroup.com>
webhosting.be
hosting-cluster.nl

// Coordination Center for TLD RU and XN--P1AI : https://cctld.ru/en/domains/domens_ru/reserved/
// Submitted by George Georgievsky <gug@cctld.ru>
ac.ru
edu.ru
gov.ru
int.ru
mil.ru
test.ru

// COSIMO GmbH : http://www.cosimo.de
// Submitted by Rene Marticke <rmarticke@cosimo.de>
dyn.cosidns.de
dynamisches-dns.de
dnsupdater.de
internet-dns.de
l-o-g-i-n.de
dynamic-dns.info
feste-ip.net
knx-server.net
static-access.net

// Craynic, s.r.o. : http://www.craynic.com/
// Submitted by Ales Krajnik <ales.krajnik@craynic.com>
realm.cz

// Cryptonomic : https://cryptonomic.net/
// Submitted by Andrew Cady <public-suffix-list@cryptonomic.net>
*.cryptonomic.net

// Cupcake : https://cupcake.io/
// Submitted by Jonathan Rudenberg <jonathan@cupcake.io>
cupcake.is

// Curv UG : https://curv-labs.de/
// Submitted by Marvin Wiesner <Marvin@curv-labs.de>
curv.dev

// Customer OCI - Oracle Dyn https://cloud.oracle.com/home https://dyn.com/dns/
// Submitted by Gregory Drake <support@dyn.com>
// Note: This is intended to also include customer-oci.com due to wildcards implicitly including the current label
*.customer-oci.com
*.oci.customer-oci.com
*.ocp.customer-oci.com
*.ocs.customer-oci.com

// cyon GmbH : https://www.cyon.ch/
// Submitted by Dominic Luechinger <dol@cyon.ch>
cyon.link
cyon.site

// Danger Science Group: https://dangerscience.com/
// Submitted by Skylar MacDonald <skylar@dangerscience.com>
fnwk.site
folionetwork.site
platform0.app

// Daplie, Inc : https://daplie.com
// Submitted by AJ ONeal <aj@daplie.com>
daplie.me
localhost.daplie.me

// Datto, Inc. : https://www.datto.com/
// Submitted by Philipp Heckel <ph@datto.com>
dattolocal.com
dattorelay.com
dattoweb.com
mydatto.com
dattolocal.net
mydatto.net

// Dansk.net : http://www.dansk.net/
// Submitted by Anani Voule <digital@digital.co.dk>
biz.dk
co.dk
firm.dk
reg.dk
store.dk

// dappnode.io : https://dappnode.io/
// Submitted by Abel Boldu / DAppNode Team <community@dappnode.io>
dyndns.dappnode.io

// dapps.earth : https://dapps.earth/
// Submitted by Daniil Burdakov <icqkill@gmail.com>
*.dapps.earth
*.bzz.dapps.earth

// Dark, Inc. : https://darklang.com
// Submitted by Paul Biggar <ops@darklang.com>
builtwithdark.com

// DataDetect, LLC. : https://datadetect.com
// Submitted by Andrew Banchich <abanchich@sceven.com>
demo.datadetect.com
instance.datadetect.com

// Datawire, Inc : https://www.datawire.io
// Submitted by Richard Li <secalert@datawire.io>
edgestack.me

// DDNS5 : https://ddns5.com
// Submitted by Cameron Elliott <cameron@cameronelliott.com>
ddns5.com

// Debian : https://www.debian.org/
// Submitted by Peter Palfrader / Debian Sysadmin Team <dsa-publicsuffixlist@debian.org>
debian.net

// Deno Land Inc : https://deno.com/
// Submitted by Luca Casonato <hostmaster@deno.com>
deno.dev
deno-staging.dev

// deSEC : https://desec.io/
// Submitted by Peter Thomassen <peter@desec.io>
dedyn.io

// Deta: https://www.deta.sh/
// Submitted by Aavash Shrestha <aavash@deta.sh>
deta.app
deta.dev

// Diher Solutions : https://diher.solutions
// Submitted by Didi Hermawan <mail@diher.solutions>
*.rss.my.id
*.diher.solutions

// Discord Inc : https://discord.com
// Submitted by Sahn Lam <slam@discordapp.com>
discordsays.com
discordsez.com

// DNS Africa Ltd https://dns.business
// Submitted by Calvin Browne <calvin@dns.business>
jozi.biz

// DNShome : https://www.dnshome.de/
// Submitted by Norbert Auler <mail@dnshome.de>
dnshome.de

// DotArai : https://www.dotarai.com/
// Submitted by Atsadawat Netcharadsang <atsadawat@dotarai.co.th>
online.th
shop.th

// DrayTek Corp. : https://www.draytek.com/
// Submitted by Paul Fang <mis@draytek.com>
drayddns.com

// DreamCommerce : https://shoper.pl/
// Submitted by Konrad Kotarba <konrad.kotarba@dreamcommerce.com>
shoparena.pl

// DreamHost : http://www.dreamhost.com/
// Submitted by Andrew Farmer <andrew.farmer@dreamhost.com>
dreamhosters.com

// Drobo : http://www.drobo.com/
// Submitted by Ricardo Padilha <rpadilha@drobo.com>
mydrobo.com

// Drud Holdings, LLC. : https://www.drud.com/
// Submitted by Kevin Bridges <kevin@drud.com>
drud.io
drud.us

// DuckDNS : http://www.duckdns.org/
// Submitted by Richard Harper <richard@duckdns.org>
duckdns.org

// Bip : https://bip.sh
// Submitted by Joel Kennedy <joel@bip.sh>
bip.sh

// bitbridge.net : Submitted by Craig Welch, abeliidev@gmail.com
bitbridge.net

// dy.fi : http://dy.fi/
// Submitted by Heikki Hannikainen <hessu@hes.iki.fi>
dy.fi
tunk.org

// DynDNS.com : http://www.dyndns.com/services/dns/dyndns/
dyndns-at-home.com
dyndns-at-work.com
dyndns-blog.com
dyndns-free.com
dyndns-home.com
dyndns-ip.com
dyndns-mail.com
dyndns-office.com
dyndns-pics.com
dyndns-remote.com
dyndns-server.com
dyndns-web.com
dyndns-wiki.com
dyndns-work.com
dyndns.biz
dyndns.info
dyndns.org
dyndns.tv
at-band-camp.net
ath.cx
barrel-of-knowledge.info
barrell-of-knowledge.info
better-than.tv
blogdns.com
blogdns.net
blogdns.org
blogsite.org
boldlygoingnowhere.org
broke-it.net
buyshouses.net
cechire.com
dnsalias.com
dnsalias.net
dnsalias.org
dnsdojo.com
dnsdojo.net
dnsdojo.org
does-it.net
doesntexist.com
doesntexist.org
dontexist.com
dontexist.net
dontexist.org
doomdns.com
doomdns.org
dvrdns.org
dyn-o-saur.com
dynalias.com
dynalias.net
dynalias.org
dynathome.net
dyndns.ws
endofinternet.net
endofinternet.org
endoftheinternet.org
est-a-la-maison.com
est-a-la-masion.com
est-le-patron.com
est-mon-blogueur.com
for-better.biz
for-more.biz
for-our.info
for-some.biz
for-the.biz
forgot.her.name
forgot.his.name
from-ak.com
from-al.com
from-ar.com
from-az.net
from-ca.com
from-co.net
from-ct.com
from-dc.com
from-de.com
from-fl.com
from-ga.com
from-hi.com
from-ia.com
from-id.com
from-il.com
from-in.com
from-ks.com
from-ky.com
from-la.net
from-ma.com
from-md.com
from-me.org
from-mi.com
from-mn.com
from-mo.com
from-ms.com
from-mt.com
from-nc.com
from-nd.com
from-ne.com
from-nh.com
from-nj.com
from-nm.com
from-nv.com
from-ny.net
from-oh.com
from-ok.com
from-or.com
from-pa.com
from-pr.com
from-ri.com
from-sc.com
from-sd.com
from-tn.com
from-tx.com
from-ut.com
from-va.com
from-vt.com
from-wa.com
from-wi.com
from-wv.com
from-wy.com
ftpaccess.cc
fuettertdasnetz.de
game-host.org
game-server.cc
getmyip.com
gets-it.net
go.dyndns.org
gotdns.com
gotdns.org
groks-the.info
groks-this.info
ham-radio-op.net
here-for-more.info
hobby-site.com
hobby-site.org
home.dyndns.org
homedns.org
homeftp.net
homeftp.org
homeip.net
homelinux.com
homelinux.net
homelinux.org
homeunix.com
homeunix.net
homeunix.org
iamallama.com
in-the-band.net
is-a-anarchist.com
is-a-blogger.com
is-a-bookkeeper.com
is-a-bruinsfan.org
is-a-bulls-fan.com
is-a-candidate.org
is-a-caterer.com
is-a-celticsfan.org
is-a-chef.com
is-a-chef.net
is-a-chef.org
is-a-conservative.com
is-a-cpa.com
is-a-cubicle-slave.com
is-a-democrat.com
is-a-designer.com
is-a-doctor.com
is-a-financialadvisor.com
is-a-geek.com
is-a-geek.net
is-a-geek.org
is-a-green.com
is-a-guru.com
is-a-hard-worker.com
is-a-hunter.com
is-a-knight.org
is-a-landscaper.com
is-a-lawyer.com
is-a-liberal.com
is-a-libertarian.com
is-a-linux-user.org
is-a-llama.com
is-a-musician.com
is-a-nascarfan.com
is-a-nurse.com
is-a-painter.com
is-a-patsfan.org
is-a-personaltrainer.com
is-a-photographer.com
is-a-player.com
is-a-republican.com
is-a-rockstar.com
is-a-socialist.com
is-a-soxfan.org
is-a-student.com
is-a-teacher.com
is-a-techie.com
is-a-therapist.com
is-an-accountant.com
is-an-actor.com
is-an-actress.com
is-an-anarchist.com
is-an-artist.com
is-an-engineer.com
is-an-entertainer.com
is-by.us
is-certified.com
is-found.org
is-gone.com
is-into-anime.com
is-into-cars.com
is-into-cartoons.com
is-into-games.com
is-leet.com
is-lost.org
is-not-certified.com
is-saved.org
is-slick.com
is-uberleet.com
is-very-bad.org
is-very-evil.org
is-very-good.org
is-very-nice.org
is-very-sweet.org
is-with-theband.com
isa-geek.com
isa-geek.net
isa-geek.org
isa-hockeynut.com
issmarterthanyou.com
isteingeek.de
istmein.de
kicks-ass.net
kicks-ass.org
knowsitall.info
land-4-sale.us
lebtimnetz.de
leitungsen.de
likes-pie.com
likescandy.com
merseine.nu
mine.nu
misconfused.org
mypets.ws
myphotos.cc
neat-url.com
office-on-the.net
on-the-web.tv
podzone.net
podzone.org
readmyblog.org
saves-the-whales.com
scrapper-site.net
scrapping.cc
selfip.biz
selfip.com
selfip.info
selfip.net
selfip.org
sells-for-less.com
sells-for-u.com
sells-it.net
sellsyourhome.org
servebbs.com
servebbs.net
servebbs.org
serveftp.net
serveftp.org
servegame.org
shacknet.nu
simple-url.com
space-to-rent.com
stuff-4-sale.org
stuff-4-sale.us
teaches-yoga.com
thruhere.net
traeumtgerade.de
webhop.biz
webhop.info
webhop.net
webhop.org
worse-than.tv
writesthisblog.com

// ddnss.de : https://www.ddnss.de/
// Submitted by Robert Niedziela <webmaster@ddnss.de>
ddnss.de
dyn.ddnss.de
dyndns.ddnss.de
dyndns1.de
dyn-ip24.de
home-webserver.de
dyn.home-webserver.de
myhome-server.de
ddnss.org

// Definima : http://www.definima.com/
// Submitted by Maxence Bitterli <maxence@definima.com>
definima.net
definima.io

// DigitalOcean App Platform : https://www.digitalocean.com/products/app-platform/
// Submitted by Braxton Huggins <psl-maintainers@digitalocean.com>
ondigitalocean.app

// DigitalOcean Spaces : https://www.digitalocean.com/products/spaces/
// Submitted by Robin H. Johnson <psl-maintainers@digitalocean.com>
*.digitaloceanspaces.com

// dnstrace.pro : https://dnstrace.pro/
// Submitted by Chris Partridge <chris@partridge.tech>
bci.dnstrace.pro

// Dynu.com : https://www.dynu.com/
// Submitted by Sue Ye <sue@dynu.com>
ddnsfree.com
ddnsgeek.com
giize.com
gleeze.com
kozow.com
loseyourip.com
ooguy.com
theworkpc.com
casacam.net
dynu.net
accesscam.org
camdvr.org
freeddns.org
mywire.org
webredirect.org
myddns.rocks
blogsite.xyz

// dynv6 : https://dynv6.com
// Submitted by Dominik Menke <dom@digineo.de>
dynv6.net

// E4YOU spol. s.r.o. : https://e4you.cz/
// Submitted by Vladimir Dudr <info@e4you.cz>
e4.cz

// Easypanel : https://easypanel.io
// Submitted by Andrei Canta <andrei@easypanel.io>
easypanel.app
easypanel.host

// Elementor : Elementor Ltd.
// Submitted by Anton Barkan <antonb@elementor.com>
elementor.cloud
elementor.cool

// En root\u203D : https://en-root.org
// Submitted by Emmanuel Raviart <emmanuel@raviart.com>
en-root.fr

// Enalean SAS: https://www.enalean.com
// Submitted by Thomas Cottier <thomas.cottier@enalean.com>
mytuleap.com
tuleap-partners.com

// Encoretivity AB: https://encore.dev
// Submitted by Andr\xE9 Eriksson <andre@encore.dev>
encr.app
encoreapi.com

// ECG Robotics, Inc: https://ecgrobotics.org
// Submitted by <frc1533@ecgrobotics.org>
onred.one
staging.onred.one

// encoway GmbH : https://www.encoway.de
// Submitted by Marcel Daus <cloudops@encoway.de>
eu.encoway.cloud

// EU.org https://eu.org/
// Submitted by Pierre Beyssac <hostmaster@eu.org>
eu.org
al.eu.org
asso.eu.org
at.eu.org
au.eu.org
be.eu.org
bg.eu.org
ca.eu.org
cd.eu.org
ch.eu.org
cn.eu.org
cy.eu.org
cz.eu.org
de.eu.org
dk.eu.org
edu.eu.org
ee.eu.org
es.eu.org
fi.eu.org
fr.eu.org
gr.eu.org
hr.eu.org
hu.eu.org
ie.eu.org
il.eu.org
in.eu.org
int.eu.org
is.eu.org
it.eu.org
jp.eu.org
kr.eu.org
lt.eu.org
lu.eu.org
lv.eu.org
mc.eu.org
me.eu.org
mk.eu.org
mt.eu.org
my.eu.org
net.eu.org
ng.eu.org
nl.eu.org
no.eu.org
nz.eu.org
paris.eu.org
pl.eu.org
pt.eu.org
q-a.eu.org
ro.eu.org
ru.eu.org
se.eu.org
si.eu.org
sk.eu.org
tr.eu.org
uk.eu.org
us.eu.org

// Eurobyte : https://eurobyte.ru
// Submitted by Evgeniy Subbotin <e.subbotin@eurobyte.ru>
eurodir.ru

// Evennode : http://www.evennode.com/
// Submitted by Michal Kralik <support@evennode.com>
eu-1.evennode.com
eu-2.evennode.com
eu-3.evennode.com
eu-4.evennode.com
us-1.evennode.com
us-2.evennode.com
us-3.evennode.com
us-4.evennode.com

// eDirect Corp. : https://hosting.url.com.tw/
// Submitted by C.S. chang <cschang@corp.url.com.tw>
twmail.cc
twmail.net
twmail.org
mymailer.com.tw
url.tw

// Fabrica Technologies, Inc. : https://www.fabrica.dev/
// Submitted by Eric Jiang <eric@fabrica.dev>
onfabrica.com

// Facebook, Inc.
// Submitted by Peter Ruibal <public-suffix@fb.com>
apps.fbsbx.com

// FAITID : https://faitid.org/
// Submitted by Maxim Alzoba <tech.contact@faitid.org>
// https://www.flexireg.net/stat_info
ru.net
adygeya.ru
bashkiria.ru
bir.ru
cbg.ru
com.ru
dagestan.ru
grozny.ru
kalmykia.ru
kustanai.ru
marine.ru
mordovia.ru
msk.ru
mytis.ru
nalchik.ru
nov.ru
pyatigorsk.ru
spb.ru
vladikavkaz.ru
vladimir.ru
abkhazia.su
adygeya.su
aktyubinsk.su
arkhangelsk.su
armenia.su
ashgabad.su
azerbaijan.su
balashov.su
bashkiria.su
bryansk.su
bukhara.su
chimkent.su
dagestan.su
east-kazakhstan.su
exnet.su
georgia.su
grozny.su
ivanovo.su
jambyl.su
kalmykia.su
kaluga.su
karacol.su
karaganda.su
karelia.su
khakassia.su
krasnodar.su
kurgan.su
kustanai.su
lenug.su
mangyshlak.su
mordovia.su
msk.su
murmansk.su
nalchik.su
navoi.su
north-kazakhstan.su
nov.su
obninsk.su
penza.su
pokrovsk.su
sochi.su
spb.su
tashkent.su
termez.su
togliatti.su
troitsk.su
tselinograd.su
tula.su
tuva.su
vladikavkaz.su
vladimir.su
vologda.su

// Fancy Bits, LLC : http://getchannels.com
// Submitted by Aman Gupta <aman@getchannels.com>
channelsdvr.net
u.channelsdvr.net

// Fastly Inc. : http://www.fastly.com/
// Submitted by Fastly Security <security@fastly.com>
edgecompute.app
fastly-edge.com
fastly-terrarium.com
fastlylb.net
map.fastlylb.net
freetls.fastly.net
map.fastly.net
a.prod.fastly.net
global.prod.fastly.net
a.ssl.fastly.net
b.ssl.fastly.net
global.ssl.fastly.net

// Fastmail : https://www.fastmail.com/
// Submitted by Marc Bradshaw <marc@fastmailteam.com>
*.user.fm

// FASTVPS EESTI OU : https://fastvps.ru/
// Submitted by Likhachev Vasiliy <lihachev@fastvps.ru>
fastvps-server.com
fastvps.host
myfast.host
fastvps.site
myfast.space

// Fedora : https://fedoraproject.org/
// submitted by Patrick Uiterwijk <puiterwijk@fedoraproject.org>
fedorainfracloud.org
fedorapeople.org
cloud.fedoraproject.org
app.os.fedoraproject.org
app.os.stg.fedoraproject.org

// FearWorks Media Ltd. : https://fearworksmedia.co.uk
// submitted by Keith Fairley <domains@fearworksmedia.co.uk>
conn.uk
copro.uk
hosp.uk

// Fermax : https://fermax.com/
// submitted by Koen Van Isterdael <k.vanisterdael@fermax.be>
mydobiss.com

// FH Muenster : https://www.fh-muenster.de
// Submitted by Robin Naundorf <r.naundorf@fh-muenster.de>
fh-muenster.io

// Filegear Inc. : https://www.filegear.com
// Submitted by Jason Zhu <jason@owtware.com>
filegear.me
filegear-au.me
filegear-de.me
filegear-gb.me
filegear-ie.me
filegear-jp.me
filegear-sg.me

// Firebase, Inc.
// Submitted by Chris Raynor <chris@firebase.com>
firebaseapp.com

// Firewebkit : https://www.firewebkit.com
// Submitted by Majid Qureshi <mqureshi@amrayn.com>
fireweb.app

// FLAP : https://www.flap.cloud
// Submitted by Louis Chemineau <louis@chmn.me>
flap.id

// FlashDrive : https://flashdrive.io
// Submitted by Eric Chan <support@flashdrive.io>
onflashdrive.app
fldrv.com

// fly.io: https://fly.io
// Submitted by Kurt Mackey <kurt@fly.io>
fly.dev
edgeapp.net
shw.io

// Flynn : https://flynn.io
// Submitted by Jonathan Rudenberg <jonathan@flynn.io>
flynnhosting.net

// Forgerock : https://www.forgerock.com
// Submitted by Roderick Parr <roderick.parr@forgerock.com>
forgeblocks.com
id.forgerock.io

// Framer : https://www.framer.com
// Submitted by Koen Rouwhorst <koenrh@framer.com>
framer.app
framercanvas.com
framer.media
framer.photos
framer.website
framer.wiki

// Frusky MEDIA&PR : https://www.frusky.de
// Submitted by Victor Pupynin <hallo@frusky.de>
*.frusky.de

// RavPage : https://www.ravpage.co.il
// Submitted by Roni Horowitz <roni@responder.co.il>
ravpage.co.il

// Frederik Braun https://frederik-braun.com
// Submitted by Frederik Braun <fb@frederik-braun.com>
0e.vc

// Freebox : http://www.freebox.fr
// Submitted by Romain Fliedel <rfliedel@freebox.fr>
freebox-os.com
freeboxos.com
fbx-os.fr
fbxos.fr
freebox-os.fr
freeboxos.fr

// freedesktop.org : https://www.freedesktop.org
// Submitted by Daniel Stone <daniel@fooishbar.org>
freedesktop.org

// freemyip.com : https://freemyip.com
// Submitted by Cadence <contact@freemyip.com>
freemyip.com

// FunkFeuer - Verein zur F\xF6rderung freier Netze : https://www.funkfeuer.at
// Submitted by Daniel A. Maierhofer <vorstand@funkfeuer.at>
wien.funkfeuer.at

// Futureweb OG : http://www.futureweb.at
// Submitted by Andreas Schnederle-Wagner <schnederle@futureweb.at>
*.futurecms.at
*.ex.futurecms.at
*.in.futurecms.at
futurehosting.at
futuremailing.at
*.ex.ortsinfo.at
*.kunden.ortsinfo.at
*.statics.cloud

// GDS : https://www.gov.uk/service-manual/technology/managing-domain-names
// Submitted by Stephen Ford <hostmaster@digital.cabinet-office.gov.uk>
independent-commission.uk
independent-inquest.uk
independent-inquiry.uk
independent-panel.uk
independent-review.uk
public-inquiry.uk
royal-commission.uk
campaign.gov.uk
service.gov.uk

// CDDO : https://www.gov.uk/guidance/get-an-api-domain-on-govuk
// Submitted by Jamie Tanna <jamie.tanna@digital.cabinet-office.gov.uk>
api.gov.uk

// Gehirn Inc. : https://www.gehirn.co.jp/
// Submitted by Kohei YOSHIDA <tech@gehirn.co.jp>
gehirn.ne.jp
usercontent.jp

// Gentlent, Inc. : https://www.gentlent.com
// Submitted by Tom Klein <tom@gentlent.com>
gentapps.com
gentlentapis.com
lab.ms
cdn-edges.net

// Ghost Foundation : https://ghost.org
// Submitted by Matt Hanley <security@ghost.org>
ghost.io

// GignoSystemJapan: http://gsj.bz
// Submitted by GignoSystemJapan <kakutou-ec@gsj.bz>
gsj.bz

// GitHub, Inc.
// Submitted by Patrick Toomey <security@github.com>
githubusercontent.com
githubpreview.dev
github.io

// GitLab, Inc.
// Submitted by Alex Hanselka <alex@gitlab.com>
gitlab.io

// Gitplac.si - https://gitplac.si
// Submitted by Alja\u017E Starc <me@aljaxus.eu>
gitapp.si
gitpage.si

// Glitch, Inc : https://glitch.com
// Submitted by Mads Hartmann <mads@glitch.com>
glitch.me

// Global NOG Alliance : https://nogalliance.org/
// Submitted by Sander Steffann <sander@nogalliance.org>
nog.community

// Globe Hosting SRL : https://www.globehosting.com/
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
co.ro
shop.ro

// GMO Pepabo, Inc. : https://pepabo.com/
// Submitted by Hosting Div <admin@pepabo.com>
lolipop.io
angry.jp
babyblue.jp
babymilk.jp
backdrop.jp
bambina.jp
bitter.jp
blush.jp
boo.jp
boy.jp
boyfriend.jp
but.jp
candypop.jp
capoo.jp
catfood.jp
cheap.jp
chicappa.jp
chillout.jp
chips.jp
chowder.jp
chu.jp
ciao.jp
cocotte.jp
coolblog.jp
cranky.jp
cutegirl.jp
daa.jp
deca.jp
deci.jp
digick.jp
egoism.jp
fakefur.jp
fem.jp
flier.jp
floppy.jp
fool.jp
frenchkiss.jp
girlfriend.jp
girly.jp
gloomy.jp
gonna.jp
greater.jp
hacca.jp
heavy.jp
her.jp
hiho.jp
hippy.jp
holy.jp
hungry.jp
icurus.jp
itigo.jp
jellybean.jp
kikirara.jp
kill.jp
kilo.jp
kuron.jp
littlestar.jp
lolipopmc.jp
lolitapunk.jp
lomo.jp
lovepop.jp
lovesick.jp
main.jp
mods.jp
mond.jp
mongolian.jp
moo.jp
namaste.jp
nikita.jp
nobushi.jp
noor.jp
oops.jp
parallel.jp
parasite.jp
pecori.jp
peewee.jp
penne.jp
pepper.jp
perma.jp
pigboat.jp
pinoko.jp
punyu.jp
pupu.jp
pussycat.jp
pya.jp
raindrop.jp
readymade.jp
sadist.jp
schoolbus.jp
secret.jp
staba.jp
stripper.jp
sub.jp
sunnyday.jp
thick.jp
tonkotsu.jp
under.jp
upper.jp
velvet.jp
verse.jp
versus.jp
vivian.jp
watson.jp
weblike.jp
whitesnow.jp
zombie.jp
heteml.net

// GOV.UK Platform as a Service : https://www.cloud.service.gov.uk/
// Submitted by Tom Whitwell <gov-uk-paas-support@digital.cabinet-office.gov.uk>
cloudapps.digital
london.cloudapps.digital

// GOV.UK Pay : https://www.payments.service.gov.uk/
// Submitted by Richard Baker <richard.baker@digital.cabinet-office.gov.uk>
pymnt.uk

// UKHomeOffice : https://www.gov.uk/government/organisations/home-office
// Submitted by Jon Shanks <jon.shanks@digital.homeoffice.gov.uk>
homeoffice.gov.uk

// GlobeHosting, Inc.
// Submitted by Zoltan Egresi <egresi@globehosting.com>
ro.im

// GoIP DNS Services : http://www.goip.de
// Submitted by Christian Poulter <milchstrasse@goip.de>
goip.de

// Google, Inc.
// Submitted by Eduardo Vela <evn@google.com>
run.app
a.run.app
web.app
*.0emm.com
appspot.com
*.r.appspot.com
codespot.com
googleapis.com
googlecode.com
pagespeedmobilizer.com
publishproxy.com
withgoogle.com
withyoutube.com
*.gateway.dev
cloud.goog
translate.goog
*.usercontent.goog
cloudfunctions.net
blogspot.ae
blogspot.al
blogspot.am
blogspot.ba
blogspot.be
blogspot.bg
blogspot.bj
blogspot.ca
blogspot.cf
blogspot.ch
blogspot.cl
blogspot.co.at
blogspot.co.id
blogspot.co.il
blogspot.co.ke
blogspot.co.nz
blogspot.co.uk
blogspot.co.za
blogspot.com
blogspot.com.ar
blogspot.com.au
blogspot.com.br
blogspot.com.by
blogspot.com.co
blogspot.com.cy
blogspot.com.ee
blogspot.com.eg
blogspot.com.es
blogspot.com.mt
blogspot.com.ng
blogspot.com.tr
blogspot.com.uy
blogspot.cv
blogspot.cz
blogspot.de
blogspot.dk
blogspot.fi
blogspot.fr
blogspot.gr
blogspot.hk
blogspot.hr
blogspot.hu
blogspot.ie
blogspot.in
blogspot.is
blogspot.it
blogspot.jp
blogspot.kr
blogspot.li
blogspot.lt
blogspot.lu
blogspot.md
blogspot.mk
blogspot.mr
blogspot.mx
blogspot.my
blogspot.nl
blogspot.no
blogspot.pe
blogspot.pt
blogspot.qa
blogspot.re
blogspot.ro
blogspot.rs
blogspot.ru
blogspot.se
blogspot.sg
blogspot.si
blogspot.sk
blogspot.sn
blogspot.td
blogspot.tw
blogspot.ug
blogspot.vn

// Goupile : https://goupile.fr
// Submitted by Niels Martignene <hello@goupile.fr>
goupile.fr

// Government of the Netherlands: https://www.government.nl
// Submitted by <domeinnaam@minaz.nl>
gov.nl

// Group 53, LLC : https://www.group53.com
// Submitted by Tyler Todd <noc@nova53.net>
awsmppl.com

// G\xFCnstigBestellen : https://g\xFCnstigbestellen.de
// Submitted by Furkan Akkoc <info@hendelzon.de>
g\xFCnstigbestellen.de
g\xFCnstigliefern.de

// Hakaran group: http://hakaran.cz
// Submitted by Arseniy Sokolov <security@hakaran.cz>
fin.ci
free.hr
caa.li
ua.rs
conf.se

// Handshake : https://handshake.org
// Submitted by Mike Damm <md@md.vc>
hs.zone
hs.run

// Hashbang : https://hashbang.sh
hashbang.sh

// Hasura : https://hasura.io
// Submitted by Shahidh K Muhammed <shahidh@hasura.io>
hasura.app
hasura-app.io

// Heilbronn University of Applied Sciences - Faculty Informatics (GitLab Pages): https://www.hs-heilbronn.de
// Submitted by Richard Zowalla <mi-admin@hs-heilbronn.de>
pages.it.hs-heilbronn.de

// Hepforge : https://www.hepforge.org
// Submitted by David Grellscheid <admin@hepforge.org>
hepforge.org

// Heroku : https://www.heroku.com/
// Submitted by Tom Maher <tmaher@heroku.com>
herokuapp.com
herokussl.com

// Hibernating Rhinos
// Submitted by Oren Eini <oren@ravendb.net>
ravendb.cloud
ravendb.community
ravendb.me
development.run
ravendb.run

// home.pl S.A.: https://home.pl
// Submitted by Krzysztof Wolski <krzysztof.wolski@home.eu>
homesklep.pl

// Hong Kong Productivity Council: https://www.hkpc.org/
// Submitted by SECaaS Team <summchan@hkpc.org>
secaas.hk

// Hoplix : https://www.hoplix.com
// Submitted by Danilo De Franco<info@hoplix.shop>
hoplix.shop


// HOSTBIP REGISTRY : https://www.hostbip.com/
// Submitted by Atanunu Igbunuroghene <publicsuffixlist@hostbip.com>
orx.biz
biz.gl
col.ng
firm.ng
gen.ng
ltd.ng
ngo.ng
edu.scot
sch.so

// HostFly : https://www.ie.ua
// Submitted by Bohdan Dub <support@hostfly.com.ua>
ie.ua

// HostyHosting (hostyhosting.com)
hostyhosting.io

// H\xE4kkinen.fi
// Submitted by Eero H\xE4kkinen <Eero+psl@H\xE4kkinen.fi>
h\xE4kkinen.fi

// Ici la Lune : http://www.icilalune.com/
// Submitted by Simon Morvan <simon@icilalune.com>
*.moonscale.io
moonscale.net

// iki.fi
// Submitted by Hannu Aronsson <haa@iki.fi>
iki.fi

// iliad italia: https://www.iliad.it
// Submitted by Marios Makassikis <mmakassikis@freebox.fr>
ibxos.it
iliadboxos.it

// Impertrix Solutions : <https://impertrixcdn.com>
// Submitted by Zhixiang Zhao <csuite@impertrix.com>
impertrixcdn.com
impertrix.com

// Incsub, LLC: https://incsub.com/
// Submitted by Aaron Edwards <sysadmins@incsub.com>
smushcdn.com
wphostedmail.com
wpmucdn.com
tempurl.host
wpmudev.host

// Individual Network Berlin e.V. : https://www.in-berlin.de/
// Submitted by Christian Seitz <chris@in-berlin.de>
dyn-berlin.de
in-berlin.de
in-brb.de
in-butter.de
in-dsl.de
in-dsl.net
in-dsl.org
in-vpn.de
in-vpn.net
in-vpn.org

// info.at : http://www.info.at/
biz.at
info.at

// info.cx : http://info.cx
// Submitted by Jacob Slater <whois@igloo.to>
info.cx

// Interlegis : http://www.interlegis.leg.br
// Submitted by Gabriel Ferreira <registrobr@interlegis.leg.br>
ac.leg.br
al.leg.br
am.leg.br
ap.leg.br
ba.leg.br
ce.leg.br
df.leg.br
es.leg.br
go.leg.br
ma.leg.br
mg.leg.br
ms.leg.br
mt.leg.br
pa.leg.br
pb.leg.br
pe.leg.br
pi.leg.br
pr.leg.br
rj.leg.br
rn.leg.br
ro.leg.br
rr.leg.br
rs.leg.br
sc.leg.br
se.leg.br
sp.leg.br
to.leg.br

// intermetrics GmbH : https://pixolino.com/
// Submitted by Wolfgang Schwarz <admin@intermetrics.de>
pixolino.com

// Internet-Pro, LLP: https://netangels.ru/
// Submitted by Vasiliy Sheredeko <piphon@gmail.com>
na4u.ru

// iopsys software solutions AB : https://iopsys.eu/
// Submitted by Roman Azarenko <roman.azarenko@iopsys.eu>
iopsys.se

// IPiFony Systems, Inc. : https://www.ipifony.com/
// Submitted by Matthew Hardeman <mhardeman@ipifony.com>
ipifony.net

// IServ GmbH : https://iserv.de
// Submitted by Mario Hoberg <info@iserv.de>
iservschule.de
mein-iserv.de
schulplattform.de
schulserver.de
test-iserv.de
iserv.dev

// I-O DATA DEVICE, INC. : http://www.iodata.com/
// Submitted by Yuji Minagawa <domains-admin@iodata.jp>
iobb.net

// Jelastic, Inc. : https://jelastic.com/
// Submitted by Ihor Kolodyuk <ik@jelastic.com>
mel.cloudlets.com.au
cloud.interhostsolutions.be
mycloud.by
alp1.ae.flow.ch
appengine.flow.ch
es-1.axarnet.cloud
diadem.cloud
vip.jelastic.cloud
jele.cloud
it1.eur.aruba.jenv-aruba.cloud
it1.jenv-aruba.cloud
keliweb.cloud
cs.keliweb.cloud
oxa.cloud
tn.oxa.cloud
uk.oxa.cloud
primetel.cloud
uk.primetel.cloud
ca.reclaim.cloud
uk.reclaim.cloud
us.reclaim.cloud
ch.trendhosting.cloud
de.trendhosting.cloud
jele.club
amscompute.com
dopaas.com
paas.hosted-by-previder.com
rag-cloud.hosteur.com
rag-cloud-ch.hosteur.com
jcloud.ik-server.com
jcloud-ver-jpc.ik-server.com
demo.jelastic.com
kilatiron.com
paas.massivegrid.com
jed.wafaicloud.com
lon.wafaicloud.com
ryd.wafaicloud.com
j.scaleforce.com.cy
jelastic.dogado.eu
fi.cloudplatform.fi
demo.datacenter.fi
paas.datacenter.fi
jele.host
mircloud.host
paas.beebyte.io
sekd1.beebyteapp.io
jele.io
cloud-fr1.unispace.io
jc.neen.it
cloud.jelastic.open.tim.it
jcloud.kz
upaas.kazteleport.kz
cloudjiffy.net
fra1-de.cloudjiffy.net
west1-us.cloudjiffy.net
jls-sto1.elastx.net
jls-sto2.elastx.net
jls-sto3.elastx.net
faststacks.net
fr-1.paas.massivegrid.net
lon-1.paas.massivegrid.net
lon-2.paas.massivegrid.net
ny-1.paas.massivegrid.net
ny-2.paas.massivegrid.net
sg-1.paas.massivegrid.net
jelastic.saveincloud.net
nordeste-idc.saveincloud.net
j.scaleforce.net
jelastic.tsukaeru.net
sdscloud.pl
unicloud.pl
mircloud.ru
jelastic.regruhosting.ru
enscaled.sg
jele.site
jelastic.team
orangecloud.tn
j.layershift.co.uk
phx.enscaled.us
mircloud.us

// Jino : https://www.jino.ru
// Submitted by Sergey Ulyashin <ulyashin@jino.ru>
myjino.ru
*.hosting.myjino.ru
*.landing.myjino.ru
*.spectrum.myjino.ru
*.vps.myjino.ru

// Jotelulu S.L. : https://jotelulu.com
// Submitted by Daniel Fari\xF1a <ingenieria@jotelulu.com>
jotelulu.cloud

// Joyent : https://www.joyent.com/
// Submitted by Brian Bennett <brian.bennett@joyent.com>
*.triton.zone
*.cns.joyent.com

// JS.ORG : http://dns.js.org
// Submitted by Stefan Keim <admin@js.org>
js.org

// KaasHosting : http://www.kaashosting.nl/
// Submitted by Wouter Bakker <hostmaster@kaashosting.nl>
kaas.gg
khplay.nl

// Kakao : https://www.kakaocorp.com/
// Submitted by JaeYoong Lee <cec@kakaocorp.com>
ktistory.com

// Kapsi : https://kapsi.fi
// Submitted by Tomi Juntunen <erani@kapsi.fi>
kapsi.fi

// Keyweb AG : https://www.keyweb.de
// Submitted by Martin Dannehl <postmaster@keymachine.de>
keymachine.de

// KingHost : https://king.host
// Submitted by Felipe Keller Braz <felipebraz@kinghost.com.br>
kinghost.net
uni5.net

// KnightPoint Systems, LLC : http://www.knightpoint.com/
// Submitted by Roy Keene <rkeene@knightpoint.com>
knightpoint.systems

// KoobinEvent, SL: https://www.koobin.com
// Submitted by Iv\xE1n Oliva <ivan.oliva@koobin.com>
koobin.events

// KUROKU LTD : https://kuroku.ltd/
// Submitted by DisposaBoy <security@oya.to>
oya.to

// Katholieke Universiteit Leuven: https://www.kuleuven.be
// Submitted by Abuse KU Leuven <abuse@kuleuven.be>
kuleuven.cloud
ezproxy.kuleuven.be

// .KRD : http://nic.krd/data/krd/Registration%20Policy.pdf
co.krd
edu.krd

// Krellian Ltd. : https://krellian.com
// Submitted by Ben Francis <ben@krellian.com>
krellian.net
webthings.io

// LCube - Professional hosting e.K. : https://www.lcube-webhosting.de
// Submitted by Lars Laehn <info@lcube.de>
git-repos.de
lcube-server.de
svn-repos.de

// Leadpages : https://www.leadpages.net
// Submitted by Greg Dallavalle <domains@leadpages.net>
leadpages.co
lpages.co
lpusercontent.com

// Lelux.fi : https://lelux.fi/
// Submitted by Lelux Admin <publisuffix@lelux.site>
lelux.site

// Lifetime Hosting : https://Lifetime.Hosting/
// Submitted by Mike Fillator <support@lifetime.hosting>
co.business
co.education
co.events
co.financial
co.network
co.place
co.technology

// Lightmaker Property Manager, Inc. : https://app.lmpm.com/
// Submitted by Greg Holland <greg.holland@lmpm.com>
app.lmpm.com

// linkyard ldt: https://www.linkyard.ch/
// Submitted by Mario Siegenthaler <mario.siegenthaler@linkyard.ch>
linkyard.cloud
linkyard-cloud.ch

// Linode : https://linode.com
// Submitted by <security@linode.com>
members.linode.com
*.nodebalancer.linode.com
*.linodeobjects.com
ip.linodeusercontent.com

// LiquidNet Ltd : http://www.liquidnetlimited.com/
// Submitted by Victor Velchev <admin@liquidnetlimited.com>
we.bs

// Localcert : https://localcert.dev
// Submitted by Lann Martin <security@localcert.dev>
*.user.localcert.dev

// localzone.xyz
// Submitted by Kenny Niehage <hello@yahe.sh>
localzone.xyz

// Log'in Line : https://www.loginline.com/
// Submitted by R\xE9mi Mach <remi.mach@loginline.com>
loginline.app
loginline.dev
loginline.io
loginline.services
loginline.site

// Lokalized : https://lokalized.nl
// Submitted by Noah Taheij <noah@lokalized.nl>
servers.run

// L\xF5hmus Family, The
// Submitted by Heiki L\xF5hmus <hostmaster at lohmus dot me>
lohmus.me

// LubMAN UMCS Sp. z o.o : https://lubman.pl/
// Submitted by Ireneusz Maliszewski <ireneusz.maliszewski@lubman.pl>
krasnik.pl
leczna.pl
lubartow.pl
lublin.pl
poniatowa.pl
swidnik.pl

// Lug.org.uk : https://lug.org.uk
// Submitted by Jon Spriggs <admin@lug.org.uk>
glug.org.uk
lug.org.uk
lugs.org.uk

// Lukanet Ltd : https://lukanet.com
// Submitted by Anton Avramov <register@lukanet.com>
barsy.bg
barsy.co.uk
barsyonline.co.uk
barsycenter.com
barsyonline.com
barsy.club
barsy.de
barsy.eu
barsy.in
barsy.info
barsy.io
barsy.me
barsy.menu
barsy.mobi
barsy.net
barsy.online
barsy.org
barsy.pro
barsy.pub
barsy.ro
barsy.shop
barsy.site
barsy.support
barsy.uk

// Magento Commerce
// Submitted by Damien Tournoud <dtournoud@magento.cloud>
*.magentosite.cloud

// May First - People Link : https://mayfirst.org/
// Submitted by Jamie McClelland <info@mayfirst.org>
mayfirst.info
mayfirst.org

// Mail.Ru Group : https://hb.cldmail.ru
// Submitted by Ilya Zaretskiy <zaretskiy@corp.mail.ru>
hb.cldmail.ru

// Mail Transfer Platform : https://www.neupeer.com
// Submitted by Li Hui <lihui@neupeer.com>
cn.vu

// Maze Play: https://www.mazeplay.com
// Submitted by Adam Humpherys <adam@mws.dev>
mazeplay.com

// mcpe.me : https://mcpe.me
// Submitted by Noa Heyl <hi@noa.dev>
mcpe.me

// McHost : https://mchost.ru
// Submitted by Evgeniy Subbotin <e.subbotin@mchost.ru>
mcdir.me
mcdir.ru
mcpre.ru
vps.mcdir.ru

// Mediatech : https://mediatech.by
// Submitted by Evgeniy Kozhuhovskiy <ugenk@mediatech.by>
mediatech.by
mediatech.dev

// Medicom Health : https://medicomhealth.com
// Submitted by Michael Olson <molson@medicomhealth.com>
hra.health

// Memset hosting : https://www.memset.com
// Submitted by Tom Whitwell <domains@memset.com>
miniserver.com
memset.net

// Messerli Informatik AG : https://www.messerli.ch/
// Submitted by Ruben Schmidmeister <psl-maintainers@messerli.ch>
messerli.app

// MetaCentrum, CESNET z.s.p.o. : https://www.metacentrum.cz/en/
// Submitted by Zden\u011Bk \u0160ustr <zdenek.sustr@cesnet.cz>
*.cloud.metacentrum.cz
custom.metacentrum.cz

// MetaCentrum, CESNET z.s.p.o. : https://www.metacentrum.cz/en/
// Submitted by Radim Jan\u010Da <janca@cesnet.cz>
flt.cloud.muni.cz
usr.cloud.muni.cz

// Meteor Development Group : https://www.meteor.com/hosting
// Submitted by Pierre Carrier <pierre@meteor.com>
meteorapp.com
eu.meteorapp.com

// Michau Enterprises Limited : http://www.co.pl/
co.pl

// Microsoft Corporation : http://microsoft.com
// Submitted by Public Suffix List Admin <msftpsladmin@microsoft.com>
*.azurecontainer.io
azurewebsites.net
azure-mobile.net
cloudapp.net
azurestaticapps.net
1.azurestaticapps.net
2.azurestaticapps.net
3.azurestaticapps.net
centralus.azurestaticapps.net
eastasia.azurestaticapps.net
eastus2.azurestaticapps.net
westeurope.azurestaticapps.net
westus2.azurestaticapps.net

// minion.systems : http://minion.systems
// Submitted by Robert B\xF6ttinger <r@minion.systems>
csx.cc

// Mintere : https://mintere.com/
// Submitted by Ben Aubin <security@mintere.com>
mintere.site

// MobileEducation, LLC : https://joinforte.com
// Submitted by Grayson Martin <grayson.martin@mobileeducation.us>
forte.id

// Mozilla Corporation : https://mozilla.com
// Submitted by Ben Francis <bfrancis@mozilla.com>
mozilla-iot.org

// Mozilla Foundation : https://mozilla.org/
// Submitted by glob <glob@mozilla.com>
bmoattachments.org

// MSK-IX : https://www.msk-ix.ru/
// Submitted by Khannanov Roman <r.khannanov@msk-ix.ru>
net.ru
org.ru
pp.ru

// Mythic Beasts : https://www.mythic-beasts.com
// Submitted by Paul Cammish <kelduum@mythic-beasts.com>
hostedpi.com
customer.mythic-beasts.com
caracal.mythic-beasts.com
fentiger.mythic-beasts.com
lynx.mythic-beasts.com
ocelot.mythic-beasts.com
oncilla.mythic-beasts.com
onza.mythic-beasts.com
sphinx.mythic-beasts.com
vs.mythic-beasts.com
x.mythic-beasts.com
yali.mythic-beasts.com
cust.retrosnub.co.uk

// Nabu Casa : https://www.nabucasa.com
// Submitted by Paulus Schoutsen <infra@nabucasa.com>
ui.nabu.casa

// Net at Work Gmbh : https://www.netatwork.de
// Submitted by Jan Jaeschke <jan.jaeschke@netatwork.de>
cloud.nospamproxy.com

// Netlify : https://www.netlify.com
// Submitted by Jessica Parsons <jessica@netlify.com>
netlify.app

// Neustar Inc.
// Submitted by Trung Tran <Trung.Tran@neustar.biz>
4u.com

// ngrok : https://ngrok.com/
// Submitted by Alan Shreve <alan@ngrok.com>
ngrok.app
ngrok-free.app
ngrok.dev
ngrok-free.dev
ngrok.io
ap.ngrok.io
au.ngrok.io
eu.ngrok.io
in.ngrok.io
jp.ngrok.io
sa.ngrok.io
us.ngrok.io
ngrok.pizza

// Nimbus Hosting Ltd. : https://www.nimbushosting.co.uk/
// Submitted by Nicholas Ford <nick@nimbushosting.co.uk>
nh-serv.co.uk

// NFSN, Inc. : https://www.NearlyFreeSpeech.NET/
// Submitted by Jeff Wheelhouse <support@nearlyfreespeech.net>
nfshost.com

// Noop : https://noop.app
// Submitted by Nathaniel Schweinberg <noop@rearc.io>
*.developer.app
noop.app

// Northflank Ltd. : https://northflank.com/
// Submitted by Marco Suter <marco@northflank.com>
*.northflank.app
*.build.run
*.code.run
*.database.run
*.migration.run

// Noticeable : https://noticeable.io
// Submitted by Laurent Pellegrino <security@noticeable.io>
noticeable.news

// Now-DNS : https://now-dns.com
// Submitted by Steve Russell <steve@now-dns.com>
dnsking.ch
mypi.co
n4t.co
001www.com
ddnslive.com
myiphost.com
forumz.info
16-b.it
32-b.it
64-b.it
soundcast.me
tcp4.me
dnsup.net
hicam.net
now-dns.net
ownip.net
vpndns.net
dynserv.org
now-dns.org
x443.pw
now-dns.top
ntdll.top
freeddns.us
crafting.xyz
zapto.xyz

// nsupdate.info : https://www.nsupdate.info/
// Submitted by Thomas Waldmann <info@nsupdate.info>
nsupdate.info
nerdpol.ovh

// No-IP.com : https://noip.com/
// Submitted by Deven Reza <publicsuffixlist@noip.com>
blogsyte.com
brasilia.me
cable-modem.org
ciscofreak.com
collegefan.org
couchpotatofries.org
damnserver.com
ddns.me
ditchyourip.com
dnsfor.me
dnsiskinky.com
dvrcam.info
dynns.com
eating-organic.net
fantasyleague.cc
geekgalaxy.com
golffan.us
health-carereform.com
homesecuritymac.com
homesecuritypc.com
hopto.me
ilovecollege.info
loginto.me
mlbfan.org
mmafan.biz
myactivedirectory.com
mydissent.net
myeffect.net
mymediapc.net
mypsx.net
mysecuritycamera.com
mysecuritycamera.net
mysecuritycamera.org
net-freaks.com
nflfan.org
nhlfan.net
no-ip.ca
no-ip.co.uk
no-ip.net
noip.us
onthewifi.com
pgafan.net
point2this.com
pointto.us
privatizehealthinsurance.net
quicksytes.com
read-books.org
securitytactics.com
serveexchange.com
servehumour.com
servep2p.com
servesarcasm.com
stufftoread.com
ufcfan.org
unusualperson.com
workisboring.com
3utilities.com
bounceme.net
ddns.net
ddnsking.com
gotdns.ch
hopto.org
myftp.biz
myftp.org
myvnc.com
no-ip.biz
no-ip.info
no-ip.org
noip.me
redirectme.net
servebeer.com
serveblog.net
servecounterstrike.com
serveftp.com
servegame.com
servehalflife.com
servehttp.com
serveirc.com
serveminecraft.net
servemp3.com
servepics.com
servequake.com
sytes.net
webhop.me
zapto.org

// NodeArt : https://nodeart.io
// Submitted by Konstantin Nosov <Nosov@nodeart.io>
stage.nodeart.io

// Nucleos Inc. : https://nucleos.com
// Submitted by Piotr Zduniak <piotr@nucleos.com>
pcloud.host

// NYC.mn : http://www.information.nyc.mn
// Submitted by Matthew Brown <mattbrown@nyc.mn>
nyc.mn

// Observable, Inc. : https://observablehq.com
// Submitted by Mike Bostock <dns@observablehq.com>
static.observableusercontent.com

// Octopodal Solutions, LLC. : https://ulterius.io/
// Submitted by Andrew Sampson <andrew@ulterius.io>
cya.gg

// OMG.LOL : <https://omg.lol>
// Submitted by Adam Newbold <adam@omg.lol>
omg.lol

// Omnibond Systems, LLC. : https://www.omnibond.com
// Submitted by Cole Estep <cole@omnibond.com>
cloudycluster.net

// OmniWe Limited: https://omniwe.com
// Submitted by Vicary Archangel <vicary@omniwe.com>
omniwe.site

// One.com: https://www.one.com/
// Submitted by Jacob Bunk Nielsen <jbn@one.com>
123hjemmeside.dk
123hjemmeside.no
123homepage.it
123kotisivu.fi
123minsida.se
123miweb.es
123paginaweb.pt
123sait.ru
123siteweb.fr
123webseite.at
123webseite.de
123website.be
123website.ch
123website.lu
123website.nl
service.one
simplesite.com
simplesite.com.br
simplesite.gr
simplesite.pl

// One Fold Media : http://www.onefoldmedia.com/
// Submitted by Eddie Jones <eddie@onefoldmedia.com>
nid.io

// Open Social : https://www.getopensocial.com/
// Submitted by Alexander Varwijk <security@getopensocial.com>
opensocial.site

// OpenCraft GmbH : http://opencraft.com/
// Submitted by Sven Marnach <sven@opencraft.com>
opencraft.hosting

// OpenResearch GmbH: https://openresearch.com/
// Submitted by Philipp Schmid <ops@openresearch.com>
orsites.com

// Opera Software, A.S.A.
// Submitted by Yngve Pettersen <yngve@opera.com>
operaunite.com

// Orange : https://www.orange.com
// Submitted by Alexandre Linte <alexandre.linte@orange.com>
tech.orange

// Oursky Limited : https://authgear.com/, https://skygear.io/
// Submitted by Authgear Team <hello@authgear.com>, Skygear Developer <hello@skygear.io>
authgear-staging.com
authgearapps.com
skygearapp.com

// OutSystems
// Submitted by Duarte Santos <domain-admin@outsystemscloud.com>
outsystemscloud.com

// OVHcloud: https://ovhcloud.com
// Submitted by Vincent Cass\xE9 <vincent.casse@ovhcloud.com>
*.webpaas.ovh.net
*.hosting.ovh.net

// OwnProvider GmbH: http://www.ownprovider.com
// Submitted by Jan Moennich <jan.moennich@ownprovider.com>
ownprovider.com
own.pm

// OwO : https://whats-th.is/
// Submitted by Dean Sheather <dean@deansheather.com>
*.owo.codes

// OX : http://www.ox.rs
// Submitted by Adam Grand <webmaster@mail.ox.rs>
ox.rs

// oy.lc
// Submitted by Charly Coste <changaco@changaco.oy.lc>
oy.lc

// Pagefog : https://pagefog.com/
// Submitted by Derek Myers <derek@pagefog.com>
pgfog.com

// Pagefront : https://www.pagefronthq.com/
// Submitted by Jason Kriss <jason@pagefronthq.com>
pagefrontapp.com

// PageXL : https://pagexl.com
// Submitted by Yann Guichard <yann@pagexl.com>
pagexl.com

// Paywhirl, Inc : https://paywhirl.com/
// Submitted by Daniel Netzer <dan@paywhirl.com>
*.paywhirl.com

// pcarrier.ca Software Inc: https://pcarrier.ca/
// Submitted by Pierre Carrier <pc@rrier.ca>
bar0.net
bar1.net
bar2.net
rdv.to

// .pl domains (grandfathered)
art.pl
gliwice.pl
krakow.pl
poznan.pl
wroc.pl
zakopane.pl

// Pantheon Systems, Inc. : https://pantheon.io/
// Submitted by Gary Dylina <gary@pantheon.io>
pantheonsite.io
gotpantheon.com

// Peplink | Pepwave : http://peplink.com/
// Submitted by Steve Leung <steveleung@peplink.com>
mypep.link

// Perspecta : https://perspecta.com/
// Submitted by Kenneth Van Alstyne <kvanalstyne@perspecta.com>
perspecta.cloud

// PE Ulyanov Kirill Sergeevich : https://airy.host
// Submitted by Kirill Ulyanov <k.ulyanov@airy.host>
lk3.ru

// Planet-Work : https://www.planet-work.com/
// Submitted by Fr\xE9d\xE9ric VANNI\xC8RE <f.vanniere@planet-work.com>
on-web.fr

// Platform.sh : https://platform.sh
// Submitted by Nikola Kotur <nikola@platform.sh>
bc.platform.sh
ent.platform.sh
eu.platform.sh
us.platform.sh
*.platformsh.site
*.tst.site

// Platter: https://platter.dev
// Submitted by Patrick Flor <patrick@platter.dev>
platter-app.com
platter-app.dev
platterp.us

// Plesk : https://www.plesk.com/
// Submitted by Anton Akhtyamov <program-managers@plesk.com>
pdns.page
plesk.page
pleskns.com

// Port53 : https://port53.io/
// Submitted by Maximilian Schieder <maxi@zeug.co>
dyn53.io

// Porter : https://porter.run/
// Submitted by Rudraksh MK <rudi@porter.run>
onporter.run

// Positive Codes Technology Company : http://co.bn/faq.html
// Submitted by Zulfais <pc@co.bn>
co.bn

// Postman, Inc : https://postman.com
// Submitted by Rahul Dhawan <security@postman.com>
postman-echo.com
pstmn.io
mock.pstmn.io
httpbin.org

//prequalifyme.today : https://prequalifyme.today
//Submitted by DeepakTiwari deepak@ivylead.io
prequalifyme.today

// prgmr.com : https://prgmr.com/
// Submitted by Sarah Newman <owner@prgmr.com>
xen.prgmr.com

// priv.at : http://www.nic.priv.at/
// Submitted by registry <lendl@nic.at>
priv.at

// privacytools.io : https://www.privacytools.io/
// Submitted by Jonah Aragon <jonah@privacytools.io>
prvcy.page

// Protocol Labs : https://protocol.ai/
// Submitted by Michael Burns <noc@protocol.ai>
*.dweb.link

// Protonet GmbH : http://protonet.io
// Submitted by Martin Meier <admin@protonet.io>
protonet.io

// Publication Presse Communication SARL : https://ppcom.fr
// Submitted by Yaacov Akiba Slama <admin@chirurgiens-dentistes-en-france.fr>
chirurgiens-dentistes-en-france.fr
byen.site

// pubtls.org: https://www.pubtls.org
// Submitted by Kor Nielsen <kor@pubtls.org>
pubtls.org

// PythonAnywhere LLP: https://www.pythonanywhere.com
// Submitted by Giles Thomas <giles@pythonanywhere.com>
pythonanywhere.com
eu.pythonanywhere.com

// QOTO, Org.
// Submitted by Jeffrey Phillips Freeman <jeffrey.freeman@qoto.org>
qoto.io

// Qualifio : https://qualifio.com/
// Submitted by Xavier De Cock <xdecock@gmail.com>
qualifioapp.com

// Quality Unit: https://qualityunit.com
// Submitted by Vasyl Tsalko <vtsalko@qualityunit.com>
ladesk.com

// QuickBackend: https://www.quickbackend.com
// Submitted by Dani Biro <dani@pymet.com>
qbuser.com

// Rad Web Hosting: https://radwebhosting.com
// Submitted by Scott Claeys <s.claeys@radwebhosting.com>
cloudsite.builders

// Redgate Software: https://red-gate.com
// Submitted by Andrew Farries <andrew.farries@red-gate.com>
instances.spawn.cc

// Redstar Consultants : https://www.redstarconsultants.com/
// Submitted by Jons Slemmer <jons@redstarconsultants.com>
instantcloud.cn

// Russian Academy of Sciences
// Submitted by Tech Support <support@rasnet.ru>
ras.ru

// QA2
// Submitted by Daniel Dent (https://www.danieldent.com/)
qa2.com

// QCX
// Submitted by Cassandra Beelen <cassandra@beelen.one>
qcx.io
*.sys.qcx.io

// QNAP System Inc : https://www.qnap.com
// Submitted by Nick Chang <nickchang@qnap.com>
dev-myqnapcloud.com
alpha-myqnapcloud.com
myqnapcloud.com

// Quip : https://quip.com
// Submitted by Patrick Linehan <plinehan@quip.com>
*.quipelements.com

// Qutheory LLC : http://qutheory.io
// Submitted by Jonas Schwartz <jonas@qutheory.io>
vapor.cloud
vaporcloud.io

// Rackmaze LLC : https://www.rackmaze.com
// Submitted by Kirill Pertsev <kika@rackmaze.com>
rackmaze.com
rackmaze.net

// Rakuten Games, Inc : https://dev.viberplay.io
// Submitted by Joshua Zhang <public-suffix@rgames.jp>
g.vbrplsbx.io

// Rancher Labs, Inc : https://rancher.com
// Submitted by Vincent Fiduccia <domains@rancher.com>
*.on-k3s.io
*.on-rancher.cloud
*.on-rio.io

// Read The Docs, Inc : https://www.readthedocs.org
// Submitted by David Fischer <team@readthedocs.org>
readthedocs.io

// Red Hat, Inc. OpenShift : https://openshift.redhat.com/
// Submitted by Tim Kramer <tkramer@rhcloud.com>
rhcloud.com

// Render : https://render.com
// Submitted by Anurag Goel <dev@render.com>
app.render.com
onrender.com

// Repl.it : https://repl.it
// Submitted by Lincoln Bergeson <lincoln@replit.com>
firewalledreplit.co
id.firewalledreplit.co
repl.co
id.repl.co
repl.run

// Resin.io : https://resin.io
// Submitted by Tim Perry <tim@resin.io>
resindevice.io
devices.resinstaging.io

// RethinkDB : https://www.rethinkdb.com/
// Submitted by Chris Kastorff <info@rethinkdb.com>
hzc.io

// Revitalised Limited : http://www.revitalised.co.uk
// Submitted by Jack Price <jack@revitalised.co.uk>
wellbeingzone.eu
wellbeingzone.co.uk

// Rico Developments Limited : https://adimo.co
// Submitted by Colin Brown <hello@adimo.co>
adimo.co.uk

// Riseup Networks : https://riseup.net
// Submitted by Micah Anderson <micah@riseup.net>
itcouldbewor.se

// Rochester Institute of Technology : http://www.rit.edu/
// Submitted by Jennifer Herting <jchits@rit.edu>
git-pages.rit.edu

// Rocky Enterprise Software Foundation : https://resf.org
// Submitted by Neil Hanlon <neil@resf.org>
rocky.page

// Rusnames Limited: http://rusnames.ru/
// Submitted by Sergey Zotov <admin@rusnames.ru>
\u0431\u0438\u0437.\u0440\u0443\u0441
\u043A\u043E\u043C.\u0440\u0443\u0441
\u043A\u0440\u044B\u043C.\u0440\u0443\u0441
\u043C\u0438\u0440.\u0440\u0443\u0441
\u043C\u0441\u043A.\u0440\u0443\u0441
\u043E\u0440\u0433.\u0440\u0443\u0441
\u0441\u0430\u043C\u0430\u0440\u0430.\u0440\u0443\u0441
\u0441\u043E\u0447\u0438.\u0440\u0443\u0441
\u0441\u043F\u0431.\u0440\u0443\u0441
\u044F.\u0440\u0443\u0441

// SAKURA Internet Inc. : https://www.sakura.ad.jp/
// Submitted by Internet Service Department <rs-vendor-ml@sakura.ad.jp>
180r.com
dojin.com
sakuratan.com
sakuraweb.com
x0.com
2-d.jp
bona.jp
crap.jp
daynight.jp
eek.jp
flop.jp
halfmoon.jp
jeez.jp
matrix.jp
mimoza.jp
ivory.ne.jp
mail-box.ne.jp
mints.ne.jp
mokuren.ne.jp
opal.ne.jp
sakura.ne.jp
sumomo.ne.jp
topaz.ne.jp
netgamers.jp
nyanta.jp
o0o0.jp
rdy.jp
rgr.jp
rulez.jp
s3.isk01.sakurastorage.jp
s3.isk02.sakurastorage.jp
saloon.jp
sblo.jp
skr.jp
tank.jp
uh-oh.jp
undo.jp
rs.webaccel.jp
user.webaccel.jp
websozai.jp
xii.jp
squares.net
jpn.org
kirara.st
x0.to
from.tv
sakura.tv

// Salesforce.com, Inc. https://salesforce.com/
// Submitted by Michael Biven <mbiven@salesforce.com>
*.builder.code.com
*.dev-builder.code.com
*.stg-builder.code.com

// Sandstorm Development Group, Inc. : https://sandcats.io/
// Submitted by Asheesh Laroia <asheesh@sandstorm.io>
sandcats.io

// SBE network solutions GmbH : https://www.sbe.de/
// Submitted by Norman Meilick <nm@sbe.de>
logoip.de
logoip.com

// Scaleway : https://www.scaleway.com/
// Submitted by R\xE9my L\xE9one <rleone@scaleway.com>
fr-par-1.baremetal.scw.cloud
fr-par-2.baremetal.scw.cloud
nl-ams-1.baremetal.scw.cloud
fnc.fr-par.scw.cloud
functions.fnc.fr-par.scw.cloud
k8s.fr-par.scw.cloud
nodes.k8s.fr-par.scw.cloud
s3.fr-par.scw.cloud
s3-website.fr-par.scw.cloud
whm.fr-par.scw.cloud
priv.instances.scw.cloud
pub.instances.scw.cloud
k8s.scw.cloud
k8s.nl-ams.scw.cloud
nodes.k8s.nl-ams.scw.cloud
s3.nl-ams.scw.cloud
s3-website.nl-ams.scw.cloud
whm.nl-ams.scw.cloud
k8s.pl-waw.scw.cloud
nodes.k8s.pl-waw.scw.cloud
s3.pl-waw.scw.cloud
s3-website.pl-waw.scw.cloud
scalebook.scw.cloud
smartlabeling.scw.cloud
dedibox.fr

// schokokeks.org GbR : https://schokokeks.org/
// Submitted by Hanno B\xF6ck <hanno@schokokeks.org>
schokokeks.net

// Scottish Government: https://www.gov.scot
// Submitted by Martin Ellis <martin.ellis@gov.scot>
gov.scot
service.gov.scot

// Scry Security : http://www.scrysec.com
// Submitted by Shante Adam <shante@skyhat.io>
scrysec.com

// Securepoint GmbH : https://www.securepoint.de
// Submitted by Erik Anders <erik.anders@securepoint.de>
firewall-gateway.com
firewall-gateway.de
my-gateway.de
my-router.de
spdns.de
spdns.eu
firewall-gateway.net
my-firewall.org
myfirewall.org
spdns.org

// Seidat : https://www.seidat.com
// Submitted by Artem Kondratev <accounts@seidat.com>
seidat.net

// Sellfy : https://sellfy.com
// Submitted by Yuriy Romadin <contact@sellfy.com>
sellfy.store

// Senseering GmbH : https://www.senseering.de
// Submitted by Felix M\xF6nckemeyer <f.moenckemeyer@senseering.de>
senseering.net

// Sendmsg: https://www.sendmsg.co.il
// Submitted by Assaf Stern <domains@comstar.co.il>
minisite.ms

// Service Magnet : https://myservicemagnet.com
// Submitted by Dave Sanders <dave@myservicemagnet.com>
magnet.page

// Service Online LLC : http://drs.ua/
// Submitted by Serhii Bulakh <support@drs.ua>
biz.ua
co.ua
pp.ua

// Shift Crypto AG : https://shiftcrypto.ch
// Submitted by alex <alex@shiftcrypto.ch>
shiftcrypto.dev
shiftcrypto.io

// ShiftEdit : https://shiftedit.net/
// Submitted by Adam Jimenez <adam@shiftcreate.com>
shiftedit.io

// Shopblocks : http://www.shopblocks.com/
// Submitted by Alex Bowers <alex@shopblocks.com>
myshopblocks.com

// Shopify : https://www.shopify.com
// Submitted by Alex Richter <alex.richter@shopify.com>
myshopify.com

// Shopit : https://www.shopitcommerce.com/
// Submitted by Craig McMahon <craig@shopitcommerce.com>
shopitsite.com

// shopware AG : https://shopware.com
// Submitted by Jens K\xFCper <cloud@shopware.com>
shopware.store

// Siemens Mobility GmbH
// Submitted by Oliver Graebner <security@mo-siemens.io>
mo-siemens.io

// SinaAppEngine : http://sae.sina.com.cn/
// Submitted by SinaAppEngine <saesupport@sinacloud.com>
1kapp.com
appchizi.com
applinzi.com
sinaapp.com
vipsinaapp.com

// Siteleaf : https://www.siteleaf.com/
// Submitted by Skylar Challand <support@siteleaf.com>
siteleaf.net

// Skyhat : http://www.skyhat.io
// Submitted by Shante Adam <shante@skyhat.io>
bounty-full.com
alpha.bounty-full.com
beta.bounty-full.com

// Smallregistry by Promopixel SARL: https://www.smallregistry.net
// Former AFNIC's SLDs 
// Submitted by J\xE9r\xF4me Lipowicz <support@promopixel.com>
aeroport.fr
avocat.fr
chambagri.fr
chirurgiens-dentistes.fr
experts-comptables.fr
medecin.fr
notaires.fr
pharmacien.fr
port.fr
veterinaire.fr

// Small Technology Foundation : https://small-tech.org
// Submitted by Aral Balkan <aral@small-tech.org>
small-web.org

// Smoove.io : https://www.smoove.io/
// Submitted by Dan Kozak <dan@smoove.io>
vp4.me

// Snowflake Inc : https://www.snowflake.com/
// Submitted by Faith Olapade <faith.olapade@snowflake.com>
snowflake.app
privatelink.snowflake.app
streamlit.app
streamlitapp.com

// Snowplow Analytics : https://snowplowanalytics.com/
// Submitted by Ian Streeter <ian@snowplowanalytics.com>
try-snowplow.com

// SourceHut : https://sourcehut.org
// Submitted by Drew DeVault <sir@cmpwn.com>
srht.site

// Stackhero : https://www.stackhero.io
// Submitted by Adrien Gillon <adrien+public-suffix-list@stackhero.io>
stackhero-network.com

// Staclar : https://staclar.com
// Submitted by Q Misell <q@staclar.com>
musician.io
// Submitted by Matthias Merkel <matthias.merkel@staclar.com>
novecore.site

// staticland : https://static.land
// Submitted by Seth Vincent <sethvincent@gmail.com>
static.land
dev.static.land
sites.static.land

// Storebase : https://www.storebase.io
// Submitted by Tony Schirmer <tony@storebase.io>
storebase.store

// Strategic System Consulting (eApps Hosting): https://www.eapps.com/
// Submitted by Alex Oancea <aoancea@cloudscale365.com>
vps-host.net
atl.jelastic.vps-host.net
njs.jelastic.vps-host.net
ric.jelastic.vps-host.net

// Sony Interactive Entertainment LLC : https://sie.com/
// Submitted by David Coles <david.coles@sony.com>
playstation-cloud.com

// SourceLair PC : https://www.sourcelair.com
// Submitted by Antonis Kalipetis <akalipetis@sourcelair.com>
apps.lair.io
*.stolos.io

// SpaceKit : https://www.spacekit.io/
// Submitted by Reza Akhavan <spacekit.io@gmail.com>
spacekit.io

// SpeedPartner GmbH: https://www.speedpartner.de/
// Submitted by Stefan Neufeind <info@speedpartner.de>
customer.speedpartner.de

// Spreadshop (sprd.net AG) : https://www.spreadshop.com/
// Submitted by Martin Breest <security@spreadshop.com>
myspreadshop.at
myspreadshop.com.au
myspreadshop.be
myspreadshop.ca
myspreadshop.ch
myspreadshop.com
myspreadshop.de
myspreadshop.dk
myspreadshop.es
myspreadshop.fi
myspreadshop.fr
myspreadshop.ie
myspreadshop.it
myspreadshop.net
myspreadshop.nl
myspreadshop.no
myspreadshop.pl
myspreadshop.se
myspreadshop.co.uk

// Standard Library : https://stdlib.com
// Submitted by Jacob Lee <jacob@stdlib.com>
api.stdlib.com

// Storipress : https://storipress.com
// Submitted by Benno Liu <benno@storipress.com>
storipress.app

// Storj Labs Inc. : https://storj.io/
// Submitted by Philip Hutchins <hostmaster@storj.io>
storj.farm

// Studenten Net Twente : http://www.snt.utwente.nl/
// Submitted by Silke Hofstra <syscom@snt.utwente.nl>
utwente.io

// Student-Run Computing Facility : https://www.srcf.net/
// Submitted by Edwin Balani <sysadmins@srcf.net>
soc.srcf.net
user.srcf.net

// Sub 6 Limited: http://www.sub6.com
// Submitted by Dan Miller <dm@sub6.com>
temp-dns.com

// Supabase : https://supabase.io
// Submitted by Inian Parameshwaran <security@supabase.io>
supabase.co
supabase.in
supabase.net
su.paba.se

// Symfony, SAS : https://symfony.com/
// Submitted by Fabien Potencier <fabien@symfony.com>
*.s5y.io
*.sensiosite.cloud

// Syncloud : https://syncloud.org
// Submitted by Boris Rybalkin <syncloud@syncloud.it>
syncloud.it

// Synology, Inc. : https://www.synology.com/
// Submitted by Rony Weng <ronyweng@synology.com>
dscloud.biz
direct.quickconnect.cn
dsmynas.com
familyds.com
diskstation.me
dscloud.me
i234.me
myds.me
synology.me
dscloud.mobi
dsmynas.net
familyds.net
dsmynas.org
familyds.org
vpnplus.to
direct.quickconnect.to

// Tabit Technologies Ltd. : https://tabit.cloud/
// Submitted by Oren Agiv <oren@tabit.cloud>
tabitorder.co.il
mytabit.co.il
mytabit.com

// TAIFUN Software AG : http://taifun-software.de
// Submitted by Bjoern Henke <dev-server@taifun-software.de>
taifun-dns.de

// Tailscale Inc. : https://www.tailscale.com
// Submitted by David Anderson <danderson@tailscale.com>
beta.tailscale.net
ts.net

// TASK geographical domains (www.task.gda.pl/uslugi/dns)
gda.pl
gdansk.pl
gdynia.pl
med.pl
sopot.pl

// team.blue https://team.blue
// Submitted by Cedric Dubois <cedric.dubois@team.blue>
site.tb-hosting.com

// Teckids e.V. : https://www.teckids.org
// Submitted by Dominik George <dominik.george@teckids.org>
edugit.io
s3.teckids.org

// Telebit : https://telebit.cloud
// Submitted by AJ ONeal <aj@telebit.cloud>
telebit.app
telebit.io
*.telebit.xyz

// Thingdust AG : https://thingdust.com/
// Submitted by Adrian Imboden <adi@thingdust.com>
*.firenet.ch
*.svc.firenet.ch
reservd.com
thingdustdata.com
cust.dev.thingdust.io
cust.disrec.thingdust.io
cust.prod.thingdust.io
cust.testing.thingdust.io
reservd.dev.thingdust.io
reservd.disrec.thingdust.io
reservd.testing.thingdust.io

// ticket i/O GmbH : https://ticket.io
// Submitted by Christian Franke <it@ticket.io>
tickets.io

// Tlon.io : https://tlon.io
// Submitted by Mark Staarink <mark@tlon.io>
arvo.network
azimuth.network
tlon.network

// Tor Project, Inc. : https://torproject.org
// Submitted by Antoine Beaupr\xE9 <anarcat@torproject.org
torproject.net
pages.torproject.net

// TownNews.com : http://www.townnews.com
// Submitted by Dustin Ward <dward@townnews.com>
bloxcms.com
townnews-staging.com

// TrafficPlex GmbH : https://www.trafficplex.de/
// Submitted by Phillipp R\xF6ll <phillipp.roell@trafficplex.de>
12hp.at
2ix.at
4lima.at
lima-city.at
12hp.ch
2ix.ch
4lima.ch
lima-city.ch
trafficplex.cloud
de.cool
12hp.de
2ix.de
4lima.de
lima-city.de
1337.pictures
clan.rip
lima-city.rocks
webspace.rocks
lima.zone

// TransIP : https://www.transip.nl
// Submitted by Rory Breuk <rbreuk@transip.nl>
*.transurl.be
*.transurl.eu
*.transurl.nl

// TransIP: https://www.transip.nl
// Submitted by Cedric Dubois <cedric.dubois@team.blue>
site.transip.me

// TuxFamily : http://tuxfamily.org
// Submitted by TuxFamily administrators <adm@staff.tuxfamily.org>
tuxfamily.org

// TwoDNS : https://www.twodns.de/
// Submitted by TwoDNS-Support <support@two-dns.de>
dd-dns.de
diskstation.eu
diskstation.org
dray-dns.de
draydns.de
dyn-vpn.de
dynvpn.de
mein-vigor.de
my-vigor.de
my-wan.de
syno-ds.de
synology-diskstation.de
synology-ds.de

// Typedream : https://typedream.com
// Submitted by Putri Karunia <putri@typedream.com>
typedream.app

// Typeform : https://www.typeform.com
// Submitted by Sergi Ferriz <sergi.ferriz@typeform.com>
pro.typeform.com

// Uberspace : https://uberspace.de
// Submitted by Moritz Werner <mwerner@jonaspasche.com>
uber.space
*.uberspace.de

// UDR Limited : http://www.udr.hk.com
// Submitted by registry <hostmaster@udr.hk.com>
hk.com
hk.org
ltd.hk
inc.hk

// UK Intis Telecom LTD : https://it.com
// Submitted by ITComdomains <to@it.com>
it.com

// UNIVERSAL DOMAIN REGISTRY : https://www.udr.org.yt/
// see also: whois -h whois.udr.org.yt help
// Submitted by Atanunu Igbunuroghene <publicsuffixlist@udr.org.yt>
name.pm
sch.tf
biz.wf
sch.wf
org.yt

// United Gameserver GmbH : https://united-gameserver.de
// Submitted by Stefan Schwarz <sysadm@united-gameserver.de>
virtualuser.de
virtual-user.de

// Upli : https://upli.io
// Submitted by Lenny Bakkalian <lenny.bakkalian@gmail.com>
upli.io

// urown.net : https://urown.net
// Submitted by Hostmaster <hostmaster@urown.net>
urown.cloud
dnsupdate.info

// .US
// Submitted by Ed Moore <Ed.Moore@lib.de.us>
lib.de.us

// VeryPositive SIA : http://very.lv
// Submitted by Danko Aleksejevs <danko@very.lv>
2038.io

// Vercel, Inc : https://vercel.com/
// Submitted by Connor Davis <security@vercel.com>
vercel.app
vercel.dev
now.sh

// Viprinet Europe GmbH : http://www.viprinet.com
// Submitted by Simon Kissel <hostmaster@viprinet.com>
router.management

// Virtual-Info : https://www.virtual-info.info/
// Submitted by Adnan RIHAN <hostmaster@v-info.info>
v-info.info

// Voorloper.com: https://voorloper.com
// Submitted by Nathan van Bakel <info@voorloper.com>
voorloper.cloud

// Voxel.sh DNS : https://voxel.sh/dns/
// Submitted by Mia Rehlinger <dns@voxel.sh>
neko.am
nyaa.am
be.ax
cat.ax
es.ax
eu.ax
gg.ax
mc.ax
us.ax
xy.ax
nl.ci
xx.gl
app.gp
blog.gt
de.gt
to.gt
be.gy
cc.hn
blog.kg
io.kg
jp.kg
tv.kg
uk.kg
us.kg
de.ls
at.md
de.md
jp.md
to.md
indie.porn
vxl.sh
ch.tc
me.tc
we.tc
nyan.to
at.vg
blog.vu
dev.vu
me.vu

// V.UA Domain Administrator : https://domain.v.ua/
// Submitted by Serhii Rostilo <sergey@rostilo.kiev.ua>
v.ua

// Vultr Objects : https://www.vultr.com/products/object-storage/
// Submitted by Niels Maumenee <storage@vultr.com>
*.vultrobjects.com

// Waffle Computer Inc., Ltd. : https://docs.waffleinfo.com
// Submitted by Masayuki Note <masa@blade.wafflecell.com>
wafflecell.com

// WebHare bv: https://www.webhare.com/
// Submitted by Arnold Hendriks <info@webhare.com>
*.webhare.dev

// WebHotelier Technologies Ltd: https://www.webhotelier.net/
// Submitted by Apostolos Tsakpinis <apostolos.tsakpinis@gmail.com>
reserve-online.net
reserve-online.com
bookonline.app
hotelwithflight.com

// WeDeploy by Liferay, Inc. : https://www.wedeploy.com
// Submitted by Henrique Vicente <security@wedeploy.com>
wedeploy.io
wedeploy.me
wedeploy.sh

// Western Digital Technologies, Inc : https://www.wdc.com
// Submitted by Jung Jin <jungseok.jin@wdc.com>
remotewd.com

// WIARD Enterprises : https://wiardweb.com
// Submitted by Kidd Hustle <kiddhustle@wiardweb.com>
pages.wiardweb.com

// Wikimedia Labs : https://wikitech.wikimedia.org
// Submitted by Arturo Borrero Gonzalez <aborrero@wikimedia.org>
wmflabs.org
toolforge.org
wmcloud.org

// WISP : https://wisp.gg
// Submitted by Stepan Fedotov <stepan@wisp.gg>
panel.gg
daemon.panel.gg

// Wizard Zines : https://wizardzines.com
// Submitted by Julia Evans <julia@wizardzines.com>
messwithdns.com

// WoltLab GmbH : https://www.woltlab.com
// Submitted by Tim D\xFCsterhus <security@woltlab.cloud>
woltlab-demo.com
myforum.community
community-pro.de
diskussionsbereich.de
community-pro.net
meinforum.net

// Woods Valldata : https://www.woodsvalldata.co.uk/
// Submitted by Chris Whittle <chris.whittle@woodsvalldata.co.uk>
affinitylottery.org.uk
raffleentry.org.uk
weeklylottery.org.uk

// WP Engine : https://wpengine.com/
// Submitted by Michael Smith <michael.smith@wpengine.com>
// Submitted by Brandon DuRette <brandon.durette@wpengine.com>
wpenginepowered.com
js.wpenginepowered.com

// Wix.com, Inc. : https://www.wix.com
// Submitted by Shahar Talmi <shahar@wix.com>
wixsite.com
editorx.io
wixstudio.io
wix.run

// XenonCloud GbR: https://xenoncloud.net
// Submitted by Julian Uphoff <publicsuffixlist@xenoncloud.net>
half.host

// XnBay Technology : http://www.xnbay.com/
// Submitted by XnBay Developer <developer.xncloud@gmail.com>
xnbay.com
u2.xnbay.com
u2-local.xnbay.com

// XS4ALL Internet bv : https://www.xs4all.nl/
// Submitted by Daniel Mostertman <unixbeheer+publicsuffix@xs4all.net>
cistron.nl
demon.nl
xs4all.space

// Yandex.Cloud LLC: https://cloud.yandex.com
// Submitted by Alexander Lodin <security+psl@yandex-team.ru>
yandexcloud.net
storage.yandexcloud.net
website.yandexcloud.net

// YesCourse Pty Ltd : https://yescourse.com
// Submitted by Atul Bhouraskar <atul@yescourse.com>
official.academy

// Yola : https://www.yola.com/
// Submitted by Stefano Rivera <stefano@yola.com>
yolasite.com

// Yombo : https://yombo.net
// Submitted by Mitch Schwenk <mitch@yombo.net>
ybo.faith
yombo.me
homelink.one
ybo.party
ybo.review
ybo.science
ybo.trade

// Yunohost : https://yunohost.org
// Submitted by Valentin Grimaud <security@yunohost.org>
ynh.fr
nohost.me
noho.st

// ZaNiC : http://www.za.net/
// Submitted by registry <hostmaster@nic.za.net>
za.net
za.org

// Zine EOOD : https://zine.bg/
// Submitted by Martin Angelov <martin@zine.bg>
bss.design

// Zitcom A/S : https://www.zitcom.dk
// Submitted by Emil Stahl <esp@zitcom.dk>
basicserver.io
virtualserver.io
enterprisecloud.nu

// ===END PRIVATE DOMAINS===
`.split(`
`).filter(e=>!e.startsWith("//")&&e.trim().length>0).sort((e,t)=>t.length-e.length);async function gH(e,t,a){let n=await FR(a.filenameTemplate,a,e,t)||"";n=n.trim(),a.replaceEmojisInFilename&&mH.forEach(s=>n=Va(n,s," _"+PR[s]+"_ "));let{filenameReplacementCharacter:o,filenameReplacedCharacters:i,filenameReplacementCharacters:r}=a;if(n=si(n,i,o,r),n=n.replace(/\s+/g," "),a.backgroundSave||(n=n.replace(/\//g,o)),!a.keepFilename&&(a.filenameMaxLengthUnit=="bytes"&&Un(n)>a.filenameMaxLength||n.length>a.filenameMaxLength)){let s="."+zR(a),l;if(n.endsWith(s))l=s;else{let d=n.match(/(\.[^.]{3,4})$/);l=d&&d[0]&&d[0].length>1?d[0]:""}let c="\u2026"+l,u=Math.max(a.filenameMaxLength-(a.filenameMaxLengthUnit=="bytes"?Un(c):c.length),0);n=a.filenameMaxLengthUnit=="bytes"?await Tf(n,u):n.substring(0,u),n=n+c}if(n||(n="Unnamed page"),n.startsWith(".")){let s=n.replace(/\.[^.]{3,4}$/,"");/^\.*$/.test(s)?n="Unnamed page"+n:n=o+n}return n.trim()}async function FR(e="",t,a,n,o={}){let{dontReplaceSlash:i}=o;o.currentDate=new Date;let r=new lH(t.saveUrl||t.url),s=Sn(r.href),l=Array.from(new uH(r.search)),c=t.bookmarkFolders&&t.bookmarkFolders.join("/")||"",u=i===void 0?!0:i,d=pH.find(k=>r.hostname.endsWith("."+k)&&k),h=d?r.hostname.substring(0,r.hostname.length-d.length-1):r.hostname,m=h.lastIndexOf("."),p=h.substring(0,m==-1?0:m),g=h.substring(p.length?p.length+1:0),w=g+"."+d;p.startsWith("www.")?p=p.substring(4):p=="www"&&(p="");let f={"navigator-language":{getter:()=>dH.language},"page-title":{getter:()=>t.title},"page-heading":{getter:()=>t.info.heading},"page-language":{getter:()=>t.info.lang},"page-description":{getter:()=>t.info.description},"page-author":{getter:()=>t.info.author},"page-creator":{getter:()=>t.info.creator},"page-publisher":{getter:()=>t.info.publisher},"url-hash":{getter:()=>r.hash.substring(1)},"url-host":{getter:()=>r.host.replace(/\/$/,"")},"url-hostname":{getter:()=>r.hostname.replace(/\/$/,"")},"url-hostname-suffix":{getter:()=>d},"url-hostname-domain":{getter:()=>g},"url-hostname-root":{getter:()=>w},"url-hostname-subdomains":{getter:()=>p},"url-href":{getter:()=>s,dontReplaceSlash:u},"url-href-digest-sha-1":{getter:s?async()=>ka("SHA-1",s):""},"url-href-flat":{getter:()=>Sn(r.href),dontReplaceSlash:!1},"url-referrer":{getter:()=>Sn(t.referrer),dontReplaceSlash:u},"url-referrer-flat":{getter:()=>Sn(t.referrer),dontReplaceSlash:!1},"url-password":{getter:()=>r.password},"url-pathname":{getter:()=>Sn(r.pathname).replace(/^\//,"").replace(/\/$/,""),dontReplaceSlash:u},"url-pathname-flat":{getter:()=>Sn(r.pathname),dontReplaceSlash:!1},"url-port":{getter:()=>r.port},"url-protocol":{getter:()=>r.protocol},"url-search":{getter:()=>r.search.substring(1)},"url-username":{getter:()=>r.username},"url-original":{getter:()=>t.originalUrl},"tab-id":{getter:()=>String(t.tabId)},"tab-index":{getter:()=>String(t.tabIndex)},"url-last-segment":{getter:()=>Sn(MR(r,t.filenameReplacementCharacter))},"url-filename":{getter:()=>{let k=r.pathname,S=k.split("/");if(k.endsWith("/"))return"";{let T=S[S.length-1];return Sn(T)}},dontReplaceSlash:u},"bookmark-pathname":{getter:()=>c,dontReplaceSlash:u},"bookmark-pathname-flat":{getter:()=>c,dontReplaceSlash:!1},"profile-name":{getter:()=>t.profileName},"filename-extension":{getter:()=>zR(t)},"save-action":{getter:()=>t.selected?"selection":"page"},"options-json":{getter:()=>JSON.stringify(Af(t))},"options-text":{getter:()=>wH(Af(t))}};a&&(f["digest-sha-256"]={getter:async()=>ka("SHA-256",a)},f["digest-sha-384"]={getter:async()=>ka("SHA-384",a)},f["digest-sha-512"]={getter:async()=>ka("SHA-512",a)}),t.saveDate&&E(t.saveDate),t.visitDate&&E(t.visitDate,"visit-");let b={"if-empty":(...k)=>{let S=k.pop(),T=k.find(v=>v);return T||S},"if-not-empty":(...k)=>{let S=k.pop(),T=k.find(v=>v);return T&&S},"if-equals":(k,S,T,v)=>k==S?T:v,"if-not-equals":(k,S,T,v)=>k!=S?T:v,"if-contains":(k,S,T,v)=>S&&k.includes(S)?T:v,"if-not-contains":(k,S,T,v)=>S&&!k.includes(S)?T:v,substring:(k,S,T)=>k.substring(S,T),lowercase:k=>k.toLowerCase(),uppercase:k=>k.toUpperCase(),capitalize:k=>k.charAt(0).toUpperCase()+k.slice(1),titlecase:k=>k.replace(new RegExp("(^|[^\\p{L}\\p{N}'\u2019])(\\p{L})","gu"),(S,T,v)=>T+v.toUpperCase()),replace:(k,S,T)=>S&&T?Va(k,S,T):k,trim:k=>k.trim(),"trim-left":k=>k.trimLeft(),"trim-right":k=>k.trimRight(),"pad-left":(k,S,T)=>S>0?k.padStart(S,T):k,"pad-right":(k,S,T)=>S>0?k.padEnd(S,T):k,repeat:(k,S)=>S>0?k.repeat(S):"","index-of":(k,S,T)=>k.indexOf(S,T),"last-index-of":(k,S,T)=>k.lastIndexOf(S,T),length:k=>k.length,"url-search-name":(k=0)=>l[k]&&l[k][0],"url-search-value":(k=0)=>l[k]&&l[k][1],"url-search-named-value":k=>{let S=l.find(T=>T[0]==k);return S&&S[1]},"url-search":k=>{let S=l.find(T=>T[0]==k);return S&&S[1]},"url-segment":(k=0)=>{let S=Sn(r.pathname).split("/");return S.pop(),S.push(MR(r,t.filenameReplacementCharacter)),S[k]},"url-hostname-subdomain":(k=0)=>{let S=p.split(".");return S[S.length-k-1]},stringify:k=>{try{return JSON.stringify(k)}catch{return k}},"encode-base64":k=>{function S(v){let A=Array.from(v,x=>String.fromCodePoint(x)).join("");return btoa(A)}let T=new TextEncoder().encode(k);return S(T)},"decode-base64":k=>{function S(T){let v=atob(T);return Uint8Array.from(v,A=>A.codePointAt(0))}try{let T=S(k);return new TextDecoder("utf-8").decode(T)}catch{return k}},"encode-uri":k=>{try{return encodeURI(k)}catch{return k}},"decode-uri":k=>{try{return decodeURI(k)}catch{return k}},"encode-uri-component":k=>{try{return encodeURIComponent(k)}catch{return k}},"decode-uri-component":k=>{try{return decodeURIComponent(k)}catch{return k}},"date-locale":k=>o.currentDate.toLocaleDateString(k),"time-locale":k=>o.currentDate.toLocaleTimeString(k),"datetime-locale":k=>o.currentDate.toLocaleString(k),"datetime-custom":(k,S,T,v,A,x,_,O,z,U,K,L,D,B,W)=>{let Y=o.currentDate,H={};return Q(H,"year",S),Q(H,"month",T),Q(H,"day",v),Q(H,"weekday",A),Q(H,"hour",x),Q(H,"minute",_),Q(H,"second",O),Q(H,"hour12",z),H.hour12=z=="true",Q(H,"timeZone",U),Q(H,"fractionalSecondDigits",K),Q(H,"timeZoneName",L),Q(H,"dayPeriod",D),Q(H,"era",B),Q(H,"localeMatcher",W),new cH.DateTimeFormat(k,H).format(Y);function Q(se,de,ue){ue==" "?se[de]=void 0:ue&&(se[de]=ue)}},"option-value":k=>{let S=Af(t)[k];return S==null?"":JSON.stringify(S)}};b["date-locale"].dontReplaceSlash=!0,b["time-locale"].dontReplaceSlash=!0,b["datetime-locale"].dontReplaceSlash=!0,b["datetime-custom"].dontReplaceSlash=!0,n&&(b["page-element-text"]=k=>{let S=n.querySelector(k);return S&&S.textContent},b["page-element-attribute"]=(k,S)=>{let T=n.querySelector(k);return T&&T.getAttribute(S)}),e=Va(e,"\\%","\\\\%"),e=Va(e,"\\{","\\\\{"),e=Va(e,"\\|","\\\\|"),e=Va(e,"\\>","\\\\>");let y=await OR(e,{async callFunction(k,[S,T],v){let A=b[k];if(A)if(S=S.replace(/\\\\(.)/g,"$1"),T||(T=[]),T=T.map(x=>x.replace(/\\\\(.)/g,"$1")).filter(x=>x!=null&&x!=null).map(x=>x==""?void 0:x),S!=null&&S!=null&&S!=""||T.length>0)try{let x=A.dontReplaceSlash===void 0?!0:A.dontReplaceSlash;return await DR(()=>A(S,...T),x,t.filenameReplacementCharacter,v)}catch{return""}else return"";else return""},getVariableValue(k,S){let T=f[k];return T?DR(T.getter,T.dontReplaceSlash,t.filenameReplacementCharacter,S):""}});return y=Va(y,"\\\\%","%"),y=Va(y,"\\\\{","{"),y=Va(y,"\\\\|","|"),y=Va(y,"\\\\>",">"),y;function E(k,S=""){f[S+"datetime-iso"]={getter:()=>k.toISOString()},f[S+"date-iso"]={getter:()=>k.toISOString().split("T")[0]},f[S+"time-iso"]={getter:()=>k.toISOString().split("T")[1].split("Z")[0]},f[S+"date-locale"]={getter:()=>k.toLocaleDateString()},f[S+"time-locale"]={getter:()=>k.toLocaleTimeString()},f[S+"day-locale"]={getter:()=>String(k.getDate()).padStart(2,"0")},f[S+"month-locale"]={getter:()=>String(k.getMonth()+1).padStart(2,"0")},f[S+"year-locale"]={getter:()=>String(k.getFullYear())},f[S+"datetime-locale"]={getter:()=>k.toLocaleString()},f[S+"datetime-utc"]={getter:()=>k.toUTCString()},f[S+"day-utc"]={getter:()=>String(k.getUTCDate()).padStart(2,"0")},f[S+"month-utc"]={getter:()=>String(k.getUTCMonth()+1).padStart(2,"0")},f[S+"year-utc"]={getter:()=>String(k.getUTCFullYear())},f[S+"hours-locale"]={getter:()=>String(k.getHours()).padStart(2,"0")},f[S+"minutes-locale"]={getter:()=>String(k.getMinutes()).padStart(2,"0")},f[S+"seconds-locale"]={getter:()=>String(k.getSeconds()).padStart(2,"0")},f[S+"hours-utc"]={getter:()=>String(k.getUTCHours()).padStart(2,"0")},f[S+"minutes-utc"]={getter:()=>String(k.getUTCMinutes()).padStart(2,"0")},f[S+"seconds-utc"]={getter:()=>String(k.getUTCSeconds()).padStart(2,"0")},f[S+"time-ms"]={getter:()=>String(k.getTime())},f[S+"weekday-locale"]={getter:()=>k.toLocaleDateString(void 0,{weekday:"long"})},f[S+"weekday-short-locale"]={getter:()=>k.toLocaleDateString(void 0,{weekday:"short"})},f[S+"weekday-utc"]={getter:()=>k.toLocaleDateString(void 0,{weekday:"long",timeZone:"UTC"})},f[S+"weekday-short-utc"]={getter:()=>k.toLocaleDateString(void 0,{weekday:"short",timeZone:"UTC"})}}}function Va(e,t,a){if(typeof e.replaceAll=="function")return e.replaceAll(t,a);{let n=new RegExp(t.replace(hH,"\\$1"),"g");return e.replace(n,a)}}async function DR(e,t,a,n){let{maxLength:o,maxCharLength:i}=fH(n),r=await e()||"";return t||(r=r.replace(/\/+/g,a)),o?r=await Tf(r,o):i&&(r=r.substring(0,i)),r}function fH(e){if(e){let{unit:t,length:a}=e,n,o;return t=="char"?o=a:n=a,{maxLength:n,maxCharLength:o}}else return{}}function Sn(e){try{return decodeURI(e)}catch{return e}}function MR(e,t){let a=e.pathname.match(/\/([^/]+)$/),n=a&&a[0];return n||(a=e.href.match(/([^/]+)\/?$/),n=a&&a[0]),n||(a=n.match(/(.*)\.[^.]+$/),n=a&&a[0]),n||(n=e.hostname.replace(/\/+/g,t).replace(/\/$/,"")),a=n.match(/(.*)\.[^.]+$/),a&&a[1]&&(n=a[1]),n=n.replace(/\/$/,"").replace(/^\//,""),n}async function Tf(e,t){let n=new sH([e]).slice(0,t),o;if(globalThis.FileReader){let i=new globalThis.FileReader;i.readAsText(n),o=await new Promise((r,s)=>{i.addEventListener("load",()=>r(i.result),!1),i.addEventListener("error",s,!1)})}else o=await n.text();return e.startsWith(o)?o:Tf(e,t-1)}function zR(e){return e.compressContent?e.selfExtractingArchive?e.extractDataFromPage?"u.zip.html":"zip.html":"zip":"html"}function Af(e){let t=Object.assign({},e);return delete t.content,delete t.usedFonts,delete t.extensionScriptFiles,delete t.taskId,delete t.updatedResources,delete t.visitDate,delete t.keepFilename,delete t.insertCanonicalLink,delete t.frames,delete t.win,delete t.doc,delete t.url,delete t.resourceReferrer,delete t.baseURI,delete t.rootDocument,delete t.fontTests,delete t.canvases,delete t.fonts,delete t.worklets,delete t.stylesheets,delete t.images,delete t.posters,delete t.generatedDataURIs,delete t.videos,delete t.shadowRoots,delete t.referrer,delete t.adoptedStyleSheets,delete t.tabId,delete t.tabIndex,delete t.saveDate,delete t.saveUrl,delete t.title,delete t.info,t}function wH(e){let t=[];for(let a in e){let n=e[a];typeof n!="function"&&n!==void 0&&n!==null&&n!==""&&t.push(a+": "+JSON.stringify(n))}return t.join(`
`)}var YR=["cmap","head","hhea","hmtx","maxp","name","OS/2","post","cvt ","fpgm","glyf","loca","prep","CFF ","VORG","EBDT","EBLC","gasp","hdmx","kern","LTSH","PCLT","VDMX","vhea","vmtx","BASE","GDEF","GPOS","GSUB","EBSC","JSTF","MATH","CBDT","CBLC","COLR","CPAL","SVG ","sbix","acnt","avar","bdat","bloc","bsln","cvar","fdsc","feat","fmtx","fvar","gvar","hsty","just","lcar","mort","morx","opbd","prop","trak","Zapf","Silf","Glat","Gloc","Feat","Sill"];var bH=["CFF ","CFF2","gvar","fvar","COLR","CBDT","sbix","SVG ","morx","mort","MATH"],yH=/^[\p{M}ᅠ-ᇿ]$/u,kH="()<>[]{}\xAB\xBB\u0F3A\u0F3B\u0F3C\u0F3D\u169B\u169C\u2039\u203A\u2045\u2046\u207D\u207E\u208D\u208E\u2208\u220B\u2209\u220C\u220A\u220D\u2215\u29F5\u221D\u{1DB10}\u221F\u2BFE\u2220\u29A3\u2221\u299B\u2222\u29A0\u2224\u2AEE\u223C\u223D\u2243\u22CD\u2245\u224C\u2252\u2253\u2254\u2255\u2264\u2265\u2266\u2267\u2268\u2269\u226A\u226B\u226E\u226F\u2270\u2271\u2272\u2273\u2274\u2275\u2276\u2277\u2278\u2279\u227A\u227B\u227C\u227D\u227E\u227F\u2280\u2281\u2282\u2283\u2284\u2285\u2286\u2287\u2288\u2289\u228A\u228B\u228F\u2290\u2291\u2292\u2298\u29B8\u22A2\u22A3\u22A6\u2ADE\u22A8\u2AE4\u22A9\u2AE3\u22AB\u2AE5\u22B0\u22B1\u22B2\u22B3\u22B4\u22B5\u22B6\u22B7\u22B8\u27DC\u22C9\u22CA\u22CB\u22CC\u22D0\u22D1\u22D6\u22D7\u22D8\u22D9\u22DA\u22DB\u22DC\u22DD\u22DE\u22DF\u22E0\u22E1\u22E2\u22E3\u22E4\u22E5\u22E6\u22E7\u22E8\u22E9\u22EA\u22EB\u22EC\u22ED\u22F0\u22F1\u22F2\u22FA\u22F3\u22FB\u22F4\u22FC\u22F6\u22FD\u22F7\u22FE\u2308\u2309\u230A\u230B\u2329\u232A\u2768\u2769\u276A\u276B\u276C\u276D\u276E\u276F\u2770\u2771\u2772\u2773\u2774\u2775\u27C3\u27C4\u27C5\u27C6\u27C8\u27C9\u27CB\u27CD\u27D5\u27D6\u27DD\u27DE\u27E2\u27E3\u27E4\u27E5\u27E6\u27E7\u27E8\u27E9\u27EA\u27EB\u27EC\u27ED\u27EE\u27EF\u2983\u2984\u2985\u2986\u2987\u2988\u2989\u298A\u298B\u298C\u298D\u2990\u298E\u298F\u2991\u2992\u2993\u2994\u2995\u2996\u2997\u2998\u29A4\u29A5\u29A8\u29A9\u29AA\u29AB\u29AC\u29AD\u29AE\u29AF\u29C0\u29C1\u29C4\u29C5\u29CF\u29D0\u29D1\u29D2\u29D4\u29D5\u29D8\u29D9\u29DA\u29DB\u29E8\u29E9\u29F8\u29F9\u29FC\u29FD\u2A2B\u2A2C\u2A2D\u2A2E\u2A34\u2A35\u2A3C\u2A3D\u2A64\u2A65\u2A79\u2A7A\u2A7B\u2A7C\u2A7D\u2A7E\u2A7F\u2A80\u2A81\u2A82\u2A83\u2A84\u2A85\u2A86\u2A87\u2A88\u2A89\u2A8A\u2A8B\u2A8C\u2A8D\u2A8E\u2A8F\u2A90\u2A91\u2A92\u2A93\u2A94\u2A95\u2A96\u2A97\u2A98\u2A99\u2A9A\u2A9B\u2A9C\u2A9D\u2A9E\u2A9F\u2AA0\u2AA1\u2AA2\u2AA6\u2AA7\u2AA8\u2AA9\u2AAA\u2AAB\u2AAC\u2AAD\u2AAF\u2AB0\u2AB1\u2AB2\u2AB3\u2AB4\u2AB5\u2AB6\u2AB7\u2AB8\u2AB9\u2ABA\u2ABB\u2ABC\u2ABD\u2ABE\u2ABF\u2AC0\u2AC1\u2AC2\u2AC3\u2AC4\u2AC5\u2AC6\u2AC7\u2AC8\u2AC9\u2ACA\u2ACB\u2ACC\u2ACD\u2ACE\u2ACF\u2AD0\u2AD1\u2AD2\u2AD3\u2AD4\u2AD5\u2AD6\u2AEC\u2AED\u2AF7\u2AF8\u2AF9\u2AFA\u2E02\u2E03\u2E04\u2E05\u2E09\u2E0A\u2E0C\u2E0D\u2E1C\u2E1D\u2E20\u2E21\u2E22\u2E23\u2E24\u2E25\u2E26\u2E27\u2E28\u2E29\u2E55\u2E56\u2E57\u2E58\u2E59\u2E5A\u2E5B\u2E5C\u2E62\u2E63\u3008\u3009\u300A\u300B\u300C\u300D\u300E\u300F\u3010\u3011\u3014\u3015\u3016\u3017\u3018\u3019\u301A\u301B\uFE59\uFE5A\uFE5B\uFE5C\uFE5D\uFE5E\uFE64\uFE65\uFF08\uFF09\uFF1C\uFF1E\uFF3B\uFF3D\uFF5B\uFF5D\uFF5F\uFF60\uFF62\uFF63\u{1DB03}\u{1DB04}\u{1DB05}\u{1DB06}\u{1DB08}\u{1DB09}",EH=["DSIG"],xf="cmap",Ya="glyf",Ka="loca",An="head",Bu="maxp",Uu="hmtx",UR="hhea",vH="OS/2",BR="GSUB",SH=[xf,Ya,Ka,An,Bu,Uu],HR=AH();async function Gu(e,t,a={}){let n=new Uint8Array(e.buffer?e:new Uint8Array(e)),o=CH(a),i;try{i=await _H(n,o)}catch{return null}if(!i)return null;let r=i.tables;if(SH.find(l=>!r.has(l))||bH.find(l=>r.has(l)))return null;let s=r.get(vH);if(s&&s.length>9&&Z(s,8)&256)return null;try{let l=Z(r.get(Bu),4),c=If(r.get(Ka),l,ht(r.get(An),50));if(!c)return null;let u=zH(r.get(xf)),d=new Map;TH(t).forEach(E=>{let k=u.mapping.get(E);k!==void 0&&k<l&&d.set(E,k)});let h=new Set([0,...d.values()]);u.variationGlyphIds.forEach((E,k)=>{d.has(k)&&E.forEach(S=>h.add(S))}),r.has(BR)&&HH(r.get(BR),h);let m=r.get(Ya);Array.from(h).forEach(E=>ZR(m,c,E,h));let p=0;for(let E=0;E<l;E++)!h.has(E)&&c[E+1]>c[E]&&p++;if(!p&&d.size==u.mapping.size)return null;let{glyfTable:g,locaTable:w}=GH(m,c,l,h);r.set(Ya,g),r.set(Ka,w),r.set(xf,WH(d,u.variationSubtable));let f=new Uint8Array(r.get(An));Vi(f,50,1),fe(f,8,0),i.woff2&&ze(f,16,Z(f,16)|2048),r.set(An,f),EH.forEach(E=>r.delete(E));let b=YH(i.flavor,r),y;return i.woff2?y=await XH(b,i,o,l):i.woff?y=await KH(b,i):y=b.data,y.length>=n.length||!await RH(y)?null:y}catch{return null}}function AH(){let e=new Map,t=Array.from(kH);for(let a=0;a<t.length;a+=2)e.set(t[a],t[a+1]),e.set(t[a+1],t[a]);return e}function TH(e){let t=new Set,a=new Set,n=i=>{let r=i.codePointAt(0);return t.has(r)?!1:(t.add(r),yH.test(i)&&a.add(i),!0)};e.forEach(([i,r])=>{for(let s=i;s<=r;s++){let l=String.fromCodePoint(s);n(l),Array.from(l.normalize("NFD")).forEach(n),Array.from(l.normalize("NFC")).forEach(n),HR.has(l)&&n(HR.get(l))}});let o;do o=!1,Array.from(t).forEach(i=>{let r=String.fromCodePoint(i);a.forEach(s=>{let l=(r+s).normalize("NFC");Array.from(l).length==1&&n(l)&&(o=!0)})});while(o);return t}function CH(e){if(e.brotli)return e.brotli;try{new CompressionStream("brotli"),new DecompressionStream("brotli")}catch{return null}return{compress:t=>Hu(t,new CompressionStream("brotli")),decompress:t=>Hu(t,new DecompressionStream("brotli"))}}async function RH(e){if(typeof globalThis.FontFace>"u")return!0;try{return await new globalThis.FontFace("single-file-test",e.buffer).load(),!0}catch{return!1}}async function _H(e,t){if(e.length<12)return null;let a=xe(e,0);if(a==65536||a==1953658213){let n=Z(e,4),o=new Map;for(let i=0;i<n;i++){let r=12+i*16,s=Lf(e,r),l=xe(e,r+8),c=xe(e,r+12);o.set(s,e.subarray(l,l+c))}return{flavor:a,tables:o,woff:!1}}else if(a==2001684038){let n=xe(e,4);if(n!=65536&&n!=1953658213)return null;let o=Z(e,12),i=xe(e,24),r=xe(e,28),s=xe(e,32),l=xe(e,36),c=xe(e,40),u=new Map;for(let d=0;d<o;d++){let h=44+d*20,m=Lf(e,h),p=xe(e,h+4),g=xe(e,h+8),w=xe(e,h+12),f=e.subarray(p,p+g);u.set(m,g<w?await ZH(f,w):f)}return{flavor:n,tables:u,woff:!0,version:xe(e,20),metadata:r?e.subarray(i,i+r):null,metaOriginalLength:s,privateData:c?e.subarray(l,l+c):null}}else if(a==2001684018)return xH(e,t);return null}async function xH(e,t){let a=xe(e,4);if(a!=65536&&a!=1953658213||!t||e.length<48)return null;let n=Z(e,12),o=xe(e,20),i=xe(e,28),r=xe(e,32),s=xe(e,36),l=xe(e,40),c=xe(e,44),u=[],d=48;for(let y=0;y<n;y++){let E=e[d++],k;(E&63)==63?(k=Lf(e,d),d+=4):k=YR[E&63];let S=E>>6,T,v,A;if([T,d]=WR(e,d),k==Ya||k==Ka){if(S!=0&&S!=3)return null;A=S==0}else if(k==Uu){if(S>1)return null;A=S==1}else if(S)return null;A?[v,d]=WR(e,d):v=T,u.push({tag:k,transformedLength:v,transformed:A})}let h=await t.decompress(e.subarray(d,d+o));if(h.length!=u.reduce((y,E)=>y+E.transformedLength,0))throw new Error("Invalid WOFF2 data length");let m=new Map,p,g,w=0;if(u.forEach(y=>{let E=h.subarray(w,w+y.transformedLength);w+=y.transformedLength,y.transformed?y.tag==Ya?p=E:y.tag==Uu&&(g=E):m.set(y.tag,E)}),!m.has(An)||!m.has(Bu))return null;let f=Z(m.get(Bu),4),b;if(p){let y=LH(p,f);m.set(Ya,y.glyfTable),m.set(Ka,y.locaTable);let E=new Uint8Array(m.get(An));Vi(E,50,1),m.set(An,E),b=y.xMins}if(g){if(!m.has(UR)||!m.has(Ya)||!m.has(Ka))return null;if(!b){let y=If(m.get(Ka),f,ht(m.get(An),50));if(!y)return null;let E=m.get(Ya);b=y.slice(0,f).map((k,S)=>y[S+1]-k>=10?ht(E,k+2):0)}m.set(Uu,MH(g,b,Z(m.get(UR),34),f))}return{flavor:a,tables:m,woff:!1,woff2:!0,version:xe(e,24),metadata:r?e.subarray(i,i+r):null,metaOriginalLength:s,privateData:c?e.subarray(l,l+c):null}}function LH(e,t){let a=Z(e,2),n=[];for(let y=0;y<7;y++)n.push(xe(e,8+y*4));let o=36,[i,r,s,l,c,u,d]=n.map(y=>{let E=e.subarray(o,o+y);return o+=y,E}),h=4*Math.floor((t+31)/32),m=u.subarray(0,h),p=u.subarray(h),g=a&1?e.subarray(o,o+(t+7>>3)):null,w={nPoints:0,flag:0,glyph:0,composite:0,bbox:0,instruction:0},f=[],b=[];for(let y=0;y<t;y++){let E=ht(i,y*2),k=!!(m[y>>3]&128>>(y&7));if(E==0){if(k)throw new Error("Invalid empty glyph");f.push(new Uint8Array(0)),b.push(0)}else if(E>0){let S=[],T=0;for(let L=0;L<E;L++){let D=Cf(r,w,"nPoints");S.push(D),T+=D}let v=s.subarray(w.flag,w.flag+T);w.flag+=T;let A=[],x=0,_=0;for(let L=0;L<T;L++){let[D,B]=IH(v[L],l,w);x+=D,_+=B,A.push({dx:D,dy:B,x,y:_,onCurve:!(v[L]&128)})}let O=Cf(l,w,"glyph"),z=d.subarray(w.instruction,w.instruction+O);w.instruction+=O;let U;k?U=GR(p,w):(U={xMin:0,yMin:0,xMax:0,yMax:0},A.forEach(({x:L,y:D},B)=>{(!B||L<U.xMin)&&(U.xMin=L),(!B||L>U.xMax)&&(U.xMax=L),(!B||D<U.yMin)&&(U.yMin=D),(!B||D>U.yMax)&&(U.yMax=D)}));let K=!!(g&&g[y>>3]&128>>(y&7));f.push(NH(S,A,z,U,K)),b.push(U.xMin)}else{let S=w.composite,T,v=!1;do T=Z(c,w.composite),w.composite+=KR(T),v=v||!!(T&256);while(T&32);let A=c.subarray(S,w.composite),x=null;if(v){let O=Cf(l,w,"glyph");x=d.subarray(w.instruction,w.instruction+O),w.instruction+=O}if(!k)throw new Error("Missing composite glyph bounding box");let _=GR(p,w);f.push(OH(A,x,_)),b.push(_.xMin)}}return{...DH(f),xMins:b}}function GR(e,t){let a={xMin:ht(e,t.bbox),yMin:ht(e,t.bbox+2),xMax:ht(e,t.bbox+4),yMax:ht(e,t.bbox+6)};return t.bbox+=8,a}function IH(e,t,a){let n=a.glyph;e&=127;let o,i;if(e<10)o=0,i=qa(e,((e&14)<<7)+t[n]),a.glyph+=1;else if(e<20)o=qa(e,((e-10&14)<<7)+t[n]),i=0,a.glyph+=1;else if(e<84){let r=e-20,s=t[n];o=qa(e,1+(r&48)+(s>>4)),i=qa(e>>1,1+((r&12)<<2)+(s&15)),a.glyph+=1}else if(e<120){let r=e-84;o=qa(e,1+(Math.floor(r/12)<<8)+t[n]),i=qa(e>>1,1+(r%12>>2<<8)+t[n+1]),a.glyph+=2}else if(e<124){let r=t[n+1];o=qa(e,(t[n]<<4)+(r>>4)),i=qa(e>>1,((r&15)<<8)+t[n+2]),a.glyph+=3}else o=qa(e,(t[n]<<8)+t[n+1]),i=qa(e>>1,(t[n+2]<<8)+t[n+3]),a.glyph+=4;return[o,i]}function qa(e,t){return e&1?t:-t}function jH(e,t,a,n,o){let i=a?0:128,r=e<0?0:1,s=t<0?0:1,l=Math.abs(e),c=Math.abs(t);e==0&&c<1280?(n.uint8(i+((c&3840)>>7)+s),o.uint8(c&255)):t==0&&l<1280?(n.uint8(i+10+((l&3840)>>7)+r),o.uint8(l&255)):l<65&&c<65?(n.uint8(i+20+(l-1&48)+((c-1&48)>>2)+r+(s<<1)),o.uint8((l-1&15)<<4|c-1&15)):l<769&&c<769?(n.uint8(i+84+12*((l-1&768)>>8)+((c-1&768)>>6)+r+(s<<1)),o.uint8(l-1&255),o.uint8(c-1&255)):l<4096&&c<4096?(n.uint8(i+120+r+(s<<1)),o.uint8(l>>4),o.uint8((l&15)<<4|c>>8),o.uint8(c&255)):(n.uint8(i+124+r+(s<<1)),o.uint8(l>>8),o.uint8(l&255),o.uint8(c>>8),o.uint8(c&255))}function NH(e,t,a,n,o){let i=new zt;i.int16(e.length),i.int16(n.xMin),i.int16(n.yMin),i.int16(n.xMax),i.int16(n.yMax);let r=-1;return e.forEach(s=>{r+=s,i.uint16(r)}),i.uint16(a.length),i.bytes(a),t.forEach(({dx:s,dy:l,onCurve:c},u)=>{let d=c?1:0;!u&&o&&(d|=64),s==0?d|=16:s>-256&&s<256&&(d|=2|(s>0?16:0)),l==0?d|=32:l>-256&&l<256&&(d|=4|(l>0?32:0)),i.uint8(d)}),t.forEach(({dx:s})=>{s!=0&&(s>-256&&s<256?i.uint8(Math.abs(s)):i.int16(s))}),t.forEach(({dy:s})=>{s!=0&&(s>-256&&s<256?i.uint8(Math.abs(s)):i.int16(s))}),i.toUint8Array()}function OH(e,t,a){let n=new zt;return n.int16(-1),n.int16(a.xMin),n.int16(a.yMin),n.int16(a.xMax),n.int16(a.yMax),n.bytes(e),t&&(n.uint16(t.length),n.bytes(t)),n.toUint8Array()}function KR(e){let t=e&1?8:6;return e&8?t+=2:e&64?t+=4:e&128&&(t+=8),t}function DH(e){let t=e.length,a=new Uint8Array(e.reduce((i,r)=>i+Xa(r.length),0)),n=new Uint8Array((t+1)*4),o=0;return e.forEach((i,r)=>{fe(n,r*4,o),a.set(i,o),o+=Xa(i.length)}),fe(n,t*4,o),{glyfTable:a,locaTable:n}}function MH(e,t,a,n){let o=e[0];if(!(o&3)||a>n)throw new Error("Invalid transformed hmtx table");let i=new Uint8Array(a*4+(n-a)*2),r=1;for(let s=0;s<a;s++)ze(i,s*4,Z(e,r)),r+=2;for(let s=0;s<a;s++)o&1?Vi(i,s*4+2,t[s]):(Vi(i,s*4+2,ht(e,r)),r+=2);for(let s=a;s<n;s++){let l=a*4+(s-a)*2;o&2?Vi(i,l,t[s]):(Vi(i,l,ht(e,r)),r+=2)}return i}function PH(e,t,a){let n=new zt,o=new zt,i=new zt,r=new zt,s=new zt,l=new zt,c=new zt,u=new Uint8Array(4*Math.floor((a+31)/32)),d=new Uint8Array(a+7>>3),h=!1;for(let g=0;g<a;g++){let w=t[g],f=t[g+1],b=f-w>=10?ht(e,w):0;if(b==0)n.int16(0);else if(b>0){n.int16(b);let y=w+10,E=0;for(let O=0;O<b;O++){let z=Z(e,y);Rf(o,z+1-E),E=z+1,y+=2}let k=Z(e,y);y+=2;let S=e.subarray(y,y+k);y+=k;let T=[];for(;T.length<E;){let O=e[y++];if(T.push(O),O&8){let z=e[y++];for(;z-- >0&&T.length<E;)T.push(O)}}let v=[];T.forEach(O=>{let z=0;O&2?(z=O&16?e[y]:-e[y],y+=1):O&16||(z=ht(e,y),y+=2),v.push({dx:z})}),T.forEach((O,z)=>{let U=0;O&4?(U=O&32?e[y]:-e[y],y+=1):O&32||(U=ht(e,y),y+=2),v[z].dy=U});let A={xMin:0,yMin:0,xMax:0,yMax:0},x=0,_=0;v.forEach(({dx:O,dy:z},U)=>{x+=O,_+=z,(!U||x<A.xMin)&&(A.xMin=x),(!U||x>A.xMax)&&(A.xMax=x),(!U||_<A.yMin)&&(A.yMin=_),(!U||_>A.yMax)&&(A.yMax=_),jH(O,z,!!(T[U]&1),i,r)}),Rf(r,k),c.bytes(S),(ht(e,w+2)!=A.xMin||ht(e,w+4)!=A.yMin||ht(e,w+6)!=A.xMax||ht(e,w+8)!=A.yMax)&&(u[g>>3]|=128>>(g&7),l.bytes(e.subarray(w+2,w+10))),T.length&&T[0]&64&&(d[g>>3]|=128>>(g&7),h=!0)}else{n.int16(-1),u[g>>3]|=128>>(g&7),l.bytes(e.subarray(w+2,w+10));let y=w+10,E,k=!1;do E=Z(e,y),y+=KR(E),k=k||!!(E&256);while(E&32&&y<f);if(s.bytes(e.subarray(w+10,y)),k){let S=Z(e,y);Rf(r,S),c.bytes(e.subarray(y+2,y+2+S))}}}let m=[n,o,i,r,s,null,c].map(g=>g?g.toUint8Array():FH([u,l.toUint8Array()])),p=new zt;return p.uint16(0),p.uint16(h?1:0),p.uint16(a),p.uint16(1),m.forEach(g=>p.uint32(g.length)),m.forEach(g=>p.bytes(g)),h&&p.bytes(d),p.toUint8Array()}function FH(e){let t=new Uint8Array(e.reduce((n,o)=>n+o.length,0)),a=0;return e.forEach(n=>{t.set(n,a),a+=n.length}),t}function Cf(e,t,a){let n=e[t[a]++];if(n==253){let o=Z(e,t[a]);return t[a]+=2,o}else return n==255?e[t[a]++]+253:n==254?e[t[a]++]+506:n}function Rf(e,t){t<253?e.uint8(t):t<506?(e.uint8(255),e.uint8(t-253)):t<759?(e.uint8(254),e.uint8(t-506)):(e.uint8(253),e.uint16(t))}function WR(e,t){let a=0;for(let n=0;n<5;n++){let o=e[t++];if(!n&&o==128||a>=33554432)throw new Error("Invalid UIntBase128");if(a=a*128+(o&127),!(o&128))return[a,t]}throw new Error("Invalid UIntBase128")}function VR(e,t){let a=[];do a.unshift(t&127),t=Math.floor(t/128);while(t>0);a.forEach((n,o)=>e.uint8(o<a.length-1?n|128:n))}var zt=class{constructor(){this.data=new Uint8Array(256),this.length=0}ensure(t){if(this.length+t>this.data.length){let a=this.data.length*2;for(;a<this.length+t;)a*=2;let n=new Uint8Array(a);n.set(this.data.subarray(0,this.length)),this.data=n}}uint8(t){this.ensure(1),this.data[this.length++]=t&255}uint16(t){this.ensure(2),ze(this.data,this.length,t),this.length+=2}int16(t){this.uint16(t&65535)}uint32(t){this.ensure(4),fe(this.data,this.length,t),this.length+=4}bytes(t){this.ensure(t.length),this.data.set(t,this.length),this.length+=t.length}toUint8Array(){return this.data.subarray(0,this.length)}};function If(e,t,a){let n=[];if(a==1){if(e.length<(t+1)*4)return null;for(let o=0;o<=t;o++)n.push(xe(e,o*4))}else{if(e.length<(t+1)*2)return null;for(let o=0;o<=t;o++)n.push(Z(e,o*2)*2)}return n}function zH(e){let t=new Map,a=new Map,n=null,o=Z(e,2);for(let i=0;i<o;i++){let r=4+i*8,s=Z(e,r),l=Z(e,r+2),c=xe(e,r+4),u=Z(e,c);if(u==14){if(s==0&&l==5){let d=xe(e,c+2);n=e.subarray(c,c+d),BH(e,c,a)}}else(s==0||s==3&&(l==1||l==10))&&UH(e,c,u,t)}return{mapping:t,variationGlyphIds:a,variationSubtable:n}}function UH(e,t,a,n){let o=(i,r)=>{r&&!n.has(i)&&n.set(i,r)};if(a==0)for(let i=0;i<256;i++)o(i,e[t+6+i]);else if(a==4){let i=Z(e,t+6)/2,r=t+14,s=r+i*2+2,l=s+i*2,c=l+i*2;for(let u=0;u<i;u++){let d=Z(e,r+u*2),h=Z(e,s+u*2),m=Z(e,l+u*2),p=c+u*2,g=Z(e,p);for(let w=h;w<=d&&w!=65535;w++)if(g){let f=p+g+(w-h)*2;if(f+1<e.length){let b=Z(e,f);o(w,b?b+m&65535:0)}}else o(w,w+m&65535)}}else if(a==6){let i=Z(e,t+6),r=Z(e,t+8);for(let s=0;s<r;s++)o(i+s,Z(e,t+10+s*2))}else if(a==12){let i=xe(e,t+12);for(let r=0;r<i;r++){let s=t+16+r*12,l=xe(e,s),c=xe(e,s+4),u=xe(e,s+8);for(let d=l;d<=c;d++)o(d,u+d-l)}}}function BH(e,t,a){let n=xe(e,t+6);for(let o=0;o<n;o++){let i=t+10+o*11,r=xe(e,i+7);if(r){let s=t+r,l=xe(e,s);for(let c=0;c<l;c++){let u=s+4+c*5,d=e[u]<<16|e[u+1]<<8|e[u+2];a.has(d)||a.set(d,new Set),a.get(d).add(Z(e,u+3))}}}}function HH(e,t){let a=[],n=Z(e,8),o=Z(e,n);for(let r=0;r<o;r++){let s=n+Z(e,n+2+r*2),l=Z(e,s),c=Z(e,s+4);for(let u=0;u<c;u++)XR(e,l,s+Z(e,s+6+u*2),a)}let i;do i=!1,a.forEach(r=>{!r.done&&r.inputs.every(s=>t.has(s))&&(r.done=!0,r.outputs.forEach(s=>{t.has(s)||(t.add(s),i=!0)}))});while(i)}function XR(e,t,a,n){let o=Z(e,a);if(t==7)XR(e,Z(e,a+2),a+xe(e,a+4),n);else if(t==1){let i=zu(e,a+Z(e,a+2));if(o==1){let r=ht(e,a+4);i.forEach(s=>n.push({inputs:[s],outputs:[s+r&65535]}))}else{let r=_f(e,a+4);i.forEach((s,l)=>n.push({inputs:[s],outputs:r.slice(l,l+1)}))}}else if(t==2||t==3){let i=zu(e,a+Z(e,a+2)),r=Z(e,a+4);for(let s=0;s<r&&s<i.length;s++)n.push({inputs:[i[s]],outputs:_f(e,a+Z(e,a+6+s*2))})}else if(t==4){let i=zu(e,a+Z(e,a+2)),r=Z(e,a+4);for(let s=0;s<r&&s<i.length;s++){let l=a+Z(e,a+6+s*2),c=Z(e,l);for(let u=0;u<c;u++){let d=l+Z(e,l+2+u*2),h=Z(e,d+2),m=[i[s]];for(let p=1;p<h;p++)m.push(Z(e,d+4+(p-1)*2));n.push({inputs:m,outputs:[Z(e,d)]})}}}else if(t==8){let i=zu(e,a+Z(e,a+2)),r=Z(e,a+4),s=a+6+r*2,l=Z(e,s),c=_f(e,s+2+l*2);i.forEach((u,d)=>n.push({inputs:[u],outputs:c.slice(d,d+1)}))}}function _f(e,t){let a=[],n=Z(e,t);for(let o=0;o<n;o++)a.push(Z(e,t+2+o*2));return a}function zu(e,t){let a=[],n=Z(e,t);if(n==1){let o=Z(e,t+2);for(let i=0;i<o;i++)a.push(Z(e,t+4+i*2))}else if(n==2){let o=Z(e,t+2);for(let i=0;i<o;i++){let r=t+4+i*6,s=Z(e,r),l=Z(e,r+2);for(let c=s;c<=l;c++)a.push(c)}}return a}function ZR(e,t,a,n){let o=t[a],i=t[a+1];if(i-o<10||ht(e,o)>=0)return;let r=o+10,s;do{s=Z(e,r);let l=Z(e,r+2);r+=s&1?8:6,s&8?r+=2:s&64?r+=4:s&128&&(r+=8),n.has(l)||(n.add(l),ZR(e,t,l,n))}while(s&32&&r<i)}function GH(e,t,a,n){let o=[],i=0;for(let c=0;c<a;c++){let u=n.has(c)?e.subarray(t[c],t[c+1]):new Uint8Array(0);o.push(u),i+=Xa(u.length)}let r=new Uint8Array(i),s=new Uint8Array((a+1)*4),l=0;return o.forEach((c,u)=>{fe(s,u*4,l),r.set(c,l),l+=Xa(c.length)}),fe(s,a*4,l),{glyfTable:r,locaTable:s}}function WH(e,t){let a=Array.from(e.keys()).sort((d,h)=>d-h),n=a.filter(d=>d<=65535),o=VH(n,e),i=a.length>n.length?qH(a,e):null,r=[[0,3,o]];i&&r.push([0,4,i]),t&&r.push([0,5,t]),r.push([3,1,o]),i&&r.push([3,10,i]);let s=[],l=new Map,c=4+r.length*8;r.forEach(([,,d])=>{l.has(d)||(l.set(d,c),s.push(d),c+=d.length)});let u=new Uint8Array(c);return ze(u,0,0),ze(u,2,r.length),r.forEach(([d,h,m],p)=>{let g=4+p*8;ze(u,g,d),ze(u,g+2,h),fe(u,g+4,l.get(m))}),s.forEach(d=>u.set(d,l.get(d))),u}function VH(e,t){let a=[];e.forEach(p=>{let g=a[a.length-1];g&&p==g.endCode+1?(g.endCode=p,g.glyphIds.push(t.get(p))):a.push({startCode:p,endCode:p,glyphIds:[t.get(p)]})}),a.forEach(p=>{let g=p.glyphIds[0]-p.startCode&65535;p.delta=p.glyphIds.every((w,f)=>(p.startCode+f+g&65535)==w)?g:null}),a.push({startCode:65535,endCode:65535,glyphIds:[],delta:1});let n=a.length,o=a.reduce((p,g)=>p+(g.delta===null?g.glyphIds.length:0),0),i=16+n*8+o*2,r=new Uint8Array(i),s=2*Math.pow(2,Math.floor(Math.log2(n)));ze(r,0,4),ze(r,2,i),ze(r,4,0),ze(r,6,n*2),ze(r,8,s),ze(r,10,Math.log2(s/2)),ze(r,12,n*2-s);let l=14,c=l+n*2+2,u=c+n*2,d=u+n*2,h=d+n*2,m=0;return a.forEach((p,g)=>{ze(r,l+g*2,p.endCode),ze(r,c+g*2,p.startCode),p.delta===null?(ze(r,u+g*2,0),ze(r,d+g*2,h+m*2-(d+g*2)),p.glyphIds.forEach(w=>{ze(r,h+m*2,w),m++})):(ze(r,u+g*2,p.delta),ze(r,d+g*2,0))}),r}function qH(e,t){let a=[];e.forEach(i=>{let r=t.get(i),s=a[a.length-1];s&&i==s.endCharCode+1&&r==s.startGlyphId+(i-s.startCharCode)?s.endCharCode=i:a.push({startCharCode:i,endCharCode:i,startGlyphId:r})});let n=16+a.length*12,o=new Uint8Array(n);return ze(o,0,12),ze(o,2,0),fe(o,4,n),fe(o,8,0),fe(o,12,a.length),a.forEach((i,r)=>{let s=16+r*12;fe(o,s,i.startCharCode),fe(o,s+4,i.endCharCode),fe(o,s+8,i.startGlyphId)}),o}function YH(e,t){let a=Array.from(t.keys()).sort(),n=[],o=12+a.length*16;a.forEach(l=>{let c=t.get(l);n.push({tag:l,offset:o,length:c.length,checksum:qR(c)}),o+=Xa(c.length)});let i=new Uint8Array(o),r=16*Math.pow(2,Math.floor(Math.log2(a.length)));fe(i,0,e),ze(i,4,a.length),ze(i,6,r),ze(i,8,Math.log2(r/16)),ze(i,10,a.length*16-r),n.forEach((l,c)=>{let u=12+c*16;$R(i,u,l.tag),fe(i,u+4,l.checksum),fe(i,u+8,l.offset),fe(i,u+12,l.length),i.set(t.get(l.tag),l.offset)});let s=n.find(l=>l.tag==An);return fe(i,s.offset+8,2981146554-qR(i)>>>0),{data:i,entries:n}}async function KH(e,t){let a=await Promise.all(e.entries.map(async l=>{let c=e.data.subarray(l.offset,l.offset+l.length),u=await $H(c);return{entry:l,data:u.length<c.length?u:c}})),n=44+a.length*20,o=a.map(({data:l})=>{let c=n;return n+=Xa(l.length),c}),i=t.metadata?n:0;n+=t.metadata?Xa(t.metadata.length):0;let r=t.privateData?n:0;n+=t.privateData?t.privateData.length:0;let s=new Uint8Array(n);return fe(s,0,2001684038),fe(s,4,t.flavor),fe(s,8,n),ze(s,12,a.length),fe(s,16,e.data.length),fe(s,20,t.version),fe(s,24,i),fe(s,28,t.metadata?t.metadata.length:0),fe(s,32,t.metadata?t.metaOriginalLength:0),fe(s,36,r),fe(s,40,t.privateData?t.privateData.length:0),a.forEach(({entry:l,data:c},u)=>{let d=44+u*20;$R(s,d,l.tag),fe(s,d+4,o[u]),fe(s,d+8,c.length),fe(s,d+12,l.length),fe(s,d+16,l.checksum),s.set(c,o[u])}),t.metadata&&s.set(t.metadata,i),t.privateData&&s.set(t.privateData,r),s}async function XH(e,t,a,n){let o=e.entries.find(p=>p.tag==Ka),i=If(e.data.subarray(o.offset,o.offset+o.length),n,1),r=new zt,s=new zt;e.entries.forEach(p=>{let g=e.data.subarray(p.offset,p.offset+p.length),w=YR.indexOf(p.tag),f=0,b=g;p.tag==Ya?(f=0,b=PH(g,i,n)):p.tag==Ka&&(f=0,b=new Uint8Array(0)),r.uint8((w<0?63:w)|f<<6),w<0&&r.bytes(new Uint8Array([...p.tag].map(y=>y.charCodeAt(0)))),VR(r,p.length),(p.tag==Ya||p.tag==Ka)&&VR(r,b.length),s.bytes(b)});let l=await a.compress(s.toUint8Array()),c=r.toUint8Array(),u=Xa(48+c.length+l.length),d=t.metadata?u:0;u=t.metadata?Xa(d+t.metadata.length):u;let h=t.privateData?u:0;u=t.privateData?h+t.privateData.length:u;let m=new Uint8Array(u);return fe(m,0,2001684018),fe(m,4,t.flavor),fe(m,8,u),ze(m,12,e.entries.length),fe(m,16,e.data.length),fe(m,20,l.length),fe(m,24,t.version),fe(m,28,d),fe(m,32,t.metadata?t.metadata.length:0),fe(m,36,t.metadata?t.metaOriginalLength:0),fe(m,40,h),fe(m,44,t.privateData?t.privateData.length:0),m.set(c,48),m.set(l,48+c.length),t.metadata&&m.set(t.metadata,d),t.privateData&&m.set(t.privateData,h),m}async function ZH(e,t){let a=await Hu(e,new DecompressionStream("deflate"));if(a.length!=t)throw new Error("Invalid WOFF table length");return a}function $H(e){return Hu(e,new CompressionStream("deflate"))}async function Hu(e,t){return new Uint8Array(await new Response(new Blob([e]).stream().pipeThrough(t)).arrayBuffer())}function qR(e){let t=0,a=Xa(e.length);for(let n=0;n<a;n+=4){let o=0;for(let i=0;i<4;i++)o=o<<8|(n+i<e.length?e[n+i]:0);t=t+(o>>>0)>>>0}return t}function Xa(e){return e+3&-4}function Lf(e,t){return String.fromCharCode(e[t],e[t+1],e[t+2],e[t+3])}function $R(e,t,a){for(let n=0;n<4;n++)e[t+n]=a.charCodeAt(n)}function Z(e,t){return e[t]<<8|e[t+1]}function ht(e,t){let a=Z(e,t);return a&32768?a-65536:a}function xe(e,t){return(e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3])>>>0}function ze(e,t,a){e[t]=a>>>8&255,e[t+1]=a&255}function Vi(e,t,a){ze(e,t,a&65535)}function fe(e,t,a){e[t]=a>>>24&255,e[t+1]=a>>>16&255,e[t+2]=a>>>8&255,e[t+3]=a&255}var Mf="data:",JH="about:blank",QH=/(#.+?)$/,a_="blob:",eG=/^https?:\/\//,tG=/^file:\/\//,aG=/^https?:\/\/+\s*$/,nG=/^(https?:\/\/|file:\/\/|blob:).+/,oG="data:image/svg+xml",iG=["IMG","LINK","SCRIPT"],rG="utf-8",sG=/(url|local|-sf-url-original)\(.*?\)\s*(,|$)/g,lG=/url\s*\(\s*'(.*?)'\s*\)/i,cG=/url\s*\(\s*"(.*?)"\s*\)/i,uG=/url\s*\(\s*(.*?)\s*\)/i,dG=/^'(.*?)'$/,hG=/^"(.*?)"$/,mG=/^url\(\s*["']?data:font\/(woff2?)/,pG=/^url\(\s*["']?data:application\/x-font-(woff)/,gG=/\.([^.?#]+)((\?|#).*?)?$/,fG=/format\(\s*([^)]*?)\s*\)/,wG=/tech\(\s*([^)]*?)\s*\)/,bG=/^(\S+)\s+supports\s+(.+)$/,Nf=/(.*?)\s*,?$/,QR="all",e_=globalThis.Blob,yG=globalThis.Image,kG=globalThis.OffscreenCanvas,EG=.8,vG="http://www.w3.org/2000/svg",lt,ct;function Wu(e,t){return lt=e,ct=t,Of}var Of=class{async processPageResources(t,a,n,o,i,r){let s=n.removeAlternativeImages&&!n.blockImages?SG(t,a,n):new Set,c=[['link[href][rel*="icon"]',"href",!0],['object[type="image/svg+xml"], object[type="image/svg-xml"], object[data*=".svg"]',"data"],["img[src], input[src][type=image]","src",!1,!0],['embed[src*=".svg"]',"src"],["video[poster]","poster"],["*[background]","background"],["image, feImage","xlink:href"],["image, feImage","href"]].map(([u,d,h,m])=>this.processAttribute(t,t.querySelectorAll(u),d,a,n,"image",o,h,r,i,m));c=c.concat([this.processXLinks(t.querySelectorAll("use"),t,a,n,r,"xlink:href"),this.processXLinks(t.querySelectorAll("use"),t,a,n,r,"href"),this.processSrcset(t.querySelectorAll("img[srcset], source[srcset]"),a,n,o,r,s)]),c.push(this.processAttribute(t,t.querySelectorAll('object[data*=".pdf"]'),"data",a,n,null,o,!1,r,i)),c.push(this.processAttribute(t,t.querySelectorAll('embed[src*=".pdf"]'),"src",a,n,null,o,!1,r,i)),c.push(this.processAttribute(t,t.querySelectorAll("audio[src], audio > source[src]"),"src",a,n,"audio",o,!1,r,i)),c.push(this.processAttribute(t,t.querySelectorAll("video[src], video > source[src]"),"src",a,n,"video",o,!1,r,i)),c.push(this.processAttribute(t,t.querySelectorAll("audio track[src], video track[src]"),"src",a,n,null,o,!1,r,i)),c.push(this.processAttribute(t,t.querySelectorAll("model[src], model > source[src]"),"src",a,n,"model",o,!1,r,i)),c.push(this.processAttribute(t,t.querySelectorAll("model[environmentmap]"),"environmentmap",a,n,"model",o,!1,r,i)),await Promise.all(c),s.forEach(u=>{let d=u.getAttribute("src"),h=u.getAttribute("srcset");d&&h&&h.startsWith(d+" ")&&u.removeAttribute("src")}),n.saveFavicon&&this.processShortcutIcons(t)}async processXLinks(t,a,n,o,i,r){await Promise.all(Array.from(t).map(async s=>{let l=s.getAttribute(r);l==null&&(r="href",l=s.getAttribute(r)),o.saveOriginalURLs&&!ca(l)&&s.setAttribute("data-sf-original-href",l);let c=kt(l);if($a(c)&&!$t(c)){if(s.setAttribute(r,lt.EMPTY_RESOURCE),!o.blockImages){try{c=lt.resolveURL(c,n)}catch{}if(la(c)){let u=l.match(QH);if(l.startsWith(n+"#"))s.setAttribute(r,u[0]);else{let d=await i.addURL(c,{expectedType:"image"}),h=lt.parseSVGContent(d.content);if(u&&u[0]){let m=u[0].substring(1),p=h.getElementById(m);if(!p)try{p=h.getElementById(decodeURIComponent(m))}catch{}p&&(s.setAttribute(r,u[0]),s.parentElement.insertBefore(p,s.parentElement.firstChild))}else s.setAttribute(r,oG+","+d.content)}}}}else c==o.url&&s.setAttribute(r,l.substring(c.length))}))}async processStylesheet(t,a,n,o,i,r=!1){let s=[],l=[],c=this;for(let d=t.head;d;d=d.next){let h=d.data;h.type=="Atrule"&&h.name=="charset"?l.push(d):h.block&&h.block.children?h.type=="Atrule"&&_e(h.name)=="font-face"?r?l.push(d):s.push(u(h)):h.type=="Rule"?(n_(h.block.children),s.push(c.processStyle(h,n,o,i))):h.type=="Atrule"&&kn(h)?s.push(c.processStylesheet(h.block.children,a,n,o,i,r||_e(h.name)=="scope")):s.push(c.processStyle(h,n,o,i)):h.type=="Declaration"&&s.push(c.processStyle(h,n,o,i))}l.forEach(d=>t.remove(d)),await Promise.all(s);async function u(d){let h=Za(d);await Promise.all(h.map(async m=>{let p=m.value;if(n.blockFonts)m.value=lt.EMPTY_RESOURCE;else{let g=kt(p);!$t(g)&&la(g)&&await c.processFont(g,m,p,a,n,o,i)}}))}}async processSrcset(t,a,n,o,i,r=new Set){await Promise.all(Array.from(t).map(async s=>{let l=s.getAttribute("srcset"),c=lt.parseSrcset(l);if(n.saveOriginalURLs&&!ca(l)&&s.setAttribute("data-sf-original-srcset",l),!n.blockImages&&(!n.removeAlternativeImages||r.has(s))){let d=(await Promise.all(c.map(async h=>{let m=kt(h.url);if($t(m))return pn([Object.assign({},h,{url:m})]);if($a(m)){try{m=lt.resolveURL(m,a)}catch{}return la(m)?this.processImageSrcset(m,h,o,i,s):""}else return""}))).filter(h=>h).join(", ");d?s.setAttribute("srcset",d):(s.removeAttribute("srcset"),s.removeAttribute("sizes"))}else s.removeAttribute("srcset"),s.removeAttribute("sizes")}))}setAttributeEmpty(t,a,n){n=="video"||n=="audio"?t.removeAttribute(a):t.setAttribute(a,lt.EMPTY_RESOURCE)}async resizeCanvasImages(t,a,n){a&&n.imageReductionFactor>1&&await Promise.all(a.map(async o=>{o&&o.dataURI&&(o.dataURI=await Gs(t,o.dataURI,n))}))}setBackgroundImage(t,a,n){t.style.setProperty("background-blend-mode","normal","important"),t.style.setProperty("background-clip","content-box","important"),t.style.setProperty("background-position",n&&n["background-position"]?n["background-position"]:"center","important"),t.style.setProperty("background-color",n&&n["background-color"]?n["background-color"]:"transparent","important"),t.style.setProperty("background-image",a,"important"),t.style.setProperty("background-size",n&&n["background-size"]?n["background-size"]:"100% 100%","important"),t.style.setProperty("background-origin","content-box","important"),t.style.setProperty("background-repeat","no-repeat","important"),t.style.setProperty("background-attachment","scroll","important")}async getStylesheetContent(t,a,n={}){let o=await lt.getContent(t,{inline:!a.compressContent,maxResourceSize:a.maxResourceSize,maxResourceSizeEnabled:a.maxResourceSizeEnabled,validateTextContentType:!0,frameId:a.frameId,charset:a.charset,resourceReferrer:a.resourceReferrer,stylesheetURL:n.stylesheetURL,stylesheetReferrerPolicy:n.stylesheetReferrerPolicy,baseURI:a.baseURI,blockMixedContent:a.blockMixedContent,expectedType:"stylesheet",acceptHeaders:a.acceptHeaders,networkTimeout:a.networkTimeout,manifestEntries:a.manifestEntries});return Xn(o.data,o.charset)||Xn(o.data,a.charset)?o:(a=Object.assign({},a,{charset:qi(o.data)}),lt.getContent(t,{inline:!a.compressContent,maxResourceSize:a.maxResourceSize,maxResourceSizeEnabled:a.maxResourceSizeEnabled,validateTextContentType:!0,frameId:a.frameId,charset:a.charset,resourceReferrer:a.resourceReferrer,stylesheetURL:n.stylesheetURL,stylesheetReferrerPolicy:n.stylesheetReferrerPolicy,baseURI:a.baseURI,blockMixedContent:a.blockMixedContent,expectedType:"stylesheet",acceptHeaders:a.acceptHeaders,networkTimeout:a.networkTimeout}))}getLiveStylesheetContent(t,a){let n=t.getAttribute(lt.LINK_STYLESHEET_ATTRIBUTE_NAME);if(a.linkStylesheets&&n!==null){let o=a.linkStylesheets[Number(n)];if(o&&o.href==t.href)try{let i=o.sheet&&o.sheet.cssRules;if(i&&i.length)return Array.from(i).map(r=>r.cssText).join(`
`)}catch{}}}processShortcutIcons(t){let a=jf(Array.from(t.querySelectorAll('link[href][rel="shortcut icon"]')));a||(a=jf(Array.from(t.querySelectorAll('link[href][rel="icon"]')))),a||(a=jf(Array.from(t.querySelectorAll('link[href][rel*="icon"]'))),a&&(a.rel="shortcut icon")),a&&t.querySelectorAll('link[href][rel*="icon"]').forEach(n=>{n!=a&&n.remove()})}replacePseudoClassDefined(t){ct.walk(t,{enter:function(a,n,o){a.type=="PseudoClassSelector"&&a.name=="defined"&&(n.prev==null||n.prev.data.type=="Combinator"||n.prev.data.type=="WhiteSpace"?o.replace(n,ct.parse("*",{context:"selector"}).children.head):o.remove(n))}})}resolveStylesheetURLs(t,a,n,o,i){TG(t),Za(t).map(s=>{let l=s.value,c=kt(l);if(!$t(c)&&(n.textContent='tmp { content:"'+c+'"}',n.sheet&&n.sheet.cssRules&&(c=lt.removeQuotes(n.sheet.cssRules[0].style.getPropertyValue("content"))),!$t(c)))if(!c||$a(c)){let u;if(!l.startsWith("#"))try{u=lt.resolveURL(c,a)}catch{}la(u)&&(s.value=u,o&&i&&!i.has(kt(u))&&i.set(kt(u),o))}else s.value=lt.EMPTY_RESOURCE})}async removeAlternativeFonts(t,a,n,o){let i=this.createFontsDetailsInfo(),r={rules:{processed:0,discarded:0},fonts:{processed:0,discarded:0}},s=new Map;return ts(a).forEach(({stylesheetInfo:l,index:c})=>{if(l.stylesheet){l.scope&&ct.walk(l.stylesheet,{visit:"Atrule",enter:d=>s.set(d,l.scope)});let u=l.stylesheet.children;if(u)if(r.rules.processed+=u.size,r.rules.discarded+=u.size,l.mediaText&&l.mediaText!=QR){let d=this.createFontsDetailsInfo();i.medias.set("media-"+c+"-"+l.mediaText,d),this.getFontsDetails(t,u,c,d)}else this.getFontsDetails(t,u,c,i)}}),No(i,n),this.markRepeatedFontFaceRules(i,s,new Map),await Promise.all([...a].map(async([,l],c)=>{if(l.stylesheet){let u=l.stylesheet.children,d=l.mediaText;u&&(d&&d!=QR?await this.processFontFaceRules(u,c,i.medias.get("media-"+c+"-"+d),n,o,r):await this.processFontFaceRules(u,c,i,n,o,r),r.rules.discarded-=u.size)}})),r}markRepeatedFontFaceRules(t,a,n){let o=new Map;t.fonts.forEach((i,r)=>{let s=a.get(r);s&&!n.has(s)&&n.set(s,n.size+1);let l=(s?n.get(s):0)+" "+this.getFontKey(r)+" "+this.getPropertyValue(r,"src"),c=o.get(l);c&&t.repeatedFonts.add(c),o.set(l,r)}),t.medias.forEach(i=>this.markRepeatedFontFaceRules(i,a,n)),t.supports.forEach(i=>this.markRepeatedFontFaceRules(i,a,n)),t.layers.forEach(i=>this.markRepeatedFontFaceRules(i,a,n))}async processFontFaceRules(t,a,n,o,i,r){let s=[],l=0,c=0,u=0;for(let d=t.head;d;d=d.next){let h=d.data;if(h.type=="Atrule"&&h.name=="media"&&h.block&&h.block.children&&h.prelude){let m=ct.generate(h.prelude);await this.processFontFaceRules(h.block.children,a,n.medias.get("media-"+a+"-"+l+"-"+m),o,i,r),l++}else if(h.type=="Atrule"&&h.name=="supports"&&h.block&&h.block.children&&h.prelude){let m=ct.generate(h.prelude);await this.processFontFaceRules(h.block.children,a,n.supports.get("supports-"+a+"-"+c+"-"+m),o,i,r),c++}else if(h.type=="Atrule"&&h.name=="layer"&&h.block&&h.block.children&&h.prelude){let m=ct.generate(h.prelude);await this.processFontFaceRules(h.block.children,a,n.layers.get("layer-"+a+"-"+u+"-"+m),o,i,r),u++}else if(h.type=="Atrule"&&h.name=="font-face"){let m=n.fonts.get(h);m?n.repeatedFonts.has(h)?s.push(d):await this.processFontFaceRule(h,m,o,i,r)||s.push(d):s.push(d)}}s.forEach(d=>t.remove(d))}groupDuplicateFonts(){}groupDuplicateImages(){}getFontsDetails(t,a,n,o){let i=0,r=0,s=0;a.forEach(l=>{if(l.type=="Atrule"&&l.name=="media"&&l.block&&l.block.children&&l.prelude){let c=ct.generate(l.prelude),u=this.createFontsDetailsInfo();o.medias.set("media-"+n+"-"+i+"-"+c,u),i++,this.getFontsDetails(t,l.block.children,n,u)}else if(l.type=="Atrule"&&l.name=="supports"&&l.block&&l.block.children&&l.prelude){let c=ct.generate(l.prelude),u=this.createFontsDetailsInfo();o.supports.set("supports-"+n+"-"+r+"-"+c,u),r++,this.getFontsDetails(t,l.block.children,n,u)}else if(l.type=="Atrule"&&l.name=="layer"&&l.block&&l.block.children&&l.prelude){let c=ct.generate(l.prelude),u=this.createFontsDetailsInfo();o.layers.set("layer-"+n+"-"+s+"-"+c,u),s++,this.getFontsDetails(t,l.block.children,n,u)}else if(l.type=="Atrule"&&l.name=="font-face"&&l.block&&l.block.children){let c=[];o.fonts.set(l,c);let u=this.getPropertyValue(l,"src");if(u){let d=u.match(sG);d&&d.forEach(h=>{let m=h.match(Nf)[1];c.includes(m)&&c.splice(c.indexOf(m),1),c.unshift(m)})}}})}createFontsDetailsInfo(){return{fonts:new Map,medias:new Map,supports:new Map,layers:new Map,repeatedFonts:new Set}}getFontFacesGlyphRanges(t,a){let n=new Map;(a.usedFontsCharacters||[]).forEach(([i,,r,s])=>{let l=n.get(i);l||(l={ranges:[],unknown:!1},n.set(i,l)),l.ranges.push(...r||[]),l.unknown=l.unknown||!!s});let o=[];return t.forEach(i=>{i.stylesheet&&i.stylesheet.children&&Df(i.stylesheet.children,r=>{let s=So(this.getPropertyValue(r,"font-family")),l=s&&n.get(s);o.push({urlNodes:Za(r),ranges:l&&!l.unknown?l.ranges:null})})}),o}getFontKey(t){return JSON.stringify([So(this.getPropertyValue(t,"font-family")),zn(this.getPropertyValue(t,"font-weight")||"400"),this.getPropertyValue(t,"font-style")||"normal",this.getPropertyValue(t,"unicode-range"),Si(this.getPropertyValue(t,"font-stretch")),this.getPropertyValue(t,"font-width"),this.getPropertyValue(t,"font-variant")||"normal",this.getPropertyValue(t,"font-feature-settings"),this.getPropertyValue(t,"font-variation-settings"),this.getPropertyValue(t,"ascent-override"),this.getPropertyValue(t,"descent-override"),this.getPropertyValue(t,"line-gap-override"),this.getPropertyValue(t,"size-adjust")])}getPropertyValue(t,a){let n;if(t.block.children&&(n=t.block.children.filter(o=>{try{return o.property==a&&!ct.generate(o.value).match(/\\9$/)}catch{return o.property==a}}).tail),n)try{return ct.generate(n.data.value)}catch{}}};function No(e,t){e.fonts.forEach((a,n)=>{e.fonts.set(n,a.map(o=>{let i=o.match(fG),r=o.match(wG),s,l,c=_G(o);if(i&&i[1]){s=i[1].replace(dG,"$1").replace(hG,"$1").toLowerCase();let u=s.match(bG);u&&(s=u[1],l=u[2])}if(r&&r[1]&&(l=r[1].toLowerCase()),!s){let u=o.match(mG);if(u&&u[1])s=u[1];else{let d=o.match(pG);d&&d[1]&&(s=d[1])}}if(!s&&c){let u=c.match(gG);u&&u[1]&&(s=u[1])}if(t){let u=Array.from(t.values()).find(d=>d.name==c);return{src:o.match(Nf)[1],fontUrl:c,format:s,tech:l,contentType:u&&u.contentType}}else return{src:o.match(Nf)[1],fontUrl:c,format:s,tech:l}}))}),t?(e.medias.forEach(a=>No(a,t)),e.supports.forEach(a=>No(a,t)),e.layers.forEach(a=>No(a,t))):(e.medias.forEach(a=>No(a)),e.supports.forEach(a=>No(a)),e.layers.forEach(a=>No(a)))}function Zn(e,t){if(t.rootDocument&&t.updatedResources[e])return t.updatedResources[e].retrieved=!0,t.updatedResources[e].content}function SG(e,t,a){let n=new Set;return a.images&&e.querySelectorAll("img["+lt.IMAGE_ATTRIBUTE_NAME+"]").forEach(o=>{let i=a.images[Number(o.getAttribute(lt.IMAGE_ATTRIBUTE_NAME))],r=i&&i.currentSrc;if(r&&!ca(r)&&o.getAttribute("src")!=lt.EMPTY_RESOURCE){let s=[],l=o.parentElement;l&&l.tagName.toUpperCase()=="PICTURE"&&s.push(...Array.from(l.querySelectorAll(":scope > source[srcset]"))),o.getAttribute("srcset")&&s.push(o);let c,u=s.find(d=>(c=AG(d.getAttribute("srcset"),r,t),c));if(c&&(c.w||c.d!==void 0)){o.setAttribute("srcset",pn([{url:r,w:c.w,h:c.h,d:c.d}]));let d=c.w&&u.getAttribute("sizes");d?o.setAttribute("sizes",d):o.removeAttribute("sizes"),n.add(o)}}}),n}function AG(e,t,a){try{return lt.parseSrcset(e).find(n=>{try{return lt.resolveURL(n.url,a)==t}catch{return!1}})}catch{}}function kt(e){return!e||e.startsWith(Mf)?e:e.split("#")[0]}function Xn(e="",t=rG){let a=qi(e);return a?a==t.toLowerCase():!0}function qi(e=""){let t=e.match(/^@charset\s+"([^"]*)";/i);if(t&&t[1])return t[1].toLowerCase().trim()}function n_(e){let t=[];for(let a=e.head;a;a=a.next){let n=a.data;if(n.type=="Atrule"&&_e(n.name)=="font-face")t.push(a);else{let o=kn(n);o&&n_(o)}}t.forEach(a=>e.remove(a))}function Za(e){return ct.findAll(e,t=>t.type=="Url")}function Df(e,t){e.forEach(a=>{a.type=="Atrule"&&a.name=="import"&&a.prelude&&a.prelude.children&&a.prelude.children.head.data.importedChildren?Df(a.prelude.children.head.data.importedChildren,t):a.type=="Atrule"&&_e(a.name)=="font-face"?a.block&&a.block.children&&t(a):a.type=="Atrule"&&a.block&&a.block.children&&Df(a.block.children,t)})}function TG(e){ct.walk(e,{visit:"Atrule",enter(t){_e(t.name)=="font-face"&&t.block&&t.block.children&&t.block.children.forEach(a=>{if(a.type=="Declaration"&&a.property=="src"&&a.value&&a.value.type=="Raw"){let n=CG(a.value.value).map(RG).filter(Boolean);if(n.length){let o=new ct.List;n.forEach((i,r)=>{r&&o.push({type:"Operator",value:","}),i.children.forEach(s=>o.push(s))}),a.value={type:"Value",children:o}}}})}})}function CG(e){let{Function:t,LeftParenthesis:a,LeftSquareBracket:n,LeftCurlyBracket:o,RightParenthesis:i,RightSquareBracket:r,RightCurlyBracket:s,Comma:l}=ct.tokenTypes,c=[],u=0,d=0;return ct.tokenize(e,(h,m,p)=>{h==t||h==a||h==n||h==o?u++:h==i||h==r||h==s?u=Math.max(0,u-1):h==l&&!u&&(c.push(e.substring(d,m)),d=p)}),c.push(e.substring(d)),c}function RG(e){try{let t=ct.parse(e,{context:"value"});if(ct.find(t,a=>a.type=="Url"||a.type=="Function"&&a.name.toLowerCase()=="local"))return t}catch{}}function Vu(e){return ct.findAll(e,t=>t.type=="Atrule"&&t.name=="import")}function jf(e){return e=e.filter(t=>t.href!=lt.EMPTY_RESOURCE),e.sort((t,a)=>(parseInt(a.sizes,10)||16)-(parseInt(t.sizes,10)||16)),e[0]}function Yi(e,t){return t.stylesheetReferrers&&t.stylesheetReferrers.get(kt(e))||{}}function ua(e){if(e.tagName.toUpperCase()=="SOURCE"&&e.parentElement&&e.parentElement.tagName.toUpperCase()=="PICTURE"&&(e=e.parentElement.querySelector("img")),e&&iG.includes(e.tagName.toUpperCase())&&e.referrerPolicy)return e.referrerPolicy}function ca(e){return e&&(e.startsWith(Mf)||e.startsWith(a_))}function qu(e){return e.replace(/url\(-sf-url-original\\\(\\"(.*?)\\"\\\)\\ /g,"/* original URL: $1 */url(")}function $t(e){return e&&(e.startsWith(Mf)||e==JH)}function $a(e){return e&&!e.match(aG)}function la(e){return $a(e)&&(e.match(eG)||e.match(tG)||e.startsWith(a_))&&e.match(nG)}function _G(e){e=e.replace(/url\(-sf-url-original\\\(\\"(.*?)\\"\\\)\\ /g,"");let t=e.match(lG)||e.match(cG)||e.match(uG);return t&&t[1]}async function Gs(e,t,{imageReductionFactor:a,imageQuality:n},o){if(t){let i=t.substring(5,t.indexOf(";"));if(i=="image/jpeg"||i=="image/png"||i=="image/webp")try{let r=new yG;r.src=t,await new Promise((d,h)=>{r.onload=d,r.onerror=h});let s=r.naturalWidth/a,l=r.naturalHeight/a,c=n===void 0?EG:Number(n),u;try{let d=new kG(s,l);d.getContext("2d").drawImage(r,0,0,s,l),u=await d.convertToBlob({type:i,quality:c})}catch{let d=e.createElement("canvas");d.width=s,d.height=l,d.getContext("2d").drawImage(r,0,0,s,l),u=await new Promise((m,p)=>d.toBlob(g=>{g?m(g):p(new Error("Canvas toBlob failed"))},i,c))}if(u.type==i){let d=await Ki(u,i);d.length<t.length&&(t=d,o&&xG(o)&&(o.setAttribute("width",r.naturalWidth),o.setAttribute("height",r.naturalHeight)))}}catch{}}return t}function xG(e){return e.namespaceURI==vG&&e.localName=="image"&&t_(e.getAttribute("width"))&&t_(e.getAttribute("height"))}function t_(e){return e==null||e.trim().toLowerCase()=="auto"}function Ki(e,t,a){let n=e instanceof e_?e:new e_([e],{type:(t||"")+(a?";charset="+a:"")});return as(n)}var Xi=globalThis.JSON,LG=globalThis.atob,Pf=globalThis.FontFace,o_=globalThis.Set,IG=globalThis.setTimeout,jG=globalThis.clearTimeout,i_=globalThis.Image,NG="about:blank",r_="utf-8",OG="data:",s_=400,l_=0,DG=1,MG=2,PG=4,FG=["media","supports","layer","container"],c_="data:image/svg+xml",u_=["data:text/"],zG=/<script/gi,UG=/<noscript/gi,BG=/<canvas/gi,HG=/^(.* )?data:([^;,]*);base64,(.*)$/,d_="--sf-img-",h_=512*1024,m_=/^url\(["']?data:[^,]*,?["']?\)/,p_="local(",g_=5e3,Ws="data-sf-duplicate-stylesheet-ref",GG="layer",WG="supports",VG=["rel","href","type","media","as","crossorigin","integrity","referrerpolicy","hreflang","sizes","imagesrcset","imagesizes","fetchpriority"],ft;function f_(e){ft=e;let t=Wu(ft,xt);return class extends t{async resolveStylesheets(n,o,i,r,s,l){n.tagName.toUpperCase()=="LINK"&&n.charset&&(s.charset=n.charset),await this.resolveStylesheetElement(n,o,i,r,s,l)}async resolveStylesheetElement(n,o,i,r,s,l){let c;i.set(n,o),s.inlineStylesheetsRefs.has(n)||((!s.blockStylesheets||s.keepPrintStyleSheets&&o.mediaText=="print")&&(n.tagName.toUpperCase()=="LINK"?c=await this.resolveLinkStylesheetURLs(n,n.href,r,s,l):(c=Ve(n.textContent,{context:"stylesheet",parseCustomProperty:!0}),await this.resolveImportURLs(c,r,s,l)&&(c=Ve(ge(c),{context:"stylesheet",parseCustomProperty:!0})))),c&&c.children?(this.replacePseudoClassDefined(c),s.inlineStylesheets.forEach(({content:u,styleElement:d},h)=>{u===n.textContent&&s.inlineStylesheets.set(h,{styleElement:d,content:this.generateStylesheetContent(c,s)})}),o.stylesheet=c):i.delete(n))}replaceStylesheets(n,o,i){let r=Array.from(n.querySelectorAll("style"));if(r.forEach(s=>{let l=o.get(s);l&&!i.inlineStylesheetsRefs.has(s)&&(s.textContent=this.generateStylesheetContent(l.stylesheet,i),i.inlineStylesheets.forEach(({styleElement:c},u)=>{c===s&&i.inlineStylesheets.set(u,{styleElement:c,content:s.textContent})}))}),r.forEach(s=>{let l=o.get(s);if(l){o.delete(s);let c=i.inlineStylesheetsRefs.get(s);if(c!==void 0)if(i.groupDuplicateStylesheets){if(!n.querySelector("style["+Ws+'="'+c+'"]')){let u=n.createElement("style");u.textContent=i.inlineStylesheets.get(c).content,u.setAttribute("media","not all"),u.setAttribute(Ws,c),n.head.appendChild(u)}s.textContent="/* */",s.setAttribute("onload","this.textContent=document.querySelector('style["+Ws+'="'+c+`"]')?.textContent;this.removeAttribute('onload')`)}else s.textContent=i.inlineStylesheets.get(c).content;l.mediaText&&(s.media=l.mediaText)}else s.remove()}),i.groupDuplicateStylesheets&&n.querySelector("style["+Ws+"]")){let s=n.createElement("script");s.textContent='document.currentScript.remove();addEventListener("load",()=>document.querySelectorAll("style['+Ws+']").forEach(e=>e.remove()))',n.body.appendChild(s)}n.querySelectorAll("link[rel*=stylesheet]").forEach(s=>{let l=o.get(s);if(l){o.delete(s);let c=n.createElement("style");Array.from(s.attributes).forEach(({name:u,value:d})=>{VG.includes(u.toLowerCase())||c.setAttribute(u,d)}),l.mediaText&&(c.media=l.mediaText),c.textContent=this.generateStylesheetContent(l.stylesheet,i),s.parentElement.replaceChild(c,s)}else s.remove()})}async resolveImportURLs(n,o,i,r,s=new o_,l){let c;this.resolveStylesheetURLs(n,o,r,l,i.stylesheetReferrers);let u=Vu(n);return await Promise.all(u.map(async d=>{let h=ot(d,m=>m.type=="Url")||ot(d,m=>m.type=="String");if(h){let m=kt(h.value);if(!$t(m)&&$a(m)){h.value=ft.EMPTY_RESOURCE;try{m=ft.resolveURL(m,o)}catch{}if(la(m)&&!s.has(m)){i.inline=!0;let p=await this.getStylesheetContent(m,i,l);m=p.resourceURL,p.data=Zn(m,i)||p.data,p.data&&p.data.match(/^<!doctype /i)&&(p.data="");let g=qG(d);g!==null&&(p.data=this.wrapLayer(p.data,g));let w=ot(d,E=>E.type=="MediaQueryList");w&&(p.data=this.wrapMediaQuery(p.data,ge(w)));let f=YG(d);f&&(p.data="@supports "+f+" { "+p.data+" }");let b=Ve(p.data,{context:"stylesheet",parseCustomProperty:!0}),y=new o_(s);y.add(m),await this.resolveImportURLs(b,m,i,r,y,{stylesheetURL:m,stylesheetReferrerPolicy:p.referrerPolicy});for(let E of Object.keys(b))d[E]=b[E];c=!0}}}})),c}async resolveLinkStylesheetURLs(n,o,i,r,s){if(o=kt(o),o&&o!=i&&o!=NG){let l=await ft.getContent(o,{inline:!0,maxResourceSize:r.maxResourceSize,maxResourceSizeEnabled:r.maxResourceSizeEnabled,charset:r.charset,frameId:r.frameId,resourceReferrer:r.resourceReferrer,referrerPolicy:ua(n),validateTextContentType:!0,baseURI:i,blockMixedContent:r.blockMixedContent,expectedType:"stylesheet",acceptHeaders:r.acceptHeaders,networkTimeout:r.networkTimeout,manifestEntries:r.manifestEntries});if(l.failed){let d=this.getLiveStylesheetContent(n,r);d&&(l.data=d)}if(!(Xn(l.data,l.charset)||Xn(l.data,r.charset)))return r=Object.assign({},r,{charset:qi(l.data)}),this.resolveLinkStylesheetURLs(n,o,i,r,s);o=l.resourceURL,l.data=Zn(l.resourceURL,r)||l.data,l.data&&l.data.match(/^<!doctype /i)&&(l.data="");let c=Ve(l.data,{context:"stylesheet",parseCustomProperty:!0});return await this.resolveImportURLs(c,o,r,s,void 0,{stylesheetURL:o,stylesheetReferrerPolicy:l.referrerPolicy})&&(c=Ve(ge(c),{context:"stylesheet",parseCustomProperty:!0})),c}}async processFrame(n,o,i){let r="allow-popups allow-top-navigation-by-user-activation";(o.content.match(UG)||o.content.match(BG)||o.content.match(zG)||i.saveRawPage)&&(r+=" allow-scripts allow-modals allow-popups allow-downloads allow-pointer-lock allow-presentation"),n.setAttribute("sandbox",r),n.tagName.toUpperCase()=="OBJECT"?n.setAttribute("data","data:text/html,"+o.content):n.tagName.toUpperCase()=="FRAME"?n.setAttribute("src","data:text/html,"+o.content.replace(/%/g,"%25").replace(/#/g,"%23")):n.setAttribute("srcdoc",o.content)}async processFont(n,o,i,r,s,l,c){let{content:u}=await c.addURL(n,{asBinary:!0,expectedType:"font",baseURI:r,blockMixedContent:s.blockMixedContent,...Yi(n,s)}),d=l.fonts.get(o);d||(d=[],l.fonts.set(o,d)),d.push(n),!ca(n)&&s.saveOriginalURLs?o.value="-sf-url-original("+Xi.stringify(i)+") "+u:o.value=u}async processStyle(n,o,i,r){let s=Za(n);await Promise.all(s.map(async l=>{let c=l.value;if(o.blockImages)l.value=ft.EMPTY_RESOURCE;else{let u=kt(c);if(!$t(u)&&la(u)){let{content:d,indexResource:h,duplicate:m}=await r.addURL(u,{asBinary:!0,expectedType:"image",groupDuplicates:o.groupDuplicateImages,...Yi(u,o)});if(!c.startsWith("#")){let p=o.maxSizeDuplicateImages||h_;if(m&&o.groupDuplicateImages&&ft.getContentSize(d)<p){let g=Ve("var("+d_+h+")",{context:"value"});for(let w of Object.keys(g.children.head.data))l[w]=g.children.head.data[w];i.cssVariables.set(h,{content:d,url:c})}else!ca(u)&&o.saveOriginalURLs?l.value="-sf-url-original("+Xi.stringify(c)+") "+d:l.value=d}}}}))}async processAttribute(n,o,i,r,s,l,c,u,d,h,m){await Promise.all(Array.from(o).map(async p=>{let g=p.getAttribute(i);if(g!=null){g=kt(g);let w=p.dataset.singleFileOriginURL;if(s.saveOriginalURLs&&!ca(g)&&p.setAttribute("data-sf-original-"+i,g),delete p.dataset.singleFileOriginURL,!l||!s["block"+l.charAt(0).toUpperCase()+l.substring(1)+"s"]){if(!$t(g)&&(this.setAttributeEmpty(p,i,l),$a(g))){try{g=ft.resolveURL(g,r)}catch{}if(la(g)){let f=["OBJECT","EMBED"].includes(p.tagName.toUpperCase())?p.getAttribute("type"):"",b=s.groupDuplicateImages&&p.tagName.toUpperCase()=="IMG"&&i=="src",{content:y,indexResource:E,duplicate:k}=await d.addURL(g,{asBinary:!0,expectedType:l,contentType:f,groupDuplicates:b,referrerPolicy:ua(p)});if(w&&this.testEmptyResource(y)){try{w=ft.resolveURL(w,r)}catch{}try{g=w,y=(await ft.getContent(g,{asBinary:!0,inline:!0,expectedType:l,contentType:f,maxResourceSize:s.maxResourceSize,maxResourceSizeEnabled:s.maxResourceSizeEnabled,frameId:s.windowId,resourceReferrer:s.resourceReferrer,referrerPolicy:ua(p),acceptHeaders:s.acceptHeaders,networkTimeout:s.networkTimeout,manifestEntries:s.manifestEntries})).data}catch{}}if(s.imageReductionFactor>1&&l=="image"&&i!="background"&&(y=await Gs(n,y,s,p)),u&&this.testEmptyResource(y))p.remove();else if(!this.testEmptyResource(y)){let S=u_.filter(T=>y.startsWith(T)).length;if(l=="image"){if(S&&i_&&(S=await new Promise(T=>{let v=new i_,A=IG(()=>T(!0),100);v.src=y,v.onload=()=>x(),v.onerror=()=>x(!0);function x(_){jG(A),T(_)}})),!S){let T=y.startsWith(c_),v=s.maxSizeDuplicateImages||h_;if(m&&k&&!T&&ft.getContentSize(y)<v)if(this.replaceImageSource(p,d_+E,s)){c.cssVariables.set(E,{content:y,url:w});let A=Ve(p.getAttribute("style"),{context:"declarationList",parseCustomProperty:!0});h.set(p,A)}else p.setAttribute(i,y);else p.setAttribute(i,y)}}else p.setAttribute(i,y)}}}}else this.setAttributeEmpty(p,i,l)}}))}async processImageSrcset(n,o,i,r,s){let{content:l}=await r.addURL(n,{asBinary:!0,expectedType:"image",referrerPolicy:ua(s)});return u_.filter(u=>l.startsWith(u)).length?"":pn([Object.assign({},o,{url:l})])}testEmptyResource(n){return n==ft.EMPTY_RESOURCE}generateStylesheetContent(n,o){let i=ge(n);return o.saveOriginalURLs&&(i=qu(i)),i}replaceImageSource(n,o,i){if(n.getAttribute(ft.IMAGE_ATTRIBUTE_NAME)){let s=i.images[Number(n.getAttribute(ft.IMAGE_ATTRIBUTE_NAME))];if(s&&s.replaceable){n.setAttribute("src",`${c_},<svg xmlns="http://www.w3.org/2000/svg" width="${s.size.pxWidth}" height="${s.size.pxHeight}"><rect fill-opacity="0"/></svg>`);let l={};return(s.objectFit=="content"||s.objectFit=="cover"||s.objectFit=="contain")&&s.objectFit&&(l["background-size"]=s.objectFit),s.objectPosition&&(l["background-position"]=s.objectPosition),s.backgroundColor&&(l["background-color"]=s.backgroundColor),this.setBackgroundImage(n,"var("+o+")",l),n.removeAttribute(ft.IMAGE_ATTRIBUTE_NAME),!0}}}wrapMediaQuery(n,o){return o?"@media "+o+"{ "+n+" }":n}wrapLayer(n,o){return"@layer "+(o?o+" ":"")+"{ "+n+" }"}getAdditionalPageData(){return{}}async processScript(n,o,i,r,s){let l=Zn(o,i);l?l=await Ki(l,"text/javascript",r):l=(await s.addURL(o,{asBinary:!0,inline:!0,charset:r!=r_&&r,maxResourceSize:i.maxResourceSize,maxResourceSizeEnabled:i.maxResourceSizeEnabled,frameId:i.windowId,resourceReferrer:i.resourceReferrer,referrerPolicy:ua(n),baseURI:i.baseURI,blockMixedContent:i.blockMixedContent,expectedType:"script",acceptHeaders:i.acceptHeaders,networkTimeout:i.networkTimeout})).content,n.setAttribute("src",l)}async processWorklet(n,o,i,r,s,l){let{content:c}=await l.addURL(o,{asBinary:!0,charset:s!=r_&&s,maxResourceSize:r.maxResourceSize,maxResourceSizeEnabled:r.maxResourceSizeEnabled,frameId:r.windowId,resourceReferrer:r.resourceReferrer,baseURI:r.baseURI,blockMixedContent:r.blockMixedContent,expectedType:"script",acceptHeaders:r.acceptHeaders,networkTimeout:r.networkTimeout});i?n.textContent+=`  CSS.paintWorklet.addModule("${c}", ${Xi.stringify(i)});
`:n.textContent+=`  CSS.paintWorklet.addModule("${c}");
`}setMetaCSP(n){n.content="default-src 'none'; font-src 'self' data:; img-src 'self' data:; style-src 'unsafe-inline'; media-src 'self' data:; script-src 'unsafe-inline' data:; object-src 'self' data:; frame-src 'self' data:; form-action 'none'; base-uri 'none';"}removeUnusedStylesheets(n){n.querySelectorAll("link[rel*=stylesheet][rel*=alternate][title]").forEach(o=>o.remove())}async removeUnusedGlyphs(n,o,i){await Promise.all(this.getFontFacesGlyphRanges(n,i).map(async({urlNodes:r,ranges:s})=>{s&&await Promise.all(r.map(async l=>{let c=l.value.match(HG);if(c){let[,u="",d,h]=c,m=LG(h),p=new Uint8Array(m.length);for(let w=0;w<p.length;w++)p[w]=m.charCodeAt(w);let g=await Gu(p,s,{brotli:ft.brotli});g&&(l.value=u+await Ki(g,d))}}))}))}groupDuplicateFonts(n,o,i){if(i.usedFonts&&i.usedFonts.length){let r=[],s=new Map;n.forEach(c=>{if(c.stylesheet&&c.stylesheet.children){let u=c.scope||null;s.has(u)||s.set(u,s.size);let d=c.mediaText?"|media "+c.mediaText:"";Ff(c.stylesheet.children,s.get(u)+d,r)}});let l=new Map;r.forEach(c=>{let u=Xi.parse(this.getFontKey(c.ruleData)),d=c.scope+Xi.stringify([u[l_],u[MG],u[PG]]),h=l.get(d);h||(h={name:u[l_],groups:new Map,mergeable:!0},l.set(d,h));let m=this.getPropertyValue(c.ruleData,"src"),p=this.getFontWeightRange(c.ruleData);if(m&&m.includes(OG)&&p){u[DG]=null;let g=Xi.stringify(u)+" "+m,w=h.groups.get(g);w?w.push({fontFace:c,range:p}):h.groups.set(g,[{fontFace:c,range:p}])}else h.mergeable=!1}),l.forEach(c=>this.mergeFontFaceWeights(c,i.usedFonts))}}mergeFontFaceWeights(n,o){let i=Array.from(n.groups.values()),r=s=>s.map(({range:l})=>l.join("-")).sort().join(",");if(n.mergeable&&i.some(s=>s.length>1)&&i.every(s=>r(s)==r(i[0]))){let s=i[0].map(({range:h})=>h),l=Math.min(...s.map(([h])=>h)),c=Math.max(...s.map(([,h])=>h)),u=h=>s.some(([m,p])=>h>=m&&h<=p);o.some(([h,m])=>{let p=Number(m);return h==n.name&&p>l&&p<c&&!u(p)})||i.forEach(h=>{let m=h[h.length-1];this.setFontWeightRange(m.fontFace.ruleData,l,c),h.forEach(({fontFace:p})=>{p!=m.fontFace&&p.cssRules.remove(p.cssRule)})})}}getFontWeightRange(n){let o=this.getPropertyValue(n,"font-weight");if(o===void 0)return[s_,s_];let i=o.trim().split(/\s+/).map(r=>Number(zn(ft.removeQuotes(r))));if(i.length<=2&&i.every(r=>Number.isFinite(r)))return[Math.min(...i),Math.max(...i)]}setFontWeightRange(n,o,i){let r=Ve(o==i?String(o):o+" "+i,{context:"value"}),s=n.block.children.filter(l=>l.property=="font-weight").tail;s?s.data.value=r:n.block.children.appendData({type:"Declaration",property:"font-weight",important:!1,value:r})}async processFontFaceRule(n,o,i,r,s){let l=[];for(let u=n.block.children.head;u;u=u.next)u.data.property=="src"&&l.push(u);l.pop(),l.forEach(u=>n.block.children.remove(u));let c=n.block.children.filter(u=>u.property=="src").tail;if(c){await Promise.all(o.map(async m=>{if(r.has(m.src))m.valid=r.get(m.src);else{if(Pf&&m.fontUrl){let p=new Pf("test-font",m.src);try{let g;await Promise.race([p.load().then(()=>p.loaded).then(()=>{m.valid=!0,globalThis.clearTimeout(g)}),new Promise(w=>g=globalThis.setTimeout(()=>{m.valid=!0,w()},g_))])}catch(g){if(g.name=="NetworkError")m.valid=!0;else{let w=Ng(c.data,b=>b.type=="Url"),f=Array.from(i).find(([b])=>w.includes(b)&&b.value==m.fontUrl);if(f&&f[1].length){let b=f[1][0];if(b){let y=new Pf("test-font","url("+b+")");try{let E;await Promise.race([y.load().then(()=>y.loaded).then(()=>{m.valid=!0,globalThis.clearTimeout(E)}),new Promise(k=>E=globalThis.setTimeout(()=>{m.valid=!0,k()},g_))])}catch{}}}else m.valid=!0}}}else m.valid=!0;r.set(m.src,m.valid)}}));let u=(m,p)=>ft.findLast(o,g=>!g.src.match(m_)&&!g.tech&&g.format==m&&(!p||g.valid)),d=m=>o.filter(p=>p==m||p.src.startsWith(p_)||p.tech&&p.valid);s.fonts.processed+=o.length,s.fonts.discarded+=o.length;let h=u("woff2-variations",!0)||u("woff2",!0)||u("woff",!0);if(h)o=d(h);else{let m=u("truetype-variations",!0)||u("truetype",!0);if(m)o=d(m);else{let p=u("opentype")||u("embedded-opentype");p?o=d(p):o=o.filter(g=>!g.src.match(m_)&&g.valid||g.src.startsWith(p_))}}if(s.fonts.discarded-=o.length,!o.length)return!1;o.reverse();try{c.data.value=Ve(o.map(m=>m.src).join(","),{context:"value",parseCustomProperty:!0})}catch{}}return!0}}}function qG(e){let t=ot(e,n=>n.type=="Layer");if(t)return t.name;let a=e.prelude;if(a&&a.children){for(let n=a.children.head;n;n=n.next)if(n.data.type=="Identifier"&&n.data.name.toLowerCase()==GG)return""}return null}function YG(e){let t=ot(e,a=>a.type=="Function"&&a.name.toLowerCase()==WG);if(t&&t.children&&t.children.head){let a=t.children.head.data,n=ge(a);return a.type=="Declaration"?"("+n+")":n}return null}function Ff(e,t,a){for(let n=e.head;n;n=n.next){let o=n.data;o.type=="Atrule"&&o.name=="import"&&o.prelude&&o.prelude.children&&o.prelude.children.head.data.importedChildren?Ff(o.prelude.children.head.data.importedChildren,t+"|import "+ge(o.prelude),a):o.type=="Atrule"&&FG.includes(o.name)&&o.block&&o.block.children?Ff(o.block.children,t+"|"+o.name+" "+(o.prelude?ge(o.prelude):""),a):o.type=="Atrule"&&o.name=="font-face"&&o.block&&o.block.children&&a.push({ruleData:o,cssRule:n,cssRules:e,scope:t})}}var Yu=globalThis.JSON,zf=globalThis.FontFace,KG=globalThis.Blob,XG="about:blank",w_="utf-8",ZG=/<script/gi,$G=/<noscript/gi,JG=/<canvas/gi,Uf=/^url\(["']?data:[^,]*,?["']?\)/,b_="local(",y_=5e3,k_=".js",QG=["rel","type","href","media"],Vs="crossorigin",e8="SOURCE",t8=["VIDEO","AUDIO"],S_="srcset",a8=["src","href","data","poster","background","xlink:href",S_],n8="[src], [href], [data], [poster], [background], [srcset], image, feImage",mt;function A_(e){mt=e;let t=Wu(mt,xt);return class extends t{async resolveStylesheets(n,o,i,r,s,l,c){n.tagName.toUpperCase()=="LINK"&&(n.removeAttribute("integrity"),n.removeAttribute(Vs),n.charset&&(s.charset=n.charset),o.url=n.href),await this.resolveStylesheetElement(n,o,i,r,s,l,c)}async resolveStylesheetElement(n,o,i,r,s,l,c){!s.blockStylesheets||s.keepPrintStyleSheets&&o.mediaText=="print"?(i.set({element:n},o),s.inlineStylesheetsRefs.has(n)||(n.tagName.toUpperCase()=="LINK"?await this.resolveLinkStylesheetURLs(o,n,n.href,r,s,l,c,i):(o.stylesheet=Ve(n.textContent,{context:"stylesheet",parseCustomProperty:!0}),await this.resolveImportURLs(o,r,s,l,c,i)))):n.tagName.toUpperCase()=="LINK"?n.href=mt.EMPTY_RESOURCE:n.textContent=""}replaceStylesheets(n,o,i,r){let s=Array.from(o).reverse(),l=new Map,c=new Map,u=new Set,d=new Set;Array.from(new Set(i.inlineStylesheetsRefs.values())).forEach(g=>{let{styleElement:w,content:f}=i.inlineStylesheets.get(g),b=s.find(([E])=>E.element==w),y=b?b[1].stylesheet:Ve(f,{context:"stylesheet",parseCustomProperty:!0});if(Bf(y))u.add(g);else{let E=n.createElement("link");E.setAttribute("rel","stylesheet"),E.setAttribute("type","text/css");let k="stylesheet_"+r.stylesheets.size+".css";E.setAttribute("href",k),d.add(r.stylesheets.size),r.stylesheets.set(r.stylesheets.size,{name:k,stylesheet:y}),l.set(g,E)}c.set(w,g)});for(let[g,w]of s)if(g.urlNode)if(Bf(w.stylesheet)&&!g.importDeclaresLayer)i8(g.importParent,g.importNode);else{let f="stylesheet_"+r.stylesheets.size+".css";!ca(w.url)&&i.saveOriginalURLs?(g.urlNode.type="Url",g.urlNode.value="-sf-url-original("+Yu.stringify(w.url)+") "+f):g.urlNode.value=f,r.stylesheets.set(r.stylesheets.size,{name:f,stylesheet:w.stylesheet,url:w.url,urlNode:g.urlNode})}else if(g.element.tagName.toUpperCase()=="LINK"){let f=g.element;if(Bf(w.stylesheet))f.remove();else{let b="stylesheet_"+r.stylesheets.size+".css";f.setAttribute("href",b),r.stylesheets.set(r.stylesheets.size,{name:b,stylesheet:w.stylesheet,url:w.url})}}else{let f=g.element,b=i.inlineStylesheetsRefs.has(f)?i.inlineStylesheetsRefs.get(f):c.get(f);if(b===void 0)f.textContent=this.generateStylesheetContent(w.stylesheet,i);else if(u.has(b))f.remove();else{let y=l.get(b).cloneNode(!0);Array.from(f.attributes).forEach(({name:E,value:k})=>{QG.includes(E.toLowerCase())||y.setAttribute(E,k)}),w.mediaText&&(y.media=w.mediaText),f.replaceWith(y),g.element=y}}let h=Array.from(r.stylesheets),m=new Map,p=new Map;h.filter(([g])=>!d.has(g)).concat(h.filter(([g])=>d.has(g))).forEach(([g,w])=>{if(w.stylesheet){let f=this.generateStylesheetContent(w.stylesheet,i);w.stylesheet=null;let b=p.get(f);b===void 0?(p.set(f,w.name),w.content=f):(m.set(w.name,b),w.urlNode&&Ku(w.urlNode,m),r.stylesheets.delete(g))}}),m.size&&n.querySelectorAll("link[href]").forEach(g=>{let w=g.getAttribute("href");m.has(w)&&g.setAttribute("href",m.get(w))})}async resolveImportURLs(n,o,i,r,s,l,c=new Set,u){let d=n.stylesheet,{scoped:h,scope:m}=n;this.resolveStylesheetURLs(d,o,r,u,i.stylesheetReferrers);let p=Vu(d);await Promise.all(p.map(async g=>{let w=ot(g,f=>f.type=="Url")||ot(g,f=>f.type=="String");if(w){let f=kt(w.value);if(!$t(f)&&$a(f)){w.value=mt.EMPTY_RESOURCE;try{f=mt.resolveURL(f,o)}catch{}if(la(f)&&!c.has(f)){let b=ot(g,z=>z.type=="MediaQueryList"),y,E,k;b&&(y=ge(b));let S=ot(g,z=>z.type=="Layer");S&&(E=S.name);let T=ot(g,z=>z.type=="Supports");T&&(k=ge(T));let v={scoped:h,scope:m,mediaText:y,layerName:E,supportsCondition:k},A=!!ot(g,z=>z.type=="Layer"||(z.type=="Identifier"||z.type=="Function")&&z.name.toLowerCase()=="layer");l.set({urlNode:w,importNode:g,importParent:d,importDeclaresLayer:A},v);let x=f,_=await this.getStylesheetContent(f,i,u);v.url=f=_.resourceURL,_.data=Zn(f,i)||_.data,v.stylesheet=Ve(_.data,{context:"stylesheet",parseCustomProperty:!0});let O=new Set(c);O.add(x),O.add(f),await this.resolveImportURLs(v,f,i,r,s,l,O,{stylesheetURL:f,stylesheetReferrerPolicy:_.referrerPolicy}),w.importedChildren=v.stylesheet.children,w.importedMediaText=y,w.importedLayerName=E,w.importedSupportsCondition=k}}}}))}async resolveLinkStylesheetURLs(n,o,i,r,s,l,c,u){if(i=kt(i),i&&i!=r&&i!=XG){let d=await mt.getContent(i,{maxResourceSize:s.maxResourceSize,maxResourceSizeEnabled:s.maxResourceSizeEnabled,charset:s.charset,frameId:s.frameId,resourceReferrer:s.resourceReferrer,referrerPolicy:ua(o),validateTextContentType:!0,baseURI:r,blockMixedContent:s.blockMixedContent,expectedType:"stylesheet",acceptHeaders:s.acceptHeaders,networkTimeout:s.networkTimeout,manifestEntries:s.manifestEntries});if(d.failed){let h=this.getLiveStylesheetContent(o,s);h&&(d.data=h)}Xn(d.data,d.charset)||Xn(d.data,s.charset)?(i=d.resourceURL,d.data=Zn(d.resourceURL,s)||d.data,n.stylesheet=Ve(d.data,{context:"stylesheet",parseCustomProperty:!0}),await this.resolveImportURLs(n,i,s,l,c,u,void 0,{stylesheetURL:i,stylesheetReferrerPolicy:d.referrerPolicy})):(s=Object.assign({},s,{charset:qi(d.data)}),await this.resolveLinkStylesheetURLs(n,o,i,r,s,l,c,u))}}async processFrame(n,o,i,r,s,l){let c="frames/"+r.frames.size+"/",u="allow-popups allow-top-navigation-by-user-activation allow-scripts";(o.content.match($G)||o.content.match(JG)||o.content.match(ZG)||i.saveRawPage)&&(u+=" allow-modals allow-popups allow-downloads allow-pointer-lock allow-presentation"),n.setAttribute("sandbox",u),n.tagName.toUpperCase()=="OBJECT"?n.setAttribute("data",c+"index.html"):n.setAttribute("src",c+"index.html"),r.frames.set(s,{name:c,content:o.content,resources:o.resources,url:l.url,title:o.title})}async processFont(n,o,i,r,s,l,c){let{content:u,extension:d,indexResource:h,contentType:m}=await c.addURL(n,{asBinary:!0,expectedType:"font",baseURI:r,blockMixedContent:s.blockMixedContent,...Yi(n,s)}),p=this.testEmptyResource(u)?mt.EMPTY_RESOURCE:"fonts/"+h+d;!ca(n)&&s.saveOriginalURLs?o.value="-sf-url-original("+Yu.stringify(i)+") "+p:o.value=p,this.testEmptyResource(u)||l.fonts.set(h,{name:p,content:u,extension:d,contentType:m,url:n})}async removeUnusedGlyphs(n,o,i){let r=new Map;this.getFontFacesGlyphRanges(n,i).forEach(({urlNodes:s,ranges:l})=>s.forEach(c=>{let u=r8(c.value);(!r.has(u)||r.get(u))&&r.set(u,l?(r.get(u)||[]).concat(l):null)})),await Promise.all(Array.from(o.values()).map(async s=>{let l=r.get(s.name);if(l&&s.content){let c=await Gu(s.content,l,{brotli:mt.brotli});c&&(s.content=c)}}))}groupDuplicateFonts(n,o){let i=new Map,r=[...o].filter(([,s])=>s.content).sort(([s],[l])=>s-l);r.forEach(([s,l],c)=>{let u=r.slice(0,c).find(([,d])=>v_(d.content,l.content));u&&(i.set(l.name,u[1].name),o.delete(s))}),i.size&&n.forEach(s=>{s.stylesheet&&Za(s.stylesheet).forEach(l=>Ku(l,i))})}groupDuplicateImages(n,o,i,r){let s=new Map,l=new Map;[...r].filter(([,c])=>c.content&&c.content.length).sort(([c],[u])=>c-u).forEach(([c,u])=>{let d=l.get(u.content.length)||[],h=d.find(m=>v_(m.content,u.content));h?(s.set(u.name,h.name),r.delete(c)):(d.push(u),l.set(u.content.length,d))}),s.size&&(o.forEach(c=>{c.stylesheet&&Za(c.stylesheet).forEach(u=>Ku(u,s))}),i.forEach(c=>Za(c).forEach(u=>Ku(u,s))),n.querySelectorAll(n8).forEach(c=>{a8.forEach(u=>{let d=c.getAttribute(u);if(d!==null){if(s.has(d))c.setAttribute(u,s.get(d));else if(u==S_){let h=mt.parseSrcset(d);h.some(m=>s.has(m.url))&&c.setAttribute(u,pn(h.map(m=>Object.assign({},m,{url:s.get(m.url)||m.url}))))}}})}))}async processStyle(n,o,i,r){let s=Za(n);await Promise.all(s.map(async l=>{let c=l.value;if(o.blockImages)l.value=mt.EMPTY_RESOURCE;else{let u=kt(c);if(!$t(u)&&la(u)||E_(u,o)){let{content:d,indexResource:h,contentType:m,extension:p}=await r.addURL(u,{asBinary:!0,expectedType:"image",...Yi(u,o)}),g=this.testEmptyResource(d)?mt.EMPTY_RESOURCE:"images/"+h+p;!ca(u)&&o.saveOriginalURLs?l.value="-sf-url-original("+Yu.stringify(c)+") "+g:l.value=g,this.testEmptyResource(d)||i.images.set(h,{name:g,content:d,extension:p,contentType:m,url:u})}}}))}async processAttribute(n,o,i,r,s,l,c,u,d){await Promise.all(Array.from(o).map(async h=>{let m=h.getAttribute(i);if(m!=null){m=kt(m);let p=h.dataset.singleFileOriginURL;s.saveOriginalURLs&&!ca(m)&&h.setAttribute("data-sf-original-"+i,m),delete h.dataset.singleFileOriginURL;let g=E_(m,s);if(!l||!s["block"+l.charAt(0).toUpperCase()+l.substring(1)+"s"]){if((!$t(m)||g)&&(this.setAttributeEmpty(h,i,l),$a(m))){if(!g)try{m=mt.resolveURL(m,r)}catch{}if(la(m)||g){let w=["OBJECT","EMBED"].includes(h.tagName.toUpperCase())?h.getAttribute("type"):"",{content:f,indexResource:b,extension:y,contentType:E,charset:k}=await d.addURL(m,{asBinary:!0,expectedType:l,contentType:w,referrerPolicy:ua(h)});if(p&&this.testEmptyResource(f)){try{p=mt.resolveURL(p,r)}catch{}try{m=p,f=(await mt.getContent(m,{asBinary:!0,expectedType:l,contentType:w,maxResourceSize:s.maxResourceSize,maxResourceSizeEnabled:s.maxResourceSizeEnabled,frameId:s.windowId,resourceReferrer:s.resourceReferrer,referrerPolicy:ua(h),acceptHeaders:s.acceptHeaders,networkTimeout:s.networkTimeout,manifestEntries:s.manifestEntries})).data}catch{}}if(s.imageReductionFactor>1&&l=="image"&&i!="background"){let S=await Gs(n,await Ki(new KG([f],{type:E}),k),s,h);f=(await mt.getContent(S,{asBinary:!0})).data}if(u&&this.testEmptyResource(f))h.remove();else if(!this.testEmptyResource(f)){let S="images/"+b+y;h.setAttribute(i,S),o8(h),c.images.set(b,{name:S,content:f,extension:y,contentType:E,url:m})}}}}else this.setAttributeEmpty(h,i,l)}}))}async processImageSrcset(n,o,i,r,s){let{content:l,indexResource:c,extension:u,contentType:d}=await r.addURL(n,{asBinary:!0,expectedType:"image",referrerPolicy:ua(s)}),h=this.testEmptyResource(l)?mt.EMPTY_RESOURCE:"images/"+c+u;return this.testEmptyResource(l)||i.images.set(c,{name:h,content:l,extension:u,contentType:d,url:n}),s.removeAttribute(Vs),pn([Object.assign({},o,{url:h})])}testEmptyResource(n){return!n}generateStylesheetContent(n,o){this.replacePseudoClassDefined(n);let i=ge(n);return o.saveOriginalURLs&&(i=qu(i)),i}getAdditionalPageData(n,o,i){let r={},s=o;i.stylesheets.forEach(d=>s+=d.content),Object.keys(i).forEach(d=>{Array.from(i[d]).filter(([,p])=>!s.includes(p.name)).forEach(([p])=>i[d].delete(p));let m=Array.from(i[d]);m.every(([p])=>typeof p=="number")&&m.sort(([p],[g])=>p-g),r[d]=m.map(([,p])=>p)});let l=n.head.querySelector("meta[name=viewport]"),c=l?l.content:null;return{doctype:mt.getDoctypeString(n),resources:r,viewport:c}}async processScript(n,o,i,r,s,l){let{content:c,indexResource:u,extension:d,contentType:h}=await s.addURL(o,{asBinary:!0,charset:r!=w_&&r,maxResourceSize:i.maxResourceSize,maxResourceSizeEnabled:i.maxResourceSizeEnabled,frameId:i.windowId,resourceReferrer:i.resourceReferrer,referrerPolicy:ua(n),baseURI:i.baseURI,blockMixedContent:i.blockMixedContent,expectedType:"script",acceptHeaders:i.acceptHeaders,networkTimeout:i.networkTimeout});c=Zn(o,i)||c;let m="scripts/"+u+k_;n.setAttribute("src",m),n.removeAttribute(Vs),l.scripts.set(u,{name:m,content:c,extension:d,contentType:h,url:o})}async processWorklet(n,o,i,r,s,l,c){let{content:u,indexResource:d,extension:h,contentType:m}=await l.addURL(o,{asBinary:!0,charset:s!=w_&&s,maxResourceSize:r.maxResourceSize,maxResourceSizeEnabled:r.maxResourceSizeEnabled,frameId:r.windowId,resourceReferrer:r.resourceReferrer,baseURI:r.baseURI,blockMixedContent:r.blockMixedContent,expectedType:"script",acceptHeaders:r.acceptHeaders,networkTimeout:r.networkTimeout}),p="scripts/"+d+k_;i?n.textContent+=`  CSS.paintWorklet.addModule("${p}", ${Yu.stringify(i)});
`:n.textContent+=`  CSS.paintWorklet.addModule("${p}");
`,c.worklets.set(d,{name:p,workletOptions:i,content:u,extension:h,contentType:m,url:o})}setMetaCSP(n){n.content="default-src 'none'; connect-src 'self' data: blob:; font-src 'self' data: blob:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' data: blob:; frame-src 'self' data: blob:; media-src 'self' data: blob:; script-src 'self' 'unsafe-inline' data: blob:; object-src 'self' data: blob:; form-action 'none'; base-uri 'none';"}removeUnusedStylesheets(){}async processFontFaceRule(n,o,i,r,s){await Promise.all(o.map(async p=>{if(r.has(p.src))p.valid=r.get(p.src);else{if(zf&&p.fontUrl){let g=[...i].find(([,w])=>p.fontUrl&&w.name==p.fontUrl);if(g){let w=g[1],f=new zf("test-font",new Uint8Array(w.content).buffer);try{let b;await Promise.race([f.load().then(()=>f.loaded).then(()=>{p.valid=!0,globalThis.clearTimeout(b)}),new Promise(y=>b=globalThis.setTimeout(()=>{p.valid=!0,y()},y_))])}catch(b){if(b.name=="NetworkError")p.valid=!0;else{let y=new zf("test-font","url("+w.url+")");try{let E;await Promise.race([y.load().then(()=>y.loaded).then(()=>{p.valid=!0,globalThis.clearTimeout(E)}),new Promise(k=>E=globalThis.setTimeout(()=>{p.valid=!0,k()},y_))])}catch{}}}}else p.valid=!0}else p.valid=!0;r.set(p.src,p.valid)}}));let l=(p,g)=>mt.findLast(o,w=>!w.src.match(Uf)&&!w.tech&&w.format==p&&(!g||w.valid)),c=(p,g)=>mt.findLast(o,w=>!w.src.match(Uf)&&!w.tech&&w.contentType==p&&(!g||w.valid)),u=p=>o.filter(g=>g==p||g.src.startsWith(b_)||g.tech&&g.valid);s.fonts.processed+=o.length,s.fonts.discarded+=o.length;let d=l("woff2-variations",!0)||l("woff2",!0)||l("woff",!0)||c("font/woff2",!0)||c("font/woff",!0)||c("application/font-woff",!0)||c("application/x-font-woff",!0);if(d)o=u(d);else{let p=l("truetype-variations",!0)||l("truetype",!0)||c("font/ttf",!0)||c("application/x-font-ttf",!0)||c("application/x-font-ttf",!0)||c("application/x-font-truetype",!0);if(p)o=u(p);else{let g=l("opentype")||l("embedded-opentype")||c("font/otf")||c("application/x-font-opentype")||c("application/font-sfnt");g?o=u(g):o=o.filter(w=>!w.src.match(Uf)&&w.valid||w.src.startsWith(b_))}}s.fonts.discarded-=o.length;let h=[];for(let p=n.block.children.head;p;p=p.next)p.data.property=="src"&&h.push(p);h.pop(),h.forEach(p=>n.block.children.remove(p));let m=n.block.children.filter(p=>p.property=="src").tail;if(m){if(!o.length)return!1;o.reverse();try{m.data.value=Ve(o.map(p=>p.src).join(","),{context:"value",parseCustomProperty:!0})}catch{}}return!0}}}function Bf(e){return!e||!e.children||!e.children.size}function o8(e){e.removeAttribute(Vs);let t=e.parentElement;e.tagName.toUpperCase()==e8&&t&&t8.includes(t.tagName.toUpperCase())&&t.removeAttribute(Vs)}function i8(e,t){let a,n;ra(e,{visit:"Atrule",enter(o,i,r){o===t&&(a=i,n=r)}}),a&&n.remove(a)}function E_(e,t){return!!(t.generatedDataURIs&&t.generatedDataURIs.has(e))}function v_(e,t){if(e.length!=t.length)return!1;for(let a=0;a<e.length;a++)if(e[a]!=t[a])return!1;return!0}function r8(e){let t=e.lastIndexOf(" ");return t==-1?e:e.substring(t+1)}function Ku(e,t){t.forEach((a,n)=>{e.value==n?e.value=a:e.value.endsWith(" "+n)&&(e.value=e.value.substring(0,e.value.length-n.length)+a)})}function T_(e,t){return e.compressContent?A_(t):f_(t)}var Zi=!1,Ji=globalThis.Set,tt=globalThis.Map,Qi=globalThis.JSON,I_=globalThis.URL,P;function j_(...e){return[P]=e,qf}var qf=class{constructor(t){this.options=t;let a=T_(t,P);this.processorHelper=new a}async run(){let t=globalThis[P.WAIT_FOR_USERSCRIPT_PROPERTY_NAME];this.options.userScriptEnabled&&t&&await t(P.ON_BEFORE_CAPTURE_EVENT_NAME,this.options),this.runner=new $u(this.options,this.processorHelper,!0),await this.runner.loadPage(),await this.runner.initialize(),this.options.userScriptEnabled&&t&&await t(P.ON_AFTER_CAPTURE_EVENT_NAME,this.options),await this.runner.run()}cancel(){this.cancelled=!0,this.runner&&this.runner.cancel()}getPageData(){return this.runner.getPageData()}},N_="page-loading",O_="page-loaded",D_="resource-initializing",M_="resources-initialized",P_="resource-loaded",F_="page-ended",z_="stage-started",U_="stage-ended",Ja=class{constructor(t,a){return{type:t,detail:a,PAGE_LOADING:N_,PAGE_LOADED:O_,RESOURCES_INITIALIZING:D_,RESOURCES_INITIALIZED:M_,RESOURCE_LOADED:P_,PAGE_ENDED:F_,STAGE_STARTED:z_,STAGE_ENDED:U_}}},s8=0,l8=1,c8=2,u8=3,d8=4,h8=5,Hf=[{sequential:[{action:"preProcessPage"},{option:"loadDeferredContentKeepZoomLevel",action:"resetZoomLevel"},{action:"replaceStyleContents"},{action:"replaceInvalidElements"},{action:"resetCharsetMeta"},{action:"resetReferrerMeta"},{option:"saveFavicon",action:"saveFavicon"},{action:"insertFonts"},{action:"insertShadowRootContents"},{action:"replaceCanvasElements"},{action:"setInputValues"},{option:"moveStylesInHead",action:"moveStylesInHead"},{option:"blockScripts",action:"removeEmbedScripts"},{option:"selected",action:"removeUnselectedElements"},{option:"blockVideos",action:"insertVideoPosters"},{option:"blockVideos",action:"insertVideoLinks"},{option:"removeFrames",action:"removeFrames"},{action:"removeDiscardedResources"},{option:"removeHiddenElements",action:"removeHiddenElements"},{action:"saveScrollPosition"},{action:"resolveHrefs"},{action:"resolveStyleAttributeURLs"}],parallel:[{option:"blockVideos",action:"insertMissingVideoPosters"},{action:"resolveStylesheetsURLs"},{option:"!removeFrames",action:"resolveFrameURLs"}]},{sequential:[{option:"removeUnusedStyles",action:"removeUnusedStyles"},{option:"removeAlternativeMedias",action:"removeAlternativeMedias"},{option:"removeUnusedFonts",action:"removeUnusedFonts"}],parallel:[{action:"processStylesheets"},{action:"processStyleAttributes"},{action:"processPageResources"},{action:"processScripts"},{action:"processWorklets"}]},{sequential:[{option:"removeAlternativeImages",action:"removeAlternativeImages"},{action:"groupDuplicateFonts"},{action:"groupDuplicateImages"}],parallel:[{option:"removeAlternativeFonts",action:"removeAlternativeFonts"},{option:"!removeFrames",action:"processFrames"}]},{sequential:[],parallel:[{option:"removeUnusedGlyphs",action:"removeUnusedGlyphs"}]},{sequential:[{action:"replaceStylesheets"},{action:"replaceStyleAttributes"},{action:"insertVariables"},{action:"removeEmptyMediaAutoplay"},{option:"compressHTML",action:"compressHTML"},{action:"cleanupPage"}],parallel:[{option:"readMaffMetadata",action:"readMAFFMetaData"},{action:"setDocInfo"}]},{sequential:[{action:"loadOptionsFromPage"},{option:"saveFilenameTemplateData",action:"saveFilenameTemplateData"}]}],$u=class{constructor(t,a,n){let o=n&&t.doc;this.root=n,this.options=t,this.options.url=this.options.url||o&&this.options.doc.documentURI;let i=this.options.url.match(/^.*\//);if(this.options.resourceReferrer=this.options.passReferrerOnError&&i&&i[0],this.options.baseURI=o&&(Zf(this.options.doc.baseURI)?this.options.doc.baseURI:this.options.url),this.options.rootDocument=n,this.options.updatedResources=this.options.updatedResources||{},this.options.fontTests=new tt,this.options.stylesheetReferrers=new tt,n&&!this.options.saveFilenameTemplateData&&(this.options.openEditor||/{digest-sha-\d/.test(this.options.filenameTemplate))&&(this.options.saveFilenameTemplateData=!0,this.options.omitReferrerInTemplateData=!/{url-referrer/.test(this.options.filenameTemplate)),this.batchRequest=new Yf,this.processor=new Kf(t,a,this.batchRequest),o){let r=P.preProcessDoc(this.options.doc,this.options.win,this.options);this.options.canvases=r.canvases,this.options.fonts=r.fonts,this.options.worklets=r.worklets,this.options.stylesheets=r.stylesheets,this.options.linkStylesheets=r.linkStylesheets,this.options.images=r.images,this.options.posters=r.posters,this.options.videos=r.videos,this.options.usedFonts=r.usedFonts,this.options.usedFontsCharacters=r.usedFontsCharacters,this.options.shadowRoots=r.shadowRoots,this.options.referrer=r.referrer,this.options.adoptedStyleSheets=r.adoptedStyleSheets,this.options.manifestData=r.manifestData,this.markedElements=r.markedElements,this.invalidElements=r.invalidElements}this.options.saveRawPage&&!this.options.removeFrames&&(this.options.frames=[]),this.options.content=this.options.content||(o?P.serialize(this.options.doc):null),o&&P.removeNestingMarkers(this.options.doc),this.onprogress=t.onprogress||(()=>{})}async loadPage(){await this.onprogress(new Ja(N_,{pageURL:this.options.url,frame:!this.root,options:this.options})),await this.processor.loadPage(this.options.content),await this.onprogress(new Ja(O_,{pageURL:this.options.url,frame:!this.root,options:this.options}))}async initialize(){await this.onprogress(new Ja(D_,{pageURL:this.options.url,options:this.options})),await this.executeStage(s8),this.pendingPromises=this.executeStage(l8),this.pendingPromises.catch(()=>{}),this.root&&this.options.doc&&P.postProcessDoc(this.options.doc,this.markedElements,this.invalidElements)}cancel(){this.cancelled=!0,this.batchRequest.cancel(),this.root&&this.options.frames&&this.options.frames.forEach(t);function t(a){a.runner&&a.runner.cancel()}}async run(){this.root&&(this.processor.initialize(this.batchRequest),await this.onprogress(new Ja(M_,{pageURL:this.options.url,max:this.processor.maxResources,options:this.options}))),await this.batchRequest.run(async t=>{t.pageURL=this.options.url,t.options=this.options,await this.onprogress(new Ja(P_,t))},this.options),await this.pendingPromises,this.options.doc=null,this.options.win=null,await this.executeStage(c8),await this.executeStage(u8),await this.executeStage(d8),await this.executeStage(h8),this.processor.finalize()}getDocument(){return this.processor.doc}getStyleSheets(){return this.processor.stylesheets}async getPageData(){return this.root&&await this.onprogress(new Ja(F_,{pageURL:this.options.url,options:this.options})),this.processor.getPageData()}async executeStage(t){Zi&&$i("**** STARTED STAGE",t,"****");let a=!this.root,n=this.onprogress(new Ja(z_,{pageURL:this.options.url,step:t,frame:a,options:this.options}));for(let i of Hf[t].sequential){let r;Zi&&(r=Date.now(),$i("  -- STARTED task =",i.action)),this.cancelled||this.executeTask(i),Zi&&$i("  -- ENDED   task =",i.action,"delay =",Date.now()-r)}let o;return Hf[t].parallel?o=await Promise.all(Hf[t].parallel.map(async i=>{let r;Zi&&(r=Date.now(),$i("  // STARTED task =",i.action)),this.cancelled||await this.executeTask(i),Zi&&$i("  // ENDED task =",i.action,"delay =",Date.now()-r)})):o=Promise.resolve(),await n,await this.onprogress(new Ja(U_,{pageURL:this.options.url,step:t,frame:a,options:this.options})),Zi&&$i("**** ENDED   STAGE",t,"****"),o}executeTask(t){if(!t.option||t.option.startsWith("!")&&!this.options[t.option]||this.options[t.option])return this.processor[t.action]()}},m8=6;function p8(e,t,a){let n;try{n=a>0&&new I_(t).host}catch{}if(!n)return Promise.resolve(()=>{});let o=e.get(n);o||(o={active:0,waiting:[]},e.set(n,o));let i=()=>{let r=o.waiting.shift();r?r(i):o.active--};return o.active<a?(o.active++,Promise.resolve(i)):new Promise(r=>o.waiting.push(r))}var Yf=class{constructor(){this.requests=new tt,this.duplicates=new tt}addURL(t,{asBinary:a,expectedType:n,groupDuplicates:o,baseURI:i,blockMixedContent:r,contentType:s,referrerPolicy:l,stylesheetURL:c,stylesheetReferrerPolicy:u}={}){return new Promise((d,h)=>{let m=Qi.stringify([t,a,n,i,r,s,l,c,u]),p=this.requests.get(m);if(this.cancelled)h();else if(this.running&&!p)h(new Error("Resource requested after the batch started: "+t));else{p||(p=[],this.requests.set(m,p));let g={resolve:d,reject:h};if(p.push(g),o){let w=this.duplicates.get(m);w||(w=[],this.duplicates.set(m,w)),w.push(g)}}})}getMaxResources(){return this.requests.size}run(t,a){this.running=!0;let n=[...this.requests.keys()],o=0,i=new tt,r=a.maxParallelRequestsPerHost===void 0?m8:a.maxParallelRequestsPerHost;return Promise.all(n.map(async s=>{let[l,c,u,d,h,m,p,g,w]=Qi.parse(s),f=this.requests.get(s);try{let b=o;o=o+1;let y=await p8(i,l,r),E;try{E=await P.getContent(l,{asBinary:c,inline:!a.compressContent,expectedType:u,contentType:m,maxResourceSize:a.maxResourceSize,maxResourceSizeEnabled:a.maxResourceSizeEnabled,frameId:a.windowId,resourceReferrer:a.resourceReferrer,referrerPolicy:p,stylesheetURL:g,stylesheetReferrerPolicy:w,baseURI:d,blockMixedContent:h,acceptHeaders:a.acceptHeaders,networkTimeout:a.networkTimeout,manifestEntries:a.manifestEntries})}finally{y()}if(E.manifestEntry&&(E.manifestEntry.references=f.length),!this.cancelled){let k=P.getContentTypeExtension(E.contentType)||P.getFilenameExtension(l,a.filenameReplacedCharacters,a.filenameReplacementCharacter,a.filenameReplacementCharacters);f.forEach(S=>{let T=this.duplicates.get(s),v=T&&T.length>1&&T.includes(S);S.resolve({content:E.data,indexResource:b,duplicate:v,contentType:E.contentType,extension:k})})}}catch(b){f.forEach(y=>y.reject(b))}this.requests.delete(s),await t({url:l})}))}cancel(){this.cancelled=!0,[...this.requests.keys()].forEach(a=>{this.requests.get(a).forEach(o=>o.reject()),this.requests.delete(a)})}},Gf="shadowrootmode",g8="shadowrootdelegatesfocus",f8="shadowrootclonable",w8="shadowrootserializable",qs="single-file-slot-",b8=qs+"unassigned",B_="-",Xu="data-single-file-options",y8="javascript:",k8="javascript:void(0)",E8=["href","src","action","formaction","data"],v8="http://www.w3.org/2000/svg",S8="utf-8",A8="SingleFile: canvas elements tainted by a cross-origin resource, dropped from the page:",C_="data:,",T8=/@(layer|import)\b/i,C8="0",R_=".",R8=["rootDocument","saveFilenameTemplateData","omitReferrerInTemplateData","manifest"],_8=["customStylesheet","filenameTemplate"],Kf=class{constructor(t,a,n){this.options=t,this.processorHelper=a,this.stats=new $f(t),this.baseURI=__(t.baseURI||t.url),this.batchRequest=n,this.stylesheets=new tt,this.styles=new tt,this.resources={cssVariables:new tt,fonts:new tt,worklets:new tt,stylesheets:new tt,scripts:new tt,images:new tt,frames:new tt},this.fontTests=t.fontTests,this.frameManifests=[],this.startDate=new Date,t.generatedDataURIs=new Ji,t.manifestEntries=t.manifest?[]:void 0}registerGeneratedDataURI(t){return this.options.generatedDataURIs.add(t),t}initialize(){this.options.saveDate=new Date,this.options.saveUrl=this.options.url,this.options.readMaffMetadata&&(this.maffMetaDataPromise=this.batchRequest.addURL(P.resolveURL("index.rdf",this.options.baseURI||this.options.url),{expectedType:"document"})),this.maxResources=this.batchRequest.getMaxResources(),!this.options.removeFrames&&this.options.frames&&this.options.frames.forEach(t=>this.maxResources+=t.runner?t.runner.batchRequest.getMaxResources():0),this.stats.set("processed","resources",this.maxResources)}async loadPage(t,a){let n;if((!t||this.options.saveRawPage)&&(n=await P.getContent(this.baseURI,{inline:!this.options.compressContent,maxResourceSize:this.options.maxResourceSize,maxResourceSizeEnabled:this.options.maxResourceSizeEnabled&&!this.options.rootDocument,charset:a,frameId:this.options.windowId,resourceReferrer:this.options.resourceReferrer,expectedType:"document",acceptHeaders:this.options.acceptHeaders,networkTimeout:this.options.networkTimeout,manifestEntries:this.options.manifestEntries}),t=n.data||""),this.doc=P.parseDocContent(t,this.baseURI),P.fixInvalidNesting(this.doc,!0,{recreateOnly:!0}),x_(this.doc),P.fixInvalidNesting(this.doc,!0,{mergeCopies:!0}),this.options.saveRawPage){let o;if(this.doc.querySelectorAll("meta[charset]").forEach(i=>{o||(o=i.getAttribute("charset").trim().toLowerCase())}),o||this.doc.querySelectorAll('meta[http-equiv="content-type"]').forEach(i=>{let r=i.content.split(";")[1];r&&!o&&(o=r.split("=")[1].trim().toLowerCase())}),o&&n.charset&&o!=n.charset.toLowerCase())return this.loadPage(t,o)}await this.processorHelper.resizeCanvasImages(this.doc,this.options.canvases,this.options),this.workStyleElement=this.doc.createElement("style"),this.doc.body.appendChild(this.workStyleElement),this.onEventAttributeNames=new Ji(D8(this.doc))}finalize(){this.workStyleElement.parentNode&&this.workStyleElement.remove()}async getPageData(){let t;P.postProcessDoc(this.doc);let a=P.parseURL(this.baseURI);if(this.options.insertSingleFileComment){let g=this.doc.documentElement.firstChild,w=this.options.saveUrl,f=this.options.saveDate;if(g.nodeType==8&&(g.textContent.includes(P.COMMENT_HEADER_LEGACY)||g.textContent.includes(P.COMMENT_HEADER))){let E=this.doc.documentElement.firstChild.textContent.split(`
`);try{let[,,k,S]=E;w=k.split("url: ")[1].trim(),f=S.split("saved date: ")[1],g.remove()}catch{}}let b=(this.options.infobarContent||"").replace(/\\n/g,`
`).replace(/\\t/g,"	");t=`
 `+(this.options.useLegacyCommentHeader?P.COMMENT_HEADER_LEGACY:P.COMMENT_HEADER)+` 
 url: `+w+(this.options.removeSavedDate?" ":` 
 saved date: `+f)+(b?` 
 info: `+b:"")+`
`,t=t.replace(/--(!?)>/g,"--$1 >");let y=this.doc.createComment(t);this.doc.documentElement.insertBefore(y,this.doc.documentElement.firstChild)}let n=this.doc.querySelector("singlefile-infobar");n&&n.remove();let o=this.doc.querySelector(P.INFOBAR_TAGNAME);if(o&&o.remove(),this.options.includeInfobar&&P.appendInfobar(this.doc,this.options),this.options.insertCanonicalLink&&this.options.saveUrl.match(G_)){let g=this.doc.querySelector("link[rel=canonical]");g||(g=this.doc.createElement("link"),g.setAttribute("rel","canonical"),this.doc.head.appendChild(g)),g&&!g.href&&(g.href=this.options.saveUrl)}if(this.options.insertMetaCSP){let g=this.doc.createElement("meta");g.httpEquiv="content-security-policy",this.processorHelper.setMetaCSP(g),this.doc.head.appendChild(g)}if(this.options.insertMetaNoIndex){let g=this.doc.querySelector("meta[name=robots][content*=noindex]");g||(g=this.doc.createElement("meta"),g.setAttribute("name","robots"),g.setAttribute("content","noindex"),this.doc.head.appendChild(g))}let i=this.doc.createElement("style");this.doc.querySelector('img[src="data:,"],source[src="data:,"]')&&(i.textContent='img[src="data:,"],source[src="data:,"]{display:none!important}',this.doc.head.appendChild(i));let r;this.options.displayStats&&(r=P.getContentSize(this.doc.documentElement.outerHTML));let l=M8(this.doc)||this.doc.querySelector(`[${P.NESTING_TRACK_ID_ATTRIBUTE_NAME}]`);if(l){let g=this.doc.createElement("script");g.textContent=`(${P.getFixInvalidNestingSource()})(document, "${P.NESTING_TRACK_ID_ATTRIBUTE_NAME}");`,this.doc.body.appendChild(g)}let c=P.serialize(this.doc,this.options.compressHTML);if(l){let g=z8(this.doc,c);g.size&&(c=P.serialize(this.doc,this.options.compressHTML,g))}if(this.options.displayStats){let g=P.getContentSize(c);this.stats.set("processed","HTML bytes",g),this.stats.add("discarded","HTML bytes",r-g)}let u=await P.formatFilename(c,this.doc,this.options),d=P.getMimeType(this.options),h=this.baseURI.match(/([^/]*)\/?(\.html?.*)$/)||this.baseURI.match(/\/\/([^/]*)\/?$/),m=this.processorHelper.getAdditionalPageData(this.doc,c,this.resources),p=Object.assign({stats:this.stats.data,title:this.options.title||(this.baseURI&&h?h[1]:a.hostname?a.hostname:""),filename:u,mimeType:d,content:c,comment:t},m);return this.options.addProof&&(p.hash=await P.digest("SHA-256",c)),this.options.manifest&&(p.manifest=this.getManifest()),this.options.retrieveLinks&&(p.links=Array.from(new Ji(Array.from(this.doc.links).map(g=>g.href)))),p}getManifest(){let t=this.options.windowId||C8,a=this.options.manifestData||{},n={id:t,parent:t.includes(R_)?t.substring(0,t.lastIndexOf(R_)):null,url:this.baseURI};a.lastModified&&(n.lastModified=a.lastModified),a.navigation&&(n.navigation=a.navigation),n.resources=this.options.manifestEntries.map(r=>{let s=a.timings&&(a.timings[r.finalUrl]||a.timings[r.url]);return s?Object.assign({},r,{timing:s}):r});let o=[n,...this.frameManifests];if(!this.options.rootDocument)return{frames:o};let i={subject:{url:this.options.saveUrl,finalUrl:a.url||this.baseURI,title:this.doc.title},time:{captureStarted:this.startDate.toISOString(),captureEnded:new Date().toISOString()}};return a.timeOrigin&&(i.time.loaded=a.timeOrigin),a.environment&&(i.environment=a.environment),i.options=F8(this.options),i.frames=o,i}preProcessPage(){this.doc.querySelectorAll("style["+P.CUSTOM_STYLESHEET_ATTRIBUTE_NAME+"]").forEach(t=>t.removeAttribute(P.CUSTOM_STYLESHEET_ATTRIBUTE_NAME)),this.doc.body.querySelectorAll(':not(svg) title, meta, link[href][rel*="icon"]').forEach(t=>{(this.options.win&&t instanceof this.options.win.HTMLElement||t instanceof globalThis.HTMLElement)&&this.doc.head.appendChild(t)}),this.options.images&&!this.options.saveRawPage&&(this.doc.querySelectorAll("img["+P.IMAGE_ATTRIBUTE_NAME+"]").forEach(t=>{let a=t.getAttribute(P.IMAGE_ATTRIBUTE_NAME);if(a){let n=this.options.images[Number(a)];n&&(this.options.removeHiddenElements&&(n.size&&!n.size.pxWidth&&!n.size.pxHeight||t.getAttribute(P.HIDDEN_CONTENT_ATTRIBUTE_NAME)=="")?t.setAttribute("src",P.EMPTY_RESOURCE):(n.currentSrc&&(t.dataset.singleFileOriginURL=t.getAttribute("src"),t.setAttribute("src",n.currentSrc),n.sourceSize&&this.options.removeAlternativeImages&&["width","height"].forEach(o=>{n.sourceSize[o]!=null&&t.setAttribute(o,n.sourceSize[o])})),this.options.loadDeferredContent&&(!t.getAttribute("src")||t.getAttribute("src")==P.EMPTY_RESOURCE)&&t.getAttribute("data-src")&&(n.src=t.dataset.src,t.setAttribute("src",t.dataset.src),t.removeAttribute("data-src"))))}}),this.options.loadDeferredContent&&this.doc.querySelectorAll("img[data-srcset]").forEach(t=>{!t.getAttribute("srcset")&&t.getAttribute("data-srcset")&&(t.setAttribute("srcset",t.dataset.srcset),t.removeAttribute("data-srcset"))}))}loadOptionsFromPage(){let t=this.doc.body.querySelector('script[type="application/json"]['+Xu+"]");if(t){let a=Qi.parse(t.textContent);Object.keys(a).forEach(n=>this.options[n]=a[n]),this.options.saveDate=new Date(this.options.saveDate),this.options.visitDate=new Date(this.options.visitDate)}}saveFilenameTemplateData(){if(!this.doc.querySelector("script["+Xu+'][type="application/json"]')){let a=this.doc.createElement("script");a.type="application/json",a.setAttribute(Xu,""),a.textContent=Qi.stringify({saveUrl:this.options.saveUrl,saveDate:this.options.saveDate.getTime(),visitDate:(this.options.visitDate||this.options.saveDate).getTime(),filenameTemplate:this.options.filenameTemplate,filenameReplacedCharacters:this.options.filenameReplacedCharacters,filenameReplacementCharacter:this.options.filenameReplacementCharacter,filenameReplacementCharacters:this.options.filenameReplacementCharacters,filenameMaxLengthUnit:this.options.filenameMaxLengthUnit,filenameMaxLength:this.options.filenameMaxLength,replaceEmojisInFilename:this.options.replaceEmojisInFilename,compressContent:this.options.compressContent,selfExtractingArchive:this.options.selfExtractingArchive,disableCompression:this.options.disableCompression,extractDataFromPage:this.options.extractDataFromPage,referrer:this.options.omitReferrerInTemplateData?void 0:this.options.referrer,title:this.options.title,info:this.options.info}),this.doc.body.firstChild?this.doc.body.insertBefore(a,this.doc.body.firstChild):this.doc.body.appendChild(a)}}replaceStyleContents(){if(this.options.stylesheets&&this.doc.querySelectorAll("style").forEach((t,a)=>{if(t.getAttribute(P.STYLESHEET_ATTRIBUTE_NAME)){let o=this.options.stylesheets[Number(a)];o&&(t.textContent=o)}}),this.options.adoptedStyleSheets&&this.options.adoptedStyleSheets.length){let t=this.doc.createElement("style");t.textContent=this.options.adoptedStyleSheets.join(`
`),this.doc.body.appendChild(t)}}removeUnselectedElements(){t(this.doc.body),this.doc.body.removeAttribute(P.SELECTED_CONTENT_ATTRIBUTE_NAME);function t(i){let r=!1;Array.from(i.childNodes).forEach(s=>{if(s.nodeType==1){let l=s.getAttribute(P.SELECTED_CONTENT_ATTRIBUTE_NAME)=="";r=r||l,l?(s.removeAttribute(P.SELECTED_CONTENT_ATTRIBUTE_NAME),t(s)):r?a(s):n(s)}})}function a(i){(i.nodeType!=1||!i.querySelector("svg,style,link"))&&o(i)?i.remove():n(i)}function n(i){o(i)&&(i.style.setProperty("display","none","important"),i.removeAttribute("src"),i.removeAttribute("srcset"),i.removeAttribute("srcdoc"),Array.from(i.childNodes).forEach(a))}function o(i){if(i.nodeType==1){let r=i.tagName&&i.tagName.toUpperCase();return r!="SVG"&&r!="STYLE"&&r!="LINK"}}}insertVideoPosters(){this.options.posters&&this.doc.querySelectorAll("video, video > source").forEach(t=>{let a;t.tagName.toUpperCase()=="VIDEO"?a=t:a=t.parentElement;let n=t.getAttribute(P.POSTER_ATTRIBUTE_NAME);if(n){let o=this.options.posters[Number(n)];!a.getAttribute("poster")&&o&&o!=C_&&a.setAttribute("poster",this.registerGeneratedDataURI(o))}})}insertVideoLinks(){let t="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAgMAAADXB5lNAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHAB8H+DhhoQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAJUExURQAAAICHi4qKioTuJAkAAAABdFJOUwBA5thmAAAAAWJLR0QCZgt8ZAAAAJJJREFUOI3t070NRCEMA2CnYAOyDyPwpHj/Va7hJ3FzV7zy3ET5JIwoAF6Jk4wzAJAkzxAYG9YRTgB+24wBgKmfrGAKTcEfAY4KRlRoIeBTgKOCERVaCPgU4Khge2GqKOBTgKOCERVaAEC/4PNcnyoSWHpjqkhwKxbcig0Q6AorXYF/+A6eIYD1lVbwG/jdA6/kA2THRAURVubcAAAAAElFTkSuQmCC",a="16px";this.doc.querySelectorAll("video").forEach(n=>{let o=n.getAttribute(P.VIDEO_ATTRIBUTE_NAME);if(o){let i=this.options.videos[Number(o)],r=i&&i.src||n.src;if(r){let s=this.doc.createElement("a"),l=this.doc.createElement("img"),c=i&&i.linkOffset||{top:0,left:0};s.href=r,s.target="_blank",s.style.setProperty("z-index",2147483647,"important"),s.style.setProperty("position","absolute","important"),s.style.setProperty("margin",c.top+8+"px 0 0 "+(c.left+8)+"px","important"),i&&i.blockLevel&&s.style.setProperty("display","block","important"),s.style.setProperty("width",a,"important"),s.style.setProperty("height",a,"important"),s.style.setProperty("min-width",a,"important"),s.style.setProperty("min-height",a,"important"),s.style.setProperty("max-width",a,"important"),s.style.setProperty("max-height",a,"important"),l.src=this.registerGeneratedDataURI(t),l.style.setProperty("width",a,"important"),l.style.setProperty("height",a,"important"),l.style.setProperty("min-width",a,"important"),l.style.setProperty("min-height",a,"important"),l.style.setProperty("max-width",a,"important"),l.style.setProperty("max-height",a,"important"),s.appendChild(l),n.insertAdjacentElement("beforebegin",s)}}})}removeEmptyMediaAutoplay(){this.doc.querySelectorAll("video[autoplay], audio[autoplay]").forEach(a=>{let n=Array.from(a.querySelectorAll("source"));!t(a)&&!n.some(t)&&a.removeAttribute("autoplay")});function t(a){let n=a.getAttribute("src");return!!n&&n!=P.EMPTY_RESOURCE}}removeFrames(){let t=this.doc.querySelectorAll('iframe, frame, object[type="text/html"][data]');this.stats.set("discarded","frames",t.length),this.stats.set("processed","frames",t.length),this.doc.querySelectorAll('iframe, frame, object[type="text/html"][data]').forEach(a=>a.remove())}removeEmbedScripts(){this.doc.querySelectorAll("*").forEach(a=>{Array.from(a.attributes).forEach(n=>{let o=n.localName||n.name,i=o.toLowerCase();this.onEventAttributeNames.has(i)?a.removeAttributeNS(n.namespaceURI,o):E8.includes(i)&&O8(n.value)&&a.setAttributeNS(n.namespaceURI,n.name,k8)})});let t=this.doc.querySelectorAll('script:not([type="application/ld+json"]):not(['+Xu+"])");this.stats.set("discarded","scripts",t.length),this.stats.set("processed","scripts",t.length),t.forEach(a=>Zu(a))}removeDiscardedResources(){if(this.doc.querySelectorAll("."+P.SINGLE_FILE_UI_ELEMENT_CLASS).forEach(n=>n.remove()),this.options.removeNoScriptTags===!1){let n=new tt;this.doc.querySelectorAll("noscript").forEach(o=>{let i=this.doc.createElement("div");i.innerHTML=o.dataset[P.NO_SCRIPT_PROPERTY_NAME],o.replaceWith(i),n.set(i,o)}),n.forEach((o,i)=>{o.dataset[P.NO_SCRIPT_PROPERTY_NAME]=i.innerHTML,i.replaceWith(o)})}else this.doc.querySelectorAll("noscript").forEach(n=>Zu(n));this.doc.querySelectorAll("meta[http-equiv=refresh], meta[disabled-http-equiv]").forEach(n=>n.remove()),this.doc.querySelectorAll('meta[http-equiv="content-security-policy"]').forEach(n=>n.remove());let t=this.doc.querySelectorAll('applet, object[data]:not([type="image/svg+xml"]):not([type="image/svg-xml"]):not([type="text/html"]):not([data*=".svg"]):not([data*=".pdf"]), embed[src]:not([src*=".svg"]):not([src*=".pdf"])');if(this.stats.set("discarded","objects",t.length),this.stats.set("processed","objects",t.length),t.forEach(n=>n.remove()),this.doc.querySelectorAll("link[rel~=preconnect], link[rel~=prerender], link[rel~=dns-prefetch], link[rel~=preload], link[rel~=manifest], link[rel~=prefetch], link[rel~=modulepreload]").forEach(n=>{let o=n.getAttribute("rel").replace(/(preconnect|prerender|dns-prefetch|preload|prefetch|manifest|modulepreload)/g,"").trim();o.length?n.setAttribute("rel",o):Zu(n)}),this.processorHelper.removeUnusedStylesheets(this.doc),this.doc.querySelectorAll('link[rel*=stylesheet]:not([href]),link[rel*=stylesheet][href=""]').forEach(n=>n.remove()),this.options.removeHiddenElements&&this.doc.querySelectorAll("input[type=hidden]").forEach(n=>Zu(n)),this.options.removedElementsSelector)try{this.doc.querySelectorAll(this.options.removedElementsSelector).forEach(n=>n.remove())}catch{}this.options.saveFavicon||this.doc.querySelectorAll('link[rel*="icon"]').forEach(n=>n.remove()),this.doc.querySelectorAll("a[ping], area[ping]").forEach(n=>n.removeAttribute("ping")),this.doc.querySelectorAll("a[attributionsrc], img[attributionsrc], script[attributionsrc]").forEach(n=>n.removeAttribute("attributionsrc")),this.doc.querySelectorAll("link[rel=import][href]").forEach(n=>n.remove()),this.doc.querySelectorAll("link[rel=compression-dictionary]").forEach(n=>n.remove())}replaceInvalidElements(){this.doc.querySelectorAll("template["+P.INVALID_ELEMENT_ATTRIBUTE_NAME+"]").forEach(t=>{let a=this.doc.createElement("span");if(t.content){let n=t.content.firstChild;n&&(n.hasAttributes()&&Array.from(n.attributes).forEach(o=>{try{a.setAttribute(o.name,o.value)}catch{}}),n.childNodes.forEach(o=>a.appendChild(o.cloneNode(!0))));try{t.replaceWith(a)}catch{n?t.replaceWith(n):t.remove()}}})}resetCharsetMeta(){let t;this.doc.querySelectorAll('meta[charset], meta[http-equiv="content-type"]').forEach(n=>{let o=n.content.split(";")[1];o&&!t&&(t=o.split("=")[1],t&&(this.charset=t.trim().toLowerCase())),n.remove()});let a=this.doc.createElement("meta");a.setAttribute("charset",S8),this.doc.head.firstChild?this.doc.head.insertBefore(a,this.doc.head.firstChild):this.doc.head.appendChild(a)}resetReferrerMeta(){let t=this.doc.createElement("meta");t.setAttribute("name","referrer"),t.setAttribute("content","no-referrer");let a=Array.from(this.doc.querySelectorAll("meta[name=referrer]")),n=a.find(o=>o.parentElement==this.doc.head);n?n.replaceWith(t):this.doc.head.appendChild(t),a.forEach(o=>o.remove())}setInputValues(){this.options.saveRawPage||(this.doc.querySelectorAll("input, textarea").forEach(t=>{let a=t.getAttribute(P.INPUT_VALUE_ATTRIBUTE_NAME);a!=null?t.tagName.toUpperCase()=="TEXTAREA"?t.textContent=a:t.setAttribute("value",a):t.removeAttribute("value")}),this.doc.querySelectorAll("input[type=radio], input[type=checkbox]").forEach(t=>{t.getAttribute(P.INPUT_CHECKED_ATTRIBUTE_NAME)=="true"?t.setAttribute("checked",""):t.removeAttribute("checked")}),this.doc.querySelectorAll("select").forEach(t=>{t.querySelectorAll("option").forEach(a=>{a.getAttribute(P.INPUT_VALUE_ATTRIBUTE_NAME)!=null?a.setAttribute("selected",""):a.removeAttribute("selected")})}))}moveStylesInHead(){this.doc.querySelectorAll("style").forEach(t=>{t.getAttribute(P.STYLE_ATTRIBUTE_NAME)==""&&(W_(t)&&t.before(V_(t)),this.doc.head.appendChild(t))})}saveFavicon(){let t=this.doc.querySelector('link[href][rel="shortcut icon"]');t||(t=this.doc.querySelector('link[href][rel="icon"]')),t||(t=this.doc.createElement("link"),t.setAttribute("type","image/x-icon"),t.setAttribute("rel","shortcut icon"),t.setAttribute("href","/favicon.ico")),this.doc.head.appendChild(t)}saveScrollPosition(){if(this.options.scrollPosition&&this.options.scrolling=="no"&&(this.options.scrollPosition.x||this.options.scrollPosition.y)){let t=this.doc.createElement("script");t.textContent='document.currentScript.remove();addEventListener("load",()=>scrollTo('+this.options.scrollPosition.x+","+this.options.scrollPosition.y+"))",this.doc.body.appendChild(t)}}replaceCanvasElements(){if(this.options.canvases){let t=0;this.doc.querySelectorAll("canvas").forEach(a=>{let n=a.getAttribute(P.CANVAS_ATTRIBUTE_NAME);if(n){let o=this.options.canvases[Number(n)];if(o)if(o.dataURI){let i={};o.backgroundColor&&(i["background-color"]=o.backgroundColor),this.processorHelper.setBackgroundImage(a,"url("+this.registerGeneratedDataURI(o.dataURI)+")",i),this.stats.add("processed","canvas",1)}else o.blank||(t++,this.stats.add("discarded","canvas",1))}}),t&&B8(A8,t)}}insertFonts(){if(this.options.fonts&&this.options.fonts.length){let t=this.doc.querySelector("style, link[rel=stylesheet]"),a;this.options.fonts.forEach(n=>{if(n["font-family"]&&n.src){let o="@font-face{",i="";Object.keys(n).forEach(s=>{i&&(i+=";"),i+=s+":"+n[s]}),o+=i+"}";let r=this.doc.createElement("style");r.textContent=o,a?a.insertAdjacentElement("afterend",r):t?t.parentElement.insertBefore(r,t):this.doc.head.appendChild(r),a=r}})}}removeHiddenElements(){let t=this.doc.querySelectorAll("["+P.HIDDEN_CONTENT_ATTRIBUTE_NAME+"]"),a=this.doc.querySelectorAll("["+P.REMOVED_CONTENT_ATTRIBUTE_NAME+"]");if(this.stats.set("discarded","hidden elements",a.length),this.stats.set("processed","hidden elements",a.length),t.length){let n="sf-hidden",o="."+n+"{display:none!important}",i=!1;if(this.doc.querySelectorAll("style").forEach(r=>{r.textContent==o&&(i=!0)}),!i){let r=this.doc.createElement("style");r.textContent=o,this.doc.head.appendChild(r)}t.forEach(r=>{r.style.getPropertyValue("display")!="none"&&(r.style.getPropertyPriority("display")=="important"?r.style.setProperty("display","none","important"):r.classList.contains(n)||r.classList.add(n))})}a.forEach(n=>n.remove())}resolveHrefs(){(this.options.resolveLinks===void 0||this.options.resolveLinks)&&this.doc.querySelectorAll("a[href], area[href]").forEach(t=>{let a=t.getAttribute("href").trim();if(!Vf(a)){let n;try{n=P.resolveURL(a,this.options.baseURI||this.options.url)}catch{}if(n){let o=__(this.options.url);n.startsWith(o+"#")&&!n.startsWith(o+"#!")&&!this.options.resolveFragmentIdentifierURLs&&(n=n.substring(o.length));try{t.setAttribute("href",n)}catch{}}}}),this.doc.querySelectorAll("link[href]").forEach(t=>{let a=t.getAttribute("href").trim();if(t.rel.includes("stylesheet")&&this.options.saveOriginalURLs&&!Wf(a)&&t.setAttribute("data-sf-original-href",a),!Vf(a)){let n;try{n=P.resolveURL(a,this.options.baseURI||this.options.url)}catch{}if(n)try{t.setAttribute("href",n)}catch{}}})}async insertMissingVideoPosters(){await Promise.all(Array.from(this.doc.querySelectorAll("video[src], video > source[src]")).map(async t=>{let a;if(t.tagName.toUpperCase()=="VIDEO"?a=t:a=t.parentElement,!a.poster||a.poster==C_){let n=a.getAttribute(P.VIDEO_ATTRIBUTE_NAME);if(n){let o=this.options.videos[Number(n)],i=o&&o.size&&(o.src||a.src);if(i){let r="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='"+(o.size.videoWidth||o.size.pxWidth)+"' height='"+(o.size.videoHeight||o.size.pxHeight)+"'%3E%3C/svg%3E",s=this.options.doc||this.options.win&&this.options.win.document;if(!s){a.poster=this.registerGeneratedDataURI(r);return}let l=this.doc.createElement("video");l.src=i,l.style.setProperty("width",o.size.pxWidth+"px","important"),l.style.setProperty("height",o.size.pxHeight+"px","important"),l.style.setProperty("display","none","important"),l.crossOrigin="anonymous";let c=this.doc.createElement("canvas"),u=c.getContext("2d");return s.body.appendChild(l),new Promise(d=>{l.currentTime=o.currentTime,l.oncanplay=()=>{c.width=l.videoWidth||o.size.videoWidth,c.height=l.videoHeight||o.size.videoHeight,u.drawImage(l,0,0,c.width,c.height);try{a.poster=this.registerGeneratedDataURI(P.getPosterDataURI(c)||r)}catch{a.poster=this.registerGeneratedDataURI(r)}l.remove(),d()},l.onerror=()=>{a.poster=this.registerGeneratedDataURI(r),l.remove(),d()}})}}}}))}resolveStyleAttributeURLs(){this.doc.querySelectorAll("[style]").forEach(t=>{if(this.options.blockStylesheets)t.removeAttribute("style");else{let a=t.getAttribute("style"),n=xt.parse(a,{context:"declarationList",parseCustomProperty:!0});this.processorHelper.resolveStylesheetURLs(n,this.baseURI,this.workStyleElement),this.styles.set(t,n)}})}async resolveStylesheetsURLs(){let t=new tt;this.options.inlineStylesheets=new tt,this.options.inlineStylesheetsRefs=new tt,this.doc.querySelectorAll("style").forEach(n=>{let o=n.textContent;o&&(t.has(o)||t.set(o,[]),t.get(o).push(n))});let a=0;if(t.forEach((n,o)=>{let i=T8.test(o)?0:n.length-1;this.options.inlineStylesheets.set(a,{styleElement:n[i],content:o}),n.forEach((r,s)=>{s!=i&&this.options.inlineStylesheetsRefs.set(r,a)}),a++}),await Promise.all(Array.from(this.doc.querySelectorAll("style, link[rel*=stylesheet]:not([disabled])")).map(async n=>{let o=Object.assign({},this.options,{charset:this.charset}),i;n.media&&(i=n.media.toLowerCase());let r=n.closest("["+Gf+"]"),s={mediaText:i,scoped:!!r,scope:r};await this.processorHelper.resolveStylesheets(n,s,this.stylesheets,this.baseURI,o,this.workStyleElement,this.resources)})),this.options.rootDocument){let n=Object.keys(this.options.updatedResources).filter(o=>this.options.updatedResources[o].type=="stylesheet"&&!this.options.updatedResources[o].retrieved).map(o=>this.options.updatedResources[o]);await Promise.all(n.map(async o=>{if(o.retrieved=!0,!this.options.blockStylesheets){let i={},r=this.doc.createElement("style");this.doc.body.appendChild(r),r.textContent=o.content,await this.processorHelper.resolveStylesheetElement(r,i,this.stylesheets,this.baseURI,this.options,this.workStyleElement,this.resources)}}))}}async resolveFrameURLs(){let t=this.processorHelper,a=Array.from(this.doc.querySelectorAll('iframe, frame, object[type="text/html"][data]'));await Promise.all(a.map(async o=>{let i=o.getAttribute("src"),r;if(o.tagName.toUpperCase()=="OBJECT"?o.setAttribute("data","data:text/html,"):(o.hasAttribute("src")&&o.setAttribute("src",""),o.removeAttribute("srcdoc")),Array.from(o.childNodes).forEach(s=>s.remove()),i&&!Vf(i)){try{r=P.resolveURL(i,this.baseURI)}catch{}this.options.saveOriginalURLs&&i&&!Wf(i)&&o.setAttribute("data-sf-original-src",r)}if(this.options.saveRawPage&&r&&Zf(r)){let s={adoptedStyleSheets:[],baseURI:r,canvases:[],fonts:[],images:[],posters:[],scrollPosition:{x:0,y:0},shadowRoots:[],stylesheets:[],url:r,usedFonts:[],usedFontsCharacters:[],videos:[],worklets:[]};this.options.frames.push(s),s.windowId=(this.options.windowId||"0")+"."+this.options.frames.length,o.setAttribute(P.WIN_ID_ATTRIBUTE_NAME,s.windowId),await n(s,o,null,Object.assign({},this.options))}else{let s=o.getAttribute(P.WIN_ID_ATTRIBUTE_NAME);if(this.options.frames&&s){let l=this.options.frames.find(c=>c.windowId==s);l&&l.content&&await n(l,o,s,Object.assign({},this.options))}}})),a.forEach(o=>{!o.getAttribute("src")&&!o.getAttribute("srcdoc")&&!o.getAttribute("data")&&o.removeAttribute("sandbox")});async function n(o,i,r,s){s.insertSingleFileComment=!1,s.insertCanonicalLink=!1,s.insertMetaNoIndex=!1,s.saveFavicon=!1,s.includeInfobar=!1,s.saveFilenameTemplateData=!1,s.selected=!1,s.embeddedImage=null,s.embeddedPdf=null,s.url=o.baseURI,s.windowId=r,s.content=o.content,s.canvases=o.canvases,s.fonts=o.fonts,s.worklets=o.worklets,s.stylesheets=o.stylesheets,s.linkStylesheets=null,s.images=o.images,s.posters=o.posters,s.videos=o.videos,s.usedFonts=o.usedFonts,s.usedFontsCharacters=o.usedFontsCharacters,s.shadowRoots=o.shadowRoots,s.scrollPosition=o.scrollPosition,s.scrolling=o.scrolling,s.adoptedStyleSheets=o.adoptedStyleSheets,s.manifestData=o.manifestData,o.runner=new $u(s,t),o.frameElement=i,await o.runner.loadPage(),await o.runner.initialize()}}insertShadowRootContents(){let t=this.doc,a=this.options;a.shadowRoots&&a.shadowRoots.length&&n(this.doc);function n(o){Array.from(o.querySelectorAll("["+P.SHADOW_ROOT_ATTRIBUTE_NAME+"]")).forEach(r=>{let s=r.getAttribute(P.SHADOW_ROOT_ATTRIBUTE_NAME);if(s){let l=a.shadowRoots[Number(s)];if(l){let c=t.createElement("template");c.setAttribute(Gf,l.mode),l.delegatesFocus&&c.setAttribute(g8,l.delegatesFocus),l.clonable&&c.setAttribute(f8,l.clonable),l.serializable&&c.setAttribute(w8,l.serializable),l.adoptedStyleSheets&&l.adoptedStyleSheets.length&&l.adoptedStyleSheets.forEach(d=>{let h=t.createElement("style");h.textContent=d,c.appendChild(h)});let u=P.parseDocContent(l.content);if(u.head){let d=u.head.querySelector("meta[charset]");d&&d.remove(),u.head.childNodes.forEach(h=>c.appendChild(u.importNode(h,!0)))}if(u.body&&u.body.childNodes.forEach(d=>c.appendChild(u.importNode(d,!0))),P.fixInvalidNesting(t,!0,{rootElement:c,recreateOnly:!0}),x_(c),P.fixInvalidNesting(t,!0,{rootElement:c,mergeCopies:!0}),c.querySelector(`[${P.NESTING_TRACK_ID_ATTRIBUTE_NAME}]`)&&c.setAttribute(Gf,"open"),l.slotAssignment=="manual"){let d=P8(r);c.querySelectorAll("["+P.SLOT_ATTRIBUTE_NAME+"]").forEach(h=>{let m=h.getAttribute(P.SLOT_ATTRIBUTE_NAME);h.removeAttribute(P.SLOT_ATTRIBUTE_NAME),d.has(m)?(d.get(m).forEach(p=>{let g=h.cloneNode(!1);g.setAttribute("name",qs+m+B_+p),h.before(g)}),h.remove()):h.setAttribute("name",qs+m)})}n(c),r.firstChild?r.insertBefore(c,r.firstChild):r.appendChild(c)}}})}}removeUnusedStyles(){let t=P.minifyCSSRules(this.doc,this.stylesheets,this.styles);this.stats.set("processed","CSS rules",t.processed),this.stats.set("discarded","CSS rules",t.discarded),this.stats.set("discarded","custom properties",t.discardedCustomProperties)}removeUnusedFonts(){P.removeUnusedFonts(this.doc,this.stylesheets,this.styles,this.options)}removeAlternativeMedias(){let t=P.minifyMedias(this.stylesheets,{keepPrintStyleSheets:this.options.keepPrintStyleSheets});this.stats.set("processed","medias",t.processed),this.stats.set("discarded","medias",t.discarded)}async processStylesheets(){await Promise.all([...this.stylesheets].map(async([,t])=>{t.stylesheet&&await this.processorHelper.processStylesheet(t.stylesheet.children,this.baseURI,this.options,this.resources,this.batchRequest)}))}async processStyleAttributes(){return Promise.all([...this.styles].map(([,t])=>this.processorHelper.processStyle(t,this.options,this.resources,this.batchRequest)))}async processPageResources(){await this.processorHelper.processPageResources(this.doc,this.baseURI,this.options,this.resources,this.styles,this.batchRequest)}async processScripts(){await Promise.all(Array.from(this.doc.querySelectorAll("script[src]")).map(async t=>{let a,n;if(n=t.getAttribute("src"),this.options.saveOriginalURLs&&!Wf(n)&&t.setAttribute("data-sf-original-src",n),t.removeAttribute("integrity"),this.options.blockScripts)t.removeAttribute("src");else{t.textContent="";try{a=P.resolveURL(n,this.baseURI)}catch{}Zf(a)&&(t.removeAttribute("src"),await this.processorHelper.processScript(t,a,this.options,this.charset,this.batchRequest,this.resources),(t.getAttribute("async")=="async"||t.getAttribute(P.ASYNC_SCRIPT_ATTRIBUTE_NAME)=="")&&t.setAttribute("async",""))}this.stats.add("processed","scripts",1)}))}async processWorklets(){if(this.options.worklets.length){let t=this.doc.createElement("script");t.textContent=`if (CSS && CSS.paintWorklet && CSS.paintWorklet.addModule) {
`,await Promise.all(this.options.worklets.map(async({moduleURL:a,options:n})=>{await this.processorHelper.processWorklet(t,a,n,this.options,this.charset,this.batchRequest,this.resources)})),t.textContent+="}",this.doc.head.appendChild(t)}}removeAlternativeImages(){P.removeAlternativeImages(this.doc)}async removeUnusedGlyphs(){await this.processorHelper.removeUnusedGlyphs(this.stylesheets,this.resources.fonts,this.options)}groupDuplicateFonts(){this.processorHelper.groupDuplicateFonts(this.stylesheets,this.resources.fonts,this.options)}groupDuplicateImages(){this.processorHelper.groupDuplicateImages(this.doc,this.stylesheets,this.styles,this.resources.images)}async removeAlternativeFonts(){await this.processorHelper.removeAlternativeFonts(this.doc,this.stylesheets,this.resources.fonts,this.options.fontTests)}async processFrames(){if(this.options.frames){let t=Array.from(this.doc.querySelectorAll('iframe, frame, object[type="text/html"][data]'));(await Promise.all(t.map(async n=>{let o=n.getAttribute(P.WIN_ID_ATTRIBUTE_NAME);if(o){let i=this.options.frames.find(r=>r.windowId==o);if(i)if(this.options.frames=this.options.frames.filter(r=>r.windowId!=o),i.runner&&n.getAttribute(P.HIDDEN_FRAME_ATTRIBUTE_NAME)!=""){this.stats.add("processed","frames",1),await i.runner.run();let r=await i.runner.getPageData();return n.removeAttribute(P.WIN_ID_ATTRIBUTE_NAME),{frameElement:n,pageData:r,frameWindowId:o,frameData:i}}else n.removeAttribute(P.WIN_ID_ATTRIBUTE_NAME),this.stats.add("discarded","frames",1)}else n.getAttribute(P.HIDDEN_FRAME_ATTRIBUTE_NAME)==""&&this.stats.add("discarded","frames",1)}))).forEach(n=>{if(n){let{frameElement:o,pageData:i,frameWindowId:r,frameData:s}=n;this.processorHelper.processFrame(o,i,this.options,this.resources,r,s),this.stats.addAll(i),i.manifest&&this.frameManifests.push(...i.manifest.frames)}})}}replaceStylesheets(){this.processorHelper.replaceStylesheets(this.doc,this.stylesheets,this.options,this.resources),delete this.options.inlineStylesheetsRefs,delete this.options.inlineStylesheets}replaceStyleAttributes(){this.doc.querySelectorAll("[style]").forEach(t=>{let a=this.styles.get(t);a?(this.styles.delete(t),t.setAttribute("style",this.processorHelper.generateStylesheetContent(a,this.options))):t.setAttribute("style","")})}insertVariables(){let{cssVariables:t}=this.resources;if(t.size){let a=this.doc.createElement("style"),n=this.doc.head.querySelector("style");n?this.doc.head.insertBefore(a,n):this.doc.head.appendChild(a);let o="";Array.from(t.entries()).sort(([r],[s])=>r-s).forEach(([r,{content:s,url:l}])=>{t.delete(r),o&&(o+=";"),o+=`${N8+r}: `,this.options.saveOriginalURLs&&(o+=`/* original URL: ${l} */ `),o+=`url("${s}")`}),a.textContent=":root{"+o+"}"}}compressHTML(){let t;this.options.displayStats&&(t=P.getContentSize(this.doc.documentElement.outerHTML)),P.minifyHTML(this.doc,{PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME:P.PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME}),this.options.displayStats&&this.stats.add("discarded","HTML bytes",t-P.getContentSize(this.doc.documentElement.outerHTML))}cleanupPage(){this.doc.querySelectorAll("base").forEach(a=>a.remove());let t=this.doc.head.querySelector("meta[charset]");t&&(this.doc.head.insertBefore(t,this.doc.head.firstChild),this.doc.head.querySelectorAll("*").length==1&&this.doc.body.childNodes.length==0&&this.doc.head.querySelector("meta[charset]").remove())}resetZoomLevel(){let t=this.doc.documentElement.style.getPropertyValue("-sf-transform"),a=this.doc.documentElement.style.getPropertyPriority("-sf-transform"),n=this.doc.documentElement.style.getPropertyValue("-sf-transform-origin"),o=this.doc.documentElement.style.getPropertyPriority("-sf-transform-origin"),i=this.doc.documentElement.style.getPropertyValue("-sf-min-height"),r=this.doc.documentElement.style.getPropertyPriority("-sf-min-height");this.doc.documentElement.style.setProperty("transform",t,a),this.doc.documentElement.style.setProperty("transform-origin",n,o),this.doc.documentElement.style.setProperty("min-height",i,r),this.doc.documentElement.style.removeProperty("-sf-transform"),this.doc.documentElement.style.removeProperty("-sf-transform-origin"),this.doc.documentElement.style.removeProperty("-sf-min-height")}async readMAFFMetaData(){let t=await this.maffMetaDataPromise;if(t&&t.content){let a="http://www.w3.org/1999/02/22-rdf-syntax-ns#",n=P.parseXMLContent(t.content),o=n.querySelector("RDF > Description > originalurl"),i=n.querySelector("RDF > Description > archivetime");if(o){let r=o.getAttributeNS(a,"resource");r&&(this.options.saveUrl=r)}if(i){let r=i.getAttributeNS(a,"resource");if(r){let s=new Date(r);isNaN(s.getTime())||(this.options.saveDate=new Date(r))}}}}async setDocInfo(){let t=this.doc.querySelector("title"),a=this.doc.querySelector("meta[name=description]"),n=this.doc.querySelector("meta[name=author]"),o=this.doc.querySelector("meta[name=creator]"),i=this.doc.querySelector("meta[name=publisher]"),r=this.doc.querySelector("h1");this.options.title=t?t.textContent.trim():"",this.options.info={description:a&&a.content?a.content.trim():"",lang:this.doc.documentElement.lang,author:n&&n.content?n.content.trim():"",creator:o&&o.content?o.content.trim():"",publisher:i&&i.content?i.content.trim():"",heading:r&&r.textContent?r.textContent.trim():""},this.options.infobarContent=await P.evalTemplate(this.options.infobarTemplate,this.options,null,this.doc,{dontReplaceSlash:!0})}},Jf="data:",x8="about:blank",H_="blob:",G_=/^https?:\/\//,L8=/^file:\/\//,I8=/^https?:\/\/+\s*$/,j8=/^(https?:\/\/|file:\/\/|blob:).+/,N8="--sf-img-",Qf="P";function __(e){return!e||e.startsWith(Jf)?e:e.split("#")[0]}function Zu(e){W_(e)?e.replaceWith(V_(e)):e.remove()}function W_(e){return!!e.parentElement&&e.parentElement!=e.ownerDocument.head}function V_(e){let t=e.ownerDocument.createElementNS(e.namespaceURI,e.localName);return e.localName=="input"&&t.setAttribute("type","hidden"),t}function O8(e){try{return new I_(e).protocol==y8}catch{return!1}}function D8(e){let t=[e.body||e.createElement("div"),e.createElementNS(v8,"animate")],a=[];return t.forEach(n=>{for(let o in n)o.startsWith("on")&&a.push(o)}),a}function Wf(e){return e&&(e.startsWith(Jf)||e.startsWith(H_))}function Vf(e){return e&&(e.startsWith(Jf)||e==x8)}function M8(e){let t=Array.from(e.querySelectorAll(`[${P.NESTING_RECREATED_ATTRIBUTE_NAME}]`)).reverse();return t.forEach(a=>{let n=a.getAttribute(P.NESTING_TRACK_ID_ATTRIBUTE_NAME);for(a.before(e.createComment(P.NESTING_START_MARKER+n+" "+P.getNestingMarkerData(a)));a.firstChild;)a.before(a.firstChild);a.before(e.createComment(P.NESTING_END_MARKER+n)),a.remove()}),t.length}function P8(e){let t=new tt;Array.from(e.children).forEach(n=>{let o=n.getAttribute(P.ASSIGNED_SLOT_ATTRIBUTE_NAME);if(n.removeAttribute(P.ASSIGNED_SLOT_ATTRIBUTE_NAME),o===null)n.setAttribute("slot",b8);else{let[i,r]=o.split(P.ASSIGNED_SLOT_SEPARATOR);t.has(i)||t.set(i,[]),t.get(i).push({childElement:n,position:Number(r)})}});let a=new tt;return t.forEach((n,o)=>{n.every((r,s)=>!s||n[s-1].position<r.position)?n.forEach(({childElement:r})=>r.setAttribute("slot",qs+o)):(n.forEach(({childElement:r,position:s})=>r.setAttribute("slot",qs+o+B_+s)),a.set(o,n.map(({position:r})=>r).sort((r,s)=>r-s)))}),a}function F8(e){let t={};return Object.keys(e).sort().forEach(a=>{let n=e[a];((typeof n=="boolean"||typeof n=="number")&&!R8.includes(a)||typeof n=="string"&&_8.includes(a))&&(t[a]=n)}),t}function x_(e){q_(e).forEach((t,a)=>a.remove())}function z8(e,t){let a=P.parseDocContent(t),n=[];i(a);let o=new Ji;return n.forEach(r=>q_(r).forEach(s=>o.add(s))),new Ji(Array.from(e.querySelectorAll(`[${P.NESTING_TRACK_ID_ATTRIBUTE_NAME}]`)).filter(r=>r.tagName==Qf&&o.has(r.getAttribute(P.NESTING_TRACK_ID_ATTRIBUTE_NAME))));function i(r){n.push(r),r.querySelectorAll("template").forEach(s=>i(s.content))}}function q_(e){let t=new tt;e.querySelectorAll(`[${P.NESTING_TRACK_ID_ATTRIBUTE_NAME}]`).forEach(o=>t.set(o.getAttribute(P.NESTING_TRACK_ID_ATTRIBUTE_NAME),o));let a=new Ji;t.forEach((o,i)=>{let r=Xf(i),s=t.get(r);s&&o.parentElement!=s&&!o.contains(s)&&L_(t,r)&&a.add(o)});let n=new tt;return a.forEach(o=>{let i=o.nextSibling;for(;i&&(i.nodeType!=1||a.has(i));)i=i.nextSibling;if(i&&i.tagName==Qf&&!i.attributes.length&&!i.childNodes.length){let r=o.getAttribute(P.NESTING_TRACK_ID_ATTRIBUTE_NAME);n.set(i,L_(t,Xf(r)))}}),n}function L_(e,t){let a=e.get(t);for(;a;){if(a.tagName==Qf)return t;t=Xf(t),a=t?e.get(t):null}}function Xf(e){return e.split(".").slice(0,-1).join(".")}function U8(e){return e&&!e.match(I8)}function Zf(e){return U8(e)&&(e.match(G_)||e.match(L8)||e.startsWith(H_))&&e.match(j8)}function $i(...e){console.log("S-File <core>   ",...e)}function B8(...e){console.warn("S-File <core>   ",...e)}var H8={discarded:{"HTML bytes":0,"hidden elements":0,scripts:0,objects:0,"audio sources":0,"video sources":0,frames:0,"CSS rules":0,canvas:0,stylesheets:0,resources:0,medias:0},processed:{"HTML bytes":0,"hidden elements":0,scripts:0,objects:0,"audio sources":0,"video sources":0,frames:0,"CSS rules":0,canvas:0,stylesheets:0,resources:0,medias:0}},$f=class{constructor(t){this.options=t,t.displayStats&&(this.data=Qi.parse(Qi.stringify(H8)))}set(t,a,n){this.options.displayStats&&(this.data[t][a]=n)}add(t,a,n){this.options.displayStats&&(this.data[t][a]+=n)}addAll(t){this.options.displayStats&&(Object.keys(this.data.discarded).forEach(a=>this.add("discarded",a,t.stats.discarded[a]||0)),Object.keys(this.data.processed).forEach(a=>this.add("processed",a,t.stats.processed[a]||0)))}};function Y_(e){let t=e.doctype,a="";return t&&(a="<!DOCTYPE "+t.nodeName,t.publicId?(a+=' PUBLIC "'+t.publicId+'"',t.systemId&&(a+=' "'+t.systemId+'"')):t.systemId&&(a+=' SYSTEM "'+t.systemId+'"'),a+=">"),a}var ew=!1,K_=1024*1024,W8="text/",V8={"image/svg+xml":".svg","image/png":".png","image/gif":".gif","image/tiff":".tiff","image/bmp":".bmp","image/x-icon":".ico","image/heif":".heif","image/heic":".heic","image/avif":".avif","image/jxl":".jxl","image/apng":".apng","image/jpeg":".jpg","image/webp":".webp","audio/mpeg":".mp3","audio/ogg":".ogg","audio/wav":".wav","audio/webm":".webm","video/3gpp":".3gp","video/3gpp2":".3g2","video/mpeg":".mpeg","video/quicktime":".mov","video/x-msvideo":".avi","video/webm":".webm","video/ogg":".ogv","video/mp4":".mp4","video/mp2t":".ts","font/otf":".otf","font/ttf":".ttf","font/woff":".woff","font/woff2":".woff2","application/vnd.ms-fontobject":".eot","font/collection":".ttc"},X_="application/octet-stream",tw=71,aw=188,Z_=26,Ju=30,q8=/\.usd[ac]?$/i,Y8=["text/html","application/xhtml+xml"],K8=["font","image","video","audio","model"],X8="image",$_="document",Z8="data:",J_="embedded",ax="failed",$8="blocked",nw="rejected",Q_="oversized",ex="page",J8="frame",Q8=["date","last-modified","etag","content-length","content-encoding","cache-control","age","expires","server"],eW=500,ow=globalThis.URL,iw=globalThis.DOMParser,tW=globalThis.Blob,lw=globalThis.TextDecoder,aW=globalThis.URLSearchParams;function nx(e){return e=e||{},e.fetch=e.fetch||((n,o)=>globalThis.fetch(n,{...o,cache:o.cache||"force-cache",referrerPolicy:"strict-origin-when-cross-origin"})),e.frameFetch=e.frameFetch||e.fetch,{getDoctypeString:Y_,brotli:e.brotli,getFilenameExtension(n,o,i,r){let s;try{s=new ow(n).pathname.match(/(\.[^\\/.]*)$/)}catch{}return(s&&s[1]&&this.getValidFilename(s[1],o,i,r)||"").toLowerCase()},getContentTypeExtension(n){return V8[n]||""},getContent:t,parseURL(n,o){return o===void 0?new ow(n):new ow(n,o)},resolveURL(n,o){return this.parseURL(n,o).href},getSearchParams(n){return Array.from(new aW(n))},getValidFilename(n,o,i,r){return si(n,o,i,r)},parseDocContent(n,o){return Ic(n,o)},parseXMLContent(n){return new iw().parseFromString(n,"text/xml")},parseSVGContent(n){let o=new iw().parseFromString(n,"image/svg+xml");return o.querySelector("parsererror")?new iw().parseFromString(n,"text/html"):o},fixInvalidNesting(n,o=!0,i){xc(n,At,o,i)},removeNestingMarkers(n){Jr(n)},getNestingMarkerData(n){return _c(n)},markInvalidNesting(n){Rc(n,At)},getFixInvalidNestingSource(){return xc.toString().replace(/\s+/g," ")},async digest(n,o){return ka(n,o)},getContentSize(n){return Un(n)},formatFilename(n,o,i){return Wi.formatFilename(n,o,i)},getMimeType(n){return!n.compressContent||n.selfExtractingArchive?"text/html":"application/zip"},async evalTemplate(n,o,i,r,s){return Wi.evalTemplate(n,o,i,r,s)},minifyHTML(n,o){return Us.process(n,o)},minifyCSSRules(n,o,i){return Ms.process(n,o,i)},removeUnusedFonts(n,o,i,r){return Ts.process(n,o,i,r)},minifyMedias(n,o){return Cs.process(n,o)},removeAlternativeImages(n){return Fs.process(n)},parseSrcset(n){return fo.process(n)},preProcessDoc(n,o,i){return $r(n,o,i)},postProcessDoc(n,o,i){es(n,o,i)},serialize(n,o,i){return Bs.process(n,o,i)},removeQuotes(n){return vi(n)},appendInfobar(n,o){return mp(n,o)},findLast(n,o){if(n.findLast&&typeof n.findLast=="function")return n.findLast(o);{let i=n.length;for(;i--;)if(o(n[i],i,n))return n[i]}},ON_BEFORE_CAPTURE_EVENT_NAME:Wr,ON_AFTER_CAPTURE_EVENT_NAME:Vr,WIN_ID_ATTRIBUTE_NAME:qr,REMOVED_CONTENT_ATTRIBUTE_NAME:ci,HIDDEN_CONTENT_ATTRIBUTE_NAME:ui,HIDDEN_FRAME_ATTRIBUTE_NAME:ko,IMAGE_ATTRIBUTE_NAME:gi,POSTER_ATTRIBUTE_NAME:fi,VIDEO_ATTRIBUTE_NAME:wi,CANVAS_ATTRIBUTE_NAME:bi,STYLE_ATTRIBUTE_NAME:Yr,INPUT_VALUE_ATTRIBUTE_NAME:Pn,INPUT_CHECKED_ATTRIBUTE_NAME:yi,SHADOW_ROOT_ATTRIBUTE_NAME:hi,SLOT_ATTRIBUTE_NAME:mi,ASSIGNED_SLOT_ATTRIBUTE_NAME:pi,ASSIGNED_SLOT_SEPARATOR:vc,PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME:di,STYLESHEET_ATTRIBUTE_NAME:ki,LINK_STYLESHEET_ATTRIBUTE_NAME:Ei,CUSTOM_STYLESHEET_ATTRIBUTE_NAME:Kr,SELECTED_CONTENT_ATTRIBUTE_NAME:lp,INVALID_ELEMENT_ATTRIBUTE_NAME:cp,COMMENT_HEADER:fc,COMMENT_HEADER_LEGACY:up,SINGLE_FILE_UI_ELEMENT_CLASS:Eo,EMPTY_RESOURCE:vo,INFOBAR_TAGNAME:Xr,WAIT_FOR_USERSCRIPT_PROPERTY_NAME:bo,NO_SCRIPT_PROPERTY_NAME:wc,NESTING_TRACK_ID_ATTRIBUTE_NAME:At,NESTING_START_MARKER:Fn,NESTING_END_MARKER:Zr,NESTING_RECREATED_ATTRIBUTE_NAME:Sc,getPosterDataURI:Ac};async function t(n,o){let i=o.manifestEntries&&!n.startsWith(Z8)?{url:n,role:o.expectedType||$_,outcome:ax}:void 0,r=await a(n,o,i);return i&&(o.manifestEntries.push(i),r.manifestEntry=i),r}async function a(n,o,i){let r,s,l,c,u,d=e.fetch,h=e.frameFetch;if(ew&&(s=Date.now(),sw("  // STARTED download url =",n,"asBinary =",o.asBinary)),o.blockMixedContent&&/^https:/i.test(o.baseURI)&&!/^https:/i.test(n)&&!/^blob:https:/i.test(n))return $n(i,$8),Qa(n,o);o.networkTimeout?c=new Promise((b,y)=>{u=b,l=globalThis.setTimeout(()=>y(new Error("network timeout")),o.networkTimeout)}):c=new Promise(b=>{u=b});let m=async(b,y)=>{let E=await Promise.race([b(n,y),c]);if(E.status>=eW)try{E=await Promise.race([b(n,{...y,cache:"reload"}),c])}catch{}return E};try{let b=o.acceptHeaders&&o.acceptHeaders[o.expectedType]||"*/*",y={referrer:o.resourceReferrer,referrerPolicy:o.referrerPolicy||void 0,stylesheetURL:o.stylesheetURL||void 0,stylesheetReferrerPolicy:o.stylesheetReferrerPolicy||void 0,headers:{accept:b}};if(o.frameId)try{r=await m(h,{frameId:o.frameId,...y}),rw(i,r,J8)}catch{r=await m(d,y),rw(i,r,ex)}else r=await m(d,y),rw(i,r,ex)}catch(b){return Qu(i,b),tx(n,o)}finally{u(),o.networkTimeout&&globalThis.clearTimeout(l)}let p;try{p=await r.arrayBuffer()}catch(b){return Qu(i,b),o.inline?{data:o.asBinary?vo:"",resourceURL:n}:{resourceURL:n}}await oW(i,p),n=r.url||n;let g="",w;try{let b=new vs(r.headers.get("content-type"));g=b.type+"/"+b.subtype,w=b.parameters.get("charset")}catch{}let f=iW(o.expectedType,p);if(f?g=f:(!g||g==X_&&o.asBinary)&&(g=o.contentType?o.contentType:o.asBinary?X_:""),!w&&o.charset&&(w=o.charset),i&&(i.contentType=g,w&&(i.charset=w)),o.asBinary){if(r.status>=400&&o.expectedType!=X8||K8.includes(o.expectedType)&&Y8.includes(g))return $n(i,nw),Qa(n,o);try{return ew&&sw("  // ENDED   download url =",n,"delay =",Date.now()-s),o.maxResourceSizeEnabled&&p.byteLength>o.maxResourceSize*K_?($n(i,Q_),Qa(n,o)):($n(i,J_),Qa(n,o,p,null,g))}catch(b){return Qu(i,b),Qa(n,o)}}else{if(r.status>=400&&o.expectedType!=$_)return $n(i,nw),tx(n,o);if(o.validateTextContentType&&g&&!g.startsWith(W8))return $n(i,nw),Qa(n,o);if(w||(w="utf-8"),ew&&sw("  // ENDED   download url =",n,"delay =",Date.now()-s),o.maxResourceSizeEnabled&&p.byteLength>o.maxResourceSize*K_)return $n(i,Q_),Qa(n,o,null,w);try{let b=await Qa(n,o,p,w,g);return b.referrerPolicy=r.headers&&r.headers.get("referrer-policy")||void 0,$n(i,J_),b}catch(b){return Qu(i,b),Qa(n,o,null,w)}}}}function rw(e,t,a){if(e){e.fetchedBy=a,t.url&&(e.finalUrl=t.url),t.status!==void 0&&(e.status=t.status);let n={};Q8.forEach(o=>{let i=nW(t.headers,o);i&&(n[o]=i)}),Object.keys(n).length&&(e.headers=n)}}function nW(e,t){if(e){if(typeof e.get=="function")return e.get(t);let a=Object.keys(e).find(n=>n.toLowerCase()==t);return a===void 0?void 0:e[a]}}async function oW(e,t){e&&(e.size=t.byteLength,e.sha256=await ka("SHA-256",t))}function $n(e,t){e&&(e.outcome=t)}function Qu(e,t){e&&(e.outcome=ax,t&&t.message&&(e.error=t.message))}async function tx(e,t){let a=await Qa(e,t);return a.failed=!0,a}async function Qa(e,t,a,n,o){if(a)if(t.asBinary)t.inline?a=await as(new tW([a],{type:o+(t.charset?";charset="+t.charset:"")})):a=new Uint8Array(a);else{let i=new Uint8Array(a.slice(0,4));i[0]==132&&i[1]==49&&i[2]==149&&i[3]==51?n="gb18030":i[0]==255&&i[1]==254?n="utf-16le":i[0]==254&&i[1]==255&&(n="utf-16be");try{a=new lw(n).decode(a)}catch{n="utf-8",a=new lw(n).decode(a)}a=a.replace(/^\ufeff/,"")}else t.inline&&(a=t.asBinary?vo:"");return{data:a,resourceURL:e,charset:n,contentType:o}}function iW(e,t){if(e=="image"){if(o([255,255,255,255],[0,0,1,0])||o([255,255,255,255],[0,0,2,0]))return"image/x-icon";if(o([255,255],[66,77]))return"image/bmp";if(o([255,255,255,255,255,255],[71,73,70,56,57,97])||o([255,255,255,255,255,255],[71,73,70,56,55,97]))return"image/gif";if(o([255,255,255,255,0,0,0,0,255,255,255,255,255,255],[82,73,70,70,0,0,0,0,87,69,66,80,86,80]))return"image/webp";if(o([255,255,255,255,255,255,255,255],[137,80,78,71,13,10,26,10]))return"image/png";if(o([255,255,255],[255,216,255]))return"image/jpeg";if(o([0,0,0,0,255,255,255,255,255,255,255,255],[0,0,0,0,102,116,121,112,97,118,105,102])||o([0,0,0,0,255,255,255,255,255,255,255,255],[0,0,0,0,102,116,121,112,97,118,105,115]))return"image/avif";if(o([0,0,0,0,255,255,255,255,255,255,255,255],[0,0,0,0,102,116,121,112,104,101,105,99])||o([0,0,0,0,255,255,255,255,255,255,255,255],[0,0,0,0,102,116,121,112,104,101,105,120])||o([0,0,0,0,255,255,255,255,255,255,255,255],[0,0,0,0,102,116,121,112,104,101,118,99])||o([0,0,0,0,255,255,255,255,255,255,255,255],[0,0,0,0,102,116,121,112,104,101,118,120]))return"image/heic";if(o([255,255,255,255,255,255,255,255,255,255,255,255],[0,0,0,12,74,88,76,32,13,10,135,10])||o([255,255],[255,10]))return"image/jxl";if(o([255,255,255,255],[73,73,42,0])||o([255,255,255,255],[77,77,0,42]))return"image/tiff"}if(e=="font"){if(o([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,76,80]))return"application/vnd.ms-fontobject";if(o([255,255,255,255],[0,1,0,0]))return"font/ttf";if(o([255,255,255,255],[79,84,84,79]))return"font/otf";if(o([255,255,255,255],[116,116,99,102]))return"font/collection";if(o([255,255,255,255],[119,79,70,70]))return"font/woff";if(o([255,255,255,255],[119,79,70,50]))return"font/woff2"}if(e=="video"){if(o([0,0,0,0,255,255,255,255,255,255,255,255],[0,0,0,0,102,116,121,112,105,115,111,109]))return"video/mp4";if(o([255,255,255,255,0,0,0,0,255,255,255,255],[82,73,70,70,0,0,0,0,65,86,73,32]))return"video/x-msvideo";if(o([255,255,255,255],[0,0,1,179])||o([255,255,255,255],[0,0,1,186]))return"video/mpeg";if(o([255,255,255,255],[79,103,103,83]))return"video/ogg";if(o([255,255,255,255],[26,69,223,163]))return"video/webm";if(o([0,0,0,0,255,255,255,255,255,255],[0,0,0,0,102,116,121,112,51,103]))return"video/3gpp";if(n())return"video/mp2t"}if(e=="audio"){if(o([255,255],[255,241])||o([255,255],[255,249])||o([255,255],[255,254]))return"audio/aac";if(o([255,255,255,255],[77,84,104,100]))return"audio/midi";if(o([255,255,255,255],[0,0,1,179])||o([255,255,255,255],[0,0,1,186])||o([255,255],[255,251])||o([255,255],[255,243])||o([255,255],[255,242])||o([255,255,255],[73,68,51]))return"audio/mpeg";if(o([255,255,255,255],[79,103,103,83]))return"audio/ogg";if(o([255,255,255,255,0,0,0,0,255,255,255,255],[82,73,70,70,0,0,0,0,87,65,86,69]))return"audio/wav";if(o([255,255,255,255],[26,69,223,163]))return"audio/webm";if(o([0,0,0,0,255,255,255,255,255,255],[0,0,0,0,102,116,121,112,51,103]))return"audio/3gpp"}if(e=="model"){if(o([255,255,255,255],[103,108,84,70]))return"model/gltf-binary";if(o([255,255,255,255],[80,75,3,4])&&a())return"model/vnd.usdz+zip"}function a(){let i=new Uint8Array(t);if(i.length>Ju){let r=i[Z_]|i[Z_+1]<<8;if(i.length>=Ju+r){let s=new lw().decode(i.subarray(Ju,Ju+r));return q8.test(s)}}return!1}function n(){let i=new Uint8Array(t);return i.length>aw*2&&i[0]==tw&&i[aw]==tw&&i[aw*2]==tw}function o(i,r){let s=!0,l=0;if(t.byteLength>=r.length){let c=new Uint8Array(t,0,i.length);for(l=0;l<i.length&&s;l++)s=s&&(c[l]&i[l])==r[l];return s}}}function sw(...e){console.log("S-File <browser>",...e)}var ed;function ox(e){typeof ed>"u"&&(ed=j_(nx(e)))}async function sW(e={},t,a,n){e=dp(e),a===void 0&&(a=globalThis.document),n===void 0&&(n=globalThis);let o=is,i;if(ox(t),a&&n){Cc(a);let c=[];if(!e.saveRawPage){let u;if(e.loadDeferredContent&&(u=Ao.process(e),e.loadDeferredContentBeforeFrames&&await u),!e.removeFrames&&o&&globalThis.frames){let d;e.loadDeferredContent?d=new Promise(h=>globalThis.setTimeout(()=>h(o.getAsync(e)),e.loadDeferredContentBeforeFrames||!e.loadDeferredContent?0:e.loadDeferredContentMaxIdleTime)):d=o.getAsync(e),e.loadDeferredContentBeforeFrames?e.frames=await d:c.push(d)}e.loadDeferredContent&&!e.loadDeferredContentBeforeFrames&&c.push(u)}e.loadDeferredContentBeforeFrames||([e.frames]=await Promise.all(c)),i=e.frames&&e.frames.sessionId}e.doc=a,e.win=n,e.insertCanonicalLink=e.insertCanonicalLink===void 0?!0:e.insertCanonicalLink;let r=e.onprogress;e.onprogress=async c=>{c.type===c.RESOURCES_INITIALIZED&&a&&n&&e.loadDeferredContent&&Ao.resetZoomLevel(e),r&&await r(c)};let s=new ed(e);await s.run(),i&&o.cleanup(i);let l=await s.getPageData();if(e.compressContent){let c={};for(let h of oi.PROCESS_OPTION_NAMES)c[h]=e[h];let u=await oi.process(l,c);delete l.resources;let d;if(globalThis.FileReader){let h=new globalThis.FileReader;h.readAsArrayBuffer(u),d=await new Promise((m,p)=>{h.addEventListener("load",()=>m(h.result),!1),h.addEventListener("error",p,!1)})}else d=await u.arrayBuffer();l.content=Array.from(new Uint8Array(d))}if(l.manifest){let c=e.compressContent?new Uint8Array(l.content):l.content;l.manifest.output={filename:l.filename,mimeType:l.mimeType,size:e.compressContent?c.length:Un(c),sha256:await ka("SHA-256",c)}}return l}globalThis.__EEA_SF__=cw;})();
