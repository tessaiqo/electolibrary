/**
 * Запускает анимацию «летящее сердечко» от стартовой точки до иконки «Избранное» в шапке.
 * Сердце — это временный DOM-элемент, добавляется в body и удаляется после завершения.
 */
export function flyHeartTo(startEl) {
  const target = document.querySelector('a[href="/favorites"]')
  if (!startEl || !target) return

  const startRect = startEl.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  const startX = startRect.left + startRect.width / 2
  const startY = startRect.top + startRect.height / 2
  const endX = targetRect.left + targetRect.width / 2
  const endY = targetRect.top + targetRect.height / 2

  const heart = document.createElement('div')
  heart.className = 'flying-heart'
  heart.innerHTML = `
    <svg viewBox="0 0 24 24" width="32" height="32">
      <path
        fill="#FB22A5"
        stroke="#000" stroke-width="2" stroke-linejoin="round"
        d="M12 21s-7-4.5-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 5 23 8.5 21.5 12c-2.5 4.5-9.5 9-9.5 9z"
      />
    </svg>
  `
  heart.style.left = startX + 'px'
  heart.style.top = startY + 'px'
  document.body.appendChild(heart)

  // Запускаем анимацию в следующем фрейме, чтобы браузер успел применить стартовые стили
  requestAnimationFrame(() => {
    heart.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(0.4) rotate(-12deg)`
    heart.style.opacity = '0'
  })

  // Удаляем элемент после завершения анимации
  setTimeout(() => heart.remove(), 900)

  // Заодно «пульсируем» иконку избранного в шапке
  target.classList.add('fav-pulse')
  setTimeout(() => target.classList.remove('fav-pulse'), 600)
}