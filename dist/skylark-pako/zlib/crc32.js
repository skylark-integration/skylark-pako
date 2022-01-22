/**
 * skylark-pako - A skylark wrapper for pako.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define([],function(){"use strict";const r=new Uint32Array((()=>{let r,t=[];for(var n=0;n<256;n++){r=n;for(var e=0;e<8;e++)r=1&r?3988292384^r>>>1:r>>>1;t[n]=r}return t})());return(t,n,e,o)=>{const f=r,u=o+e;t^=-1;for(let r=o;r<u;r++)t=t>>>8^f[255&(t^n[r])];return-1^t}});
//# sourceMappingURL=../sourcemaps/zlib/crc32.js.map
