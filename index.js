const express = require('express');
const app = express();

// تفعيل قراءة البيانات بصيغة الويب الممررة من إضافة المنتدى
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BREVO_API_KEY = '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';
const SENDER_EMAIL = 'crackingdz8@gmail.com';
const SENDER_NAME = 'King DZ Forum';

// دالة شحن البريد عبر الـ API الرسمي لبريفو إلى المستقبل الحقيقي
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
        "to": [{ "email": to.trim() }], // تنظيف الحقل تماماً لضمان وصوله لإيميلك بضبط
        "subject": subject || "إشعار من منتدى King DZ",
        "htmlContent": html || text || "رسالة اختبارية",
        "textContent": text || ""
      })
    });
    const data = await response.json();
    console.log(`✅ تم تمرير الرسالة بنجاح إلى البريد الحقيقي [${to}]:`, data.messageId || data);
    return true;
  } catch (err) {
    console.error('❌ فشل إرسال الـ API لبريفو:', err);
    return false;
  }
}

// استقبال طلبات إضافة Mailgun مباشرة من المنتدى عبر المنفذ العام 10000
app.post('/v3/:domain/messages', async (req, res) => {
  console.log(`📦 التقاط طلب ويب عام من المنتدى...`);
  
  // استخراج البيانات الديناميكية التي أرسلتها أنت الآن من لوحة التحكم
  const toEmail = req.body.to;
  const subject = req.body.subject;
  const html = req.body.html;
  const text = req.body.text;

  console.log(`📨 الإيميل المستهدف الملتقط هو: ${toEmail}`);

  if (toEmail) {
    const success = await sendToBrevo(toEmail, subject, html, text);
    if (success) {
      return res.json({
        id: `<${Date.now()}@brevo-relay.onrender.com>`,
        message: "Queued. Thank you."
      });
    }
  }
  
  return res.status(500).json({ message: "Failed to process email Gateway" });
});

app.all('/', (req, res) => res.send('HTTP Mailgun Gateway is Live and Public!'));

const HTTP_PORT = process.env.PORT || 10000;
app.listen(HTTP_PORT, () => {
  console.log(`🚀 الجسر يعمل بكفاءة كاملة على المنفذ العام المفتوح ${HTTP_PORT}`);
});

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
