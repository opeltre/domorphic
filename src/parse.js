let Model = require('./model'),
    dom = require('./dom');

let isArray = Array.isArray,
    isString = x => (typeof x === 'string'),
    isFunc = Model.isFunction;

let Parse = 
    (t, a, b, s) => isString(t) 
        ? Parse.self(t,a,b,s)
        : Parse.self('',{},[],t);


Parse.self = 
    (t, a, b, s) => Object.assign(
        Parse.args(t, a, b),
        {
            prop:       {},
            on:         {},
            value:      '',
            class:      '',
            doc:        dom.document,
            model:      M => M
        },
        s || {}
    );


//  {tag, attr, branch, html} = Parse.args(t, a, b)

Parse.args =        // dom('tag#id.class1.class2', [ ...bs ])
    
    (tag='div', A={}, B=[]) => {

        let isBranches = 
            A => (isArray(A) || isFunc(A));
        if ( isBranches(A) )
            [A, B] = [{}, A];

        let html = ''; 
        let isHtml = 
            B => isArray(B) && (isString(B[0]) || isFunc(B[0]));
        if ( isHtml(B) ) {
            [html, B] = [B[0], []];
        }
        B = B.map(Parse.branch);

        let {classes, tagname, id} = Parse.tag(tag || '');

        let svg = tagname === 'svg' || tagname === 'g';

        if (id) 
            Object.assign(A, {id});

        if (classes.length)
            Object.assign(A, {class: classes.join(' ')});

        return {tag: tagname, attr: A, branch: B, html, svg};
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
