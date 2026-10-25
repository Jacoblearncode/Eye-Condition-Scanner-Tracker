import type { Translations } from './en';

// Bahasa Malaysia. DRAFT translation: it has NOT been reviewed by a fluent speaker or a clinician.
// The safety-critical parts MUST be reviewed before anyone else uses the app (PLAN.md 0.11, Q16):
//   redFlags.*, redFlagAlert.*, disclaimer, onboarding.body, onboarding.consent, symptoms.items.*
// Typed as `Translations`, so a missing or extra key is a compile error.
export const ms: Translations = {
  common: {
    done: 'Selesai',
    back: 'Kembali',
  },
  disclaimer:
    'Aplikasi ini ialah alat bantuan untuk memantau pemulihan dan tidak menggantikan diagnosis perubatan. Sentiasa ikut nasihat doktor anda.',
  onboarding: {
    title: 'Sebelum anda bermula',
    languageLabel: 'Bahasa',
    body:
      'EyeChecker menyimpan foto mata, laporan gejala dan garis masa pemulihan anda pada telefon ini. Tiada apa-apa dihantar kepada sesiapa melainkan anda memilih untuk berkongsi. Ini hanyalah alat bantuan kemajuan — ia tidak menggantikan diagnosis atau nasihat doktor anda.',
    consent: 'Saya faham bagaimana maklumat saya disimpan dan saya bersetuju untuk meneruskan',
    continue: 'Teruskan',
  },
  home: {
    greeting: 'Helo',
    statusLabel: 'Status Pemulihan',
    status: 'Di Landasan Betul',
    statusDetail: 'Hari ke-12 · Jangkaan pemulihan: baki 2 minggu',
    scan: 'Imbas',
    settings: 'Tetapan',
  },
  scan: {
    permission: 'Kami memerlukan akses kamera untuk mengambil foto mata anda.',
    grant: 'Beri Kebenaran',
    retake: 'Ambil Semula',
    usePhoto: 'Guna Foto',
  },
  symptoms: {
    title: 'Bagaimana perasaan anda hari ini?',
    subtitle: 'Pilih semua yang berkenaan',
    emergency: 'Gejala kecemasan',
    next: 'Seterusnya',
    saveFailed: 'Imbasan anda tidak dapat disimpan. Sila cuba lagi.',
    items: {
      redness: 'Mata merah atau kemerah-merahan',
      watering: 'Mata berair',
      discharge_crusting: 'Tahi mata pekat atau berkerak',
      itching_burning: 'Rasa gatal atau pedih seperti terbakar',
      light_sensitivity: 'Sensitif terhadap cahaya',
      blurred_vision: 'Penglihatan kabur',
      lid_swelling: 'Kelopak mata bengkak',
      foreign_body: 'Rasa seperti ada benda asing dalam mata',
    },
  },
  redFlags: {
    sudden_vision_loss: {
      label: 'Kehilangan penglihatan secara tiba-tiba (sebahagian atau sepenuhnya)',
      message:
        'Pergi ke jabatan kecemasan hospital yang paling hampir dengan segera. Jangan tunggu maklum balas aplikasi.',
    },
    flashing_lights_floaters: {
      label: 'Kilatan cahaya atau bintik terapung (floaters) bertambah secara mendadak',
      message: 'Mungkin retina tertanggal (retinal detachment) — rawatan kecemasan diperlukan.',
    },
    severe_pain_after_injury: {
      label: 'Sakit mata yang teruk selepas kecederaan atau hentaman',
      message: 'Jangan gosok atau tekan mata. Dapatkan rawatan kecemasan.',
    },
    chemical_exposure: {
      label: 'Mata terdedah kepada bahan kimia',
      message: 'Bilas dengan air selama 15 minit. Hubungi perkhidmatan kecemasan.',
    },
    sharp_object_injury: {
      label: 'Kecederaan pada mata akibat objek tajam',
      message: 'Jangan sentuh atau gosok. Pergi ke bilik kecemasan dengan segera.',
    },
  },
  redFlagAlert: {
    headline: 'Dapatkan Rawatan Kecemasan Sekarang',
    call: 'Hubungi Perkhidmatan Kecemasan',
    hospital: 'Cari Hospital Terdekat',
    dismiss: 'Saya faham, teruskan ke aplikasi',
  },
  saved: {
    title: 'Imbasan disimpan pada telefon ini',
    body: 'Foto dan gejala anda disimpan pada peranti ini sahaja. Tiada apa-apa dimuat naik atau dihantar kepada sesiapa.',
  },
  settings: {
    title: 'Tetapan',
    language: 'Bahasa',
    languageSystem: 'Guna bahasa telefon',
  },
};
