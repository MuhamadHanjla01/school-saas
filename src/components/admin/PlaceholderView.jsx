import React from 'react';

export default function PlaceholderView({ dark, title }) {
  return (
    <div className="p-5 md:p-6 space-y-5 w-full max-w-[1600px] mx-auto animate-fadeIn flex flex-col h-[calc(100vh-64px)]">
      
      {/* Header Banner */}
      <section className="shrink-0 mb-2">
        <div className="relative rounded-[20px] overflow-hidden bg-gradient-to-r from-surface-variant via-surface-variant to-outline-variant/30 shadow-sm p-6 text-on-surface min-h-[140px] flex flex-col justify-center transition-all duration-300">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl mix-blend-overlay pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-primary !text-[20px]">construction</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-on-surface">{title}</h2>
              </div>
              <div className="flex items-center gap-2 w-fit px-3 py-1.5 rounded-full border border-outline-variant/50 bg-surface/50 backdrop-blur-md">
                <span className="material-symbols-outlined text-[14px] text-primary">info</span>
                <p className="text-[11px] font-medium text-on-surface-variant">This module is currently under active development.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wireframe Grid */}
      <section className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 opacity-70">
        
        {/* Placeholder Card 1 */}
        <div className={`col-span-1 md:col-span-2 p-6 rounded-[20px] shadow-sm border flex flex-col justify-between ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
          <div>
            <div className={`w-32 h-4 rounded-full mb-6 ${dark ? 'bg-surface-variant' : 'bg-surface-variant/40'}`}></div>
            <div className="space-y-3">
              <div className={`w-full h-8 rounded-lg ${dark ? 'bg-surface-variant/50' : 'bg-surface-variant/20'}`}></div>
              <div className={`w-full h-8 rounded-lg ${dark ? 'bg-surface-variant/50' : 'bg-surface-variant/20'}`}></div>
              <div className={`w-3/4 h-8 rounded-lg ${dark ? 'bg-surface-variant/50' : 'bg-surface-variant/20'}`}></div>
            </div>
          </div>
          <div className={`w-24 h-8 rounded-full mt-8 ${dark ? 'bg-primary/20' : 'bg-primary/10'}`}></div>
        </div>

        {/* Placeholder Card 2 */}
        <div className={`col-span-1 p-6 rounded-[20px] shadow-sm border flex flex-col items-center justify-center text-center ${dark ? 'bg-[#2f3133] border-outline-variant/10' : 'bg-white border-surface-variant/50'}`}>
          <div className={`w-24 h-24 rounded-full mb-6 border-4 border-dashed ${dark ? 'border-surface-variant' : 'border-surface-variant/60'}`}></div>
          <div className={`w-20 h-3 rounded-full mb-2 ${dark ? 'bg-surface-variant' : 'bg-surface-variant/40'}`}></div>
          <div className={`w-32 h-2 rounded-full ${dark ? 'bg-surface-variant/50' : 'bg-surface-variant/20'}`}></div>
        </div>

      </section>

    </div>
  );
}
