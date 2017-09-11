{

    let pixi = require('pixi.js');
    let g    = require('./global');
    let data = require('./data');

    class View extends pixi.Graphics {
        constructor () {
            super();
            
            let find_data = proto => {
                if (Object.is(proto, data.Data.prototype)) this.data = new data.Data();
                else {
                    let name = `D${proto.constructor.name.slice(1)}`;
                    if (data[name]) this.data = new data[name]();
                    else find_data(Object.getPrototypeOf(proto));
                }
            };
            find_data(Object.getPrototypeOf(this));

            this.state  = 'normal';    // normal / over / down
            
            this.data.bindo(this.position, 'x');
            this.data.bindo(this.position, 'y');
            // this.data.onset('width',   v => this.width  = v);
            // this.data.onset('height',  v => this.height = v);
            this.data.bindo(this, 'alpha');
            this.data.onset('scale', (k, v) => {
                this.scale.x = v;
                this.scale.y = v;
            });
            this.data.bindo(this, 'visible');
        }
        
        draw () {
            this.lineStyle(this.data.border, this.data.color_bd, this.data.alpha_draw);
            let color_bg = this.data.color_bg;
            let alpha_draw = this.data.alpha_draw;
            if (null == color_bg) {
                color_bg = 0x000000;
                alpha_draw = 0;
            };
            this.beginFill(color_bg, alpha_draw);
            this.draw_shape();
            this.endFill();

            this.draw_post();
        }

        draw_shape () {}

        draw_post () {
            if (this.interactive) {
                let color_mask = this.data.color_mask_light;
                switch (this.state) {
                    case 'over':
                        color_mask = this.data.color_mask_light;
                        break;
                    case 'down':
                        color_mask = this.data.color_mask_dark;
                        break;
                }
                this.lineStyle(this.data.border, color_mask, this.data.alpha_draw * this.data.alpha_draw_mask);
                this.beginFill(color_mask, this.data.alpha_draw * this.data.alpha_draw_mask);
                this.draw_shape();
                this.endFill();
            }
        }

        drawLine(x1, y1, x2, y2) {
            let color = this.lineColor;
            let alpha = this.lineAlpha;
            let width = this.lineWidth;

            this.lineStyle(0);

            this.beginFill(color, alpha);
            this.moveTo(x1, y1);
            this.lineTo(x2, y2);
            this.lineTo(x2 + width / 2, y2 + width / 2);
            this.lineTo(x1 + width / 2, y1 + width / 2);
            this.endFill();

            this.beginFill(color, alpha);
            this.moveTo(x1, y1);
            this.lineTo(x2, y2);
            this.lineTo(x2 - width / 2, y2 - width / 2);
            this.lineTo(x1 - width / 2, y1 - width / 2);
            this.lineTo(x1, y1);
            this.endFill();

            this.beginFill(color, alpha);
            this.moveTo(x1, y1);
            this.lineTo(x2, y2);
            this.lineTo(x2 + width / 2, y2 - width / 2);
            this.lineTo(x1 + width / 2, y1 - width / 2);
            this.lineTo(x1, y1);
            this.endFill();

            this.beginFill(color, alpha);
            this.moveTo(x1, y1);
            this.lineTo(x2, y2);
            this.lineTo(x2 - width / 2, y2 + width / 2);
            this.lineTo(x1 - width / 2, y1 + width / 2);
            this.lineTo(x1, y1);
            this.endFill();

            this.lineStyle(width, color, alpha);
        }
        
        show (dn, tm) {
            dn = tm = undefined;
            for (let arg of arguments) {
                if (Object.is(typeof arg, 'function')) dn = arg;
                if (Object.is(typeof arg, 'number'))   tm = arg;
            }
            
            this.data.alpha = 0;
            this.data.tween('alpha', 1, dn, tm);
            
            return this;
        }
        
        hide (dn, tm) {
            dn = tm = undefined;
            for (let arg of arguments) {
                if (Object.is(typeof arg, 'function')) dn = arg;
                if (Object.is(typeof arg, 'number'))   tm = arg;
            }

            this.data.tween('alpha', 0, dn, tm);

            return this;
        }
        
        layer_top () {return this.layer(0xffffffff);}
        
        layer_bot () {return this.layer(0);}
        
        layer (i) {
            if (Object.is(i, undefined)) return this.parent.getChildIndex(this);
            
            if (!this.parent) throw new Error('layer operate failed, no parent');
            if (i < 0) i = 0;
            if (i >= this.parent.children.length) i = this.parent.children.length - 1;
            
            this.parent.setChildIndex(this, i);
            return this;
        }

        auto_interactive (
            norm    = () => {},
            over    = () => {},
            down    = () => {},
        ) {
            this.interactive    = true;
            
            this.removeAllListeners('pointerover');
            this.removeAllListeners('pointerout');
            this.removeAllListeners('pointerdown');
            this.removeAllListeners('pointerup');
            this.removeAllListeners('pointerupoutside');
            
            this.on('pointerover', () => {
                this.layer_top();
                this.state = 'over';
                this.data.tween('alpha_draw_mask', 0.2);
                over();
            });
            this.on('pointerout', () => {
                this.state = 'normal';
                this.data.tween('alpha_draw_mask', 0);
                norm();
            });
            this.on('pointerdown', () => {
                this.layer_top();
                this.state = 'down';
                this.data.tween('alpha_draw_mask', 0.2);
                down();
            });
            this.on('pointerup', () => {
                this.layer_top();
                this.state = 'over';
                this.data.tween('alpha_draw_mask', 0.2);
                over();
            });
            this.on('pointerupoutside', () => {
                this.state = 'normal';
                this.data.tween('alpha_draw_mask', 0);
                norm();
            });
        }

        auto_interactive_scale (scale = 1.05) {
            this.auto_interactive(
                () => this.data.tween('scale', 1),
                () => this.data.tween('scale', scale),
                () => this.data.tween('scale', 1),
            );
        }
    }

    class VLabel extends View {
        constructor (text) {
            super();
            this.data.text = text || '';
            
            this.view = new pixi.Text(this.text);
            this.addChild(this.view);
            
            this.data.onset('text', (k, v) => {
                this.view.text = v;
                this.update();
            });
            this.data.onset('align', () => this.update());
            this.data.bindo(this.view.style, 'fontSize',    () => this.update());
            this.data.bindo(this.view.style, 'fontWeight',  () => this.update());
            this.data.bindo(this.view.style, 'fill');
        }
        
        update () {
            this.data.width     = this.view.width;
            this.data.height    = this.view.height;
            this.view.pivot.y   = this.view.height / 2;
            switch (this.data.align) {
                case 'left':
                    this.view.pivot.x = 0;
                    break;
                case 'right':
                    this.view.pivot.x = this.view.width;
                    break;
                case 'center':
                    this.view.pivot.x = this.view.width  / 2;
                    break;
            }
        }
        
        align_left () {
            this.data.align_left();
            return this;
        }
        
        align_right () {
            this.data.align_right();
            return this;
        }
        
        align_center () {
            this.data.align_center();
            return this;
        }
    }

    class VPane extends View {
        constructor () {
            super();
        }

        draw_shape () {
            this.drawRoundedRect(- this.data.width / 2 * this.data.scale_draw,
                                 - this.data.height / 2 * this.data.scale_draw,
                                 this.data.width * this.data.scale_draw,
                                 this.data.height * this.data.scale_draw,
                                 this.data.round * this.data.scale_draw);
        }
    }

    class VButton extends VPane {
        constructor (text) {
            super();
            this.data.text  = text || '';
            
            this.label  = new VLabel();
            this.addChild(this.label);
            
            this.data.bindo(this.label.data, 'text');
            this.data.onset('height', (k, v) => {
                this.label.data.fontSize    = v * 3 / 5;
            });
        }
        
        style_icon_small () {
            this.buttonMode = false;
            this.data.style_icon_small();
            this.auto_interactive();
            return this;
        }
        style_icon_middle () {
            this.buttonMode = false;
            this.data.style_icon_middle();
            this.auto_interactive();
            return this;
        }
        style_icon_large () {
            this.buttonMode = false;
            this.data.style_icon_large();
            this.auto_interactive();
            return this;
        }
        style_primary () {
            this.buttonMode = true;
            this.data.style_primary();
            this.auto_interactive_scale();
            return this;
        }

        click (action) {
            this.interactive = true;
            this.on('pointerup', action);
            return this;
        }
    }

    class VShadow extends VPane {
        constructor () {
            super();

            this.data.color_bg     = 0x000000;
            this.data.alpha_draw   = 0.01;
            this.data.width     = g.screen.width;
            this.data.height    = g.screen.height;
            this.data.x         = this.data.width / 2;
            this.data.y         = this.data.height / 2;
            this.interactive    = true;
            this.on('pointerover', () => false);
            this.on('pointerout', () => false);
            this.on('pointerdown', () => false);
            this.on('pointerup', () => false);
            this.on('pointerupoutside', () => false);
        }
    }


    class VDialog extends VPane {
        constructor () {
            super();
            
            this.shadow   = new VShadow();
            this.buttons = {};
        }
        
        option (key, val, action) {
            if (!key || !val) throw new Error('illegal arguments, require: key, val');
            
            let button = new VButton(val).style_primary();
            if (action) button.click(action);
            
            this.data.option(key, val);
            this.buttons[key] = button;
            this.addChild(button);
            
            this.update();
            
            return this;
        }
        
        update () {
            let height = 48;
            let keys = Object.keys(this.buttons);
            let grids = data.grid(
                this.data.height / 2 - height,
                - this.data.width / 2,
                this.data.height / 2,
                this.data.width / 2,
                4, Math.ceil(keys.length / 4)
            );
            for (let i = 0; i < grids.length; i++) {
                let grid = grids[i];
                let button = this.buttons[keys[i]];
                if (button) {
                    button.data.x = grid.x;
                    button.data.y = grid.y;
                }
            }
        }
        
        show (dn) {
            g.app.stage.addChild(this.shadow);
            g.app.stage.addChild(this);
            super.show(dn, 500);
        }

        hide (dn) {
            super.hide(() => {
                this.parent.removeChild(this);
                this.shadow.parent.removeChild(this.shadow);
                if (dn) dn();
            }, 500);
        }
    }


    class VPaneResource extends VPane {
        constructor () {
            super();
            
            let create_resource = (name, key, grid) => {
                let icon = new VButton(name).style_icon_small();
                let label = new VLabel('0').align_left();
                label.data.fill = 'white';
                
                let padding = (this.data.height - icon.data.height) / 2;
                icon.data.x  = grid.x - grid.w / 2 + padding + icon.data.width / 2;
                label.data.x = grid.x - grid.w / 2 + padding * 1.5 + icon.data.width;
                
                this.addChild(icon);
                this.addChild(label);
            };
            
            create_resource('炭', 'C14',     this.data.grid[0]);
            create_resource('钛', 'Ti',      this.data.grid[1]);
            create_resource('钚', 'Pu238',   this.data.grid[2]);
        }
    }


    class VPaneOperate extends VPane {
        constructor () {
            super();
            
            this.addChild(this.btn = new VButton('结束本轮').style_primary());
        }
    }


    class VHero extends View {
        constructor () {
            super();
        }
    }

    class VMapPlace extends VPane {
        constructor (region) {
            super();
            this.region = region;

            this.auto_interactive_scale(1.5);
        }

        draw_shape () {
            this.drawCircle(0, 0, this.data.radius * this.data.scale_draw);
        }

        update () {
            let grid_width  = this.region.data.width  / this.region.data.col;
            let grid_height = this.region.data.height / this.region.data.row;
            this.data.x = - this.region.data.width  / 2 + (this.data.grid.c + this.data.grid.x) * grid_width;
            this.data.y = - this.region.data.height / 2 + (this.data.grid.r + this.data.grid.y) * grid_height;
        }
    }

    class VMapRegion extends VPane {
        constructor (level) {
            super();

            this.places = [];
            this.entrance = null;
            this.exit = null;

            let {places, entrance, exit} = this.data.places(level);
            for (let row of places) {
                let r = [];
                for (let p of row) {
                    let v = new VMapPlace(this);
                    Object.assign(v.data, p);
                    r.push(v);
                    this.addChild(v);
                }
                this.places.push(r);
            }
            this.entrance = this.places[entrance.grid.r][entrance.grid.c];
            this.exit = this.places[exit.grid.r][exit.grid.c];

            let update = () => {
                for (let row of this.places) {
                    for (let p of row) {
                        p.update();
                    }
                }
            }

            this.data.onset('width',  update);
            this.data.onset('height', update);
        }

        show (dn, tm) {
            this.data.scale = 0.5;
            super.show(tm);
            this.data.tween('scale', 1, dn, tm);
        }

        hide (dn, tm) {
            super.hide(tm);
            this.data.tween('scale', 0.5, dn, tm);
        }

        draw_shape () {
            let draw_place_line = (p1) => {
                if (p1.data.grid.c < this.places[p1.data.grid.r].length - 1) { // line right
                    let p2 = this.places[p1.data.grid.r][p1.data.grid.c + 1];
                    this.drawLine(p1.data.x, p1.data.y, p2.data.x, p2.data.y);
                }
                if (p1.data.grid.r < this.places.length - 1) { // line down
                    let p2 = this.places[p1.data.grid.r + 1][p1.data.grid.c];
                    this.drawLine(p1.data.x, p1.data.y, p2.data.x, p2.data.y);
                }
            }
            for (let row of this.places) {
                for (let p of row) {
                    draw_place_line(p);
                }
            }
        }
    }

    class VMapWorld extends VPane {
        constructor () {
            super();

            this.region = null;
            this.next();
        }

        next () {
            this.region = new VMapRegion(++this.data.level);
        }
    }

    class VDialogMap extends VDialog {
        constructor (map) {
            super();
            this.data.width  = g.screen.width * 2 / 3;
            this.data.height = g.screen.height * 2 / 3;

            let padding = 8;
            this.btn_toggle = new VButton('切').style_icon_small();
            this.btn_toggle.data.x = - this.data.width / 2 + this.btn_toggle.data.width / 2 + padding;
            this.btn_toggle.data.y = - this.data.height / 2 + this.btn_toggle.data.height / 2 + padding;
            this.btn_toggle.click(() => this.toggle());
            this.addChild(this.btn_toggle);

            this.btn_close = new VButton('关').style_icon_small();
            this.btn_close.data.x = this.data.width / 2 - this.btn_toggle.data.width / 2 - padding;
            this.btn_close.data.y = - this.data.height / 2 + this.btn_toggle.data.height / 2 + padding;
            this.btn_close.click(() => this.hide());
            this.addChild(this.btn_close);

            this.map        = map;
            this.map_cur    = null;
            this.padding    = 80;

            this.toggling = false;
            this.toggle();
        }

        toggle () {
            if (this.toggling) return;
            this.toggling = true;

            let map_old = this.map_cur;
            if (map_old) {
                map_old.hide(() => {
                    this.removeChild(map_old);
                });
            }

            if (Object.is(this.map_cur, this.map) || !this.map_cur) this.map_cur = this.map.region;
            else this.map_cur = this.map;
            this.map_cur.data.width     = this.data.width - this.padding;
            this.map_cur.data.height    = this.data.height - this.padding;

            this.addChild(this.map_cur);
            this.map_cur.layer_bot();
            if (map_old) {
                this.map_cur.show(() => {
                    this.toggling = false;
                });
            } else {this.toggling = false;}
        }
    }

    module.exports = {
        View,
        VLabel,
        VPane,
        VButton,
        VShadow,
        VDialog,
        VPaneResource,
        VPaneOperate,
        VHero,
        VMapRegion,
        VMapWorld,
        VDialogMap,
    };

}

