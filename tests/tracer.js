let __ = require('lolo'),
    _r = __.r,
    Writer = require('./writer');

/*------  Tracer Monad ------ 

    Write logs upon failure, discard them otherwise.

        Tracer a = Writer (Maybe a)

*///------

let Tracer = {}; 

Tracer.return = a => [a, []]; 

Tracer.join = ([mta, log0]) => 
    mta === null ? [null, log0] : [mta[0], log0.concat(mta[1])];

Tracer.fmap = f => ([ma, logs]) => {
    if (ma === null) 
        return [null, logs];
    try {
        return [f(ma), logs];
    } catch (err) {
        return [null, logs.push(err)];
    }
}

Tracer.bind = (ta, tf) => 
    __(Tracer.fmap(tf), Tracer.join)(ta);


//------ Write ------

//    .writes : (a -> [s]) -> (a -> Maybe b) -> a -> T b 
Tracer.writes = msg => f => a => {
    let mb = f(a);  
    return mb === null ? [null, msg(a)] : [mb, []];
};

//------ Log and Throw ------ 

//    .log : T a -> T a 
Tracer.log = ([ma, lines], eol='') => {
    let string = lines.reduce(
        (ls, l) => {
            if (l instanceof Error) {
                console.log(ls);
                console.error(l);
                return '';
            }
            return ls + eol + l;
        },
        ''
    );
    console.log(string);
    return [ma, []];
}

//    .try : (a -> T b) -> (a -> T b)
Tracer.try = (tf, err) => (...as) => {
    try {
        return Tracer.throw(tf(...as), err);
    } catch (err) {
        return [null, [err]];
    }
}

//    .throw : T a -> T a
Tracer.throw = (ta, err=Error('Thrown in trace'), eol='') => 
    Tracer.bind(ta, ma => {
        if (ma === null) 
            throw err;
        return [ma, []];
    });

//    .catch : T a -> T a
Tracer.catch = (tb, act=Tracer.log) => 
    tb[0] === null
        ? act(tb)
        : tb;


//------ Maps and Folds ------ 

let logs = {
    map:    i => `[${i}] -> `,
    rmap:   k => `{${k}} -> `,
    all:    {
        success: () => '',
        failure: () => ''
    }
}; 

//    .map : (a -> T b) -> [a] -> [T b]
Tracer.map = (tf, log=logs.map) => __.map(
    (a, i) => Writer.prepend(log(i))(tf(a, i))
); 
//    .rmap : (a -> T b) -> {a} -> {T b}
Tracer.rmap = (tf, log=logs.rmap) => _r.map(
    (a, k) => Writer.prepend(log(k))(tf(a, k))
);

//    .and : T a -> T a -> T ()
Tracer.and = ([m0, log0], [m1, log1]) => m0 && m1 
    ? [true, []]
    : [null, m1 ? log0 : log0.concat(log1)];

let acc = ([{pass, fail}, log0], [m1, log1]) => m1 === null 
    ? [{pass, fail: fail + 1}, log0.concat(log1)]
    : [{pass: pass + 1, fail}, log0]

let all = reduce => (ta, log={}) => {
    let start = Date.now();
        tb = reduce(acc, [{pass:0, fail:0}, []])(ta),
        time = Date.now() - start,
        log = _r.update(log)(logs.all);
    return Tracer.bind(
        tb,
        ({pass, fail}) => fail === 0 
            ? [true, [log.success({pass, fail, time})]]
            : [null, [log.failure({pass, fail, time})]]
    );
};

//    .all : [T a] -> T ()
Tracer.all = all(__.reduce);

//    .rall : {T a} -> T ()
Tracer.rall = all(_r.reduce);

['map', 'rmap', 'all', 'rall'].forEach(m => 
    Tracer[m].writes = log => __.bindr(log)(Tracer[m])
);
    
module.exports = Tracer;
