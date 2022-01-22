/**
 * skylark-pako - A skylark wrapper for pako.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define([],function(){const t=(t,n)=>Object.prototype.hasOwnProperty.call(t,n);return{assign:function(n){const e=Array.prototype.slice.call(arguments,1);for(;e.length;){const o=e.shift();if(o){if("object"!=typeof o)throw new TypeError(o+"must be non-object");for(const e in o)t(o,e)&&(n[e]=o[e])}}return n},flattenChunks:function(t){let n=0;for(let e=0,o=t.length;e<o;e++)n+=t[e].length;const e=new Uint8Array(n);for(let n=0,o=0,r=t.length;n<r;n++){let r=t[n];e.set(r,o),o+=r.length}return e}}});
//# sourceMappingURL=../sourcemaps/utils/common.js.map
