/*** vv_helpers ***/

vv.input = 
    (id, key=id, css='') => 
        vv('input#' + id + css)
            .html(M => M[key])
            .on('input', vv.emit(id, t => t.value))
            .up(id, (val => ({key: val})), false);

vv.textarea = 
    (id, key=id, css='') => 
        vv('textarea#'+ id + css)
            .value(M => M[raw])
            .on('change', vv.emit(id, t => t.value))
            .up(id, (val => ({key: val})), false);

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
