'use client';

import { usePathname } from 'next/navigation';
import { useUserType } from '@/hooks/useUserType';
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children }) => {
  const pathname = usePathname();
  const { type: userType, isConnected } = useUserType();

  // Fonction pour déterminer la couleur de fond selon le contexte
  const getBackgroundClass = () => {
    if (!isConnected) {
      return "bg-gray-200"; // Gris clair pour non connectés
    }

    if (userType === 'shop') {
      return "bg-orange-200"; // Orange pour les boutiques
    }

    if (userType === 'collector') {
      if (pathname === '/transfers') {
        return "bg-blue-200"; // Bleu pour la page des transferts
      }
      return "bg-green-200"; // Vert pour la collection (accueil)
    }

    return "bg-gray-200"; // Défaut
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