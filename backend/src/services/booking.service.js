const prisma = require('../config/database');
const { generateCode } = require('../utils/helpers');

/**
 * Create a room booking (self-service rental)
 * Creates RiwayatSewa + initial Tagihan
 */
const createBooking = async (userId, kamarId, durasiSewa) => {
  // Validate duration
  if (!durasiSewa || durasiSewa < 1 || durasiSewa > 24) {
    throw { statusCode: 400, message: 'Durasi sewa harus antara 1-24 bulan' };
  }

  // Get kamar
  const kamar = await prisma.kamar.findUnique({
    where: { id: parseInt(kamarId) }
  });

  if (!kamar) {
    throw { statusCode: 404, message: 'Kamar tidak ditemukan' };
  }

  if (kamar.status !== 'TERSEDIA') {
    throw { statusCode: 400, message: 'Kamar tidak tersedia untuk disewa' };
  }

  if (!kamar.hargaPerBulan) {
    throw { statusCode: 400, message: 'Harga kamar belum ditentukan' };
  }

  // Check if user already has active rental
  const userActiveRental = await prisma.riwayatSewa.findFirst({
    where: {
      userId: parseInt(userId),
      status: 'AKTIF'
    }
  });

  if (userActiveRental) {
    throw { statusCode: 400, message: 'Anda sudah memiliki sewa aktif. Selesaikan dahulu sebelum menyewa kamar lain.' };
  }

  // Check if kamar already has active rental
  const kamarActiveRental = await prisma.riwayatSewa.findFirst({
    where: {
      kamarId: parseInt(kamarId),
      status: 'AKTIF'
    }
  });

  if (kamarActiveRental) {
    throw { statusCode: 400, message: 'Kamar ini sedang disewa oleh penghuni lain.' };
  }

  // Calculate dates
  const tanggalMulai = new Date();
  const tanggalBerakhir = new Date();
  tanggalBerakhir.setMonth(tanggalBerakhir.getMonth() + parseInt(durasiSewa));

  // Calculate total amount
  const totalHarga = parseFloat(kamar.hargaPerBulan) * parseInt(durasiSewa);

  // Create booking in transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create RiwayatSewa
    const kodeSewa = generateCode('SWA');
    const riwayatSewa = await tx.riwayatSewa.create({
      data: {
        kodeSewa,
        userId: parseInt(userId),
        kamarId: parseInt(kamarId),
        tanggalMulai,
        tanggalBerakhir,
        hargaSewa: kamar.hargaPerBulan,
        status: 'AKTIF',
        durasiBulan: parseInt(durasiSewa)
      }
    });

    // 2. Update kamar status to TERISI immediately
    await tx.kamar.update({
      where: { id: parseInt(kamarId) },
      data: { status: 'TERISI' }
    });

    // 3. Create initial Tagihan for payment
    const nomorTagihan = generateCode('TGH');
    const tagihan = await tx.tagihan.create({
      data: {
        nomorTagihan,
        userId: parseInt(userId),
        riwayatSewaId: riwayatSewa.id,
        jenisTagihan: 'SEWA',
        nominal: totalHarga,
        tanggalJatuhTempo: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day to pay
        status: 'BELUM_LUNAS',
        keterangan: `Pembayaran sewa kamar ${kamar.namaKamar} untuk ${durasiSewa} bulan`
      }
    });

    // 3. Reserve the kamar (will be fully TERISI after payment confirmed)
    // For now, keep it TERSEDIA until payment confirmed

    return {
      riwayatSewa,
      tagihan,
      kamar,
      durasiSewa: parseInt(durasiSewa),
      totalHarga
    };
  });

  return result;
};

/**
 * Confirm booking after payment
 * Called when payment is successful
 */
