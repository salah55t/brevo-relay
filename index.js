const express = require('express');
const app = express();

app.use(express.json());

// استقبال طلبات الإرسال من منتدى NodeBB وتمريرها فوراً عبر الـ API
app.post('/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;

  try {
    // الاتصال المباشر بواجهة برمجة Brevo عبر منفذ الويب الآمن المفتوح دائماً
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': 'z3qXB9jzDTRvd6f5', // مفتاح حسابك الخاص في بريفو
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        "sender": { "name": "King DZ Forum", "email": "crackingdz8@gmail.com" },
        "to": [{ "email": to }],
        "subject": subject,
        "textContent": text,
        "htmlContent": html || text
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('تم تمرير الرسالة بنجاح عبر الـ API:', data.messageId);
      return res.json({ success: true, messageId: data.messageId });
    } else {
      console.error('خطأ مسترجع من بريفو:', data);
      return res.status(response.status).json({ success: false, error: data });
    }

  } catch (error) {
    console.error('فشل الاتصال بخادم بريفو الخارجي:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// تشغيل السيرفر على المنفذ الذي تحدده منصة Render تلقائياً
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`جسر الـ API يعمل بنجاح على المنفذ ${PORT}`);
});
