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
      tanggalJatuhTempo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days to pay
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

module.exports = {
  createBooking,
  confirmBooking,
  extendRental
};
