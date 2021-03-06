var TinyEmitter = require('tiny-emitter');
var inherits = require('inherits');
var ScreenNavigatorItem = require('./ScreenNavigatorItem.js');
var Transitions = require('./Transitions.js');

var ScreenNavigator = function(){
  this.items = {};

  this.currentItemId = null;
  this.previousItemId = null;

  this.currentScreen = null;
  this.previousScreen = null;

  this.transition = ScreenNavigator.defaultTransition;
  this.transitionRunning = false;
  this.transitionCancel = null;
};

inherits(ScreenNavigator, TinyEmitter);

ScreenNavigator.defaultTransition = Transitions.none;

ScreenNavigator.prototype.addItem = function(id, screen, options) {
  var item = new ScreenNavigatorItem(screen, options);

  this.items[id] = item;

  return item;
};

ScreenNavigator.prototype.getItem = function(id) {
  return this.items[id];
};

ScreenNavigator.prototype.showScreen = function(id, transition, options) {
  if (!this.getItem(id)){
    throw new Error('ScreenNavigator - the item with the id ' + id + ' doesn\'t exist');
  }

  if (this.transitionRunning){
    this.onTransitionComplete(true);
  } 

  if (this.currentScreen){
    this.previousItemId = this.currentItemId;
    this.previousScreen = this.currentScreen;
  }

  this.currentItemId = id;

  this.onScreenChange();

  this.startTransition(transition, options);
};

ScreenNavigator.prototype.clearScreen = function(transition) {
  if (!this.currentScreen){
    return;
  }

  this.previousItemId = this.currentItemId;
  this.previousScreen = this.currentScreen;

  this.currentItemId = null;

  this.onScreenChange();

  this.startTransition(transition);
};

ScreenNavigator.prototype.startTransition = function(transition, options) {
  transition = transition || this.transition;

  var currentItem = this.getItem(this.currentItemId);

  if (options) currentItem.setOptions(options);

  this.currentScreen = currentItem ? currentItem.getScreen(options) : null;

  this.transitionRunning = true;

  this.emit('transitionStart');

  this.transitionCancel = transition(this.currentScreen, this.previousScreen, this.onTransitionComplete.bind(this));
};

ScreenNavigator.prototype.onScreenChange = function() {
  this.emit('screenChange');
};

ScreenNavigator.prototype.onTransitionComplete = function(cancelTransition, silent) {
  this.transitionRunning = false;

  if (cancelTransition){
    if (this.transitionCancel) this.transitionCancel();
  }
  
  this.disposePreviousScreen();

  if (!silent){
    if (cancelTransition){
      this.emit('transitionCancel');
    }else{
      this.emit('transitionComplete');
    }
  }

  this.transitionCancel = null;
};

ScreenNavigator.prototype.dispose = function(forceDispose) {
  if (typeof forceDispose !== 'boolean') forceDispose = true;

  if (this.transitionRunning){
    this.onTransitionComplete(true, true);
  }

  this.disposeCurrentScreen();
  this.disposePreviousScreen();

  var item;

  for (var itemId in this.items){
    this.items[itemId].dispose(forceDispose);

    delete this.items[itemId];
  }

  this.transition = null;
};

ScreenNavigator.prototype.disposePreviousScreen = function() {
  if (!this.previousScreen) return;

  this.getItem(this.previousItemId).disposeScreen(this.previousScreen);

  this.previousScreen = null;
};

ScreenNavigator.prototype.disposeCurrentScreen = function() {
  if (!this.currentScreen) return;

  this.getItem(this.currentItemId).disposeScreen(this.currentScreen);

  this.currentScreen = null;
};

module.exports = ScreenNavigator;

module.exports.AScreen = require('./AScreen.js');
module.exports.ScreenNavigatorItem = ScreenNavigatorItem;
module.exports.Transitions = Transitions;

