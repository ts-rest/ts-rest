import { useState } from 'react';
import { transformLegacyNestController } from './nestTransform';
import React from 'react';

export const NestLegacyTransformer = () => {
  const [inputCode, setInputCode] = useState<string>('');

  const [outputCode, setOutputCode] = useState<string>('');

  const handleTransform = () => {
    setOutputCode(transformLegacyNestController(inputCode, 'single-handler'));
  };

  return (
    <div>
      <h2>Legacy Controller Migrator 🪄</h2>
      <p>
        Our mission has always been to reduce friction, allow for incremental
        adoption and speed up your delivery. That also goes for us making large
        updates to our API/Libraries
      </p>
      <ol>
        <li>
          Copy your legacy NestJS controller code into the input box below
        </li>
        <li>
          Select the output type you want to transform to (single or multiple
          handlers)
        </li>
        <li>Click transform 🤑</li>
      </ol>
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
        <select>
          <option value="single-handler">Single Handler</option>
          <option value="multiple-handlers">Multiple Handlers</option>
        </select>
      </div>
      <textarea value={outputCode} style={{ width: '100%', height: '200px' }} />
    </div>
  );
};
