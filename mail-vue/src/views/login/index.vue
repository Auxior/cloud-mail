<template>
  <div id="login-box">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
      <div class="wave wave-1"></div>
      <div class="wave wave-2"></div>
    </div>
    
    <!-- 自定义背景图 -->
    <div v-if="settingStore.settings.background" class="custom-background" :style="background"></div>
    
    <!-- 登录表单容器 -->
    <div class="form-wrapper">
      <div class="container">
        <!-- 大学标识 -->
        <div class="university-header">
          <div class="university-logo">
            <Icon icon="mdi:email-outline" width="56" height="56" color="#4A90E2"/>
          </div>
          <h1 class="form-title">Bishkek International University</h1>
          <p class="university-subtitle">Email Management System</p>
        </div>
        
        <!-- 分割线 -->
        <div class="divider">
          <span class="divider-text">{{ $t('loginMethod') || 'Login Method' }}</span>
        </div>
        
        <!-- OAuth登录按钮 -->
        <div class="oauth-login">
          <el-button 
            class="oauth-btn primary-oauth" 
            @click="loginWithLinuxDo" 
            :loading="oauthLoading"
            size="large"
          >
            <Icon icon="simple-icons:linux" width="24" height="24"/>
            <span>Login with LinuxDo</span>
          </el-button>
        </div>
        
        <!-- 底部信息 -->
        <div class="footer-info">
          <p class="copyright">© 2025 Bishkek International University</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import router from "@/router";
import {computed, ref} from "vue";
import {getOAuthUrl} from "@/request/login.js";
import {useSettingStore} from "@/store/setting.js";
import {useAccountStore} from "@/store/account.js";
import {useUserStore} from "@/store/user.js";
import {useUiStore} from "@/store/ui.js";
import {Icon} from "@iconify/vue";
import {cvtR2Url} from "@/utils/convert.js";
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const accountStore = useAccountStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const settingStore = useSettingStore();
const oauthLoading = ref(false)

const loginOpacity = computed(() => {
  const opacity = settingStore.settings.loginOpacity
  return uiStore.dark ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`
})

const background = computed(() => {
  return settingStore.settings.background ? {
    'background-image': `url(${cvtR2Url(settingStore.settings.background)})`,
    'background-repeat': 'no-repeat',
    'background-size': 'cover',
    'background-position': 'center'
  } : ''
})

const loginWithLinuxDo = async () => {
  try {
    oauthLoading.value = true
    const data = await getOAuthUrl()
    // 跳转到 LinuxDo 授权页面
    window.location.href = data.url
  } catch (error) {
    ElMessage({
      message: t('oauthLoginFailed'),
      type: 'error',
      plain: true,
    })
  } finally {
    oauthLoading.value = false
  }
}

</script>


<style>
.el-select-dropdown__item {
  padding: 0 15px;
}

.no-autofill-pwd {
  .el-input__inner {
    -webkit-text-security: disc !important;
  }
}
</style>

<style lang="scss" scoped>

.form-wrapper {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: rgba(255, 255, 255, 0.98);
  padding: 50px 45px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 480px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 1024px) {
    padding: 40px 35px;
    width: 420px;
  }
  @media (max-width: 767px) {
    padding: 30px 25px;
    width: calc(100% - 36px);
    margin: 0 18px;
  }

  .university-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 35px;

    .university-logo {
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 90px;
      height: 90px;
      background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
      border-radius: 50%;
      box-shadow: 0 8px 24px rgba(74, 144, 226, 0.15);
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.05);
        box-shadow: 0 12px 32px rgba(74, 144, 226, 0.25);
      }
    }

    .university-subtitle {
      font-size: 15px;
      color: #64748B;
      margin-top: 10px;
      font-weight: 400;
      text-align: center;
      letter-spacing: 0.3px;
    }
  }

  .form-title {
    font-weight: 700;
    font-size: 26px !important;
    text-align: center;
    color: #1E293B;
    line-height: 1.3;
    margin: 0;
    letter-spacing: -0.5px;
  }
  
  .divider {
    display: flex;
    align-items: center;
    margin: 30px 0;
    
    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, transparent, #E2E8F0, transparent);
    }
    
    .divider-text {
      padding: 0 20px;
      font-size: 13px;
      color: #94A3B8;
      font-weight: 500;
      white-space: nowrap;
    }
  }

  .oauth-login {
    width: 100%;

    .primary-oauth {
      width: 100%;
      height: 54px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: linear-gradient(135deg, #4A90E2 0%, #5BA3F5 100%);
      color: #ffffff;
      border: none;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.3px;
      box-shadow: 0 8px 24px rgba(74, 144, 226, 0.25);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 32px rgba(74, 144, 226, 0.35);
        background: linear-gradient(135deg, #5BA3F5 0%, #4A90E2 100%);
      }

      &:active {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(74, 144, 226, 0.3);
      }
    }
  }
  
  .footer-info {
    margin-top: 35px;
    text-align: center;
    
    .copyright {
      font-size: 13px;
      color: #94A3B8;
      margin: 0;
      font-weight: 400;
    }
  }

  :deep(.el-input__wrapper) {
    border-radius: 6px;
    background: var(--el-bg-color);
  }

  .el-input {
    height: 38px;
    width: 100%;
    margin-bottom: 18px;

    :deep(.el-input__inner) {
      height: 36px;
    }
  }
}

#login-box {
  background: linear-gradient(135deg, #F8FAFC 0%, #E8F2FC 50%, #F1F5F9 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: relative;
}

.background-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.custom-background {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
  opacity: 0.6;
}

// 圆形装饰
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

// 波浪装饰
.wave {
  position: absolute;
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.05), rgba(91, 163, 245, 0.08));
  border-radius: 40%;
  animation: wave 15s ease-in-out infinite;
}

.wave-1 {
  bottom: -50px;
  animation-delay: 0s;
}

.wave-2 {
  bottom: -80px;
  animation-delay: 3s;
  opacity: 0.5;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-30px) scale(1.05);
  }
}

@keyframes wave {
  0%, 100% {
    transform: translateX(-50%) rotate(0deg);
  }
  50% {
    transform: translateX(-30%) rotate(5deg);
  }
}

</style>
