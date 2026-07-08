import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="h-full w-full flex flex-col">
      <TitleBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 overflow-y-auto p-6 bg-[var(--color-background)]"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
