export interface Component {
  type: string,
  baseType: string;
  components: Component[] | null;
  arrayChildren?: Component,
  value?: any
}
export interface IFunctionFragement {
  type: string,
  name: string
  inputs: any[],
}