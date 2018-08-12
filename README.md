# forest

[forest.js](http://mathchat.fr:8083/vv)
is a plain javascript program to design virtual views.
A DOM templating philosophy based on js functions and events for dynamism.

### functional trees

A forest consists of trees. 
Trees constructed by `fst` are basically functions 
taking a model object to return a html document fragment.

```javascript
//  tree :: Model -> Html 
let tree = 
    fst('div#fst', [
        ['h6', ['fst']],
        ['p', ['a forest of DOM subtrees']],
        ['p#msg', [Model => Model.msg]]
    ]);

//  fragment :: Html 
let fragment = 
    tree({msg: 'allo allo'});
```

Calling a tree also has effects on the current document by default,
just specify a negative drawing boolean as other argument if you have pure wishes.

```javascript
let fragment = tree({msg: 'allo allo'}, false);
```

### eventful forest

Trees listen to the forest's events `fst.emit` instances dispatch 
to refresh themselves, their html foliage ondulating
in the DOM wind in the meantime.

```javascript
//  listener :: Data -> Model 
let listener = 
    Data => ({ msg => Data.msg });

//  emitter :: Event -> Data
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

