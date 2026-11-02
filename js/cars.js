// ===============================
// Данные сайта аренды автомобилей
// (позже их заменит backend)
// ===============================

// Классы автомобилей.
const CLASSES = {
  economy: {
    name: 'Эконом и комфорт',
    text: 'Экономичные и практичные автомобили для города и поездок. Низкая цена аренды и небольшой расход топлива.',
    minAge: 21,
    minExperience: 1,
    image: 'suzuki.jpg',
  },
  business: {
    name: 'Бизнес',
    text: 'Седаны бизнес-класса для деловых встреч и комфортных поездок: просторный салон, мощные двигатели и современные помощники водителя.',
    minAge: 23,
    minExperience: 2,
    image: 'bmw.jpg',
  },
  suv: {
    name: 'Внедорожники и кроссоверы',
    text: 'Автомобили с высоким клиренсом и большим багажником: для дальних поездок, отдыха на природе и плохих дорог.',
    minAge: 23,
    minExperience: 2,
    image: 'jeep.jpg',
  },
  sport: {
    name: 'Спорт и премиум',
    text: 'Спорткары и автомобили премиум-класса для тех, кто хочет почувствовать скорость и роскошь. Для особых случаев.',
    minAge: 25,
    minExperience: 3,
    image: 'lamborghini.jpg',
  },
};

// Дополнительные услуги (цена за сутки).
const EXTRAS = {
  seat: { label: 'Детское кресло', perDay: 300 },
  gps: { label: 'GPS-навигатор', perDay: 250 },
  insurance: { label: 'Полная страховка', perDay: 700 },
  driver: { label: 'Водитель', perDay: 2500 },
};

// Скидки за срок аренды: от N суток — скидка в процентах.
const DISCOUNTS = [
  { from: 14, percent: 15 },
  { from: 7, percent: 10 },
  { from: 3, percent: 5 },
];

