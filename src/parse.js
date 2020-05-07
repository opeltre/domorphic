let dom = require('./dom'),
    __ = require('lolo'),
    _r = __.r;

let isFunction = y => typeof y === 'function' && ! y._domInstance, 
    isBranches = b => Array.isArray(b) || isFunction(b);

let parse = (t, a={}, b=[]) => {

    if (t._domInstance)
        return t.self;

    if (isBranches(a))
        [a, b] = [{}, a];

    let branch = b.map(Parse.branch),
        {tag, id, classes, place, put} = Parse.tag(t);
    
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
        put:        put || 'body' 
        place:      place || null
        // pull-back
        pull:       __.id,
        // push-forward 
        push:       __.id,
        // branches
        branch:     branch,
    };

    if (id) 
        _r.assign({id})(a);

    if (classes.length) {
        let a_class = a.class, 
            getClass = a_class 
                ?  M => __(a_class)(M) + ' ' + classes.join(' ')
                : classes.join(' ');
        _r.assign({class: getClass})(a);
    }

    let other = ['html', 'value', 'svg', 'style'],
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
            : dom(...b)
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

module.exports = parse; 
