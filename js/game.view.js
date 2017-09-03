define(['game.data', 'pixi'], (data, PIXI) => {
    
    'use strict';
    
    let view = data;
    
    view.View = class View extends PIXI.Graphics {
        constructor () {
            super();
            
            let find_data = (proto) => {
                let name = `D${proto.constructor.name.substring(1)}`;
                if (data[name]) this.data = new data[name]();
                else {
                    if (proto.__proto__) find_data(proto.__proto__);
                    else this.data = new data.Data();
                }
            };
            find_data(this.__proto__);

            this.state  = 'default';
            
            this.data.bindo(this.position, 'x');
            this.data.bindo(this.position, 'y');
//            this.data.on_set('width',   (v) => this.width  = v);
//            this.data.on_set('height',  (v) => this.height = v);
            this.data.bindo(this, 'alpha');
            this.data.on_set('scale',   (v) => {
                this.scale.x = v;
                this.scale.y = v;
            });
            this.data.bindo(this, 'visible');
        }
        
        draw () {}

        auto_interactive (s) {
            this.interactive    = true;
            
            this.removeAllListeners('pointerover');
            this.removeAllListeners('pointerout');
            this.removeAllListeners('pointerdown');
            this.removeAllListeners('pointerup');
            this.removeAllListeners('pointerupoutside');
            
            this.on('pointerover', () => {
                if (s) this.data.tween('scale', s);
                this.state = 'over';
            });
            this.on('pointerout', () => {
                if (s) this.data.tween('scale', 1);
                this.state = 'default';
            });
            this.on('pointerdown', () => {
                if (s) this.data.tween('scale', 1);
                this.state = 'down';
            });
            this.on('pointerup', () => {
                if (s) this.data.tween('scale', s);
                this.state = 'over';
            });
            this.on('pointerupoutside', () => {
                if (s) this.data.tween('scale', 1);
                this.state = 'default'
            });
        }
    };
    
    view.VLabel = class VLabel extends view.View {
        constructor (text) {
            super();
            this.data.text = text || '';
            
            this.view = new PIXI.Text(this.text, new PIXI.TextStyle({fontWeight : '100'}));
            this.addChild(this.view);
            
            this.data.on_set('text',  (v) => {
                this.view.text = v;
                this.update();
            });
            this.data.on_set('align', () => this.update());
        }
        
        update () {
            this.view.pivot.y = this.view.height / 2 - 1;
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
    
    view.VPane = class VPane extends view.View {
        constructor () {super();}
        
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
    };
    
    view.VButton = class VButton extends view.VPane {
        constructor (text) {
            super();
            this.data.text  = text || '';
            
            this.label  = new view.VLabel();
            this.addChild(this.label);
            
            this.data.bindo(this.label.data, 'text');
            this.data.on_set('width', (v) => {
//                this.width  = v;
                this.label.update();
            });
            this.data.on_set('height', (v) => {
//                this.height = v;
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
            this.auto_interactive(1.05);
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
    };

    
    view.VPaneResource = class VPaneResource extends view.VPane {
        constructor () {
            super();
            
            let create_resource = (name, key, grid) => {
                grid.name = key;
                let icon = new view.VButton(name).style_icon_small();
                let label = new view.VLabel('0').align_left();
                label.view.style.fill = 'white';
                label.view.style.fontSize *= 0.5;
                label.update();
                
                let padding = (this.data.height - icon.data.height) / 2;
                icon.data.x = grid.position.left + padding + icon.data.width / 2;
                label.data.x = grid.position.left + padding * 1.5 + icon.data.width;
                
                this.addChild(icon);
                this.addChild(label);
            };
            
            create_resource('炭', 'C14',     this.data.grid[0]);
            create_resource('钛', 'Ti',      this.data.grid[1]);
            create_resource('钚', 'Pu238',   this.data.grid[2]);
        }
    };
    
    
    view.VPaneOperate = class VPaneOperate extends view.VPane {
        constructor () {
            super();
            
            this.addChild(new view.VButton('结束本轮').style_primary());
        }
    };
    
    
    view.VStar = class VStar extends view.VPane {
        constructor (type) {
            super();
            if (!type) throw new Error('empty star type');
            this.data.type = type;
            
            if ('home' == type) this.auto_interactive();
            else this.auto_interactive(1.2);
        }

        click (action) {
            this.interactive = true;
            this.on('pointerup', action);
            return this;
        }
        
        draw () {
            this.lineStyle(this.data.border, this.data.color_bd, this.data.alpha_draw);
            this.beginFill(this.data.color_bg, this.data.alpha_draw);
            this.drawCircle(0, 0, this.data.radius * this.data.scale_draw);
            this.endFill();
        }
    };
    
    view.VStarHome = class VStar extends view.VStar {
        constructor () {
            super('home');
            
            this.thumb = true;
            
            data.Data.on_set(this, 'thumb', (v) => {
                if (v)  this.data.tween('scale', 0.12);
                else    this.data.tween('scale', 1);
            });
            
            this.click(() => this.thumb = !this.thumb);
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
                this.drawCircle(0, 0, this.data.radius * this.data.scale_draw);
                this.endFill();
            }
        }
    }
    
    
    return view;
});