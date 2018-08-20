function fst._(name, svg) {

    let id = 
        name => /#/.test(name) ? fst.parse(name).id : name;

    let app 
        = fst._get(id(name)) 
        || fst._set(id(name), fst._new(name));

    app._name = name;
   
    app.vnodes = app.vnodes || [];

    app.mount = 
        (dest, ...vnodes) => {

            if (typeof dest !== 'string') {
                vnodes = [dest].concat(vnodes); dest = null;
            }

            let connect = 
                ([n, attrs]) => __.forKeys(
                    (arrow, values) => app.connect(arrow, n, values)
                )(attrs || {});

            let plant = 
                ([n, attrs]) => fst._(n).plant(dest || app._name + '__' + n);

            let push = 
                ([n, _]) => app.vnodes.push(fst._(n));

            vnodes.forEach(__.do(connect, plant, push));
            return app;
        }

    app.gmount = 
        (dest, ...vnodes) => app
            .mount(dest, ...vnodes.map(([n, _]) => ['g#' + n, _]));

    app.connect = 
        (arrow, b, xs) => {
            let sig = 
                fst._sig(...fst._arrow(`${app._name} ${arrow} ${b}`));
            fst._connect(sig, xs);
            return app;
        }
    
    app.stepwise = 
        j => {
            let starts = (a,b) => b.start('=> ' + a._name),
                kills = (a,b) => b.kill('=> ' + a._name),
                get = (i) => app.vnodes[i];
            app.vnodes.forEach(
                (a,i) => { 
                    if (get(i+j)) starts(a, get(i+j));
                    if (get(i-1)) kills(a, get(i-1));
                }
            );
            return app;
        };

    return app;
}

fst._nodes = {};

fst._new = 
    n => fst(/#/.test(n) ? n : '#' + n)
        .up('=> ' + n)
        .up('-> ' + n, false)
        .kill('!> ' + n);

fst._get = 
    id => fst._nodes[id];

fst._set = 
    (id, vnode) => {
        fst._nodes[id] = vnode;
        return vnode;
    }

fst._sig = 
    (a, b, r) => `${a._name} ${r ? '=' : '-'}> ${b._name}`;

fst._connect = 
    (sig, xs) => {

            let [a, b, r] = fst._arrow(sig);
            a
                .signal(fst._keys(xs), sig);
            b
                .update(sig, d=>d, r);
            return fst._
        };

fst._link = 
    __.forKeys(
        (sig, xs) => fst._connect(sig, fst._keys(xs))
    )

fst._keys = 
    xs => typeof xs === 'string'
        ? xs.split(/,?\s/)
        : xs;

fst._arrow = 
    (sig) => {

        let re = /(\w*)\s(<?[-=]>?)\s(\w*)/;
        let [s, a, link, b] = sig.match(re);
        return link[1] === '>'
            ? [fst._(a), fst._(b), link[0] === '=']
            : [fst._(b), fst._(a), link[1] === '='];
    };
