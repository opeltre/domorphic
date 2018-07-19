/*** vv_helpers ***/

vv.input = 
    (id, key=id, css='') => {
        let data = 
            val => { let d = {}; d[key] = val; return d };
        return vv('input#' + id + css)
            .html(M => M[key])
            .on('input', 
                vv.emit('-> '+ id, t => data(t.value))
            )
    }

vv.textarea = 
    (id, key=id, css='') => {
        let data = 
            val => { let d = {}; d[key] = val; return d };
        return vv('textarea#'+ id + css)
            .value(M => M[key])
            .on('change', 
                vv.emit('-> ' + id, t => data(t.value)))
    }

vv.table = 
    body => 
        vv('table', [
            ['tbody', 
                body
                    .map(row => row
                        .map(cell => ['td', [cell]])
                    )
                    .map(row => ['tr', row])
            ]
        ]);
