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

Контейнер, в котором будет проинициализирован скрол должен придерживаться тех же правил, что и обычный скрол-контейнер:
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
| mode | `"vertical" | "horizontal" | "free"` | `"vertical"` | Допустимое направление скрола 

```ts
import OnlyScrollbar from 'only-scrollbar';

const scroll = new OnlyScrollbar('#scroll-container-id', {
    damping: 0.8,
    eventContainer: window,
    mode: 'free'
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
    - [OnlyScrollbar.classNames](#onlyscrollbarclassnames)
    - [OnlyScrollbar.scrollContainer](#onlyscrollbarscrollcontainer)
    - [OnlyScrollbar.eventContainer](#onlyscrollbareventcontainer)
    - [OnlyScrollbar.isLocked](#onlyscrollbarislocked)
    - [OnlyScrollbar.direction](#onlyscrollbardirection)
    - [OnlyScrollbar.position](#onlyscrollbarposition)

- Методы
    - [OnlyScrollbar.sync](#onlyscrollbarsync)
    - [OnlyScrollbar.scrollTo](#onlyscrollbarscrollto)
    - [OnlyScrollbar.setValue](#onlyscrollbarsetvalue)
    - [OnlyScrollbar.stop](#onlyscrollbarstop)
    - [OnlyScrollbar.lock](#onlyscrollbarlock)
    - [OnlyScrollbar.unlock](#onlyscrollbarunlock)
    - [OnlyScrollbar.addEventListener](#onlyscrollbaraddeventlistener)
    - [OnlyScrollbar.removeEventListener](#onlyscrollbarremoveeventlistener)
    - [OnlyScrollbar.destroy](#onlyscrollbardestroy)
    
- События
    - [scrollEnd](#scrollend)
    - [changeDirectionY](#changedirectiony)
    - [changeDirectionX](#changedirectionx)

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

#### OnlyScrollbar.isLocked

- Type: `boolean`

Логическое значение, показывающее заблокирован ли скрол. 

Заблокированный скрол не позволяет выполняться событиям синхронизации и событиям для перерасчета позиции. Не блокирует скрол на touch-устройствах

#### OnlyScrollbar.direction

- Type: `Direction`
```ts
type Direction = {
    x: 1 | -1;
    y: 1 | -1;
}
```

Последнее направление скрола. 

Возвращает объект с полями y и x, где `1 = Down/Right`, `-1 = Up/Left`

#### OnlyScrollbar.position

- Type: `Delta2D`

```ts
type Delta2D = {
    x: number;
    y: number;
}
```

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
scroll.scrollTo(position: Delta2D): void
```

| argument | type | description |
| :------: | :--: | :---------- |
| `position` | `Delta2D` | Объект с целевыми координатами x и y |

Плавный скрол до конкретной позиции, с применением стандартных расчетов для вычисления промежуточных значений

Example:
```ts
scroll.scrollTo({x: 0, y: document.querySelector('#anchor').offsetTop});
```

#### OnlyScrollbar.setValue

```ts
scroll.setValue(value: number): void
```

| argument | type | description |
| :------: | :--: | :---------- |
| `position` | `Delta2D` | Объект с целевыми координатами x и y |

Установка конкретного значения скрол позиции, без применения каких-либо анимаций

Example:
```ts
scroll.setValue({x: 0, y: document.querySelector('#anchor').offsetTop});
```

#### OnlyScrollbar.stop

```ts
scroll.stop(): void
```

Останавливает анимацию скрола на текущей позиции

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

#### OnlyScrollbar.addEventListener

```ts
scroll.addEventListener(type: OnlyScrollbarEvents, eventHandler: EventHandler, options: AddEventListenerOptions): void
```

| argument | type | description |
| :------: | :--: | :---------- |
| `type` | `OnlyScrollbarEvents` | Название события. Возможно использовать стандарные события браузера или события OnlyScrollbar |
| `eventHandler` | `EventHandler` | Функция обработчик события |
| `options` | `AddEventListenerOptions` | Параметры обработчика события |

Добавляет обработчик события на eventContainer

```ts
const scrollEndHandler = () => {
    /* ... */
}
scroll.addEventListener('scrollEnd', scrollEndHandler, { once: true });
```

#### OnlyScrollbar.removeEventListener

```ts
scroll.removeEventListener(type: OnlyScrollbarEvents, eventHandler: EventHandler): void
```

| argument | type | description |
| :------: | :--: | :---------- |
| `type` | `OnlyScrollbarEvents` | Название события. Возможно использовать стандарные события браузера или события OnlyScrollbar |
| `eventHandler` | `EventHandler` | Функция обработчик события |

Удаляет существующий обработчик события на eventContainer

```ts
const scrollEndHandler = () => {
    /* ... */
}
scroll.removeEventListener('scrollEnd', scrollEndHandler);
```

#### OnlyScrollbar.destroy

```ts
scroll.destroy(): void
```

Очистка событий, таймеров, классов и атрибутов

### События

#### scrollEnd

Остановка скрола и прекращение всех действий по расчету позиций

#### changeDirectionY

Изменение направления скрола по оси Y

#### changeDirectionX

Изменение направления скрола по оси X
