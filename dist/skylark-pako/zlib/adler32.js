/**
 * skylark-pako - A skylark wrapper for pako.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define([],function(){"use strict";return function(e,n,t,r){let i=65535&e|0,u=e>>>16&65535|0,f=0;for(;0!==t;){t-=f=t>2e3?2e3:t;do{u=u+(i=i+n[r++]|0)|0}while(--f);i%=65521,u%=65521}return i|u<<16|0}});
//# sourceMappingURL=../sourcemaps/zlib/adler32.js.map
