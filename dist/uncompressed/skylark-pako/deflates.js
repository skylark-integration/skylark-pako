define([
    './zlib/deflate',
    './utils/common',
    './utils/strings',
    './zlib/messages',
    './zlib/zstream',
    './zlib/constants'
], function (zlib_deflate, utils, strings, msg, ZStream, constants) {
    'use strict';

    const toString = Object.prototype.toString;
    const {Z_NO_FLUSH, Z_SYNC_FLUSH, Z_FULL_FLUSH, Z_FINISH, Z_OK, Z_STREAM_END, Z_DEFAULT_COMPRESSION, Z_DEFAULT_STRATEGY, Z_DEFLATED} = constants;

    function Deflate(options) {
        this.options = utils.assign({
            level: Z_DEFAULT_COMPRESSION,
            method: Z_DEFLATED,
            chunkSize: 16384,
            windowBits: 15,
            memLevel: 8,
            strategy: Z_DEFAULT_STRATEGY
        }, options || {});
        let opt = this.options;
        if (opt.raw && opt.windowBits > 0) {
            opt.windowBits = -opt.windowBits;
        } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
            opt.windowBits += 16;
        }
        this.err = 0;
        this.msg = '';
        this.ended = false;
        this.chunks = [];
        this.strm = new ZStream();
        this.strm.avail_out = 0;
        let status = zlib_deflate.deflateInit2(this.strm, opt.level, opt.method, opt.windowBits, opt.memLevel, opt.strategy);
        if (status !== Z_OK) {
            throw new Error(msg[status]);
        }
        if (opt.header) {
            zlib_deflate.deflateSetHeader(this.strm, opt.header);
        }
        if (opt.dictionary) {
            let dict;
            if (typeof opt.dictionary === 'string') {
                dict = strings.string2buf(opt.dictionary);
            } else if (toString.call(opt.dictionary) === '[object ArrayBuffer]') {
                dict = new Uint8Array(opt.dictionary);
            } else {
                dict = opt.dictionary;
            }
            status = zlib_deflate.deflateSetDictionary(this.strm, dict);
            if (status !== Z_OK) {
                throw new Error(msg[status]);
            }
            this._dict_set = true;
        }
    }
    Deflate.prototype.push = function (data, flush_mode) {
        const strm = this.strm;
        const chunkSize = this.options.chunkSize;
        let status, _flush_mode;
        if (this.ended) {
            return false;
        }
        if (flush_mode === ~~flush_mode)
            _flush_mode = flush_mode;
        else
            _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;
        if (typeof data === 'string') {
            strm.input = strings.string2buf(data);
        } else if (toString.call(data) === '[object ArrayBuffer]') {
            strm.input = new Uint8Array(data);
        } else {
            strm.input = data;
        }
        strm.next_in = 0;
        strm.avail_in = strm.input.length;
        for (;;) {
            if (strm.avail_out === 0) {
                strm.output = new Uint8Array(chunkSize);
                strm.next_out = 0;
                strm.avail_out = chunkSize;
            }
            if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
                this.onData(strm.output.subarray(0, strm.next_out));
                strm.avail_out = 0;
                continue;
            }
            status = zlib_deflate.deflate(strm, _flush_mode);
            if (status === Z_STREAM_END) {
                if (strm.next_out > 0) {
                    this.onData(strm.output.subarray(0, strm.next_out));
                }
                status = zlib_deflate.deflateEnd(this.strm);
                this.onEnd(status);
                this.ended = true;
                return status === Z_OK;
            }
            if (strm.avail_out === 0) {
                this.onData(strm.output);
                continue;
            }
            if (_flush_mode > 0 && strm.next_out > 0) {
                this.onData(strm.output.subarray(0, strm.next_out));
                strm.avail_out = 0;
                continue;
            }
            if (strm.avail_in === 0)
                break;
        }
        return true;
    };
    Deflate.prototype.onData = function (chunk) {
        this.chunks.push(chunk);
    };
    Deflate.prototype.onEnd = function (status) {
        if (status === Z_OK) {
            this.result = utils.flattenChunks(this.chunks);
        }
        this.chunks = [];
        this.err = status;
        this.msg = this.strm.msg;
    };
    function deflate(input, options) {
        const deflator = new Deflate(options);
        deflator.push(input, true);
        if (deflator.err) {
            throw deflator.msg || msg[deflator.err];
        }
        return deflator.result;
    }
    function deflateRaw(input, options) {
        options = options || {};
        options.raw = true;
        return deflate(input, options);
    }
    function gzip(input, options) {
        options = options || {};
        options.gzip = true;
        return deflate(input, options);
    }

    return {
        Deflate,
        deflate,
        deflateRaw,
        gzip,
        constants
    };

});