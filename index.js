const express = require('express');
const app = express();

// إعدادات قراءة البيانات القادمة من المنتدى (يدعم الصيغتين)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        "textContent": content ? content.replace(/<[^>]*>/g, '') : 'إشعار جديد'
      })
    });
    const data = await response.json();
    console.log('✅ تم تمرير الرسالة بنجاح عبر الجسر إلى بريفو:', data.messageId);
    return true;
  } catch (err) {
    console.error('❌ خطأ في إرسال الـ API لبريفو:', err);
    return false;
  }
}

// 1. استقبال طلبات التنشيط (Cron Job) العادية
app.post('/send-email', async (req, res) => {
  console.log("⚡ تم استقبال إشارة التنشيط (Keep-Alive) بنجاح والسيرفر مستيقظ!");
  return res.json({ success: true, status: "awake" });
});

// 2. المحاكي الذكي لاستقبال طلبات إضافة Mailgun من المنتدى وتوجيهها لبريفو تلقائياً!
// الإضافة القديمة في NodeBB ترسل الطلبات دائماً إلى مسار يحتوي على /messages
app.post('*/messages', async (req, res) => {
  console.log('📦 تم التقاط طلب إرسال من إضافة Mailgun المعلقة في المنتدى!');
  
  // استخراج البيانات القادمة من إضافة المنتدى
  const to = req.body.to;
  const subject = req.body.subject;
  const html = req.body.html || req.body.text;

  if (!to) {
    console.log('⚠️ تم استقبال طلب فارغ أو فحص اتصال من المنتدى.');
    return res.json({ message: "Queued. Thank you.", id: "mock-id-123" });
  }

  console.log(`📨 جاري تحويل الرسالة الموجهة إلى [${to}] نحو سيرفر بريفو...`);
  await sendToBrevoAPI(to, subject, html);

  // رد وهمي بنجاح العملية لكي يظن المنتدى أن ميل غان أرسلها بنجاح
  return res.json({
    message: "Queued. Thank you.",
    id: `mock-mailgun-${Date.now()}`
  });
});

// تشغيل السيرفر على المنفذ الافتراضي لـ ريندر
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 جسر محاكاة Mailgun يعمل بثبات وأمان على المنفذ ${PORT}`);
});
