const axios = require("axios");
const { URLSearchParams } = require('url');
const crypto = require("crypto");
const QRCode = require('qrcode');
const { ImageUploadService } = require('node-upload-images');

// 🧩 CLASS OrderKuota - Versi 26.01.15 (Terbaru)
class OrderKuota {
  static API_URL = 'https://app.orderkuota.com/api/v2';
  static HOST = 'app.orderkuota.com';
  static USER_AGENT = 'okhttp/4.12.0';
  
  // Update Versi Aplikasi Terbaru
  static APP_VERSION_NAME = '26.01.15';
  static APP_VERSION_CODE = '260115';
  
  // Identitas Device (Gunakan yang konsisten)
  static APP_REG_ID = 'cdzXkBynRECkAODZEHwkeV:APA91bHRyLlgNSlpVrC4Yv3xBgRRaePSaCYruHnNwrEK8_pX3kzitxzi0CxIDFc2oztCwcw7-zPgwE-6v_-rJCJdTX8qE_ADiSnWHNeZ5O7_BIlgS_1N8tw';
  static PHONE_MODEL = '23124RA7EO';
  static PHONE_UUID = 'cdzXkBynRECkAODZEHwkeV';
  static PHONE_ANDROID_VERSION = '15'; 

  constructor(username = null, authToken = null) {
    this.username = username;
    this.authToken = authToken;
  }

