import React from 'react';

interface SkeletonProps {
  type?: 'text' | 'card' | 'avatar' | 'table-row';
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ type = 'text', className = '' }) => {
  const baseClass = 'animate-pulse bg-slate-200';
  
  const typeClasses = {
    text: 'h-4 w-3/4 rounded-md',
    card: 'h-32 w-full rounded-2xl',
    avatar: 'h-12 w-12 rounded-full',
    'table-row': 'h-12 w-full rounded-lg'
  };

  return (
    <div className={`${baseClass} ${typeClasses[type]} ${className}`}></div>
  );
};

export const SkeletonCardList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
          <div className="flex justify-between items-center">
             <Skeleton type="avatar" className="w-16 h-16 rounded-2xl" />
             <Skeleton type="text" className="w-16 h-6" />
          </div>
          <Skeleton type="text" className="w-full" />
          <Skeleton type="text" className="w-2/3" />
          <div className="pt-4 border-t border-slate-50 space-y-2">
            <Skeleton type="text" className="w-full" />
            <Skeleton type="text" className="w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
      {/* Header mock */}
      <div className="flex gap-4 border-b border-slate-100 pb-4">
         <Skeleton type="text" className="w-1/4 h-3 bg-slate-100" />
         <Skeleton type="text" className="w-1/4 h-3 bg-slate-100" />
         <Skeleton type="text" className="w-1/4 h-3 bg-slate-100" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} type="table-row" className="bg-slate-50" />
      ))}
    </div>
  );
};
