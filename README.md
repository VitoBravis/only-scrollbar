# OnlyScrollbar

Кастомный скроллбар, который позволяет дополнить стандартное поведение браузера и добавляет инерцию для увеличения плавности

## Установка

С помощью npm:

```bash
npm install only-scrollbar
```

## Использование

Рекомендуется использование синтаксиса ES6, с применением `import` 

```ts
import OnlyScrollbar from 'only-scrollbar';

const scroll = new OnlyScrollbar(document.querySelector('.scroll-container'));
```

Контейнер, в котором будет принициализирован скрол должен придерживаться тех же правил, что и обычный скрол-контейнер:
- Контейнер должен быть ограничен по высоте
- Значение *css*-правила `overflow` в данном случае необязательно, т.к. правило `overflow: auto` добавляется автоматически

Конструктор класса `OnlyScrollbar` принимает до двух аргументов:

| argument | type | description |
| :------: | :--: | :---------- |
| element | `HTMLHtmlElement \| Element \| Window \| string \| null \| undefined` | HTML-элемент или css-селектор, по которому будет найден первый подходящий элемент. Является основным контейнером внутри котрого происходит скрол и все расчеты |
| element | `OnlyScrollbarOptions \| undefined` | Параметры инициализации |

## Возможные параметры инициализации (OnlyScrollbarOptions)

| parameter | type | default | description |
| :-------: | :--: | :-----: | :---------- |
| damping | `number` | `1` | Сила замедления инерции. Рекомендуется указывать значения в промежутке от 0 до 1 |
| eventContainer | `HTMLHtmlElement \| Element \| Window \| string` | scrollContainer | HTML-элемент или css-селектор, по которому будет найден первый подходящий элемент. Является элементом, который будет обрабатывать события, предназначавшиеся скрол контейнеру. По умолчанию равен основному скрол контейнеру |
| easing | `string` | `'default'` | Временно не использующийся параметр, предполагается выбор дополнительных Безье функций  |

```ts
import OnlyScrollbar from 'only-scrollbar';

const scroll = new OnlyScrollbar('#scroll-container-id', {
    damping: 0.8,
    eventContainer: window
});
```

## API

Для обращения к свойствам и методам класса `OnlyScrollbar`, требуется создать экземпляр класса

```ts
import OnlyScrollbar from 'only-scrollbar';

const scroll = new OnlyScrollbar('.scroll-container');
scroll.destroy();
```

