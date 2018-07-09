function _vv (name) {
 
    let app 
        = _vv.get(name) 
        || _vv.set(name, vv('#' + name));

    app.vnodes = app.vnodes || [];
    
    app._name = name;
    
    app.mount = 
        (...ns) => {
            if (! ns.length)
                return app.vnodes;
            app.vnodes = ns;
            return app;
        }

    let mount = 
        (...ns) => ns.forEach(
            ([n, attrs]) => __.forKeys(
                (k, v) => app.connect(k, n, v)
            )(attrs)
        );

    app.init =
        () => {
            mount(...app.vnodes);
            return app;
        };

    app.connect = 
        (k, n, v) => {
            let [a, b, r] = app.arrow(k, n);
            console.log(_vv.sig(a,b,r));
            if (typeof v === 'string')
                v = v.split(/,?\s/);
            a.signal(_vv.sig(a,b,r), ...v);
            b.update(_vv.sig(a,b,r), d=>d, r);
            return app;
        }

    app.arrow = 
        (k, n) => k[1] === '>'
            ? [app, _vv(n), k[0] === '=']
            : [_vv(n), app, k[1] === '='];

    app.starts = 
        (i,j) => {
            if (vnodes[i] && vnodes[j])
                vnodes[j].start(sig(i));
            return app;
        }

    app.kills = 
        (i,j) => {
            if (vnodes[i] && vnodes[j])
                vnodes[j].kill(sig(i));
            return app;
        }

    app.stepwise = 
        j => {
            vnodes.forEach(
                (n,i) => app
                    .starts(i, j)
                    .kills(i, i+1)
            );
            return app;
        }

    return app;
}

_vv.nodes = {};

_vv.get = 
    id => _vv.nodes[id];

_vv.set = 
    (id, vnode) => _vv.nodes[id] = vnode;

_vv.sig = 
    (n1, n2, r) => `${n1._name} ${r ? '=' : '-'}> ${n2._name}`;

