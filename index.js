const SMTPServer = require('smtp-server').SMTPServer;
const simpleParser = require('mailparser').simpleParser;

const BREVO_API_KEY = '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';
const SENDER_EMAIL = 'crackingdz8@gmail.com';
const SENDER_NAME = 'King DZ Forum';

// دالة إرسال الـ API لبريفو
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
        "to": [{ "email": to }],
        "subject": subject || "إشعار من المنتدى",
        "htmlContent": html || text || "رسالة فارغة",
        "textContent": text || ""
      })
    });
    const data = await response.json();
    console.log(`✅ تم التمرير بنجاح إلى الإيميل الحقيقي: [${to}]`);
  } catch (err) {
    console.error('❌ فشل إرسال الـ API لبريفو:', err);
  }
}

// إنشاء سيرفر SMTP حقيقي ومستقر
const server = new SMTPServer({
  authOptional: true, 
  disabledCommands: ['STARTTLS'], // لمنع مشاكل التشفير المعقدة مع ريندر
  onData(stream, session, callback) {
    simpleParser(stream, {}, async (err, parsed) => {
      if (err) {
        console.error("❌ فشل تحليل الرسالة القادمة:", err);
        return callback(err);
      }

      // استخراج الإيميل الحقيقي الذي وضعه المنتدى في خانة المستقبل (To)
      const dynamicTo = parsed.to && parsed.to.text ? parsed.to.text : null;
      
      console.log(`📨 الإيميل المستهدف الملتقط من طلب الـ SMTP هو: ${dynamicTo}`);

      if (dynamicTo) {
        // تمرير البيانات ديناميكياً للإيميل الحقيقي
        await sendToBrevo(dynamicTo, parsed.subject, parsed.html, parsed.text);
      } else {
        console.log("⚠️ لم يتم العثور على إيميل مستقبل في الحزمة، سيتم الإرسال للإيميل الافتراضي.");
        await sendToBrevo(SENDER_EMAIL, parsed.subject, parsed.html, parsed.text);
      }

      callback();
    });
  }
});

// تشغيل الواجهة الوهمية للمنفذ 10000 لإرضاء Render
const express = require('express');
const app = express();
app.all('/', (req, res) => res.send('SMTP Relay is Live!'));
app.listen(process.env.PORT || 10000, () => {
  console.log(`🚀 واجهة الويب مستقرة على المنفذ 10000`);
});

// تشغيل سيرفر الـ SMTP الفعلي على المنفذ 5000
server.listen(5000, () => {
  console.log(`🔒 خادم الـ SMTP المحلي يعمل بنجاح ويستمع على المنفذ 5000`);
});
