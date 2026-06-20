// الإعداد المحدث والمتوافق مع جدار حماية Render عبر منفذ 587
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // يجب أن تكون false عند استخدام المنفذ 587 لتفعيل StartTLS
  auth: {
    user: 'af6b3e001@smtp-brevo.com', 
    pass: 'z3qXB9jzDTRvd6f5' 
  },
  tls: {
    rejectUnauthorized: false // لتفادي مشاكل التحقق من الشهادات المحلية داخل الحاوية
  }
});
