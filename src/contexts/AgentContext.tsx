import React, { createContext, useContext, ReactNode } from 'react';

interface AgentContextType {}

const AgentContext = createContext<AgentContextType>({});

export function AgentProvider({ children }: { children: ReactNode }) {
  return <AgentContext.Provider value={{}}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  return useContext(AgentContext);
}
