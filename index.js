let dom = require('./src/dom'),
    model = require('./src/model'),
    elements = require('./src/elements'),
    effects = require('./src/effects');

module.exports = Object.assign(dom, 
    {model},
    elements, 
    effects
);
