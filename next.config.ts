// before
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
export default withNextIntl({ /* your config */ });

// after — just your plain config
export default { /* your config */ };
