/*** fst_helpers ***/

fst.input = 
    (id, key=id, css='') => {
        let data = 
            val => { let d = {}; d[key] = val; return d };
        return fst('input#' + id + css)
            .html(M => M[key])
            .on('input', 
                fst.emit('-> '+ id, t => data(t.value))
            )
    }

fst.textarea = 
    (id, key=id, css='') => {
        let data = 
            val => { let d = {}; d[key] = val; return d };
        return fst('textarea#'+ id + css)
            .value(M => M[key])
            .on('change', 
                fst.emit('-> ' + id, t => data(t.value)))
    }

fst.table = 
    body => 
        fst('table', [
            ['tbody', 
                body
                    .map(row => row
                        .map(cell => ['td', [cell]])
                    )
                    .map(row => ['tr', row])
            ]
        ]);
