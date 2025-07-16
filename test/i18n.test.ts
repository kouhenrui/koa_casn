import { runAllI18nExamples } from "../src/examples/i18n.example";
import { I18nService } from "../src/util/i18n";
import { initI18n } from "../src/util/i18n-init";
// import { initI18n } from "../src/util/i18n-init";

describe('i18n', () => {
    beforeAll(async () => {
      // 初始化i18n服务
      await initI18n({
        defaultLocale: "zh-CN",
        fallbackLocale: "en-US",
        locales: ["zh-CN", "en-US"],
        loadPath: "./locales",
        cache: true,
        debug: process.env.NODE_ENV === "development",
      });
      // I18nService.getInstance();
    });
    it('should run all i18n examples', () => {
        runAllI18nExamples();
    });
});