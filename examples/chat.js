let msgView = 
    m => 
        vv('.msg', [
            ['.msg-head', ['from: '+ m.user]],
            ['.msg-body', 
                {style: "border: 1px solid #aaa; margin:5px;"}, 
                [m.body]
            ]
        ]);

let msgs = 
    vv('#msgs')
        .branch(M => M.msgs.map(msgView))
        .up('new-msg', (d, M) => ({msgs: M.msgs.concat([d])}));

let button =
    vv('button')
        .on('click', vv.emit('new-msg', getMsg))
        .html('chat!');

let chat = 
    vv('#chat.example', [
        ['h2', ['chat example']],
        ['h3', [M => 'Welcome to ' + M.channel + '!']],
        button,
        msgs
    ]);

chat
    .model({
        channel: 'dar-es-salam',
        msgs: []
    })
    .plant('#examples')
    .start('dom');

/*** generate peaceful messages ***/
let i = 1, body = '';

function getMsg (evtTarget) {
    body += 'shalom ';
    i++;
    let msg = {};
    msg.user = (i % 2 == 0) ? 'oli' : 'rom';
    msg.body = body + '!';
    return msg;
};
