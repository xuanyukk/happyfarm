<template>
  <div class="lazy-image-container" :style="{ aspectRatio }">
    <img
      ref="imgRef"
      :src="loaded ? currentSrc : placeholder"
      :alt="alt"
      class="lazy-image"
      :class="{ 'image-loaded': loaded }"
      @load="onLoad"
      @error="onError"
    />
    <div v-if="!loaded && !error" class="loading-placeholder">
      <div class="spinner"></div>
    </div>
    <div v-if="error" class="error-placeholder">
      <span class="error-icon">⚠️</span>
      <span class="error-text">加载失败</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  width: {
    type: [String, Number],
    default: '100%',
  },
  height: {
    type: [String, Number],
    default: 'auto',
  },
  aspectRatio: {
    type: String,
    default: 'auto',
  },
  placeholder: {
    type: String,
    default:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3C/svg%3E',
  },
  threshold: {
    type: Number,
    default: 0.1,
  },
  rootMargin: {
    type: String,
    default: '50px',
  },
  preferWebP: {
    type: Boolean,
    default: true,
  },
});

const imgRef = ref(null);
const loaded = ref(false);
const error = ref(false);
const currentSrc = ref('');
let observer = null;
let supportsWebP = null;

const checkWebPSupport = async () => {
  if (supportsWebP !== null) return supportsWebP;

  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      supportsWebP = webP.height === 2;
      resolve(supportsWebP);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgIgoCAgIAgIA';
  });
};

const getWebPSrc = (originalSrc) => {
  if (!props.preferWebP || !originalSrc || originalSrc.startsWith('data:')) {
    return originalSrc;
  }

  if (originalSrc.endsWith('.webp')) {
    return originalSrc;
  }

  const extMatch = originalSrc.match(/\.(jpg|jpeg|png|gif)$/i);
  if (extMatch) {
    return originalSrc.replace(extMatch[0], '.webp');
  }

  return originalSrc;
};

const onLoad = () => {
  loaded.value = true;
};

const onError = () => {
  if (currentSrc.value !== props.src && !error.value) {
    error.value = false;
    currentSrc.value = props.src;
  } else {
    error.value = true;
    loaded.value = true;
  }
};

const loadImage = async () => {
  const webPSupported = await checkWebPSupport();
  if (webPSupported) {
    currentSrc.value = getWebPSrc(props.src);
  } else {
    currentSrc.value = props.src;
  }
};

onMounted(async () => {
  await checkWebPSupport();

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: props.rootMargin,
        threshold: props.threshold,
      }
    );

    if (imgRef.value) {
      observer.observe(imgRef.value);
    }
  } else {
    loadImage();
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #f0f0f0;
  border-radius: 4px;
}

.lazy-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
  opacity: 0;
}

.lazy-image.image-loaded {
  opacity: 1;
}

.loading-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #ccc;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fee2e2;
  color: #dc2626;
  gap: 8px;
}

.error-icon {
  font-size: 24px;
}

.error-text {
  font-size: 12px;
}
</style>
