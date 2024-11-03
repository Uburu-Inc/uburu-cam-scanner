import { useRef, useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import axios from "axios";

interface CapturedImage {
  id: number;
  data: string;
}

export function useUburuPdfScanner({ fileName }: { fileName?: string }) {
  const uburuVideoRef = useRef<HTMLVideoElement | null>(null);
  const uburuCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);

  const turnOnUburuScanCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      if (uburuVideoRef.current) uburuVideoRef.current.srcObject = mediaStream;
    } catch (error) {
      console.error("Error accessing the camera:", error);
      console.log("Could not access the camera. Please check your permissions.");
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
      context?.drawImage(
        uburuVideo,
        0,
        0,
        uburuCanvas.width,
        uburuCanvas.height
      );

      const imgData = uburuCanvas.toDataURL("image/jpeg", 0.7);
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

  const deleteUburuImage = useCallback((imgId: number) => {
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
    const canvas = uburuCanvasRef.current;

    capturedImages.forEach((img, index) => {
      if (index > 0) pdf.addPage();
      if (canvas) {
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(img.data, "JPEG", 0, 0, pdfWidth, pdfHeight);
      }
    });

    pdf.save(`${fileName ?? "uburu-scanned-document"}.pdf`);
    setCapturedImages([]);
  }, [capturedImages, fileName]);

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
    uploadUburuScanPDF,
  };
}
