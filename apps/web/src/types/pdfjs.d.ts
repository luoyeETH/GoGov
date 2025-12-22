declare module "pdfjs-dist/legacy/build/pdf" {
  const pdfjs: any;
  export = pdfjs;
}

declare module "mammoth/mammoth.browser" {
  export const extractRawText: (options: { arrayBuffer: ArrayBuffer }) => Promise<{
    value?: string;
  }>;
}
