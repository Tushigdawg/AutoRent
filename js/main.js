// Данные автомобилей, классов и услуг лежат в js/cars.js (подключается раньше).

// ===============================
// 0. Вспомогательные функции
// ===============================
const byId = (id) => document.getElementById(id);
const getCar = (id) => CARS.find((car) => car.id === Number(id));
const carName = (car) => `${car.brand} ${car.model}`;
const formatPrice = (n) => `${Math.round(n).toLocaleString('ru-RU')} ₽`;

// Склонение слов: pluralize(5, ['сутки', 'суток', 'суток']).
function pluralize(n, forms) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return forms[0];
  if (last >= 2 && last <= 4 && (lastTwo < 10 || lastTwo >= 20)) return forms[1];
  return forms[2];
}

const DAYS_FORMS = ['сутки', 'суток', 'суток'];
const CARS_FORMS = ['автомобиль', 'автомобиля', 'автомобилей'];

// Даты храним в формате ГГГГ-ММ-ДД (как в <input type="date">).
function toISODate(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
const todayISO = () => toISODate(new Date());

function addDays(iso, n) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + n);
  return toISODate(date);
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// Количество суток аренды (минимум 1). Если даты неверные — 0.
function daysBetween(start, end) {
  if (!start || !end) return 0;
  const diff = Math.round((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000);
  return diff < 0 ? 0 : Math.max(1, diff);
}

// Расчёт стоимости аренды: цена × сутки − скидка за срок + доп. услуги.
function calcRental(car, days, extraIds) {
  const base = car.price * days;
  const rule = DISCOUNTS.find((item) => days >= item.from);
  const percent = rule ? rule.percent : 0;
  const discount = Math.round((base * percent) / 100);
  const extras = extraIds
    .filter((id) => EXTRAS[id])
    .map((id) => ({ id, label: EXTRAS[id].label, sum: EXTRAS[id].perDay * days }));
  const extrasSum = extras.reduce((sum, item) => sum + item.sum, 0);
  return { days, base, percent, discount, extras, extrasSum, total: base - discount + extrasSum };
}

// Текст-пояснение к расчёту.
function describeRental(car, r) {
  let text = `${r.days} ${pluralize(r.days, DAYS_FORMS)} × ${formatPrice(car.price)} = ${formatPrice(r.base)}`;
  if (r.percent) text += `; скидка −${r.percent}% (−${formatPrice(r.discount)})`;
  if (r.extrasSum) text += `; доп. услуги: ${formatPrice(r.extrasSum)}`;
  return `${text}. Залог: ${formatPrice(car.deposit)} (возвращается при сдаче автомобиля).`;
}

// ===============================
// 1. Избранное (сохраняется в браузере)
// ===============================
const FAVORITES_KEY = 'autorent:favorites';

function loadFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []);
  } catch (error) {
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch (error) {
    // Хранилище недоступно — избранное работает до перезагрузки страницы.
  }
}

const favorites = loadFavorites();

// Обновляем кнопки «В избранное» и подсветку карточек.
function syncFavorites() {
  document.querySelectorAll('[data-favorite]').forEach((button) => {
    const isFavorite = favorites.has(Number(button.dataset.favorite));
    button.setAttribute('aria-pressed', String(isFavorite));
    const card = button.closest('.product-card');
    if (card) card.classList.toggle('product-card--favorite', isFavorite);
  });

  // Счётчик избранного в шапке.
  const counter = byId('fav-count');
  if (counter) counter.textContent = favorites.size;
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-favorite]');
  if (!button) return;

  const id = Number(button.dataset.favorite);
  if (favorites.has(id)) {
    favorites.delete(id);
  } else {
    favorites.add(id);
  }
  saveFavorites();
  syncFavorites();
  document.dispatchEvent(new CustomEvent('favorites:changed'));
});

// ===============================
// 2. Карточки автомобилей
// ===============================
const discountPercent = (car) => (car.old ? Math.round(((car.old - car.price) / car.old) * 100) : 0);

function badgeHTML(car) {
  if (car.out) return '<span class="badge badge--out product-card__badge">Занят</span>';
  if (car.tag === 'hit') return '<span class="badge product-card__badge">Хит</span>';
  if (car.tag === 'new') return '<span class="badge badge--new product-card__badge">Новинка</span>';
  if (car.tag === 'discount') return `<span class="badge badge--discount product-card__badge">&minus;${discountPercent(car)}%</span>`;
  return '';
}

