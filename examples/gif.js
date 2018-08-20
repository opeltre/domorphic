let gifs  = {};

gifs.url = "https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=";

gifs.initModel = {
    gifSrc: 'https://media3.giphy.com/media/WoCxkkpiweO6Q/giphy.gif',
         //'https://media2.giphy.com/media/4TPoYM5nFbBII/giphy.gif',
    topic: 'cat'
};

/*** get more gif ***/

gifs.moreGif =
    topic => fst.ajax()
        .get(gifs.url + topic)
        .then(JSON.parse)
        .then(response => response.data.image_url)
        .then(src => fst.emit('gif.new', {gifSrc: src})());

gifs.buttonMore =
    fst('button', ['more Gif!'])
        .on('click', (t,M) => gifs.moreGif(M.topic));

gifs.img =
    fst('img')
        .attr({src: M => M.gifSrc})
        .up('gif.new')

/******************************/

fst._('X')
    .html(M => M.msg)
    .on('click', fst.emit('=> a', {msg: 'c'}))

fst._('Y')
    .pull('a', M => Ma)
    .pull('b', M => Mb) 

fst.__('A')
    .parse(R => M)
    .use('X', 'Y')


/*** topic choice ***/

gifs.inputTopic =
    fst('input')
        .value(M => M.topic)
        .on('change', fst.emit('gif.type', t => t.value))
        .up('gif.type', (d,M) => ({topic : d}), false);


/*** main view ***/

gifs.view = 
    fst('#gif')
        .branch([
            ['div', [ 
                gifs.img 
            ]],
            ['div', [
                ['span', ['topic: ']],
                gifs.inputTopic,
                gifs.buttonMore
            ]]
        ])
        .model(gifs.initModel)
        .plant('#gif-view')
        .start('gif.init');


/*** gif loop opt-in ***/

gifs.buttonInit = 
    fst('button', ['...sure?'])
        .on('click', fst.emit('gif.init'))
        .kill('gif.init');

fst('.example')
    .branch([
        ['h2', ['ajax example']],
        gifs.buttonInit,
        ['#gif-view']
    ])
    .plant('#examples')
    .start('dom');
