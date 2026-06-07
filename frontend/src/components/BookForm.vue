<template>
  <form class="book-form" @submit.prevent="onSubmit">
    <!-- Заголовок -->
    <div class="form-group">
      <label>Заголовок <span class="req">*</span></label>
      <input
        v-model.trim="form.title"
        type="text"
        maxlength="300"
        :class="{ 'is-error': errors.title }"
      />
      <p v-if="errors.title" class="form-error">{{ errors.title }}</p>
    </div>

    <!-- Автор -->
    <div class="form-group">
      <label>Автор <span class="req">*</span></label>
      <input
        v-model.trim="form.author"
        type="text"
        maxlength="300"
        :class="{ 'is-error': errors.author }"
      />
      <p v-if="errors.author" class="form-error">{{ errors.author }}</p>
    </div>

    <!-- Описание (textarea) -->
    <div class="form-group">
      <label>Описание</label>
      <textarea
        v-model.trim="form.description"
        rows="4"
        placeholder="краткая аннотация…"
      ></textarea>
    </div>

    <!-- Двухколоночный блок -->
    <div class="form-row">
      <!-- Издательство (select) -->
      <div class="form-group">
        <label>Издательство</label>
        <select v-model="form.publisher">
          <option value="">— не указано —</option>
          <option v-for="p in publishers" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>

      <!-- Год (number с .number) -->
      <div class="form-group">
        <label>Год издания</label>
        <input
          v-model.number="form.year"
          type="number"
          min="0"
          max="2100"
          :class="{ 'is-error': errors.year }"
        />
        <p v-if="errors.year" class="form-error">{{ errors.year }}</p>
      </div>
    </div>

    <!-- Категория (radio) -->
    <div class="form-group">
      <label>Возрастной рейтинг</label>
      <div class="radio-row">
        <label v-for="c in categories" :key="c" class="radio-item">
          <input type="radio" v-model="form.category" :value="c" />
          <span>{{ c }}</span>
        </label>
      </div>
    </div>

    <!-- Статус (checkbox) -->
    <div class="form-group">
      <label class="check-item">
        <input type="checkbox" v-model="form.in_stock" />
        <span>в наличии</span>
      </label>
    </div>

    <!-- Загрузка обложки: drop zone -->
    <div class="form-group">
      <label>Обложка (jpg/png/webp, до 5 МБ)</label>

      <div
        class="dropzone"
        :class="{ 'is-dragover': isDragging, 'is-uploading': uploading }"
        @click="$refs.fileInput.click()"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="dropzone__input"
          @change="onFileChange"
        />

        <div v-if="uploading" class="dropzone__state">
          <div class="dropzone__spinner"></div>
          <span>загружаем…</span>
        </div>

        <div v-else-if="form.cover_url" class="cover-preview">
          <img :src="form.cover_url" alt="preview" />
          <div class="cover-preview__info">
            <p class="form-hint">обложка загружена</p>
            <button
              type="button"
              class="btn-small btn-delete"
              @click.stop="clearCover"
            >
              Убрать
            </button>
          </div>
        </div>

        <div v-else class="dropzone__state">
          <svg
            class="dropzone__icon"
            viewBox="0 0 24 24"
            width="32"
            height="32"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <span class="dropzone__primary">
            {{
              isDragging ? "отпустите файл" : "перетащите обложку или нажмите"
            }}
          </span>
          <span class="dropzone__hint">jpg · png · webp, до 5 МБ</span>
        </div>
      </div>

      <p v-if="errors.cover" class="form-error">{{ errors.cover }}</p>
    </div>

    <!-- Кнопки -->
    <div class="form-actions">
      <button type="submit" class="btn" :disabled="submitting || uploading">
        {{ submitting ? "..." : isEdit ? "Сохранить" : "Создать" }}
      </button>
      <button type="button" class="btn btn-ghost" @click="$emit('cancel')">
        Отмена
      </button>
    </div>

    <p v-if="submitError" class="form-error form-error--big">
      {{ submitError }}
    </p>
  </form>
</template>

<script>
import { bookService } from "@/services/api.js";

const EMPTY = () => ({
  title: "",
  author: "",
  description: "",
  publisher: "",
  year: null,
  category: "0+",
  cover_url: null,
  in_stock: true,
});

export default {
  name: "BookForm",
  props: {
    initial: { type: Object, default: null }, // данные для редактирования
    isEdit: { type: Boolean, default: false },
  },
  emits: ["submit", "cancel"],
  data() {
    return {
      form: EMPTY(),
      errors: {},
      submitting: false,
      submitError: "",
      uploading: false,
      isDragging: false,
      categories: ["0+", "6+", "12+", "16+", "18+"],
      publishers: [
        "АСТ",
        "Эксмо",
        "Азбука",
        "МИФ",
        "Вагриус",
        "Penguin",
        "Random House",
        "Taschen",
      ],
    };
  },
  watch: {
    // Подхватываем initial, когда оно приедет из родителя (асинхронно)
    initial: {
      immediate: true,
      handler(val) {
        if (val) this.form = { ...EMPTY(), ...val };
      },
    },
  },
  methods: {
    validate() {
      const e = {};
      if (!this.form.title || this.form.title.length < 2) {
        e.title = "Минимум 2 символа";
      }
      if (!this.form.author || this.form.author.length < 2) {
        e.author = "Минимум 2 символа";
      }
      if (
        this.form.year !== null &&
        this.form.year !== "" &&
        this.form.year !== undefined
      ) {
        const y = Number(this.form.year);
        if (Number.isNaN(y) || y < 0 || y > 2100) {
          e.year = "Год от 0 до 2100";
        }
      }
      this.errors = e;
      return Object.keys(e).length === 0;
    },

    async onFileChange(event) {
  const file = event.target.files[0]
  if (!file) return
  await this.uploadFile(file)
},

async onDrop(event) {
  this.isDragging = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    this.errors.cover = 'Можно перетащить только изображение'
    return
  }
  await this.uploadFile(file)
},

onDragLeave(event) {
  // Срабатывает при пересечении границы любого вложенного элемента,
  // поэтому проверяем, что мы реально покинули dropzone
  if (event.currentTarget.contains(event.relatedTarget)) return
  this.isDragging = false
},

async uploadFile(file) {
  this.errors.cover = ''
  this.uploading = true
  try {
    const { data } = await bookService.uploadCover(file)
    this.form.cover_url = data.cover_url
  } catch (err) {
    this.errors.cover = err.response?.data?.detail || 'Ошибка загрузки'
  } finally {
    this.uploading = false
  }
},

    clearCover() {
      this.form.cover_url = null;
      if (this.$refs.fileInput) this.$refs.fileInput.value = "";
    },

    async onSubmit() {
      this.submitError = "";
      if (!this.validate()) return;

      this.submitting = true;
      try {
        // year — нормализуем пустую строку в null
        const payload = {
          ...this.form,
          year: this.form.year === "" ? null : this.form.year,
        };
        this.$emit("submit", payload);
      } catch (err) {
        this.submitError = err.message;
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>
