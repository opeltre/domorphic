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
    of the form `(s, a)`: 

        St(s, a) = s -> (s, a) 


    `St(s, -)` is hence a monad as well, implementing methods:

        fmap    : (a -> b) -> St(s, a) -> St(s, b)
        --------
        return  : a -> St(s, a)
        --------
        bind    : St(s, a) -> (a -> St(s, b)) -> St(s, b)
        --------
        compose : St(s, St(s, a)) -> St(s, a)

    While evaluating the computation is done by any of the following: 
        
        run     : St(s, a) -> s -> (s, a)
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
    stst => stst.append((s, st) => st.run(s)); 



//------ State Instance ------

function state (st) {

    let chain = st ? Array(...st._chain) : [];

    let my = s0 => my.run(s0);

    //--- State Access ---
    
    my.read = 
        ()  =>  my.append(s => [s, s]);

    my.reads = 
        f => my.append(s => [s, f ? f(s) : s]);

    my.put = 
        s1 => my.append((s, r) => [s, null]);
    
    my.puts = 
        f => my.append((s, r) => [f(s), null]); 

    //--- Push-forward ---

    my.push = 
        f => my.append((s, r) => [s, f(r)]);

    //--- Monad ---

    my.return = 
        r => my.append(s => [s, r]);

    my.bind = 
        sf => my.append((s1, r1) => sf(r1).run(s1));

    //--- Evaluation ---

    my.run = 
        s0 => __.pipe(...chain)([s0, null]);
    
    my.exec = 
        __.pipe(my.run, ([s1, r1]) => s1);

    my.eval = 
        __.pipe(my.run, ([s1, r1]) => r1);
    

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
