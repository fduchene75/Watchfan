// Use distinct header badges for distinct user types
'use client';
import { useUserType } from '@/hooks/useUserType';
import { Badge } from '@/components/ui/badge';

const UserTypeBadge = () => {
  const { type, label, isConnected } = useUserType();
  
  if (!isConnected) {
    return null;
  }
  
  // Badge variants per type
  const getVariant = (type) => {
    switch(type) {
      case 'admin': return 'danger';
      case 'shop': return 'warning';
      case 'collector': return 'info';
      case 'loading': return 'secondary';
      default: return 'outline';
    }
  };
  
  // Icons per type
  const icons = {
    admin: '⚙️',
    loading: '⏳',
    shop: '🏪',
    collector: '👤'
  };
  
  if (type === 'shop') {
    return (
      <Badge variant={getVariant(type)} className="bg-orange-400 text-white dark:bg-orange-600 text-lg px-4 py-2">
        <span className="text-xl">🏪</span>
        <span>Authorized shop</span>
      </Badge>
    );
  }
  
  return (
    <Badge variant={getVariant(type)} className="text-lg px-4 py-2">
      <span className="text-xl">{icons[type]}</span>
      <span>{label}</span>
    </Badge>
  );
};

export default UserTypeBadge;
