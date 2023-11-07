module.exports = {
  "*": () => "pnpm run format --",
  "**/*.{?({c,m}){js,ts}?(x)|mdx}": () => "pnpm run lint",
  "**/*.ts?(x)": () => "pnpm run typecheck",
};
