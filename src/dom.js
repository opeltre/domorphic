module.exports = dom;

let __ = require('lolo'),
    tree = require('./tree'),
    parse = require('./parse'),
    data = require('./data'),
    node = require('./node');

let _r = __.r

// .toNode : tree(data) -> node
dom.toNode = __(
    tree.nat(data.link),
    tree.map(node.unit),
    tree.nat(node.link)
);

// .apply : (m ?-> dom(m)) -> m -> dom(m)
dom.apply = 
    n => (typeof n ==='function' && ! n._domInstance)
        ? n
        : () => n;

// .tree : dom(m) -> m -> tree(data)
dom.tree = t => M => {

    let _M = t.model()(M);

    let node = data.apply(t.data())(_M),
        branch = dom.apply(t.branch())(_M);
    
    return [
        node, 
        branch._domInstance === 'map'
            ? branch.trees(_M)
            : __.map(ti => ti.tree(_M))(branch)
    ];
};


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
            self.model, 
            my.tree,
            dom.toNode
        )(M);

    //.tree : m -> tree(data)
    my.tree = 
        M => dom.tree(my)(M || {});

    //.data : () -> data(m) 
    my.data = 
        () => _r.without('branch', 'model')(self);
    
    //.append : () -> ()
    my.append = 
        (...bs) => {
            self.branch = [...self.branch, ...bs];
            return my;
        };

    //.map : () -> [dom](m)
    my.map = 
        model => dom.map(my, model);

    my._domInstance = 'node';

    return __.getset(my, self);
}


//------ [dom](m) :: [m] -> [node] ------

dom.map = function (node, model) {
    
    //  node :  dom(m')
    //  model : m -> [m'] 
    let self = {
        node :  node,
        model : model || __.id,
    };

    let my = 
        (M={}) => __(
            self.model,
            my.trees,
            __.map(dom.toNode)
        )(M);
    
    //.trees : m -> [tree(data)]
    my.trees = 
        (M={}) => __(
            self.model, 
            __.map(mi => dom.apply(self.node)(mi).tree(mi))
        )(M);

    my._domInstance = 'map';

    return __.getset(my, self);
}

dom.document = (typeof window !== 'undefined')
    ? window.document
    : mockDocument();

//------ Mock Document ------

function mockDocument () {

    function createElement (tag) {
        let my = {tag, branch: []};
        my.appendChild = elem => my.branch.push(elem);
        my.setAttribute = __.null;
        my.setAttributeNS = __.null;
        my.addEventListener = __.null;
        return my;
    };

    return {
        createElement, 
        createElementNS: (_, tag) => createElement(tag)
    };
}

