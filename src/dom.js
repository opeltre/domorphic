module.exports = dom;

let __ = require('lolo'),
    tree = require('./tree'),
    parse = require('./parse'),
    data = require('./data'),
    node = require('./node');

let _r = __.record();


// .tree : dom(m) -> tree(m, data)
dom.tree = t => {

    //  pullback : tree(m', data) -> tree(m, data)
    let pullback = t.model() 
        ? tree.cofmap(t.model())
        : __.id;
    
    //  node : m -> data
    let node = data.apply(t.data());

    //  branch : m -> [tree(m, data)]
    let branch = M => {
        let b = __(t.branch())(M);
        if (b._mapInstance)
            return b.trees(M);
        else
            return __.map(dom.tree)(b);
    };
                
    return pullback([node, branch]);
}


//------ dom(m) :: m -> node ------

function dom (t, a, b) {
        
    let {tag, attr, branch, html} = parse.args(t, a, b);

    let self = {
        // node 
        tag:        tag,
        svg:        tag === 'svg' || tag === 'g',
        attr:       attr,
        prop:       {},
        style:      {},
        on:         {},
        html:       html || '',
        value:      '',
        class:      '',
        doc:        dom.document,
        // branches
        branch:     branch,
        // pull-back
        model:      __.id
    };
    
    //  my : m -> node
    let my = 
        (M={}) => __(
            tree.apply(dom.tree(my)),   // tree(data)
            tree.nat(data.link),        // tree(data) -> tree(data)
            tree.map(node.unit),        // tree(data) -> tree(node)
            tree.nat(node.link)         // tree(node) -> node
        )(M);

    //.tree : m -> tree(data)
    my.tree = 
        M => tree.apply(dom.tree(my))(M || {});

    //.data : () -> data(m) 
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


//------ [dom](m) :: [m] -> [node] ------

dom.map = function (node) {
    
    //  node :  dom(m')
    //  model : m -> [m'] 
    let self = {
        node :  node,
        model : M => M
    };
    
    //.trees : m -> [tree(m, data)]
    my.trees = 
        M => {
            let t = dom.tree(self.node);
            return __.map(
                mi => tree.cofmap(__(mi))(t)
            )(self.model(M));
        };

    my._mapInstance = true; 

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
