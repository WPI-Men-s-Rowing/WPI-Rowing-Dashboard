module.exports = {
  "*": () => "pnpm run format --",
  "**/*.{?({c,m}){js,ts}?(x),mdx,prisma}": () => "pnpm run lint",
};
