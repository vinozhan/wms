import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { dashboardService } from '../utils/api';

const DashboardContext = createContext();

const dashboardReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_OVERVIEW':
      return { ...state, overview: action.payload, loading: false };
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

const initialState = {
  overview: null,
  analytics: null,
  loading: false,
  error: null
};

export const DashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const fetchOverview = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await dashboardService.getOverview();
      dispatch({ type: 'SET_OVERVIEW', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await dashboardService.getAnalytics();
      dispatch({ type: 'SET_ANALYTICS', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchAnalytics();
  }, []);

  const value = {
    ...state,
    refetchOverview: fetchOverview,
    refetchAnalytics: fetchAnalytics
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};