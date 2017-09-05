
import view from './game.view.js'

let game = view;

game._debug = false;
game.debug = d => this._debug = d;

document.game = game;

export default game
    
