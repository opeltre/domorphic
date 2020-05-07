(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dom = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
let __ = require('./src/__'),
    record = require('./src/record'),
    nd = require('./src/nd_array'),
    getset = require('./src/getset'),
    alg = require('./src/alg/index'),
    top = require('./src/top/index');

module.exports = Object.assign(__, {
    record: record.new,
    r: record,
    nd,
    getset,
    alg, 
    top
});

},{"./src/__":2,"./src/alg/index":6,"./src/getset":8,"./src/nd_array":9,"./src/record":10,"./src/top/index":13}],2:[function(require,module,exports){
/*** __ ***/

//------ monad: composition and chains ------

let __ = 
    (f, ...fs) =>  __.pipe(
        typeof f !== 'function' ? () => f : f,
        ...fs
    )

__.return = 
    x => () => x;

__.pipe = 
    (f=__.id, ...fs) => fs.length
        ? (...xs) =>  __.pipe(...fs)(f(...xs))
        : (...xs) => f(...xs);

__.do = 
    (f=__.id, ...fs) => fs.length
        ? __.pipe(__.do(f), __.do(...fs))
        : x => {f(x); return x} 


//------ pull-back and push-forward ------

__.pull = 
    (...gs) => f => __.pipe(...gs, f);

__.push = 
    (...fs) => f => __.pipe(f, ...fs);


//------ argument application -------

__.$ = 
    (...xs) => f => f(...xs);

__.xargs =
    f => xs => f(...xs);

__.bindl = 
    x => f => (...xs) => f(x, ...xs);

__.bindr = 
    y => f => (...xs) => f(...xs, y);


//------ logic ------

__.null = 
    () => {};

__.id =
    x => x;

__.not = 
    b => !b;

__.if = 
    (f, g, h) => 

        (...xs) => f(...xs) ? g(...xs) : h(...xs);


//------- arrays -------------

__.range =
    n => [...Array(n).keys()];

__.linspace = 
    (t0, t1, n=20) => __.range(n)
        .map(t => t * (t1 - t0) / (n - 1));

__.concat = 
    (as, bs) => [...as, ...bs];
     
__.map = 
    (...fs) => 
        arr => Array.isArray(arr)
            ? arr.map(__.pipe(...fs))
            : __.pipe(...fs)(arr);

__.map2 = 
    (...fs) => 
        (as, bs) => as.map((ai, i) => __.pipe(...fs)(ai, bs[i], i));

__.apply = 
    fs => (...xs) => __.map(__.$(...xs))(fs);

__.filter = 
    f => arr => arr.filter(f);

__.reduce = 
    f => arr => arr.reduce(f);


//--------- z z z -----------------

__.sleep = 
    ms => new Promise(then => setTimeout(then, ms));

__.log = 
    x => {console.log(x); return x};

__.logs = 
    str => 
        x => {__.log(str || 'logs:'); return  __.log(x)};


//------ node exports ------

if (typeof module !== 'undefined')
    module.exports = __;

},{}],3:[function(require,module,exports){
let __ = require('../__'),
    Tensor = require('./tensor');

//------ complex casting ------

let C =
    (x, y) => typeof x === 'number'
        ? ({ Re: x, Im: y || 0 })
        : x

//------ complex field ------

C.i = C(0,1);

let Re = z => typeof z === 'number' ? z : z.Re,
    Im = z => typeof z === 'number' ? 0 : z.Im;

let add = 
    (a, b) => C(
        Re(a) + Re(b),
        Im(a) + Im(b)
    );

let mult = 
    (a, b) => C(
        Re(a) * Re(b) - Im(a) * Im(b),
        Re(a) * Im(b) + Im(a) * Re(b)
    );

let bar     = z => C(Re(z), -Im(z)),
    abs2    = z => Re(z)**2 + Im(z)**2,
    abs     = z => Math.sqrt(abs2(z)),
    inv     = z => mult(C(1 / abs2(z)), bar(z)),
    zero    = _ => C(0),
    unit    = _ => C(1);

Object.assign(C, 
    { add, mult, inv, zero, unit },
    { Im, Re, bar, abs }
);


//------ complex ND-arrays ------

let _C = Tensor(C);


//------ polar coordinates, exp and log  ------

let sign = t => Math.sign(t) || 1;

let phase = 
    z => Re(z) === 0 
        ? Math.sign(Im(z)) * (Math.PI / 2)
        : Math.atan(Im(z) / Re(z)) -
                (Re(z) > 0 ? 0 : sign(Im(z)) * Math.PI);

let expi = 
    t => C(Math.cos(t), Math.sin(t));

_C.exp = 
    _C.map( 
        z => mult(
            C(Math.exp(Re(z))), 
            expi(Im(z))
        )
    );

_C.log = 
    _C.map(
        z => C(Math.log(abs(z)), phase(z))
    );

_C.phase    = _C.map(phase);
_C.expi     = _C.map(expi);
_C.i        = C.i;

module.exports = _C;

},{"../__":2,"./tensor":7}],4:[function(require,module,exports){
let __ = require('../__'),
    Tensor = require('./tensor');

//------ real ND-arrays ------

let _R = Tensor();


//------ exp_ and _log ------

let exp_ = x => Math.exp(-x),
    _log = x => - Math.log(x);

_R.exp_ = _R.map(exp_);
_R._log = _R.map(_log);

_R.free = 
    __.pipe(
        _R.exp_,
        _R.int,
        _log
    );

_R.eff = 
    (is, js) => __.pipe(
        _R.exp_,
        _R.project(is, js),
        _R._log
    );


//------ numerically stable free energy ? ------ 

_R.max = _R.reduce(Math.max);
_R.min = _R.reduce(Math.min);

_R.freeE =
    H => {
        let m = _R.min(H),
            H_m = _R.map(h => h - m)(H);
        return m + _log(_R.int(_R.exp_(H_m)));
    };

_R.gibbs =
    H => {
        let F = _R.freeE(H),
            H_F = _R.map(h => h - F)(H)

        return _R.exp_(H_F);
    }; 

_R.effE = 
    (is, js) => 
        H => {
            let m = _R.min(H),
                H_m = _R.map(h => h - m)(H),
                sum = _R.project(is, js),
                eff_m = _R._log(sum(_R.exp_(H_m)));

            return _R.map(h => h + m)(eff_m);
        };

module.exports = _R;

},{"../__":2,"./tensor":7}],5:[function(require,module,exports){
/*  The Fast Fourier Transform `divide and conquer' scheme 
 *  is canonically adapted for computing Fourier transforms 
 *  on a product set. 
 *  
 *  Example
 *  -------
 *  Compare the product set {1...N1} x {1...N2} with {1...N1*N2}. 
 *  Letting:
 *      - x = x1    + N1*x2
 *      - y ⁼ N2*y1 + y2 
 *  And denoting phases by:
 *      - phi   = 2 pi x*y / N1*N2
 *      - phi1  = 2 pi x1*y1 / N1
 *      - phi2  = 2 pi x2*y2 / N2
 *  One does get `phi = phi1 + phi2' in R mod (2 pi).
 *  
 *  Conclusion
 *  ----------
 *  FFT should be implemented here.
 *  It consists of computing N1 FFTs of size N2, 
 *  before computing N2 FFTs of size N1. 
 *  Note recursion. 
 */

let __ = require('../__'),
    _R = require('./R'),
    _C = require('./C');

//------ (slow) Fourier transform ------

let Fourier = 

    u => {

        let dims = _C.shape(u),
            e_i = _F.waves(dims),
            norm = Math.sqrt(_C.size(u));

        let Fu = 
            k => _C.scale(1 / norm)(_C.inner(e_i(k), u))

        return _C.compute(dims)(Fu);

    };

let _F = 
    u => Array.isArray(u)
        ? Fourier(_C(u))
        : u;

_F.bar = 
    __.pipe(_C.reverse, _F);


//------ spectral domain [ 0, 2 pi [ ------

_F.circle = 
    N => __.range(N).map(
        n => 2 * n * Math.PI / N
    );

_F.compute = 
    Ns => _C.compute(Ns.map(_F.circle));


//------ plane waves Fourier basis ------

_F.waves = 
    Ns => k => _F.compute(Ns)(
        x => _C.expi(_R.inner(k, x))
    );


//====== Fast Fourier Transform ======

//------ FT along first slice ------

let F0 = 
    
    u => { 

        let dims = _C.shape(u),
            [N, ...Ns] = dims,
            [i, ...is] = __.range(dims.length);

        let vec = k => [k, ...Ns.map(_ => 0)]
            e_i = k => _F.waves([N, ...Ns])(vec(k));

        let sum = _C.project([i, ...is], is),
            scale = _C.scale(1 / Math.sqrt(N));

        return __.range(N).map(
            k => scale(sum(_C.mult(e_i(k), u)))
        );

    };

_F.slice = 
    u => _C.shape(u).length ? F0(u) : u;


//------ FFT ------

let fft = 
    u => _C.shape(u).length
        ? _F.slice(u.map(v => fft(v)))  
        : u;

_F.fft = 
    __.pipe(_C, fft);

_F.ifft = 
    __.pipe(_C.reverse, _F.fft);


module.exports = _F

},{"../__":2,"./C":3,"./R":4}],6:[function(require,module,exports){
let R = require('./R'),
    C = require('./C'),
    tensor = require('./tensor'),
    fourier = require('./fourier');

module.exports = {R, C, tensor, fourier}; 

},{"./C":3,"./R":4,"./fourier":5,"./tensor":7}],7:[function(require,module,exports){
let __ = require('../__'),
    ND = require('../nd_array'),
    {cell} = require('../top/id');
    
let record = require('../record');

module.exports = Tensor;

function Tensor(K={}) {
//  Create the ND-algebra type instance of tensors over the field K.

    //====== inherit from ND type instance ======
    let nd = ND();
    //------ cast scalars to K ------
    let toK = typeof K === 'function' 
            ? K
            : __.id;
    let _K = nd.mapN(toK);
    record.assign(nd)(_K);


    //====== K-tensors ======

    //------ field methods ------
    let add     = K.add     || ((a, b) => a + b),
        mult    = K.mult    || ((a, b) => a * b),
        inv     = K.inv     || (a => 1 / a),
        zero    = K.zero    || (_ => toK(0)),
        unit    = K.unit    || (_ => toK(1)),
        abs     = K.abs     || Math.abs;


    //------ linear structure ------

    _K.add2 = 
        _K.map2(add);

    _K.add = 
        (...as) => as.reduce(_K.add2);

    _K.scale = 
        z => _K.map(a => mult(toK(z), a));

    _K.minus = 
        _K.scale(-1);

    _K.subt = 
        (a, b) => _K.add(a, _K.minus(b));

    _K.span = 
        (ks, as) => _K.add(
            as.map((a, i) => _K.scale(ks[i])(a))
        );

    _K.zero = 
        (Ns) => _K.compute(Ns)(zero);


    //------ ring structure ------

    _K.mult =
        _K.map2(mult);

    _K.unit = 
        (Ns) => _K.compute(Ns)(unit);


    //------ multiplicative group ------

    _K.inv = 
        _K.map(inv);

    _K.div = 
        (a, b) => _K.mult(a, _K.inv(b));

    //------ complex / quaternionic operations ------

    if (K.bar) 
        _K.bar = _K.map(K.bar);

    if (K.Re) 
        _K.Re = _K.map(K.Re);

    if (K.Im)
        _K.Im = _K.map(K.Im);


    //------ integration and inner product ------

    _K.int = _K.reduce(_K.add);

    _K.mean = 
        u => mult(_K.int(u), toK(1 / _K.size(u)));

    _K.inner = 
        K.bar
            ? __.pipe(
                (a, b) => _K.mult(_K.bar(a), b),
                _K.int
            )
            : __.pipe(_K.mult, _K.int);

    _K.abs = 
        _K.map(abs);

    _K.norm = 
        a => Math.sqrt((K.Re || __.id)(
            _K.inner(a, a)
        ));



    //------ adjoint extension and projection ------

    let extend = 
        ([i, ...is], [j, ...js], [E, ...Es]) => 
            q => typeof i === 'undefined' 
                ? q 
                : (i === j 
                    ? q.map(_K.extend(is, js, Es))
                    : E.map(
                        _ => _K.extend(is, [j, ...js], Es)(q)
                    )
                );

    let project = 
        ([i, ...is], [j, ...js]) => 
            q => typeof(i) === 'undefined'
                ? q
                : ( i === j 
                    ? __.map(_K.project(is, js))(q)
                    : _K.project(is, [j, ...js])(q.reduce(_K.add2))
                );

    let indices = js => 
        Array.isArray(js) 
            ? js
            : js.split('.').filter(j => j !== '');

    _K.project = 
        (a, b) => project(...[a, b].map(indices));

    _K.extend = 
        (a, b, Es) => extend(...[a, b].map(indices), Es);

    return _K;

}



Tensor.functor = function (E, K) {
//  Return the two-sided functor K^E:
//      E : I -> [num] describes the possible states of each coordinate. 

    let _K = Tensor(K); 

    //------ compute, shapes given by E ------
    let compute = _K.compute,
        Es = is => cell(is).map(E);

    _K.compute = 
        is => compute(Es(is));

    //------ functorial maps ------
    _K.func = 
        (is, js) => _K.project(is, js);

    _K.cofunc = 
        (is, js) => _K.extend(is, js, Es(is));

    return _K;

}

},{"../__":2,"../nd_array":9,"../record":10,"../top/id":12}],8:[function(require,module,exports){
let __ = require('./__'),
    _r = require('./record');

/*------ Chainable getter-setters ------

    This module assigns convenience accessor methods to an object `my`,
    keeping references to an internal state object `attrs`. 
    
    getset : a -> {s} -> {?s -> St({s}, s | a)}

        where a.method  : ?s -> St({s}, s | a) 
                        : [get] _ -> St({s}, s)   
                        : [set] s -> St({s}, a)   
*/

let getset =  
    (my, attrs, types={}) => {

        let records = types.records || [],
            arrays = types.arrays || [],
            apply = types.apply || [];

        _r.forEach(
            (_, n) => {my[n] = getset.method(my, n, attrs)}
        )(attrs);

        records.forEach(n => {my[n] = getset.recordMethod(my, n, attrs)});

        arrays.forEach(n => {my[n] = getset.arrayMethod(my, n, attrs)});

        apply.forEach(n => {my[n] = getset.applyMethod(my, n, attrs)});
        
        return my;
    }

//------ attrs[name] : s ------
getset.method = (my, name, attrs) => {
    return function (x) {
        if (!arguments.length)
            return attrs[name];
        attrs[name] = x;
        return my;
    };
}

//------ attrs[name] : s = {s'} ------
getset.recordMethod = (my, name, attrs) => {
    return function (x, y) {
        if (!arguments.length) 
            return attrs[name];
        else if (typeof x === 'string' && arguments.length === 1)
            return attrs[name][x];
        else if (typeof x === 'string' && arguments.length === 2)
            attrs[name][x] = y;
        else 
            attrs[name] = x;
        return my;
    }
};

//------ attrs[name] : s = [s'] ------
getset.arrayMethod = function (my, name, attrs) {
    return function (x, y) {
        if (typeof x === 'undefined')
            return attrs[name];
        if (Array.isArray(x))
            attrs[name] = x;
        else if (x === '...')
            attrs[name] = [...attrs[name], x, ...y];
        else if (typeof x === 'number') 
            attrs[name][i] = y
        return my;
    }
}

//------ attrs[name] : s = attrs ?-> s' ------
getset.applyMethod = function (my, name, attrs) {
    return function (x) {
        if (!arguments.length) 
            return attrs[name];
        attrs[name] = __(x)(attrs);
        return my;
    }
};

module.exports = getset;


},{"./__":2,"./record":10}],9:[function(require,module,exports){
let __ = require('./__');

function ND() {
//  Create an instance of the ND-array type class. 

    let my = {};

    //------ nd-array properties ------

    my.shape = 
        q => Array.isArray(q)
            ? [q.length, ...my.shape(q[0])]
            : [];
    
    my.size = 
        u => my.shape(u).reduce((n, m) => n * m, 1);

    //------ nd-array transformation ------

    my.map = f => 
        p => Array.isArray(p)
            ? p.map(my.map(f))
            : f(p);

    my.map2 = f => 
        (p, q) => Array.isArray(p)
            ? p.map((_, i) => my.map2(f)(p[i], q[i]))
            : f(p, q);

    my.mapN = f => 
        (...ps) => Array.isArray(ps[0])
            ? ps[0].map(
                (_, i) => my.mapN(f)(...ps.map(p => p[i]))
            )
            : f(...ps);

    my.reduce = f => 
        p => Array.isArray(p)
            ? p.reduce(
                (pi, pj) => f(
                    my.reduce(f)(pi), 
                    my.reduce(f)(pj)
                )
            )
            : p;
    
    //------ initialise from callable ------

    let compute = ([E, ...Es]) => 
        f => typeof(E) === 'undefined'
            ? f()
            : E.map(
                x => compute(Es)((...xs) => f(...[x, ...xs]))
            );

    let states = 
        E => Array.isArray(E) ? E : __.range(E)

    my.compute = 
        Es => compute(Es.map(states))

    //------ access values ------
    
    my.get = ([k, ...ks]) =>
        p => Array.isArray(p) 
            ? my.get(ks)(p[k])
            : p;

    //------ compose with: x => - x -----

    let minus = 
        (N, i) => (N - i) % N 

    my.reverse = 
        p => Array.isArray(p) 
            ? p.map(
                (_, i) => p[minus(p.length, i)].map(my.reverse)
            )
            : p;

    return my;
}

module.exports = ND; 

},{"./__":2}],10:[function(require,module,exports){
let __ = require('./__');

let _r = Record();
    _r.new = Record;

module.exports = _r;

/*------ Records ------

Note: operations could be made chainable:

    let f = _r()
        .map((v, k) => f(v, k))
        .set(k1, v1)
        .set(k2, v2)

    let r1 = f(r0);

This would be a nice balance for the necessity 
to pass the record at the end 
*/

function Record () {

    let my = {};

    //------ record properties ------

    //.keys : {a} -> [str] 
    my.keys = 
        r => Object.keys(r);

    //.isEmpty : {a} -> bool
    my.isEmpty =
        r => my.keys(r).length > 0
    
    //.null : [str] -> {null} 
    my.null = 
        ks => my.fromPairs(ks.map(k => [null, k]));


    //------ record access ------
    
    //.get : str -> {a} -> a
    my.get = 
        k => r => r[k];

    //.pluck : ...[str] -> {a} -> {a}
    my.pluck = 
        (...ks) => 
            r => my.fromPairs(
                ks.map(k => [r[k], k])
            );

    //.without : ...[str] -> {a} -> {a}
    my.without = 
        (...ks) => __.pipe(
            ...ks.map(k => my.filter((rj, j) => j !== k))
        );


    //------ record update ------

    //.set : str -> a -> {a} -> {a}
    my.set = 
        (k, v) => r => my.write(k, v)(my.assign(r)({}));
    
    //.update : {a} -> {a} -> {a}
    my.update = 
        (...rs) => r => my.assign(r, ...rs)({});

    //.write : str -> a -> St({a}, {a})
    my.write = 
        (k, v) => r => {r[k] = v; return r}; 

    //.assign : str -> a -> St({a}, {a})
    my.assign = 
        (...rs) => r => Object.assign(r, ...rs);


    //------ sequential updates ------

    //         : {a -> b} -> {a} -> {b} 
    my.stream = 
        rf => typeof rf === 'function'
            ? r => rf(r)
            : r => my.map(f => __(f)(r))(rf);

    let stream = 
        rf => typeof rf === 'function'
            ? r => my.update(rf(r))(r)
            : r => my.update(
                my.map(v => __(v)(r))(rf)
            )(r);

    //.streamline : ...[{a -> a}] -> {a} -> {a}  
    my.streamline = 
        (...rfs) => __.pipe(...rfs.map(stream));

    
    //------ record iteration ------

    //.forEach : (a -> _) -> {a} -> Iter(a)
    my.forEach = 
        f => 
            r => my.keys(r).forEach(
                k => f(r[k], k)
            );
    
    //.reduce : ((a -> b), b) -> {a} -> b
    my.reduce = 
        (f, r) => q => 
            my.keys(q).reduce(
                (a, k) => f(a, q[k], k),
                typeof r !== 'undefined' ? r : {}
            );


    //------ record transformation ------
    
    //.apply : {a -> b} -> a -> {b} 
    my.apply = 
        r_f => 
            (...xs) => my.map(__.$(...xs))(r_f);

    //.map : (a -> b) -> {a} -> {b} 
    my.map = 
        (...fs) => q => 
            my.reduce(
                (r, qk, k) => __.do(_ => r[k] = __.pipe(...fs)(qk, k))(r),
                {}
            )(q);

    //.map2 : (a -> b -> c) -> {a} -> {b} -> {c}
    my.map2 = 
        f => 
            (r, q) => my.map(
                (rk, k) => f(rk, q[k], k)
            )(r);

    //.filter : (a -> bool) -> {a} -> {a} 
    my.filter = 
        f => r => {
            let sub = {};
            my.forEach((v, k) => f(v, k) && (sub[k] = v))(r);
            return sub;
        };


    //------ store function values ------
    
    //.compute : (a -> b, a -> str) -> a -> {b}
    my.compute = 
        (f=__.id, g=__.id) => __.pipe(
            __.map((...xs) => [f(...xs), g(...xs)]),
            my.fromPairs 
        );
 

    //------ key-value pairs ------

    //.toPairs : {a} -> [(a, str)]
    my.toPairs = 
        r => {
            let pairs = [];
            my.forEach(
                (rk, k) => pairs.push([rk, k])
            )(r);
            return pairs;
        };
    
    //.fromPairs : [(a, str)] -> {a} 
    my.fromPairs = 
        pairs => {
            let r = {};
            (pairs || []).forEach(
                ([rk, k]) => r[k] = rk
            );
            return r;
        };

    return my;
}

},{"./__":2}],11:[function(require,module,exports){
let __ = require('../__'),
    Nerve = require('./nerve'),
    set = require('./set'),
    record = require('../record'),
    {chain, cell} = require('./id');

//------ extend a functor `G: X -> Ab' to `NX' ------
/*
    instance G : (X => Ab) 
    where
        G.func :    (a > b) -> G a -> G b
        G.zero :    a -> G a 
        G.add :     G a -> G a -> G a
        G.scale :   num -> G a -> G a

    ------ natural transformations ------

    complex :   (X => Ab)   =>  (NX => Ab)*
                (X => Ab)*  =>  (NX => Ab)
                (X =<> Ab)  =>  (NX =<> Ab)
*/


module.exports = function (G, X) {

    let N = Nerve(X),
        NG = baseSpace(G, N); 

    if (G. func) 
        NG = cochainComplex(G, N, NG);

    if (G.cofunc)
        NG = chainComplex(G, N, NG);

    return NG;
}


//------ (X => Ab) -> (NX => Ab)* ------

function baseSpace (G, N) {

    let NG = record.new();

    let compute = NG.compute;

    NG.compute = 
        k => f => compute(
            f, 
            a => chain.id(a)
        )(N(k));

    NG.zero = 
        k => NG.compute(k)(
            a => G.zero(chain.cell(a))
        );

    NG.add2 = 
        NG.map2(G.add2);
    
    NG.add = 
        (...us) => us.reduce(NG.add2);

    NG.subt = 
        (u, v) => NG.add(u, NG.scale(-1)(v));

    NG.mult = 
        (...us) => us.reduce(NG.map2(
            (ua, va, a) => G.mult(ua, va)
        ));

    NG.scale = 
        s => NG.map(G.scale(s));

    NG.int = 
        NG.reduce((x, y) => x + y, 0);

    NG.inner =
       (u, v) => NG.int(NG.map2(G.inner)(u, v));

    NG.norm = 
        u => Math.sqrt(NG.inner(u, u));

    NG.get = 
        (u, a) => u[chain.id(a)];

    NG.set = 
        (u, a, ua) => { 
            u[chain.id(a)] = ua; 
            return u;
        };

    return NG;
}


//------ (X => Ab) -> Ch* ------

function cochainComplex (G, N, NG) {

    if (!NG) 
        NG = baseSpace(G, N);

    NG.cofunc = 
        (a, b) => G.func(chain.cell(b), chain.cell(a));


    NG.diff = 
        k => 
            u => __.range(k + 2)
                .map(j => NG.coface(j, k)(u))
                .reduce(NG.add2);

    NG.coface = 
        (j, k) => 
            u => NG.map(__.pipe(
                (_, a) => chain(a),
                a => [a, N.face(j)(a)],
                ([a, b]) => NG.cofunc(a, b)(u[chain.id(b)]),
                va => G.scale((-1)**j)(va)
            ))(NG.zero(k + 1));

    return NG;
}


//------ (X => Ab)* -> Ch ------

function chainComplex (G, N, NG) {

    if (!NG) 
        NG = baseSpace(G, N);

    NG.func = 
        (a, b) => G.cofunc(chain.cell(b), chain.cell(a));

    NG.face = 
        (j, k) => 
            u => NG.map(__.pipe(
                (_, b) => N.cofaces(j)(chain(b))
                    .map(a => NG.func(a, b)(u[chain.id(a)]))
                    .reduce(G.add2, G.zero(b)),
                vb => G.scale((-1)**j)(vb)
            ))(NG.zero(k - 1));

    NG.codiff = 
        k => 
            u => __.range(k + 1)
                .map(j => NG.face(j, k)(u))
                .reduce(NG.add2);

    //------ combinatorics ------

    let iprod = 
        a0 => u => as => u([a0, ...as]); 

    let zeta = 
        k => u => k === 0
            ? __.pipe(
                chain, 
                ([a]) => N
                    .cone(a)
                    .map(b => G.cofunc(a, b)(u([b])))
                    .reduce(G.add2) 
            )
            : __.pipe(
                chain,
                ([a0, a1, ...as]) => N
                    .intercone(a0, a1)
                    .map(b0 => zeta(k-1)(iprod(b0)(u))([a1, ...as]))
                    .reduce(G.add2)
            );

    NG.zeta = 
        k => u => NG.compute(k)(
            zeta(k)(as => u[chain.id(as)] || G.zero(as[as.length - 1]))
        );
    
    let last = 
        as => as[as.length - 1];

    let nu = 
        (a0, k) => v => k === 0
            ? ([]) => N
                .cone(a0)
                .map(b => G.cofunc(a0, b)(
                    G.scale(N.mu(a0, b))(v([b]))
                ))
                .reduce(G.add2)
            : (as) => N
                .intercone(a0, as[0])
                .map(b0 => G.cofunc(last(as), set.cap(b0, last(as)))(
                    G.scale(N.mu(a0, b0))(
                        v([a0, ...as].map(aj => set.cap(b0, aj)))
                    )
                ))
                .reduce(G.add2);

    NG.mu = 
        k => v => NG.compute(k)(
            __.pipe(
                chain, 
                as => as.reduce(
                    (u, aj, j) => nu(aj, k - j)(u),
                    bs => v[chain.id(bs)] || G.zero(bs[bs.length - 1]) 
                )([])
            )
        );

    return NG;

}

},{"../__":2,"../record":10,"./id":12,"./nerve":14,"./set":15}],12:[function(require,module,exports){
let __ = require('../__');

//------ cell ------

//       : str -> [I] 
let cell = 
    is => Array.isArray(is) 
        ? is 
        : is.split('.').filter(s => s!== '');

//      : [I] -> str
cell.id =  
    is => Array.isArray(is) 
        ? is.join('.') 
        : is;


//------ chain ------

//        : str -> [[I]]
let chain = 
    as => Array.isArray(as) 
        ? as 
        : as.split(' > ').map(cell);

//       : [[I]] -> str
chain.id =
    as => Array.isArray(as) 
        ? as.map(cell.id).join(' > ') 
        : as;

//         : [[I]] -> [I] 
chain.cell = 
    __.pipe(chain, ch => ch[ch.length - 1]);


//-------
module.exports = {cell, chain};

},{"../__":2}],13:[function(require,module,exports){
let set = require('./set'),
    nerve = require('./nerve'),
    complex = require('./complex'),
    id = require('./id');

module.exports = {set, nerve, complex, id};

},{"./complex":11,"./id":12,"./nerve":14,"./set":15}],14:[function(require,module,exports){
let __ = require('../__'),
    S = require('./set'),
    id = require('./id');

let {cell, chain} = id;


//------ Nerve type class ------ 

function Nerve (X) { 

    let N = 
        k => Ns[k] || [];
    
    let N0 = X.map(a => [a]),
        Ns = chains([N0]);

    N.face = 
        k => 
            as => [...as.slice(0, k), ...as.slice(k + 1)];

    N.cofaces = 
        k => 
            as => N(as.length)
                .filter(bs => S.eq(N.face(k)(bs), as));


    N.cone = 
        a => [a, ...X.filter(b => S.sup(a, b))]

    N.cocone = 
        b => [b, ...X.filter(a => S.sup(a, b))]

    N.intercone = 
        (a, c) => X.filter(b => S.geq(a, b) && !S.geq(c, b));

    N.interval = 
        (a, c) => X.filter(b => S.sup(a, b) && S.sup(b, c));

    N.mu = 
        (a, c) => S.eq(a, c)
            ? 1
            : [a, ...N.interval(a, c)]
                .map(b => - N.mu(a, b))
                .reduce((x, y) => x + y);


    return N;
}



//------ Nerve with cones & intervals in memory ------

Nerve.record = function (X) {

    let N = Nerve(X),
        _r = __.record();

    let cones = _r.compute(N.cone, cell.id)(X),
        cocones = _r.compute(N.cocone, cell.id)(X),
        intervals = _r.compute(__.xargs(N.interval), chain.id)(N(1)),
        intercones = _r.compute(__.xargs(N.intercone), chain.id)(N(1));
        
    let mu = _r.compute(__.xargs(N.mu), chain.id)([...X.map(a => [a, a]), ...N(1)]);

    N.cone = a => cones[cell.id(a)];
    N.cocone = b => cocones[cell.id(b)];
    N.interval = (a, c) => intervals[chain.id([a, c])];
    N.intercone = (a, c) => intercones[chain.id([a, c])];

    N.mu = (a, c) => mu[chain.id([a, c])];

    N.cofaces =  
        k => 
            bs => {
                let n = bs.length; 
                if ((k < 0) || (k > n)) {
                    return [];
                }
                else if (n === 0) {
                    return X.map(a => [a])
                } 
                else if (k === 0) {
                    return N.cocone(bs[0]).slice(1)
                        .map(a => [a, ...bs]);
                }
                else if (k === n) {
                    return N.cone(bs[n - 1]).slice(1)
                        .map(c => [...bs, c]);
                }
                else {
                    return N.interval(bs[k - 1], bs[k])
                        .map(b => [...bs.slice(0, k), b, ...bs.slice(k)]);
                }
            }

    return N;

}


module.exports = 
    __.pipe(
        __.map(cell),
        Nerve.record
    );


//-------- compute the nerve -------

function chains (N) {

    return N[N.length - 1].length 
        ? chains([
            ...N, 
            N[N.length - 1]
                .map(
                    as => N[0]
                        .filter(([b]) => S.sup(as[as.length - 1], b))
                        .map(([b]) => [...as, b])
                )
                .reduce((xs, ys) => [...xs, ...ys])
        ])
        : N.slice(0, N.length - 1);
};

},{"../__":2,"./id":12,"./set":15}],15:[function(require,module,exports){
let __ = require('../__');


//------ cast to set: filter and order ------

let S =
    ([i, ...is], ord) => typeof i !== 'undefined' 
        ? S.cup(S(is), [i], ord) 
        : [];


//------ equality ------

let arrEq = 
    ([i, ...is], [j, ...js]) => S.eq(i, j)
        ? (is.length || js.length ? arrEq(is, js) : true)
        : false;

S.eq = 
    (a, b) => Array.isArray(a) && Array.isArray(b)
        ? arrEq(a, b)
        : a === b;


//------ membership ------

S.in = 
    (i, [j, ...js]) => typeof j !== 'undefined'
        ? (S.eq(i, j) ? true : S.in(i, js))
        : false;


//------ boolean algebra ------

S.cap = 
    (a, b) => a.filter(i => S.in(i, b));

S.cup = 
    (a, b, ord) => [...a, ...b.filter(j => !S.in(j, a))]
        .sort(ord);

S.diff = 
    (a, b) => a.filter(i => !S.in(i, b));


//------ order relations --------

S.leq = 
    (a, b) => S.eq(a, S.cap(a,b));

S.geq = 
    (a, b) => S.eq(S.cap(a,b), b);

S.sub = 
    (a, b) => S.leq(a, b) && !S.eq(a, b);

S.sup = 
    (a, b) => S.geq(a, b) && !S.eq(a, b);


//------ cap-closure ------

S.closure = 
    op => as => as.length
        ? [ 
            ...as,
            ...S.closure(op)(S(
                __.logs('closure:')(
                as
                    .map(
                        (a, i) => as.slice(i+1)
                            .map(b => op(a, b))
                            .filter(c => ! S.in(c, as))
                    )
                    .reduce((xs, ys) => [...xs, ...ys])
                )
            ))
        ]
        : [];

S.capClosure = S.closure(S.cap);

module.exports = S;

},{"../__":2}],16:[function(require,module,exports){
let dom = require('./src/dom'),
    IO = require('./src/io'),
    app = require('./src/update'),
    state = require('./src/state');

module.exports = Object.assign(dom, 
    {IO},
    {state},
    {app},
);

},{"./src/dom":19,"./src/io":21,"./src/state":23,"./src/update":25}],17:[function(require,module,exports){
module.exports = DOM;

let tree = require('./tree'),
    IO = require('./io'),
    __ = require('lolo'),
    _r = __.r;

//------ DOM Nodes ------

// .tree : Tree(Data) -> T(Node)
DOM.tree = (TD, io=IO()) => {
    let TN = tree.map(D => DOM.unit(D, io))(TD);
    return tree.nat(DOM.link)(TN);
}

//  .link : (Node -> [T(Node)]) -> T(Node)
DOM.link = (N, B) => {
    B.forEach(Ni => N.appendChild(Ni));
    return N;
};

//  .unit : (Data, IO e) -> Node
DOM.unit = (D, io=IO()) => { 

    let N = D.svg
        ? io.doc.createElementNS(SVG.NS, D.tag)
        : io.doc.createElement(D.tag);

    D.tag === 'svg' && SVG(N);
    DOM.set(N, D); 

    let addListener = 
        (v, k) => N.addEventListener(k, __.bindr(io)(v));
    _r.forEach(addListener)(D.on);

    D.place && io.keep(D.place, N);
    return D.push ? D.push(N, io) : N;
}

DOM.set = (n, d) => {
    _r.assign(d.style)(n.style);
    _r.forEach((v, k) => n[k] = v)(d.prop);
    _r.forEach(DOM.setAttribute(n))(d.attr);
    n.classname = d.class;
    n.innerHTML = d.html;
    n.value = d.value;
    return n;
}

DOM.setAttribute = n => (v, k) => 
    n instanceof SVGElement 
        ? n.setAttributeNS(null, k, v)
        : n.setAttribute(k, v);

//------ SVG ------

function SVG (node) {
    node.setAttributeNS(
        "http://www.w3.org/2000/xmlns/", 
        "xmlns:xlink", 
        "http://www.w3.org/1999/xlink"
    );
}

SVG.NS = "http://www.w3.org/2000/svg";

//------ Document ------

function DOM () {
    //--- Browser ---
    if (typeof window !== 'undefined')
        return window.document;
    //--- Mock ---
    function createElement (tag) {
        let my = {tag, branch: []};
        my.appendChild = elem => my.branch.push(elem);
        my.setAttribute = __.null;
        my.setAttributeNS = __.null;
        my.addEventListener = __.null;
        my.remove = __.null;
        my.replaceWith = __.null;
        return my;
    };
    return {
        createElement, 
        createElementNS: (_, tag) => createElement(tag)
    };
}

},{"./io":21,"./tree":24,"lolo":1}],18:[function(require,module,exports){
let __ = require('lolo'),
    _r = __.record(),
    tree = require('./tree');

/*------ Node Data ------

    Convert a record of model-dependent attributes
    to a model-dependent record of attributes. 

    This is done in a similar fashion as: 

        _r.apply : {m -> a} -> m -> {a}

    Except we are rather dealing with the union type:

        m ?-> a :: a || m -> a 

    And `a` itself may be of the form `{m ?-> a}`. 

    N.B. The following is esoteric. 
    The `__` operator acts either as unit or identity:

        __ : (m ?-> a) -> m -> a

    And `__` also acts as composition: 

        __ : ((a -> b), ..., (c -> d)) -> (a -> d)

    Composable functions forming chains in the nerve `N(T)` 
    of the category of types `T`, 
    `__` maps `N_k(T)` onto `N_1(T)` for all integer `k`. 
*/ 

let data = {};

//  data(m) :: {m ?-> a}
data.types = {
    tag:    'm?a',
    svg:    'm?a',
    attr:   'm?{m?a}', 
    prop:   'm?{m?a}',
    style:  'm?{m?a}',
    on:     'm?{e(m)}',
    html:   'm?a',
    value:  'm?a',
    class:  'm?a',
    place:  'm?a',
    put:    'm?a',
    push:   'f(n,m)'
};

data.maps = {
    'm?a':      __.id,
//              {m ?-> a} -> m -> {a}
    'm?{m?a}':  __(_r.map(v => __(v)), _r.apply),
//              {l} -> m -> {l(-, m)}
    'm?{e(m)}': listeners => M => _r.map(__.bindr(M))(listeners),
//              f -> m -> f(-, m)
    'f(n,m)':   f => M => __.bindr(M)(f)
};

/*  ---->   crooked!    */ 

//  .apply : data(m) -> m -> data
data.apply = 
    D => M => {
        let D1 = _r.map(
//          (m ?-> d(m)) -> m -> m ?-> d 
            (Dk, k) => __(Dk, data.maps[data.types[k]]),
//          (m -> m ?-> d) -> m -> d
            Dk => M => __(Dk(M))(M)
        )(D);
        D1.push = data.maps['f(n,m)'](D.push);
        return _r.apply(D1)(M);
    };


//------ Propagated Attributes ------

//          : data -> data -> data
let linkSvg = 
    D => Di => D.tag === 'svg' || D.tag === 'g'
        ? _r.assign({svg: true})(Di)
        : Di;

//          : data -> data -> data
let linkDoc = 
    D => Di => _r.assign({doc: D.doc})(Di);

//       : data -> data -> data
let link = 
    l => __.pipe(
        ...[linkSvg, linkDoc].map(f => f(l))
    );

//  .link : data -> [tree(data)] -> tree(data)
data.link = 
    (n, b) => [
        n, 
        b.map(([ni, bi]) => [link(n)(ni), bi])
    ]

module.exports = data;

},{"./tree":24,"lolo":1}],19:[function(require,module,exports){
module.exports = dom;

let __ = require('lolo'),
    tree = require('./tree'),
    parse = require('./parse'),
    data = require('./data'),
    IO = require('./io'),
    _r = __.r;

// .apply : (m ?-> dom(m)) -> m -> dom(m)
dom.apply = 
    n => (typeof n ==='function' && ! n._domInstance)
        ? n
        : () => n;

// .tree : dom(m) -> m -> tree(data)
dom.tree = 
    t => M0 => {
        if (t._domInstance === 'pullback')
            return t.tree(M0);
        if (t._domInstance === 'pushforward')
            return t.tree(M0);
        let M1 = t.pull()(M0),
            nodeData = data.apply(t.node())(M1),
            branch = dom.apply(t.branch())(M1);
        return data.link(
            nodeData, 
            branch._domInstance === 'map'
                ? branch.trees(M1)
                : branch.map(ti => ti.tree(M1))
        );
    };

// .pull: (m -> m') -> dom(m') -> dom(m)
dom.pull = 
    g => node => {
        let my = m => node(g(m));
        my.tree = m => node.tree(g(m));
        my.data = m => node.data(g(m));
        my._domInstance = "pullback"
        return my;
    };

// .push : (Node -> Node) -> dom(m) -> dom(m) 
dom.push = 
    f => node => {
        let my = m => IO.node(my)(m);
        my.tree = m => dom.tree(my);
        my.node = m => __(node.node, _r.set('push', f))(m);
        my.data = m => __(node.data, _r.set('push', f))(m);
        my._domInstance = "pushforward";
        return my;
    }

// .pushData : (tree(data) -> tree(data)) -> dom(m) -> dom(m) 
dom.pushData = 
    f => node => {
        let my = m => IO.node(my)(m);
        my.tree = m => f(node.tree(m)); 
        my.data = m => f([node.data(m), []])[0];
        my._domInstance = "pushforward";
        return my;
    }


//------ dom(m) :: m -> node ------

function dom (t, a, b) {
        
    let {tag, attr, branch, other} = parse.args(t, a, b);

    let self = {
        // node 
        tag:        tag,
        svg:        tag === 'svg' || tag === 'g',
        attr:       attr,
        prop:       {},
        style:      {},
        on:         {},
        html:       '',
        value:      '',
        class:      '',
        // branches
        branch:     branch,
        // pull-back
        pull:       __.id,
        // push-forward
        push:       __.id,
        // IO location
        put:        'body',
        place:      null 
    };
   
    __.logs('other:')(other);
    Object.assign(self, other); 

    //  my : m -> node
    let my = m => IO.node(my)(m);
   
    //.tree : m -> tree(data)
    my.tree = dom.tree(my);

    //.node : m -> data(m)
    my.node = () => _r.without('branch', 'pull')(self);

    //.data : m -> data 
    my.data = M => __(self.pull, data.apply(my.node()))(M);

    //.append : () -> ()
    my.append = (...bs) => {
        self.branch = [...self.branch, ...bs];
        return my;
    };

    //.map : (m' -> m) -> [dom](m')
    my.map = pull => dom.map(my, pull);

    my._domInstance = 'node';

    let records = ['on', 'attr', 'style'];
    return __.getset(my, self, {records});
}



//------ map: (m -> Node) -> [m] -> [Node] ------

dom.map = function (node, pull) {
    
    let self = {
        node :  node,
        pull : pull || __.id,
    };

    let push = i => dom.pushData(
        ([d, ds]) => [
            d.place ? _r.set('place', [`[${d.place}]`, i])(d) : d,
            ds
        ]
    );
    let get = i => dom.pull(ms => ms[i])

    //  my : m -> [node] 
    let my = M => __(
        self.pull,
        __.map((mi, i) => push(i)(self.node)(mi))
    )(M);
    
    //.get : int -> [m'] -> node  
    my.get = i => __(push(i), get(i))(self.node);

    //.trees : m -> [tree(data)]
    my.trees = M => __(
        self.pull, 
        __.map((mi, i) => push(i)(self.node).tree(mi)),
    )(M);
    
    //.data : m -> data 
    my.data = M => __(
        self.pull,
        __.map((mi, i) => push(i)(self.node).data(mi)),
    )(M);

    my._domInstance = 'map';
    return __.getset(my, self);
}

dom.document = (typeof window !== 'undefined')
    ? window.document
    : IO.document();

},{"./data":18,"./io":21,"./parse":22,"./tree":24,"lolo":1}],20:[function(require,module,exports){
/*------ SVG Drag Events --- 

    Forward mouse events in viewbox coordinates. 
    
    Exposed under `IO.drag`, this function should be called upon 
    element creation as in: 
    
        let svg = dom('svg').on('load', IO.drag);

    Each SVG element may then listen to drag events, 
    exposing mouse position and movement in the event's detail. 

        let circle = dom('rect')
            .on('dragstart', () => console.log('starting to drag'))
            .on('drag', (e, io, m) => {
                let {x, y, dx, dy} = e.detail;
                console.log(`moving (${dx}, ${dy}) from (${x}, ${y})`);
            })
            .on('dragend', () => console.log('finished dragging'));

*///------

module.exports = function (svg) {

    let element = null;

    console.log('loaded')
    console.log(svg);

    svg.addEventListener('mousedown', start);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', end);
    svg.addEventListener('mouseleave', end);

    let mouse = (evt) => {
        let pos = coords(evt.clientX, evt.clientY),
            move = coords(evt.movementX, evt.movementY, 'linear');
        return {
            x:  pos.x,      y:  pos.y,
            dx: move.x,     dy: move.y
        };
    };

    let dragEvent = (name, evt) => 
        new CustomEvent(name, {
            bubbles: true,
            detail: mouse(evt) 
        });

    //--- Dispatch Drag Events --- 

    function start (evt) {
        element = evt.target;
        element.dispatchEvent(dragEvent('dragstart', evt));
    }
    function drag (evt) {
        if (element) { 
            evt.preventDefault();
            element.dispatchEvent(dragEvent('drag', evt));
        }
    }
    function end (evt) {
        if (element) 
            element.dispatchEvent(dragEvent('dragend', evt));
        element = null;
    }

    //--- Screen to Viewbox ---
    
    function point (x, y) {
        let point = svg.createSVGPoint();
        point.x = x; point.y = y;
        return point;
    }
    function coords (x, y, linear) {
        let pt = point(x, y),
            mat = svg.getScreenCTM().inverse(); 
        if (linear) {
            mat.e = 0; mat.f = 0;
        }
        return pt.matrixTransform(mat);
    }

    return svg;
}

},{}],21:[function(require,module,exports){
module.exports = IO; 

let __ = require('lolo'),
    dom = require('./dom'),
    tree = require('./tree'),
    DOM = require('./DOM'),
    drag = require('./drag');

let _r = __.r;

/*------ IO Monad ------ 

    Promise-emulated IO streams. 

*///-------------------- 

//.return : a -> IO(a)
IO.return = y => IO().push(() => y);

//.bind : IO(a) -> (a -> IO(b)) -> IO(b)
IO.bind = io => iof => io.bind(iof);

//.push : IO(a) -> (a -> b) -> IO(b)
IO.push = io => f => io.push(f);

//.document : () -> document
IO.document = () => DOM();

//------ Event Wrappers ------- 

IO.drag = __(__.log, drag); 

/*------ Output Stream ------
    
    This section pushes morphisms to model-dependent DOM operations,
    all methods having the following type: 

        IO.act : dom(m) -> m -> IO(m)

    They may then be bound to any active IO stream, which is equivalent 
    to calling the IO instance's method of the same name. 
        
        io.bind(m => IO.act(node)) 
    <=> io.act(node)

    The optional second argument `string` in `IO.act(node, string)` is 
    used either: 
        - to override `node.place` or `node.put` if `string` 
        points to a node IO stream's stack,
        - as a CSS selector to query the DOM.

*///-------------------------

//.node : dom(m) -> m -> Node
IO.node = node =>  __.pipe(dom.tree(node), DOM.tree);

IO.put = (node, k, place) => m => {
    let io = IO(),
        data = dom.tree(node)(m),
        key = k || data[0].put,
        n = DOM.tree(data, io, place);
    return io.select(key)
        .push(n0 => n0.appendChild(n))
        .return(m);
}

IO.set = (node, k) => m => {
    let io = IO(),
        data = node.data(m),
        key = k || data.place;
    return io.select(key)
        .push(n => DOM.set(n, data))
        .return(m);
};

IO.place = (node, k) => m => {
    let io = IO(),
        place = k || node.data(m).place;
    return io.select(place, strict=false)
        .bind(n => n 
            ? IO.replace(node, place)(m) 
            : IO.put(node, 0, place)(m)
        );
};

IO.replace = (node, k) => m => {
    let io = IO(),
        data = dom.tree(node)(m),
        key = k || data[0].place;
    io.select(key);
    let n1 = DOM.tree(data, io, key);
    return io.push(n0 => n0.replaceWith(n1))
        .return(m);
}

IO.remove = (node) => m => {
    let io = IO(); 
        key = node._domInstance ? node.data(m).place : node
    return io.select(key)
        .do(n => n.remove())
        .do(n => remove(io, key))
        .return(m);
};

/*--- Output operations with node maps ---

    One may associate specific keys to IO operations. 
    The `filter` argument is interpreted as either as 
    a list of circular indices `[-1, 2, 3, ...]` to 
    select from the model, or as a filtering function 
    on the model's elements: 
    
        f : [m] -> bool 

    Only those values satisfying the condition will be kept, 
    and their index passed to the IO action for proper 
    maintenance of the node register. In particular
    the `remove` action shifts all remaining nodes 
    in the register after DOM removal. 

    Assuming `nodes = node.map()`,
    
        IO.with(nodes)
            .set([0, 2, -2])
            .place([5, 6, 7])
            .remove(mi => mi.alive === false)

    is functionally equivalent to:  

        IO.map(node)
            .set(...)
            ...
*///---

let keys = filter => ms => {
    if (typeof filter === 'undefined')
        return ms.map((mi, i) => i);
    if (typeof filter === 'function') 
        return ms
            .map((mi, i) => filter(mi) ? i : false)
            .filter(j => j !== false);
    else 
        return filter
            .map(j => j % ms.length)
            .map(j => j >= 0 ? j : j + ms.length);
}

IO.map = (node, pull) => IO.with(dom.map(node, pull));

['set', 'put', 'place', 'replace', 'remove'].forEach(act => {

    IO.map[act] = (node, filter) => M => {

        let ms = node.pull()(M),
            ks = keys(filter)(ms);
        let io = ks.reduce(
            (io, j) => io
                .bind(IO[act](node.get(j))).return(ms),
            IO.return(ms)
        );
        return act === 'remove' 
            ? io.bind(IO.map['shift'](node, ks))
            : io;
    }
});

IO.map['shift'] = (node, ks) => ms => {
    let place = j => node.get(j).data(ms).place;
    return ks.map(place)
        .reduce(
            (io, k) => io.do(() => shift(io, k)), 
            IO()
        )
        .return(ms);
}

IO.with = node => {

    let actions = [],
        pull = __.id; 

    let my = M => __(pull, my.IO)(M)
    
    my.IO = M => actions
        .reduce(
            (io, [act, ...args]) => io
                .bind(IO.map[act](node, ...args)).return(M),
            IO.return(M)
        );

    ['set', 'put', 'place', 'replace', 'remove'].forEach(act => {
        my[act] = (...args) => {
            actions.push([act, ...args]);
            return my;
        }
    });

    my.pull = g => {pull = g; return my}
    return my;
};

/*------ IO instances ------

    IO streams are "alive" instances, in that they hold an
    internal state together with a running promise chain 
    whose execution starts upon creation. 

    Each stream keeps its own stack of registered DOM nodes: 

        io.stack : {Node, [Node], {Node}} 
    
    References are kept whenever the node constructor specifies 
    a `place` attribute, used as key, so that the associated 
    DOM node will be accessible for later IO operations. 
    
    Further operations may either be chained by: 
        - calling the instance's methods,
        - binding maps returning IO streams, e.g. class methods. 

    For instance: 
        io.return(12)
    <=> io.bind(() => IO.return(12))

    When binding instances, the stack of the parent IO stream 
    is passed on when spawning the child stream and recovered*
    as soon as the latter returns, in a possibly altered state.  

    Therefore keeping multiple references to a running IO stream 
    is unneccesary, and could only be done once: one may instead 
    focus on defining which operations should take place upon 
    events to close the loop! 

        //  update  : e -> s -> [IO e, s] 
        //  main    : e -> s -> IO e

        let main = e0 => s0 => {
            let [io, s1] = update(e0)(s0);
            return io.bind(e1 => main(e1)(s1));
        }
        
        //  io : IO e 
        let io = main('start')(':D');

*///-----------------------

let closed = __.logs('- io closed -');

function IO (doc) {

    let my = {},
        waiting = [],
        queue = [];

    my.doc = doc || IO.document();
    my.promise = Promise.resolve();

    my._bound_io =  null;
    my.stack =      {};
    
    //--- Monad ---

    my.return = y => my.push(() => y)

    my.bind = iof => my
        .push(x => {
            let iob = bind(my, iof(x));
            return iob.do(() => unbind(my, iob)).promise
        });

    my.push = f => {
        my.promise = my.promise.then(f)
        return my;
    };

    my.do = f => my.push(x => {f(x); return x});

    //--- Input Stream ---

    let wait = f => queue.length
        ? f(queue.shift())
        : waiting.push(f) 

    my.await = () => my.push(xs => ({then: wait}));

    my.listen = f => my.push(__.xargs(f));

    my.send = x => {
        if (my._bound_io)
            return my._bound_io.send(x);
        waiting.length 
            ? waiting.shift()(x)
            : queue.push(x);  
        return my;
    };

    my.channel = (...xs) => my.send(xs);

    my.sleep = secs => my.push(x => __.sleep(1000 * secs).then(() => x));

    //--- Output Stream ---
    my.put = (...args) => my.bind(IO.put(...args));
    my.set = (...args) => my.bind(IO.set(...args));
    my.place = (...args) => my.bind(IO.replace(...args));
    my.replace = (...args) => my.bind(IO.replace(...args));
    my.remove = (...args) => my.bind(IO.remove(...args));

    //--- Node Stack --- 
    my.keep = (k, n) => my.do(() => keep(my, k, n))
    my.select = k => my.push(() => select(my, k));

    //--- IO Errors ---
    my.catch = f => {
        my.promise = my.promise.catch(f);
        return my;
    }

    return my;
}


//------ Node Stack ------

function keep (io, k, n, strict=true) {
    if (typeof k === 'string')
        io.stack[k] = n;
    else if (Array.isArray(k)) {
        if (!io.stack[k[0]])
            io.stack[k[0]] = [];
        io.stack[k[0]][k[1]] = n;
    }
    return io;
}

function select (io, k, strict=true) {
    let n = null;
    if (typeof k === 'string') 
        n = (io.stack[k] || io.doc.querySelector(k));
    else if (Array.isArray(k) && io.stack[k[0]])
        n = io.stack[k[0]][k[1]];

    if ((n instanceof Node && n.parentNode)|| !strict) 
        return n; 
    if (strict) {
        let str = k => typeof k === 'string' ? k : k.join('->');
        throw new Error("IO Error:\n"
            + `io.select ${str(k)} returned ${n} --- strict was demanded`);
    }
}

function remove (io, k) {
    if (typeof k === 'string') 
        delete io.stack[k]
    else if (Array.isArray(k) && io.stack[k[0]])
        delete io.stack[k[0]][k[1]];
    return io;
}

function shift (io, [k, j]) {
    io.stack[k] = [
        ...io.stack[k].slice(0, j),
        ...io.stack[k].slice(j + 1)
    ];
    return io;
}

//------ Bindings ------

function bind (ioa, iob) {
    ioa._bound_io = iob; 
    iob.stack = ioa.stack;
    iob.doc = ioa.doc;
    return iob;
}

function unbind (ioa, iob) {
    ioa._bound_io = null;
    ioa.stack = iob.stack;
    _r.assign(ioa)(iob);
    iob = ioa;
    return ioa;
}

},{"./DOM":17,"./dom":19,"./drag":20,"./tree":24,"lolo":1}],22:[function(require,module,exports){
let dom = require('./dom'),
    __ = require('lolo'),
    _r = __.r;

let isFunction = 
    y => typeof y === 'function' && ! y._domInstance;

let Parse = {};

Parse.args =        // dom('tag#id.class1.class2', [ ...bs ])
    
    (tag, a={}, b=[]) => {

        let isBranches = 
            a => (Array.isArray(a) || isFunction(a));
        if (isBranches(a))
            [a, b] = [{}, a];
        
        b = b.map(Parse.branch);

        let {classes, tagname, id, other} = Parse.tag(tag);
        
        if (id) 
            Object.assign(a, {id});
        
        if (classes.length) {
            let a_class = a.class, 
                getClass = a_class 
                    ?  M => __(a_class)(M) + ' ' + classes.join(' ')
                    : classes.join(' ');
            Object.assign(a, {class: getClass});
        }

        let otherKeys = ['html', 'value', 'svg', 'style'];
        
        Object.assign(other, _r.pluck(...otherKeys)(a));
        attr = _r.without(...otherKeys)(a);

        let on = {};

        _r.forEach((v, k) => {
            if (/^on[\w]*/.test(k)) {
                on[k.replace(/^on/, '')] = v;
                delete attr[k];
            }
        })(attr);

        Object.assign(other, {on});
        other = _r.filter(v => typeof v !== 'undefined')(other);

        return {tag: tagname, attr, branch: b, other};
    };


Parse.branch = 

    b => {
        let t = x => (typeof x);
        if (t(b) === 'string' || isFunction(b)) 
            return dom('text').html(b)
        if (Array.isArray(b)) 
            return (t(b[0]) === 'function')
                ? b 
                : dom(...b)
        return b
    };


Parse.tag =             // match 'tagname#id.class.class2' 

    tag => {
        let re = /^(\w)+|(#[\w\-]*)|(\.[\w\-]*)|(:[\w\-]*)|(>\s[\w\-]*)/g,
            matches = tag.match(re);

        let classes = [],
            tagname = 'div',
            id = null,
            other = {}; 

        matches.forEach(m => {
            if (m[0] === '#')
                id =  m.slice(1,);
            else if (m[0] === '.')
                classes.push(m.slice(1,));
            else if (m[0] === ':') {
                other.place = m.slice(1,);
                classes.push(m.slice(1,));
            }
            else if (m[0] === '>') 
                other.put = m.slice(2,);
            else
                tagname = m.length ? m : 'div';

        });

        return {classes, tagname, id, other}
    };

module.exports = Parse; 

},{"./dom":19,"lolo":1}],23:[function(require,module,exports){
let __ = require('lolo'),
    _r = __.r;

/*------ State Monad ------

    Stateful computations are programs which output
    both a final state and a return value: they may 
    be chained without any initial state being set. 

    The `St(s, a)` type describes stateful computations
    returning a value of type `a` when given an initial
    state of type `s`. 

    The `St(s, -)` type constructor essentially restricts 
    the covariant hom-functor `Hom(s, -)` to product types
    of the form `(a, s)`: 

        St(s, a) = s -> (a, s) 


    `St(s, -)` is hence a monad as well, implementing methods:

        fmap    : (a -> b) -> St(s, a) -> St(s, b)
        --------
        return  : a -> St(s, a)
        --------
        bind    : St(s, a) -> (a -> St(s, b)) -> St(s, b)
        --------
        compose : St(s, St(s, a)) -> St(s, a)

    While evaluating the computation is done by any of the following: 
        
        run     : St(s, a) -> s -> (a, s)
        --------
        eval    : St(s, a) -> s -> a
        --------
        exec    : St(s, a) -> s -> s

    This module simply uses method chaining to facilitate 
    the construction of stateful computing chains. 
        
        let st = state()
            .read()
            .bind(r => state().put(r + 1))
        
        let out1 = st.run(0)
        //- [0, 1]
*/


//------ State Methods -----

//   .fmap : (a -> b) -> St(s, a) -> St(s, b)
state.fmap = 
    f => st => state(st).push(f);

//   .return : a -> St(s, a)
state.return = r => state().return(r);

//   .bind : St(s, a) -> (a -> St(s, b)) -> St(s, b)
state.bind = 
    (st, stf) => state(st).bind(stf);

//   .compose : St(s, St(s, a)) -> St(s, a)
state.compose = 
    stst => stst.append((st, s) => st.run(s)); 



//------ State Instance ------

function state (st) {

    let chain = st ? Array(...st._chain) : [];

    let my = s => my.run(s);

    //--- State Access ---
    
    my.read = 
        ()  =>  my.append((_, s) => [s, s]);

    my.reads = 
        f => my.append((_, s) => [f ? f(s) : s, s]);

    my.put = 
        s => my.append((r, _) => [null, s]);
    
    my.puts = 
        f => my.append((r, s) => [null, f(s)]); 

    //--- Push-forward ---

    my.push = 
        f => my.append((r, s) => [f(r), s]);

    //--- Monad ---

    my.return = 
        r => my.append((_, s) => [r, s]);

    my.bind = 
        stf => my.append((r, s) => stf(r).run(s));

    //--- Evaluation ---

    my.run = 
        s => __.pipe(...chain)([null, s]);
    
    my.eval = 
        __.pipe(my.run, ([r, s]) => r);
    
    my.exec = 
        __.pipe(my.run, ([r, s]) => s);


    //--- Record States ---

    ['get', 'pluck', 'without', 'stream', 'filter']
        .forEach(method => my[method] = __.pipe(_r[method], my.reads));

    ['set', 'update', 'streamline']
        .forEach(method => my[method] = __.pipe(_r[method], my.puts));


    //--- Chain Edition ---

    my.append = 
        g => {
            chain.push(__.xargs(g));
            return my;
        }

    my._chain = chain;
    return my;
}


module.exports = state;

},{"lolo":1}],24:[function(require,module,exports){
let __ = require('lolo');

/*------ Function Trees ------ 
 
    N.B. This file should be moved to the `__` package. 

    tree(n) :: (
        n,
        [tree(n)]
    ) 
    
    tree(m, n) :: (
        m -> n, 
        m -> [tree(m, n)] 
    )

    More generally, we should view tree(m, n) as a type class: 

    t(m, n) instance tree(m, n) where: 

        t.link :    (m -> n) -> (m -> [t(m, n)]) -> t(m, n)
        
        t.node :    t(m, n) -> m -> n

        t.branch :  t(m, n) -> m -> [t(m, n)]
*/

function Tree (type={}) {

    let T   = type.link      || ((n, b) => [n, b]),
        _n  = type.node      || (t => t[0]),
        _b  = type.branch    || (t => t[1]);
  
    let tree = (n, b) => T(n, b);
    tree.node = _n;
    tree.branch = _b;

    //  .eval : m -> tree(m, n) -> tree(n)
    tree.eval = 
        M => t => tree.apply(t)(M);


    //------ Functors ------

    //  .map : (n -> n') -> tree(n) -> tree(n')
    tree.map = 
        f => t => T(
            f(_n(t)),
            _b(t).map(tree.map(f))
        );

    //  .fmap : (n -> n') -> tree(m, n) -> tree(m, n')
    tree.fmap = 
        f => t => T( 
            __(_n(t), f),
            __(_b(t), __.map(tree.fmap(f)))  
        );

    //  .cofmap : (m -> m') -> tree(m', n) -> tree(m, n)
    tree.cofmap = 
        g => t => T(
            __(g, _n(t)),
            __(g, _b(t), __.map(tree.cofmap(g)))
        )


    //------ Natural Transformations ------

    //  .apply : tree(m, n) -> m -> tree(n)
    tree.apply = 
        t => M => T(
            __(_n(t))(M),
            __(_b(t))(M).map(ti => tree.apply(ti)(M))
        );

    //  .nat ( tree' ) : tree(n) -> tree'(n) 
    tree.nat = 
        S => t => S(
            _n(t),
            _b(t).map(tree.nat(S))
        )

    //  .fnat ( tree' ) : tree(m, n) -> tree'(m, n)
    tree.fnat = 
        S => t => S(
            _n(t),
            __(_b(t), __.map(tree.nat(S)))
        );

    //  .develop : (m -> tree(n)) -> tree(m, n)
    tree.develop = 
        t => T( 
            M => _n(t(M)),
            M => __.map(tree.develop)(_b(t(M)))
        );


    //------ Monad ------

    //  .unit : n -> tree(m, n)
    tree.unit = 
        N => T(
            () => N,
            () => []
        );

    //  .compose : tree(m, tree(m, n)) -> tree(m, n)
    tree.compose = 
        tt => T(
            __(_n(tt), _n),
            M => [
                ...__(_n(tt), _b)(M),
                ...__(_b(tt), __.map(tree.compose))(M)
            ]
        );


    /*------ Cast to Dependent Tree ------
      
        m ?-> n :: n || m -> n

        tree(m ? n) :: (
            m ?-> n,
            m ?-> tree(m ? n)
        )
            
    */
    //  .depend : ((m ?-> n) -> (m -> n)) -> tree(m ? n) -> tree(m, n)
    tree.depend = toFunction => {

        //  (m ?-> n) -> (m -> n)
        let toF = toFunction || __; 

        //  tree(m ? n) -> tree(m, n)
        return t => T(
            __(_n, toF)(t),
            __(toF(_b(t)), __.map(tree.depend(toF)))
        )
    };


    return tree;
}

let tree = Tree(); 
tree.new = Tree;

module.exports = tree;

},{"lolo":1}],25:[function(require,module,exports){
let IO = require('./io'),
    state = require('./state'),
    __ = require('lolo');

/*------ Updates ------

    Apps being represented as stateful computations returning an IO stream: 
        
        app : St(s, IO e) 

    Updates provide reactivity by describing how, upon event reception:
        1. the internal state is affected,
        2. which IO operations should be performed. 

        update : e -> St(s, IO e)
    
    The IO stream is then brought back to its listening state, 
    this simple pattern defining the main loop. 

        main :  s -> IO e

    This module is here for convenience, 
    and morally only emulates switch statements. 

    If the event name is matched, a new state instance is passed 
    to the listener along with remaining arguments: 

        update.on('message', (st, msg) => ...);

    When no event names are matched, the update instance's `pass` method
    is called, which defaults to: 

        update.pass = st => st.return(IO.return(0));


    update
        .on('message', (st, msg) => 
            st.puts(msgs => [...msgs, msg])
                .return(
        
*/

function App (updates={}, hooks={}) {

    let app = {};

    app.update = (e, ...xs) => {
        let update = updates[e];
        return update
            ? update(state(), ...xs)
                .bind(app.continue)
            : app.pass(state(), ...xs);
    };

    app.hooked = (e, ...xs) => {
        let hook = hooks[e];
        return hook
            ? hook(state(), ...xs)
            : state().return(() => {});
    }

    app.continue = r => typeof[r] === 'string'
        ? app.update(r)
        : state().return(r);

    app.on = (e, f) => {
        updates[e] = f;
        return app;
    }

    app.hook = (e, g) => {
        hooks[e] = g;
        return app;
    }
    
    app.pass = () => state().return(IO.return(0));

    app.main = (...e0) => m0 => {
        let [io, m1] = app.update(...e0).run(m0),
            hook = app.hooked(...e0).eval(m0);

        return io
            .do(() => hook(m1))
            .await()
            .bind(e1 => app.main(...e1)(m1));
    };

    app.start = m0 => app.main('start')(m0);

    return app;
}

module.exports = App;

},{"./io":21,"./state":23,"lolo":1}]},{},[16])(16)
});
