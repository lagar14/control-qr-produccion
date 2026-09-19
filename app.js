let itemsDespacho = [];

// Función que se ejecuta al escanear exitosamente un QR
function onScanSuccess(decodedText, decodedResult) {
    // Evitar lecturas duplicadas continuas en el mismo segundo
    const idLimpio = decodedText.trim();
    
    // Verificar si ya está en la lista actual para evitar duplicados accidentales
    if (itemsDespacho.some(item => item.id === idLimpio)) {
        document.getElementById('status-scan').innerText = `⚠️ El código ${idLimpio} ya está en la lista.`;
        return;
    }

    if (navigator.vibrate) { navigator.vibrate(200); }

    const ahora = new Date();
    const fechaHoraFormateada = ahora.toLocaleDateString() + ' ' + ahora.toLocaleTimeString();

    // Agregar a nuestro arreglo local
    itemsDespacho.push({
        id: idLimpio,
        fecha: fechaHoraFormateada
    });

    document.getElementById('status-scan').innerText = `✅ ¡Agregado: ${idLimpio}!`;
    actualizarTablaDespacho();
}

function onScanFailure(error) {
    // Ignorar errores menores de escaneo por cuadro
}

// Inicializar el escáner de cámara trasera
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

// Actualizar la tabla visual en pantalla
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

// Función para eliminar un elemento si se equivocaron
function eliminarItem(index) {
    itemsDespacho.splice(index, 1);
    actualizarTablaDespacho();
    document.getElementById('status-scan').innerText = "🗑️ Elemento eliminado de la lista.";
}

// Función para Imprimir o Guardar como PDF
function imprimirPDF() {
    if (itemsDespacho.length === 0) {
        alert("No hay elementos en la lista para imprimir o guardar.");
        return;
    }
    window.print();
}

// Enviar los datos consolidados al Apps Script
function enviarDespachoServidor() {
    const obra = document.getElementById('obra').value.trim();
    const transportador = document.getElementById('transportador').value.trim();
    const responsable = document.getElementById('responsable').value.trim();

    if (!obra || !transportador || !responsable) {
        alert("Por favor completa los datos de Obra, Transportador y Responsable antes de registrar.");
        return;
    }

    if (itemsDespacho.length === 0) {
        alert("La lista de despacho está vacía.");
        return;
    }

    const urlAPI = "https://script.google.com/macros/s/TU_URL_DE_APPS_SCRIPT/exec"; // Reemplaza con tu URL real de Apps Script

    document.getElementById('status-scan').innerText = "📤 Enviando datos al servidor...";

    // Estructuramos el paquete de datos para tu Apps Script
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
        console.error("Error:", error);
        alert("Hubo un problema al enviar los datos.");
    });
}
