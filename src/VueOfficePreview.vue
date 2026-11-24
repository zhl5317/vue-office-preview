<!--onlyoffice 编辑器-->
<template>
  <div
    class="vue-office-preview"
    :class="{ 'vue-office-preview--mobile': editorType === 'mobile' }"
    :style="previewStyle"
  >
    <div v-show="option.url && !errorMessage" ref="editorHost" class="vue-office-preview__editor">
      <div :id="editorId"></div>
    </div>
    <div v-if="errorMessage" class="vue-office-preview__message" role="alert">
      <svg class="vue-office-preview__message-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M28 7H13a3 3 0 0 0-3 3v28a3 3 0 0 0 3 3h22a3 3 0 0 0 3-3V17zM28 7v10h10M24 23v7M24 35h.01" />
      </svg>
      <h2>暂时无法打开文档</h2>
      <p>{{ errorMessage }}</p>
      <button type="button" @click="setEditor(option)">重新加载</button>
    </div>
    <div v-else-if="!option.url" class="vue-office-preview__message">
      <svg class="vue-office-preview__message-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M28 7H13a3 3 0 0 0-3 3v28a3 3 0 0 0 3 3h22a3 3 0 0 0 3-3V17zM28 7v10h10M17 25h14M17 31h9" />
      </svg>
      <h2>等待打开文档</h2>
      <p>请选择要预览的文档</p>
    </div>
  </div>
</template>

<script>
let nextEditorId = 0;

export default {
  name: "VueOfficePreview",
  props: {
    option: {
      type: Object,
      default: () => {
        return {};
      },
    },
  },
  data() {
    return {
      doctype: "",
      docEditor: null,
      editorId: `vue-office-preview-${++nextEditorId}`,
      isMobile: false,
      errorMessage: "",
    };
  },
  computed: {
    editorType() {
      if (["desktop", "mobile"].includes(this.option.type)) {
        return this.option.type;
      }
      return this.isMobile ? "mobile" : "desktop";
    },
    previewStyle() {
      return {
        width: this.option.width || "100%",
        height: this.option.height || null,
      };
    },
  },
  beforeDestroy() {
    if (this.mobileQuery) {
      if (this.mobileQuery.removeEventListener) {
        this.mobileQuery.removeEventListener("change", this.updateDevice);
      } else {
        this.mobileQuery.removeListener(this.updateDevice);
      }
    }
    this.destroyEditor();
  },
  watch: {
    option: {
      handler: function (n) {
        if (this.$refs.editorHost) this.setEditor(n);
      },
      deep: true,
    },
  },
  mounted() {
    // Coarse pointers keep phones/tablets in mobile mode in landscape too.
    this.mobileQuery = window.matchMedia("(max-width: 767px), (hover: none) and (pointer: coarse)");
    this.isMobile = this.mobileQuery.matches;
    if (this.mobileQuery.addEventListener) {
      this.mobileQuery.addEventListener("change", this.updateDevice);
    } else {
      this.mobileQuery.addListener(this.updateDevice);
    }
    this.setEditor(this.option);
  },
  methods: {
    updateDevice() {
      const previousType = this.editorType;
      this.isMobile = this.mobileQuery.matches;
      if (previousType !== this.editorType) this.setEditor(this.option);
    },
    destroyEditor() {
      if (this.restoreToolbar) {
        this.restoreToolbar();
        this.restoreToolbar = null;
      }
      if (this.docEditor !== null) {
        this.docEditor.destroyEditor();
        this.docEditor = null;
      }
    },
    pinMobileToolbar() {
      if (!this.option.pinToolbar || this.editorType !== "mobile" || this.restoreToolbar) return;
      try {
        const frame = this.$refs.editorHost.querySelector("iframe");
        const common = frame.contentWindow.Common;
        const api = common && common.EditorApi && common.EditorApi.get();
        if (!api || typeof api.asc_registerCallback !== "function") {
          throw new Error("当前文档服务不支持固定移动端工具栏。");
        }
        const register = api.asc_registerCallback;
        // ONLYOFFICE 7.3 registers this auto-hide callback after onAppReady; keep other SDK events intact.
        api.asc_registerCallback = function (name, callback) {
          if (name !== "onMobileScrollDelta") return register.call(this, name, callback);
        };
        this.restoreToolbar = () => { api.asc_registerCallback = register; };
      } catch (error) {
        // A cross-origin document service must be proxied before its toolbar can be pinned.
        this.$emit("warning", error);
      }
    },
    setEditor(option) {
      this.destroyEditor();
      this.errorMessage = "";
      if (!option.url) return;
      const fileType = (option.fileType || "").toLowerCase();
      this.doctype = this.getFileType(fileType);
      if (!this.doctype) {
        this.showError(new Error("不支持的文件类型，请检查 fileType 配置。"));
        return;
      }
      if (!window.DocsAPI || !window.DocsAPI.DocEditor) {
        this.showError(new Error("文档服务未加载，请检查 ONLYOFFICE 服务地址和网络连接。"));
        return;
      }
      let config = {
        type: this.editorType,
        title: option.title || "文档预览",
        document: {
          //后缀
          fileType,
          title: option.title || "",
          key: option.key,
          permissions: {
            edit: option.isEdit || false, //是否可以编辑: 只能查看，传false
            print: option.isPrint || false,
            download: false,
            // "fillForms": true,//是否可以填写表格，如果将mode参数设置为edit，则填写表单仅对文档编辑器可用。 默认值与edit或review参数的值一致。
            // "review": true //跟踪变化
          },
          url: option.url,
        },
        documentType: this.doctype,
        editorConfig: {
          lang: option.lang || "zh-CN", //语言设置
          //定制
          customization: {
            autosave: false, //是否自动保存
            chat: false,
            comments: false,
            help: false,
            // "hideRightMenu": false,//定义在第一次加载时是显示还是隐藏右侧菜单。 默认值为false
            //是否显示插件
            plugins: false,
          },
          user: {
            id:  1,
            name: "qcc",
          },
          mode: option.model || (option.isEdit ? "edit" : "view"),
        },
        width: "100%",
        height: "100%",
        token: option.token,
        events: {
          onAppReady: () => this.pinMobileToolbar(),
          onDocumentReady: () => this.$emit("ready"),
          onError: (event) => this.showError(event),
        },
      };

      try {
        this.$emit("loading");
        this.docEditor = new window.DocsAPI.DocEditor(this.editorId, config);
      } catch (error) {
        this.showError(error);
      }
    },
    showError(error) {
      this.errorMessage = (error.data && error.data.errorDescription) || error.message || "文档加载失败，请稍后重试。";
      this.$emit("error", error);
    },
    getFileType(fileType) {
      let docType = "";
      let fileTypesDoc = [
        "doc",
        "docm",
        "docx",
        "dot",
        "dotm",
        "dotx",
        "epub",
        "fodt",
        "htm",
        "html",
        "mht",
        "odt",
        "ott",
        "pdf",
        "rtf",
        "txt",
        "djvu",
        "xps",
      ];
      let fileTypesCsv = [
        "csv",
        "fods",
        "ods",
        "ots",
        "xls",
        "xlsm",
        "xlsx",
        "xlt",
        "xltm",
        "xltx",
      ];
      let fileTypesPPt = [
        "fodp",
        "odp",
        "otp",
        "pot",
        "potm",
        "potx",
        "pps",
        "ppsm",
        "ppsx",
        "ppt",
        "pptm",
        "pptx",
      ];
      if (fileTypesDoc.includes(fileType)) {
        docType = "text";
      }
      if (fileTypesCsv.includes(fileType)) {
        docType = "spreadsheet";
      }
      if (fileTypesPPt.includes(fileType)) {
        docType = "presentation";
      }
      return docType;
    },
  },
};
</script>

