/* forest bundle */
/*** __ ***/

let __ = {};


__.null = 
    () => {};

__.id =
    x => x;

__.return = 
    x => y => x;

__.X = 
    f => 
        X => f(...X);

__.$ = 
    (...xs) => 
        f => f(...xs);

__.if = 
    (f,g,h) => 
        (...xs) => f(...xs) ? g(...xs) : h(...xs);

__.pipe = 
    (f=__.id, ...fs) => fs.length
        ? (...xs) =>  __.pipe(...fs)(f(...xs))
        : (...xs) => f(...xs);

__.do = 
    (f=__.id, ...fs) => fs.length
        ? __.pipe(__.do(f), __.do(...fs))
        : x => {f(x); return x} 

__.not = 
    b => !b;

__.log = 
    x => {console.log(x); return x};

__.logs = 
    str => 
        x => {__.log(str || 'logs:'); return  __.log(x)};

__.forKeys = 
    (...fs) => 
        obj => Object.keys(obj).forEach(
            k => __.pipe(...fs)(k, obj[k])
        );

__.mapKeys = 
    (...fs) => 
        obj => {
            let obj2 = {};
            Object.keys(obj).forEach(
                k => obj2[k] = __.pipe(...fs)(obj[k], k)
            )
            return obj2;
        };

__.subKeys = 
    (...ks) => 
        obj => {
            let sub = {};
            ks.filter(k => (obj[k] !== undefined))
                .forEach(k => sub[k] = obj[k]);
            return sub;
        };

__.emptyKeys =
    obj => {
        let out = true;
        __.forKeys(k => out = false)(obj);
        return out;
    };

__.toKeys = 
    pairs => {
        let out = {};
        pairs.forEach(
            ([v, k]) => out[k] = v
        )
        return out;
    };

__.toPairs = 
    obj => {
        let out = [];
        __.forKeys(
            (v,k) => out.push([v,k])
        );
        return out;
    };

/* misc */

__.getset = 
    (my, a, as) => getset(getsetArray(my, as), a);

__.sleep = 
    ms => new Promise(then => setTimeout(then, ms));

__.range =
    n => {
        let out = [];
        for (var i=0; i<n; i++) {
            out.push(i);
        }
        return out;
    }

/* getset */

function getset (my, attrs={}) {
    let method = 
        key => function (x) {
            if (!arguments.length)
                return attrs[key];
            attrs[key] = x;
            return my;
        };
    __.forKeys(
        key => my[key] = method(key)
    )(attrs);
    return my;
}

function getsetArray (my, attrs={}) {
    let method =
        key => function (x, ...xs) {
            if (typeof x === 'undefined')
                return attrs[key];
            if (Array.isArray(x))
                attrs[key] = x;
            else 
                attrs[key] = [...attrs[key], x, ...xs];
            return my;
        };
    __.forKeys(
        key => my[key] = method(key)
    )(attrs);
    return my;
}

/* 
 * L'ARBRE DOM VIRTUEL
 */

