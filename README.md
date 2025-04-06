# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

# Thing in Rings

A Venn diagram-based word categorization game.

## Language Configuration

The application's language is configured in `src/config/app-config.ts`. By default, the application uses English (`'en'`).

### Changing the Language

To change the application's language, edit the `defaultLanguage` property in `src/config/app-config.ts`:

```typescript
export const LANGUAGE_CONFIG = {
  // Change this value to set the application language
  defaultLanguage: 'en', // Options: 'en' (English), 'zh' (Chinese)
  
  // Whether to allow language detection from browser
  detectBrowserLanguage: false,
  
  // Fallback language if the default language is not available
  fallbackLanguage: 'en',
};
```

Available language options:
- `'en'`: English
- `'zh'`: Chinese

### Adding a New Language

To add a new language:

1. Create a new translation file in `src/i18n/locales/` (e.g., `fr.json` for French)
2. Add the language to the resources in `src/i18n/i18n.ts`:

```typescript
import frTranslation from './locales/fr.json';

// ...

i18nInstance.init({
  resources: {
    en: {
      translation: enTranslation,
    },
    zh: {
      translation: zhTranslation,
    },
    fr: {
      translation: frTranslation,
    },
  },
  // ...
});
```

3. Update the `defaultLanguage` in `src/config/app-config.ts` to use the new language code.

## Development

### Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

### Building for Production

Run `npm run build` to create a production build.

## License

[MIT License](LICENSE)
