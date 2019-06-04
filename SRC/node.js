let __ = require('./__'),
    Parse = require('./parse'),
    Model = require('./model');

function Node (tag, attr, branch) {
        
        let {tag, attr, branch} = Parse.args(tag, attr, branch);

        let self = {
            tag:        tag,
            svg:        tag === 'svg' || tag === 'g',
            attr:       attr,
            prop:       {},
            on:         {},
            html:       '',
            value:      '',
            class:      '',
        };

        let my = M => _Node(self)(M);

        return __.getset(my, self);
}
        

// node :: Model -> DOMnode
function _Node (N) { 

        let parentNode = null;

        let create = 
            () => N.svg
                ? createSvg(N.doc, N.tag)
                : N.doc.createElement(N.tag)

        let setAttribute = 
            (k, v, node) => N.svg
                ? setSvg(k, v, node)
                : node.setAttribute(k, v, node)

        let my = 
            M => {
                let node = create();

                __.forKeys(
                    (v, k) => setAttribute(k, v, node)
                )(M.keys(N.attr));

                __.forKeys(
                    (v, k) => node[k] = v
                )(M.keys(N.prop));

                __.forKeys(
                    (v, k) => node.addEventListener(k, v)
                )(M.events(N.on));

                node.innerHTML = M(N.html);
                node.value = M(N.value);

                if (parentNode)
                    parentNode.appendChild(node);

                return node;
            }

        my.append = 
            p => parentNode = p;

        return my;
}

Node.fragment = 
    doc => doc.createDocumentFragment();



/*************      svg      *************/


function setSvg (key, val, node) {

    node.setAttributeNS(null, key, val);
}


function createSvg (doc, tag) {

    let svgNS = "http://www.w3.org/2000/svg",
        node = doc.createElementNS(svgNS, tag);
    if (tag === 'svg')
        node.setAttributeNS(
            "http://www.w3.org/2000/xmlns/", 
            "xmlns:xlink", 
            "http://www.w3.org/1999/xlink"
        );
    return node;
}
