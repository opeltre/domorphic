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
        if (t._domInstance === 'pushforward')
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

// .pull: (m -> m') -> dom(m') -> dom(m)
dom.pull = 
    g => node => {
        let my = m => node(g(m));
        my.tree = m => node.tree(g(m));
        my.data = m => node.data(g(m));
        my._domInstance = "pullback"
        return my;
    };

// .push : (tree(data) -> tree(data)) -> dom(m) -> dom(m) 
dom.push = 
    f => node => {
        let my = m => IO.node(my)(m);
        my.tree = m => f(node.tree(m)); 
        my.data = m => f([node.data(m), []])[0];
        my._domInstance = "pushforward";
        return my;
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
   
    //.IO : (act, key) -> m -> IO(e)
    my.IO = (act, key) => M => IO[act](my, key)(M);

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



//------ map: (m -> Node) -> [m] -> [Node] ------

dom.map = function (node, pull) {
    
    let self = {
        node :  node,
        pull : pull || __.id,
    };

    let push = i => dom.push(
        ([d, ds]) => [
            d.place ? _r.set('place', [`[${d.place}]`, i])(d) : d,
            ds
        ]
    );
    let get = i => dom.pull(ms => ms[i])

    //  my : m -> [node] 
    let my = M => __(
        self.pull,
        __.map((mi, i) => push(i)(self.node)(mi))
    )(M);
    
    //.getNode : int -> [m'] -> node  
    my.getNode = i => __(push(i), get(i))(self.node);

    //.IO : (act, [key] || m' -> bool) -> m -> IO(e)
    my.IO = (act, filter) => IO
        .map(my.getNode, my.pull())
        .IO(act, filter);

    //.trees : m -> [tree(data)]
    my.trees = M => __(
        self.pull, 
        __.map((mi, i) => push(i)(self.node).tree(mi)),
    )(M);
    
    //.data : m -> data 
    my.data = M => __(
        self.pull,
        __.map((mi, i) => push(i)(self.node).data(mi)),
    )(M);

    my._domInstance = 'map';
    return __.getset(my, self);
}

dom.document = (typeof window !== 'undefined')
    ? window.document
    : IO.document();
