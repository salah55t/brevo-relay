const express = require('express');
const { SMTPServer } = require('smtp-server');
const app = express();

app.use(express.json());

// دالة مشتركة لإرسال البريد إلى بريفو عبر الـ API الآمن المفتوح
async function sendToBrevoAPI(to, subject, html, text) {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': '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',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        "sender": { "name": "King DZ Forum", "email": "crackingdz8@gmail.com" },
        "to": [{ "email": to }],
        "subject": subject,
        "htmlContent": html || text,
        "textContent": text
      })
    });
    const data = await response.json();
    console.log('تم التمرير بنجاح إلى بريفو:', data.messageId);
    return true;
  } catch (err) {
    console.error('فشل التمرير لبريفو:', err);
    return false;
  }
}

// 1. استقبال الطلبات القادمة من موقع ReqBin أو الوجاهات (HTTP)
app.post('/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;
  const success = await sendToBrevoAPI(to, subject, html, text);
  if (success) res.json({ success: true });
  else res.status(500).json({ success: false });
});

// تشغيل واجهة الويب على المنفذ الافتراضي لـ Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`واجهة الويب تعمل على المنفذ ${PORT}`);
});

// 2. بناء سيرفر SMTP داخلي مجاني ليستقبل الرسائل من المنتدى مباشرة
const smtpServer = new SMTPServer({
  secure: false,
  disabledCommands: ['AUTH'], // بدون تعقيدات كلمات مرور لأن الاتصال خاص بك
  onData(stream, session, callback) {
    let buffer = '';
    stream.on('data', (chunk) => { buffer += chunk; });
    stream.on('end', async () => {
      // هنا يقوم الجسر بقراءة الرسالة القادمة من منتدى NodeBB وتحويلها فوراً لـ API
      console.log('استقبل الجسر رسالة SMTP من المنتدى، جاري تحويلها لـ API...');
      
      // استخراج البيانات الأساسية بشكل مبسط ليمر التفعيل
      const toMatch = session.envelope.to[0].address;
      const subjectMatch = "إشعار من المنتدى"; 
      
      await sendToBrevoAPI(toMatch, subjectMatch, buffer, buffer);
      callback();
    });
  }
});

// تشغيل سيرفر الـ SMTP البديل على المنفذ 5000 (المفتوح دائمًا في ريندر للاتصال الداخلي)
smtpServer.listen(5000, () => {
  console.log('جسر الـ SMTP الداخلي يعمل بنجاح على المنفذ 5000');
});
