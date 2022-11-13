/**
 * skylark-pako - A skylark wrapper for pako.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-ns","./deflates","./inflates","./zlib/constants"],function(a,e,t,n){var l=a.attach("intg.pako",{deflates:e,inflates:t});const{Deflate:f,deflate:i,deflateRaw:s,gzip:d}=e,{Inflate:g,inflate:c,inflateRaw:o,ungzip:p}=t;return l.Deflate=f,l.deflate=i,l.deflateRaw=s,l.gzip=d,l.Inflate=g,l.inflate=c,l.inflateRaw=o,l.ungzip=p,l.constants=n,l});
//# sourceMappingURL=sourcemaps/main.js.map
