/*  << Schwartzian Transform >> 

    takes : 
        - fields: a -> [b]
        - signs:  [(+-)]
  
    returns : [(a, Key)] -> [Key] 

    This can then be used on arrays or records once they have 
    been transformed to key-value pairs, e.g. 

        rmap :                  {a} -> {b} 
        sort . toPairs :        {a} -> [Key] 
        map (bs.get) ks :       [b]
*///---

//  sortBy : (a -> [Ord], [+-]) -> [(a, Key)] -> [Key]
let sortBy = (fields, signs) => arr => {
    return arr
        .map(([x, k]) => [...fields(x), k])
        .sort(cmp.arr(signs))
        .map(fields => fields[fields.length - 1]);
}

//  cmp : Ord -> Ord -> +-= 
let cmp = (sign=1) => (x, y) => 
    sign * (x < y ? -1 : x > y ? 1 : 0);

// .arr : [Ord] -> [Ord] -> +-=
cmp.arr = (signs=[]) => ([x, ...xs],  [y, ...ys]) => 
    cmp(signs[0])(x, y) || cmp.arr(signs.slice(1))(xs, ys);

//  parse : [Str] -> (a -> [Ord], [+-])  
let parse = fields => [
    x => fields
        .map(k => k[0] === '!' ? k.slice(1) : k)
        .map(k => x[k]),
    fields
        .map(k => k[0] === '!' ? -1 : 1)
];

module.exports = (fields=[], signs) => Array.isArray(fields)
    ? sortBy(...parse(fields)) 
    : sortBy(fields, signs);
