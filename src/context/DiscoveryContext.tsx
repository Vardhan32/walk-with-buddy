// ====================================================================
// WALK WITH BUDDY - CONVERSATIONAL DISCOVERY CONTEXT
// ====================================================================

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ConversationalDiscoveryFilter, DiscoveryMode } from '../types';

export const DEFAULT_DISCOVERY_FILTER: ConversationalDiscoveryFilter = {
  mode: 'surprise_me',
  locationType: 'current',
  manualArea: 'Madhapur',
  radiusKm: 5,
  activities: ['casual_walk', 'coffee_chat'],
  timeframe: 'today',
  minAge: 18,
  maxAge: 65,
  genderPreference: 'all',
  groupOrIndividual: 'individual',
  discoveryFocus: 'Completely surprise me',
  selectedProfessions: [],
  additionalNotes: '',
};

interface DiscoveryContextValue {
  filter: ConversationalDiscoveryFilter;
  setFilter: (filter: ConversationalDiscoveryFilter) => void;
  updateFilter: (partial: Partial<ConversationalDiscoveryFilter>) => void;
  resetFilter: () => void;
  isCustomFilterActive: boolean;
  startDiscoveryWithMode: (mode: DiscoveryMode) => void;
}

const DiscoveryContext = createContext<DiscoveryContextValue | undefined>(undefined);

export const DiscoveryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filter, setFilterState] = useState<ConversationalDiscoveryFilter>(DEFAULT_DISCOVERY_FILTER);
  const [isCustomFilterActive, setIsCustomFilterActive] = useState<boolean>(false);

  const setFilter = (newFilter: ConversationalDiscoveryFilter) => {
    setFilterState(newFilter);
    setIsCustomFilterActive(true);
  };

  const updateFilter = (partial: Partial<ConversationalDiscoveryFilter>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
    setIsCustomFilterActive(true);
  };

  const resetFilter = () => {
    setFilterState(DEFAULT_DISCOVERY_FILTER);
    setIsCustomFilterActive(false);
  };

  const startDiscoveryWithMode = (mode: DiscoveryMode) => {
    setFilterState((prev) => ({
      ...prev,
      mode,
    }));
  };

  return (
    <DiscoveryContext.Provider
      value={{
        filter,
        setFilter,
        updateFilter,
        resetFilter,
        isCustomFilterActive,
        startDiscoveryWithMode,
      }}
    >
      {children}
    </DiscoveryContext.Provider>
  );
};

export const useDiscovery = (): DiscoveryContextValue => {
  const context = useContext(DiscoveryContext);
  if (!context) {
    throw new Error('useDiscovery must be used within a DiscoveryProvider');
  }
  return context;
};
