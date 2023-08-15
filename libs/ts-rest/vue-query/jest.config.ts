/* eslint-disable */

export default {
  displayName: 'ts-rest-vue-query',
  preset: '../../../jest.preset.js',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest'],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/ts-rest/vue-query',
};
