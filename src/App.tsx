import { useMemo } from 'react'
import { createApp, PreviewShell } from './composition'
import { NewTaskFeature } from './features'

function isPreviewRoute(): boolean {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return path === '/preview'
}

function MainApp() {
  const app = useMemo(() => createApp('populated'), [])
  return <NewTaskFeature presenter={app.presenter} />
}

export default function App() {
  if (isPreviewRoute()) {
    return <PreviewShell />
  }
  return <MainApp />
}
