let __ = require('lolo'),
    _r = __.r;

//------ Show ------ 

let hr = (stroke='-', len=44, eol=true) => 
    [...Array(len)].join(stroke) + (eol ? '\n' : ''); 

hr.title = (text, stroke='-', len=16) => 
    hr(stroke, len, false) + text + hr(stroke, len);


let show = {}

show.head = (files) => {
    let n = _r.keys(files).length; 
    return '' 
        + `\t${n} file${n > 1 ? 's' : ''} to test:\n`;
}

show.units = (file) => {

    let my = {};

    my.rmap = unit => '\n' 
        + hr.title(' Unit Error ', '-') 
        + '\n'
        + `> in file '_${file}.js'\n`
        + `> in unit '${unit}'\n`;

    let success = t => '\n'
        + hr('.') 
        + `> tested '_${file}.js':\n`
        + `(+) ${t.pass} units passed in ${t.time} ms\n`
        + hr('.'); 

    let failure = t => '\n' 
        + hr('.')
        + `> tested '_${file}.js':\n`
        + `\t(+) ${t.pass} units passed\n`
        + `\t(-) ${t.fail} units failed in ${t.time} ms\n`
        + hr('.');

    my.rall = {success, failure}; 

    return my;
}

show.files = () => {

    let my = {};

    my.rmap = (file) => '\n'
        + hr('.')
        + '\n'
        + `> testing '_${file}.js'\n`;

    let success = t => '\n'
        + hr('+ ', 22)
        + `\tOh yes! all pass in ${t.time} ms.\n`
        + hr('+ ', 22);

    let failure = t => '\n' 
        + hr('=')
        + `\t (+) ${t.pass} files passed\n`
        + `\t (-) ${t.fail} files failed \tin ${t.time} ms.\n`
        + hr('='); 

    my.rall = {success, failure};

    return my;
}

module.exports = show;
