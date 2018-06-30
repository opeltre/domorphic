vv('div')
    .branch([
        vv('input')
            .on('input', vv.emit('type', t => t.value)),
        vv('div')
            .html(M => M.txt.fontcolor('#b8a'))
            .up('type', (d,M) => ({txt: d}))
    ])
    .plant('#win')
    .start('load', {txt: ''});
