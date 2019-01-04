# domorphic

[domorphic](http://mathchat.fr:8090/ex/index.html)
is a plain javascript program and 
a DOM templating philosophy.

## domorphisms 

The basic domorphic instance is a function `f` 
mapping a js model object `M`
to a DOM node `N`:

```javascript
//  M : a
let M = { msg: 'Hmmm... Shai Halud' };

//  f : a -> node
let f = dom('h1').html(M => M.msg);

//  N : node
let N = f(M);

document.body.appendChild(N);
```

We call such functions morphisms and write
`dom a` for the type of morphisms 
accepting models of type `a`:
 
```javascript
//  dom a = a -> node
```

The `dom` type assignment is a contravariant functor,
as any function `u : a -> b` 
has a pull-back `U : dom b -> dom a` 
by right composition on the model.

```javascript
//  u : a -> b
let u = ({ x, y })=> 
    ({
        transform: `translate(${x} ${y})` 
    });

//  f : dom b
let f = dom('circle').attr(M => M);

//  U : ( dom b -> dom a )
let U = dom.functor(u);

//  g : dom a
let g = U(f);

document.body.appendChild(
    g({ x: 2, y: 3})
);
```

## Indexing functors

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
