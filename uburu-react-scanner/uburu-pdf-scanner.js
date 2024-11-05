// Install the required modules

import { useRef, useState, useEffect, useCallback } from "react";
import axios from "axios";
import jsPDF from "jspdf";

export function useUburuPdfScanner({ fileName }) {
  const uburuVideoRef = useRef(null);
  const uburuCanvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [loadingCameraView, setLoadingCameraView] = useState(false);

  const turnOnUburuScanCamera = useCallback(async () => {
    setLoadingCameraView(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setLoadingCameraView(false);
      setStream(mediaStream);
      if (uburuVideoRef.current) uburuVideoRef.current.srcObject = mediaStream;
    } catch (error) {
      console.error("Error accessing the camera:", error);
      console.log(
        "Could not access the camera. Please check your permissions."
      );
      setLoadingCameraView(false);
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

  const uploadUburuScanPDF = useCallback(async () => {
    if (capturedImages.length === 0) {
      alert("Capture at least one image first!");
      return;
    }

    const pdf = new jsPDF();
    const canvas = uburuCanvasRef.current;

    capturedImages.forEach((img, index) => {
      if (index > 0) pdf.addPage();
      if (canvas) {
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(img.data, "JPEG", 0, 0, pdfWidth, pdfHeight);
      }
    });

    const pdfBlob = pdf.output("blob");

    try {
      const response = await axios.post("/upload-endpoint", pdfBlob, {
        headers: {
          "Content-Type": "application/pdf",
        },
      });
      console.log("PDF uploaded successfully:", response.data);
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
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
    loadingCameraView,
    turnOnUburuScanCamera,
    turnOffUburuScanCamera,
    captureUburuScanImage,
    deleteUburuImage,
    uploadUburuScanPDF,
    downloadUburuScanPDF,
  };
}
