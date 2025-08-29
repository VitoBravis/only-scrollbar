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
- Значение *css*-правила `overflow` в данном случае необязательно, так как правило `overflow: auto` добавляется автоматически

Конструктор класса `OnlyScrollbar` принимает до двух аргументов:

| argument |                                 type                                  | description                                                                                                                                                     |
|:--------:|:---------------------------------------------------------------------:|:----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| element  | `HTMLHtmlElement \| Element \| Window \| string \| null \| undefined` | HTML-элемент или css-селектор, по которому будет найден первый подходящий элемент. Является основным контейнером внутри которого происходит скрол и все расчеты |
| element  |                  `OnlyScrollbarOptions \| undefined`                  | Параметры инициализации                                                                                                                                         |

## Возможные параметры инициализации (OnlyScrollbarOptions)

|   parameter    |                       type                       | description                                                                                                                                                                                                                  |
|:--------------:|:------------------------------------------------:|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|    damping     |                     `number`                     | Сила замедления инерции. Рекомендуется указывать значения в промежутке от 0 до 1. Значение по умолчанию 1                                                                                                                    |
| eventContainer | `HTMLHtmlElement \| Element \| Window \| string` | HTML-элемент или css-селектор, по которому будет найден первый подходящий элемент. Является элементом, который будет обрабатывать события, предназначавшиеся скрол контейнеру. По умолчанию равен основному скрол контейнеру |
|     speed      |                     `number`                     | Модификатор скорости для колесика мыши. Значение по умолчанию 1                                                                                                                                                              |
|    anchors     |                  AnchorsOptions                  | Дополнительные опции для ссылок-якорей. По умолчанию включена обработка нативных браузерных якорей через хэш в ссылках                                                                                                       |
|      axis      |                    `Y` \| `X`                    | Направление скрола. По умолчанию `Y`                                                                                                                                                                                         |
|   listenAxis   |                    `Y` \| `X`                    | Ось, которая будет прослушиваться обработчиком событий. По умолчанию совпадает со значением параметра `axis`                                                                                                                 |


## Возможные параметры для настройки ссылок-якорей
|    parameter    |         type         | description                                                                                                                                                                               |
|:---------------:|:--------------------:|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|     offset      |       `number`       | Отступ от верхней границы экрана в пикселях. По умолчанию 0                                                                                                                               |
| stopPropagation |      `boolean`       | Предотвращает всплытие события `click`. По умолчанию `false`                                                                                                                              |
|     active      |      `boolean`       | Определяет наличие обработки ссылок-якорей. По умолчанию `true`                                                                                                                           |
|      root       |    `HTMLElement`     | Определяет элемент, внутри которого будет обрабатываться событие `click` по якорям. Полезно, если якоря находятся за пределами `scrollContainer`. По умолчанию является `scrollContainer` |
|      type       | `native` \| `custom` | Позволяет выбрать тип обработки якорей. По умолчанию `native`                                                                                                                             |

В случае использования `type: 'custom'` необходимо использовать атрибуты `data-os-anchor` и `data-os-anchor-id`. Элементы с одинаковыми значениями таких атрибутов будут обрабатываться аналогично стандартному браузерному поведению с атрибутами `href` и `id`


