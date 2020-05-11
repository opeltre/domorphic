let __ = require('lolo'),
    _r = __.r,
    Tracer = require('./tracer');

/*------ Check ------ 
    
    Recursively compare two input objects.

    This is done inside a monad `T` composing `Maybe` 
    with the `Writer` monad to trace errors: 

        check : Couple a a' -> T () 

    Note the natural bijection between `Maybe ()` and `Bool`,
    so that `T ()` just represents verbose booleans.  

    Check :: {
        type:   Couple a a' -> T String
        equal:  Pair a -> T () 
        array:  Pair [b] -> T () 
        record: Pair {b} -> T () 
    }

    T :: {
        bind:   T a -> (a -> T b) -> T b
        return: b -> T b
        map:    (a -> T b) -> [a] -> [T b] 
        rmap:   (a -> T b) -> {a} -> {T b}
        all:   [T b] -> T ()
        rall:  {T b} -> T ()
    }
    
*///------ 

//  type : a -> String
let type = __(
    x => Array.isArray(x) ? 'array' : typeof x,
    str => str.replace('object', 'record')
);

//  main : Couple a a' -> T Bool 
let main = (a, b) => {
    let tpair = [[a, b], ['\n', 'CheckError:\n']]
    return Tracer.bind(
        tpair, 
        recursive()
    );
};

main.sub = (a, b) => { 
    let tpair = [[a, b], ['\n', 'CheckError: (subrecord)\n']],
        C = _r.set('record', Tcheck.subrecord)(Tcheck)
    return Tracer.bind(
        tpair,
        Tracer.try(recursive(C))
    );
};

let recursive = (C=Tcheck, T=Tracer) => { 
    let next = {
        array:  ps => __(T.map(recursive(C, T)), T.all)(ps),
        record: ps => __(T.rmap(recursive(C, T)), T.rall)(ps)
    };
    return pair => T.bind(
        C.type(pair), 
        t => T.bind(
            (C[t] || C.equal)(pair), 
            mb => next[t]
                ? next[t](Pair[t](pair))
                : T.return(mb)
        )
    );
};

let parse = options => {
    let C = _r.map(__.id)(Tcheck);
    if (/sub/.test(options)) 
        C = _r.set('record', C.subrecord)(C);
    if (/suba/.test(options))
        C = _r.set('array', C.subarray)(C);
    return [C, Tracer];
}

module.exports = main;

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

//------ Checks Maybe ------

let check = {}; 

check.type = ([a, b]) => 
    type(a) === type(b) ? type(a) : null;

check.equal = ([a, b]) => 
    type(a) === 'function' ? true : a === b || null;

check.array = ([a, b]) => a.length === b.length || null;

check.subarray = ([a, b]) => a.length <= b.length || null;

check.record = ([a, b]) => {
    let [da, db] = diffKeys([a, b]);
    return (_r.isEmpty(da) && _r.isEmpty(db)) || null;
}
check.subrecord = ([a, b]) => _r.isEmpty(diffKeys([a, b])[0]) || null;

function diffKeys ([a, b]) {
    let diff = (x, y) => type(x) !== 'undefined' && type(y) === 'undefined';
    return [
        _r.filter((_, k) => diff(a[k], b[k]))(a),
        _r.filter((_, k) => diff(b[k], a[k]))(b)
    ];
}

//------ Trace ------

let json = r => JSON.stringify(r);

//  msg : Pair a -> [String]
let msg = ([e, o], str=__.id) => ['\n\n', ''
    + `\t> expected: ${str(e)}\n`
    + `\t> obtained: ${str(o)}\n`
    + '\n'
];

msg.type   = p => ['in type:', ...msg(p, type)];
msg.equal  = p => msg(p);
msg.array  = p => ['in length:', ...msg(p, arr => arr.length)];
msg.record = p => ['in keys:', ...msg(diffKeys(p), json)];

msg.subarray = msg.array;
msg.subrecord = msg.record;

Tcheck = _r.map(
    (ck, k) => Tracer.writes(msg[k])(ck)
)(check); 

_r.assign(Tcheck)(main);
