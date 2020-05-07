let __ = require('lolo'),
    _r = __.record(),
    tree = require('./tree');

/*------ Data ------
    
    Compute node attributes from dom instance parameters. 

        data.apply : Dom(m) -> m -> Data 

    `Data` is an instance of the tree type class:
        
        data.node :     Data -> d 
        data.branch :   Data -> [d] 
        data.link :     (d, [d]) -> Data

    and `data.apply` factorises through `data.apply.node` 
    and `data.apply.branch`. 

    N.B. This is done in a rather similar fashion as: 

        _r.apply : {m -> a} -> m -> {a}

    except we are dealing with union types of the form 
    `b || m -> b`, which we'll denote by `m ?-> b`. 
*/ 

let data = dom_ => m => data.link(
    data.node(dom_)(m),
    data.branch(dom_)(m)
);

//  Dom(m) :: {m ?-> a}
let types = {
tag:    'm?a',
    svg:    'm?a',
    attr:   'm?{m?a}', 
    prop:   'm?{m?a}',
    style:  'm?{m?a}',
    on:     'm?{f(-,m)}',
    html:   'm?a',
    value:  'm?a',
    class:  'm?a',
    place:  'm?a',
    put:    'm?a',
    push:   'f(-,m)'
};

//  fun : (m ?-> a) -> m -> a 
let fun = y => (typeof y === 'function' && ! y._domInstance)
    ? y 
    : () => y;

//  rfun : lots of fun
let rfun = {
    'm?a':          fun,
    'm?{m?a}':      __(fun, _r.map(fun), _r.apply),
    'm?{f(-,m)}':   fs => M => _r.map(__.bindr(M))(fun(fs)(M)),
    'f(-,m)':       f => M => __.bindr(M)(f)
};

//------ Node Maps ------

data.maps = ([n, b], i) => 
    [_r.set('place', [`[${d.place}]`, i]), b];

data.rmaps = ([n, b], k) => 
    [_r.set('place', [`{${d.place}}`, k]), b];

//------ Tree Elements ------

//  .node : Dom(m) -> m -> d  
data.node = 
    dom_ => m => __(
        _r.without('branch'), 
        _r.map((dk, k) => rfun[types[k]](dk)),
        _r.apply
    )(dom_.self)(m);

//  .branch : Dom(m) -> m -> [Tree(d)]
data.branch = 
    dom_ => m => {
        let b = fun(dom_.self.branch)(m); 
        if (b._domInstance === 'map') 
            return b.pull(m)
                .map(data(b)(m))
                .map(data.maps) 
        if (b._domInstance === 'rmap') 
            return _r.map(
                data(b)(m),
                data.rmaps
            )(b.pull(m));
        else
            return b.map(n => data(n)(m));
    };

//------ Tree Constructor ------

//--links : d -> d -> d ---
let linkSvg = n => ni => 
    n.svg ? _r.write('svg', true)(ni) : ni;

let linkDoc = n => ni => 
    _r.assign({doc: n.doc})(ni);

let link = n => __.pipe(
    ...[linkSvg, linkDoc].map(__.$(n))
);
//--links

//  .link : d -> [Tree(d)] -> Tree(d)
data.link = (n, b) => [
    n, 
    b.map(([ni, bi]) => [link(n)(ni), bi])
]

module.exports = data;
