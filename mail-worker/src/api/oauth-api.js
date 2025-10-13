import app from '../hono/hono';
import result from '../model/result';
import oauthService from '../service/oauth-service';
import loginService from '../service/login-service';

/**
 * 获取 OAuth 授权链接
 */
app.get('/oauth/linuxdo/url', async (c) => {
	const authUrl = oauthService.getAuthUrl(c);
	return c.json(result.ok({ url: authUrl }));
});

/**
 * 处理 OAuth 回调，使用授权码登录
 */
app.post('/oauth/linuxdo/callback', async (c) => {
	const { code } = await c.req.json();

	// 获取 LinuxDo 用户信息
	const linuxdoUserInfo = await oauthService.handleOAuthLogin(c, code);

	// 使用 OAuth 用户信息登录或注册
	const token = await loginService.oauthLogin(c, linuxdoUserInfo);

	return c.json(result.ok({ token }));
});
