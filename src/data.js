let __ = require('lolo'),
    _r = __.record(),
    sort = require('./sort');

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

//  data : Dom(m) -> m -> Tree(d)
let data = self => (m0, k) => {
    let m1 = self.pull(m0); 
    return data.link(
        data.node(self)(m1, k),
        data.branch(self)(m1)
    );
}

data.tree = self => data(self); 

//------ Apply ------

//  Dom(m): { k: types[k] }
let types = {
    tag:        'm?a',
    svg:        'm?a',
    attr:       'm?{m?a}', 
    prop:       'm?{m?a}',
    style:      'm?{m?a}',
    on:         'm?{f(-,m)}',
    html:       'm?a',
    value:      'm?a',
    class:      'm?a',
    classes:    '[m?a]',
    place:      'm?a',
    put:        'm?a',
    sortBy:     'm?a',
    push:       'f(-,m)'
};

//  fun : (m ?-> a) -> m -> a 
let fun = y => typeof y === 'function'
    ? y 
    : () => y;

//  maps : lots of fun
let maps = {
    'm?a':          fun,
    '[m?a]':        __(__.map(fun), __.apply),
    'm?{m?a}':      as => m => _r.map(fun, __.$(m))(fun(as)(m)),
    'm?{f(-,m)}':   fs => m => _r.map(__.bindr(m))(fun(fs)(m)),
    'f(-,m)':       f => m => __.bindr(m)(f)
};

//  .node : Dom(m) -> m -> d  
data.node = 
    self => (m, k) => __(
        _r.without('branch', 'pull', 'type'), 
        _r.map((dk, k) => maps[types[k]](dk)),
        _r.apply
    )(self)(m, k);


//------ Branches ------

//  .maps : Tree(d) -> Int -> Tree(d)
data.maps = ([n, b], i) => n.place 
    ? [_r.set('place', [`[${n.place}]`, i])(n), b]
    : [n, b]
//  .rmaps : Tree(d) -> Str -> Tree(d)
data.rmaps = ([n, b], k) => n.place
    ? [_r.set('place', [`{${n.place}}`, k])(n), b]
    : [n, b]

//  .branch : Dom(m) -> m -> [Tree(d)]
data.branch = 
    self => m => {
        let b = fun(self.branch)(m); 
        if (Array.isArray(b))
            return b.map(n => data(n)(m));
        if (b.type === 'map') 
            return (b.pull || __.id)(m)
                .map(data(b.node))
                .map(data.maps) 
        if (b.type === 'rmap') {
            let ms = (b.pull || __.id)(m),
                keys = b.sortBy ? sort(...b.sortBy)(_r.toPairs(ms))
                    : _r.keys(ms),
                nodes = __(
                    _r.map(data(b.node)),
                    _r.map(data.rmaps)
                )(ms); 
            return keys.map(k => nodes[k]);
        }
        else 
            throw branchError(b); 
    };

let branchError = b => TypeError(
    `Branch: expected array or map instance, received ${typeof b}`
);

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
