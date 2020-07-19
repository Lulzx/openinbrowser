import App from './App.svelte';
import './tailwind.css';

const app = new App({
  target: document.body,
  props: {
    name: 'Open In Browser'
  }
});

export default app;
