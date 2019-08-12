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

        let html = ''; 
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
