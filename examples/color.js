//--- Hexadecimal Color Picker ---

let IO = dom.IO,
    state = dom.State;

//--- Initial Model ---

let M = {
    color: '#cab',
    digits: 3,
    id:     '#color',
    size:   [150, 150]
};

//--- View ---

let app = dom('div')
    .put(m => m.id);

let view = dom('div#view')
    .place('view')
    .style('background-color', m => m.color)
    .style('width', m => m.size[0])
    .style('height', m => m.size[1])

let input = dom('input')
    .on('keyup', listener)
    .style('border', m => `1px solid black`)
    .style('font-family', 'mono')
    .style('margin-top', 5)
    .style('text-align', 'right')
    .style('width', m => m.size[1])

app.append(view, input);

//--- Events ---

function listener (e, io, m) {
    let color = e.target.value,
        re = /^([0-9]|[a-f])*$/;
    if (re.test(color) && color.length === m.digits)
        return io.send('#'+color);
}

//--- Update ---

let update = e => e !== '*'
    ? state()
        .set('color', e)
        .reads(IO.replace(view))
    : state()
        .reads(IO.put(app))

//--- Main ---

let main = (e0, m0) => {
    let [m1, io] = update(e0).run(m0);
    return io.await()
        .bind(e1 => main(e1, m1));
};

main('*', M);
