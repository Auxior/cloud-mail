import BizError from '../error/biz-error';
import { t } from '../i18n/i18n.js';

const oauthService = {
	// LinuxDo OAuth 配置
	AUTH_URL: 'https://connect.linux.do/oauth2/authorize',
	TOKEN_URL: 'https://connect.linux.do/oauth2/token',
	USER_INFO_URL: 'https://connect.linux.do/api/user',

	/**
	 * 生成授权链接
	 * @param {object} c - Hono context
	 * @returns {string} 授权链接
	 */
	getAuthUrl(c) {
		const clientId = c.env.LINUXDO_CLIENT_ID;
		const redirectUri = c.env.LINUXDO_REDIRECT_URI;

		if (!clientId || !redirectUri) {
			throw new BizError(t('oauthConfigError'));
		}

		const params = new URLSearchParams({
			client_id: clientId,
			redirect_uri: redirectUri,
			response_type: 'code',
			scope: 'user'
		});

		return `${this.AUTH_URL}?${params.toString()}`;
	},

	/**
	 * 使用授权码获取访问令牌
	 * @param {object} c - Hono context
	 * @param {string} code - 授权码
	 * @returns {Promise<object>} Token 数据
	 */
	async getAccessToken(c, code) {
		const clientId = c.env.LINUXDO_CLIENT_ID;
		const clientSecret = c.env.LINUXDO_CLIENT_SECRET;
		const redirectUri = c.env.LINUXDO_REDIRECT_URI;

		if (!clientId || !clientSecret || !redirectUri) {
			throw new BizError(t('oauthConfigError'));
		}

		try {
			const response = await fetch(this.TOKEN_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					client_id: clientId,
					client_secret: clientSecret,
					code: code,
					redirect_uri: redirectUri,
					grant_type: 'authorization_code'
				})
			});

			if (!response.ok) {
				const errorData = await response.text();
				console.error('获取访问令牌失败:', errorData);
				throw new BizError(t('getAccessTokenFailed'));
			}

			return await response.json();
		} catch (error) {
			console.error('获取访问令牌异常:', error);
			throw new BizError(t('getAccessTokenFailed'));
		}
	},

	/**
	 * 使用访问令牌获取用户信息
	 * @param {string} accessToken - 访问令牌
	 * @returns {Promise<object>} 用户信息
	 */
	async getUserInfo(accessToken) {
		try {
			const response = await fetch(this.USER_INFO_URL, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`
				}
			});

			if (!response.ok) {
				const errorData = await response.text();
				console.error('获取用户信息失败:', errorData);
				throw new BizError(t('getUserInfoFailed'));
			}

			return await response.json();
		} catch (error) {
			console.error('获取用户信息异常:', error);
			throw new BizError(t('getUserInfoFailed'));
		}
	},

	/**
	 * 完整的 OAuth 登录流程
	 * @param {object} c - Hono context
	 * @param {string} code - 授权码
	 * @returns {Promise<object>} 用户信息
	 */
	async handleOAuthLogin(c, code) {
		if (!code) {
			throw new BizError(t('authCodeEmpty'));
		}

		// 1. 使用授权码获取访问令牌
		const tokenData = await this.getAccessToken(c, code);

		if (!tokenData.access_token) {
			throw new BizError(t('getAccessTokenFailed'));
		}

		// 2. 使用访问令牌获取用户信息
		const userInfo = await this.getUserInfo(tokenData.access_token);

		return userInfo;
	}
};

export default oauthService;
