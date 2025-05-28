import React from 'react';
// @ts-ignore
import codePreviewImage from '../../static/img/code-preview.png';
// @ts-ignore
import codePreviewVideo from '../../static/video/code-preview.mp4';

export const CodeVideo = () => {
  return (
    <div className="container mx-auto">
      <video
        src={codePreviewVideo}
        poster={codePreviewImage}
        className="w-full h-auto"
        autoPlay
        loop
        muted
        playsInline
      />
    </div>
  );
};
