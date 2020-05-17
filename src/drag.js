/*------ SVG Drag Events --- 

    Forward mouse events in viewbox coordinates. 
    
    Exposed under `IO.drag`, this function should be called upon 
    element creation as in: 
    
        let svg = dom('svg').on('load', IO.drag);

    Each SVG element may then listen to drag events, 
    exposing mouse position and movement in the event's detail. 

        let circle = dom('rect')
            .on('dragstart', () => console.log('starting to drag'))
            .on('drag', (e, io, m) => {
                let {x, y, dx, dy} = e.detail;
                console.log(`moving (${dx}, ${dy}) from (${x}, ${y})`);
            })
            .on('dragend', () => console.log('finished dragging'));

*///------

module.exports = function (svg) {

    let element = null;

    console.log('loaded')
    console.log(svg);

    svg.addEventListener('mousedown', start);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', end);
    svg.addEventListener('mouseleave', end);

    let mouse = (evt) => {
        let pos = coords(evt.clientX, evt.clientY),
            move = coords(evt.movementX, evt.movementY, 'linear');
        return {
            x:  pos.x,      y:  pos.y,
            dx: move.x,     dy: move.y
        };
    };

    let dragEvent = (name, evt) => 
        new CustomEvent(name, {
            bubbles: true,
            detail: mouse(evt) 
        });

    //--- Dispatch Drag Events --- 

    function start (evt) {
        element = evt.target;
        element.dispatchEvent(dragEvent('dragstart', evt));
    }
    function drag (evt) {
        if (element) { 
            evt.preventDefault();
            element.dispatchEvent(dragEvent('drag', evt));
        }
    }
    function end (evt) {
        if (element) 
            element.dispatchEvent(dragEvent('dragend', evt));
        element = null;
    }

    //--- Screen to Viewbox ---
    
    function point (x, y) {
        let point = svg.createSVGPoint();
        point.x = x; point.y = y;
        return point;
    }
    function coords (x, y, linear) {
        let pt = point(x, y),
            mat = svg.getScreenCTM().inverse(); 
        if (linear) {
            mat.e = 0; mat.f = 0;
        }
        return pt.matrixTransform(mat);
    }

    return svg;
}
