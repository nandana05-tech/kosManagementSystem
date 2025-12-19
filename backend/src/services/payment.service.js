const prisma = require('../config/database');
const { snap, coreApi } = require('../config/midtrans');
const { paginate, paginationMeta } = require('../utils/response');
const { generateCode } = require('../utils/helpers');
const { sendPaymentNotification } = require('../utils/email');

/**
 * Get all payments
 */
const getAllPayments = async (query = {}, userId = null, role = null) => {
  const { page = 1, limit = 10, status } = query;
  const pagination = paginate(page, limit);

  const where = {
    ...(role === 'PENGHUNI' && { userId }),
    ...(status && { status })
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      ...pagination,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        tagihan: true,
        riwayatSewa: {
          include: { kamar: { select: { id: true, namaKamar: true } } }
        }
      }
    }),
    prisma.payment.count({ where })
  ]);

  return {
    payments,
    meta: paginationMeta(total, page, limit)
  };
};

/**
 * Get payment by ID
 */
const getPaymentById = async (id) => {
  const payment = await prisma.payment.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: { select: { id: true, name: true, email: true, noTelepon: true } },
      tagihan: true,
      riwayatSewa: { include: { kamar: true } }
    }
  });

  if (!payment) {
    throw { statusCode: 404, message: 'Payment tidak ditemukan' };
  }

  return payment;
};

/**
 * Create payment with Midtrans
 */
const createPayment = async (tagihanId, userId) => {
  // Validate tagihanId
  if (!tagihanId || isNaN(parseInt(tagihanId))) {
    throw { statusCode: 400, message: 'Tagihan ID tidak valid' };
  }

  const parsedTagihanId = parseInt(tagihanId);

  // Get tagihan
  const tagihan = await prisma.tagihan.findUnique({
    where: { id: parsedTagihanId },
    include: {
      user: true,
      riwayatSewa: { include: { kamar: true } }
    }
  });

  if (!tagihan) {
    throw { statusCode: 404, message: 'Tagihan tidak ditemukan' };
  }

  if (tagihan.status === 'LUNAS') {
    throw { statusCode: 400, message: 'Tagihan sudah lunas' };
  }

  // Check if user owns this tagihan
  if (tagihan.userId !== userId) {
    throw { statusCode: 403, message: 'Anda tidak memiliki akses ke tagihan ini' };
  }

  const kodePembayaran = generateCode('PAY');

  // Create Midtrans transaction
  const parameter = {
    transaction_details: {
      order_id: kodePembayaran,
      gross_amount: parseInt(tagihan.nominal)
    },
    customer_details: {
      first_name: tagihan.user.name,
      email: tagihan.user.email,
      phone: tagihan.user.noTelepon || ''
    },
    item_details: [{
      id: tagihan.nomorTagihan,
      price: parseInt(tagihan.nominal),
      quantity: 1,
      name: `Pembayaran ${tagihan.jenisTagihan || 'Sewa'} - ${tagihan.riwayatSewa.kamar.namaKamar}`
    }],
    callbacks: {
      finish: `${process.env.FRONTEND_URL}/payment/finish`
    }
  };

  try {
    const transaction = await snap.createTransaction(parameter);

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        kodePembayaran,
        tagihanId: tagihan.id,
        userId,
        riwayatSewaId: tagihan.riwayatSewaId,
        grossAmount: tagihan.nominal,
        status: 'PENDING',
        snapToken: transaction.token,
        snapRedirectUrl: transaction.redirect_url
      },
      include: { tagihan: true }
    });

    return {
      payment,
      snapToken: transaction.token,
      redirectUrl: transaction.redirect_url
    };
  } catch (error) {
    throw { statusCode: 500, message: 'Gagal membuat transaksi pembayaran' };
  }
};

/**
 * Handle Midtrans notification
 */
