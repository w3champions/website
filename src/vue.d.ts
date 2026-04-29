// Needed to be able to run tsc without erroring due to .vue files not being recognized as modules.
// tsc still doesn't type check .vue files, but at least it doesn't error out when encountering them.
// vue-tsc type checks both .ts and .vue files.

declare module "*.vue" {
  import { DefineComponent } from "vue";
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const component: DefineComponent<object, object, any>;
  export default component;
}
