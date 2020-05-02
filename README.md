# domorphic

is a plain javascript program to interact with the DOM, 
in a functional, reactive and keep-it-simple philosophy.

```html
<script src="https://cdn.jsdelivr.net/npm/domorphic@1.0.0/dist/dom.min.js"></script> 
```
Inspired by the power of [d3](http://github.com/d3)
and the beauty of [elm](http://elm-lang.org),
this library attempts to breed their many respective qualities,
so that shaping DOM interfaces in pure js 
may become smooth and enjoyable again! 

## Usage 

It's all about the polymorphic type `a -> Node` 
of functions returning DOM nodes. 

In scientific terms,
this  is also called the _category of types above_ `Node`. 
[What?](https://en.wikipedia.org/wiki/Category_theory)

__Above the DOM__.
A domorphic instance is just a function returning a DOM node. That's it! 
```js
let node = dom('h1').html('Hello World:!')();
```
At first glance, the library hence only helps you
conveniently parametrise functions returning DOM nodes. 
And you may very well do `document.body.appendChild` 
or whatever you like with them. 

__Syntax__. 
The dom constructor parses arguments
looking for the following pattern: 
```js
dom('tag#id.class', ?{...attrs}, m ?-> [...branches])
```
Each branch may be given either as a dom instance, 
or as an array of arguments following the same pattern. 

All view-related code is intended to be kept
as light and readable as any other templating language. 
Except it's javascript! 

__Attributes__.
All node attributes are interpreted either as values 
or as data dependent functions. 

You may supply them 
by d3-like chainable accessors: 
```js
let a = dom('a')
    .html("internet")
    .attr('href', m => m.href)
    .on('hover', () => alert("wooo"))
```
although the dom constructor also interprets this following equivalent
syntax:

```js 
let a = dom('a', {
    html: "internet",
    href: m => m.href,
    onhover: () => alert("wooo")),
});
```

__Branches__.
Nodes are essentially trees of DOM elements, i.e. 
`Node = (Element, [Node])`.

The branching attribute itself may be given 
in `a -> [Node]`, as a node array returning function:

```js
//  m : [Str]
let m = ['cats', 'are', 'cute'],

//  p : Str -> Node
let p = dom('p')
    .html(m => m);

//  div : [Str] -> Node
let div = dom('div')
    .branch(m => m.map(p));

document.body.appendChild(div(m));
```

and the above produces the same output as:

```js 
//  div : () -> Node
let div = dom('div', [
    ['p', {html: "cats"}],
    ['p', {html: "are"}],
    ['p', {html: "cute"}]
]);

document.body.appendChild(div());
```

## Functors 

In the category of types, a
[functor](https://ncatlab.org/nlab/show/functor#definition) `T`:
- assigns to every type `a` a type `T a`,
- transforms any map `a -> b` to a map `T a -> T b`. 

Because dom instances are [pure](https://en.wikipedia.org/wiki/Pure_function) 
functions, it is perfectly safe to pipe them into functorial transformations. 

__Pullbacks__. 
Given a function `a -> b`, precompose your `b -> Node` instance 
to get an `a -> Node` map: 
```
dom.pull : (a -> b) -> (b -> Node) -> (a -> Node)  
```
However esoteric, you're looking at
the contravariant [hom-functor](https://en.wikipedia.org/wiki/Hom_functor)
`Hom(-, Node)` in the cartesian category of types :) 

__Arrays__. 
Functions of type `a -> Node` 
are naturally transformed to `[a] -> [Node]` maps: 
```
dom.map : (a -> Node) -> [a] -> [Node] 
```
As far as dom instances are pure functions, this 
is rigorously equivalent to calling `Array.map`. 

Using `dom.map` will be mostly useful to associate 
index-specific DOM actions in the IO monad. 

__Records__. 
Similarly, we map `a -> Node` to a type of functions on records `{a} -> {Node}`:
```
dom.rmap : (a -> Node) -> {a} -> {Node} 
```
This is not yet implemented, but there's little more to it than its array
counterpart. 

## Monads 

The main originality of domorphic is the monadic approach it takes
to describe interactions between an internal state and the DOM state. 

KISS: No automatic diff refreshes. Only handmade, pure pipelines. 

__IO__. The IO Monad describes input/output operations with the DOM. 
```
IO(e): IO operations eventually triggering an event of type e
```

__State__. The State Monad describes stateful computations. 
```
St(s, a) = s -> (a, s) : Computations running with state in s, returning a
```

__Updates__. Upon events of type `e`, update state and eventually 
trigger new IO operations:
```
update : e -> St(s, IO(e)) 
```
and loop!