const handleMidtransNotification = async (notification) => {
  const orderId = notification.order_id;
  const transactionStatus = notification.transaction_status;
  const fraudStatus = notification.fraud_status;

  const payment = await prisma.payment.findUnique({
    where: { kodePembayaran: orderId },
    include: { 
      user: true, 
      tagihan: true,
      riwayatSewa: { include: { kamar: true } }
    }
  });

  if (!payment) {
    throw { statusCode: 404, message: 'Payment tidak ditemukan' };
  }

  let status = 'PENDING';
  let paidAt = null;

  if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
    if (fraudStatus === 'accept' || !fraudStatus) {
      status = 'SUCCESS';
      paidAt = new Date();
    }
  } else if (transactionStatus === 'cancel' || transactionStatus === 'deny') {
    status = 'FAILED';
  } else if (transactionStatus === 'expire') {
    status = 'EXPIRED';
  }

  // Handle based on status
  if (status === 'SUCCESS') {
    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        paidAt,
        transactionId: notification.transaction_id,
        paymentMethod: notification.payment_type,
        vaNumber: notification.va_numbers?.[0]?.va_number,
        bank: notification.va_numbers?.[0]?.bank
      }
    });

    // Update tagihan status
    await prisma.tagihan.update({
      where: { id: payment.tagihanId },
      data: { status: 'LUNAS' }
    });

    // Check if this is an extension payment - update tanggalBerakhir after payment success
    const isExtension = payment.tagihan?.keterangan?.includes('Perpanjangan');
    if (isExtension && payment.riwayatSewaId) {
      const keterangan = payment.tagihan?.keterangan || '';
      const durationMatch = keterangan.match(/untuk (\d+) bulan/);
      const extensionMonths = durationMatch ? parseInt(durationMatch[1]) : 0;
      
      if (extensionMonths > 0) {
        const currentSewa = await prisma.riwayatSewa.findUnique({
          where: { id: payment.riwayatSewaId }
        });
        
        if (currentSewa) {
          const currentEndDate = new Date(currentSewa.tanggalBerakhir);
          currentEndDate.setMonth(currentEndDate.getMonth() + extensionMonths);
          
          await prisma.riwayatSewa.update({
            where: { id: payment.riwayatSewaId },
            data: { 
              tanggalBerakhir: currentEndDate,
              durasiBulan: (currentSewa.durasiBulan || 0) + extensionMonths
            }
          });
          
          console.log(`Extension payment success: Extended ${extensionMonths} months for riwayatSewa ${payment.riwayatSewaId}`);
        }
      }
    }

    // Send email notification
    try {
      await sendPaymentNotification(payment.user.email, {
        name: payment.user.name,
        kodePembayaran: payment.kodePembayaran,
        nominal: parseFloat(payment.grossAmount),
        status: 'berhasil'
      });
    } catch (error) {
      console.error('Failed to send payment notification:', error);
    }
  } else if (status === 'FAILED' || status === 'EXPIRED') {
    // Check if this is an extension payment
    const isExtension = payment.tagihan?.keterangan?.includes('Perpanjangan');
    
    if (isExtension) {
      // Extension cancellation: Delete payment and tagihan, revert duration (don't change riwayatSewa status)
      await prisma.$transaction(async (tx) => {
        // 1. Delete payment first (references tagihan)
        await tx.payment.delete({
          where: { id: payment.id }
        });

        // 2. Delete tagihan
        if (payment.tagihanId) {
          await tx.tagihan.delete({
            where: { id: payment.tagihanId }
          });
        }

        // Note: No need to revert tanggalBerakhir as it hasn't been updated yet
        // (tanggalBerakhir is only updated after payment success)
      });
      
      console.log(`Extension payment ${orderId} ${status}: Payment and tagihan deleted`);
    } else {
      // New booking cancellation: Delete both payment and tagihan
      await prisma.$transaction(async (tx) => {
        // 1. Delete payment first (references tagihan)
        await tx.payment.delete({
          where: { id: payment.id }
        });

        // 2. Delete tagihan
        if (payment.tagihanId) {
          await tx.tagihan.delete({
            where: { id: payment.tagihanId }
          });
        }

        // 3. Set riwayatSewa status to SELESAI
        if (payment.riwayatSewaId) {
          await tx.riwayatSewa.update({
            where: { id: payment.riwayatSewaId },
            data: { 
              status: 'SELESAI',
              tanggalBerakhir: new Date()
            }
          });

          // Update kamar to TERSEDIA
          if (payment.riwayatSewa?.kamarId) {
            await tx.kamar.update({
              where: { id: payment.riwayatSewa.kamarId },
              data: { status: 'TERSEDIA' }
            });
          }
          
          console.log(`Booking cancelled: riwayatSewa ${payment.riwayatSewaId} set to SELESAI`);
        }
      });

      console.log(`Booking payment ${orderId} ${status}: Payment and tagihan deleted`);
    }
  } else {
    // PENDING status - just update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        transactionId: notification.transaction_id,
        paymentMethod: notification.payment_type,
        vaNumber: notification.va_numbers?.[0]?.va_number,
        bank: notification.va_numbers?.[0]?.bank
      }
    });
  }

  return { message: 'Notification processed' };
};