function priceHTML(car) {
  const old = car.old
    ? `<span class="visually-hidden">старая цена </span><s class="product-card__price-old">${formatPrice(car.old)}</s> <span class="visually-hidden">новая цена </span>`
    : '';
  return `${old}${formatPrice(car.price)} <small>/ сутки</small>`;
}

function cardHTML(car, horizontal) {
  const modifiers = [];
  if (car.tag === 'hit') modifiers.push('product-card--featured');
  if (car.tag === 'new') modifiers.push('product-card--new');
  if (car.tag === 'discount') modifiers.push('product-card--discount');
  if (car.out) modifiers.push('product-card--unavailable');
  if (horizontal) modifiers.push('product-card--horizontal');

  const tags = [car.tag, car.out ? 'out' : 'in-stock'].filter(Boolean).join(' ');
  const url = `product.html?id=${car.id}`;
  const name = carName(car);

  return `
    <article class="product-card ${modifiers.join(' ')}" data-id="${car.id}" data-name="${name}" data-brand="${car.brand}" data-body="${car.body}" data-price="${car.price}" data-category="${car.cls}" data-tags="${tags}" data-order="${car.id}">
      <a class="product-card__media" href="${url}" tabindex="-1" aria-hidden="true"><img class="product-card__image" src="images/${car.img}" alt="" loading="lazy"></a>
      ${badgeHTML(car)}
      <div class="product-card__body">
        <h3 class="product-card__title"><a class="product-card__link" href="${url}">${name}</a></h3>
        <p class="product-card__meta">${car.body} · ${car.gearbox.split(' (')[0]} · ${car.seats} ${pluralize(car.seats, ['место', 'места', 'мест'])} · ${car.year}</p>
        <p class="product-card__description">${car.desc}</p>
        <p class="product-card__price">${priceHTML(car)}</p>
        <p class="stock ${car.out ? 'stock--out' : 'stock--in'}">${car.out ? 'Сейчас занят' : 'Свободен'}</p>
      </div>
      <div class="product-card__actions">
        <button class="button button--primary" type="button" data-rent data-car-id="${car.id}"${car.out ? ' disabled' : ''}>Арендовать</button>
        <a class="button button--secondary" href="${url}">Подробнее</a>
        <button class="button button--ghost button--icon" type="button" data-favorite="${car.id}" aria-pressed="false" aria-label="Добавить в избранное" title="В избранное"></button>
      </div>
    </article>`;
}

// Список марок для выпадающих списков.
document.querySelectorAll('[data-brand-options]').forEach((select) => {
  [...new Set(CARS.map((car) => car.brand))].sort().forEach((brand) => {
    select.append(new Option(brand, brand));
  });
});

// Список типов кузова для фильтра.
document.querySelectorAll('[data-body-options]').forEach((select) => {
  [...new Set(CARS.map((car) => car.body))].sort().forEach((body) => {
    select.append(new Option(body, body));
  });
});

// ===============================
// 3. Каталог и категория: фильтры и сортировка
// ===============================
const productsGrid = document.querySelector('[data-sortable]');

