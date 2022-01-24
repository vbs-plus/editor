import './less/index.less';
interface Options {
    target: HTMLElement | null;
    doc?: string;
    width?: string;
    height?: string;
    uploadFile?: (file: File) => Promise<string>;
}
export default class VEditor {
    #private;
    constructor(options: Options);
    /**
   * @description: 共有方法 - 聚焦
   * @param {*}
   * @return {*}
   */
    focus(): void;
    /**
     * @description: 共有方法 - 获取光标开始位置
     * @param {*}
     * @return {*}
     */
    getCursor(): number;
    /**
     * @description: 共有方法 - 获取选中的文字
     * @param {*}
     * @return {*}
     */
    getSelectionText(): string;
    /**
     * @description: 共有方法 - 插入&替换文字
     * @param {string} str
     * @return {*}
     */
    replaceSelection(str: string): void;
    /**
     * @description: 内部方法 - 获取光标在当前行的位置
     * @param {*}
     * @return {*}
     */
    getLineCh(): number;
    /**
     * @description: 共有方法 - 插入&替换文字
     * @param {number} anchor
     * @return {*}
     */
    setCursor(anchor: number): void;
    /**
     * @description: 共有方法 - 获取编辑器文本
     * @param {*}
     * @return {*}
     */
    getDoc(): string;
}
export {};
