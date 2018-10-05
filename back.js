const fs = require('fs').promises,
    path = require('path'),
    { JSDOM } = require('jsdom'),
    fst = require('./bundle'),
    __ = fst.__; 

fst.doc = (src) => {

    let self = {
        html : src,
        nodes : [],
        model: [],
        parse: __.id,
    };
    let selfA = {
        script: [],
        style: []
    };

    function my (req, res) {

        return Promise
            .all([
                my.getDom(),
                my.getModel(req)
            ])
            .then(__.do(
                __.X(my.render),
                __.X(my.link),
                __.X(my.send(res))
            ));
    }

    my.getHtml = 
        () => self.html 
            ? fs.readFile(htmlPath(self.html)) 
            : Promise.resolve('');

    my.getDom =
        () => my.getHtml()
            .then(html => new JSDOM(html))

    my.getModel = 
        (req) => {
            let R = self.parse(req),
                M = self.model;

            let promise = (x, k) => Promise.resolve(
                typeof x === 'function'
                    ? [x(R), k]
                    : [x, k]
            );
           
            return Promise
                .all(__.toPairs(M).map(promise))
                .then(__.toKeys)
        }
            
    my.render =
        (dom, model) => my.nodes().forEach(
                n => n.doc(dom.window.document)(model)
        );

    my.link = 
        dom => {
            let doc = dom.window.document;
            my.script().forEach(s => linkScript(doc, s))
            my.style().forEach(s => linkStyle(doc, s));
        }

    my.send = 
        res => 
            dom => res.send(dom.serialize());

    my.use = 
        (...ns) => my.nodes(my.nodes().concat(ns));

    return __.getset(my, self, selfA);
    
}

/* ... */
function htmlPath (p) {
    return path.join((module.parent.filename || __filename), '..', p + '.html')
}

let ifRelative = (f) => 
    name => ( name[0] === '/' || /^https?:\/\//.test(name) )
        ? name 
        : f(name);

let defaultPaths = {
    style : ifRelative(name => '/style/'+ name + '.css'), 
    script : ifRelative(name => '/lib/' + name + '.js')
};

let paths = defaultPaths;

function linkScript (doc, src) {
    let node = doc.head,
        script = doc.createElement('script');
    script.src = paths.script(src);
    node.appendChild(script);
}

function linkStyle (doc, href) {
    let sheet = doc.createElement('link');
    sheet.rel = "stylesheet";
    sheet.href = paths.style(href);
    doc.head.appendChild(sheet);
}


let docs = {};

fst.$$ = (name) => {

    let create = name => {
        docs[name] = fst.doc();
        return docs[name];
    };
    
    let get =  name => 
        docs[name] || create(name);

    let my = get(name)

    return my;
}

module.exports = fst;
