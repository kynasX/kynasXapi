const crypto = require("crypto");
const QRCode = require('qrcode');
const { ImageUploadService } = require('node-upload-images');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// =====================================
//           CORE LOGIC CLASS
// =====================================
class OrderKuota {
  static API_URL = 'https://app.orderkuota.com/api/v2';
  static HOST = 'app.orderkuota.com';
  static USER_AGENT = 'okhttp/4.12.0';
  static APP_VERSION_NAME = '25.09.18';
  static APP_VERSION_CODE = '250918';
  static APP_REG_ID = 'cdzXkBynRECkAODZEHwkeV:APA91bHRyLlgNSlpVrC4Yv3xBgRRaePSaCYruHnNwrEK8_pX3kzitxzi0CxIDFc2oztCwcw7-zPgwE-6v_-rJCJdTX8qE_ADiSnWHNeZ5O7_BIlgS_1N8tw';
  static PHONE_MODEL = 'SM-G960N';
  static PHONE_UUID = 'cdzXkBynRECkAODZEHwkeV';
  static PHONE_ANDROID_VERSION = '9'; 

  constructor(username = null, authToken = null) {
    this.username = username;
    this.authToken = authToken;
  }

  async loginRequest(username, password) {
    const payload = new URLSearchParams({
      username, password,
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID
    });
    return await this.request('POST', `${OrderKuota.API_URL}/login`, payload);
  }

  async getAuthToken(username, otp) {
    const payload = new URLSearchParams({
      username, password: otp,
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID
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
      'requests[qris_history][dari_tanggal]': '',
      'requests[qris_history][ke_tanggal]': '',
      'requests[qris_history][keterangan]': '',
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
      ui_mode: 'light',
      phone_model: OrderKuota.PHONE_MODEL
    });
    const response = await this.request('POST', `${OrderKuota.API_URL}/get`, payload);
    return (response.success && response.qris_merchant_terms?.results) ? response.qris_merchant_terms.results : response;
  }

  async request(method, url, body = null) {
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Host': OrderKuota.HOST,
          'User-Agent': OrderKuota.USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body ? body.toString() : null,
      });
      return await res.json();
    } catch (err) { return { error: err.message }; }
  }
}

// =====================================
//          UTILITY FUNCTIONS
// =====================================
function convertCRC16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return ("000" + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
}

async function createQRIS(amount, codeqr) {
  let qrisData = codeqr.slice(0, -4).replace("010211", "010212");
  let step2 = qrisData.split("5802ID");
  let uang = "54" + ("0" + amount.toString().length).slice(-2) + amount + "5802ID";
  let final = step2[0] + uang + step2[1];
  let result = final + convertCRC16(final);
  
  const buffer = await QRCode.toBuffer(result);
  const service = new ImageUploadService('pixhost.to');
  const { directLink } = await service.uploadFromBinary(buffer, 'qris.png');
  
  return {
    idtransaksi: `Z7-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    jumlah: amount,
    expired: new Date(Date.now() + 30 * 60000),
    imageqris: directLink
  };
}

// =====================================
//          EXPORTED ROUTES
// =====================================
// Sistem index.js Anda akan otomatis membaca array ini
module.exports = [
  {
    name: "Get OTP",
    desc: "Mendapatkan OTP login OrderKuota",
    category: "OrderKuota",
    path: "/orderkuota/getotp",
    run: async (req, res) => {
      const { username, password } = req.query;
      if (!username || !password) return res.json({ status: false, message: "Input required" });
      const ok = new OrderKuota();
      const result = await ok.loginRequest(username, password);
      res.json({ status: true, result: result.results });
    }
  },
  {
    name: "Get Token",
    desc: "Tukarkan OTP menjadi Auth Token",
    category: "OrderKuota",
    path: "/orderkuota/gettoken",
    run: async (req, res) => {
      const { username, otp } = req.query;
      if (!username || !otp) return res.json({ status: false, message: "Input required" });
      const ok = new OrderKuota();
      const result = await ok.getAuthToken(username, otp);
      res.json({ status: true, result: result.results });
    }
  },
  {
    name: "Create Payment",
    desc: "Generate QRIS Dynamic OrderKuota",
    category: "OrderKuota",
    path: "/orderkuota/createpayment",
    run: async (req, res) => {
      const { username, token, amount } = req.query;
      if (!username || !token || !amount) return res.json({ status: false, message: "Input required" });
      try {
        const ok = new OrderKuota(username, token);
        const qrData = await ok.generateQr(amount);
        if (!qrData.qris_data) return res.json({ status: false, error: "Failed to fetch QR data" });
        const finalQr = await createQRIS(amount, qrData.qris_data);
        res.json({ status: true, result: finalQr });
      } catch (e) { res.json({ status: false, error: e.message }); }
    }
  },
  {
    name: "Cek Mutasi",
    desc: "Cek riwayat transaksi QRIS",
    category: "OrderKuota",
    path: "/orderkuota/mutasiqr",
    run: async (req, res) => {
      const { username, token } = req.query;
      if (!username || !token) return res.json({ status: false, message: "Input required" });
      const ok = new OrderKuota(username, token);
      const history = await ok.getTransactionQris();
      res.json({ status: true, result: history.qris_history?.results || [] });
    }
  }
];