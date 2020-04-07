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
        _r.without('branch'),
        _r.map(
//          (m ?-> d(m)) -> m -> m ?-> d 
            (Dk, k) => __(Dk, data.maps[data.types[k]]),
//          (m -> m ?-> d) -> m -> d
            Dk => M => __(Dk(M))(M)
        ),
        _r.apply
    )(D);


/*------ Tree Construction ------
    
    The `data(m)` type generates trees through the `branch` attribute:

        .branch : m ?-> [data(m)] 

    The `model` attribute is used for pull-backs along the tree:

        .model : m -> m' 
        tree.cofmap(model) : tree(m', n) -> tree(m, n)

    The purpose of this module is to expose: 

        data.build : data(m) -> m -> tree(data)
*/

data.node = 
    _r.without('branch', 'model');

//  .tree : data(m) -> tree(m, data)
data.tree = 
    D => tree.cofmap(D.model || __.id)(
        [
            __(data.node, data.apply)(D),
            __(D.branch, __.map(data.tree))
        ]
    );

//  .build : data(m) -> m -> tree(data)
data.build = 
    D => __(
        data.tree, 
        tree.apply,
        __.push(
            tree.link(data.linkDoc),
            tree.link(data.linkSvg)
        )
    )(D);


//------ Propagated Attributes ------

//  .linkSvg : (data, data) -> data
data.linkSvg = 
    (D, Di) => D.tag === 'svg' || D.tag === 'g'
        ? _r.set({svg: true})(Di)
        : Di;

//  .linkDoc : (data, data) -> data
data.linkDoc = 
    (D, Di) => _r.set({doc: D.doc})(Di);