export type Dimensions = { width: number; height: number };
export type Unit = "px" | "in" | "cm" | "mm"
export type FileFormat = "image/jpeg" | "image/png" | "image/webp" | "original"
export type Measure = {
    px: number;
    in: number;
    cm: number;
    mm: number;
  }
 export type Aspect =  Record<string, string | number>