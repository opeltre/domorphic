let __ = require('./__'),
    Parse = require('./parse'),
    Model = require('./model');

module.exports = dom;

function dom (tag, attr, branch) {

    let self = {
        node:   null,
        M:      {},
        target: null
    };

    let pure = domPure(tag, attr, branch);

    let my = 
        M => {

            my.update(M);

            let node = pure(self.M);

            __.do(
                my.node() ? my.replace : my.put,
                my.node
            )(node);
        }

    Object.assign(my, pure);

    my.update = 
        M => {

            my.M(__.setKeys(my.model(M))(self.M));
            
            my.branch()
                .forEach(b => b.update(M));

            return my;
        }

    my.pure = M => pure(M);

    my.replace = 
        node => my.node().replaceWith(node);

    my.put = 
        node => (my.doc().querySelector(self.target) || my.doc().body)
            .appendChild(node);

    my.remove = 
        () => my.node().remove();

    return __.getset(my, self);
}


// dom a :: a -> node

function domPure (t, a, b) {
        
    let {tag, attr, branch} = Parse.args(t, a, b);

    let self = {
        // node construction 
        tag:        tag,
        svg:        tag === 'svg' || tag === 'g',
        attr:       attr,
        prop:       {},
        on:         {},
        branch:     branch,
        html:       '',
        value:      '',
        class:      '',
        doc:        dom.document,
        // model pull-back
        model:      M => M
    };

    let my = __.pipe(
        self.model,
        Model,
        M => {
            let node = Node(self)(M);

            self.branch
                .forEach(b => node.appendChild(b(M)));

            return node;
        }
    );

    my.append = 
        (...bs) => {
            self.branch = [...self.branch, ...bs];
            return my;
        };

    my._dom = true;

    return __.getset(my, self);
}

dom.pure = domPure;

// node a :: a -> singleNode

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

    let my = 
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

            node.innerHTML = M(N.html);

            node.value = M(N.value);

            return node;
        }

    return my;
}


/*************     dom     ***************/

dom.document = (typeof document === 'undefined') 
    ? {dispatchEvent: __.null, addEventListener: __.null}
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
