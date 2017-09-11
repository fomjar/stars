{

    let g   = require('./global');
    let t   = require('./tween.js');


    /**
     * @return {Object} 对象迭代器
     */
    Object.iterator = (o) => {
        if (!o) throw new Error('illegal arguments, object must be offered');

        return {
            object  : o,
            index   : 0,
            keys    : Object.keys(o),
            [Symbol.iterator] () {
                return {next : () => {
                    let result = {done : Object.is(this.keys[this.index], undefined)};
                    if (!result.done) result.value = [this.keys[this.index], o[this.keys[this.index]]];
                    this.index++;
                    return result;
                }};
            }
        };
    };


    /**
     * 缓动动画。可以指定目标对象。
     * @param  {Object} ta 目标对象
     * @param  {String} pr 目标属性
     * @param  {Number} to 目标值
     * @param  {Number} tm 总变化时间（MS），默认160
     * @param  {Function} dn 动画完成时的回调
     */
    let tween = function tween (ta, pr, to, dn, tm = 160) {
        if (!ta || !pr || undefined == to) throw new Error('illegal arguments, require at least 3');
        
        let fn      = t.Circ.easeOut;
        let from    = ta[pr];
        let time    = 0;
        let begin   = new Date().getTime();

        if (!ta._tweener) ta._tweener = {};
        if (ta._tweener[pr]) {
            g.app.ticker.remove(ta._tweener[pr]);
            delete ta._tweener[pr];
        }
        ta._tweener[pr] = delta => {
            time = new Date().getTime() - begin;
            ta[pr] = fn(Math.min(time, tm), from, to - from, tm);
            if (time >= tm) {
                ta[pr] = to;
                g.app.ticker.remove(ta._tweener[pr]);
                delete ta._tweener[pr];
                if (dn) dn();
            }
        };
        g.app.ticker.add(ta._tweener[pr]);
    };
    /**
     * 设置属性get回调。可以指定目标对象。
     * @param  {Object}   ta 目标对象
     * @param  {String}   pr 目标属性
     * @param  {Function} fn get时的回调
     */
    let onget = function onget (ta, pr, fn) {
        if (!ta || !pr) throw new Error('illegal arguments, require at least 2');

        ta[`_${pr}`] = ta[pr];
        let fg = () => {
            let va = ta[`_${pr}`];
            if (fn) fn(pr, va);
            return va;
        };

        if (Object.defineProperty) Object.defineProperty(ta, pr, {configurable : true, get : fg});
        else if (ta.__defineGetter__) ta.__defineGetter__(pr, fg);
        else throw new Error(`define getter failed for property: ${pr}`);
    };
    /**
     * 设置属性set回调，同时也会设置get回调。可以指定目标对象。
     * @param  {Object}   ta 目标对象
     * @param  {String}   pr 目标属性
     * @param  {Function} fs set时的回调
     * @param  {Function} fg get时的回调
     */
    let onset = function onset (ta, pr, fs, fg) {
        if (!ta || !pr) throw new Error('illegal arguments, require at least 2');

        onget(ta, pr, fg);
        
        if (Object.defineProperty)
            Object.defineProperty(ta, pr, {configurable : true, set : va => {
                ta[`_${pr}`] = va;
                if (fs) fs(pr, va);
            }});
        else if (ta.__defineSetter__)
            ta.__defineSetter__(pr, va => {
                ta[`_${pr}`] = va;
                if (fs) fs(pr, va);
            });
        else throw new Error(`define setter failed for property: ${pr}`);

        ta[pr] = ta[`_${pr}`];
    };
    /**
     * 属性绑出。被绑定的属性会自动同步。
     * @param  {Object}   ta 目标对象
     * @param  {Object}   sr 来源对象
     * @param  {String}   pr 要绑定的属性
     * @param  {Function} fn 同步时的回调
     */
    let bind = function bind (ta, sr, pr, fn) {
        if (!ta || !sr || !pr) throw new Error('illegal arguments, require at least 3');
        
        onset(sr, pr, (k, v) => {
            ta[pr] = v;
            if (fn) fn(k, v);
        });
    };

    let bindall = function bindall (ta, sr, fn) {
        if (!ta || !sr) throw new Error('illegal arguments, require at least 2');

        for (let pr of Object.keys(sr)) {
            onset(sr, pr, (k, v) => {
                ta[pr] = v;
                if (fn) fn(k, v);
            });
        }
    }

    /**
     * 根据给定参数将区域等分成网格，返回各个网格中心点坐标。
     * @param  {Number} top     区域顶部
     * @param  {Number} left    区域左边
     * @param  {Number} bottom  区域底部
     * @param  {Number} right   区域右边
     * @param  {Number} col     列数
     * @param  {Number} row     行数
     * @return {Array} 网格数组
     */
    let grid = function grid (top, left, bottom, right, col, row) {
        if (!Object.is(arguments.length, 6)) throw new Error('illegal arguments, require count 6');
        if (!Number.isInteger(col)) throw new Error(`illegal arguments, col must be integer: ${col}`);
        if (!Number.isInteger(row)) throw new Error(`illegal arguments, row must be integer: ${row}`);

        let gw = (right - left) / col;
        let gh = (bottom - top) / row;
        
        let grids = [];
        for (let i = 0; i < row * col; i++) {
            grids.push({
                x : left + (i % col + 0.5) * gw,
                y : top + (Math.floor(i / col) + 0.5) * gh,
                w : gw,
                h : gh
            });
        }
        return grids;
    };

    let tool = {tween, onget, onset, bind, bindall, grid};

    /**
     * 数据模型定义
     */
    class Data {
        constructor () {
            this.x      = 0;
            this.y      = 0;
            this.width  = 1;
            this.height = 1;
            this.scale      = 1;
            this.alpha      = 1;
            this.visible    = true;
        }
        /**
         * 缓动动画。
         * @param  {String}   pr 目标属性
         * @param  {Number}   to 目标值
         * @param  {Number}   tm 总变化时间（MS），默认160
         * @param  {Function} dn 动画完成时的回调
         * @return {Data}     当前对象
         */
        tween (pr, to, dn, tm) {
            tool.tween(this, pr, to, dn, tm);
            return this;
        }
        /**
         * 设置属性get回调。
         * @param  {String}   pr 目标属性
         * @param  {Function} fn get时的回调
         * @return {Data}     当前对象
         */
        onget (pr, fn) {
            tool.onget(this, pr, fn);
            return this;
        }
        /**
         * 设置属性set回调，同时也会设置get回调。
         * @param  {String}   pr 目标属性
         * @param  {Function} fs set时的回调
         * @param  {Function} fg get时的回调
         * @return {Data}     当前对象
         */
        onset (pr, fs, fg) {
            tool.onset(this, pr, fs, fg);
            return this;
        }
        /**
         * 属性绑入。被绑定的属性会自动同步。
         * @param  {Object}   sr 来源对象
         * @param  {String}   pr 要绑定的属性
         * @param  {Function} fn 同步时的回调
         * @return {Data}     当前对象
         */
        bindi (sr, pr, fn) {
            tool.bind(this, sr, pr, fn);
            return this;
        }
        /**
         * 属性绑出。被绑定的属性会自动同步。
         * @param  {Object}   ta 目标对象
         * @param  {String}   pr 要绑定的属性
         * @param  {Function} fn 同步时的回调
         * @return {Data}     当前对象
         */
        bindo (ta, pr, fn) {
            tool.bind(ta, this, pr, fn);
            return this;
        }
        /**
         * 所有属性绑入。被绑定的属性会自动同步。
         * @param  {Object}   sr 来源对象
         * @param  {Function} fn 同步时的回调
         * @return {Data}     当前对象
         */
        bindalli (sr, fn) {
            tool.bindall(this, sr, fn);
            return this;
        }
        /**
         * 所有属性绑出。被绑定的属性会自动同步。
         * @param  {Object}   ta 目标对象
         * @param  {Function} fn 同步时的回调
         * @return {Data}     当前对象
         */
        bindallo (ta, fn) {
            tool.bindall(ta, this, fn);
            return this;
        }
    }
    class DLabel extends Data {
        constructor () {
            super();
            
            this.text   = '';
            this.align  = 'center';

            this.fontSize       = 14;
            this.fontWeight     = 100;
            this.fill           = '#333333';
        }
        align_left   () {this.align = 'left';}
        align_center () {this.align = 'center';}
        align_right  () {this.align = 'right';}
    }
    class DPane extends Data {
        constructor () {
            super();
            this.round      = 1;
            this.border     = 2;
            this.scale_draw = 1;
            this.alpha_draw = 1;
            this.alpha_draw_mask    = 0.2;
            this.color_bg   = null;
            this.color_bd   = 0xcccccc;
            this.color_mask_light   = 0xffffff;
            this.color_mask_dark    = 0x000000;
        }
    }
    class DButton extends DPane {
        constructor () {
            super();
            this.round      = 6;
            this.border     = 1;
            this.color_bg   = 0x888888;
            
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
    }
    class DDialog extends DPane {
        constructor () {
            super();
            this.width  = g.screen.width / 2;
            this.height = g.screen.height / 3;
            this.x      = g.screen.width / 2;
            this.y      = g.screen.height / 2;
            this.color_bg   = 0x888888;

            this.options    = {};
        }
        
        option (key, val) {
            if (!key) throw new Error('illegal arguments, require key');
            
            if (val) return this.options[key] = val;
            else return this.options[key];
        }
    }
    class DPaneResource extends DPane {
        constructor () {
            super();
            this.width  = 256;
            this.height = 32;
            this.x      = this.width / 2 + this.border / 2;
            this.y      = this.height / 2 + this.border / 2;
            this.color_bg   = 0x888888;

            this.grid   = tool.grid(
                - this.height / 2,
                - this.width / 2,
                this.height / 2,
                this.width / 2,
                3, 1);
        }
    }
    class DPaneOperate extends DPane {
        constructor () {
            super();
            this.width  = 256;
            this.height = 80;
            this.x      = this.width / 2 + this.border / 2;
            this.y      = g.screen.height - this.height / 2 - this.border / 2;
            this.color_bg   = 0x888888;
        }
    }
    class DHero extends Data {
        constructor () {
            super();
        }
    }
    class DMapPlace extends DPane {
        constructor () {
            super();
            this.border = 1;
            this.color_bg = 0x888888;

            this.grid = {
                r : 0,
                c : 0,
                x : 0,  // rate 0 - 1
                y : 0,  // rate 0 - 1
            };
            this.radius = 10;
        }
    }
    class DMapRegion extends DPane {
        constructor () {
            super();
            this.border = 1;

            this.level  = 0;
            this.row = 0;
            this.col = 0;
        }

        place (level) {
            this.level = level;
            this.row = 3 + Math.floor(level / 2);
            this.col = 3 + Math.ceil(level / 2);
            let extreme_random = () => {
                let v = 0;
                v = Math.random();
                return v;
            };

            let place = [];
            for (let r = 0; r < this.row; r++) {
                let row = [];
                for (let c = 0; c < this.col; c++) {
                    let p = new DMapPlace();
                    p.grid.r = r;
                    p.grid.c = c;
                    p.grid.x = extreme_random();
                    p.grid.y = extreme_random();
                    row.push(p);
                }
                place.push(row);
            }
            return place;
        }
    }
    class DMapWorld extends DPane {
        constructor () {
            super();
            this.border = 1;
            this.color_bg = 0xff0000;

            this.level  = 0;
        }
    }

    module.exports = Object.assign({
        Data,
        DLabel,
        DPane,
        DButton,
        DDialog,
        DPaneResource,
        DPaneOperate,
        DHero,
        DMapPlace,
        DMapRegion,
        DMapWorld,
    }, tool);

}

