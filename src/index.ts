import './less/index.less';
import { EditorView, drawSelection, highlightActiveLine, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { lineNumbers, highlightActiveLineGutter } from "@codemirror/gutter";
import { history, historyKeymap, undo, redo } from "@codemirror/history";
import { indentOnInput } from "@codemirror/language";
import { classHighlightStyle } from '@codemirror/highlight';
import { bracketMatching } from '@codemirror/matchbrackets';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets';
import { highlightSelectionMatches } from "@codemirror/search";
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { defaultKeymap } from "@codemirror/commands";
import { commentKeymap } from "@codemirror/comment";
import menus from './config/menus';

interface Options { target: HTMLElement | null; doc?: string; width?: string; height?: string; uploadFile?: (file: File) => Promise<string> };
interface ModalOptions { title: string; innerHtml: string; hasFooter?: boolean; cancel?: Function; confirm?: Function; callback?: Function; }

export default class VEditor {
  #cm?: any;
  #containerEl?: HTMLElement;
  #menuEl?: HTMLElement;
  #modalEl?: HTMLElement;
  #options: Options = {
    target: null,
    doc: '',
    width: '100%',
    height: '580px',
  };
  #modalOptions: ModalOptions = {
    title: '提示',
    innerHtml: '内容',
    hasFooter: true,
    cancel: () => { },
    confirm: () => { },
    callback: () => { },
  };

  constructor(options: Options) {
    this.#options = { ...this.#options, ...options };

    this.#createElement();
    this.#createEditor();
    this.#createMenu();
  }

  /**
   * @description: 内部方法 - 创建容器
   * @param {*}
   * @return {*}
   */
  #createElement(): void {
    if (!this.#options.target) return;

    // 创建包裹容器
    this.#containerEl = document.createElement('div');
    this.#containerEl.className = 'cm-container';
    this.#containerEl.style.width = <string>this.#options.width;
    this.#containerEl.style.height = <string>this.#options.height;

    // 创建工具栏容器
    this.#menuEl = document.createElement('div');
    this.#menuEl.className = 'cm-menu';

    // 创建模态框
    this.#modalEl = document.createElement('div');
    this.#modalEl.className = 'cm-modal';
    this.#modalEl.innerHTML = `
      <div class="cm-modal__wrapper">
        <div class="cm-modal__wrapper-head">
          <div class="cm-modal__wrapper-head--text"></div>
          <div class="cm-modal__wrapper-head--close">×</div>
        </div>
        <div class="cm-modal__wrapper-body"></div>
        <div class="cm-modal__wrapper-foot">
          <div class="cm-modal__wrapper-foot--cancle">取消</div>
          <div class="cm-modal__wrapper-foot--confirm">确定</div>
        </div>
      </div>
    `;
    const closeEl = <HTMLElement>this.#modalEl?.querySelector('.cm-modal__wrapper-head--close');
    const cancleEl = <HTMLElement>this.#modalEl?.querySelector('.cm-modal__wrapper-foot--cancle');
    const confirmEl = <HTMLElement>this.#modalEl?.querySelector('.cm-modal__wrapper-foot--confirm');
    const onClick = (callback?: Function) => {
      callback && callback();
      this.#modalEl?.classList.remove('active');
      if (!this.#containerEl?.classList.contains('fullscreen')) {
        document.body.classList.remove('lock-scroll');
      }
    }
    closeEl.addEventListener('click', () => onClick(this.#modalOptions.cancel));
    cancleEl.addEventListener('click', () => onClick(this.#modalOptions.cancel))
    confirmEl.addEventListener('click', () => onClick(this.#modalOptions.confirm))

    // 追加至指定位置
    this.#containerEl.appendChild(this.#modalEl);
    this.#containerEl.appendChild(this.#menuEl);
    this.#options.target.appendChild(this.#containerEl);
  }

  /**
   * @description: 内部方法 - 创建编辑器
   * @param {*}
   * @return {*}
   */
  #createEditor(): void {
    this.#cm = new EditorView({
      state: EditorState.create({
        doc: this.#options.doc,
        extensions: [
          // 行号
          lineNumbers(),
          // 高亮当前行号
          highlightActiveLineGutter(),
          // 撤销回退历史
          history(),
          // 高亮选择
          drawSelection(),
          // 重新缩进
          indentOnInput(),
          // 自定义类名样式
          classHighlightStyle,
          // 匹配括号
          bracketMatching(),
          // 自动闭合括号
          closeBrackets(),
          // 当前行高亮
          highlightActiveLine(),
          // 高亮匹配
          highlightSelectionMatches(),
          // 高亮 markdown 语法
          markdown({
            base: markdownLanguage,
            codeLanguages: languages
          }),
          // 按键映射
          keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            ...commentKeymap,
            ...closeBracketsKeymap,
          ]),
          // 超出换行
          EditorView.lineWrapping,
        ]
      }),
      parent: this.#containerEl,
    });
  }

  /**
   * @description: 内部方法 - 创建工具栏
   * @param {*}
   * @return {*}
   */
  #createMenu(): void {
    menus.forEach(item => {
      // 生成每项容器
      const menuItemEl = document.createElement('div');
      menuItemEl.className = 'cm-menu-item';
      menuItemEl.title = item.title;
      menuItemEl.innerHTML = item.innerHTML;
      // 生成下拉菜单
      const menuItemDropdown = document.createElement('div');
      menuItemDropdown.className = 'cm-menu-item-dropdown';
      // 将带有子元素的元素放入到页面中
      item.children && menuItemEl.appendChild(menuItemDropdown);
      item.children && item.children.forEach(subItem => {
        const subItemEl = document.createElement('div');
        subItemEl.className = 'cm-menu-item-dropdown-content';
        subItemEl.title = subItem.title;
        subItemEl.innerHTML = subItem.innerHTML;
        subItemEl.addEventListener('click', () => {
          switch (subItem.type) {
            case 'italic':
              this.#onItalic();
              break;
            case 'bold':
              this.#onBold();
              break;
            case 'line-through':
              this.#onLineThrough();
              break;
            case 'marker':
              this.#onInlineMarker();
              break;
            case 'split-line':
              this.#onSplitLine();
              break;
            case 'block-quotations':
              this.#onBlockQuotations();
              break;
            case 'ordered-list':
              this.#onOrderedList();
              break;
            case 'unordered-list':
              this.#onUnorderedList();
              break;
            case 'title':
              this.#onTitle(subItem);
              break;
            case 'clean':
              this.#onClean();
              break;
            case 'download':
              this.#onDownload();
              break;
            case 'time':
              this.#onTime();
              break;
            case 'indent':
              this.#onIndent();
              break;
            case 'link':
              this.#onLink();
              break;
            case 'picture':
              this.#onPicture();
              break;
            case 'upload':
              this.#onUpload();
              break;
            case 'table':
              this.#onTable();
              break;
          }
        })
        menuItemEl.querySelector('.cm-menu-item-dropdown')?.appendChild(subItemEl);
      })
      // 监听每项点击事件
      menuItemEl.addEventListener('click', e => {
        e.stopPropagation();
        if (item.children) {
          const menuItemEls = this.#menuEl?.querySelectorAll('.cm-menu-item') || [];
          for (let i = 0; i < menuItemEls.length; i++) {
            if (menuItemEls[i] !== menuItemEl) menuItemEls[i].classList.remove('expanded');
          }
          menuItemEl.classList.toggle('expanded');
        } else {
          switch (item.type) {
            case 'undo':
              this.#onUndo();
              break;
            case 'redo':
              this.#onRedo();
              break;
            case 'full-screen':
              this.#onFullScreen(menuItemEl);
              break;
          }
        }
      })
      document.addEventListener('click', () => menuItemEl.classList.remove('expanded'));
      this.#menuEl?.appendChild(menuItemEl);
    })
  }

  /**
   * @description: 内部方法 - 打开弹窗
   * @param {ModalOptions} modalOptions
   * @return {*}
   */
  #openModal(modalOptions: ModalOptions): void {
    const defaultOptions = {
      title: '提示',
      innerHtml: '内容',
      hasFooter: true,
      cancel: () => { },
      confirm: () => { },
      callback: () => { },
    };
    this.#modalOptions = { ...defaultOptions, ...modalOptions };
    const { title, innerHtml, hasFooter, callback } = this.#modalOptions;
    const titleEl = <HTMLElement>this.#modalEl?.querySelector('.cm-modal__wrapper-head--text');
    const bodyEl = <HTMLElement>this.#modalEl?.querySelector('.cm-modal__wrapper-body');
    const footerEl = <HTMLElement>this.#modalEl?.querySelector('.cm-modal__wrapper-foot');
    titleEl.innerHTML = title;
    bodyEl.innerHTML = innerHtml;
    footerEl.style.display = hasFooter ? '' : 'none';
    this.#modalEl?.classList.add('active');
    document.body.classList.add('lock-scroll');
    callback && callback();
  }

  /**
   * @description: 内部方法 - 撤销
   * @param {*}
   * @return {*}
   */
  #onUndo(): void {
    undo(this.#cm);
    this.focus();
  }

  /**
   * @description: 内部方法 - 恢复
   * @param {*}
   * @return {*}
   */
  #onRedo(): void {
    redo(this.#cm);
    this.focus();
  }

  /**
   * @description: 内部方法 - 倾斜文本
   * @param {*}
   * @return {*}
   */
  #onItalic(): void {
    const cursor = this.getCursor();
    const selectionText = this.getSelectionText();
    this.replaceSelection(` *${selectionText || '倾斜'}* `);
    if (selectionText === '') this.setCursor(cursor + 4);
    this.focus();
  }

  /**
   * @description: 内部方法 - 倾斜文本
   * @param {*}
   * @return {*}
   */
  #onBold(): void {
    const cursor = this.getCursor();
    const selectionText = this.getSelectionText();
    this.replaceSelection(` **${selectionText || '加粗'}** `);
    if (selectionText === '') this.setCursor(cursor + 5);
    this.focus();
  }

  /**
   * @description: 内部方法 - 删除线
   * @param {*}
   * @return {*}
   */
  #onLineThrough(): void {
    const cursor = this.getCursor();
    const selectionText = this.getSelectionText();
    this.replaceSelection(` ~~${selectionText || '删除'}~~ `);
    if (selectionText === '') this.setCursor(cursor + 5);
    this.focus();
  }

  /**
   * @description: 内部方法 - 行内标记
   * @param {*}
   * @return {*}
   */
  #onInlineMarker(): void {
    const cursor = this.getCursor();
    const selectionText = this.getSelectionText();
    this.replaceSelection(` \`${selectionText || '标记'}\` `);
    if (selectionText === '') this.setCursor(cursor + 4);
    this.focus();
  }

  /**
   * @description: 内部方法 - 分割线
   * @param {*}
   * @return {*}
   */
  #onSplitLine(): void {
    this.replaceSelection(`${this.getLineCh() ? '\n' : ''}\n------------\n\n`);
    this.focus();
  }

  /**
   * @description: 内部方法 - 区块引用
   * @param {*}
   * @return {*}
   */
  #onBlockQuotations(): void {
    const selection = this.getSelectionText();
    if (selection === '') {
      this.replaceSelection(`${this.getLineCh() ? '\n' : ''}> 引用`);
    } else {
      const selectionText = selection.split('\n');
      for (let i = 0, len = selectionText.length; i < len; i++) {
        selectionText[i] = selectionText[i] === '' ? '' : '> ' + selectionText[i];
      }
      const str = (this.getLineCh() ? '\n' : '') + selectionText.join('\n');
      this.replaceSelection(str);
    }
    this.focus();
  }

  /**
   * @description: 内部方法 - 有序列表
   * @param {*}
   * @return {*}
   */
  #onOrderedList(): void {
    const selection = this.getSelectionText();
    if (selection === '') {
      const str = (this.getLineCh() ? '\n\n' : '') + '1. 有序列表';
      this.replaceSelection(str);
    } else {
      const selectionText = selection.split('\n');
      for (let i = 0, len = selectionText.length; i < len; i++) {
        selectionText[i] = selectionText[i] === '' ? '' : i + 1 + '. ' + selectionText[i];
      }
      const str = (this.getLineCh() ? '\n' : '') + selectionText.join('\n');
      this.replaceSelection(str);
    }
    this.focus();
  }

  /**
   * @description: 内部方法 - 无序列表
   * @param {*}
   * @return {*}
   */
  #onUnorderedList(): void {
    const selection = this.getSelectionText();
    if (selection === '') {
      const str = (this.getLineCh() ? '\n' : '') + '- 无序列表';
      this.replaceSelection(str);
    } else {
      const selectionText = selection.split('\n');
      for (let i = 0, len = selectionText.length; i < len; i++) {
        selectionText[i] = selectionText[i] === '' ? '' : '- ' + selectionText[i];
      }
      const str = (this.getLineCh() ? '\n' : '') + selectionText.join('\n');
      this.replaceSelection(str);
    }
    this.focus();
  }

  /**
   * @description: 内部方法 - 大标题
   * @param {*}
   * @return {*}
   */
  #onTitle({ title, field }: { type: string; title: string; innerHTML: string; field?: string }): void {
    if (this.getLineCh()) this.replaceSelection('\n\n' + field + title);
    else this.replaceSelection(field + title);
    this.focus();
  }

  /**
   * @description: 内部方法 - 全屏/取消全屏
   * @param {*}
   * @return {*}
   */
  #onFullScreen(menuItemEl: HTMLElement): void {
    menuItemEl.classList.toggle('active');
    document.body.classList.toggle('lock-scroll');
    this.#containerEl?.classList.toggle('fullscreen');
  }

  /**
   * @description: 内部方法 - 清屏
   * @param {*}
   * @return {*}
   */
  #onClean(): void {
    this.#cm.dispatch({ changes: { from: 0, to: this.#cm.state.doc.length, insert: '' } });
    this.focus();
  }

  /**
   * @description: 内部方法 - 下载文档
   * @param {*}
   * @return {*}
   */
  #onDownload(): void {
    const aTag = document.createElement('a');
    const blob = new Blob([this.#cm.state.doc.toString()]);
    aTag.download = '新文章.md';
    aTag.href = URL.createObjectURL(blob);
    aTag.click();
    URL.revokeObjectURL(aTag.href);
  }

  /**
   * @description: 内部方法 - 当前时间
   * @param {*}
   * @return {*}
   */
  #onTime(): void {
    const time = new Date();
    const _Year = time.getFullYear();
    const _Month = String(time.getMonth() + 1).padStart(2, '0');
    const _Date = String(time.getDate()).padStart(2, '0');
    const _Hours = String(time.getHours()).padStart(2, '0');
    const _Minutes = String(time.getMinutes()).padStart(2, '0');
    const _Seconds = String(time.getSeconds()).padStart(2, '0');
    const _Day = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][time.getDay()];
    const text = `${this.getLineCh() ? '\n' : ''}${_Year}/${_Month}/${_Date} ${_Hours}:${_Minutes}:${_Seconds} ${_Day}\n`;
    this.replaceSelection(text);
    this.focus();
  }

  /**
   * @description: 内部方法 - 缩进
   * @param {*}
   * @return {*}
   */
  #onIndent(): void {
    this.replaceSelection('　');
    this.focus();
  }

  /**
   * @description: 内部方法 - 超链接
   * @param {*}
   * @return {*}
   */
  #onLink(): void {
    this.#openModal({
      title: '超链接',
      innerHtml: `
        <div class="fitem">
          <div class="fitem_label">链接标题</div>
          <div class="fitem_input" contenteditable name="title" placeholder="请输入链接标题"></div>
        </div>
        <div class="fitem">
          <div class="fitem_label">链接地址</div>
          <div class="fitem_input" contenteditable name="url" placeholder="请输入链接地址"></div>
        </div>
      `,
      confirm: () => {
        const title = this.#modalEl?.querySelector('.fitem_input[name="title"]')?.innerHTML || 'Test';
        const url = this.#modalEl?.querySelector('.fitem_input[name="url"]')?.innerHTML || 'http://';
        this.replaceSelection(` [${title}](${url}) `);
        this.focus();
      }
    })
  }

  /**
   * @description: 内部方法 - 图片
   * @param {*}
   * @return {*}
   */
  #onPicture(): void {
    this.#openModal({
      title: '本地/网络图片',
      innerHtml: `
        <div class="fitem">
          <div class="fitem_label">图片名称</div>
          <div class="fitem_input" contenteditable name="title" placeholder="请输入图片名称"></div>
        </div>
        <div class="fitem">
          <div class="fitem_label">图片地址</div>
          <div class="fitem_input" contenteditable name="url" placeholder="请输入图片地址"></div>
        </div>
      `,
      confirm: () => {
        const title = this.#modalEl?.querySelector('.fitem_input[name="title"]')?.innerHTML || 'Test';
        const url = this.#modalEl?.querySelector('.fitem_input[name="url"]')?.innerHTML || 'http://';
        this.replaceSelection(` ![${title}](${url}) `);
        this.focus();
      }
    })
  }

  /**
   * @description: 内部方法 - 上传图片
   * @param {*}
   * @return {*}
   */
  #onUpload(): void {
    this.#openModal({
      title: '上传附件',
      innerHtml: `
        <div class="upload_dragger">
          <div class="upload_dragger__icon"></div>
          <div class="upload_dragger__text">将文件拖拽至此处或点击上传</div>
          <input class="upload_dragger__input" type="file" multiple />
        </div>
        <div class="upload_list"></div>
      `,
      callback: () => {
        if (!this.#options.uploadFile) return;
        const uploadInputEl = <HTMLInputElement>this.#modalEl?.querySelector('.upload_dragger__input');
        const uploadListEl = <HTMLLIElement>this.#modalEl?.querySelector('.upload_list');
        uploadInputEl?.addEventListener('change', async () => {
          const files = uploadInputEl.files ? Array.from(uploadInputEl.files) : [];
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const { type, name } = file;
            if (!type) continue;
            const url = await (this.#options.uploadFile && this.#options.uploadFile(file));
            if (!url) continue;
            const itemEl = document.createElement('div');
            itemEl.setAttribute('data-url', url);
            itemEl.setAttribute('data-name', name);
            itemEl.setAttribute('data-image', type.includes('image') ? '1' : '0');
            itemEl.className = 'upload_list__item';
            itemEl.innerHTML = `
              <div class="upload_list__item--icon"></div>
              <div class="upload_list__item--text">${name}</div>
            `;
            uploadListEl.appendChild(itemEl);
          }
        });
      },
      confirm: () => {
        let str = '';
        const uploadItemEls = this.#modalEl?.querySelectorAll('.upload_list__item');
        if (!uploadItemEls) return;
        for (let i = 0; i < uploadItemEls.length; i++) {
          const uploadItemEl = uploadItemEls[i];
          const isImage = uploadItemEl.getAttribute('data-image') === '1' ? true : false;
          const url = uploadItemEl.getAttribute('data-url');
          const name = uploadItemEl.getAttribute('data-name');
          str += `${isImage ? '!' : ''}[${name}](${url})\n`;
        }
        this.replaceSelection(this.getLineCh() ? '\n' : '' + str);
        this.focus();
      }
    })
  }

  /**
   * @description: 内部方法 - 表格
   * @param {*}
   * @return {*}
   */
  #onTable(): void {
    this.#openModal({
      title: '表格',
      innerHtml: `
        <div class="fitem">
          <div class="fitem_label">表格行</div>
          <div class="fitem_input" contenteditable name="row" style="width: 50px; flex: none; margin-right: 10px;">3</div>
        </div>
        <div class="fitem">
          <div class="fitem_label">表格列</div>
          <div class="fitem_input" contenteditable name="column" style="width: 50px; flex: none;">3</div>
        </div>
      `,
      confirm: () => {
        let row: number | string | undefined = this.#modalEl?.querySelector('.fitem_input[name="row"]')?.innerHTML;
        let column: number | string | undefined = this.#modalEl?.querySelector('.fitem_input[name="column"]')?.innerHTML;
        if (!row || !Number(row)) row = 3;
        if (!column || !Number(column)) column = 3;
        let rowStr = '';
        let rangeStr = '';
        let columnlStr = '';
        for (let i = 0; i < column; i++) {
          rowStr += '| 表头 ';
          rangeStr += '| :--: ';
        }
        for (let i = 0; i < row; i++) {
          for (let j = 0; j < column; j++) columnlStr += '| 表格 ';
          columnlStr += '|\n';
        }
        const htmlStr = `${rowStr}|\n${rangeStr}|\n${columnlStr}\n`;
        if (this.getLineCh()) this.replaceSelection('\n\n' + htmlStr);
        else this.replaceSelection(htmlStr);
        this.focus();
      }
    })
  }

  /**
 * @description: 共有方法 - 聚焦
 * @param {*}
 * @return {*}
 */
  public focus(): void {
    this.#cm.focus();
  }

  /**
   * @description: 共有方法 - 获取光标开始位置
   * @param {*}
   * @return {*}
   */
  public getCursor(): number {
    return this.#cm.state.selection.main.head;
  }

  /**
   * @description: 共有方法 - 获取选中的文字
   * @param {*}
   * @return {*}
   */
  public getSelectionText(): string {
    return this.#cm.state.sliceDoc(this.#cm.state.selection.main.from, this.#cm.state.selection.main.to);
  }

  /**
   * @description: 共有方法 - 插入&替换文字
   * @param {string} str
   * @return {*}
   */
  public replaceSelection(str: string): void {
    this.#cm.dispatch(this.#cm.state.replaceSelection(str));
  }

  /**
   * @description: 内部方法 - 获取光标在当前行的位置
   * @param {*}
   * @return {*}
   */
  public getLineCh(): number {
    const head = this.#cm.state.selection.main.head;
    const line = this.#cm.state.doc.lineAt(head);
    return head - line.from;
  }

  /**
   * @description: 共有方法 - 插入&替换文字
   * @param {number} anchor
   * @return {*}
   */
  public setCursor(anchor: number): void {
    this.#cm.dispatch({ selection: { anchor } });
  }

  /**
   * @description: 共有方法 - 获取编辑器文本
   * @param {*}
   * @return {*}
   */
  public getDoc(): string {
    return this.#cm.state.doc.toString();
  }
}