let __ = require('lolo'),
    _r = __.r,
    Show = require('./show'),
    Tracer = require('./tracer');

let parse = require('./_parse');

let files = {
   parse : parse
};

//------ Test ------

let test = (files) => {
    let testError = '\tOh no!',
        show = Show.files(),
        rall = Tracer.rall.writes(show.rall),
        rmap = Tracer.rmap.writes(show.rmap);
    let ta = [true, [Show.head(files)]],
        ts = rmap(test.file)(files),
        tb = Tracer.bind(ta, () => rall(ts));
    Tracer.log(tb); 
    //--- throw ---
    if (tb[0] === null) 
        throw(testError);
}

test.file = (units, file) => {
    let show = Show.units(file),
        rall = Tracer.rall.writes(show.rall),
        rmap = Tracer.rmap.writes(show.rmap);
    return rall(rmap(
        unit => Tracer.try(unit)() 
    )(units));
}


//------ Run ------

test(files); 