if (productsGrid) {
  const isCategoryPage = productsGrid.hasAttribute('data-category-page');
  const filtersForm = byId('filters-form');
  const sortSelect = byId('sort-select');
  const resultsCount = byId('results-count');
  const emptyMessage = byId('catalog-empty');

  // На странице категории показываем только автомобили выбранного класса.
  let list = CARS;
  if (isCategoryPage) {
    const requested = new URLSearchParams(window.location.search).get('category');
    const key = CLASSES[requested] ? requested : 'suv';
    const info = CLASSES[key];
    list = CARS.filter((car) => car.cls === key);

    document.title = `${info.name} — аренда автомобилей | AutoRent`;
    byId('category-title').textContent = info.name;
    byId('category-text').textContent = info.text;
    byId('crumb-current').textContent = info.name;
    byId('category-rules').innerHTML =
      `<li>Возраст от ${info.minAge} лет</li><li>Стаж от ${info.minExperience} ${pluralize(info.minExperience, ['года', 'лет', 'лет'])}</li><li>В классе: ${list.length} ${pluralize(list.length, CARS_FORMS)}</li>`;

    byId('other-categories').innerHTML =
      Object.entries(CLASSES)
        .map(([id, item]) => {
          const count = CARS.filter((car) => car.cls === id).length;
          return `<a class="category-card${id === key ? ' category-card--current' : ''}" href="category.html?category=${id}"${id === key ? ' aria-current="page"' : ''}>
            <span class="category-card__media"><img class="category-card__image" src="images/${item.image}" alt="" loading="lazy"></span>
            <h3 class="category-card__title">${item.name}</h3>
            <p class="category-card__text">${count} ${pluralize(count, CARS_FORMS)}</p>
          </a>`;
        })
        .join('') +
      `<a class="category-card" href="catalog.html">
        <span class="category-card__media"><img class="category-card__image" src="images/ferrari.jpg" alt="" loading="lazy"></span>
        <h3 class="category-card__title">Весь каталог</h3>
        <p class="category-card__text">${CARS.length} ${pluralize(CARS.length, CARS_FORMS)}</p>
      </a>`;
  }

  productsGrid.innerHTML = list.map((car) => cardHTML(car, isCategoryPage)).join('');
  const cards = Array.from(productsGrid.querySelectorAll('.product-card'));

  const comparators = {
    default: (a, b) => a.dataset.order - b.dataset.order,
    'price-asc': (a, b) => a.dataset.price - b.dataset.price,
    'price-desc': (a, b) => b.dataset.price - a.dataset.price,
    name: (a, b) => a.dataset.name.localeCompare(b.dataset.name, 'en'),
  };

  // Проверяем, подходит ли карточка под выбранные фильтры.
  function matches(card, filter) {
    const tags = card.dataset.tags.split(' ');
    const price = Number(card.dataset.price);
    const id = Number(card.dataset.id);

    return (
      (!filter.query || card.dataset.name.toLowerCase().includes(filter.query)) &&
      (!filter.brand || card.dataset.brand === filter.brand) &&
      (!filter.body || card.dataset.body === filter.body) &&
      (!filter.categories.length || filter.categories.includes(card.dataset.category)) &&
      filter.statuses.every((status) => (status === 'favorite' ? favorites.has(id) : tags.includes(status))) &&
      (Number.isNaN(filter.min) || price >= filter.min) &&
      (Number.isNaN(filter.max) || price <= filter.max)
    );
  }

  function updateCatalog() {
    const data = filtersForm ? new FormData(filtersForm) : null;
    const filter = {
      query: data ? String(data.get('q') || '').trim().toLowerCase() : '',
      brand: data ? String(data.get('brand') || '') : '',
      body: data ? String(data.get('body') || '') : '',
      categories: data ? data.getAll('category') : [],
      statuses: data ? data.getAll('status') : [],
      min: data ? parseFloat(data.get('price-from')) : NaN,
      max: data ? parseFloat(data.get('price-to')) : NaN,
    };

    // Сортируем карточки и переставляем их в сетке.
    const sorted = [...cards].sort(comparators[sortSelect ? sortSelect.value : 'default']);
    sorted.forEach((card) => productsGrid.append(card));

    // Скрываем карточки, которые не подошли под фильтры.
    let visible = 0;
    cards.forEach((card) => {
      const isVisible = matches(card, filter);
      card.hidden = !isVisible;
      if (isVisible) visible += 1;
    });

    // Счётчик объявляется скринридером через role="status".
    resultsCount.textContent = `Найдено: ${visible} ${pluralize(visible, CARS_FORMS)}`;
    if (emptyMessage) emptyMessage.hidden = visible > 0;
  }

  if (filtersForm) {
    // Параметры из адреса (ссылки из категорий и быстрого подбора на главной).
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const checkbox = category && filtersForm.querySelector(`input[name="category"][value="${category}"]`);
    if (checkbox) checkbox.checked = true;

    const brand = params.get('brand');
    if (brand && [...filtersForm.elements.brand.options].some((option) => option.value === brand)) {
      filtersForm.elements.brand.value = brand;
    }
    const body = params.get('body');
    if (body && [...filtersForm.elements.body.options].some((option) => option.value === body)) {
      filtersForm.elements.body.value = body;
    }
    const status = params.get('status');
    const statusBox = status && filtersForm.querySelector(`input[name="status"][value="${status}"]`);
    if (statusBox) statusBox.checked = true;
    if (params.get('price-to')) filtersForm.elements['price-to'].value = params.get('price-to');
    if (params.get('q')) filtersForm.elements.q.value = params.get('q');

    filtersForm.addEventListener('submit', (event) => {
      event.preventDefault();
      updateCatalog();
    });
    filtersForm.addEventListener('change', updateCatalog);
    filtersForm.addEventListener('input', updateCatalog);
    filtersForm.addEventListener('reset', () => setTimeout(updateCatalog, 0));
  }

  if (sortSelect) sortSelect.addEventListener('change', updateCatalog);
  document.addEventListener('favorites:changed', updateCatalog);
  updateCatalog();
}

