declare type Arg = Array<{
    type: string;
    title: string;
    innerHTML: string;
    children?: Array<{
        type: string;
        title: string;
        innerHTML: string;
        field?: string;
    }>;
}>;
declare const _default: Arg;
export default _default;
