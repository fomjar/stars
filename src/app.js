{

    let pixi = require('pixi.js');
    let g    = require('./global');
    let view = require('./view');

    let init_app = () => {

        document.body.appendChild(g.app.view);

        let frame = view => {
            if (view.clear) view.clear();
            if (view.draw)  view.draw();
            if (view.children) for (let v of view.children) frame(v);

            if (g.debug) {
                if (view.beginFill) {
                    view.beginFill(0, 0);
                    view.lineStyle(1, 0xffffff, 1);
                    view.drawRect(- view.data.width / 2, - view.data.height / 2, view.data.width, view.data.height);
                    view.endFill();
                }
            }
        };

        g.app.ticker.add(delta => frame(g.app.stage));

        if (!g.debug) {
            window.console = {
                log     : () => {},
                trace   : () => {},
                debug   : () => {},
                info    : () => {},
                warn    : () => {},
                error   : () => {},
            };
        }
    };

    let init_view = () => {
        g.view.pane = {};
        g.app.stage.addChild(g.view.pane.resource    = new view.VPaneResource());
        g.app.stage.addChild(g.view.pane.operate     = new view.VPaneOperate());
        g.view.pane.resource.show();
        g.view.pane.operate.show();

        g.view.hero = new view.VHero();
        g.view.map  = new view.VMapWorld();

        g.view.pane.operate.btn.click(() => {new view.VDialogMap(g.view.map).show();});
    };

    let init = () => {
        init_app();
        init_view();
    };

    let next = () => {

    };

    init();

}