// Автомобили.
// tag: '' | 'hit' | 'new' | 'discount'; out: true — автомобиль сейчас занят.
const CARS = [
  {
    id: 1, brand: 'Tesla', model: 'Model 3', img: 'tesla.jpg', cls: 'business', body: 'Седан', color: 'Красный',
    year: 2024, gearbox: 'Автомат', engine: 'Электро, двойной мотор', fuel: 'Электричество', power: 283, drive: 'Полный',
    seats: 5, trunk: '561 л', consumption: '16 кВт·ч / 100 км', price: 5500, deposit: 15000, tag: 'new', rating: '4,8', reviews: 36,
    desc: 'Электрический седан с мягким разгоном и автопилотом. Тихий, быстрый и очень экономичный.',
  },
  {
    id: 2, brand: 'BMW', model: '3 Series', img: 'bmw.jpg', cls: 'business', body: 'Седан', color: 'Синий',
    year: 2023, gearbox: 'Автомат', engine: '2.0 л, бензин, турбо', fuel: 'Бензин АИ-95', power: 184, drive: 'Задний',
    seats: 5, trunk: '480 л', consumption: '7,2 л / 100 км', price: 4500, deposit: 15000, tag: '', rating: '4,7', reviews: 41,
    desc: 'Классический спортивный седан: отличная управляемость и комфортный салон для долгих поездок.',
  },
  {
    id: 3, brand: 'Audi', model: 'A4', img: 'audi.jpg', cls: 'business', body: 'Седан', color: 'Серый',
    year: 2023, gearbox: 'Автомат (S tronic)', engine: '2.0 л, бензин, турбо', fuel: 'Бензин АИ-95', power: 190, drive: 'Полный',
    seats: 5, trunk: '460 л', consumption: '7,0 л / 100 км', price: 4800, deposit: 15000, tag: '', rating: '4,6', reviews: 29,
    desc: 'Полный привод quattro, аккуратный дизайн и качественная отделка. Уверенно чувствует себя в любую погоду.',
  },
  {
    id: 4, brand: 'Ferrari', model: '488 GTB', img: 'ferrari.jpg', cls: 'sport', body: 'Купе', color: 'Красный',
    year: 2022, gearbox: 'Робот (7 ступеней)', engine: '3.9 л, V8, бензин, турбо', fuel: 'Бензин АИ-98', power: 670, drive: 'Задний',
    seats: 2, trunk: '230 л', consumption: '11,4 л / 100 км', price: 35000, deposit: 100000, tag: '', rating: '4,9', reviews: 12,
    desc: 'Итальянский суперкар с мотором V8. До сотни за три секунды и звук, который невозможно забыть.',
  },
  {
    id: 5, brand: 'Toyota', model: 'Camry', img: 'toyota.jpg', cls: 'economy', body: 'Седан', color: 'Белый',
    year: 2023, gearbox: 'Автомат', engine: '2.5 л, бензин', fuel: 'Бензин АИ-95', power: 200, drive: 'Передний',
    seats: 5, trunk: '493 л', consumption: '7,6 л / 100 км', price: 3200, deposit: 8000, tag: 'hit', rating: '4,8', reviews: 64,
    desc: 'Надёжный и просторный седан. Один из самых популярных вариантов для поездок по городу и по трассе.',
  },
  {
    id: 6, brand: 'Honda', model: 'Civic', img: 'honda.jpg', cls: 'economy', body: 'Седан', color: 'Белый',
    year: 2023, gearbox: 'Вариатор', engine: '1.5 л, бензин, турбо', fuel: 'Бензин АИ-95', power: 182, drive: 'Передний',
    seats: 5, trunk: '519 л', consumption: '6,8 л / 100 км', price: 2800, old: 3100, deposit: 8000, tag: 'discount', rating: '4,5', reviews: 33,
    desc: 'Живой и экономичный седан с большим багажником. Сейчас действует скидка на аренду.',
  },
  {
    id: 7, brand: 'Kia', model: 'Sportage', img: 'kia.jpg', cls: 'suv', body: 'Кроссовер', color: 'Красный',
    year: 2023, gearbox: 'Автомат', engine: '2.0 л, бензин', fuel: 'Бензин АИ-95', power: 150, drive: 'Полный',
    seats: 5, trunk: '491 л', consumption: '8,1 л / 100 км', price: 3400, deposit: 10000, tag: 'hit', rating: '4,7', reviews: 52,
    desc: 'Яркий кроссовер для семьи: высокая посадка, просторный салон и отличный обзор.',
  },
  {
    id: 8, brand: 'Hyundai', model: 'Tucson', img: 'hyundai.jpg', cls: 'suv', body: 'Кроссовер', color: 'Синий',
    year: 2024, gearbox: 'Автомат', engine: '2.0 л, бензин', fuel: 'Бензин АИ-95', power: 150, drive: 'Полный',
    seats: 5, trunk: '539 л', consumption: '7,9 л / 100 км', price: 3600, deposit: 10000, tag: 'new', rating: '4,6', reviews: 18,
    desc: 'Новый кроссовер с современным дизайном, мультимедиа и набором систем безопасности.',
  },
  {
    id: 9, brand: 'Nissan', model: 'X-Trail', img: 'nissan.jpg', cls: 'suv', body: 'Кроссовер', color: 'Белый',
    year: 2023, gearbox: 'Вариатор', engine: '2.5 л, бензин', fuel: 'Бензин АИ-95', power: 171, drive: 'Полный',
    seats: 5, trunk: '565 л', consumption: '8,3 л / 100 км', price: 3500, old: 4100, deposit: 10000, tag: 'discount', rating: '4,4', reviews: 27,
    desc: 'Вместительный кроссовер с полным приводом. Подойдёт для отпуска и поездок за город.',
  },
  {
    id: 10, brand: 'Porsche', model: '911 Carrera', img: 'porsche.jpg', cls: 'sport', body: 'Купе', color: 'Жёлтый',
    year: 2023, gearbox: 'Робот (PDK)', engine: '3.0 л, бензин, турбо', fuel: 'Бензин АИ-98', power: 385, drive: 'Задний',
    seats: 4, trunk: '132 л', consumption: '10,2 л / 100 км', price: 18000, deposit: 50000, tag: '', rating: '4,9', reviews: 21,
    desc: 'Культовый спорткар, который одинаково хорош на трассе и в городе. Точный руль и яркий характер.',
  },
  {
    id: 11, brand: 'Bentley', model: 'Flying Spur', img: 'bentley.jpg', cls: 'sport', body: 'Седан', color: 'Серый',
    year: 2022, gearbox: 'Автомат', engine: '4.0 л, V8, бензин, турбо', fuel: 'Бензин АИ-98', power: 550, drive: 'Полный',
    seats: 5, trunk: '420 л', consumption: '12,0 л / 100 км', price: 30000, deposit: 80000, tag: '', rating: '4,9', reviews: 9,
    desc: 'Роскошный седан премиум-класса с кожей, деревом и мощным мотором. Для свадеб и важных встреч.',
  },
  {
    id: 12, brand: 'Jeep', model: 'Wrangler', img: 'jeep.jpg', cls: 'suv', body: 'Внедорожник', color: 'Оливковый',
    year: 2023, gearbox: 'Автомат', engine: '2.0 л, бензин, турбо', fuel: 'Бензин АИ-95', power: 272, drive: 'Полный',
    seats: 5, trunk: '283 л', consumption: '11,2 л / 100 км', price: 5500, deposit: 20000, tag: '', rating: '4,7', reviews: 24,
    desc: 'Настоящий внедорожник с рамой и блокировками. Проедет там, где другие остановятся.',
  },
  {
    id: 13, brand: 'Lexus', model: 'NX', img: 'lexus.jpg', cls: 'suv', body: 'Кроссовер', color: 'Белый',
    year: 2024, gearbox: 'Автомат', engine: '2.5 л, гибрид', fuel: 'Бензин АИ-95', power: 238, drive: 'Полный',
    seats: 5, trunk: '520 л', consumption: '6,5 л / 100 км', price: 5200, deposit: 20000, tag: 'new', rating: '4,8', reviews: 15,
    desc: 'Премиальный гибридный кроссовер: тихий салон, плавный ход и низкий расход топлива.',
  },
  {
    id: 14, brand: 'Jaguar', model: 'XF', img: 'jaguar.jpg', cls: 'business', body: 'Седан', color: 'Графитовый',
    year: 2022, gearbox: 'Автомат', engine: '2.0 л, бензин, турбо', fuel: 'Бензин АИ-95', power: 250, drive: 'Задний',
    seats: 5, trunk: '540 л', consumption: '8,0 л / 100 км', price: 5000, deposit: 15000, tag: '', rating: '4,5', reviews: 14,
    desc: 'Элегантный британский седан с мягкой подвеской и стильным салоном.',
  },
  {
    id: 15, brand: 'Ford', model: 'Mustang', img: 'mustang.jpg', cls: 'sport', body: 'Купе', color: 'Синий',
    year: 2023, gearbox: 'Автомат', engine: '5.0 л, V8, бензин', fuel: 'Бензин АИ-98', power: 450, drive: 'Задний',
    seats: 4, trunk: '382 л', consumption: '12,5 л / 100 км', price: 9000, deposit: 30000, tag: 'hit', rating: '4,8', reviews: 47,
    desc: 'Американский маслкар с мотором V8. Громкий выхлоп, мощный разгон и яркий внешний вид.',
  },
  {
    id: 16, brand: 'Chevrolet', model: 'Camaro', img: 'camaro.jpg', cls: 'sport', body: 'Купе', color: 'Оранжевый',
    year: 2021, gearbox: 'Автомат', engine: '6.2 л, V8, бензин', fuel: 'Бензин АИ-98', power: 455, drive: 'Задний',
    seats: 4, trunk: '257 л', consumption: '12,8 л / 100 км', price: 8500, old: 9500, deposit: 30000, tag: 'discount', rating: '4,6', reviews: 19,
    desc: 'Агрессивное купе с мощным двигателем. Привлекает внимание на любой дороге. Сейчас со скидкой.',
  },
  {
    id: 17, brand: 'Bugatti', model: 'Chiron', img: 'bugatti.jpg', cls: 'sport', body: 'Купе', color: 'Синий',
    year: 2021, gearbox: 'Робот (7 ступеней)', engine: '8.0 л, W16, бензин, 4 турбины', fuel: 'Бензин АИ-98', power: 1500, drive: 'Полный',
    seats: 2, trunk: '44 л', consumption: '24,0 л / 100 км', price: 90000, deposit: 300000, tag: '', out: true, rating: '5,0', reviews: 4,
    desc: 'Один из самых быстрых автомобилей в мире. 1500 лошадиных сил и максимальная скорость более 400 км/ч.',
  },
  {
    id: 18, brand: 'Suzuki', model: 'Swift', img: 'suzuki.jpg', cls: 'economy', body: 'Хэтчбек', color: 'Красный',
    year: 2022, gearbox: 'Механика', engine: '1.2 л, бензин', fuel: 'Бензин АИ-92', power: 90, drive: 'Передний',
    seats: 5, trunk: '265 л', consumption: '5,2 л / 100 км', price: 1800, deposit: 5000, tag: 'hit', rating: '4,3', reviews: 58,
    desc: 'Компактный и очень экономичный хэтчбек. Легко парковаться в городе, самая низкая цена аренды.',
  },
  {
    id: 19, brand: 'Chevrolet', model: 'Silverado', img: 'chevrolet.jpg', cls: 'suv', body: 'Пикап', color: 'Синий',
    year: 2022, gearbox: 'Автомат', engine: '5.3 л, V8, бензин', fuel: 'Бензин АИ-95', power: 355, drive: 'Полный',
    seats: 5, trunk: 'Кузов 1,7 м³', consumption: '13,5 л / 100 км', price: 6500, deposit: 25000, tag: '', rating: '4,5', reviews: 11,
    desc: 'Мощный пикап с большим кузовом. Подходит для перевозки груза, рыбалки и поездок по бездорожью.',
  },
  {
    id: 20, brand: 'Lamborghini', model: 'Aventador', img: 'lamborghini.jpg', cls: 'sport', body: 'Купе', color: 'Жёлтый',
    year: 2021, gearbox: 'Робот (7 ступеней)', engine: '6.5 л, V12, бензин', fuel: 'Бензин АИ-98', power: 700, drive: 'Полный',
    seats: 2, trunk: '140 л', consumption: '17,0 л / 100 км', price: 40000, deposit: 100000, tag: '', rating: '4,9', reviews: 17,
    desc: 'Суперкар с атмосферным двигателем V12 и дверями-ножницами. Самый яркий способ провести выходные.',
  },
];
