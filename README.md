---
layout: dompage
---

# domorphic

is a plain javascript program to interact with the DOM, 
in a functional, reactive and keep-it-simple philosophy.

```html
<script src="https://cdn.jsdelivr.net/npm/domorphic@0.0.1/dist/dom.min.js"></script> 
```
Inspired by the power of [d3](http://github.com/d3)
and the beauty of [elm](http://elm-lang.org),
this library attempts to breed their many respective qualities,
to make shaping DOM interfaces within js enjoyable, smooth and pure. 

For more documentation and examples, visit the project's [website][domorphic].

## Foreword

There are two layers to this library:

- the first one is really just convenience for templating: 
pure js code which outputs DOM subtrees, regardless of anything else, 
so that you may very well be content with it. 

- the second one, much more subtle, is about designing stateful and reactive
applications with pure monadic code.

Whether you've ever heard about [monads][monad] or not, 
they're intuitive and powerful, yet there's no need 
to get a grasp of their metaphysical nature to use the package! 

## Usage 

Everything happens in the polymorphic type `a -> Node` 
of functions returning DOM nodes,
which, in scientific terms,
is also called the category of types above `Node`. 
[What?!][category]

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
All view-related code is meant to be 
as light and readable as any other templating language:
except it's javascript! 

The dom constructor parses arguments
looking for the following pattern: 
```js
dom('tag#id.class', ?{...attrs}, m ?-> [...branches])
```
Each branch may be given either as a dom instance, 
or as an array of arguments following the same pattern,
so that you may nest arrays just as you would nest html tags. 

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
although the dom constructor also interprets the equivalent
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

Because dom instances are [pure]
functions, it is perfectly safe to pipe them into functorial transformations. 

__Pullbacks__. 
Given a function `a -> b`, precompose a `b -> Node` instance 
to get an `a -> Node` map: 
```
dom.pull : (a -> b) -> (b -> Node) -> (a -> Node)  
```
You're looking at
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

[KISS:][KISS] no automatic diff refreshes -- only handmade, pure pipelines. 

__IO__. The [IO] monad describes input/output operations with the DOM. 
```
IO(e) : IO operations, eventually triggering an event of type e.
```

__State__. The [State] monad describes stateful computations. 
```
St(s, a) = s -> (a, s) : Computations with state in s, return value in a.
```

__Updates__. 
The State and IO monads yield a composed monadic type `St(s, IO(e))`. 

Upon an event of type `e`, this monad describes
how to update the internal state and 
which IO operations should take place: 
```
Update = e -> St(s, IO(e)) : Upon event, update state and trigger IO actions.
```
Then binding the update to its return value 
just defines the main loop!

```js
let main = (e0, s0) => {
    let [io, s1] = update(e0).run(s0);
    return io.bind(e1 => main(e1, s1));
}

let start = s0 => main('start', s0);
```


[category]: https://en.wikipedia.org/wiki/Category_theory
[KISS]: https://en.wikipedia.org/wiki/KISS_principle
[pure]: https://en.wikipedia.org/wiki/Pure_function 
[IO]: https://en.wikipedia.org/wiki/Monad_(functional_programming)#IO_monad
[State]: https://en.wikipedia.org/wiki/Monad_(functional_programming)#State_monads
[monad_fp]: https://en.wikipedia.org/wiki/Monad_(functional_programming)
[monad]: https://en.wikipedia.org/wiki/Monad
[domorphic]: https://opeltre.github.io/domorphic
