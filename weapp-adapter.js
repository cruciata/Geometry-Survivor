// 极简适配器：只提供游戏运行必须的变量，不改写 window/document 等只读属性
if (typeof wx !== 'undefined') {
  const GameGlobal = (typeof global !== 'undefined' ? global : {});
  
  // 1. 创建主画布
  const canvas = wx.createCanvas();
  
  // 2. 获取系统信息（只调用一次）
  const systemInfo = wx.getSystemInfoSync();

  // 3. 定义一个安全注入函数
  const safeInject = (key, value) => {
    try {
      // 如果属性不存在，或者虽然存在但可配置，才进行定义
      const desc = Object.getOwnPropertyDescriptor(GameGlobal, key);
      if (!desc || desc.configurable) {
        // 额外检查：如果已经有该属性且没有 setter，则跳过，防止报错
        if (desc && !desc.set && !desc.writable && desc.get) {
          console.warn(`跳过只读属性 ${key}`);
          return;
        }
        Object.defineProperty(GameGlobal, key, {
          value: value,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
    } catch (e) {
      console.warn(`注入 ${key} 失败:`, e.message);
    }
  };

  // 4. 注入游戏引擎最常用的变量
  // 注意：不要注入 'window'，因为在某些环境下它是只读的
  if (typeof GameGlobal.window === 'undefined') {
    safeInject('window', GameGlobal);
  }
  
  safeInject('canvas', canvas);
  safeInject('innerWidth', systemInfo.windowWidth);
  safeInject('innerHeight', systemInfo.windowHeight);
  safeInject('devicePixelRatio', systemInfo.pixelRatio);
  
  // 5. 模拟最基础的 document.createElement (很多引擎会用到)
  const mockDocument = {
    createElement(type) {
      if (type === 'canvas') return wx.createCanvas();
      if (type === 'image') return wx.createImage();
      return {};
    },
    body: { appendChild() {} }
  };
  safeInject('document', mockDocument);

  // 6. 统一计时器
  safeInject('requestAnimationFrame', GameGlobal.requestAnimationFrame || (fn => setTimeout(fn, 16)));
  safeInject('cancelAnimationFrame', GameGlobal.cancelAnimationFrame || (id => clearTimeout(id)));

  console.log('极简适配器加载完成，避开了只读 API 调用');
}
