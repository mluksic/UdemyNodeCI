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

describe("When logged in", async () => {
  // all tests inside this 'describe' statement will login and go to blog form page
  beforeEach(async () => {
    await page.login(browserUrl);
    // go to blog form page
    await page.click("a.btn-floating");
  });

  test("Show blog form page", async () => {
    const formTitleText = await page.getContentsOf(".title label");
    const formContentText = await page.getContentsOf(".content label");

    expect(formTitleText).toEqual("Blog Title");
    expect(formContentText).toEqual("Content");
  });

  describe("And using invalid inputs", async () => {
    beforeEach(async () => {
      // click on 'Next' with empty inputs
      await page.click("form button");
    });
    test("form shows and error message", async () => {
      const titleErrorMessage = await page.getContentsOf(".title .red-text");
      const contentErrorMessage = await page.getContentsOf(
        ".content .red-text"
      );

      expect(titleErrorMessage).toEqual("You must provide a value");
      expect(contentErrorMessage).toEqual("You must provide a value");
    });
  });

  describe("And using valid form inputs", async () => {
    beforeEach(async () => {
      // fill out input fields and click on 'Next' button
      await page.type(".title input", "Test title");
      await page.type(".content input", "This is the content of a test blog");
      await page.click("form button");
    });

    test("Submitting takes user to review screen", async () => {
      const confirmText = await page.getContentsOf(".container form h5");
      expect(confirmText).toEqual("Please confirm your entries");
    });

    test("Submitting then saving adds blog to index page", async () => {
      await page.click("button.green");
      await page.waitFor(".card");

      const cardTitle = await page.getContentsOf(".card-title");
      const cardContent = await page.getContentsOf("p");

      expect(cardTitle).toEqual("Test title");
      expect(cardContent).toEqual("This is the content of a test blog");
    });
  });
});

describe("When not signed in", async () => {
  const testActions = [
    {
      method: "GET",
      path: "/api/blogs"
    },
    {
      method: "POST",
      path: "/api/blogs",
      reqBody: {
        title: "My Title",
        content: "Testing content"
      }
    }
  ];

  test("User cannot access blog routes", async () => {
    const results = await page.execRequests(testActions);

    for (result of results) {
      expect(result).toEqual({ error: "You must log in!" });
    }
  });

  // Before 'super advanced' refactor with the 'execRequests' helper

  // test("User cannot create blog posts", async () => {
  //   const result = await page.post("/api/blogs");

  //   expect(result).toEqual({ error: "You must log in!" });
  // });

  // test("User cannot retrieve list of blogs", async () => {
  //   const result = await page.get("/api/blogs");

  //   expect(result).toEqual({ error: "You must log in!" });
  // });
});