// ===============================
// 4. Главная страница: выбор автомобиля в первом экране
// ===============================
const heroThumbs = byId('hero-thumbs');

if (heroThumbs) {
  const HERO_IDS = [20, 1, 12, 15];
  const heroImage = byId('hero-image');
  const heroName = byId('hero-name');
  const heroPrice = byId('hero-car-price');
  const heroLink = byId('hero-link');

  heroThumbs.innerHTML = HERO_IDS.map((id) => {
    const car = getCar(id);
    return `<li><button class="hero__thumb" type="button" data-hero-car="${id}" aria-pressed="false" aria-label="Показать ${carName(car)}"><img src="images/${car.img}" alt=""></button></li>`;
  }).join('');

  function showHeroCar(id) {
    const car = getCar(id);
    heroImage.src = `images/${car.img}`;
    heroImage.alt = carName(car);
    heroName.textContent = carName(car);
    heroPrice.textContent = `от ${formatPrice(car.price)} / сутки`;
    heroLink.href = `product.html?id=${car.id}`;
    heroThumbs.querySelectorAll('[data-hero-car]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.heroCar) === car.id));
    });
  }

  heroThumbs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-hero-car]');
    if (button) showHeroCar(button.dataset.heroCar);
  });

  showHeroCar(HERO_IDS[0]);
}

syncFavorites();

// ===============================
// 5. Модальное окно бронирования
// ===============================
// Эту функцию переопределяет страница автомобиля: она отдаёт даты и услуги из калькулятора.
let getCalcState = null;
const orderDialog = byId('order-dialog');

