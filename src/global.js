
let pixi = require('pixi.js');

let g = {
    debug   : true,
    screen  : {
        width   : window.screen.width,
        height  : window.screen.height
    },
    app     : new pixi.Application(screen.width, screen.height, {
        backgroundColor : 0x000000,
        antialias       : true,
    }),
    view    : {
        // init in app.js
    },
};

g.asset = {
    home    : {x : g.screen.width / 2, y : g.screen.height / 2},
};

module.exports = g;

