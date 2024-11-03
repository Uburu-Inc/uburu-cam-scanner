window.onload = function () {
  console.log("Uburu Cam Scan Script Connected!!!");
  // Element imports
  let uburuVideo = document.querySelector("#uburu-video");
  let uburuCanvas = document.querySelector("#uburu-canvas");
  let uburuDocLogs = document.querySelector("#uburu-doc-logs");
  let uburuContext = uburuCanvas.getContext("2d");
  let stream = null;

  let turnOnCamera = document.querySelector("#turn-on-uburu-scan-camera");
  let turnOffCamera = document.querySelector("#turn-off-uburu-scan-camera");
  let captureScan = document.querySelector("#capture-uburu-scan-image");
  let downloadScan = document.querySelector("#download-uburu-scan-pdf");
  let deleteButtons = document.querySelectorAll(".uburu-delete-button");

  // Array to store captured images
  let uburuCapturedImages = [];

  // Turn on camera
  turnOnCamera.addEventListener("click", turnOnUburuScanCamera);
  async function turnOnUburuScanCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      uburuVideo.srcObject = stream;
    } catch (error) {
      console.error("Error accessing the camera:", error);
    }
  }

  // Turn off camera
  turnOffCamera.addEventListener("click", turnOffUburuScanCamera);
  function turnOffUburuScanCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      uburuVideo.srcObject = null;
    }
  }

  // Capture image from video stream
  captureScan.addEventListener("click", captureUburuScanImage);
  function captureUburuScanImage() {
    uburuCanvas.width = uburuVideo.videoWidth;
    uburuCanvas.height = uburuVideo.videoHeight;
    uburuContext.drawImage(
      uburuVideo,
      0,
      0,
      uburuCanvas.width,
      uburuCanvas.height
    );

    // Convert the canvas image to data URL and store it in capturedImages array
    const imgData = uburuCanvas.toDataURL("image/png");
    const imgIndex = uburuCapturedImages.length;
    uburuCapturedImages.push(imgData);

    // Create an image element with delete button
    const imgElement = document.createElement("div");
    imgElement.innerHTML = `
      <img class="uburu-doc-logs" src="${imgData}" />
      <button onclick="deleteUburuImage(${imgIndex})">Delete</button>
    `;

    imgElement.setAttribute("data-index", imgIndex);
    uburuDocLogs.appendChild(imgElement);
  }

  // Delete image from array and UI
  function deleteUburuImage(index) {
    // Remove the image from the array
    uburuCapturedImages.splice(index, 1);

    // Refresh the UI list
    uburuDocLogs.innerHTML = "";
    uburuCapturedImages.forEach((imgData, i) => {
      const imgElement = document.createElement("div");
      imgElement.innerHTML = `
          <img class="uburu-doc-logs" src="${imgData}" />
          <button
            class="uburu-delete-button"
            onclick="deleteUburuImage(${i})"
           >
            Delete
          </button>
        `;

      imgElement.setAttribute("data-index", i);
      uburuDocLogs.appendChild(imgElement);
    });
  }

  // Download the captured images as a multi-page PDF
  downloadScan.addEventListener("click", downloadUburuScanPDF);
  function downloadUburuScanPDF() {
    if (uburuCapturedImages.length === 0) {
      alert("Capture at least one image first!");
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    // Loop through each captured image and add to a new PDF page
    uburuCapturedImages.forEach((imgData, index) => {
      // Add a new page for each subsequent image
      if (index > 0) pdf.addPage();

      // Scale the image to fit the PDF page dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (uburuCanvas.height * pdfWidth) / uburuCanvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    });

    // Save the PDF
    pdf.save("document.pdf");

    // Clear captured images after download (optional)
    uburuCapturedImages = [];
    uburuDocLogs.innerHTML = "";

    turnOnCamera.removeEventListener();
    turnOffCamera.removeEventListener();
    captureScan.removeEventListener();
    downloadScan.removeEventListener();
  }
};
