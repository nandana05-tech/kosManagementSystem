import { Routes, Route } from 'react-router-dom'
import AppRoutes from './routes'
import { OfflineBanner, PWAUpdatePrompt } from '@components/common/OfflineIndicator'
import { useBackgroundSync } from '@hooks/useBackgroundSync'

// Background sync initializer component
function BackgroundSyncProvider({ children }) {
    // This hook will automatically sync pending requests when coming back online
    useBackgroundSync();
    return children;
}

function App() {
    return (
        <>
            <OfflineBanner />
            <PWAUpdatePrompt />
            <BackgroundSyncProvider>
                <AppRoutes />
            </BackgroundSyncProvider>
        </>
    )
}

export default App
