# domorphic

[domorphic](http://mathchat.fr:8090/ex/index.html)
is a plain javascript program and 
a DOM templating philosophy.

```javascript
let node = 
    dom('#readme', [
        ['h2', ['domorphic']],
        ['p', [M => 'tldr;']]
    ])();
```

## domorphisms 

### pureness

The basic domorphic instance is a pure function `f` 
mapping a model object `M`
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

We'll denote by `dom a` the type
building nodes from objects of type `a`:
 
```javascript
//  dom a = a -> node
```

### functoriality

A function `u : a -> b` 
can be precomposed on the model.
This defines its pull-back `U : dom b -> dom a`:

```javascript
//  u : a -> b
let u = ({x, y}) => ({transform: `translate(${x} ${y})`});

//  f : dom b
let f = dom('circle').attr(M => M);

//  g : dom a
let g = f.pull(u);
``` 

In scientific terms, the `dom` type assignment 
is called a contravariant functor:

```javascript
//  dom.functor : ( a -> b ) -> ( dom b -> dom a )
```

And the previous is equivalent to:

```javascript
//  U : ( dom b -> dom a )
let U = dom.functor(u);

//  g : dom a
let g = U(f);

document.body.appendChild(
    g({ x: 2, y: 3})
);
```

### earthly programming

In this sublunar world nothing remains pure forever. 

```javascript 
//  f : dom a
let f = dom('svg', [
    dom('circle.earth').attr(M => M.earth),
    dom('circle.moon').attr(M => M.moon)
]);

//  n : dom_ a
let n = f.node();

/* * * * * * * * * /

//  Model : a
let Model = n.M();

//  Node : node
let Node = n.N();
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
