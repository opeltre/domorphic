let gifs  = {};
gifs.url = "https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=";

gifs.initModel = {
    gifSrc: 'https://media3.giphy.com/media/WoCxkkpiweO6Q/giphy.gif',
         //'https://media2.giphy.com/media/4TPoYM5nFbBII/giphy.gif',
    topic: 'cat'
};


/*** more gif ***/

gifs.moreGif =
    topic => vv.ajax()
        .get(gifs.url + topic)
        .then(JSON.parse)
        .then(res => res.data.image_url)
        .then(src => vv.emit('gif.new', {gifSrc: src})());

gifs.buttonMore =
    vv('button', ['more Gif!'])
        .on('click', (t,M) => gifs.moreGif(M.topic));

gifs.img =
    vv('img')
        .attr({src: M => M.gifSrc})
        .up('gif.new')


/*** choose the topic ***/

gifs.inputTopic =
    vv('input')
        .value(M => M.topic)
        .on('change', vv.emit('gif.type', t => t.value))
        .up('gif.type', (d,M) => ({topic : d}), false);


/*** main view ***/

gifs.view = 
    vv('div')
        .branch([
            vv('div', [ gifs.img ]),
            vv('div', [
                vv('span', ['topic: ']),
                gifs.inputTopic,
                gifs.buttonMore
            ])
        ])
        .model(gifs.initModel)
        .plant('#gif-view')
        .start('gif.init');


/*** opt-in to enter the gif loop ***/

gifs.buttonInit = 
    vv('button', ['...sure?'])
        .plant('#gif-init')
        .on('click', vv.emit('gif.init'))
        .kill('gif.init');

vv('.example')
    .branch([
        vv('h2', ['ajax example']),
        gifs.buttonInit,
        vv('#gif-view')
    ])
    .plant('#examples')
    .start('dom');

    


