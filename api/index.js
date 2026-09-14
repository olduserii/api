/**
 * Vercel Edge Function — Sueta Config Generator
 * Берёт suki.txt с GitHub → собирает полный конфиг
 * Поддержка: VLESS (tcp/ws/grpc/xhttp), Trojan, Hysteria2, VMess
 * + расширенный список российских доменов для direct
 */

const SUKI_URL = "https://raw.githubusercontent.com/gh8y4gwmsq-web/sUukaaa/refs/heads/main/suki.txt";

export default {
  async fetch(request) {
    try {
      const res = await fetch(SUKI_URL, {
        headers: { "User-Agent": "Vercel-Sueta/1.0" },
      });

      if (!res.ok) {
        return new Response("GitHub error: " + res.status, { status: 502 });
      }

      const text = await res.text();
      const config = buildConfig(text);

      return new Response(JSON.stringify(config, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "profile-title": "Sueta",
          "profile-update-interval": "4",
          "support-url": "https://t.me/SuetaVpna",
          "profile-web-page-url": "https://t.me/SuetaVpna",
        },
      });
    } catch (err) {
      return new Response("Ошибка загрузки: " + err.message, { status: 502 });
    }
  },
};

function buildConfig(sukiText) {
  const lines = sukiText.split("\n").map(l => l.trim()).filter(Boolean);
  const links = lines.filter(l => !l.startsWith("#"));

  const outbounds = [];
  const names = [];

  links.forEach((link, i) => {
    try {
      const { outbound, name } = parseLink(link);
      outbound.tag = `proxy-${String(i + 1).padStart(2, "0")}`;
      outbounds.push(outbound);
      names.push(name);
    } catch (e) {
      // пропускаем битые ссылки
    }
  });

  const dns = {
    queryStrategy: "UseIPv4",
    servers: ["1.1.1.1", "https://dns.adguard.com/dns-query"],
  };

  const inbounds = [
    {
      listen: "127.0.0.1",
      port: 10808,
      protocol: "socks",
      settings: { auth: "noauth", udp: true },
      sniffing: {
        destOverride: ["http", "tls", "quic"],
        enabled: true,
        routeOnly: false,
      },
      tag: "socks",
    },
    {
      listen: "127.0.0.1",
      port: 10809,
      protocol: "http",
      settings: { allowTransparent: false },
      sniffing: {
        destOverride: ["http", "tls", "quic"],
        enabled: true,
        routeOnly: false,
      },
      tag: "http",
    },
  ];

  const direct = { protocol: "freedom", tag: "direct" };
  const block = { protocol: "blackhole", tag: "block" };

  const directDomains = [
    // === Соцсети и мессенджеры ===
    "domain:vk.com", "domain:vk.ru", "domain:userapi.com", "domain:vk-cdn.net", "domain:vkuseraudio.net",
    "domain:ok.ru", "domain:okcdn.ru",
    "domain:max.ru", "domain:web.max.ru",
    "domain:dzen.ru", "domain:dzeninfra.ru",

    // === Яндекс ===
    "domain:yandex.ru", "domain:yandex.com", "domain:yandex.net", "domain:ya.ru",
    "domain:yastatic.net", "domain:yandex.st", "domain:yandexadexchange.net",
    "domain:kinopoisk.ru", "domain:kp.yandex.net",

    // === Mail.ru Group ===
    "domain:mail.ru", "domain:imgsmail.ru", "domain:mycdn.me",

    // === Видео / Стриминг ===
    "domain:rutube.ru", "domain:rtb.ru",
    "domain:okko.tv", "domain:okko.sport",
    "domain:premier.one",
    "domain:ivi.ru", "domain:ivi.tv",
    "domain:wink.ru",
    "domain:more.tv",
    "domain:start.ru", "domain:start.film",

    // === Маркетплейсы и ритейл ===
    "domain:wildberries.ru", "domain:wb.ru", "domain:wbbasket.ru", "domain:wbstatic.net",
    "domain:ozon.ru", "domain:ozonusercontent.com", "domain:ozone.ru",
    "domain:avito.ru", "domain:avito.st",
    "domain:lamoda.ru", "domain:lamoda.by",
    "domain:dns-shop.ru",
    "domain:mvideo.ru", "domain:eldorado.ru", "domain:citilink.ru",
    "domain:technopark.ru", "domain:onlinetrade.ru",
    "domain:petrovich.ru", "domain:leroymerlin.ru",
    "domain:5ka.ru", "domain:pyaterochka.ru", "domain:perekrestok.ru", "domain:x5.ru",

    // === Карты, недвижимость, авто ===
    "domain:2gis.ru", "domain:2gis.com",
    "domain:cian.ru", "domain:cian.site",
    "domain:youla.ru",
    "domain:drom.ru", "domain:auto.ru",

    // === Банки и финансы ===
    "domain:sberbank.ru", "domain:sber.ru", "domain:sberbank.com", "domain:sberdevices.ru",
    "domain:tinkoff.ru", "domain:tbank.ru", "domain:tcsbank.ru",
    "domain:alfabank.ru", "domain:alfabank.com",
    "domain:vtb.ru", "domain:vtb.com",
    "domain:gazprombank.ru", "domain:gpb.ru",
    "domain:rshb.ru", "domain:open.ru", "domain:raiffeisen.ru",
    "domain:rosbank.ru", "domain:sovcombank.ru", "domain:mkb.ru",
    "domain:nspk.ru", "domain:sbp.ru", "domain:mironline.ru",
    "domain:yoomoney.ru", "domain:money.yandex.ru",

    // === Государство ===
    "domain:gosuslugi.ru", "domain:gosuslugi.mos.ru",
    "domain:mos.ru", "domain:mosreg.ru",
    "domain:nalog.ru", "domain:nalog.gov.ru",
    "domain:cbr.ru", "domain:cbrf.ru",
    "domain:pfr.gov.ru", "domain:sfr.gov.ru",
    "domain:gu-st.ru",

    // === Работа ===
    "domain:hh.ru", "domain:hhcdn.ru",
    "domain:superjob.ru",

    // === Прочее ===
    "domain:rbc.ru", "domain:rambler.ru",
    "domain:tutu.ru", "domain:tutu.travel",
    "domain:delivery-club.ru", "domain:eda.yandex.ru", "domain:samokat.ru",
  ];

  const selector = outbounds.map(o => o.tag);

  // ===== Auto профиль =====
  const autoConfig = {
    remarks: `🇷🇺Auto | ${outbounds.length} Servers`,
    dns,
    inbounds,
    outbounds: [...outbounds, direct, block],
    routing: {
      domainMatcher: "hybrid",
      domainStrategy: "IPIfNonMatch",
      balancers: [
        {
          tag: "Balancer",
          selector,
          fallbackTag: "proxy-01",
          strategy: {
            type: "leastLoad",
            settings: {
              expected: 2,
              maxRTT: "1s",
              tolerance: 60,
              baselines: ["1s"],
            },
          },
        },
      ],
      rules: [
        { type: "field", domain: ["geosite:category-ads"], outboundTag: "block" },
        { type: "field", protocol: ["bittorrent"], outboundTag: "direct" },
        { type: "field", domain: directDomains, outboundTag: "direct" },
        { type: "field", network: "tcp,udp", balancerTag: "Balancer" },
      ],
    },
    burstObservatory: {
      pingConfig: {
        connectivity: "",
        destination: "https://www.gstatic.com/generate_204",
        httpMethod: "GET",
        interval: "30s",
        sampling: 3,
        timeout: "1000ms",
      },
      subjectSelector: selector,
    },
    log: {
      access: "",
      dnsLog: true,
      loglevel: "Warning",
    },
  };

  // ===== Отдельные профили =====
  const configs = [autoConfig];

  outbounds.forEach((ob, i) => {
    const single = JSON.parse(JSON.stringify(ob));
    single.tag = "proxy-01";

    configs.push({
      remarks: names[i] || `Server ${i + 1}`,
      dns,
      inbounds,
      outbounds: [single, direct, block],
      routing: {
        domainMatcher: "hybrid",
        domainStrategy: "IPIfNonMatch",
        rules: [
          { type: "field", domain: ["geosite:category-ads"], outboundTag: "block" },
          { type: "field", protocol: ["bittorrent"], outboundTag: "direct" },
          { type: "field", network: "tcp,udp", outboundTag: "proxy-01" },
        ],
      },
    });
  });

  return configs;
}

