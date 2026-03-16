<template>
  <div class="app-container" :class="{ 'dark': isDarkMode }">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const isDarkMode = ref(false)

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', isDarkMode.value.toString())
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

onMounted(() => {
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode) {
    isDarkMode.value = savedDarkMode === 'true'
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark')
    }
  }
})

// 暴露toggleDarkMode方法供子组件使用
defineExpose({
  toggleDarkMode
})
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  background-color: #f5f5f5;
  transition: background-color 0.3s;
}

.app-container.dark {
  background-color: #1a1a1a;
  color: #f0f0f0;
}
</style>
