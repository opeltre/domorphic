let __ = require('./__'),
    Parse = require('./parse'),
    Model = require('./model');

module.exports = dom;

// dom a :: a -> node

function dom (tag, attr, branch) {
        
        let {tag, attr, branch} = Parse.args(tag, attr, branch);

        let self = {
            // node construction 
            tag:        tag,
            svg:        tag === 'svg' || tag === 'g',
            attr:       attr,
            prop:       {},
            on:         {},
            branch:     branch,
            html:       '',
            value:      '',
            class:      '',
            doc:        window.document,
            // dom destination
            root:       true,
            target:     null
            // impure variable 
            node:       null,
        };

        my.append = 
            (...bs) => {
                self.branch = [...self.branch, ...bs];
                return my;
            };


        let my = M => {
            let node = Node(self)(M);

            self.branch
                .map(b => b.root(false))
                .forEach(b => node.appendChild(b(M)));

            if (root)
                let t = self.doc.querySelector(target);
                t ? t.appendChild(node) : console.log('no target');
            
            my.node(node);

            return node;
        };

        return __.getset(my, self);
}
        


// node a :: a -> singleNode

function Node (N) { 

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
                )(M.mapKeys(N.attr));

                __.forKeys(
                    (v, k) => node[k] = v
                )(M.mapKeys(N.prop));

                __.forKeys(
                    (v, k) => node.addEventListener(k, v)
                )(M.mapEvents(N.on));

                node.innerHTML = M(N.html);

                node.value = M(N.value);

                return node;
            }

        return __.pipe(Model, my);
}


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
