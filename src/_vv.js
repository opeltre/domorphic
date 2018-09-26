function fst.$(name, svg) {

    let id = 
        name => /#/.test(name) ? _F.parse(name).id : name;

    let app 
        = fst.$.get(id(name)) 
        || fst.$.set(id(name), fst.$.new(name));

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
                ([n, attrs]) => fst.$(n).plant(dest || app._name + '__' + n);

            let push = 
                ([n, _]) => app.vnodes.push(fst.$(n));

            vnodes.forEach(__.do(connect, plant, push));
            return app;
        }

    app.gmount = 
        (dest, ...vnodes) => app
            .mount(dest, ...vnodes.map(([n, _]) => ['g#' + n, _]));

    app.connect = 
        (arrow, b, xs) => {
            let sig = 
                fst.$.sig(...fst.$.arrow(`${app._name} ${arrow} ${b}`));
            fst.$.connect(sig, xs);
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

fst.$.nodes = {};

fst.$.new = 
    n => _F(/#/.test(n) ? n : '#' + n)
        .up('=> ' + n)
        .up('-> ' + n, false)
        .kill('!> ' + n);

fst.$.get = 
    id => fst.$.nodes[id];

fst.$.set = 
    (id, vnode) => {
        fst.$.nodes[id] = vnode;
        return vnode;
    }

fst.$.sig = 
    (a, b, r) => `${a._name} ${r ? '=' : '-'}> ${b._name}`;

fst.$.connect = 
    (sig, xs) => {

            let [a, b, r] = fst.$.arrow(sig);
            a
                .signal(fst.$.keys(xs), sig);
            b
                .update(sig, d=>d, r);
            return fst.$.
        };

fst.$.link = 
    __.forKeys(
        (sig, xs) => fst.$.connect(sig, fst.$.keys(xs))
    )

fst.$.keys = 
    xs => typeof xs === 'string'
        ? xs.split(/,?\s/)
        : xs;

fst.$.arrow = 
    (sig) => {

        let re = /(\w*)\s(<?[-=]>?)\s(\w*)/;
        let [s, a, link, b] = sig.match(re);
        return link[1] === '>'
            ? [fst.$.(a), fst.$.(b), link[0] === '=']
            : [fst.$.(b), fst.$.(a), link[1] === '='];
    };
