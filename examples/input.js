/*** mirror an input element ***/

fst('div.example')
    .branch([
        fst('h2')
            .html('input example'),
        fst('input')
            .on(
                'input', 
                fst.emit('type', input => input.value)
            ),
        fst('div')
            .up(
                'type', 
                (data, Model) => ({txt: data})
            )
            .branch([
                fst('span')
                    .html(
                        Model => { 
                            let n=Model.txt.length;
                            return `${n} letter${n <= 1 ? '' : 's'}: `;
                        }
                    ),
                fst('span')
                    .html(
                        Model => Model.txt.fontcolor('#b8a')
                    )
            ])
            
    ])
    .plant('#examples')
    .start('dom', {txt: ''});

/*

vnode.branch : 
    (Array [vnode]) -> link children nodes

vnode.plant : 
    (selector) -> select the destination DOM parent node. 

vnode.start : 
    (name, [Model={}, append=true]) -> plan DOM action
        + name: string
            - 'now', 'dom' 
            - name of a `fst.emit` event
        + Model: object <{}>
            - passed as argument to most methods
        + append: bool <true>
            è whether to append the constructed documentFragment

vnode.up : 
    (name, update, [redraw=true]) -> update the model &&? the view
        + name: string
            - name of a `fst.emit` event
        + update: (data, Model) -> object
            - model properties to updated, w/ respect to event data.
        + redraw: bool <true>
            - whether to replace the DOM node with a new one.

fst.emit : 
    (name, [data]) -> eventListener emitting a CustomEvent on the whole document.
        + name: string
            - the created CustomEvent will bear the full name 'fst#name'
        + data: object || eventTarget => object
            - detail of the CustomEvent to generate
*/
