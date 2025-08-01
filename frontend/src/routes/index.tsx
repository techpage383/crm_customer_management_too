import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { UserLayout } from '../layouts/UserLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';

// Public Pages
import LoginPage from '../pages/public/LoginPage';

// User Pages
import { DashboardPage } from '../pages/user/DashboardPage';
import { CompanyManagementPage } from '../pages/user/CompanyManagementPage';
import { GmailLogPage } from '../pages/user/GmailLogPage';
import { TodoManagementPage } from '../pages/user/TodoManagementPage';
import { ProductManagementPage } from '../pages/user/ProductManagementPage';
import { DataImportPage } from '../pages/user/DataImportPage';
import { ContractManagementPage } from '../pages/user/ContractManagementPage';
import { ProposalManagementPage } from '../pages/user/ProposalManagementPage';
import { GmailSettingsPage } from '../pages/user/GmailSettingsPage';
import { TodoExtractionPage } from '../pages/user/TodoExtractionPage';
import { ProductMasterPage } from '../pages/user/ProductMasterPage';

// Admin Pages
import { SystemDashboardPage } from '../pages/admin/SystemDashboardPage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';

const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: <LoginPage />, // P-001
      },
      {
        path: '/login',
        element: <LoginPage />, // P-001
      },
    ],
  },
  
  // User Routes (Protected)
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <UserLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <DashboardPage />,
      },
      {
        path: 'companies',
        element: <CompanyManagementPage />, // P-002
      },
      {
        path: 'gmail-log',
        element: <GmailLogPage />, // P-003
      },
      {
        path: 'todos',
        element: <TodoManagementPage />, // P-005
      },
      {
        path: 'products',
        element: <ProductManagementPage />, // P-006
      },
      {
        path: 'import',
        element: <DataImportPage />, // P-007
      },
      {
        path: 'contracts',
        element: <ContractManagementPage />, // P-008
      },
      {
        path: 'proposals',
        element: <ProposalManagementPage />, // P-009
      },
      {
        path: 'gmail-settings',
        element: <GmailSettingsPage />, // P-011
      },
      {
        path: 'todo-extraction',
        element: <TodoExtractionPage />, // P-012
      },
      {
        path: 'product-master',
        element: <ProductMasterPage />, // P-013
      },
    ],
  },
  
  // Admin Routes (Protected + Admin Role)
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      {
        path: '',
        element: <SystemDashboardPage />, // P-004
      },
      {
        path: 'dashboard',
        element: <SystemDashboardPage />, // P-004
      },
      {
        path: 'users',
        element: <UserManagementPage />, // P-010
      },
    ],
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};