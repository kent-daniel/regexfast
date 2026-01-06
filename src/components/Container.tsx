import React from "react";

export const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="max-w-[1600px] mx-auto min-h-screen flex flex-col">
      {children}
    </div>
  );
};
