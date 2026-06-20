const express = require('express');
const app = express();

app.use(express.json());

// استقبال طلبات الإرسال من منتدى NodeBB أو أدوات الفحص وتمريرها عبر الـ API
app.post('/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;

  try {
    // الاتصال المباشر بواجهة برمجة Brevo الرسمية عبر منفذ الويب المفتوح
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': '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', // مفتاح الـ API الجديد الخاص بك
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
      console.log('تم تمرير الرسالة بنجاح عبر الجسر:', data.messageId);
      return res.json({ success: true, messageId: data.messageId });
    } else {
      console.error('خطأ مسترجع من سيرفر بريفو الرئيسي:', data);
      return res.status(response.status).json({ success: false, error: data });
    }

  } catch (error) {
    console.error('فشل في معالجة الطلب أو الاتصال بالشبكة:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// تشغيل السيرفر على المنفذ الذي تحدده منصة Render تلقائياً
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`جسر الـ API يعمل بنجاح ومستعد تماماً على المنفذ ${PORT}`);
});
