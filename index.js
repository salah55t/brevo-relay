const express = require('express');
const nodemailer = require('nodemailer');
const app = express();

app.use(express.json());

// إعداد الاتصال بخادم Brevo باستخدام البيانات التي استخرجناها سابقاً
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 465,
  secure: true, // استخدام التشفير الكامل للمنفذ 465
  auth: {
    user: 'af6b3e001@smtp-brevo.com', 
    pass: 'z3qXB9jzDTRvd6f5' 
  }
});

// استقبال طلبات الإرسال من منتدى NodeBB عبر رابط الويب
app.post('/send-email', (req, res) => {
  const { to, subject, text, html } = req.body;

  const mailOptions = {
    from: '"King DZ Forum" <crackingdz8@gmail.com>', // إيميلك المعتمد في بريفو
    to: to,
    subject: subject,
    text: text,
    html: html
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('خطأ في الإرسال عبر بريفو:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    console.log('تم تمرير الرسالة بنجاح:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
  });
});

// تشغيل السيرفر على المنفذ الذي تحدده منصة Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`خادم التمرير يعمل بنجاح على المنفذ ${PORT}`);
});
