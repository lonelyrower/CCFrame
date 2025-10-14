'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ProgressiveImage } from '@/components/media/ProgressiveImage';
import { getImageUrl } from '@/lib/image/utils';

interface WebGLImageViewerProps {
  fileKey: string;
  isPublic?: boolean;
  alt?: string;
  className?: string;
}

interface ViewerState {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  positionBuffer: WebGLBuffer;
  texCoordBuffer: WebGLBuffer;
  texture: WebGLTexture;
  attribLocations: {
    position: number;
    texCoord: number;
  };
  uniformLocations: {
    resolution: WebGLUniformLocation | null;
    scale: WebGLUniformLocation | null;
    translation: WebGLUniformLocation | null;
  };
  imageWidth: number;
  imageHeight: number;
  baseScale: number;
  scale: number;
  minScale: number;
  maxScale: number;
  translation: { x: number; y: number };
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create WebGL shader');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${info || 'unknown error'}`);
  }
  return shader;
};

const createProgram = (gl: WebGLRenderingContext, vertexSrc: string, fragmentSrc: string) => {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSrc);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
  const program = gl.createProgram();
  if (!program) {
    throw new Error('Failed to create WebGL program');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${info || 'unknown error'}`);
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
};

export function WebGLImageViewer({ fileKey, isPublic = true, alt = '', className }: WebGLImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<ViewerState | null>(null);
  const pointerRef = useRef<{ dragging: boolean; lastX: number; lastY: number }>({
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  const highResUrl = useMemo(
    () =>
      getImageUrl(fileKey, isPublic, {
        width: 2560,
        quality: 95,
        format: 'auto',
        fit: 'contain',
      }),
    [fileKey, isPublic],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    setIsReady(false);
    setHasError(false);

    const gl = canvas.getContext('webgl', { alpha: false, antialias: true });
    if (!gl) {
      setHasError(true);
      return;
    }

    let disposed = false;

    const drawScene = (state: ViewerState) => {
      const { gl: context } = state;
      context.viewport(0, 0, context.canvas.width, context.canvas.height);
      context.clearColor(0, 0, 0, 0);
      context.clear(context.COLOR_BUFFER_BIT);

      context.useProgram(state.program);

      context.bindBuffer(context.ARRAY_BUFFER, state.positionBuffer);
      context.enableVertexAttribArray(state.attribLocations.position);
      context.vertexAttribPointer(state.attribLocations.position, 2, context.FLOAT, false, 0, 0);

      context.bindBuffer(context.ARRAY_BUFFER, state.texCoordBuffer);
      context.enableVertexAttribArray(state.attribLocations.texCoord);
      context.vertexAttribPointer(state.attribLocations.texCoord, 2, context.FLOAT, false, 0, 0);

      context.activeTexture(context.TEXTURE0);
      context.bindTexture(context.TEXTURE_2D, state.texture);

      const effectiveScale = state.baseScale * state.scale;
      context.uniform2f(state.uniformLocations.resolution, context.canvas.width, context.canvas.height);
      context.uniform2f(state.uniformLocations.scale, effectiveScale, effectiveScale);
      context.uniform2f(state.uniformLocations.translation, state.translation.x, state.translation.y);

      context.drawArrays(context.TRIANGLES, 0, 6);
    };

    const updatePositionBuffer = (state: ViewerState, width: number, height: number) => {
      state.gl.bindBuffer(state.gl.ARRAY_BUFFER, state.positionBuffer);
      state.gl.bufferData(
        state.gl.ARRAY_BUFFER,
        new Float32Array([
          0, 0,
          width, 0,
          0, height,
          0, height,
          width, 0,
          width, height,
        ]),
        state.gl.STATIC_DRAW,
      );
    };

    const resizeCanvas = () => {
      if (!viewerRef.current) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const targetWidth = Math.max(1, Math.round(rect.width * dpr));
      const targetHeight = Math.max(1, Math.round(rect.height * dpr));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }

      const state = viewerRef.current;
      if (!state) return;

      const scaleX = canvas.width / state.imageWidth;
      const scaleY = canvas.height / state.imageHeight;
      state.baseScale = Math.min(scaleX, scaleY);

      const effectiveScale = state.baseScale * state.scale;
      const displayWidth = state.imageWidth * effectiveScale;
      const displayHeight = state.imageHeight * effectiveScale;

      state.translation.x = (canvas.width - displayWidth) / 2;
      state.translation.y = (canvas.height - displayHeight) / 2;

      drawScene(state);
    };

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';
        img.onload = () => resolve(img);
        img.onerror = (event) => reject(event);
        img.src = src;
      });

    const init = async () => {
      try {
        const program = createProgram(
          gl,
          `
          attribute vec2 a_position;
          attribute vec2 a_texCoord;
          uniform vec2 u_resolution;
          uniform vec2 u_scale;
          uniform vec2 u_translation;
          varying vec2 v_texCoord;

          void main() {
            vec2 scaled = a_position * u_scale + u_translation;
            vec2 zeroToOne = scaled / u_resolution;
            vec2 clipSpace = zeroToOne * 2.0 - 1.0;
            gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
            v_texCoord = a_texCoord;
          }
        `,
          `
          precision mediump float;
          varying vec2 v_texCoord;
          uniform sampler2D u_image;
          void main() {
            gl_FragColor = texture2D(u_image, v_texCoord);
          }
        `,
        );

        const positionLocation = gl.getAttribLocation(program, 'a_position');
        const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
        const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
        const scaleLocation = gl.getUniformLocation(program, 'u_scale');
        const translationLocation = gl.getUniformLocation(program, 'u_translation');

        const positionBuffer = gl.createBuffer();
        const texCoordBuffer = gl.createBuffer();
        if (!positionBuffer || !texCoordBuffer) {
          throw new Error('Failed to create WebGL buffers');
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1,
          ]),
          gl.STATIC_DRAW,
        );

        const texture = gl.createTexture();
        if (!texture) {
          throw new Error('Failed to create WebGL texture');
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        const image = await loadImage(highResUrl);
        if (disposed) return;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        viewerRef.current = {
          gl,
          program,
          positionBuffer,
          texCoordBuffer,
          texture,
          attribLocations: {
            position: positionLocation,
            texCoord: texCoordLocation,
          },
          uniformLocations: {
            resolution: resolutionLocation,
            scale: scaleLocation,
            translation: translationLocation,
          },
          imageWidth: image.width,
          imageHeight: image.height,
          baseScale: 1,
          scale: 1,
          minScale: 1,
          maxScale: 8,
          translation: { x: 0, y: 0 },
        };

        updatePositionBuffer(viewerRef.current, image.width, image.height);
        resizeCanvas();
        setIsReady(true);
      } catch (error) {
        console.error('[WebGLImageViewer] initialization failed', error);
        if (!disposed) {
          setHasError(true);
        }
      }
    };

    const zoomAt = (deltaY: number, clientX: number, clientY: number) => {
      const state = viewerRef.current;
      if (!state) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const canvasX = (clientX - rect.left) * dpr;
      const canvasY = (clientY - rect.top) * dpr;

      const zoomFactor = Math.exp(-deltaY * 0.0015);
      const newScale = clamp(state.scale * zoomFactor, state.minScale, state.maxScale);
      const scaleRatio = newScale / state.scale;

      const offsetX = canvasX - state.translation.x;
      const offsetY = canvasY - state.translation.y;

      state.translation.x = canvasX - offsetX * scaleRatio;
      state.translation.y = canvasY - offsetY * scaleRatio;
      state.scale = newScale;

      drawScene(state);
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(event.deltaY, event.clientX, event.clientY);
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerRef.current = {
        dragging: true,
        lastX: event.clientX,
        lastY: event.clientY,
      };
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerRef.current.dragging) return;
      const state = viewerRef.current;
      if (!state) return;

      const dpr = window.devicePixelRatio || 1;
      const dx = (event.clientX - pointerRef.current.lastX) * dpr;
      const dy = (event.clientY - pointerRef.current.lastY) * dpr;
      pointerRef.current.lastX = event.clientX;
      pointerRef.current.lastY = event.clientY;

      state.translation.x += dx;
      state.translation.y += dy;
      drawScene(state);
    };

    const endDragging = (event: PointerEvent) => {
      if (pointerRef.current.dragging) {
        pointerRef.current.dragging = false;
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
      }
    };

    init();

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', endDragging);
    canvas.addEventListener('pointerleave', endDragging);

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      resizeObserver.disconnect();

      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', endDragging);
      canvas.removeEventListener('pointerleave', endDragging);

      const state = viewerRef.current;
      if (state) {
        state.gl.deleteBuffer(state.positionBuffer);
        state.gl.deleteBuffer(state.texCoordBuffer);
        state.gl.deleteTexture(state.texture);
        state.gl.deleteProgram(state.program);
      }
      viewerRef.current = null;
      pointerRef.current.dragging = false;
    };
  }, [fileKey, highResUrl, isPublic]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden rounded-[1.5rem] bg-black/80 ${className ?? ''}`}
    >
      <canvas
        ref={canvasRef}
        className={`h-full w-full transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}
        style={{ touchAction: 'none' }}
      />
      {!isReady && !hasError && (
        <div className="absolute inset-0">
          <ProgressiveImage
            fileKey={fileKey}
            isPublic={isPublic}
            alt={alt}
            className="absolute inset-0"
            objectFit="contain"
            highResOptions={{ width: 1280, quality: 80, fit: 'contain' }}
          />
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-6 text-white">
          <span className="text-sm text-white/70">WebGL viewer unavailable. Showing fallback image.</span>
          <ProgressiveImage
            fileKey={fileKey}
            isPublic={isPublic}
            alt={alt}
            className="h-[60vh] w-full max-w-3xl"
            objectFit="contain"
            highResOptions={{ width: 1600, quality: 90, fit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
}
