let __ = require('./__');

/*------ tree type ------ 
 
    tree(n) :: (
        n,
        [tree(n)]
    ) 
    
    tree(m, n) :: (
        m -> n, 
        m -> [tree(m, n)] 
    )
*/
let isFunction = 
    tn => typeof tn === 'function'

let toFunction = 
    tn => isFunction(tn) ? tn : () => tn;

let tree = 
    ([tn, tb]) => [
        toFunction(tn), 
        __.pipe(toFunction(tb), __.map(tree))
    ]

//  .fmap : (n -> n') -> tree(m, n) -> tree(m, n')
tree.fmap = 
    f => ([tn, tb]) => [ 
        __.pipe(tn, f),
        __.pipe(tb, __.map(tree.fmap(f)))  
    ];

//  .cofmap : (m -> m') -> tree(m', n) -> tree(m, n)
tree.cofmap = 
    g => ([tn, tb]) => [
        __.pipe(g, tn),
        __.pipe(g, tb, __.map(tree.cofmap(g)))
    ];

//  .eval : m -> tree(m, n) -> tree(n)
tree.eval = 
    M => ([tn, tb]) => [
        tn(M),
        __.map(tree.eval(M))(tb(M))
    ];

//  .return : n -> tree(m, n)
tree.return = 
    N => [
        () => N,
        () => []
    ];

//  .compose : tree(m, tree(m, n)) -> tree(m, n)
tree.compose = 
    ([ttn, ttb]) => [
        M => ttn(M)[0],
        M => [
            ...ttn(M)[1], 
            ...ttb(M).map(tree.compose)
        ]
    ];

module.exports = tree;
