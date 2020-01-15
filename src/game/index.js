import { GAME_TICK, MOUSE_MOVE } from '../constants/actionTypes';
import {
  getCameraOffset,
  getCameraRotation,
  getCameraZoom,
  getMouseX,
  getMouseY,
} from '../selectors/cameraSelectors';
import { getWorld, getWorldSize } from '../selectors/worldSelectors';
import { loadAssets } from '../utils/assetUtils';
import * as configUtils from '../utils/configUtils';
import { getTileCoords } from '../utils/worldUtils';

let _assets, _ctx, _store, _config, _canvasWidth, _canvasHeight, _canvas;

export default function(config, store) {
  _config = config;
  _store = store;
  loadAssets(config.assets).then(assets => {
    _assets = assets;
    _ctx = setUpCanvas();
    setUpControls();
    gameLoop();
  });
}

function setUpCanvas() {
  _canvasWidth = _config.view.canvasWidth;
  _canvasHeight = _config.view.canvasHeight;

  _canvas = document.getElementById('game-canvas');
  return _canvas.getContext('2d');
}

function setUpControls() {
  const keyMap = configUtils.getKeyMapFromConfig(_config.keyMapping);
  const keyHandler = e => {
    const action = keyMap[e.keyCode];
    if (action) {
      _store.dispatch({
        type: action,
        isPressed: e.type === 'keydown',
      });
    }
  };

  _canvas.requestPointerLock =
    _canvas.requestPointerLock || _canvas.mozRequestPointerLock;
  document.exitPointerLock =
    document.exitPointerLock || document.mozExitPointerLock;
  _canvas.onclick = () => _canvas.requestPointerLock();

  const onMouseMove = e => {
    const { movementX: x, movementY: y } = e;
    _store.dispatch({ type: MOUSE_MOVE, x, y });
  };

  document.addEventListener(
    'pointerlockchange',
    () => {
      if (document.pointerLockElement === _canvas) {
        document.addEventListener('mousemove', onMouseMove, false);
      } else {
        document.removeEventListener('mousemove', onMouseMove, false);
      }
    },
    false
  );

  document.addEventListener('keyup', keyHandler, false);
  document.addEventListener('keydown', keyHandler, false);
}

function gameLoop() {
  if (true) {
    requestAnimationFrame(() => gameLoop());
  }
  const state = _store.getState();
  draw(state);
  _store.dispatch({ type: GAME_TICK });
}

var tileWidth, tileHeight;

function draw(state) {
  const world = getWorld(state);
  const [worldWidth, worldHeight] = getWorldSize(state);
  const zoom = getCameraZoom(state);
  const mouseX = getMouseX(state);
  const mouseY = getMouseY(state);

  const rotation = getCameraRotation(state);
  _ctx.clearRect(0, 0, _canvasWidth, _canvasHeight);
  tileWidth = zoom;
  tileHeight = zoom / 2;
  _ctx.save();
  const [xOffset, yOffset] = getCameraOffset(state);
  _ctx.translate(_canvasWidth / 2 + xOffset, _canvasHeight / 2 + yOffset);

  for (let x = 0; x < (rotation % 2 ? worldHeight : worldWidth); x++) {
    for (let y = 0; y < (rotation % 2 ? worldWidth : worldHeight); y++) {
      drawTile(
        x,
        y,
        world.getIn(getTileCoords(x, y, worldWidth, worldHeight, rotation))
      );
    }
  }

  _ctx.restore();

  if (document.pointerLockElement === _canvas) {
    _ctx.drawImage(_assets.images.ui.cursor, mouseX, mouseY, 28, 33);
  }
}

function drawTile(x, y, tile) {
  _ctx.save();
  _ctx.translate(((x - y) * tileWidth) / 2, ((x + y) * tileHeight) / 2);

  const img = _assets.images.blocks[tile];

  if (img) {
    const renderedHeight = (img.height / img.width) * 2;
    _ctx.drawImage(
      img,
      -tileWidth / 2,
      -tileHeight * (renderedHeight - 1),
      tileWidth,
      tileHeight * renderedHeight
    );
  } else {
    _ctx.beginPath();
    _ctx.moveTo(0, 0);
    _ctx.lineTo(tileWidth / 2, tileHeight / 2);
    _ctx.lineTo(0, tileHeight);
    _ctx.lineTo(-tileWidth / 2, tileHeight / 2);
    _ctx.closePath();
    _ctx.fillStyle = 'red';
    _ctx.fill();
  }

  _ctx.restore();
}
