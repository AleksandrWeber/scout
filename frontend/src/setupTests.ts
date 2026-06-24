import '@testing-library/jest-dom';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.theme = 'light';
  document.documentElement.lang = 'en';
});
