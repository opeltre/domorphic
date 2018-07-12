function _vv (name, svg) {

    let tag = 
        name => /#/.test(name) ? name : '#' + name;
    let id = 
        name => /#/.test(name) ? vv.parse(name).id : name;

    let app 
        = _vv.get(id(name)) 
        || _vv.set(id(name), vv(tag(name)));

    app._name = name;
   
    app.vnodes = app.vnodes || [];

    app.mount = 
        (dest, ...vnodes) => {

            if (typeof dest !== 'string')
                vnodes = [dest].concat(vnodes); dest = null;

            let connect = 
                ([n, attrs]) => __.forKeys(
                    (arrow, values) => app.connect(arrow, n, values)
                )(attrs || {});

            let plant = 
                ([n, attrs]) => _vv(n).plant(dest || app._name + '__' + n);

            let push = 
                ([n, _]) => app.vnodes.push(_vv(n));

            vnodes.forEach(__.do(connect, plant, push));
            return app;
        }

    app.gmount = 
        (dest, ...vnodes) => app
            .mount(dest, ...vnodes.map(([n, _]) => ['g#' + n, _]));

    app.connect = 
        (arrow, n, v) => {
            let [a, b, r] = app.arrow(arrow, n);
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
            if (app.vnodes[i] && app.vnodes[j])
                app.vnodes[j].start(sig(i));
            return app;
        }

    app.kills = 
        (i,j) => {
            if (app.vnodes[i] && app.vnodes[j])
                app.vnodes[j].kill(sig(i));
            return app;
        }

    app.stepwise = 
        j => {
            app.vnodes.forEach(
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

/*** test ***

_vv('frame')
    .branch([
        vv('svg#svg-frame', {width: "400px", height: "200px"})
    ])
    .gmount('#svg-frame', 
        ['circle', {
            '=>' : 'cPos'
        }],
        ['rect', {
            '->': 'rPos'
        }]
    )();
  */ 
