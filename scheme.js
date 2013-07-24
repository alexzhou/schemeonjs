var Scheme = {};
Scheme.parse = function (str) {
    var tokens = str.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ') //括号两侧加上空格
        .replace(/\s+/g, ' ')//多余空格替换成一个空格
        .replace(/^\s+|\s+$/g, '')//字符串两端的空格去掉
        .split(' ');//用空格分隔字符串

    var atom = function (token) {
        if (isNaN(token)) {
                    return token;
        } else {
                    return +token; //Cast to number. Nice trick from Douglas Crockford's Javascript: The Good Parts
        }
    };

    var read_from = function (tokens) {
        if (0 === tokens.length) {
                    throw {
                            name: 'SyntaxError',
                            message: 'unexpected EOF while reading'
                    };
            }
        var token = tokens.shift();
        if ('(' === token) {
                    var L = [];
            while (')' !== tokens[0]) {
                L.push(read_from(tokens));
            }
            tokens.shift(); // pop off ')'
            return L;
        } else {
                    if (')' === token) {
                            throw {
                                    name: 'SyntaxError',
                                    message: 'unexpected )'
                            };
                    } else {
                            return atom(token);
                    }
        }
    };

    return read_from(tokens);
}