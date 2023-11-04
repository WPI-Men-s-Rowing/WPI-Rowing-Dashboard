export default {
  "*": "prettier --ignore-unknown --write",
  "**/*.?({c,m}){js,ts}?(x)": "eslint --max-warnings 0 --fix",
  "**/*.ts?(x)": () => "tsc -p tsconfig.json --noEmit",
};
