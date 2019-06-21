(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dom = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*** __ ***/

let __ = 
    f => xs => f(...xs);

//////
module.exports = __;
//////

__.null = 
    () => {};

__.id =
    x => x;

__.return = 
    x => () => x;

__.val = 
    (f, x) => (!typeof x === 'undefined') ? f(x) : f;

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

__.map = 
    (...fs) => 
        arr => Array.isArray(arr)
            ? arr.map(__.pipe(...fs))
            : __.pipe(...fs)(arr);
            
__.forKeys = 
    (...fs) => 
        obj => Object.keys(obj).forEach(
            k => __.pipe(...fs)(obj[k], k)
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

__.setKeys = 
    (f, ...fs) => 
        obj => f 
            ? __.setKeys(...fs)(Object.assign(obj, __.val(f, obj)))
            : obj;

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
            (v, k) => out.push([v, k])
        );
        return out;
    };

/* misc */

__.getset = 
    (my, a, as) => getset(getsetArray(my, as), a);

__.sleep = 
    ms => new Promise(then => setTimeout(then, ms));

__.range =
    n => [...Array(n).keys()];


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
        (v, k) => my[k] = method(k)
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
        (v, k) => my[k] = method(k)
    )(attrs);
    return my;
}


},{}],2:[function(require,module,exports){
let __ = require('./__'),
    Parse = require('./parse'),
    Model = require('./model');

module.exports = dom;

dom.node = (pure) => {

    let self = {
        node:   null,
        M:      {},
        target: null
    };

    let my = pure,
        call = pure.call;

    my.call = 
        M => {
            my.update(M);

            let node = call(self.M);

            return __.do(
                my.node() 
                    ? n => my.node().replaceWith(n)
                    : n => my.root().appendChild(n),
                my.node
            )(node);

        };

    my.root = 
        () => my.doc().querySelector(self.target)
            || my.doc().body;

    my.remove = 
        () => {
            my.node().remove();
            return my.node(null);
        }

    my.update = 
        M => {
            my.M(
                __.setKeys(my.model()(M))(self.M)
            );

            let recur = M => 
                b => b.update 
                    ? b.update(M)
                    : b.branch().forEach(recur(b.model()(M)));

            my.branch().forEach(recur(my.M()));

            return my;
        }

    return __.getset(my, self);
}

dom.stack = (pure) => {

    let self = {
        nodes : [],
        M:      [],
        target: null
    };

}



// dom a :: a -> node

function dom (t, a, b) {
        
    let {tag, attr, branch, html} = Parse.args(t, a, b);

    let self = {
        // node construction 
        tag:        tag,
        svg:        tag === 'svg' || tag === 'g',
        attr:       attr,
        prop:       {},
        on:         {},
        branch:     branch,
        html:       html || '',
        value:      '',
        class:      '',
        doc:        dom.document,
        // model pull-back
        model:      M => M
    };

    let my = M => my.call(M);
    
    my.call = __.pipe(
        self.model,
        M => {
            let node = Node(self)(M);

            let append = b => {
                if (b._dom === 'stack')
                    b(M).forEach(n => node.appendChild(n));
                else if (b._dom === 'keys')
                    __.forKeys(n => node.appendChild(n))(b(M));
                else 
                    node.appendChild(b(M));
            };

            self.branch
                .forEach(append);

            return node;
        }
    );

    my.append = 
        (...bs) => {
            self.branch = [...self.branch, ...bs];
            return my;
        };

    my._dom = 'node'; 

    return __.getset(my, self);
}



// node a :: a -> singleNode
// (not exported) 

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

    let my = __.pipe(
        Model,
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
    );

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

},{"./__":1,"./model":3,"./parse":4}],3:[function(require,module,exports){
// model.js
// 
//  Essentially a tweaked implementation of '$':
//      $ :: a -> (a -> b) -> b
//      $ = M -> f -> f(M)
//  To account for the fact that attributes, etc. 
//  might be constant values or model-dependent functions. 

let __ = require('./__');

let isMfunction = 
    x => typeof x === 'function' && !x._dom;

function Model (M) {
    
    let my = 
        x => isMfunction(x) ? x(M) : x;
    
    my.listen = 
        l => (t => l(t, M));

    my.mapKeys = __.mapKeys(my);

    my.mapEvents = __.mapKeys(my.listen)
       
    /*
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
    */

    my.pipe = 
        (...fs) => __.pipe(
            ...fs.map(f => m => Object.assign(m, f(m))),
            Model
        )(M);

    return my;

};

Model.isFunction = isMfunction;

module.exports = Model;


},{"./__":1}],4:[function(require,module,exports){
let Model = require('./model'),
    dom = require('./dom');

let Parse = {};

let isArray = Array.isArray,
    isString = x => (typeof x === 'string'),
    isFunc = Model.isFunction;

Parse.args =        // dom('tag#id.class1.class2', [ ...bs ])
    
    (tag, a={}, b=[]) => {

        let isBranches = 
            a => (isArray(a) || isFunc(a));
        if ( isBranches(a) )
            [a, b] = [{}, a];

        let isHtml = 
            b => isArray(b) && (isString(b[0]) || isFunc(b[0]));
        if ( isHtml(b) ) {
            [html, b] = [b[0], []];
        }

        let {classes, tagname, id} = Parse.tag(tag);

        if (id) 
            Object.assign(a, {id});

        if (classes.length)
            Object.assign(a, {class: classes.join(' ')});

        return {tag: tagname, attr: a, branch: b, html};
    };


Parse.branch = 

    b => isArray(b) ? dom(...b) : b;


Parse.tag =             // match 'tagname#id.class.class2' 

    tag => {
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

module.exports = Parse; 

},{"./dom":2,"./model":3}]},{},[2])(2)
});