const confirmBooking = async (riwayatSewaId) => {
  const riwayatSewa = await prisma.riwayatSewa.findUnique({
    where: { id: parseInt(riwayatSewaId) },
    include: { kamar: true }
  });

  if (!riwayatSewa) {
    throw { statusCode: 404, message: 'Booking tidak ditemukan' };
  }

  // Update in transaction
  await prisma.$transaction(async (tx) => {
    // 1. Activate the rental
    await tx.riwayatSewa.update({
      where: { id: parseInt(riwayatSewaId) },
      data: { status: 'AKTIF' }
    });

    // 2. Update kamar status to TERISI
    await tx.kamar.update({
      where: { id: riwayatSewa.kamarId },
      data: { status: 'TERISI' }
    });
  });

  return { message: 'Booking berhasil dikonfirmasi' };
};

/**
 * Extend an active rental
 * Creates extension tagihan - tanggalBerakhir will be updated after payment success
 */
const extendRental = async (riwayatSewaId, durasiPerpanjangan, userId) => {
  // Validate duration
  if (!durasiPerpanjangan || durasiPerpanjangan < 1 || durasiPerpanjangan > 12) {
    throw { statusCode: 400, message: 'Durasi perpanjangan harus antara 1-12 bulan' };
  }

  // Get riwayatSewa with kamar info
  const riwayatSewa = await prisma.riwayatSewa.findUnique({
    where: { id: parseInt(riwayatSewaId) },
    include: { 
      kamar: true,
      user: { select: { id: true, name: true } }
    }
  });

  if (!riwayatSewa) {
    throw { statusCode: 404, message: 'Data sewa tidak ditemukan' };
  }

  // Validate ownership - user must own this rental
  if (riwayatSewa.userId !== parseInt(userId)) {
    throw { statusCode: 403, message: 'Anda tidak memiliki akses untuk memperpanjang sewa ini' };
  }

  // Validate status - must be AKTIF
  if (riwayatSewa.status !== 'AKTIF') {
    throw { statusCode: 400, message: 'Hanya sewa aktif yang dapat diperpanjang' };
  }

  // Calculate new end date (for display/estimation only)
  const currentEndDate = new Date(riwayatSewa.tanggalBerakhir);
  const estimatedNewEndDate = new Date(currentEndDate);
  estimatedNewEndDate.setMonth(estimatedNewEndDate.getMonth() + parseInt(durasiPerpanjangan));

  // Calculate extension cost
  const hargaPerBulan = parseFloat(riwayatSewa.hargaSewa || riwayatSewa.kamar.hargaPerBulan);
  const totalBiaya = hargaPerBulan * parseInt(durasiPerpanjangan);

  // Create tagihan only - tanggalBerakhir will be updated after payment success
  const nomorTagihan = generateCode('TGH');
  const tagihan = await prisma.tagihan.create({
    data: {
      nomorTagihan,
      userId: parseInt(userId),
      riwayatSewaId: parseInt(riwayatSewaId),
      jenisTagihan: 'SEWA',
      nominal: totalBiaya,
      tanggalJatuhTempo: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day to pay
      status: 'BELUM_LUNAS',
      keterangan: `Perpanjangan sewa kamar ${riwayatSewa.kamar.namaKamar} untuk ${durasiPerpanjangan} bulan`
    }
  });

  return {
    riwayatSewa,
    tagihan,
    durasiPerpanjangan: parseInt(durasiPerpanjangan),
    totalBiaya,
    tanggalBerakhirSaatIni: currentEndDate,
    estimasiTanggalBerakhirBaru: estimatedNewEndDate
  };
};

/**
 * Move tenant to a different room (Pindah Kamar)
 * - Closes old rental
 * - Creates new rental for new room
 * - If new room is MORE expensive, creates prorated adjustment invoice
 * - If new room is CHEAPER or same, no credit given
 */
