// Install the required packages

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
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
  const [loadingCameraView, setLoadingCameraView] = useState(false);
  const [uploadingPDF, setUploadingPDF] = useState(false);

  const turnOnUburuScanCamera = useCallback(async () => {
    setLoadingCameraView(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
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
      context?.drawImage(
        uburuVideo,
        0,
        0,
        uburuCanvas.width,
        uburuCanvas.height
      );

      const imgData = uburuCanvas.toDataURL("image/jpeg", 0.7);
      const imgId = Date.now();
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

    // Not explicit PDF output
    const pdfBlob = pdf.output("blob");

    // More explicit PDF output
    // const pdfBlob = new Blob([pdf.output("arraybuffer")], { type: "application/pdf" });

    try {
      setUploadingPDF(true);
      const response = await axios.post("/upload-endpoint", pdfBlob, {
        headers: {
          "Content-Type": "application/pdf",
        },
      });
      setUploadingPDF(false);
      console.log("PDF uploaded successfully:", response.data);
    } catch (error) {
      setUploadingPDF(false);
      console.error("Error uploading PDF:", error);
    }
  }, [capturedImages]);

  const deleteAllUburuCapturedImages = useCallback(() => {
    setCapturedImages([]);
  }, []);

  const determineFileWeightType = useCallback((size) => {
    switch (true) {
      case size < 1024:
        return `${size} byte${size === 1 ? "" : "s"}`;
      case size < 1024 * 1024:
        return `${(size / 1024).toFixed(2)} KB`;
      case size < 1024 * 1024 * 1024:
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
      default:
        return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }, []);

  const totalFileSize = useMemo(() => {
    const imageFiles = capturedImages.map((i) => i.data);

    const totalSize = imageFiles.reduce((acc, imageFile) => {
      const byteString = atob(imageFile.split(",")[1]);
      const byteArray = new Uint8Array(byteString.length);

      for (let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([byteArray], { type: "image/jpeg" });
      return acc + blob.size;
    }, 0);

    return determineFileWeightType(totalSize);
  }, [capturedImages, determineFileWeightType]);

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
    loadingCameraView,
    uploadingPDF,
    totalFileSize,
    deleteAllUburuCapturedImages,
    turnOnUburuScanCamera,
    turnOffUburuScanCamera,
    captureUburuScanImage,
    deleteUburuImage,
    downloadUburuScanPDF,
    uploadUburuScanPDF,
  };
}
