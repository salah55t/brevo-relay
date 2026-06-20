const express = require('express');
const nodemailer = require('nodemailer'); // هذا السطر الناقص السحري الذي سيحل المشكلة!
const app = express();

app.use(express.json());

// الإعداد المحدث والمتوافق مع جدار حماية Render والمنفذ 587 لـ Brevo
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // يجب أن تكون false مع المنفذ 587 لتفعيل تكنولوجيا STARTTLS
  auth: {
    user: 'af6b3e001@smtp-brevo.com', 
    pass: 'z3qXB9jzDTRvd6f5' 
  },
  tls: {
    rejectUnauthorized: false // لتفادي مشاكل التحقق من الشهادات داخل بيئة Render مجدداً
  }
});

// استقبال طلبات الإرسال من منتدى NodeBB
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

// تشغيل السيرفر على المنفذ الذي تحدده منصة Render تلقائياً
const PORT = process.env.PORT || 10000; // تم تحديثه لمنفذ ريندر الافتراضي 10000 للسرعة
app.listen(PORT, () => {
  console.log(`خادم التمرير يعمل بنجاح على المنفذ ${PORT}`);
});
