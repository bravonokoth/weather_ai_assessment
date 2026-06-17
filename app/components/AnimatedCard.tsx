import React from 'react';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function AnimatedCard({ children, className }: AnimatedCardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 transition-transform hover:scale-[1.01] ${className}`}
    >
      {children}
    </div>
  );
}
