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
     * @param  {Function} dn 动画完成时的回调
     * @param  {Number} tm 总变化时间（MS），默认80
     * @param  {Function} tn tween函数
     */
    let tween = function tween (ta, pr, to, dn, tm = 160, tn = t.Circ.easeOut) {
        if (!ta || !pr || undefined == to) throw new Error('illegal arguments, require at least 3');
        
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
            ta[pr] = tn(Math.min(time, tm), from, to - from, tm);
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

    let rate_random = (rate, data) => {
        if (!rate || !data) throw new Error('illegal arguments, require: rate, data');
        if (rate.length != data.length) throw new Error(`illegal arguments, rate(${rate}) and data(${data.length}) must be same count`);
        if (0 == rate.length) throw new Error('illegal arguments, empty data and rate');

        let total_rate = rate.reduce((r1, r2) => r1 + r2);
        let value = Math.random() * total_rate;
        for (let i = 0; i < rate.length; i++) {
            let value_before = (0 === i ? 0 : rate.slice(0, i).reduce((r1, r2) => r1 + r2));
            if (value_before <= value && value <= value_before + rate[i]) return data[i];
        }
        throw new Error(`error occurred when rate random: rate = [${String(rate)}], data = [${String(data)}]`);
    };

    let tool = {tween, onget, onset, bind, bindall, grid, rate_random};

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
            this.alpha      = 1;
            this.alpha_draw = 1;
            this.alpha_draw_mask    = 0;
            this.rotation   = 0;
            this.border     = 2;
            this.color_bg   = null;
            this.color_bd   = 0xcccccc;
            this.color_mask_light   = 0xffffff;
            this.color_mask_dark    = 0x000000;
        }
        /**
         * 缓动动画。
         * @param  {String}   pr 目标属性
         * @param  {Number}   to 目标值
         * @param  {Number}   tm 总变化时间（MS），默认160
         * @param  {Function} dn 动画完成时的回调
         * @return {Data}     当前对象
         */
        tween (pr, to, dn, tm, tn) {
            tool.tween(this, pr, to, dn, tm, tn);
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
            this.breakWords     = true;
            this.wordWrap       = true;
            this.wordWrapWidth  = g.screen.width;
        }
        align_left   () {this.align = 'left';}
        align_center () {this.align = 'center';}
        align_right  () {this.align = 'right';}
    }
    class DPane extends Data {
        constructor () {
            super();
            this.round = 1;
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
        
        style_large () {
            this.width      = 128;
            this.height     = 48;
        }
    }
    class DShadow extends DPane {
        constructor () {
            super();
            this.width  = g.screen.width;
            this.height = g.screen.height;
            this.x      = this.width / 2;
            this.y      = this.height / 2;
            this.border     = 0;
            this.color_bg   = 0x000000;
            this.alpha_draw = 0.01;
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
            this.height = 60;
            this.x      = this.width / 2 + this.border / 2;
            this.y      = g.screen.height - this.height / 2 - this.border / 2;
            this.color_bg   = 0x888888;
        }
    }
    class DHero extends Data {
        constructor () {
            super();
            this.color_bd   = 0xff0000;

            this.radius = 18;
        }
    }
    class DMapPlace extends DButton {
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
            this.type = [];   // entrance / exit / battle / event / trade

            let number = rate_random([6, 3, 1], [1, 2, 3]);
            for (let i = 0; i < number; i++) {
                let type = null;
                while (null === type || this.type.includes(type)) {
                    type = rate_random([5, 4, 1], ['battle', 'event', 'trade']);
                }
                this.type.push(type);
            }
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

        places (level) {
            this.level = level;
            this.row = 5 + Math.floor(level / 2);
            this.col = 5 + Math.ceil(level / 2);
            this.width      = this.col * 160;
            this.height     = this.row * 160;
            this.x          = g.screen.width / 2;
            this.y          = g.screen.height / 2;

            let places = [];
            for (let r = 0; r < this.row; r++) {
                let row = [];
                for (let c = 0; c < this.col; c++) {
                    let p = new DMapPlace();
                    p.grid.r = r;
                    p.grid.c = c;
                    p.grid.x = Math.random();
                    p.grid.y = Math.random();
                    row.push(p);
                }
                places.push(row);
            }
            let entrance = places[Number.parseInt(Math.random() * places.length)][0];
            let exit    = places[Number.parseInt(Math.random() * places.length)][places[0].length - 1];
            entrance.type.push('entrance');
            exit.type.push('exit');
            return {places, entrance, exit};
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

    class DLauncher extends Data {
        constructor () {
            super();

            this.x = g.screen.width  / 2;
            this.y = g.screen.height / 2;
        }
    }

    class DInterlude extends Data {
        constructor () {
            super();

            this.x = g.screen.width  / 2;
            this.y = g.screen.height / 2;
        }
    }

    module.exports = Object.assign({
        Data,
        DLabel,
        DPane,
        DButton,
        DShadow,
        DDialog,
        DPaneResource,
        DPaneOperate,
        DHero,
        DMapPlace,
        DMapRegion,
        DMapWorld,
        DLauncher,
        DInterlude,
    }, tool);

}

