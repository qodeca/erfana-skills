# React + Babel project conventions

Technical conventions you must follow when prototyping with HTML + React + Babel. Break them and the prototype breaks.

## Pinned script tags (you must use these versions)

Place these three script tags inside the HTML `<head>`, with **fixed versions and integrity hashes**:

```html
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>
```

**Do not** use unpinned versions like `react@18` or `react@latest` - they invite version drift and cache issues.

**Do not** drop `integrity` - if a CDN gets hijacked or tampered with, this is your last line of defense.

## File structure

```
project-name/
├── index.html               # Main HTML
├── components.jsx           # Components file (loaded with type="text/babel")
├── data.js                  # Data file
└── styles.css               # Extra CSS (optional)
```

How to load them from HTML:

```html
<!-- React + Babel first -->
<script src="https://unpkg.com/react@18.3.1/..."></script>
<script src="https://unpkg.com/react-dom@18.3.1/..."></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/..."></script>

<!-- Then your component files -->
<script type="text/babel" src="components.jsx"></script>
<script type="text/babel" src="pages.jsx"></script>

<!-- Finally the main entry point -->
<script type="text/babel">
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
</script>
```

**Do not** use `type="module"` - it conflicts with Babel.

## Three rules you must not break

### Rule 1: the styles object must use a unique name

**Wrong** (guaranteed to break with multiple components):
```jsx
// components.jsx
const styles = { button: {...}, card: {...} };

// pages.jsx  <- collides with the same name!
const styles = { container: {...}, header: {...} };
```

**Right**: every component file's styles use a unique prefix.

```jsx
// terminal.jsx
const terminalStyles = { 
  screen: {...}, 
  line: {...} 
};

// sidebar.jsx
const sidebarStyles = { 
  container: {...}, 
  item: {...} 
};
```

**Or use inline styles** (recommended for small components):
```jsx
<div style={{ padding: 16, background: '#111' }}>...</div>
```

This rule is **non-negotiable**. Every time you write `const styles = {...}` you must replace it with a specific name, otherwise loading multiple components will throw across the whole stack.

### Rule 2: scope is not shared - export manually

**The key insight**: every `<script type="text/babel">` is compiled by Babel independently, and **scope does not leak between them**. The `Terminal` component defined in `components.jsx` is **undefined by default** in `pages.jsx`.

**The fix**: at the end of each component file, export the components and helpers you want to share onto `window`:

```jsx
// End of components.jsx
function Terminal(props) { ... }
function Line(props) { ... }
const colors = { green: '#...', red: '#...' };

Object.assign(window, {
  Terminal, Line, colors,
  // List everything you need to use elsewhere
});
```

Then `pages.jsx` can use `<Terminal />` directly, because JSX will look up `window.Terminal`.

### Rule 3: do not use scrollIntoView

`scrollIntoView` pushes the entire HTML container upward and breaks the web harness layout. **Never use it**.

Alternatives:
```js
// Scroll to a position inside a container
container.scrollTop = targetElement.offsetTop;

// Or use element.scrollTo
container.scrollTo({
  top: targetElement.offsetTop - 100,
  behavior: 'smooth'
});
```

## Calling the Claude API (from inside HTML)

Some native design-agent environments (like Claude.ai Artifacts) ship with a zero-config `window.claude.complete`, but most agent environments (Claude Code / Codex / Cursor / Trae / etc.) **do not have one** locally.

If your HTML prototype needs to call an LLM for the demo (for example, building a chat interface), there are two options:

### Option A: do not actually call - use a mock

Recommended for demo scenarios. Write a fake helper that returns a canned response:
```jsx
window.claude = {
  async complete(prompt) {
    await new Promise(r => setTimeout(r, 800)); // Simulate latency
    return "This is a mock response. Replace with the real API before deploying.";
  }
};
```

### Option B: call the real Anthropic API

Requires an API key - the user has to paste their own key into the HTML for it to work. **Never hardcode a key into the HTML.**

```html
<input id="api-key" placeholder="Paste your Anthropic API key" />
<script>
window.claude = {
  async complete(prompt) {
    const key = document.getElementById('api-key').value;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    return data.content[0].text;
  }
};
</script>
```

**Caveat**: calling the Anthropic API directly from the browser hits CORS. If the preview environment the user gives you does not allow CORS bypass, this route is closed - fall back to Option A and mock the responses, or tell the user they need a proxy backend.

### Option C: use the agent's own LLM capability to generate mock data

For a purely local demo, you can temporarily call the current agent's LLM (or a multi-model skill the user has installed) to generate mock response data, then hardcode it into the HTML. The HTML at runtime then has zero dependency on any API.

## Standard HTML starter template

Copy this template as the skeleton for a React prototype:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Prototype Name</title>

  <!-- React + Babel pinned -->
  <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; width: 100%; }
    body { 
      font-family: -apple-system, 'SF Pro Text', sans-serif;
      background: #FAFAFA;
      color: #1A1A1A;
    }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>

  <!-- Your component files -->
  <script type="text/babel" src="components.jsx"></script>

  <!-- Main entry point -->
  <script type="text/babel">
    const { useState, useEffect } = React;

    function App() {
      return (
        <div style={{padding: 40}}>
          <h1>Hello</h1>
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>
```

## Common errors and fixes

**`styles is not defined` or `Cannot read property 'button' of undefined`**
-> One file defined `const styles` and another file overwrote it. Rename each one to a specific identifier.

**`Terminal is not defined`**
-> Cross-file references do not share scope. Add `Object.assign(window, {Terminal})` at the end of the file that defines `Terminal`.

**The whole page is white and the console shows no errors**
-> Most likely a JSX syntax error that Babel did not surface to the console. Temporarily swap `babel.min.js` for the unminified `babel.js` to get clearer error messages.

**ReactDOM.createRoot is not a function**
-> Wrong version. Confirm you are using react-dom@18.3.1 (not 17 or any other version).

**`Objects are not valid as a React child`**
-> You are rendering an object instead of JSX or a string. Usually `{someObj}` should have been `{someObj.name}`.

## How to split up a large project

A **single file over 1000 lines** is hard to maintain. Suggested split:

```
project/
├── index.html
├── src/
│   ├── primitives.jsx      # Base elements: Button, Card, Badge...
│   ├── components.jsx      # Domain components: UserCard, PostList...
│   ├── pages/
│   │   ├── home.jsx        # Home page
│   │   ├── detail.jsx      # Detail page
│   │   └── settings.jsx    # Settings page
│   ├── router.jsx          # Simple router (React state switch)
│   └── app.jsx             # Entry component
└── data.js                 # Mock data
```

Load them from HTML in order:
```html
<script type="text/babel" src="src/primitives.jsx"></script>
<script type="text/babel" src="src/components.jsx"></script>
<script type="text/babel" src="src/pages/home.jsx"></script>
<script type="text/babel" src="src/pages/detail.jsx"></script>
<script type="text/babel" src="src/pages/settings.jsx"></script>
<script type="text/babel" src="src/router.jsx"></script>
<script type="text/babel" src="src/app.jsx"></script>
```

**At the end of every file**, do `Object.assign(window, {...})` to export anything that needs to be shared.
