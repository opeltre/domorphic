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
    t => M0 => {
        if (t._domInstance === 'pullback')
            return t.tree(M0);
        let M1 = t.pull()(M0),
            node = data.apply(t.node())(M1),
            branch = dom.apply(t.branch())(M1);
        return data.link(
            node, 
            branch._domInstance === 'map'
                ? branch.trees(M1)
                : branch.map(ti => ti.tree(M1))
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
        pull:      __.id,
        // IO location
        put:        'body',
        place:      null 
    };
    
    //  my : m -> node
    let my = m => IO.node(my)(m);
   
    //.io : (act, key) -> m -> IO(e)
    my.io = (act, key) => M => IO[act](my, key)(M).await();

    //.tree : m -> tree(data)
    my.tree = dom.tree(my);

    //.node : m -> data(m)
    my.node = () => _r.without('branch', 'pull')(self);

    //.data : m -> data 
    my.data = M => __(self.pull, data.apply(my.node()))(M);

    //.append : () -> ()
    my.append = (...bs) => {
        self.branch = [...self.branch, ...bs];
        return my;
    };

    //.map : (m' -> m) -> [dom](m')
    my.map = pull => dom.map(my, pull);

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

dom.map = function (node, pull) {
    
    //  node :  dom(m')
    //  pull : m -> [m'] 
    let self = {
        node :  node,
        pull : pull || __.id,
    };
   
    //  my : m -> [node] 
    let my = M => __(
        self.pull,
        __.map((mi, i) => IO.node(self.node)(mi))
    )(M);

    //        : num -> data -> data
    let place = i =>  
        _r.streamline({place: D => [D.place, i]});

    //.trees : m -> [tree(data)]
    my.trees = M => __(
        self.pull, 
        __.map(mi => self.node.tree(mi)),
        __.map(([n, b], i) => [place(i)(n), b])
    )(M);

    my.data = M => __(
        self.pull,
        __.map(mi => self.node.data(mi)),
        __.map((d, i) => place(i)(d))
    )(M);

    _r.assign(_r.without('pull', 'data', 'node', '_domInstance')(node))(my);
    my._domInstance = 'map';
    return __.getset(my, self);
}

dom.document = (typeof window !== 'undefined')
    ? window.document
    : IO.document();
