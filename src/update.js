let IO = require('./io'),
    state = require('./state'),
    __ = require('lolo');

/*------ Updates ------

    Apps being represented as stateful computations returning an IO stream: 
        
        app : St(s, IO e) 

    Updates provide reactivity by describing how, upon event reception:
        1. the internal state is affected,
        2. which IO operations should be performed. 

        update : e -> St(s, IO e)
    
    The IO stream is then brought back to its listening state, 
    this simple pattern defining the main loop. 

        main :  s -> IO e

    This module is here for convenience, 
    and morally only emulates switch statements. 

    If the event name is matched, a new state instance is passed 
    to the listener along with remaining arguments: 

        update.on('message', (st, msg) => ...);

    When no event names are matched, the update instance's `pass` method
    is called, which defaults to: 

        update.pass = st => st.return(IO.return(0));


    update
        .on('message', (st, msg) => 
            st.puts(msgs => [...msgs, msg])
                .return(
        
*/

function App (updates={}, hooks={}) {

    let app = {};

    app.update = (e, ...xs) => {
        let update = updates[e],
            hook = hooks[e] || [];
        if (hook);
            __.do(...hook)(...xs);
        return update
            ? update(state(), ...xs)
                .bind(app.continue)
            : app.pass(state(), ...xs);
    };

    app.continue = r => typeof[r] === 'string'
        ? app.update(r)
        : state().return(r);

    app.on = (e, f) => {
        updates[e] = f;
        return app;
    }

    app.hook = (e, ...gs) => {
        hooks[e] = gs;
        return app;
    }
    
    app.pass = () => state().return(IO.return(0));

    app.main = (...e0) => m0 => {
        let [io, m1] = app.update(...e0).run(m0);
        return io.await()
            .bind(e1 => app.main(...e1)(m1));
    };

    app.start = m0 => app.main('start')(m0);

    return app;
}

module.exports = App;
