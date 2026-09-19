let itemsDespacho = [];

// Función que se ejecuta al escanear exitosamente un QR
function onScanSuccess(decodedText, decodedResult) {
    let idLimpio = decodedText.trim();

    // Limpiamos el texto por si el QR contiene un enlace web completo (ej: ?id=PL7)
    if (idLimpio.includes("?id=")) {
        const partes = idLimpio.split("?id=");
        idLimpio = partes[1].split("&")[0];
    } else if (idLimpio.startsWith("http")) {
        try {
            const urlObj = new URL(idLimpio);
            const pathSegments = urlObj.pathname.split('/');
            idLimpio = pathSegments[pathSegments.length - 1] || idLimpio;
        } catch (e) {
            // Si falla el análisis de URL, mantenemos el texto original limpio
        }
    }

    // Evitar duplicados accidentales en la misma lista de despacho
    if (itemsDespacho.some(item => item.id === idLimpio)) {
        document.getElementById('status-scan').innerText = `⚠️ El elemento ${idLimpio} ya está en la lista.`;
        return;
    }

    // Vibración de confirmación en el dispositivo móvil
    if (navigator.vibrate) { 
        navigator.vibrate(200); 
    }

    const ahora = new Date();
    const fechaHoraFormateada = ahora.toLocaleDateString() + ' ' + ahora.toLocaleTimeString();

    // Añadir el elemento al arreglo local de despacho
    itemsDespacho.push({
        id: decodeURIComponent(idLimpio),
        fecha: fechaHoraFormateada
    });

    document.getElementById('status-scan').innerText = `✅ ¡Agregado correctamente: ${idLimpio}!`;
    actualizarTablaDespacho();
}

function onScanFailure(error) {
    // Se ignoran los errores de fotogramas sin QR para mantener la cámara fluida
}

// Inicialización del escáner con la cámara del dispositivo
let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    { 
        fps: 10, 
        qrbox: { width: 160, height: 160 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true
    },
    /* verbose= */ false
);

html5QrcodeScanner.render(onScanSuccess, onScanFailure);

// Actualiza la tabla visual en la interfaz web
function actualizarTablaDespacho() {
    const tbody = document.getElementById('lista-despacho-body');
    
    if (itemsDespacho.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888;">No hay elementos escaneados aún.</td></tr>`;
        return;
    }

    let html = '';
    itemsDespacho.forEach((item, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${item.id}</strong></td>
                <td>${item.fecha}</td>
                <td><button class="btn-eliminar" onclick="eliminarItem(${index})">Eliminar</button></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// Permite eliminar un elemento de la lista si se escaneó por error
function eliminarItem(index) {
    itemsDespacho.splice(index, 1);
    actualizarTablaDespacho();
    document.getElementById('status-scan').innerText = "🗑️ Elemento eliminado de la lista.";
}

// Función para imprimir o generar el formato PDF para el transportador
function imprimirPDF() {
    if (itemsDespacho.length === 0) {
        alert("No hay elementos en la lista para imprimir o guardar.");
        return;
    }
    window.print();
}

// Envía el lote completo de despacho hacia Google Apps Script / Google Sheets
function enviarDespachoServidor() {
    const obra = document.getElementById('obra').value.trim();
    const transportador = document.getElementById('transportador').value.trim();
    const responsable = document.getElementById('responsable').value.trim();

    if (!obra || !transportador || !responsable) {
        alert("Por favor completa los campos de Obra, Transportador y Responsable antes de registrar.");
        return;
    }

    if (itemsDespacho.length === 0) {
        alert("La lista de despacho está vacía. Escanea al menos un código QR.");
        return;
    }

    // ⚠️ REEMPLAZA ESTA URL CON TU URL REAL DE GOOGLE APPS SCRIPT QUE TERMINA EN /exec
    const urlAPI = "https://script.google.com/macros/s/TU_URL_DE_APPS_SCRIPT/exec";

    document.getElementById('status-scan').innerText = "📤 Enviando lote al servidor...";

    const payload = {
        accion: "registrar_despacho_lote",
        obra: obra,
        transportador: transportador,
        operario: responsable,
        estacion: "Despacho",
        elementos: itemsDespacho
    };

    fetch(urlAPI, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).then(() => {
        alert("¡Despacho registrado y enviado con éxito al sistema!");
        itemsDespacho = [];
        actualizarTablaDespacho();
        document.getElementById('status-scan').innerText = "Cámara lista para escanear...";
    }).catch(error => {
        console.error("Error al enviar:", error);
        alert("Hubo un problema al conectar con el servidor.");
    });
}
