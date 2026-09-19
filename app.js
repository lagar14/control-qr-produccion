function onScanSuccess(decodedText, decodedResult) {
    document.getElementById('result').innerText = `¡Escaneado con éxito! Cargando...`;
    
    // Vibración corta de confirmación
    if (navigator.vibrate) { navigator.vibrate(200); }
    
    // Si el QR escaneado ya es una URL completa de Apps Script, redirigimos de inmediato
    if (decodedText.startsWith("http")) {
        window.location.href = decodedText;
    } else {
        // Si el QR contiene solo el ID (ej: Id:477662369 o LOTE1), 
        // lo unimos con la URL de despliegue de tu Google Apps Script:
        const urlBaseAppsScript = "https://script.google.com/macros/s/AKfycbxtiECPzJ9iEsySqVV59OWn9kCQhmGXUDnz5exTrK8vXnWx_dYoGYtgx3CCzcXT36A4/exec";
        window.location.href = urlBaseAppsScript + encodeURIComponent(decodedText);
    }
}

function onScanFailure(error) {
    // Ignoramos errores de fotogramas vacíos para mantener la cámara fluida
}

// Inicialización del escáner con la cámara trasera
let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    { 
        fps: 10, 
        qrbox: { width: 180, height: 180 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true
    },
    /* verbose= */ false
);

html5QrcodeScanner.render(onScanSuccess, onScanFailure);
