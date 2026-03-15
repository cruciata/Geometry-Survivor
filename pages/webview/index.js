Page({
  data: {
    h5Url: ''
  },

  onLoad(options) {
    const url = options && options.url ? decodeURIComponent(options.url) : '';
    if (!url || !/^https:\/\/.+/.test(url)) {
      wx.showToast({ title: 'H5 地址无效', icon: 'none' });
      wx.navigateBack({ delta: 1 });
      return;
    }

    this.setData({ h5Url: url });
  }
});
