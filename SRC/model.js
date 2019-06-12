// model.js
// 
//  Essentially a tweaked implementation of '$':
//      $ :: a -> (a -> b) -> b
//      $ = M -> f -> f(M)
//  To account for the fact that attributes, etc. 
//  might be constant values or model-dependent functions. 

let isMfunction = 
    x => typeof x === 'function' && !x._dom;

function Model (M) {
    
    let my = 
        x => isMfunction(x) ? x(M) : x;
    
    my.listen = 
        l => (t => l(t, M));

    my.mapKeys = __.mapKeys(my);

    my.mapEvents = __.mapKeys(my.listen)
       
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

Model.isFunction = isMfunction;

module.exports = Model;

