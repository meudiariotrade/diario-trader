try {
  (function () {
    "use strict";
    if (typeof document > "u" || typeof Image > "u") return;
    const e = new Image();
    let r = "unloaded",
      d = null;
    const y = "editorial-mercado-v379.jpg?v=379";
    function h() {
      return r === "loaded" || r === "failed"
        ? Promise.resolve(r === "loaded")
        : d ||
            ((r = "loading"),
            (d = new Promise((n) => {
              let l = !1;
              const o = (a) => {
                l || ((l = !0), (r = a ? "loaded" : "failed"), n(a));
              };
              ((e.onload = () => o(!!e.naturalWidth)),
                (e.onerror = () => o(!1)),
                (e.src = y),
                e.complete && e.naturalWidth && o(!0));
            })),
            d);
    }
    function x(n, l, o) {
      if (!n || !n.getContext) return n;
      const a = 190,
        i = n.width,
        u = n.height,
        f = document.createElement("canvas");
      ((f.width = i), (f.height = u + a));
      const t = f.getContext("2d");
      if (!t) return n;
      if (
        (t.drawImage(n, 0, a),
        t.save(),
        (t.fillStyle = "#131416"),
        t.fillRect(0, 0, i, a),
        r === "loaded" && e.naturalWidth && e.naturalHeight)
      ) {
        const c = i / a,
          m = e.naturalWidth / e.naturalHeight,
          w = m > c ? e.naturalHeight * c : e.naturalWidth,
          p = m > c ? e.naturalHeight : e.naturalWidth / c,
          I = e.naturalWidth - w,
          R = (e.naturalHeight - p) / 2;
        t.drawImage(e, I, R, w, p, 0, 0, i, a);
      }
      const s = t.createLinearGradient(0, 0, i * 0.87, 0);
      return (
        s.addColorStop(0, "rgba(16,17,18,0.98)"),
        s.addColorStop(0.55, "rgba(16,17,18,0.83)"),
        s.addColorStop(1, "rgba(16,17,18,0.17)"),
        (t.fillStyle = s),
        t.fillRect(0, 0, i, a),
        (t.textAlign = "left"),
        (t.textBaseline = "alphabetic"),
        (t.fillStyle = "#d4b57d"),
        (t.font = "700 18px system-ui"),
        t.fillText(
          "DIÁRIO DE TRADER  /  INTELIGÊNCIA DE MERCADO",
          46,
          40,
          i - 82,
        ),
        (t.fillStyle = "#fbfbfa"),
        (t.font =
          "700 " + Math.max(25, Math.min(40, i * 0.037)) + "px system-ui"),
        t.fillText(l, 46, 98, i * 0.78),
        (t.fillStyle = "#ced0d4"),
        (t.font = "20px system-ui"),
        t.fillText(o, 46, 137, i * 0.78),
        (t.fillStyle = "#878c96"),
        (t.font = "15px system-ui"),
        t.fillText("ARTE EDITORIAL • IMAGEM ILUSTRATIVA", 46, 169, i * 0.8),
        t.restore(),
        f
      );
    }
    function g(n, l, o) {
      if (typeof window[n] != "function") return;
      const a = window[n];
      window[n] = function (...i) {
        const u = a.apply(this, i);
        return x(u, l, typeof o == "function" ? o(i) : o);
      };
    }
    if (typeof window.imgDados == "function") {
      const n = window.imgDados;
      window.imgDados = async function (...l) {
        const [o] = await Promise.all([n.apply(this, l), h()]);
        return o;
      };
    }
    (g(
      "grDesenha",
      "Giro do mercado",
      "Resumo jornalístico  ·  números, contexto e fontes",
    ),
      g(
        "jrImagem",
        "Jornal do Pregão",
        "Edição do dia  ·  informação verificada e contextualizada",
      ),
      (window.TraderEditorialV376 = Object.freeze({
        ensure: h,
        isReady: () => r === "loaded",
      })));
  })();
} catch (e) {
  console.error("[v522] falha em editorial-financeiro-v379.js", e);
}
try {
  (() => {
    "use strict";
    if (new URLSearchParams(location.search).get("diagnostico") !== "1") return;
    const u = () => {
      if (document.getElementById("diagnostico-v379")) return;
      const t = document.createElement("aside");
      ((t.id = "diagnostico-v379"),
        t.setAttribute("role", "complementary"),
        t.setAttribute("aria-label", "Diagnóstico de desempenho local"),
        Object.assign(t.style, {
          position: "fixed",
          right: "8px",
          bottom: "10px",
          zIndex: "999999",
          maxWidth: "min(390px,94vw)",
          background: "#1c1d20",
          color: "#f6f6f5",
          border: "1px solid #7a808c",
          padding: "12px",
          borderRadius: "10px",
          font: "12px/1.4 system-ui",
          boxShadow: "0 8px 30px #0008",
        }));
      const m = document.createElement("strong");
      ((m.textContent = "Diagnóstico local · sem envio de dados"), t.append(m));
      const a = document.createElement("pre");
      ((a.style.whiteSpace = "pre-wrap"),
        (a.style.maxHeight = "34vh"),
        (a.style.overflow = "auto"),
        t.append(a));
      function l() {
        const n = performance.getEntriesByType("navigation")[0],
          c = performance
            .getEntriesByType("resource")
            .filter(
              (o) => o.initiatorType === "script" || o.initiatorType === "link",
            );
        return {
          versao: "v386",
          coletadoEm: new Date().toISOString(),
          dispositivo: {
            largura: innerWidth,
            altura: innerHeight,
            pixelRatio: devicePixelRatio,
            online: navigator.onLine,
          },
          navegacao: n
            ? {
                domContentLoadedMs: Math.round(n.domContentLoadedEventEnd),
                loadMs: Math.round(n.loadEventEnd),
                transferBytes: n.transferSize || null,
              }
            : null,
          recursos: {
            scriptsEEstilos: c.length,
            bytesTransferidos: c.reduce((o, s) => o + (s.transferSize || 0), 0),
          },
          serviceWorker: { controlado: !!navigator.serviceWorker?.controller },
        };
      }
      let f = l();
      function g() {
        ((f = l()), (a.textContent = JSON.stringify(f, null, 2)));
      }
      const p = document.createElement("button");
      ((p.textContent = "Atualizar métricas"),
        (p.type = "button"),
        p.addEventListener("click", g),
        t.append(p));
      const i = document.createElement("button");
      ((i.textContent = "Compartilhar / salvar JSON"),
        (i.type = "button"),
        (i.style.marginLeft = "6px"),
        i.addEventListener("click", async () => {
          const n = JSON.stringify(l(), null, 2),
            c = "diagnostico-desempenho-v379.json";
          if (typeof File == "function" && typeof navigator.share == "function")
            try {
              const d = new File([n], c, { type: "application/json" });
              if (
                typeof navigator.canShare == "function" &&
                navigator.canShare({ files: [d] })
              ) {
                await navigator.share({
                  files: [d],
                  title: "Diagnóstico local do Diário de Trader",
                });
                return;
              }
            } catch (d) {
              if (d && d.name === "AbortError") return;
            }
          const o = URL.createObjectURL(
              new Blob([n], { type: "application/json" }),
            ),
            s = document.createElement("a");
          ((s.href = o),
            (s.download = c),
            s.click(),
            setTimeout(() => URL.revokeObjectURL(o), 3e4));
        }),
        t.append(i));
      const e = document.createElement("button");
      ((e.textContent = "Copiar resumo"),
        (e.type = "button"),
        (e.style.marginLeft = "6px"),
        e.addEventListener("click", async () => {
          const n = e.textContent;
          try {
            if (!navigator.clipboard?.writeText)
              throw Error("Clipboard indisponível");
            (await navigator.clipboard.writeText(JSON.stringify(l(), null, 2)),
              (e.textContent = "Copiado"));
          } catch {
            e.textContent = "Não foi possível copiar";
          }
          setTimeout(() => {
            e.textContent = n;
          }, 3500);
        }),
        t.append(e));
      const r = document.createElement("button");
      ((r.textContent = "Fechar"),
        (r.type = "button"),
        (r.style.marginLeft = "6px"),
        r.addEventListener("click", () => t.remove()),
        t.append(r),
        document.body.append(t),
        g());
    };
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", u, { once: !0 })
      : u();
  })();
} catch (e) {
  console.error("[v522] falha em diagnostico-v386.js", e);
}
try {
  (function (P) {
    "use strict";
    const A = Object.freeze({
      "us/airbnb": "assets/logos/us-airbnb.webp",
      "us/amazon": "assets/logos/us-amazon.webp",
      "us/amd": "assets/logos/us-amd.webp",
      "us/apple": "assets/logos/us-apple.webp",
      "us/google":
        "data:image/png;base64,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",
      "us/intel":
        "data:image/png;base64,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",
      "us/mastercard": "assets/logos/us-mastercard.webp",
      "us/meta":
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAOCUlEQVR42u2de5hcRZmH3+/MZLo798EYIFEubnZFowQf2QdZLwsKGpSLkMQYTSAkmZ5J2ACBzQpRyKhoHqIhNwjpngF1uWRxwgJeIlFYXZMAooFlF0HiQ0CUBFjYwZCZc7pn+nz7xwwYAkmqTp9zeoL1/pfMqa46Vb9T9dVXX1WBw+FwOBwOh8PhcDgcDofD4XA4HA6Hw+FwOBwOh8PhcDgcDofD4XA4HA6Hw+FwOBwOh+OgQQZkqebp0FzIBFX+DhhLyND+0voKLwBP1sH/dBdl54Apc14HZ0M+qB7vFWEMIRmgR4SXBJ4OQx4J2uUpJ4B9MHiWjtF6pqlyNsIJQL1BsidF2KhwW1BgE4imWuiZms1m+BzKF4GTgIYDpNiJskGF75fGcA+tEv7VC6Bhjh7reSwCJhk2+r7YpnBNqZPv0CHlpL/2nDBflUuBt0f8le2qLCu9THvi5R2IAhjaoqN7latRzgW8GH96uwgL/YL8exLlzjTrGaJcCxwRV3lD4ZJyQe76qxFALq9TFNYAo5LKQ+HO+pCWrnZ5PpYfnKFDsoO5FmVmQkW+LVPH3D9fL51vXQFM0YZcIysU5qaU4/PAtKAoP6/mR7Jz9V1UuAt4X8LlfdrzOKd7rTz81hPATB2ZHcQdCCel3OH0KlxcKsp1kYzTZj0+VH4EHJpSebsUppaK8uO3jACGtujoSsjPFI6tlc2hsLRU5DKbmUIurx9R+DEwPOXi9ogy3W+T7x/0AhgxVxvLFX5Ry8bf423bgsNpMZl+5Vr0wxpyN/T7INKnV5VJpTb5wcErgAWay3ZxD/APA8bzodwQtNG0v56gIa/vF/ilwEiLX+4EfirCwwo7AUQ5VIUJKKdEHEJ8Cfm43y4PHJQCyDbprQjTGGAIrPKLctE+vvyxGvIA8A7TaRzK14Ms61gtpX0Yv3WZkXxShMuAj9kashJyvN8ufzqoBJDJ64UCK6vtBoEngeeAQcBhwFGx+A2URUGbLNl7qpfJsUngAya/oMKyUokr+K4ExnZFs05W5TpgtEVp7wvG8I+0Su9BIYDBLfqBMOR+IBOxcbaIx2q/hw3cKK+87m+zdFhuEKcScq4KZ1QhBhWY7hfl1lf/mc2zDphqYqmHwhejOm8G5/XwENZbDY3KVUGbXDHwBTBFG7KNbI04Z97pwbzuotxp8nBDk473hJXAJyKWNpCQk/12eSDXrJeossxgNvGyBxP9ovyqymlxNpehQ5XTTXtDTzixuyC/GdACyOZ1MdAaoSSb6oXJu9fKC7YfcibPBQLLOPBizJuKTpT5KqzrH2b2x26BU6pu/D0/lpH8COFUw8Z6xB/D8XEOBbEKIDNbx0kdj0bo+u8OypxtM5a+QXhz9KN43AU0JmTWVFQ4s1SQDbH+6nwdni1xHzDe0J9xUakoq+LKPs5FGLw6llk3vrIlGMI51TQ+QNAum8KQk4D/TchaXhh74wOsll1axyRgt2E5WofP1kMGnAD6vWZnWib7Q30vZ7Nc/DjKUG6X/670dadxL6jc5hdleVIzptL18gTKJYaPN5bquGzACUDhG7ZTPIGpu78jsX6xPQV5RITPAH5MP7k9yJBP2jcRtNGO8B+GvcAFQ+booQNGANkWPSmCg2NJbMbUXvgFuV+Ec/t0WZ0fQoTprJZdKbinNKzwT/2+jwPOJHs94x4jhR4g5F8sUzwedHJVktXpF2Q9at0r7c23/YLcT0qU2+VxlHbDhmtmlg6ruQAa5uh7gImWHpiL0giDCsayGGFjxOTbgjJfJWWkT7QlgyF3RKae82ougDphrtV0UthYKsjPUqnNVgnry8wAdkSwabppoJK2APp9/t8ztAVaaiuABZpTYbplhl9Js0L7jczpgFUErsBxWeFL1IAwZIWh/TI+l9cTaiaA3G7OsHS83BO3K9NoKCjKz1W4JsLU5isNTTo+7fKW2+Vx4BeGj0+vXQ8AX7CqT616dTD6i4b8bYRkGc+jnVb1Ui+wcKPhUDWZKVqXvgBm6TAVPmWR4unSWDbUovFzzTpVhbMiOjg+lNnJBan3Wt3cAXQZPHpYrpETUxdArp6JQNYiyfdqsRNmWF5HqVKV71yUq3ItOjbVgt8kXar8xGwWzhmpC0CFT1s+f0stvv4eYQV2wRdvxvCwworUR4G+xS2TRpyYugBQsyXM/nHq4VJBfp92BWby+pn+fXvVN4YwOdOkn0qz/IOUu01mLwrvH3q+vj01ATTk9RjAuEsU+EHqn35eRwisjfWLFK5lvmbSeoVXivKiwn+ZFK1Sz0dSE4CnfNRyTv2TtNs/C0sxD+w0ZVy2zMKUX+U/jewAiWYIRhsChA9ZPN3pd5Lq3L9/caopkR9XLs+26FGpTV+F+wwN1b9PTQCCeWYCm+mQ9FyqCzRHSBtm7unNqqy3zGGwhixP7X2UBw2N7OP64lyTFsB8zSi8xyLFfal+/V1cCYwz6TW9kIs9ZQGG0Th7iPqzmSY9LY338YvyDPCSQZlG5ubZD3nWAmjweTcWBzmo8OvUrOZmnQBcavhl3dzdLlv9dvmTwNcjGISrmKnZlF7tt0Z2QIVjEhdAndhlMqjeyIqtnilaV6e0ceDIXoAuqWPRa19ZJyuA31kbhA2pGYS/MxT1uMQFoPA3Fo8//8p18lIaNZRrZD7mtsm3/LXy7Gv/6pAyyvwI2V6enaNHJ/1u0rc7ysQQPDJ5G0CsMknF+ZOdrUeqeTf+bODz7b3/M2iTe4AOW91JHatSeMWnDFszeRtAxNwBhLI9nbkSazDdxi0s4iZ500UWqedSzBZg/vKKyumD8/rZhGcCzxo+d1jyQ4BabHMW/ph419+kn8d8XeI3weHcvE+Le438UbCPVQxhJTN0SFLvGArPm1W3/YllUfwAh5gLl0QPchx2gb5NxTjGQAUWHGhF0u/kGuAJy6IckcmxOKn3LMGLhvU9Mg0BGGfiCf+XpAB6eliO6Uqf0OEXZfMBn+uQssKFEQy1ixvmaDKnoBTZhVlI27A0BDDYomv8c1KN3++ImWH4eIBFfF+pKD9VuN3WDeF5rE0mekgU6DYZEdMQQMai2H4irT9fh4tYrPQJy4O18rRlxVxiaxACJ2Z20JzcSHBgEaYhAM+83ulJZNpXYinmJ3U+F/SwxDYPvyjPRNlY4sGShKKHepNozygCMA7r0jD+8wcyzXoqWOzVU778hlNGTMeNLNcA2+xmbIygwnUJCMCkrSppCKBkXBme/Zi0X/I6QpQbMNyIovBQMJbvRs5vtZRU7Q1CFc7KNennYhaAie3lpyEA442SnvC2WLv+vkOn3mmsP48Lqw1ELbXJRhXuiCCC1cPyOiom4Q8yFMCuNATwonElhBwVo8NnEljthbvFXytbYrHBe1lgaIXvyegeuDaWd4fDTXo9MVg2jkMAz5rXXDyHK+fm6DtUKNj0Uh7WO5b3bQvcIH8Avhkh6dRcs06tNn8NzVb5VOwdb/YCsPPvf7jq2m/VevVYB+bDiUBr3NfJBJ18C3jcurqU63Pz9J1V9UCe0bmFEPJU4gJQj8csHj+y2r11mR0sBfOI1/6TtFbHboN3SBmhBftDJxq1l5tp1WpuQznZ6N3FbsYSbd6oPGyp3pmRjb5mnS2wwCJJBY98EidqAgQF+SVqNRS9yscyO6IdVjF8th6icIrhUPFI4gLwh7DVZiooSn5oi1rvzMk06emoXVy/wip/rTxIggRZvgQ8Y92Nw8Jss55rm65cx1zMvK+VIGcffW1vAywXH8HGuh7eE7LGJmK1oVnPEmE9dpdIbSulcfbAatmFMCvCUCAobZlmNd7Hl5mt48DwRDBla5SzjCItXGhot9NHYFKuiZUH3sasksvrQk+5HbvzBnvEYwZF6SYFgoLcKxIpEqhBlPXZZj3fZOYjdfwQ80CXSDuvI7lqB8/SMWE9zwB2+9KVLXgsesMdf1O0LtPIJwQWE+1ugS8HRfkmaTJTs7kGfhX1IgyF21VZXG6T10f8ztOhmQrTRfkaFgEeoTC+XJDHUhFAv2Pmzsh77vsuUHxUhV39USzvwyLQZC/uDcbwyVpsPW/I6zEe/JrqbhX5vQhPhNAjIWMRjsVu2z0oDwZtckJqPQC8djLoJmrLjrp6Pti1Rp6rVQFyzTpNlVtrWgvCjKAgN0dJGjl4wS/K5iqOYIuDkgiTa9n4AH5B1inpnx2wB9sD5baoiauKXgn7giZqce2pIuTTPMRxv0rs5J+pwQ7o/pq4kqL01EQA5YI8hka4G6B6rggK8q8MFDqkEvQyFWFryjnfG7RVN/xUHb8WjOXqNA+AUFgaFOUbDDRulFfqy5wGPJpSji+Ix3nV3pgeT8TODB2SzbIRiWHxZ/98NShKKwOYYXkd1QMbINp+fUO6JOSUOK6TiyeC9SbpCgYxUfpu2UzE94Jy/kBvfOg71iXwOTnCuQOmPeDLhJwW112C8cbstaqX3cHlwJVEu7/nzfit5zEjzQuVY2oqyeSZJ3A1MCSmxn8IZVqpTbbFVcpEro3LzNV308tVIpxTRS/zksDVficr0zhZPDE/QV6P0L7tZl/A1nP6F14UYYmvrK7G4k9NAK+SnaNH43GewpkCEwzEUAG2KNxaqucW1shu3iJkW/QoKsym76N4r0GSHmAzwr8F3dyyrw2tA1oAryOvI7LCBELeRV+M24j+v3Tj8RzCtqDM1qgh3AcTQ1t0dE/IccDRAqPQ/i1dHruBnVTYFpR4KKlGdzgcDofD4XA4HA6Hw+FwOBwOh8PhcDgcDofD4XA4HA6Hw+FwOBwOh8PhcDgcDofD4XAcpPw/lGKoTyttwdAAAAAASUVORK5CYII=",
      "us/microsoft":
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABg0lEQVR42u3cMU7CUBzH8V+bhgVXEg+h8QocChI3cTPB3ev0CkQOoXGFpSHFgZpoHO3Aw89nelPzWr7pK8s/AQAAAAAAAAAALkc12pXuX+dJ5sXc+aFf5/lunyRZbKZp6mVBv1ubp9t2jAs1I25qnlQPxTzCSf2SZD+sr9IXtPccTxGMoPYS/N8EIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAFwJsYbFXvo18P41TJMbj5+rLvtdTF77/qddIG/G29c/GIzzaS+KuoIWFV9kmR1rNNtZ0UdAV+j7s/mG6Cpl0WNXD+d+e/Depa+eivny61+TLLyLwABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAAAhCARyAABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEwKVoRrxWmxzLufPvI9e7fjeMXy1FK10AAAAAAAAAAOC3Tz5VOQcJSSY5AAAAAElFTkSuQmCC",
      "us/netflix": "assets/logos/us-netflix.webp",
      "us/nvidia": "assets/logos/us-nvidia.webp",
      "us/paypal": "assets/logos/us-paypal.webp",
      "us/qualcomm": "assets/logos/us-qualcomm.webp",
      "us/shopify": "assets/logos/us-shopify.webp",
      "us/spotify": "assets/logos/us-spotify.webp",
      "us/tesla": "assets/logos/us-tesla.webp",
      "us/uber": "assets/logos/us-uber.webp",
      "us/visa": "assets/logos/us-visa.webp",
      "fx/ae": "assets/logos/fx-ae.webp",
      "fx/ar": "assets/logos/fx-ar.webp",
      "fx/au": "assets/logos/fx-au.webp",
      "fx/bd": "assets/logos/fx-bd.webp",
      "fx/bg": "assets/logos/fx-bg.webp",
      "fx/bh": "assets/logos/fx-bh.webp",
      "fx/bo": "assets/logos/fx-bo.webp",
      "fx/br": "assets/logos/fx-br.webp",
      "fx/ca": "assets/logos/fx-ca.webp",
      "fx/ch": "assets/logos/fx-ch.webp",
      "fx/cl": "assets/logos/fx-cl.webp",
      "fx/cn": "assets/logos/fx-cn.webp",
      "fx/co": "assets/logos/fx-co.webp",
      "fx/cr": "assets/logos/fx-cr.webp",
      "fx/cz": "assets/logos/fx-cz.webp",
      "fx/dk": "assets/logos/fx-dk.webp",
      "fx/do": "assets/logos/fx-do.webp",
      "fx/eg": "assets/logos/fx-eg.webp",
      "fx/eu": "assets/logos/fx-eu.webp",
      "fx/gb": "assets/logos/fx-gb.webp",
      "fx/ge": "assets/logos/fx-ge.webp",
      "fx/gh": "assets/logos/fx-gh.webp",
      "fx/hk": "assets/logos/fx-hk.webp",
      "fx/hu": "assets/logos/fx-hu.webp",
      "fx/id": "assets/logos/fx-id.webp",
      "fx/il": "assets/logos/fx-il.webp",
      "fx/in": "assets/logos/fx-in.webp",
      "fx/is": "assets/logos/fx-is.webp",
      "fx/jm": "assets/logos/fx-jm.webp",
      "fx/jp": "assets/logos/fx-jp.webp",
      "fx/ke": "assets/logos/fx-ke.webp",
      "fx/kr": "assets/logos/fx-kr.webp",
      "fx/kw": "assets/logos/fx-kw.webp",
      "fx/kz": "assets/logos/fx-kz.webp",
      "fx/ma": "assets/logos/fx-ma.webp",
      "fx/mu": "assets/logos/fx-mu.webp",
      "fx/mx": "assets/logos/fx-mx.webp",
      "fx/my": "assets/logos/fx-my.webp",
      "fx/ng": "assets/logos/fx-ng.webp",
      "fx/no": "assets/logos/fx-no.webp",
      "fx/nz": "assets/logos/fx-nz.webp",
      "fx/om": "assets/logos/fx-om.webp",
      "fx/pe": "assets/logos/fx-pe.webp",
      "fx/ph": "assets/logos/fx-ph.webp",
      "fx/pk": "assets/logos/fx-pk.webp",
      "fx/pl": "assets/logos/fx-pl.webp",
      "fx/py": "assets/logos/fx-py.webp",
      "fx/qa": "assets/logos/fx-qa.webp",
      "fx/ro": "assets/logos/fx-ro.webp",
      "fx/rs": "assets/logos/fx-rs.webp",
      "fx/ru": "assets/logos/fx-ru.webp",
      "fx/sa": "assets/logos/fx-sa.webp",
      "fx/se": "assets/logos/fx-se.webp",
      "fx/sg": "assets/logos/fx-sg.webp",
      "fx/th": "assets/logos/fx-th.webp",
      "fx/tn": "assets/logos/fx-tn.webp",
      "fx/tr": "assets/logos/fx-tr.webp",
      "fx/tw": "assets/logos/fx-tw.webp",
      "fx/ua": "assets/logos/fx-ua.webp",
      "fx/us": "assets/logos/fx-us.webp",
      "fx/uy": "assets/logos/fx-uy.webp",
      "fx/vn": "assets/logos/fx-vn.webp",
      "fx/za": "assets/logos/fx-za.webp",
      "us/salesforce": "assets/logos/us-salesforce.webp",
      "us/cloudflare": "assets/logos/us-cloudflare.webp",
      "us/gitlab": "assets/logos/us-gitlab.webp",
      "us/reddit": "assets/logos/us-reddit.webp",
      "us/pinterest": "assets/logos/us-pinterest.webp",
      "us/snapchat": "assets/logos/us-snapchat.webp",
      "us/ebay": "assets/logos/us-ebay.webp",
      "us/etsy": "assets/logos/us-etsy.webp",
      "crypto/bitcoin": "assets/logos/crypto-bitcoin.webp",
      "crypto/ethereum": "assets/logos/crypto-ethereum.webp",
      "crypto/solana":
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAABG0lEQVR42u3bAQ2CUABFUXE2MZEpzGQKE5kFG7ipgwufcwu4vaMI+2Oa53k+KetsAgAABACAAAAQAAACAEAAAAgAAAEAIAAABACAAAzZZc0Pu99eQ433eF738wswfghg/BDA+CGA8d0FbXr8RQFG+/bv6jnApScEMH4IYPwQwPi/NXlDZsA/YQEAIAAABACAPvfXkaSHr/AXYPwQwPghgPFDAOO7Cxpq/K8AHDGGAC49IYDxQwDjhwDGXydHkm5DAQgAAAEAIADHy1uS8cOdtyTjJ2tvSYbjrwJg/BDA+O6CNj3+ogCOMEMAl54QwPghgPFDAOP/liPJEf+EBQCAAAAQAAACAEAAAAgAAAEAIAAABACAAAAQAABH7w0XqWqz3sk48QAAAABJRU5ErkJggg==",
      "crypto/xrp":
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAACFElEQVR42u2d0VHEMAxEOY0boQEaoH4aoAFKCV/8MAPcEVm7Ut5+30xWepbjJD75dhzH8YRkClIAAAAgAAAAabS6GH1+eb37tx/vb20A3FyXoY8kvDMQKwCZSe8CwwJAReJdQUgBKBLvBkICwCHxLiCC5Gt9lVWAa+LV1RAkX+s3SL7W99YpKDuIe6YGxTUtAWQkIiN4Fx+lAM4GvSNgR09bAJwJtGL14ebP4m1o5bLv61oui4NQjy7VE+h/rrsDWlwx+U4QolPwE32EYvS7vZN/1E9mFcTVk6+GEFcqd0d/UTn6pykj/mD0a30Gydf6DWX5MQ2xM27Wq4gJ00+176UouwnKAnTqdfRfILqO/p9i3BFP6veA70AmANitG/8RG34TRgAAAAIAABAAAIAAAAAEAAAgAAAAAQAACAAAAAACAAAQAACAAAAAVK5FCn7X7q2Jq5thFxhZ8Z3emjh5g25Fs9hVYW66zgwyOmaJfbMK6roMZe9/Th7omij2GxOD6uQzlOV39emn/CbsXgUKf1E9Cqb0js6q/lCUohsEZc+juFK5O/pIA+DShXD39bMXHqkV0AmCS5fH5TQNuHfO3SF6R4ufeeieLn7g5PwA8dP+9mYdnT/cVNyT6Jgl9k3XRLHf8n5BzlNSu865k6pB5YuzJK94lqQDCE5TFYHgPGEBDE7ULgbCmfLIdxmKAAAABAAbfQIJ109cZ2uVFQAAAABJRU5ErkJggg==",
      "crypto/bnb":
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAACdElEQVR42u2dy3HkMAxENX12ME5io3YSDsZ3+eqDa8uS8OkGGvehwPcoihJZmNd5nufhaAsYgQVYgMMCLMBhARbgsAALcFiABSjF18e7BXTDV5aAKSNfVQImwFeWgCnwVSVgEnxFCZgGX00CJsJXkoCp8FUkYDJ8BQmYDp9dAjbAZ5aALfBZJWATfEYJ2AafTQI2wmeSgK3wWa6PzZ1nyKNVwNu/TwoBnXlgc+cZro/NI5DhDqRZhlbDYJn+qF7EqqCwwKcTUAGHCT6lgExIbPDTBTxZX0fDetJe5nsCsuEzSIiAnyUBFSO/U0LkyM+QgGz4nRIypp1oCaiA3yEhc86PlIAq+JUSKh64URJQCb9CQuVqJ0ICquFnSuhYaj6VgA74GRI61/lPfo+upCMlMLxk3W3ndadaSsZ6uOMzAUM/wJB09us+cz/ABGnKuaAr7YNpmpiyH3ClfbAkP2VHLP0ZkJH8lD3hO+2hO/kppyLutoPO5KecC3rye3Qlz7Y92NUPdCTPuDfb1Q9UJx8NP3pNX90PVCafBb9aQmQ/UHUbZ4/8KgnR/UjZlI/8VHxl2smWkPHsSjuWEvGp+A7kLAlZC4eXUvHuK3BZV1pld0An/Iw7YbUAF+sQhK8iwcU6LKAGmot1EMBysQ4CSC7WQQDHxToIoLhYBwEMF+s4XKzDxToOF+toDxfrWHx9F+vwKqgHhot1NEJxsY5GOC7W0QhpXbEOJlise8TUGzJTTmDLCoiAx346QmJTfsoJbFkBd2D6XFCjBBX4cgL+AlcJvqSA/0FWgy8r4DfYivClBfyErgr/OMROR08M/6O2BViAwwL2xjcS4nH+FkI6lQAAAABJRU5ErkJggg==",
      "crypto/dogecoin": "assets/logos/crypto-dogecoin.webp",
      "crypto/cardano":
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAADCElEQVR42u1dSW7DMAy0BX0iv+otb+wtv+oz0lMKNHBskeIytIdAgcZxZFIjkUNtXp/P53OhpEljFRAAAkAhAASAQgAIAIUAEAAKASAAlDjpFZS83R9///98f5ndyx4grPytz9p7CYCi8veuS+4lAJT8GIDgqxF0aNmG77mJT5WydV1yL1K8aNmVLwVhr6WO3osUL0rQUIl7qEA9GYSvDIDUV59Vh9QeIPHrZ9ZhWZZl9ViWUm04INMWcwC2mISH4hEgR9hiCsAejbNSPOIZkc/pV+jyyC6xI1b8+7VXpR0lSrf7418Fj5R5KhqKRO+q2NK8FR9ReKRlW/rw0TIjqGqPbD0W5UYFx6jey6GIZFlR9gdIW/YIs4nuLeEuKJPeZVNUK9vVPWAmS9xTPioPmOkdlhmyCgCt8kguAcWGSwZhD9oLz4KQjEYSFQBZGe/t/vj703yPmCE3K0UiKn/ms0RX6fcpLAgp8GnKRSEEJVZFeLqS7KHqfkWjkTLitcpRBUfJT9RUaGkAZlv+0e+9y4cCQLtpQht8PSvUalgiLBOOWNg6+4wKOqoAkC5s1WTAs4tnLTZ2eNmbNhRBIQDnAEA6FqJJ+2fHWyw2dnjZa9IDIsaBtp4hGYzL0vG0eUBEIlYqD8jOgt97BupQw5H07ArNrqBLDcYhrdVE0aXNGuE9AzXCODJm6Kxsb1YtaHbO9+j7I8YhYSTWus6A0K267+u6Z6ubnUr0JARa25kJX2UoAqH1IuoCuSzFOrhblmdt+1QiZr2w1TqhGikve3Fu9+zKFbLTbBtK7A/4ZPToKmvkhlByXVCF3Y+pAPCogkQaqs0SR6nhaJZqQTUjJvabt2vwUjwz4z1tDLBeuoi4FLJEED46F06aLyDHIR5VkGxL6QObos8MKnFgUyWqyoNbE1kSD25NpKpIdJkTMqShtr6aL3AwpnceL3Dgwa0Oh2x7Hgp+SheE4B4QdGAQJgA28aLqMAh8D/B4gQOSrHynPHsAAaAQAAJAIQAEgEIACACFABAACgG4jPwCQemka5M468kAAAAASUVORK5CYII=",
      "crypto/tether":
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAABTklEQVR42u3d2RGCMBRAUcPQC11ZCZ9WQldWExtQh4GEl4RzCxDJYR+WlHPOD4U1GQIAAAQAgAAAEAAAAgBAAAAIAAABACAAAAQAgAAAUPnmEj+ybOttB/D9fMWuAXce/BLzPxn8WITJ4Mci2Ak7CgIgAAAEAIAAABAAALs6exVwtI6OxxQxUYNfcBN0d4Sz85+uelC7x6unVyxc1QFGuGxdE6IqwJHB/zazZxBL/V4thDli8KP3G/+m/+t/L9ta5X87DwhurrmU/VuaIteOljZBdsIj74QdhjYE0BPElQcJKfqNWS2ARB6VpZZfWVYSp9VLJqmHd8aVPhFrKecBAAAIAAABACAAAAQAgAAAEAAAAgBAAAAIAAABABDW0VtLenh8yhoQXOrtY557btLq6cHB5GuqNkEABACAAAAQAAACAEAAAAgAAAEAIABD9wEqHn8BgC8UcgAAAABJRU5ErkJggg==",
      "commodity/brent": "assets/logos/commodity-brent.webp",
      "commodity/wti": "assets/logos/commodity-wti.webp",
      "commodity/gas": "assets/logos/commodity-gas.webp",
      "commodity/iron": "assets/logos/commodity-iron.webp",
      "commodity/gold": "assets/logos/commodity-gold.webp",
      "commodity/silver": "assets/logos/commodity-silver.webp",
      "commodity/copper": "assets/logos/commodity-copper.webp",
      "commodity/soy": "assets/logos/commodity-soy.webp",
      "commodity/corn": "assets/logos/commodity-corn.webp",
      "commodity/wheat": "assets/logos/commodity-wheat.webp",
      "commodity/coffee": "assets/logos/commodity-coffee.webp",
      "commodity/sugar": "assets/logos/commodity-sugar.webp",
      "commodity/cotton": "assets/logos/commodity-cotton.webp",
      "commodity/cattle": "assets/logos/commodity-cattle.webp",
      "us/broadcom": "assets/logos/us-broadcom.webp",
      "us/berkshire": "assets/logos/us-berkshire.webp",
      "us/jpmorgan": "assets/logos/us-jpmorgan.webp",
      "us/costco": "assets/logos/us-costco.webp",
      "us/exxonmobil": "assets/logos/us-exxonmobil.webp",
      "us/walmart": "assets/logos/us-walmart.webp",
      "us/lilly": "assets/logos/us-lilly.webp",
      "us/palantir": "assets/logos/us-palantir.webp",
    });
    P.DiarioIconPack = Object.freeze({
      url(v) {
        const f = String(v || "")
          .replace(/^\.?\/?logos\//, "")
          .replace(/\.png$/, "");
        return Object.hasOwn(A, f) ? A[f] : null;
      },
      size() {
        return Object.keys(A).length;
      },
    });
  })(window);
} catch (e) {
  console.error("[v522] falha em icon-pack-v425.js", e);
}
try {
  (function (i) {
    "use strict";
    const d = i.document;
    if (!d || i.TraderAssetIdentity) return;
    const E = Object.create(null),
      o = (r, e, a, t, n, c) => {
        for (const s of r.split(" "))
          E[s] = Object.freeze({
            group: e,
            mark: a,
            color: t,
            name: n,
            market: c,
          });
      };
    (o("IBOV IBOVESPA BOVA11", "indice", "▥", "#575b64", "Ibovespa / B3", "BR"),
      o("SMLL SMAL11", "indice", "▥", "#50545d", "Índice Small Caps", "BR"),
      o("SPX SP500 SPY ES1! ES", "indice", "500", "#ba3520", "S&P 500", "US"),
      o("DJI DJI30 DIA", "indice", "30", "#36a16b", "Dow Jones", "US"),
      o(
        "IXIC NDX NASDAQ QQQ NQ1! USTEC NAS100",
        "indice",
        "NQ",
        "#646972",
        "Nasdaq",
        "US",
      ),
      o("NIKKEI NKY", "indice", "225", "#b73d2a", "Nikkei 225", "JP"),
      o("DAX GER40", "indice", "DAX", "#329564", "DAX 40", "DE"),
      o("DXY", "moeda", "$", "#3a3d42", "Índice do dólar", "US"),
      o(
        "USD/BRL USDBRL WDO WDOFUT WDO1! DOLFUT",
        "moeda",
        "$",
        "#ac8439",
        "Dólar",
        "BR",
      ),
      o(
        "EURUSD EUR/USD GBPUSD GBP/USD",
        "moeda",
        "FX",
        "#2e8a5c",
        "Moedas",
        "FX",
      ),
      o(
        "WIN WINFUT WIN1! INDFUT",
        "futuro",
        "WIN",
        "#575c65",
        "Índice futuro",
        "BR",
      ),
      o("EWZ", "etf", "ETF", "#5589b6", "ETF Brasil", "US"),
      o(
        "PETR3 PETR4 PBR PBR.A PBR-A",
        "acao",
        "P",
        "#2e8a5c",
        "Petrobras",
        "BR",
      ),
      o("VALE3 VALE", "acao", "V", "#3d4046", "Vale", "BR"),
      o("ITUB4 ITUB3 ITUB", "acao", "I", "#c69b4c", "Itaú", "BR"),
      o("ITSA3 ITSA4", "acao", "I", "#494c53", "Itaúsa", "BR"),
      o("BBDC3 BBDC4 BBD BBDO", "acao", "B", "#c9432e", "Bradesco", "BR"),
      o("BBAS3 BDORY", "acao", "BB", "#5d626c", "Banco do Brasil", "BR"),
      o("BBSE3 BBSEY", "acao", "BS", "#ac8439", "BB Seguridade", "BR"),
      o("WEGE3 WEGZY", "acao", "W", "#ac8439", "WEG", "BR"),
      o("MGLU3", "acao", "M", "#4678a4", "Magazine Luiza", "BR"),
      o("SUZB3 SUZ", "acao", "S", "#2e8a5c", "Suzano", "BR"),
      o("GGBR3 GGBR4 GGB", "acao", "G", "#686d77", "Gerdau", "BR"),
      o("CSNA3 SID", "acao", "C", "#6a6f7a", "CSN", "BR"),
      o("ABEV3 ABEV", "acao", "A", "#bc3a26", "Ambev", "BR"),
      o(
        "ELET3 ELET6 EBR EBR.B EBR-B",
        "acao",
        "E",
        "#319262",
        "Eletrobras",
        "BR",
      ),
      o("EMBJ3 ERJ", "acao", "E", "#696e78", "Embraer", "BR"),
      o("SANB11 BSBR", "acao", "S", "#df4129", "Santander", "BR"),
      o("SBSP3 SBS", "acao", "S", "#2e8a5c", "Sabesp", "BR"),
      o("BPAC11", "acao", "BT", "#3a3d43", "BTG Pactual", "BR"),
      o("B3SA3", "acao", "B3", "#5f646e", "B3", "BR"),
      o("RAIL3", "acao", "R", "#c59947", "Rumo", "BR"),
      o("RADL3", "acao", "R", "#ac8439", "RaiaDrogasil", "BR"),
      o("RENT3", "acao", "R", "#ac8439", "Localiza", "BR"),
      o("VIVT3 VIV", "acao", "V", "#676c76", "Vivo", "BR"),
      o("TIMS3 TIMB", "acao", "T", "#545860", "TIM", "BR"),
      o("POMO4", "acao", "P", "#5b6069", "Marcopolo", "BR"),
      o(
        "BTC BTCUSD BTCBRL BTC/BRL XBTUSD",
        "cripto",
        "₿",
        "#b78b3a",
        "Bitcoin",
        "CR",
      ),
      o(
        "ETH ETHUSD ETHBRL ETH/BRL",
        "cripto",
        "◆",
        "#6292bc",
        "Ethereum",
        "CR",
      ),
      o("SOL SOLUSD SOLBRL", "cripto", "S", "#999182", "Solana", "CR"),
      o(
        "XRP XRPUSD BNB BNBUSDT DOGE DOGEUSDT ADA ADAUSD USDT USDTBRL USDT/BRL",
        "cripto",
        "◇",
        "#838893",
        "Cripto",
        "CR",
      ),
      o(
        "OURO GOLD XAUUSD XAU/USD GC1!",
        "commodity",
        "Au",
        "#906d2d",
        "Ouro",
        "GL",
      ),
      o(
        "BRENT BRN OIL WTI CL1! PETROLEO",
        "commodity",
        "O",
        "#9c7631",
        "Petróleo",
        "GL",
      ),
      o("PRATA SILVER XAGUSD", "commodity", "Ag", "#828893", "Prata", "GL"),
      o("MINERIO IRONORE SGX", "commodity", "Fe", "#997d48", "Minério", "GL"),
      o(
        "NG FEF DCE I1! BRN1! CL1! NG1! FEF1! HG1! ZS1! ZC1! ZW1! KC1! SB1! CT1! LE1! GOLD SILVER COPPER SOJA MILHO TRIGO CAFE ACUCAR ALGODAO BOI",
        "commodity",
        "Co",
        "#8f6e32",
        "Commodity",
        "GL",
      ),
      o("DIFUT DI1", "futuro", "DI", "#60656e", "Juros futuros", "BR"),
      o(
        "BOVA11 SMAL11 SPY DIA QQQ",
        "etf",
        "ETF",
        "#5388b5",
        "ETF listado",
        "US",
      ),
      o("ES1! ES NQ1!", "futuro", "US", "#676c76", "Futuros EUA", "US"),
      o(
        "WIN WINFUT WIN1! INDFUT WDO WDOFUT WDO1! DOLFUT",
        "futuro",
        "BR",
        "#676c76",
        "Futuros B3",
        "BR",
      ),
      o("PBR PBR.A PBR-A", "adr", "P", "#2e8a5c", "Petrobras ADR", "US"),
      o("VALE", "adr", "V", "#3d4046", "Vale ADR", "US"),
      o("ITUB", "adr", "I", "#c69b4c", "Itaú ADR", "US"),
      o("BBD BBDO", "adr", "B", "#c9432e", "Bradesco ADR", "US"),
      o("BDORY", "adr", "BB", "#5d626c", "Banco do Brasil ADR", "US"),
      o("BBSEY", "adr", "BS", "#ac8439", "BB Seguridade ADR", "US"),
      o("WEGZY", "adr", "W", "#ac8439", "WEG ADR", "US"),
      o("SUZ", "adr", "S", "#ac8439", "Suzano ADR", "US"),
      o("GGB", "adr", "G", "#686d77", "Gerdau ADR", "US"),
      o("SID", "adr", "C", "#6a6f7a", "CSN ADR", "US"),
      o("ABEV", "adr", "A", "#bc3a26", "Ambev ADR", "US"),
      o("ERJ", "adr", "E", "#696e78", "Embraer ADR", "US"),
      o("SBS", "adr", "S", "#ac8439", "Sabesp ADR", "US"),
      o(
        "NIKKEI DAX FTSE HSI CAC40",
        "indice",
        "▥",
        "#ac8439",
        "Índice global",
        "GL",
      ),
      o("AAPL", "acao", "A", "#646973", "Apple", "US"),
      o("MSFT", "acao", "M", "#4b81b0", "Microsoft", "US"),
      o("NVDA", "acao", "N", "#ac8439", "Nvidia", "US"),
      o("GOOG GOOGL", "acao", "G", "#4a7eac", "Alphabet", "US"),
      o("AMZN", "acao", "A", "#987430", "Amazon", "US"),
      o("TSLA", "acao", "T", "#ce4833", "Tesla", "US"),
      o("META", "acao", "M", "#5287b5", "Meta Platforms", "US"),
      o("NFLX", "acao", "N", "#d1351d", "Netflix", "US"),
      o("AMD", "acao", "AMD", "#e24027", "AMD", "US"),
      o("INTC", "acao", "I", "#5c6069", "Intel", "US"),
      o("V", "acao", "V", "#686d77", "Visa", "US"),
      o("UBER", "acao", "UB", "#18191c", "Uber", "US"),
      o("ABNB", "acao", "AB", "#e86d5a", "Airbnb", "US"),
      o("PYPL", "acao", "PY", "#585c65", "PayPal", "US"),
      o("SPOT", "acao", "SP", "#36a16b", "Spotify", "US"),
      o("MA", "acao", "MA", "#d93a22", "Mastercard", "US"),
      o("QCOM", "acao", "QC", "#626770", "Qualcomm", "US"),
      o("SHOP", "acao", "SH", "#38a870", "Shopify", "US"),
      o("AVGO", "acao", "AV", "#b7311c", "Broadcom", "US"),
      o("BRK.B", "acao", "BH", "#3b3e43", "Berkshire Hathaway", "US"),
      o("JPM", "acao", "JPM", "#595d66", "JPMorgan Chase", "US"),
      o("COST", "acao", "CO", "#d2402a", "Costco", "US"),
      o("XOM", "acao", "XM", "#cd4732", "Exxon Mobil", "US"),
      o("WMT", "acao", "W", "#ba8e3b", "Walmart", "US"),
      o("LLY", "acao", "LLY", "#a13625", "Eli Lilly", "US"),
      o("PLTR", "acao", "PL", "#373a3f", "Palantir", "US"),
      o("CRM", "acao", "SF", "#ac8439", "Salesforce", "US"),
      o("NET", "acao", "CF", "#c59a49", "Cloudflare", "US"),
      o("GTLB", "acao", "GL", "#e34a32", "GitLab", "US"),
      o("RDDT", "acao", "R", "#e0381f", "Reddit", "US"),
      o("PINS", "acao", "P", "#be301a", "Pinterest", "US"),
      o("SNAP", "acao", "S", "#c59947", "Snap", "US"),
      o("EBAY", "acao", "E", "#5c6069", "eBay", "US"),
      o("ETSY", "acao", "ET", "#e55640", "Etsy", "US"));
    const k = {
        "NASDAQ FUTURO": "NQ1!",
        "S&P 500 FUTURO": "SPX",
        "DÓLAR (USD/BRL)": "USDBRL",
        "DOLAR (USD/BRL)": "USDBRL",
        "NIKKEI (JAPÃO)": "NIKKEI",
        "DAX (ALEMANHA)": "DAX",
        IBOVESPA: "IBOV",
        BITCOIN: "BTC",
        "BITCOIN (USD)": "BTC",
        "BITCOIN (BRL)": "BTCBRL",
        ETHEREUM: "ETH",
        "PETRÓLEO BRENT": "BRENT",
        "MINÉRIO SGX": "MINERIO",
        "MINÉRIO DALIAN": "MINERIO",
        "MINI ÍNDICE": "WIN",
        "MINI DÓLAR": "WDO",
        OURO: "OURO",
        "S&P FUT.": "SPX",
        "NASDAQ FUT.": "NQ1!",
        DÓLAR: "USDBRL",
        DOLAR: "USDBRL",
        NIKKEI: "NIKKEI",
        DAX: "DAX",
      },
      v = Object.freeze({
        indice: { mark: "▥", color: "#5d626b", name: "Índice" },
        acao: { mark: "A", color: "#636872", name: "Ação" },
        adr: { mark: "AD", color: "#877f6f", name: "ADR" },
        etf: { mark: "ETF", color: "#4a7eac", name: "ETF" },
        moeda: { mark: "FX", color: "#393c41", name: "Câmbio" },
        commodity: { mark: "Co", color: "#9c7631", name: "Commodity" },
        futuro: { mark: "F", color: "#5d626b", name: "Futuro" },
        cripto: { mark: "₿", color: "#b38839", name: "Cripto" },
        outro: { mark: "•", color: "#5b5f68", name: "Ativo" },
      });
    function D(r) {
      const e = String(r ?? "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (!e || e.length > 32 || /\s/.test(e)) return "";
      const a = e.includes(":")
        ? /^[A-Z_]{2,15}:[A-Z0-9][A-Z0-9.\-!/]{0,23}$/.test(e)
          ? e.slice(e.indexOf(":") + 1)
          : ""
        : e;
      return !a ||
        a.length > 24 ||
        !/^[A-Z0-9][A-Z0-9.\-!/]*$/.test(a) ||
        (a.includes("/") && !/^[A-Z]{2,7}\/[A-Z]{2,7}$/.test(a))
        ? ""
        : a;
    }
    const B = Object.freeze({
        USD: "US",
        CAD: "CA",
        AUD: "AU",
        NZD: "NZ",
        EUR: "EU",
        GBP: "GB",
        JPY: "JP",
        CHF: "CH",
        BRL: "BR",
        MXN: "MX",
        CNY: "CN",
        CNH: "CN",
        HKD: "HK",
        SGD: "SG",
        SEK: "SE",
        NOK: "NO",
        DKK: "DK",
        PLN: "PL",
        CZK: "CZ",
        HUF: "HU",
        TRY: "TR",
        ZAR: "ZA",
        INR: "IN",
        KRW: "KR",
        TWD: "TW",
        THB: "TH",
        IDR: "ID",
        MYR: "MY",
        PHP: "PH",
        VND: "VN",
        RUB: "RU",
        UAH: "UA",
        ILS: "IL",
        AED: "AE",
        SAR: "SA",
        QAR: "QA",
        KWD: "KW",
        BHD: "BH",
        OMR: "OM",
        EGP: "EG",
        NGN: "NG",
        KES: "KE",
        GHS: "GH",
        CLP: "CL",
        COP: "CO",
        ARS: "AR",
        PEN: "PE",
        UYU: "UY",
        PYG: "PY",
        BOB: "BO",
        CRC: "CR",
        DOP: "DO",
        JMD: "JM",
        ISK: "IS",
        BGN: "BG",
        RON: "RO",
        RSD: "RS",
        GEL: "GE",
        KZT: "KZ",
        PKR: "PK",
        BDT: "BD",
        MUR: "MU",
        MAD: "MA",
        TND: "TN",
      }),
      q = Object.freeze({
        USD: "Dólar americano",
        CAD: "Dólar canadense",
        AUD: "Dólar australiano",
        NZD: "Dólar neozelandês",
        EUR: "Euro",
        GBP: "Libra esterlina",
        JPY: "Iene japonês",
        CHF: "Franco suíço",
        BRL: "Real brasileiro",
        MXN: "Peso mexicano",
        CNY: "Yuan chinês",
        CNH: "Yuan offshore",
        HKD: "Dólar de Hong Kong",
        SGD: "Dólar de Singapura",
        SEK: "Coroa sueca",
        NOK: "Coroa norueguesa",
        DKK: "Coroa dinamarquesa",
        PLN: "Złoty polonês",
        TRY: "Lira turca",
        ZAR: "Rand sul-africano",
        INR: "Rupia indiana",
        KRW: "Won sul-coreano",
        TWD: "Novo dólar taiwanês",
        THB: "Baht tailandês",
        RUB: "Rublo russo",
        AED: "Dirham dos Emirados Árabes",
      });
    function p(r) {
      const e = D(r);
      if (!e) return null;
      const a = e.match(/^([A-Z]{3})[\/-]?([A-Z]{3})$/);
      if (!a) return null;
      const t = a[1],
        n = a[2];
      return t === n || !Object.hasOwn(B, t) || !Object.hasOwn(B, n)
        ? null
        : Object.freeze({
            base: t,
            quote: n,
            baseCountry: B[t],
            quoteCountry: B[n],
          });
    }
    function L(r, e) {
      const a = D(r);
      if (!a) return null;
      const t = p(a);
      if (t)
        return {
          ticker: a,
          group: "moeda",
          mark: "FX",
          color: "#383b41",
          market: "FX",
          name: (q[t.base] || t.base) + " / " + (q[t.quote] || t.quote),
          pair: t,
        };
      if (E[a]) {
        const u = E[a];
        return {
          ticker: a,
          ...u,
          ...(e === "adr" ? { group: "adr", market: "US" } : {}),
        };
      }
      const n = String(e || "").toLowerCase(),
        c =
          n === "adr"
            ? "adr"
            : n === "etf"
              ? "etf"
              : /^[A-Z]{4,6}[0-9]{1,2}$/.test(a)
                ? "acao"
                : /^(?:[A-Z]{2,6})?(?:1!)$/.test(a)
                  ? "futuro"
                  : /^(?:BTC|ETH|SOL|XRP)/.test(a)
                    ? "cripto"
                    : /^(?:USD|EUR|GBP|JPY)/.test(a)
                      ? "moeda"
                      : n === "fut"
                        ? "futuro"
                        : n === "cmd"
                          ? "commodity"
                          : n === "ind"
                            ? "indice"
                            : n === "cripto"
                              ? "cripto"
                              : n === "moeda"
                                ? "moeda"
                                : "outro",
        s = v[c];
      return {
        ticker: a,
        group: c,
        mark: a.length <= 3 ? a : a.slice(0, 2),
        color: s.color,
        name: a,
        market: "",
      };
    }
    const j = Object.freeze({
        PBR: "PETR3",
        "PBR.A": "PETR4",
        "PBR-A": "PETR4",
        VALE: "VALE3",
        ITUB: "ITUB4",
        BBD: "BBDC4",
        BBDO: "BBDC4",
        BDORY: "BBAS3",
        BBSEY: "BBSE3",
        WEGZY: "WEGE3",
        SUZ: "SUZB3",
        GGB: "GGBR4",
        SID: "CSNA3",
        ABEV: "ABEV3",
        ERJ: "EMBJ3",
        SBS: "SBSP3",
        BSBR: "SANB11",
        VIV: "VIVT3",
        TIMB: "TIMS3",
        EBR: "ELET3",
        "EBR.B": "ELET6",
        "EBR-B": "ELET6",
      }),
      J = Object.freeze(
        new Set([
          "PETR3",
          "PETR4",
          "VALE3",
          "ITUB4",
          "ITUB3",
          "ITSA3",
          "ITSA4",
          "BBDC3",
          "BBDC4",
          "BBAS3",
          "BBSE3",
          "WEGE3",
          "MGLU3",
          "SUZB3",
          "GGBR3",
          "GGBR4",
          "CSNA3",
          "ABEV3",
          "ELET3",
          "ELET6",
          "EMBJ3",
          "SANB11",
          "SBSP3",
          "BPAC11",
          "B3SA3",
          "RAIL3",
          "RADL3",
          "RENT3",
          "VIVT3",
          "TIMS3",
          "POMO4",
          "BOVA11",
          "SMAL11",
        ]),
      ),
      U = Object.freeze({
        AAPL: "apple",
        MSFT: "microsoft",
        NVDA: "nvidia",
        GOOG: "google",
        GOOGL: "google",
        AMZN: "amazon",
        TSLA: "tesla",
        META: "meta",
        NFLX: "netflix",
        AMD: "amd",
        INTC: "intel",
        V: "visa",
        UBER: "uber",
        ABNB: "airbnb",
        PYPL: "paypal",
        SPOT: "spotify",
        MA: "mastercard",
        QCOM: "qualcomm",
        SHOP: "shopify",
        AVGO: "broadcom",
        "BRK.B": "berkshire",
        JPM: "jpmorgan",
        COST: "costco",
        XOM: "exxonmobil",
        WMT: "walmart",
        LLY: "lilly",
        PLTR: "palantir",
        CRM: "salesforce",
        NET: "cloudflare",
        GTLB: "gitlab",
        RDDT: "reddit",
        PINS: "pinterest",
        SNAP: "snapchat",
        EBAY: "ebay",
        ETSY: "etsy",
      }),
      I = Object.freeze({
        BTC: "bitcoin",
        BTCUSD: "bitcoin",
        BTCBRL: "bitcoin",
        "BTC/BRL": "bitcoin",
        ETH: "ethereum",
        ETHUSD: "ethereum",
        SOL: "solana",
        SOLUSD: "solana",
        XRP: "xrp",
        XRPUSD: "xrp",
        BNB: "bnb",
        BNBUSDT: "bnb",
        DOGE: "dogecoin",
        DOGEUSDT: "dogecoin",
        ADA: "cardano",
        ADAUSD: "cardano",
        USDT: "tether",
        USDTBRL: "tether",
        "USDT/BRL": "tether",
      }),
      C = Object.freeze({
        BRENT: "brent",
        "BRN1!": "brent",
        WTI: "wti",
        "CL1!": "wti",
        NG: "gas",
        "NG1!": "gas",
        FEF: "iron",
        "FEF1!": "iron",
        DCE: "iron",
        "I1!": "iron",
        MINERIO: "iron",
        OURO: "gold",
        GOLD: "gold",
        PRATA: "silver",
        SILVER: "silver",
        COBRE: "copper",
        "HG1!": "copper",
        SOJA: "soy",
        "ZS1!": "soy",
        MILHO: "corn",
        "ZC1!": "corn",
        TRIGO: "wheat",
        "ZW1!": "wheat",
        CAFÉ: "coffee",
        CAFE: "coffee",
        "KC1!": "coffee",
        AÇÚCAR: "sugar",
        ACUCAR: "sugar",
        "SB1!": "sugar",
        ALGODÃO: "cotton",
        ALGODAO: "cotton",
        "CT1!": "cotton",
        BOI: "cattle",
        "LE1!": "cattle",
      }),
      b = (r) => i.DiarioIconPack?.url?.(r) || r,
      g = Object.create(null),
      N = Object.create(null);
    function T(r) {
      const e = B[r];
      if (!e || typeof i.Image != "function") return null;
      if (!g[e]) {
        const t = new i.Image();
        ((g[e] = t),
          (N[e] = new Promise((n) => {
            ((t.onload = () => n(t.naturalWidth > 0 ? t : null)),
              (t.onerror = () => n(null)));
          })),
          (t.src = b("logos/fx/" + e.toLowerCase() + ".png")));
      }
      const a = g[e];
      return a.complete && a.naturalWidth > 0 ? a : null;
    }
    const h = Object.create(null),
      F = Object.create(null);
    function W(r) {
      const e = D(r);
      return Object.hasOwn(U, e)
        ? "us/" + U[e]
        : Object.hasOwn(I, e)
          ? "crypto/" + I[e]
          : Object.hasOwn(C, e)
            ? "commodity/" + C[e]
            : null;
    }
    function V(r) {
      const e = W(r);
      if (!e || typeof i.Image != "function") return null;
      if (!h[e]) {
        const t = new i.Image();
        ((h[e] = t),
          (F[e] = new Promise((n) => {
            ((t.onload = () => n(t.naturalWidth > 0 ? t : null)),
              (t.onerror = () => n(null)));
          })),
          (t.src = b("logos/" + e + ".png")));
      }
      const a = h[e];
      return a.complete && a.naturalWidth > 0 ? a : null;
    }
    function Z(r, e = 2200) {
      return typeof i.setTimeout != "function"
        ? Promise.resolve(r)
        : new Promise((a) => {
            let t = !1;
            const n = (s) => {
                t ||
                  ((t = !0),
                  typeof i.clearTimeout == "function" && i.clearTimeout(c),
                  a(s));
              },
              c = i.setTimeout(() => n(!1), e);
            Promise.resolve(r).then(n, () => n(!1));
          });
    }
    async function y(r) {
      const e = Array.isArray(r) ? r : Object.keys(U);
      for (const t of e) {
        V(t);
        const n = p(t);
        n && (T(n.base), T(n.quote));
      }
      const a = e.map((t) => F[W(t)]).filter(Boolean);
      for (const t of e) {
        const n = p(t);
        if (n)
          for (const c of [n.base, n.quote]) {
            const s = N[B[c]];
            s && a.push(s);
          }
      }
      return Z(Promise.allSettled(a));
    }
    async function Q(r) {
      if (!r?.querySelectorAll) return;
      const e = Array.from(
          r.querySelectorAll('.ta-avatar[data-logo-local="1"] .ta-logo'),
        ),
        a = Array.from(r.querySelectorAll(".ta-avatar.ta-pair .ta-fx-img"));
      return Z(
        (async () => {
          const t = e
              .map((c) => c.parentElement?.dataset?.ticker)
              .filter(Boolean),
            n = a.map((c) => c.dataset?.currency).filter(Boolean);
          for (const c of n) T(c);
          (await y(t),
            await Promise.allSettled(n.map((c) => N[B[c]]).filter(Boolean)),
            await Promise.allSettled(
              [...e, ...a].map((c) =>
                c.complete
                  ? Promise.resolve()
                  : new Promise((s) => {
                      (c.addEventListener("load", s, { once: !0 }),
                        c.addEventListener("error", s, { once: !0 }));
                    }),
              ),
            ));
        })(),
      );
    }
    function H(r, e) {
      const a = D(r);
      if (!a) return null;
      const t = L(a, e);
      if (!t) return null;
      let n = j[a] || a;
      return t.group === "cripto" && Object.hasOwn(I, a)
        ? Object.freeze({
            ticker: a,
            issuer: a,
            provider: "icone-local-cripto",
            local: !0,
            url: b("logos/crypto/" + I[a] + ".png"),
          })
        : t.group === "commodity" && Object.hasOwn(C, a)
          ? Object.freeze({
              ticker: a,
              issuer: a,
              provider: "icone-tematico-local",
              local: !0,
              url: b("logos/commodity/" + C[a] + ".png"),
            })
          : t.group === "acao" && t.market === "US" && Object.hasOwn(U, a)
            ? Object.freeze({
                ticker: a,
                issuer: a,
                provider: "pacote-local",
                local: !0,
                url: b("logos/us/" + U[a] + ".png"),
              })
            : !J.has(n) ||
                (t.group !== "acao" && t.group !== "adr" && t.group !== "etf")
              ? null
              : Object.freeze({
                  ticker: a,
                  issuer: n,
                  provider: "brapi.dev",
                  url: "https://icons.brapi.dev/icons/" + n + ".svg",
                });
    }
    function f(r, e = {}) {
      const a = L(r, e.group);
      if (!a) return null;
      const t = d.createElement("span");
      ((t.className = "ta-avatar" + (e.small ? " ta-small" : "")),
        (t.dataset.group = a.group),
        (t.dataset.market = a.market),
        (t.dataset.ticker = a.ticker),
        t.style.setProperty("--ta-accent", a.color),
        (t.title =
          a.name + " · " + a.ticker + " · " + (v[a.group]?.name || "Ativo")),
        t.setAttribute("aria-hidden", "true"));
      const n = d.createElement("span");
      if (
        ((n.className = "ta-mark"),
        (n.textContent = a.mark),
        t.append(n),
        a.pair)
      ) {
        (t.classList.add("ta-pair"),
          (t.dataset.pairBase = a.pair.base),
          (t.dataset.pairQuote = a.pair.quote));
        for (const [c, s] of [
          [a.pair.base, "base"],
          [a.pair.quote, "quote"],
        ]) {
          const u = d.createElement("span");
          u.className = "ta-fx-half ta-fx-" + s;
          const S = d.createElement("span");
          if (
            ((S.className = "ta-fx-code"),
            (S.textContent = c),
            u.append(S),
            e.real !== !1)
          ) {
            const l = d.createElement("img");
            ((l.className = "ta-fx-img"),
              (l.alt = ""),
              (l.loading = "lazy"),
              (l.decoding = "async"),
              (l.referrerPolicy = "no-referrer"),
              (l.dataset.currency = c),
              (l.onload = () => {
                l.naturalWidth > 0 && u.classList.add("ta-has-flag");
              }),
              (l.onerror = () => {
                (l.remove?.(), u.classList.remove?.("ta-has-flag"));
              }),
              (l.src = b("logos/fx/" + B[c].toLowerCase() + ".png")),
              u.append(l));
          }
          t.append(u);
        }
        return ((t.dataset.logoLocal = "1"), t);
      }
      if (e.real !== !1) {
        const c = H(a.ticker, e.group);
        if (c) {
          const s = d.createElement("img");
          ((s.className = "ta-logo"),
            (s.alt = ""),
            (s.loading = c.local ? "eager" : "lazy"),
            (s.decoding = "async"),
            (s.referrerPolicy = "no-referrer"),
            c.local && (t.dataset.logoLocal = "1"),
            (s.onload = () => {
              s.naturalWidth > 0 && t.classList.add("ta-has-logo");
            }),
            (s.onerror = () => {
              (s.remove?.(), t.classList.remove?.("ta-has-logo"));
            }),
            (s.src = c.url),
            t.append(s),
            (t.dataset.logoProvider = c.provider));
        }
      }
      return t;
    }
    function A(r) {
      const e = String(r || "")
        .trim()
        .toUpperCase()
        .match(/^([A-Z]{3}[\/-]?[A-Z]{3})(?=\s|$)/);
      if (e && p(e[1])) return e[1];
      const a = String(r || "")
        .trim()
        .toUpperCase()
        .match(
          /^([A-Z]{2,7}[0-9]{1,2}|[A-Z]{2,6}(?:\.[A-Z]|\-A)?|BTCBRL|USDBRL|NQ1!)(?=\s|$)/,
        );
      if (!a) return null;
      const t = a[1];
      return E[t] || /^[A-Z]{4,6}[0-9]{1,2}$/.test(t) ? t : null;
    }
    function z(r) {
      r.querySelectorAll(
        ".adr-quote[data-adr-symbol]:not([data-ta-done])",
      ).forEach((e) => {
        const a = e.dataset.adrSymbol,
          t = e.querySelector(".adr-quote-heading > div:first-child");
        if (!t) return;
        const n = f(a, { group: a === "EWZ" ? "etf" : "adr" });
        if (!n) return;
        const c = d.createElement("span");
        for (c.className = "ta-copy"; t.firstChild; ) c.append(t.firstChild);
        (t.append(n, c), t.classList.add("ta-brand"), (e.dataset.taDone = "1"));
      });
    }
    function $(r) {
      (r.querySelectorAll(".cqr:not([data-ta-done])").forEach((e) => {
        const a = e.querySelector("[data-cqfav]"),
          t =
            a?.dataset.cqfav ||
            e.querySelector(".cqn>b")?.textContent ||
            e.dataset.cqSymbol,
          n = e.querySelector(".cqi");
        if (!n || !t) return;
        const c = f(t);
        c &&
          (c.classList.add("cqi"), n.replaceWith(c), (e.dataset.taDone = "1"));
      }),
        r.querySelectorAll(".cqmap .cqt:not([data-ta-done])").forEach((e) => {
          const t = e.querySelector("b")?.textContent?.trim(),
            n = f(t, { small: !0 });
          n && (e.prepend(n), (e.dataset.taDone = "1"));
        }));
    }
    function x(r) {
      r.querySelectorAll(".adr-ab-tab tbody tr:not([data-ta-done])").forEach(
        (e) => {
          const a = e.querySelector("td:first-child > b");
          if (!a) return;
          const t =
              (a.textContent || "").trim() === "Ibovespa"
                ? "IBOV"
                : A(a.textContent),
            n = f(t, { small: !0 });
          n &&
            (a.before(n),
            (e.dataset.taDone = "1"),
            e.classList.add("ta-open-row"));
        },
      );
    }
    function _(r) {
      (r
        .querySelectorAll(".card > .top > b:first-child:not([data-ta-done])")
        .forEach((e) => {
          const a = A(e.firstChild?.textContent || e.textContent);
          if (!a) return;
          const t = f(a, { small: !0 });
          t &&
            (e.prepend(t),
            e.classList.add("ta-title"),
            (e.dataset.taDone = "1"));
        }),
        r.querySelectorAll(".pft tbody tr:not([data-ta-done])").forEach((e) => {
          const a = [...e.querySelectorAll("td")].find((c) => {
            const s = c.querySelector(":scope > b");
            return s && !!A(s.textContent);
          });
          if (!a) return;
          const t = a.querySelector(":scope > b"),
            n = f(A(t.textContent), { small: !0 });
          n &&
            (a.prepend(n),
            a.classList.add("ta-cell"),
            (e.dataset.taDone = "1"));
        }));
    }
    function ee(r) {
      r.querySelectorAll(
        '.card.row[data-a="edit"]:not([data-ta-done])',
      ).forEach((e) => {
        const a = e.querySelector(".fl > b"),
          t = A(a?.textContent);
        if (!t) return;
        const n = e.querySelector(".th");
        if (!n || n.querySelector("img")) return;
        const c = f(t);
        c && ((n.textContent = ""), n.append(c), (e.dataset.taDone = "1"));
      });
    }
    function ae(r) {
      r.querySelectorAll(".radar-quote:not([data-ta-done])").forEach((e) => {
        const a = e.querySelector(":scope > span");
        if (!a) return;
        const t = String(a.textContent || "")
            .trim()
            .toUpperCase(),
          n = k[t] || A(t) || null;
        if (!n) return;
        const c = f(n, { small: !0 });
        c &&
          (a.prepend(c),
          a.classList.add("ta-quote-title"),
          (e.dataset.taDone = "1"));
      });
    }
    function te(r) {
      r.querySelectorAll(".pfrh h3:not([data-ta-done])").forEach((e) => {
        const a = String(e.textContent || "").match(
          /relat[oó]rio\s+individual\s*[·:-]\s*([A-Z][A-Z0-9.\-]{2,14})/i,
        );
        if (!a) return;
        const t = f(a[1], { small: !0 });
        t &&
          (e.prepend(t),
          e.classList.add("ta-report-title"),
          (e.dataset.taDone = "1"));
      });
    }
    function re(r) {
      r.querySelectorAll(
        ".jrart .jrtit:not([data-ta-done]),#grbox h2:not([data-ta-done]),#grbox h3:not([data-ta-done])",
      ).forEach((e) => {
        const t = (
          String(e.textContent || "")
            .toUpperCase()
            .match(/[A-Z]{2,7}[0-9]{0,2}|BTCBRL|USDBRL/g) || []
        ).find((c) => Object.hasOwn(E, c));
        if (!t) return;
        const n = f(t, { small: !0 });
        n &&
          (e.prepend(n),
          e.classList.add("ta-editorial-title"),
          (e.dataset.taDone = "1"));
      });
    }
    function oe(r) {
      r?.querySelectorAll &&
        (r.querySelectorAll(".ta-avatar .ta-logo").forEach((e) => {
          if (e.dataset.taHydrated === "1") return;
          e.dataset.taHydrated = "1";
          const a = e.closest(".ta-avatar");
          if (!a) return;
          const t = () => {
              e.naturalWidth > 0 &&
                (a.classList.add("ta-has-logo"), (e.hidden = !1));
            },
            n = () => {
              (a.classList.remove("ta-has-logo"), (e.hidden = !0));
            };
          (e.addEventListener("load", t, { once: !0 }),
            e.addEventListener("error", n, { once: !0 }),
            e.complete && (e.naturalWidth > 0 ? t() : n()));
        }),
        r.querySelectorAll(".ta-avatar.ta-pair .ta-fx-img").forEach((e) => {
          if (e.dataset.taHydrated === "1") return;
          e.dataset.taHydrated = "1";
          const a = e.closest(".ta-fx-half");
          if (!a) return;
          const t = () => {
              e.naturalWidth > 0 &&
                (a.classList.add("ta-has-flag"), (e.hidden = !1));
            },
            n = () => {
              (a.classList.remove("ta-has-flag"), (e.hidden = !0));
            };
          (e.addEventListener("load", t, { once: !0 }),
            e.addEventListener("error", n, { once: !0 }),
            e.complete && (e.naturalWidth > 0 ? t() : n()));
        }));
    }
    function P(r) {
      r?.querySelectorAll &&
        (z(r), $(r), x(r), _(r), ee(r), ae(r), te(r), re(r), oe(r));
    }
    let G = !1;
    function O() {
      G ||
        ((G = !0),
        (i.requestAnimationFrame || i.setTimeout)(() => {
          ((G = !1), P(d.getElementById("app")), P(d.getElementById("sh")));
          const r = d.getElementById("research-workbench");
          r && P(r);
        }, 0));
    }
    function ne(r, e, a, t, n = 34) {
      const c = L(e);
      if (!c || !r || !Number.isFinite(a + t + n) || n < 8) return !1;
      r.save();
      const s = n / 2,
        u = a + s,
        S = t + s;
      if (c.pair) {
        const R = T(c.pair.base),
          Y = T(c.pair.quote);
        if (
          R &&
          Y &&
          typeof r.drawImage == "function" &&
          typeof r.clip == "function"
        ) {
          const m = n * 0.7,
            w = t + (n - m) / 2;
          for (const [se, X] of [
            [R, a],
            [Y, a + n - m],
          ])
            (r.save(),
              r.beginPath(),
              r.arc(X + m / 2, w + m / 2, m / 2, 0, Math.PI * 2),
              r.clip(),
              r.drawImage(se, X, w, m, m),
              r.restore());
          return (r.restore(), !0);
        }
      }
      const l = V(c.ticker);
      if (l && typeof r.drawImage == "function") {
        ((r.fillStyle = "#fff"),
          r.beginPath(),
          r.arc(u, S, s, 0, Math.PI * 2),
          r.fill(),
          r.save(),
          r.beginPath(),
          r.arc(u, S, s - 1, 0, Math.PI * 2),
          r.clip());
        const R = n * 0.12;
        return (
          r.drawImage(l, a + R, t + R, n - R * 2, n - R * 2),
          r.restore(),
          r.restore(),
          !0
        );
      }
      ((r.fillStyle = c.color),
        r.beginPath(),
        r.arc(u, S, s, 0, Math.PI * 2),
        r.fill(),
        (r.strokeStyle = "rgba(255,255,255,0.35)"),
        (r.lineWidth = Math.max(0.8, n * 0.035)),
        r.stroke(),
        (r.fillStyle = "#fff"),
        (r.textAlign = "center"),
        (r.textBaseline = "middle"));
      const M = c.mark;
      return (
        (r.font = `800 ${Math.round(n * (M.length > 2 ? 0.27 : M.length > 1 ? 0.38 : 0.55))}px system-ui,Arial,sans-serif`),
        r.fillText(M, u, S + n * 0.01, n * 0.84),
        r.restore(),
        !0
      );
    }
    const ce = Object.freeze({
      resolve: L,
      normalize: D,
      fromLabel: (r) => {
        const e = String(r || "")
          .trim()
          .toUpperCase();
        return k[e] || A(e) || D(e);
      },
      currencyPair: p,
      avatar: f,
      decorate: P,
      draw: ne,
      logoInfo: H,
      preload: y,
      readyForExport: Q,
      known: () => Object.keys(E).length,
    });
    if (((i.TraderAssetIdentity = ce), typeof i.Image == "function")) {
      const r = () =>
        y([
          ...Object.keys(U),
          "USDCAD",
          "AUDCAD",
          "AUDUSD",
          "EURUSD",
          "GBPUSD",
          "USDJPY",
          "USDCHF",
          "USDBRL",
          "EURGBP",
        ]).catch(() => {});
      typeof i.requestIdleCallback == "function"
        ? i.requestIdleCallback(r, { timeout: 2500 })
        : typeof i.setTimeout == "function" && i.setTimeout(r, 750);
    }
    (i.TraderUI?.onRender &&
      (i.TraderUI.onRender("identidade-ativos-v390", O),
      i.TraderUI.onSheet("identidade-ativos-v390", O)),
      d.readyState === "loading"
        ? d.addEventListener("DOMContentLoaded", O, { once: !0 })
        : O());
    const K = d.getElementById("app");
    i.MutationObserver &&
      K &&
      new i.MutationObserver((e) => {
        e.some((a) => a.addedNodes.length || a.removedNodes.length) && O();
      }).observe(K, { childList: !0, subtree: !0 });
  })(window);
} catch (e) {
  console.error("[v522] falha em identidade-ativos-v390.js", e);
}
try {
  (function (l) {
    "use strict";
    const c = l.document;
    if (!c || l.__diarioMercado388) return;
    l.__diarioMercado388 = !0;
    let o = "",
      m = !1,
      y = null;
    const h = (e) =>
      String(e || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .trim();
    function g(e) {
      return Array.from(e.querySelectorAll(".cql > .cqr"));
    }
    function b(e) {
      if (!e) return;
      const t = g(e),
        u = h(o),
        s = u.split(/\s+/).filter(Boolean);
      let d = 0;
      t.forEach((r) => {
        const f = r.querySelector(".cqn"),
          q = h(
            (f?.querySelector("b")?.textContent || "") +
              " " +
              (f?.querySelector("small")?.textContent || ""),
          ),
          S = s.every((C) => q.includes(C));
        ((r.hidden = !S), S && d++);
      });
      const a = e.querySelector("[data-cq388-count]");
      if (a) {
        const r = t.length ? `${d} de ${t.length} ativos` : "Aguardando dados";
        a.textContent !== r && (a.textContent = r);
      }
      const i = e.querySelector("[data-cq388-empty]");
      i && (i.hidden = !t.length || !!d);
      const n = e.querySelector("[data-cq388-clear]");
      n && (n.hidden = !o);
    }
    function E(e) {
      if (!e || e.classList.contains("market-quotes")) return;
      const t = e.querySelector(":scope > .cqtabs");
      if (!t) return;
      const u = t.querySelector("button.on");
      if ((u && u.setAttribute("aria-current", "page"), e.id !== "cotbox"))
        return;
      let s = e.querySelector(":scope > .cq388-searchbar");
      if (!s) {
        ((s = c.createElement("div")), (s.className = "cq388-searchbar"));
        const a = c.createElement("label");
        a.className = "cq388-searchbox";
        const i = c.createElement("span");
        ((i.textContent = "⌕"), i.setAttribute("aria-hidden", "true"));
        const n = c.createElement("input");
        ((n.type = "search"),
          (n.autocomplete = "off"),
          (n.spellcheck = !1),
          (n.placeholder = "Buscar ticker ou empresa"),
          n.setAttribute("aria-label", "Buscar ativo nesta lista"),
          n.setAttribute("data-cq388-search", ""),
          (n.value = o));
        const r = c.createElement("button");
        ((r.type = "button"),
          (r.className = "cq388-clear"),
          r.setAttribute("data-cq388-clear", ""),
          r.setAttribute("aria-label", "Limpar busca"),
          (r.textContent = "×"),
          (r.hidden = !o),
          a.append(i, n, r));
        const f = c.createElement("span");
        ((f.className = "cq388-count"),
          f.setAttribute("data-cq388-count", ""),
          f.setAttribute("aria-live", "polite"),
          s.append(a, f));
        const q = e.querySelector(":scope > .cqbar");
        q ? q.before(s) : t.after(s);
      }
      const d = s.querySelector("[data-cq388-search]");
      if (
        (d && d !== c.activeElement && d.value !== o && (d.value = o),
        !e.querySelector("[data-cq388-empty]"))
      ) {
        const a = c.createElement("p");
        ((a.className = "cq388-empty"),
          a.setAttribute("data-cq388-empty", ""),
          (a.textContent = "Nenhum ativo encontrado nesta lista."),
          (a.hidden = !0));
        const i = e.querySelector(".cql");
        i ? i.after(a) : s.after(a);
      }
      b(e);
    }
    function A() {
      m = !1;
      const e = c.getElementById("app");
      if (!e) return;
      const t = e.querySelector("#cotbox, #cqbox");
      t && E(t);
    }
    function p() {
      m || ((m = !0), (l.requestAnimationFrame || l.setTimeout).call(l, A, 0));
    }
    (c.addEventListener("input", (e) => {
      const t = e.target;
      !t ||
        !t.matches?.("[data-cq388-search]") ||
        ((o = t.value || ""), b(t.closest("#cotbox")));
    }),
      c.addEventListener("click", (e) => {
        if (e.target?.closest?.("[data-cq388-clear]")) {
          (e.preventDefault(), (o = ""));
          const t = c.getElementById("cotbox"),
            u = t?.querySelector("[data-cq388-search]");
          (u && ((u.value = ""), u.focus()), b(t));
          return;
        }
        e.target?.closest?.("[data-cqa]") && ((o = ""), p());
      }));
    function v() {
      const e = c.getElementById("app");
      e &&
        (!y &&
          typeof l.MutationObserver == "function" &&
          ((y = new l.MutationObserver(p)),
          y.observe(e, { childList: !0, subtree: !0 })),
        p());
    }
    try {
      l.TraderUI?.onRender?.("mercado-visual-v388", p);
    } catch {}
    c.readyState === "loading"
      ? c.addEventListener("DOMContentLoaded", v, { once: !0 })
      : v();
  })(window);
} catch (e) {
  console.error("[v522] falha em mercado-visual-v388.js", e);
}
try {
  (function () {
    "use strict";
    if (!window.document || !document.body) return;
    const n = window.visualViewport,
      s = () => {
        const t = document.activeElement;
        return (
          !!t &&
          !!t.matches &&
          t.matches('input,textarea,[contenteditable="true"]')
        );
      };
    function e() {
      const t = !!n && s() && n.height < window.innerHeight * 0.78;
      document.body.classList.toggle("dt384-keyboard-open", t);
    }
    (document.addEventListener("focusin", e, { passive: !0 }),
      document.addEventListener("focusout", e, { passive: !0 }),
      window.addEventListener("resize", e, { passive: !0 }),
      n?.addEventListener("resize", e, { passive: !0 }),
      n?.addEventListener("scroll", e, { passive: !0 }),
      e());
  })();
} catch (e) {
  console.error("[v522] falha em terminal-mobile-v385.js", e);
}
try {
  (function () {
    "use strict";
    const r = document,
      Lt = "dt395-layout",
      G = {
        home: '<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/>',
        calendar:
          '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
        trade: '<path d="M4 7h16m-5-4 5 4-5 4M20 17H4m5-4-5 4 5 4"/>',
        chart: '<path d="M4 20V12m6 8V5m6 15v-9m5 9V3"/>',
        book: '<path d="M12 6c-3-2-6-2-10-2v16c4 0 7 0 10 2m0-16c3-2 6-2 10-2v16c-4 0-7 0-10 2z"/>',
        monitor:
          '<rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
        search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
        bell: '<path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10M10 21h4"/>',
        briefcase: '<path d="M3 7h18v13H3zM8 7V4h8v3M3 12h18"/>',
        shield:
          '<path d="m12 2 9 4v6c0 6-4 9-9 10-5-1-9-4-9-10V6z"/><path d="m8 12 3 3 5-6"/>',
        target:
          '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
        layers: '<path d="m12 3 9 5-9 5-9-5zm-9 9 9 5 9-5m-18 5 9 5 9-5"/>',
        newspaper:
          '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7h9M8 11h9M8 15h5M5 7h1M5 11h1M5 15h1"/>',
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
        edit: '<path d="m4 17 11-11 4 4L8 21H4zm9-9 4 4"/>',
        spark:
          '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
        plus: '<path d="M12 4v16M4 12h16"/>',
        right: '<path d="m9 5 7 7-7 7"/>',
        globe:
          '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c6 5 6 13 0 18-6-5-6-13 0-18"/>',
        check: '<path d="m4 12 5 5L20 6"/>',
        eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
        bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
        settings:
          '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
        graduation:
          '<path d="m2 10 10-5 10 5-10 5zm4 3v5c4 3 8 3 12 0v-5m4-3v8"/>',
        arrowup: '<path d="m4 17 6-6 4 4 6-8M15 7h5v5"/>',
        alert: '<path d="m12 2 10 18H2zm0 7v5m0 3v.1"/>',
        lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
        play: '<path d="m7 4 13 8-13 8z"/>',
        pause: '<path d="M8 5v14m8-14v14"/>',
      },
      a = (t, e = 21) =>
        `<svg viewBox="0 0 24 24" width="${e}" height="${e}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${G[t] || G.chart}</svg>`,
      c = (t) => (typeof esc == "function" ? esc(t) : String(t ?? "")),
      f = (t) =>
        Number.isFinite(+t)
          ? new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(+t)
          : "—",
      K = (t, e = 2) =>
        Number.isFinite(t)
          ? (t > 0 ? "+" : "") +
            t.toLocaleString("pt-BR", {
              minimumFractionDigits: e,
              maximumFractionDigits: e,
            }) +
            "%"
          : "—",
      E = (t) => (t > 0 ? "positive" : t < 0 ? "negative" : "");
    let I = "pre";
    const M = (t) =>
        ["pre", "during", "post"].includes(t?.phase)
          ? t.phase
          : [0, 2].includes(Number(t?.cat))
            ? "pre"
            : "during",
      X = { pre: "Pré-mercado", during: "Durante", post: "Pós-mercado" },
      Rt = (t, e = "Sem dados") => (t == null ? e : f(t)),
      R = () =>
        typeof D == "string" ? D : new Date().toISOString().slice(0, 10),
      B = () =>
        typeof loc == "function"
          ? loc().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
      L = (t) => String(t.dtx || t.dt || "").slice(0, 10),
      C = (t) => {
        try {
          const e = typeof cBRL == "function" ? cBRL(t) : calc(t);
          return Number.isFinite(e?.pl) ? e.pl : null;
        } catch {
          return null;
        }
      },
      Y = (t) => {
        try {
          const e = calc(t).r;
          return Number.isFinite(e) ? e : null;
        } catch {
          return null;
        }
      },
      Q = () => (Array.isArray(S?.trades) ? S.trades : []),
      F = (t) => Q().filter((e) => C(e) !== null && (!t || L(e) === t)),
      it = () =>
        Q().filter((t) => {
          try {
            return isOpen(t);
          } catch {
            return !1;
          }
        }),
      x = (t) => t.reduce((e, s) => e + (C(s) || 0), 0),
      J = (t) => t.reduce((e, s) => e + (Y(s) || 0), 0),
      dt = () => {
        try {
          const e = ["D", "S", "O"].map((s) => capCalc(s)).filter(Boolean);
          if (e.length) return e.reduce((s, o) => s + o.at, 0);
        } catch {}
        const t = Number(S?.prop?.cap);
        return t > 0 ? t : null;
      },
      W = () => typeof MDM < "u" && MDM === "us",
      N = () =>
        W()
          ? Array.isArray(S?.rulesUS)
            ? S.rulesUS
            : S?.rules || []
          : S?.rules || [],
      y = () => {
        const t = S?.days?.[R()] || {};
        return W() ? t.us || {} : t;
      },
      V = () => F(R()),
      Z = () =>
        Number(y().metaDia) > 0
          ? Number(y().metaDia)
          : Number(S?.prop?.metaDia) > 0
            ? Number(S.prop.metaDia)
            : null,
      tt = () =>
        Number(y().maxP) > 0
          ? Number(y().maxP)
          : Number(S?.prop?.perdaDia) > 0
            ? Number(S.prop.perdaDia)
            : null,
      v = (t, e, s = "") =>
        `<section class="dt393-card"><header class="dt393-cardhead"><h2>${a(t)} ${e}</h2>${s}</header>`,
      b = "</section>",
      P = (t, e, s = "") =>
        `<button type="button" class="dt393-action ${s}" data-dt393-route="${e}">${t} ${a("right", 15)}</button>`,
      Bt = '<span class="dt393-muted">Não informado</span>',
      et = [
        ["home", "Início", "home", "resumo painel principal"],
        [
          "dia",
          "Meu dia",
          "calendar",
          "planejamento notas pré-mercado checklist",
        ],
        [
          "ops",
          "Operações",
          "trade",
          "day trade swing trade opções forex trades",
        ],
        [
          "mercado",
          "Mercado",
          "globe",
          "cotações ativos ações notícias agenda pesquisa ticker",
        ],
        [
          "term",
          "Terminal",
          "monitor",
          "radar global fluxo juros workspaces gráficos",
        ],
        [
          "stats",
          "Diário",
          "book",
          "revisão resultado desempenho performance histórico",
        ],
        [
          "carteiras",
          "Carteira",
          "briefcase",
          "investimentos patrimônio proventos relatório",
        ],
        ["analises", "Análises", "chart", "técnica fundamentalista balanço valuation pesquisa CNPI"],
        ["estudos", "Estudos", "graduation", "livros inglês cnpi vídeos aulas"],
        ["regras", "Checklist", "check", "regras disciplina risco"],
        [
          "mais",
          "Configurações",
          "settings",
          "alertas notificações preferências conta",
        ],
      ];
    function z(t) {
      return (
        {
          trades: "ops",
          swing: "ops",
          opc: "ops",
          futuros: "ops",
          fx: "ops",
          trade: "ops",
          opcoes: "ops",
          mesa: "mais",
          painel: "mais",
          rev: "stats",
          agenda: "mercado",
          noticias: "mercado",
          analise: "mercado",
        }[t] || t
      );
    }
    function lt() {
      r.querySelectorAll("#dt394-drawer [data-dt393-route]").forEach((t) => {
        const e = t.dataset.dt393Route === z(tab);
        (t.classList.toggle("active", e),
          e
            ? t.setAttribute("aria-current", "page")
            : t.removeAttribute("aria-current"));
      });
    }
    function ct() {
      return `<nav class="dt394-quicknav" aria-label="Navegação principal no computador">${et.map(([t, e, s]) => `<button type="button" data-dt393-route="${t}" class="${z(tab) === t ? "active" : ""}" ${z(tab) === t ? 'aria-current="page"' : ""}>${a(s, 15)} ${e}</button>`).join("")}</nav>`;
    }
    function ut() {
      return `<div id="dt394-drawer" class="dt394-overlay" hidden><button type="button" class="dt394-backdrop" data-dt394-close aria-label="Fechar menu"></button><aside class="dt394-panel" role="dialog" aria-modal="true" aria-labelledby="dt394-drawer-title"><div class="dt394-drawer-head"><div><b id="dt394-drawer-title">Diário de Trader</b><small>Navegação e busca</small></div><button type="button" class="dt394-close" data-dt394-close aria-label="Fechar menu">${a("plus", 24)}</button></div><label class="dt394-search-label" for="dt394-nav-search">Buscar páginas, funções ou ativos</label><div class="dt394-search-box">${a("search", 18)}<input id="dt394-nav-search" type="search" autocomplete="off" placeholder="Ex.: Terminal, carteira, PETR4" aria-label="Buscar páginas e funções" /></div><div class="dt394-nav-list">${et.map(([t, e, s, o]) => `<button type="button" data-dt393-route="${t}" data-dt394-filter="${(e + " " + o).toLowerCase()}" class="${tab === t ? "active" : ""}">${a(s, 20)}<span>${e}</span>${a("right", 17)}</button>`).join("")}</div><p id="dt394-no-results" hidden>Nenhuma página encontrada. Use a busca de ativos no Mercado.</p><button type="button" id="dt394-market-search" data-dt394-marketsearch>${a("search", 17)} Abrir busca de ativos no Mercado</button><p class="dt394-footnote">No PC: <kbd>Ctrl</kbd> + <kbd>K</kbd> para pesquisar · <kbd>Esc</kbd> para fechar.</p></aside></div>`;
    }
    function at() {
      r.getElementById("dt394-drawer") ||
        r.body.insertAdjacentHTML("beforeend", ut());
    }
    function pt() {
      r.querySelectorAll("#dt394-drawer [data-dt393-route]").forEach((t) => {
        const e = t.dataset.dt393Route === tab;
        (t.classList.toggle("active", e),
          e
            ? t.setAttribute("aria-current", "page")
            : t.removeAttribute("aria-current"));
      });
    }
    function st() {
      const t = (r.getElementById("dt394-nav-search")?.value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
      let e = 0;
      r.querySelectorAll("#dt394-drawer [data-dt394-filter]").forEach((i) => {
        const d = (i.dataset.dt394Filter || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        ((i.hidden = !!t && !d.includes(t)), i.hidden || e++);
      });
      const s = r.getElementById("dt394-no-results");
      s && (s.hidden = e !== 0);
      const o = r.getElementById("dt394-market-search");
      o &&
        ((o.innerHTML = a("search", 17)),
        o.appendChild(
          r.createTextNode(
            t
              ? " Buscar ativo no Mercado"
              : " Abrir busca de ativos no Mercado",
          ),
        ));
    }
    function H(t) {
      at();
      const e = r.getElementById("dt394-drawer");
      ((e.hidden = !1), r.body.classList.add("dt394-drawer-open"));
      const s = r.getElementById("dt394-nav-search");
      ((s.value = ""),
        st(),
        lt(),
        r
          .querySelector('[data-dt393-action="menu"]')
          ?.setAttribute("aria-expanded", "true"),
        setTimeout(() => {
          t === "search"
            ? s.focus({ preventScroll: !0 })
            : e.querySelector(".dt394-close")?.focus({ preventScroll: !0 });
        }, 20));
    }
    function O(t = !0) {
      const e = r.getElementById("dt394-drawer");
      !e ||
        e.hidden ||
        ((e.hidden = !0),
        r.body.classList.remove("dt394-drawer-open"),
        r
          .querySelector('[data-dt393-action="menu"]')
          ?.setAttribute("aria-expanded", "false"),
        t &&
          r
            .querySelector('[data-dt393-action="menu"]')
            ?.focus({ preventScroll: !0 }));
    }
    function ot() {
      const t = r.getElementById("tape")?.getBoundingClientRect();
      r.documentElement.style.setProperty(
        "--dt394-tape-height",
        Math.max(0, Math.round(t?.height || 0)) + "px",
      );
    }
    (window.addEventListener("resize", ot, { passive: !0 }),
      r.addEventListener("input", (t) => {
        t.target?.id === "dt394-nav-search" && st();
      }),
      r.addEventListener(
        "click",
        (t) => {
          if (t.target.closest?.("[data-dt394-close]")) {
            (t.preventDefault(), O());
            return;
          }
          if (t.target.closest?.("[data-dt394-marketsearch]")) {
            t.preventDefault();
            const e = r.getElementById("dt394-nav-search")?.value.trim() || "";
            (O(!1),
              window.DIARIO_NAV?.navigate
                ? window.DIARIO_NAV.navigate("mercado:cq")
                : ((tab = "mercado"),
                  typeof MKT < "u" && (MKT.tab = "cq"),
                  render()),
              window.scrollTo({ top: 0, behavior: "auto" }),
              setTimeout(() => {
                const s =
                    r.querySelector("#app .dt393-native") ||
                    r.getElementById("app"),
                  i = Array.from(
                    s?.querySelectorAll(
                      'input[type="search"],input[placeholder*="ticker" i],input[placeholder*="ativo" i],input[placeholder*="busca" i]',
                    ) || [],
                  ).find((d) => d.offsetWidth > 0 && !d.disabled);
                i &&
                  (e &&
                    ((i.value = e),
                    i.dispatchEvent(new Event("input", { bubbles: !0 }))),
                  i.focus({ preventScroll: !0 }));
              }, 160));
            return;
          }
        },
        !0,
      ),
      r.addEventListener(
        "keydown",
        (t) => {
          (t.key === "Escape" &&
            !r.getElementById("dt394-drawer")?.hidden &&
            (t.preventDefault(), O()),
            (t.ctrlKey || t.metaKey) &&
              t.key.toLowerCase() === "k" &&
              (t.preventDefault(), H("search")));
        },
        !0,
      ));
    function mt() {
      const t =
        {
          home: "Início",
          dia: "Meu dia",
          regras: "Checklist",
          ops: "Operações",
          trades: "Day trade",
          swing: "Swing trade",
          opc: "Opções",
          fx: "EUA e Forex",
          futuros: "EUA e Forex",
          mercado: "Mercado",
          term: "Terminal",
          estudos: "Estudos",
          stats: "Diário",
          carteiras: "Carteira",
          painel: "Metas e risco",
          mesa: "Mesa e risco",
          rev: "Revisão",
          mais: "Configurações",
        }[tab] || "Diário de Trader";
      return `<header class="dt393-topbar"><button class="dt393-menubtn" type="button" aria-label="Abrir menu do aplicativo" data-dt393-action="menu">${a("layers", 23)}</button><div class="dt393-brand"><span class="dt393-brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>Diário de Trader</span></div><span class="dt393-title">${c(t)}</span><div class="dt393-topactions"><button aria-label="Buscar no aplicativo" type="button" data-dt393-action="search">${a("search", 23)}</button><button aria-label="Abrir notificações" type="button" data-dt393-route="mais">${a("bell", 23)}</button></div></header>`;
    }
    const ht = ["IBOV", "S&P 500", "NASDAQ", "DXY", "USD/BRL", "PETR4"];
    function gt(t) {
      const e = {
        IBOV: ["IBOV", "TVC:IBOV", "BMFBOVESPA:IBOV"],
        "S&P 500": ["SPX", "SP:SPX", "S&P 500"],
        NASDAQ: ["NDX", "NASDAQ:NDX", "NASDAQ"],
        DXY: ["DXY", "TVC:DXY"],
        "USD/BRL": ["USDBRL", "FX_IDC:USDBRL", "USD/BRL"],
        PETR4: ["PETR4", "BMFBOVESPA:PETR4"],
      }[t] || [t];
      try {
        const s = window.TRM?.TR?.dados;
        if (!s || typeof s != "object") return null;
        let o = null;
        for (const [i, d] of Object.entries(s)) {
          if (!i.startsWith("cot|") || !Array.isArray(d?.v?.itens)) continue;
          const l = Date.parse(d.v.em) || d.ts || 0;
          if (!(!l || l > Date.now() + 6e4 || Date.now() - l > 720 * 60 * 1e3))
            for (const n of d.v.itens) {
              const p = [n?.pedido, n?.s, n?.simbolo]
                .filter(Boolean)
                .map(($) => String($).toUpperCase());
              if (!e.some(($) => p.includes($.toUpperCase()))) continue;
              const u = Number(n.px);
              if (!Number.isFinite(u) || u <= 0) continue;
              const g = n.d1 != null ? Number(n.d1) : null;
              (!o || l > o.ts) &&
                (o = { n: u, change: Number.isFinite(g) ? g : null, ts: l });
            }
        }
        return o;
      } catch {
        return null;
      }
    }
    function Vt() {
      return `<div class="dt393-ticker" aria-label="Cotações; traços indicam ausência de dados verificados">${ht
        .map((t) => {
          const e = gt(t);
          return `<div class="dt393-tick"><b>${c(t)}</b><strong>${e ? e.n.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "—"}</strong><small class="${e ? E(e.change) : ""}">${e && e.change != null ? K(e.change) + (Date.now() - e.ts > 1800 * 1e3 ? " · atrasado" : "") : e ? "Cotação disponível" : "Sem cotação"}</small></div>`;
        })
        .join("")}</div>`;
    }
    function q(t, e, s = "", o = "", i = "chart") {
      return `<div class="dt393-stat"><span class="dt393-stat-icon">${a(i, 22)}</span><span class="dt393-stat-label">${t}</span><strong class="${o}">${e}</strong>${s ? `<small>${s}</small>` : ""}</div>`;
    }
    function vt() {
      const t = V(),
        e = x(t),
        s =
          typeof segundaDe == "function"
            ? segundaDe(B())
            : B().slice(0, 8) + "01",
        o = F().filter(($) => L($) >= s && L($) <= B()),
        i = dt(),
        d = i === null ? "Configure seu capital" : f(i),
        l = Z(),
        n = tt(),
        p = N(),
        u = Object.entries(y().chk || {}).filter(
          ([$, m]) => m && p.some((h) => String(h.id) === $),
        ).length,
        g = new Date(B() + "T12:00:00").toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      return `<div class="dt393-page dt393-home">
      <section class="dt393-card dt393-summary"><header class="dt393-cardhead"><h2>${a("calendar")} Resumo do dia</h2><span class="dt393-market-status">${a("chart", 16)} Acompanhamento do pregão</span></header><p class="dt393-muted dt393-date">${c(g)}</p><div class="dt393-kpis">
      <div><small>Capital</small><strong>${d}</strong></div><div><small>P&L do dia</small><strong class="${E(e)}">${e > 0 ? "+" : ""}${f(e)}</strong></div><div><small>P&L da semana</small><strong class="${E(x(o))}">${x(o) > 0 ? "+" : ""}${f(x(o))}</strong></div><div><small>Limite de perda</small><strong>${n != null ? f(n) : "Não definido"}</strong></div></div></section>
      <div class="dt393-phase"><button data-dt393-route="dia">${a("calendar", 16)} Pré-mercado</button><button class="active" data-dt393-route="term">${a("chart", 16)} Pregão</button><button data-dt393-route="dia">${a("book", 16)} Pós-mercado</button></div>
      <div class="dt393-tiles">${[
        ["chart", "Mercado", "Ações, índices e moedas", "mercado"],
        ["monitor", "Terminal", "Gráficos e inteligência", "term"],
        ["book", "Diário", "Performance e aprendizado", "stats"],
        ["graduation", "Estudos", "Aulas e materiais", "estudos"],
        ["check", "Checklist", "Rotina e disciplina", "dia"],
      ]
        .map(
          ([$, m, h, k]) =>
            `<button data-dt393-route="${k}" class="dt393-tile">${a($, 29)}<b>${m}</b><small>${h}</small>${a("right", 17)}</button>`,
        )
        .join("")}</div>
      ${v("globe", "Panorama do dia", P("Abrir mercado", "mercado"))}<div class="dt393-panorama"><div><h3>${a("calendar", 17)} Agenda</h3><p>Consulte os eventos confirmados e os horários na fonte de mercado.</p>${P("Ver agenda", "mercado")}</div><div><h3>${a("newspaper", 17)} Notícias-chave</h3><p>Manchetes do Brasil e exterior, com origem identificada.</p>${P("Ver notícias", "mercado")}</div><div><h3>${a("alert", 17)} Alertas macro</h3><p>Juros, inflação, fluxo e outros eventos monitorados.</p>${P("Abrir radar", "term")}</div></div>${b}
      ${v("spark", 'Central de Inteligência <span class="dt393-mini-ai">IA</span>')}<p class="dt393-muted">Análise contextual depende dos dados disponíveis. Sem sinais fabricados nem ordens automáticas.</p><div class="dt393-quicklist"><button data-dt393-route="term">${a("target")} Radar global e oportunidades ${a("right", 16)}</button><button data-dt393-route="ops">${a("shield")} Revisar operações e risco ${a("right", 16)}</button><button data-dt393-route="stats">${a("arrowup")} Avaliar resultados e consistência ${a("right", 16)}</button></div>${b}
      ${v("bolt", "Atalhos rápidos")}<div class="dt393-shortcuts"><button data-dt393-route="term">${a("monitor")} Abrir Terminal</button><button data-dt393-action="newtrade">${a("plus")} Registrar trade</button><button data-dt393-route="stats">${a("book")} Rever Diário</button><button data-dt393-route="mercado">${a("newspaper")} Ver notícias</button></div>${b}
      <div class="dt393-context">${u} de ${p.length} regras marcadas hoje ${l ? " · Meta diária " + f(l) : ""}</div>
      </div>`;
    }
    function bt() {
      const t = V(),
        e = x(t),
        s = N(),
        o = y(),
        i = s.filter((m) => o.chk?.[m.id]).length,
        d = s.length ? Math.round((100 * i) / s.length) : 0,
        l = Z(),
        n = tt(),
        p = Number(S?.prop?.meta) > 0 ? Number(S.prop.meta) : null,
        u = ["pre", "during", "post"]
          .map((m) => {
            const h = s.filter((A) => M(A) === m),
              k = h.filter((A) => o.chk?.[A.id]).length;
            return `<button type="button" data-dt393-action="checkphase" data-phase="${m}" class="${m === I ? "active" : ""}" aria-pressed="${m === I}">${X[m]} <small>${k}/${h.length}</small></button>`;
          })
          .join(""),
        g = s
          .map(
            (m) =>
              `<div class="dt393-checkitem" data-rule-phase="${M(m)}" ${M(m) !== I ? "hidden" : ""}><label><input type="checkbox" data-chk="${c(m.id)}" ${o.chk?.[m.id] ? "checked" : ""}/><span>${c(m.t)}</span></label><select data-dt393-rule-phase="${c(m.id)}" aria-label="Fase da regra: ${c(m.t)}"><option value="pre" ${M(m) === "pre" ? "selected" : ""}>Pré</option><option value="during" ${M(m) === "during" ? "selected" : ""}>Durante</option><option value="post" ${M(m) === "post" ? "selected" : ""}>Pós</option></select></div>`,
          )
          .join(""),
        $ = c(R().split("-").reverse().join("/"));
      return `<div class="dt393-page dt393-day">
      ${v("target", "Plano do dia", `<span class="dt393-datechip">${$}</span>`)}
        <div class="dt393-plan"><div><small>Meta diária</small><strong class="${l ? "positive" : ""}">${l ? f(l) : "Não definida"}</strong></div><div><small>Limite diário</small><strong class="${n ? "negative" : ""}">${n ? f(n) : "Não definido"}</strong></div><div><small>Trades encerrados</small><strong>${t.length}</strong></div><div><small>Foco operacional</small><strong>${c(o.plano?.slice(0, 90) || "Defina seu plano")}</strong></div></div>
        <div class="dt393-goal-edit"><label>Minha meta para este dia (R$)<input type="number" min="0" step="0.01" inputmode="decimal" data-d="metaDia" value="${c(o.metaDia ?? "")}" placeholder="Não definida"></label><label>Perda máxima para este dia (R$)<input type="number" min="0" step="0.01" inputmode="decimal" data-d="maxP" value="${c(o.maxP ?? "")}" placeholder="${c(S?.prop?.perdaDia || "Não definida")}"></label></div>
        <p class="dt393-origin">${p ? `Sua meta geral da mesa é ${f(p)}, configurada em <b>Mesa e risco</b>. Ela <b>não</b> é aplicada automaticamente à meta diária.` : "A meta diária é independente da meta geral da mesa. Só aparece quando você a define."} ${!o.maxP && S?.prop?.perdaDia ? "O limite de perda mostrado acima veio da configuração geral da mesa." : ""}</p>
      ${b}
      ${v("check", "Checklist operacional", `<span class="dt393-progress-num" id="dt393-checknum">${i} de ${s.length} (${d}%)</span>`)}
      <div class="dt393-progress"><span id="dt393-progressbar" style="width:${d}%"></span></div><div class="dt393-phase dt393-phase-inner">${u}</div>
      <div class="dt393-checklist">${g || '<p class="dt393-muted">Adicione suas regras para começar.</p>'}<div class="dt393-phase-empty" ${s.some((m) => M(m) === I) ? "hidden" : ""}>Nenhuma regra nesta fase. Use o seletor ao lado de uma regra para movê-la entre as fases.</div></div>
      <button class="dt393-outline" type="button" data-dt393-route="regras">${a("edit", 16)} Criar e editar regras ${a("right", 15)}</button>${b}
</div>`;
    }
    function rt(t) {
      const e = C(t),
        s = Y(t),
        o = t.side === "C" ? "Compra" : "Venda",
        i = c(t.ativo || "Ativo");
      return `<button type="button" class="dt393-oprow" data-a="edit" data-id="${c(t.id)}"><span class="dt393-op-symbol ${o === "Compra" ? "buy" : "sell"}"><b>${i}</b><small>${c(t.setup || "Sem setup")}</small></span><span class="dt393-op-side ${o === "Compra" ? "buy" : "sell"}">${o}</span><span class="dt393-op-values"><strong class="${E(e)}">${e == null ? "Aberta" : (e > 0 ? "+" : "") + f(e)}</strong><small>${s == null ? "R não calculado" : (s > 0 ? "+" : "") + s.toFixed(2).replace(".", ",") + " R"}</small></span>${a("right", 16)}</button>`;
    }
    function nt() {
      const t = it(),
        e = V(),
        s = x(e),
        o = t.reduce((d, l) => {
          try {
            return d + (calc(l).risk || 0);
          } catch {
            return d;
          }
        }, 0),
        i = e.filter((d) => C(d) > 0).length;
      return `<div class="dt393-page dt393-operations"><div class="dt393-statgrid">${q("Operações abertas", String(t.length), "Somente monitoramento", "", "briefcase")}${q("Resultado do dia", (s > 0 ? "+" : "") + f(s), e.length + " encerradas", E(s), "chart")}${q("Risco teórico aberto", f(o), "Conforme stops cadastrados", "", "shield")}${q("Setups hoje", String(new Set(e.map((d) => d.setup).filter(Boolean)).size), "Nos trades encerrados", "", "target")}</div>
      ${v("layers", "Posições monitoradas", `<span class="dt393-muted">${t.length} aberta(s)</span>`)}<div class="dt393-tablewrap"><table class="dt393-table"><thead><tr><th>Ativo</th><th>Lado</th><th>Entrada</th><th>Stop</th><th>Alvo</th><th>Status</th></tr></thead><tbody>${t.map((d) => `<tr><td><b>${c(d.ativo || "—")}</b></td><td class="${d.side === "C" ? "positive" : "negative"}">${d.side === "C" ? "Compra" : "Venda"}</td><td>${c(d.entry || "—")}</td><td>${c(d.stop || "—")}</td><td>${c(d.target || "—")}</td><td><button data-a="edit" data-id="${c(d.id)}">Ver detalhes</button></td></tr>`).join("") || '<tr><td colspan="6" class="dt393-empty">Nenhuma operação aberta registrada.</td></tr>'}</tbody></table></div>${b}
      ${v("trade", "Trades do dia", `<span class="dt393-muted">${e.length} trades</span>`)}<div class="dt393-oplist">${e.slice(0, 15).map(rt).join("") || '<p class="dt393-muted">Nenhum trade encerrado no dia selecionado.</p>'}</div><button class="dt393-outline" data-dt393-action="native">Ver todos os trades e filtros ${a("right", 16)}</button>${b}
      <div class="dt393-two">${v("edit", "Revisão rápida")}<p class="dt393-muted">Registre os principais pontos desta sessão.</p><div class="dt393-quicklist"><button data-dt393-route="dia">${a("book", 17)} Registrar aprendizado ${a("right", 15)}</button><button data-dt393-route="stats">${a("chart", 17)} Analisar estatísticas ${a("right", 15)}</button><button data-dt393-action="newtrade">${a("plus", 17)} Registrar operação ${a("right", 15)}</button></div>${b}
      ${v("spark", "Insights automáticos")}<p class="dt393-muted">Observações baseadas no seu diário, não recomendações de compra ou venda.</p><div class="dt393-insight"><span>${a("check", 17)}</span><p>${e.length ? `Você concluiu ${e.length} operações hoje; ${i} tiveram resultado positivo.` : "Registre suas operações para começar a avaliar consistência."}</p></div><div class="dt393-insight"><span>${a("shield", 17)}</span><p>${t.length ? `Há ${t.length} posição(ões) monitorada(s). Confira os stops e o risco no Profit Pro.` : "Sem posições abertas registradas no diário."}</p></div><div class="dt393-insight"><span>${a("book", 17)}</span><p>Avalie disciplina, contexto e aderência ao plano antes de tirar conclusões.</p></div>${b}</div></div>`;
    }
    function ft() {
      const t = F().sort((u, g) => L(u).localeCompare(L(g))),
        e = t.slice(-60);
      if (e.length < 2)
        return '<div class="dt393-chartempty">Registre ao menos dois trades encerrados para ver a curva de resultados.</div>';
      let s = 0;
      const o = e.map((u) => (s += C(u) || 0)),
        i = Math.min(0, ...o),
        d = Math.max(0, ...o),
        l = Math.max(1, d - i),
        n = o
          .map(
            (u, g) =>
              `${((g / (o.length - 1)) * 590 + 5).toFixed(1)},${(180 - ((u - i) / l) * 155).toFixed(1)}`,
          )
          .join(" "),
        p = (180 - ((0 - i) / l) * 155).toFixed(1);
      return `<svg class="dt393-perf-svg" role="img" aria-label="Curva acumulada de resultados de ${e.length} trades encerrados" viewBox="0 0 600 210" preserveAspectRatio="none"><g class="dt393-gridlines">${[25, 65, 105, 145, 185].map((u) => `<path d="M0 ${u}H600"/>`).join("")}</g><path class="dt393-zero" d="M0 ${p}H600"/><polyline points="${n}" fill="none" stroke="#f6f5f4" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><text x="592" y="15" text-anchor="end">P&L acumulado · ${f(s)}</text></svg>`;
    }
    function $t() {
      const t = V(),
        e = x(t),
        s = t.filter((i) => C(i) > 0),
        o = t.length ? (s.length / t.length) * 100 : null;
      return `<div class="dt393-page dt393-journal">${v("book", "Resumo do dia", `<span class="dt393-datechip">${c(R().split("-").reverse().join("/"))}</span>`)}<div class="dt393-kpis"><div><small>Resultado</small><strong class="${E(e)}">${e > 0 ? "+" : ""}${f(e)}</strong></div><div><small>Win rate</small><strong>${o == null ? "—" : K(o)}</strong></div><div><small>R acumulado</small><strong class="${E(J(t))}">${J(t).toFixed(2).replace(".", ",")} R</strong></div><div><small>Nº de trades</small><strong>${t.length}</strong></div></div>${b}
      ${v("chart", "Performance do Diário")}<div class="dt393-chart-toolbar"><span>Resultado acumulado dos últimos trades fechados</span><button data-dt393-route="stats">Análise completa ${a("right", 14)}</button></div>${ft()}<small class="dt393-muted">Dados do seu diário. Comparação com o IBOV exige série histórica validada e não é simulada.</small>${b}
      ${v("check", "Checklist e cenário", P("Abrir plano", "dia"))}<p class="dt393-notes">${c(y().plano || "Plano não preenchido para esta data.")}</p>${b}
      ${v("trade", "Operações de hoje", P("Ver operações", "ops"))}<div class="dt393-oplist">${t.slice(0, 10).map(rt).join("") || '<p class="dt393-muted">Ainda não há trades encerrados neste dia.</p>'}</div>${b}
      <div class="dt393-two">${v("edit", "Anotações e lições")}<p class="dt393-notes">${c(y().resumo || "Escreva a revisão do dia nas ferramentas completas.")}</p>${b}${v("target", "Pontos de atenção")}<p class="dt393-notes">${c(y().pre || "Registre seu ensaio mental e pontos de atenção para visualizar aqui.")}</p>${b}</div>
      <button class="dt393-primary" data-dt393-route="dia">${a("book")} Registrar revisão</button></div>`;
    }
    let w = "";
    function U(t = "candles") {
      return t === "english"
        ? '<span class="dt397-art-letter">EN<span>MARKET ENGLISH</span></span>'
        : t === "cert"
          ? '<span class="dt397-art-letter">CNPI<span>CERTIFICAÇÃO</span></span>'
          : `<svg viewBox="0 0 300 150" role="img" aria-label="Ilustração de candles e médias móveis" preserveAspectRatio="xMidYMid slice"><defs><pattern id="dt397-grid" width="23" height="23" patternUnits="userSpaceOnUse"><path d="M23 0H0V23" stroke="#3b3e44" stroke-width=".65" opacity=".45" fill="none"/></pattern><linearGradient id="dt397-bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#0f0f11"/><stop offset="1" stop-color="#131416"/></linearGradient></defs><rect width="300" height="150" fill="url(#dt397-bg)"/><rect width="300" height="150" fill="url(#dt397-grid)"/>${Array.from(
              { length: 20 },
              (s, o) => {
                const i = 19 + ((o * 11) % 25),
                  d = 94 - o * 2.45 + Math.sin(o * 1.63) * 15,
                  l = 12 + o * 14,
                  n = o % 5 !== 0;
                return `<line x1="${l}" y1="${d - i * 0.55}" x2="${l}" y2="${d + i * 0.57}" stroke="${n ? "#c09442" : "#e9715e"}" stroke-width="1.7"/><rect x="${l - 3.9}" y="${d - i * 0.32}" width="7.8" height="${i * 0.66}" rx=".6" fill="${n ? "#b48a3c" : "#e76652"}"/>`;
              },
            ).join(
              "",
            )}<path d="M7 129Q30 119 49 111T93 107T130 92T170 77T211 70T247 41T293 35" fill="none" stroke="#cfaa65" stroke-width="2.2"/><path d="M6 133Q55 125 90 119T173 91T240 82T297 54" stroke="#ac8439" fill="none" stroke-width="1.8" opacity=".85"/></svg>`;
    }
    const yt = [
        ["est", "Hoje", "clock"],
        ["aul", "Aulas", "play"],
        ["liv", "Biblioteca", "book"],
        ["sim", "Praticar", "target"],
        ["desemp", "Progresso", "chart"],
      ],
      kt = [
        ["foco", "Modo foco", "eye"],
        ["ciclo", "Ciclo", "calendar"],
        ["reg", "Registrar estudo", "edit"],
        ["pr", "Prompts", "spark"],
        ["treino", "Treino", "target"],
        ["pl", "Planos", "calendar"],
      ];
    function wt() {
      const grupo = ["desemp"].includes(w)
        ? "desemp"
        : ["sim", "treino"].includes(w)
          ? "sim"
          : [
                "est",
                "ciclo",
                "reg",
                "edital",
                "conq",
                "foco",
                "pl",
              ].includes(w)
            ? "est"
            : w === "aul"
              ? "aul"
              : ["liv", "ing", "cnpi", "fac"].includes(w)
                ? "liv"
                : "";
      return yt
        .map(
          ([id, label, icon]) =>
            `<button type="button" class="dt397-chip ${grupo === id ? "on" : ""}" data-dt397-view="${id}" aria-pressed="${grupo === id}">${a(icon, 18)}<span>${c(label)}</span></button>`,
        )
        .join("");
    }
    function St() {
      try {
        return (window.AULAS?.getLista?.() || []).filter(
          (t) => t && t.id && t.status !== "gerando",
        );
      } catch {
        return [];
      }
    }
    function T(t) {
      let e = {};
      try {
        e = window.AULAS?.progresso?.(t) || t.progresso || {};
      } catch {
        e = t.progresso || {};
      }
      const s = e.fim
        ? 100
        : Number(e.total) > 0
          ? Math.round(
              (100 *
                Math.max(0, Math.min(Number(e.cena) || 0, Number(e.total)))) /
                Number(e.total),
            )
          : null;
      return s === null ? null : Math.max(0, Math.min(100, s));
    }
    function At(t) {
      const e = ((t?.livro || "") + " " + (t?.titulo || "")).toLowerCase();
      return /cnpi|certifica/.test(e)
        ? "cert"
        : /ingl[eê]s|english|idioma/.test(e)
          ? "english"
          : "candles";
    }
    function Dt(t) {
      return t === "english"
        ? '<span class="dt399-english-flag" aria-hidden="true"><span>ENGLISH</span><em>FINANCIAL MARKET</em></span>'
        : t === "cert"
          ? '<span class="dt399-cnpi-art" aria-hidden="true"><strong>CNPI-T</strong><em>ECONOMIA & MERCADO</em></span>'
          : U();
    }
    function Mt(t) {
      return t === null
        ? '<small class="dt399-untracked">Progresso ainda não registrado</small>'
        : `<span class="dt399-progress"><span style="width:${t}%"></span></span>`;
    }
    function Et(t) {
      const e = c(
          (t.numero ? "Aula " + t.numero + " — " : "") + (t.titulo || "Aula"),
        ),
        s = T(t),
        o = At(t);
      return `<button type="button" class="dt397-lesson dt399-video-row" data-auopen="${c(t.id)}" aria-label="Abrir ${e}"><span class="dt397-lesson-art dt399-lesson-visual">${Dt(o)}<span class="dt399-play-mini">▶ ${t.min ? c(t.min) + "min" : "Aula"}</span></span><span class="dt397-lesson-copy"><small class="dt397-type">${o === "cert" ? "CNPI-T" : o === "english" ? "INGLÊS" : "ANÁLISE TÉCNICA"}</small><strong>${e}</strong><small>${c(t.livro || "Videoaula")} ${t.capitulos ? "· " + c(t.capitulos) : ""}</small>${Mt(s)}</span><span class="dt399-row-aside">${s === null ? a("right", 16) : s + "%"}</span></button>`;
    }
    function capaLivro(titulo, autor) {
      const paleta = [["#1B2230", "#C9A15A"], ["#1E2A24", "#4CC388"], ["#2A1D1F", "#E0735F"], ["#1C2433", "#6FA8DC"], ["#262033", "#A88BE0"], ["#2B2618", "#D9B44A"]];
      let h = 0;
      for (const ch of String(titulo || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      const [cor, faixa] = paleta[h % paleta.length];
      return `<span class="m584-capa" style="--capa:${cor};--faixa:${faixa}" aria-hidden="true"><b>${c(titulo || "Livro")}</b><small>${c(autor || "Livro")}</small></span>`;
    }
    function xt(t, e) {
      return `<button type="button" class="dt397-lesson dt399-book-row" data-a="openbook" data-id="${c(t.id)}" aria-label="Abrir livro ${c(t.t || "Sem título")}"><span class="dt397-lesson-art dt397-lesson-art--capa">${capaLivro(t.t, t.a)}</span><span class="dt397-lesson-copy"><small class="dt397-type">LEITURA</small><strong>${c(t.t || "Livro sem título")}</strong><small>${c(t.a || "Autor não informado")}</small><span class="dt397-reading-status">${a("book", 13)} ${Array.isArray(t.notes) ? t.notes.length : 0} anotação(ões)</span></span>${a("right", 17)}</button>`;
    }
    r.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape") return;
        const menu = r.getElementById("dt401-more-list"),
          button = r.querySelector("[data-dt401-more-toggle]");
        if (menu && !menu.hidden) {
          event.preventDefault();
          event.stopImmediatePropagation();
          menu.hidden = true;
          button?.setAttribute("aria-expanded", "false");
          button?.classList.remove("on");
          button?.focus();
        }
      },
      true,
    );
    r.addEventListener("input", (event) => {
      if (!event.target.matches("[data-est-book-search]")) return;
      const term = EstudosModelo.normalizar(event.target.value);
      let visible = 0;
      r.querySelectorAll("[data-est-book-row]").forEach((row) => {
        const match = EstudosModelo.normalizar(row.textContent).includes(term);
        row.hidden = !match;
        if (match) visible++;
      });
      const empty = r.querySelector(".est-book-empty");
      if (empty) empty.hidden = visible > 0;
    });
    function It() {
      const t = Array.isArray(S?.books) ? S.books : [],
        e = St(),
        s = e.filter((h) =>
          /an[aá]lise t[eé]cnica|mercados financeiros|john murphy/i.test(
            [h.livro, h.titulo].join(" "),
          ),
        ),
        o = s.length
          ? s
          : e.length
            ? e.filter((h) => h.livro === e[0].livro)
            : [],
        i = o.filter((h) => T(h) === 100).length,
        d = o.filter((h) => T(h) !== null),
        l =
          o.length && d.length
            ? Math.round(d.reduce((h, k) => h + T(k), 0) / o.length)
            : null,
        n = e
          .filter((h) => T(h) !== 100)
          .sort((h, k) => {
            const A = T(h),
              _ = T(k);
            return (
              +(_ !== 100 && _ !== null && _ > 0) -
                +(A !== 100 && A !== null && A > 0) ||
              String(k.criado_em || "").localeCompare(String(h.criado_em || ""))
            );
          }),
        p = n.length > 0,
        u = p
          ? n.slice(0, 3).map(Et).join("")
          : t.length
            ? t.slice(0, 3).map(xt).join("")
            : `<div class="dt397-empty"><strong>Suas aulas e leituras aparecerão aqui</strong><span>Entre em Vídeos ou Livros para começar uma trilha de aprendizado.</span><button type="button" data-dt397-view="aul">Explorar videoaulas ${a("right", 15)}</button></div>`,
        g = o.length ? `${i} de ${o.length} aulas` : "— aulas",
        $ = l === null ? "—" : l + "%",
        m = `<span class="dt397-track dt399-track"><span style="width:${l || 0}%;opacity:1"></span></span>`;
      const proximas = estProximasAcoes();
      const destaque =
        o.find((h) => T(h) > 0 && T(h) < 100) ||
        o.find((h) => T(h) !== 100) ||
        o[0];
      const titulo = destaque
        ? destaque.livro || destaque.titulo || "Minha trilha de estudos"
        : "Seu próximo estudo";
      const acaoDestaque = destaque
        ? 'data-auopen="' + c(destaque.id) + '"'
        : 'data-dt397-view="liv"';
      return `<div class="dt393-page dt397-studies dt399-studies${w ? " dt-est-interno" : ""}" aria-label="Central de Estudos">
      <section class="dt397-hero">
        <div class="dt397-eyebrow">${a("graduation", 18)} <strong>Trilha em destaque</strong></div>
        <div class="dt397-feature">
          <button type="button" class="dt397-feature-art" ${acaoDestaque} aria-label="${c(destaque ? "Abrir " + destaque.titulo : "Explorar biblioteca")}">${Dt(At(destaque || {}))}<span class="dt397-play">${a("play", 24)}</span><small>${o[0]?.min ? c(o[0].min) + "min" : "VIDEOAULAS"}</small></button>
          <div class="dt397-feature-content"><h1>${c(titulo)}</h1><p>${destaque ? "Acompanhe sua trilha e continue de onde parou." : "Escolha uma leitura, pratique e acompanhe suas revisões."}</p>
            <div class="dt399-hero-summary"><span>Progresso: <b>${$}</b></span><span>${g}</span></div>${m}
            <button type="button" class="dt399-hero-cta" ${acaoDestaque}>${destaque ? (T(destaque) === 100 ? "Rever aula" : T(destaque) > 0 ? "Retomar aula" : "Começar aula") : "Abrir biblioteca"} ${a("right", 14)}</button>
          </div>
        </div>
      </section>
      <div class="dt401-category-shell">
        <nav class="dt397-category" aria-label="Seções principais de Estudos">${wt()}</nav>
        <div class="dt401-more">
          <button type="button" class="dt401-more-toggle" data-dt401-more-toggle aria-controls="dt401-more-list" aria-expanded="false" aria-label="Abrir mais ferramentas de Estudos">${a("plus", 17)} <span>Mais</span> ${a("right", 13)}</button>
          <div id="dt401-more-list" class="dt401-more-list" aria-label="Outras ferramentas de Estudos" hidden>
            <div class="dt401-more-title">Outras ferramentas</div>
            ${kt.map(([h, k, A]) => `<button type="button" data-dt397-view="${h}">${a(A, 17)}<span>${k}</span>${a("right", 14)}</button>`).join("")}
          </div>
        </div>
      </div>
      <div class="dt397-dashboard" ${w ? "hidden" : ""}>
        <section class="dt397-panel dt397-continue">
          <div class="dt397-panel-head"><h2>${a("clock", 20)} ${p ? "Continuar estudando" : "Seus livros"}</h2><button type="button" data-dt397-view="${p ? "aul" : "liv"}">Ver tudo ${a("right", 15)}</button></div>
          <div class="dt397-lesson-list">${u}</div>
        </section>
        <section class="dt397-panel dt397-library"><div class="dt397-panel-head"><h2>${a("book", 20)} Biblioteca</h2><button type="button" data-dt397-view="liv">Ver tudo ${a("right", 15)}</button></div>
          <div class="dt397-library-grid">
            <button type="button" data-dt397-view="aul">${a("play", 24)}<strong>Vídeo aula</strong><small>Aulas e trilhas de aprendizado</small>${a("right", 15)}</button>
            <button type="button" data-dt397-view="liv">${a("book", 24)}<strong>Resumo de livro</strong><small>Seus livros, anotações e resumos</small>${a("right", 15)}</button>
            <button type="button" data-dt397-view="pl">${a("check", 24)}<strong>Checklist de leitura</strong><small>Organize suas metas de leitura</small>${a("right", 15)}</button>
            <button type="button" data-dt397-view="sim">${a("newspaper", 24)}<strong>Simulado</strong><small>Questões de CNPI-T e mercado</small>${a("right", 15)}</button>
          </div>
        </section>
        <section class="dt397-panel dt397-suggestions"><div class="dt397-panel-head"><div><h2>${a("spark", 21)} Sugestões de estudos</h2><p>Próximas ações a partir das suas revisões, do ciclo e do desempenho.</p></div></div>
          <div class="dt397-suggestion-list">${proximas.map((item) => `<button type="button" data-dt397-view="${c(item.view)}" ${item.mat ? 'data-dt397-materia="' + c(item.mat) + '"' : ""}>${a("right", 17)}<span><b>${c(item.label)}</b><small>${c(item.motivo)}</small></span></button>`).join("")}</div>
        </section>
        <section class="dt397-status"><div>${a("chart", 25)}<div><strong>Seu espaço de aprendizagem</strong><small>Vídeos, resumos, simulados e trilhas de estudos.</small></div></div></section>

      </div>
      <section class="dt397-native-mount" ${w ? "" : "hidden"} aria-label="Ferramentas de estudo"><header><button type="button" data-dt397-view="home">${a("right", 17)} Voltar para Estudos</button><h2>${c({ liv: "Livros", ing: "Inglês", cnpi: "CNPI-T", aul: "Vídeo aulas", resumos: "Resumos", playlists: "Playlists", pl: "Planos", sim: "Simulados", juros: "Juros", foco: "Foco", treino: "Treino", est: "Hoje", pr: "Prompts", fac: "Faculdade", desemp: "Progresso", ciclo: "Ciclo", reg: "Registrar estudo", edital: "Edital", conq: "Conquistas" }[w] || "Minha biblioteca")}</h2></header>${["liv", "ing", "cnpi", "fac"].includes(w) ? `<div class="dt397-filtros" role="group" aria-label="Filtrar Biblioteca" style="display:flex;gap:8px;overflow-x:auto;margin:0 0 16px;position:static">${[["liv", "Tudo"], ["ing", "Inglês"], ["cnpi", "CNPI-T"], ["fac", "Faculdade"]].map(([id, label]) => `<button type="button" class="dt397-chip ${w === id ? "on" : ""}" data-dt397-view="${id}" aria-pressed="${w === id}"><span>${label}</span></button>`).join("")}</div>` : ""}</section>
    </div>`;
    }
    function Ct() {
      return `<div class="dt393-page dt393-market"><header class="dt393-feature-head"><h1>${a("globe", 23)} Mercado</h1><p>Cotações, gráficos, notícias e agenda de fontes conectadas. Escolha uma categoria abaixo.</p></header><div class="dt393-market-filters"><button data-dt393-market="cot">${a("chart", 16)} Cotações</button><button data-dt393-market="nt">${a("newspaper", 16)} Notícias</button><button data-dt393-market="ag">${a("calendar", 16)} Agenda</button><button data-dt393-market="al">${a("bell", 16)} Alertas</button></div><div class="dt393-live-note">${a("shield", 16)} Os dados exibidos abaixo vêm das fontes do aplicativo. Cotações indisponíveis não são preenchidas com exemplos.</div></div>`;
    }
    function Nt() {
      return `<div class="dt393-page dt393-terminal"><header class="dt393-feature-head"><h1>${a("monitor", 23)} Terminal de Inteligência</h1><p>Segunda tela de consulta: Radar Global, Juros, Fluxo, Notícias e gráficos. Execução de ordens permanece no Profit Pro.</p></header><div class="dt393-terminal-links"><button data-dt393-action="terminalpicker">${a("layers")} Selecionar workspace</button><button data-dt393-route="mercado">${a("globe")} Mercado</button><button data-dt393-route="ops">${a("shield")} Risco</button></div></div>`;
    }
    function Pt(t, e = "Conteúdo e ferramentas do módulo") {
      const s = r.createElement("section");
      ((s.className = "dt393-workspace"),
        (s.id = "dt393-workspace"),
        s.setAttribute("aria-label", e));
      const o = r.createElement("div");
      return (
        (o.className = "dt393-native dt395-native-" + tab),
        Array.from(t.childNodes).forEach((i) => o.appendChild(i)),
        s.appendChild(o),
        tab === "home" && o.querySelector("#brand116")?.remove(),
        tab === "estudos" &&
          Array.from(o.children)
            .find(
              (d) => d.tagName === "H1" && d.textContent.trim() === "Estudos",
            )
            ?.remove(),
        tab === "mercado" &&
          MKT?.tab !== "al" &&
          o.querySelectorAll(".mk-seg button").forEach((i) => {
            /^Alertas$/i.test((i.textContent || "").trim()) && i.remove();
          }),
        s
      );
    }
    function Tt(t) {
      const e = t.querySelector(".dt393-native");
      if (!e) return;
      const s = Array.from(e.children);
      for (const o of s)
        if (
          /^H2$/i.test(o.tagName || "") &&
          /Checklist de regras/i.test(o.textContent || "")
        ) {
          const i = o.nextElementSibling;
          (o.remove(), i?.classList?.contains("card") && i.remove());
        }
    }
    function j() {
      const t = r.getElementById("app");
      if (!(!t || t.dataset.dt393Decorated === "1"))
        try {
          (r.body.classList.add("dt393-active"),
            r.getElementById("dt393-global-head")?.remove());
          const e = r.createElement("div");
          ((e.id = "dt393-global-head"),
            (e.innerHTML = mt() + ct()),
            t.before(e),
            at(),
            pt(),
            ot());
          const s = ["home", "dia", "stats", "estudos"].includes(tab),
            o = Pt(
              t,
              {
                dia: "Planejamento, observações e revisão",
                home: "Painéis e registros completos",
                ops: "Modalidades e ferramentas de operação",
                trades: "Histórico, filtros e lançamentos",
                stats: "Estatísticas e relatórios",
                estudos: "Biblioteca e aulas",
                mercado: "Gráficos, notícias e cotações",
                term: "Terminal e workspaces",
              }[tab] || "Ferramentas integradas",
            );
          let i = !1;
          if (s && !(tab === "dia" && typeof DV < "u" && DV === "hist")) {
            const d = {
                home: vt,
                dia: bt,
                ops: nt,
                trades: nt,
                stats: $t,
                estudos: It,
                mercado: Ct,
                term: Nt,
              },
              l = r.createElement("div");
            if (
              ((l.innerHTML = d[tab]()), t.appendChild(l), tab === "estudos")
            ) {
              const n = l.querySelector(".dt397-native-mount");
              (n.appendChild(o), (i = !0), (n.hidden = !w));
              const filtros = n.querySelector(".dt397-filtros");
              filtros && o.prepend(filtros);
            }
          }
          (tab === "dia" && Tt(o),
            i || t.appendChild(o),
            (t.dataset.dt393Decorated = "1"),
            r
              .querySelector('meta[name="theme-color"]')
              ?.setAttribute("content", "#0a0b0c"));
        } catch (e) {
          console.error(
            "dt393: falha ao aprimorar interface; controles originais preservados",
            e,
          );
        }
    }
    if (
      (r.addEventListener("diario:aulas-carregadas", () => {
        tab === "estudos" &&
          !w &&
          setTimeout(() => {
            tab === "estudos" && !w && render();
          }, 0);
      }),
      r.addEventListener(
        "click",
        function (t) {
          const e = t.target.closest?.("[data-dt401-more-toggle]");
          if (e) {
            (t.preventDefault(), t.stopImmediatePropagation());
            const n = r.getElementById("dt401-more-list");
            if (!n) return;
            const p = n.hidden;
            ((n.hidden = !p),
              e.setAttribute("aria-expanded", String(p)),
              e.classList.toggle("on", p));
            return;
          }
          if (!t.target.closest?.(".dt401-more")) {
            const n = r.getElementById("dt401-more-list"),
              p = r.querySelector("[data-dt401-more-toggle]");
            n &&
              !n.hidden &&
              ((n.hidden = !0),
              p?.setAttribute("aria-expanded", "false"),
              p?.classList.remove("on"));
          }
          const estudoSub = t.target.closest?.(".estchips [data-estv]");
          if (estudoSub) {
            w = ["reg", "ciclo", "edital", "conq", "desemp"].includes(
              estudoSub.dataset.estv,
            )
              ? estudoSub.dataset.estv
              : "est";
            return;
          }
          const s = t.target.closest?.("[data-dt397-view]");
          if (s) {
            t.preventDefault();
            t.stopImmediatePropagation();
            const n = s.dataset.dt397View;
            w =
              n === "home"
                ? ""
                : n === "resumos"
                  ? "liv"
                  : n === "playlists"
                    ? "aul"
                    : n;
            if (["est", "desemp", "ciclo", "reg"].includes(n)) {
              ESV = "est";
              EST.v = n === "est" ? "hoje" : n;
            } else if (n === "sim" || n === "resumos") ESV = "liv";
            else if (n === "playlists") ESV = "aul";
            else if (n !== "home") ESV = n;
            if (s.dataset.dt397Materia) {
              FOCO.mat = s.dataset.dt397Materia;
              focoSalva();
            }
            tab = "estudos";
            render();
            if (n === "sim")
              r.querySelector(
                '#app .dt397-native-mount [data-e2at="sim"]',
              )?.click();
            window.scrollTo({ top: 0, behavior: "instant" });
            return;
          }
          const o = t.target.closest("[data-dt393-route]");
          if (o) {
            (t.preventDefault(), t.stopImmediatePropagation(), O(!1));
            const n = o.dataset.dt393Route;
            n.includes(":") && window.DIARIO_NAV?.navigate
              ? window.DIARIO_NAV.navigate(n)
              : ((tab = n), render(), window.scrollTo?.(0, 0));
            return;
          }
          const i = t.target.closest("[data-dt393-market]");
          if (i) {
            (t.preventDefault(), t.stopImmediatePropagation());
            const n =
              i.dataset.dt393Market === "cot" ? "cq" : i.dataset.dt393Market;
            window.DIARIO_NAV?.navigate
              ? window.DIARIO_NAV.navigate("mercado:" + n)
              : ((MKT.tab = n), (tab = "mercado"), render());
            return;
          }
          const d = t.target.closest("[data-dt393-action]");
          if (!d) return;
          const l = d.dataset.dt393Action;
          if (l === "menu") {
            (t.preventDefault(), t.stopImmediatePropagation(), H("menu"));
            return;
          }
          if (l === "native") {
            (t.preventDefault(),
              t.stopImmediatePropagation(),
              r
                .getElementById("dt393-workspace")
                ?.scrollIntoView({ behavior: "smooth", block: "start" }));
            return;
          }
          if (l === "newtrade") {
            (t.preventDefault(), t.stopImmediatePropagation());
            const n = r.querySelector('#fabm [data-a="new"][data-tp="D"]');
            n && n.click();
            return;
          }
          if (l === "search") {
            (t.preventDefault(), t.stopImmediatePropagation(), H("search"));
            return;
          }
          if (l === "terminalpicker") {
            (t.preventDefault(), t.stopImmediatePropagation());
            const n = r.querySelector("[data-radar-picker]");
            n
              ? n.click()
              : r
                  .getElementById("dt393-workspace")
                  ?.scrollIntoView({ behavior: "smooth" });
            return;
          }
          if (l === "checkphase") {
            (t.preventDefault(),
              t.stopImmediatePropagation(),
              (I = d.dataset.phase),
              r.querySelectorAll(".dt393-phase [data-phase]").forEach((u) => {
                const g = u === d;
                (u.classList.toggle("active", g),
                  u.setAttribute("aria-pressed", String(g)));
              }));
            let n = 0;
            r.querySelectorAll(".dt393-checklist [data-rule-phase]").forEach(
              (u) => {
                ((u.hidden = u.dataset.rulePhase !== I), u.hidden || n++);
              },
            );
            const p = r.querySelector(".dt393-phase-empty");
            p && (p.hidden = n > 0);
            return;
          }
        },
        !0,
      ),
      r.addEventListener(
        "keydown",
        function (t) {
          if (t.key !== "Escape") return;
          const e = r.getElementById("dt401-more-list");
          if (!e || e.hidden) return;
          e.hidden = !0;
          const s = r.querySelector("[data-dt401-more-toggle]");
          (s?.setAttribute("aria-expanded", "false"),
            s?.classList.remove("on"),
            s?.focus({ preventScroll: !0 }),
            t.preventDefault());
        },
        !0,
      ),
      r.addEventListener(
        "change",
        function (t) {
          const e = t.target.closest?.("[data-dt393-rule-phase]");
          if (!e) return;
          (t.preventDefault(), t.stopImmediatePropagation());
          const s = N().find((o) => String(o.id) === e.dataset.dt393RulePhase);
          !s ||
            !X[e.value] ||
            ((s.phase = e.value), (s.u = Date.now()), save(), render());
        },
        !0,
      ),
      r.addEventListener("change", function (t) {
        t.target.matches?.(".dt393-checklist [data-chk]") &&
          setTimeout(() => {
            const e = N().filter((l) => y().chk?.[l.id]).length || 0,
              s = N().length || 0,
              o = s ? Math.round((e * 100) / s) : 0,
              i = r.getElementById("dt393-checknum");
            i && (i.textContent = `${e} de ${s} (${o}%)`);
            const d = r.getElementById("dt393-progressbar");
            (d && (d.style.width = `${o}%`),
              r.querySelectorAll(".dt393-phase [data-phase]").forEach((l) => {
                const n = N().filter((g) => M(g) === l.dataset.phase),
                  p = n.filter((g) => y().chk?.[g.id]).length,
                  u = l.querySelector("small");
                u && (u.textContent = `${p}/${n.length}`);
              }));
          }, 0);
      }),
      r.addEventListener("change", function (t) {
        t.target?.matches?.('[data-d="metaDia"],[data-d="maxP"]') &&
          setTimeout(() => {
            tab === "dia" && render();
          }, 20);
      }),
      r.addEventListener(
        "click",
        function (t) {
          t.target?.closest?.(
            "#app [data-modcard],#app [data-modgo],#app [data-modsub],#app [data-modhub]",
          ) &&
            setTimeout(() => {
              const s = r.querySelector("#app .dt393-native");
              if (!s) return;
              const i =
                  r.getElementById("tape")?.getBoundingClientRect().height || 0,
                d =
                  r.getElementById("dt393-global-head")?.getBoundingClientRect()
                    .height || 0,
                l = Math.max(
                  0,
                  s.getBoundingClientRect().top + window.scrollY - i - d - 12,
                );
              window.scrollTo({ top: l, behavior: "auto" });
            }, 85);
        },
        !0,
      ),
      typeof render0 == "function")
    ) {
      const t = render0;
      render0 = function () {
        r.getElementById("app")?.removeAttribute("data-dt393-decorated");
        const e = t.apply(this, arguments);
        return (j(), e);
      };
    } else if (typeof render == "function") {
      const t = render;
      render = function () {
        r.getElementById("app")?.removeAttribute("data-dt393-decorated");
        const e = t.apply(this, arguments);
        return (j(), e);
      };
    }
    r.readyState === "loading"
      ? r.addEventListener("DOMContentLoaded", () => setTimeout(j, 90), {
          once: !0,
        })
      : setTimeout(j, 90);
  })();
} catch (e) {
  console.error("[v522] falha em design-v402.js", e);
}
try {
  (() => {
    "use strict";
    const d = document,
      Q = "#app .dt395-native-mercado",
      H = {
        cq: "Cotações e Panorama",
        mu: "Cotações e Panorama",
        nt: "Notícias e balanços",
        ag: "Agenda",
        lab: "Análises",
        jr: "Jornal e Giro",
        pn: "Painel",
        giro: "Jornal e Giro",
      },
      R = [
        ["cq", "Cotações"],
        ["nt", "Notícias"],
        ["ag", "Agenda"],
        ["lab", "Análises"],
        ["ls", "Long & Short"],
      ],
      l = { p: "1A", first: "SPX", second: "NDX", full: !1 },
      X = (e) =>
        ({
          chart: '<path d="M3 19V5m0 14h18M6 15l5-6 4 3 5-7"/>',
          search: '<circle cx="10.7" cy="10.7" r="7"/><path d="m16 16 5 5"/>',
          grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
          list: '<path d="M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1"/>',
          expand: '<path d="M9 3H3v6M15 3h6v6M3 15v6h6M21 15v6h-6"/>',
          right: '<path d="m9 5 7 7-7 7"/>',
          sliders:
            '<path d="M3 7h18M3 17h18"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
          refresh:
            '<path d="M20 6v5h-5M4 18v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 5M18.5 15A7 7 0 0 1 6 18l-2-5"/>',
        })[e] || "",
      h = (e, t = 17) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${X(e)}</svg>`,
      u = (e) =>
        String(e ?? "").replace(
          /[&<>"']/g,
          (t) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[t],
        ),
      y = (e) =>
        Number(e).toLocaleString("pt-BR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 2,
        });
    function q() {
      return typeof MKT == "object" ? MKT.tab : "cq";
    }
    function V(e) {
      let t = e.querySelector(":scope > .m403-section-header");
      t ||
        ((t = d.createElement("div")),
        (t.className = "m403-section-header"),
        e.prepend(t));
      const a = q();
      ((t.innerHTML = `<nav class="m403-primary-tabs" aria-label="Páginas do Mercado">${R.map(([r, c]) => `<button type="button" data-navroute="mercado:${r}" ${(a === r || r === 'nt' && a === 'jr' || r === 'lab' && a === 'sazus') ? 'class="on" aria-current="page"' : ""}>${u(c)}</button>`).join("")}</nav><div class="m403-session-caption"><span>INTELIGÊNCIA DE MERCADO</span><strong>${u(H[a] || "Mercado")}</strong><small>Brasil e Estados Unidos · somente consulta</small></div>`),
        (e.dataset.m403Sub = a));
    }
    function G(e) {
      const t = e.querySelector(":scope > .cqtabs");
      if (t) {
        if (
          (t.setAttribute("aria-label", "Categorias de ativos"),
          !t.querySelector('[data-cqa="fav"]'))
        ) {
          const a = d.createElement("button");
          ((a.type = "button"),
            (a.dataset.cqa = "fav"),
            (a.textContent = "Favoritos"),
            t.prepend(a));
        }
        for (const a of t.querySelectorAll("button"))
          (a.dataset.cqa === "adr" && (a.textContent = "ADRs"),
            a.classList.toggle(
              "on",
              a.dataset.cqa === (typeof CQ == "object" ? CQ.aba : "us"),
            ),
            a.setAttribute("aria-pressed", String(a.classList.contains("on"))));
      }
    }
    function E() {
      try {
        return Array.isArray(CQ?.d?.[CQ.aba]?.itens)
          ? CQ.d[CQ.aba].itens.length
          : 0;
      } catch {
        return 0;
      }
    }
    function W(e) {
      let t = e.querySelector(".m403-cq-status");
      if (!t) {
        ((t = d.createElement("div")), (t.className = "m403-cq-status"));
        const n = e.querySelector(".cqbar");
        n ? n.before(t) : e.appendChild(t);
      }
      const a = typeof CQ == "object" ? CQ.d?.[CQ.aba] : null;
      let r = a?.em || null,
        c =
          r && !Number.isNaN(Date.parse(r))
            ? new Date(r).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "não informada";
      t.innerHTML = `<span>${h("chart")} <strong>${E()} ativos</strong> nesta categoria</span><small>Fonte: ${u(a?.fonte || "fontes configuradas no aplicativo")} · consulta: ${u(c)}</small>`;
    }
    function nt(e) {
      return [...e.querySelectorAll(".cql > .cqr")];
    }
    function ct(e) {
      const t = e.querySelector(".cqv")?.textContent || "",
        a = parseFloat(
          t
            .replace(/[^\d,.-]/g, "")
            .replace(/\./g, "")
            .replace(",", "."),
        );
      return Number.isFinite(a) ? a : 0;
    }
    function U(e) {
      let t = e.querySelector(".m403-sortbar");
      t ||
        ((t = d.createElement("div")),
        (t.className = "m403-sortbar"),
        e.querySelector(".cqbar")?.before(t));
      const a = typeof CQ == "object" ? CQ.ord : "lista",
        r = typeof CQ == "object" ? CQ.vis : "lista";
      t.innerHTML = `<div class="m403-sort-left"><span class="m403-sort-label">Ordenar</span>${[
        ["lista", "Ordem"],
        ["alta", "Altas"],
        ["baixa", "Quedas"],
      ]
        .map(
          ([n, m]) =>
            `<button type="button" data-cqo="${n}" class="${a === n ? "on" : ""}" aria-pressed="${a === n}">${m}</button>`,
        )
        .join(
          "",
        )}</div><div class="m403-sort-right"><button type="button" data-cqv="lista" class="${r !== "mapa" ? "on" : ""}" aria-pressed="${r !== "mapa"}">${h("list")} Lista</button><button type="button" data-cqv="mapa" class="${r === "mapa" ? "on" : ""}" aria-pressed="${r === "mapa"}">${h("grid")} Mapa</button></div>`;
      const c = e.querySelector(".cqbar");
      c &&
        (c.classList.add("m403-native-bar"),
        c.querySelectorAll(".cqord").forEach((n) => (n.hidden = !0)));
    }
    function w(e) {
      try {
        const a = (typeof TRM < "u" ? TRM : window.TRM)?.tec,
          r = {
            SPX: ["SPX", "SP500", "US500", "SPX500"],
            NDX: ["NDX", "USTEC", "NAS100", "NASDAQ"],
            IBOV: ["IBOV", "IBOVESPA", "IBOV G"],
            EWZ: ["EWZ"],
          };
        for (const c of r[e] || [e]) {
          const n = a?.velas?.(c, "1d")?.L;
          if (!Array.isArray(n)) continue;
          const m = n
            .map((o) => {
              const p = Number(Array.isArray(o) ? o[0] : o?.time),
                b = Number(Array.isArray(o) ? o[4] : o?.close);
              return { t: p < 1e12 ? p * 1e3 : p, v: b };
            })
            .filter(
              (o) =>
                Number.isFinite(o.t) &&
                o.t > 0 &&
                Number.isFinite(o.v) &&
                o.v > 0,
            )
            .sort((o, p) => o.t - p.t);
          if (m.length >= 3) return m;
        }
      } catch (t) {
        console.debug("Histórico do Mercado não carregado", t);
      }
      return [];
    }
    function Z(e) {
      return (
        {
          "1D": 2,
          "3M": 92,
          "6M": 184,
          "1A": 366,
          "3A": 1098,
          "5A": 1830,
          Máx: 36500,
        }[e] || 366
      );
    }
    function C() {
      const e = w(l.first),
        t = w(l.second),
        a = Date.now() - Z(l.p) * 864e5,
        r = e.filter((s) => s.t >= a),
        c = t.filter((s) => s.t >= a),
        n = new Map(
          r.map((s) => [new Date(s.t).toISOString().slice(0, 10), s.v]),
        ),
        m = new Map(
          c.map((s) => [new Date(s.t).toISOString().slice(0, 10), s.v]),
        ),
        o = [...n.keys()].filter((s) => m.has(s)).sort(),
        p = o.length >= 3,
        b = ["1D", "3M", "6M", "1A", "3A", "5A", "Máx"],
        _ = `<div class="m403-chart-title">${h("chart")} <strong>Desempenho comparativo</strong><button type="button" data-m403-expand aria-label="Expandir gráfico">${h("expand", 18)}</button></div><div class="m403-chart-options"><label>Primeiro ativo <select data-m403-first>${[
          ["SPX", "S&P 500"],
          ["NDX", "Nasdaq 100"],
          ["IBOV", "Ibovespa"],
          ["EWZ", "EWZ"],
        ]
          .map(
            ([s, f]) =>
              `<option value="${s}" ${l.first === s ? "selected" : ""}>${f}</option>`,
          )
          .join(
            "",
          )}</select></label><label>Comparar <select data-m403-second>${[
          ["NDX", "Nasdaq 100"],
          ["SPX", "S&P 500"],
          ["IBOV", "Ibovespa"],
          ["EWZ", "EWZ"],
        ]
          .map(
            ([s, f]) =>
              `<option value="${s}" ${l.second === s ? "selected" : ""}>${f}</option>`,
          )
          .join(
            "",
          )}</select></label><span class="m403-scale">Base 100</span></div><div class="m403-chart-period" role="group" aria-label="Período do gráfico">${b.map((s) => `<button type="button" data-m403-period="${s}" ${l.p === s ? 'class="on" aria-pressed="true"' : ""}>${s}</button>`).join("")}</div>`;
      let N = "";
      if (p) {
        const s = o.map((i) => (100 * n.get(i)) / n.get(o[0])),
          f = o.map((i) => (100 * m.get(i)) / m.get(o[0])),
          T = s.concat(f),
          x = Math.min(96, ...T),
          S = Math.max(104, ...T),
          P = (S - x) * 0.12 || 1,
          B = 1e3,
          M = 360,
          Y = 50,
          tt = 24,
          et = B - 90,
          at = M - 60,
          A = (i) => Y + (i / (o.length - 1)) * et,
          v = (i) => tt + ((S + P - i) / (S - x + 2 * P)) * at,
          j = (i) =>
            i
              .map(
                (g, O) =>
                  `${O ? "L" : "M"}${A(O).toFixed(1)} ${v(g).toFixed(1)}`,
              )
              .join(" "),
          rt = j(s),
          I = j(f),
          F = v(100),
          ot = u(JSON.stringify(o.map((i, g) => [i, s[g], f[g]]))),
          st = Array.from({ length: 6 }, (i, g) => x + ((S - x) * g) / 5);
        N = `<svg class="m403-line-chart" data-m403-points="${ot}" viewBox="0 0 ${B} ${M}" role="img" aria-label="Comparação histórica real de ${u(l.first)} e ${u(l.second)} em base cem, de ${o[0]} até ${o.at(-1)}"><defs><linearGradient id="m403-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#497ca9" stop-opacity=".3"/><stop offset="100%" stop-color="#497ca9" stop-opacity="0"/></linearGradient></defs>${st.map((i) => `<line x1="50" x2="960" y1="${v(i).toFixed(1)}" y2="${v(i).toFixed(1)}" stroke="#2a2c31" stroke-dasharray="2 6"/><text x="6" y="${(v(i) + 4).toFixed(1)}" fill="#aabbb4" font-size="15">${y(i)}</text>`).join("")}<line x1="50" x2="960" y1="${F}" y2="${F}" stroke="#747985" stroke-dasharray="4 5"/><path d="${I} L${A(o.length - 1)} ${M - 36} L${A(0)} ${M - 36} Z" fill="url(#m403-fade)"/><path d="${I}" fill="none" stroke="#6996bf" stroke-width="2.8" vector-effect="non-scaling-stroke"/><path d="${rt}" fill="none" stroke="#efeeeb" stroke-width="2.8" vector-effect="non-scaling-stroke"/>${[0, Math.floor((o.length - 1) / 2), o.length - 1].map((i) => `<text x="${A(i).toFixed(1)}" y="354" fill="#969ba4" font-size="14" text-anchor="middle">${o[i].slice(0, 7)}</text>`).join("")}<line class="m403-crosshair" x1="50" x2="50" y1="24" y2="325" hidden stroke="#d8ba82" stroke-width="1" stroke-dasharray="5 5"/></svg><div class="m403-chart-tooltip" role="status"></div><div class="m403-chart-legend"><span><i class="m403-dot first"></i>${u(l.first)} · ${y(s.at(-1))}</span><span><i class="m403-dot second"></i>${u(l.second)} · ${y(f.at(-1))}</span><small>${o.length} pregões em comum · ${u(o[0])} a ${u(o.at(-1))}</small></div>`;
      } else
        N = `<div class="m403-emptychart" role="status"><svg viewBox="0 0 700 240" aria-hidden="true" preserveAspectRatio="none"><defs><pattern id="m403-grid" width="70" height="40" patternUnits="userSpaceOnUse"><path d="M 70 0 L 0 0 0 40" fill="none" stroke="#2c2f33" stroke-width="1" stroke-dasharray="2 4"/></pattern></defs><rect width="700" height="240" fill="url(#m403-grid)"/></svg><p><strong>Histórico comparável ainda não disponível</strong><span>Precisamos de candles reais dos dois ativos para desenhar as curvas. Nenhum preço foi inventado.</span><button type="button" data-navroute="graf">Abrir gráficos com dados disponíveis ${h("right", 16)}</button></p></div>`;
      return `<section class="m403-chart-card" aria-label="Gráfico comparativo do Mercado">${_}<div class="m403-chart-canvas">${N}</div><footer>Fonte: histórico diário disponível no Terminal. Comparação somente nas datas comuns, sem projeções.</footer></section>`;
    }
    function z(e) {
      let t = e.querySelector(":scope > .m403-chart-slot");
      if (!t) {
        t = d.createElement("div");
        const r = e.querySelector(".cql, .cqmap, #adr, .vazio119");
        (r ? r.before(t) : e.append(t), (t.className = "m403-chart-slot"));
      }
      if (!0) {
        t.querySelector(":scope > .m403-chart-card") ||
          (t.innerHTML =
            '<section class="m403-chart-card m409-chart-card" aria-label="Gráfico comparativo do Mercado"></section>');
        return;
      }
      t.innerHTML = C();
    }
    function J(e) {
      const t = e.querySelector(".market-monitor");
      if (!t) return;
      const a = t.querySelector("#cotbox,#cqbox");
      if (!a || a.classList.contains("market-quotes")) return;
      if (
        (t.classList.add("m403-quotes"),
        G(a),
        a.id === "cqbox" &&
          !a.querySelector(".cq388-searchbar") &&
          !a.querySelector(".m403-searchbar"))
      ) {
        const c = d.createElement("label");
        ((c.className = "m403-searchbar"),
          (c.innerHTML = `${h("search")}<input type="search" data-m403-search placeholder="Buscar ticker ou empresa" aria-label="Buscar ticker ou empresa"><span class="m403-inline-count">${E()} ativos</span>`),
          a.querySelector(".cqtabs")?.after(c));
      }
      (W(a),
        U(a),
        z(a),
        t
          .querySelectorAll("h2, :scope > p.mut")
          .forEach((c) => c.classList.add("m403-hide-intro")));
      const r = a.querySelector(":scope > .sm.mut[style]");
      r && r.classList.add("m403-source-note");
    }
    function k() {
      if (typeof tab > "u" || tab !== "mercado") return;
      const e = d.querySelector(Q);
      if (!e) return;
      // Alertas reutiliza o serviço MKT, mas sua página é de Configurações.
      // Não montar abas de Mercado para depois escondê-las com CSS concorrente.
      if (q() === "al") {
        e.querySelector(":scope > .m403-section-header")?.remove();
        e.dataset.m403Sub = "al";
        delete e.dataset.m403Done;
        return;
      }
      const t = e.querySelector("#cotbox,#cqbox");
      ((r) =>
        r.dataset.m403Done === q() && (!t || t.dataset.m403Ready === "true"))(
        e,
      ) ||
        (e
          .querySelectorAll(
            ":scope > .platform-area,:scope > .m355-market-head",
          )
          .forEach((r) => r.classList.add("m403-oldheading")),
        V(e),
        q() === "cq" && (J(e), t && (t.dataset.m403Ready = "true")),
        (e.dataset.m403Done = q()));
    }
    let L = !1;
    function $() {
      L ||
        ((L = !0),
        setTimeout(() => {
          ((L = !1), k());
        }, 0));
    }
    (window.TraderUI?.onRender &&
      window.TraderUI.onRender("mercado-v403", () => {
        try {
          k();
        } catch (e) {
          console.warn("Mercado: cabeçalho", e);
        }
      }),
      d.addEventListener(
        "click",
        (e) => {
          e.target.closest?.('[data-dt393-route="mercado"]') &&
            typeof MKT == "object" &&
            (MKT.tab = "cq");
        },
        !0,
      ));
    const K = new MutationObserver((e) => {
        typeof tab > "u" ||
          tab !== "mercado" ||
          (e.some((t) =>
            [...t.addedNodes].some(
              (a) =>
                a.nodeType === 1 &&
                (a.matches?.("#cotbox,#cqbox,.dt393-native") ||
                  a.querySelector?.("#cotbox,#cqbox,.dt393-native")),
            ),
          ) &&
            $());
      }),
      D = () => {
        const e = d.getElementById("app");
        (e && K.observe(e, { childList: !0, subtree: !0 }), $());
      };
    (d.readyState === "loading"
      ? d.addEventListener("DOMContentLoaded", D, { once: !0 })
      : D(),
      d.addEventListener("click", (e) => {
        const t = e.target.closest("[data-m403-period],[data-m403-expand]");
        if (t) {
          (e.preventDefault(),
            t.dataset.m403Period
              ? (l.p = t.dataset.m403Period)
              : (l.full = !l.full));
          const a = t.closest(".m403-chart-card");
          if ((a?.classList.toggle("m403-chart-expanded", l.full), a)) {
            const r = a.parentElement;
            ((r.innerHTML = C()),
              r
                .querySelector(".m403-chart-card")
                ?.classList.toggle("m403-chart-expanded", l.full));
          }
          return;
        }
        if (e.target.closest("[data-cqa]")) {
          $();
          return;
        }
        if (e.target.closest("[data-cqo],[data-cqv]")) {
          $();
          return;
        }
      }),
      d.addEventListener("change", (e) => {
        if (e.target.matches?.("[data-m403-first],[data-m403-second]")) {
          l[e.target.hasAttribute("data-m403-first") ? "first" : "second"] =
            e.target.value;
          const t = e.target.closest(".m403-chart-slot");
          t && (t.innerHTML = C());
        }
      }),
      d.addEventListener("pointermove", (e) => {
        const t = e.target.closest?.(".m403-line-chart");
        if (t)
          try {
            const a = JSON.parse(t.dataset.m403Points || "[]");
            if (!a.length) return;
            const r = t.getBoundingClientRect(),
              c = ((e.clientX - r.left) / r.width) * 1e3,
              n = Math.max(
                0,
                Math.min(
                  a.length - 1,
                  Math.round(((c - 50) / 910) * (a.length - 1)),
                ),
              ),
              m = 50 + (n / (a.length - 1)) * 910,
              o = t.querySelector(".m403-crosshair");
            o &&
              ((o.hidden = !1),
              o.setAttribute("x1", String(m)),
              o.setAttribute("x2", String(m)));
            const p = t.parentElement.querySelector(".m403-chart-tooltip");
            if (p) {
              const b = a[n];
              ((p.textContent =
                b[0] +
                " · " +
                l.first +
                " " +
                y(b[1]) +
                " · " +
                l.second +
                " " +
                y(b[2])),
                (p.style.display = "block"));
            }
          } catch {}
      }),
      d.addEventListener("pointerout", (e) => {
        const t = e.target.closest?.(".m403-line-chart");
        if (!t || t.contains(e.relatedTarget)) return;
        const a = t.querySelector(".m403-crosshair");
        a && (a.hidden = !0);
        const r = t.parentElement.querySelector(".m403-chart-tooltip");
        r && (r.style.display = "none");
      }),
      d.addEventListener("input", (e) => {
        if (!e.target.matches?.("[data-m403-search]")) return;
        const t = e.target.value
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
        let a = 0;
        const r = e.target.closest(".m403-quotes");
        r?.querySelectorAll(".cqr").forEach((n) => {
          const m = n.textContent
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          ((n.hidden = !m.includes(t)), n.hidden || a++);
        });
        const c = r?.querySelector(".m403-inline-count");
        c && (c.textContent = a + " ativos");
      }));
  })();
} catch (e) {
  console.error("[v522] falha em mercado-v403.js", e);
}
try {
  (() => {
    "use strict";
    const m = document,
      b = {
        mu: {
          name: "Panorama global",
          icon: "◎",
          intro:
            "Brasil, Estados Unidos, setores e juros em uma única visão de consulta.",
          panels: [
            ["market-watch-shortcut", "EWZ e ADRs brasileiras"],
            ["m404-mundo", "Radar global"],
            ["m404-setores", "Desempenho setorial"],
            ["mujr", "Juros e curva DI"],
          ],
        },
        nt: {
          name: "Notícias de mercado",
          icon: "▤",
          intro:
            "Filtre as manchetes e acompanhe as fontes e os horários informados.",
          panels: [["m404-main", "Notícias e filtros"]],
        },
        ag: {
          name: "Agenda econômica",
          icon: "▦",
          intro:
            "Calendário econômico com país, relevância, consenso e horário, quando fornecidos.",
          panels: [["m404-main", "Eventos e filtros"]],
        },
        lab: {
          name: "Análises e sazonalidade",
          icon: "⌁",
          intro:
            "Sentimento, ciclos e estudos com referência às fontes e aos períodos.",
          panels: [["m404-main", "Análises de mercado"]],
        },
        jr: {
          name: "Jornal do Pregão",
          icon: "▥",
          intro:
            "Notícias diárias e revista técnica, mantendo a origem dos dados identificada.",
          panels: [
            ["m404-revista", "Revista de fim de semana"],
            ["m404-jornal", "Jornal diário"],
          ],
        },
      };
    let g = !1;
    const u = () => m.querySelector("#app .dt395-native-mercado");
    function p() {
      try {
        return (
          (typeof tab < "u" &&
            tab === "mercado" &&
            typeof MKT == "object" &&
            MKT.tab) ||
          ""
        );
      } catch {
        return "";
      }
    }
    function s(e, t, a) {
      const n = m.createElement(e);
      return (t && (n.className = t), a && (n.textContent = a), n);
    }
    function L(e, t, a) {
      const n =
        t === "m404-main"
          ? [...e.children].find((r) => r.matches?.(".card,.sw9"))
          : t === "m404-mundo"
            ? [...e.children].find(
                (r) => r.matches?.(".card") && r.id !== "market-watch-shortcut",
              )
            : t === "m404-setores"
              ? [...e.children].filter((r) => r.matches?.(".card"))[2]
              : t === "m404-revista"
                ? [...e.children].find(
                    (r) =>
                      r.matches?.(".card") && !r.classList.contains("jrcard"),
                  )
                : t === "m404-jornal"
                  ? e.querySelector(".jrcard")
                  : e.querySelector("#" + t);
      return n && n.matches?.(".m404-intro,.m403-section-header")
        ? null
        : n
          ? (n.classList.add("m404-panel"),
            n.id || (n.id = "m404-panel-" + t),
            (n.dataset.m404Section = a),
            n.id)
          : null;
    }
    function I() {
      const e = u(),
        t = p(),
        a = b[t];
      if (
        !e ||
        t === "lab" ||
        !a ||
        (e.dataset.m404Sub === t && e.querySelector(".m404-overview"))
      )
        return;
      (e.classList.add("m404-internal"), (e.dataset.m404Sub = t));
      const n = a.panels
          .map(([d, f]) => ({ id: L(e, d, f), label: f }))
          .filter((d) => d.id),
        r = e.querySelector(".m404-overview");
      r && r.remove();
      const o = s("section", "m404-overview");
      o.setAttribute("aria-label", "Visão geral de " + a.name);
      const c = s(
          "div",
          "m404-overview-eyebrow",
          "MERCADO  /  INTELIGÊNCIA E CONSULTA",
        ),
        i = s("div", "m404-overview-heading"),
        l = s("span", "m404-overview-icon", a.icon);
      l.setAttribute("aria-hidden", "true");
      const h = s("h2", "", a.name);
      i.append(l, h);
      const y = s("p", "", a.intro),
        N = s(
          "div",
          "m404-overview-note",
          "Dados exibidos somente quando disponíveis nas fontes conectadas.",
        ),
        v = s("div", "m404-panel-nav");
      (v.setAttribute("role", "navigation"),
        v.setAttribute("aria-label", "Acesso rápido aos painéis da página"));
      for (const d of n) {
        const f = s("button", "m404-panel-link", d.label + "  ↗");
        ((f.type = "button"), (f.dataset.m404Jump = d.id), v.append(f));
      }
      if (!n.length) {
        const d = s(
          "span",
          "m404-no-panels",
          "Painéis carregados diretamente abaixo.",
        );
        v.append(d);
      }
      o.append(c, i, y, N, v);
      const C = e.querySelector(".m403-section-header");
      C ? C.after(o) : e.prepend(o);
    }
    function q() {
      const e = u();
      if (!e) return;
      const t = p();
      if (!b[t]) {
        (e.classList.remove("m404-internal"),
          e.removeAttribute("data-m404-sub"));
        return;
      }
      I();
    }
    function S() {
      if (p() !== "cq") return;
      const e = u()?.querySelector(".m403-chart-card .m403-emptychart p");
      if (!e || e.querySelector("[data-m404-history]")) return;
      const t =
        e.querySelector('button[data-navroute="graf"]') ||
        s("button", "m404-history-btn");
      (t.removeAttribute("data-navroute"),
        (t.dataset.m404History = ""),
        t.classList.add("m404-history-btn"),
        (t.type = "button"),
        (t.textContent = "↻  Consultar histórico real"),
        t.isConnected || e.append(t));
    }
    function T() {
      const e = u()?.querySelector(".m403-chart-card [data-m403-first]");
      e && e.dispatchEvent(new Event("change", { bubbles: !0 }));
    }
    async function D(e) {
      if (g) return;
      const t = window.TRM?.tec;
      if (!t?.pegaVelas) {
        e.textContent = "Histórico ainda não disponível";
        return;
      }
      const a = e.closest(".m403-chart-card"),
        n = [
          a?.querySelector("[data-m403-first]")?.value,
          a?.querySelector("[data-m403-second]")?.value,
        ],
        r = {
          SPX: ["SPX", "SP500", "US500"],
          NDX: ["NDX", "USTEC", "NASDAQ"],
          IBOV: ["IBOV"],
          EWZ: ["EWZ"],
        };
      ((g = !0),
        (e.disabled = !0),
        (e.textContent = "Consultando duas séries…"));
      try {
        const o = [];
        for (const c of new Set(n.filter(Boolean))) {
          let i = !1;
          for (const l of r[c] || [c])
            try {
              const h = t.velas?.(l, "1d")?.L;
              if (Array.isArray(h) && h.length >= 3) {
                i = !0;
                break;
              }
              await t.pegaVelas(l, "1d");
              const y = t.velas?.(l, "1d")?.L;
              if (Array.isArray(y) && y.length >= 3) {
                i = !0;
                break;
              }
            } catch {
              console.info(
                "Mercado: origem de histórico indisponível para " + l,
              );
            }
          o.push(i);
        }
        if ((T(), !o.every(Boolean))) {
          const c = u()?.querySelector(".m403-emptychart p");
          if (c) {
            let i = c.querySelector(".m404-history-status");
            (i || ((i = s("span", "m404-history-status")), c.append(i)),
              (i.textContent =
                "Ainda não foi possível carregar as duas séries. Verifique sua conta e a fonte de histórico."));
          }
        }
      } finally {
        g = !1;
        const o = u()?.querySelector("[data-m404-history]");
        (o && ((o.disabled = !1), (o.textContent = "↻  Tentar novamente")),
          setTimeout(S, 50));
      }
    }
    let w = !1;
    function A() {
      w ||
        ((w = !0),
        setTimeout(() => {
          ((w = !1), q(), S());
        }, 60));
    }
    window.TraderUI?.onRender &&
      window.TraderUI.onRender("mercado-v404", () => {
        try {
          (q(), S());
        } catch (e) {
          console.warn("Mercado: painéis", e);
        }
      });
    const E = () => {
      const e = m.getElementById("app");
      (e &&
        new MutationObserver((a) => {
          if (p() !== "cq" && !b[p()]) return;
          a.some((r) =>
            [...r.addedNodes].some(
              (o) =>
                o.nodeType === 1 &&
                (o.matches?.(".dt395-native-mercado,.m403-emptychart") ||
                  o.querySelector?.(".dt395-native-mercado,.m403-emptychart")),
            ),
          ) && A();
        }).observe(e, { childList: !0, subtree: !0 }),
        A());
    };
    (m.readyState === "loading"
      ? m.addEventListener("DOMContentLoaded", E, { once: !0 })
      : E(),
      m.addEventListener(
        "click",
        (e) => {
          const t = e.target.closest("[data-m404-jump]");
          if (t) {
            (e.preventDefault(),
              m
                .getElementById(t.dataset.m404Jump)
                ?.scrollIntoView({
                  behavior: matchMedia("(prefers-reduced-motion: reduce)")
                    .matches
                    ? "instant"
                    : "smooth",
                  block: "start",
                }));
            return;
          }
          const a = e.target.closest("[data-m404-history]");
          a && (e.preventDefault(), D(a));
        },
        !1,
      ));
  })();
} catch (e) {
  console.error("[v522] falha em mercado-v404.js", e);
}
try {
  (() => {
    "use strict";
    const m = document,
      U = "#app .dt395-native-mercado",
      q = { deep: !1, refreshing: !1 },
      re = (e, t) => Array.from(e?.querySelectorAll(t) || []),
      o = (e, t, n) => {
        const r = m.createElement(e);
        return (t && (r.className = t), n !== void 0 && (r.textContent = n), r);
      },
      u = (e) =>
        e != null && e !== "" && Number.isFinite(Number(e)) ? Number(e) : null,
      w = (e, t = 2) =>
        e === null
          ? "—"
          : new Intl.NumberFormat("pt-BR", {
              maximumFractionDigits: t,
              minimumFractionDigits: t === 0 ? 0 : Math.min(2, t),
            }).format(e),
      V = (e, t) =>
        e === null
          ? "—"
          : `${e > 0 ? "+" : ""}${w(e, t ? 1 : 2)} ${t ? "pb" : "%"}`,
      W = (e) => {
        if (!e) return "horário não informado";
        const t =
          typeof e == "number" ? new Date(e < 1e12 ? e * 1e3 : e) : new Date(e);
        return Number.isFinite(t.getTime())
          ? new Intl.DateTimeFormat("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "America/Sao_Paulo",
            }).format(t) + " BRT"
          : "horário não informado";
      };
    function K() {
      try {
        return typeof MDO < "u" && MDO?.v ? MDO.v : null;
      } catch {
        return null;
      }
    }
    function _(e) {
      const t = e?.mercados?.grupos || [];
      return Array.isArray(t)
        ? t
            .flatMap((n) =>
              Array.isArray(n?.itens)
                ? n.itens.map((r) => ({
                    ...r,
                    grupo: String(n.g || "Mercado"),
                  }))
                : [],
            )
            .filter((n) => n && n.s)
        : [];
    }
    const P = (e) =>
      String(e ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
    function X(e, t, n = []) {
      let r = e.find((a) => t.includes(P(a.s)));
      return (
        r || (r = e.find((a) => n.some((s) => s.test(P(a.n))))),
        r || null
      );
    }
    const H = {
      ibov: [["^BVSP", "IBOV", "IBOVESPA"], [/IBOVESPA/]],
      sp: [["^GSPC", "SPX", "SP500"], [/S&P.*500/]],
      nasdaq: [["^IXIC", "^NDX", "NDX", "NAS100"], [/NASDAQ/]],
      usd: [
        ["BRL=X", "USDBRL=X", "USD/BRL", "USDBRL"],
        [/DOLAR.*REAL/, /USD.*BRL/],
      ],
      ewz: [["EWZ"], [/EWZ/]],
      dxy: [
        ["DX-Y.NYB", "DXY", "DX=F"],
        [/DOLLAR INDEX/, /DOLAR.*INDEX/],
      ],
      spf: [
        ["ES=F", "SP500F", "SPFUT", "US500"],
        [/S&P.*FUT/, /S&P.*E-?MINI/],
      ],
      nqf: [
        ["NQ=F", "USTEC", "NQFUT"],
        [/NASDAQ.*FUT/, /NASDAQ.*E-?MINI/],
      ],
      dowf: [["YM=F", "DOWFUT"], [/DOW.*FUT/]],
      brent: [["BZ=F", "BRENT", "BRN"], [/BRENT/]],
      wti: [
        ["CL=F", "WTI"],
        [/WTI/, /PETROLEO WTI/],
      ],
      gold: [
        ["GC=F", "GOLD", "XAUUSD"],
        [/OURO/, /GOLD/],
      ],
      iron: [["FE=F", "IRON"], [/MINERIO/]],
      tenyear: [
        ["^TNX", "US10Y"],
        [/TREASURY.*10/, /10.*ANOS EUA/],
      ],
      di: [
        ["DI1", "DI1F27", "DI1F28", "DIFUT", "DI"],
        [/DI.*FUT/, /CURVA.*DI/],
      ],
      selic: [["SELIC"], [/SELIC/]],
    };
    function d(e, t) {
      const [n, r] = H[t];
      return X(e, n, r);
    }
    function O(e) {
      return !e || e.suspeito || u(e.px) === null || u(e.px) <= 0
        ? {
            text: e?.suspeito ? "Valor inconsistente" : "Sem cotação",
            className: "missing",
          }
        : { text: "Com dado", className: "ready" };
    }
    function ee(e = {}) {
      const { item: t, name: n, descriptor: r = "" } = e,
        a = o("div", "m405-quote"),
        s = O(t);
      a.dataset.panoramaSymbol = String(t?.s || "");
      s.className === "missing" && a.classList.add("is-missing");
      const l = o("div", "m405-quote-left"),
        T = o("strong", "m405-quote-name", n || t?.n || "Ativo"),
        v = o(
          "small",
          "m405-quote-desc",
          r || (t ? t.s : "Fonte não disponível"),
        );
      l.append(T, v);
      const I = o("div", "m405-quote-right"),
        g = u(t?.px),
        D = s.className === "ready",
        L = o(
          "strong",
          "m405-quote-value",
          D ? w(g, g >= 1e3 ? 0 : g >= 10 ? 2 : 4) + (t.juro ? "%" : "") : "—",
        ),
        p = t?.juro ? u(t?.d1bp) : u(t?.d1),
        N = o(
          "span",
          "m405-quote-delta " +
            (p === null || !D
              ? "neutral"
              : p > 0
                ? "up"
                : p < 0
                  ? "down"
                  : "neutral"),
          D ? V(p, !!t.juro) : s.text,
        );
      (I.append(L, N), a.append(l, I));
      const A = o("small", "m405-quote-source"),
        h = String(t?.fonte || "").trim(),
        $ = t?.horarioPreco || t?.em;
      return (
        (A.textContent = t
          ? `${h || "Fonte individual não informada"} · ${W($)}`
          : "Aguardando fonte conectada"),
        t || A.classList.add("unavailable"),
        a.append(A),
        a
      );
    }
    function E(e, t, n, r = "") {
      const a = o("section", "m405-card " + r);
      a.id = e;
      const s = o("header", "m405-card-header"),
        l = o("div", "m405-card-titles");
      return (
        l.append(o("h3", "", t)),
        n && l.append(o("small", "", n)),
        s.append(l),
        a.append(s),
        { n: a, h: s }
      );
    }
    function B(e, t) {
      const n = o("button", "m405-action", e);
      return ((n.type = "button"), (n.dataset.m405Action = t), n);
    }
    function S(e, t) {
      for (const n of t) e.append(ee(n));
    }
    function te(e, t) {
      const n = e?.mercados?.fontes,
        r =
          n && Number.isFinite(+n.tv) && Number.isFinite(+n.yahoo)
            ? `${n.tv} TradingView · ${n.yahoo} Yahoo`
            : "Origem: função macro",
        a = e?.mercados?.em || e?.em;
      return `${W(a)} · ${r}`;
    }
    function ae(e, t) {
      if (e.querySelector(".market-quotes")) return;
      const n = t === "cq",
        r = K(),
        a = _(r),
        s = o("section", "m405-dashboard");
      ((s.id = "m405-panorama"),
        s.setAttribute(
          "aria-label",
          "Painel profissional de Panorama do Mercado",
        ));
      const l = o("header", "m405-hero"),
        T = o("div", "m405-hero-top"),
        v = o("div", "m405-hero-title");
      (v.append(o("small", "m405-eyebrow", "MERCADO  /  BRASIL + EUA")),
        v.append(o("h2", "", n ? "Cotações e panorama" : "Panorama global")),
        v.append(
          o(
            "p",
            "",
            "Um painel de consulta para acompanhar o que move a B3 e os Estados Unidos.",
          ),
        ));
      const I = B("↻  Atualizar", "refresh");
      (I.classList.add("m405-refresh"), T.append(v, I), l.append(T));
      const g = o("div", "m405-data-status"),
        D = o("i", r ? "has-data" : "no-data");
      (D.setAttribute("aria-hidden", "true"),
        g.append(
          D,
          o(
            "span",
            "",
            r
              ? te(r, a)
              : "Sem dados da fonte macro · nenhuma cotação simulada",
          ),
        ),
        l.append(g),
        r?.mercados?.fontes?.suspeitos?.length &&
          l.append(
            o(
              "small",
              "m405-invalid",
              "A fonte sinalizou cotações inconsistentes. Elas aparecem indisponíveis.",
            ),
          ));
      const L = o("div", "m405-quick-ticks");
      ([
        ["ibov", "IBOV"],
        ["sp", "S&P 500"],
        ["nasdaq", "Nasdaq"],
        ["usd", "USD/BRL"],
      ].forEach(([i, f]) => {
        const c = d(a, i),
          y = o("div", "m405-quick-item");
        (y.append(o("small", "", f)),
          y.append(
            o(
              "strong",
              "",
              O(c).className === "ready"
                ? w(u(c.px), u(c.px) >= 1e3 ? 0 : 2)
                : "—",
            ),
          ));
        const F = c?.juro ? u(c.d1bp) : u(c?.d1);
        (y.append(
          o(
            "span",
            "m405-tick-change " +
              (F === null
                ? "neutral"
                : F > 0
                  ? "up"
                  : F < 0
                    ? "down"
                    : "neutral"),
            O(c).className === "ready" ? V(F, !!c.juro) : "Sem cotação",
          ),
        ),
          L.append(y));
      }),
        l.append(L));
      const p = o("nav", "m405-section-nav");
      (p.setAttribute("aria-label", "Ir para seção do panorama"),
        [
          ["m405-global", "Radar Global"],
          ["m405-adrs", "EWZ e ADRs"],
          ["m405-futures", "Futuros"],
          ["m405-commodities", "Commodities"],
          ["m405-rates", "Juros"],
        ].forEach(([i, f]) => {
          const c = B(f, "jump");
          ((c.dataset.m405Target = i), p.append(c));
        }),
        s.append(l),
        n || s.append(p));
      const N = o("div", "m405-grid"),
        A = E(
          "m405-global",
          "Radar global",
          "Principais bolsas, dólar e apetite ao risco",
          "m405-global",
        );
      S(A.n, [
        { item: d(a, "ibov"), name: "Ibovespa", descriptor: "Brasil · B3" },
        { item: d(a, "sp"), name: "S&P 500", descriptor: "Estados Unidos" },
        { item: d(a, "nasdaq"), name: "Nasdaq", descriptor: "Tecnologia EUA" },
        { item: d(a, "dxy"), name: "DXY", descriptor: "Índice do dólar" },
      ]);
      const h = E(
        "m405-adrs",
        "Brasil em Nova York",
        "ETF EWZ e ADRs brasileiras",
        "m405-adrs",
      );
      S(h.n, [
        { item: d(a, "ewz"), name: "EWZ", descriptor: "ETF Brasil · NYSE" },
      ]);
      const G = [
        ["PBR", "Petrobras"],
        ["VALE", "Vale"],
        ["ITUB", "Itaú"],
        ["BBD", "Bradesco"],
        ["ABEV", "Ambev"],
        ["GGB", "Gerdau"],
        ["SID", "CSN"],
        ["SUZ", "Suzano"],
        ["BSBR", "Santander"],
        ["WEGZY", "WEG"],
      ]
        .map(([i, f]) => ({ name: f, item: X(a, [i], []) }))
        .filter((i) => i.item);
      (G.length
        ? S(h.n, G.slice(0, 6))
        : h.n.append(
            o(
              "p",
              "m405-empty-note",
              "As ADRs detalhadas ficam na lista conectada do Monitor. Nenhum preço será preenchido sem fonte.",
            ),
          ),
        h.h.append(B("Abrir lista ↗", "adrs")));
      const Z = E(
        "m405-futures",
        "Futuros e câmbio",
        "Pré-mercado e sessão americana",
        "m405-futures",
      );
      S(Z.n, [
        {
          item: d(a, "spf"),
          name: "S&P 500 futuro",
          descriptor: "E-mini / contínuo",
        },
        {
          item: d(a, "nqf"),
          name: "Nasdaq futuro",
          descriptor: "E-mini Nasdaq",
        },
        { item: d(a, "dowf"), name: "Dow futuro", descriptor: "E-mini Dow" },
        { item: d(a, "usd"), name: "USD/BRL", descriptor: "Câmbio spot" },
      ]);
      const x = E(
        "m405-commodities",
        "Commodities",
        "Impacto sobre Vale, Petrobras e inflação",
        "m405-commodities",
      );
      S(x.n, [
        { item: d(a, "brent"), name: "Petróleo Brent" },
        { item: d(a, "wti"), name: "Petróleo WTI" },
        { item: d(a, "iron"), name: "Minério de ferro" },
        { item: d(a, "gold"), name: "Ouro" },
      ]);
      const M = E(
          "m405-rates",
          "Juros e curva DI",
          "Selic, Treasuries e contratos DI",
          "m405-rates",
        ),
        z = Array.isArray(r?.brasil?.ind)
          ? r.brasil.ind.find((i) => /SELIC/i.test(P(i.nome)))
          : null,
        oe = z
          ? {
              s: "SELIC",
              n: "Selic",
              px: u(z.v),
              fonte: "Banco Central",
              horarioPreco: r?.brasil?.em,
              juro: !0,
              d1bp: null,
            }
          : d(a, "selic");
      (S(M.n, [
        { item: oe, name: "Selic", descriptor: "Taxa de referência" },
        {
          item: d(a, "di"),
          name: "DI futuro",
          descriptor: "Curva de juros brasileira",
        },
        {
          item: d(a, "tenyear"),
          name: "Treasury 10 anos",
          descriptor: "Juros EUA",
        },
      ]),
        M.h.append(B("Abrir curva DI ↗", "rates")),
        N.append(A.n, h.n, Z.n, x.n, M.n));
      const R = o("aside", "m405-footer-note");
      if (
        (R.append(o("strong", "", "Dados e fontes")),
        R.append(
          o(
            "p",
            "",
            "As cotações dependem dos serviços configurados. Os horários e a origem exibidos são os informados pela fonte; não há garantia de tempo real.",
          ),
        ),
        n)
      ) {
        const i = o("details", "m406-radar-details");
        ((i.id = "m406-radar-details"),
          (i.open = !!q.radar),
          i.append(
            o(
              "summary",
              "m406-radar-summary",
              "▤  Abrir radar completo · EWZ, ADRs, futuros, commodities e juros",
            ),
          ),
          i.append(p, N, R),
          i.addEventListener("toggle", () => {
            q.radar = i.open;
          }),
          s.append(i));
        const f = Array.from(e.children).find((y) =>
          y.classList?.contains("market-monitor"),
        );
        f &&
          ((f.id = "m406-quotes"),
          f.setAttribute("aria-label", "Cotações, gráficos e lista de ativos"));
        const c = e.querySelector(":scope > .m403-section-header");
        (c ? c.after(s) : e.prepend(s),
          e.classList.add("m405-panorama", "m406-unified"),
          (e.dataset.m405Version = "405-cq"));
        return;
      }
      const b = o("details", "m405-deep");
      ((b.open = q.deep), (b.id = "m405-details"));
      const ne = o(
        "summary",
        "",
        "Explorar análises detalhadas, mapa de calor, setores e curva DI",
      );
      b.append(ne);
      for (const i of [...e.children])
        if (
          !(
            i === s ||
            i.classList?.contains("m403-section-header") ||
            i.classList?.contains("m404-overview") ||
            i.classList?.contains("m405-dashboard") ||
            i.classList?.contains("warn")
          )
        ) {
          if (
            i.matches?.(
              ".platform-area.m403-oldheading,.workbench-header.m403-oldheading,.mujump",
            )
          ) {
            ((i.hidden = !0), b.append(i));
            continue;
          }
          b.append(i);
        }
      s.append(N, R, b);
      const Q = e.querySelector(":scope > .m404-overview");
      Q && (Q.hidden = !0);
      const J = e.querySelector(":scope > .m403-section-header");
      (J ? J.after(s) : e.prepend(s),
        e.classList.add("m405-panorama"),
        (e.dataset.m405Version = "405"),
        b.addEventListener("toggle", () => {
          q.deep = b.open;
        }));
    }
    function j() {
      const e = m.querySelector(U);
      let t = "";
      try {
        t = typeof MKT == "object" ? MKT.tab : "";
      } catch {}
      !e ||
        !["mu", "cq"].includes(t) ||
        e.dataset.m405Version === (t === "cq" ? "405-cq" : "405") ||
        ae(e, t);
    }
    let C = !1;
    function k() {
      C ||
        ((C = !0),
        setTimeout(() => {
          C = !1;
          try {
            j();
          } catch (e) {
            console.error("Panorama v405: ", e);
          }
        }, 95));
    }
    window.TraderUI?.onRender &&
      window.TraderUI.onRender("panorama-v405", () => {
        try {
          j();
        } catch (e) {
          console.warn("Mercado: panorama", e);
        }
      });
    function Y() {
      const e = m.getElementById("app");
      (e &&
        new MutationObserver((n) => {
          n.some((a) =>
            [...a.addedNodes].some(
              (s) =>
                s.nodeType === 1 &&
                (s.matches?.(".dt395-native-mercado,.m404-overview") ||
                  s.querySelector?.(".dt395-native-mercado,.m404-overview")),
            ),
          ) && k();
        }).observe(e, { childList: !0, subtree: !0 }),
        k());
    }
    (m.readyState === "loading"
      ? m.addEventListener("DOMContentLoaded", Y, { once: !0 })
      : Y(),
      m.addEventListener("click", (e) => {
        const t = e.target.closest("[data-m405-action]");
        if (!t) return;
        const n = t.closest(".m405-dashboard");
        if (!n) return;
        e.preventDefault();
        const r = t.dataset.m405Action;
        if (r === "jump") {
          m.getElementById(t.dataset.m405Target)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          return;
        }
        if (r === "refresh") {
          const a = m.querySelector(`${U} [data-mdo="rf"]`);
          if (a) a.click();
          else
            try {
              if (typeof mdoCarrega == "function") {
                const s = mdoCarrega(!0);
                Promise.resolve(s).finally(k);
              }
            } catch (s) {
              console.warn("Panorama atualizar", s);
            }
          return;
        }
        if (r === "adrs") {
          const a = m.querySelector(`${U} [data-market-adrs]`);
          a
            ? a.click()
            : m
                .querySelector("#m406-quotes")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (r === "rates" || r === "sectors") {
          const a = n.querySelector(".m405-deep,.m406-radar-details");
          a && (a.open = !0);
          const s =
            r === "rates"
              ? m.querySelector("#mujr")
              : m.querySelector('[data-m404-section="Desempenho setorial"]');
          s &&
            setTimeout(
              () => s.scrollIntoView({ behavior: "smooth", block: "start" }),
              100,
            );
        }
      }));
  })();
} catch (e) {
  console.error("[v522] falha em panorama-v405.js", e);
}
try {
  (() => {
    "use strict";
    const doc = document,
      state = {
        news: "noticias",
        journal: (() => {
          try {
            return sessionStorage.getItem("diario-mercado-jornal-secao") ===
              "giro"
              ? "giro"
              : "jornal";
          } catch {
            return "jornal";
          }
        })(),
      },
      root = () => doc.querySelector("#app .dt395-native-mercado"),
      sub = () => {
        try {
          return typeof tab < "u" && tab === "mercado" && typeof MKT < "u"
            ? MKT.tab
            : "";
        } catch {
          return "";
        }
      },
      can = (name) => {
        try {
          return typeof eval(name) == "function";
        } catch {
          return !1;
        }
      },
      make = (e, o, n) => {
        const t = doc.createElement(e);
        return (o && (t.className = o), n && (t.textContent = n), t);
      };
    function focusCurrent(e) {
      try {
        e?.focus({ preventScroll: !0 });
      } catch {}
    }
    function section(e, o, n) {
      const t = make("section", "m406-section-switch");
      t.dataset.m406Switch = e;
      const a = make("div", "m406-switch-tabs");
      (a.setAttribute("role", "group"),
        a.setAttribute(
          "aria-label",
          e === "nt" ? "Seção de Notícias" : "Seção do Jornal",
        ));
      for (const [i, s] of n) {
        const r = make("button", "m406-switch-button", s);
        ((r.type = "button"),
          (r.dataset.m406Select = i),
          r.setAttribute("aria-pressed", String(o === i)),
          r.classList.toggle("on", o === i),
          a.append(r));
      }
      return (t.append(a), t);
    }
    function showMode(e, o) {
      const n = o === "nt",
        t = !n && state.journal === "giro",
        a = n && state.news === "balancos";
      ((e.dataset.m406View = n
        ? a
          ? "balancos"
          : "noticias"
        : t
          ? "giro"
          : "jornal"),
        e
          .querySelector(":scope > .m406-section-switch")
          ?.querySelectorAll("[data-m406-select]")
          .forEach((c) => {
            const l = c.dataset.m406Select === e.dataset.m406View;
            (c.classList.toggle("on", l),
              c.setAttribute("aria-pressed", String(l)));
          }),
        e.querySelectorAll(":scope > [data-m406-main]").forEach((c) => {
          c.hidden = a || t;
        }));
      const s = e.querySelector(":scope > .m406-content-host");
      s && (s.hidden = !(a || t));
      const r = e.querySelector(":scope > .m404-overview");
      if (r) {
        const c = r.querySelector(".m404-overview-heading h2");
        c &&
          (c.textContent = n
            ? "Notícias e balanços"
            : "Jornal e Giro do Pregão");
        const l = r.querySelector(".m404-panel-nav");
        l && (l.hidden = a || t);
        const d = r.querySelector("p");
        d &&
          (d.dataset.m406Original || (d.dataset.m406Original = d.textContent),
          (d.textContent = a
            ? "Empresas da B3: divulgações recentes, calendário e confirmações nas fontes conectadas."
            : t
              ? "Boletins de pré-abertura, durante o pregão e fechamento, com contexto e fontes."
              : d.dataset.m406Original));
      }
      if (!(!s || !(a || t))) {
        if (a) {
          try {
            typeof balHtml == "function"
              ? (s.innerHTML = balHtml())
              : (s.textContent =
                  "Calendário de balanços indisponível nesta versão.");
          } catch (c) {
            ((s.textContent =
              "Não foi possível apresentar o calendário de balanços."),
              console.warn("Balanços v406", c));
          }
          try {
            typeof balCarrega == "function" && balCarrega();
          } catch (c) {
            console.warn("Balanços v406: consulta", c);
          }
        } else if (t)
          try {
            typeof vGiro == "function"
              ? (s.innerHTML = vGiro())
              : (s.textContent = "Giro ainda não disponível nesta versão.");
          } catch (c) {
            ((s.textContent = "Não foi possível apresentar o Giro."),
              console.warn("Giro v406", c));
          }
      }
    }
    function mount() {
      const e = root(),
        o = sub();
      if (
        !e ||
        !["nt", "jr"].includes(o) ||
        (e.dataset.m406Sub === o &&
          e.querySelector(":scope > .m406-section-switch"))
      )
        return;
      if (
        ((e.dataset.m406Sub = o),
        e.classList.add("m406-content-page"),
        o === "jr")
      )
        try {
          state.journal =
            sessionStorage.getItem("diario-mercado-jornal-secao") === "giro"
              ? "giro"
              : "jornal";
        } catch {}
      const n = o === "nt" ? state.news : state.journal,
        t = section(
          o,
          n,
          o === "nt"
            ? [
                ["noticias", "Notícias"],
                ["balancos", "Balanços da B3"],
              ]
            : [
                ["jornal", "Jornal do Pregão"],
                ["giro", "Giro do mercado"],
              ],
        ),
        a = make("div", "m406-content-host");
      (a.setAttribute("aria-live", "polite"), (a.hidden = !0));
      const i = [...e.children].filter((r) =>
        r.matches?.(".card,.sw9,.jrcard"),
      );
      for (const r of i) r.dataset.m406Main = "";
      const s = e.querySelector(":scope > .m404-overview");
      if (s) s.after(t, a);
      else {
        const r = e.querySelector(":scope > .m403-section-header");
        r ? r.after(t, a) : e.prepend(t, a);
      }
      showMode(e, o);
    }
    let queued = !1;
    function schedule() {
      queued ||
        ((queued = !0),
        setTimeout(() => {
          queued = !1;
          try {
            mount();
          } catch (e) {
            console.warn("Mercado v406", e);
          }
        }, 60));
    }
    window.TraderUI?.onRender &&
      window.TraderUI.onRender("mercado-v406", () => {
        try {
          mount();
        } catch (e) {
          console.warn("Mercado: navegação", e);
        }
      });
    function init() {
      const e = doc.getElementById("app");
      (e &&
        new MutationObserver((o) => {
          ["nt", "jr"].includes(sub()) &&
            o.some((n) =>
              [...n.addedNodes].some(
                (t) =>
                  t.nodeType === 1 &&
                  (t.matches?.(".dt395-native-mercado") ||
                    t.querySelector?.(".dt395-native-mercado")),
              ),
            ) &&
            schedule();
        }).observe(e, { childList: !0, subtree: !0 }),
        schedule());
    }
    (doc.readyState === "loading"
      ? doc.addEventListener("DOMContentLoaded", init, { once: !0 })
      : init(),
      doc.addEventListener("click", (e) => {
        const o = e.target.closest?.("[data-m406-select]");
        if (!o) return;
        const n = o.closest(".dt395-native-mercado");
        if (!n) return;
        e.preventDefault();
        const t = o.dataset.m406Select,
          a = sub();
        if (a === "nt") state.news = t;
        else if (a === "jr") {
          state.journal = t;
          try {
            sessionStorage.setItem("diario-mercado-jornal-secao", t);
          } catch {}
        } else return;
        (showMode(n, a), focusCurrent(o));
      }));
    try {
      typeof GOR < "u" &&
        GOR &&
        ((GOR.bal = () => {
          state.news = "balancos";
          try {
            ((tab = "mercado"), (MKT.tab = "nt"), render());
          } catch {}
        }),
        (GOR.giro = () => {
          state.journal = "giro";
          try {
            sessionStorage.setItem("diario-mercado-jornal-secao", "giro");
          } catch {}
          try {
            ((tab = "mercado"), (MKT.tab = "jr"), render());
          } catch {}
        }));
    } catch (e) {
      console.warn("Mercado v406: atalhos", e);
    }
    try {
      if (typeof vMercado == "function") {
        const e = vMercado;
        vMercado = function () {
          try {
            if (MKT.tab === "mu" || MKT.tab === "cot") MKT.tab = "cq";
            else if (MKT.tab === "giro") {
              state.journal = "giro";
              try {
                sessionStorage.setItem("diario-mercado-jornal-secao", "giro");
              } catch {}
              MKT.tab = "jr";
            }
          } catch {}
          return e.apply(this, arguments);
        };
      }
    } catch (e) {
      console.warn("Mercado v406: aliases", e);
    }
  })();
} catch (e) {
  console.error("[v522] falha em mercado-v406.js", e);
}
try {
  (() => {
    "use strict";
    const s = document,
      h = () => s.querySelector("#app .dt395-native-mercado"),
      q = () => {
        try {
          return typeof tab < "u" && tab === "mercado" && MKT?.tab === "cq";
        } catch {
          return !1;
        }
      },
      k = () => q() && h()?.querySelector("#cqbox,#cotbox");
    function n(t, e, a) {
      const o = s.createElement(t);
      return ((o.className = e || ""), a != null && (o.textContent = a), o);
    }
    function M(t) {
      let e = t.querySelector(":scope > .m408-controls");
      e ||
        ((e = n("div", "m408-controls")),
        e.setAttribute("aria-label", "Ordenação e visualização das cotações"));
      const a = typeof CQ < "u" ? CQ.ord : "lista",
        o = typeof CQ < "u" ? CQ.vis : "lista";
      e.innerHTML = `<div class="m408-sort-left" role="group" aria-label="Ordenar ativos"><span class="m408-sort-caption">Ordenar</span>${[
        ["lista", "Ordem"],
        ["alta", "Altas"],
        ["baixa", "Quedas"],
      ]
        .map(
          ([d, f]) =>
            `<button type="button" data-cqo="${d}" class="${a === d ? "on" : ""}" aria-pressed="${a === d}">${f}</button>`,
        )
        .join(
          "",
        )}</div><div class="m408-sort-right" role="group" aria-label="Visualização"><button type="button" data-cqv="lista" class="${o !== "mapa" ? "on" : ""}" aria-pressed="${o !== "mapa"}">☷ <span>Lista</span></button><button type="button" data-cqv="mapa" class="${o === "mapa" ? "on" : ""}" aria-pressed="${o === "mapa"}">▦ <span>Mapa</span></button></div>`;
      const i = t.querySelector(":scope > .cqbar,:scope > .m403-sortbar"),
        c = t.querySelector(
          ":scope > .m403-chart-slot,:scope > .m408-workspace",
        );
      (c ? c.before(e) : t.append(e),
        i && i.classList.add("m408-legacy-toolbar"));
    }
    function S() {
      const t = h(),
        e = k(),
        a = t?.querySelector(".m405-dashboard"),
        o = t?.querySelector(":scope > .market-monitor");
      if (!t || !e || e.classList.contains("market-quotes") || !a || !o) return;
      (t.classList.add("m408-market-home"),
        !a.dataset.categoryReferences &&
          a.previousElementSibling !== o &&
          o.after(a));
      const i = t.querySelector(":scope > .warn");
      i && i.previousElementSibling !== a && a.after(i);
      let c = e.querySelector(":scope > .m408-context");
      c ||
        ((c = n("div", "m408-context")),
        (c.innerHTML =
          '<div class="m408-context-copy"><span class="m408-eyebrow">MERCADO / BRASIL + EUA</span><strong>Acompanhe seus ativos</strong></div><div class="m408-context-actions"><button type="button" data-m408-refresh aria-label="Atualizar as cotações">↻ Atualizar</button><button type="button" data-m408-radar aria-label="Abrir Radar Global">Radar Global <span aria-hidden="true">↗</span></button></div>'));
      const d = e.querySelector(":scope > .cqtabs");
      d ? d.before(c) : e.prepend(c);
      const f = e.querySelector(
        ":scope > .m403-searchbar,:scope > .cq388-searchbar",
      );
      if (f) {
        f.after(
          e.querySelector(":scope > .m408-controls") ||
            n("span", "m408-placeholder"),
        );
        const b = e.querySelector(":scope > .m408-placeholder");
        b && b.remove();
      }
      M(e);
      let l = e.querySelector(":scope > .m408-workspace");
      l || ((l = n("div", "m408-workspace")), e.append(l));
      let p = l.querySelector(":scope > .m408-chart-column");
      p ||
        ((p = n("section", "m408-chart-column")),
        p.setAttribute("aria-label", "Gráfico comparativo"),
        l.append(p));
      let r = l.querySelector(":scope > .m408-list-column");
      r ||
        ((r = n("section", "m408-list-column")),
        r.setAttribute("aria-label", "Lista e mapa de ativos"),
        l.append(r));
      const g = e.querySelector(":scope > .m403-chart-slot");
      (g && p.append(g),
        e
          .querySelectorAll(
            ":scope > .cql,:scope > .cqmap,:scope > #adr,:scope > .vazio119,:scope > .warn",
          )
          .forEach((b) => r.append(b)));
      const v = e.querySelector(":scope > .cqbar");
      v && (v.classList.add("m408-legacy-toolbar"), r.prepend(v));
      let u = r.querySelector(":scope > .m408-empty");
      const w = !!r.querySelector(
        ".cqr,.cqmap,#adr,.vazio119,.cqvazio,.card.cql",
      );
      !w && !u
        ? ((u = n("div", "m408-empty")),
          (u.innerHTML =
            "<strong>Nenhuma cotação disponível nesta categoria.</strong><p>Confira a conexão e selecione outra classe de ativos. Os valores aparecerão quando a fonte responder.</p>"),
          r.append(u))
        : w && u && u.remove();
      const x = e.querySelector(":scope > .m403-cq-status");
      x && r.append(x);
      const A = a.querySelector(".m405-hero-title h2");
      A && (A.textContent = "Radar Global e indicadores");
      const L = a.querySelector(".m405-hero-title p");
      L &&
        (L.textContent =
          "Brasil e EUA · EWZ, ADRs, futuros, commodities e juros");
      const E = a.querySelector(".m406-radar-summary");
      (E &&
        (E.textContent =
          "Explorar Radar Global completo — EWZ, ADRs, futuros, commodities e juros"),
        (t.dataset.m408Ready = "1"));
    }
    let y = !1;
    function m() {
      y ||
        ((y = !0),
        setTimeout(() => {
          y = !1;
          try {
            S();
          } catch (t) {
            console.warn("Mercado v408: composição", t);
          }
        }, 55));
    }
    window.TraderUI?.onRender &&
      window.TraderUI.onRender("mercado-v408", () => {
        try {
          S();
        } catch (t) {
          console.warn("Mercado v408: render", t);
        }
      });
    function C() {
      const t = s.querySelector("#app");
      t &&
        (new MutationObserver((e) => {
          q() &&
            e.some((a) =>
              [...a.addedNodes].some(
                (o) =>
                  o.nodeType === 1 &&
                  (o.matches?.(
                    "#cqbox,#cotbox,.market-monitor,.m405-dashboard,.cql,.cqmap,.cqr,.m403-chart-slot",
                  ) ||
                    o.querySelector?.(
                      "#cqbox,#cotbox,.market-monitor,.m405-dashboard",
                    )),
              ),
            ) &&
            m();
        }).observe(t, { childList: !0, subtree: !0 }),
        m());
    }
    (s.readyState === "loading"
      ? s.addEventListener("DOMContentLoaded", C, { once: !0 })
      : C(),
      s.addEventListener("click", (t) => {
        if (t.target.closest("[data-m408-radar]")) {
          t.preventDefault();
          const a = s.querySelector(".m408-market-home .m406-radar-details");
          a &&
            ((a.open = !0),
            a.scrollIntoView({ block: "start", behavior: "smooth" }));
        }
      }),
      s.addEventListener("click", (t) => {
        const e = t.target.closest("[data-m408-refresh]");
        if (!e || !q() || (t.preventDefault(), typeof cqCarrega != "function"))
          return;
        const a = typeof CQ < "u" ? CQ.aba : void 0;
        ((e.disabled = !0), (e.textContent = "Consultando…"));
        try {
          Promise.resolve(cqCarrega(a, !0))
            .catch((o) => console.warn("Mercado: atualização", o))
            .finally(() => {
              (e.isConnected &&
                ((e.disabled = !1), (e.textContent = "↻ Atualizar")),
                m());
            });
        } catch (o) {
          ((e.disabled = !1),
            (e.textContent = "↻ Atualizar"),
            console.warn("Mercado: atualização", o));
        }
      }),
      s.addEventListener("click", (t) => {
        t.target.closest("[data-cqa],[data-cqo],[data-cqv]") && m();
      }));
  })();
} catch (e) {
  console.error("[v522] falha em mercado-v408.js", e);
}
try {
  (() => {
    "use strict";
    const v = document,
      y = {
        SPX: "S&P 500",
        NDX: "NASDAQ 100",
        IBOV: "IBOVESPA",
        EWZ: "EWZ",
        AAPL: "APPLE",
        PETR4: "PETROBRAS",
        VALE3: "VALE",
      },
      R = {
        SPX: ["SPX", "SP500", "US500"],
        NDX: ["NDX", "USTEC", "NASDAQ"],
        IBOV: ["IBOV", "IBOVESPA"],
        EWZ: ["EWZ"],
        AAPL: ["AAPL"],
        PETR4: ["PETR4"],
        VALE3: ["VALE3"],
      },
      t = {
        first: "SPX",
        second: "NDX",
        period: "3A",
        range: "",
        freq: "1M",
        mode: "base",
        ma: "none",
        tab: "chart",
        grid: !0,
        fill: !0,
        full: !1,
        loading: !1,
        message: "",
        attempts: new Map(),
        last: null,
      },
      p = (a, e = 2) =>
        Number(a).toLocaleString("pt-BR", {
          minimumFractionDigits: e,
          maximumFractionDigits: e,
        }),
      f = (a) =>
        String(a ?? "").replace(
          /[&<>"']/g,
          (e) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[e],
        ),
      E = (a) => new Date(a).toISOString().slice(0, 10),
      F = () => new Date(),
      J = {
        "1D": 2,
        "3D": 4,
        "1M": 31,
        "6M": 184,
        YTD: null,
        "1A": 366,
        "3A": 1098,
        "5A": 1830,
        Máx: 2e4,
      };
    function D() {
      return (
        typeof tab < "u" &&
        tab === "mercado" &&
        typeof MKT < "u" &&
        MKT.tab === "cq"
      );
    }
    function K() {
      return v.querySelector("#app .dt395-native-mercado.m408-market-home");
    }
    function T() {
      return K()?.querySelector(".m408-chart-column .m403-chart-card");
    }
    function C(a) {
      const e = window.TRM?.tec;
      for (const s of R[a] || [a])
        try {
          const n = e?.velas?.(s, "1d")?.L;
          if (!Array.isArray(n)) continue;
          const r = n
              .map((o) => {
                const l = Number(Array.isArray(o) ? o[0] : (o?.time ?? o?.t)),
                  b = Number(Array.isArray(o) ? o[4] : (o?.close ?? o?.c)),
                  h = l < 1e12 ? l * 1e3 : l;
                return { date: h ? E(h) : "", close: b };
              })
              .filter((o) => o.date && Number.isFinite(o.close) && o.close > 0)
              .sort((o, l) => o.date.localeCompare(l.date)),
            i = new Map(r.map((o) => [o.date, o.close]));
          if (i.size >= 2)
            return [...i].map(([o, l]) => ({ date: o, close: l }));
        } catch (n) {
          console.debug("Mercado v409: histórico", n);
        }
      return [];
    }
    function Q(a) {
      const e = F();
      return a === "YTD"
        ? E(new Date(e.getFullYear(), 0, 1))
        : a === "Máx"
          ? "2000-01-01"
          : E(new Date(e.getTime() - (J[a] || 366) * 864e5));
    }
    function I() {
      return t.range
        ? { from: t.range.split("|")[0], to: t.range.split("|")[1] }
        : { from: Q(t.period), to: E(F()) };
    }
    function q() {
      const a = C(t.first),
        e = C(t.second),
        s = I(),
        n = new Map(
          a
            .filter((d) => d.date >= s.from && d.date <= s.to)
            .map((d) => [d.date, d.close]),
        ),
        r = new Map(
          e
            .filter((d) => d.date >= s.from && d.date <= s.to)
            .map((d) => [d.date, d.close]),
        );
      let i = [...n.keys()].filter((d) => r.has(d)).sort();
      if (t.freq !== "1D") {
        const d = (m) =>
            t.freq === "1M"
              ? m.slice(0, 7)
              : (() => {
                  const u = new Date(m + "T12:00:00Z"),
                    M = (u.getUTCDay() + 6) % 7;
                  return (u.setUTCDate(u.getUTCDate() - M), E(u));
                })(),
          $ = new Map();
        (i.forEach((m) => $.set(d(m), m)), (i = [...$.values()].sort()));
      }
      const o = i[0],
        l = n.get(o),
        b = r.get(o);
      return {
        rows: i.map((d) => {
          const $ = n.get(d),
            m = r.get(d),
            u = t.mode === "pct" ? ($ / l - 1) * 100 : ($ / l) * 100,
            M = t.mode === "pct" ? (m / b - 1) * 100 : (m / b) * 100;
          return { date: d, a: $, b: m, va: u, vb: M };
        }),
        span: s,
        sourceA: a,
        sourceB: e,
      };
    }
    function _(a) {
      return (
        {
          chart: '<path d="M3 19V5m0 14h18M6 15l5-6 4 3 5-7"/>',
          expand: '<path d="M9 3H3v6m12-6h6v6M3 15v6h6m18-6v6h-6"/>',
          table:
            '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M3 15h18M10 4v16"/>',
          settings:
            '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
          calendar:
            '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
          reload:
            '<path d="M20 7V3h-4M4 17v4h4"/><path d="M20 7a8 8 0 0 0-14-2M4 17a8 8 0 0 0 14 2"/>',
        }[a] || ""
      );
    }
    function x(a, e = 16) {
      return `<svg width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${_(a)}</svg>`;
    }
    function L(a, e, s) {
      return `<select data-m409="${a}" aria-label="${f(a)}">${e.map(([n, r]) => `<option value="${n}" ${s === n ? "selected" : ""}>${f(r)}</option>`).join("")}</select>`;
    }
    function U() {
      return Object.entries(y).map(([a, e]) => [a, e]);
    }
    const X = (a, e) =>
      `<label class="m409-date"><span>${a === "start" ? "De" : "Até"}</span><input data-m409="${a}" aria-label="Data ${a === "start" ? "inicial" : "final"}" type="date" value="${f(e)}"></label>`;
    function tt(a, e, s, n, r, i, o, l, b) {
      const h = (m) => s + (m / Math.max(1, b.length - 1)) * (a - s - n),
        d = (m) => r + ((l - m) / (l - o)) * (e - r - i),
        $ = [];
      for (let m = 0; m <= 5; m++) {
        const u = o + ((l - o) * m) / 5,
          M = d(u);
        $.push(
          `<line x1="${s}" y1="${M}" x2="${a - n}" y2="${M}" stroke="#292c30" stroke-width="1" stroke-dasharray="2 3"/><text x="${s - 7}" y="${M + 3.6}" text-anchor="end" fill="#c6cccd" font-size="11">${p(u, 1)}</text><text x="${a - n + 7}" y="${M + 3.6}" fill="#9fa4ac" font-size="10">${p(u - (t.mode === "pct" ? 0 : 100), 1)}${t.mode === "pct" ? "" : "%"}</text>`,
        );
      }
      for (let m = 0; m <= 5; m++) {
        const u = s + ((a - s - n) * m) / 5;
        $.push(
          `<line x1="${u}" y1="${r}" x2="${u}" y2="${e - i}" stroke="#292c30" stroke-width="1" stroke-dasharray="2 3"/>`,
        );
      }
      return { grid: $.join(""), x: h, y: d };
    }
    function z(a) {
      const e = a.rows;
      if (e.length < 2) {
        const c = a.sourceA.length,
          k = a.sourceB.length;
        return `<div class="m409-empty" role="status"><div class="m409-empty-grid" aria-hidden="true"></div><div class="m409-empty-body"><strong>${t.loading ? "Consultando histórico real…" : "Histórico comparável indisponível"}</strong><span>${t.loading ? "Aguarde a consulta das duas séries." : c && k ? "As fontes não têm datas suficientes em comum neste período." : "Ainda não recebemos candles diários dos dois ativos. Nenhum preço será inventado."}</span><button type="button" data-m409-action="load" ${t.loading ? "disabled" : ""}>${x("reload")} ${t.loading ? "Consultando…" : "Consultar histórico real"}</button>${t.message ? `<small>${f(t.message)}</small>` : ""}</div></div>`;
      }
      const s = 820,
        n = 365,
        r = 52,
        i = 62,
        o = 20,
        l = 47,
        b = e.flatMap((c) => [c.va, c.vb]),
        h = Math.min(...b),
        d = Math.max(...b),
        $ = Math.max(0.65, (d - h) * 0.12),
        m = Math.floor((h - $) * 2) / 2,
        u = Math.ceil((d + $) * 2) / 2,
        { grid: M, x: B, y: O } = tt(s, n, r, i, o, l, m, u, e),
        Y = (c) =>
          e
            .map(
              (k, w) =>
                `${w ? "L" : "M"}${B(w).toFixed(2)},${O(k[c]).toFixed(2)}`,
            )
            .join(" "),
        at = Y("va"),
        W = Y("vb"),
        S = e.at(-1),
        st = B(0),
        nt = B(e.length - 1),
        N = n - l,
        ot = `${W} L${nt},${N} L${st},${N} Z`,
        rt = [
          0,
          Math.floor((e.length - 1) / 4),
          Math.floor((e.length - 1) / 2),
          Math.floor((e.length - 1) * 0.75),
          e.length - 1,
        ]
          .map(
            (c) =>
              `<text x="${B(c).toFixed(2)}" y="${n - 10}" text-anchor="${c === 0 ? "start" : c === e.length - 1 ? "end" : "middle"}" fill="#caccd1" font-size="11">${f(new Date(e[c].date + "T12:00:00Z").toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }))}</text>`,
          )
          .join(""),
        it = (c) =>
          t.ma === "none" || e.length < c
            ? ""
            : `<path d="${e
                .map((w, A) =>
                  A < c - 1
                    ? null
                    : e
                        .slice(A - c + 1, A + 1)
                        .reduce((V, lt) => V + lt.va, 0) / c,
                )
                .map((w, A) =>
                  w == null
                    ? ""
                    : `${A === c - 1 ? "M" : "L"}${B(A).toFixed(2)},${O(w).toFixed(2)}`,
                )
                .join(
                  " ",
                )}" fill="none" stroke="#cfab68" stroke-width="1.6" stroke-dasharray="5 4"/>`,
        ct = f(JSON.stringify(e.map((c) => [c.date, c.a, c.b, c.va, c.vb]))),
        dt = [
          [S.va, "#efeeeb", "#151618"],
          [S.vb, "#729dc3", "#fff"],
        ]
          .map(([c, k, w], A) => {
            const V = Math.max(16, Math.min(n - l - 10, O(c)));
            return `<rect x="${s - i + 5}" y="${V - 11}" width="51" height="22" rx="3" fill="${k}"/><text x="${s - i + 30}" y="${V + 4}" fill="${w}" font-size="12" text-anchor="middle" font-weight="700">${p(c, 1)}</text>`;
          })
          .join("");
      return `<div class="m409-plot-wrap"><div class="m409-floating-legend"><div><i class="m409-swatch first"></i>${f(y[t.first])} <b>${p(S.a, 2)}</b></div><div><i class="m409-swatch second"></i>${f(y[t.second])} <b>${p(S.b, 2)}</b></div></div><svg class="m409-plot" viewBox="0 0 ${s} ${n}" data-m409-points="${ct}" aria-label="Histórico real comparando ${f(y[t.first])} e ${f(y[t.second])} entre ${f(e[0].date)} e ${f(S.date)}" role="img"><defs><linearGradient id="m409-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4677a2" stop-opacity=".38"/><stop offset="1" stop-color="#4677a2" stop-opacity=".03"/></linearGradient></defs><rect x="${r}" y="${o}" width="${s - r - i}" height="${n - o - l}" fill="#0a0b0c"/>${t.grid ? M : ""}<path d="${ot}" fill="${t.fill ? "url(#m409-chart-fill)" : "transparent"}"/><path d="${W}" stroke="#5d8eb9" stroke-width="2.1" fill="none" stroke-linejoin="round"/><path d="${at}" stroke="#efeeeb" stroke-width="2.1" fill="none" stroke-linejoin="round"/>${t.ma !== "none" ? it(parseInt(t.ma)) : ""}${rt}${dt}<line data-m409-cross x1="0" x2="0" y1="${o}" y2="${N}" stroke="#d5b57a" stroke-dasharray="5 3" visibility="hidden"/></svg><div class="m409-cross-tip" hidden></div><div class="m409-chart-foot">${e.length} fechamentos em comum · ${e[0].date.split("-").reverse().join("/")} a ${S.date.split("-").reverse().join("/")} · Fonte: histórico do Terminal</div></div>`;
    }
    function et(a) {
      if (a.rows.length < 2) return z(a);
      let e = a.rows.slice(-80).reverse();
      return `<div class="m409-table-scroll"><table><thead><tr><th>Data</th><th>${f(y[t.first])} (fech.)</th><th>${f(y[t.second])} (fech.)</th><th>Base / % A</th><th>Base / % B</th></tr></thead><tbody>${e.map((s) => `<tr><th>${f(s.date.split("-").reverse().join("/"))}</th><td>${p(s.a)}</td><td>${p(s.b)}</td><td>${p(s.va)}</td><td>${p(s.vb)}</td></tr>`).join("")}</tbody></table></div>`;
    }
    function g() {
      const a = T();
      if (!a || !D()) return;
      const e = q(),
        s = I();
      return (
        a.classList.add("m409-chart-card"),
        (a.dataset.m409Ready = "yes"),
        (a.innerHTML = `<div class="m409-heading"><span class="m409-title-ico">${x("chart", 18)}</span><strong>${t.first === "IBOV" || t.second === "IBOV" ? "Desempenho comparativo BR / EUA" : "Desempenho do Setor EUA"}</strong><button data-m409-action="expand" title="Ampliar gráfico" aria-label="Ampliar gráfico" aria-pressed="${t.full}">${x("expand", 17)}</button></div><div class="m409-controls"><div class="m409-line m409-dates"><span class="m409-label">Período</span>${X("start", s.from)}<span class="m409-sep">–</span>${X("end", s.to)}</div><div class="m409-line m409-metrics"><label>Ativo ${L("first", U(), t.first)}</label><label>Comparar ${L("second", U(), t.second)}</label><label>Medida ${L(
          "mode",
          [
            ["base", "Base 100"],
            ["pct", "Variação %"],
          ],
          t.mode,
        )}</label></div><div class="m409-line m409-view-options"><label>Frequência ${L(
          "freq",
          [
            ["1D", "Diário"],
            ["1W", "Semanal"],
            ["1M", "Mensal"],
          ],
          t.freq,
        )}</label><label>Médias ${L(
          "ma",
          [
            ["none", "Sem médias"],
            ["5", "MM5"],
            ["20", "MM20"],
          ],
          t.ma,
        )}</label><button data-m409-action="load" title="Atualizar os históricos">${x("reload", 14)} <span>Consultar</span></button></div><div class="m409-periods" role="group" aria-label="Período do gráfico">${["1D", "3D", "1M", "6M", "YTD", "1A", "3A", "5A", "Máx"].map((n) => `<button data-m409-period="${n}" class="${!t.range && t.period === n ? "on" : ""}" aria-pressed="${!t.range && t.period === n}">${n}</button>`).join("")}<button class="m409-mode-switch ${t.tab === "chart" ? "on" : ""}" data-m409-action="chart" aria-pressed="${t.tab === "chart"}" title="Gráfico">${x("chart", 17)}</button><button class="m409-mode-switch ${t.tab === "table" ? "on" : ""}" data-m409-action="table" aria-pressed="${t.tab === "table"}" title="Tabela">${x("table", 17)} <span>Tabela</span></button><button class="m409-mode-switch" data-m409-action="settings" aria-expanded="false" aria-label="Configurações do gráfico">${x("settings", 18)}</button></div></div><div class="m409-settings" hidden><label><input type="checkbox" data-m409-check="grid" ${t.grid ? "checked" : ""}> Grade do gráfico</label><label><input type="checkbox" data-m409-check="fill" ${t.fill ? "checked" : ""}> Área azul</label></div><div class="m409-chart-body">${t.tab === "table" ? et(e) : z(e)}</div><div class="m409-foot">Fechamentos efetivamente observados. Séries alinhadas nas datas em comum, sem estimativas. ${t.loading ? "Consultando fontes…" : ""}</div>`),
        a.classList.toggle("m409-expanded", t.full),
        e
      );
    }
    function j() {
      if (!D()) return;
      const a = T();
      a &&
        !a.querySelector(".m409-controls") &&
        (g(),
        t.last ||
          ((t.last = Date.now()),
          setTimeout(() => {
            D() && q().rows.length < 2 && !t.loading && P(!1);
          }, 180)));
    }
    const Z = new Map();
    async function P(a = !1) {
      if (t.loading) return;
      const e = window.TRM?.tec;
      if (!e?.pegaVelas) {
        ((t.message =
          "O Terminal ainda não disponibilizou a consulta de candles nesta sessão."),
          g());
        return;
      }
      ((t.loading = !0), (t.message = ""), g());
      try {
        for (const s of new Set([t.first, t.second])) {
          if (!a && C(s).length >= 2) continue;
          const n = Z.get(s) || 0;
          if (!a && Date.now() - n < 12e4) continue;
          Z.set(s, Date.now());
          let r = !1;
          for (const i of R[s] || [s])
            try {
              if ((await e.pegaVelas(i, "1d"), C(s).length >= 2)) {
                r = !0;
                break;
              }
            } catch {
              console.debug("Mercado v409: fonte indisponível", i);
            }
          r ||
            (t.message += "Sem histórico suficiente de " + (y[s] || s) + ". ");
        }
      } finally {
        ((t.loading = !1), g());
      }
    }
    function G() {
      const a = v.getElementById("app");
      if (!a) return;
      (new MutationObserver((s) => {
        D() &&
          s.some((n) =>
            [...n.addedNodes].some(
              (r) =>
                r.nodeType === 1 &&
                (r.matches?.(
                  ".m403-chart-card,.m408-workspace,.m408-chart-column",
                ) ||
                  r.querySelector?.(".m403-chart-card")),
            ),
          ) &&
          j();
      }).observe(a, { subtree: !0, childList: !0 }),
        j());
    }
    (window.TraderUI?.onRender &&
      window.TraderUI.onRender("mercado-v409", () => {
        try {
          j();
        } catch (a) {
          console.warn("Mercado v409", a);
        }
      }),
      v.readyState === "loading"
        ? v.addEventListener("DOMContentLoaded", G, { once: !0 })
        : G(),
      v.addEventListener(
        "click",
        (a) => {
          const e = a.target.closest?.("[data-m409-period],[data-m409-action]");
          if (!e || !D()) return;
          if ((a.preventDefault(), a.stopPropagation(), e.dataset.m409Period)) {
            ((t.period = e.dataset.m409Period),
              (t.range = ""),
              ["1D", "3D", "1M"].includes(t.period) && (t.freq = "1D"),
              g(),
              q().rows.length < 2 && P());
            return;
          }
          const s = e.dataset.m409Action;
          if (s === "expand") {
            ((t.full = !t.full), g());
            return;
          }
          if (s === "chart" || s === "table") {
            ((t.tab = s), g());
            return;
          }
          if (s === "settings") {
            const n = T()?.querySelector(".m409-settings");
            n &&
              ((n.hidden = !n.hidden),
              e.setAttribute("aria-expanded", String(!n.hidden)));
            return;
          }
          s === "load" && P(!0);
        },
        !0,
      ),
      v.addEventListener(
        "change",
        (a) => {
          const e = a.target;
          if (!D()) return;
          if (e.matches("[data-m409-check]")) {
            ((t[e.dataset.m409Check] = e.checked), g());
            const n = T()?.querySelector(".m409-settings");
            n && (n.hidden = !1);
            return;
          }
          if (!e.matches("[data-m409]")) return;
          const s = e.dataset.m409;
          if (["first", "second", "mode", "freq", "ma"].includes(s)) {
            ((t[s] = e.value),
              g(),
              (s === "first" || s === "second") && q().rows.length < 2 && P());
            return;
          }
          if (s === "start" || s === "end") {
            const n = T(),
              r = n?.querySelector('[data-m409="start"]')?.value,
              i = n?.querySelector('[data-m409="end"]')?.value;
            r && i && r <= i
              ? ((t.range = r + "|" + i),
                (new Date(i) - new Date(r)) / 864e5 < 45 && (t.freq = "1D"),
                g())
              : ((t.message = "Confira o intervalo inicial e final."), g());
            return;
          }
        },
        !0,
      ));
    function H(a) {
      const e = a.target.closest?.(".m409-plot");
      if (e)
        try {
          const s = JSON.parse(e.dataset.m409Points || "[]");
          if (!s.length) return;
          const n = e.getBoundingClientRect(),
            r = ((a.clientX - n.left) / n.width) * 820,
            i = Math.max(
              0,
              Math.min(
                s.length - 1,
                Math.round(((r - 52) / 706) * (s.length - 1)),
              ),
            ),
            o = 52 + (i / Math.max(1, s.length - 1)) * 706,
            l = e.querySelector("[data-m409-cross]");
          (l?.setAttribute("x1", o),
            l?.setAttribute("x2", o),
            l?.setAttribute("visibility", "visible"));
          const b = e.parentElement.querySelector(".m409-cross-tip");
          if (b) {
            const h = s[i];
            ((b.hidden = !1),
              (b.textContent =
                h[0] +
                " · " +
                (y[t.first] || t.first) +
                ": " +
                p(h[1]) +
                " (" +
                p(h[3]) +
                (t.mode === "pct" ? "%" : " base") +
                ") · " +
                (y[t.second] || t.second) +
                ": " +
                p(h[2]) +
                " (" +
                p(h[4]) +
                (t.mode === "pct" ? "%" : " base") +
                ")"));
          }
        } catch {}
    }
    (v.addEventListener("pointermove", H, { passive: !0 }),
      v.addEventListener("pointerdown", H, { passive: !0 }),
      v.addEventListener("pointerout", (a) => {
        const e = a.target.closest?.(".m409-plot");
        if (!e || e.contains(a.relatedTarget)) return;
        e.querySelector("[data-m409-cross]")?.setAttribute(
          "visibility",
          "hidden",
        );
        const s = e.parentElement.querySelector(".m409-cross-tip");
        s && (s.hidden = !0);
      }),
      v.addEventListener("keydown", (a) => {
        a.key === "Escape" && t.full && ((t.full = !1), g());
      }),
      (window.MercadoGrafico409 = {
        state: t,
        observed: q,
        render: g,
        fetchHistory: P,
      }));
  })();
} catch (e) {
  console.error("[v522] falha em mercado-v409.js", e);
}
try {
  (() => {
    "use strict";
    const o = document,
      a = () => {
        try {
          return tab === "mercado";
        } catch {
          return !1;
        }
      },
      i = () =>
        o.querySelector("#app .dt395-native-mercado .m403-primary-tabs");
    let c = null;
    (window.TraderUI?.onRender &&
      window.TraderUI.onRender("mercado-v410", {
        before() {
          if (!a()) return null;
          const t = o.getElementById("app"),
            e = i();
          if (!t || !e) return null;
          const r = e.getBoundingClientRect(),
            n = {
              y: window.scrollY,
              navTop: r.top,
              app: t,
              previousMin: t.style.minHeight,
            };
          return (
            (t.style.minHeight =
              Math.max(t.offsetHeight, window.innerHeight) + "px"),
            n
          );
        },
        after(t) {
          if (!t) return;
          const e = i();
          if (e) {
            const r = e.getBoundingClientRect().top - t.navTop,
              n = Math.max(0, t.y + r);
            Math.abs(window.scrollY - n) > 1 &&
              window.scrollTo({ top: n, behavior: "instant" });
          }
          t.app.style.minHeight = t.previousMin;
        },
      }),
      (window.MercadoNavegacao410 = {
        version: "v412",
        get pending() {
          return !1;
        },
      }));
  })();
} catch (e) {
  console.error("[v522] falha em mercado-v410.js", e);
}
try {
  (function (U) {
    "use strict";
    const $ = "tf413",
      At = "dt-terminal-view-v415",
      st = [
        ["CME_MINI:NQ1!", "Nasdaq futuro"],
        ["CME_MINI:ES1!", "S&P futuro"],
        ["BMFBOVESPA:WIN1!", "Mini índice"],
        ["BMFBOVESPA:WDO1!", "Mini dólar"],
        ["FX_IDC:USDBRL", "USD/BRL"],
        ["TVC:DXY", "DXY"],
        ["TVC:VIX", "VIX"],
        ["TVC:US10Y", "US 10 anos"],
      ],
      z = { s: st.map((e) => e[0]) },
      it = { q: "Brasil Ibovespa dólar economia" },
      lt = { q: "United States Nasdaq Federal Reserve markets" },
      m = {
        IBOV: "IBOV",
        SP500: "SPX",
        NASDAQ: "NASDAQ",
        DXY: "DXY",
        DOLAR: "USDBRL",
        EWZ: "EWZ",
        PETR4: "PETR4",
        VALE3: "VALE3",
        USTEC: "USTEC",
      },
      _ = [
        ["1D", 1],
        ["3D", 3],
        ["1M", 31],
        ["3M", 93],
        ["6M", 186],
        ["YTD", -1],
        ["1A", 366],
        ["3A", 1096],
        ["5A", 1826],
        ["Máx", 36500],
      ];
    let h = !1,
      x = "1A",
      X = "Mensal",
      v = "IBOV",
      p = "NASDAQ",
      R = !1,
      O = !1,
      J = !1,
      E = 0,
      ct = 0,
      B = null,
      w = null;
    const V = () => U.TRM,
      g = (e, t = 2) =>
        typeof e == "number" && isFinite(e)
          ? e.toLocaleString("pt-BR", {
              minimumFractionDigits: t,
              maximumFractionDigits: t,
            })
          : "—",
      l = (e) =>
        String(e ?? "").replace(
          /[&<>"']/g,
          (t) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[t],
        ),
      y = (e) => typeof e == "number" && Number.isFinite(e),
      K = (e) => {
        let t = new Date(e);
        return isFinite(t.getTime())
          ? t.toLocaleTimeString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—";
      },
      Tt = (e) => (y(e) ? (e > 0 ? "+" : "") + g(e, 2) + "%" : "—"),
      M = (e, t) => {
        try {
          return V()?.trGet?.(e, t) || {};
        } catch {
          return {};
        }
      },
      H = (e, t, n, o, a = "") =>
        `<section class="tf413-card ${a}"><header><h3><span class="tf413-icon">${t}</span>${e}</h3><button type="button" class="tf413-more" data-tf413-cmd="${l(o)}" aria-label="Abrir ${l(e)} completo">›</button></header><div class="tf413-content">${n}</div></section>`,
      Ht =
        '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 15v-4m4 4V8m4 7V5m4 10V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      xt =
        '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><rect x="2" y="3" width="15" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 7h4M5 11h4M12 7h3M12 10h3M5 14h10" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
      Et =
        '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><rect x="2" y="4" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 2v5m8-5v5M2 9h16" stroke="currentColor" stroke-width="1.6"/></svg>',
      Mt =
        '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><ellipse cx="10" cy="4" rx="7" ry="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 4v6c0 4 14 4 14 0V4M3 10v4c0 4 14 4 14 0v-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
      Lt = (e) =>
        (M("cot", z).v?.itens || []).find((n) => n.pedido === e || n.s === e) ||
        null,
      Ct = (e, t) =>
        e?.err
          ? "Fonte indisponível"
          : e?.v
            ? t
              ? "Última consulta " + K(e?.v?.em || e?.ts)
              : "Atualização recebida"
            : "Aguardando fonte";
    function dt() {
      const e = M("cot", z),
        t = st
          .slice(0, 6)
          .map(([n, o]) => {
            let a = Lt(n) || {},
              s = n.includes("WIN1!")
                ? "WINFUT"
                : n.includes("WDO1!")
                  ? "WDOFUT"
                  : n,
              i = {};
            try {
              i = V()?.melhorPx?.(s, a, a.r) || {};
            } catch {}
            const u = y(i.px) ? i.px : a.px,
              c = y(i.d1) ? i.d1 : a.d1;
            return `<tr><th scope="row">${l(o)}</th><td class="tf413-num">${g(u, n.includes("WDO") || n.includes("USD") ? 3 : 2)}</td><td class="tf413-num ${y(c) ? (c >= 0 ? "tf413-up" : "tf413-down") : ""}">${Tt(c)}</td></tr>`;
          })
          .join("");
      return H(
        "Radar Global",
        "◎",
        `<table class="tf413-tbl"><thead><tr><td>Índice/Ativo</td><td>Últ.</td><td>Var. %</td></tr></thead><tbody>${t}</tbody></table><p class="tf413-caption">${l(Ct(e, !0))} · ${l(e.v?.fonte || "Fonte identificada em cada ativo")}</p>`,
        "GLOBAL",
        "tf413-radar",
      );
    }
    function ft() {
      const e = M("noticias", it),
        t = M("noticias", lt),
        n = M("noticias", {});
      let o = [
        ...(e.v?.itens || []),
        ...(t.v?.itens || []),
        ...(n.v?.itens || []),
      ];
      const a = new Set();
      o = o
        .filter((i) => {
          const u = String(i.l || i.t || "").slice(0, 100);
          return !i.t || a.has(u) ? !1 : (a.add(u), !0);
        })
        .sort((i, u) => new Date(u.d || 0) - new Date(i.d || 0))
        .slice(0, 4);
      const s = o.length
        ? o
            .map((i) => {
              let u = "";
              try {
                const c = new URL(i.l || i.u || i.url || "");
                ["https:", "http:"].includes(c.protocol) && (u = c.href);
              } catch {}
              return `<article class="tf413-news-row"><time>${l(K(i.d))}</time><span>${u ? `<a href="${l(u)}" target="_blank" rel="noopener noreferrer">${l(i.t)}</a>` : l(i.t)}<small>${l(i.f || "Fonte não indicada")}</small></span></article>`;
            })
            .join("")
        : '<div class="tf413-empty">Notícias aguardando a fonte conectada.</div>';
      return H("Notícias do dia", xt, s, "NEWSBR", "tf413-news");
    }
    function ut() {
      let t = M("agenda", {}).v?.itens || [];
      const n = Date.now();
      t = t
        .filter(
          (a) =>
            a && a.d && Date.parse(a.d) > n - 36 * 36e5 && Number(a.imp) >= 2,
        )
        .sort((a, s) => Date.parse(a.d) - Date.parse(s.d))
        .slice(0, 4);
      const o = t.length
        ? `<table class="tf413-tbl"><thead><tr><td>Hora</td><td>Evento</td><td>Cons.</td></tr></thead><tbody>${t.map((a) => `<tr><th scope="row" class="tf413-hour">${l(K(a.d))}</th><td>${l(a.t)}<small>${l(a.pais || "")}</small></td><td class="tf413-num">${l(a.prev || "—")}</td></tr>`).join("")}</tbody></table>`
        : '<div class="tf413-empty">Agenda aguardando os eventos confirmados.</div>';
      return H("Agenda", Et, o, "ECO", "tf413-agenda");
    }
    function ht() {
      const e = M("copom", {}),
        t = e.v;
      let n = (t?.curva || []).filter((a) => y(a.taxa)).slice(0, 5);
      const o = n.length
        ? `<table class="tf413-tbl"><thead><tr><td>Vencimento</td><td>Taxa (%)</td><td>Var. (pb)</td></tr></thead><tbody>${n.map((a) => `<tr><th scope="row">${l(a.cod)}</th><td class="tf413-num">${g(a.taxa, 2)}</td><td class="tf413-num ${y(a.var_pb) ? (a.var_pb >= 0 ? "tf413-down" : "tf413-up") : ""}">${y(a.var_pb) ? (a.var_pb > 0 ? "+" : "") + g(a.var_pb, 0) : "—"}</td></tr>`).join("")}</tbody></table><p class="tf413-caption">Selic ${g(t.selic)}% · CDI ${g(t.cdi)}% · ${l(t.fonte || "Referência da fonte conectada")}</p>`
        : '<div class="tf413-empty">Curva DI aguardando fonte. Nenhuma taxa foi estimada.</div>';
      return H("Juros", Mt, o, "DIFUT", "tf413-juros");
    }
    function F() {
      return x === "1D" ? "5m" : x === "3D" ? "60m" : "1d";
    }
    function tt() {
      if (B) return B;
      const e = _.find((t) => t[0] === x)?.[1] ?? 366;
      return e === 36500
        ? -1 / 0
        : e === -1
          ? new Date(new Date().getFullYear(), 0, 1).getTime() / 1e3
          : Date.now() / 1e3 - e * 86400;
    }
    function D(e) {
      try {
        return (V()?.tec?.velas(e, F())?.L || [])
          .filter((t) => Array.isArray(t) && y(t[0]) && y(t[4]) && t[4] > 0)
          .sort((t, n) => t[0] - n[0]);
      } catch {
        return [];
      }
    }
    const et = (e) =>
      e
        .map(
          (t, n) => (n ? "L" : "M") + t[0].toFixed(1) + "," + t[1].toFixed(1),
        )
        .join(" ");
    function mt() {
      const e = D(m[v]),
        t = D(m[p]),
        n = tt(),
        o = e.filter((r) => r[0] >= n && (!w || r[0] <= w)),
        a = t.filter((r) => r[0] >= n && (!w || r[0] <= w)),
        s = (r) => {
          if (X === "Diário" || F() !== "1d") return r;
          const d = new Map();
          for (const f of r) {
            const S = new Date(f[0] * 1e3);
            let Xt =
              X === "Semanal"
                ? S.getUTCFullYear() +
                  "-W" +
                  Math.floor(
                    (S.getTime() - Date.UTC(S.getUTCFullYear(), 0, 1)) / 6048e5,
                  )
                : S.getUTCFullYear() + "-" + (S.getUTCMonth() + 1);
            d.set(Xt, f);
          }
          return [...d.values()];
        },
        i = s(o),
        u = s(a),
        c = 720,
        A = 330,
        b = 48,
        nt = 46,
        T = 24,
        j = 32,
        P = c - b - nt,
        G = A - T - j,
        Pt =
          Array.from({ length: 6 }, (r, d) => {
            let f = T + (d * G) / 5;
            return `<line x1="${b}" x2="${c - nt}" y1="${f}" y2="${f}" class="tf413-gridline"/><text x="${b - 9}" y="${f + 3}" text-anchor="end" class="tf413-axis">${(120 - d * 8).toFixed(0)}</text>`;
          }).join("") +
          Array.from({ length: 8 }, (r, d) => {
            let f = b + (d * P) / 7;
            return `<line x1="${f}" x2="${f}" y1="${T}" y2="${A - j}" class="tf413-gridline"/>`;
          }).join(""),
        qt = `<rect x="${c - 281}" y="10" width="267" height="59" rx="4" class="tf413-legend-bg"/><rect x="${c - 269}" y="23" width="10" height="10" fill="#faf9f8"/><text x="${c - 251}" y="32" class="tf413-legend">${l(v)}</text><rect x="${c - 269}" y="42" width="10" height="10" fill="#6a97bf"/><text x="${c - 251}" y="51" class="tf413-legend">${l(p)}</text>`;
      if (i.length < 2 || u.length < 2)
        return `<svg class="tf413-svg" viewBox="0 0 ${c} ${A}" role="img" aria-label="Gráfico sem histórico real suficiente">${Pt}<rect x="${b}" y="${T}" width="${P}" height="${G}" fill="none" stroke="#3b3e43"/>${qt}<text x="360" y="175" class="tf413-empty-svg" text-anchor="middle">Histórico real insuficiente para este período</text><text x="360" y="198" class="tf413-empty-sub" text-anchor="middle">Selecione outro prazo ou consulte a fonte de candles</text></svg>`;
      const bt = Math.max(i[0][0], u[0][0]);
      let q = i.filter((r) => r[0] >= bt),
        N = u.filter((r) => r[0] >= bt);
      (q.length < 2 || N.length < 2) && ((q = i), (N = u));
      const Y = Math.min(q[0][0], N[0][0]),
        $t = Math.max(q.at(-1)[0], N.at(-1)[0]),
        Nt = q[0][4],
        kt = N[0][4],
        ot = q.map((r) => [r[0], (r[4] / Nt) * 100]),
        rt = N.map((r) => [r[0], (r[4] / kt) * 100]),
        yt = [...ot, ...rt].map((r) => r[1]);
      let Q = Math.min(...yt),
        k = Math.max(...yt),
        St = Math.max((k - Q) * 0.12, 1);
      ((Q -= St), (k += St));
      const wt = (r) => b + ((r - Y) / ($t - Y || 1)) * P,
        Dt = (r) => T + ((k - r) / (k - Q)) * G,
        Z = ot.map((r) => [wt(r[0]), Dt(r[1])]),
        Ut = rt.map((r) => [wt(r[0]), Dt(r[1])]),
        Vt = et(Z) + ` L${Z.at(-1)[0]},${A - j} L${Z[0][0]},${A - j} Z`,
        Wt = Array.from({ length: 6 }, (r, d) => {
          let f = k - ((k - Q) * d) / 5,
            S = T + (d * G) / 5;
          return `<text x="${b - 9}" y="${S + 4}" text-anchor="end" class="tf413-axis">${g(f, 0)}</text>`;
        }).join(""),
        jt = Array.from({ length: 6 }, (r, d) => {
          const f = Y + (($t - Y) * d) / 5,
            S = new Date(f * 1e3);
          return `<text x="${b + (d * P) / 5}" y="${A - 7}" text-anchor="middle" class="tf413-axis">${S.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}</text>`;
        }).join(""),
        Gt = g(ot.at(-1)[1], 2),
        _t = g(rt.at(-1)[1], 2);
      return `<svg class="tf413-svg" viewBox="0 0 ${c} ${A}" role="img" aria-label="Gráfico base 100 de ${l(v)} e ${l(p)}"><g>${Array.from(
        { length: 6 },
        (r, d) => {
          let f = T + (d * G) / 5;
          return `<line x1="${b}" x2="${c - nt}" y1="${f}" y2="${f}" class="tf413-gridline"/>`;
        },
      ).join(
        "",
      )}${Array.from({ length: 8 }, (r, d) => `<line x1="${b + (d * P) / 7}" x2="${b + (d * P) / 7}" y1="${T}" y2="${A - j}" class="tf413-gridline"/>`).join("")}</g><path d="${Vt}" fill="#3d4046" fill-opacity=".34"/><path d="${et(Z)}" fill="none" stroke="#efeeeb" stroke-width="2.3" vector-effect="non-scaling-stroke"/><path d="${et(Ut)}" fill="none" stroke="#6a97bf" stroke-width="2.1" vector-effect="non-scaling-stroke"/>${Wt}${jt}<rect x="${c - 281}" y="9" width="267" height="64" class="tf413-legend-bg" rx="4"/><rect x="${c - 269}" y="24" width="9" height="9" fill="#faf9f8"/><text x="${c - 251}" y="32" class="tf413-legend">${l(v)} · ${Gt}</text><rect x="${c - 269}" y="46" width="9" height="9" fill="#6a97bf"/><text x="${c - 251}" y="54" class="tf413-legend">${l(p)} · ${_t}</text></svg>`;
    }
    function vt(e) {
      return Object.entries(m)
        .map(
          ([t]) =>
            `<option value="${t}"${e === t ? " selected" : ""}>${t === "SP500" ? "S&P 500" : t === "DOLAR" ? "USD/BRL" : t === "USTEC" ? "Nasdaq Futuro" : t}</option>`,
        )
        .join("");
    }
    function pt() {
      const e = D(m[v]),
        t = D(m[p]),
        o = Math.min(e.length, t.length)
          ? `Histórico disponível: ${Math.min(e.length, t.length)}+ dias · cache do Terminal`
          : "Sem candles no cache";
      return `<section class="tf413-chartcard" aria-label="Comparativo de ativos"><header class="tf413-charthead"><h2>↗ <span>Comparativo de Ativos</span> <small>⌄</small></h2><div class="tf413-actions"><button class="tf413-iconbtn" type="button" data-tf413-full title="Ampliar gráfico" aria-label="Ampliar gráfico">⤢</button><button class="tf413-iconbtn" type="button" data-tf413-cmd="HELP" title="Ajuda">•••</button></div></header><div class="tf413-chartcontrols"><span>Período</span><label class="tf413-dates"><input type="date" data-tf413-start aria-label="Data inicial do gráfico" value="${new Date(B ? B * 1e3 : Date.now() - (_.find((a) => a[0] === x)?.[1] ?? 366) * 864e5).toISOString().slice(0, 10)}"></label><span>–</span><label class="tf413-dates"><input type="date" data-tf413-end aria-label="Data final do gráfico" value="${new Date(w ? w * 1e3 : Date.now()).toISOString().slice(0, 10)}"></label><span class="tf413-controlspacer"></span><select data-tf413-frequency aria-label="Frequência">${["Diário", "Semanal", "Mensal"].map((a) => `<option${X === a ? " selected" : ""}>${a}</option>`).join("")}</select><label class="tf413-coin">Base <strong>100</strong></label></div><div class="tf413-charttools"><div class="tf413-periods">${_.map(([a]) => `<button type="button" data-tf413-period="${a}" class="${a === x ? "on" : ""}">${a}</button>`).join("")}</div><button type="button" data-tf413-table class="tf413-pill">${R ? "Gráfico" : "Tabela"}</button><button type="button" data-tf413-refresh class="tf413-pill" aria-label="Atualizar histórico">↻</button></div><div class="tf413-pair"><label>Ativo 1 <select data-tf413-left>${vt(v)}</select></label><label>Ativo 2 <select data-tf413-right>${vt(p)}</select></label></div><div class="tf413-chartplot" data-tf413-chartview>${R ? gt() : mt()}</div><footer class="tf413-chartfoot"><span>${l(o)}</span><span><span class="tf413-indicator"></span>Dados reais · sem simulação</span></footer></section>`;
    }
    function gt() {
      const e = D(m[v]).filter((s) => s[0] >= tt()),
        t = D(m[p]).filter((s) => s[0] >= tt()),
        n = (s) => new Date(s[0] * 1e3).toISOString().slice(0, 10),
        o = new Map(t.map((s) => [n(s), s])),
        a = e
          .filter((s) => o.has(n(s)))
          .slice(-25)
          .reverse();
      return a.length
        ? `<div class="tf413-table-scroll"><table class="tf413-tbl"><thead><tr><td>Data</td><td>${l(v)}</td><td>${l(p)}</td></tr></thead><tbody>${a
            .map((s) => {
              const i = o.get(n(s));
              return `<tr><th>${new Date(s[0] * 1e3).toLocaleDateString("pt-BR")}</th><td>${g(s[4])}</td><td>${g(i[4])}</td></tr>`;
            })
            .join("")}</tbody></table></div>`
        : '<div class="tf413-empty">Não há datas coincidentes nas séries consultadas.</div>';
    }
    function Rt() {
      return `<div class="tf413-dashboard" id="${$}"><nav class="tf413-top" aria-label="Terminal de Inteligência"><div><strong>TERMINAL DE INTELIGÊNCIA</strong><span class="tf413-live">● Consulta · execução no Profit Pro</span></div><div class="tf413-top-actions"><button type="button" data-tf413-search aria-label="Pesquisar ativos e comandos">⌕ Pesquisa</button></div></nav><div class="tf415-nav" role="navigation" aria-label="Painéis do Terminal">${[
        ["HOME", "Visão geral"],
        ["GP", "Gráficos"],
        ["GLOBAL", "Radar Global"],
        ["MON", "Fluxo"],
        ["NEWSBR", "Notícias"],
        ["DIFUT", "Juros"],
        ["ECO", "Agenda"],
      ]
        .map(
          ([t, n]) =>
            `<button type="button" data-tf415-nav="${t}" class="tf415-navitem${!h && t === "HOME" ? " on" : ""}" ${!h && t === "HOME" ? 'aria-current="page"' : ""}>${n}</button>`,
        )
        .join(
          "",
        )}<button type="button" data-tf415-nav="WORKSPACES" class="tf415-navitem${h ? " on" : ""}" ${h ? 'aria-current="page"' : ""}>Painéis e Workspaces</button></div><div class="tf413-layout"><div class="tf413-main">${pt()}</div><div class="tf413-side">${dt()}${ft()}${ut()}${ht()}</div></div><div class="tf413-bottom"><span>Visão consolidada das ferramentas existentes. Sem envio de ordens · dados sujeitos à fonte e ao horário de mercado.</span><button type="button" data-tf415-nav="WORKSPACES">Personalizar painéis →</button></div></div>`;
    }
    function Ot() {
      if (!document.body.classList.contains("trmon")) return ((h = !1), null);
      const e = document.getElementById($);
      return e ? (e.remove(), { node: e }) : null;
    }
    function W(e) {
      const t = document.querySelector(".trm");
      if (!t || !document.body.classList.contains("trmon")) {
        document.body.classList.remove("tf413-home", "tf413-advanced");
        return;
      }
      (document.body.classList.toggle("tf413-home", !h),
        document.body.classList.toggle("tf413-advanced", h));
      const n = t.querySelector("#" + $);
      (n
        ? n.querySelectorAll("[data-tf415-nav]").forEach((o) => {
            const a = h
              ? o.dataset.tf415Nav === "WORKSPACES"
              : o.dataset.tf415Nav === "HOME";
            (o.classList.toggle("on", a),
              a
                ? o.setAttribute("aria-current", "page")
                : o.removeAttribute("aria-current"));
          })
        : t.prepend(
            e?.node ||
              (() => {
                const o = document.createElement("div");
                return ((o.innerHTML = Rt()), o.firstElementChild);
              })(),
          ),
        t.querySelector(".tf413-back")?.remove(),
        h || (clearTimeout(ct), (ct = setTimeout(() => L(!1), 350))));
    }
    function Bt() {
      const e = document.querySelector("#" + $);
      if (!e) return;
      const t = e.querySelector(".tf413-main"),
        n = e.querySelector(".tf413-side");
      !t ||
        !n ||
        ((t.innerHTML = pt()),
        (n.innerHTML = [dt(), ft(), ut(), ht()].join("")));
    }
    function I() {
      const e = document.querySelector("#" + $ + " .tf413-chartplot");
      if (!e) return;
      e.innerHTML = R ? gt() : mt();
      const t = document.querySelector("#" + $ + " .tf413-chartfoot span");
      t &&
        (t.textContent = `${Math.min(D(m[v]).length, D(m[p]).length)} pontos disponíveis (máx.)`);
    }
    async function L(e) {
      if (
        h ||
        J ||
        document.hidden ||
        !document.querySelector("#" + $) ||
        (!e && Date.now() - E < 45e3)
      )
        return;
      ((J = !0), (E = Date.now()));
      const t = V();
      try {
        const n = [
          Promise.resolve().then(() => t.EXT?.GLOBAL?.load?.()),
          Promise.resolve().then(() => t.EXT?.DIFUT?.load?.()),
          Promise.resolve().then(() => t.EXT?.NEWSBR?.load?.()),
          Promise.resolve().then(() => t.EXT?.NEWSUS?.load?.()),
          Promise.resolve().then(() => t.trFn?.("agenda", {}, 6e4)),
        ];
        (await Promise.allSettled(n),
          t.EXT?.GLOBAL?.load || (await t.trFn?.("cot", z, 3e4)),
          t.EXT?.DIFUT?.load || (await t.trFn?.("copom", {}, 6e4)),
          t.EXT?.NEWSBR?.load || (await t.trFn?.("noticias", it, 18e4)),
          t.EXT?.NEWSUS?.load || (await t.trFn?.("noticias", lt, 18e4)),
          await Promise.allSettled([
            t.tec?.pegaVelas?.(m[v], F()),
            t.tec?.pegaVelas?.(m[p], F()),
          ]),
          !h && document.querySelector("#" + $) && Bt());
      } finally {
        J = !1;
      }
    }
    function C(e) {
      h = e === "advanced";
      try {
        localStorage.setItem(At, h ? "advanced" : "overview");
      } catch {}
      W();
    }
    function at(e) {
      C("advanced");
      const t = V();
      if (!t) return;
      const n = t.layAtual?.();
      let o = t.TR?.foco || 0;
      (n?.p?.length && (o = Math.max(0, Math.min(o, n.p.length - 1))),
        t.TR && ((t.TR.foco = o), (t.TR.mob = o)),
        t.roda(e, o));
    }
    function Ft(e) {
      if (e === "HOME") {
        C("overview");
        return;
      }
      if (e === "WORKSPACES") {
        C("advanced");
        return;
      }
      if (e === "GP") {
        at("IBOV G");
        return;
      }
      at(e);
    }
    function It() {
      C("advanced");
      const e = document.querySelector("#trcmd");
      (e?.focus({ preventScroll: !0 }), e || U.TraderTerminalQuick?.show?.());
    }
    (document.addEventListener(
      "click",
      (e) => {
        const t = e.target.closest?.("#tf413 [data-tf415-nav]");
        t && (e.preventDefault(), Ft(t.dataset.tf415Nav));
      },
      !0,
    ),
      document.addEventListener(
        "click",
        (e) => {
          const t = e.target.closest?.(
            "#tf413 [data-tf413-advanced],.tf413-back [data-tf413-overview],#tf413 [data-tf413-search],#tf413 [data-tf413-cmd],#tf413 [data-tf413-period],#tf413 [data-tf413-full],#tf413 [data-tf413-table],#tf413 [data-tf413-refresh]",
          );
          if (t) {
            if ((e.preventDefault(), t.hasAttribute("data-tf413-advanced"))) {
              C("advanced");
              return;
            }
            if (t.hasAttribute("data-tf413-overview")) {
              C("overview");
              return;
            }
            if (t.hasAttribute("data-tf413-search")) {
              It();
              return;
            }
            if (t.hasAttribute("data-tf413-cmd")) {
              at(t.dataset.tf413Cmd);
              return;
            }
            if (t.hasAttribute("data-tf413-period")) {
              const n = F();
              ((x = t.dataset.tf413Period),
                (B = null),
                (w = null),
                document
                  .querySelectorAll("[data-tf413-period]")
                  .forEach((s) => s.classList.toggle("on", s === t)));
              const o = document.querySelector("[data-tf413-start]");
              if (o) {
                const s = _.find((i) => i[0] === x)?.[1] ?? 366;
                o.value = new Date(Date.now() - Math.min(s, 36500) * 864e5)
                  .toISOString()
                  .slice(0, 10);
              }
              const a = document.querySelector("[data-tf413-end]");
              (a && (a.value = new Date().toISOString().slice(0, 10)),
                I(),
                n !== F() && ((E = 0), L(!0)));
              return;
            }
            if (t.hasAttribute("data-tf413-table")) {
              ((R = !R), (t.textContent = R ? "Gráfico" : "Tabela"), I());
              return;
            }
            if (t.hasAttribute("data-tf413-refresh")) {
              ((E = 0), L(!0));
              return;
            }
            if (t.hasAttribute("data-tf413-full")) {
              ((O = !O),
                document
                  .querySelector("#tf413 .tf413-chartcard")
                  ?.classList.toggle("tf413-fullscreen", O),
                (t.textContent = O ? "⊠" : "⤢"));
              return;
            }
          }
        },
        !0,
      ),
      document.addEventListener(
        "change",
        (e) => {
          const t = e.target;
          if (
            t.closest?.("#" + $) &&
            (t.matches("[data-tf413-left]") &&
              ((v = t.value), (E = 0), L(!0), I()),
            t.matches("[data-tf413-right]") &&
              ((p = t.value), (E = 0), L(!0), I()),
            t.matches("[data-tf413-frequency]") && ((X = t.value), I()),
            t.matches("[data-tf413-start],[data-tf413-end]"))
          ) {
            const n = document.querySelector("[data-tf413-start]")?.value,
              o = document.querySelector("[data-tf413-end]")?.value,
              a = Date.parse(n + "T00:00:00Z"),
              s = Date.parse(o + "T23:59:59Z");
            isFinite(a) &&
              isFinite(s) &&
              a <= s &&
              ((B = a / 1e3),
              (w = s / 1e3),
              document
                .querySelectorAll("[data-tf413-period]")
                .forEach((i) => i.classList.remove("on")),
              I());
          }
        },
        !0,
      ),
      document.addEventListener("keydown", (e) => {
        e.key === "Escape" &&
          O &&
          ((O = !1),
          document
            .querySelector("#tf413 .tf413-chartcard")
            ?.classList.remove("tf413-fullscreen"));
      }),
      document.addEventListener("visibilitychange", () => {
        !document.hidden &&
          !h &&
          document.querySelector("#" + $) &&
          Date.now() - E > 12e4 &&
          L(!1);
      }),
      U.TraderUI?.onRender &&
        U.TraderUI.onRender("terminal-integrado-v415", {
          before: Ot,
          after: W,
        }),
      document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", W, { once: !0 })
        : W(),
      (U.TraderTerminalV413 = {
        mount: W,
        refresh: L,
        view: C,
        inventory:
          "Visão geral integrada à navegação original; comandos GLOBAL, DIFUT, NEWSBR, ECO, GP e Workspaces reutilizados, sem duplicação de fontes.",
      }));
  })(window);
} catch (e) {
  console.error("[v522] falha em terminal-v413.js", e);
}
try {
  (function () {
    "use strict";
    const l = {
        home: "Início",
        dia: "Meu dia",
        ops: "Operações",
        trades: "Day trade",
        swing: "Swing trade",
        opc: "Opções",
        fx: "EUA e Forex",
        mercado: "Mercado",
        term: "Terminal",
        juros: "Juros e DI",
        stats: "Diário",
        regras: "Checklist",
        carteiras: "Carteira",
        estudos: "Estudos",
        mais: "Configurações",
        conta: "Conta e sincronização",
        status: "Status do sistema",
        import: "Importar dados",
        painel: "Painel de capital e risco",
        mesa: "Mesa proprietária",
        contratos: "Calculadora de contratos",
        carreira: "Plano de transição",
        analise: "Análise IA da carteira",
        imposto: "Imposto de renda",
        termos: "Privacidade e termos",
        rev: "Revisão",
        live: "Ao vivo",
        graf: "Gráficos",
        ativos: "Ativos",
        livro: "Livro",
        dash: "Estatísticas",
        opgrade: "Grade de opções",
        opfluxo: "Fluxo",
        opcart: "Carteira de opções",
        swbt: "Backtest",
        dtrpy: "Replay",
      },
      g = new Set([
        "conta",
        "status",
        "import",
        "painel",
        "mesa",
        "contratos",
        "carreira",
        "analise",
        "imposto",
        "termos",
      ]),
      v = (t) =>
        String(t).replace(
          /[&<>"']/g,
          (e) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[e],
        ),
      d = () => {
        try {
          return typeof tab == "string" ? tab : "";
        } catch {
          return "";
        }
      },
      p = () => document.getElementById("wf-chat-panel"),
      m = () => {
        const t = p();
        return !!t && !t.hidden && getComputedStyle(t).display !== "none";
      },
      f = () => {
        try {
          window.TraderChat?.close?.();
        } catch (t) {
          console.warn("v414: não foi possível minimizar a IA", t);
        }
      },
      h = (t) => {
        if (!t) return;
        f();
        const e = document.getElementById("dt394-drawer");
        (e && (e.hidden = !0),
          document.body.classList.remove("dt394-drawer-open"),
          document
            .querySelector('[data-dt393-action="menu"]')
            ?.setAttribute("aria-expanded", "false"));
        const r = document.querySelector(
          '#app [data-a="gotab"][data-id="' + t + '"]',
        );
        if (r) {
          r.click();
          return;
        }
        try {
          ((tab = t),
            render(),
            window.scrollTo({ left: 0, top: 0, behavior: "instant" }));
        } catch (o) {
          console.warn("v414: rota não disponível", t, o);
        }
      };
    function w() {
      const t = document.querySelector("#app .dt393-native");
      if (!t || document.getElementById("dt414-settings")) return;
      const e = document.createElement("section");
      ((e.id = "dt414-settings"),
        e.setAttribute("aria-label", "Acessos essenciais de Configurações"),
        (e.innerHTML =
          '<h1>Configurações</h1><p>Conta, sincronização, diagnóstico e preferências do aplicativo.</p><div id="dt414-essentials" class="dt414-essentials"></div>'),
        t.prepend(e));
      const r = e.querySelector(".dt414-essentials");
      function o(n, s, k) {
        const y = t.querySelector('[data-a="gotab"][data-id="' + n + '"]'),
          u = y || document.createElement("button");
        (y ||
          ((u.type = "button"), (u.dataset.dt414Go = n), (u.textContent = s)),
          u.classList.add("dt414-essential"),
          k.appendChild(u));
      }
      for (const [n, s] of [
        ["conta", "Conta e sincronização"],
        ["status", "Status do sistema"],
      ])
        o(n, s, r);
      const a = document.createElement("details");
      ((a.id = "dt414-extra"),
        (a.innerHTML =
          '<summary>Outras ferramentas de gestão e segurança</summary><div class="dt414-essentials dt414-extra-grid"></div>'));
      const i = a.querySelector(".dt414-extra-grid");
      for (const [n, s] of [
        ["mesa", "Mesa proprietária e regras"],
        ["carreira", "Plano de transição"],
        ["termos", "Privacidade e termos"],
      ])
        o(n, s, i);
      e.appendChild(a);
    }
    function C() {
      const t = document.querySelector("#app .dt393-native");
      if (!t || document.getElementById("dt414-back")) return;
      const e = document.createElement("div");
      ((e.id = "dt414-back"),
        (e.innerHTML =
          '<button type="button" data-dt414-go="mais" aria-label="Voltar para Configurações">← Configurações</button><span>' +
          v(l[d()] || "Ferramenta") +
          "</span>"),
        t.prepend(e));
    }
    function S() {
      const t = document.querySelector("#dt394-drawer .dt394-nav-list");
      if (!t || t.querySelector("#dt414-drawer-access")) return;
      const e = document.createElement("div");
      ((e.id = "dt414-drawer-access"),
        (e.innerHTML =
          '<h3>Conta e sistema</h3><button type="button" data-dt414-go="conta" data-dt394-filter="conta login sincronizacao">Conta e sincronização</button><button type="button" data-dt414-go="status" data-dt394-filter="status sistema diagnostico">Status do sistema</button><button type="button" data-dt414-go="import" data-dt394-filter="importar profit csv">Importar do Profit</button><button type="button" data-dt414-go="painel" data-dt394-filter="capital risco backup metas">Capital, risco e backup</button><button type="button" data-dt414-go="mais" data-dt394-filter="configuracoes preferencias">Todas as configurações</button>'),
        t.appendChild(e));
    }
    function E() {
      const t = d(),
        e = document.querySelector("#dt393-global-head .dt393-title");
      (e && l[t] && (e.textContent = l[t]),
        document
          .querySelectorAll(
            "#dt393-global-head .dt394-quicknav button[data-dt393-route],#dt394-drawer button[data-dt393-route]",
          )
          .forEach((o) => {
            if (!g.has(t)) return;
            const a = o.dataset.dt393Route === "mais";
            (o.classList.toggle("active", a),
              a
                ? o.setAttribute("aria-current", "page")
                : o.removeAttribute("aria-current"));
          }));
    }
    function b() {
      const t = d(),
        e = document.getElementById("onb");
      if (e) {
        if (t !== "home") e.remove();
        else if (!e.querySelector('[data-dt414-go="conta"]')) {
          const r = e.querySelector(".sh") || e,
            o = document.createElement("button");
          ((o.type = "button"),
            (o.dataset.dt414Go = "conta"),
            (o.className = "btn s dt414-existing-account"),
            (o.textContent = "Já tenho conta — entrar e sincronizar"),
            r.appendChild(o));
        }
      }
      (t === "mais" ? w() : g.has(t) && C(),
        S(),
        E(),
        document.body.classList.toggle("dt414-chat-open", m()));
    }
    function c() {
      const t = p();
      if (
        (document.body.classList.toggle("dt414-chat-open", m()), !t || t.hidden)
      )
        return;
      (t.setAttribute("role", "dialog"), t.setAttribute("aria-modal", "false"));
      const e = t.querySelector("[data-chat-close]");
      e &&
        ((e.textContent = "×"),
        e.setAttribute("aria-label", "Fechar a Economista IA"));
    }
    function q() {
      if (window.__dt414ChatBound) return;
      window.__dt414ChatBound = !0;
      const t = window.TraderChat;
      if (t?.open && t?.close) {
        const a = t.open,
          i = t.close;
        ((t.open = function (...n) {
          const s = a.apply(this, n);
          return (c(), s);
        }),
          (t.close = function (...n) {
            const s = i.apply(this, n);
            return (c(), s);
          }));
      }
      (document.addEventListener(
        "click",
        (a) => {
          const i = a.target.closest?.("[data-dt414-go]");
          if (i) {
            (a.preventDefault(), a.stopImmediatePropagation());
            const s = i.dataset.dt414Go;
            h(s);
            return;
          }
          if (a.target.closest?.("#wf-chat-panel [data-chat-close]")) {
            queueMicrotask(c);
            return;
          }
          if (a.target.closest?.("#economista-flutuante .wf-chat-launcher")) {
            queueMicrotask(c);
            return;
          }
          const n = p();
          m() &&
            n &&
            !n.contains(a.target) &&
            !a.target.closest?.("#economista-flutuante .wf-chat-launcher") &&
            (f(), c());
        },
        !0,
      ),
        document.addEventListener(
          "keydown",
          (a) => {
            a.key === "Escape" && m() && (f(), c(), a.preventDefault());
          },
          !0,
        ));
      const e = new MutationObserver((a) => {
          a.some(
            (i) =>
              i.attributeName === "hidden" ||
              i.attributeName === "aria-expanded",
          ) && c();
        }),
        r = p(),
        o = document.querySelector("#economista-flutuante .wf-chat-launcher");
      (r && e.observe(r, { attributes: !0, attributeFilter: ["hidden"] }),
        o &&
          e.observe(o, { attributes: !0, attributeFilter: ["aria-expanded"] }),
        document.readyState === "loading" &&
          document.addEventListener("DOMContentLoaded", c, { once: !0 }));
    }
    if (typeof render == "function") {
      const t = render;
      let e = d();
      render = function (...r) {
        const o = t.apply(this, r);
        b();
        const a = d();
        return (
          a !== e &&
            ((e = a),
            window.scrollTo({ left: 0, top: 0, behavior: "instant" })),
          o
        );
      };
    }
    (q(),
      b(),
      (window.DiarioRecuperacaoV414 = {
        enhance: b,
        navigate: h,
        closeChat: f,
        labels: Object.keys(l),
      }));
  })();
} catch (e) {
  console.error("[v522] falha em recuperacao-v414.js", e);
}
try {
  (function (o) {
    "use strict";
    const i = o.document;
    if (!i) return;
    const c = (t, a, e) => Math.min(e, Math.max(a, t)),
      S = "dt-terminal-space-v416";
    let m = {};
    try {
      const t = JSON.parse(o.localStorage?.getItem(S) || "{}");
      t && typeof t == "object" && (m = t);
    } catch {}
    const d = (t) => c(Number(m[t] ?? 14) || 0, 0, 35),
      A = (t, a) => {
        m[t] = c(Number(a) || 0, 0, 35);
        try {
          o.localStorage?.setItem(S, JSON.stringify(m));
        } catch {}
      };
    function x() {
      return o.TerminalChart
        ? ((o.TerminalChart.padding = (t, a) =>
            Math.max(0, Math.round(((+a || 0) * d(t)) / 100))),
          !0)
        : !1;
    }
    x();
    const u = (t, a, e, n) => o.TRM?.tec?.chartView?.(t, a, e, n),
      M = (t) => t?.closest?.("svg[data-g9svg]"),
      h = (t) => Number(t?.dataset?.g9svg),
      D = (t) =>
        t?.closest("[data-trp]") || t?.closest(".trpb") || t?.parentElement;
    let w = !1;
    const C = (t) =>
      '<div class="g418-toolbar" data-g418-panel="' +
      t +
      '" aria-label="Mover gráfico"><span class="g418-guide">✋ <b>Arraste o gráfico</b><span class="g418-desktop"> para mover preço e tempo</span><span class="g418-mobile"> · pinça para zoom</span></span><button type="button" data-g418-action="reset" title="Restaurar gráfico" aria-label="Restaurar enquadramento">⟲</button><details class="g418-more"><summary aria-label="Opções do gráfico">⋯</summary><div class="g418-options"><label>Margem direita <output data-g418-out="' +
      t +
      '">' +
      d(t) +
      '%</output><input type="range" data-g418-space="' +
      t +
      '" min="0" max="35" step="1" value="' +
      d(t) +
      '" aria-label="Margem direita"></label><button type="button" data-g418-action="auto">Preço automático</button></div></details><span class="g418-sr" aria-live="polite"></span></div>';
    function z() {
      ((w = !1), x());
      for (const t of i.querySelectorAll("svg[data-g9svg]")) {
        const a = h(t),
          e = D(t);
        if (!Number.isFinite(a) || !e) continue;
        const n = e.querySelector(".g9bar");
        if (!n) continue;
        const s = e.querySelector(".g416-controls");
        s && s.remove();
        const l = e.querySelector(".g418-toolbar");
        (l && Number(l.dataset.g418Panel) !== a && l.remove(),
          e.querySelector(".g418-toolbar") ||
            n.insertAdjacentHTML("afterend", C(a)));
      }
    }
    function R() {
      w || ((w = !0), o.requestAnimationFrame(z));
    }
    const E = () => {
      z();
      const t = i.getElementById("app") || i.body;
      new MutationObserver(R).observe(t, { childList: !0, subtree: !0 });
    };
    i.readyState === "loading"
      ? i.addEventListener("DOMContentLoaded", E, { once: !0 })
      : E();
    function g(t, a) {
      const e = i.querySelector(
        '.g418-toolbar[data-g418-panel="' + t + '"] .g418-sr',
      );
      e && (e.textContent = a);
    }
    (i.addEventListener(
      "click",
      (t) => {
        const a = t.target.closest?.("[data-g418-action]");
        if (!a) return;
        const e = a.closest(".g418-toolbar"),
          n = Number(e?.dataset.g418Panel);
        Number.isFinite(n) &&
          (t.preventDefault(),
          t.stopPropagation(),
          a.dataset.g418Action === "reset"
            ? (u(n, "reset", 0), g(n, "Visualização restaurada"))
            : a.dataset.g418Action === "auto" &&
              (u(n, "priceauto", 0),
              g(n, "Preço automático"),
              e.querySelector("details")?.removeAttribute("open")));
      },
      !0,
    ),
      i.addEventListener(
        "input",
        (t) => {
          const a = t.target.closest?.("[data-g418-space]");
          if (!a) return;
          const e = a
            .closest(".g418-options")
            ?.querySelector("[data-g418-out]");
          e && (e.textContent = a.value + "%");
        },
        !0,
      ),
      i.addEventListener(
        "change",
        (t) => {
          const a = t.target.closest?.("[data-g418-space]");
          if (!a) return;
          const e = Number(a.dataset.g418Space);
          Number.isFinite(e) &&
            (A(e, Number(a.value)),
            x(),
            u(e, "page", 0),
            g(e, "Margem direita " + d(e) + "%"));
        },
        !0,
      ));
    let r = null;
    const v = (t) => ({ x: t.clientX, y: t.clientY }),
      N = (t, a) => Math.hypot(t.x - a.x, t.y - a.y);
    function b(t) {
      if (t)
        try {
          (t.svg.style.removeProperty("transform"),
            t.svg.classList.remove("g418-grabbing"));
        } catch {}
    }
    function F(t) {
      const a = M(t.target);
      if (!a || t.button > 0 || !o.TRM?.tec?.chartView) return;
      const e = h(a),
        n = a.getBoundingClientRect();
      if (!(!Number.isFinite(e) || n.width < 15 || n.height < 15)) {
        if (
          (r && (r.svg !== a || r.panel !== e) && (b(r), (r = null)),
          r ||
            (r = {
              panel: e,
              svg: a,
              rect: n,
              pointers: new Map(),
              starts: new Map(),
              multi: !1,
              initialPinch: null,
              latestPinch: null,
              moved: !1,
            }),
          r.starts.set(t.pointerId, v(t)),
          r.pointers.set(t.pointerId, v(t)),
          r.pointers.size === 2)
        ) {
          r.multi = !0;
          const s = [...r.pointers.values()];
          ((r.initialPinch = { a: { ...s[0] }, b: { ...s[1] } }),
            (r.latestPinch = { a: { ...s[0] }, b: { ...s[1] } }),
            b(r));
        }
        (r.svg.classList.add("g418-grabbing"),
          t.pointerType === "touch" && t.cancelable && t.preventDefault(),
          t.stopImmediatePropagation());
      }
    }
    function O(t) {
      const a = r;
      if (!a || !a.pointers.has(t.pointerId)) return;
      const e = v(t);
      if (
        (a.pointers.set(t.pointerId, e),
        t.cancelable && t.preventDefault(),
        t.stopImmediatePropagation(),
        a.pointers.size >= 2)
      ) {
        const f = [...a.pointers.values()];
        a.latestPinch = { a: { ...f[0] }, b: { ...f[1] } };
        return;
      }
      if (a.multi) return;
      const n = a.starts.get(t.pointerId) || e,
        s = e.x - n.x,
        l = e.y - n.y;
      Math.hypot(s, l) < 5 ||
        ((a.moved = !0),
        (a.svg.style.transform =
          "translate3d(" +
          c(s, -a.rect.width * 0.5, a.rect.width * 0.5).toFixed(1) +
          "px," +
          c(l, -a.rect.height * 0.35, a.rect.height * 0.35).toFixed(1) +
          "px,0)"));
    }
    function q(t, a) {
      const e = r;
      if (!e || !e.pointers.has(t.pointerId)) return;
      const n = v(t);
      if (
        (a || e.pointers.set(t.pointerId, n),
        t.cancelable && t.preventDefault(),
        t.stopImmediatePropagation(),
        e.pointers.size >= 2)
      ) {
        const p = [...e.pointers.values()];
        e.latestPinch = { a: { ...p[0] }, b: { ...p[1] } };
      }
      if (
        (e.pointers.delete(t.pointerId),
        e.pointers.size || (b(e), (r = null), a))
      )
        return;
      if (e.multi && e.initialPinch && e.latestPinch) {
        const { a: p, b: y } = e.initialPinch,
          { a: P, b: L } = e.latestPinch,
          B = c(
            Math.abs(p.x - y.x) / Math.max(18, Math.abs(P.x - L.x)),
            0.45,
            2.3,
          ),
          V = c(
            Math.abs(p.y - y.y) / Math.max(18, Math.abs(P.y - L.y)),
            0.45,
            2.3,
          ),
          T = N(p, y),
          k = N(P, L),
          I = c(T / Math.max(18, k), 0.45, 2.3),
          K = c(((p.x + y.x) / 2 - e.rect.left) / e.rect.width, 0, 1);
        Math.abs(I - 1) > 0.055 &&
          (u(e.panel, "zoom", I, K),
          u(e.panel, "pricezoom", I),
          g(e.panel, "Zoom alterado"));
        return;
      }
      const s = [...e.starts.values()][0] || n,
        l = n.x - s.x,
        f = n.y - s.y;
      Math.hypot(l, f) <= 7 ||
        (u(e.panel, "move", {
          time: c(l / e.rect.width, -1, 1),
          price: c(f / e.rect.height, -1, 1),
        }),
        g(e.panel, "Gráfico movimentado"));
    }
    (i.addEventListener("pointerdown", F, !0),
      i.addEventListener("pointermove", O, { capture: !0, passive: !1 }),
      i.addEventListener("pointerup", (t) => q(t, !1), !0),
      i.addEventListener("pointercancel", (t) => q(t, !0), !0),
      o.addEventListener("blur", () => {
        (b(r), (r = null));
      }),
      i.addEventListener(
        "wheel",
        (t) => {
          const a = M(t.target);
          if (!a || !(t.ctrlKey || t.metaKey)) return;
          const e = a.getBoundingClientRect(),
            n = h(a);
          !Number.isFinite(n) ||
            !e.width ||
            (t.cancelable && t.preventDefault(),
            t.stopImmediatePropagation(),
            u(
              n,
              "zoom",
              t.deltaY < 0 ? 0.88 : 1.14,
              c((t.clientX - e.left) / e.width, 0, 1),
            ));
        },
        { capture: !0, passive: !1 },
      ),
      i.addEventListener(
        "keydown",
        (t) => {
          const a = M(t.target);
          if (!a || t.altKey || t.ctrlKey || t.metaKey) return;
          const e = {
            ArrowLeft: ["page", 0.2],
            ArrowRight: ["page", -0.2],
            ArrowUp: ["pricepan", -0.12],
            ArrowDown: ["pricepan", 0.12],
            "+": ["zoom", 0.8],
            "=": ["zoom", 0.8],
            "-": ["zoom", 1.25],
            Home: ["reset", 0],
          };
          if (!e[t.key]) return;
          (t.preventDefault(), t.stopImmediatePropagation());
          const [n, s] = e[t.key];
          u(h(a), n, s, 0.5);
        },
        !0,
      ),
      (o.TraderChartGesturesV418 = Object.freeze({
        version: "v418",
        getSpace: d,
        mode: "grab",
        padding: (t, a) => o.TerminalChart?.padding?.(t, a),
      })));
  })(window);
} catch (e) {
  console.error("[v522] falha em terminal-controls-v418.js", e);
}
try {
  (function () {
    "use strict";
    const i = document,
      g = {
        get(t) {
          try {
            return localStorage.getItem(t);
          } catch {
            return null;
          }
        },
        set(t, e) {
          try {
            localStorage.setItem(t, e);
          } catch {}
        },
      },
      v = () => {
        try {
          return tab;
        } catch {
          return "";
        }
      },
      G = () => {
        try {
          return MKT.tab;
        } catch {
          return "";
        }
      },
      w = /^(ta-|m3\d\d|m4\d\d|cq3\d\d|dt3\d\d|dt4\d\d|studio-|wf-|v419-)/,
      k = (t) => t.nodeType === 1 && [...t.classList].some((e) => w.test(e)),
      A = (t) =>
        [...t.childNodes].filter(
          (e) => e.nodeType === 1 || (e.nodeType === 3 && e.nodeValue.trim()),
        ),
      _ = (t, e) =>
        t.nodeType === e.nodeType &&
        (t.nodeType !== 1 || t.tagName === e.tagName);
    function Q(t, e) {
      for (const n of [...e.attributes])
        if (n.name === "class") {
          const o = [...t.classList].filter(
              (a) => w.test(a) && !e.classList.contains(a),
            ),
            r = [e.className, ...o].join(" ").trim();
          t.className !== r && (t.className = r);
        } else if (n.name === "style") {
          const o = t.style.display;
          (t.getAttribute("style") !== n.value &&
            t.setAttribute("style", n.value),
            o && (t.style.display = o));
        } else
          t.getAttribute(n.name) !== n.value && t.setAttribute(n.name, n.value);
    }
    function L(t, e) {
      const n = A(t),
        o = A(e);
      let r = 0;
      for (const a of o) {
        for (; r < n.length && !_(n[r], a) && k(n[r]); ) r++;
        if (
          r < n.length &&
          a.nodeType === 3 &&
          n[r].nodeType === 1 &&
          (n[r].tagName.toLowerCase() === "svg" ||
            n[r].classList.contains("ico"))
        ) {
          r++;
          continue;
        }
        if (r >= n.length || !_(n[r], a) || !p(n[r], a)) return !1;
        r++;
      }
      for (; r < n.length; r++) if (!k(n[r])) return !1;
      return !0;
    }
    function p(t, e) {
      return t.nodeType === 3
        ? (t.nodeValue !== e.nodeValue && (t.nodeValue = e.nodeValue), !0)
        : (Q(t, e), L(t, e));
    }
    const K = (t) =>
      t.id
        ? "#" + CSS.escape(t.id)
        : [...t.classList]
            .filter((e) => !w.test(e))
            .map((e) => "." + CSS.escape(e))
            .join("");
    function z(t, e) {
      const n = new Set(),
        o = [];
      for (const r of [...e.children]) {
        const a = K(r);
        if (!a || /cqtabs/.test(a)) continue;
        const c = [...t.querySelectorAll(a)].find(
          (d) => !n.has(d) && ![...n].some((u) => u.contains(d)),
        );
        if (c) (n.add(c), o.push([c, r]));
        else if (/\.warn\b/.test(a)) o.push([null, r]);
        else return !1;
      }
      for (const [r, a] of o) {
        if (!r) {
          const d = t.querySelector(".cqtabs");
          d ? d.after(a) : t.prepend(a);
          continue;
        }
        let c = !1;
        try {
          c = p(r, a);
        } catch {}
        c || (m(r.parentElement), r.replaceWith(a));
      }
      return (
        t.querySelectorAll(".warn").forEach((r) => {
          !n.has(r) && !o.some((a) => a[1] === r) && r.remove();
        }),
        !0
      );
    }
    function m(t) {
      if (!t) return;
      const e = t.getBoundingClientRect().height;
      e &&
        ((t.style.minHeight = e + "px"),
        clearTimeout(t.__v419),
        (t.__v419 = setTimeout(() => {
          t.style.minHeight = "";
        }, 900)));
    }
    const C = (t) => {
        const e = i.createElement("template");
        return ((e.innerHTML = String(t).trim()), e.content);
      },
      R = () => {
        try {
          const t = S.ax || {};
          return [
            CQ.aba,
            CQ.vis,
            CQ.ord,
            (t.cqFav || []).map((e) => e.s).join(","),
            (t.alpx || []).map((e) => e.id + (e.fired ? "!" : "")).join(","),
          ].join("|");
        } catch {
          return "";
        }
      };
    let M = null;
    function N() {
      if (
        typeof window.cotHtml != "function" ||
        typeof window.cqPinta != "function" ||
        window.cqPinta.__v419
      )
        return !1;
      const nativePaint = window.cqPinta;
      const t = window.cotHtml;
      ((window.cotHtml = function () {
        const n = t.apply(this, arguments);
        return ((M = R()), n);
      }),
        (window.cotHtml.__v419 = 1));
      const e = function () {
        if (v() !== "mercado" || G() !== "cq") return;
        const n = i.getElementById("cotbox") || i.getElementById("cqbox");
        if (!n) return;
        if (n.classList.contains("market-quotes")) return nativePaint();
        const o = M,
          r = R(),
          a = window.cotHtml(),
          c = C(a).firstElementChild;
        if (!c) return;
        if (c.id === n.id && o === r)
          try {
            if (p(n, c) || z(n, c)) return;
          } catch (f) {
            console.warn("v419 cotações", f);
          }
        const d = n.closest(".market-monitor") || n.parentElement;
        m(d);
        let u = null;
        try {
          typeof segGuarda == "function" && (u = segGuarda());
        } catch {}
        n.replaceWith(c);
        try {
          u && typeof segRestaura == "function" && segRestaura(u);
        } catch {}
      };
      return ((e.__v419 = 1), (window.cqPinta = e), !0);
    }
    function O() {
      if (typeof window.adrPaint != "function" || window.adrPaint.__v419)
        return !1;
      const t = window.adrPaint,
        e = function () {
          const n = i.getElementById("adr");
          if (!n) return;
          let o;
          try {
            o = adrHtml();
          } catch {
            return t.apply(this, arguments);
          }
          const r = C(o);
          try {
            const a = i.createElement("div");
            if ((a.appendChild(r.cloneNode(!0)), L(n, a))) return;
          } catch {}
          (m(n.closest(".market-monitor") || n), (n.innerHTML = o));
        };
      return ((e.__v419 = 1), (window.adrPaint = e), !0);
    }
    const b = "diario-v419-mais";
    function B(t) {
      return t.textContent.trim().replace(/\s+/g, " ").slice(0, 80);
    }
    function F() {
      try {
        const t = new Intl.DateTimeFormat("pt-BR", {
            timeZone: "America/Sao_Paulo",
            hour: "2-digit",
            minute: "2-digit",
            weekday: "short",
            hour12: !1,
          }).formatToParts(new Date()),
          e = (o) => (t.find((r) => r.type === o) || {}).value || "",
          n = +e("hour") * 60 + +e("minute");
        return /s[áa]b|dom/i.test(e("weekday"))
          ? "pos"
          : n < 540
            ? "pre"
            : n <= 1105
              ? "pregao"
              : "pos";
      } catch {
        return "pregao";
      }
    }
    function H(t) {
      const e = t.querySelector(".dt393-shortcuts");
      if (e && !e.querySelector("[data-qkn]")) {
        const n = i.createElement("button");
        ((n.type = "button"),
          (n.dataset.qkn = "1"),
          (n.className = "v419-qk"),
          (n.innerHTML =
            '<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg> Registro rápido'));
        const o = e.querySelector('[data-dt393-action="newtrade"]');
        o ? o.after(n) : e.prepend(n);
      }
    }
    function h() {
      if (window.DIARIO_V420 || v() !== "home") return;
      const t = i.querySelector("#app .dt393-home"),
        e = i.getElementById("dt393-workspace");
      if (!t || !e) return;
      const n = e.querySelector(".dt393-native") || e,
        o = t.querySelector(".dt393-summary"),
        r = matchMedia("(min-width: 901px)").matches,
        a = t.querySelector(".dt393-phase:not(.dt393-phase-inner)");
      if (a && !a.dataset.v419) {
        a.dataset.v419 = "1";
        const s = [...a.querySelectorAll("button")],
          l = F(),
          V = { pre: 0, pregao: 1, pos: 2 }[l];
        (s.forEach((I, j) => {
          (I.classList.toggle("active", j === V),
            j === V
              ? I.setAttribute("aria-current", "true")
              : I.removeAttribute("aria-current"));
        }),
          s[2] &&
            (s[2].removeAttribute("data-dt393-route"),
            (s[2].dataset.v419Pos = "1")));
      }
      if (r) {
        H(t);
        const s = i.getElementById("v419-mais");
        (s && s.remove(), e.classList.remove("v419-recolhido"));
        return;
      }
      const c = (s) => [...n.children].find((l) => s.test(B(l))),
        d = i.getElementById("hg-hoje"),
        u = c(/^(Escala de turno|Trabalha em escala)/i),
        f = c(/^ÚLTIMOS TRADES/i);
      let y = o;
      for (const s of [d, u, f])
        !s ||
          !y ||
          (y.nextElementSibling !== s && y.after(s),
          s.classList.add("v419-promovido"),
          (y = s));
      if (
        (f &&
          f.querySelectorAll("*").forEach((s) => {
            s.children.length === 0 &&
              /Toque no \+/.test(s.textContent) &&
              (s.textContent =
                'Nenhum trade ainda. Use "Registrar trade" nos Atalhos rápidos para registrar o primeiro.');
          }),
        H(t),
        i.getElementById("v419-mais"))
      )
        E(g.get(b) === "1");
      else {
        const s = g.get(b) === "1",
          l = i.createElement("button");
        ((l.type = "button"),
          (l.id = "v419-mais"),
          (l.className = "v419-mais"),
          l.setAttribute("aria-controls", "dt393-workspace"),
          (l.innerHTML =
            '<span><b>Mais no Início</b><small>Rotina, carteiras, modalidades, calendário, inglês, patrimônio e personalização</small></span><i aria-hidden="true">▾</i>'),
          e.before(l),
          E(s));
      }
    }
    function E(t) {
      const e = i.getElementById("v419-mais"),
        n = i.getElementById("dt393-workspace");
      !e ||
        !n ||
        (e.setAttribute("aria-expanded", t ? "true" : "false"),
        n.classList.toggle("v419-recolhido", !t));
    }
    function T() {
      const t = i.querySelector("#dt394-drawer .dt394-nav-list");
      if (!t || i.getElementById("v419-drawer")) return;
      const e = i.createElement("div");
      ((e.id = "v419-drawer"),
        (e.innerHTML =
          '<h3>Mercado ao vivo</h3><button type="button" data-dt393-route="live" data-dt394-filter="monitor ao vivo profit radar trades de olho ponte">Monitor ao vivo e trades de olho</button><button type="button" data-dt393-route="graf" data-dt394-filter="gráficos tradingview níveis">Gráficos TradingView</button><button type="button" data-qkn="1" data-dt394-filter="registro rápido trade anotar">Registro rápido de trade</button>'));
      const n = i.getElementById("dt414-drawer-access");
      n ? n.before(e) : t.appendChild(e);
    }
    i.addEventListener(
      "click",
      (t) => {
        const e = t.target.closest("#v419-mais");
        if (e) {
          t.preventDefault();
          const o = e.getAttribute("aria-expanded") !== "true";
          (g.set(b, o ? "1" : "0"), E(o));
          return;
        }
        if (t.target.closest("[data-v419-pos]")) {
          (t.preventDefault(), t.stopImmediatePropagation());
          try {
            if (typeof GOR < "u" && GOR && typeof GOR.deb == "function") {
              (GOR.deb(), scrollTo(0, 0));
              return;
            }
          } catch {}
          try {
            ((tab = "dia"), render(), scrollTo(0, 0));
          } catch {}
        }
      },
      !0,
    );
    function x() {
      if (typeof window.render0 != "function" || window.render0.__v419)
        return !1;
      const t = window.render0,
        e = function () {
          const n = t.apply(this, arguments);
          try {
            h();
          } catch (o) {
            console.warn("v419 início", o);
          }
          try {
            T();
          } catch {}
          return n;
        };
      return ((e.__v419 = 1), (window.render0 = e), !0);
    }
    let q = null;
    function W() {
      const t = i.getElementById("app");
      !t ||
        q ||
        ((q = new MutationObserver(() => {
          if (
            window.DIARIO_V420 ||
            v() !== "home" ||
            matchMedia("(min-width: 901px)").matches
          )
            return;
          const e = i.querySelector("#dt393-workspace .dt393-native");
          if (e) {
            for (const n of e.children)
              if (
                n.tagName === "SECTION" &&
                /^(Escala de turno|Trabalha em escala|ÚLTIMOS TRADES)/i.test(
                  B(n),
                )
              ) {
                try {
                  h();
                } catch {}
                return;
              }
          }
        })),
        q.observe(t, { childList: !0, subtree: !0 }));
    }
    function D() {
      (W(), N(), O(), x(), T());
      try {
        h();
      } catch {}
    }
    i.readyState === "loading"
      ? i.addEventListener("DOMContentLoaded", D, { once: !0 })
      : D();
    let P = 0;
    const U = setInterval(() => {
      (P++, N(), O(), x(), T(), P > 10 && clearInterval(U));
    }, 700);
    window.DIARIO_V419 = { patchNode: p, lock: m, arrangeHome: h };
  })();
} catch (e) {
  console.error("[v522] falha em ajustes-v419.js", e);
}
