import { useState } from 'react';
import { transformLegacyNestController } from './nestTransform';
import React from 'react';

export const NestLegacyTransformer = () => {
  const [inputCode, setInputCode] = useState<string>('');

  const [outputCode, setOutputCode] = useState<string>('');

  const handleTransform = () => {
    setOutputCode(transformLegacyNestController(inputCode));
  };

  return (
    <div>
      <h2>Legacy Controller Migrator</h2>
      <p>
        This is likely to have issues, so please contribute, but it's a basic
        AST converter to help you transform from Legacy to the new Approach
      </p>
      <div>
        <textarea
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          style={{ width: '100%', height: '200px' }}
        />
      </div>
      <div className="flex flex-row gap-1 mb-4">
        <button onClick={handleTransform}>Transform</button>
        <button onClick={() => setInputCode('')}>Clear</button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(outputCode);
          }}
        >
          Copy output to clipboard
        </button>
      </div>
      <textarea value={outputCode} style={{ width: '100%', height: '200px' }} />
    </div>
  );
};
