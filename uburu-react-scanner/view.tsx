// Install required packages

import React from "react";
import { useUburuPdfScanner } from "./uburu-pdf-scanner";

const UburuPdfScanner = () => {
  const {
    uburuVideoRef,
    uburuCanvasRef,
    capturedImages,
    turnOnUburuScanCamera,
    turnOffUburuScanCamera,
    captureUburuScanImage,
    deleteUburuImage,
    downloadUburuScanPDF,
    deleteAllUburuCapturedImages,
  } = useUburuPdfScanner({});

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-lg font-bold mb-4">Uburu PDF Scanner</h1>

      <video
        ref={uburuVideoRef}
        autoPlay
        playsInline
        style={{ display: "block" }}
      ></video>
      
      <canvas ref={uburuCanvasRef} style={{ display: "none" }}></canvas>

      <div className="captured-images">
        {capturedImages.map((img) => (
          <div key={img.id} className="flex flex-col items-center mb-2">
            <img
              src={img.data}
              alt={`Captured ${img.id}`}
              className="w-32 h-32 object-cover mb-1"
            />
            <button onClick={() => deleteUburuImage(img.id)}>Delete</button>
          </div>
        ))}
      </div>

      <div className="flex mb-4">
        <button onClick={captureUburuScanImage}>Capture Image</button>
        <button onClick={turnOnUburuScanCamera}>Turn On Camera</button>
        <button onClick={turnOffUburuScanCamera}>Turn Off Camera</button>
        <button onClick={downloadUburuScanPDF}>Download PDF</button>
      </div>
    </div>
  );
};

export default UburuPdfScanner;
