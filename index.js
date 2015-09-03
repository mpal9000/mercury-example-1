/**
 * This file reproduces two problems related
 * to mercury, observ-array and observ-varhash.
 *
 * 1) When using `hg.array()`,
 * the click handlers on color boxes are stop working,
 * after pressing the "undo" button.
 *
 * 2) When using `hg.varhash()` and one of "B2" or "B3",
 * the reset functionality is stop working and
 * the click handlers on color boxes are stop working,
 * after pressing the "reset" button.
 */

/**
 * Module dependencies
 */

import keys from 'ramda/src/keys';
import values from 'ramda/src/values';
import times from 'ramda/src/times';
import addIndex from 'ramda/src/addIndex';
import forEach from 'ramda/src/forEach';
import map from 'ramda/src/map';
import reduce from 'ramda/src/reduce';
import hg, { h, app } from 'mercury';
import TimeTravel from 'mercury/time-travel';
import virtualize from 'vdom-virtualize';

/**
 * Test.
 */

document.addEventListener('DOMContentLoaded', () => {
  render(document.getElementById('root'));
});

/**
 * Render vtree.
 */

function render(root) {
  const state = App({ undo, redo });

  const history = TimeTravel(state);
  function undo() { return history.undo(); }
  function redo() { return history.redo(); }

  app(document.body, state, App.render, {
    initialTree: virtualize(root),
    target: root,
  });

  state.set(state());
}

/**
 * Component
 */

function App({ undo, redo }) {
  return hg.state({
    colors: Colors(),
    channels: { undo, redo },
  });
}

App.render = function render(state) {
  console.log('App :: render()');
  return h('div', [
    h('button', { 'ev-click': hg.sendClick(state.channels.undo) }, 'undo'),

    h('button', { 'ev-click': hg.sendClick(state.channels.redo) }, 'redo'),

    Colors.render(state.colors),
  ]);
}

/**
 * Component
 */

function Colors() {
  return hg.state({
    // values: hg.array(getValues()), //HG-ARRAY//
    values: hg.varhash(getValues()), //HG-VARHASH//
    channels: { reset },
  });
}

Colors.render = function render(state) {
  console.log('Colors :: render()');
  return h('div', [
    h('button', {
      'ev-click': hg.sendClick(state.channels.reset),
    }, 'reset'),

    h(
      'div',
      // map(value => Color.render(value), state.values) //HG-ARRAY//
      map(value => Color.render(value), values(state.values)) //HG-VARHASH//
    ),
  ]);
}

function getValues() {
  let values = times(Color, 10);

  // A1)
  return values;

  // A2)
  /*const toObject = addIndex(reduce)((acc, item, idx) => {
    acc[idx] = values[idx];
    return acc;
  }, {});
  values = toObject(values);
  return values;*/
}

function reset(state) {
  console.log('state before:', state());
  console.log('reseting colors...');

  // B1)
  const nextValues = getValues();
  forEach(idx => state.values.put(idx, nextValues[idx]), keys(state.values));

  // B2)
  // state.values.set(getValues());

  // B3)
  // state.set(Object.assign({}, state(), { values: getValues() }));

  console.log('state after:', state());
}

/**
 * Component
 */

function Color() {
  return hg.state({
    value: hg.value(rgb()),
    channels: { onTap },
  });
}

Color.render = function render(state) {
  console.log('Color :: render()');
  console.log('Color :: render() :: state.value:', state.value);
  return h('div', {
    style: {
      display: 'inline-block',
      width: '50px',
      height: '50px',
      background: state.value,
    },
    'ev-click': hg.sendClick(state.channels.onTap),
  });
}

function onTap(state) {
  state.value.set(rgb());
  return;
}

/**
 * Get random RGB color string.
 */

function rgb() {
  return `rgb(${times(() => randomIntFromRange(0, 255), 3).join()})`;
}

function randomIntFromRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