function fst (tag, attr, branch) {

    var {tag, attr, branch} = parse(tag, attr, branch);
    
    var self = {
        tag :       tag,
        stem :      null,
        node :      null,
        parentNode : null,
        model :     {},
        doc :       fst.document,
        html :      '',
        value :     '',
        plant :     null,
        properties: {},
        svg:        tag === 'svg' || tag === 'g'
    };
    
    let selfA = {
        branches : branch || []
    }

    let attributes = attr, 
        events = {};

    function my (model, append = true) {
        /** model **/
        model = model || my.model();
        let $m = x => isModelFunction(x) ? x(model) : x;
        /** node **/
        my
            .model(model)
            .nodeCreate()
            .nodeConf($m)
            .nodeAppend(append);
        /** branch **/
        __.log($m(my.branch())).map($m)
            .map(parseBranch)
            .map(b => b.link(my))
            .forEach(b => b(model));
        /** plant **/
        return (!self.stem && append)
            ? my.nodePaint($m).parentNode()
            : my.parentNode();
    }

    my.branch = (b) => {
        if (typeof b === 'undefined')
            return selfA.branches
        selfA.branches = b;
        return my;
    }
    
    /*
    my.branch =
        (b,...bs) => (typeof b === 'undefined')
            ? my.branches()
            : (Array.isArray(b) && !(typeof b[0] === 'string')) 
                    ? my.branches(b.map(parseBranch))
                    : my.branches(...[b, ...bs].map(parseBranch));
  */          

    my.modelUpdate =
        (...Ms) => my.model(Object.assign(my.model(), ...Ms)); 
   
    my.start = (when, model, append=true) => {
        /* up ?? */
        if (when === 'now')
            return my(model, append);
        else {
            let M = e => Object.assign(
                my.model(),
                model || {},
                e.detail
            );
            my.doc().addEventListener(
                'fst#' + when,
                 e => my(M(e), append)
            );
        }
        return my;
    }

    my.kill = (when) => {
        if (when === 'now')
            my.node().remove();
        else {
            my.doc().addEventListener(
                'fst#' + when,
                () => my.node().remove()
            );
        }
        return my;
    }

    my.on = (evt, listener, capture=false) => {
        if (!listener)
            return events[evt];
        if (events[evt])
            events[evt].push([listener, capture]);
        else
            events[evt] = [[listener, capture]];
        return my;
    }

    my._onUpdate =  [];

    my.hook = 
        (xs, ...hooks) => {
            let hook = data => {
                let d = __.subKeys(...fst._(xs))(data || {});
                if (!__.emptyKeys(d))
                    __.do(...hooks)(d, my.model());
            }
            my._onUpdate.push(hook);
            return my;
        };

    my.signal = 
        (xs, sig) => my.hook(xs, fst.emit(sig, d => d));

    my.update = (evt, update=__.id, ...then) => {

        [update, ...then] = parseUp(update, ...then);

        let doUpdate = D => {
            let M = my.model();
            M = Object.assign(M, update(D, M));
            __.do(...my._onUpdate)(D, M);
            return my.model(M);
        };
        let listener = __.pipe(
            evt => __.logs('D: ')(evt.detail),
            doUpdate, 
            ...then
        );
        my.doc().addEventListener('fst#'+evt, listener);

        return my;
    }
    
    my.up = my.update;
    function parseUp (update, ...then) {
        if (typeof update === 'boolean') {
            then = [update, ...then];
            update = d => d;
        }
        if (!then.length || typeof then[0]  !== 'boolean') 
            then = [true, ...then];
        then[0] = then[0]
            ? my.redraw
            : () => my;
        return __.log([update, ...then]);
    }

    my.redraw = 
        () => {
            let node =  my.node();
            let fragment = my(false, !node);
            if (node) 
                node.replaceWith(fragment);
            return my;
        };
    
    my.link = (stem) => my
        .stem(stem)
        .svg(stem.svg())
        .doc(stem.doc())
        .model(stem.model());

    my.attr = obj => {
        if (typeof obj === 'string')
            return attributes[obj];
        Object.assign(attributes, obj);
        return my;
    }

    my.show = (str) => {
        console.log(str);
        console.log(self);
        return my;
    }

    my.nodeCreate = () => my.node(
        my.svg()
            ? createSvg(my.doc(), tag)
            : my.doc().createElement(tag)
    );

    my.nodeSet = (key, val) => {
        my.svg()
            ? setSvg(key, val, my.node())
            : my.node().setAttribute(key,val);
        return my;
    }

    my.nodeConf = ($m) => {

        let forKeys = o => f => __.forKeys(f)(o),
            model = $m(x => x),
            $mListener = l => (t => l(t, model));

        forKeys(attributes)(
            key => my.nodeSet(key, $m(my.attr(key)))
        );
        forKeys(self.properties)(
            key => my.node()[key] = $m(self.properties[key])
        );
        forKeys(events)(
            key => my.on(key).forEach(
                list => my.node()
                    .addEventListener(key, ...list.map($mListener))
            )
        );
        my.node().innerHTML = $m(my.html());
        my.node().value = $m(my.value());

        return my;
    }

    my.nodeAppend = (append) => {
        let parentNode = (self.stem && append)
                ? self.stem.node()
                : self.doc.createDocumentFragment();
        parentNode.appendChild(self.node);
        return my.parentNode(parentNode);
    }

    my.nodePaint = ($m, append) => {
        let target = self.plant
            ? self.doc.querySelector($m(self.plant))
            : self.doc.body;
        target.appendChild(my.parentNode());
        return my;
    }

    function createSvg (doc, tag) {
        var svgNS = "http://www.w3.org/2000/svg"
        var node = doc.createElementNS(svgNS, tag)
        if (tag == 'svg')
            node.setAttributeNS(
                "http://www.w3.org/2000/xmlns/", 
                "xmlns:xlink", 
                "http://www.w3.org/1999/xlink"
            );
        return node;
    }

    function setSvg (key, val, node) {
        node.setAttributeNS(null, key, val);
    }

    function parseBranch (b) {
        let t = x => (typeof x);
        if (t(b) === 'string' || isModelFunction(b))
            return fst('text').html(b)
        if (Array.isArray(b)) 
            return (t(b[0]) === 'function')
                ? b 
                : fst(...b);
        return b
    }

    function parse (tag, attr={}, branch=[]) {
        /** empty {} attr is boring **/
        if (Array.isArray(attr))
            [attr, branch] = [{}, attr];
        /** match "tagname#id.class.class2" **/
        let {classes, tagname, id} = fst.parse(tag);
        if (id) 
            Object.assign(attr, {id});
        if (classes.length)
            Object.assign(attr, {class: classes.join(' ')});
        /** parse branches **/
        branch = branch.map(parseBranch);
        /** out! **/
        return {tag: tagname, attr, branch};
    }

    function isModelFunction (x) {
        return (typeof x === 'function' && !x._fst);
    }

    my._fst = true;
    return __.getset(my, self) //, selfA);
}
fst.Node = (...xs) => fst(...xs); 

