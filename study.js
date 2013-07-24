//Remove all white spaces at the beginning and end of the string
//From Douglas Crockford's 'Javascript: The Good Parts'
String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
};

//This is the equivalent of Python's str.split(None) method
//which has a different splitting algorithm when None is passed as a parameter.
//http://docs.python.org/library/stdtypes.html#str.split
String.prototype.pysplit = function () {
    return this.replace(/\s+/g, ' ').trim().split(' ');
};


Math.add = function (a, b) {
    return a + b;
};

Math.sub = function (a, b) {
    return a - b;
};

Math.mul = function (a, b) {
    return a * b;
};

Math.div = function (a, b) {
    return a / b;
};

Math.gt = function (a, b) {
    return a > b;
};

Math.lt = function (a, b) {
    return a < b;
};

Math.ge = function (a, b) {
    return a >= b;
};

Math.le = function (a, b) {
    return a <= b;
};

Math.eq = function (a, b) {
    return a === b;
};

Math.mod = function (a, b) {
    return a % b;
};

//################ Symbol, Procedure, Env classes
var Symbol = String;

var environment = function (spec) {
    var i, env = {}, outer = spec.outer || {};
        
    var get_outer = function () {
                return outer;
    };
        
    var find = function (variable) {
                if (env.hasOwnProperty(variable)) {
                        return env;
                } else {
            return outer.find(variable);
        }
    };
    
    if (0 !== spec.params.length) {
        for (i = 0; i < spec.params.length; i += 1) {
            env[spec.params[i]] = spec.args[i];
        }
    }

    env.get_outer = get_outer;
    env.find = find;
    
    return env;
};


var add_globals = function (env) {
    //Cannot use for..in on built-in objects like Math in JS.
    //So need to include all methods manually
    var mathMethods = ['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'random', 'round', 'sin', 'sqrt', 'tan'], i;

    for (i = 0; i < mathMethods.length; i += 1) {
        env[mathMethods[i]] = Math[mathMethods[i]];
    }
    env['+'] = Math.add;
    env['-'] = Math.sub;
    env['*'] = Math.mul;
    env['/'] = Math.div;
    env['>'] = Math.gt;
    env['<'] = Math.lt;
    env['>='] = Math.ge;
    env['<='] = Math.le;
    env['='] = Math.eq;
        env['remainder'] = Math.mod;
    env['equal?'] = Math.eq;
    env['eq?'] = Math.eq; //'eq?':op.is_ ;Need to find Object Equality operator in JS
        env['length'] = function (x) { return x.length; };
        env['cons'] = function (x, y) { var arr = [x]; return arr.concat(y); };
    env['car'] = function (x) { return (x.length !== 0) ? x[0] : null; };
    env['cdr'] = function (x) { return (x.length > 1) ? x.slice(1) : null; }; 
        env['append'] = function (x, y) { return x.concat(y); };
    env['list'] = function () { return Array.prototype.slice.call(arguments); }; //'list':lambda *x:list(x)
        env['list?'] = function (x) { return x && typeof x === 'object' && x.constructor === Array ; }; //'list?': lambda x:isa(x,list)
        env['null?'] = function (x) { return (!x || x.length === 0); };
        env['symbol?'] = function (x) { return typeof x === 'string'; };
    return env;
};

var global_env = add_globals(environment({params: [], args: [], outer: undefined}));

//################ eval
var eval = function (x, env) {
    var i;
    env = env || global_env;

    if (typeof x === 'string') {        //variable reference
        return env.find(x.valueOf())[x.valueOf()];
    } else if (typeof x === 'number') { //constant literal
        return x;
    } else if (x[0] === 'quote') {      //(quote exp)
        return x[1];
    } else if (x[0] === 'if') {         //(if test conseq alt)
        var test = x[1];
        var conseq = x[2];
        var alt = x[3];
        if (eval(test, env)) {
            return eval(conseq, env);
        } else {
            return eval(alt, env);
        }
    } else if (x[0] === 'set!') {                       //(set! var exp)
        env.find(x[1])[x[1]] = eval(x[2], env);
    } else if (x[0] === 'define') {     //(define var exp)
        env[x[1]] = eval(x[2], env);
    } else if (x[0] === 'lambda') {     //(lambda (var*) exp)
        var vars = x[1];
        var exp = x[2];
        return function () {
                return eval(exp, environment({params: vars, args: arguments, outer: env }));
        };
    } else if (x[0] === 'begin') {      //(begin exp*)
        var val;
        for (i = 1; i < x.length; i += 1) {
            val = eval(x[i], env);
        }
        return val;
    } else {                            //(proc exp*)
        var exps = [];
        for (i = 0; i < x.length; i += 1) {
            exps[i] = eval(x[i], env);
        }
        var proc = exps.shift();
        return proc.apply(env, exps);
    }
};


//################ parse, read, and user interaction
var atom = function (token) {
    if (isNaN(token)) {
                return token;
    } else {
                return +token; //Cast to number. Nice trick from Douglas Crockford's Javascript: The Good Parts
    }
};

var tokenize = function (s) {
    return s.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').pysplit();
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

var read = function (s) {
    return read_from(tokenize(s));
};

var parse = read;

var to_string = function (exp) {
};

var debug = function (s) {
    try {
                document.getElementById('debugdiv').innerHTML = eval(parse(s));
    } catch (e) {
                document.getElementById('debugdiv').innerHTML = e.name + ': ' + e.message;
    }
};