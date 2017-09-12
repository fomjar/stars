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

    let level_next = () => {
        let interlude = () => {
            new view.VInterlude('世界失去和平，战乱四起，我们要团结起来，然后逃离这个星球！').play(() => {
                g.app.stage.addChild(g.view.pane_resource);
                g.app.stage.addChild(g.view.pane_operate);
                g.view.pane_resource.show(1000);
                g.view.pane_operate.show(1000);

                g.view.map.next();
                g.app.stage.addChild(g.view.map.region);
                g.view.map.region.show(2000);
            });
        };
        if (g.view.pane_operate.parent) {

        } else {
            
        }
    };

    let init_launcher = () => {
        let launcher = new view.VLauncher();
        g.app.stage.addChild(launcher);
        launcher.show(1000);

        launcher.btn_start.click(() => {
            launcher.hide(() => {
                launcher.remove();

                g.view.pane_resource = new view.VPaneResource();
                g.view.pane_operate = new view.VPaneOperate();
                g.view.hero = new view.VHero();
                g.view.map = new view.VMapWorld(g.view.hero);

                level_next();
            }, 1000);
        });
    };

    let init = () => {
        init_app();
        init_launcher();
    };

    init();

}

