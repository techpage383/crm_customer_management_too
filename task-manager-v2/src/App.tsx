import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TaskManagementDashboard } from './components/TaskManagementDashboard';
import { FlowDesigner } from './components/FlowDesigner';
import { Navigation } from './components/Navigation';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<TaskManagementDashboard />} />
            <Route path="/flow-designer" element={<FlowDesigner />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;