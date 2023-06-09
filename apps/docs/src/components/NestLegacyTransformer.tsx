import React, { useState } from 'react';
import { transformLegacyNestController } from './nestTransform';
import parserTypeScript from 'prettier/parser-typescript';
import prettier from 'prettier/standalone';
import CodeBlock from '@theme/CodeBlock';

export const NestLegacyTransformer = () => {
  const [inputCode, setInputCode] = useState<string>('');
  const [outputCode, setOutputCode] = useState<string>('');
  const [handlerType, setHandlerType] = useState<
    'single-handler' | 'multiple-handler'
  >('single-handler');

  const handleTransform = () => {
    const transformed = transformLegacyNestController(inputCode, handlerType);

    const pretty = prettier.format(transformed, {
      parser: 'typescript',
      singleQuote: true,
      plugins: [parserTypeScript],
    });

    setOutputCode(pretty);
  };

  const percentReduction = Math.round(
    ((inputCode.length - outputCode.length) / inputCode.length) * 100
  );

  // On cmd+enter, run the transform
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.metaKey) {
        handleTransform();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputCode, handlerType]);

  return (
    <div className="pt-4 pb-4 px-4">
      <h2 className="text--center margin-bottom--md">
        Legacy Controller Migrator 🪄
      </h2>
      <p className="text--center margin-bottom--lg">
        Our mission has always been to reduce friction, allow for incremental
        adoption and speed up your delivery. That also goes for us making large
        updates to our API/Libraries
      </p>

      <p className="text--center margin-bottom--lg">
        We perform some (mildly hacky) AST transformations against your code
        using typescript, this is our first time trying this so don't expect
        perfection and help us improve it please!
      </p>

      <label htmlFor="outputType">Output Type</label>
      <select
        className="block mb-3"
        id="outputType"
        value={handlerType}
        onChange={(e) => setHandlerType(e.target.value as any)}
      >
        <option value="single-handler">Single Handler</option>
        <option value="multiple-handler">Multiple Handler</option>
      </select>
      <label htmlFor="inputCode">Input Code</label>
      <textarea
        id="inputCode"
        className="form-control"
        placeholder="Paste your legacy NestJS controller code here..."
        value={inputCode}
        onChange={(e) => setInputCode(e.target.value)}
        style={{ width: '100%', height: '100px' }}
      />
      <div className="flex flex-row gap-1 my-4">
        <button onClick={handleTransform}>
          Transform 🦄 <kbd>cmd+enter</kbd>
        </button>
        <span className="text--secondary">
          {percentReduction > 0 && outputCode.length > 1 && (
            <span className="text--success">{percentReduction}% Smaller!</span>
          )}
        </span>
      </div>

      <label htmlFor="outputCode">Output Code</label>
      <CodeBlock className="w-full" language="ts">
        {outputCode}
      </CodeBlock>

      <sub>
        📝 All transformation is done on-device, nothing leaves your browser,
        please check out the source code if you're curious how it works.
      </sub>
    </div>
  );
};
