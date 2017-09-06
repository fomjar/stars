
let pixi = require('pixi.js');
let g    = require('./global');
let view = require('./view');

let init_app = () => {

    document.body.appendChild(g.app.view);

    let frame = view => {
        if (view.clear) view.clear();
        if (view.draw)  view.draw();

        if (g.debug) {
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

    g.app.ticker.add(delta => frame(g.app.stage));
};

let init_view = () => {
    g.view.pane_resource    = new view.VPaneResource(),
    g.view.pane_operate     = new view.VPaneOperate(),
    g.view.pane_resource.show();
    g.view.pane_operate.show();

    g.view.star_home        = new view.VStarHome(),
    g.view.star_home.data.bindi(g.asset.home);
    g.view.star_home.show();
    g.view.star_home.layer_bot();
};

let init = () => {
    init_app();
    init_view();
};

let next = () => {

};

init();

