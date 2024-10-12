export interface Component {
  name: string;
  type: string,
  baseType: string;
  components: Component[] | null;
  values: any[]
}