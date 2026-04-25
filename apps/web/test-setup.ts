// Bun test setup for @prismhub/web — DOM environment via @happy-dom/global-registrator.
// IMPORTANT: Must NOT import @testing-library/* here. ES module imports are hoisted
// and evaluated before any module body code runs, so @testing-library/dom would
// capture `screen` without a document. By keeping this file import-free of testing
// libraries, GlobalRegistrator.register() runs first, making document available when
// the test file's own @testing-library imports are evaluated.
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (typeof globalThis.document === 'undefined') {
  GlobalRegistrator.register({ url: 'http://localhost/' });
}
