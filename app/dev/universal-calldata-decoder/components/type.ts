export interface IFunctionFragement {
  type: string,
  name: string
  inputs: any[],
  functionFragment?: IFunctionFragement
}