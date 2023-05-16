import VueOfficePreview from './VueOfficePreview.vue'

const install = (v) => {
  if (install.installed) return
  v.component('VueOfficePreview', VueOfficePreview)
}

export default install

export const components = {
  VueOfficePreview,
}
