function onScanSuccess(decodedText, decodedResult) {
    document.getElementById('result').innerText = `¡Registrado!: ${decodedText}`;
    if (navigator.vibrate) { navigator.vibrate(200); }
    enviarReporteAlServidor(decodedText);
}

function onScanFailure(error) {
    // Ignoramos errores para no saturar
}

// === CONFIGURACIÓN MÁS FLEXIBLE PARA CÁMARAS INDUSTRIALES ===
let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    { 
        fps: 10, 
        // AQUÍ ESTÁ EL CAMBIO CLAVE:
        // Reducimos el cuadro guía a 150x150 pixeles para que sea más fácil
        // que el QR entre sin tener que pegar el celular a la etiqueta.
        qrbox: { width: 150, height: 150 },
        // Mantenemos la relación de aspecto cuadrada para el video
        aspectRatio: 1.0,
        // Permitimos que la cámara haga zoom si el dispositivo lo soporta 
        // (esto ayuda mucho si el código está un poco lejos)
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true // Agrega botón de luz si hay flash
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
