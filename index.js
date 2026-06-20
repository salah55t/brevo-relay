const express = require('express');
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BREVO_API_KEY = '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';
const SENDER_EMAIL = 'crackingdz8@gmail.com';
const SENDER_NAME = 'King DZ Forum';

// دالة شحن البريد عبر الـ API الرسمي لبريفو
async function sendToBrevo(to, subject, html, text) {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        "sender": { "name": SENDER_NAME, "email": SENDER_EMAIL },
        "to": [{ "email": to }],
        "subject": subject || "إشعار من المنتدى",
        "htmlContent": html || text,
        "textContent": text || ""
      })
    });
    const data = await response.json();
    console.log('✅ تم تمرير الرسالة بنجاح لـ Brevo:', data.messageId || data);
  } catch (err) {
    console.error('❌ فشل إرسال الـ API لبريفو:', err);
  }
}

// 1. واجهة الويب وعمليات فحص الاتصال (HTTP)
app.post('/send-email', (req, res) => res.json({ success: true, status: "Web service is running" }));
app.all('/', (req, res) => res.send('SMTP Gateway is Live!'));

// تشغيل واجهة الويب على المنفذ الافتراضي ل ريندر
const HTTP_PORT = process.env.PORT || 10000;
app.listen(HTTP_PORT, () => {
  console.log(`🚀 واجهة الويب مستقرة على المنفذ ${HTTP_PORT}`);
});

// 2. بناء خادم الـ SMTP الفعلي لاستقبال طلبات المنتدى المباشرة
const smtpServer = new SMTPServer({
  secure: false, // بدون تشفير معقد ليتناسب مع البيئة الحرة
  disabledCommands: ['AUTH'], // إلغاء الحاجة لاسم مستخدم وكلمة مرور لتسهيل الربط
  onData(stream, session, callback) {
    simpleParser(stream, {}, async (err, parsed) => {
      if (err) {
        console.error('❌ خطأ أثناء تحليل بيانات البريد:', err);
        return callback(err);
      }
      
      const toEmail = parsed.to && parsed.to.text;
      const subject = parsed.subject;
      const html = parsed.html;
      const text = parsed.text;

      console.log(`📦 التقاط رسالة SMTP موجهة إلى: ${toEmail}`);
      if (toEmail) {
        await sendToBrevo(toEmail, subject, html, text);
      }
      return callback();
    });
  }
});

// تشغيل خادم الـ SMTP على المنفذ المستقر 5000
smtpServer.listen(5000, '0.0.0.0', () => {
  console.log('🔒 خادم الـ SMTP المحلي يعمل بنجاح ويستمع على المنفذ 5000');
});
