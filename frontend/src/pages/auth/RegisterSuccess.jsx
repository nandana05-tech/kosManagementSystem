import { useState, useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';
import { HiMail, HiRefresh, HiCheck, HiArrowRight } from 'react-icons/hi';

const RegisterSuccess = () => {
    const location = useLocation();
    const email = location.state?.email;

    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Redirect if no email in state
    if (!email) {
        return <Navigate to="/register" replace />;
    }

    // Countdown timer for resend cooldown
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleResendEmail = async () => {
        if (countdown > 0) return;

        setIsResending(true);
        setResendSuccess(false);

        try {
            await authService.resendVerification(email);
            toast.success('Email verifikasi berhasil dikirim ulang!');
            setResendSuccess(true);
            setCountdown(60); // 60 second cooldown
        } catch (error) {
            toast.error(error.message || 'Gagal mengirim ulang email verifikasi');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <HiMail className="w-10 h-10 text-green-600" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Registrasi Berhasil!
            </h2>

            {/* Description */}
            <p className="text-gray-600 mb-2">
                Kami telah mengirim email verifikasi ke:
            </p>
            <p className="text-primary-600 font-semibold text-lg mb-6">
                {email}
            </p>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium text-blue-800 mb-2">Langkah selanjutnya:</h3>
                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                    <li>Buka inbox email Anda (cek juga folder spam)</li>
                    <li>Klik link verifikasi di dalam email</li>
                    <li>Setelah verifikasi, Anda bisa login ke aplikasi</li>
                </ol>
            </div>

            {/* Resend Button */}
            <div className="mb-6">
                <p className="text-sm text-gray-500 mb-3">
                    Tidak menerima email?
                </p>
                <button
                    onClick={handleResendEmail}
                    disabled={isResending || countdown > 0}
                    className="btn-outline inline-flex items-center gap-2 disabled:opacity-50"
                >
                    {isResending ? (
                        <>
                            <span className="spinner w-4 h-4"></span>
                            Mengirim...
                        </>
                    ) : resendSuccess ? (
                        <>
                            <HiCheck className="w-5 h-5 text-green-600" />
                            Email Terkirim!
                        </>
                    ) : (
                        <>
                            <HiRefresh className="w-5 h-5" />
                            Kirim Ulang Email
                            {countdown > 0 && ` (${countdown}s)`}
                        </>
                    )}
                </button>
            </div>

            {/* Login Link */}
            <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2"
            >
                Lanjut ke Login
                <HiArrowRight className="w-5 h-5" />
            </Link>

            {/* Help Text */}
            <p className="text-xs text-gray-400 mt-6">
                Jika masih mengalami masalah, hubungi admin di support@kost.com
            </p>
        </div>
    );
};

export default RegisterSuccess;
