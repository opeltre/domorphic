# virtual view

[examples](http://mathchat.fr:8083/vv)

Just like this code, some examples were inspired by 
the [elm](http://elm-lang.org) language.

## Plain js dynamic templating

* lightweight syntax to design the DOM
* functional and event-based for dynamism

**Virtual design of the DOM architecture**

`vv` basically returns a function that you feed with a model object.   
It either acts on the DOM or passively returns a new document fragment.

**Choose when to start it, choose when to update it and when to kill it**

Hook on events dispatched by `vv.emit`,   
Redraw or passively update the model with `vv.update`.

## Declare and connect virtual nodes

- Refer to the virtual node named `'a'` with `_vv('a')`.  

- Node `_vv(a)` refreshes on `'=> a'`
and silently updates on `'-> a'`.

- Use `_vv.connect('a -> b', 'x', 'y', 'z')` or 
`_vv.connect('a => b', 'x', 'y', 'z')`
to propagate updates and refreshes of the `x, y, z` attributes
of node `_vv('a')` to node `_vv('b')`.

- Connect manier nodes with `_vv.link`:

    ```
    _vv.link({
        'a -> b': 'x y z',
        'b -> c': 'X Y Z'
    })
    ```

- Avoid loops, as this would trigger an infinite loop. 

    ```
    _vv.link({
        'a -> b': 'x',
        'b -> a': 'x'
    })
    ```

    

## todo: 

* import vv-backend

