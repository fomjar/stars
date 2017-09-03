define(['game.view'], (view) => {
    
    'use strict';
    
    let game = view;
    
    game._debug = false;
    game.debug = (d) => this._debug = d;
    
    document.game = game;

    return game;
    
});