/**
 * Verify payment manually (Pemilik only)
 */
const verifyPayment = async (paymentId, verifierId) => {
  const payment = await prisma.payment.findUnique({
    where: { id: parseInt(paymentId) },
    include: { user: true }
  });

  if (!payment) {
    throw { statusCode: 404, message: 'Payment tidak ditemukan' };
  }

  // Update payment
  const updatedPayment = await prisma.payment.update({
    where: { id: parseInt(paymentId) },
    data: {
      status: 'SUCCESS',
      paidAt: new Date(),
      verifiedBy: verifierId,
      verifiedAt: new Date()
    }
  });

  // Update tagihan
  await prisma.tagihan.update({
    where: { id: payment.tagihanId },
    data: { status: 'LUNAS' }
  });

  // Send notification
  try {
    await sendPaymentNotification(payment.user.email, {
      name: payment.user.name,
      kodePembayaran: payment.kodePembayaran,
      nominal: parseFloat(payment.grossAmount),
      status: 'berhasil (diverifikasi manual)'
    });
  } catch (error) {
    console.error('Failed to send payment notification:', error);
  }

  return updatedPayment;
};

/**
 * Check payment status from Midtrans
 */
const checkPaymentStatus = async (paymentId) => {
  const payment = await prisma.payment.findUnique({
    where: { id: parseInt(paymentId) }
  });

  if (!payment) {
    throw { statusCode: 404, message: 'Payment tidak ditemukan' };
  }

  try {
    const status = await coreApi.transaction.status(payment.kodePembayaran);
    return status;
  } catch (error) {
    throw { statusCode: 500, message: 'Gagal mengecek status pembayaran' };
  }
};

/**
 * Sync payment status from Midtrans API and update local DB
 * Used when user returns from Midtrans payment page
 */
