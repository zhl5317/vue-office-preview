const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Vue = require('vue');
const compiler = require('vue-template-compiler');
const babel = require('babel-core');

const source = fs.readFileSync(path.join(__dirname, '../src/VueOfficePreview.vue'), 'utf8');
const script = compiler.parseComponent(source).script.content;
const code = babel.transform(script, { babelrc: false, presets: ['es2015'] }).code;
const editors = [];
const queries = [];
let mobile = false;
let legacyMediaQuery = false;
const browser = {
  matchMedia() {
    const listeners = new Set();
    const query = {
      matches: mobile,
      listeners,
      change(matches) {
        this.matches = matches;
        listeners.forEach(listener => listener());
      },
    };
    const add = legacyMediaQuery ? 'addListener' : 'addEventListener';
    const remove = legacyMediaQuery ? 'removeListener' : 'removeEventListener';
    query[add] = (...args) => listeners.add(args[args.length - 1]);
    query[remove] = (...args) => listeners.delete(args[args.length - 1]);
    queries.push(query);
    return query;
  },
  DocsAPI: {
    DocEditor: function (id, config) {
      this.id = id;
      this.config = config;
      this.destroyed = false;
      this.destroyEditor = () => { this.destroyed = true; };
      editors.push(this);
    },
  },
};
const sandbox = { exports: {}, window: browser };
vm.runInNewContext(code, sandbox);
const component = sandbox.exports.default;
const Preview = Vue.extend(component);
const documentOption = { url: 'https://example.com/report.docx', fileType: 'DOCX' };
const latest = () => editors[editors.length - 1];
function mount(option = {}) {
  const instance = new Preview({ propsData: { option: { ...documentOption, ...option } } });
  // The SDK owns this DOM subtree. Unit tests exercise Vue state and the SDK contract.
  instance.$refs.editorHost = {};
  component.mounted.call(instance);
  return instance;
}

async function run() {
  const desktop = mount();
  assert.strictEqual(latest().config.type, 'desktop');
  assert.strictEqual(latest().config.document.fileType, 'docx');
  assert.strictEqual(latest().config.documentType, 'text');
  assert.strictEqual(latest().config.editorConfig.mode, 'view');
  assert.strictEqual(latest().config.document.permissions.edit, false);
  assert.strictEqual(latest().config.height, '100%');
  assert.strictEqual(latest().config.token, undefined);
  assert.strictEqual(desktop.previewStyle.height, null);
  const firstEditor = latest();
  queries[0].change(true);
  assert.strictEqual(firstEditor.destroyed, true);
  assert.strictEqual(latest().config.type, 'mobile');
  const count = editors.length;
  queries[0].change(true);
  assert.strictEqual(editors.length, count, 'unchanged mode must not reload the document');
  queries[0].change(false);
  assert.strictEqual(latest().config.type, 'desktop');

  mobile = true;
  const phone = mount({ height: '320px', width: '90%' });
  assert.strictEqual(latest().config.type, 'mobile');
  assert.strictEqual(phone.previewStyle.height, '320px');
  assert.strictEqual(phone.previewStyle.width, '90%');
  assert.notStrictEqual(phone.editorId, desktop.editorId);
  let ready = false;
  phone.$on('ready', () => { ready = true; });
  latest().config.events.onDocumentReady();
  assert.strictEqual(ready, true);
  latest().config.events.onError({ data: { errorDescription: 'Unable to load document' } });
  assert.strictEqual(phone.errorMessage, 'Unable to load document');
  let loading = false;
  phone.$on('loading', () => { loading = true; });
  phone.setEditor(phone.option);
  assert.strictEqual(loading, true);
  assert.strictEqual(phone.errorMessage, '');

  const forced = mount({ type: 'desktop', isEdit: true, fileType: 'XLSX', token: 'server-issued-token' });
  assert.strictEqual(latest().config.type, 'desktop');
  assert.strictEqual(latest().config.documentType, 'spreadsheet');
  assert.strictEqual(latest().config.editorConfig.mode, 'edit');
  assert.strictEqual(latest().config.token, 'server-issued-token');
  const forcedEditor = latest();
  forced.mobileQuery.change(false);
  assert.strictEqual(latest(), forcedEditor);
  forced.option = { ...documentOption, type: 'mobile', fileType: 'PPTX', model: 'view' };
  await Vue.nextTick();
  assert.strictEqual(forcedEditor.destroyed, true);
  assert.strictEqual(latest().config.type, 'mobile');
  assert.strictEqual(latest().config.documentType, 'presentation');
  const lastDocument = latest();
  forced.option.url = '';
  await Vue.nextTick();
  assert.strictEqual(lastDocument.destroyed, true);
  assert.strictEqual(forced.docEditor, null);

  const invalid = mount({ fileType: 'exe' });
  assert.match(invalid.errorMessage, /不支持/);
  assert.strictEqual(invalid.docEditor, null);
  const api = browser.DocsAPI;
  delete browser.DocsAPI;
  const unavailable = mount();
  assert.match(unavailable.errorMessage, /文档服务未加载/);
  browser.DocsAPI = api;
  unavailable.setEditor(unavailable.option);
  assert.strictEqual(unavailable.errorMessage, '');
  assert.ok(unavailable.docEditor);

  const callbacks = [];
  const sdk = { asc_registerCallback(name, callback) { callbacks.push({ name, callback, owner: this }); } };
  const register = sdk.asc_registerCallback;
  const pinned = mount({ pinToolbar: true });
  pinned.$refs.editorHost = { querySelector: () => ({ contentWindow: { Common: { EditorApi: { get: () => sdk } } } }) };
  latest().config.events.onAppReady();
  const wrapped = sdk.asc_registerCallback;
  latest().config.events.onAppReady();
  assert.strictEqual(sdk.asc_registerCallback, wrapped, 'initialization must not wrap twice');
  sdk.asc_registerCallback('onMobileScrollDelta', () => {});
  const otherCallback = () => {};
  sdk.asc_registerCallback('asc_onError', otherCallback);
  assert.deepStrictEqual(callbacks, [{ name: 'asc_onError', callback: otherCallback, owner: sdk }]);
  pinned.$destroy();
  assert.strictEqual(sdk.asc_registerCallback, register, 'restore the SDK method before destroying the frame');

  const crossOrigin = mount({ pinToolbar: true });
  let warning = null;
  crossOrigin.$on('warning', error => { warning = error; });
  crossOrigin.$refs.editorHost = { querySelector() { throw new Error('Cross-origin frame'); } };
  latest().config.events.onAppReady();
  assert.match(warning.message, /Cross-origin/);
  assert.strictEqual(crossOrigin.errorMessage, '', 'unsupported pinning must not break document loading');
  crossOrigin.$destroy();

  legacyMediaQuery = true;
  const legacy = mount();
  legacy.mobileQuery.change(false);
  assert.strictEqual(latest().config.type, 'desktop');
  [desktop, phone, forced, invalid, unavailable, legacy].forEach(instance => instance.$destroy());
  assert.ok(editors.every(editor => editor.destroyed), 'all SDK instances must be destroyed');
  assert.ok(queries.every(query => query.listeners.size === 0), 'media query listeners must be removed');
  console.log('PASS: device selection, resize, dimensions, formats, lifecycle, errors and legacy media queries');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
