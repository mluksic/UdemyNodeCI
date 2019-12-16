const puppeteer = require("puppeteer");
const userFactory = require("../factories/userFactory");
const sessionFactory = require("../factories/sessionFactory");

class CustomPage {
  constructor(page, browserUrl) {
    this.page = page;
    this.browserUrl = browserUrl;
  }

  // static function - so that we don't have to make a new instance of CustomClass and call 'build' function
  static async build(browserUrl) {
    const browser = await puppeteer.launch({
      headless: true,
      // chromium uses multiple layers of sand-boxing to protect host environment from un-trusted we content,
      // if you trust the content you open inside of a browser, you can launch with '--no-sandbox'
      // will decrease the amount of time to run the tests
      args: ["--no-sandbox"]
    });
    const page = await browser.newPage();
    const customPage = new CustomPage(page, browserUrl);

    return new Proxy(customPage, {
      get: function(target, property) {
        // we include 'browser' because we always use browser instance just to create new page and close the browser
        // since we're calling 'close' function after each test case to close the browser
        //    and 'browser' and 'page' both has this function, we move 'browser'
        //    to 2nd check, so that we rather close browser and not page when running tests
        return customPage[property] || browser[property] || page[property];
      }
    });
  }

  async login(browserUrl) {
    const user = await userFactory();
    const { session, sessionSig } = sessionFactory(user);

    const sessionCookies = [
      {
        name: "session",
        value: session
      },
      {
        name: "session.sig",
        value: sessionSig
      }
    ];

    await this.page.setCookie(...sessionCookies);
    // fake 'login' oauth leaves on localhost:3000 after faking login
    // therefore we go to /blogs right away
    await this.page.goto(`${browserUrl}/blogs`);

    // so that page waits for a element to appear on the screen and then proceed the test
    await this.page.waitFor("a[href='/auth/logout']");
  }

  async getContentsOf(selector) {
    return await this.page.$eval(selector, el => el.innerHTML);
  }

  get(path) {
    return this.page.evaluate(_path => {
      return fetch(_path, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        }
      }).then(res => res.json());
      // you have to pass 'path' as a argument, because inner function
      // forms a closure scope variable, therefore 'path' would be send
      // to chromium as a string, and be undefined, ...args fixes this problem
    }, path);
  }

  post(path, reqBody) {
    // you have to wrap 'fetch' inside a function to pass is to chromium to evaluate
    // puppeteer will then send it as a string to chromium and run it and
    // wait for the response (Promise) and then return it inside a test runner
    return this.page.evaluate(
      (_path, _reqBody) => {
        return fetch(_path, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(_reqBody)
          // fetch responsive is in raw format, therefore you have to
          // transform it into a JSON format
          // after Promise is resolved, it will send the response back
          // to the test runner and save it to 'result' variable
        }).then(res => res.json());
      },
      path,
      reqBody
    );
  }

  execRequests(actions) {
    return Promise.all(
      actions.map(({ method, path, reqBody }) => {
        // even if it's 'GET' request, reqBody param can be passed along
        // since it will be ignored anyway because it's undefined
        return this[method.toLowerCase()](path, reqBody);
      })
    );
  }
}

module.exports = CustomPage;
