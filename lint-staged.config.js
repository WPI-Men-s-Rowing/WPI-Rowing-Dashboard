export default {
  "*": "prettier --ignore-unknown --write",
  "**/*.{?({c,m}){js,ts}?(x),mdx}": "eslint --max-warnings 0 --fix",
  "**/*.ts?(x)": () => "tsc -p tsconfig.json --noEmit",
};
