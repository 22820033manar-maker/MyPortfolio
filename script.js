document.addEventListener("DOMContentLoaded", function () {

    const contactForm = document.getElementById("contactForm");

    if (contactForm) {

        contactForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const subject = document.getElementById("subject").value;
            const message = document.getElementById("message").value;

            if (
                name.trim() === "" ||
                email.trim() === "" ||
                subject.trim() === "" ||
                message.trim() === ""
            ) {
                alert("يرجى تعبئة جميع الحقول.");
                return;
            }

            try {

                const response = await fetch("/api/contact", {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name: name,
                        email: email,
                        subject: subject,
                        message: message
                    })
                });

                const result = await response.json();

                if (result.success) {

                    alert("تم إرسال رسالتك بنجاح 💙");

                    contactForm.reset();

                } else {

                    alert(result.message);

                }

            } catch (error) {

                console.error(error);

                alert("حدث خطأ في الاتصال بالخادم.");

            }

        });
    }

});