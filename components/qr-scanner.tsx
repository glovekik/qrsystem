"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, CameraOff, Upload, RefreshCw } from "lucide-react"
import jsQR from "jsqr"

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startScanning = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsScanning(true)

        // Wait for video to be ready before scanning
        videoRef.current.onloadedmetadata = () => {
          // Start scanning for QR codes
          if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
          }

          scanIntervalRef.current = setInterval(() => {
            scanQRCode()
          }, 200) // Scan every 200ms for better performance
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      onError?.("Failed to access camera. Please ensure camera permissions are granted or use file upload instead.")
    }
  }

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsScanning(false)
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Only process if video is playing and has valid dimensions
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data for QR code detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    // Use jsQR to detect QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    })

    if (code) {
      // QR code detected
      stopScanning()
      onScan(code.data)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")

        if (!context) {
          setIsProcessing(false)
          onError?.("Failed to process image")
          return
        }

        // Set canvas size to match image
        canvas.width = img.width
        canvas.height = img.height

        // Draw image to canvas
        context.drawImage(img, 0, 0)

        // Get image data for QR detection
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

        // Use jsQR to detect QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        })

        if (code) {
          onScan(code.data)
        } else {
          onError?.("No QR code found in the image")
        }

        setIsProcessing(false)
      }

      img.onerror = () => {
        setIsProcessing(false)
        onError?.("Failed to load image")
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      setIsProcessing(false)
      onError?.("Failed to read file")
    }

    reader.readAsDataURL(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Camera className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-48 sm:h-64 bg-gray-100 rounded-lg object-cover"
            style={{ display: isScanning ? "block" : "none" }}
          />
          <canvas ref={canvasRef} className="hidden" />
          {!isScanning && (
            <div className="w-full h-48 sm:h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Click start to begin scanning</p>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 animate-spin" />
                <p className="text-sm sm:text-base">Processing...</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {!isScanning ? (
            <Button onClick={startScanning} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Start Scanning
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="outline" className="flex-1">
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Scanning
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Upload QR Image</span>
            <span className="sm:hidden">Upload</span>
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </div>

        {/* Manual input fallback */}
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500 mb-2">Or enter QR data manually:</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste QR data here..."
              className="flex-1 px-3 py-2 border rounded-md text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const target = e.target as HTMLInputElement
                  if (target.value.trim()) {
                    onScan(target.value.trim())
                    target.value = ""
                  }
                }
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
