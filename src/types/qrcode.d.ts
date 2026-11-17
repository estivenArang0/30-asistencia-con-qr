declare module "qrcode" {
  interface OpcionesQr {
    margin?: number;
    width?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  }

  export function toDataURL(texto: string, opciones?: OpcionesQr): Promise<string>;
  export function toString(texto: string, opciones?: OpcionesQr): Promise<string>;
}
