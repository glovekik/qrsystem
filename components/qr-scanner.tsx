 
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

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let stream: MediaStream | null = null
    let animationFrameId: number | null = null

    const startScanner = async () => {
      setIsLoading(true)
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setIsScanning(true)
        }
      } catch (err: any) {
        setError("Error accessing camera: " + (err?.message || err))
        setIsScanning(false)
        onError?.("Error accessing camera: " + (err?.message || err))
      } finally {
        setIsLoading(false)
      }
    }

    const scanQR = () => {
      if (!videoRef.current || !canvasRef.current) return
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")
      const video = videoRef.current
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight
        canvas.width = video.videoWidth
        context?.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = context?.getImageData(0, 0, canvas.width, canvas.height)
        if (imageData) {
          const code = jsQR(imageData.data, imageData.width, imageData.height)
          if (code) {
            setResult(code.data)
            setIsScanning(false)
            onScan(code.data)
            if (stream) {
              stream.getTracks().forEach(track => track.stop())
            }
            return
          }
        }
      }
      if (isScanning) {
        animationFrameId = requestAnimationFrame(scanQR)
      }
    }

    if (isScanning) {
      startScanner().then(() => scanQR())
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isScanning])

  const handleStartScan = () => {
    setResult("")
    setError("")
    setIsScanning(true)
  }

  const stopScanning = () => {
    setIsScanning(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")

        if (!context) {
          setIsLoading(false)
          onError?.("Failed to process image: no canvas context")
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        context.drawImage(img, 0, 0)

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        })

        if (code) {
          console.log("QR code detected from image:", code.data)
          onScan(code.data)
        } else {
          console.error("No QR code found in image")
          onError?.("No QR code found in the uploaded image")
        }

        setIsLoading(false)
      }

      img.onerror = () => {
        setIsLoading(false)
        onError?.("Failed to load image")
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      setIsLoading(false)
      onError?.("Failed to read file")
    }

    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

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

          {isLoading && (
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
            <Button onClick={handleStartScan} className="flex-1">
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
            disabled={isLoading}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Upload QR Image</span>
            <span className="sm:hidden">Upload</span>
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </div>

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
                    console.log("Manual QR data entered:", target.value.trim())
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