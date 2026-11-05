(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  function getStoredTheme() {
    try {
      var value = localStorage.getItem("theme");
      return value === "light" || value === "dark" ? value : null;
    } catch (error) {
      return null;
    }
  }

  function setTheme(theme, persist) {
    root.dataset.theme = theme;
    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch (error) {}
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b1514" : "#0f766e");
    var toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      var isDark = theme === "dark";
      var label = isDark ? "Switch to light mode" : "Switch to dark mode";
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute("title", label);
      toggle.setAttribute("aria-pressed", String(isDark));
    }
  }

  function initThemeToggle() {
    var navLinks = document.querySelector(".nav-links");
    if (!navLinks) return;
    var button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    button.setAttribute("aria-label", "Toggle dark mode");
    button.innerHTML =
      '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
      '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
    navLinks.appendChild(button);
    button.addEventListener("click", function () {
      setTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    });
    setTheme(root.dataset.theme === "dark" ? "dark" : "light", false);
    function onSystemChange(event) {
      if (!getStoredTheme()) setTheme(event.matches ? "dark" : "light", false);
    }
    if (systemDark.addEventListener) systemDark.addEventListener("change", onSystemChange);
    else if (systemDark.addListener) systemDark.addListener(onSystemChange);
  }

  function initProgress() {
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    var toTop = document.createElement("button");
    toTop.type = "button";
    toTop.className = "to-top";
    toTop.setAttribute("aria-label", "Back to top");
    toTop.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(toTop);

    var ticking = false;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var percent = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
      bar.style.width = percent + "%";
      toTop.classList.toggle("show", window.scrollY > 600);
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", update, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    update();
  }

  function initReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var selector =
      ".card, .skill-block, .tl-item, .case-study, .home-about, .contact-links, " +
      ".credential-card, .section-label, .section > .container > h2, .group-title, " +
      ".cs-meta-page, .case-figure";
    var elements = document.querySelectorAll(selector);
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    elements.forEach(function (element) {
      if (element.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      var siblings = element.parentElement
        ? Array.prototype.filter.call(element.parentElement.children, function (child) {
            return child.matches(selector);
          })
        : [];
      var index = Math.max(0, siblings.indexOf(element));
      element.style.setProperty("--reveal-delay", Math.min(index, 5) * 55 + "ms");
      element.classList.add("reveal");
      observer.observe(element);
    });
  }

  function initCounters() {
    if (reduceMotion) return;
    var counters = [];
    document.querySelectorAll(".hero-stats strong, .proj-stats strong").forEach(function (element) {
      if (/^\d/.test(element.textContent.trim())) counters.push(element);
    });
    if (!counters.length) return;

    function animate(element) {
      if (element.dataset.counted) return;
      element.dataset.counted = "true";
      var match = element.textContent.match(/^(\d+(?:\.\d+)?)/);
      if (!match) return;
      var target = parseFloat(match[1]);
      var decimals = (match[1].split(".")[1] || "").length;
      var suffix = element.textContent.slice(match[1].length);
      var duration = 900;
      var start = null;
      function frame(now) {
        if (start === null) start = now;
        var progress = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = (target * eased).toFixed(decimals) + suffix;
        if (progress < 1) {
          window.requestAnimationFrame(frame);
        } else {
          element.textContent = target.toFixed(decimals) + suffix;
        }
      }
      window.requestAnimationFrame(frame);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animate);
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (element) {
      observer.observe(element);
    });
  }

  var knowledge = [
    {
      keys: ["who", "about", "yourself", "background", "bio", "introduce"],
      answer:
        "Oketayot Emmanuel Kisembo is a software developer in Kampala, Uganda, studying Information Systems at Kyambogo University. He builds database-driven business systems — two are live in production — and is currently a sales and presales intern working on Veeam data protection at Mitsumi Distribution (Devjyot Traders)."
    },
    {
      keys: ["skill", "skills", "stack", "tech", "technology", "technologies", "language", "languages", "framework", "frameworks", "php", "mysql", "javascript", "next.js", "nextjs", "node", "node.js", "sql"],
      answer:
        "Core stack: PHP, MySQL, SQL design, JavaScript, and Next.js/Node.js. He also works with Linux, DNS and hosting, networking (CCNA-track), and Veeam backup and data protection. The focus is backend and database correctness first, then full-stack delivery."
    },
    {
      keys: ["project", "projects", "work", "portfolio", "built", "build", "shipped", "case study"],
      answer:
        "Six projects are on the site: Outpost DMS (live multi-depot distribution system), the LAPOK catalogue and WhatsApp ordering site (live), the Mitsumi/Veeam sales and presales campaign, Kumalo (Next.js/Node.js team contribution), an enterprise inventory database design, and SmartFix (PHP/MySQL registration module)."
    },
    {
      keys: ["outpost", "outpost dms", "dms", "distribution", "lapok dms"],
      answer:
        "Outpost DMS is a live multi-depot distribution platform for LAPOK Ventures at dms.afriboards.com. It handles stock taking, dispatch against approved routes, cash handover, and PDF reporting, with server-enforced roles for cadets, accountants, managers and admins. It runs on a 14-table MySQL schema."
    },
    {
      keys: ["catalogue", "catalog", "whatsapp", "lapok", "ordering", "ecommerce", "e-commerce", "e commerce"],
      answer:
        "The LAPOK catalogue site (lapok.afriboards.com) is a product catalogue with per-SKU slideshows, a promotions engine, and a WhatsApp bulk-ordering flow. Customers compose an order on the site and it arrives as a structured WhatsApp message. There is no checkout because buying happens through existing WhatsApp relationships."
    },
    {
      keys: ["certification", "certifications", "certificate", "certificates", "cert", "certs", "credential", "credentials", "cisco", "ccna", "data analytics", "network security", "networking"],
      answer:
        "Cisco Networking Academy credentials: CCNA: Network Security (31 Oct 2026), Data Analytics Essentials (27 Aug 2026), and CCNA: Introduction to Networks (10 Jul 2025)."
    },
    {
      keys: ["badge", "badges", "vsp", "vmts", "veeam university", "veeam badges", "veeam training", "veeam certifications", "veeam certification", "veeam credentials", "university partner", "training", "learned", "learning"],
      answer:
        "Veeam University Partner 2026 badges: Veeam Sales Professional (VSP) — Cyber Resilience & Recovery, SaaS Cloud Protection, Modern Apps & Kubernetes, On Premises & Cloud, and Provider Delivery; plus Veeam Technical Specialist (VMTS) — SaaS Protection, Cybersecurity & DR, Public Cloud, and Kubernetes Data Protection. That is nine badges across five VSP and four VMTS tracks."
    },
    {
      keys: ["mitsumi", "veeam", "sales", "presales", "internship", "intern", "devjyot", "data protection", "backup", "recovery"],
      answer:
        "Since September 2026 Emmanuel has been a sales and presales intern at Mitsumi Distribution (Devjyot Traders) in Kampala, focused on the Veeam data-protection portfolio. He built a partner-facing email campaign and researched backup and recovery, Veeam licensing, VMware/Broadcom changes, and the wider vendor line card."
    },
    {
      keys: ["kumalo", "acholi", "kumalotech"],
      answer:
        "Kumalo is an Acholi community platform built with KumaloTech. Emmanuel contributed to the Next.js frontend and Node.js API inside an existing professional codebase. The repository is private, so there is no public link, but he can walk through the architecture in an interview."
    },
    {
      keys: ["inventory", "database", "schema", "normalisation", "normalization", "er diagram", "oracle"],
      answer:
        "The Enterprise Inventory Management System was an academic database-design project: ER modelling, a relational schema on Oracle, normalisation trade-offs, and a design defended on demo day. That discipline carried into Outpost DMS's 14-table production schema."
    },
    {
      keys: ["smartfix", "repair"],
      answer:
        "SmartFix IT Solutions was a group-built repair-booking site. Emmanuel built the shared PHP/MySQL database connection layer and the user registration module, including validation, duplicate-account handling, and secure credential storage."
    },
    {
      keys: ["experience", "cv", "resume", "résumé", "job", "career"],
      answer:
        "Emmanuel's experience spans live production systems (Outpost DMS and the LAPOK catalogue), a team contribution at KumaloTech, academic database projects, and his current sales and presales internship at Mitsumi Distribution. The Résumé link opens an in-browser preview with a download option; for a current copy, email okettaemma1@gmail.com."
    },
    {
      keys: ["education", "school", "university", "kyambogo", "study", "student", "cgpa", "degree"],
      answer:
        "He studies Information Systems at Kyambogo University and currently holds a 3.99 CGPA. His coursework and self-study cover databases, networking (CCNA-track), Linux, and web development."
    },
    {
      keys: ["contact", "email", "phone", "call", "hire", "available", "reach", "whatsapp", "linkedin", "github", "opportunity", "opportunities", "role", "roles", "looking"],
      answer:
        "Email: okettaemma1@gmail.com\nPhone/WhatsApp: +256 782 761164\nLinkedIn: linkedin.com/in/oketayot-emmanuel-kisembo-2bb05841b\nGitHub: github.com/Ekiz538\nHe is open to junior developer roles and based in Kampala, Uganda."
    },
    {
      keys: ["location", "where", "kampala", "uganda", "remote", "remotely", "based"],
      answer:
        "He is based in Kampala, Uganda. He is open to junior developer roles and can work remotely."
    },
    {
      keys: ["now", "currently", "current", "latest", "right now"],
      answer:
        "Right now he is a sales and presales intern at Mitsumi Distribution working on Veeam data protection, while continuing to build database-driven systems. The newest case study is the Mitsumi/Veeam campaign."
    },
    {
      keys: ["live", "demo", "link", "links", "open", "try"],
      answer:
        "Live links: Outpost DMS at dms.afriboards.com and the LAPOK catalogue at lapok.afriboards.com. The Mitsumi/Veeam case study is on this site, and the rest of the projects are linked from the Projects page."
    },
    {
      keys: ["thanks", "thank", "great", "nice", "cool"],
      answer:
        "You're welcome. If you'd like to talk about a role or a project, email okettaemma1@gmail.com."
    }
  ];

  var fallback =
    "I can answer questions about Emmanuel's projects, skills, certifications, experience at Mitsumi/Veeam, education, or contact details. Try one of the suggestions below, or email okettaemma1@gmail.com for anything else.";

  var keyBoost = {
    mitsumi: 3, veeam: 3, sales: 2, presales: 3, internship: 3, intern: 3, devjyot: 3,
    "data protection": 3, backup: 2, recovery: 2,
    contact: 3, email: 3, phone: 3, hire: 2, linkedin: 3, github: 3, whatsapp: 3, reach: 2,
    certification: 3, certifications: 3, certificate: 3, certificates: 3, cert: 3, certs: 3,
    credential: 3, credentials: 3, cisco: 3, ccna: 3, "data analytics": 3, "network security": 3, networking: 1,
    badge: 3, badges: 3, vsp: 3, vmts: 3, "veeam university": 3, "veeam badges": 3,
    "veeam training": 3, "veeam certifications": 3, "veeam certification": 3, "veeam credentials": 3,
    "university partner": 3, training: 3, learned: 3, learning: 3,
    available: 2, remote: 2, remotely: 2, cv: 2, resume: 2, "résumé": 2, job: 1, career: 1,
    opportunity: 2, opportunities: 2, role: 2, roles: 2, looking: 2,
    outpost: 3, dms: 3, lapok: 3, catalogue: 3, catalog: 3, "e-commerce": 2, "e commerce": 2,
    kumalo: 3, acholi: 3, kumalotech: 3,
    inventory: 3, oracle: 3, smartfix: 3, repair: 2,
    project: 2, projects: 2, portfolio: 2, build: 2, built: 2, shipped: 2, work: 1,
    experience: 1, education: 1, kyambogo: 2, cgpa: 2, location: 1, based: 1,
    now: 1, currently: 1, latest: 1, live: 1, demo: 1, stack: 1, skills: 1
  };

  function normalize(value) {
    return (
      " " +
      value
        .toLowerCase()
        .replace(/[^\p{L}\p{N}.]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim() +
      " "
    );
  }

  function answerFor(input) {
    var question = normalize(input);
    var best = null;
    var bestScore = 0;
    knowledge.forEach(function (item) {
      var score = 0;
      item.keys.forEach(function (key) {
        var normalizedKey = normalize(key);
        if (question.indexOf(normalizedKey) !== -1) {
          score += (normalizedKey.trim().indexOf(" ") !== -1 ? 3 : 2) + (keyBoost[key] || 0);
        }
      });
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    });
    return best ? best.answer : fallback;
  }

  function initAssistant() {
    var wrapper = document.createElement("div");
    wrapper.className = "assistant";

    var launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "assistant-launcher";
    launcher.setAttribute("aria-label", "Open portfolio assistant");
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-controls", "assistant-panel");
    launcher.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>' +
      '<span class="assistant-dot" aria-hidden="true"></span>';

    var panel = document.createElement("section");
    panel.className = "assistant-panel";
    panel.id = "assistant-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Portfolio assistant");
    panel.hidden = true;
    panel.innerHTML =
      '<div class="assistant-head">' +
      '<div class="assistant-id"><span class="assistant-avatar" aria-hidden="true">O.</span><div><strong>Ask about Emmanuel</strong><span>Portfolio assistant</span></div></div>' +
      '<button type="button" class="assistant-close" aria-label="Close assistant">×</button>' +
      "</div>" +
      '<div class="assistant-messages" role="log" aria-live="polite" aria-label="Conversation"></div>' +
      '<div class="assistant-suggestions"></div>' +
      '<form class="assistant-form">' +
      '<label class="sr-only" for="assistant-input">Your question</label>' +
      '<input id="assistant-input" type="text" autocomplete="off" maxlength="200" placeholder="Ask about projects, skills, contact…">' +
      '<button type="submit" aria-label="Send question">→</button>' +
      "</form>";

    wrapper.appendChild(launcher);
    wrapper.appendChild(panel);
    document.body.appendChild(wrapper);

    var messages = panel.querySelector(".assistant-messages");
    var suggestions = panel.querySelector(".assistant-suggestions");
    var form = panel.querySelector(".assistant-form");
    var input = panel.querySelector("#assistant-input");
    var closeButton = panel.querySelector(".assistant-close");
    var busy = false;

    function addMessage(text, type) {
      var bubble = document.createElement("div");
      bubble.className = "assistant-msg " + type;
      bubble.textContent = text;
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
      return bubble;
    }

    function addTyping() {
      var bubble = document.createElement("div");
      bubble.className = "assistant-msg bot assistant-typing";
      bubble.innerHTML = "<span></span><span></span><span></span>";
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
      return bubble;
    }

    function send(text) {
      var value = text.trim();
      if (!value || busy) return;
      busy = true;
      addMessage(value, "user");
      input.value = "";
      var typing = addTyping();
      window.setTimeout(
        function () {
          typing.remove();
          addMessage(answerFor(value), "bot");
          busy = false;
        },
        reduceMotion ? 120 : 550 + Math.random() * 300
      );
    }

    ["What do you build?", "Tell me about Mitsumi", "What's your stack?", "What certifications do you have?", "How can I contact you?"].forEach(
      function (prompt) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "assistant-chip";
        chip.textContent = prompt;
        chip.addEventListener("click", function () {
          send(prompt);
        });
        suggestions.appendChild(chip);
      }
    );

    addMessage(
      "Hi — I'm Emmanuel's portfolio assistant. Ask about his projects, skills, certifications, experience at Mitsumi/Veeam, or how to reach him.",
      "bot"
    );

    function open() {
      panel.hidden = false;
      launcher.setAttribute("aria-expanded", "true");
      launcher.setAttribute("aria-label", "Close portfolio assistant");
      window.setTimeout(function () {
        input.focus();
      }, 60);
    }

    function close() {
      panel.hidden = true;
      launcher.setAttribute("aria-expanded", "false");
      launcher.setAttribute("aria-label", "Open portfolio assistant");
      launcher.focus();
    }

    launcher.addEventListener("click", function () {
      if (panel.hidden) open();
      else close();
    });
    closeButton.addEventListener("click", close);
    panel.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      send(input.value);
    });
  }

  function init() {
    initThemeToggle();
    initProgress();
    initReveal();
    initCounters();
    initAssistant();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
