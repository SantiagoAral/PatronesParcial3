# Realtime Chat PoC
Este PoC implementa un chat en tiempo real con WebSockets + RabbitMQ + Postgres.

Santiago Andres Araque Araque y Sergio Gabriel Nieto Meneses

Tests Realizados:

<img width="298" height="155" alt="image" src="https://github.com/user-attachments/assets/8491be3d-d5d3-41dd-93e8-fe658d2f5201" />

## rooms.integration.test.js
```javascript
const request = require("supertest");
const app = require("../../src/index");
const pool = require("../../src/db");

describe("Rooms Integration", () => {

  test("GET /rooms/list devuelve lista", async () => {
    pool.query.mockResolvedValue({
      rows: [
        { id: 1, name: "general", is_private: false }
      ]
    });

    const res = await request(app)
      .get("/rooms/list")
      .set("Authorization", "Bearer faketoken");

    expect(res.statusCode).toBe(200);
    expect(res.body.rooms.length).toBe(1);
  });

});
```

## auth-middleware.test.js
```javascript
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn()
}));

const jwt = require("jsonwebtoken");
const { authenticate } = require("../../src/middleware/auth");

describe("authenticate middleware", () => {

  test("pasa next() si token válido", () => {
    const fakePayload = { id: 1, username: "test" };
    jwt.verify.mockReturnValue(fakePayload);

    const req = { headers: { authorization: "Bearer abc123" } };
    const res = {};
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(fakePayload);
  });

  test("401 si token inválido", () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("invalid");
    });

    const req = { headers: { authorization: "Bearer bad" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
  });
});
```

## auth-routes.test.js
```javascript
const request = require("supertest");
const app = require("../../src/index");
const bcrypt = require("bcrypt");
const pool = require("../../src/db");

describe("Auth routes", () => {

  test("POST /auth/register crea usuario", async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 1, username: "santi" }],
    });

    const res = await request(app)
      .post("/auth/register")
      .send({ username: "santi", password: "123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe("santi");
  });

  test("POST /auth/login devuelve token", async () => {
    bcrypt.compare = jest.fn().mockResolvedValue(true);

    pool.query.mockResolvedValue({
      rows: [{ id: 1, username: "santi", password_hash: "xxxx" }],
    });

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "santi", password: "123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});

```
## setup.js
```javascript
const request = require("supertest");
const app = require("../../src/index");
const bcrypt = require("bcrypt");
const pool = require("../../src/db");

describe("Auth routes", () => {

  test("POST /auth/register crea usuario", async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 1, username: "santi" }],
    });

    const res = await request(app)
      .post("/auth/register")
      .send({ username: "santi", password: "123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe("santi");
  });

  test("POST /auth/login devuelve token", async () => {
    bcrypt.compare = jest.fn().mockResolvedValue(true);

    pool.query.mockResolvedValue({
      rows: [{ id: 1, username: "santi", password_hash: "xxxx" }],
    });

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "santi", password: "123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});


```






npm test

> api-gateway@1.0.0 test
> cross-env NODE_OPTIONS=--experimental-vm-modules jest --runInBand

 PASS  tests/unit/auth-routes.test.js
 PASS  tests/integration/rooms.integration.test.js
 PASS  tests/unit/auth-middleware.test.js

Test Suites: 3 passed, 3 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        1.9 s, estimated 12 s
Ran all test suites.


![Imagen de WhatsApp 2025-11-24 a las 21 15 12_d93659f0](https://github.com/user-attachments/assets/f731fa9c-2a25-4a2e-9249-167cfd533cbc)



