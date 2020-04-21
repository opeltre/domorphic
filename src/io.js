module.exports = IO; 

let __ = require('lolo'),
    dom = require('./dom'),
    tree = require('./tree'),
    DOM = require('./DOM');

let _r = __.r;

/*------ IO Monad ------ 

    Promise-emulated IO streams. 
*/ 

//.return : a -> IO(a)
IO.return = y => IO(Promise.resolve(y));

//.bind : IO(a) -> (a -> IO(b)) -> IO(b)
IO.bind = io => iof => io.bind(iof);

IO.document = () => DOM();

//.node : dom(m) -> m -> Node
IO.node = node =>  __.pipe(dom.tree(node), DOM.tree);


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
*/ 

let trees = node => m => 
    node._domInstance === 'map'
        ? dom.trees(node)(m)
        : [dom.tree(node)(m)];

IO.put = node => m => 
    trees(node)(m).reduce(
        (io, d) => io
            .select(d[0].put)
            .push(n => n.appendChild(DOM.tree(d, io))),
        IO()
    ).return(m);

IO.place = node => m => 
    trees(node)(m).reduce(
        (io, d) => io
            .select(d[0].place)
            .push(n => [n, DOM.tree(d, io)])
            .bind(([n0, n1]) => n0 
                ? IO().do(_ => n0.replaceWith(n1))
                : IO().select(d[0].put)
                    .do(n => n.appendChild(n1))
            ),
        IO()
    ).return(m);

IO.replace = node => m => 
    trees(node)(m).reduce(
        (io, d) => io
            .select(d[0].place)
            .push(n => n.replaceWith(DOM.tree(d, io))),
        IO()
    ).return(m);

let data = node => m => 
    node._domInstance === 'map'
        ? node.data(m)
        : [node.data(m)];

IO.set = node => m => 
    data(node)(m).reduce(
        (io, d) => io
            .select(d.place)
            .push(n => DOM.set(n, d)),
        IO()
    ).return(m);


IO.remove = node => m => 
    data(node)(m).reduce(
        (io, d) => io
            .select(d.place)
            .do(n => n.remove())
            .do(n => remove(io, d.place)),
        IO()
    ).return(m);

//------ IO(e) ------

let closed = __.logs('- io closed -');

function IO (doc) {

    let my = {},
        awaits = closed;

    my.doc = doc || IO.document();
    my.promise = Promise.resolve();

    //._bound_io :  IO e
    my._bound_io =  null;
    //.stack :      {Node} 
    my.stack =      {};
    
    //--- Monad ---

    my.return = y => my.push(() => y)

    my.bind = iof => 
        my.push(x => {
            let iob = bind(my, iof(x));
            return iob.promise
                .then(x => {unbind(my, iob); return x});
        });

    my.push = f => {
        my.promise = my.promise.then(f)
        return my;
    };
    my.then = my.push;

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

    my.set = (n, k) => my.bind(IO.set(n, k));

    my.put = (n, k) => my.bind(IO.put(n, k));

    my.place = (n, k) => my.bind(IO.replace(n, k));

    my.replace = (n, k) => my.bind(IO.replace(n, k));

    my.remove = (n, k) => my.bind(IO.remove(n, k));

    //--- Node Stack --- 
    
    my.select = k => my.push(() => select(my, k));

    my.keep = (k, n) => my.do(() => keep(my, k, n))
    
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

function remove (io, k) {
    if (typeof k === 'string') 
        delete io.stack[k]
    else if (Array.isArray(k) && io.stack[k[0]])
        delete io.stack[k[0]][k[1]];
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
    if (strict) 
        throw new Error(`IO Error: Empty or orphaned selection ${k}`)
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
