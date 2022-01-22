define([], function () {
    'use strict';
    var exports = {};

    let STR_APPLY_UIA_OK = true;
    try {
        String.fromCharCode.apply(null, new Uint8Array(1));
    } catch (__) {
        STR_APPLY_UIA_OK = false;
    }

    const _utf8len = new Uint8Array(256);
    for (let q = 0; q < 256; q++) {
        _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
    }
    _utf8len[254] = _utf8len[254] = 1;

    function string2buf(str){
        if (typeof TextEncoder === 'function' && TextEncoder.prototype.encode) {
            return new TextEncoder().encode(str);
        }
        let buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
        for (m_pos = 0; m_pos < str_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
                c2 = str.charCodeAt(m_pos + 1);
                if ((c2 & 64512) === 56320) {
                    c = 65536 + (c - 55296 << 10) + (c2 - 56320);
                    m_pos++;
                }
            }
            buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
        }
        buf = new Uint8Array(buf_len);
        for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
                c2 = str.charCodeAt(m_pos + 1);
                if ((c2 & 64512) === 56320) {
                    c = 65536 + (c - 55296 << 10) + (c2 - 56320);
                    m_pos++;
                }
            }
            if (c < 128) {
                buf[i++] = c;
            } else if (c < 2048) {
                buf[i++] = 192 | c >>> 6;
                buf[i++] = 128 | c & 63;
            } else if (c < 65536) {
                buf[i++] = 224 | c >>> 12;
                buf[i++] = 128 | c >>> 6 & 63;
                buf[i++] = 128 | c & 63;
            } else {
                buf[i++] = 240 | c >>> 18;
                buf[i++] = 128 | c >>> 12 & 63;
                buf[i++] = 128 | c >>> 6 & 63;
                buf[i++] = 128 | c & 63;
            }
        }
        return buf;
    }

    const buf2binstring = (buf, len) => {
        if (len < 65534) {
            if (buf.subarray && STR_APPLY_UIA_OK) {
                return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
            }
        }
        let result = '';
        for (let i = 0; i < len; i++) {
            result += String.fromCharCode(buf[i]);
        }
        return result;
    };
    
    function buf2string (buf, max) {
        const len = max || buf.length;
        if (typeof TextDecoder === 'function' && TextDecoder.prototype.decode) {
            return new TextDecoder().decode(buf.subarray(0, max));
        }
        let i, out;
        const utf16buf = new Array(len * 2);
        for (out = 0, i = 0; i < len;) {
            let c = buf[i++];
            if (c < 128) {
                utf16buf[out++] = c;
                continue;
            }
            let c_len = _utf8len[c];
            if (c_len > 4) {
                utf16buf[out++] = 65533;
                i += c_len - 1;
                continue;
            }
            c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
            while (c_len > 1 && i < len) {
                c = c << 6 | buf[i++] & 63;
                c_len--;
            }
            if (c_len > 1) {
                utf16buf[out++] = 65533;
                continue;
            }
            if (c < 65536) {
                utf16buf[out++] = c;
            } else {
                c -= 65536;
                utf16buf[out++] = 55296 | c >> 10 & 1023;
                utf16buf[out++] = 56320 | c & 1023;
            }
        }
        return buf2binstring(utf16buf, out);
    }

    function utf8border(buf, max) {
        max = max || buf.length;
        if (max > buf.length) {
            max = buf.length;
        }
        let pos = max - 1;
        while (pos >= 0 && (buf[pos] & 192) === 128) {
            pos--;
        }
        if (pos < 0) {
            return max;
        }
        if (pos === 0) {
            return max;
        }
        return pos + _utf8len[buf[pos]] > max ? pos : max;
    }

    return {
      string2buf,
      buf2string,
      utf8border
    };
});