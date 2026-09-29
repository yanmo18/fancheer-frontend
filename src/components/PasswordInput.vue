<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    autocomplete?: string
    required?: boolean
    maxlength?: number | string
    placeholder?: string
    inputClass?: string
  }>(),
  {
    required: false,
    inputClass: 'auth-input',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const visible = ref(false)
</script>

<template>
  <div class="password-field">
    <label v-if="label" class="auth-label">{{ label }}</label>
    <div class="password-field-wrap">
      <input
        :value="modelValue"
        :class="inputClass"
        :type="visible ? 'text' : 'password'"
        :autocomplete="autocomplete"
        :required="required"
        :maxlength="maxlength"
        :placeholder="placeholder"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        type="button"
        class="password-toggle"
        :aria-label="visible ? '隐藏密码' : '显示密码'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        {{ visible ? '隐藏' : '显示' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.password-field {
  width: 100%;
}

.password-field-wrap {
  position: relative;
}

.password-field-wrap :deep(input) {
  padding-right: 3.5rem;
}

.password-toggle {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0.25rem 0.4rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  cursor: pointer;
}

.password-toggle:hover,
.password-toggle:focus-visible {
  color: var(--accent-primary);
}
</style>
