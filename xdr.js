// Lots of code from http://jsfromhell.com/classes/binary-parser
//    Jonas Raoni Soares Silva
//    http://jsfromhell.com/classes/binary-parser [v1.0]


var END_OF_SEQUENCE = '\xa5\x00\x00\x00';
var START_OF_SEQUENCE = '\x5a\x00\x00\x00';


function dapUnpacker(xdrdata, dapvar) {
    this._buf = xdrdata;
    this.dapvar = dapvar;

    this._pos = 0;

    this.getValue = function() {
        var i = this._pos;
        var type = this.dapvar.type.toLowerCase();

        if (type == 'structure' || type == 'dataset') {
            var out = [], tmp;
            dapvar = this.dapvar;
            for (child in dapvar) {
                if (dapvar[child].type) {
                    this.dapvar = dapvar[child];
                    tmp = this.getValue();
                    out.push(tmp);
                }
            }
            this.dapvar = dapvar;
            return out;

        } else if (type == 'grid') {
            var out = [], tmp;
            dapvar = this.dapvar;
            
            this.dapvar = dapvar.array;
            tmp = this.getValue();
            out.push(tmp);

            for (map in dapvar.maps) {
                this.dapvar = dapvar.maps[map];
                tmp = this.getValue();
                out.push(tmp);
            }

            this.dapvar = dapvar;
            return out;

        } else if (type == 'sequence') {
            var mark = this._unpack_uint32();
            var out = [], struct, tmp;
            dapvar = this.dapvar;
            while (mark != 2768240640) {
                struct = [];
                for (child in dapvar) {
                    if (dapvar[child].type) {
                        this.dapvar = dapvar[child];
                        tmp = this.getValue();
                        struct.push(tmp);
                    }
                }
                out.push(struct);
                mark = this._unpack_uint32();
            }
            this.dapvar = dapvar;
            return out;
        // This is a request for a base type variable inside a
        // sequence.
        } else if (this._buf.slice(i, i+4) == START_OF_SEQUENCE) {
            var mark = this._unpack_uint32();
            var out = [], tmp;
            while (mark != 2768240640) {
                tmp = this.getValue();
                out.push(tmp);
                mark = this._unpack_uint32();
            }
            return out;
        }

        var n = 1;
        if (this.dapvar.shape.length) {
            n = this._unpack_uint32();
            if (type != 'url' && type != 'string') {
                this._unpack_uint32();
            }
        }

        // Bytes?
        var out;
        if (type == 'byte') {
            out = this._unpack_bytes(n);
        // String?
        } else if (type == 'url' || type == 'string') {
            out = this._unpack_string(n);
        } else {
            out = [];
            var func;
            switch (type) {
                case 'float32': func = '_unpack_float32'; break;
                case 'float64': func = '_unpack_float64'; break;
                case 'int'    : func = '_unpack_int32'; break;
                case 'uint'   : func = '_unpack_uint32'; break;
                case 'int16'  : func = '_unpack_int16'; break;
                case 'uint16' : func = '_unpack_uint16'; break;
                case 'int32'  : func = '_unpack_int32'; break;
                case 'uint32' : func = '_unpack_uint32'; break;
            }
            for (var i=0; i<n; i++) {
                out.push(this[func]());
            }
        }

        if (this.dapvar.shape) {
            out = reshape(out, this.dapvar.shape);
        } else {
            out = out[0];
        }
        
        return out;
    };

    this._unpack_byte = function() {
        var bytes = 1;
        var signed = false;

        var i = this._pos;
        this._pos = i+bytes;
        data = this._buf.slice(i, i+bytes);
        return decodeInt(data, bytes, signed);
    };

    this._unpack_uint16 = function() {
        var bytes = 4;
        var signed = false;

        var i = this._pos;
        this._pos = i+bytes;
        data = this._buf.slice(i, i+bytes);
        return decodeInt(data, bytes, signed);
    };

    this._unpack_uint32 = function() {
        var bytes = 4;
        var signed = false;

        var i = this._pos;
        this._pos = i+bytes;
        data = this._buf.slice(i, i+bytes);
        return decodeInt(data, bytes, signed);
    };

    this._unpack_int16 = function() {
        var bytes = 4;
        var signed = true;

        var i = this._pos;
        this._pos = i+bytes;
        data = this._buf.slice(i, i+bytes);
        return decodeInt(data, bytes, signed);
    };

    this._unpack_int32 = function() {
        var bytes = 4;
        var signed = true;

        var i = this._pos;
        this._pos = i+bytes;
        data = this._buf.slice(i, i+bytes);
        return decodeInt(data, bytes, signed);
    };

    this._unpack_float32 = function() {
        var precision = 23;
        var exponent = 8;
        var bytes = 4;

        var i = this._pos;
        this._pos = i+bytes;
        data = this._buf.slice(i, i+bytes);
        return decodeFloat(data, precision, exponent);
    };
 
    this._unpack_float64 = function() {
        var precision = 52;
        var exponent = 11;
        var bytes = 8;

        var i = this._pos;
        this._pos = i+bytes;
        data = this._buf.slice(i, i+bytes);
        return decodeFloat(data, precision, exponent);
    };

    this._unpack_bytes = function(count) {
        var i = this._pos;
        var out = [];
        for (var c=0; c<count; c++) {
            out.push(this._unpack_byte());
        }
        var padding = (4 - (count % 4)) % 4;
        this._pos = i + count + padding;
        
        return out;
    };

    this._unpack_string = function(count) {
        var out = [];
        var n, i, j;
        for (var c=0; c<count; c++) {
            n = this._unpack_uint32();
            i = this._pos;
            data = this._buf.slice(i, i+n);

            padding = (4 - (n % 4)) % 4;
            this._pos = i + n + padding;

            // convert back to string
            var str = '';
            for (var i=0; i<n; i++) {
                str += String.fromCharCode(data[i]);
            }
            out.push(str);
        }
        
        return out;
    };
}


