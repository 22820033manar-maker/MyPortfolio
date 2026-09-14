require("dotenv").config();

const express = require("express");
const { Resend } = require("resend");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 3000;

// ===============================
// Resend
// ===============================

const resend = new Resend(process.env.RESEND_API_KEY);

// ===============================
// MySQL - Aiven
// ===============================

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        rejectUnauthorized: false
    }
});

// ===============================
// Middleware
// ===============================

app.use(express.json());
app.use(express.static(__dirname));

// ===============================
// اختبار اتصال MySQL
// ===============================

async function testDatabase() {
    try {
        const connection = await db.getConnection();

        console.log("MySQL connected successfully ✅");

        connection.release();
    } catch (error) {
        console.error("MySQL connection failed ❌");
        console.error(error.message);
    }
}

// ===============================
// Contact API
// ===============================

app.post("/api/contact", async (req, res) => {

    try {

        const { name, email, subject, message } = req.body;

        // التحقق من الحقول
        if (!name || !email || !subject || !message) {

            return res.status(400).json({
                success: false,
                message: "يرجى تعبئة جميع الحقول."
            });

        }

        // ===============================
        // حفظ الرسالة في MySQL
        // ===============================

        await db.execute(
            `
            INSERT INTO messages
            (name, email, subject, message)
            VALUES (?, ?, ?, ?)
            `,
            [name, email, subject, message]
        );

        console.log("Message saved to MySQL ✅");

        // ===============================
        // إرسال الرسالة عبر Resend
        // ===============================

        const { data, error } = await resend.emails.send({

            from: "MyPortfolio <onboarding@resend.dev>",

            to: ["22820033manar@gmail.com"],

            subject: `رسالة جديدة من الموقع: ${subject}`,

            html: `
                <h2>رسالة جديدة من MyPortfolio</h2>

                <p>
                    <strong>الاسم:</strong>
                    ${name}
                </p>

                <p>
                    <strong>الإيميل:</strong>
                    ${email}
                </p>

                <p>
                    <strong>الموضوع:</strong>
                    ${subject}
                </p>

                <hr>

                <p>
                    <strong>الرسالة:</strong>
                </p>

                <p>
                    ${message}
                </p>
            `
        });

        if (error) {

            console.error("Resend error ❌");
            console.error(error);

            return res.status(500).json({
                success: false,
                message: "تم حفظ الرسالة، لكن حدث خطأ أثناء إرسال الإيميل."
            });

        }

        console.log("Email sent successfully ✅");

        // ===============================
        // نجاح العملية
        // ===============================

        res.json({
            success: true,
            message: "تم إرسال رسالتك بنجاح 💙"
        });

    } catch (error) {

        console.error("Server error ❌");
        console.error(error);

        res.status(500).json({
            success: false,
            message: "حدث خطأ في الخادم."
        });

    }

});

// ===============================
// تشغيل السيرفر
// ===============================

app.listen(PORT, async () => {

    console.log(`Server is running on http://localhost:${PORT}`);

    await testDatabase();

});