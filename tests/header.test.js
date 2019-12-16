// because of error 'TypeError: Cannot create property '_called' on number '10'' when running tests (not in a course)
Number.prototype._called = {};
const browserUrl = "http://localhost:3000";
const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto(browserUrl);
});

afterEach(async () => {
  await page.close();
});

test("the header has the correct test", async () => {
  const text = await page.getContentsOf("a.left.brand-logo");

  expect(text).toEqual("Blogster");
});

test("clicking login starts oauth flow", async () => {
  await page.click(".right a");
  const url = await page.url();
  // escape '.' so regex does not match any other references but just the string
  expect(url).toMatch(/accounts\.google\.com/);
});

test("when signed in, shows logout button", async () => {
  await page.login(browserUrl);

  const logoutText = await page.getContentsOf("a[href='/auth/logout']");
  expect(logoutText).toEqual("Logout");
});