- Свойства
    - [OnlyScrollbar.classNames](#OnlyScrollbarclassNames)
    - [OnlyScrollbar.scrollContainer](#OnlyScrollbarscrollContainer)
    - [OnlyScrollbar.eventContainer](#OnlyScrollbareventContainer)
    - [OnlyScrollbar.velocity](#OnlyScrollbarvelocity)
    - [OnlyScrollbar.progress](#OnlyScrollbarprogress)
    - [OnlyScrollbar.isLocked](#OnlyScrollbarisLocked)
    - [OnlyScrollbar.direction](#OnlyScrollbardirection)
    - [OnlyScrollbar.isLocked](#OnlyScrollbarisLocked)

- Методы
    - [OnlyScrollbar.sync](#OnlyScrollbarsync)
    - [OnlyScrollbar.scrollTo](#OnlyScrollbarscrollTo)
    - [OnlyScrollbar.setValue](#OnlyScrollbarsetValue)
    - [OnlyScrollbar.lock](#OnlyScrollbarlock)
    - [OnlyScrollbar.unlock](#OnlyScrollbarunlock)
    - [OnlyScrollbar.addScrollListener](#OnlyScrollbaraddScrollListener)
    - [OnlyScrollbar.removeScrollListener](#OnlyScrollbarremoveScrollListener)
    - [OnlyScrollbar.destroy](#OnlyScrollbardestroy)

### Свойства

#### OnlyScrollbar.classNames

- Type: `ClassNames`

Перечень основных *css*-классов, которые добавляются на `scrollContainer`

```ts
type ClassName = {
    container: string;
    lock: string;
}
```

#### OnlyScrollbar.scrollContainer

- Type: `HTMLElement`

Основной контейнер внутри которого происходит скрол и все основные расчеты

> Для того чтобы применить плавный скрол для всей страницы, в качестве контейнера достаточно указать объект `window` или `document.scrollingElement`
> 
> Объект `window` не может быть контейнером для скрола, но вмето него будет установлен `document.scrollingElement`

#### OnlyScrollbar.eventContainer

- Type: `HTMLElement | Window`

Элемент, на который будут применяться все события

> В отличие от `scrollContainer` может быть объектом `window`, но не `document.scrollingElement`

#### OnlyScrollbar.velocity

- Type: `number`

Текущее ускорение скрола. Показывает с какой скоростью изменяется значение позиции

#### OnlyScrollbar.progress

- Type: `number`

Прогресс контейнера скрола в процентном соотношении. 

Возвращает число от 0 до 100, где 0 = Начальная позиция скрола, 100 = Конечная позиция скрола

#### OnlyScrollbar.isLocked

- Type: `boolean`

Логическое значение, показывающее заблокирован ли скрол. 

Заблокированный скрол не позволяет выполняться событиям синхронизации и событиям для перерасчета позиции. Не блокирует скрол на touch-устройствах

#### OnlyScrollbar.direction

- Type: `boolean`

Последнее направление скрола. 

Возвращает число, где `1 = Up`, `-1 = Down`

#### OnlyScrollbar.y

- Type: `number`

Текущее значение позиции скрола

### Методы

#### OnlyScrollbar.sync

```ts
scroll.sync(): void
```

Синхронизация всех значений, которые используются для расчета позиций

Вызывается автоматически по окончанию событий скрола, но можно вызвать вручную для преждевременной синхронизации и обнуления анимации

#### OnlyScrollbar.scrollTo

```ts
scroll.scrollTo(positionY: number): void
```

| argument | type | description |
| :------: | :--: | :---------- |
| `positionY` | `number` | Числовое значение целевой позиции скрола |

Плавный скрол до конкретной позиции, с применением стандартных расчетов для вычисления промежуточных значений

Example:
```ts
scroll.scrollTo(document.querySelector('#anchor').offsetTop);
```

#### OnlyScrollbar.setValue

```ts
scroll.setValue(value: number): void
```

| argument | type | description |
| :------: | :--: | :---------- |
| `value` | `number` | Числовое значение целевой позиции скрола |

Установка конкретного значения скрол позиции, без применения каких-либо анимаций

Example:
```ts
scroll.setValue(document.querySelector('#anchor').offsetTop);
```

#### OnlyScrollbar.lock

```ts
scroll.lock(): void
```

Блокирует скрол

Блокировка также прервет запущенные процессы по перерасчету позиции

#### OnlyScrollbar.unlock

```ts
scroll.unlock(): void
```

Разблокирует скрол.

Запускает перерасчет позиции скрола

#### OnlyScrollbar.addScrollListener

```ts
scroll.addScrollListener(eventHandler: EventHandler): void
```

| argument | type | description |
| :------: | :--: | :---------- |
| `eventHandler` | `EventHandler` | Стандартная функция обработчик события скрола |

Добавляет обработчик события скрола на eventContainer

```ts
const scrollHandler = () => {
    /* ... */
}
scroll.addScrollListener(scrollHandler);
```

#### OnlyScrollbar.removeScrollListener

```ts
scroll.removeScrollListener(eventHandler: EventHandler): void
```

| argument | type | description |
| :------: | :--: | :---------- |
| `eventHandler` | `EventHandler` | Стандартная функция обработчик события скрола |

Удаляет существующий обработчик события скрола на eventContainer

```ts
const scrollHandler = () => {
    /* ... */
}
scroll.removeScrollListener(scrollHandler);
```

#### OnlyScrollbar.destroy

```ts
scroll.destroy(): void
```

Очистка событий, таймеров, классов и атрибутов