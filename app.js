function onScanSuccess(decodedText, decodedResult) {
    document.getElementById('result').innerText = `¡Registrado!: ${decodedText}`;
    
    // Opcional: vibración corta al escanear con éxito (si el celular lo soporta)
    if (navigator.vibrate) { navigator.vibrate(200); }
    
    enviarReporteAlServidor(decodedText);
}

const html5QrCode = new Html5Qrcode("reader");

// Configuración adaptada para mejor lectura en móviles
const config = { 
    fps: 15, 
    qrbox: function(viewfinderWidth, viewfinderHeight) {
        // Hace que el cuadro de lectura sea responsivo al tamaño de la pantalla
        let minSize = Math.min(viewfinderWidth, viewfinderHeight);
        let size = Math.floor(minSize * 0.7);
        return { width: size, height: size };
    }
};

html5QrCode.start(
    { facingMode: "environment" }, 
    config,
    onScanSuccess
).catch(err => {
    console.error("Error al iniciar la cámara:", err);
    document.getElementById('result').innerText = "Error: No se pudo acceder a la cámara trasera.";
});

function enviarReporteAlServidor(codigoQR) {
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
