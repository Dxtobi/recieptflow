declare module "jsbarcode" {
  interface JsBarcodeOptions {
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
  }
  function JsBarcode(svg: SVGSVGElement | null, code: string, options?: JsBarcodeOptions): void;
  export default JsBarcode;
}
