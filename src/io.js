module.exports = IO; 

let __ = require('lolo'),
    dom = require('./dom'),
    tree = require('./tree'),
    DOM = require('./DOM');

let _r = __.r;

/*------ IO Monad ------ 

    Promise-emulated IO streams. 

*///-------------------- 

//.return : a -> IO(a)
IO.return = y => IO(() => y);

//.bind : IO(a) -> (a -> IO(b)) -> IO(b)
IO.bind = io => iof => io.bind(iof);

//.push : IO(a) -> (a -> b) -> IO(b)
IO.push = io => f => io.push(f);

//.document : () -> document
IO.document = () => DOM();


/*------ Output Stream ------
    
    This section pushes morphisms to model-dependent DOM operations,
    all methods having the following type: 

        IO.act : dom(m) -> m -> IO(m)

    They may then be bound to any active IO stream, which is equivalent 
    to calling the IO instance's method of the same name. 
        
        io.bind(m => IO.act(node)) 
    <=> io.act(node)

    The optional second argument `string` in `IO.act(node, string)` is 
    used either: 
        - to override `node.place` or `node.put` if `string` 
        points to a node IO stream's stack,
        - as a CSS selector to query the DOM.

*///-------------------------

//.node : dom(m) -> m -> Node
IO.node = node =>  __.pipe(dom.tree(node), DOM.tree);

IO.put = (node, k, place) => m => {
    let io = IO(),
        data = dom.tree(node)(m),
        key = k || data[0].put,
        n = DOM.tree(data, io, place);
    return io.select(key)
        .push(n0 => n0.appendChild(n))
        .return(m);
}

IO.set = (node, k) => m => {
    let io = IO(),
        data = node.data(m),
        key = k || data.place;
    return io.select(key)
        .push(n => DOM.set(n, data))
        .return(m);
};

IO.place = (node, k) => m => {
    let io = IO(),
        place = k || node.data(m).place;
    return io.select(place, strict=false)
        .bind(n => n 
            ? IO.replace(node, place)(m) 
            : IO.put(node, 0, place)(m)
        );
};

IO.replace = (node, k) => m => {
    let io = IO(),
        data = dom.tree(node)(m),
        key = k || data[0].place;
    io.select(key);
    let n1 = DOM.tree(data, io, key);
    return io.push(n0 => n0.replaceWith(n1))
        .return(m);
}

IO.remove = (node) => m => {
    let io = IO(); 
        key = node._domInstance ? node.data(m).place : node
    return io.select(key)
        .do(n => n.remove())
        .do(n => remove(io, key))
        .return(m);
};

/*--- Output operations with node maps ---

    One may associate specific keys to IO operations. 
    The `filter` argument is interpreted as either as 
    a list of circular indices `[-1, 2, 3, ...]` to 
    select from the model, or as a filtering function 
    on the model's elements: 
    
        f : [m] -> bool 

    Only those values satisfying the condition will be kept, 
    and their index passed to the IO action for proper 
    maintenance of the node register. In particular
    the `remove` action shifts all remaining nodes 
    in the register after DOM removal. 

    Assuming `nodes = node.map()`,
    
        IO.with(nodes)
            .set([0, 2, -2])
            .place([5, 6, 7])
            .remove(mi => mi.alive === false)

    is functionally equivalent to:  

        IO.map(node)
            .set(...)
            ...
*///---

let keys = filter => typeof filter === 'function'
    ? ms => ms
        .map((mi, i) => filter(mi) ? i : false)
        .filter(j => j !== false)
    : ms => filter
        .map(j => j % ms.length)
        .map(j => j >= 0 ? j : j + ms.length);

IO.map = (node, pull) => IO.with(dom.map(node, pull));

['set', 'put', 'place', 'replace', 'remove'].forEach(act => {

    IO.map[act] = (node, filter) => M => {

        let ms = node.pull()(M),
            ks = keys(filter)(ms);
        let io = ks.reduce(
            (io, j) => io
                .bind(IO[act](node.get(j))).return(ms),
            IO.return(ms)
        );
        return act === 'remove' 
            ? io.bind(IO.map['shift'](node, ks))
            : io;
    }
});

IO.map['shift'] = (node, ks) => ms => {
    let place = j => node.get(j).data(ms).place;
    return ks.map(place)
        .reduce(
            (io, k) => io.do(() => shift(io, k)), 
            IO()
        )
        .return(ms);
}

IO.with = node => {

    let actions = [],
        pull = __.id; 

    let my = M => __(pull, my.IO)(M)
    
    my.IO = M => actions
        .reduce(
            (io, [act, ...args]) => io
                .bind(IO.map[act](node, ...args)).return(M),
            IO.return(M)
        );

    ['set', 'put', 'place', 'replace', 'remove'].forEach(act => {
        my[act] = (...args) => {
            actions.push([act, ...args]);
            return my;
        }
    });

    my.pull = g => {pull = g; return my}
    return my;
};

