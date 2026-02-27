/**
 * Client-side media compression utilities.
 * - Images: canvas resize + JPEG quality reduction
 * - Videos: re-encode at lower bitrate via MediaRecorder
 */

// ── Image Compression ──

interface CompressImageOptions {
  maxSizeMB: number;
  maxWidth?: number;
  maxHeight?: number;
  initialQuality?: number;
}

/**
 * Compress an image file by resizing and reducing JPEG quality.
 * Iteratively lowers quality until file is under maxSizeMB.
 * Returns the original file if it's already small enough.
 */
export async function compressImage(
  file: File,
  { maxSizeMB, maxWidth = 1920, maxHeight = 1920, initialQuality = 0.85 }: CompressImageOptions
): Promise<File> {
  const maxBytes = maxSizeMB * 1024 * 1024;

  // Already under limit
  if (file.size <= maxBytes) return file;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  // Scale down proportionally if exceeds max dimensions
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Iteratively reduce quality
  let quality = initialQuality;
  let blob: Blob | null = null;

  for (let i = 0; i < 5; i++) {
    blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
    if (blob.size <= maxBytes) break;
    quality -= 0.15;
    if (quality < 0.1) quality = 0.1;
  }

  if (!blob) throw new Error("No se pudo comprimir la imagen");

  const name = file.name.replace(/\.[^.]+$/, ".jpg");
  return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
}

// ── Video Compression ──

interface CompressVideoOptions {
  maxSizeMB: number;
  /** Target bitrate in bits/s. Defaults to 1_000_000 (1 Mbps) */
  targetBitrate?: number;
}

/**
 * Compress a video by re-encoding at a lower bitrate using
 * HTMLVideoElement + Canvas + MediaRecorder.
 * Falls back to the original file if compression fails or isn't supported.
 */
export async function compressVideo(
  file: File,
  { maxSizeMB, targetBitrate = 1_000_000 }: CompressVideoOptions
): Promise<File> {
  const maxBytes = maxSizeMB * 1024 * 1024;

  // Already under limit
  if (file.size <= maxBytes) return file;

  // Check for MediaRecorder support
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Tu navegador no soporta compresión de video. Intenta grabar a menor resolución.");
  }

  return new Promise<File>((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      const { videoWidth, videoHeight, duration } = video;

      // Scale down if very large resolution
      let w = videoWidth;
      let h = videoHeight;
      const maxDim = 1280;
      if (w > maxDim || h > maxDim) {
        const scale = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      // Ensure even dimensions (required by some codecs)
      w = w % 2 === 0 ? w : w + 1;
      h = h % 2 === 0 ? h : h + 1;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      const stream = canvas.captureStream(30);

      // Try to capture audio too
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      } catch {
        // No audio track or unsupported — continue without audio
      }

      // Pick supported mime type
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: targetBitrate,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(url);
        const blob = new Blob(chunks, { type: mimeType });
        const ext = mimeType.includes("webm") ? "webm" : "mp4";
        const name = file.name.replace(/\.[^.]+$/, `.${ext}`);
        resolve(new File([blob], name, { type: mimeType, lastModified: Date.now() }));
      };

      recorder.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Error al comprimir el video"));
      };

      // Draw frames
      const drawFrame = () => {
        if (video.ended || video.paused) return;
        ctx.drawImage(video, 0, 0, w, h);
        requestAnimationFrame(drawFrame);
      };

      video.onplay = () => {
        drawFrame();
      };

      video.onended = () => {
        recorder.stop();
      };

      recorder.start(100); // collect data every 100ms
      video.play().catch((err) => {
        URL.revokeObjectURL(url);
        reject(err);
      });

      // Safety timeout: max 5 minutes encoding
      setTimeout(() => {
        if (recorder.state === "recording") {
          video.pause();
          recorder.stop();
        }
      }, Math.min(duration * 1100, 5 * 60 * 1000));
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer el video"));
    };
  });
}
