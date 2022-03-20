---
title: 'JavaScript Runtime Environment: Web API, Task Queue and Event Loop'
description: I used to think that I knew the gist of how JavaScript works under
  the hood. Oh, how mistaken was I.
date: 2022-03-20T19:23:25.552Z
---

## Web API

> _Browser gives us some features that the JavaScript engine itself doesn’t provide_

- also known as Browser API
- separate from JavaScript Engine
- part of the runtime environment provided by the browser which we can communicate with using JavaScript
- enables to do things concurrently outside of the JavaScript interpreter (the language itself is single-threaded, but the browser APIs act as separate threads)
- after request finishes receiving its data, a timer reaches its set time or a click happens the callback is sent to Callback Queue

### Examples

- Manipulating documents - DOM (Document Object Model)
- Fetching data from servers - Fetch API
- Timer Functions
- Drawing and manipulating graphics - Canvas API, WebGL API
- Audio and video - Web Audio API, WebRTC API
- Device - Geolocation API
- Client-side storage - Web Storage API, IndexedDB API

## Task Queue

- a type of message queue where each message has an associated function to be called
- messages are handled in FIFO manner (First In, First Out)
- it allows to run code after the execution of the API call has finished
- after the call stack is emptied, during the Event Loop, runtime handles the oldest message in the queue by calling its functions and popping them onto the Call Stack
- processing of functions continues untill the Call Stack is empty. Then another message is processed from the queue
- sometimes called _Event queue_ or _Callback queue_
- tasks get enqueued to the task queue when event fires a callback or timeout/interval is reached
- the runtime executes each task that is in the queue at the moment a new iteration of the event loop begins

### Microtask queue

- it's like task queue but has higher priority
- handles Microtasks callbacks
- promise handlers and mutation observers go though the microtask queue

### Microtasks

- short function which is executed after the function or program which created it exits and only if the Call Stack is empty, but before returning control to the event loop
- microtasks can enqueue new microtasks and those new microtasks will execute before the next task begins to run, and before the end of the current event loop iteration.
- Each time a task exits, and the execution context stack is empty, each microtask in the microtask queue is executed, one after another
- A microtask could be safely introduced by using `queueMicrotask()` (if we’d like to execute a function asynchronously (after the current code), but before changes are rendered or new events handled)
- scheduled for things that should happen straight after the currently executing script, such as reacting to a batch of actions, or to make something async without taking the penalty of a whole new task
- microtasks include mutation observer callbacks and promise callbacks

## Event loop

- Constantly checks whether or not the call stack is empty
- When the call stack is empty, all queued up Microtasks from Microtask Queue are popped onto the callstack
- If both the call stack and Microtask Queue are empty, the event loop dequeues tasks from the Task Queue and calls them
- Starved event loop

### Event loop algorithm

1.  Dequeue and run the oldest task from the task queue (e.g. “script”).
2.  Execute all Microtasks:
    - While the microtask queue is not empty:
      - Dequeue and run the oldest microtask.
3.  Render changes if any.
4.  If the task queue is empty, wait until a task appears.
5.  Go to step 1.
