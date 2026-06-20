const express = require('express');
const net = require('net'); // حزمة مدمجة تلقائياً في Node.js لا تحتاج تثبيت!
const app = express();

app.use(express.json());

// دالة تمرير البيانات الرسمية لبريفو عبر الـ API الآمن
async function sendToBrevoAPI(to, subject, content) {
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
        "subject": subject || "إشعار جديد من المنتدى",
        "htmlContent": content,
        "textContent": content.replace(/<[^>]*>/g, '') // إزالة وسوم HTML للنص العادي
      })
    });
    const data = await response.json();
    console.log('تم تمرير الرسالة بنجاح عبر الجسر إلى بريفو:', data.messageId);
    return true;
  } catch (err) {
    console.error('خطأ في إرسال الـ API لبريفو:', err);
    return false;
  }
}

// واجهة الويب لطلبات الـ HTTP العادية والفحص
app.post('/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;
  const success = await sendToBrevoAPI(to, subject, html || text);
  if (success) res.json({ success: true });
  else res.status(500).json({ success: false });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`واجهة الويب تعمل بنجاح على المنفذ ${PORT}`);
});

// محاكي سيرفر SMTP خفيف ومبسط ومبني بالكامل بـ Net الصافي لاستقبال رسائل المنتدى
const smtpServer = net.createServer((socket) => {
  socket.write('220 brevo-relay.onrender.com ESMTP\r\n');
  let emailData = '';
  let recipient = '';

  socket.on('data', async (data) => {
    const text = data.toString();
    emailData += text;

    if (text.toUpperCase().startsWith('RCPT TO:')) {
      const match = text.match(/<([^>]+)>/);
      if (match) recipient = match[1];
    }

    if (text.endsWith('\r\n.\r\n') || text.includes('\r\n.\r\n')) {
      socket.write('250 OK: Message accepted for delivery\r\n');
      socket.end();

      if (recipient) {
        console.log(`استقبل الجسر رسالة من المنتدى موجهة إلى: ${recipient}، جاري التمرير...`);
        // استخراج المحتوى بين الأسطر الفارغة وإرساله
        const bodyStart = emailData.indexOf('\r\n\r\n');
        const mailBody = bodyStart !== -1 ? emailData.substring(bodyStart + 4) : emailData;
        await sendToBrevoAPI(recipient, "تفعيل الحساب - منتدى King DZ", mailBody);
      }
      return;
    }

    if (!text.includes('\r\n.\r\n')) {
      socket.write('250 OK\r\n');
    }
  });
});

// تشغيل محاكي الاستقبال على المنفذ 5000 المفتوح داخلياً في ريندر
smtpServer.listen(5000, () => {
  console.log('مستقبل الـ SMTP الذكي يعمل بنجاح على المنفذ 5000');
});
