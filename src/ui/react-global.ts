import * as React from 'react';

// O _ds_bundle.js usa o React global (window.React). Este módulo precisa ser importado antes dele.
(window as unknown as { React: typeof React }).React = React;