<style>
.vue-office-preview {
  position: relative;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  height: 700px;
  overflow: hidden;
  background: #f5f7f6;
}

.vue-office-preview--mobile {
  height: 100vh;
  height: 100dvh;
}

.vue-office-preview__editor {
  width: 100%;
  height: 100%;
}

.vue-office-preview__editor > iframe {
  /* ONLYOFFICE sets mobile frames to fixed; keep embedded previews in their container. */
  position: static !important;
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.vue-office-preview__message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  justify-content: safe center;
  box-sizing: border-box;
  height: 100%;
  padding: 24px;
  color: #63756f;
  font: 14px/1.7 'Avenir Next', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  text-align: center;
  overflow-wrap: anywhere;
  overflow: auto;
}

.vue-office-preview__message-icon {
  flex: none;
  box-sizing: content-box;
  width: 42px;
  height: 42px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #dce5e0;
  border-radius: 22px;
  background: #fff;
  color: #226b58;
}

.vue-office-preview__message h2 {
  margin: 0;
  color: #203c36;
  font-size: 18px;
  font-weight: 600;
}

.vue-office-preview__message p {
  max-width: 320px;
  margin: 8px 0 24px;
}

.vue-office-preview__message button {
  flex: none;
  min-height: 44px;
  padding: 10px 28px;
  border: 0;
  border-radius: 12px;
  background: #226b58;
  color: #fff;
  font: inherit;
  cursor: pointer;
}

.vue-office-preview__message button:active {
  background: #194f42;
}

.vue-office-preview__message button:focus-visible {
  outline: 2px solid #226b58;
  outline-offset: 3px;
}
</style>
