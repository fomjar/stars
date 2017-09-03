define(['game.tween'], (tween) => {
    
    'use strict';
    
    let data = {};
    
    data.Data = class Data {
        constructor () {
            this.x      = 0;
            this.y      = 0;
            this.width  = 1;
            this.height = 1;
            this.visible    = true;
            this.scale      = 1;
            this.scale_draw = 1;
            this.alpha      = 1;
            this.alpha_draw = 1;
        }
        tween   (pr, to, tm, dn)    {Data.tween (this, pr, to, tm, dn);}
        on_get  (pr, fn)            {Data.on_get(this, pr, fn);}
        on_set  (pr, fs, fg)        {Data.on_set(this, pr, fs, fg);}
        bindi   (sr, pr, fn)        {Data.bind  (this, sr, pr, fn);}
        bindo   (ta, pr, fn)        {Data.bind  (ta, this, pr, fn);}
        static tween (ta, pr, to, tm, dn) {
            if (3 > arguments.length) throw new Error('illegal arguments count, at least 3');
            
            switch (arguments.length) {
                case 4:
                    if ('function' == typeof tm) {
                        dn = tm;
                        tm = null;
                    }
                    break;
            }
            if (!tm) tm = 160;
            
            let fn      = tween.Circ.easeOut;
            let from    = ta[pr];
            let time    = 0;
            let begin   = new Date().getTime();

            let app = document.game.app;
            if (!ta._tweener) ta._tweener = {};
            if (ta._tweener[pr]) {
                app.ticker.remove(ta._tweener[pr]);
                delete ta._tweener[pr];
            }
            ta._tweener[pr] = (delta) => {
                time = new Date().getTime() - begin;
                ta[pr] = fn(time, from, to - from, tm);
                if (time >= tm) {
                    ta[pr] = to;
                    app.ticker.remove(ta._tweener[pr]);
                    delete ta._tweener[pr];
                    if (dn) dn();
                }
            };
            app.ticker.add(ta._tweener[pr]);
        }
        static on_get (ta, pr, fn) {
            if (2 > arguments.length) throw new Error('illegal arguments count, at least 2');

            ta[`_${pr}`] = ta[pr];
            if (!fn) fn = () => ta[`_${pr}`];
            ta.__defineGetter__(pr, () => fn());
        }
        static on_set (ta, pr, fs, fg) {
            if (2 > arguments.length) throw new Error('illegal arguments count, at least 2');

            Data.on_get(ta, pr, fg);
            
            ta.__defineSetter__(pr, (v) => {
                ta[`_${pr}`] = v;
                if (fs) fs(v);
            });
            ta[pr] = ta[`_${pr}`];
        }
        static bind (ta, sr, pr, fn) {
            if (2 > arguments.length) throw new Error('illegal arguments count, at least 2');
            
            switch (arguments.length) {
                case 3:
                    if ('function' == typeof pr) {
                        fn = pr;
                        pr = null;
                    }
                    break;
            }
            if (pr) {
                Data.on_set(sr, pr, (v) => {
                    ta[pr] = v;
                    if (fn) fn(pr, v);
                });
            } else {
                for (pr in sr) {
                    Data.on_set(sr, pr, (v) => {
                        ta[pr] = v
                        if (fn) fn(pr, v);
                    });
                }
            }
        }
    };
    data.DLabel = class DLabel extends data.Data {
        constructor () {
            super();
            
            this.text   = '';
            this.align  = 'center';
        }
        align_left   () {this.align = 'left';}
        align_center () {this.align = 'center';}
        align_right  () {this.align = 'right';}
    };
    data.DPane = class DPane extends data.Data {
        constructor () {
            super();
            this.alpha_draw = 0.4;
            this.round  = 6;
            this.border = 2;
            this.color_bg   = 0x999999;
            this.color_bd   = 0xcccccc;
        }
    };
    data.DButton = class DButton extends data.DPane {
        constructor () {
            super();
            this.alpha_draw = 1;
            this.border = 1;
            
            this.text   = '';
        }
        
        style_icon_small () {
            this.width      = 16;
            this.height     = 16;
        }
        
        style_icon_middle () {
            this.width      = 24;
            this.height     = 24;
        }
        
        style_icon_large () {
            this.width      = 32;
            this.height     = 32;
        }
        
        style_primary () {
            this.width      = 72;
            this.height     = 24;
        }
    };
    data.DPaneResource = class DPaneResource extends data.DPane {
        constructor () {
            super();
            this.width  = 256;
            this.height = 32;
            this.x      = this.width / 2;
            this.y      = this.height / 2;
            
            this.grid   = [];
            let n = 3;
            for (let i = 0; i < n; i++) {
                this.grid[i] = {
                    index : i,
                    name  : '',
                    value : 0,
                    position : {
                        left   : - this.width / 2 + this.width / n * i,
                        right  : - this.width / 2 + this.width / n * (i + 1),
                        center : - this.width / 2 + this.width / n * (i + 0.5)
                    }
                };
            }
        }
    };
    data.DPaneOperate = class DPaneOperate extends data.DPane {
        constructor () {
            super();
            this.width  = 300;
            this.height = 120;
            this.x      = this.width / 2;
            this.y      = document.game.screen.height - this.height / 2;
        }
    };
    data.DStar = class DStar extends data.DPane {
        constructor () {
            super();
            this.alpha_draw = 1;
            this.border = 0;
            
            this.radius = 1;
            this.level  = 1;
            this.type   = '';
            
            this.on_set('radius', (v) => {
                this.width  = v * 2;
                this.height = v * 2;
            })
            this.on_set('level', (v) => {
                let screen = document.game.screen;
                this.radius = screen.height / 5 + v * screen.height / 80;
                if ('home' == this.type) this.radius *= 1.2;
            });
            this.on_set('type', (type) => this.style_type());
        }
        
        style_type () {
            switch (this.type) {
                case 'home':
                    this.color_bg   = 0xcccc99;
                    this.color_bd   = 0x999999;
                    break;
            }
        }
    };

    return data;
});