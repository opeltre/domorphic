let gifs  = {};

gifs.url = "https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=";

gifs.initModel = {
    gifSrc: 'https://media3.giphy.com/media/WoCxkkpiweO6Q/giphy.gif',
         //'https://media2.giphy.com/media/4TPoYM5nFbBII/giphy.gif',
    topic: 'cat'
};


/*** get more gif ***/

gifs.moreGif =
    topic => vv.ajax()
        .get(gifs.url + topic)
        .then(JSON.parse)
        .then(response => response.data.image_url)
        .then(src => vv.emit('gif.new', {gifSrc: src})());

gifs.buttonMore =
    vv('button', ['more Gif!'])
        .on('click', (t,M) => gifs.moreGif(M.topic));

gifs.img =
    vv('img')
        .attr({src: M => M.gifSrc})
        .up('gif.new')


/*** topic choice ***/

gifs.inputTopic =
    vv('input')
        .value(M => M.topic)
        .on('change', vv.emit('gif.type', t => t.value))
        .up('gif.type', (d,M) => ({topic : d}), false);


/*** main view ***/

gifs.view = 
    vv('#gif')
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
    vv('button', ['...sure?'])
        .on('click', vv.emit('gif.init'))
        .kill('gif.init');

vv('.example')
    .branch([
        ['h2', ['ajax example']],
        gifs.buttonInit,
        ['#gif-view']
    ])
    .plant('#examples')
    .start('dom');
