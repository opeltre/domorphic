[forest.js](http://mathchat.fr:8083/vv)
is a plain javascript program and 
a DOM templating philosophy.

> js functions spin the web  

### Functional trees

A forest consists of trees. 
A tree constructed by `fst` is a function 
taking in a model object to return a html document fragment.

```javascript
fst('div#gif', [
    ['h1', ['cat gifs']],
    ['img', {src: M => M.url }]
]);
```

```javascript
//  tree :: Model -> html( Data ) 
let tree = 
    fst('div#fst', [
        ['h6', ['fst']],
        ['p', ['a forest of DOM subtrees']],
        ['p#msg', [Model => Model.msg]]
    ]);

//  node :: effect( Html ) 
let node = 
    tree({msg: 'allo allo'});

/*  Calling a tree has effects on the current document by default,
 *  specify a negative drawing boolean as other argument if you have pure wishes.
 */

//  fragment :: Html
let fragment = 
    tree({msg: 'allo allo', false});
```

### Eventful forest

Trees listen to the forest's events dispatched via `fst.emit`
to refresh themselves, their html foliage ondulating
in the DOM wind in the meantime.

```javascript
//  listener :: Data -> Model 
let listener = 
    Data => ({ msg => Data.msg });

//  emitter :: html( Data )
let emitter = 
    fst.emit(
        'msg',
        Event => ({msg: 'listen carefully, I shall say this only once'})
    );

/*  hooks */ 
tree.on('click', emitter);
tree.up('msg', listener);
```

Trees may akso hook to a passive update of their model
when a negative redraw argument is added.

```javascript 
tree.up('msg', listener, false);
```