const pindahKamar = async (riwayatSewaId, newKamarId, tanggalPindah = null) => {
  const moveDate = tanggalPindah ? new Date(tanggalPindah) : new Date();
  
  // Get current rental with kamar info
  const currentRental = await prisma.riwayatSewa.findUnique({
    where: { id: parseInt(riwayatSewaId) },
    include: { 
      kamar: true,
      user: { select: { id: true, name: true, email: true } }
    }
  });

  if (!currentRental) {
    throw { statusCode: 404, message: 'Data sewa tidak ditemukan' };
  }

  if (currentRental.status !== 'AKTIF') {
    throw { statusCode: 400, message: 'Hanya sewa aktif yang dapat dipindahkan' };
  }

  // Get new kamar
  const newKamar = await prisma.kamar.findUnique({
    where: { id: parseInt(newKamarId) }
  });

  if (!newKamar) {
    throw { statusCode: 404, message: 'Kamar tujuan tidak ditemukan' };
  }

  if (newKamar.id === currentRental.kamarId) {
    throw { statusCode: 400, message: 'Kamar tujuan sama dengan kamar saat ini' };
  }

  if (newKamar.status !== 'TERSEDIA') {
    throw { statusCode: 400, message: 'Kamar tujuan tidak tersedia' };
  }

  if (!newKamar.hargaPerBulan) {
    throw { statusCode: 400, message: 'Harga kamar tujuan belum ditentukan' };
  }

  // Calculate remaining days until rental end date (periode akhir sewa)
  const today = new Date(moveDate);
  const oldEndDate = new Date(currentRental.tanggalBerakhir);
  
  // Calculate days from move date to original rental end date
  const remainingDays = Math.max(0, Math.ceil((oldEndDate - today) / (1000 * 60 * 60 * 24)));
  
  // Use 30 days as standard month for daily rate calculation
  const daysPerMonth = 30;

  // Calculate daily rates (based on 30 days/month)
  const oldHarga = parseFloat(currentRental.hargaSewa || currentRental.kamar.hargaPerBulan);
  const newHarga = parseFloat(newKamar.hargaPerBulan);
  const oldDailyRate = oldHarga / daysPerMonth;
  const newDailyRate = newHarga / daysPerMonth;

  // Calculate prorated difference for remaining rental period
  const dailyDifference = newDailyRate - oldDailyRate;
  const proratedDifference = Math.round(dailyDifference * remainingDays);

  // Calculate remaining months from old rental
  const monthsRemaining = Math.max(0, 
    (oldEndDate.getFullYear() - moveDate.getFullYear()) * 12 + 
    (oldEndDate.getMonth() - moveDate.getMonth())
  );

  // New rental end date (same as old rental end date by default)
  const newEndDate = new Date(oldEndDate);

  // Execute transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Close current rental
    await tx.riwayatSewa.update({
      where: { id: parseInt(riwayatSewaId) },
      data: {
        status: 'SELESAI',
        tanggalBerakhir: moveDate,
        catatan: `Pindah ke kamar ${newKamar.namaKamar} pada ${moveDate.toLocaleDateString('id-ID')}`
      }
    });

    // 2. Update old kamar status to TERSEDIA
    await tx.kamar.update({
      where: { id: currentRental.kamarId },
      data: { status: 'TERSEDIA' }
    });

    // 3. Create new rental for new kamar
    const kodeSewa = generateCode('SWA');
    const newRental = await tx.riwayatSewa.create({
      data: {
        kodeSewa,
        userId: currentRental.userId,
        kamarId: parseInt(newKamarId),
        tanggalMulai: moveDate,
        tanggalBerakhir: newEndDate,
        hargaSewa: newKamar.hargaPerBulan,
        durasiBulan: monthsRemaining || 1,
        status: 'AKTIF',
        catatan: `Pindahan dari kamar ${currentRental.kamar.namaKamar}`
      }
    });

    // 4. Update new kamar status to TERISI
    await tx.kamar.update({
      where: { id: parseInt(newKamarId) },
      data: { status: 'TERISI' }
    });

    // 5. If new room is MORE expensive, create adjustment invoice
    let adjustmentTagihan = null;
    if (proratedDifference > 0) {
      const nomorTagihan = generateCode('TGH');
      adjustmentTagihan = await tx.tagihan.create({
        data: {
          nomorTagihan,
          userId: currentRental.userId,
          riwayatSewaId: newRental.id,
          jenisTagihan: 'SELISIH_PINDAH_KAMAR',
          nominal: proratedDifference,
          tanggalJatuhTempo: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
          status: 'BELUM_LUNAS',
          keterangan: `Selisih harga pindah kamar dari ${currentRental.kamar.namaKamar} ke ${newKamar.namaKamar} (${remainingDays} hari sisa periode sewa s/d ${oldEndDate.toLocaleDateString('id-ID')})`
        }
      });
    }

    return {
      oldRental: currentRental,
      newRental,
      adjustmentTagihan,
      calculation: {
        moveDate: moveDate.toISOString(),
        rentalEndDate: oldEndDate.toISOString(),
        remainingDays,
        daysPerMonth,
        oldKamar: {
          name: currentRental.kamar.namaKamar,
          hargaPerBulan: oldHarga,
          dailyRate: Math.round(oldDailyRate)
        },
        newKamar: {
          name: newKamar.namaKamar,
          hargaPerBulan: newHarga,
          dailyRate: Math.round(newDailyRate)
        },
        dailyDifference: Math.round(dailyDifference),
        proratedDifference,
        hasAdjustment: proratedDifference > 0
      }
    };
  });

  return result;
};

