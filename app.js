function onScanSuccess(decodedText, decodedResult) {
    document.getElementById('result').innerText = `¡Registrado!: ${decodedText}`;
    if (navigator.vibrate) { navigator.vibrate(200); }
    enviarReporteAlServidor(decodedText);
}

function onScanFailure(error) {
    // Ignoramos los errores de fotogramas donde no se ve el QR para no saturar la consola
}

// Inicialización directa buscando la cámara trasera principal
let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    },
    /* verbose= */ false
);

html5QrcodeScanner.render(onScanSuccess, onScanFailure);

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
