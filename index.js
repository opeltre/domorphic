let dom = require('./src/dom'),
    IO = require('./src/io'),
    app = require('./src/update'),
    state = require('./src/state');

module.exports = Object.assign(dom, 
    {IO},
    {state},
    {app},
);