/**
 * Preview room transfer calculation (without actually moving)
 */
const previewPindahKamar = async (riwayatSewaId, newKamarId, tanggalPindah = null) => {
  const moveDate = tanggalPindah ? new Date(tanggalPindah) : new Date();
  
  // Get current rental
  const currentRental = await prisma.riwayatSewa.findUnique({
    where: { id: parseInt(riwayatSewaId) },
    include: { kamar: true }
  });

  if (!currentRental) {
    throw { statusCode: 404, message: 'Data sewa tidak ditemukan' };
  }

  // Get new kamar
  const newKamar = await prisma.kamar.findUnique({
    where: { id: parseInt(newKamarId) }
  });

  if (!newKamar) {
    throw { statusCode: 404, message: 'Kamar tujuan tidak ditemukan' };
  }

  // Calculate remaining days until rental end date (periode akhir sewa)
  const today = new Date(moveDate);
  const oldEndDate = new Date(currentRental.tanggalBerakhir);
  const remainingDays = Math.max(0, Math.ceil((oldEndDate - today) / (1000 * 60 * 60 * 24)));
  const daysPerMonth = 30;

  const oldHarga = parseFloat(currentRental.hargaSewa || currentRental.kamar.hargaPerBulan);
  const newHarga = parseFloat(newKamar.hargaPerBulan);
  const oldDailyRate = oldHarga / daysPerMonth;
  const newDailyRate = newHarga / daysPerMonth;
  const dailyDifference = newDailyRate - oldDailyRate;
  const proratedDifference = Math.round(dailyDifference * remainingDays);

  return {
    moveDate: moveDate.toISOString(),
    rentalEndDate: oldEndDate.toISOString(),
    remainingDays,
    daysPerMonth,
    oldKamar: {
      id: currentRental.kamar.id,
      name: currentRental.kamar.namaKamar,
      hargaPerBulan: oldHarga,
      dailyRate: Math.round(oldDailyRate)
    },
    newKamar: {
      id: newKamar.id,
      name: newKamar.namaKamar,
      hargaPerBulan: newHarga,
      dailyRate: Math.round(newDailyRate)
    },
    dailyDifference: Math.round(dailyDifference),
    proratedDifference: proratedDifference > 0 ? proratedDifference : 0,
    hasAdjustment: proratedDifference > 0,
    adjustmentMessage: proratedDifference > 0 
      ? `Tagihan selisih Rp ${proratedDifference.toLocaleString('id-ID')} akan dibuat (${remainingDays} hari sisa periode sewa)`
      : 'Tidak ada tagihan selisih (kamar baru lebih murah atau sama)'
  };
};

module.exports = {
  createBooking,
  confirmBooking,
  extendRental,
  pindahKamar,
  previewPindahKamar
};