if (orderDialog) {
  const orderForm = byId('order-form');
  const carSelect = byId('order-car');
  const startInput = byId('order-start');
  const endInput = byId('order-end');
  const phoneInput = byId('order-phone');
  const dialogProduct = byId('order-dialog-product');
  const successMessage = byId('success-message');
  const successToast = byId('success-toast');
  const summary = byId('order-form-summary');
  const summaryList = byId('order-summary-list');
  const totalBox = byId('order-total');
  const totalText = byId('order-total-text');
  const submitButton = orderForm.querySelector('[type="submit"]');
  const fields = Array.from(orderForm.querySelectorAll('[required], [pattern]'));
  const extraBoxes = Array.from(orderForm.querySelectorAll('input[name="extras"]'));

  let lastTrigger = null;

  // Список автомобилей в форме: по классам, занятые отключены.
  carSelect.append(new Option('Выберите автомобиль', ''));
  Object.entries(CLASSES).forEach(([key, info]) => {
    const group = document.createElement('optgroup');
    group.label = info.name;
    CARS.filter((car) => car.cls === key).forEach((car) => {
      const option = new Option(`${carName(car)} — ${formatPrice(car.price)}/сутки${car.out ? ' (занят)' : ''}`, car.id);
      option.disabled = Boolean(car.out);
      group.append(option);
    });
    carSelect.append(group);
  });

  // Уведомление об успешной отправке: показывается 10 секунд или до нажатия на крестик.
  let toastTimer = null;

  function showToast(text) {
    clearTimeout(toastTimer);
    successMessage.textContent = text;
    successToast.hidden = false;
    toastTimer = setTimeout(hideToast, 10000);
  }

  function hideToast() {
    clearTimeout(toastTimer);
    successMessage.textContent = '';
    successToast.hidden = true;
  }

  successToast.querySelector('[data-close-toast]').addEventListener('click', hideToast);

  const checkedExtras = () => extraBoxes.filter((box) => box.checked).map((box) => box.value);

  // Итоговая стоимость пересчитывается при любом изменении формы.
  function updateTotal() {
    const car = getCar(carSelect.value);
    dialogProduct.textContent = car ? `${carName(car)} — ${formatPrice(car.price)} / сутки` : 'автомобиль не выбран';

    if (!car) {
      totalBox.textContent = 'Итого: —';
      totalText.textContent = 'Выберите автомобиль и даты аренды, чтобы увидеть стоимость.';
      return;
    }
    const days = daysBetween(startInput.value, endInput.value);
    if (!days) {
      totalBox.textContent = 'Итого: —';
      totalText.textContent = 'Укажите даты аренды: возврат не может быть раньше начала.';
      return;
    }
    const result = calcRental(car, days, checkedExtras());
    totalBox.textContent = `Итого: ${formatPrice(result.total)}`;
    totalText.textContent = describeRental(car, result);
  }

  // --- Открытие и закрытие ---
  function openOrder(options) {
    lastTrigger = options.trigger || null;
    orderForm.reset();
    fields.forEach(clearError);
    summary.hidden = true;
    hideToast();

    const today = todayISO();
    startInput.min = today;
    startInput.value = options.start || addDays(today, 1);
    endInput.min = startInput.value;
    endInput.value = options.end || addDays(startInput.value, 3);

    carSelect.value = options.carId && getCar(options.carId) && !getCar(options.carId).out ? options.carId : '';
    extraBoxes.forEach((box) => {
      box.checked = (options.extras || []).includes(box.value);
    });

    updateTotal();
    orderDialog.showModal();
    document.body.classList.add('is-scroll-locked');
    (carSelect.value ? byId('order-name') : carSelect).focus();
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-rent]');
    if (!button || button.disabled) return;

    const options = { trigger: button, carId: button.dataset.carId || '' };
    if (button.hasAttribute('data-from-calc') && getCalcState) Object.assign(options, getCalcState());
    openOrder(options);
  });

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => orderDialog.close());
  });

  // Закрытие по клику на затемнённый фон (не при выделении текста мышью).
  let pressStartedOnBackdrop = false;
  orderDialog.addEventListener('mousedown', (event) => {
    pressStartedOnBackdrop = event.target === orderDialog;
  });
  orderDialog.addEventListener('click', (event) => {
    if (event.target === orderDialog && pressStartedOnBackdrop) orderDialog.close();
  });

  // Срабатывает и при Esc: возвращаем прокрутку и фокус на кнопку, открывшую окно.
  orderDialog.addEventListener('close', () => {
    document.body.classList.remove('is-scroll-locked');
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
  });

  // --- Маска телефона: +7 (900) 000-00-00 ---
  phoneInput.addEventListener('input', () => {
    let digits = phoneInput.value.replace(/\D/g, '');
    if (digits[0] === '7' || digits[0] === '8') digits = digits.slice(1);
    digits = digits.slice(0, 10);

    let masked = '';
    if (digits.length) masked = `+7 (${digits.slice(0, 3)}`;
    if (digits.length > 3) masked += `) ${digits.slice(3, 6)}`;
    if (digits.length > 6) masked += `-${digits.slice(6, 8)}`;
    if (digits.length > 8) masked += `-${digits.slice(8, 10)}`;
    phoneInput.value = masked;
  });

  // --- Даты: возврат не раньше начала ---
  startInput.addEventListener('change', () => {
    endInput.min = startInput.value;
    if (startInput.value && endInput.value < startInput.value) {
      endInput.value = addDays(startInput.value, 1);
    }
    if (endInput.hasAttribute('aria-invalid')) recheck(endInput);
  });

  orderForm.addEventListener('input', updateTotal);
  orderForm.addEventListener('change', updateTotal);

  // --- Валидация ---
  const messages = {
    car: { valueMissing: 'Выберите автомобиль' },
    name: { valueMissing: 'Введите имя' },
    email: { valueMissing: 'Введите e-mail', typeMismatch: 'Введите e-mail в формате example@mail.ru' },
    phone: { valueMissing: 'Введите телефон', patternMismatch: 'Введите телефон в формате +7 (900) 000-00-00' },
    start: { valueMissing: 'Укажите дату начала аренды' },
    end: { valueMissing: 'Укажите дату окончания аренды' },
    place: { valueMissing: 'Выберите место получения' },
    agreement: { valueMissing: 'Подтвердите согласие на обработку данных' },
  };

  function getMessage(field) {
    field.setCustomValidity('');
    if (field.name === 'name' && field.value.trim().length < 2) {
      field.setCustomValidity(field.value.trim() ? 'Имя должно содержать не менее 2 символов' : '');
    }
    if (field.name === 'start' && field.value && field.value < todayISO()) {
      field.setCustomValidity('Дата начала не может быть в прошлом');
    }
    if (field.name === 'end' && field.value && startInput.value && field.value < startInput.value) {
      field.setCustomValidity('Дата окончания не может быть раньше даты начала');
    }

    const validity = field.validity;
    if (validity.valid) return '';
    if (validity.customError) return field.validationMessage;

    const key = ['valueMissing', 'typeMismatch', 'patternMismatch'].find((k) => validity[k]);
    return (messages[field.name] && messages[field.name][key]) || 'Проверьте значение поля';
  }

  function clearError(field) {
    const error = byId(`${field.id}-error`);
    field.removeAttribute('aria-invalid');
    error.textContent = '';
    error.hidden = true;
  }

  // Проверяем одно поле: выставляем aria-invalid и текст ошибки рядом с полем.
  function validateField(field) {
    const message = getMessage(field);
    if (!message) {
      clearError(field);
      return;
    }
    const error = byId(`${field.id}-error`);
    field.setAttribute('aria-invalid', 'true');
    error.textContent = message;
    error.hidden = false;
  }

  // Список ошибок в начале формы со ссылками на поля.
  function refreshSummary(shouldFocus) {
    const invalid = fields.filter((field) => field.getAttribute('aria-invalid') === 'true');
    summaryList.innerHTML = '';

    invalid.forEach((field) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${field.id}`;
      link.textContent = byId(`${field.id}-error`).textContent;
      item.append(link);
      summaryList.append(item);
    });

    summary.hidden = invalid.length === 0;
    if (shouldFocus && invalid.length) summary.focus();
  }

  summaryList.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    event.preventDefault();
    document.querySelector(link.getAttribute('href')).focus();
  });

  function recheck(field) {
    validateField(field);
    if (!summary.hidden) refreshSummary(false);
  }

  fields.forEach((field) => {
    // Ошибка появляется после ухода с заполненного поля, а исчезает сразу после исправления.
    field.addEventListener('blur', () => {
      if (field.type !== 'checkbox' && (field.value || field.hasAttribute('aria-invalid'))) recheck(field);
    });
    ['input', 'change'].forEach((type) => {
      field.addEventListener(type, () => {
        if (field.hasAttribute('aria-invalid')) recheck(field);
      });
    });
  });

  // --- Отправка ---
  orderForm.addEventListener('submit', (event) => {
    // Backend пока не подключён, поэтому стандартную отправку отменяем.
    event.preventDefault();

    fields.forEach(validateField);
    refreshSummary(true);
    if (orderForm.querySelector('[aria-invalid="true"]')) return;

    const car = getCar(carSelect.value);
    const days = daysBetween(startInput.value, endInput.value);
    const result = calcRental(car, days, checkedExtras());
    const method = orderForm.elements['contact-method'].value === 'email' ? 'e-mail' : 'телефону';
    const message =
      `Заявка принята! ${carName(car)}, с ${formatDate(startInput.value)} по ${formatDate(endInput.value)} ` +
      `(${days} ${pluralize(days, DAYS_FORMS)}), итого ${formatPrice(result.total)}. Мы свяжемся с вами по ${method}.`;

    // Имитируем отправку на сервер: показываем состояние загрузки.
    submitButton.disabled = true;
    submitButton.classList.add('button--loading');
    submitButton.textContent = 'Отправляем';

    setTimeout(() => {
      orderForm.reset();
      orderDialog.close();

      submitButton.disabled = false;
      submitButton.classList.remove('button--loading');
      submitButton.textContent = 'Отправить заявку';

      showToast(message);
    }, 700);
  });
}

// ===============================
// 6. Карточка автомобиля (product.html?id=N)
// ===============================
const productPage = document.querySelector('.product-details');

if (productPage) {
  // Номер автомобиля берём из адреса: product.html?id=8. Если он неверный — показываем первый.
  const requested = new URLSearchParams(window.location.search).get('id');
  const car = getCar(requested) || CARS[0];
  const info = CLASSES[car.cls];
  const name = carName(car);
  const percent = discountPercent(car);

  document.title = `${name} — аренда автомобиля | AutoRent`;
  byId('product-title').textContent = name;
  byId('crumb-current').textContent = name;

  const image = byId('product-image');
  image.src = `images/${car.img}`;
  image.alt = name;
  byId('product-caption').textContent = `${name}, ${car.year} · цвет: ${car.color.toLowerCase()}`;

  const crumb = byId('crumb-category');
  crumb.textContent = info.name;
  crumb.href = `category.html?category=${car.cls}`;

  // Бейдж.
  const badge = byId('product-badge');
  const badges = {
    hit: ['Хит', ''],
    new: ['Новинка', 'badge--new'],
    discount: [`−${percent}%`, 'badge--discount'],
  };
  if (car.out) {
    badge.textContent = 'Занят';
    badge.className = 'badge badge--out';
  } else if (badges[car.tag]) {
    badge.textContent = badges[car.tag][0];
    badge.className = `badge ${badges[car.tag][1]}`.trim();
  } else {
    badge.hidden = true;
  }

  byId('product-rating').textContent =
    `Рейтинг: ${car.rating} из 5 (${car.reviews} ${pluralize(car.reviews, ['отзыв', 'отзыва', 'отзывов'])})`;
  byId('product-price').innerHTML = car.old
    ? `<s class="product-card__price-old"><span class="visually-hidden">Старая цена: </span>${formatPrice(car.old)}</s> <span class="visually-hidden">Новая цена: </span>${formatPrice(car.price)} <small>/ сутки</small>`
    : `${formatPrice(car.price)} <small>/ сутки</small>`;

  const stock = byId('product-stock');
  stock.className = car.out ? 'stock stock--out' : 'stock stock--in';
  stock.textContent = car.out ? 'Сейчас занят. Посмотрите похожие автомобили ниже' : 'Свободен для бронирования';

  byId('product-short').textContent = `${name} — класс «${info.name}». ${car.desc}`;
  byId('product-long').textContent =
    `${car.desc} Автомобиль ${car.year} года: двигатель — ${car.engine}, ${car.power} л.с.; ` +
    `коробка передач — ${car.gearbox}; привод — ${car.drive.toLowerCase()}. Средний расход: ${car.consumption}.`;
  byId('product-features').innerHTML =
    `<li>${car.gearbox}, привод ${car.drive.toLowerCase()};</li>` +
    `<li>мощность ${car.power} л.с., расход ${car.consumption};</li>` +
    `<li>${car.seats} ${pluralize(car.seats, ['место', 'места', 'мест'])}, багажник: ${car.trunk};</li>` +
    '<li>включено 300 км пробега в сутки.</li>';

  // Кнопка бронирования и избранное.
  const orderButton = byId('product-order-button');
  orderButton.dataset.carId = car.id;
  orderButton.disabled = Boolean(car.out);
  byId('product-favorite').dataset.favorite = car.id;

  // Таблица характеристик.
  const groups = [
    ['Основное', [
      ['Марка', car.brand], ['Модель', car.model], ['Год выпуска', car.year],
      ['Класс', info.name], ['Тип кузова', car.body], ['Цвет', car.color],
    ]],
    ['Двигатель и трансмиссия', [
      ['Двигатель', car.engine], ['Мощность', `${car.power} л.с.`], ['Коробка передач', car.gearbox],
      ['Привод', car.drive], ['Топливо', car.fuel], ['Средний расход', car.consumption],
    ]],
    ['Салон и багажник', [
      ['Количество мест', car.seats], ['Багажник', car.trunk],
    ]],
    ['Условия аренды', [
      ['Залог', formatPrice(car.deposit)], ['Минимальный возраст', `${info.minAge} лет`],
      ['Минимальный стаж', `${info.minExperience} ${pluralize(info.minExperience, ['год', 'года', 'лет'])}`],
      ['Пробег', '300 км в сутки включено'],
    ]],
  ];
  byId('specs-table').innerHTML =
    `<caption>Характеристики: ${name}</caption>` +
    groups
      .map(([title, rows]) =>
        `<tbody><tr class="data-table__group"><th scope="rowgroup" colspan="2">${title}</th></tr>` +
        rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('') + '</tbody>')
      .join('');

  // Условия аренды.
  byId('rule-age').textContent =
    `От ${info.minAge} лет, водительский стаж от ${info.minExperience} ${pluralize(info.minExperience, ['года', 'лет', 'лет'])}.`;
  byId('rule-deposit').textContent = `${formatPrice(car.deposit)}. Возвращается при сдаче автомобиля без повреждений.`;

  // Таблица сравнения: этот автомобиль и три ближайших по цене из того же класса.
  const peers = CARS
    .filter((item) => item.cls === car.cls && item.id !== car.id)
    .sort((a, b) => Math.abs(a.price - car.price) - Math.abs(b.price - car.price))
    .slice(0, 3);
  const compared = [car, ...peers].sort((a, b) => a.price - b.price);
  const compareRows = [
    ['Цена за сутки', (q) => formatPrice(q.price)],
    ['Год выпуска', (q) => q.year],
    ['Коробка передач', (q) => q.gearbox],
    ['Двигатель', (q) => q.engine],
    ['Мощность', (q) => `${q.power} л.с.`],
    ['Привод', (q) => q.drive],
    ['Мест', (q) => q.seats],
    ['Расход', (q) => q.consumption],
    ['Залог', (q) => formatPrice(q.deposit)],
    ['Рейтинг', (q) => `${q.rating} из 5`],
    ['Наличие', (q) => (q.out ? 'Занят' : 'Свободен')],
  ];
  const current = (q) => (q.id === car.id ? ' class="data-table__cell--current"' : '');
  byId('compare-table').innerHTML =
    `<caption>Сравнение автомобилей класса «${info.name}»</caption>` +
    `<thead><tr><td></td>${compared.map((q) => `<th scope="col"${current(q)}><a href="product.html?id=${q.id}">${carName(q)}</a>${q.id === car.id ? ' <span class="data-table__note">(этот автомобиль)</span>' : ''}</th>`).join('')}</tr></thead>` +
    `<tbody>${compareRows.map(([label, get]) => `<tr><th scope="row">${label}</th>${compared.map((q) => `<td${current(q)}>${get(q)}</td>`).join('')}</tr>`).join('')}</tbody>`;

  // Похожие автомобили.
  byId('related-grid').innerHTML = peers.map((item) => cardHTML(item, false)).join('');

  // --- Калькулятор стоимости аренды ---
  const calcForm = byId('calc-form');
  const calcStart = byId('calc-start');
  const calcEnd = byId('calc-end');
  const calcTotal = byId('calc-total');
  const calcLines = byId('calc-lines');
  const calcNote = byId('calc-note');
  const calcError = byId('calc-error');
  const calcExtras = Array.from(calcForm.querySelectorAll('input[name="extras"]'));

  const today = todayISO();
  calcStart.min = today;
  calcStart.value = addDays(today, 1);
  calcEnd.min = calcStart.value;
  calcEnd.value = addDays(calcStart.value, 3);

  const selectedExtras = () => calcExtras.filter((box) => box.checked).map((box) => box.value);

  function updateCalc() {
    const days = daysBetween(calcStart.value, calcEnd.value);
    calcError.hidden = Boolean(days);

    if (!days) {
      calcTotal.textContent = '—';
      calcLines.innerHTML = '';
      calcNote.textContent = '';
      return;
    }

    const r = calcRental(car, days, selectedExtras());
    calcTotal.textContent = formatPrice(r.total);

    const lines = [[`${days} ${pluralize(days, DAYS_FORMS)} × ${formatPrice(car.price)}`, formatPrice(r.base)]];
    if (r.percent) lines.push([`Скидка за срок −${r.percent}%`, `−${formatPrice(r.discount)}`]);
    r.extras.forEach((item) => lines.push([item.label, formatPrice(item.sum)]));
    calcLines.innerHTML = lines.map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`).join('');

    const next = [...DISCOUNTS].reverse().find((item) => days < item.from);
    calcNote.textContent =
      `Залог ${formatPrice(car.deposit)} возвращается при сдаче автомобиля.` +
      (next ? ` Арендуйте от ${next.from} суток — скидка ${next.percent}%.` : '');
  }

  calcStart.addEventListener('change', () => {
    calcEnd.min = calcStart.value;
    if (calcStart.value && calcEnd.value < calcStart.value) calcEnd.value = addDays(calcStart.value, 1);
    updateCalc();
  });
  calcForm.addEventListener('input', updateCalc);
  calcForm.addEventListener('change', updateCalc);
  calcForm.addEventListener('submit', (event) => event.preventDefault());

  // Модальное окно получает даты и услуги из калькулятора.
  getCalcState = () => ({ start: calcStart.value, end: calcEnd.value, extras: selectedExtras() });

  const calcOrderButton = byId('calc-order-button');
  calcOrderButton.dataset.carId = car.id;
  calcOrderButton.disabled = Boolean(car.out);
  updateCalc();
  syncFavorites();
}

// ===============================
// 7. Кнопка «Наверх»
// ===============================
const backToTop = byId('back-to-top');

if (backToTop) {
  const toggleBackToTop = () => {
    backToTop.hidden = window.scrollY < 500;
  };
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  toggleBackToTop();
}

// ===============================
// 8. Фильтры каталога на телефоне: показать / скрыть
// ===============================
const filtersToggle = document.querySelector('[data-filters-toggle]');

if (filtersToggle) {
  const filtersPanel = byId(filtersToggle.getAttribute('aria-controls'));

  filtersToggle.addEventListener('click', () => {
    const isOpen = filtersPanel.classList.toggle('is-open');
    filtersToggle.setAttribute('aria-expanded', String(isOpen));
    filtersToggle.textContent = isOpen ? 'Скрыть' : 'Показать';
  });
}