function reshape(array, shape) {
    if (!shape.length) return array[0];
    var out = [];
    var size, start, stop;
    for (var i=0; i<shape[0]; i++) {
        size = array.length / shape[0];
        start = i * size;
        stop = start + size;
        out.push(reshape(array.slice(start, stop), shape.slice(1)));
    }
    return out;
}


function shl(a, b){
    for(++b; --b; a = ((a %= 0x7fffffff + 1) & 0x40000000) == 0x40000000 ? a * 2 : (a - 0x40000000) * 2 + 0x7fffffff + 1);
    return a;
}


function readBits(buffer, start, length) {
    if (start < 0 || length <= 0) return 0;

    for(var offsetLeft, offsetRight = start % 8, curByte = buffer.length - (start >> 3) - 1,
        lastByte = buffer.length + (-(start + length) >> 3), diff = curByte - lastByte,
        sum = ((buffer[ curByte ] >> offsetRight) & ((1 << (diff ? 8 - offsetRight : length)) - 1))
        + (diff && (offsetLeft = (start + length) % 8) ? (buffer[ lastByte++ ] & ((1 << offsetLeft) - 1))
        << (diff-- << 3) - offsetRight : 0); diff; sum += shl(buffer[ lastByte++ ], (diff-- << 3) - offsetRight));
    return sum;
}


function getBuffer(data) {
    var b = new Array(data.length);
    for (var i=0; i<data.length; i++) {
        b[i] = data.charCodeAt(i) & 0xff;
    }
    return b;
}


function decodeInt(data, bytes, signed) {
    var x = readBits(data, 0, bytes*8);
    var max = Math.pow(2, bytes*8);
    var integer;
    if (signed && x >= (max / 2)) {
        integer = x - max;
    } else {
        integer = x;
    }
    return integer; 
}


function decodeFloat(buffer, precisionBits, exponentBits) {
    var buffer = data;

    var bias = Math.pow(2, exponentBits - 1) - 1;
    var signal = readBits(buffer, precisionBits + exponentBits, 1);
    var exponent = readBits(buffer, precisionBits, exponentBits);
    var significand = 0;
    var divisor = 2;
    var curByte = buffer.length + (-precisionBits >> 3) - 1;
    var byteValue, startBit, mask;

    do
        for(byteValue = buffer[ ++curByte ], startBit = precisionBits % 8 || 8, mask = 1 << startBit;
            mask >>= 1; (byteValue & mask) && (significand += 1 / divisor), divisor *= 2);
    while (precisionBits -= startBit);

    return exponent == (bias << 1) + 1 ? significand ? NaN : signal ? -Infinity : +Infinity
        : (1 + signal * -2) * (exponent || significand ? !exponent ? Math.pow(2, -bias + 1) * significand
        : Math.pow(2, exponent - bias) * (1 + significand) : 0);
}


exports.getBuffer = getBuffer;
exports.dapUnpacker = dapUnpacker;
