
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Subjects from './pages/Subjects';
import Tasks from './pages/Tasks';
import Sessions from './pages/Sessions';
import Notes from './pages/Notes';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/goals/edit/:id" element={<Goals />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/goals/:id/subjects" element={<Subjects />} />
        <Route path="/subjects/:id/tasks" element={<Tasks />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/:id" element={<Tasks />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
