const { URLSearchParams } = require('url');
const crypto = require("crypto");
const QRCode = require('qrcode');
const axios = require('axios'); // Ganti fetch dengan axios
const FormData = require('form-data');

// CLASS OrderKuota
class OrderKuota {
  static API_URL = 'https://app.orderkuota.com/api/v2';
  static HOST = 'app.orderkuota.com';
  static USER_AGENT = 'okhttp/4.12.0';
  static APP_VERSION_NAME = '25.09.18';
  static APP_VERSION_CODE = '250918';
  static APP_REG_ID = 'cdzXkBynRECkAODZEHwkeV:APA91bHRyLlgNSlpVrC4Yv3xBgRRaePSaCYruHnNwrEK8_pX3kzitxzi0CxIDFc2oztCwcw7-zPgwE-6v_-rJCJdTX8qE_ADiSnWHNeZ5O7_BIlgS_1N8tw';

  constructor(username = null, authToken = null) {
    this.username = username;
    this.authToken = authToken;
  }

  buildHeaders() {
    return {
      'Host': OrderKuota.HOST,
      'User-Agent': OrderKuota.USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'gzip',
      'Connection': 'keep-alive'
    };
  }

  async loginRequest(username, password) {
    const payload = new URLSearchParams({
      username,
      password,
      request_time: Date.now().toString(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: '15',
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: 'cdzXkBynRECkAODZEHwkeV'
    });

    return await this.request('POST', `${OrderKuota.API_URL}/login`, payload);
  }

  async getAuthToken(username, otp) {
    const payload = new URLSearchParams({
      username,
      password: otp,
      request_time: Date.now().toString(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: '15',
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: 'cdzXkBynRECkAODZEHwkeV'
    });

    return await this.request('POST', `${OrderKuota.API_URL}/login`, payload);
  }

  async generateQr(amount = '') {
    const payload = new URLSearchParams({
      request_time: Date.now().toString(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: '15',
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: 'cdzXkBynRECkAODZEHwkeV',
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[qris_merchant_terms][jumlah]': amount,
      'requests[0]': 'qris_merchant_terms',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      phone_model: '23124RA7EO'
    });

    return await this.request('POST', `${OrderKuota.API_URL}/get`, payload);
  }

  async getTransactionQris() {
    const payload = new URLSearchParams({
      request_time: Date.now().toString(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: '15',
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: 'cdzXkBynRECkAODZEHwkeV',
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[qris_history][jumlah]': '',
      'requests[qris_history][jenis]': '',
      'requests[qris_history][page]': '1',
      'requests[qris_history][dari_tanggal]': '',
      'requests[qris_history][ke_tanggal]': '',
      'requests[qris_history][keterangan]': '',
      'requests[0]': 'account',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: 'light',
      phone_model: '23124RA7EO'
    });

    return await this.request('POST', `${OrderKuota.API_URL}/get`, payload);
  }

  async withdrawalQris(amount = '') {
    const payload = new URLSearchParams({
      request_time: Date.now().toString(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: '15',
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: 'cdzXkBynRECkAODZEHwkeV',
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[qris_withdraw][amount]': amount,
      'requests[0]': 'account',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: 'light',
      phone_model: '23124RA7EO'
    });

    return await this.request('POST', `${OrderKuota.API_URL}/get`, payload);
  }

  async request(method, url, body) {
    try {
      const response = await axios({
        method,
        url,
        headers: this.buildHeaders(),
        data: body.toString(),
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error('OrderKuota API Error:', error.message);
      return { 
        success: false, 
        error: error.message,
        ...(error.response && { status: error.response.status })
      };
    }
  }
}

// Helper Functions
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

function generateTransactionId() {
  return `KYNAS-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function generateExpirationTime() {
  return new Date(Date.now() + 30 * 60 * 1000); // 30 menit dari sekarang
}

async function uploadImageToPixhost(buffer) {
  try {
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: 'qrcode.png',
      contentType: 'image/png'
    });

    const response = await axios.post('https://api.pixhost.to/images', formData, {
      headers: {
        ...formData.getHeaders(),
        'Accept': 'application/json'
      }
    });

    if (response.data && response.data.success) {
      return `https://img.pixhost.to/images/${response.data.files[0].file_id}.png`;
    }
    return null;
  } catch (error) {
    console.error('Upload error:', error.message);
    return null;
  }
}

async function createQRIS(amount, codeqr) {
  try {
    let qrisData = codeqr;
    qrisData = qrisData.slice(0, -4);
    const step1 = qrisData.replace("010211", "010212");
    const step2 = step1.split("5802ID");
    
    if (step2.length < 2) {
      throw new Error('Invalid QRIS data format');
    }
    
    const amountStr = amount.toString();
    const amountLength = amountStr.length.toString().padStart(2, '0');
    const uang = `54${amountLength}${amountStr}5802ID`;
    
    const final = step2[0] + uang + step2[1];
    const crc = convertCRC16(final);
    const result = final + crc;
    
    // Generate QR Code
    const qrBuffer = await QRCode.toBuffer(result, {
      width: 500,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Upload image
    const imageUrl = await uploadImageToPixhost(qrBuffer);
    
    return {
      idtransaksi: generateTransactionId(),
      jumlah: amountStr,
      expired: generateExpirationTime(),
      imageqris: { 
        url: imageUrl || 'https://via.placeholder.com/500?text=QR+Code+Generated',
        qr_data: result 
      }
    };
  } catch (error) {
    console.error('Create QRIS error:', error);
    throw error;
  }
}

// ROUTE EXPORT
module.exports = [
  {
    name: "Get OTP Orderkuota",
    desc: "Get OTP untuk login Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/getotp?apikey=&username=&password=",
    async run(req, res) {
      try {
        const { apikey, username, password } = req.query;
        
        if (!global.apikey.includes(apikey)) {
          return res.json({ 
            status: false, 
            error: 'Invalid API Key',
            message: 'Gunakan apikey yang valid'
          });
        }
        
        if (!username || !password) {
          return res.json({ 
            status: false, 
            error: 'Parameter tidak lengkap',
            required: ['username', 'password']
          });
        }
        
        const ok = new OrderKuota();
        const result = await ok.loginRequest(username, password);
        
        res.json({ 
          status: true, 
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({ 
          status: false, 
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
  },
  {
    name: "Get Token Orderkuota",
    desc: "Get Token dengan OTP",
    category: "Orderkuota",
    path: "/orderkuota/gettoken?apikey=&username=&otp=",
    async run(req, res) {
      try {
        const { apikey, username, otp } = req.query;
        
        if (!global.apikey.includes(apikey)) {
          return res.json({ status: false, error: 'Invalid API Key' });
        }
        
        if (!username || !otp) {
          return res.json({ status: false, error: 'Missing parameters' });
        }
        
        const ok = new OrderKuota();
        const result = await ok.getAuthToken(username, otp);
        
        res.json({ 
          status: true, 
          result,
          note: result.success ? 'Token berhasil didapatkan' : 'Gagal mendapatkan token'
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    }
  },
  {
    name: "Create QRIS Payment",
    desc: "Generate QR Code untuk pembayaran",
    category: "Orderkuota",
    path: "/orderkuota/createpayment?apikey=&username=&token=&amount=",
    async run(req, res) {
      try {
        const { apikey, username, token, amount } = req.query;
        
        if (!global.apikey.includes(apikey)) {
          return res.json({ status: false, error: 'Invalid API Key' });
        }
        
        if (!username || !token || !amount) {
          return res.json({ 
            status: false, 
            error: 'Missing parameters',
            required: ['username', 'token', 'amount']
          });
        }
        
        const ok = new OrderKuota(username, token);
        const qrResponse = await ok.generateQr(amount);
        
        if (!qrResponse || !qrResponse.success) {
          return res.json({
            status: false,
            error: 'Gagal generate QR dari Orderkuota',
            details: qrResponse
          });
        }
        
        const qrisData = qrResponse.qris_merchant_terms?.results?.qris_data;
        if (!qrisData) {
          return res.json({
            status: false,
            error: 'QRIS data tidak ditemukan',
            raw: qrResponse
          });
        }
        
        const qrResult = await createQRIS(amount, qrisData);
        
        res.json({
          status: true,
          message: 'QRIS berhasil dibuat',
          result: qrResult,
          raw: qrResponse
        });
      } catch (error) {
        console.error('Create QRIS route error:', error);
        res.status(500).json({ 
          status: false, 
          error: error.message 
        });
      }
    }
  }
];