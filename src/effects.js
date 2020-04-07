let __ = require('lolo'),
    _r = __.record();

let dom = {};

dom.select = 
    str => typeof str === 'string' 
        ? document.querySelector(str)
        : str;

dom.append = 
    (str, node) => dom.select(str).appendChild(node());

dom.replace = 
    (str, node) => dom.select(str).replaceWith(node());

dom.remove = 
    (str) => dom.select(str).remove();

dom.set = 
    (str, attrs) => {
        let N = dom.select(str), 
            setAttr = N instanceof SVGElement 
                ? (v, k) => N.setAttributeNS(null, k, v)
                : (v, k) => N.setAttribute(k, v);
        _r.forEach(setAttr)(attrs);
    }

dom.loop = 
    (dt, tick) => 
        t => Promise.resolve(t)
            .then(tick)
            .then(() => __.sleep(dt))
            .then(() => t + dt)
            .then(dom.loop(dt, tick))

module.exports = dom;
