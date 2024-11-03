import { useRef, useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf"; // Ensure you have this installed

export function useUburuPdfScanner({ fileName }) {
  const uburuVideoRef = useRef(null);
  const uburuCanvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);

  const turnOnUburuScanCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      if (uburuVideoRef.current) uburuVideoRef.current.srcObject = mediaStream;
    } catch (error) {
      console.error("Error accessing the camera:", error);
      console.log(
        "Could not access the camera. Please check your permissions."
      );
    }
  }, []);

  const turnOffUburuScanCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      if (uburuVideoRef.current) uburuVideoRef.current.srcObject = null;
    }
  }, [stream]);

  const captureUburuScanImage = useCallback(() => {
    const uburuCanvas = uburuCanvasRef.current;
    const uburuVideo = uburuVideoRef.current;

    if (uburuCanvas && uburuVideo) {
      uburuCanvas.width = uburuVideo.videoWidth;
      uburuCanvas.height = uburuVideo.videoHeight;
      const context = uburuCanvas.getContext("2d");
      context.drawImage(
        uburuVideo,
        0,
        0,
        uburuCanvas.width,
        uburuCanvas.height
      );

      // Compress image as JPEG with reduced quality
      const imgData = uburuCanvas.toDataURL("image/jpeg", 0.7); // 70% quality
      const imgId = Date.now();
      console.log("Captured image data:", imgData);
      setCapturedImages((prevImages) => [
        ...prevImages,
        { id: imgId, data: imgData },
      ]);
    } else {
      console.log("Canvas or video element is not valid.");
    }
  }, []);

  const deleteUburuImage = useCallback((imgId) => {
    setCapturedImages((prevImages) =>
      prevImages.filter((img) => img.id !== imgId)
    );
  }, []);

  const downloadUburuScanPDF = useCallback(() => {
    if (capturedImages.length === 0) {
      alert("Capture at least one image first!");
      return;
    }

    const pdf = new jsPDF();

    capturedImages.forEach((img, index) => {
      if (index > 0) pdf.addPage();
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight =
        (uburuCanvasRef.current.height * pdfWidth) /
        uburuCanvasRef.current.width;

      // Add the image to the PDF
      pdf.addImage(img.data, "JPEG", 0, 0, pdfWidth, pdfHeight); // Use JPEG format
    });

    pdf.save(`${fileName ?? "uburu-scanned-document"}.pdf`);
    setCapturedImages([]);
  }, [capturedImages]);

  useEffect(() => {
    // Clean up the media stream on component unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return {
    uburuVideoRef,
    uburuCanvasRef,
    capturedImages,
    turnOnUburuScanCamera,
    turnOffUburuScanCamera,
    captureUburuScanImage,
    deleteUburuImage,
    downloadUburuScanPDF,
  };
}
