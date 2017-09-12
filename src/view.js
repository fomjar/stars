{

    let pixi = require('pixi.js');
    let g    = require('./global');
    let data = require('./data');
    let t    = require('./tween');

    class View extends pixi.Graphics {
        constructor () {
            super();
            
            let find_data = proto => {
                if (Object.is(proto, View.prototype)) this.data = new data.Data();
                else {
                    let name = `D${proto.constructor.name.slice(1)}`;
                    if (data[name]) this.data = new data[name]();
                    else find_data(Object.getPrototypeOf(proto));
                }
            };
            find_data(Object.getPrototypeOf(this));

            this.state      = 'norm';    // norm / over / down
            this.state_norm = [];
            this.state_over = [];
            this.state_down = [];
            
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
            this.data.bindo(this, 'rotation');

            data.onset(this, 'state', (k, v) => {
                switch (v) {
                case 'norm': for (let on of this.state_norm) on(); break;
                case 'over': for (let on of this.state_over) on(); break;
                case 'down': for (let on of this.state_down) on(); break;
                }
            });
        }
        
        draw () {
            if (0 != this.data.border && null != this.data.color_bd)
                this.lineStyle(this.data.border, this.data.color_bd, this.data.alpha_draw);
            if (null != this.data.color_bg)
                this.beginFill(this.data.color_bg, this.data.alpha_draw);

            this.draw_back();

            this.endFill();

            this.draw_fore();

            this.draw_mask();
        }

        draw_back () {}

        draw_fore () {};

        draw_mask () {
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
                this.draw_back();
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

        remove () {this.parent.removeChild(this);}
        
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

        click (action) {
            this.interactive    = true;
            this.on('pointerup', action);
            return this;
        }

        auto_interactive () {
            this.interactive    = true;
            
            this.on('pointerover',      () => this.state = 'over');
            this.on('pointerout',       () => this.state = 'norm');
            this.on('pointerdown',      () => this.state = 'down');
            this.on('pointerup',        () => this.state = 'over');
            this.on('pointerupoutside', () => this.state = 'norm');

            return this;
        }

        on_state_norm (fn) {this.state_norm.push(fn); return this;}
        on_state_over (fn) {this.state_over.push(fn); return this;}
        on_state_down (fn) {this.state_down.push(fn); return this;}

        auto_interactive_mask (alpha = 0.2) {
            this.on_state_norm(() => this.data.tween('alpha_draw_mask', 0));
            this.on_state_over(() => this.data.tween('alpha_draw_mask', alpha));
            this.on_state_down(() => this.data.tween('alpha_draw_mask', alpha));

            return this;
        }

        auto_interactive_scale (scale = 1.05) {
            this.on_state_norm(() => this.data.tween('scale', 1));
            this.on_state_over(() => this.data.tween('scale', scale));
            this.on_state_down(() => this.data.tween('scale', 1));

            return this;
        }

        auto_interactive_layer () {
            this.on_state_over(() => this.layer_top());

            return this;
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
            this.data.bindo(this.view.style, 'align',           () => this.update());
            this.data.bindo(this.view.style, 'fontSize',        () => this.update());
            this.data.bindo(this.view.style, 'fontWeight',      () => this.update());
            this.data.bindo(this.view.style, 'fill',            () => this.update());
            this.data.bindo(this.view.style, 'breakWords',      () => this.update());
            this.data.bindo(this.view.style, 'wordWrap',        () => this.update());
            this.data.bindo(this.view.style, 'wordWrapWidth',   () => this.update());
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

        draw_back () {
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

            this.auto_interactive();
            this.auto_interactive_mask();
            this.auto_interactive_layer();
        }
        
        style_icon_small () {
            this.buttonMode = false;
            this.data.style_icon_small();
            return this;
        }
        style_icon_middle () {
            this.buttonMode = false;
            this.data.style_icon_middle();
            return this;
        }
        style_icon_large () {
            this.buttonMode = false;
            this.data.style_icon_large();
            return this;
        }
        style_primary () {
            this.buttonMode = true;
            this.data.style_primary();
            this.auto_interactive_scale();
            return this;
        }
        style_large () {
            this.buttonMode = true;
            this.data.style_large();
            this.auto_interactive_scale();
            return this;
        }
    }

    class VShadow extends VPane {
        constructor () {
            super();

            this.on('pointerover',      () => false);
            this.on('pointerout',       () => false);
            this.on('pointerdown',      () => false);
            this.on('pointerup',        () => false);
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
            super.show(dn, 400);
        }

        hide (dn) {
            super.hide(() => {
                this.remove();
                this.shadow.remove();
                if (dn) dn();
            }, 400);
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
            this.place = null;

            let fn = () => {
                this.data.tween('alpha_draw', 0.2, () => {
                    this.data.tween('alpha_draw', 1, () => {
                        fn();
                    }, 1000, t.Linear);
                }, 1000, t.Linear);
            };
            fn();
        }

        draw_back () {
            this.drawCircle(0, 0, this.data.radius * this.data.scale_draw);
        }
    }

    class VMapPlace extends VButton {
        constructor (region) {
            super();
            this.region = region;

            this.auto_interactive();
            this.auto_interactive_mask();
            this.auto_interactive_scale(1.5);
            this.on_state_over(() => {
                let fn = () => {
                    this.data.rotation = 0;
                    this.data.tween('rotation', 2 * Math.PI, fn, 3000, t.Linear);
                };
                fn();
            });
            this.on_state_norm(() => {
                this.data.tween('rotation', 0, () => {this.data.rotation = 0;}, 10, t.Linear);
            });
        }

        draw_back () {
            this.drawCircle(0, 0, this.data.radius * this.data.scale_draw);
        }

        draw_fore () {
            switch (this.data.type) {
            case 'normal':
                break;
            case 'entrance':
                this.lineStyle(this.data.border, 0x0000ff, this.data.alpha_draw);
                this.beginFill(0x000000, 0);
                this.drawRect(- this.data.radius / 3, - this.data.radius / 3, this.data.radius * 2 / 3, this.data.radius * 2 / 3);
                this.endFill();
                break;
            case 'exit':
                this.lineStyle(this.data.border, 0x00ff00, this.data.alpha_draw);
                this.beginFill(0x000000, 0);
                this.drawRect(- this.data.radius / 3, - this.data.radius / 3, this.data.radius * 2 / 3, this.data.radius * 2 / 3);
                this.endFill();
                break;
            }
        }

        update () {
            let grid_width  = this.region.data.width  / this.region.data.col;
            let grid_height = this.region.data.height / this.region.data.row;
            this.data.x = - this.region.data.width  / 2 + (this.data.grid.c + this.data.grid.x) * grid_width;
            this.data.y = - this.region.data.height / 2 + (this.data.grid.r + this.data.grid.y) * grid_height;
        }

        hero_move (hero) {
            let move_check = () => {
                if (!hero.place) return true;
                return 1 == Math.abs(this.data.grid.r - hero.place.data.grid.r)
                          + Math.abs(this.data.grid.c - hero.place.data.grid.c);
            };
            let move_do = () => {
                if (!hero.place) {
                    hero.data.x = this.data.x;
                    hero.data.y = this.data.y;
                    this.region.data.x = g.screen.width  / 2 - this.data.x;
                    this.region.data.y = g.screen.height / 2 - this.data.y;
                } else {
                    let time = 1000;
                    hero.data.tween('x', this.data.x, null, time);
                    hero.data.tween('y', this.data.y, null, time);
                    this.region.data.tween('x', g.screen.width  / 2 - this.data.x, null, time);
                    this.region.data.tween('y', g.screen.height / 2 - this.data.y, null, time);
                }
                hero.place = this;
            };

            if (move_check()) move_do();

            return this;
        }
    }

    class VMapRegion extends VPane {
        constructor (level, hero) {
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
                    v.click(() => {v.hero_move(hero);});
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

            this.hero = hero;
            this.addChild(hero);

            this.entrance.hero_move(hero);
        }

        draw_back () {
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
        constructor (hero) {
            super();

            this.hero = hero;
            this.region = null;
        }

        next () {
            this.region = new VMapRegion(++this.data.level, this.hero);
        }
    }

    class VLauncher extends View {
        constructor () {
            super();

            let offset = 100;
            this.lbl_title = new VLabel('星球物语');
            this.lbl_title.data.fontSize = 80;
            this.lbl_title.data.fill = '#cccccc';
            this.lbl_title.y = - offset;
            this.btn_start = new VButton('启程').style_large();
            this.btn_start.y = offset;

            this.addChild(this.lbl_title);
            this.addChild(this.btn_start);
        }
    }

    class VInterlude extends View {
        constructor (text) {
            super();

            this.lbl_title = new VLabel(text);
            this.lbl_title.data.fontSize = 32;
            this.lbl_title.data.fill = '#cccccc';
            this.lbl_title.data.wordWrapWidth = g.screen.width * 2 / 3;

            this.addChild(this.lbl_title);
        }

        play (dn, delay = Math.min(3000, this.lbl_title.data.text.length * 1000 / 2)) {
            if (!dn) throw new Error('illegal arguments, require: dn');

            g.app.stage.addChild(this);
            this.show(() => {
                window.setTimeout(() => {
                    this.hide(() => {
                        this.remove();
                        if (dn) dn();
                    }, 1000);
                }, delay);
            }, 1000);
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
        VLauncher,
        VInterlude,
    };

}

