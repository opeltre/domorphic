module.exports = parse; 

let dom = require('./dom'),
    __ = require('lolo'),
    _r = __.r;

let isFunction = y => typeof y === 'function', 
    toFunction = y => isFunction(y) ? y : () => y,
    isBranches = a => Array.isArray(a) || isFunction(a);

function parse (t, a={}, b) {

    //--- arguments --- 

    // (dom('circle'))
    if (t.self)
        return t.self;
    // ([t, {as}, [bs])
    if (Array.isArray(t))
        return parse(...t)
    // (t, m?[bs]) or (t, m?{as}, []) 
    if (!b) 
        [a, b] = isBranches(a) ? [{}, a] : [a, []];

    //------

    let {tag, id, classes, place, put} = parse.tag(t);

    let branches = ns => Array.isArray(ns)
        ? __.map(parse)(ns) 
        : parse(ns);
    
    let self = {
        //  node
        tag:        tag,
        svg:        tag === 'svg' || tag === 'g',
        attr:       id ? {id} : {},
        class:      '',
        classes:    classes.concat(a.classes || []),
        //  IO location
        put:        put     || 'body',
        place:      place   || null,
        //   branches
        branch:     isFunction(b) ? __(b, branches) : branches(b)
    };
    
    let join = {
        //  node
        html:       a.html  || '',
        value:      a.value ||'',
        style:      a.style || {},
        prop:       a.prop  || {},
        on:         a.on    || {},
        //  pull-back
        pull:       a.pull  || __.id,
        //  push-forward 
        push:       a.push  || __.id,
        //  type:
        type:       a.type  || 'node'
    }; 

    let attr = _r.without(..._r.keys(join))(a);
    
    let onkeys = _r.keys(attr)
        .filter(k => /^on/.test(k));

    onkeys
        .forEach(k => {
            join.on[k.slice(2)] = attr[k];
            delete attr[k];
        });

    self.attr = _r.update(attr)(self.attr);

    return _r.update(join)(self);
}

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
