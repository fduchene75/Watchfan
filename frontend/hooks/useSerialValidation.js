// Hook pour valider les numéros de série avant mint (erreur du double mint)
import { useState, useEffect } from 'react';
import { useWatchfanContract } from './useWatchfanContract';

export function useSerialValidation() {
  const { useSerialHashExists } = useWatchfanContract();
  
  const [serialHash, setSerialHash] = useState(null);
  const [validationState, setValidationState] = useState({
    isChecking: false,
    exists: false,
    error: null
  });

  // Vérifier si le hash existe
  const { data: exists, isLoading: isCheckingExists, error: checkError } = useSerialHashExists(serialHash);

  // Mettre à jour l'état de validation
  useEffect(() => {
    if (!serialHash) {
      setValidationState({
        isChecking: false,
        exists: false,
        error: null
      });
      return;
    }

  // Force l'état pendant le chargement
  setValidationState({
      isChecking: isCheckingExists,
      exists: !!exists,
      error: checkError
    });
  }, [serialHash, exists, isCheckingExists, checkError]);

  // Fonction pour vérifier un nouveau serial hash
  const checkSerialHash = (hash) => {
    setSerialHash(hash); // Change l'état pour déclencher le hook
  };

  // Fonction pour reset la validation
  const resetValidation = () => {
    setSerialHash(null);
    // Force le reset de l'état aussi
    setValidationState({
      isChecking: false,
      exists: false,
      error: null
    });
  };

  return {
    checkSerialHash,
    resetValidation,
    ...validationState
  };
}