---
title: How I Learned to Stop Worrying and Love the JavaScript Engine
description: >-
  I used to code without the basic understanding of what happens under the hood. It's time for a change.
date: 2021-03-27T11:39:40.893Z
---
It appears that there aren't many sources on the internet that would comprehensively describe what exactly happens when you feed your browser some code. I'm talking about the moment between parsing your code up and popping the program off the call stack. With this post, I'll try to fill the gaps as best as I can. Anyway, here's what I've found out.

## What's a JavaScript engine?
The simplest explanation of what a JavaScript engine is might be that it's a program that:
- Translates source code into machine code and executes it on CPU.
- Provides mechanics of parsing and JIT compilation.

If you want to score extra points, you might want to add that:
- JavaScript engine should be created to ECMA standard.
- There are many JavaScript engines (V8 in Chrome, Spidermonkey in Firefox, etc.)
- Different JavaScript engines handle the code differently.

Imagine that we're dropping into our browser an HTML file with some markup and a script tag containing:
```javascript
function helloWorld() {
  return 'hello world'
}
```
Then the following steps happen in order:<br />

0. Firstly, the HTML parser encounters the `<script>` tag, but that has nothing to do with the JavaScript engine yet.

1. **Decoding.**<br /> The script gets loaded from the network, cache, or service worker and passed to *byte stream decoder* as bytes for each character

2. **Tokenizing.**<br /> The *byte stream decoder* creates tokens (like `function`, `helloWorld`, `(`, `)`, `{`, `return`, `'`, `hello world`, `'`, `}`, etc.)  from the decoded stream of bytes

3. **Parsing.**<br /> The tokens are then parsed by pre-parser (a.k.a *lazy parsing*, for code required later on) and parser (a.k.a *eager parsing*, for code required immediately). Parsed tokens create nodes of the Abstract Syntax Tree (like `Program`, `FunctionLiteral`, `ReturnStatement`, `StringLiteral`, etc.)

4. **Code generation.**<br /> Then the *interpreter* goes through the AST and generates unoptimized bytecode, which can be executed immediately by the engine's virtual machine. Once bytecode is generated, the AST gets deleted.

5. **Optimization.**<br />
If the code (or part of it) runs a couple of times, then the JavaScript engine begins to translate the code into highly optimized machine code using *Just-In-Time compilation*. Then the compiler runs the machine code directly on the CPU.

## What's a Just-In-Time compilation?
- It's a compilation that is done during code execution (contrary to Ahead-Of-Time compilation done before the code is run.)
- It enables different code optimization for each user or use case.

### How it works
1. Byte code when being run by the virtual machine is observed by the monitor (profiler). Monitor watches how many times the code runs and what types are being used. If the same lines of code are run a few times, that code is considered *warm*. If it’s run a lot, then it’s considered *hot*.

2. When a function starts getting warm, the JIT will send it off to the baseline compiler (in V8 it's called *Ignition*) to be compiled to machine code. Then it will store that compilation.

3. When a part of the code is very hot, the monitor will send it off to the optimizing compiler (in V8 it's called *TurboFan*). This will create another, even faster, version of the function that will also be stored.

4. If code suddenly returns a different type of data or property list (a.k.a *shape* of an object), then the machine code gets de-optimized and the engine falls back to interpreting the original byte code

Eventually, all code has to be run as machine code on the CPU. The difference between the interpreted machine code and the optimized machine code is that the interpreted one is not controlled by your engine. The virtual machine runs *unattended* while optimized machine code is examined thoroughly to only run the exact instructions required for the CPU.

Regardless, whenever any code is executed in JavaScript, it’s run inside an execution context. So when that happens, the JavaScript engine creates an execution context and pops it on the call stack.

## What's a call stack?
A place in memory storing code in wrappers called execution contexts.
- As the JavaScript engine comes across an actionable item (function call), it adds it to the call stack.
- When the function finishes execution, its context is removed from the stack.
- Execution contexts are handled in a Last In, First Out manner (a.k.a LIFO).
- The space in the call stack is limited, and if exceeded (calling recursive functions without a break), will cause a stack overflow error (but no crash).

## What's an execution context?
In simplest words, it's a place in the memory where the JavaScript code is evaluated and executed/called/invoked (it means the same thing).

- When a javascript engine (during translation or optimization) goes through the code line-by-line in a single-threaded manner, it creates execution contexts.
- The abstract thing which goes line-by-line and in-and-out of functions is called the *thread of execution*.
- If the script is being executed for the first time, a *global execution context* is being created. Even if the script has zero lines of code.
- When a function is called, a new *functional execution context* is created.
- There's a separate execution context for `eval()` function.
- Each execution context is being added to the *call stack* during its creation phase.
- Execution context gets popped off from the *call stack* at the end of its execution phase.

### Global execution context
- The code that is not in any function belongs to the global execution context, meaning *everything outside of a function is global*
- There can only be one global execution context in a program

### Functional execution context
- Every time a function is called, a new functional execution context is created
- There are as many functional execution contexts as there are function calls in the code

Each execution context has two phases: the creation phase and the execution phase.

### Creation phase

During the creation phase, the following environments are created:
- **Lexical environment** consisting of:
  - *Environment record* where variable and function declarations are stored within *Lexical environment*. It, on its own, is consisting of:
    - *Declarative environment record* for functions. Also stores `arguments` object.
    - *Object environment record* for code outside functions (global scope). Also stores global binding object.
  - *Reference to the outer Lexical environment* where JavaScript engine can look for variables if they cannot be found in the current *Lexical environment* (a possibly null reference).
  - `this` binding.
- **Variable environment** (also a *Lexical environment* but for vars)
used to store variable bindings only (`var`)

So to sum up, this is what happens:

|Global execution context|Functional execution context|
|---|---|
|A *global object* (`window` for a browser or `global` for node), to which the executing code belongs, is created in *Object environment record*.|An *arguments* object which contains a reference to the parameters passed to the function is created in *Declarative environment record*.|
|Memory for the variables and function declaration within the global execution context (defined globally) is allocated in *Object environment record*.|Memory for the variables and function declaration within the function execution context (defined within the function) is allocated in *Declarative environment record*.|
|`this` variable referring to the global object is created.|`this` variable referring to the global object (or to an object to which the current code that’s being executed belongs) is created.|

Variables are initialized as `undefined` (except `let` and `const` which will remain *uninitialized*). Functions get placed directly in the memory. That is why accessing `var` defined variable before declaring any value to it gets you undefined, but the same with `let` and `const` gets you the `ReferenceError`.

It's is when hoisting takes place as well as where closures are created.

### Execution phase
The first function to be executed is the one with its execution context at the top of the call stack.
Execution context gets popped off the stack when assignments to all the variables are done, and the code is executed (function is returned).
Finally, when the global execution context gets popped off the call stack, the program ends.

## Conclusions

Well, this is it. That is how the JavaScript engine does on a high to medium level. Each concept could, of course, be covered in even more detail, but that is beyond my needs for now. Maybe someday. In the meantime, keep on coding!

## References
- https://www.youtube.com/watch?v=xckH5s3UuX4
- https://softwareengineeringdaily.com/2018/10/03/javascript-and-the-inner-workings-of-your-browser/
- https://www.youtube.com/watch?v=p-iiEDtpy6I
- https://hacks.mozilla.org/2017/02/a-crash-course-in-just-in-time-jit-compilers/
- https://www.youtube.com/watch?v=exrc_rLj5iw
- https://blog.greenroots.info/understanding-javascript-execution-context-like-never-before-ckb8x246k00f56hs1nefzpysq
