<template>
  <div class="setting-page">
    <div class="page-header">
      <h2 class="page-title">{{$t('profile')}}</h2>
    </div>
    
    <div class="profile-card">
      <div class="card-header">
        <div class="avatar-circle">
          {{ userStore.user.name.charAt(0).toUpperCase() }}
        </div>
        <div class="user-info">
          <h3 class="user-name">{{ userStore.user.name }}</h3>
          <p class="user-email">{{ userStore.user.email }}</p>
          <el-tag size="small" class="user-role">{{ $t(userStore.user.role.name) }}</el-tag>
        </div>
      </div>

      <div class="card-divider"></div>

      <div class="info-section">
        <div class="info-item">
          <div class="info-label">
            <Icon icon="mdi:account" class="info-icon" />
            <span>{{$t('username')}}</span>
          </div>
          <div class="info-value">{{ userStore.user.name }}</div>
        </div>

        <div class="info-item">
          <div class="info-label">
            <Icon icon="mdi:email" class="info-icon" />
            <span>{{$t('emailAccount')}}</span>
          </div>
          <div class="info-value">{{ userStore.user.email }}</div>
        </div>

        <div class="info-item">
          <div class="info-label">
            <Icon icon="mdi:send" class="info-icon" />
            <span>{{$t('sendEmail')}}</span>
          </div>
          <div class="info-value send-info">
            <span v-if="sendCount" class="send-count">{{ sendCount }}</span>
            <el-tag size="small" :type="getTagType()">{{ sendType }}</el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import {computed, defineOptions} from 'vue'
import {useUserStore} from "@/store/user.js";
import {useSettingStore} from "@/store/setting.js";
import {hasPerm} from "@/perm/perm.js";
import {useI18n} from "vue-i18n";
import {Icon} from "@iconify/vue";

const {t} = useI18n();
const userStore = useUserStore();
const settingStore = useSettingStore();

defineOptions({
  name: 'setting'
})

const sendCount = computed(() => {
  if (!hasPerm('email:send')) {
    return null
  }

  if (userStore.user.role.sendType === 'ban') {
    return null
  }

  if (!userStore.user.role.sendCount) {
    return null
  }

  if (settingStore.settings.send === 1) {
    return null
  }

  return userStore.user.sendCount + '/' + userStore.user.role.sendCount
})

const sendType = computed(() => {
  if (settingStore.settings.send === 1) {
    return t('disabled')
  }

  if (!hasPerm('email:send')) {
    return t('unauthorized')
  }

  if (userStore.user.role.sendType === 'ban') {
    return t('sendBanned')
  }

  if (!userStore.user.role.sendCount) {
    return t('unlimited')
  }

  if (userStore.user.role.sendType === 'day') {
    return t('daily')
  }

  if (userStore.user.role.sendType === 'count') {
    return t('total')
  }
})

const getTagType = () => {
  if (settingStore.settings.send === 1 || !hasPerm('email:send') || userStore.user.role.sendType === 'ban') {
    return 'danger'
  }
  if (!userStore.user.role.sendCount) {
    return 'success'
  }
  return ''
}

</script>
<style scoped lang="scss">
.setting-page {
  padding: 40px;
  max-width: 500px !important;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 767px) {
    padding: 20px;
  }

  .page-header {
    margin-bottom: 30px;

    .page-title {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
    }
  }

  .profile-card {
    background: var(--el-bg-color);
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;
    width: 100%;

    &:hover {
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.12);
    }

    @media (max-width: 767px) {
      padding: 20px;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 25px;

      @media (max-width: 767px) {
        flex-direction: column;
        text-align: center;
        gap: 15px;
      }

      .avatar-circle {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: 600;
        color: #ffffff;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);

        @media (max-width: 767px) {
          width: 70px;
          height: 70px;
          font-size: 28px;
        }
      }

      .user-info {
        flex: 1;

        .user-name {
          font-size: 22px;
          font-weight: 600;
          margin: 0 0 6px 0;
          color: var(--el-text-color-primary);

          @media (max-width: 767px) {
            font-size: 20px;
          }
        }

        .user-email {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          margin: 0 0 10px 0;
          word-break: break-word;
        }

        .user-role {
          font-weight: 500;
        }
      }
    }

    .card-divider {
      height: 1px;
      background: linear-gradient(to right, transparent, var(--el-border-color), transparent);
      margin: 25px 0;
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: 20px;

      .info-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background: var(--el-fill-color-light);
        border-radius: 8px;
        transition: all 0.2s ease;

        &:hover {
          background: var(--el-fill-color);
          transform: translateX(4px);
        }

        @media (max-width: 767px) {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          padding: 14px;
        }

        .info-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
          color: var(--el-text-color-regular);
          font-size: 14px;

          .info-icon {
            font-size: 20px;
            color: var(--el-color-primary);
          }
        }

        .info-value {
          color: var(--el-text-color-primary);
          font-size: 14px;
          font-weight: 500;
          max-width: 60%;
          word-break: break-word;

          @media (max-width: 767px) {
            max-width: 100%;
            padding-left: 30px;
          }

          &.send-info {
            display: flex;
            align-items: center;
            gap: 10px;

            .send-count {
              font-weight: 600;
              color: var(--el-color-primary);
              font-size: 15px;
            }
          }
        }
      }
    }
  }
}
</style>
