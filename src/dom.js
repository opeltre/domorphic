module.exports = dom;

let __ = require('lolo'),
    parse = require('./parse'),
    data = require('./data'),
    node = require('./node');

let _r = __.record();

// dom a :: a -> node
function dom (t, a, b) {
        
    let {tag, attr, branch, html} = parse.args(t, a, b);

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
        M => __(data.build(my.data()), node.build)(M);

    my.data = 
        () => self;

    my.append = 
        (...bs) => {
            self.branch = [...self.branch, ...bs];
            return my;
        };

    my._domInstance = true;

    return __.getset(my, self);
}

dom.document = (typeof window !== 'undefined')
    ? window.document
    : ({
        createElement : 
            tag => {
                let my = {tag, branch: []};
                my.appendChild = elem => my.branch.push(elem);
                return my;
            }
    })
