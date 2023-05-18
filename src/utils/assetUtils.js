import * as ASSET_TYPES from '../constants/assetTypes';

const handlers = {
  [ASSET_TYPES.IMAGES]: loadImage,
};

export function loadAssets(assetConfig) {
  const assetPromises = [];
  Object.entries(assetConfig).forEach(([key, value]) => {
    if (handlers[key]) {
      resolveTree(value, handlers[key], assetPromises);
    }
  });
  return Promise.all(assetPromises).then(() => assetConfig);
}

function resolveTree(node, handler, promises) {
  Object.entries(node).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const assetPromise = handler(value);
      assetPromise.then(result => (node[key] = result));
      promises.push(assetPromise);
    }
    if (typeof value === 'object') {
      resolveTree(value, handler, promises);
    }
  });
}

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener(
      'load',
      function() {
        resolve(img);
      },
      false
    );
    img.addEventListener(
      'error',
      function() {
        throw new Error(`Couldn't resolve asset at path ${path}`);
      },
      false
    );
    img.src = `${process.env.PUBLIC_URL}/images/${path}`;
  });
}
