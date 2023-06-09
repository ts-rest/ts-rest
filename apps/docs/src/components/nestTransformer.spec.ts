import { assert, describe, expect, it } from 'vitest';
import { transformLegacyNestController } from './nestTransform';
import * as ts from 'typescript';
import * as fs from 'fs';
import path from 'path';
import * as prettier from 'prettier';

describe('nestTransform', () => {
  it('should transform multiple-routes test file', () => {
    const file = fs
      .readFileSync(
        path.join(__dirname, './transformerFixtures/multiple-routes/input.ts')
      )
      .toString();

    const transformed = transformLegacyNestController(file, 'multiple-handler');

    const expected = fs
      .readFileSync(
        path.join(
          __dirname,
          './transformerFixtures/multiple-routes/expected.ts'
        )
      )
      .toString();

    const formatted = prettier.format(transformed, {
      parser: 'typescript',
      singleQuote: true,
    });

    fs.writeFileSync(
      path.join(
        __dirname,
        './transformerFixtures/multiple-routes/__debug__.ts'
      ),
      formatted
    );

    expect(formatted).toStrictEqual(expected);
  });

  it('should transform single-routes test file', () => {
    const file = fs
      .readFileSync(
        path.join(__dirname, './transformerFixtures/single-routes/input.ts')
      )
      .toString();

    const transformed = transformLegacyNestController(file, 'single-handler');

    const expected = fs
      .readFileSync(
        path.join(__dirname, './transformerFixtures/single-routes/expected.ts')
      )
      .toString();

    const formatted = prettier.format(transformed, {
      parser: 'typescript',
      singleQuote: true,
    });

    fs.writeFileSync(
      path.join(__dirname, './transformerFixtures/single-routes/__debug__.ts'),
      formatted
    );

    expect(formatted).toStrictEqual(expected);
  });
});
