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
IO.node = node =>  
    __.pipe(dom.tree(node), DOM.tree);

//.put : dom(m) -> m -> IO(a)
IO.put = (node, k) => m => {
    let io = IO(),
        data = dom.tree(node)(m),
        key = k || data[0].put,
        n = DOM.tree(data, io);
    return io.select(key)
        .push(n0 => n0.appendChild(n));
}

//.replace : dom(m) -> m -> IO(a)
IO.replace = (node, k) => m => {
    let io = IO(),
        data = dom.tree(node)(m),
        key = k || data[0].place;
    io.select(key);
    let n1 = DOM.tree(data, io);
    return io.push(n0 => n0.replaceWith(n1));
}

//.set : dom(m) -> m -> IO(a)
IO.set = (node, k) => m => {
    let io = IO(),
        data = node.data(m),
        key = k || data.place;
    return io.select(key)
        .push(n => DOM.set(n, data));
};

//------ IO(e) ------

let closed = __.logs('- io closed -');

function IO (doc) {

    let my = {},
        awaits = closed,
        bound_io = null;

    my.promise = Promise.resolve();
    my.doc = doc || IO.document();
    //.stack : {Node} 
    my.stack = {};
    
    //--- Monad ---

    my.push = f => {
        my.promise = my.promise.then(f)
        return my;
    };

    my.return = y => my.push(() => y)

    let bind = iob => {
        bound_io = iob; 
        iob.stack = my.stack;
        iob.doc = my.doc;
        return iob;
    };
    let unbind = iob => x => {
        bound_io = null;
        my.stack = iob.stack;
        _r.assign(my)(iob);
        return x
    };

    my.bind = iof => my.push(x => {
        let iob = bind(iof(x));
        return iob.promise.then(unbind(iob));
    });

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
        if (bound_io)
            return bound_io.send(...xs);
        awaits(...xs)
        return my;
    };

    //--- Output Stream ---

    my.append = (k, n) => 
        my.select(k).do(p => p && p.appendChild(n));

    my.replace = (k, n) => 
        my.select(k).do(n0 => __.logs('replacing:')(n0) && n0.replaceWith(n));

    my.remove = (k) => 
        my.select(k).do(n => n && n.remove());

    //--- Node Register --- 
    
    let select = k => typeof k === 'string' 
        ? (my.stack[k] || my.doc.querySelector(k))
        : (Array.isArray(k) 
            ? my.stack[k[0]][k[1]]
            : k
        );

    let keep = (k, n) => typeof k === 'string'
        ? my.stack[k] = n
        : my.stack[k[0]][k[1]] = n;

    my.select = k => 
        my.push(() => select(k))
            .push(n => {if (n) {return n} throw new Error('IO Error')})
//            .catch(__.logs(`IO Error: empty selection ${k}`));

    my.keep = (k, n) => 
        my.do(() => keep(k, n))
//          .catch(__.logs(`IO Error: cannot access location ${k}`))
    
    //--- IO Errors ---
    my.catch = f => {
        my.promise = my.promise.catch(f);
        return my;
    }

    return my;
}

//------ Node Register ------

function getNode (stack, k) {
    let n = stack[k]
    if (n && !n.parentNode)
        stack[k] = null;
    return n && n.parentNode ? n : null;
};
