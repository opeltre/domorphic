let dom = require('./src/dom'),
    IO = require('./src/io'),
    state = require('./src/state');

module.exports = Object.assign(dom, 
    {IO},
    {state}
);