  // Helper CRC16 untuk QRIS
  static convertCRC16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
      crc ^= str.charCodeAt(c) << 8;
      for (let i = 0; i < 8; i++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      }
    }
    return ("000" + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
  }

  async request(method, url, body = null) {
    try {
      const res = await axios({
        method,
        url,
        headers: {
          'Host': OrderKuota.HOST,
          'User-Agent': OrderKuota.USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept-Encoding': 'gzip'
        },
        data: body ? body.toString() : null
      });
      return res.data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // TAHAP 1: Request OTP
  async loginRequest(username, password) {
    const payload = new URLSearchParams({
      username: username,
      password: password,
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      app_version_name: OrderKuota.APP_VERSION_NAME,
      phone_model: OrderKuota.PHONE_MODEL,
      ui_mode: 'light'
    });
    return await this.request('POST', `${OrderKuota.API_URL}/login`, payload);
  }

  // ✅ FIX TAHAP 2: Get Token (Penukaran OTP)
  async getAuthToken(username, otp) {
    const payload = new URLSearchParams({
      username: username,
      password: otp, // OTP menggantikan password untuk verifikasi
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      app_version_name: OrderKuota.APP_VERSION_NAME,
      phone_model: OrderKuota.PHONE_MODEL,
      ui_mode: 'light'
    });
    return await this.request('POST', `${OrderKuota.API_URL}/login`, payload);
  }

  async getTransactionQris(type = '', userId = null) {
    if (!userId && this.authToken) userId = this.authToken.split(':')[0];
    const payload = new URLSearchParams({
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[qris_history][jumlah]': '',
      'requests[qris_history][jenis]': type,
      'requests[qris_history][page]': '1',
      'requests[0]': 'account',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: 'light',
      phone_model: OrderKuota.PHONE_MODEL
    });
    const endpoint = userId ? `${OrderKuota.API_URL}/qris/mutasi/${userId}` : `${OrderKuota.API_URL}/get`;
    return await this.request('POST', endpoint, payload);
  }

  async generateQr(amount = '') {
    const payload = new URLSearchParams({
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[qris_merchant_terms][jumlah]': amount,
      'requests[0]': 'qris_merchant_terms',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      phone_model: OrderKuota.PHONE_MODEL
    });
    return await this.request('POST', `${OrderKuota.API_URL}/get`, payload);
  }

  async withdrawalQris(amount = '') {
    const payload = new URLSearchParams({
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[qris_withdraw][amount]': amount,
      'requests[0]': 'account',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: 'light',
      phone_model: OrderKuota.PHONE_MODEL
    });
    return await this.request('POST', `${OrderKuota.API_URL}/get`, payload);
  }
}

// 🛠️ INTERNAL HELPERS
async function createQRIS(amount, codeqr) {
  let qrisData = codeqr.slice(0, -4);
  const step1 = qrisData.replace("010211", "010212");
  const step2 = step1.split("5802ID");
  let uang = "54" + ("0" + amount.toString().length).slice(-2) + amount + "5802ID";
  const final = step2[0] + uang + step2[1];
  const result = final + OrderKuota.convertCRC16(final);
  const buffer = await QRCode.toBuffer(result);
  const service = new ImageUploadService('pixhost.to');
  const upload = await service.uploadFromBinary(buffer, 'qris.png');
  return {
    idtransaksi: `KYNAS-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    jumlah: amount,
    expired: new Date(Date.now() + 30 * 60000),
    imageqris: { url: upload.directLink }
  };
}

// 🚀 ROUTE EXPORTS
module.exports = [
  {
    name: "Get OTP (tahap 1)",
    desc: "Minta OTP Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/getotp",
    async run(req, res) {
      const { apikey, username, password } = req.query;
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      try {
        const ok = new OrderKuota();
        const login = await ok.loginRequest(username, password);
        res.json({ status: login.success || !!login.results, result: login.results || login });
      } catch (err) { res.status(500).json({ status: false, error: err.message }); }
    }
  },
  {
    name: "Get Token (tahap 2)",
    desc: "Tukar OTP jadi Token",
    category: "Orderkuota",
    path: "/orderkuota/gettoken",
    async run(req, res) {
      const { apikey, username, otp } = req.query;
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      try {
        const ok = new OrderKuota();
        const login = await ok.getAuthToken(username, otp);
        res.json({ status: login.success, result: login.results || login });
      } catch (err) { res.status(500).json({ status: false, error: err.message }); }
    }
  },
  {
    name: "Cek Mutasi QRIS",
    desc: "Riwayat Transaksi QRIS",
    category: "Orderkuota",
    path: "/orderkuota/mutasiqr",
    async run(req, res) {
      const { apikey, username, token } = req.query;
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      try {
        const ok = new OrderKuota(username, token);
        const data = await ok.getTransactionQris();
        res.json({ status: data.success, result: data.qris_history?.results || data });
      } catch (err) { res.status(500).json({ status: false, error: err.message }); }
    }
  },
  {
    name: "Cek Profile",
    desc: "Informasi Saldo & Akun",
    category: "Orderkuota",
    path: "/orderkuota/profile",
    async run(req, res) {
      const { apikey, username, token } = req.query;
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      try {
        const ok = new OrderKuota(username, token);
        const data = await ok.getTransactionQris();
        res.json({ status: data.success, result: data });
      } catch (err) { res.status(500).json({ status: false, error: err.message }); }
    }
  },
  {
    name: "Create QRIS",
    desc: "Generate QR Payment",
    category: "Orderkuota",
    path: "/orderkuota/createpayment",
    async run(req, res) {
      const { apikey, username, token, amount } = req.query;
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      try {
        const ok = new OrderKuota(username, token);
        const qrcodeResp = await ok.generateQr(amount);
        const rawData = qrcodeResp.qris_merchant_terms?.results?.qris_data || qrcodeResp.qris_data;
        if (!rawData) return res.json({ status: false, error: "Gagal ambil data QRIS", raw: qrcodeResp });
        const finalQr = await createQRIS(amount, rawData);
        res.json({ status: true, result: finalQr });
      } catch (e) { res.json({ status: false, error: e.message }); }
    }
  },
  {
    name: "Withdraw QRIS",
    desc: "Tarik Saldo QRIS",
    category: "Orderkuota",
    path: "/orderkuota/wdqr",
    async run(req, res) {
      const { apikey, username, token, amount } = req.query;
      if (!global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
      try {
        const ok = new OrderKuota(username, token);
        const wd = await ok.withdrawalQris(amount);
        res.json({ status: wd.success, result: wd });
      } catch (error) { res.status(500).json({ status: false, error: error.message }); }
    }
  }
];