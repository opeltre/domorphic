function _F.node(name, svg) {

    let id = 
        name => /#/.test(name) ? _F.parse(name).id : name;

    let app 
        = _F.node.get(id(name)) 
        || _F.node.set(id(name), _F.node.new(name));

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
                ([n, attrs]) => _F.node.(n).plant(dest || app._name + '__' + n);

            let push = 
                ([n, _]) => app.vnodes.push(_F.node.(n));

            vnodes.forEach(__.do(connect, plant, push));
            return app;
        }

    app.gmount = 
        (dest, ...vnodes) => app
            .mount(dest, ...vnodes.map(([n, _]) => ['g#' + n, _]));

    app.connect = 
        (arrow, b, xs) => {
            let sig = 
                _F.node.sig(..._F.node.arrow(`${app._name} ${arrow} ${b}`));
            _F.node.connect(sig, xs);
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

_F.node.nodes = {};

_F.node.new = 
    n => _F(/#/.test(n) ? n : '#' + n)
        .up('=> ' + n)
        .up('-> ' + n, false)
        .kill('!> ' + n);

_F.node.get = 
    id => _F.node.nodes[id];

_F.node.set = 
    (id, vnode) => {
        _F.node.nodes[id] = vnode;
        return vnode;
    }

_F.node.sig = 
    (a, b, r) => `${a._name} ${r ? '=' : '-'}> ${b._name}`;

_F.node.connect = 
    (sig, xs) => {

            let [a, b, r] = _F.node.arrow(sig);
            a
                .signal(_F.node.keys(xs), sig);
            b
                .update(sig, d=>d, r);
            return _F.node.
        };

_F.node.link = 
    __.forKeys(
        (sig, xs) => _F.node.connect(sig, _F.node.keys(xs))
    )

_F.node.keys = 
    xs => typeof xs === 'string'
        ? xs.split(/,?\s/)
        : xs;

_F.node.arrow = 
    (sig) => {

        let re = /(\w*)\s(<?[-=]>?)\s(\w*)/;
        let [s, a, link, b] = sig.match(re);
        return link[1] === '>'
            ? [_F.node.(a), _F.node.(b), link[0] === '=']
            : [_F.node.(b), _F.node.(a), link[1] === '='];
    };
