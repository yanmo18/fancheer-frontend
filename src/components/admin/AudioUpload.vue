<script setup lang="ts">
import { ref } from 'vue'
import { uploadAudio } from '@/api/upload'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
  }>(),
  { label: '音频' },
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
    const url = await uploadAudio(file)
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
  <div class="audio-upload">
    <label class="label">{{ label }}</label>
    <div class="row">
      <input type="file" accept="audio/*,.m4a,audio/mp4,audio/x-m4a" :disabled="uploading" @change="onFileChange" />
      <span v-if="uploading" class="muted">上传中...</span>
    </div>
    <audio v-if="modelValue" controls :src="modelValue" class="preview" />
    <input
      :value="modelValue"
      class="url-input"
      placeholder="或粘贴音频 URL"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.audio-upload {
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
}

.url-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
}
</style>
