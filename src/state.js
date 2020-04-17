let __ = require('lolo'),
    _r = __.r;

/*------ State Monad ------

    Stateful computations are programs which output
    both a final state and a return value: they may 
    be chained without any initial state being set. 

    The `St(s, a)` type describes stateful computations
    returning a value of type `a` when given an initial
    state of type `s`. 

    The `St(s, -)` type constructor essentially restricts 
    the covariant hom-functor `Hom(s, -)` to product types
    of the form `(a, s)`: 

        St(s, a) = s -> (a, s) 


    `St(s, -)` is hence a monad as well, implementing methods:

        fmap    : (a -> b) -> St(s, a) -> St(s, b)
        --------
        return  : a -> St(s, a)
        --------
        bind    : St(s, a) -> (a -> St(s, b)) -> St(s, b)
        --------
        compose : St(s, St(s, a)) -> St(s, a)

    While evaluating the computation is done by any of the following: 
        
        run     : St(s, a) -> s -> (a, s)
        --------
        eval    : St(s, a) -> s -> a
        --------
        exec    : St(s, a) -> s -> s

    This module simply uses method chaining to facilitate 
    the construction of stateful computing chains. 
        
        let st = state()
            .read()
            .bind(r => state().put(r + 1))
        
        let out1 = st.run(0)
        //- [0, 1]
*/


//------ State Methods -----

//   .fmap : (a -> b) -> St(s, a) -> St(s, b)
state.fmap = 
    f => st => state(st).push(f);

//   .return : a -> St(s, a)
state.return = r => state().return(r);

//   .bind : St(s, a) -> (a -> St(s, b)) -> St(s, b)
state.bind = 
    (st, stf) => state(st).bind(stf);

//   .compose : St(s, St(s, a)) -> St(s, a)
state.compose = 
    stst => stst.append((st, s) => st.run(s)); 



//------ State Instance ------

function state (st) {

    let chain = st ? Array(...st._chain) : [];

    let my = s => my.run(s);

    //--- State Access ---
    
    my.read = 
        ()  =>  my.append((_, s) => [s, s]);

    my.reads = 
        f => my.append((_, s) => [f ? f(s) : s, s]);

    my.put = 
        s => my.append((r, _) => [null, s]);
    
    my.puts = 
        f => my.append((r, s) => [null, f(s)]); 

    //--- Push-forward ---

    my.push = 
        f => my.append((r, s) => [f(r), s]);

    //--- Monad ---

    my.return = 
        r => my.append((_, s) => [r, s]);

    my.bind = 
        stf => my.append((r, s) => stf(r).run(s));

    //--- Evaluation ---

    my.run = 
        s => __.pipe(...chain)([null, s]);
    
    my.eval = 
        __.pipe(my.run, ([r, s]) => r);
    
    my.exec = 
        __.pipe(my.run, ([r, s]) => s);


    //--- Record States ---

    ['get', 'pluck', 'without', 'stream', 'filter']
        .forEach(method => my[method] = __.pipe(_r[method], my.reads));

    ['set', 'update', 'streamline']
        .forEach(method => my[method] = __.pipe(_r[method], my.puts));


    //--- Chain Edition ---

    my.append = 
        g => {
            chain.push(__.xargs(g));
            return my;
        }

    my._chain = chain;
    return my;
}


module.exports = state;
