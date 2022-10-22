import type { Component } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';
import { postsApi } from '@ts-rest/example-microservice/util-posts-api';
import { initQueryClient } from '@ts-rest/solid-query';

const client = initQueryClient(postsApi, {
  baseUrl: 'http://localhost:5003',
  baseHeaders: {},

});

const App: Component = () => {
  const updatePostThumbnail = client.updatePostThumbnail.createMutation({});

  const data = client.getPosts.createQuery(() => ['posts'], { query: {} });

  console.log(data.data);

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <img src={logo} class={styles.logo} alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          class={styles.link}
          href="https://github.com/solidjs/solid"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Solid
        </a>
      </header>
    </div>
  );
};

export default App;
