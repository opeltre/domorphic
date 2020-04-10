let __ = require('lolo'),
    _r = __.record();

let dom = {};

dom.select = 
    str => typeof str === 'string' 
        ? document.querySelector(str)
        : str;

dom.append = 
    (str, node) => M => dom.select(str).appendChild(node(M));

dom.replace = 
    (str, node) => M => dom.select(str).replaceWith(node(M));

dom.remove = 
    (str) => () => dom.select(str).remove();

dom.set = 
    (str) => attrs => {
        let N = dom.select(str), 
            setAttr = N instanceof SVGElement 
                ? (v, k) => N.setAttributeNS(null, k, v)
                : (v, k) => N.setAttribute(k, v);
        _r.forEach(setAttr)(attrs);
    };

dom.loop = 
    (dt, tick) => 
        t => Promise.resolve(t)
            .then(tick)
            .then(() => __.sleep(dt))
            .then(() => t + dt)
            .then(dom.loop(dt, tick))

module.exports = dom;
