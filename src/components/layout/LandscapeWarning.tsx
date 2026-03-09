'use client';

import { Smartphone } from 'lucide-react';

export function LandscapeWarning() {
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <div className="landscape-warning fixed inset-0 z-[9999] bg-black flex-col items-center justify-center text-center p-8 lg:hidden touch-none no-doc-scroll hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        {/* Phone Icon */}
        <div className="relative mb-12">
          <div className="relative">
            <Smartphone
              size={100}
              strokeWidth={1.5}
              className="text-white"
            />
            <div className="absolute top-[12px] left-[10px] right-[10px] bottom-[12px] bg-emerald-500/10 rounded-sm opacity-50" />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
          Xoay Ngang
        </h2>
        <p className="text-white/60 mb-10 text-base leading-relaxed">
          Ứng dụng được thiết kế cho trải nghiệm tốt nhất ở chế độ màn hình ngang.
        </p>

        {/* Button */}
        <button
          onClick={handleFullscreen}
          className="relative group font-medium tracking-wide duration-300 ease-out disabled:opacity-50 text-white bg-gradient-to-r from-green-400/80 to-teal-400/80 hover:from-green-400/90 hover:to-teal-400/90 border border-white/20 text-sm px-6 py-3 rounded-full overflow-hidden transition-transform active:scale-95"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            Mở Toàn Màn Hình
          </span>
        </button>
      </div>
    </div>
  );
}
