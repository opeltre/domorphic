let __ = require('lolo'),
    dom = require('./dom');

let _r = __.r;

/*------ IO Monad ------ 

    Promise-emulated IO streams. 
*/ 

module.exports = IO; 

//.return : a -> IO(a)
IO.return = y => IO(Promise.resolve(y));

//.bind : IO(a) -> (a -> IO(b)) -> IO(b)
IO.bind = io => iof => io.bind(iof);

//.put : dom(m) -> m -> IO(a)
IO.put = (node, k) => m => {
    let io = IO(),
        data = dom.tree(node)(m),
        n = Node(data, io),
        key = k || data[0].put 
    return io.append(key, n);
}


//------ IO(e) ------

let closed = __.logs('- io closed -');

function IO (doc) {

    let my = {},
        awaits = closed,
        bound_io = null;

    my.promise = Promise.resolve();
    my.doc = doc || IO.document();
    //.stack : {Node} 
    my.stack = {};
    
    //--- Monad ---

    my.push = pf => {
        my.promise = my.promise.then(pf);
        return my;
    };
    my.then = my.push;

    my.return = y => my.push(() => y)

    let bind = iob => {
        bound_io = iob; 
        iob.stack = my.stack;
        iob.doc = my.doc;
        return iob;
    };
    let unbind = iob => x => {
        bound_io = null;
        my.stack = iob.stack;
        _r.assign(my)(iob);
        return x
    };

    my.bind = iof => my.push(x => {
        let iob = bind(iof(x));
        return iob.promise.then(unbind(iob));
    });

    //--- Input Stream ---

    let close = x => {
        awaits = closed; 
        return x
    };
    let wait = resolve => {
        awaits = __.pipe(close, resolve)
    };

    my.await = () => my.push(() => ({then: wait}));

    my.send = x => {
        if (bound_io)
            return bound_io.send(x);
        awaits(x)
        return my;
    };

    //--- Output Stream ---

    my.append = (k, n) => 
        my.select(k).do(p => p && p.appendChild(n));

    my.replace = (k, n) => 
        my.select(k).do(n0 => n0 && n0.replaceWith(n));

    my.remove = (k) => 
        my.select(k).do(n => n && n.remove());

    //--- Node Register --- 
    
    let select = k => typeof k === 'string' 
        ? my.stack[k] || my.doc.querySelector(str);
        : (Array.isArray(k) 
            ? k.reduce((r, ki) => r[ki], my.stack)
            : k
        );

    let keep = (k, n) => typeof k === 'string'
        ? my.stack[k] = n;
        : k.reduce((r, ki) => r[ki], my.stack) = n; 

    my.select = k => 
        my.return(select(k))
            .catch(__.logs(`IO Error: empty selection ${k}`));

    my.keep = (k, n) => 
        my.do(keep(k, n))
            .catch(__.logs(`IO Error: cannot access location ${k}`))

    return my;
}


//------ DOM Node ------

//  Node : Tree(Data) -> T(Node)
function Node (td, io=IO()) {
    let tn = tree.map(d => Node.unit(d, io))(td);
    return tree.nat(Node.link)(tn);
}

//  .link : (Node -> [T(Node)]) -> T(Node)
Node.link = 
    (N, B) => {
        B.forEach(Ni => N.appendChild(Ni));
        return N;
    };

//  .unit : (Data, IO e) -> Node
Node.unit = (D, io=IO()) => { 

    let N = D.svg
        ? io.doc.createElementNS(SVG.NS, D.tag)
        : io.doc.createElement(D.tag);
    
    D.place && io.keep(D.place, N);

    let setAttribute = 
        (v, k) => N instanceof SVGElement
            ? N.setAttributeNS(null, k, v)
            : N.setAttribute(k, v);
    let addListener = 
        (v, k) => N.addEventListener(k, __.bindr(io)(v));

    D.tag === 'svg' && SVG(N);

    _r.forEach(element.setAttribute)(D.attr);
    _r.forEach(addListener)(D.on);
    _r.forEach((v, k) => N[k] = v)(D.prop);
    _r.assign(D.style)(N.style);

    N.innerHTML = D.html;
    N.value = D.value;
    return N;
}

// -   -   -   -   -
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

IO.document = function () {
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
