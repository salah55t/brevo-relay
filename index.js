const express = require('express');
const net = require('net');
const app = express();

app.use(express.json());

// دالة إرسال الـ API لبريفو
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
        "textContent": content ? content.replace(/<[^>]*>/g, '') : ''
      })
    });
    const data = await response.json();
    console.log('تم التمرير بنجاح لبريفو:', data.messageId);
    return true;
  } catch (err) {
    console.error('خطأ بريفو API:', err);
    return false;
  }
}

// واجهة الويب والكرون جوب لتبقيه مستيقظاً دون إرسال إيميلات حقيقية تستهلك الحساب
app.post('/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;
  
  // إذا كان الطلب مجرد اختبار تنشيط (Ping) من الكرون جوب، لا ترسل بريداً حقيقياً
  if (to === "ping@internal.local" || !to) {
    console.log("⚡ تم استقبال إشارة التنشيط (Keep-Alive) بنجاح والسيرفر مستيقظ!");
    return res.json({ success: true, status: "awake" });
  }

  const success = await sendToBrevoAPI(to, subject, html || text);
  if (success) res.json({ success: true });
  else res.status(500).json({ success: false });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`واجهة الويب مستقرة على المنفذ ${PORT}`);
});

// مستقبل SMTP ذكي ومحمي من الانهيارات المفاجئة
const smtpServer = net.createServer((socket) => {
  // حماية السوكيت ومعالجة خطأ ECONNRESET لمنع انهيار السيرفر
  socket.on('error', (err) => {
    console.log('🔄 تم التعامل مع إعادة تعيين اتصال آمن (Connection Reset) دون انهيار السيرفر.');
  });

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
      socket.write('250 OK: Message accepted\r\n');
      socket.end();

      if (recipient) {
        console.log(`📨 استلم الجسر رسالة متوجهة إلى: ${recipient}`);
        const bodyStart = emailData.indexOf('\r\n\r\n');
        const mailBody = bodyStart !== -1 ? emailData.substring(bodyStart + 4) : emailData;
        await sendToBrevoAPI(recipient, "تفعيل الحساب - منتدى King DZ", mailBody);
      }
      return;
    }

    if (socket.writable && !text.includes('\r\n.\r\n')) {
      socket.write('250 OK\r\n');
    }
  });
});

smtpServer.listen(5000, () => {
  console.log('مستقبل SMTP محمي ويعمل على المنفذ 5000');
});
