<template>
  <div class="oauth-callback">
    <div class="loading-container">
      <Loading :size="50" />
      <p class="loading-text">{{ $t('oauthProcessing') }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { oauthCallback } from '@/request/login.js';
import { useAccountStore } from '@/store/account.js';
import { useUserStore } from '@/store/user.js';
import { useUiStore } from '@/store/ui.js';
import { loginUserInfo } from '@/request/my.js';
import { permsToRouter } from '@/perm/perm.js';
import { useI18n } from 'vue-i18n';
import Loading from '@/components/loading/index.vue';

const { t } = useI18n();
const router = useRouter();
const accountStore = useAccountStore();
const userStore = useUserStore();
const uiStore = useUiStore();

onMounted(async () => {
  try {
    // 从 URL 获取授权码
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (!code) {
      ElMessage({
        message: t('oauthCodeMissing'),
        type: 'error',
        plain: true,
      });
      await router.replace({ name: 'login' });
      return;
    }

    // 使用授权码登录
    const data = await oauthCallback(code);
    
    // 保存 token
    localStorage.setItem('token', data.token);

    // 获取用户信息
    const user = await loginUserInfo();
    accountStore.currentAccountId = user.accountId;
    userStore.user = user;

    // 添加路由
    const routers = permsToRouter(user.permKeys);
    routers.forEach(routerData => {
      router.addRoute('layout', routerData);
    });

    // 跳转到首页
    await router.replace({ name: 'layout' });
    uiStore.showNotice();

    ElMessage({
      message: t('loginSuccess'),
      type: 'success',
      plain: true,
    });
  } catch (error) {
    console.error('OAuth 登录失败:', error);
    ElMessage({
      message: t('oauthLoginFailed'),
      type: 'error',
      plain: true,
    });
    await router.replace({ name: 'login' });
  }
});
</script>

<style scoped>
.oauth-callback {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, #2980b9, #6dd5fa, #fff);
}

.loading-container {
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading-text {
  margin-top: 20px;
  font-size: 16px;
  color: #606266;
}
</style>
