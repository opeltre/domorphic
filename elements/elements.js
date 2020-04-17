let dom = require('./dom');

dom.range = 
    (min, max, step, value) => 
        dom('input', {type: 'range', min, max, step: step || 0.1})
            .value(
                typeof value === 'undefined' 
                    ? (max - min) / 2 
                    : value
            )

module.exports = dom;
