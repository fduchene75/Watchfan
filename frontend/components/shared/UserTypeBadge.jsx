// Composant pour bien distinguer visuellement les types d'utilisateurs
'use client';
import { useUserType } from '@/hooks/useUserType';
import { Badge } from '@/components/ui/badge';

const UserTypeBadge = () => {
  const { type, label, isConnected } = useUserType();
  
  // Ne pas afficher la pastille si l'utilisateur n'est pas connecté
  if (!isConnected) {
    return null;
  }
  
  // Variants pour les types non-boutique
  const getVariant = (type) => {
    switch(type) {
      case 'collector': return 'secondary';
      case 'loading': return 'outline';
      default: return 'secondary';
    }
  };
  
  // Icônes pour chaque type
  const icons = {
    loading: '⏳',
    shop: '🏪',
    collector: '👤'
  };
  
  // Pastille orange spéciale pour les boutiques
  if (type === 'shop') {
    return (
      <Badge className="bg-orange-400 text-white dark:bg-orange-600 text-lg px-4 py-2">
        <span className="text-xl">🏪</span>
        <span>Boutique</span>
      </Badge>
    );
  }
  
  // Pastille standard pour les autres types
  return (
    <Badge variant={getVariant(type)} className="text-lg px-4 py-2">
      <span className="text-xl">{icons[type]}</span>
      <span>{label}</span>
    </Badge>
  );
};

export default UserTypeBadge;
