<!--onlyoffice 编辑器-->
<template>
  <div id="vabOnlyOffice"></div>
</template>

<script>
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
    };
  },
  beforeDestroy() {
    if (this.docEditor !== null) {
      this.docEditor.destroyEditor();
      this.docEditor = null;
    }
  },
  watch: {
    option: {
      handler: function (n) {
        this.setEditor(n);
        this.doctype = this.getFileType(n.fileType);
      },
      deep: true,
    },
  },
  mounted() {
    if (this.option.url) {
      this.$nextTick(()=> {
        this.setEditor(this.option);
      })
    }
  },
  methods: {
    async setEditor(option) {
      if (this.docEditor !== null) {
        this.docEditor.destroyEditor();
        this.docEditor = null;
      }
      this.doctype = this.getFileType(option.fileType);
      let config = {
        document: {
          //后缀
          fileType: option.fileType,
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
          mode: option.model ? option.model : "edit",
        },
        width: option.width || "100%",
        height: option.height || "700px",
        token: "h1pMxUQvWlkyKNKyZcdZh5SAm1Sc9mwJ",
      };

      // eslint-disable-next-line no-undef,no-unused-vars
      this.docEditor = new DocsAPI.DocEditor("vabOnlyOffice", config);
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
</style>