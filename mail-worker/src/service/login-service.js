import BizError from '../error/biz-error';
import userService from './user-service';
import emailUtils from '../utils/email-utils';
import { isDel, settingConst, userConst } from '../const/entity-const';
import JwtUtils from '../utils/jwt-utils';
import { v4 as uuidv4 } from 'uuid';
import KvConst from '../const/kv-const';
import constant from '../const/constant';
import userContext from '../security/user-context';
import verifyUtils from '../utils/verify-utils';
import accountService from './account-service';
import settingService from './setting-service';
import saltHashUtils from '../utils/crypto-utils';
import cryptoUtils from '../utils/crypto-utils';
import turnstileService from './turnstile-service';
import roleService from './role-service';
import regKeyService from './reg-key-service';
import dayjs from 'dayjs';
import { toUtc } from '../utils/date-uitil';
import { t } from '../i18n/i18n.js';
import verifyRecordService from './verify-record-service';

const loginService = {

	async register(c, params) {

		const { email, password, token, code } = params;

		const {regKey, register, registerVerify, regVerifyCount, maxRegisterUsers, registerTrustLevel} = await settingService.query(c)


		if (register === settingConst.register.CLOSE) {
			throw new BizError(t('regDisabled'));
		}

		// 检查最大注册人数限制（-1表示无限制）
		if (maxRegisterUsers > 0) {
			const userCount = await userService.getUserCount(c);
			if (userCount >= maxRegisterUsers) {
				throw new BizError(t('maxUsersReached'), 403);
			}
		}

		if (!verifyUtils.isEmail(email)) {
			throw new BizError(t('notEmail'));
		}

		if (password.length > 30) {
			throw new BizError(t('pwdLengthLimit'));
		}

		if (emailUtils.getName(email).length > 30) {
			throw new BizError(t('emailLengthLimit'));
		}

		if (password.length < 6) {
			throw new BizError(t('pwdMinLengthLimit'));
		}

		if (!c.env.domain.includes(emailUtils.getDomain(email))) {
			throw new BizError(t('notEmailDomain'));
		}

		let type = null;
		let regKeyId = 0

		if (regKey === settingConst.regKey.OPEN) {
			const result = await this.handleOpenRegKey(c, regKey, code)
			type = result?.type
			regKeyId = result?.regKeyId
		}

		if (regKey === settingConst.regKey.OPTIONAL) {
			const result = await this.handleOpenOptional(c, regKey, code)
			type = result?.type
			regKeyId = result?.regKeyId
		}

		const accountRow = await accountService.selectByEmailIncludeDel(c, email);

		if (accountRow && accountRow.isDel === isDel.DELETE) {
			throw new BizError(t('isDelUser'));
		}

		if (accountRow) {
			throw new BizError(t('isRegAccount'));
		}


		let defType = null

		if (!type) {
			const roleRow = await roleService.selectDefaultRole(c);
			defType = roleRow.roleId
		}


		const roleRow = await roleService.selectById(c, type || defType);

		if(!roleService.hasAvailDomainPerm(roleRow.availDomain, email)) {

			if (type) {
				throw new BizError(t('noDomainPermRegKey'),403)
			}

			if (defType) {
				throw new BizError(t('noDomainPermReg'),403)
			}

		}

		let regVerifyOpen = false

		if (registerVerify === settingConst.registerVerify.OPEN) {
			regVerifyOpen = true
			await turnstileService.verify(c,token)
		}

		if (registerVerify === settingConst.registerVerify.COUNT) {
			regVerifyOpen = await verifyRecordService.isOpenRegVerify(c, regVerifyCount);
			if (regVerifyOpen) {
				await turnstileService.verify(c,token)
			}
		}

		const { salt, hash } = await saltHashUtils.hashPassword(password);

		const userId = await userService.insert(c, { email, regKeyId,password: hash, salt, type: type || defType });

		await accountService.insert(c, { userId: userId, email, name: emailUtils.getName(email) });

		await userService.updateUserInfo(c, userId, true);

		if (regKey !== settingConst.regKey.CLOSE && type) {
			await regKeyService.reduceCount(c, code, 1);
		}

		if (registerVerify === settingConst.registerVerify.COUNT && !regVerifyOpen) {
			const row = await verifyRecordService.increaseRegCount(c);
			return {regVerifyOpen: row.count >= regVerifyCount}
		}

		return {regVerifyOpen}

	},

	async registerVerify() {

	},

	async handleOpenRegKey(c, regKey, code) {

		if (!code) {
			throw new BizError(t('emptyRegKey'));
		}

		const regKeyRow = await regKeyService.selectByCode(c, code);

		if (!regKeyRow) {
			throw new BizError(t('notExistRegKey'));
		}

		if (regKeyRow.count <= 0) {
			throw new BizError(t('noRegKeyCount'));
		}

		const today = toUtc().tz('Asia/Shanghai').startOf('day')
		const expireTime = toUtc(regKeyRow.expireTime).tz('Asia/Shanghai').startOf('day');

		if (expireTime.isBefore(today)) {
			throw new BizError(t('regKeyExpire'));
		}

		return { type: regKeyRow.roleId, regKeyId: regKeyRow.regKeyId };
	},

	async handleOpenOptional(c, regKey, code) {

		if (!code) {
			return null
		}

		const regKeyRow = await regKeyService.selectByCode(c, code);

		if (!regKeyRow) {
			return null
		}

		const today = toUtc().tz('Asia/Shanghai').startOf('day')
		const expireTime = toUtc(regKeyRow.expireTime).tz('Asia/Shanghai').startOf('day');

		if (regKeyRow.count <= 0 || expireTime.isBefore(today)) {
			return null
		}

		return { type: regKeyRow.roleId, regKeyId: regKeyRow.regKeyId };
	},

	async login(c, params) {

		const { email, password } = params;

		if (!email || !password) {
			throw new BizError(t('emailAndPwdEmpty'));
		}

		const userRow = await userService.selectByEmailIncludeDel(c, email);

		if (!userRow) {
			throw new BizError(t('notExistUser'));
		}

		if(userRow.isDel === isDel.DELETE) {
			throw new BizError(t('isDelUser'));
		}

		if(userRow.status === userConst.status.BAN) {
			throw new BizError(t('isBanUser'));
		}

		if (!await cryptoUtils.verifyPassword(password, userRow.salt, userRow.password)) {
			throw new BizError(t('IncorrectPwd'));
		}

		const uuid = uuidv4();
		const jwt = await JwtUtils.generateToken(c,{ userId: userRow.userId, token: uuid });

		let authInfo = await c.env.kv.get(KvConst.AUTH_INFO + userRow.userId, { type: 'json' });

		if (authInfo) {

			if (authInfo.tokens.length > 10) {
				authInfo.tokens.shift();
			}

			authInfo.tokens.push(uuid);

		} else {

			authInfo = {
				tokens: [],
				user: userRow,
				refreshTime: dayjs().toISOString()
			};

			authInfo.tokens.push(uuid);

		}

		await userService.updateUserInfo(c, userRow.userId);

		await c.env.kv.put(KvConst.AUTH_INFO + userRow.userId, JSON.stringify(authInfo), { expirationTtl: constant.TOKEN_EXPIRE });
		return jwt;
	},

	async logout(c, userId) {
		const token =userContext.getToken(c);
		const authInfo = await c.env.kv.get(KvConst.AUTH_INFO + userId, { type: 'json' });
		const index = authInfo.tokens.findIndex(item => item === token);
		authInfo.tokens.splice(index, 1);
		await c.env.kv.put(KvConst.AUTH_INFO + userId, JSON.stringify(authInfo));
	},

	/**
	 * OAuth 登录（LinuxDo）
	 * @param {object} c - Hono context
	 * @param {object} oauthUserInfo - OAuth 用户信息
	 * @returns {Promise<string>} JWT token
	 */
	async oauthLogin(c, oauthUserInfo) {
		const { id, username, name, avatar_template, trust_level } = oauthUserInfo;

		if (!id || !username) {
			throw new BizError(t('oauthUserInfoError'));
		}

		// 使用 LinuxDo ID 作为 OAuth ID
		const oauthId = id.toString();

		// 查找是否已经存在关联的用户
		let userRow = await userService.selectByOAuthId(c, oauthId);

		// 如果用户不存在，创建新用户
		if (!userRow) {
			// 检查是否允许注册
			const { register, maxRegisterUsers, registerTrustLevel } = await settingService.query(c);

			if (register === settingConst.register.CLOSE) {
				throw new BizError(t('regDisabled'));
			}

			// 检查最大注册人数限制（-1表示无限制）
			if (maxRegisterUsers > 0) {
				const userCount = await userService.getUserCount(c);
				if (userCount >= maxRegisterUsers) {
					throw new BizError(t('maxUsersReached'), 403);
				}
			}

			// 检查信任等级限制（-1表示无限制）
			if (registerTrustLevel > 0) {
				const userTrustLevel = trust_level || 0;
				if (userTrustLevel < registerTrustLevel) {
					throw new BizError(t('trustLevelNotEnough'), 403);
				}
			}

			// 获取配置的第一个域名
			const domain = c.env.domain && c.env.domain.length > 0 ? c.env.domain[0] : null;

			if (!domain) {
				throw new BizError(t('noDomainVariable'));
			}

			// 生成邮箱地址（使用 LinuxDo 用户名 + 配置的域名）
			const email = `${username}@${domain}`;

			// 检查邮箱是否已存在
			const existingAccount = await accountService.selectByEmailIncludeDel(c, email);
			if (existingAccount) {
				throw new BizError(t('emailAlreadyExists'));
			}

			// 获取默认角色
			const roleRow = await roleService.selectDefaultRole(c);

			// 创建用户（OAuth 用户不需要密码）
			const { salt, hash } = await saltHashUtils.hashPassword(uuidv4());

			const userId = await userService.insert(c, {
				email,
				regKeyId: 0,
				password: hash,
				salt,
				type: roleRow.roleId,
				oauthId: oauthId,
				oauthUsername: username,
				oauthTrustLevel: trust_level || 0
			});			// 创建账户
			await accountService.insert(c, {
				userId: userId,
				email,
				name: name || username
			});

			await userService.updateUserInfo(c, userId, true);

			userRow = await userService.selectByOAuthId(c, oauthId);
		}		// 更新 OAuth 用户信息（刷新信任等级）
		if (trust_level !== undefined && userRow.oauthTrustLevel !== trust_level) {
			await userService.updateOAuthInfo(c, userRow.userId, {
				oauthTrustLevel: trust_level
			});
		}

		// 检查用户状态
		if (userRow.isDel === isDel.DELETE) {
			throw new BizError(t('isDelUser'));
		}

		if (userRow.status === userConst.status.BAN) {
			throw new BizError(t('isBanUser'));
		}

		// 生成 token
		const uuid = uuidv4();
		const jwt = await JwtUtils.generateToken(c, { userId: userRow.userId, token: uuid });

		let authInfo = await c.env.kv.get(KvConst.AUTH_INFO + userRow.userId, { type: 'json' });

		if (authInfo) {
			if (authInfo.tokens.length > 10) {
				authInfo.tokens.shift();
			}
			authInfo.tokens.push(uuid);
		} else {
			authInfo = {
				tokens: [],
				user: userRow,
				refreshTime: dayjs().toISOString()
			};
			authInfo.tokens.push(uuid);
		}

		await userService.updateUserInfo(c, userRow.userId);

		await c.env.kv.put(KvConst.AUTH_INFO + userRow.userId, JSON.stringify(authInfo), {
			expirationTtl: constant.TOKEN_EXPIRE
		});

		return jwt;
	}

};

export default loginService;
