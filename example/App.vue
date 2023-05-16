<template>
  <div style="width: 100%; display: block">
    <VueOfficePreview  :option='option' />
  </div>
</template>

<script>
import VueOfficePreview  from '../src/VueOfficePreview.vue'
export default {
  name: "App",
  data() {
    return {
      option: {
          url: '',
          isEdit: '',
          key:'',
          fileType: '',
          title: '',
          lang: '',
          isPrint: '',
          user: { id:null,name:''}
        }
    }
  },
  components: {
    VueOfficePreview
  },
  mounted(){
        this.option.url = 'https://qccdata.qichacha.com/CaseSupervisePunish/1b9e6adebab3dbe695d62433a0c1d1fa.DOC'
        this.option.title = '1b9e6adebab3dbe695d62433a0c1d1fa'
        this.option.fileType = 'DOC'
        this.option.key = '1b9e6adebab3dbe695d62433a0c1d1fa.DOC'
        this.option.width = '100%'
        this.option.height = '300px'
  },
  methods: {
  },
};
</script>
