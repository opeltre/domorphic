module.exports = dom;

let __ = require('lolo'),
    tree = require('./tree'),
    parse = require('./parse'),
    data = require('./data'),
    IO = require('./io'),
    _r = __.r;

// .pull: (m -> m') -> dom(m') -> dom(m)
dom.pull = 
    g => node => {
        let my = m => node(g(m));
        my.tree = m => node.tree(g(m));
        my.data = m => node.data(g(m));
        my._domInstance = "pullback"
        return my;
    };

//------ dom(m) :: m -> node ------

function dom (t, a, b) {
    
    let self = parse(t, a, b); 

    //  my : m -> node
    let my = m => IO.node(my)(m);

    //.data : m -> Tree(d)
    my.data = data(my);
    my.data.node = data.node(my);

    //.append : () -> ()
    my.append = (...bs) => {
        self.branch = [...self.branch, ...bs];
        return my;
    };

    //.map : (m' -> m) -> [dom](m')
    my.map = pull => dom.map(my, pull);

    my._domInstance = 'node';
    my.self = self;

    let records = ['on', 'attr', 'style'];
    return __.getset(my, self, {records});
}


//------ map: (m -> Node) -> [m] -> [Node] ------

dom.map = function (node, pull) {
    
    let self = {
        node :  node,
        pull : pull || __.id,
    };

    //  my : m -> [Node] 
    let my = M => __(
        self.pull,
        __.map((mi, i) => push(i)(self.node)(mi))
    )(M);

    my.self = self;
    
    my._domInstance = 'map';
    return __.getset(my, self);
}

dom.document = (typeof window !== 'undefined')
    ? window.document
    : IO.document();
