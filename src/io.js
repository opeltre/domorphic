let __ = require('lolo'),
    tree = require('./tree'),
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
        key = k || data[0].put,
        n = Node(data, io);
    return io.select(key)
        .push(n0 => n0.appendChild(n));
}

//.replace : dom(m) -> m -> IO(a)
IO.replace = (node, k) => m => {
    let io = IO(),
        data = dom.tree(node)(m),
        key = k || data[0].place;
    io.select(key);
    let n1 = Node(data, io);
    return io.push(n0 => n0.replaceWith(n1));
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

    my.push = f => {
        my.promise = my.promise.then(f)
        return my;
    };

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

    my.then = my.push;
    my.do = f => my.push(x => {f(x); return x});

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
        my.select(k).do(n0 => __.logs('replacing:')(n0) && n0.replaceWith(n));

    my.remove = (k) => 
        my.select(k).do(n => n && n.remove());

    //--- Node Register --- 
    
    let select = k => typeof k === 'string' 
        ? (my.stack[k] || my.doc.querySelector(k))
        : (Array.isArray(k) 
            ? my.stack[k[0]][k[1]]
            : k
        );

    let keep = (k, n) => typeof k === 'string'
        ? my.stack[k] = n
        : my.stack[k[0]][k[1]] = n;

    my.select = k => 
        my.push(() => select(k))
            .push(n => {if (n) {return n} throw new Error('IO Error')})
//            .catch(__.logs(`IO Error: empty selection ${k}`));

    my.keep = (k, n) => 
        my.do(() => keep(k, n))
  //          .catch(__.logs(`IO Error: cannot access location ${k}`))
    
    //--- IO Errors ---
    my.catch = f => {
        my.promise = my.promise.catch(f);
        return my;
    }

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

    _r.forEach(setAttribute)(D.attr);
    _r.forEach(addListener)(D.on);
    _r.forEach((v, k) => N[k] = v)(D.prop);
    _r.assign(D.style)(N.style);

    N.innerHTML = D.html;
    N.value = D.value;
    return N;
}

//------ Node Register ------

function getNode (stack, k) {
    let n = stack[k]
    if (n && !n.parentNode)
        stack[k] = null;
    return n && n.parentNode ? n : null;
};

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