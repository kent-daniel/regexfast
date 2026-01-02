import React from "react";

const Background = () => {
  return (
    <div className="fixed left-0 top-0 -z-10 h-full w-full">
      <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_120%)]"></div>
      <div
        className="absolute 
      bottom-0 left-0 -z-10 
      right-0 top-0
      bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_2px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_2px)] 
      bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
      ></div>
    </div>
  );
};

export default Background;
