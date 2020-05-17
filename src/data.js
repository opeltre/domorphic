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
