const fs = require('fs');

const redirectsFile = fs.readFileSync('apps/docs/redirects');

// write redirects file to dist/apps/docs
fs.writeFileSync('dist/apps/docs/redirects', redirectsFile);

console.log(
  'docs-redirects.ts > Docs redirects file created in docs dist output'
);
