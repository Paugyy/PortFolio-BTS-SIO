/* Script propre à la page contact (sorti du HTML pour la CSP) */
const form = document.getElementById("contact-form");
const status = document.getElementById("status");
const btn = document.getElementById("send");

form.addEventListener("submit", async e => {
  e.preventDefault();
  btn.disabled = true;
  btn.textContent = "Envoi en cours…";
  status.className = "form-status";
  status.textContent = "";
  try {
    const data = Object.fromEntries(new FormData(form));
    data._template = "table";
    data._captcha = "false";
    const res = await fetch("https://formsubmit.co/ajax/yapaugy@gmail.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || json.success === "false") throw new Error(json.message);
    status.classList.add("ok");
    status.textContent = "✅ Message envoyé ! Je te réponds au plus vite.";
    form.reset();
  } catch (err) {
    status.classList.add("err");
    status.textContent = "❌ L'envoi a échoué. Écris-moi directement à yapaugy@gmail.com.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Envoyer le message ✈️";
  }
});
