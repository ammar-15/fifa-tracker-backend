import httpMocks from "node-mocks-http";
import { sequelize } from "./testDb";
// import { defineUserModel } from "./user";
// const User = defineUserModel(sequelize);

// Use var for hoisting!
var mockFindOne = jest.fn();
var mockCreate = jest.fn();
var mockSync = jest.fn();

jest.mock("../src/models/user", () => ({
  __esModule: true,
  default: {
    findOne: mockFindOne,
    create: mockCreate,
    sync: mockSync,
  },
}));

jest.mock("bcryptjs", () => ({
  genSalt: jest.fn().mockResolvedValue("salt"),
  hash: jest.fn().mockResolvedValue("hashedPassword"),
  compare: jest.fn((plain, hashed) =>
    Promise.resolve(plain === "password123" && hashed === "hashedPassword")
  ),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mocked.jwt.token"),
}));

// Import after mocks!
const { login, register } = require("../src/controllers/auth.controller");

describe("Auth Controller (unit, fully mocked)", () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true }); // Recreate tables
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should return 400 if email and password are missing", async () => {
      const req = httpMocks.createRequest({ body: {} });
      const res = httpMocks.createResponse();
      await register(req as any, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 409 if email already exists", async () => {
      mockFindOne.mockResolvedValueOnce({}); // Simulate user found
      const req = httpMocks.createRequest({
        body: { email: "test@example.com", password: "pass", username: "user" },
      });
      const res = httpMocks.createResponse();
      await register(req as any, res as any);
      expect(res.statusCode).toBe(409);
    });

    it("should register a new user and return 201", async () => {
      mockFindOne.mockResolvedValueOnce(null); // No user found
      mockCreate.mockResolvedValueOnce({});
      const req = httpMocks.createRequest({
        body: {
          email: "user@example.com",
          password: "password123",
          username: "user",
        },
      });
      const res = httpMocks.createResponse();
      await register(req as any, res as any);
      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res._getData())).toMatchObject({
        message: expect.any(String),
        token: "mocked.jwt.token",
      });
    });
  });

  describe("login", () => {
    it("should return 400 if identifier or password is missing", async () => {
      const req = httpMocks.createRequest({ body: {} });
      const res = httpMocks.createResponse();
      await login(req as any, res as any);
      expect(res.statusCode).toBe(400);
    });

    it("should return 401 if user not found", async () => {
      mockFindOne.mockResolvedValueOnce(null);
      const req = httpMocks.createRequest({
        body: { identifier: "notfound", password: "pass" },
      });
      const res = httpMocks.createResponse();
      await login(req as any, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if password does not match", async () => {
      mockFindOne.mockResolvedValueOnce({ password: "hashedPassword" });
      // bcrypt.compare will return false for wrong password
      const req = httpMocks.createRequest({
        body: { identifier: "user", password: "wrongpassword" },
      });
      const res = httpMocks.createResponse();
      await login(req as any, res as any);
      expect(res.statusCode).toBe(401);
    });

    it("should login successfully with correct credentials", async () => {
      mockFindOne.mockResolvedValueOnce({
        userId: "1",
        email: "user@example.com",
        password: "hashedPassword",
      });
      const req = httpMocks.createRequest({
        body: { identifier: "user@example.com", password: "password123" },
      });
      const res = httpMocks.createResponse();
      await login(req as any, res as any);
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res._getData())).toMatchObject({
        userId: "1",
        email: "user@example.com",
        access_token: "mocked.jwt.token",
      });
    });
  });
});

//mock endpoint with super test
//use jest and super test
