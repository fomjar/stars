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

            this.state  = 'default';
            
            this.data.bindo(this.position, 'x');
            this.data.bindo(this.position, 'y');
            // this.data.on_set('width',   v => this.width  = v);
            // this.data.on_set('height',  v => this.height = v);
            this.data.bindo(this, 'alpha');
            this.data.on_set('scale', (k, v) => {
                this.scale.x = v;
                this.scale.y = v;
            });
            this.data.bindo(this, 'visible');
        }
        
        draw () {}
        
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
            defa    = () => {},
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
                over();
            });
            this.on('pointerout', () => {
                this.state = 'default';
                defa();
            });
            this.on('pointerdown', () => {
                this.layer_top();
                this.state = 'down';
                down();
            });
            this.on('pointerup', () => {
                this.layer_top();
                this.state = 'over';
                over();
            });
            this.on('pointerupoutside', () => {
                this.state = 'default'
                defa();
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
            
            this.view = new pixi.Text(this.text, new pixi.TextStyle({fontWeight : '100'}));
            this.addChild(this.view);
            
            this.data.on_set('text', (k, v) => {
                this.view.text = v;
                this.update();
            });
            this.data.on_set('align', () => this.update());
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
            this.on('pointerup', () => false);
        }
        
        draw () {
            this.lineStyle(this.data.border, this.data.color_bd, this.data.alpha_draw);
            this.beginFill(this.data.color_bg, this.data.alpha_draw);
            this.drawRoundedRect(- this.data.width / 2 * this.data.scale_draw,
                                 - this.data.height / 2 * this.data.scale_draw,
                                 this.data.width * this.data.scale_draw,
                                 this.data.height * this.data.scale_draw,
                                 this.data.round);
            this.endFill();
        }
    }

    class VButton extends VPane {
        constructor (text) {
            super();
            this.data.text  = text || '';
            
            this.label  = new VLabel();
            this.addChild(this.label);
            
            this.data.bindo(this.label.data, 'text');
            this.data.on_set('width', (k, v) => {
                //  this.width  = v;
                this.label.update();
            });
            this.data.on_set('height', (k, v) => {
                //  this.height = v;
                this.label.view.style.fontSize    = v * 3 / 5;
                this.label.update();
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
        
        draw () {
            super.draw();
            
            let color_mask = undefined;
            switch (this.state) {
                case 'over':
                    color_mask = 0xffffff;
                    break;
                case 'down':
                    color_mask = 0x000000;
                    break;
            }
            if (undefined != color_mask) {
                this.lineStyle(0);
                this.beginFill(color_mask, 0.2);
                this.drawRoundedRect(- this.data.width / 2 * this.data.scale_draw,
                                     - this.data.height / 2 * this.data.scale_draw,
                                     this.data.width * this.data.scale_draw,
                                     this.data.height * this.data.scale_draw,
                                     this.data.round);
                this.endFill();
            }
        }
    }


    class VDialog extends VPane {
        constructor () {
            super();
            
            this.buttons = {};
            
            this.interactive = true;
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
            g.app.stage.addChild(this);
            super.show(dn, 800);
        }
        hide (dn) {
            super.hide(() => {
                this.parent.removeChild(this);
                if (dn) dn();
            }, 800);
        }
    }


    class VPaneResource extends VPane {
        constructor () {
            super();
            
            let create_resource = (name, key, grid) => {
                let icon = new VButton(name).style_icon_small();
                let label = new VLabel('0').align_left();
                label.view.style.fill = 'white';
                label.view.style.fontSize *= 0.5;
                label.update();
                
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

    class VMapRegion extends VPane {
        constructor () {
            super();
        }

        generate (level) {
            this.data.generate(level);
        }
    }

    class VMapWorld extends VPane {
        constructor () {
            super();

            this.region = null;
            this.next();
        }

        next () {
            this.region = new VMapRegion();
            this.region.generate(++this.data.level);
        }
    }

    class VDialogMap extends VDialog {
        constructor (map_world) {
            super();
            this.data.width  = g.screen.width * 2 / 3;
            this.data.height = g.screen.height * 2 / 3;

            this.btn_toggle = new VButton('切换').style_primary();
            this.btn_toggle.data.x = this.data.width / 2 - this.btn_toggle.data.width / 2 - 12;
            this.btn_toggle.data.y = - this.data.height / 2 + this.btn_toggle.data.height / 2 + 12;
            this.btn_toggle.click(() => this.toggle());
            this.map_world  = map_world;
            this.map_curr   = null;

            this.toggle();
        }

        toggle () {
            let hide_time = 800;

            if (!this.map_curr) {
                this.map_curr = this.map_world;
                hide_time = 0;
            }

            this.map_curr.hide(() => {
                this.removeChildren();

                if (Object.is(this.map_curr, this.map_world)) this.map_curr = this.map_world.region;
                else this.map_curr = this.map_world;
                this.map_curr.data.width     = this.data.width;
                this.map_curr.data.height    = this.data.height;

                this.addChild(this.map_curr);
                this.addChild(this.btn_toggle);
                this.map_curr.show(800);
            }, hide_time);
        }
    }

    module.exports = {
        View,
        VLabel,
        VPane,
        VButton,
        VDialog,
        VPaneResource,
        VPaneOperate,
        VHero,
        VMapRegion,
        VMapWorld,
        VDialogMap,
    };

}

