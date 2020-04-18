let dom = require('./src/dom'),
    IO = require('./src/io'),
    state = require('./src/state'),
    update = require('./src/update');

module.exports = Object.assign(dom, 
    {IO},
    {state},
    {update}
);
