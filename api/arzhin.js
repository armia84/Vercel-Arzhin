export const config = {
  runtime: "edge",
};

const PROXY_TARGET = (process.env.TARGET_DOMAIN || "").trim().replace(/\/+$/, "");

export default async function webAppBackend(request) {
  if (!PROXY_TARGET) {
    return new Response(JSON.stringify({ status: "maintenance", message: "System initializing" }), {
      status: 503,
      headers: { "content-type": "application/json" }
    });
  }

  try {
    const currentUrl = new URL(request.url);
    const destination = ${PROXY_TARGET}${currentUrl.pathname}${currentUrl.search};

    // شبیه‌سازی دقیق هدرهای یک اپلیکیشن مدرن React
    const secureHeaders = new Headers();
    const allowedHeaders = ["accept", "content-type", "authorization", "user-agent", "x-requested-with"];

    for (const [key, value] of request.headers.entries()) {
      const k = key.toLowerCase();
      // عبور دادن هدرهای استاندارد و حذف هدرهای مشکوک Vercel
      if (allowedHeaders.includes(k)  k.startsWith("sec-")  k.startsWith("x-app-")) {
        secureHeaders.set(key, value);
      }
    }

    // بازسازی هدرهای امنیتی برای عادی‌سازی ترافیک
    secureHeaders.set("X-Requested-With", "XMLHttpRequest");
    secureHeaders.set("Cache-Control", "no-cache");
    secureHeaders.set("Origin", "https://vercel.com");

    const fetchConfig = {
      method: request.method,
      headers: secureHeaders,
      redirect: "manual",
    };

    if (!["GET", "HEAD"].includes(request.method)) {
      fetchConfig.body = request.body;
      fetchConfig.duplex = "half";
    }

    const response = await fetch(destination, fetchConfig);
    
    // شبیه‌سازی پاسخ سرور برای پنهان کردن ردپای پروکسی
    const finalHeaders = new Headers(response.headers);
    finalHeaders.set("Server", "NodeJS-Production-Env");
    finalHeaders.delete("x-vercel-id");
    finalHeaders.delete("x-vercel-cache");
    finalHeaders.delete("transfer-encoding");

    return new Response(response.body, {
      status: response.status,
      headers: finalHeaders,
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: "Endpoint Not Active" }), { 
      status: 404,
      headers: { "content-type": "application/json" }
    });
  }
      }
