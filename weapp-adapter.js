// 这是一个简化的适配器，用于在微信小游戏环境中模拟浏览器基础 API
if (typeof wx !== 'undefined') {
  const canvas = wx.createCanvas();
  const _requestAnimationFrame = (typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : (typeof canvas.requestAnimationFrame !== 'undefined' ? canvas.requestAnimationFrame : (fn => setTimeout(fn, 16))));
  const _cancelAnimationFrame = (typeof cancelAnimationFrame !== 'undefined' ? cancelAnimationFrame : (typeof canvas.cancelAnimationFrame !== 'undefined' ? canvas.cancelAnimationFrame : (id => clearTimeout(id))));

  const window = {
    innerWidth: wx.getSystemInfoSync().windowWidth,
    innerHeight: wx.getSystemInfoSync().windowHeight,
    devicePixelRatio: wx.getSystemInfoSync().pixelRatio,
    requestAnimationFrame: _requestAnimationFrame,
    cancelAnimationFrame: _cancelAnimationFrame,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    addEventListener: (type, listener) => {
      if (type === 'touchstart' || type === 'mousedown') {
        wx.onTouchStart(res => {
          const touch = res.touches[0] || res.changedTouches[0];
          listener({ clientX: touch.pageX, clientY: touch.pageY, touches: res.touches, changedTouches: res.changedTouches, preventDefault: () => {} });
        });
      }
      if (type === 'touchmove' || type === 'mousemove') {
        wx.onTouchMove(res => {
          const touch = res.touches[0] || res.changedTouches[0];
          listener({ clientX: touch.pageX, clientY: touch.pageY, touches: res.touches, changedTouches: res.changedTouches, preventDefault: () => {} });
        });
      }
      if (type === 'touchend' || type === 'mouseup' || type === 'click') {
        wx.onTouchEnd(res => {
          const touch = res.touches[0] || res.changedTouches[0];
          listener({ clientX: touch ? touch.pageX : 0, clientY: touch ? touch.pageY : 0, touches: res.touches, changedTouches: res.changedTouches, preventDefault: () => {} });
        });
      }
    },
    removeEventListener: () => {},
    performance: {
      now: () => Date.now()
    },
    screen: {
      width: wx.getSystemInfoSync().screenWidth,
      height: wx.getSystemInfoSync().screenHeight,
    }
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
