let __ = require('./__'),
    Parse = require('./parse'),
    Model = require('./model');

module.exports = dom;

dom.node = (pure) => {

    let self = {
        node:   null,
        M:      {},
        target: null
    };

    let my = pure,
        call = pure.call;

    my.call = 
        M => {
            my.update(M);

            let node = call(self.M);

            return __.do(
                my.node() 
                    ? n => my.node().replaceWith(n)
                    : n => my.root().appendChild(n),
                my.node
            )(node);

        };

    my.root = 
        () => my.doc().querySelector(self.target)
            || my.doc().body;

    my.remove = 
        () => {
            my.node().remove();
            return my.node(null);
        }

    my.update = 
        M => {
            my.M(
                __.setKeys(my.model()(M))(self.M)
            );

            let recur = M => 
                b => b.update 
                    ? b.update(M)
                    : b.branch().forEach(recur(b.model()(M)));

            my.branch().forEach(recur(my.M()));

            return my;
        }

    return __.getset(my, self);
}

dom.stack = (pure) => {

    let self = {
        nodes : [],
        M:      [],
        target: null
    };

}



// dom a :: a -> node

function dom (t, a, b) {
        
    let {tag, attr, branch, html} = Parse.args(t, a, b);

    let self = {
        // node construction 
        tag:        tag,
        svg:        tag === 'svg' || tag === 'g',
        attr:       attr,
        prop:       {},
        on:         {},
        branch:     branch,
        html:       html,
        value:      '',
        class:      '',
        doc:        dom.document,
        // model pull-back
        model:      M => M
    };

    let my = M => my.call(M);
    
    my.call = __.pipe(
        self.model,
        M => {
            let node = Node(self)(M);

            let append = b => {
                if (b._dom === 'stack')
                    b(M).forEach(n => node.appendChild(n));
                else if (b._dom === 'keys')
                    __.forKeys(n => node.appendChild(n))(b(M));
                else 
                    node.appendChild(b(M));
            };

            self.branch
                .forEach(append);

            return node;
        }
    );

    my.append = 
        (...bs) => {
            self.branch = [...self.branch, ...bs];
            return my;
        };

    my._dom = 'node'; 

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

            node.innerHTML = M(N.html);

            node.value = M(N.value);

            return node;
        }
    );

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
