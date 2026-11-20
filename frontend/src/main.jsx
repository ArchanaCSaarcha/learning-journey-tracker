
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { GoalsProvider } from './context/GoalsContext'
import { SubjectsProvider } from './context/SubjectsContext'
import { TasksProvider } from './context/TasksContext'
import { SessionsProvider } from './context/SessionsContext'
import { NotesProvider } from './context/NotesContext'

import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <GoalsProvider>
        <SubjectsProvider>
          <TasksProvider>
            <SessionsProvider>
              <NotesProvider>
                <App />
              </NotesProvider>
            </SessionsProvider>
          </TasksProvider>
        </SubjectsProvider>
      </GoalsProvider>
    </BrowserRouter>
  </StrictMode>,
)
