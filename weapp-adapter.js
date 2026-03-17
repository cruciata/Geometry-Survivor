// 这是一个简化的适配器，用于在微信小游戏环境中模拟浏览器基础 API
if (typeof wx !== 'undefined') {
  const canvas = wx.createCanvas();
  const window = {
    innerWidth: wx.getSystemInfoSync().windowWidth,
    innerHeight: wx.getSystemInfoSync().windowHeight,
    devicePixelRatio: wx.getSystemInfoSync().pixelRatio,
    requestAnimationFrame: canvas.requestAnimationFrame.bind(canvas),
    cancelAnimationFrame: canvas.cancelAnimationFrame.bind(canvas),
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  const document = {
    createElement: (type) => {
      if (type === 'canvas') return wx.createCanvas();
      if (type === 'image') return wx.createImage();
      return {};
    },
    body: {
      appendChild: () => {},
    },
  };

  global.window = window;
  global.document = document;
  global.canvas = canvas;
  global.Image = wx.createImage;
  global.location = { href: '' };
  global.navigator = { userAgent: 'wechat' };
}
