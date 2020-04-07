let __ = require('lolo');

/*------ tree type ------ 
 
    N.B. This file should be moved to the `__` package. 

    tree(n) :: (
        n,
        [tree(n)]
    ) 
    
    tree(m, n) :: (
        m -> n, 
        m -> [tree(m, n)] 
    )

    More generally, we should view tree(m, n) as a type class: 

    t(m, n) instance tree(m, n) where: 

        t :         (m -> n) -> (m -> [t(m, n)]) -> t(m, n)
        
        t.node :    t(m, n) -> m -> n

        t.branch :  t(m, n) -> m -> [t(m, n)]

*/

//  .eval : m -> tree(m, n) -> tree(n)
tree.eval = 
    M => ([tn, tb]) => [
        tn(M),
        __.map(tree.eval(M))(tb(M))
    ];

//  .apply : tree(m, n) -> m -> tree(n)
tree.apply = 
    t => M => tree.eval(M)(t);

//  .develop : (m -> tree(n)) -> tree(m, n)
tree.develop = 
    t => [
        M => t(M)[0],
        M => __.map(tree.develop)(t(M)[1])
    ];


//------ Functors ------

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


//------ Monad ------

//  .unit : n -> tree(m, n)
tree.unit = 
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


//------ Construction ------
/*  
    m ?-> n :: n || m -> n

    tree(m ? n) :: (
        m ?-> n,
        m ?-> tree(m ? n)
    )
        
*/

//  .depend : ((m ?-> n) -> (m -> n)) -> tree(m ? n) -> tree(m, n)
tree.depend = 

    isFunction => {

        //  (m ?-> n) -> bool
        let isF = isFunction || (tn => typeof tn === 'function');

        //  (m ?-> n) -> (m -> n)
        let toF = tn => isF(tn) ? tn : () => tn;

        //  tree(m ? n) -> tree(m, n)
        return ([tn, tb]) => [
            toF(tn), 
            __.pipe(toF(tb), __.map(tree.depend(isF)))
        ]
    };


//  tree(m ? n) -> tree(m, n)
function tree (t, isF) { 

    return tree.depend(isF)(t);

}


//------ Links ------

//  .link : (n -> n -> n) -> tree(n) -> tree(n)
tree.link = 
    f => ([n, b]) => [
        n, 
        __.map(
            ([ni, bi]) => [f(n, ni), __.map(tree.link(f))(bi)]
        )(b)
    ];

//  .build : (n -> n') -> (n' -> n' -> eff(n')) -> tree(n) -> n'
tree.build = 
    (node, branch) => ([tn, tb]) => {
        let n = node(tn);
        tb.forEach(
            ni => branch(n, tree.build(node, branch)(ni))
        );
        return n;
    };

module.exports = tree;
