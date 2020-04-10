(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dom = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
let __ = require('./src/__'),
    record = require('./src/record'),
    nd = require('./src/nd_array');
//    alg = require('./src/alg/index'),
//    top = require('./src/top/index');

module.exports = Object.assign(__, {
    record: record.new,
    r: record,
    nd
//    alg, 
//    top
});

},{"./src/__":2,"./src/nd_array":3,"./src/record":4}],2:[function(require,module,exports){
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

__.linspace = 
    (t0, t1, n=20) => __.range(n)
        .map(t => t * (t1 - t0) / n);

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

},{"./__":2}],4:[function(require,module,exports){
let __ = require('./__');

let _r = Record();
    _r.new = Record;

module.exports = _r;

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
        (k, v) => r => my.assign({}, r, my.fromPairs([v, k]));
    
    //.update : {a} -> {a} -> {a}
    my.update = 
        (...rs) => r => my.assign(r, ...rs)({});

    //.write : str -> a -> Effect({a})
    my.write = 
        (k, v) => my.assign(fromPairs([v, k]));

    //.assign : str -> a -> Effect({a})
    my.assign = 
        (...rs) => r => Object.assign(r, ...rs);


    //------ sequential updates ------

    //         : {a -> a} -> {a} -> {a} 
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
                r || {}
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
        (f, g=__.id) => __.pipe(
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

},{"./__":2}],5:[function(require,module,exports){
let dom = require('./src/dom'),
    elements = require('./src/elements'),
    effects = require('./src/effects');

module.exports = Object.assign(dom, elements, effects);

},{"./src/dom":7,"./src/effects":8,"./src/elements":9}],6:[function(require,module,exports){
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
        ? _r.assign({svg: true})(Di)
        : Di;

//          : data -> data -> data
let linkDoc = 
    D => Di => _r.assign({doc: D.doc})(Di);

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

},{"./tree":12,"lolo":1}],7:[function(require,module,exports){
module.exports = dom;

let __ = require('lolo'),
    tree = require('./tree'),
    parse = require('./parse'),
    data = require('./data'),
    node = require('./node');

let _r = __.r

// .toNode : tree(data) -> node
dom.toNode = __(
    tree.nat(data.link),
    tree.map(node.unit),
    tree.nat(node.link)
);

// .apply : (m ?-> dom(m)) -> m -> dom(m)
dom.apply = 
    n => (typeof n ==='function' && ! n._domInstance)
        ? n
        : () => n;

// .tree : dom(m) -> m -> tree(data)
dom.tree = t => M => {

    let _M = t.model()(M);

    let node = data.apply(t.data())(_M),
        branch = dom.apply(t.branch())(_M);
    
    return [
        node, 
        branch._domInstance === 'map'
            ? branch.trees(_M)
            : __.map(ti => ti.tree(_M))(branch)
    ];
};


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
            self.model, 
            my.tree,
            dom.toNode
        )(M);

    //.tree : m -> tree(data)
    my.tree = 
        M => dom.tree(my)(M || {});

    //.data : () -> data(m) 
    my.data = 
        () => _r.without('branch', 'model')(self);
    
    //.append : () -> ()
    my.append = 
        (...bs) => {
            self.branch = [...self.branch, ...bs];
            return my;
        };

    //.map : () -> [dom](m)
    my.map = 
        model => dom.map(my, model);

    my._domInstance = 'node';

    return __.getset(my, self);
}


//------ [dom](m) :: [m] -> [node] ------

dom.map = function (node, model) {
    
    //  node :  dom(m')
    //  model : m -> [m'] 
    let self = {
        node :  node,
        model : model || __.id,
    };

    let my = 
        (M={}) => __(
            self.model,
            my.trees,
            __.map(dom.toNode)
        )(M);
    
    //.trees : m -> [tree(data)]
    my.trees = 
        (M={}) => __(
            self.model, 
            __.map(mi => dom.apply(self.node)(mi).tree(mi))
        )(M);

    my._domInstance = 'map';

    return __.getset(my, self);
}

dom.document = (typeof window !== 'undefined')
    ? window.document
    : mockDocument();

//------ Mock Document ------

function mockDocument () {

    function createElement (tag) {
        let my = {tag, branch: []};
        my.appendChild = elem => my.branch.push(elem);
        my.setAttribute = __.null;
        my.setAttributeNS = __.null;
        my.addEventListener = __.null;
        return my;
    };

    return {
        createElement, 
        createElementNS: (_, tag) => createElement(tag)
    };
}


},{"./data":6,"./node":10,"./parse":11,"./tree":12,"lolo":1}],8:[function(require,module,exports){
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

},{"lolo":1}],9:[function(require,module,exports){
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

},{"./dom":7}],10:[function(require,module,exports){
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

    let style = 
        _r.reduce((s, v, k) => s + `${k}: ${v};`, '')(D.style);

    let setAttribute = 
        (v, k) => D.svg
            ? N.setAttributeNS(null, k, v)
            : N.setAttribute(k, v);
    
    //setAttribute(style, 'style')

    _r.forEach(setAttribute)(D.attr);

    _r.forEach((v, k) => N[k] = v)(D.prop);

    _r.forEach((v, k) => N.addEventListener(k, v))(D.on);

    _r.assign(D.style)(N.style);

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

},{"./tree":12,"lolo":1}],11:[function(require,module,exports){
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

},{"./dom":7}],12:[function(require,module,exports){
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

},{"lolo":1}]},{},[5])(5)
});
