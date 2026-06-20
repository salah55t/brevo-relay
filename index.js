const express = require('express');
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');

const app = express();

const BREVO_API_KEY = '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';
const SENDER_EMAIL = 'crackingdz8@gmail.com';
const SENDER_NAME = 'King DZ Forum';

// 1. واجهة الويب لاستقبال طلبات الكرون جوب (تمنع السيرفر من النوم)
app.get('/', (req, res) => {
  console.log('⏰ تم استقبال طلب Ping من الكرون جوب بنجاح والسيرفر مستيقظ!');
  res.status(200).send('Server is Alive and Awake!');
});

const WEB_PORT = process.env.PORT || 10000;
app.listen(WEB_PORT, () => {
  console.log(`🌐 واجهة الويب مستقرة على المنفذ العام ${WEB_PORT}`);
});

// دالة تمرير البريد لبريفو
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
        "to": [{ "email": to.trim() }],
        "subject": subject || "إشعار من المنتدى",
        "htmlContent": html || text || "رسالة اختبارية",
        "textContent": text || ""
      })
    });
    await response.json();
    console.log(`✅ تم تمرير البريد بنجاح للمستقبل الحقيقي: [${to}]`);
  } catch (err) {
    console.error('❌ فشل إرسال الـ API لبريفو:', err);
  }
}

// 2. سيرفر الـ SMTP الحقيقي على المنفذ 5000 مع تفعيل تخطي التحقق (Auth)
const smtpServer = new SMTPServer({
  // السماح بمرور الطلب حتى لو أرسل المنتدى اسم مستخدم وكلمة مرور عشوائية
  onAuth(auth, session, callback) {
    return callback(null, { user: 1 }); 
  },
  disabledCommands: ['STARTTLS'],
  onData(stream, session, callback) {
    simpleParser(stream, {}, async (err, parsed) => {
      if (err) {
        console.error("❌ فشل تحليل الرسالة القادمة:", err);
        return callback(err);
      }

      // قراءة المستقبل الحقيقي من حزمة الـ SMTP القادمة من المنتدى
      const dynamicTo = parsed.to && parsed.to.text ? parsed.to.text : null;
      console.log(`📨 تم التقاط طلب SMTP للمستقبل: ${dynamicTo}`);

      if (dynamicTo) {
        await sendToBrevo(dynamicTo, parsed.subject, parsed.html, parsed.text);
      } else {
        await sendToBrevo(SENDER_EMAIL, parsed.subject, parsed.html, parsed.text);
      }
      callback();
    });
  }
});

// تشغيل سيرفر الـ SMTP داخلياً
smtpServer.listen(5000, () => {
  console.log(`🔒 خادم الـ SMTP المحلي يعمل ويستمع داخلياً على المنفذ 5000`);
});
