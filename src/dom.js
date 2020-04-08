module.exports = dom;

let __ = require('lolo'),
    tree = require('./tree'),
    parse = require('./parse'),
    data = require('./data'),
    node = require('./node');

let _r = __.record();

// .tree : dom(m) -> tree(m, data)
dom.tree = 
    t => tree.cofmap(t.model())(
        [
            data.apply(t.data()), 
            __(t.branch(), __.map(dom.tree))
        ]
    );


// dom(m) -> m -> node
function dom (t, a, b) {
        
    let {tag, attr, branch, html} = parse.args(t, a, b);

    let self = {
        // node 
        tag:        tag,
        svg:        tag === 'svg' || tag === 'g',
        attr:       attr,
        prop:       {},
        on:         {},
        html:       html || '',
        value:      '',
        class:      '',
        doc:        dom.document,
        // branches
        branch:     branch,
        // pull-back
        model:      M => M
    };

    let my = 
        M => __(
            my.tree,                // tree(data)
            tree.nat(data.link),    // tree(data) -> tree(data)
            tree.map(node.unit),    // tree(data) -> tree(node)
            tree.nat(node.link)     // tree(node) -> T(node)
        )(M);

    my.tree = 
        M => tree.apply(dom.tree(my))(__.log(M || {}));

    my.data = 
        () => _r.without('branch', 'model')(self);

    my.append = 
        (...bs) => {
            self.branch = [...self.branch, ...bs];
            return my;
        };

    my._domInstance = true;

    return __.getset(my, self);
}

let createElement =
    tag => {
        let my = {tag, branch: []};
        my.appendChild = elem => my.branch.push(elem);
        my.setAttribute = __.null;
        my.setAttributeNS = __.null;
        my.addEventListener = __.null;
        return my;
    };

dom.document = (typeof window !== 'undefined')
    ? window.document
    : ({
        createElement, 
        createElementNS: (_, tag) => createElement(tag)
    });
