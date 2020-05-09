/*------- Writer Monad ------ 

    The `Writer` monad transforms the type `a` given a writing type `s` as: 

        W a = (a, [s])

*///------

let Writer = {}; 

//    .unit : a -> W a
Writer.unit = a => [a, []];

//    .fmap : (a -> b) -> W a -> W b
Writer.fmap = f => ([a, s]) => [f(a), s];

//    .join : W (W a) -> a 
Writer.join = ([[a, s1], s0]) => [a, s0.concat(s1)]; 

//    .bind : W a -> (a -> W b) -> W b
Writer.bind = (wa, wf) => Writer.join(Writer.fmap(wf)(wa));

//    .do : W a -> (a -> W b) -> (b -> W c) -> ... -> W d
Writer.do = wa => __.reduce(Writer.bind, wa);

//------ Read ------

//    .read : W a -> a
Writer.read = ([a, s]) => a;

//------ Write ------

//    .prepend : s -> W a -> W a
Writer.prepend = l => ([a, ls]) => [a, [l, ...ls]];

//    .append : s -> W a -> W a
Writer.append = l => ([a, ls]) => [a, [...ls, l]];

//    .modify : (s -> s) -> W a -> W a
Writer.modify = f => ([a, s]) => [a, f(s)]; 

//------ Filter ------

//    .filter : (a -> Bool) -> W a -> W a 
Writer.filter = bf => ([a, s]) => [a, bf(a) ? s : []]

//------
module.exports = Writer; 
