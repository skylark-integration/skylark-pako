/**
 * skylark-pako - A skylark wrapper for pako.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-ns","skylark-langx-compression/constants","./deflates","./inflates"],function(a,e,t,n){var l=a.attach("intg.pako",{deflates:t,inflates:n});const{Deflate:f,deflate:i,deflateRaw:s,gzip:d}=t,{Inflate:g,inflate:o,inflateRaw:c,ungzip:p}=n;return l.Deflate=f,l.deflate=i,l.deflateRaw=s,l.gzip=d,l.Inflate=g,l.inflate=o,l.inflateRaw=c,l.ungzip=p,l.constants=e,l});
//# sourceMappingURL=sourcemaps/main.js.map
