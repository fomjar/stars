

import game from './game.js'
let PIXI = require('pixi.js');

let logic = {};

logic.init = () => {
    init_app();
    init_asset();
    init_view();
};

logic.next = () => {

};

let init_app = () => {
    let screen = {width : window.innerWidth, height : window.innerHeight};

    let app = new PIXI.Application(screen.width, screen.height, {
        backgroundColor : 0x000000,
        antialias       : true,
    });

    document.body.appendChild(app.view);


    let frame = view => {
        if (view.clear) view.clear();
        if (view.draw)  view.draw();

        if (game._debug) {
            if (!view.beginFill) return;

            view.beginFill(0, 0);
            view.lineStyle(1, 0xffffff, 1);
            view.drawRect(- view.data.width / 2, - view.data.height / 2, view.data.width, view.data.height);
            view.endFill();
        }

        if (view.children) {
            for (let i = 0; i < view.children.length; i++) {
                frame(view.children[i]);
            }
        }
    };

    app.ticker.add(delta => frame(app.stage));

    game.screen = screen;
    game.app = app;
};

let init_asset = () => {
    game.asset = {
        home    : {x : game.screen.width / 2, y : game.screen.height / 2},
    };
}

let init_view = () => {
    logic.view_pane_resource = new game.VPaneResource();
    logic.view_pane_operate  = new game.VPaneOperate();
    logic.view_pane_resource.show();
    logic.view_pane_operate.show();

    let home = new game.VStarHome();
    home.data.bindi(game.asset.home);
    home.show();
    home.layer_bot();
};

export default logic