/*** parse ***/
fst.parse = function (tag) {
    /** match "tagname#id.class.class2" **/
    let re = /^(\w)+|(#[\w\-]*)|(\.[\w\-]*)/g,
        matches = tag.match(re);
    let classes = [],
        tagname = 'div',
        id = null;
    matches.forEach(m => {
        if (m[0] === '#')
            id =  m.slice(1,);
        else if (m[0] === '.')
            classes.push(m.slice(1,));
        else
            tagname = m.length ? m : 'div';
    });
    return {classes, tagname, id}
};

/*** emit ***/

fst.on = function (name, ...then) {
    fst.document.addEventListener(
        'fst#' + name,
        __.do(...then)
    );
}

fst.emit = function (name, data=__.id, ...more) {
    
    if (!name) 
        return __.null;

    let getData = 
         (evt = {}) => (typeof data === 'function')
            ? data(evt.target || evt)
            : data;
    let emit = 
        evt => fst.document.dispatchEvent(new CustomEvent(
            'fst#' + name,
            {
                bubbles: true,
                detail: getData(evt)
            }
        ));
    let debug = 
        evt => {
            alert(name);
            __.logs(name)(getData(evt));
        };
    let handler = 
        __.if(
            () => fst.debug,
            __.do(emit, debug),
            emit
        );
    return __.do(handler, fst.emit(...more));

}

fst.document = (typeof document === 'undefined') 
    ? {dispatchEvent: __.null, addEventListener: __.null}
    : document;

fst.document.addEventListener(
    'DOMContentLoaded', 
    fst.emit('dom')
);
fst.$ = function (name, svg) {

    let id = 
        name => /#/.test(name) ? fst.parse(name).id : name;

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
    n => fst(/#/.test(n) ? n : '#' + n)
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
            return fst.$
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
            ? [fst.$(a), fst.$(b), link[0] === '=']
            : [fst.$(b), fst.$(a), link[1] === '='];
    };
/*** fst_helpers ***/

fst.input = 
    (id, key=id, css='') => {
        let data = 
            val => { let d = {}; d[key] = val; return d };
        return fst('input#' + id + css)
            .html(M => M[key])
            .on('input', 
                fst.emit('-> '+ id, t => data(t.value))
            )
    }

fst.textarea = 
    (id, key=id, css='') => {
        let data = 
            val => { let d = {}; d[key] = val; return d };
        return fst('textarea#'+ id + '-' + key + css)
            .value(M => M[key])
            .on('change', 
                fst.emit('-> ' + id, t => data(t.value)))
    }

fst.table = 
    body => 
        fst('table', [
            ['tbody', 
                body
                    .map(row => row
                        .map(cell => ['td', [cell]])
                    )
                    .map(row => ['tr', row])
            ]
        ]);
/*** ajax ***/

fst.ajax = function (data) {

    let my = {},
        xhr = new XMLHttpRequest();
    data = data ? JSON.stringify(data) : null;

    ['get', 'post', 'put', 'move', 'delete']
        .forEach(m => my[m] = method(m));

    function method (m) {
        return url => {
            xhr.open(m.toUpperCase(), url);
            xhr.setRequestHeader('Content-Type', 'application/json');
            return new Promise(resolve => then(resolve));
        }
    }

    function then (f) {
        let ok = () => (xhr.readyState === 4 && xhr.status === 200);
        xhr.onreadystatechange = () => ok() && f(xhr.responseText);
        xhr.send(data);
    }
   
    my.del = my.delete;
    return my;
}
if (typeof window === 'undefined') {
    module.exports = Object.assign(fst, {'__':__}) 
}
