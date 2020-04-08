(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dom = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
let __ = require('./src/__'),
    record = require('./src/record'),
    nd = require('./src/nd_array'),
    alg = require('./src/alg/index'),
    top = require('./src/top/index');

module.exports = Object.assign(__, {record, nd, alg, top});

},{"./src/__":2,"./src/alg/index":6,"./src/nd_array":8,"./src/record":9,"./src/top/index":12}],2:[function(require,module,exports){
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


//--------- get set (MOVE) ---------------

__.getset = 
    (my, a, as) => getset(getsetArray(my, as), a);

/* getset */

forKeys = 
    f => r => Object.keys(r).forEach(
        k => f(r[k], k)
    );

function getset (my, attrs={}) {
    let method = 
        key => function (x) {
            if (!arguments.length)
                return attrs[key];
            attrs[key] = x;
            return my;
        };
    forKeys(
        (v, k) => my[k] = method(k)
    )(attrs);
    return my;
}

function getsetArray (my, attrs={}) {
    let method =
        key => function (x, ...xs) {
            if (typeof x === 'undefined')
                return attrs[key];
            if (Array.isArray(x))
                attrs[key] = x;
            else 
                attrs[key] = [...attrs[key], x, ...xs];
            return my;
        };
    forKeys(
        (v, k) => my[k] = method(k)
    )(attrs);
    return my;
}



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
    
let record = require('../record')();

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
    record.set(nd)(_K);


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

},{"../__":2,"../nd_array":8,"../record":9,"../top/id":11}],8:[function(require,module,exports){
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

},{"./__":2}],9:[function(require,module,exports){
let __ = require('./__');

module.exports = Record;

function Record () {

    let my = {};

    //------ record properties ------

    my.keys = 
        r => Object.keys(r);

    my.isEmpty =
        r => my.keys(r).length > 0

    my.null = 
        ks => my.fromPairs(ks.map(k => [null, k]));


    //------ record access ------
    
    my.get = 
        (...ks) => 
            r => my.fromPairs(
                ks.map(k => [r[k], k])
            );
    
    my.set = 
        (...rs) => 
            r => Object.assign(r, ...rs);

    //------ sequential update ------

    let update = 
        r_f => 
            r => my.set(my.apply(r_f)(r))(r);

    my.update = 
        (...r_fs) => __.pipe(...r_fs.map(update));

    
    //------ record iteration ------

    my.forEach = 
        f => 
            r => my.keys(r).forEach(
                k => f(r[k], k)
            );

    my.reduce = 
        (f, r) => q => 
            my.keys(q).reduce(
                (a, k) => f(a, q[k], k),
                r || {}
            );


    //------ record transformation ------
    
    my.apply = 
        r_f => 
            (...xs) => my.map(__.$(...xs))(r_f);

    my.map = 
        (...fs) => q => 
            my.reduce(
                (r, qk, k) => __.do(_ => r[k] = __.pipe(...fs)(qk, k))(r),
                {}
            )(q);

    my.map2 = 
        f => 
            (r, q) => my.map(
                (rk, k) => f(rk, q[k], k)
            )(r);

    my.filter = 
        f => r => {
            let sub = {};
            my.forEach((v, k) => f(v, k) && (sub[k] = v))(r);
            return sub;
        };

    my.without = 
        (...ks) => __.pipe(
            ...ks.map(k => my.filter((rj, j) => j !== k))
        );


    //------ store function values ------

    my.compute = 
        (f, g=__.id) => __.pipe(
            __.map((...xs) => [f(...xs), g(...xs)]),
            my.fromPairs 
        );
 

    //------ key-value pairs ------

    my.toPairs = 
        r => {
            let pairs = [];
            my.forEach(
                (rk, k) => pairs.push([rk, k])
            )(r);
            return pairs;
        };

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

},{"./__":2}],10:[function(require,module,exports){
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

    let NG = record();

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

},{"../__":2,"../record":9,"./id":11,"./nerve":13,"./set":14}],11:[function(require,module,exports){
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

},{"../__":2}],12:[function(require,module,exports){
let set = require('./set'),
    nerve = require('./nerve'),
    complex = require('./complex'),
    id = require('./id');

module.exports = {set, nerve, complex, id};

},{"./complex":10,"./id":11,"./nerve":13,"./set":14}],13:[function(require,module,exports){
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
        intervals = _r.compute(__(N.interval), chain.id)(N(1)),
        intercones = _r.compute(__(N.intercone), chain.id)(N(1));
        
    let mu = _r.compute(__(N.mu), chain.id)([...X.map(a => [a, a]), ...N(1)]);

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

},{"../__":2,"./id":11,"./set":14}],14:[function(require,module,exports){
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

},{"../__":2}],15:[function(require,module,exports){
let dom = require('./src/dom'),
    elements = require('./src/elements'),
    effects = require('./src/effects');

module.exports = Object.assign(dom, elements, effects);

},{"./src/dom":17,"./src/effects":18,"./src/elements":19}],16:[function(require,module,exports){
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

    While `__` also acts as composition: 

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
    doc:    'm?a',
};

data.maps = {
    'm?a':      __.id,
//              {m ?-> a} -> m -> {a}
    'm?{m?a}':  __(_r.map(v => __(v)), _r.apply),
//              {l} -> m -> {l(m)}
    'm?{e(m)}': ls => M => _r.map(l => e => l((e || {}).target, M))(ls)
};

//  .apply : data(m) -> m -> data
data.apply = 
    D => __(
        _r.map(
//          (m ?-> d(m)) -> m -> m ?-> d 
            (Dk, k) => __(Dk, data.maps[data.types[k]]),
//          (m -> m ?-> d) -> m -> d
            Dk => M => __(Dk(M))(M)
        ),
        _r.apply
    )(D);


//------ Propagated Attributes ------

//          : data -> data -> data
let linkSvg = 
    D => Di => D.tag === 'svg' || D.tag === 'g'
        ? _r.set({svg: true})(Di)
        : Di;

//          : data -> data -> data
let linkDoc = 
    D => Di => _r.set({doc: D.doc})(Di);

//       : data -> data -> data
let link = 
    l => [linkSvg, linkDoc]
        .map(f => f(l))
        .reduce((f, g) => __(f, g));

//  .link : data -> [tree(data)] -> tree(data)
data.link = 
    (n, b) => [
        n, 
        b.map(([ni, bi]) => [link(n)(ni), bi])
    ]

//  .tree : tree(data) -> tree(data)
data.tree = 
    tree.nat(data.link);

module.exports = data;

},{"./tree":22,"lolo":1}],17:[function(require,module,exports){
module.exports = dom;

let __ = require('lolo'),
    tree = require('./tree'),
    parse = require('./parse'),
    data = require('./data'),
    node = require('./node');

let _r = __.record();


// .tree : dom(m) -> tree(m, data)
dom.tree = t => {

    //  pullback : tree(m', data) -> tree(m, data)
    let pullback = t.model() 
        ? tree.cofmap(t.model())
        : __.id;
    
    //  node : m -> data
    let node = data.apply(t.data());

    //  branch : m -> [tree(m, data)]
    let branch = M => {
        let b = __(t.branch())(M);
        if (b._mapInstance)
            return b.trees(M);
        else
            return __.map(dom.tree)(b);
    };
                
    return pullback([node, branch]);
}


//------ dom(m) :: m -> node ------

function dom (t, a, b) {
        
    let {tag, attr, branch, html} = parse.args(t, a, b);

    let self = {
        // node 
        tag:        tag,
        svg:        tag === 'svg' || tag === 'g',
        attr:       attr,
        prop:       {},
        style:      {},
        on:         {},
        html:       html || '',
        value:      '',
        class:      '',
        doc:        dom.document,
        // branches
        branch:     branch,
        // pull-back
        model:      __.id
    };
    
    //  my : m -> node
    let my = 
        (M={}) => __(
            tree.apply(dom.tree(my)),   // tree(data)
            tree.nat(data.link),        // tree(data) -> tree(data)
            tree.map(node.unit),        // tree(data) -> tree(node)
            tree.nat(node.link)         // tree(node) -> node
        )(M);

    //.tree : m -> tree(data)
    my.tree = 
        M => tree.apply(dom.tree(my))(M || {});

    //.data : () -> data(m) 
    my.data = 
        () => _r.without('branch', 'model')(self);

    my.append = 
        (...bs) => {
            self.branch = [...self.branch, ...bs];
            return my;
        };

    my._domInstance = true;

    return __.getset(my, self);
}


//------ [dom](m) :: [m] -> [node] ------

dom.map = function (node) {
    
    //  node :  dom(m')
    //  model : m -> [m'] 
    let self = {
        node :  node,
        model : M => M
    };
    
    //.trees : m -> [tree(m, data)]
    my.trees = 
        M => {
            let t = dom.tree(self.node);
            return __.map(
                mi => tree.cofmap(__(mi))(t)
            )(self.model(M));
        };

    my._mapInstance = true; 

    return __.getset(my, self);
}



let createElement =
    tag => {
        let my = {tag, branch: []};
        my.appendChild = elem => my.branch.push(elem);
        my.setAttribute = __.null;
        my.setAttributeNS = __.null;
        my.addEventListener = __.null;
        return my;
    };

dom.document = (typeof window !== 'undefined')
    ? window.document
    : ({
        createElement, 
        createElementNS: (_, tag) => createElement(tag)
    });

},{"./data":16,"./node":20,"./parse":21,"./tree":22,"lolo":1}],18:[function(require,module,exports){
let __ = require('lolo'),
    _r = __.record();

let dom = {};

dom.select = 
    str => typeof str === 'string' 
        ? document.querySelector(str)
        : str;

dom.append = 
    (str, node) => M => dom.select(str).appendChild(node(M));

dom.replace = 
    (str, node) => M => dom.select(str).replaceWith(node(M));

dom.remove = 
    (str) => () => dom.select(str).remove();

dom.set = 
    (str) => attrs => {
        let N = dom.select(str), 
            setAttr = N instanceof SVGElement 
                ? (v, k) => N.setAttributeNS(null, k, v)
                : (v, k) => N.setAttribute(k, v);
        _r.forEach(setAttr)(attrs);
    };

dom.loop = 
    (dt, tick) => 
        t => Promise.resolve(t)
            .then(tick)
            .then(() => __.sleep(dt))
            .then(() => t + dt)
            .then(dom.loop(dt, tick))

module.exports = dom;

},{"lolo":1}],19:[function(require,module,exports){
let dom = require('./dom');

dom.range = 
    (min, max, step, value) => 
        dom('input', {type: 'range', min, max, step: step || 0.1})
            .value(
                typeof value === 'undefined' 
                    ? (max - min) / 2 
                    : value
            )

module.exports = dom;

},{"./dom":17}],20:[function(require,module,exports){
let __ = require('lolo'),
    tree = require('./tree'),
    _r = __.record();

//------ DOM Node ------

let node = {}; 

//  .unit : data -> node
node.unit = D => { 

    let N = D.svg
        ? D.doc.createElementNS(SVG.NS, D.tag)
        : D.doc.createElement(D.tag);

    D.tag === 'svg' && SVG(N);

    let setAttribute = 
        (v, k) => D.svg
            ? N.setAttributeNS(null, k, v)
            : N.setAttribute(k, v);

    _r.forEach(setAttribute)(D.attr);

    _r.forEach((v, k) => N[k] = v)(D.prop);

    _r.forEach((v, k) => N.addEventListener(k, v))(D.on);

    N.innerHTML = D.html;

    N.value = D.value;

    return N;
}


//  .link : (n -> [T(n)] -> T(n))
node.link = 
    (N, B) => {
        B.forEach(Ni => N.appendChild(Ni));
        return N;
    };

//  .tree : tree(n) -> T(n)
node.tree = 
    tree.nat(node.link);

//------ SVG ------

function SVG (node) {
    node.setAttributeNS(
        "http://www.w3.org/2000/xmlns/", 
        "xmlns:xlink", 
        "http://www.w3.org/1999/xlink"
    );
}

SVG.NS = "http://www.w3.org/2000/svg";

module.exports = node;

},{"./tree":22,"lolo":1}],21:[function(require,module,exports){
let dom = require('./dom');

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

        let {classes, tagname, id} = Parse.tag(tag);

        if (id) 
            Object.assign(a, {id});

        if (classes.length)
            Object.assign(a, {class: classes.join(' ')});

        return {tag: tagname, attr: a, branch: b};
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
        let re = /^(\w)+|(#[\w\-]*)|(\.[\w\-]*)/g,
            matches = tag.match(re);

        let classes = [],
            tagname = 'div',
            id = null;

        matches.forEach(m => {
            if (m[0] === '#')
                id =  m.slice(1,);
            else if (m[0] === '.')
                classes.push(m.slice(1,));
            else
                tagname = m.length ? m : 'div';
        });

        return {classes, tagname, id}
    };

module.exports = Parse; 

},{"./dom":17}],22:[function(require,module,exports){
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

},{"lolo":1}]},{},[15])(15)
});
