const fs = require('fs'),
    { JSDOM } = require('jsdom'),
    fst = require('./bundle'),
    __ = fst.__; 

fst.Doc = function () {

    let self = {
        html : null,
        nodes : [],
        model: [],
        parse: __.id,
        scripts: [],
        style: [],
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
            ? fs.readFile(self.html) 
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
            self.scripts.forEach(s => linkScript(d,s))
            self.style.forEach(s => linkStyle(d,s));
        }

    my.send = 
        res => 
            dom => res.send(dom.serialize());

    my.use = 
        (...ns) => my.nodes(my.nodes().concat(ns));

    return __.getset(my, self);
    
}

/* ... */

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
    script.src = paths.script(s);
    node.appendChild(script);
}

function linkStyle (doc, href) {
    let sheet = doc.createElement('link');
    sheet.rel = "stylesheet";
    sheet.href = paths.style(s);
    doc.head.appendChild(sheet);
}

/*** vv_ ***

function vv_ (name) {
    let my = vv_.get(name)
    return my;
}

vv_.nodes = {};

vv_.get = 
    name => vv_.nodes[name] || vv_.new(name);

vv_.new = 
    name => {
        vv_.nodes[name] = fst.Forest();
        return vv_.nodes[name];
    };
*/

module.exports = fst;
