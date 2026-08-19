<script setup lang="ts">
import { ref } from 'vue'
import { uploadImage } from '@/api/upload'

const props = withDefaults(
  defineProps<{
    modelValue: string
    category?: string
    label?: string
    hint?: string
    squarePreview?: boolean
  }>(),
  { category: 'banners', label: '图片', hint: '', squarePreview: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const uploading = ref(false)
const error = ref('')

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  error.value = ''
  try {
    const url = await uploadImage(file, props.category)
    emit('update:modelValue', url)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '上传失败'
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>

<template>
  <div class="image-upload">
    <label class="label">{{ label }}</label>
    <div class="row">
      <input type="file" accept="image/*" :disabled="uploading" @change="onFileChange" />
      <span v-if="uploading" class="muted">上传中...</span>
    </div>
    <img
      v-if="modelValue"
      :src="modelValue"
      alt=""
      class="preview"
      :class="{ square: squarePreview }"
    />
    <p v-if="hint" class="hint muted">{{ hint }}</p>
    <input
      :value="modelValue"
      class="url-input"
      placeholder="或粘贴图片 URL"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.image-upload {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.875rem;
  font-weight: 600;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preview {
  width: 100%;
  max-height: 160px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.preview.square {
  width: 120px;
  height: 120px;
  max-height: none;
  aspect-ratio: 1;
}

.hint {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.5;
}

.url-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
}
</style>