const syncPaymentStatus = async (orderId) => {
  // Find payment by orderId (kodePembayaran)
  const payment = await prisma.payment.findUnique({
    where: { kodePembayaran: orderId },
    include: { 
      tagihan: true, 
      user: true,
      riwayatSewa: { include: { kamar: true } }
    }
  });

  if (!payment) {
    throw { statusCode: 404, message: 'Payment tidak ditemukan' };
  }

  // Already processed
  if (payment.status === 'SUCCESS') {
    return { message: 'Payment sudah terverifikasi', payment };
  }

  try {
    // Get status from Midtrans
    const midtransStatus = await coreApi.transaction.status(orderId);
    const transactionStatus = midtransStatus.transaction_status;
    const fraudStatus = midtransStatus.fraud_status;

    let status = 'PENDING';
    let paidAt = null;

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        status = 'SUCCESS';
        paidAt = new Date();
      }
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny') {
      status = 'FAILED';
    } else if (transactionStatus === 'expire') {
      status = 'EXPIRED';
    }

    // Handle based on status
    if (status === 'SUCCESS') {
      // Update payment
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status,
          paidAt,
          paymentMethod: midtransStatus.payment_type
        }
      });

      // Update tagihan status
      await prisma.tagihan.update({
        where: { id: payment.tagihanId },
        data: { status: 'LUNAS' }
      });

      // Check if this is an extension payment - update tanggalBerakhir after payment success
      const isExtension = payment.tagihan?.keterangan?.includes('Perpanjangan');
      if (isExtension && payment.riwayatSewaId) {
        const keterangan = payment.tagihan?.keterangan || '';
        const durationMatch = keterangan.match(/untuk (\d+) bulan/);
        const extensionMonths = durationMatch ? parseInt(durationMatch[1]) : 0;
        
        if (extensionMonths > 0) {
          const currentSewa = await prisma.riwayatSewa.findUnique({
            where: { id: payment.riwayatSewaId }
          });
          
          if (currentSewa) {
            const currentEndDate = new Date(currentSewa.tanggalBerakhir);
            currentEndDate.setMonth(currentEndDate.getMonth() + extensionMonths);
            
            await prisma.riwayatSewa.update({
              where: { id: payment.riwayatSewaId },
              data: { 
                tanggalBerakhir: currentEndDate,
                durasiBulan: (currentSewa.durasiBulan || 0) + extensionMonths
              }
            });
            
            console.log(`Extension payment success (sync): Extended ${extensionMonths} months`);
          }
        }
      }

      return { 
        message: 'Pembayaran berhasil diverifikasi',
        payment: updatedPayment,
        midtransStatus: transactionStatus
      };
    } else if (status === 'FAILED' || status === 'EXPIRED') {
      // Check if this is an extension payment
      const isExtension = payment.tagihan?.keterangan?.includes('Perpanjangan');

      if (isExtension) {
        // Extension cancellation: Delete payment and tagihan, revert duration (don't change status)
        await prisma.$transaction(async (tx) => {
          // 1. Delete payment first (references tagihan)
          await tx.payment.delete({
            where: { id: payment.id }
          });

          // 2. Delete tagihan
          if (payment.tagihanId) {
            await tx.tagihan.delete({
              where: { id: payment.tagihanId }
            });
          }

          // Note: No need to revert tanggalBerakhir as it hasn't been updated yet
          // (tanggalBerakhir is only updated after payment success)
        });

        return { 
          message: `Pembayaran perpanjangan ${status === 'FAILED' ? 'dibatalkan' : 'kadaluarsa'}.`,
          deleted: true,
          midtransStatus: transactionStatus
        };
      } else {
        // New booking cancellation: Delete both payment and tagihan
        await prisma.$transaction(async (tx) => {
          // 1. Delete payment first
          await tx.payment.delete({
            where: { id: payment.id }
          });

          // 2. Delete tagihan
          if (payment.tagihanId) {
            await tx.tagihan.delete({
              where: { id: payment.tagihanId }
            });
          }

          // 3. Set riwayatSewa status to SELESAI
          if (payment.riwayatSewaId) {
            await tx.riwayatSewa.update({
              where: { id: payment.riwayatSewaId },
              data: { 
                status: 'SELESAI',
                tanggalBerakhir: new Date()
              }
            });

            if (payment.riwayatSewa?.kamarId) {
              await tx.kamar.update({
                where: { id: payment.riwayatSewa.kamarId },
                data: { status: 'TERSEDIA' }
              });
            }
          }
        });

        return { 
          message: `Pembayaran ${status === 'FAILED' ? 'dibatalkan' : 'kadaluarsa'}. Tagihan dan sewa dihapus.`,
          deleted: true,
          midtransStatus: transactionStatus
        };
      }
    } else {
      // PENDING status - just update payment
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status,
          paymentMethod: midtransStatus.payment_type
        }
      });

      return { 
        message: `Status pembayaran: ${status}`,
        payment: updatedPayment,
        midtransStatus: transactionStatus
      };
    }
  } catch (error) {
    console.error('Error syncing payment status:', error);
    // If Midtrans API fails, return current status
    return { 
      message: 'Tidak dapat mengecek status dari Midtrans', 
      payment,
      error: error.message 
    };
  }
};

