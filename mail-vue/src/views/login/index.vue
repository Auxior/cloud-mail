<template>
  <div id="login-box">
    <div id="background-wrap" v-if="!settingStore.settings.background">
      <div class="x1 cloud"></div>
      <div class="x2 cloud"></div>
      <div class="x3 cloud"></div>
      <div class="x4 cloud"></div>
      <div class="x5 cloud"></div>
    </div>
    <div v-else :style="background"></div>
    <div class="form-wrapper">
      <div class="container">
        <div class="university-header">
          <div class="university-logo">
            <Icon icon="mdi:school" width="48" height="48" color="#1976d2"/>
          </div>
          <span class="form-title">Bishkek International University</span>
          <span class="university-subtitle">Email Management System</span>
        </div>
        
        <div class="oauth-login">
          <el-button class="oauth-btn primary-oauth" @click="loginWithLinuxDo" :loading="oauthLoading">
            <Icon icon="simple-icons:linux" width="22" height="22"/>
            <span style="margin-left: 10px;">Login with LinuxDo</span>
          </el-button>
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
  background: v-bind(loginOpacity);
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 450px;
  border-radius: 12px;
  border: 1px solid var(--login-border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  
  @media (max-width: 1024px) {
    padding: 30px;
    width: 384px;
  }
  @media (max-width: 767px) {
    padding: 20px 18px;
    width: calc(100% - 36px);
    margin: 0 18px;
  }

  .university-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 10px;

    .university-logo {
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .university-subtitle {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-top: 8px;
      font-weight: 500;
      text-align: center;
    }
  }

  .btn {
    height: 36px;
    width: 100%;
    border-radius: 6px;
  }

  .form-title {
    font-weight: bold;
    font-size: 20px !important;
    text-align: center;
    color: var(--el-text-color-primary);
    line-height: 1.4;
  }

  .oauth-login {
    margin-top: 10px;
    width: 100%;

    .primary-oauth {
      width: 100%;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      border: none;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
      }

      &:active {
        transform: translateY(0);
      }
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
  background: linear-gradient(to bottom, #2980b9, #6dd5fa, #fff);
  font: 100% Arial, sans-serif;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  display: grid;
  grid-template-columns: 1fr;
}


#background-wrap {
  height: 100%;
  z-index: 0;
}

@keyframes animateCloud {
  0% {
    margin-left: -500px;
  }

  100% {
    margin-left: 100%;
  }
}

.x1 {
  animation: animateCloud 30s linear infinite;
  transform: scale(0.65);
}

.x2 {
  animation: animateCloud 15s linear infinite;
  transform: scale(0.3);
}

.x3 {
  animation: animateCloud 25s linear infinite;
  transform: scale(0.5);
}

.x4 {
  animation: animateCloud 13s linear infinite;
  transform: scale(0.4);
}

.x5 {
  animation: animateCloud 20s linear infinite;
  transform: scale(0.55);
}

.cloud {
  background: linear-gradient(to bottom, #fff 5%, #f1f1f1 100%);
  border-radius: 100px;
  box-shadow: 0 8px 5px rgba(0, 0, 0, 0.1);
  height: 120px;
  width: 350px;
  position: relative;
}

.cloud:after,
.cloud:before {
  content: "";
  position: absolute;
  background: #fff;
  z-index: -1;
}

.cloud:after {
  border-radius: 100px;
  height: 100px;
  left: 50px;
  top: -50px;
  width: 100px;
}

.cloud:before {
  border-radius: 200px;
  height: 180px;
  width: 180px;
  right: 50px;
  top: -90px;
}

</style>
