import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CustomFlow, FlowPhase, FlowConnection } from '../types';

interface FlowState {
  flows: CustomFlow[];
  activeFlowId: string | null;
  
  // フロー管理
  createFlow: (name: string, description?: string) => CustomFlow;
  updateFlow: (id: string, updates: Partial<CustomFlow>) => void;
  deleteFlow: (id: string) => void;
  setActiveFlow: (id: string) => void;
  
  // フェーズ管理
  addPhase: (flowId: string, name: string, position: { x: number; y: number }) => FlowPhase;
  updatePhase: (flowId: string, phaseId: string, updates: Partial<FlowPhase>) => void;
  deletePhase: (flowId: string, phaseId: string) => void;
  
  // 接続管理
  addConnection: (flowId: string, fromPhaseId: string, toPhaseId: string) => void;
  deleteConnection: (flowId: string, connectionId: string) => void;
  
  // ユーティリティ
  getActiveFlow: () => CustomFlow | null;
  getFlow: (id: string) => CustomFlow | null;
}

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      flows: [],
      activeFlowId: null,
      
      createFlow: (name: string, description?: string) => {
        const newFlow: CustomFlow = {
          id: `flow-${Date.now()}`,
          name,
          description,
          phases: [],
          connections: [],
          isDefault: false,
          businessType: 'other',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set(state => ({
          flows: [...state.flows, newFlow],
          activeFlowId: newFlow.id
        }));
        
        return newFlow;
      },
      
      updateFlow: (id: string, updates: Partial<CustomFlow>) => {
        set(state => ({
          flows: state.flows.map(flow => 
            flow.id === id 
              ? { ...flow, ...updates, updatedAt: new Date() }
              : flow
          )
        }));
      },
      
      deleteFlow: (id: string) => {
        set(state => ({
          flows: state.flows.filter(flow => flow.id !== id),
          activeFlowId: state.activeFlowId === id ? null : state.activeFlowId
        }));
      },
      
      setActiveFlow: (id: string) => {
        set({ activeFlowId: id });
      },
      
      addPhase: (flowId: string, name: string, position: { x: number; y: number }) => {
        const flow = get().getFlow(flowId);
        if (!flow) throw new Error('Flow not found');
        
        const newPhase: FlowPhase = {
          id: `phase-${Date.now()}`,
          name,
          color: '#3B82F6', // デフォルトブルー
          position,
          order: flow.phases.length
        };
        
        set(state => ({
          flows: state.flows.map(f => 
            f.id === flowId 
              ? { 
                  ...f, 
                  phases: [...f.phases, newPhase],
                  updatedAt: new Date()
                }
              : f
          )
        }));
        
        return newPhase;
      },
      
      updatePhase: (flowId: string, phaseId: string, updates: Partial<FlowPhase>) => {
        set(state => ({
          flows: state.flows.map(flow => 
            flow.id === flowId 
              ? {
                  ...flow,
                  phases: flow.phases.map(phase => 
                    phase.id === phaseId 
                      ? { ...phase, ...updates }
                      : phase
                  ),
                  updatedAt: new Date()
                }
              : flow
          )
        }));
      },
      
      deletePhase: (flowId: string, phaseId: string) => {
        set(state => ({
          flows: state.flows.map(flow => 
            flow.id === flowId 
              ? {
                  ...flow,
                  phases: flow.phases.filter(phase => phase.id !== phaseId),
                  connections: flow.connections.filter(
                    conn => conn.fromPhaseId !== phaseId && conn.toPhaseId !== phaseId
                  ),
                  updatedAt: new Date()
                }
              : flow
          )
        }));
      },
      
      addConnection: (flowId: string, fromPhaseId: string, toPhaseId: string) => {
        const newConnection: FlowConnection = {
          id: `connection-${Date.now()}`,
          fromPhaseId,
          toPhaseId
        };
        
        set(state => ({
          flows: state.flows.map(flow => 
            flow.id === flowId 
              ? {
                  ...flow,
                  connections: [...flow.connections, newConnection],
                  updatedAt: new Date()
                }
              : flow
          )
        }));
      },
      
      deleteConnection: (flowId: string, connectionId: string) => {
        set(state => ({
          flows: state.flows.map(flow => 
            flow.id === flowId 
              ? {
                  ...flow,
                  connections: flow.connections.filter(conn => conn.id !== connectionId),
                  updatedAt: new Date()
                }
              : flow
          )
        }));
      },
      
      getActiveFlow: () => {
        const state = get();
        return state.activeFlowId ? state.getFlow(state.activeFlowId) : null;
      },
      
      getFlow: (id: string) => {
        return get().flows.find(flow => flow.id === id) || null;
      }
    }),
    {
      name: 'flow-store',
      version: 1
    }
  )
);