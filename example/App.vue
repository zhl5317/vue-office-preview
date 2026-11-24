<template>
  <main class="preview-demo" :class="{ 'preview-demo--focused': focused }">
    <header v-show="!focused" class="reader-header">
      <div class="reader-brand">
        <span class="reader-brand__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <path d="M14 3v6h6M8 13h8M8 17h5" />
          </svg>
        </span>
        <div>
          <h1>文档预览</h1>
          <p>Word 文档<span aria-hidden="true"> · </span>只读模式</p>
        </div>
      </div>
      <details ref="settings" class="reader-settings" @keydown.esc.prevent="closeSettings">
        <summary aria-label="阅读设置" title="阅读设置">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
            <path d="M4 7h9m4 0h3M4 17h3m4 0h9" />
            <circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" />
          </svg>
        </summary>
        <div class="reader-settings__panel">
          <div class="reader-settings__heading">
            <h2>阅读设置</h2>
            <button type="button" class="reader-icon-button" aria-label="关闭设置" @click="closeSettings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
            </button>
          </div>
          <label for="display-mode">显示模式</label>
          <div class="reader-settings__select">
            <select id="display-mode" v-model="option.type" @change="closeSettings">
              <option value="auto">自动适配设备</option>
              <option value="mobile">移动端视图</option>
              <option value="desktop">桌面端视图</option>
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
          </div>
          <p>自动适配当前屏幕，切换视图会重新加载文档。</p>
        </div>
      </details>
    </header>

    <section class="reader-document" aria-label="文档预览" :aria-busy="status === 'loading'">
      <VueOfficePreview
        :option="option"
        @loading="status = 'loading'"
        @ready="status = 'ready'"
        @error="status = 'error'"
      />
    </section>

    <footer class="reader-footer">
      <div class="reader-status" :class="'reader-status--' + status" role="status">
        <span class="reader-status__dot" aria-hidden="true"></span>
        <span>{{ statusText }}</span>
      </div>
      <p v-if="status === 'ready'" class="reader-footer__hint">双指缩放 · 上下滑动</p>
      <button type="button" class="reader-focus" :aria-pressed="focused" @click="toggleFocus">
        <svg v-if="!focused" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5" />
        </svg>
        {{ focused ? '退出专注' : '专注阅读' }}
      </button>
    </footer>
  </main>
</template>

<script>
import VueOfficePreview from '../src/VueOfficePreview.vue';

export default {
  name: 'App',
  components: { VueOfficePreview },
  data() {
    return {
      focused: false,
      status: 'loading',
      option: {
        url: 'https://qccdata.qichacha.com/CaseSupervisePunish/1b9e6adebab3dbe695d62433a0c1d1fa.DOC',
        title: '行政处罚信息公示表.DOC',
        fileType: 'DOC',
        key: '1b9e6adebab3dbe695d62433a0c1d1fa.DOC',
        lang: 'zh-CN',
        type: 'auto',
        height: '100%',
        isEdit: false,
        pinToolbar: true,
      },
    };
  },
  computed: {
    statusText() {
      return { loading: '正在加载文档', ready: '已就绪', error: '加载未完成' }[this.status];
    },
  },
  methods: {
    closeSettings() {
      this.$refs.settings.open = false;
      this.$refs.settings.querySelector('summary').focus();
    },
    toggleFocus() {
      this.$refs.settings.open = false;
      this.focused = !this.focused;
    },
  },
};
</script>

<style>
html,
body {
  margin: 0;
}

body {
  font-family: 'Avenir Next', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #f2f5f4;
  -webkit-text-size-adjust: 100%;
}

.preview-demo {
  --reader-ink: #203c36;
  --reader-muted: #63756f;
  --reader-accent: #226b58;
  --reader-accent-soft: #e7f0ec;
  --reader-border: #dce5e0;
  --reader-surface: #fff;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100vh;
  height: 100dvh;
  padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px)
    env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
  color: var(--reader-ink);
}

.reader-header {
  position: relative;
  z-index: 2;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
}

.reader-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.reader-brand__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 42px;
  border: 1px solid var(--reader-border);
  border-radius: 13px;
  background: var(--reader-surface);
  color: var(--reader-accent);
}

.reader-brand__icon svg { width: 24px; height: 24px; }

.reader-brand h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: .03em;
}