function parseLink(link) {
  let name = "unnamed";
  if (link.includes("#")) {
    name = decodeURIComponent(link.split("#").pop() || "unnamed");
  }

  // ===== Hysteria2 / hy2 =====
  if (link.startsWith("hy2://") || link.startsWith("hysteria2://")) {
    const raw = link.replace(/^hy2:\/\//, "").replace(/^hysteria2:\/\//, "");
    const [mainPart] = raw.split("#");
    const [authHost, queryPart] = mainPart.split("?");
    const [auth, hostPort] = authHost.includes("@") ? authHost.split("@") : ["", authHost];
    const [host, portStr] = hostPort.includes(":") ? hostPort.split(":") : [hostPort, "443"];
    const port = parseInt(portStr) || 443;

    const params = {};
    if (queryPart) {
      queryPart.split("&").forEach(p => {
        const [k, v] = p.split("=");
        params[k] = decodeURIComponent(v || "");
      });
    }

    return {
      name,
      outbound: {
        protocol: "hysteria",
        settings: {
          address: host,
          auth: auth,
          port: port,
          version: 2,
        },
        streamSettings: {
          network: "hysteria",
          security: "tls",
          hysteriaSettings: { version: 2 },
          tlsSettings: {
            alpn: (params.alpn || "h3").split(","),
            serverName: params.sni || host,
            fingerprint: params.fp || "chrome",
          },
        },
      },
    };
  }

  // ===== VMess =====
  if (link.startsWith("vmess://")) {
    const b64 = link.slice(8).split("#")[0];
    const json = JSON.parse(atob(b64.replace(/-/g, "+").replace(/_/g, "/")));
    const host = json.add || json.host;
    const port = parseInt(json.port) || 443;
    const uuid = json.id;
    const network = (json.net || "tcp").toLowerCase();
    const security = (json.tls === "tls" || json.tls === "reality") ? json.tls : "none";

    const stream = {
      network,
      security,
    };

    if (security === "tls" || security === "reality") {
      stream.tlsSettings = {
        serverName: json.sni || host,
        fingerprint: json.fp || "chrome",
        alpn: json.alpn ? json.alpn.split(",") : undefined,
      };
      if (security === "reality") {
        stream.realitySettings = {
          publicKey: json.pbk,
          shortId: json.sid || "",
          serverName: json.sni || host,
          fingerprint: json.fp || "chrome",
        };
        delete stream.tlsSettings;
      }
    }

    if (network === "ws") {
      stream.wsSettings = {
        path: json.path || "/",
        headers: json.host ? { Host: json.host } : {},
      };
    } else if (network === "grpc") {
      stream.grpcSettings = {
        serviceName: json.path || json.serviceName || "",
        multiMode: false,
      };
    } else if (network === "tcp") {
      stream.tcpSettings = { header: { type: json.type || "none" } };
    }

    return {
      name: json.ps || name,
      outbound: {
        protocol: "vmess",
        settings: {
          vnext: [{
            address: host,
            port,
            users: [{
              id: uuid,
              alterId: parseInt(json.aid) || 0,
              security: json.scy || "auto",
            }],
          }],
        },
        streamSettings: stream,
      },
    };
  }

  // ===== VLESS / Trojan =====
  const url = new URL(link);
  const protocol = url.protocol.replace(":", "");
  const uuidOrPass = decodeURIComponent(url.username);
  const host = url.hostname;
  const port = parseInt(url.port) || 443;
  const params = Object.fromEntries(url.searchParams.entries());

  if (protocol === "vless") {
    const user = {
      encryption: params.encryption || "none",
      id: uuidOrPass,
    };
    if (params.flow && params.flow !== "") user.flow = params.flow;

    const stream = {
      network: (params.type || "tcp").toLowerCase(),
      security: params.security || "none",
    };

    // Reality
    if (params.security === "reality") {
      stream.realitySettings = {
        fingerprint: params.fp || "firefox",
        publicKey: params.pbk,
        serverName: params.sni || host,
      };
      if (params.sid) stream.realitySettings.shortId = params.sid;
      if (params.spx) stream.realitySettings.spiderX = decodeURIComponent(params.spx);
    }
    // TLS
    else if (params.security === "tls") {
      stream.tlsSettings = {
        fingerprint: params.fp || "firefox",
        serverName: params.sni || host,
      };
      if (params.alpn) stream.tlsSettings.alpn = params.alpn.split(",");
    }

    // Transports
    if (stream.network === "tcp") {
      stream.tcpSettings = { header: { type: params.headerType || "none" } };
    } else if (stream.network === "ws") {
      stream.wsSettings = {
        path: params.path || "/",
      };
      if (params.host) stream.wsSettings.headers = { Host: params.host };
    } else if (stream.network === "grpc") {
      stream.grpcSettings = {
        multiMode: false,
        serviceName: params.serviceName || params.path || "",
      };
    } else if (stream.network === "xhttp" || stream.network === "splithttp") {
      stream.network = "xhttp";
      stream.xhttpSettings = {
        path: params.path || "/",
        host: params.host || host,
        mode: params.mode || "auto",
      };

      if (params.extra) {
        try {
          const extra = JSON.parse(decodeURIComponent(params.extra));
          if (extra.xmux) stream.xhttpSettings.xmux = extra.xmux;
          if (extra.xPaddingBytes) stream.xhttpSettings.xPaddingBytes = extra.xPaddingBytes;
          if (extra.scMaxEachPostBytes) stream.xhttpSettings.scMaxEachPostBytes = extra.scMaxEachPostBytes;
          if (extra.scMinPostsIntervalMs) stream.xhttpSettings.scMinPostsIntervalMs = extra.scMinPostsIntervalMs;
        } catch (_) {}
      }
    }

    return {
      name,
      outbound: {
        protocol: "vless",
        settings: {
          vnext: [{
            address: host,
            port,
            users: [user],
          }],
        },
        streamSettings: stream,
      },
    };
  }

  if (protocol === "trojan") {
    const stream = {
      network: (params.type || "tcp").toLowerCase(),
      security: params.security || "tls",
    };

    if (stream.security === "tls") {
      stream.tlsSettings = {
        fingerprint: params.fp || "firefox",
        serverName: params.sni || host,
      };
      if (params.alpn) stream.tlsSettings.alpn = params.alpn.split(",");
    }

    if (stream.network === "tcp") {
      stream.tcpSettings = { header: { type: params.headerType || "none" } };
    } else if (stream.network === "ws") {
      stream.wsSettings = {
        path: params.path || "/",
        headers: params.host ? { Host: params.host } : {},
      };
    }

    return {
      name,
      outbound: {
        protocol: "trojan",
        settings: {
          servers: [{
            address: host,
            password: uuidOrPass,
            port,
          }],
        },
        streamSettings: stream,
      },
    };
  }

  throw new Error("Unsupported protocol: " + protocol);
}
