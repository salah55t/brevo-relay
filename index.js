const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BREVO_API_KEY = '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';
const SENDER_EMAIL = 'crackingdz8@gmail.com';
const SENDER_NAME = 'King DZ Forum';

// دالة الإرسال الديناميكية عبر API بريفو
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
        "subject": subject || "إشعار من منتدى King DZ",
        "htmlContent": html || text || "رسالة تجريبية",
        "textContent": text || ""
      })
    });
    const data = await response.json();
    console.log(`✅ تم التمرير بنجاح إلى: [${to}]`, data.messageId || data);
    return true;
  } catch (err) {
    console.error('❌ فشل إرسال الـ API لبريفو:', err);
    return false;
  }
}

// استقبال طلبات إضافة Mailgun من المنتدى
app.post('/v3/:domain/messages', async (req, res) => {
  console.log(`📦 تم التقاط طلب إرسال ويب من المنتدى.`);
  
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

app.all('/', (req, res) => res.send('HTTP Mailgun Gateway is Live!'));

// تعريف المنفذ مرة واحدة فقط لمنع خطأ التكرار
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 الجسر يعمل بكفاءة كاملة على المنفذ العام ${PORT}`);
});
