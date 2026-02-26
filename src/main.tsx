import { createRoot } from 'react-dom/client'
import './index.css'
import { installThreeConsoleFilter } from './scene3d/threeConsoleFilter'
import App from './App.tsx'

installThreeConsoleFilter()

createRoot(document.getElementById('root')!).render(
  <App />,
)
