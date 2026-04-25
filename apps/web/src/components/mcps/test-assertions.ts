import { expect } from 'bun:test';

export function expectInputValue(input: HTMLElement, expectedValue: string) {
  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError(`Expected test subject to be an input element, got ${input.tagName}`);
  }
  expect(input.value).toBe(expectedValue);
}