/**
 * Cancel payment (by user or owner)
 */
const cancelPayment = async (paymentId, userId, role) => {
  const payment = await prisma.payment.findUnique({
    where: { id: parseInt(paymentId) },
    include: { 
      tagihan: true, 
      user: true,
      riwayatSewa: { include: { kamar: true } }
    }
  });

  if (!payment) {
    throw { statusCode: 404, message: 'Payment tidak ditemukan' };
  }

  // Only allow cancellation for PENDING payments
  if (payment.status !== 'PENDING') {
    throw { statusCode: 400, message: 'Hanya pembayaran dengan status PENDING yang dapat dibatalkan' };
  }

  // Check authorization: penghuni can only cancel their own, pemilik can cancel any
  if (role === 'PENGHUNI' && payment.userId !== userId) {
    throw { statusCode: 403, message: 'Tidak memiliki akses untuk membatalkan pembayaran ini' };
  }

  // Check if this is an extension payment
  const isExtension = payment.tagihan?.keterangan?.includes('Perpanjangan');

  if (isExtension) {
    // Extension cancellation: Delete payment and tagihan (no need to revert dates)
    await prisma.$transaction(async (tx) => {
      // 1. Delete payment first (references tagihan)
      await tx.payment.delete({
        where: { id: parseInt(paymentId) }
      });

      // 2. Delete tagihan
      if (payment.tagihanId) {
        await tx.tagihan.delete({
          where: { id: payment.tagihanId }
        });
      }

      // Note: No need to revert tanggalBerakhir as it hasn't been updated yet
      // (tanggalBerakhir is only updated after payment success)
    });

    return { message: 'Perpanjangan sewa berhasil dibatalkan.' };
  } else {
    // New booking cancellation: Delete both payment and tagihan
    await prisma.$transaction(async (tx) => {
      // 1. Delete payment first (references tagihan)
      await tx.payment.delete({
        where: { id: parseInt(paymentId) }
      });

      // 2. Delete tagihan
      if (payment.tagihanId) {
        await tx.tagihan.delete({
          where: { id: payment.tagihanId }
        });
      }

      // 3. Update riwayatSewa to SELESAI
      if (payment.riwayatSewaId) {
        await tx.riwayatSewa.update({
          where: { id: payment.riwayatSewaId },
          data: { 
            status: 'SELESAI',
            tanggalBerakhir: new Date()
          }
        });

        // 4. Update kamar to TERSEDIA
        if (payment.riwayatSewa?.kamarId) {
          await tx.kamar.update({
            where: { id: payment.riwayatSewa.kamarId },
            data: { status: 'TERSEDIA' }
          });
        }
      }
    });

    return { message: 'Pembayaran berhasil dibatalkan' };
  }
};

/**
 * Get payment summary (counts by status)
 */
const getPaymentSummary = async (userId = null, role = null) => {
  const where = role === 'PENGHUNI' ? { userId } : {};

  const [total, success, pending, failed, expired, cancel] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.count({ where: { ...where, status: 'SUCCESS' } }),
    prisma.payment.count({ where: { ...where, status: 'PENDING' } }),
    prisma.payment.count({ where: { ...where, status: 'FAILED' } }),
    prisma.payment.count({ where: { ...where, status: 'EXPIRED' } }),
    prisma.payment.count({ where: { ...where, status: 'CANCEL' } })
  ]);

  return {
    total,
    success,
    pending,
    failed: failed + expired + cancel
  };
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  handleMidtransNotification,
  verifyPayment,
  checkPaymentStatus,
  syncPaymentStatus,
  cancelPayment,
  getPaymentSummary
};
