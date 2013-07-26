(function(window,undefined){
    var Scheme = function(){};
    Scheme = {
        parse:function (str) {
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
        },

        environment:function (spec) {
            //spec = {params: [], args: [], outer: undefined}
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
        },

        add_globals:function (env) {
            //Cannot use for..in on built-in objects like Math in JS.
            //So need to include all methods manually
            var mathMethods = ['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'random', 'round', 'sin', 'sqrt', 'tan'], i;

            for (i = 0; i < mathMethods.length; i += 1) {
                env[mathMethods[i]] = Math[mathMethods[i]];
            }
            env['+'] = function(a,b){return a+b;};
            env['-'] = function(a,b){return a-b;};
            env['*'] = function(a,b){return a*b;};
            env['/'] = function(a,b){return a/b;};
            env['>'] = function(a,b){return a>b;};
            env['<'] = function(a,b){return a<b;};
            env['>='] = function(a,b){return a>=b;};
            env['<='] = function(a,b){return a<=b;};
            env['='] = function(a,b){return a===b;};
            env['remainder'] = function(a,b){return a%b;};
            env['equal?'] = function(a,b){return a===b;};
            env['eq?'] = function(a,b){return a===b;}; //'eq?':op.is_ ;Need to find Object Equality operator in JS
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
        },

        eval:function (x, env) {
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
                if (arguments.callee(test, env)) {
                    return arguments.callee(conseq, env);
                } else {
                    return arguments.callee(alt, env);
                }
            } else if (x[0] === 'set!') {                       //(set! var exp)
                env.find(x[1])[x[1]] = arguments.callee(x[2], env);
            } else if (x[0] === 'define') {     //(define var exp)
                env[x[1]] = arguments.callee(x[2], env);
            } else if (x[0] === 'lambda') {     //(lambda (var*) exp)
                var vars = x[1];
                var exp = x[2];
                return function () {
                        return arguments.callee(exp, environment({params: vars, args: arguments, outer: env }));
                };
            } else if (x[0] === 'begin') {      //(begin exp*)
                var val;
                for (i = 1; i < x.length; i += 1) {
                    val = arguments.callee(x[i], env);
                }
                return val;
            } else {                            //(proc exp*)
                var exps = [];
                for (i = 0; i < x.length; i += 1) {
                    exps[i] = arguments.callee(x[i], env);
                }
                var proc = exps.shift();
                return proc.apply(env, exps);
            }
        }
    };

    Scheme.global_env = Scheme.add_globals(Scheme.environment({params: [], args: [], outer: undefined}))
    return window.Scheme = Scheme;
})(window)