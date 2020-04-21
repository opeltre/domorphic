//--- Hexadecimal Color Picker ---

let IO = dom.IO,
    state = dom.state;

//--- Initial Model ---

let M = {
    color:  '#cab',
    size:   ['150px', '150px'],
    digits: 3,
    put:    '#app'
};

//--- View ---

let app = dom('div')
    .put(m => m.put);

let view = dom('div')
    .place('view')
    .style('background-color', m => m.color)
    .style('width', m => m.size[0])
    .style('height', m => m.size[1]);

let input = dom('input')
    .on('keyup', listener)
    .style('width', m => m.size[1])
    .style('box-sizing', 'border-box');

app.append(view, input);

//--- Events ---

function listener (e, io, m) {
    let color = e.target.value,
        re = /^([0-9]|[a-f])*$/;
    if (re.test(color) && color.length === m.digits)
        return io.send('#'+color);
}

//--- Update ---

let update = e => e === 'start'
    ? state()
        .reads(IO.put(app))
    : state()
        .set('color', e)
        .reads(IO.replace(view))

//--- Main ---

let main = (e0, m0) => {
    let [io, m1] = update(e0).run(m0);
    return io.await()
        .bind(e1 => main(e1, m1));
};

main('start', M);
