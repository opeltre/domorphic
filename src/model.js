let __ = require('lolo'),
    _r = __.r;

/*------ Stateful Models ------
    
    say something. 
*/

//  model : m -> St(m, m)
let model = 
    M => {
        let joins = {},
            listeners = {};
        
        //  my : St(m, m)
        let my = 
            () => _r.update(M, _r.map(m => m())(joins))(M); 


        //------ Push-forwards ------

        //.push : (m -> m') -> St(m, m')
        my.push = 
            f => __.pipe(my, f);
        
        //.downstream : ...[{a, a'}] -> St({a}, {a'})
        my.downstream = 
            (...fs) => __.pipe(my, __.r.streamline(...fs));
        

        //------ Model Access: m = {a} ------

        //.get : str -> Run St({a}, a)
        my.get = 
            key => typeof joins[key] !== 'undefined'
                ? joins[key]()
                : M[key];

        //.set : (str, a) -> Run St({a}, St({a}))
        my.set = 
            (key, val) => {
                //--- update state ---
                if (typeof joins[key] !== 'undefined')
                    joins[key].update(val);
                else 
                    M[key] = val;
                //--- trigger events ---
                if (listeners[key]) 
                    listeners[key](val);
                if (listeners['*']) 
                    listeners['*'](val);
                //--- 
                return my;
            };

        //.update : {a} -> Run St({a}, St({a}))
        my.update = 
            dM => {
                _r.forEach((v, k) => my.set(k, v))(dM);
                return my;
            };
        
        //.stream : ({a} -> {a} | {a -> a}) -> Run St({a}, {a})
        my.stream = 
            f => {
                let M = my();
                return typeof f === 'function'
                    ? f(M)
                    : _r.map(fk => __(fk)(M))(f);
            };

        //.streamline : ...[{a} -> {a} | {a ?-> a}] -> Run St({a}, St({a}))
        my.streamline = 
            (...fs) => {
                fs.forEach(f => {
                    let dM = my.stream(f);
                    _r.forEach((v, k) => my.set(k, v))(dM);
                });
                return my;
            };

        //------ Joins ------

        //.join : str -> St(m') -> St(m_m')
        my.join = 
            (key, m) => {
                joins[key] = m;
                return my;
            };
        
        //------ Listeners ------
        
        //.on : str -> ((a, St({a})) -> b) -> St({a})
        my.on = 
            (key, l) => {
                listeners[key] = l;
                return my;
            }

        return my;
    };


module.exports = model;
