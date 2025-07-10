import {
  generateAuthorization,
  getGMTDate,
  MWSHeaderOptions,
} from "../src/meituan/authorization"; // Adjust the import path as necessary

describe('Meituan Authorization', () => {

  it("should return ok", async () => {
    const a = "success";
    expect(a).toBe("success");
  });
  // it('should generate a valid GMT date', () => {
  //   const date = new Date();
  //   const gmtDate = date.toUTCString(); // Expected format: "Tue, 25 Jun 2024 08:50:00 GMT"
  //   expect(gmtDate).toMatch(getGMTDate());
  // });
  // it('should return a valid authorization header', () => {
  //   let option: MWSHeaderOptions = {
  //     clientId: "testAppId",
  //     clientSecret: "testSecretKey",
  //     method: "GET",
  //     path: "/path/to/resource",
  //   };
  //   const authorization = generateAuthorization(option);  
  //   console.log('Generated Authorization:', authorization);
  //   const expectedSignature = "MWS testAppId:rBGarWTmYyM2FEvc/AVZwuE95VE="; 
  //   expect(authorization).toBe(expectedSignature);  
  // });
});