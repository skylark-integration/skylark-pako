define([], function () {
    'use strict';
    // Original version : zlib 1.2.8
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin

    // Note: we can't get significant speed boost here.
    // So write code to minimize size - no pregenerated tables
    // and array tools dependencies.
    
    // Use ordinary array, since untyped makes no boost here
    const makeTable = () => {
        let c, table = [];
        for (var n = 0; n < 256; n++) {
            c = n;
            for (var k = 0; k < 8; k++) {
                c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
            }
            table[n] = c;
        }
        return table;
    };
    
    // Create table on load. Just 255 signed longs. Not a problem.
    const crcTable = new Uint32Array(makeTable());

    const crc32 = (crc, buf, len, pos) => {
        const t = crcTable;
        const end = pos + len;
        crc ^= -1;
        for (let i = pos; i < end; i++) {
            crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
        }
        return crc ^ -1; // >>> 0;
    };


    return crc32;

});