/* 
 * L'ARBRE DOM VIRTUEL
 */

function fst (tag, attr, branch) {

    var {tag, attr, branch} = parse(tag, attr, branch);
    
    var self = {
        M:          {},
        plant :     null,
        stem :      null,
        node :      null,
        parentNode : null,
        tag :       tag,
        svg:        tag === 'svg' || tag === 'g',
        class:      '',
        html :      '',
        value :     '',
        properties: {},
        doc :       fst.document,
    };
    

    let selfA = {
        model : []
    }

    let branches = branch || [],
        attributes = attr, 
        events = {};

    let Model = (f, ...fs) => 
        M => f
            ? Model(...fs)(Object.assign(M, f(M)))
            : M;

    function my (M, paint=true) {
        /** model **/
        self.M = __.setKeys(my.getModel)(
            M || ( self.stem ? self.stem.M() : self.M )  
        );
        let $M = x => Mfunction(x) ? x(self.M) : x;
        /** node **/
        my
            .nodeCreate()
            .nodeConf($M)
            .nodeAppend(paint);
        /** branch **/
        $M(my.branch())
            .map($M)
            .map(parseBranch)
            .map(b => b.link(my))
            .forEach(b => b(self.M));
        return my;
        /** plant 
        return !self.stem && paint
            ? my.nodePaint($M).parentNode()
            : my.parentNode();
        **/
    }

    my.link = (stem) => my
        .stem(stem)
        .svg(stem.svg())
        .doc(stem.doc());

    my.getModel = M => {
        let [f, ...fs] = selfA.model;
        let ismf = 
            f => Mfunction(f);
        let tomf =
            f => ismf(f) ? f : () => f;
        return ismf(f)
            ? Model(...fs.map(tomf))( f(M) )
            : Model(...[f, ...fs].map(tomf))( M );
    }

    /*
    my._onUpdate =  [];

    my.hook = 
        (xs, ...hooks) => {
            let hook = data => {
                let d = __.subKeys(...fst._(xs))(data || {});
                if (!__.emptyKeys(d))
                    __.do(...hooks)(d, self.M);
            }
            my._onUpdate.push(hook);
            return my;
        };
    my.signal = 
        (xs, sig) => my.hook(xs, fst.emit(sig, d => d));
    */

    my.update = (evt, update, ...then) => {

        let listener = __.pipe(
            evt => evt.detail
            D => __.setKeys(update(D, self.M))(self.M),
            __.return(my),
            ...then
        );
        my.doc().addEventListener('fst#'+evt, listener);
        return my;
    }

    my.up = (evt, ...then) => my.update(evt, __.id, ...then);
    
    my.refresh = (evt) => my.up(evt, f => f.redraw(), ...then);

    my.redraw = 
        () => {
            let node =  my.node();
            let fragment = my(false, !node);
            if (node) 
                node.replaceWith(fragment);
            return my;
        };
    
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

    my.nodeConf = ($M) => {

        let forKeys = o => f => __.forKeys(f)(o),
            M = $M(x => x),
            $MListener = l => (t => l(t, M));

        forKeys(attributes)(
            key => my.nodeSet(key, $M(my.attr(key)))
        );
        forKeys(self.properties)(
            key => my.node()[key] = $M(self.properties[key])
        );
        forKeys(events)(
            key => my.on(key).forEach(
                list => my.node()
                    .addEventListener(key, ...list.map($MListener))
            )
        );
        my.node().innerHTML = $M(my.html());
        my.node().value = $M(my.value());

        return my;
    }

    my.nodeAppend = (append) => {
        let parentNode = (self.stem && append)
                ? self.stem.node()
                : self.doc.createDocumentFragment();
        parentNode.appendChild(self.node);
        return my.parentNode(parentNode);
    }

    my.nodePaint = ($M) => {
        let target = self.plant
            ? self.doc.querySelector($M(self.plant))
            : self.doc.body;
        target.appendChild(my.parentNode());
        return my;
    }


/**************/
    my.start = (when, M, append=true) => {
        if (when === 'now')
            return my(M, append);
        else {
            let M = e => Object.assign(
                self.M,
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

    my.attr = obj => {
        if (typeof obj === 'string')
            return attributes[obj];
        Object.assign(attributes, obj);
        return my;
    }

    my.reclass = f => {
        my.class(f(my.class()));
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

    my.branch = (b) => {
        if (typeof b === 'undefined')
            return branches
        branches = b;
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
        if (t(b) === 'string' || Mfunction(b)) 
            return fst('text').html(b)
        if (Array.isArray(b)) 
            return (t(b[0]) === 'function')
                ? b 
                : fst(...b);
        return b
    }

    function parse (tag, a={}, b=[]) {
        let isBranches = 
            a => (Array.isArray(a) || Mfunction(a));
        if ( isBranches(a) )
            /* attr is branch */
            [a, b] = [{}, a];
        /** match "tagname#id.class.class2" **/
        let {classes, tagname, id} = fst.parseTag(tag);
        if (id) 
            Object.assign(a, {id});
        if (classes.length)
            Object.assign(a, {class: classes.join(' ')});
        /** out! **/
        return {tag: tagname, attr: a, branch: b};
    }
    
    my._fst = true;

    function Mfunction (x) {
        return (typeof x === 'function' && !x._fst);
    }

    my.show = (str) => {
        console.log(str);
        console.log(self);
        return my;
    }

    return __.getset(my, self, selfA);

}


/*** parse ***/
fst.parseTag = function (tag) {
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
