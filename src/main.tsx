import { createRoot } from 'react-dom/client'
import './styles/tailwind.css'
import './styles/tokens.css'
import './styles/shell.css'
import './styles/theme.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />,
)
