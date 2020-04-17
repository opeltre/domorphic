let dom = require('./src/dom'),
    IO = require('./src/io'),
    State = require('./src/state');

module.exports = Object.assign(dom, 
    {IO},
    {State}
);
