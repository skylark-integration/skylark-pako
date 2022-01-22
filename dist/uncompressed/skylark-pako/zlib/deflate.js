define([
    './trees',
    './adler32',
    './crc32',
    './messages',
    './constants'
], function (trees, adler32, crc32, msg, constants) {
    'use strict';


    const {_tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align} = trees;
    const {Z_NO_FLUSH, Z_PARTIAL_FLUSH, Z_FULL_FLUSH, Z_FINISH, Z_BLOCK, Z_OK, Z_STREAM_END, Z_STREAM_ERROR, Z_DATA_ERROR, Z_BUF_ERROR, Z_DEFAULT_COMPRESSION, Z_FILTERED, Z_HUFFMAN_ONLY, Z_RLE, Z_FIXED, Z_DEFAULT_STRATEGY, Z_UNKNOWN, Z_DEFLATED} = __module__4;

    const MAX_MEM_LEVEL = 9;
    const MAX_WBITS = 15;
    const DEF_MEM_LEVEL = 8;
    const LENGTH_CODES = 29;
    const LITERALS = 256;
    const L_CODES = LITERALS + 1 + LENGTH_CODES;
    const D_CODES = 30;
    const BL_CODES = 19;
    const HEAP_SIZE = 2 * L_CODES + 1;
    const MAX_BITS = 15;
    const MIN_MATCH = 3;
    const MAX_MATCH = 258;
    const MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
    const PRESET_DICT = 32;
    const INIT_STATE = 42;
    const EXTRA_STATE = 69;
    const NAME_STATE = 73;
    const COMMENT_STATE = 91;
    const HCRC_STATE = 103;
    const BUSY_STATE = 113;
    const FINISH_STATE = 666;
    const BS_NEED_MORE = 1;
    const BS_BLOCK_DONE = 2;
    const BS_FINISH_STARTED = 3;
    const BS_FINISH_DONE = 4;
    const OS_CODE = 3;
    const err = (strm, errorCode) => {
        strm.msg = msg[errorCode];
        return errorCode;
    };
    const rank = f => {
        return (f << 1) - (f > 4 ? 9 : 0);
    };
    const zero = buf => {
        let len = buf.length;
        while (--len >= 0) {
            buf[len] = 0;
        }
    };
    let HASH_ZLIB = (s, prev, data) => (prev << s.hash_shift ^ data) & s.hash_mask;
    let HASH = HASH_ZLIB;
    const flush_pending = strm => {
        const s = strm.state;
        let len = s.pending;
        if (len > strm.avail_out) {
            len = strm.avail_out;
        }
        if (len === 0) {
            return;
        }
        strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
        strm.next_out += len;
        s.pending_out += len;
        strm.total_out += len;
        strm.avail_out -= len;
        s.pending -= len;
        if (s.pending === 0) {
            s.pending_out = 0;
        }
    };
    const flush_block_only = (s, last) => {
        _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
        s.block_start = s.strstart;
        flush_pending(s.strm);
    };
    const put_byte = (s, b) => {
        s.pending_buf[s.pending++] = b;
    };
    const putShortMSB = (s, b) => {
        s.pending_buf[s.pending++] = b >>> 8 & 255;
        s.pending_buf[s.pending++] = b & 255;
    };
    const read_buf = (strm, buf, start, size) => {
        let len = strm.avail_in;
        if (len > size) {
            len = size;
        }
        if (len === 0) {
            return 0;
        }
        strm.avail_in -= len;
        buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
        if (strm.state.wrap === 1) {
            strm.adler = adler32(strm.adler, buf, len, start);
        } else if (strm.state.wrap === 2) {
            strm.adler = crc32(strm.adler, buf, len, start);
        }
        strm.next_in += len;
        strm.total_in += len;
        return len;
    };
    const longest_match = (s, cur_match) => {
        let chain_length = s.max_chain_length;
        let scan = s.strstart;
        let match;
        let len;
        let best_len = s.prev_length;
        let nice_match = s.nice_match;
        const limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
        const _win = s.window;
        const wmask = s.w_mask;
        const prev = s.prev;
        const strend = s.strstart + MAX_MATCH;
        let scan_end1 = _win[scan + best_len - 1];
        let scan_end = _win[scan + best_len];
        if (s.prev_length >= s.good_match) {
            chain_length >>= 2;
        }
        if (nice_match > s.lookahead) {
            nice_match = s.lookahead;
        }
        do {
            match = cur_match;
            if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
                continue;
            }
            scan += 2;
            match++;
            do {
            } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
            len = MAX_MATCH - (strend - scan);
            scan = strend - MAX_MATCH;
            if (len > best_len) {
                s.match_start = cur_match;
                best_len = len;
                if (len >= nice_match) {
                    break;
                }
                scan_end1 = _win[scan + best_len - 1];
                scan_end = _win[scan + best_len];
            }
        } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
        if (best_len <= s.lookahead) {
            return best_len;
        }
        return s.lookahead;
    };
    const fill_window = s => {
        const _w_size = s.w_size;
        let p, n, m, more, str;
        do {
            more = s.window_size - s.lookahead - s.strstart;
            if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
                s.window.set(s.window.subarray(_w_size, _w_size + _w_size), 0);
                s.match_start -= _w_size;
                s.strstart -= _w_size;
                s.block_start -= _w_size;
                n = s.hash_size;
                p = n;
                do {
                    m = s.head[--p];
                    s.head[p] = m >= _w_size ? m - _w_size : 0;
                } while (--n);
                n = _w_size;
                p = n;
                do {
                    m = s.prev[--p];
                    s.prev[p] = m >= _w_size ? m - _w_size : 0;
                } while (--n);
                more += _w_size;
            }
            if (s.strm.avail_in === 0) {
                break;
            }
            n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
            s.lookahead += n;
            if (s.lookahead + s.insert >= MIN_MATCH) {
                str = s.strstart - s.insert;
                s.ins_h = s.window[str];
                s.ins_h = HASH(s, s.ins_h, s.window[str + 1]);
                while (s.insert) {
                    s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
                    s.prev[str & s.w_mask] = s.head[s.ins_h];
                    s.head[s.ins_h] = str;
                    str++;
                    s.insert--;
                    if (s.lookahead + s.insert < MIN_MATCH) {
                        break;
                    }
                }
            }
        } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
    };
    const deflate_stored = (s, flush) => {
        let max_block_size = 65535;
        if (max_block_size > s.pending_buf_size - 5) {
            max_block_size = s.pending_buf_size - 5;
        }
        for (;;) {
            if (s.lookahead <= 1) {
                fill_window(s);
                if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
                    return BS_NEED_MORE;
                }
                if (s.lookahead === 0) {
                    break;
                }
            }
            s.strstart += s.lookahead;
            s.lookahead = 0;
            const max_start = s.block_start + max_block_size;
            if (s.strstart === 0 || s.strstart >= max_start) {
                s.lookahead = s.strstart - max_start;
                s.strstart = max_start;
                flush_block_only(s, false);
                if (s.strm.avail_out === 0) {
                    return BS_NEED_MORE;
                }
            }
            if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
                flush_block_only(s, false);
                if (s.strm.avail_out === 0) {
                    return BS_NEED_MORE;
                }
            }
        }
        s.insert = 0;
        if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
                return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
        }
        if (s.strstart > s.block_start) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
            }
        }
        return BS_NEED_MORE;
    };
    const deflate_fast = (s, flush) => {
        let hash_head;
        let bflush;
        for (;;) {
            if (s.lookahead < MIN_LOOKAHEAD) {
                fill_window(s);
                if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
                    return BS_NEED_MORE;
                }
                if (s.lookahead === 0) {
                    break;
                }
            }
            hash_head = 0;
            if (s.lookahead >= MIN_MATCH) {
                s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
                hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = s.strstart;
            }
            if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
                s.match_length = longest_match(s, hash_head);
            }
            if (s.match_length >= MIN_MATCH) {
                bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
                s.lookahead -= s.match_length;
                if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
                    s.match_length--;
                    do {
                        s.strstart++;
                        s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
                        hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                        s.head[s.ins_h] = s.strstart;
                    } while (--s.match_length !== 0);
                    s.strstart++;
                } else {
                    s.strstart += s.match_length;
                    s.match_length = 0;
                    s.ins_h = s.window[s.strstart];
                    s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);
                }
            } else {
                bflush = _tr_tally(s, 0, s.window[s.strstart]);
                s.lookahead--;
                s.strstart++;
            }
            if (bflush) {
                flush_block_only(s, false);
                if (s.strm.avail_out === 0) {
                    return BS_NEED_MORE;
                }
            }
        }
        s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
        if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
                return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
        }
        if (s.last_lit) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
            }
        }
        return BS_BLOCK_DONE;
    };
    const deflate_slow = (s, flush) => {
        let hash_head;
        let bflush;
        let max_insert;
        for (;;) {
            if (s.lookahead < MIN_LOOKAHEAD) {
                fill_window(s);
                if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
                    return BS_NEED_MORE;
                }
                if (s.lookahead === 0) {
                    break;
                }
            }
            hash_head = 0;
            if (s.lookahead >= MIN_MATCH) {
                s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
                hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = s.strstart;
            }
            s.prev_length = s.match_length;
            s.prev_match = s.match_start;
            s.match_length = MIN_MATCH - 1;
            if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
                s.match_length = longest_match(s, hash_head);
                if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
                    s.match_length = MIN_MATCH - 1;
                }
            }
            if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
                max_insert = s.strstart + s.lookahead - MIN_MATCH;
                bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
                s.lookahead -= s.prev_length - 1;
                s.prev_length -= 2;
                do {
                    if (++s.strstart <= max_insert) {
                        s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
                        hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                        s.head[s.ins_h] = s.strstart;
                    }
                } while (--s.prev_length !== 0);
                s.match_available = 0;
                s.match_length = MIN_MATCH - 1;
                s.strstart++;
                if (bflush) {
                    flush_block_only(s, false);
                    if (s.strm.avail_out === 0) {
                        return BS_NEED_MORE;
                    }
                }
            } else if (s.match_available) {
                bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
                if (bflush) {
                    flush_block_only(s, false);
                }
                s.strstart++;
                s.lookahead--;
                if (s.strm.avail_out === 0) {
                    return BS_NEED_MORE;
                }
            } else {
                s.match_available = 1;
                s.strstart++;
                s.lookahead--;
            }
        }
        if (s.match_available) {
            bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
            s.match_available = 0;
        }
        s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
        if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
                return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
        }
        if (s.last_lit) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
            }
        }
        return BS_BLOCK_DONE;
    };
    const deflate_rle = (s, flush) => {
        let bflush;
        let prev;
        let scan, strend;
        const _win = s.window;
        for (;;) {
            if (s.lookahead <= MAX_MATCH) {
                fill_window(s);
                if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
                    return BS_NEED_MORE;
                }
                if (s.lookahead === 0) {
                    break;
                }
            }
            s.match_length = 0;
            if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
                scan = s.strstart - 1;
                prev = _win[scan];
                if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
                    strend = s.strstart + MAX_MATCH;
                    do {
                    } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
                    s.match_length = MAX_MATCH - (strend - scan);
                    if (s.match_length > s.lookahead) {
                        s.match_length = s.lookahead;
                    }
                }
            }
            if (s.match_length >= MIN_MATCH) {
                bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);
                s.lookahead -= s.match_length;
                s.strstart += s.match_length;
                s.match_length = 0;
            } else {
                bflush = _tr_tally(s, 0, s.window[s.strstart]);
                s.lookahead--;
                s.strstart++;
            }
            if (bflush) {
                flush_block_only(s, false);
                if (s.strm.avail_out === 0) {
                    return BS_NEED_MORE;
                }
            }
        }
        s.insert = 0;
        if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
                return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
        }
        if (s.last_lit) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
            }
        }
        return BS_BLOCK_DONE;
    };
    const deflate_huff = (s, flush) => {
        let bflush;
        for (;;) {
            if (s.lookahead === 0) {
                fill_window(s);
                if (s.lookahead === 0) {
                    if (flush === Z_NO_FLUSH) {
                        return BS_NEED_MORE;
                    }
                    break;
                }
            }
            s.match_length = 0;
            bflush = _tr_tally(s, 0, s.window[s.strstart]);
            s.lookahead--;
            s.strstart++;
            if (bflush) {
                flush_block_only(s, false);
                if (s.strm.avail_out === 0) {
                    return BS_NEED_MORE;
                }
            }
        }
        s.insert = 0;
        if (flush === Z_FINISH) {
            flush_block_only(s, true);
            if (s.strm.avail_out === 0) {
                return BS_FINISH_STARTED;
            }
            return BS_FINISH_DONE;
        }
        if (s.last_lit) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
            }
        }
        return BS_BLOCK_DONE;
    };
    function Config(good_length, max_lazy, nice_length, max_chain, func) {
        this.good_length = good_length;
        this.max_lazy = max_lazy;
        this.nice_length = nice_length;
        this.max_chain = max_chain;
        this.func = func;
    }
    const configuration_table = [
        new Config(0, 0, 0, 0, deflate_stored),
        new Config(4, 4, 8, 4, deflate_fast),
        new Config(4, 5, 16, 8, deflate_fast),
        new Config(4, 6, 32, 32, deflate_fast),
        new Config(4, 4, 16, 16, deflate_slow),
        new Config(8, 16, 32, 32, deflate_slow),
        new Config(8, 16, 128, 128, deflate_slow),
        new Config(8, 32, 128, 256, deflate_slow),
        new Config(32, 128, 258, 1024, deflate_slow),
        new Config(32, 258, 258, 4096, deflate_slow)
    ];
    const lm_init = s => {
        s.window_size = 2 * s.w_size;
        zero(s.head);
        s.max_lazy_match = configuration_table[s.level].max_lazy;
        s.good_match = configuration_table[s.level].good_length;
        s.nice_match = configuration_table[s.level].nice_length;
        s.max_chain_length = configuration_table[s.level].max_chain;
        s.strstart = 0;
        s.block_start = 0;
        s.lookahead = 0;
        s.insert = 0;
        s.match_length = s.prev_length = MIN_MATCH - 1;
        s.match_available = 0;
        s.ins_h = 0;
    };
    function DeflateState() {
        this.strm = null;
        this.status = 0;
        this.pending_buf = null;
        this.pending_buf_size = 0;
        this.pending_out = 0;
        this.pending = 0;
        this.wrap = 0;
        this.gzhead = null;
        this.gzindex = 0;
        this.method = Z_DEFLATED;
        this.last_flush = -1;
        this.w_size = 0;
        this.w_bits = 0;
        this.w_mask = 0;
        this.window = null;
        this.window_size = 0;
        this.prev = null;
        this.head = null;
        this.ins_h = 0;
        this.hash_size = 0;
        this.hash_bits = 0;
        this.hash_mask = 0;
        this.hash_shift = 0;
        this.block_start = 0;
        this.match_length = 0;
        this.prev_match = 0;
        this.match_available = 0;
        this.strstart = 0;
        this.match_start = 0;
        this.lookahead = 0;
        this.prev_length = 0;
        this.max_chain_length = 0;
        this.max_lazy_match = 0;
        this.level = 0;
        this.strategy = 0;
        this.good_match = 0;
        this.nice_match = 0;
        this.dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
        this.dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
        this.bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
        zero(this.dyn_ltree);
        zero(this.dyn_dtree);
        zero(this.bl_tree);
        this.l_desc = null;
        this.d_desc = null;
        this.bl_desc = null;
        this.bl_count = new Uint16Array(MAX_BITS + 1);
        this.heap = new Uint16Array(2 * L_CODES + 1);
        zero(this.heap);
        this.heap_len = 0;
        this.heap_max = 0;
        this.depth = new Uint16Array(2 * L_CODES + 1);
        zero(this.depth);
        this.l_buf = 0;
        this.lit_bufsize = 0;
        this.last_lit = 0;
        this.d_buf = 0;
        this.opt_len = 0;
        this.static_len = 0;
        this.matches = 0;
        this.insert = 0;
        this.bi_buf = 0;
        this.bi_valid = 0;
    }
    const deflateResetKeep = strm => {
        if (!strm || !strm.state) {
            return err(strm, Z_STREAM_ERROR);
        }
        strm.total_in = strm.total_out = 0;
        strm.data_type = Z_UNKNOWN;
        const s = strm.state;
        s.pending = 0;
        s.pending_out = 0;
        if (s.wrap < 0) {
            s.wrap = -s.wrap;
        }
        s.status = s.wrap ? INIT_STATE : BUSY_STATE;
        strm.adler = s.wrap === 2 ? 0 : 1;
        s.last_flush = Z_NO_FLUSH;
        _tr_init(s);
        return Z_OK;
    };
    const deflateReset = strm => {
        const ret = deflateResetKeep(strm);
        if (ret === Z_OK) {
            lm_init(strm.state);
        }
        return ret;
    };
    const deflateSetHeader = (strm, head) => {
        if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
        }
        if (strm.state.wrap !== 2) {
            return Z_STREAM_ERROR;
        }
        strm.state.gzhead = head;
        return Z_OK;
    };
    const deflateInit2 = (strm, level, method, windowBits, memLevel, strategy) => {
        if (!strm) {
            return Z_STREAM_ERROR;
        }
        let wrap = 1;
        if (level === Z_DEFAULT_COMPRESSION) {
            level = 6;
        }
        if (windowBits < 0) {
            wrap = 0;
            windowBits = -windowBits;
        } else if (windowBits > 15) {
            wrap = 2;
            windowBits -= 16;
        }
        if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) {
            return err(strm, Z_STREAM_ERROR);
        }
        if (windowBits === 8) {
            windowBits = 9;
        }
        const s = new DeflateState();
        strm.state = s;
        s.strm = strm;
        s.wrap = wrap;
        s.gzhead = null;
        s.w_bits = windowBits;
        s.w_size = 1 << s.w_bits;
        s.w_mask = s.w_size - 1;
        s.hash_bits = memLevel + 7;
        s.hash_size = 1 << s.hash_bits;
        s.hash_mask = s.hash_size - 1;
        s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
        s.window = new Uint8Array(s.w_size * 2);
        s.head = new Uint16Array(s.hash_size);
        s.prev = new Uint16Array(s.w_size);
        s.lit_bufsize = 1 << memLevel + 6;
        s.pending_buf_size = s.lit_bufsize * 4;
        s.pending_buf = new Uint8Array(s.pending_buf_size);
        s.d_buf = 1 * s.lit_bufsize;
        s.l_buf = (1 + 2) * s.lit_bufsize;
        s.level = level;
        s.strategy = strategy;
        s.method = method;
        return deflateReset(strm);
    };
    const deflateInit = (strm, level) => {
        return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
    };
    const deflate = (strm, flush) => {
        let beg, val;
        if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) {
            return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
        }
        const s = strm.state;
        if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH) {
            return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
        }
        s.strm = strm;
        const old_flush = s.last_flush;
        s.last_flush = flush;
        if (s.status === INIT_STATE) {
            if (s.wrap === 2) {
                strm.adler = 0;
                put_byte(s, 31);
                put_byte(s, 139);
                put_byte(s, 8);
                if (!s.gzhead) {
                    put_byte(s, 0);
                    put_byte(s, 0);
                    put_byte(s, 0);
                    put_byte(s, 0);
                    put_byte(s, 0);
                    put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
                    put_byte(s, OS_CODE);
                    s.status = BUSY_STATE;
                } else {
                    put_byte(s, (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16));
                    put_byte(s, s.gzhead.time & 255);
                    put_byte(s, s.gzhead.time >> 8 & 255);
                    put_byte(s, s.gzhead.time >> 16 & 255);
                    put_byte(s, s.gzhead.time >> 24 & 255);
                    put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
                    put_byte(s, s.gzhead.os & 255);
                    if (s.gzhead.extra && s.gzhead.extra.length) {
                        put_byte(s, s.gzhead.extra.length & 255);
                        put_byte(s, s.gzhead.extra.length >> 8 & 255);
                    }
                    if (s.gzhead.hcrc) {
                        strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
                    }
                    s.gzindex = 0;
                    s.status = EXTRA_STATE;
                }
            } else {
                let header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
                let level_flags = -1;
                if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
                    level_flags = 0;
                } else if (s.level < 6) {
                    level_flags = 1;
                } else if (s.level === 6) {
                    level_flags = 2;
                } else {
                    level_flags = 3;
                }
                header |= level_flags << 6;
                if (s.strstart !== 0) {
                    header |= PRESET_DICT;
                }
                header += 31 - header % 31;
                s.status = BUSY_STATE;
                putShortMSB(s, header);
                if (s.strstart !== 0) {
                    putShortMSB(s, strm.adler >>> 16);
                    putShortMSB(s, strm.adler & 65535);
                }
                strm.adler = 1;
            }
        }
        if (s.status === EXTRA_STATE) {
            if (s.gzhead.extra) {
                beg = s.pending;
                while (s.gzindex < (s.gzhead.extra.length & 65535)) {
                    if (s.pending === s.pending_buf_size) {
                        if (s.gzhead.hcrc && s.pending > beg) {
                            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                        }
                        flush_pending(strm);
                        beg = s.pending;
                        if (s.pending === s.pending_buf_size) {
                            break;
                        }
                    }
                    put_byte(s, s.gzhead.extra[s.gzindex] & 255);
                    s.gzindex++;
                }
                if (s.gzhead.hcrc && s.pending > beg) {
                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                if (s.gzindex === s.gzhead.extra.length) {
                    s.gzindex = 0;
                    s.status = NAME_STATE;
                }
            } else {
                s.status = NAME_STATE;
            }
        }
        if (s.status === NAME_STATE) {
            if (s.gzhead.name) {
                beg = s.pending;
                do {
                    if (s.pending === s.pending_buf_size) {
                        if (s.gzhead.hcrc && s.pending > beg) {
                            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                        }
                        flush_pending(strm);
                        beg = s.pending;
                        if (s.pending === s.pending_buf_size) {
                            val = 1;
                            break;
                        }
                    }
                    if (s.gzindex < s.gzhead.name.length) {
                        val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
                    } else {
                        val = 0;
                    }
                    put_byte(s, val);
                } while (val !== 0);
                if (s.gzhead.hcrc && s.pending > beg) {
                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                if (val === 0) {
                    s.gzindex = 0;
                    s.status = COMMENT_STATE;
                }
            } else {
                s.status = COMMENT_STATE;
            }
        }
        if (s.status === COMMENT_STATE) {
            if (s.gzhead.comment) {
                beg = s.pending;
                do {
                    if (s.pending === s.pending_buf_size) {
                        if (s.gzhead.hcrc && s.pending > beg) {
                            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                        }
                        flush_pending(strm);
                        beg = s.pending;
                        if (s.pending === s.pending_buf_size) {
                            val = 1;
                            break;
                        }
                    }
                    if (s.gzindex < s.gzhead.comment.length) {
                        val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
                    } else {
                        val = 0;
                    }
                    put_byte(s, val);
                } while (val !== 0);
                if (s.gzhead.hcrc && s.pending > beg) {
                    strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                if (val === 0) {
                    s.status = HCRC_STATE;
                }
            } else {
                s.status = HCRC_STATE;
            }
        }
        if (s.status === HCRC_STATE) {
            if (s.gzhead.hcrc) {
                if (s.pending + 2 > s.pending_buf_size) {
                    flush_pending(strm);
                }
                if (s.pending + 2 <= s.pending_buf_size) {
                    put_byte(s, strm.adler & 255);
                    put_byte(s, strm.adler >> 8 & 255);
                    strm.adler = 0;
                    s.status = BUSY_STATE;
                }
            } else {
                s.status = BUSY_STATE;
            }
        }
        if (s.pending !== 0) {
            flush_pending(strm);
            if (strm.avail_out === 0) {
                s.last_flush = -1;
                return Z_OK;
            }
        } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) {
            return err(strm, Z_BUF_ERROR);
        }
        if (s.status === FINISH_STATE && strm.avail_in !== 0) {
            return err(strm, Z_BUF_ERROR);
        }
        if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
            let bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
            if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
                s.status = FINISH_STATE;
            }
            if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
                if (strm.avail_out === 0) {
                    s.last_flush = -1;
                }
                return Z_OK;
            }
            if (bstate === BS_BLOCK_DONE) {
                if (flush === Z_PARTIAL_FLUSH) {
                    _tr_align(s);
                } else if (flush !== Z_BLOCK) {
                    _tr_stored_block(s, 0, 0, false);
                    if (flush === Z_FULL_FLUSH) {
                        zero(s.head);
                        if (s.lookahead === 0) {
                            s.strstart = 0;
                            s.block_start = 0;
                            s.insert = 0;
                        }
                    }
                }
                flush_pending(strm);
                if (strm.avail_out === 0) {
                    s.last_flush = -1;
                    return Z_OK;
                }
            }
        }
        if (flush !== Z_FINISH) {
            return Z_OK;
        }
        if (s.wrap <= 0) {
            return Z_STREAM_END;
        }
        if (s.wrap === 2) {
            put_byte(s, strm.adler & 255);
            put_byte(s, strm.adler >> 8 & 255);
            put_byte(s, strm.adler >> 16 & 255);
            put_byte(s, strm.adler >> 24 & 255);
            put_byte(s, strm.total_in & 255);
            put_byte(s, strm.total_in >> 8 & 255);
            put_byte(s, strm.total_in >> 16 & 255);
            put_byte(s, strm.total_in >> 24 & 255);
        } else {
            putShortMSB(s, strm.adler >>> 16);
            putShortMSB(s, strm.adler & 65535);
        }
        flush_pending(strm);
        if (s.wrap > 0) {
            s.wrap = -s.wrap;
        }
        return s.pending !== 0 ? Z_OK : Z_STREAM_END;
    };
    const deflateEnd = strm => {
        if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
        }
        const status = strm.state.status;
        if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) {
            return err(strm, Z_STREAM_ERROR);
        }
        strm.state = null;
        return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
    };
    const deflateSetDictionary = (strm, dictionary) => {
        let dictLength = dictionary.length;
        if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
        }
        const s = strm.state;
        const wrap = s.wrap;
        if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
            return Z_STREAM_ERROR;
        }
        if (wrap === 1) {
            strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
        }
        s.wrap = 0;
        if (dictLength >= s.w_size) {
            if (wrap === 0) {
                zero(s.head);
                s.strstart = 0;
                s.block_start = 0;
                s.insert = 0;
            }
            let tmpDict = new Uint8Array(s.w_size);
            tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
            dictionary = tmpDict;
            dictLength = s.w_size;
        }
        const avail = strm.avail_in;
        const next = strm.next_in;
        const input = strm.input;
        strm.avail_in = dictLength;
        strm.next_in = 0;
        strm.input = dictionary;
        fill_window(s);
        while (s.lookahead >= MIN_MATCH) {
            let str = s.strstart;
            let n = s.lookahead - (MIN_MATCH - 1);
            do {
                s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
                s.prev[str & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = str;
                str++;
            } while (--n);
            s.strstart = str;
            s.lookahead = MIN_MATCH - 1;
            fill_window(s);
        }
        s.strstart += s.lookahead;
        s.block_start = s.strstart;
        s.insert = s.lookahead;
        s.lookahead = 0;
        s.match_length = s.prev_length = MIN_MATCH - 1;
        s.match_available = 0;
        strm.next_in = next;
        strm.input = input;
        strm.avail_in = avail;
        s.wrap = wrap;
        return Z_OK;
    };

    return {
      deflateInit,
      deflateInit2,
      deflateReset,
      deflateResetKeep,
      deflateSetHeader,
      deflate,
      deflateEnd,
      deflateSetDictionary,
      deflateInfo : 'pako deflate (from Nodeca project)'
    };

});