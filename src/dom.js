module.exports = dom;

let __ = require('./__'),
    Parse = require('./parse'),
    Model = require('./model');

dom.__ = __;

// .tree : dom(m) -> tree(m, data)
dom.tree = t => {

    //  pullback : tree(m', data) -> tree(m, data)
    let pullback = t.model() 
        ? tree.cofmap(t.model())
        : __.id;
    
    //  node : m -> data
    let node = data.apply(t.data());

    //  branch : m -> [tree(m, data)]
    let branch = M => {
        let b = __(t.branch())(M);
        if (b._mapInstance)
            return b.trees(M);
        else
            return __.map(dom.tree)(b);
    };
                
    return pullback([node, branch]);
}


//------ dom(m) :: m -> node ------

function dom (t, a, b) {
        
    let {tag, attr, branch, html} = Parse.args(t, a, b);

    let self = {
        // node construction 
        tag:        tag,
        svg:        tag === 'svg' || tag === 'g',
        attr:       attr,
        prop:       {},
        style:      {},
        on:         {},
        branch:     branch,
        html:       html || '',
        value:      '',
        class:      '',
        doc:        dom.document,
        // branches
        branch:     branch,
        // pull-back
        model:      __.id
    };
    
    //  my : m -> node
    let my = 
        (M={}) => __(
            tree.apply(dom.tree(my)),   // tree(data)
            tree.nat(data.link),        // tree(data) -> tree(data)
            tree.map(node.unit),        // tree(data) -> tree(node)
            tree.nat(node.link)         // tree(node) -> node
        )(M);

    //.tree : m -> tree(data)
    my.tree = 
        M => tree.apply(dom.tree(my))(M || {});

    //.data : () -> data(m) 
    my.data = 
        () => _r.without('branch', 'model')(self);

    my.append = 
        (...bs) => {
            self.branch = [...self.branch, ...bs];
            return my;
        };

    my._dom = true;

    return __.getset(my, self);
}


//------ [dom](m) :: [m] -> [node] ------

dom.map = function (node) {
    
    //  node :  dom(m')
    //  model : m -> [m'] 
    let self = {
        node :  node,
        model : M => M
    };
    
    //.trees : m -> [tree(m, data)]
    my.trees = 
        M => {
            let t = dom.tree(self.node);
            return __.map(
                mi => tree.cofmap(__(mi))(t)
            )(self.model(M));
        };

    my._mapInstance = true; 

    return __.getset(my, self);
}



let createElement =
    tag => {
        let my = {tag, branch: []};
        my.appendChild = elem => my.branch.push(elem);
        my.setAttribute = __.null;
        my.setAttributeNS = __.null;
        my.addEventListener = __.null;
        return my;
    };

dom.select = 
    str => typeof str === 'string' 
        ? document.querySelector(str)
        : str;

dom.append = 
    (str, node) => dom.select(str).appendChild(node());

dom.replace = 
    (str, node) => dom.select(str).replaceWith(node());

dom.remove = 
    (str) => dom.select(str).remove();

dom.set = 
    (str, attrs) => {
        let N = dom.select(str), 
            setAttr = N instanceof SVGElement 
                ? (v, k) => N.setAttributeNS(null, k, v)
                : (v, k) => N.setAttribute(k, v);
        __.forKeys(setAttr)(attrs);
    }

dom.loop = 
    (dt, tick) => 
        t => Promise.resolve(t)
            .then(tick)
            .then(() => __.sleep(dt))
            .then(() => t + dt)
            .then(dom.loop(dt, tick))
            
        

// node a :: a -> singleNode

function Node (N) { 

    let parentNode = null;

    let create = 
        () => N.svg
            ? createSvg(N.doc, N.tag)
            : N.doc.createElement(N.tag)

    let setAttribute = 
        (k, v, node) => N.svg
            ? setSvg(k, v, node)
            : node.setAttribute(k, v, node)

    let my = 
        M => {
            let node = create();

            __.forKeys(
                (v, k) => setAttribute(k, v, node)
            )(M.mapKeys(N.attr));

            __.forKeys(
                (v, k) => node[k] = v
            )(M.mapKeys(N.prop));

            __.forKeys(
                (v, k) => node.addEventListener(k, v)
            )(M.mapEvents(N.on));

            node.innerHTML = M(N.html);

            node.value = M(N.value);

            return node;
        }

    return my;
}



/*************     dom     ***************/

dom.document = (typeof document === 'undefined') 
    ? {dispatchEvent: __.null, addEventListener: __.null}
    : document;
/*
dom.document.addEventListener(
    'DOMContentLoaded', 
    dom.emit('dom')
);
*/

/*************      svg      *************/

function setSvg (key, val, node) {
    node.setAttributeNS(null, key, val);
}

function createSvg (doc, tag) {
    let svgNS = "http://www.w3.org/2000/svg",
        node = doc.createElementNS(svgNS, tag);
    if (tag === 'svg')
        node.setAttributeNS(
            "http://www.w3.org/2000/xmlns/", 
            "xmlns:xlink", 
            "http://www.w3.org/1999/xlink"
        );
    return node;
}
