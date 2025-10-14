<template>
  <div class="oauth-callback">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
    
    <!-- 加载容器 -->
    <div class="loading-container">
      <div class="icon-wrapper">
        <Icon icon="mdi:email-sync-outline" width="80" height="80" color="#4A90E2"/>
      </div>
      <Loading :size="60" />
      <h2 class="loading-title">{{ $t('oauthProcessing') || 'Processing Authentication' }}</h2>
      <p class="loading-description">Please wait while we verify your credentials...</p>
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
import { Icon } from '@iconify/vue';
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
  background: linear-gradient(135deg, #F8FAFC 0%, #E8F2FC 50%, #F1F5F9 100%);
  position: relative;
  overflow: hidden;
}

.background-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.08), rgba(91, 163, 245, 0.12));
  animation: float 20s ease-in-out infinite;
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -80px;
  left: -80px;
  animation-delay: 5s;
}

.circle-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 10%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-30px) scale(1.05);
  }
}

.loading-container {
  text-align: center;
  background: rgba(255, 255, 255, 0.98);
  padding: 60px 50px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  z-index: 10;
  min-width: 400px;
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.icon-wrapper {
  margin-bottom: 25px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

.loading-title {
  margin-top: 25px;
  margin-bottom: 12px;
  font-size: 22px;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: -0.3px;
}

.loading-description {
  margin-top: 8px;
  font-size: 15px;
  color: #64748B;
  font-weight: 400;
  line-height: 1.5;
}
</style>
