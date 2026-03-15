const DEFAULT_H5_URL = 'https://cruciata.github.io/Geometry-Survivor/';

Page({
	data: {
		h5Url: DEFAULT_H5_URL
	},

	onLoad() {
		const savedUrl = wx.getStorageSync('H5_URL');
		if (savedUrl) {
			this.setData({ h5Url: savedUrl });
		}
	},

	onUrlInput(event) {
		this.setData({
			h5Url: event.detail.value || ''
		});
	},

	saveUrl() {
		const url = (this.data.h5Url || '').trim();
		if (!this.isValidUrl(url)) {
			wx.showToast({ title: '请输入有效的 HTTPS 地址', icon: 'none' });
			return;
		}

		wx.setStorageSync('H5_URL', url);
		wx.showToast({ title: '已保存', icon: 'success' });
	},

	openGame() {
		const url = (this.data.h5Url || '').trim();
		if (!this.isValidUrl(url)) {
			wx.showToast({ title: '请输入有效的 HTTPS 地址', icon: 'none' });
			return;
		}

		wx.navigateTo({
			url: `/pages/webview/index?url=${encodeURIComponent(url)}`
		});
	},

	isValidUrl(url) {
		return /^https:\/\/.+/.test(url);
	}
});
