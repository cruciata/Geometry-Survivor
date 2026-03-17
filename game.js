// 1. 引入适配器
require('./weapp-adapter.js');

// 2. 引入游戏主逻辑 (编译后的文件)
// 注意：你需要先运行 npm run build，然后将 dist 中的文件拷贝过来，或者修改此路径
console.log('微信小游戏环境适配完成');

// 微信小游戏环境下，React 的 DOM 渲染会失效
// 我们需要确保 App.tsx 中的 Canvas 能够直接绑定到全局的 canvas 对象上
require('./dist/assets/index.js'); 
