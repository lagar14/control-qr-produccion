function onScanSuccess(decodedText, decodedResult) {
    document.getElementById('result').innerText = `Registrado: ${decodedText}`;
    enviarReporteAlServidor(decodedText);
}

const html5QrCode = new Html5Qrcode("reader");
html5QrCode.start(
    { facingMode: "environment" }, 
    {
        fps: 10,
        qrbox: { width: 250, height: 250 }
    },
    onScanSuccess
).catch(err => {
    console.error("Error al iniciar la cámara:", err);
    alert("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
});

function enviarReporteAlServidor(codigoQR) {
    // AQUÍ ES DONDE CONECTAS TU APPS SCRIPT:
    // Reemplaza la URL de abajo con la URL de implementación web de tu Google Apps Script
    const urlAPI = "https://script.google.com/macros/s/TU_URL_DE_APPS_SCRIPT/exec";
    
    fetch(urlAPI, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr: codigoQR, timestamp: new Date().toISOString() })
    }).then(() => {
        console.log("Dato enviado al servidor correctamente.");
    }).catch(error => {
        console.error("Error al enviar:", error);
    });
}