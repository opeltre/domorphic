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
        svg:        tag === 'svg'
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
                    __.do(),
                    __.do(h)
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
            __.pipe(...onUpdate)(e.detail);
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
        var re = /^(\w)+|(#[\w\-]*)|(\.[\w\-]*)/g,
            classes = [],
            tagname = 'div',
            matches = tag.match(re);
        /** push to attributes **/
        matches.forEach(m => {
            if (m[0] === '#')
                Object.assign(attr, {id: m.slice(1,)});
            else if (m[0] === '.')
                classes.push(m.slice(1,));
            else
                tagname = m.length ? m : 'div';
        });
        classes.length 
            && Object.assign(attr, {class: classes.join(' ')});
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

/*** emit ***/
vv.emit = function (name, data) {
    
    let getData = 
         evt => (typeof data === 'function')
            ? data(evt.target || evt)
            : data;

    return evt => {
        alert(name + '\n' + JSON.stringify(getData(evt || {})));
        document
            .dispatchEvent(new CustomEvent(
                'vv#' + name,
                { 
                    bubbles: true,
                    detail : getData(evt || {})
                }
            ));
    }
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
