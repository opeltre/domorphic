let __ = require('lolo');

/*------ Function Trees ------ 
 
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

        t.link :    (m -> n) -> (m -> [t(m, n)]) -> t(m, n)
        
        t.node :    t(m, n) -> m -> n

        t.branch :  t(m, n) -> m -> [t(m, n)]
*/

function Tree (type={}) {

    let T   = type.link      || ((n, b) => [n, b]),
        _n  = type.node      || (t => t[0]),
        _b  = type.branch    || (t => t[1]);
  
    let tree = (n, b) => T(n, b);
    tree.node = _n;
    tree.branch = _b;

    //  .eval : m -> tree(m, n) -> tree(n)
    tree.eval = 
        M => t => tree.apply(t)(M);


    //------ Functors ------

    //  .map : (n -> n') -> tree(n) -> tree(n')
    tree.map = 
        f => t => T(
            f(_n(t)),
            _b(t).map(tree.map(f))
        );

    //  .fmap : (n -> n') -> tree(m, n) -> tree(m, n')
    tree.fmap = 
        f => t => T( 
            __(_n(t), f),
            __(_b(t), __.map(tree.fmap(f)))  
        );

    //  .cofmap : (m -> m') -> tree(m', n) -> tree(m, n)
    tree.cofmap = 
        g => t => T(
            __(g, _n(t)),
            __(g, _b(t), __.map(tree.cofmap(g)))
        )


    //------ Natural Transformations ------

    //  .apply : tree(m, n) -> m -> tree(n)
    tree.apply = 
        t => M => T(
            __(_n(t))(M),
            __(_b(t))(M).map(ti => tree.apply(ti)(M))
        );

    //  .nat ( tree' ) : tree(n) -> tree'(n) 
    tree.nat = 
        S => t => S(
            _n(t),
            _b(t).map(tree.nat(S))
        )

    //  .fnat ( tree' ) : tree(m, n) -> tree'(m, n)
    tree.fnat = 
        S => t => S(
            _n(t),
            __(_b(t), __.map(tree.nat(S)))
        );

    //  .develop : (m -> tree(n)) -> tree(m, n)
    tree.develop = 
        t => T( 
            M => _n(t(M)),
            M => __.map(tree.develop)(_b(t(M)))
        );


    //------ Monad ------

    //  .unit : n -> tree(m, n)
    tree.unit = 
        N => T(
            () => N,
            () => []
        );

    //  .compose : tree(m, tree(m, n)) -> tree(m, n)
    tree.compose = 
        tt => T(
            __(_n(tt), _n),
            M => [
                ...__(_n(tt), _b)(M),
                ...__(_b(tt), __.map(tree.compose))(M)
            ]
        );


    /*------ Cast to Dependent Tree ------
      
        m ?-> n :: n || m -> n

        tree(m ? n) :: (
            m ?-> n,
            m ?-> tree(m ? n)
        )
            
    */
    //  .depend : ((m ?-> n) -> (m -> n)) -> tree(m ? n) -> tree(m, n)
    tree.depend = toFunction => {

        //  (m ?-> n) -> (m -> n)
        let toF = toFunction || __; 

        //  tree(m ? n) -> tree(m, n)
        return t => T(
            __(_n, toF)(t),
            __(toF(_b(t)), __.map(tree.depend(toF)))
        )
    };


    return tree;
}

let tree = Tree(); 
tree.new = Tree;

module.exports = tree;
