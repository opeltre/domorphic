/* vv_bundle */
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
        


/* 
 * L'ARBRE DOM VIRTUEL
 */
function vv (tag, attr, branch) {

    var {tag, attr, branch} = parse(tag, attr, branch);
    
    var self = {
        tag :       tag,
        branch :    branch,
        stem :      null,
        node :      null,
        parentNode : null,
        model :     {},
        doc :       document,
        html :      '',
        value :     '',
        plant :     null,
        properties: {},
        svg:        tag === 'svg' || tag === 'g'
    };
    var attributes = attr, 
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
        $m(my.branch()).map($m)
            .map(b => b.link(my))
            .forEach(b => b(model));
        /** plant **/
        return (!self.stem && append)
            ? my.nodePaint($m).parentNode()
            : my.parentNode();
    }

    my.modelUpdate =
        (...Ms) => my.model(Object.assign(my.model(), ...Ms)); 
   
    my.start = (when, model, append=true) => {
        if (when === 'now')
            return my(model, append);
        if (when === 'dom') {
            my.doc().addEventListener(
                'DOMContentLoaded', 
                () => my(model, append)
            );
        }
        else {
            let M = e => Object.assign(
                my.model(),
                model || {},
                e.detail
            );
            my.doc().addEventListener(
                'vv#' + when,
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
                'vv#' + when,
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

    let onUpdate =  [d => d];

    my.hook = 
        (h, ...ks) => {
            onUpdate
                .push(__.if(
                    __.pipe(__.subKeys(...ks), __.emptyKeys),
                    __.null,
                    h
                ));
            return my;
        };

    my.signal = 
        (sig, ...ks) => my.hook(vv.emit(sig, d => d), ...ks);

    /*
     *  input.signal('input -> mail', 'raw, from, to, subject')
     *  mail.hook('input -> mail')
     */

    my.update = (evt, update=(d=>d), ...then) => {
        let doUpdate = e => {
            Object.assign(
                    my.model(),
                    update(e.detail, my.model())
            );
            __.do(...onUpdate)(e.detail);
            return my.model();
        };
        if (!then.length || typeof then[0]  !== 'boolean') 
            then = [true].concat(then);
        then[0] = then[0]
            ? my.redraw
            : () => my;
        let listener = __.pipe(doUpdate, ...then);
        my.doc().addEventListener('vv#'+evt, listener);
        return my;
    }
    my.up = my.update;

    my.redraw = 
        () => {
            let node =  my.node();
            if (!node) 
                return my();
            let fragment = my(false, false);
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
        forEachKey(attributes)(
            key => my.nodeSet(key, $m(my.attr(key)))
        );
        forEachKey(self.properties)(
            key => my.node()[key] = $m(self.properties[key])
        );
        let model = $m(x => x),
            $mListener = l => (t => l(t, model));
        forEachKey(events)(
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
            return vv('text').html(b)
        if (Array.isArray(b)) 
            return (t(b[0]) === 'function')
                ? b 
                : vv(...b);
        return b
    }

    function parse (tag, attr={}, branch=[]) {
        /** empty {} attr is boring **/
        if (Array.isArray(attr))
            [attr, branch] = [{}, attr];
        /** match "tagname#id.class.class2" **/
        let {classes, tagname, id} = vv.parse(tag);
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
        return (typeof x === 'function' && !x._vv);
    }

    my._vv = true;
    return getset(my,self);
}

/*** parse ***/
vv.parse = function (tag) {
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
vv.emit = function (name, data) {
    
    let getData = 
         evt => (typeof data === 'function')
            ? data(evt.target || evt)
            : data;
    let emit = 
        evt => document.dispatchEvent(new CustomEvent(
            'vv#' + name,
            {
                bubbles: true,
                detail: getData(evt || {})
            }
        ));
    let debug = 
        evt => alert(
            name + '\n' + 
            JSON.stringify(getData(evt || {}), null, 2)
        );
    return __.if(__.return(vv.debug),
        __.do(emit, debug),
        emit
    );
}

if (typeof window === 'undefined')
    module.exports = vv;

/****** GETSET ******/
/* still wanted in global scope, e.g. for bmp2svg.
 * forEachKey, $, logthen... as well?
 */

function forEachKey (obj) {
    return f => Object.keys(obj).forEach(f);
}

function getset (obj, attrs) {
    let method = 
        key => function (x) {
            if (!arguments.length)
                return attrs[key];
            attrs[key] = x;
            return obj;
        };
    forEachKey(attrs)(
        key => obj[key] = method(key)
    );
    return obj;
}

function getsetExtends (obj, f) {

    function obj2 (...args) {
        obj(...args);
        f(obj, ...args);
    }
    çç.forKeys(
        (k,v) => obj2[k] = v
    )(obj);
    return my;
}
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
/*** vv_helpers ***/

vv.input = 
    (id, key=id, css='') => 
        vv('input#' + id + css)
            .html(M => M[key])
            .on('input', vv.emit(id, t => t.value))
            .up(id, (val => ({key: val})), false);

vv.textarea = 
    (id, key=id, css='') => 
        vv('textarea#'+ id + css)
            .value(M => M[raw])
            .on('change', vv.emit(id, t => t.value))
            .up(id, (val => ({key: val})), false);

vv.table = 
    body => 
        vv('table', [
            ['tbody', 
                body
                    .map(row => row
                        .map(cell => ['td', [cell]])
                    )
                    .map(row => ['tr', row])
            ]
        ]);
/*** ajax ***/

vv.ajax = function (data) {

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
