'use client';

import { usePathname } from 'next/navigation';
import { useUserType } from '@/hooks/useUserType';
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children }) => {
  const pathname = usePathname();
  const { type: userType, isConnected } = useUserType();

  // Determine background color based on user type
  const getBackgroundClass = () => {
    if (!isConnected) {
      return "bg-gray-200"; // Light gray for unconnected
    }

    if (userType === 'admin') {
      return "bg-gray-700"; // Dark gray for admin
    }

    if (userType === 'shop') {
      return "bg-orange-200"; // Orange for shops
    }

    if (userType === 'collector') {
      if (pathname === '/transfers') {
        return "bg-blue-200"; // Blue for transfers
      }
      return "bg-green-200"; // Green for main page (collectors)
    }

    return "bg-gray-200"; // Default
  };

  return (
    <div className={`min-h-screen flex flex-col ${getBackgroundClass()}`}>
      <Header />
      <main className="flex-grow p-5">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;