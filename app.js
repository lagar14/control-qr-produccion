let itemsDespacho = [];
let itemTemporalScaneado = null; // Almacena temporalmente los datos de la consulta

const URL_API = "https://script.google.com/macros/s/URL_DE_TU_APPS_SCRIPT_AQUI/exec";

// Escaneo exitoso del QR
function onScanSuccess(decodedText, decodedResult) {
    let idLimpio = decodedText.trim();

    // Limpiar enlace si viene en formato URL
    if (idLimpio.includes("?id=")) {
        const partes = idLimpio.split("?id=");
        idLimpio = partes[1].split("&")[0];
    } else if (idLimpio.startsWith("http")) {
        try {
            const urlObj = new URL(idLimpio);
            const pathSegments = urlObj.pathname.split('/');
            idLimpio = pathSegments[pathSegments.length - 1] || idLimpio;
        } catch (e) {}
    }

    document.getElementById('status-scan').innerText = `🔍 Consultando pieza ${idLimpio}...`;

    // Consultar al servidor los datos del elemento
    fetch(`${URL_API}?accion=consultar&id=${encodeURIComponent(idLimpio)}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (data.disponible <= 0) {
                    alert(`⚠️ El elemento "${data.nombre}" ya ha completado el 100% de su despacho requerido.`);
                    document.getElementById('status-scan').innerText = "Cámara lista para escanear...";
                    return;
                }

                if (navigator.vibrate) { navigator.vibrate(200); }

                // Guardar temporalmente para el modal
                itemTemporalScaneado = data;

                // Mostrar datos en el modal de confirmación
                document.getElementById('modal-detalle-texto').innerHTML = `
                    <strong>ID:</strong> ${data.id}<br>
                    <strong>Elemento:</strong> ${data.nombre}<br>
                    <strong>Obra:</strong> ${data.obra}<br>
                    <strong>Requerido:</strong> ${data.requerida} un.<br>
                    <span style="color: #0a9396; font-weight: bold;">Disponible para despachar: ${data.disponible} un.</span>
                `;
                
                document.getElementById('modal-cantidad').value = 1;
                document.getElementById('modal-cantidad').setAttribute('max', data.disponible);
                document.getElementById('modal-confirmacion').style.display = 'flex';
                document.getElementById('status-scan').innerText = "Esperando confirmación...";
            } else {
                alert("❌ " + data.message);
                document.getElementById('status-scan').innerText = "Cámara lista para escanear...";
            }
        })
        .catch(err => {
            console.error(err);
            alert("Error de conexión al consultar el elemento.");
            document.getElementById('status-scan').innerText = "Cámara lista para escanear...";
        });
}

function onScanFailure(error) {}

let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    { fps: 10, qrbox: { width: 160, height: 160 }, aspectRatio: 1.0, rememberLastUsedCamera: true },
    false
);
html5QrcodeScanner.render(onScanSuccess, onScanFailure);

function cerrarModal() {
    document.getElementById('modal-confirmacion').style.display = 'none';
    itemTemporalScaneado = null;
    document.getElementById('status-scan').innerText = "Cámara lista para escanear...";
}

// Confirmar la adición a la tabla local
function confirmarAgregadoItem() {
    if (!itemTemporalScaneado) return;

    let cantidadAgregar = parseInt(document.getElementById('modal-cantidad').value) || 1;

    // Validar contra lo ya agregado en la lista actual + lo disponible
    let yaEnLista = itemsDespacho.filter(i => i.id === itemTemporalScaneado.id).reduce((sum, i) => sum + i.cantidad, 0);
    
    if ((yaEnLista + cantidadAgregar) > itemTemporalScaneado.disponible) {
        alert(`No puedes agregar ${cantidadAgregar} unidades. Excede el disponible en planta (${itemTemporalScaneado.disponible - yaEnLista} restantes).`);
        return;
    }

    const ahora = new Date();
    const horaFormateada = ahora.toLocaleTimeString();

    // Agregar o acumular en el arreglo local
    const existenteIndex = itemsDespacho.findIndex(i => i.id === itemTemporalScaneado.id);
    if (existenteIndex > -1) {
        itemsDespacho[existenteIndex].cantidad += cantidadAgregar;
    } else {
        itemsDespacho.push({
            id: itemTemporalScaneado.id,
            nombre: itemTemporalScaneado.nombre,
            obra: itemTemporalScaneado.obra,
            cantidad: cantidadAgregar,
            hora: horaFormateada
        });
    }

    cerrarModal();
    actualizarTablaDespacho();
    document.getElementById('status-scan').innerText = "✅ Elemento agregado a la lista.";
}

function actualizarTablaDespacho() {
    const tbody = document.getElementById('lista-despacho-body');
    
    if (itemsDespacho.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #888;">No hay elementos escaneados aún.</td></tr>`;
        return;
    }

    let html = '';
    itemsDespacho.forEach((item, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${item.nombre}</strong> <span style="font-size:0.8rem; color:#666;">(${item.id})</span></td>
                <td>${item.obra}</td>
                <td style="text-align:center; font-weight:bold; color:#023e8a;">${item.cantidad}</td>
                <td><button class="btn-eliminar" onclick="eliminarItem(${index})">Eliminar</button></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function eliminarItem(index) {
    itemsDespacho.splice(index, 1);
    actualizarTablaDespacho();
}

function imprimirPDF() {
    if (itemsDespacho.length === 0) {
        alert("No hay elementos para imprimir o guardar.");
        return;
    }
    window.print();
}

function enviarDespachoServidor() {
    const obra = document.getElementById('obra').value.trim();
    const transportador = document.getElementById('transportador').value.trim();
    const responsable = document.getElementById('responsable').value.trim();

    if (!obra || !transportador || !responsable) {
        alert("Completa los datos de Obra, Transportador y Responsable.");
        return;
    }

    if (itemsDespacho.length === 0) {
        alert("La lista de despacho está vacía.");
        return;
    }

    document.getElementById('status-scan').innerText = "📤 Enviando al servidor...";

    const payload = {
        accion: "registrar_despacho_lote",
        obra: obra,
        transportador: transportador,
        operario: responsable,
        estacion: "Despacho",
        elementos: itemsDespacho
    };

    fetch(URL_API, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).then(() => {
        alert("¡Despacho registrado con éxito!");
        itemsDespacho = [];
        actualizarTablaDespacho();
        document.getElementById('status-scan').innerText = "Cámara lista para escanear...";
    }).catch(error => {
        console.error(error);
        alert("Error al enviar el despacho.");
    });
}
