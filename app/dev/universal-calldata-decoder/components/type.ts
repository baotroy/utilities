export interface Component {
  type: string,
  baseType: string;
  components: Component[] | null;
  // values?: any[]
}