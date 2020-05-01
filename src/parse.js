let dom = require('./dom'),
    __ = require('lolo'),
    _r = __.r;

let isFunction = 
    y => typeof y === 'function' && ! y._domInstance;

let Parse = {};

Parse.args =        // dom('tag#id.class1.class2', [ ...bs ])
    
    (tag, a={}, b=[]) => {

        let isBranches = 
            a => (Array.isArray(a) || isFunction(a));
        if (isBranches(a))
            [a, b] = [{}, a];
        
        b = b.map(Parse.branch);

        let {classes, tagname, id, other} = Parse.tag(tag);
        
        if (id) 
            Object.assign(a, {id});
        
        if (classes.length) {
            let a_class = a.class, 
                getClass = a_class 
                    ?  M => __(a_class)(M) + ' ' + classes.join(' ')
                    : classes.join(' ');
            Object.assign(a, {class: getClass});
        }

        let otherKeys = ['html', 'value', 'svg', 'style'];
        
        Object.assign(other, _r.pluck(...otherKeys)(a));
        attr = _r.without(...otherKeys)(a);

        let on = {};

        _r.forEach((v, k) => {
            if (/^on[\w]*/.test(k)) {
                on[k.replace(/^on/, '')] = v;
                delete attr[k];
            }
        })(attr);

        Object.assign(other, {on});
        other = _r.filter(v => typeof v !== 'undefined')(other);

        return {tag: tagname, attr, branch: b, other};
    };


Parse.branch = 

    b => {
        let t = x => (typeof x);
        if (t(b) === 'string' || isFunction(b)) 
            return dom('text').html(b)
        if (Array.isArray(b)) 
            return (t(b[0]) === 'function')
                ? b 
                : dom(...b)
        return b
    };


Parse.tag =             // match 'tagname#id.class.class2' 

    tag => {
        let re = /^(\w)+|(#[\w\-]*)|(\.[\w\-]*)|(:[\w\-]*)|(>\s[\w\-]*)/g,
            matches = tag.match(re);

        let classes = [],
            tagname = 'div',
            id = null,
            other = {}; 

        matches.forEach(m => {
            if (m[0] === '#')
                id =  m.slice(1,);
            else if (m[0] === '.')
                classes.push(m.slice(1,));
            else if (m[0] === ':') {
                other.place = m.slice(1,);
                classes.push(m.slice(1,));
            }
            else if (m[0] === '>') 
                other.put = m.slice(2,);
            else
                tagname = m.length ? m : 'div';

        });

        return {classes, tagname, id, other}
    };

module.exports = Parse; 
