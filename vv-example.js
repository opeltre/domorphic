let msgView = 
    m => 
        vv('.msg', [
            ['.msg-head', ['from: '+ m.user]],
            ['.msg-body', [m.body]]
        ]);

let msgs = 
    vv('#msgs')
        .branch(M => M.msgs.map(msgView))
        .up('new-msg', (d, M) => ({msgs: M.msgs.concat([d])}));

let button =
    vv('button')
        .on('click', vv.emit('new-msg', getMsg))
        .html('chat');

let chat = 
    vv('#chat', [
        ['h1', [M => 'Welcome to ' + M.channel + '!']],
        msgs,
        button 
    ]);

chat
    .model({
        channel: 'dar-es-salam',
        msgs: []
    })
    .plant('#win')
    .start('load');

let i = 1, body = '';

function getMsg (evtTarget) {
    body += 'shalom ';
    i++;
    let msg = {};
    msg.user = (i % 2 == 0) ? 'oli' : 'rom';
    msg.body = body + '!';
    return msg;
};
