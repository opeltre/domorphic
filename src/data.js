let __ = require('lolo'),
    _r = __.record(),
    tree = require('./tree');

/*------ Data ------
    
    Compute node attributes from dom instance parameters. 

        data: Dom(m) -> m -> Tree(d) 

    The above factorising through: 
        
        data.node :     Dom(m) -> m -> d 
        data.branch :   Dom(m) -> m -> [Tree(d)]

        data.link :     (d, [Tree(d)]) -> Tree(d)

    N.B. Mapping `Dom(m)` to functions is done in a similar fashion as: 

        _r.apply : {m -> a} -> m -> {a}

    except we are dealing with union types of the form `b || m -> b`, 
    which we denote by `m ?-> b`. 
*/ 

let data = self => m0 => {
    let m1 = self.pull(m0); 
    return data.link(
        data.node(self)(m1),
        data.branch(self)(m1)
    );
}

data.tree = self => data(self); 

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
let fun = y => typeof y === 'function'
    ? y 
    : () => y;

//  maps : lots of fun
let maps = {
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
    self => m => __(
        _r.without('branch', 'pull'), 
        _r.map((dk, k) => maps[types[k]](dk)),
        _r.apply
    )(self)(m);

//  .branch : Dom(m) -> m -> [Tree(d)]
data.branch = 
    self => m => {
        let b = fun(self.branch)(m); 
        if (b.type === 'map') 
            return b.pull(m)
                .map(data(b)(m))
                .map(data.maps) 
        if (b.type === 'rmap') 
            return _r.map(
                data(b)(m),
                data.rmaps
            )(b.self.pull(m));
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
