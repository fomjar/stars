{

    let pixi = require('pixi.js');

    let g = {
        debug : true,
        screen : {
            width   : 800,
            height  : 600
        },
        view : {
            // init in app.js
        },
    };

    g.app = new pixi.Application(g.screen.width, g.screen.height, {
        backgroundColor : 0x000000,
        antialias       : true,
    });

    module.exports = g;

}
