let __ = require('lolo'),
    _r = __.r, 
    Tracer = require('./tracer');

let parse = require('./_parse');

let files = {
    parse : parse
};

//------ Test ------

let test = () => {
    let ts = Tracer.rmap(
        (u, n) => test.file(u, n),
        show.file.rmap
    )(files); 
    let ta = [true, [show.test.head()]],
        main = () => Tracer.rall(ts, show.test);
    let tb = Tracer.log(Tracer.bind(ta, main));
    if (tb[0] === null) 
        throw Error('Tests fail.');
    return tb;
}

test.file = (units, file) => {
    let ts = Tracer.rmap(
        unit => Tracer.try(unit)(), 
        (unit, name) => show.unit(unit, file)
    )(units);
    let tb = Tracer.rall(ts, show.file);
    return tb;
}

//------ Strings ------ 

let errors = {
    file: f => Error(`File ${f} failed`) 
} 

let show = {

unit : (unit, file) => {
        let hr = [...Array(16)].join('-');
        return '\n' + hr + ' Unit Error ' + hr + '\n\n'
            + `> in file '_${file}.js'\n`
            + `> in unit '${unit}'\n`;
},
file : {
    success : ({pass, fail, time}) => '\n'
        + `(+) ${pass} units passed in ${time} ms`,

    failure : ({pass, fail, time}) => '\n'
        + `(+) ${pass} units passed\n`
        + `(-) ${fail} units failed in ${time} ms`,
    
    rmap : (file) => {
        let hr = [...Array(22)].join("..");
        return hr; 
    }
},
test : {
    success : ({time}) => {
        let hr = '\n' + [...Array(22)].join('- ') + '\n'
        return '\n' + hr 
            + `All tests passed in ${time} ms.`
            + hr ;
    },
    failure : ({fail, pass, time}) => {
        let hr = '\n' + [...Array(22)].join('==') + '\n';
        return '\n' + hr
            + `\t (+) ${pass} files passed\n`
            + `\t (-) ${fail} files failed \tin ${time} ms.`
            +  hr;
    },
    head : () => {
        let n = _r.keys(files).length; 
        return `\n> Testing ${n} file${n > 1 ? 's' : ''}\n\n`;
    }
}
}; 

//------ Run ------

test(); 