```ts
import OnlyScrollbar from 'only-scrollbar';

const scroll = new OnlyScrollbar('#scroll-container-id', {
    damping: 0.8,
    eventContainer: window,
    anchors: {
        type: 'custom',
        offset: 200
    }
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
    - [OnlyScrollbar.Attributes](#onlyscrollbarattributes)
    - [OnlyScrollbar.ClassNames](#onlyscrollbarclassnames)
    - [OnlyScrollbar.Events](#onlyscrollbarevents)
    - [OnlyScrollbar.scrollContainer](#onlyscrollbarscrollcontainer)
    - [OnlyScrollbar.eventContainer](#onlyscrollbareventcontainer)
    - [OnlyScrollbar.options](#onlyscrollbaroptions)
    - [OnlyScrollbar.isLocked](#onlyscrollbarislocked)
    - [OnlyScrollbar.position](#onlyscrollbarposition)
    - [OnlyScrollbar.direction](#onlyscrollbardirection)
    - [OnlyScrollbar.isStart](#onlyscrollbarisstart)
    - [OnlyScrollbar.isEnd](#onlyscrollbarisend)
    - [OnlyScrollbar.isScrolling](#onlyscrollbarisscrolling)

- Методы
    - [OnlyScrollbar.scrollTo](#onlyscrollbarscrollto)
    - [OnlyScrollbar.scrollIntoView](#onlyscrollbarscrollintoview)
    - [OnlyScrollbar.setValue](#onlyscrollbarsetvalue)
    - [OnlyScrollbar.stop](#onlyscrollbarstop)
    - [OnlyScrollbar.lock](#onlyscrollbarlock)
    - [OnlyScrollbar.unlock](#onlyscrollbarunlock)
    - [OnlyScrollbar.addEventListener](#onlyscrollbaraddeventlistener)
    - [OnlyScrollbar.removeEventListener](#onlyscrollbarremoveeventlistener)
    - [OnlyScrollbar.destroy](#onlyscrollbardestroy)
    
- События
    - [os:start](#osstart)
    - [os:stop](#osstop)
    - [os:change](#oschange)
    - [os:reachEnd](#osreachend)
    - [os:reachStart](#osreachstart)
    - [os:lock](#oslock)
    - [os:unlock](#osunlock)

### Свойства

#### OnlyScrollbar.Attributes

Статичное поле класса. Содержит названия, используемых data-атрибутов

#### OnlyScrollbar.СlassNames

Статичное поле класса. Содержит перечень основных *css*-классов, которые добавляются на `scrollContainer`

#### OnlyScrollbar.Events

Статичное поле класса. Содержит названия, кастомных js-событий

#### OnlyScrollbar.scrollContainer

- Type: `HTMLElement`

Основной контейнер внутри которого происходит скрол и все основные расчеты

> Для того чтобы применить плавный скрол для всей страницы, в качестве контейнера достаточно указать объект `window` или `document.scrollingElement`
> 
> Объект `window` не может быть контейнером для скрола, но вместо него будет установлен `document.scrollingElement`

#### OnlyScrollbar.eventContainer

- Type: `HTMLElement | Window`

Элемент, на который будут применяться все события

> В отличие от `scrollContainer` может быть объектом `window`, но не `document.scrollingElement`

#### OnlyScrollbar.options

Хранит параметры инициализации 

#### OnlyScrollbar.isLocked

- Type: `boolean`

Логическое значение, показывающее заблокирован ли скрол. 

Заблокированный скрол не позволяет выполняться событиям синхронизации и событиям для перерасчета позиции. Не блокирует скрол на touch-устройствах

#### OnlyScrollbar.position

- Type: `number`

Текущее значение позиции скрола. Значение поля `scrollTop` или `scrollLeft` в зависимости от направления скрола 

#### OnlyScrollbar.direction

- Type: `Direction`
```ts
type Direction = 1 | -1
```

Возвращает текущее направление скрола в числовом представлении: `1 = Down/Right`, `-1 = Up/Left`  

### Методы

#### OnlyScrollbar.scrollTo

```ts
scroll.scrollTo(position: number): void
```

|  argument  |   type   | description            |
|:----------:|:--------:|:-----------------------|
| `position` | `number` | Целевая позиция скрола |

Плавный скрол до конкретной позиции, с применением стандартных расчетов для вычисления промежуточных значений

Example:
```ts
scroll.scrollTo(600);
```

#### OnlyScrollbar.scrollIntoView

```ts
scroll.scrollIntoView(element: HTMLElement, offset?: number): void
```
| argument  |     type      | description                        |
|:---------:|:-------------:|:-----------------------------------|
| `element` | `HTMLElement` | Целевой HTML-элемент               |
| `offset`  |   `number`    | Смещение скрола (По умолчанию = 0) |

Плавный скрол до переданного элемента с применением дополнительного отступа, если такой необходим

Example:
```ts
const targetElement = document.querySelector('#target');
scroll.scrollIntoView(targetElement, 200);
```

#### OnlyScrollbar.setValue

```ts
scroll.setValue(value: number): void
```

| argument |   type   | description            |
|:--------:|:--------:|:-----------------------|
| `value`  | `number` | Целевая позиция скрола |

Установка конкретного значения позиции скрола, без применения каких-либо анимаций

Example:
```ts
scroll.setValue(600);
```

#### OnlyScrollbar.stop

```ts
scroll.stop(): void
```

Останавливает скрол на текущей позиции

#### OnlyScrollbar.lock

```ts
scroll.lock(): void
```

Блокирует скрол

Блокировка также вызовет метод `stop`

#### OnlyScrollbar.unlock

```ts
scroll.unlock(): void
```

Разблокирует скрол.

#### OnlyScrollbar.addEventListener

```ts
scroll.addEventListener(type: OnlyScrollbarEvents, eventHandler: EventHandler, options: AddEventListenerOptions): void
```

|    argument    |           type            | description                                                                                   |
|:--------------:|:-------------------------:|:----------------------------------------------------------------------------------------------|
|     `type`     |   `OnlyScrollbarEvents`   | Название события. Возможно использовать стандарные события браузера или события OnlyScrollbar |
| `eventHandler` |      `EventHandler`       | Функция обработчик события                                                                    |
|   `options`    | `AddEventListenerOptions` | Параметры обработчика события                                                                 |

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

|    argument    |         type          | description                                                                                   |
|:--------------:|:---------------------:|:----------------------------------------------------------------------------------------------|
|     `type`     | `OnlyScrollbarEvents` | Название события. Возможно использовать стандарные события браузера или события OnlyScrollbar |
| `eventHandler` |    `EventHandler`     | Функция обработчик события                                                                    |

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

#### os:start

Начало процесса плавного скрола

#### os:end

Завершение процесса плавного скрола

#### os:change

Изменение направления скрола 

#### os:reachEnd

Достижение нижней/правой границы скрол-контейнера

#### os:reachStart

Достижение верхней/левой границы скрол-контейнера

#### os:lock

Блокировка скрола

#### os:unlock

Разблокировка скрола
