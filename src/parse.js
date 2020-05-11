module.exports = parse; 

let dom = require('./dom'),
    __ = require('lolo'),
    _r = __.r;

let isFunction = y => typeof y === 'function', 
    toFunction = y => isFunction(y) ? y : () => y;
    isBranches = b => Array.isArray(b) || isFunction(b);

function parse (t, a={}, b=[]) {

    if (t.self)
        return t.self;

    if (isBranches(a))
        [a, b] = [{}, a];

    let {tag, id, classes, place, put} = parse.tag(t),
        branch = b.map(parse.branch);

    let self = {
        // node 
        tag:        tag,
        svg:        tag === 'svg' || tag === 'g',
        attr:       {},
        prop:       {},
        style:      {},
        on:         {},
        html:       '',
        value:      '',
        class:      '',
        // IO location
        put:        put     || 'body',
        place:      place   || null,
        // pull-back
        pull:       __.id,
        // push-forward 
        push:       __.id,
        // type:
        type:       'node',
        // branches
        branch:     branch
    };

    if (id) 
        _r.assign({id})(a);

    if (classes.length) {
        let getClass = a.class 
            ?  M => toFunction(a.class)(M) + ' ' + classes.join(' ')
            : classes.join(' ');
        _r.set('class', getClass)(a); 
    }

    let other = ['html', 'value', 'svg', 'style'];
    self = _r.assign(_r.pluck(...other)(a))(self);
    attr = _r.without(...other)(a);
        
    let on = {};
    _r.forEach((v, k) => {
        if (/^on[\w]*/.test(k)) {
            on[k.replace(/^on/, '')] = v;
            delete attr[k];
        }
    })(attr);
    self = _r.assign({on}, {attr})(self);

    return self;
}

parse.branch = b => {
    if (typeof b === 'string' || isFunction(b)) 
        return dom('text').html(b)
    if (Array.isArray(b)) 
        return (typeof b[0] === 'function')
            ? b 
            : parse(...b)
    return b
};


parse.tag = string => {

    let re = /^(\w)+|(#[\w\-]*)|(\.[\w\-]*)|(:[\w\-]*)|(>\s[\w\-]*)/g,
        matches = string.match(re);

    let classes = [],
        tag = 'div',
        id = null,
        place = null,
        put = null;

    matches.forEach(m => {
        if (m[0] === '#')
            id =  m.slice(1,);
        else if (m[0] === '.')
            classes.push(m.slice(1,));
        else if (m[0] === ':') {
            place = m.slice(1,);
            classes.push(m.slice(1,));
        }
        else if (m[0] === '>') 
            put = m.slice(2,);
        else
            tag = m.length ? m : 'div';

    });

    return {tag, id, classes, place, put}
};
