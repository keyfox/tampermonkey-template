import { helloWorld } from "../src/helloworld.js";

test("Returns that phrase", () => {
  expect(helloWorld()).toBe("Hello, world!");
});
