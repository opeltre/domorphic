let __ = require('lolo'),
    _r = __.record(),
    tree = require('./src/tree');


/*------ Node Data ------

    Convert a record of model-dependent attributes
    to a model-dependent record of attributes. 

    This is done in a similar fashion as: 

        _r.apply : {m -> a} -> m -> {a}

    Except we are rather dealing with the union type:

        m ?-> a :: a || m -> a 

    N.B. The following is esoteric. 
    The `__` operator acts either as unit or identity:

        __ : (m ?-> a) -> m -> a

    While `__` also acts as composition: 

        __ : ((a -> b), ..., (c -> d)) -> (a -> d)

    Composable functions being chains in the nerve `N(T)` 
    of the category of types `T`, 
    `__` maps `N_k(T)` onto `N_1(T)` for all integer `k`. 
*/ 

let data = {};

//  data(m) :: {m ?-> a}
let datatypes = 
    {
        tag:    'm?a',
        svg:    'm?a',
        attr:   'm?{m?a}', 
        prop:   'm?{m?a}',
        on:     'm?{evt(m)}',
        html:   'm?a',
        value:  'm?a',
        class:  'm?a',
        doc:    'm?a',
        branch: 'm?a',
    },
    apply = 
    { 
        'm?a':          __,
        'm?{m?a}':      __(__, _r.map(rk => __(rk)), _r.apply),
        'm?{evt(m)}':   __(__, M => _r.map(listen => e => listen(e.target, M)))
    };

//  .apply : data(m) -> m -> data
data.apply = 
    D => __(
        _r.map2((Dk, tk) => apply[tk](Dk)),
        _r.apply
    )(D, datatypes)

//  .linkSvg : (data, data) -> data
data.linkSvg = 
    (D, Di) => D.tag === 'svg' || D.tag === 'g'
        ? __.set({svg: true})(Di)
        : Di;

//  .linkDoc : (data, data) -> data
data.linkDoc = 
    (D, Di) => __.set({doc: D.doc})(Di);

//  .tree : D -> tree(m, data)
data.tree = 
    D => [
        data.apply(D),
        __(D.branch, __.map(data.tree))
    ];


//------ DOM Node ------

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

    return node;
}

//  .link : (node, node) -> node
node.link = 
    (N, Ni) => {
        N.appendChild(Ni);
        return Ni;
    }


//------ SVG ------

function SVG (node) {
    node.setAttributeNS(
        "http://www.w3.org/2000/xmlns/", 
        "xmlns:xlink", 
        "http://www.w3.org/1999/xlink"
    );
}

SVG.NS = "http://www.w3.org/2000/svg";
