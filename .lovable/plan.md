

## План: улучшить видимость фонового изображения Hero

Сейчас изображение почти не видно из-за тройного затемнения:
1. `opacity-30` на самом `<img>`
2. Gradient overlay `from-background/60 via-background/80 to-background`
3. Radial gradient сверху

**Изменения в `src/pages/Index.tsx`:**
- Поднять opacity изображения с `opacity-30` → `opacity-60`
- Ослабить gradient overlay: `from-background/30 via-background/50 to-background` (низ остаётся непрозрачным для плавного перехода)
- Оставить radial gradient как есть (он минимальный)

Это сделает фото заметно более видимым, сохраняя читаемость текста поверх.

