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

    let setAttribute = 
        (v, k) => D.svg
            ? N.setAttributeNS(null, k, v)
            : N.setAttribute(k, v);

    _r.forEach(setAttribute)(D.attr);

    _r.forEach((v, k) => N[k] = v)(D.prop);

    _r.forEach((v, k) => N.addEventListener(k, v))(D.on);

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
