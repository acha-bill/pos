import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import App from './App';
import configureStore from './store';

test('renders login screen', async () => {
  const { findByText } = render(
    <Provider store={configureStore({})}>
      <App />
    </Provider>
  );
  const linkElement = await findByText(/login to pos/i);
  expect(linkElement).toBeInTheDocument();
});
