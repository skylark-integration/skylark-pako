define([], function () {


    const _has = (obj, key) => {
        return Object.prototype.hasOwnProperty.call(obj, key);
    };

    function assign(obj) {
        const sources = Array.prototype.slice.call(arguments, 1);
        while (sources.length) {
            const source = sources.shift();
            if (!source) {
                continue;
            }
            if (typeof source !== 'object') {
                throw new TypeError(source + 'must be non-object');
            }
            for (const p in source) {
                if (_has(source, p)) {
                    obj[p] = source[p];
                }
            }
        }
        return obj;
    }

    function flattenChunks(chunks){
        let len = 0;
        for (let i = 0, l = chunks.length; i < l; i++) {
            len += chunks[i].length;
        }
        const result = new Uint8Array(len);
        for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
            let chunk = chunks[i];
            result.set(chunk, pos);
            pos += chunk.length;
        }
        return result;
    };

    return {
      assign,
      flattenChunks
    };
});