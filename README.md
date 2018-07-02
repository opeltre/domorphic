# virtual view

[examples](http://mathchat.fr:8083/vv)
Like this code, examples are inspired from 
the [elm](http://elm-lang.org) language.

## plain js dynamic templating

* lightweight syntax to design the DOM
* functional and event-based for dynamism

**Design a virtual dom architecture**

`vv` basically returns a function that you feed with a model object.   
It either acts on the DOM or passively returns a new documentFragment.

**Choose when to start it, choose when to update it and when to kill it**

Just hook on events dispatched by `vv.emit`.   
Start your app with `vv.start`.   
Redraw or passively update the model with `vv.update`.

## todo: 

* import vv-backend

