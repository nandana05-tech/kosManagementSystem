import { useOnlineStatus, usePWA } from '@hooks/useOnlineStatus';
import { FiWifiOff, FiRefreshCw, FiCheck } from 'react-icons/fi';

/**
 * Offline indicator banner - shows when user is offline
 */
export const OfflineBanner = () => {
    const { isOffline } = useOnlineStatus();

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-2 text-center flex items-center justify-center gap-2 shadow-md">
            <FiWifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">
                Anda sedang offline. Beberapa fitur mungkin tidak tersedia.
            </span>
        </div>
    );
};

/**
 * PWA Update prompt - shows when new version is available
 */
export const PWAUpdatePrompt = () => {
    const { needRefresh, updateServiceWorker } = usePWA();

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-start gap-3">
                <FiRefreshCw className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                    <p className="font-medium">Update tersedia!</p>
                    <p className="text-sm text-blue-100 mt-1">
                        Versi baru aplikasi sudah tersedia. Refresh untuk update.
                    </p>
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={updateServiceWorker}
                            className="px-3 py-1.5 bg-white text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
                        >
                            Refresh Sekarang
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-400 transition-colors"
                        >
                            Nanti
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Offline Ready indicator - shows when app is ready for offline use
 */
export const OfflineReadyToast = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 bg-green-600 text-white rounded-lg shadow-lg p-4 max-w-sm animate-slide-up">
            <div className="flex items-center gap-3">
                <FiCheck className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                    <p className="font-medium">Siap untuk offline!</p>
                    <p className="text-sm text-green-100">
                        Aplikasi dapat digunakan tanpa internet.
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="text-green-200 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

/**
 * Network status indicator (small badge)
 */
export const NetworkStatusBadge = () => {
    const { isOnline } = useOnlineStatus();

    return (
        <div className="flex items-center gap-1.5">
            <div
                className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
            />
            <span className="text-xs text-gray-500">
                {isOnline ? 'Online' : 'Offline'}
            </span>
        </div>
    );
};

export default OfflineBanner;
