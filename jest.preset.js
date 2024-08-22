const fs = require('fs');
const nxPreset = require('@nx/jest/preset').default;

const swcConfig = JSON.parse(
  fs.readFileSync(`${__dirname}/.swcrc`, 'utf-8')
);

module.exports = {
  ...nxPreset,
  displayName: process.env.NX_TASK_TARGET_PROJECT ?? undefined,
  transform: {
    "^.+\\.(t|j)sx?$": ['@swc/jest', swcConfig],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
};
