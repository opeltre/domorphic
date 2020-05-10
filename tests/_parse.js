let parse = require('../src/parse'),
    check = require('./check'),
    __ = require('lolo'),
    _r = __.r;

exports.tag = () => {
    let expect = {tag: 'tag', id: 'id', classes: ['class1', 'class2']},
        obtain = parse.tag('tag#id.class1.class2');
    return check.sub([expect, obtain]);
}

exports.locators = () => {
    let expect = {tag: 'div', place: 'here', put: 'parent'},
        obtain = parse(':here > parent');
    return check.sub([expect, obtain]);
}

exports.attr = () => {
    let expect = {tag: 'circle', attr: {id: 'id', cx: '5', cy: '10', r: '3'}},
        obtain = parse('circle#id', {cx: '5', cy: '10', r: '3'});
    return check.sub([expect, obtain]);
}

exports.branch = () => {
    let expect = [
        {tag: 'g', branch: [{tag: 'circle'}, {tag: 'rect'}]},
        {tag: 'g', branch: [{tag: 'polyline'}]}
    ];
    let obtain = parse('svg', [
        ['g', [['circle'], ['rect']]],
        ['g', [['polyline']]]
    ]).branch;
    return check.sub([expect, obtain]);
}

exports.attr_and_branch = () => {
    let expect = {
        attr: {tag: 'main', style: 'color: blue;', height: '100'},
        branch: [
            {tag: 'h1', html: 'testing'}, 
            {tag: 'p', html: 'is really fun'}
        ]
    }
    let obtain = parse('main', 
        {style: 'color: blue;', height: '100'}, 
        [
            ['h1', {html: 'testing'}], 
            ['p', {html: 'is really fun'}]
        ]
    );
    checks.sub([expect, obtain]);
}
