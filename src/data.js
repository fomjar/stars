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
    let tween = function tween (ta, pr, to, tm, dn) {
        if (3 > arguments.length) throw new Error('illegal arguments count, at least 3');
        
        if (Object.is(typeof tm, 'function')) {
            dn = tm;
            tm = undefined;
        }
        if (!tm) tm = 160;
        
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
            ta[pr] = fn(time, from, to - from, tm);
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
    let on_get = function on_get (ta, pr, fn) {
        if (2 > arguments.length) throw new Error('illegal arguments count, at least 2');

        ta[`_${pr}`] = ta[pr];
        if (!fn) fn = () => ta[`_${pr}`];

        if (Object.defineProperty) Object.defineProperty(ta, pr, {configurable : true, get : fn});
        else if (ta.__defineGetter__) ta.__defineGetter__(pr, fn);
        else throw new Error(`define getter failed for property: ${pr}`);
    };
    /**
     * 设置属性set回调，同时也会设置get回调。可以指定目标对象。
     * @param  {Object}   ta 目标对象
     * @param  {String}   pr 目标属性
     * @param  {Function} fs set时的回调
     * @param  {Function} fg get时的回调
     */
    let on_set = function on_set (ta, pr, fs, fg) {
        if (2 > arguments.length) throw new Error('illegal arguments count, at least 2');

        on_get(ta, pr, fg);
        
        if (Object.defineProperty)
            Object.defineProperty(ta, pr, {configurable : true, set : v => {
                ta[`_${pr}`] = v;
                if (fs) fs(v);
            }});
        else if (ta.__defineSetter__)
            ta.__defineSetter__(pr, v => {
                ta[`_${pr}`] = v;
                if (fs) fs(v);
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
        if (2 > arguments.length) throw new Error('illegal arguments count, at least 2');
        
        if (Object.is(typeof pr, 'function')) {
            fn = pr;
            pr = undefined;
        }
        if (pr) {
            on_set(sr, pr, v => {
                ta[pr] = v;
                if (fn) fn(pr, v);
            });
        } else {
            for (let [pr, va] of Object.iterator(sr)) {
                on_set(sr, pr, v => {
                    ta[pr] = v
                    if (fn) fn(pr, v);
                });
            }
        }
    };

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
        if (!Object.is(arguments.length, 6)) throw new Error('illegal arguments count, must be 6');
        if (!Object.is(Number.parseInt(col), col))  throw new Error(`illegal arguments col, must be integer: ${col}`);
        if (!Object.is(Number.parseInt(row), row))  throw new Error(`illegal arguments row, must be integer: ${row}`);

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

    let tool = {tween, on_get, on_set, bind, grid};

    /**
     * 数据模型定义
     */
    class Data {
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
        /**
         * 缓动动画。
         * @param  {String}   pr 目标属性
         * @param  {Number}   to 目标值
         * @param  {Number}   tm 总变化时间（MS），默认160
         * @param  {Function} dn 动画完成时的回调
         * @return {Data}     当前对象
         */
        tween (pr, to, tm, dn) {
            tool.tween(this, pr, to, tm, dn);
            return this;
        }
        /**
         * 设置属性get回调。
         * @param  {String}   pr 目标属性
         * @param  {Function} fn get时的回调
         * @return {Data}     当前对象
         */
        on_get (pr, fn) {
            tool.on_get(this, pr, fn);
            return this;
        }
        /**
         * 设置属性set回调，同时也会设置get回调。
         * @param  {String}   pr 目标属性
         * @param  {Function} fs set时的回调
         * @param  {Function} fg get时的回调
         * @return {Data}     当前对象
         */
        on_set (pr, fs, fg) {
            tool.on_set(this, pr, fs, fg);
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
    }
    class DLabel extends Data {
        constructor () {
            super();
            
            this.text   = '';
            this.align  = 'center';
        }
        align_left   () {this.align = 'left';}
        align_center () {this.align = 'center';}
        align_right  () {this.align = 'right';}
    }
    class DPane extends Data {
        constructor () {
            super();
            this.alpha_draw = 0.8;
            this.round  = 6;
            this.border = 4;
            this.color_bg   = 0x999999;
            this.color_bd   = 0xcccccc;
        }
    }
    class DButton extends DPane {
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
    }
    class DDialog extends DPane {
        constructor () {
            super();
            this.width  = g.screen.width / 2;
            this.height = g.screen.height / 3;
            this.x      = g.screen.width / 2;
            this.y      = g.screen.height / 2;
            this.options    = {};
        }
        
        option (key, val) {
            if (!key) throw new Error('empty key for option');
            
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
        }
    }
    class DStar extends DPane {
        constructor () {
            super();
            this.alpha_draw = 1;
            this.border = 0;
            
            this.radius = 1;
            this.level  = 1;
            this.type   = '';
            
            this.on_set('radius', v => {
                this.width  = v * 2;
                this.height = v * 2;
            });
            this.on_set('level', v => {
                let screen = g.screen;
                this.radius = screen.height / 5 + v * screen.height / 80;
                if (Object.is(this.type, 'home')) this.radius *= 1.2;
            });
            this.on_set('type', v => this.style_type());
        }
        
        style_type () {
            switch (this.type) {
                case 'home':
                    this.color_bg   = 0xcccc99;
                    this.color_bd   = 0x999999;
                    break;
            }
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
        DStar,
    }, tool);

}

