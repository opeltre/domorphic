# virtual view

[examples](http://mathchat.fr:8083/vv)

## plain javascript dynamic templating

* lightweight syntax to js-design the DOM 
* functional and event-based for dynamism

`vv` lets you design a virtual dom architecture.
It basically returns a function that you feed with a model object.
It either acts on the DOM or passively returns a documentFragment

Choose when you start it
and choose when to update it.
Just hook on events dispatched by `vv.emit`.
start your app with `vv.start`, 
redraw or passively update the model with `vv.update`.

## todo: 

* import vv-backend


