import React from 'react';
import { Navbar } from './Navbar';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen container mx-auto">
      <Navbar />
      <div className="grow mt-6">{children}</div>
    </div>
  );
};
