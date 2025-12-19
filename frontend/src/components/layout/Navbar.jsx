import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';
import { laporanService } from '../../services/laporan.service';
import { HiMenu, HiBell, HiUser, HiLogout, HiCog, HiExclamation, HiClock, HiCheck, HiX } from 'react-icons/hi';
import { getInitials, stringToColor } from '../../utils/helpers';

/**
 * Top navbar component
 */
const Navbar = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [latestLaporan, setLatestLaporan] = useState([]);
    const [loadingLaporan, setLoadingLaporan] = useState(false);

    // Fetch latest laporan when notification dropdown opens
    useEffect(() => {
        const fetchLatestLaporan = async () => {
            if (notifOpen) {
                setLoadingLaporan(true);
                try {
                    const response = await laporanService.getAll({ limit: 5, page: 1 });
                    setLatestLaporan(response.data || []);
                } catch (error) {
                    console.error('Error fetching laporan:', error);
                }
                setLoadingLaporan(false);
            }
        };
        fetchLatestLaporan();
    }, [notifOpen]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'SELESAI': return <HiCheck className="w-3 h-3 text-green-500" />;
            case 'DIPROSES': return <HiClock className="w-3 h-3 text-blue-500" />;
            case 'DITOLAK': return <HiX className="w-3 h-3 text-red-500" />;
            default: return <HiExclamation className="w-3 h-3 text-yellow-500" />;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'SELESAI': return 'Selesai';
            case 'DIPROSES': return 'Diproses';
            case 'DITOLAK': return 'Ditolak';
            default: return 'Menunggu';
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        return date.toLocaleDateString('id-ID');
    };

    return (
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                {/* Left side - menu button */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                    <HiMenu className="w-6 h-6" />
                </button>

                {/* Right side - notifications and profile */}
                <div className="flex items-center gap-3 ml-auto">
                    {/* Notifications Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setNotifOpen(!notifOpen);
                                setDropdownOpen(false);
                            }}
                            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            <HiBell className="w-6 h-6" />
                            {latestLaporan.length > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {notifOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setNotifOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
                                    {/* Header */}
                                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900">Laporan Terbaru</h3>
                                            <Link
                                                to="/laporan"
                                                onClick={() => setNotifOpen(false)}
                                                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                            >
                                                Lihat Semua
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Laporan List */}
                                    <div className="max-h-80 overflow-y-auto">
                                        {loadingLaporan ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="spinner w-6 h-6"></div>
                                            </div>
                                        ) : latestLaporan.length > 0 ? (
                                            latestLaporan.map((laporan) => (
                                                <Link
                                                    key={laporan.id}
                                                    to={`/laporan/${laporan.id}`}
                                                    onClick={() => setNotifOpen(false)}
                                                    className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 mt-1 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <HiExclamation className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {laporan.judul}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {laporan.kamar?.namaKamar || 'Kamar'}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="inline-flex items-center gap-1 text-xs">
                                                                    {getStatusIcon(laporan.status)}
                                                                    {getStatusLabel(laporan.status)}
                                                                </span>
                                                                <span className="text-xs text-gray-400">•</span>
                                                                <span className="text-xs text-gray-400">
                                                                    {formatTimeAgo(laporan.createdAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center">
                                                <HiBell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Belum ada laporan</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Profile dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setDropdownOpen(!dropdownOpen);
                                setNotifOpen(false);
                            }}
                            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {user?.fotoProfil ? (
                                <img
                                    src={user.fotoProfil}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                                    style={{ backgroundColor: stringToColor(user?.name) }}
                                >
                                    {getInitials(user?.name)}
                                </div>
                            )}
                            <span className="hidden sm:block text-sm font-medium text-gray-700">
                                {user?.name}
                            </span>
                        </button>

                        {/* Dropdown menu */}
                        {dropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setDropdownOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <HiUser className="w-4 h-4" />
                                        Profil Saya
                                    </Link>
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <HiCog className="w-4 h-4" />
                                        Pengaturan
                                    </Link>
                                    <hr className="my-1" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <HiLogout className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;

