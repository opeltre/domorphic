```javascript
/*
Html :: 
    DOM objects 

html :: Data ~> Html 
    event( Data ) emitters

Listen :: eff( Html ) ~> Html 
    DOM event listeners from Html effects

listen :: Str -> Listen 
    listeners to a given event channel

tree :: eff( Model [x] Html )

    Model -> Html   ~.
    Html  -> Data   ~|~~>  tree( Model, Data )  ~~~>  eff( Model [x] Html )
    Data  -> Model  ~'

eff( Model * Html )  ~~~>  Model -> Html

tree( Data ) :: Data -> Html( Data )
tree( Model, Data ) :: Model -> html( Data )

tree.listen :: Str -> (Data -> Model) ~> eff( Html )

--- 
        update      view
D       ->  M       -> Html D
Html D  ->  Html M  -> Html Html D

Dynamic html:
Html Html
Html Html Html ... 

*/

```
