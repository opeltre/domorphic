/* 
 * L'ARBRE DOM VIRTUEL
 */

let Parse = require('./parse'),
    Node = require('./node');

function dom (tag, attr, branch) {

    let {tag, attr, branch} = Parse.args(tag, attr, branch);

    let N = {
        tag: tag,
        svg: tag === 'svg' || tag === 'g',
        attributes: attr,
        properties: {},
        events:     {},
        html:       '',
        value:      '',
        class:      '',
    };
    
    var self = {
        M:          {},
        plant :     null,
        stem :      null,
        node :      null,
        parentNode : null,
        doc :       dom.document,
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
        /** node **/
        let node = Node(N, doc)(M);

        /** branch **/
        $M(my.branch())
            .map($M)
            .map(parseBranch)
            .map(b => b.link(my))
            .forEach(b => b(self.M));
        return my;
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

    my.update = (evt, update, ...then) => {

        let listener = __.pipe(
            evt => evt.detail
            D => __.setKeys(update(D, self.M))(self.M),
            __.return(my),
            ...then
        );
        my.doc().addEventListener('dom#'+evt, listener);
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

    my._dom = true;

    function Mfunction (x) {
        return (typeof x === 'function' && !x._dom);
    }

    my.show = (str) => {
        console.log(str);
        console.log(self);
        return my;
    }

    return __.getset(my, self, selfA);

}


/*** emit ***/

dom.on = function (name, ...then) {
    dom.document.addEventListener(
        'dom#' + name,
        __.do(...then)
    );
}

dom.emit = function (name, data=__.id, ...more) {
    
    if (!name) 
        return __.null;

    let getData = 
         (evt = {}) => (typeof data === 'function')
            ? data(evt.target || evt)
            : data;
    let emit = 
        evt => dom.document.dispatchEvent(new CustomEvent(
            'dom#' + name,
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
            () => dom.debug,
            __.do(emit, debug),
            emit
        );
    return __.do(handler, dom.emit(...more));

}

dom.document = (typeof document === 'undefined') 
    ? {dispatchEvent: __.null, addEventListener: __.null}
    : document;

dom.document.addEventListener(
    'DOMContentLoaded', 
    dom.emit('dom')
);
