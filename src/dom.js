module.exports = dom;

let __ = require('lolo'),
    tree = require('./tree'),
    parse = require('./parse'),
    data = require('./data'),
    IO = require('./io'),
    _r = __.r;

// .apply : (m ?-> dom(m)) -> m -> dom(m)
dom.apply = 
    n => (typeof n ==='function' && ! n._domInstance)
        ? n
        : () => n;

// .tree : dom(m) -> m -> tree(data)
dom.tree = 
    t => M => {
        if (t._domInstance === 'pullback')
            return t.tree(M);
        let _M = t.model()(M),
            node = data.apply(t.data())(_M),
            branch = dom.apply(t.branch())(_M);
        return data.link(
            node, 
            branch._domInstance === 'map'
                ? branch.trees(_M)
                : __.map(ti => ti.tree(_M))(branch)
        );
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
        // branches
        branch:     branch,
        // pull-back
        model:      __.id,
        // IO location
        put:        'body',
        place:      null 
    };
    
    //  my : m -> node
    let my = m => IO.node(my)(m);
   
    //.io : m -> IO(e)
    my.io = M => IO.put(my)(M).await();

    //.tree : m -> tree(data)
    my.tree = dom.tree(my);

    //.data : () -> data(m) 
    my.data = () => _r.without('branch', 'model')(self);
    
    //.append : () -> ()
    my.append = (...bs) => {
        self.branch = [...self.branch, ...bs];
        return my;
    };

    //.map : (m' -> m) -> [dom](m')
    my.map = model => dom.map(my, model);

    my._domInstance = 'node';
    let records = ['on', 'attr', 'style'];
    return __.getset(my, self, {records});
}


//------ pull: (m -> m') -> dom(m') -> dom(m) ------

dom.pull = function (g) {
    return node_b => {
        let my = m => node_b(g(m));
        my.tree = m => node_b.tree(g(m));
        my._domInstance = "pullback"
        return my;
    };
};


//------ map: (m -> Node) -> [m] -> [Node] ------

dom.map = function (node, model) {
    
    //  node :  dom(m')
    //  model : m -> [m'] 
    let self = {
        node :  node,
        model : model || __.id,
    };
    
    //  my : m -> [node] 
    let my = __(
        self.model,
        __.map(mi => IO.node(self.node)(mi))
    );

    //.trees : m -> [tree(data)]
    my.trees = __(
        self.model, 
        __.map(mi => self.node(mi).tree(mi))
    );

    _r.assign(_r.without('model', 'data', '_domInstance')(node))(my);
    my._domInstance = 'map';
    return __.getset(my, self);
}

dom.document = (typeof window !== 'undefined')
    ? window.document
    : IO.document();
