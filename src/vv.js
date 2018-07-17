/* 
 * L'ARBRE DOM VIRTUEL
 */
function vv (tag, attr, branch) {

    var {tag, attr, branch} = parse(tag, attr, branch);
    
    var self = {
        tag :       tag,
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
    let attributes = attr, 
        branches = branch || [],
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
        $m(branches).map($m)
            .map(b => b.link(my))
            .forEach(b => b(model));
        /** plant **/
        return (!self.stem && append)
            ? my.nodePaint($m).parentNode()
            : my.parentNode();
    }

    my.branch = 
       bs => {
           branches = bs.map(parseBranch);
           return my;
       };

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

    let onUpdate =  [];

    my.hook = 
        (hook, ...ks) => {
            let h = __.pipe(
                __.subKeys(...ks),
                __.if(__.emptyKeys, __.null, hook)
            );
            onUpdate.push(h)
            return my;
        };

    my.signal = 
        (sig, ...ks) => my.hook(vv.emit(sig, d => d), ...ks);

    /*
     *  input.signal('input -> mail', 'raw, from, to, subject')
     *  mail.hook('input -> mail')
     */

    my.update = (evt, update=__.id, ...then) => {
        if (typeof update === 'boolean') {
            then = [update].concat(then);
            update = d => d;
        }
        if (!then.length || typeof then[0]  !== 'boolean') 
            then = [true].concat(then);
        then[0] = then[0]
            ? my.redraw
            : () => my;
        let doUpdate = e => {
            Object.assign(
                my.model(),
                update(e.detail, my.model())
            );
            __.do(...onUpdate)(e.detail);
            return my.model();
        };
        let listener = __.pipe(doUpdate, ...then);
        my.doc().addEventListener('vv#'+evt, listener);
        return my;
    }
    my.up = my.update;

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

vv.on = function (name, ...then) {
    document.addEventListener(
        'vv#' + name,
        __.do(...then)
    );
}

vv.emit = function (name, data={}, ...more) {
    
    if (!name) 
        return __.null;

    let getData = 
         (evt = {}) => (typeof data === 'function')
            ? data(evt.target || evt)
            : data;
    let emit = 
        evt => document.dispatchEvent(new CustomEvent(
            'vv#' + name,
            {
                bubbles: true,
                detail: getData(evt)
            }
        ));
    let debug = 
        evt => {
            alert(name);
            __.logthen(name)(getData(evt));
        };
    let handler = 
        __.if(
            () => vv.debug,
            __.do(emit, debug),
            emit
        );
    return __.do(handler, vv.emit(...more));

}

if (typeof window === 'undefined')
    module.exports = vv;

if (document) 
    document.addEventListener(
        'DOMContentLoaded', 
        vv.emit('dom')
    );

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
    __.forKeys(
        (k,v) => obj2[k] = v
    )(obj);
    return my;
}
