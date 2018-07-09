let __ = {};

__.pipe = 
    (f, ...fs) => fs.length
        ? (...xs) =>  __.pipe(...fs)(f(...xs))
        : (...xs) => f(...xs);

__.return = 
    x => y => x;

__.xs = 
    f => xs => f(...xs);

__.do = 
    (...fs) => 
        x => __.pipe(...fs, __.return(x))(x);

__.if = 
    (f,g,h) => 
        (...xs) => f(...xs) ? g(...xs) : h(...xs);

__.not = 
    b => !b;

__.logthen = 
    x => {console.log(x); return x};

__.forKeys = 
    (...fs) => 
        obj => Object.keys(obj).forEach(
            k => __.pipe(...fs)(k, obj[k])
        );

__.mapKeys = 
    (...fs) => 
        obj => Object.assign({}, 
            ...Object.keys(obj).map(
                k => __.pipe(...fs)(k, obj[k])
            )
        ); 

__.subKeys = 
    (...ks) => 
        obj => {
            let sub = {};
            ks.forEach(k => {
                if (obj[k] !== undefined) 
                    sub[k] = obj[k];
            });
            return sub;
        };

__.emptyKeys =
    obj => {
        let out = true;
        __.forKeys(k => out = false)(obj);
        return out;
    };
        


