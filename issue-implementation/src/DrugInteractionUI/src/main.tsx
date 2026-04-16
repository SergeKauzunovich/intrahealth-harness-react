import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MedplumClient } from '@medplum/core'
import { MedplumProvider } from '@medplum/react'
import './index.css'
import App from './App.tsx'

const medplum = new MedplumClient({ baseUrl: 'http://localhost:8103/' })

async function prepare() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}

prepare().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MedplumProvider medplum={medplum}>
        <App />
      </MedplumProvider>
    </StrictMode>,
  )
})
