define([], function () {
    'use strict';
    // Original version : zlib 1.2.8
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin


    // Note: adler32 takes 12% for level 0 and 2% for level 6.
    // It isn't worth it to make additional optimizations as in original.
    // Small size is preferable.
    function adler32 (adler, buf, len, pos)  {
        let s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
        while (len !== 0) {
            // Set limit ~ twice less than 5552, to keep
            // s2 in 31-bits, because we force signed ints.
            // in other case %= will fail.
            n = len > 2000 ? 2000 : len;
            len -= n;
            do {
                s1 = s1 + buf[pos++] | 0;
                s2 = s2 + s1 | 0;
            } while (--n);
            s1 %= 65521;
            s2 %= 65521;
        }
        return s1 | s2 << 16 | 0;
    };

    return  adler32;

});