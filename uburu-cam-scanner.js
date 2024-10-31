let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let stream = null;

// Turn on camera
async function turnOnCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}});
        video.srcObject = stream;
    } catch (error) {
        console.error("Error accessing the camera:", error);
    }
}

// Turn off camera
function turnOffCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}

// Capture image from video stream
function captureImage() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Display the canvas (optional)
    canvas.style.display = 'block';
}

// Download the captured image as PDF
function downloadPDF() {
    if (canvas.width === 0 || canvas.height === 0) {
        alert("Capture an image first!");
        return;
    }

    const imgData = canvas.toDataURL('image/png');
    const {jsPDF} = window.jspdf;
    const pdf = new jsPDF();

    // Add image to PDF, scale to fit page
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Save the PDF
    pdf.save("document.pdf");
}