import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { initApp } from './utils/initApp.ts'

// 初始化應用程式（載入示例題目）
initApp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