/*------ IO instances ------

    IO streams are "alive" instances, in that they hold an
    internal state together with a running promise chain 
    whose execution starts upon creation. 

    Each stream keeps its own stack of registered DOM nodes: 

        io.stack : {Node, [Node], {Node}} 
    
    References are kept whenever the node constructor specifies 
    a `place` attribute, used as key, so that the associated 
    DOM node will be accessible for later IO operations. 
    
    Further operations may either be chained by: 
        - calling the instance's methods,
        - binding maps returning IO streams, e.g. class methods. 

    For instance: 
        io.return(12)
    <=> io.bind(() => IO.return(12))

    When binding instances, the stack of the parent IO stream 
    is passed on when spawning the child stream and recovered*
    as soon as the latter returns, in a possibly altered state.  

    Therefore keeping multiple references to a running IO stream 
    is unneccesary, and could only be done once: one may instead 
    focus on defining which operations should take place upon 
    events to close the loop! 

        //  update  : e -> s -> [IO e, s] 
        //  main    : e -> s -> IO e

        let main = e0 => s0 => {
            let [io, s1] = update(e0)(s0);
            return io.bind(e1 => main(e1)(s1));
        }
        
        //  io : IO e 
        let io = main('start')(':D');

*///-----------------------

let closed = __.logs('- io closed -');

function IO (doc) {

    let my = {},
        awaits = closed;

    my.doc = doc || IO.document();
    my.promise = Promise.resolve();

    my._bound_io =  null;
    my.stack =      {};
    
    //--- Monad ---

    my.return = y => my.push(() => y)

    my.bind = iof => my
        .push(x => {
            let iob = bind(my, iof(x));
            return iob.do(() => unbind(my, iob)).promise
        });

    my.push = f => {
        my.promise = my.promise.then(f)
        return my;
    };

    my.do = f => my.push(x => {f(x); return x});

    //--- Input Stream ---

    let close = x => {
        awaits = closed; 
        return x
    };
    let wait = listener => {
        awaits = __.pipe(close, listener)
    };

    my.await = () => my.push(() => ({then: wait}));

    my.send = (...xs) => {
        if (my._bound_io)
            return my._bound_io.send(...xs);
        awaits(...xs)
        return my;
    };

    my.sleep = secs => my.push(x => __.sleep(1000 * secs).then(() => x));

    //--- Output Stream ---
    my.put = (...args) => my.bind(IO.put(...args));
    my.set = (...args) => my.bind(IO.set(...args));
    my.place = (...args) => my.bind(IO.replace(...args));
    my.replace = (...args) => my.bind(IO.replace(...args));
    my.remove = (...args) => my.bind(IO.remove(...args));

    //--- Node Stack --- 
    my.keep = (k, n) => my.do(() => keep(my, k, n))
    my.select = k => my.push(() => select(my, k));

    //--- IO Errors ---
    my.catch = f => {
        my.promise = my.promise.catch(f);
        return my;
    }

    return my;
}


//------ Node Stack ------

function keep (io, k, n, strict=true) {
    if (typeof k === 'string')
        io.stack[k] = n;
    else if (Array.isArray(k)) {
        if (!io.stack[k[0]])
            io.stack[k[0]] = [];
        io.stack[k[0]][k[1]] = n;
    }
    return io;
}

function select (io, k, strict=true) {
    let n = null;
    if (typeof k === 'string') 
        n = (io.stack[k] || io.doc.querySelector(k));
    else if (Array.isArray(k) && io.stack[k[0]])
        n = io.stack[k[0]][k[1]];

    if ((n instanceof Node && n.parentNode)|| !strict) 
        return n; 
    if (strict) {
        let str = k => typeof k === 'string' ? k : k.join('->');
        throw new Error("IO Error:\n"
            + `io.select ${str(k)} returned ${n} --- strict was demanded`);
    }
}

function remove (io, k) {
    if (typeof k === 'string') 
        delete io.stack[k]
    else if (Array.isArray(k) && io.stack[k[0]])
        delete io.stack[k[0]][k[1]];
    return io;
}

function shift (io, [k, j]) {
    io.stack[k] = [
        ...io.stack[k].slice(0, j),
        ...io.stack[k].slice(j + 1)
    ];
    return io;
}

//------ Bindings ------

function bind (ioa, iob) {
    ioa._bound_io = iob; 
    iob.stack = ioa.stack;
    iob.doc = ioa.doc;
    return iob;
}

function unbind (ioa, iob) {
    ioa._bound_io = null;
    ioa.stack = iob.stack;
    _r.assign(ioa)(iob);
    iob = ioa;
    return ioa;
}
