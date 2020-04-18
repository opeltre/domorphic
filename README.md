[functor][https://ncatlab.org/nlab/show/functor#definition]

# Domorphic

A plain javascript program to interact with the DOM, 
in a functional, reactive and KISS philosophy.

Inspired by the power of [d3](http://github.com/d3)
and the beauty of [elm](http://elm-lang.org),
this library attempts to breed their many respective qualities,
so that shaping DOM interfaces within js 
may become smooth and enjoyable again! 

## Installation 

```sh
curl https://raw.githubusercontent.com/opeltre/domorphic/master/bundle.js\
    >> domorphic.js
```

## Morphisms 

A domorphic instance is just a function returning a DOM node.
That's it! 
```js
let node = dom('h1').html('Hello World:!')();
```
At first glance, the library is hence little more 
than a convenient way to parametrise functions from 
a given input type to the DOM node type. 
All node attributes are interpreted either as values 
or data dependent functions, supplied by d3-like  
chainable accessors. 

In scientific terms, 
this sets you to explore 
the polymorphic type `a -> Node` 
of programs returning `Node`. 

The branching attribute itself may be interpreted
as an `a -> [Node]` node array returning function:  

```js
//  m : [str]
let m = ['cats', 'are', 'cute'];

//  f : [str] -> Node
let f = dom('div').branch(
    m => m.map(
        mi => dom('p').html(mi)
    )
);

document.body.appendChild(f(m));

//N.B.  Sending `str -> Node` to `[str] -> [Node]` is best done 
//      with map instances, see the equivalent example below :)
```

Given a function `a -> b`, you may also 
compose your instance `b -> Node`, 
to get an `a -> Node` map: 
```
pull : (a -> b) -> (b -> Node) -> (a -> Node)  
```
However esoteric, you're looking at
the _contravariant [hom-functor](https://en.wikipedia.org/wiki/Hom_functor)_
`Hom(-, Node)` in the _cartesian category_ of types. 

```js
//  g : (num, num) -> str
let g = ([x, y]) => `translate(${x}, ${y})`; 

//  circle : str -> Node 
let circle = dom('circle')
    .attr('transform', m => m)
    .pull(g);

document.querySelector('svg').appendChild(circle([20, 30]));
```
Some people call this the _pullback of `circle` by `g`_. 
Whatever, fortunately javascript doesn't have types,
so there's no need to learn black magic to keep 
[things](https://www.destroyallsoftware.com/talks/wat)
running :) 