.reader-brand p {
  margin: 2px 0 0;
  color: var(--reader-muted);
  font-size: 12px;
  line-height: 1.5;
}

.reader-settings summary,
.reader-icon-button {
  display: grid;
  place-items: center;
  box-sizing: border-box;
  width: 44px;
  height: 44px;
  padding: 10px;
  border: 1px solid var(--reader-border);
  border-radius: 50%;
  color: var(--reader-ink);
  background: var(--reader-surface);
  cursor: pointer;
  list-style: none;
  -webkit-tap-highlight-color: transparent;
}

.reader-settings summary::-webkit-details-marker { display: none; }
.reader-settings summary svg,
.reader-icon-button svg { width: 22px; height: 22px; }
.reader-settings[open] summary { background: var(--reader-accent-soft); border-color: #a5c4b7; }

.reader-settings__panel {
  position: absolute;
  top: calc(100% - 4px);
  right: 16px;
  width: 300px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 100px);
  max-height: calc(100dvh - 100px);
  overflow: auto;
  box-sizing: border-box;
  padding: 18px;
  border: 1px solid var(--reader-border);
  border-radius: 20px;
  background: var(--reader-surface);
  box-shadow: 0 16px 48px #203c3624, 0 2px 8px #203c360a;
}

.reader-settings__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: -6px -6px 12px 0;
}

.reader-settings h2 { margin: 0; font-size: 17px; font-weight: 600; }
.reader-icon-button { border: 0; background: transparent; }
.reader-settings label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; }
.reader-settings__select { position: relative; }

.reader-settings select {
  appearance: none;
  -webkit-appearance: none;
  box-sizing: border-box;
  width: 100%;
  min-height: 48px;
  padding: 10px 40px 10px 14px;
  border: 1px solid var(--reader-border);
  border-radius: 12px;
  color: var(--reader-ink);
  background: #f5f8f6;
  font: inherit;
  font-size: 16px;
  cursor: pointer;
}

.reader-settings__select svg {
  position: absolute;
  top: 14px;
  right: 12px;
  width: 20px;
  height: 20px;
  pointer-events: none;
}

.reader-settings__panel p { margin: 12px 0 0; font-size: 12px; line-height: 1.7; color: var(--reader-muted); }

.reader-document {
  flex: 1;
  min-height: 0;
  min-width: 0;
  margin: 0 12px;
  overflow: hidden;
  border: 1px solid var(--reader-border);
  border-radius: 16px;
  background: var(--reader-surface);
  box-shadow: 0 2px 6px #203c3605;
}

.reader-footer {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 50px;
  padding: 0 16px;
}

.reader-status { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--reader-muted); }
.reader-status__dot { width: 6px; height: 6px; border-radius: 50%; background: #b07824; }
.reader-status--ready .reader-status__dot { background: var(--reader-accent); }
.reader-status--error .reader-status__dot { background: #b74336; }
.reader-footer__hint { display: none; margin: 0; color: var(--reader-muted); font-size: 12px; }

.reader-focus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--reader-accent);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.reader-focus svg { width: 16px; height: 16px; }
.reader-focus[aria-pressed='true'] { background: var(--reader-accent-soft); }
.reader-focus:active, .reader-icon-button:active, .reader-settings summary:active { background: var(--reader-accent-soft); }
.preview-demo :is(button, select, summary):focus-visible { outline: 2px solid var(--reader-accent); outline-offset: 3px; }
.preview-demo--focused .reader-document { margin: 0; border: 0; border-radius: 0; }

@media (hover: hover) {
  .reader-focus:hover, .reader-icon-button:hover, .reader-settings summary:hover { background: var(--reader-accent-soft); }
}

@media (min-width: 400px) {
  .reader-footer__hint { display: block; }
}

@media (min-width: 768px) {
  .reader-header { padding: 18px 28px; }
  .reader-document { margin: 0 24px; border-radius: 20px; }
  .reader-footer { padding: 0 28px; min-height: 58px; }
  .reader-settings__panel { right: 24px; }
}

@media (max-height: 480px) and (orientation: landscape) {
  .reader-header { padding-top: 6px; padding-bottom: 6px; }
  .reader-brand__icon { width: 36px; height: 40px; border-radius: 10px; }
  .reader-footer { min-height: 44px; }
}
</style>
