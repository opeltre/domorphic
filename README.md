[domorphic](http://mathchat.fr:8090/ex/index.html)
is a plain javascript program and 
a DOM templating philosophy.

# domeomorphisms 

The basic domorphic object is a function `f` 
mapping a js model object `M`
to a dom node `N`:

```javascript
let f = dom('h1').html(M => M.msg),
    M = { msg: 'Hmmm... Shai Halud' },
    N = f(M);

document.body.appendChild(N);
```

We call such functions morphisms.
We write `dom a` for the type of those morphisms 
that accept models of type `a`:

```
dom a = a -> node 

M :: a         
f :: dom a   => f(M) :: node
```

Any function `u :: a -> b` 
may be pulled back to a function `U :: dom b -> dom a` 
by right composition on the model.

```javascript
let u = ({ x, y })=> 
    ({
        transform: `translate(${x} ${y})` 
    });

let f = dom('circle').attr(M => M),
    U = dom.functor(u),
    g = U(f);

document.body.appendChild(
    g({ x: 2, y: 3})
);
```

The above is equivalent to setting `g = f.model(u)` 
or `U = f => f.model(u)`.

```
dom.functor :: ( a -> b ) -> ( dom b -> dom a )

u :: a -> b    
f :: dom b  => U(f) :: dom a 
```

# functors

Given a type `a`, 
let us write `{ a }` and `[ a ]` 
for the type of objects and arrays with values in `a`.

The functoriality of `{ . }` and `[ . ]` induces maps:

```
{ dom } a = { a } -> { node }
[ dom ] a = [ a ] -> [ node ]

dom.keys :: dom a -> { dom } a 
dom.stack :: dom a -> [ dom ] a 
```

``` 
let Kf = dom.keys(f),
    Ns = Kf({
        'du': { msg: 'the worm is the spice' }
        'ne': { msg: 'the spice is the worm' }
    });

f   : dom a 
Kf  : { a } -> { node }
```
