module.exports = dom;

let __ = require('./__'),
    Parse = require('./parse'),
    Model = require('./model');

function dom (...args) {

    /*
        Pure maps 

            dom a :: a -> node

            dom : s -> dom a
    */
        
    let self = Parse(...args);

    let my = 
        M => my.eff(Model.copy(M))
            .refresh({}, dom.fragment())
            .N();
    
    my.eff = 
        (M, N) => dom.eff(my, M, N);

    my.append = 
        (...bs) => {
            self.branch = [...self.branch, ...bs];
            return my;
        };

    my._dom = 'node'; 

    my.self = self;

    return __.getset(my, self);
}


dom.eff = function (f, M={}, N) {

    /*
        Effectful nodes  

            eff (dom a) :: da -> eff (dom a)

            eff (dom a) :: {
                f: dom a,
                M: a
                N: node
            }
    */

    let self = {f, M, N, branch: []};

    let my = 
        (dM, dN=true) => dN 
            ? my.refresh(dM) 
            : my.update(dM);

    my.refresh = 
        (dM, root=false) => {

            my.update(dM, false);
            
            let node = Node(f.self)(M);

            (root || dom.fragment())
                .appendChild(node);

            let B = Model(self.M)(f.branch())
                .map(b => dom.eff(b))
                .map(b => b.refresh(M, node));
            my.branch(B);

            let N = my.node();
            if (!root && N) 
                N.replaceWith(node);
            else if (!root && !N)
                Model(self.M)(f.root()).appendChild(node);
            my.node(N);

            return my;
        }

    my.update = 
        (dM, _r=true) => {

            self.M = __.setKeys(self.M, f.model(dM));
            if (_r)
                self.branch.forEach(
                    b => b.update(self.M)
                );
            return my;
        };

    my.remove = 
        () => {
            self.N.remove();
            self.N = null;
            return my;
        };

    return __.getset(my, self);
}




// node a :: a -> singleNode
// (not exported) 

function Node (N) { 

    let parentNode = null;

    let create = 
        () => N.svg
            ? createSvg(N.doc, N.tag)
            : N.doc.createElement(N.tag)

    let setAttribute = 
        (k, v, node) => N.svg
            ? setSvg(k, v, node)
            : node.setAttribute(k, v, node)

    let my = __.pipe(
        Model,
        M => {
            let node = create();

            __.forKeys(
                (v, k) => setAttribute(k, v, node)
            )(M.mapKeys(N.attr));

            __.forKeys(
                (v, k) => node[k] = v
            )(M.mapKeys(N.prop));

            __.forKeys(
                (v, k) => node.addEventListener(k, v)
            )(M.mapEvents(N.on));

            N.html && (node.innerHTML = M(N.html));

            N.value && (node.value = M(N.value));

            return node;
        }
    );

    return my;
}


/*************     dom     ***************/

dom.fragment = 
    () => dom.document.createDocumentFragment();

dom.document = (typeof document === 'undefined') 
    ? {
        dispatchEvent: __.null, 
        addEventListener: __.null,
        createDocumentFragment: () => ({appendChild: __.null})
    }
    : document;
/*
dom.document.addEventListener(
    'DOMContentLoaded', 
    dom.emit('dom')
);
*/

/*************      svg      *************/

function setSvg (key, val, node) {
    node.setAttributeNS(null, key, val);
}

function createSvg (doc, tag) {
    let svgNS = "http://www.w3.org/2000/svg",
        node = doc.createElementNS(svgNS, tag);
    if (tag === 'svg')
        node.setAttributeNS(
            "http://www.w3.org/2000/xmlns/", 
            "xmlns:xlink", 
            "http://www.w3.org/1999/xlink"
        );
    return node;
}
