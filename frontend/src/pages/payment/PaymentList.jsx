import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';
import { paymentService } from '../../services/payment.service';
import { formatRupiah, formatDate } from '../../utils/helpers';
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '../../utils/constants';
import toast from 'react-hot-toast';
import {
    HiCreditCard,
    HiSearch,
    HiFilter,
    HiCheck,
    HiClock,
    HiX,
    HiExclamation,
    HiExclamationCircle,
    HiChevronLeft,
    HiChevronRight,
    HiChevronDown,
    HiChevronUp,
    HiEye,
    HiRefresh,
    HiUser,
    HiHome,
    HiMail,
    HiPhone
} from 'react-icons/hi';

const PaymentList = () => {
    const { user } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const isPemilik = user?.role === 'PEMILIK';

    // State for regular (penghuni) view
    const [payments, setPayments] = useState([]);
    const [meta, setMeta] = useState(null);

    // State for grouped (pemilik) view
    const [groupedUsers, setGroupedUsers] = useState([]);
    const [expandedUsers, setExpandedUsers] = useState({});

    // Common state
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState({ total: 0, success: 0, pending: 0, failed: 0 });

    // Filters for pemilik view
    const [pemilikFilters, setPemilikFilters] = useState({
        search: '',
        paymentStatus: '',
        rentalStatus: 'SEMUA'
    });

    // Filters for penghuni view
    const [filters, setFilters] = useState({
        status: '',
        page: 1,
        limit: 10
    });

    const [checkingId, setCheckingId] = useState(null);
    const [cancelModal, setCancelModal] = useState({ isOpen: false, paymentId: null, isLoading: false });

    // Fetch for pemilik (grouped view)
    const fetchGroupedPayments = async () => {
        setIsLoading(true);
        try {
            const params = {
                ...(pemilikFilters.search && { search: pemilikFilters.search }),
                ...(pemilikFilters.paymentStatus && { paymentStatus: pemilikFilters.paymentStatus }),
                ...(pemilikFilters.rentalStatus && { rentalStatus: pemilikFilters.rentalStatus })
            };
            const response = await paymentService.getGroupedByUser(params);
            setGroupedUsers(response.data || []);
        } catch (error) {
            toast.error(error.message || 'Gagal memuat data pembayaran');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch for penghuni (regular view)
    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const params = {
                page: filters.page,
                limit: filters.limit,
                ...(filters.status && { status: filters.status })
            };
            const response = await paymentService.getAll(params);
            setPayments(response.data || []);
            setMeta(response.meta);
        } catch (error) {
            toast.error(error.message || 'Gagal memuat data pembayaran');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await paymentService.getSummary();
            setSummary(response.data || { total: 0, success: 0, pending: 0, failed: 0 });
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    // Check for payment return from Midtrans
    useEffect(() => {
        const orderId = searchParams.get('order_id');
        const transactionStatus = searchParams.get('transaction_status');
        const statusCode = searchParams.get('status_code');

        if (orderId) {
            const syncPayment = async () => {
                try {
                    const response = await paymentService.syncStatus(orderId);
                    if (response.data?.midtransStatus === 'settlement' || response.data?.midtransStatus === 'capture') {
                        toast.success('Pembayaran berhasil! Status telah diupdate.');
                    } else if (response.data?.midtransStatus === 'pending') {
                        toast.info('Pembayaran dalam proses. Silakan selesaikan pembayaran.');
                    } else if (['deny', 'cancel', 'expire'].includes(response.data?.midtransStatus)) {
                        toast.error('Pembayaran gagal atau dibatalkan.');
                    } else {
                        toast.success(response.message || 'Status pembayaran diperbarui');
                    }
                } catch (error) {
                    console.error('Error syncing payment:', error);
                    if (transactionStatus === 'settlement' || statusCode === '200') {
                        toast.success('Pembayaran berhasil!');
                    } else if (transactionStatus === 'pending') {
                        toast.info('Menunggu pembayaran...');
                    }
                }
                setSearchParams({});
            };
            syncPayment();
        }
    }, [searchParams]);

    useEffect(() => {
        fetchSummary();
        if (isPemilik) {
            fetchGroupedPayments();
        } else {
            fetchPayments();
        }
    }, [isPemilik, filters, pemilikFilters, searchParams]);

    const handlePemilikFilterChange = (key, value) => {
        setPemilikFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const toggleUserExpanded = (userId) => {
        setExpandedUsers(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    const handleCheckStatus = async (paymentId) => {
        setCheckingId(paymentId);
        try {
            const response = await paymentService.checkStatus(paymentId);
            toast.success(`Status: ${response.data?.status || 'Unknown'}`);
            if (isPemilik) {
                fetchGroupedPayments();
            } else {
                fetchPayments();
            }
        } catch (error) {
            toast.error(error.message || 'Gagal cek status');
        } finally {
            setCheckingId(null);
        }
    };

    const handleVerifyPayment = async (paymentId) => {
        try {
            await paymentService.verify(paymentId);
            toast.success('Pembayaran berhasil diverifikasi');
            if (isPemilik) {
                fetchGroupedPayments();
            } else {
                fetchPayments();
            }
            fetchSummary();
        } catch (error) {
            toast.error(error.message || 'Gagal verifikasi pembayaran');
        }
    };

    const openCancelModal = (paymentId) => {
        setCancelModal({ isOpen: true, paymentId, isLoading: false });
    };

    const closeCancelModal = () => {
        setCancelModal({ isOpen: false, paymentId: null, isLoading: false });
    };

    const handleCancelPayment = async () => {
        setCancelModal(prev => ({ ...prev, isLoading: true }));
        try {
            await paymentService.cancel(cancelModal.paymentId);
            toast.success('Pembayaran berhasil dibatalkan');
            closeCancelModal();
            if (isPemilik) {
                fetchGroupedPayments();
            } else {
                fetchPayments();
            }
            fetchSummary();
        } catch (error) {
            toast.error(error.message || 'Gagal membatalkan pembayaran');
            setCancelModal(prev => ({ ...prev, isLoading: false }));
        }
    };

    const getStatusBadgeClass = (status) => {
        const colorMap = {
            success: 'badge-success',
            warning: 'badge-warning',
            danger: 'badge-danger',
            info: 'badge-info'
        };
        return colorMap[PAYMENT_STATUS_COLORS[status]] || 'badge-primary';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'SUCCESS': return <HiCheck className="w-4 h-4" />;
            case 'PENDING': return <HiClock className="w-4 h-4" />;
            case 'FAILED': return <HiX className="w-4 h-4" />;
            case 'EXPIRED': return <HiExclamation className="w-4 h-4" />;
            default: return <HiClock className="w-4 h-4" />;
        }
    };

    const getRentalStatusBadge = (status) => {
        switch (status) {
            case 'AKTIF':
                return <span className="badge badge-success">Aktif</span>;
            case 'SELESAI':
                return <span className="badge badge-info">Selesai</span>;
            case 'DIBATALKAN':
                return <span className="badge badge-danger">Dibatalkan</span>;
            default:
                return <span className="badge badge-secondary">{status || '-'}</span>;
        }
    };

    const handleResetFilters = () => {
        if (isPemilik) {
            setPemilikFilters({
                search: '',
                paymentStatus: '',
                rentalStatus: 'SEMUA'
            });
        } else {
            setFilters({ status: '', page: 1, limit: 10 });
        }
    };

    const handleRefresh = () => {
        fetchSummary();
        if (isPemilik) {
            fetchGroupedPayments();
        } else {
            fetchPayments();
        }
    };

    // Render payment card for mobile view
    const renderPaymentCard = (payment) => (
        <div key={payment.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="font-medium text-gray-900 text-sm">{payment.kodePembayaran}</p>
                    <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                </div>
                <span className={`badge inline-flex items-center gap-1 ${getStatusBadgeClass(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                    <span className="hidden sm:inline">{PAYMENT_STATUS_LABELS[payment.status] || payment.status}</span>
                </span>
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Tagihan</span>
                    <span className="text-gray-900">{payment.tagihan?.nomorTagihan || '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Metode</span>
                    <span className="text-gray-900 capitalize">{payment.paymentMethod || payment.paymentGateway || '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Jumlah</span>
                    <span className="font-semibold text-gray-900">{formatRupiah(payment.grossAmount)}</span>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                <Link
                    to={`/payment/${payment.id}`}
                    className="btn-outline btn-sm inline-flex items-center gap-1 text-xs"
                >
                    <HiEye className="w-4 h-4" />
                    Detail
                </Link>
                {payment.status === 'PENDING' && (
                    <>
                        <button
                            onClick={() => handleCheckStatus(payment.id)}
                            disabled={checkingId === payment.id}
                            className="btn-outline btn-sm inline-flex items-center gap-1 text-xs"
                        >
                            {checkingId === payment.id ? (
                                <span className="spinner w-3 h-3"></span>
                            ) : (
                                <HiRefresh className="w-4 h-4" />
                            )}
                            Cek
                        </button>
                        {isPemilik && (
                            <button
                                onClick={() => handleVerifyPayment(payment.id)}
                                className="btn-primary btn-sm inline-flex items-center gap-1 text-xs"
                            >
                                <HiCheck className="w-4 h-4" />
                                Verifikasi
                            </button>
                        )}
                        <button
                            onClick={() => openCancelModal(payment.id)}
                            className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs inline-flex items-center gap-1"
                        >
                            <HiX className="w-4 h-4" />
                            Batal
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    // Render payment row for desktop table
    const renderPaymentRow = (payment, showUser = false) => (
        <tr key={payment.id} className="hover:bg-gray-50 border-b border-gray-100">
            <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{payment.kodePembayaran}</p>
                <p className="text-xs text-gray-500">{payment.orderId}</p>
            </td>
            {showUser && (
                <td className="px-4 py-3">
                    <p className="text-gray-900">{payment.user?.name}</p>
                    <p className="text-sm text-gray-500">{payment.user?.email}</p>
                </td>
            )}
            <td className="px-4 py-3 text-gray-600">
                {payment.tagihan?.nomorTagihan || '-'}
            </td>
            <td className="px-4 py-3 text-gray-600">
                <span className="capitalize">{payment.paymentMethod || payment.paymentGateway || '-'}</span>
            </td>
            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                {formatRupiah(payment.grossAmount)}
            </td>
            <td className="px-4 py-3 text-gray-600">
                {formatDate(payment.createdAt)}
            </td>
            <td className="px-4 py-3">
                <span className={`badge inline-flex items-center gap-1 ${getStatusBadgeClass(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                    {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                </span>
            </td>
            <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                    <Link
                        to={`/payment/${payment.id}`}
                        className="btn-outline btn-sm inline-flex items-center gap-1"
                    >
                        <HiEye className="w-4 h-4" />
                        <span className="hidden lg:inline">Detail</span>
                    </Link>

                    {payment.status === 'PENDING' && (
                        <button
                            onClick={() => handleCheckStatus(payment.id)}
                            disabled={checkingId === payment.id}
                            className="btn-outline btn-sm inline-flex items-center gap-1"
                        >
                            {checkingId === payment.id ? (
                                <span className="spinner w-4 h-4"></span>
                            ) : (
                                <>
                                    <HiRefresh className="w-4 h-4" />
                                    <span className="hidden lg:inline">Cek</span>
                                </>
                            )}
                        </button>
                    )}

                    {isPemilik && payment.status === 'PENDING' && (
                        <button
                            onClick={() => handleVerifyPayment(payment.id)}
                            className="btn-primary btn-sm inline-flex items-center gap-1"
                        >
                            <HiCheck className="w-4 h-4" />
                            <span className="hidden xl:inline">Verifikasi</span>
                        </button>
                    )}

                    {payment.status === 'PENDING' && (
                        <button
                            onClick={() => openCancelModal(payment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                            title="Batalkan pembayaran"
                        >
                            <HiX className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );

    // Render pemilik view (grouped by user)
    const renderPemilikView = () => (
        <>
            {/* Filters for Pemilik */}
            <div className="card mb-6">
                <div className="card-body">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {/* Search */}
                        <div className="relative sm:col-span-2 lg:col-span-1">
                            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari nama penghuni..."
                                className="input pl-10"
                                value={pemilikFilters.search}
                                onChange={(e) => handlePemilikFilterChange('search', e.target.value)}
                            />
                        </div>

                        {/* Payment Status */}
                        <select
                            className="input"
                            value={pemilikFilters.paymentStatus}
                            onChange={(e) => handlePemilikFilterChange('paymentStatus', e.target.value)}
                        >
                            <option value="">Status Pembayaran</option>
                            <option value="SUCCESS">Berhasil</option>
                            <option value="PENDING">Pending</option>
                            <option value="FAILED">Gagal</option>
                            <option value="EXPIRED">Expired</option>
                            <option value="CANCEL">Dibatalkan</option>
                        </select>

                        {/* Rental Status */}
                        <select
                            className="input"
                            value={pemilikFilters.rentalStatus}
                            onChange={(e) => handlePemilikFilterChange('rentalStatus', e.target.value)}
                        >
                            <option value="SEMUA">Semua Penghuni</option>
                            <option value="AKTIF">Penghuni Aktif</option>
                            <option value="SELESAI">Penghuni Selesai</option>
                            <option value="DIBATALKAN">Penghuni Dibatalkan</option>
                        </select>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                        <button
                            onClick={handleResetFilters}
                            className="btn-outline text-sm"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="btn-outline inline-flex items-center gap-2 text-sm"
                        >
                            <HiRefresh className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Grouped Users */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="spinner w-8 h-8"></div>
                </div>
            ) : groupedUsers.length === 0 ? (
                <div className="card">
                    <div className="card-body text-center py-12">
                        <HiUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada penghuni</h3>
                        <p className="text-gray-500">
                            Tidak ada penghuni yang sesuai dengan filter
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {groupedUsers.map((userData) => (
                        <div key={userData.id} className="card overflow-hidden">
                            {/* User Identity Header - Responsive */}
                            <div
                                className="bg-gray-100 px-4 sm:px-6 py-4 cursor-pointer hover:bg-gray-200 transition-colors"
                                onClick={() => toggleUserExpanded(userData.id)}
                            >
                                {/* Mobile Layout - shows on screens < 768px */}
                                <div className="block md:hidden">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                            <HiUser className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">{userData.name}</h3>
                                            <p className="text-sm text-gray-600 truncate">{userData.email}</p>
                                        </div>
                                        <div className="text-gray-400">
                                            {expandedUsers[userData.id] ? (
                                                <HiChevronUp className="w-5 h-5" />
                                            ) : (
                                                <HiChevronDown className="w-5 h-5" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <div className="flex items-center gap-1 text-gray-700">
                                            <HiHome className="w-4 h-4" />
                                            <span>{userData.currentKamar || 'Tidak ada'}</span>
                                        </div>
                                        {getRentalStatusBadge(userData.rentalStatus)}
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <div className="text-center px-2 py-1 bg-white rounded text-xs flex-1">
                                            <p className="text-gray-500">Total</p>
                                            <p className="font-bold text-gray-900">{userData.paymentStats.total}</p>
                                        </div>
                                        <div className="text-center px-2 py-1 bg-green-50 rounded text-xs flex-1">
                                            <p className="text-green-600">Berhasil</p>
                                            <p className="font-bold text-green-700">{userData.paymentStats.success}</p>
                                        </div>
                                        <div className="text-center px-2 py-1 bg-yellow-50 rounded text-xs flex-1">
                                            <p className="text-yellow-600">Pending</p>
                                            <p className="font-bold text-yellow-700">{userData.paymentStats.pending}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Layout - shows on screens >= 768px */}
                                <div className="hidden md:flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                                            <HiUser className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-lg">{userData.name}</h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                <span className="inline-flex items-center gap-1">
                                                    <HiMail className="w-4 h-4" />
                                                    {userData.email}
                                                </span>
                                                {userData.noTelepon && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <HiPhone className="w-4 h-4" />
                                                        {userData.noTelepon}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        {/* Room Info */}
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <HiHome className="w-4 h-4" />
                                                <span className="font-medium">{userData.currentKamar || 'Tidak ada kamar'}</span>
                                            </div>
                                            <div className="mt-1">
                                                {getRentalStatusBadge(userData.rentalStatus)}
                                            </div>
                                        </div>
                                        {/* Payment Stats */}
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="text-center px-3 py-1 bg-white rounded-lg">
                                                <p className="text-gray-500">Total</p>
                                                <p className="font-bold text-gray-900">{userData.paymentStats.total}</p>
                                            </div>
                                            <div className="text-center px-3 py-1 bg-green-50 rounded-lg">
                                                <p className="text-green-600">Berhasil</p>
                                                <p className="font-bold text-green-700">{userData.paymentStats.success}</p>
                                            </div>
                                            <div className="text-center px-3 py-1 bg-yellow-50 rounded-lg">
                                                <p className="text-yellow-600">Pending</p>
                                                <p className="font-bold text-yellow-700">{userData.paymentStats.pending}</p>
                                            </div>
                                        </div>
                                        {/* Expand Icon */}
                                        <div className="text-gray-400">
                                            {expandedUsers[userData.id] ? (
                                                <HiChevronUp className="w-6 h-6" />
                                            ) : (
                                                <HiChevronDown className="w-6 h-6" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment History (Expandable) */}
                            {expandedUsers[userData.id] && (
                                <div className="border-t border-gray-200">
                                    <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
                                        <h4 className="font-medium text-gray-700 text-sm sm:text-base">Rincian Histori Pembayaran</h4>
                                    </div>
                                    {userData.payments.length === 0 ? (
                                        <div className="px-4 sm:px-6 py-8 text-center text-gray-500">
                                            <HiCreditCard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                            <p>Belum ada riwayat pembayaran</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Mobile: Card view */}
                                            <div className="block md:hidden p-4">
                                                {userData.payments.map((payment) => renderPaymentCard(payment))}
                                            </div>

                                            {/* Desktop: Table view */}
                                            <div className="hidden md:block overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50 border-b border-gray-200">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Kode Pembayaran</th>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tagihan</th>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Metode</th>
                                                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Jumlah</th>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tanggal</th>
                                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                                                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {userData.payments.map((payment) => renderPaymentRow(payment, false))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </>
    );

    // Render penghuni view (regular list)
    const renderPenghuniView = () => (
        <>
            {/* Filters */}
            <div className="card mb-6">
                <div className="card-body">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="flex-1">
                            <select
                                className="input w-full"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="">Semua Status</option>
                                <option value="SUCCESS">Berhasil</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Gagal</option>
                                <option value="EXPIRED">Expired</option>
                                <option value="CANCEL">Dibatalkan</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleResetFilters}
                                className="btn-outline flex-1 sm:flex-none"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleRefresh}
                                className="btn-outline inline-flex items-center justify-center gap-2 flex-1 sm:flex-none"
                            >
                                <HiRefresh className="w-5 h-5" />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payments */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="spinner w-8 h-8"></div>
                </div>
            ) : payments.length === 0 ? (
                <div className="card">
                    <div className="card-body text-center py-12">
                        <HiCreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada pembayaran</h3>
                        <p className="text-gray-500">
                            {filters.status ? 'Tidak ada pembayaran dengan status ini' : 'Riwayat pembayaran akan muncul di sini'}
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Mobile: Card view */}
                    <div className="block md:hidden space-y-3">
                        {payments.map((payment) => renderPaymentCard(payment))}
                    </div>

                    {/* Desktop: Table view */}
                    <div className="hidden md:block card">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Kode Pembayaran</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tagihan</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Metode</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Jumlah</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tanggal</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {payments.map((payment) => renderPaymentRow(payment, false))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                    <p className="text-sm text-gray-600 text-center sm:text-left">
                        Menampilkan {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(meta.page - 1)}
                            disabled={meta.page === 1}
                            className="btn-outline p-2 disabled:opacity-50"
                        >
                            <HiChevronLeft className="w-5 h-5" />
                        </button>

                        {[...Array(Math.min(meta.totalPages, 5))].map((_, i) => {
                            const page = i + 1;
                            return (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-medium text-sm ${page === meta.page
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => handlePageChange(meta.page + 1)}
                            disabled={meta.page === meta.totalPages}
                            className="btn-outline p-2 disabled:opacity-50"
                        >
                            <HiChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );


    return (
        <div>
            {/* Page Header */}
            <div className="mb-4 sm:mb-6">
                <h1 className="page-title text-xl sm:text-2xl">Riwayat Pembayaran</h1>
                <p className="page-description text-sm sm:text-base">
                    {isPemilik ? 'Lihat semua transaksi pembayaran per penghuni' : 'Lihat riwayat pembayaran Anda'}
                </p>
            </div>

            {/* Summary Cards - Responsive Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="card">
                    <div className="card-body p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <HiCreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm text-gray-500 truncate">Total</p>
                                <p className="text-lg sm:text-xl font-bold text-gray-900">{meta?.total || summary.total}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-body p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                <HiCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm text-gray-500 truncate">Berhasil</p>
                                <p className="text-lg sm:text-xl font-bold text-green-600">{summary.success}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-body p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                <HiClock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm text-gray-500 truncate">Pending</p>
                                <p className="text-lg sm:text-xl font-bold text-yellow-600">{summary.pending}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-body p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                <HiX className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm text-gray-500 truncate">Gagal</p>
                                <p className="text-lg sm:text-xl font-bold text-red-600">{summary.failed}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Render view based on role */}
            {isPemilik ? renderPemilikView() : renderPenghuniView()}

            {/* Cancel Confirmation Modal */}
            {cancelModal.isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                            onClick={closeCancelModal}
                        ></div>

                        {/* Modal */}
                        <div className="relative inline-block w-full max-w-md p-4 sm:p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                                <HiExclamationCircle className="w-6 h-6 text-red-600" />
                            </div>

                            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
                                Batalkan Pembayaran?
                            </h3>

                            <p className="text-sm text-center text-gray-500 mb-6">
                                Apakah Anda yakin ingin membatalkan pembayaran ini? Tindakan ini tidak dapat dibatalkan.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={closeCancelModal}
                                    disabled={cancelModal.isLoading}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none disabled:opacity-50 order-2 sm:order-1"
                                >
                                    Tidak, Kembali
                                </button>
                                <button
                                    onClick={handleCancelPayment}
                                    disabled={cancelModal.isLoading}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none disabled:opacity-50 inline-flex items-center justify-center gap-2 order-1 sm:order-2"
                                >
                                    {cancelModal.isLoading ? (
                                        <>
                                            <span className="spinner w-4 h-4 border-white"></span>
                                            Memproses...
                                        </>
                                    ) : (
                                        'Ya, Batalkan'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentList;
