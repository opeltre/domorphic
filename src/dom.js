module.exports = dom;

let __ = require('lolo'),
    tree = require('./tree'),
    parse = require('./parse'),
    data = require('./data'),
    IO = require('./io'),
    _r = __.r;

// .pull : (a -> b) -> Dom(b) -> Dom(a)
dom.pull = g => dom_ => dom(dom_).pull(g);

// .push : (Node -> Node) -> Dom(a) -> Dom(a)
dom.push = f => dom_ => dom(dom_).push(f);

//------ dom(m) :: m -> node ------

function dom (...args) {
    
    let self = parse(...args); 
    self.type = 'node';

    //  my : m -> node
    let my = m => IO.node(my)(m);

    //.data : m -> Tree(d)
    my.data = data(self);
    //.data.node : m -> d 
    my.data.node = data.node(self);

    //.append : () -> ()
    my.append = (...bs) => {
        self.branch = [...self.branch, ...bs];
        return my;
    };

    //.map : (m' -> m) -> [dom](m')
    my.map = pull => dom.map(my, pull);

    my.self = self;

    let records = ['on', 'attr', 'style'];
    return __.getset(my, self, {records});
}


//------ map: (m -> Node) -> [m] -> [Node] ------

dom.map = function (node, pull) {

    let self = {
        node :  node,
        pull :  pull || __.id,
        type :  'map'
    };

    //  my : m -> [Node] 
    let my = M => __(
        self.pull,
        __.map((mi, i) => push(i)(self.node)(mi))
    )(M);

    my.self = self;
    
    return __.getset(my, self);
}

dom.document = (typeof window !== 'undefined')
    ? window.document
    : IO.document();
