
function Model (M) {
    
    let isMfunction = 
        x => typeof x === 'function' && !x._dom;

    let my = 
        x => isMfunction(x) ? x(M) : x;
    
    my.listen = 
        l => (t => l(t, M));

    my.keys = __.mapKeys(my);

    my.events = __.mapKeys(my.listen)
       
    /*
    my.getModel = M => {
        let [f, ...fs] = selfA.model;
        let ismf = 
            f => Mfunction(f);
        let tomf =
            f => ismf(f) ? f : () => f;
        return ismf(f)
            ? Model(...fs.map(tomf))( f(M) )
            : Model(...[f, ...fs].map(tomf))( M );
    }
    */

    my.pipe = 
        (...fs) => __.pipe(
            ...fs.map(f => m => Object.assign(m, f(m))),
            Model
        )(M);

    return my;

};
    
