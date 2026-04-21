import emailjs from "emailjs-com";

const SERVICE_ID = "service_87i41wj"; 
const TEMPLATE_ID = "template_c5gr055"; 
const PUBLIC_KEY = "sc_ebjqaChMkHcd0r";

export const sendPasswordResetEmail = async (toName: string, toEmail: string, resetLink: string) => {
  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_name: toName,
        to_email: toEmail,
        reset_link: resetLink,
      },
      PUBLIC_KEY
    );

    console.log("✅ Email enviado correctamente:", response.status);
    return true;
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    return false;
  }
};