let parse = require('../src/parse'),
    data = require('../src/data'),
    check = require('./check'),
    __ = require('lolo'),
    _r = __.r;

let tree = __(parse, data),
    node = __(parse, data.node);

//------ Node ------ 

let div = {
    tag:   'div',
    classes: ['class1', 'class2'],
    html:  'lots of html'
}
exports.node_constant = () => {
    let obtain = node('div', {
        classes:  ['class1', 'class2'],
        html:   'lots of html'
    })();
    return check.sub(div, obtain);
}
exports.node = () => {
    let M = {cls: 'class2', html: 'lots of html'};
    let obtain = node('div.class1', {
        classes: [m => m.cls],
        html: m => m.html
    })(M);
    return check.sub(div, obtain); 
}

//------ Branches ------

let svg = [ 
    { tag: 'svg'},
    [
        [{tag: 'circle', attr: {cx: 0, cy: 1, r: 1}}, []],
        [{tag: 'circle', attr: {cx: 1, cy: 2, r: 3}}, []]
    ]
];
exports.branch_constant = () => {
    let obtain = tree('svg', [
        ['circle', {cx: 0, cy: 1, r: 1}],
        ['circle', {cx: 1, cy: 2, r: 3}]
    ])();
    return check.sub(svg, obtain);
}
exports.branch = () => {
    let M = [[0, 1], [1, 2]];
    let obtain = tree('svg', ms => ms.map(
        ([cx, cy]) => ['circle', {cx, cy, r: cx + cy}]
    ))(M);
    return check.sub(svg, obtain); 
}

//------ Listeners ------

exports.listener = () => {
    let button = node('button', {
        onclick: (e, m) => `${e.target} clicked ${m+1} times`
    })(3);
    let expect = '<button> clicked 4 times',
        obtain = button.on['click']({target: '<button>'});
    return check(expect, obtain);
}

//------ Pull ------

exports.pull = () => {
    let expect = [{tag: 'circle', attr: {cx: 4, cy: 9, r:2}}, []],
        obtain = tree('circle', {
            cx: m1 => m1.cx,
            cy: m1 => m1.cy,
            r:  m1 => m1.r, 
            pull: m0 => ({cx: 2 ** m0, cy: 3 ** m0, r: m0})
        })(2);
    return check.sub(expect, obtain);
}

//------ Map ------ 

exports.map = () => {
    let item = parse('li:fruit', {html: mi => mi}),
        list = tree('ul', {}, {self: {node: item, type: 'map'}});
    let expect = [{tag: 'ul'}, [
        [{tag: 'li', html: 'apples',  place:['[fruit]', 0]}, []],
        [{tag: 'li', html: 'bananas', place:['[fruit]', 1]}, []]
    ]];
    let obtain = list(['apples', 'bananas']);
    return check.sub(expect, obtain);
}

exports.rmap = () => {
    let student = parse('li:student', {
        html: (mk, k) => `${k} got ${mk.grade}`
    }); 
    let classroom = tree('ul', {}, {self: {
        node: student, type: 'rmap', sortBy: [['!grade']]
    }});
    let expect = [{tag: 'ul'}, [
        [{html: 'alice got 20', place: ['{student}', 'alice']}, []],
        [{html: 'carl got 20',  place: ['{student}', 'carl']},  []],
        [{html: 'bob got 0',    place: ['{student}', 'bob']},   []]
    ]];
    let obtain = classroom({
        bob:    {grade: 0,  bday: '22.06'},
        carl:   {grade: 20, bday: '08.02'}, 
        alice:  {grade: 20, bday: '05.07'}
    })
    return check.sub(expect, obtain);
}

