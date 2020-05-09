let __ = require('lolo'),
    _r = __.r;
//    _t = require('./tracer');

/*------ Relations ------ 
    
    Check :: {
        type:   T Couple a a' -> T String
        equal:  T Pair a -> T Bool 
        array:  T Pair [b] -> T Bool 
        record: T Pair {b} -> T Bool 
    }

    T :: {
        bind:   T a -> (a -> T b) -> T b
        return: b -> T b
        map:    (T a -> T b) -> [T a] -> [T b] 
        rmap:   (T a -> T b) -> {T a} -> {T b}
        all:   [T Bool] -> T Bool
        rall:  {T Bool} -> T Bool
    }
    
    To define a map: 
    
        Couple a a' -> T Bool 
*///------ 

//  type : a -> String
let type = __(
    x => Array.isArray(x) ? 'array' : typeof x,
    str => str.replace('object', 'record')
);

//  check : Couple a a' -> T Bool 
let check = (pair, opt) => {
    return recursive()(pair); 
};

let recursive = (T=Maybe, C=check) => { 
    let next = {
        array:  ps => __(T.map(recursive(T, C)), T.all)(ps),
        record: ps => __(T.rmap(recursive(T, C)), T.rall)(ps)
    };
    return pair => T.bind(
        C.type(pair), 
        t => T.bind(
            (C[t] || C.equal)(pair), 
            next[t] 
                ? () => next[t](Pair[t](pair)) 
                : T.return
        )
    );
};

module.exports = check;

//------ Pair ------ 

let Pair = {}; 

//  .array : Pair [a] -> [Pair a]
Pair.array = ([a, b]) => 
    __.map2((ai, bi) => [ai, bi])(a, b);

//  .record : Pair {a} -> {Pair a} 
Pair.record = ([a, b]) => 
    _r.map2((ak, bk) => [ak, bk])(a, b);

//------ Maybe ------ 

let Maybe = {}; 

Maybe.fmap = f => ma => ma === null ? null : f(ma);
Maybe.return = a => a;
Maybe.join = __.id;
Maybe.bind = (ma, mf) => __(Maybe.fmap(mf), Maybe.join)(ma);

Maybe.map = f => __.map(Maybe.fmap(f));
Maybe.rmap = f => _r.map(Maybe.fmap(f));
Maybe.all = __.reduce((a, b) => a && b, true);
Maybe.rall = _r.reduce((a, b) => a && b, true);

//------ Checks ------

check.type = ([a, b]) => 
    type(a) === type(b) ? type(a) : null;

check.equal = ([a, b]) => 
    type(a) === 'function' ? true : a === b;

check.array = ([a, b]) => a.length === b.length || null;

check.subarray = ([a, b]) => a.length <= b.length || null;

check.record = ([a, b]) => {
    let [da, db] = diffKeys([a, b]);
    return (_r.isEmpty(da) && _r.isEmpty(db)) || null;
}
check.subrecord = ([a, b]) => _r.isEmpty(diffKeys([a, b])) || null;

function diffKeys ([a, b]) {
    let diff = (x, y) => type(x) !== 'undefined' && type(y) === 'undefined';
    return [
        _r.filter((_, k) => diff(a[k], b[k]))(a),
        _r.filter((_, k) => diff(b[k], a[k]))(b)
    ];
}

//------ Show Pairs ------

//  show : Pair a -> [String]
let show = ([e, o], str=__.id) => ['\n\n', ''
    + `\t> expected: ${str(e)}\n`
    + `\t> obtained: ${str(o)}\n`
];

show.equal  = p => show(p);
show.len    = p => ['in length:', ...show(p, arr => arr.length)];
show.type   = p => ['in type:', ...show(p, type)];
show.keys   = p => ['in keys:', ...show(p, r => JSON.stringify(r, null, 2))];
