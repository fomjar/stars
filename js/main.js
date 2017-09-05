'use strict';

// fix load pixi.js timeout error
require.config({waitSeconds : 0});

require(['logic'], (logic) => {
    
    'use strict';
    
    logic.init();

});

