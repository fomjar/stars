{

    let pixi = require('pixi.js');
    let g    = require('./global');
    let view = require('./view');

    let init_app = () => {

        document.body.appendChild(g.app.view);

        let frame = view => {
            if (view.clear) view.clear();
            if (view.draw)  view.draw();

            if (g.debug) {
                if (view.beginFill) {
                    view.beginFill(0, 0);
                    view.lineStyle(1, 0xffffff, 1);
                    view.drawRect(- view.data.width / 2, - view.data.height / 2, view.data.width, view.data.height);
                    view.endFill();
                }
            }

            if (view.children) for (let v of view.children) frame(v);
        };

        g.app.ticker.add(delta => frame(g.app.stage));
    };

    let init_view = () => {
        g.view.pane_resource    = new view.VPaneResource(),
        g.view.pane_operate     = new view.VPaneOperate(),
        g.view.pane_resource.show();
        g.view.pane_operate.show();

        g.view.star_home        = new view.VStarHome(),
        g.view.star_home.data.bindalli(g.asset.home);
        g.view.star_home.show();
        g.view.star_home.layer_bot();

        g.view.star_home.click(() => {
        new view.VDialog()
            .option('1', 'test1')
            .option('2', 'test2')
            .option('3', 'test3')
            .option('4', 'test4')
            .show();
        });
    };

    let init = () => {
        init_app();
        init_view();
    };

    let next = () => {

    };

    init();

}

