module.exports = dom;

let __ = require('lolo'),
    Parse = require('./parse'),
    Model = require('./model');


// dom a :: a -> node
function dom (t, a, b) {
        
    let {tag, attr, branch, html} = Parse.args(t, a, b);

    let self = {
        // node 
        tag:        tag,
        svg:        tag === 'svg' || tag === 'g',
        attr:       attr,
        prop:       {},
        on:         {},
        html:       html || '',
        value:      '',
        class:      '',
        doc:        dom.document,
        // branches
        branch:     branch,
        // pull-back
        model:      M => M
    };

    let my = 
        M => {
            let $M = Model(self.model(M));
            return my.DOM.branch($M, my.DOM.node($M));
        }

    my.DOM = {};

    my.DOM.node =   
        $M => Node(self)($M);

    my.DOM.branch = 
        ($M, node) => {
            $M(self.branch)
                .forEach(b => node.appendChild(b.DOM.node($M)));
            return node;
        }

    my.append = 
        (...bs) => {
            self.branch = [...self.branch, ...bs];
            return my;
        };

    my._dom = true;

    return __.getset(my, self);
}
            

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
