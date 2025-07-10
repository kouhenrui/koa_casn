
import MWSService from "../src/meituan/api";

describe('MWSService Tests', () => {
    let authorization:string;
    let accessToken:string;
    it("return 房东常量信息", async () => {
      const accessToken = "40FCA90D065748DCA3B6BFA0B493AE07";
      const res = await MWSService.getConstantsMWS(accessToken);

      console.log("房东常量信息:", res);
    });
//   it('should return a valid authorization header', async () => {
//     try {
//         const provinceRes = await MWSService.getProvinceCityMWS();
//         console.log("Generated provinceRes:", provinceRes); 
//         // const res = await MWSService.getScopeListMWS();
//         // console.log("Scope List:", res);
//     } catch (error) {
//         console.error(error,'78956423156')
//     }
   
//     // const res=await MWSService.getScopeListMWS()
//     // console.log('Scope List:', res);
//     // const expectedSignature = "MWS testAppId:rBGarWTmYyM2FEvc/AVZwuE95VE="; // Adjust this based on your expected output
//     // expect(authorization).toBe(expectedSignature);
//   });

  // Uncomment and adjust the test below if you want to test the access token retrieval
//   it('should return a valid access token', async () => {
//     const accessToken = await MWSService.getAccessTokenMWS();
//     console.log('Access Token:', accessToken);
//     expect(accessToken).toBeDefined(); // Adjust based on your expected output
//   });
});