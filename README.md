# 星球物语

*公开此项目的源码，是基于相互交流相互学习的目的，请不要用于商业用途*。

欢迎感兴趣的游戏爱好者、资深游戏玩家一起参与到游戏开发中。

我的联系方式：`fomjar@gmail.com`

### 项目介绍

这是一款基于PIXI.js引擎的冒险、养成类游戏。玩家作为一个星系的领导者，带领自己的星系在浩瀚的宇宙中生存、发展、壮大。

不定期更新DEMO(代码未经过压缩，打开会有一小段时间的空白)：[http://www.fomjar.com/stars/index.html](http://www.fomjar.com/stars/index.html)

### 模块介绍

- **game.data.js**  数据模型定义，游戏中的每个对象都有对应的数据模型，定义了如：坐标、尺寸、等级、技能等数据
- **game.view.js**  视图组件定义，包括：按钮、弹框、图标、星球等。每个视图都包含了自己的数据模型
- **game.tween.js** 缓动动画函数定义，在data中使用
- **game.js**       所有定义的合并对象，存储在document对象中，便于全局访问
- **logic.js**      逻辑调用
