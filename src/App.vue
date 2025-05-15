<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
:root {
  /* Основные цвета приложения */
  --color-primary: #339af0;
  --color-secondary: #ff5722;
  --color-success: #4caf50;
  --color-warning: #ffc107;
  --color-danger: #f44336;
  --color-info: #03a9f4;

  /* Оттенки серого */
  --color-dark: #343a40;
  --color-gray-dark: #495057;
  --color-gray: #6c757d;
  --color-gray-light: #adb5bd;
  --color-gray-lighter: #e9ecef;
  --color-light: #f8f9fa;

  /* Базовые настройки */
  --font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
    'Helvetica Neue', sans-serif;
  --border-radius: 8px;
  --box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  line-height: 1.6;
  color: var(--color-dark);
  background-color: var(--color-light);
  overflow-x: hidden;
}
</style>
