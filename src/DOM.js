module.exports = DOM;

let tree = require('./tree'),
    IO = require('./io'),
    __ = require('lolo'),
    _r = __.r;

//------ DOM Nodes ------

// .tree : Tree(Data) -> T(Node)
DOM.tree = (TD, io=IO()) => {
    let TN = tree.map(D => DOM.unit(D, io))(TD);
    return tree.nat(DOM.link)(TN);
}

//  .link : (Node -> [T(Node)]) -> T(Node)
DOM.link = (N, B) => {
    B.forEach(Ni => N.appendChild(Ni));
    return N;
};

//  .unit : (Data, IO e) -> Node
DOM.unit = (D, io=IO()) => { 

    let N = D.svg
        ? io.doc.createElementNS(SVG.NS, D.tag)
        : io.doc.createElement(D.tag);

    D.tag === 'svg' && SVG(N);
    DOM.set(N, D); 

    let addListener = 
        (v, k) => N.addEventListener(k, __.bindr(io)(v));
    _r.forEach(addListener)(D.on);

    D.place && io.keep(D.place, N);
    return N;
}

DOM.set = (n, d) => {
    _r.assign(d.style)(n.style);
    _r.forEach((v, k) => n[k] = v)(d.prop);
    _r.forEach(DOM.setAttribute(n))(d.attr);
    n.classname = d.class;
    n.innerHTML = d.html;
    n.value = d.value;
    return n;
}

DOM.setAttribute = n => (v, k) => 
    n instanceof SVGElement 
        ? n.setAttributeNS(null, k, v)
        : n.setAttribute(k, v);

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

function DOM () {
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
