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

  function initContactCta() {
    var cta = document.querySelector('a.btn[href="#contact"]');
    var target = document.getElementById("contact");
    if (!cta || !target) return;
    cta.addEventListener("click", function (event) {
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      target.setAttribute("tabindex", "-1");
      try {
        target.focus({ preventScroll: true });
      } catch (error) {
        target.focus();
      }
      try {
        history.replaceState(null, "", "#contact");
      } catch (error) {
        window.location.hash = "#contact";
      }
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

  function initBackgroundFx() {
    if (reduceMotion || document.querySelector(".bg-fx")) return;
    var fx = document.createElement("div");
    fx.className = "bg-fx";
    fx.setAttribute("aria-hidden", "true");
    fx.innerHTML =
      '<div class="bg-core">' +
        '<span class="bg-core-halo"></span>' +
        '<div class="bg-core-spin">' +
          '<span class="bg-core-grid"></span>' +
          '<span class="bg-core-ring bg-core-ring-a"></span>' +
          '<span class="bg-core-ring bg-core-ring-b"></span>' +
          '<span class="bg-core-ring bg-core-ring-c"></span>' +
          '<span class="bg-core-ring bg-core-ring-d"></span>' +
          '<span class="bg-core-ring bg-core-ring-e"></span>' +
          '<span class="bg-core-node bg-core-node-a"></span>' +
          '<span class="bg-core-node bg-core-node-b"></span>' +
          '<span class="bg-core-node bg-core-node-c"></span>' +
          '<span class="bg-core-node bg-core-node-d"></span>' +
          '<span class="bg-core-node bg-core-node-e"></span>' +
          '<span class="bg-core-node bg-core-node-f"></span>' +
          '<span class="bg-core-node bg-core-node-g"></span>' +
          '<span class="bg-core-node bg-core-node-h"></span>' +
        '</div>' +
        '<span class="bg-core-orb"></span>' +
      '</div>' +
      '<span class="bg-particle bg-particle-a"></span>' +
      '<span class="bg-particle bg-particle-b"></span>';
    document.body.insertBefore(fx, document.body.firstChild);
  }

  function initProtectedMedia() {
    var selector = ".cv-page-link, .badge-item, .cert-preview";
    var items = document.querySelectorAll(selector);
    if (!items.length) return;
    items.forEach(function (item) {
      item.setAttribute("data-protected", "true");
      item.querySelectorAll("img").forEach(function (image) {
        image.setAttribute("draggable", "false");
      });
    });
    function protectedTarget(target) {
      return target && target.closest ? target.closest(selector) : null;
    }
    document.addEventListener("contextmenu", function (event) {
      if (protectedTarget(event.target)) event.preventDefault();
    });
    document.addEventListener("dragstart", function (event) {
      if (protectedTarget(event.target)) event.preventDefault();
    });
    document.addEventListener("selectstart", function (event) {
      if (protectedTarget(event.target)) event.preventDefault();
    });
  }

  var knowledge = [
    {
      keys: ["who", "about", "yourself", "background", "bio", "introduce"],
      answer:
        "Oketayot Emmanuel Kisembo is an Information Systems student at Kyambogo University and a junior developer based in Kampala, Uganda. He has worked on live PHP/MySQL web projects during his internship at LAPOK Ventures and is currently a sales intern at Mitsumi Distribution, learning Veeam data protection."
    },
    {
      keys: ["skill", "skills", "stack", "tech", "technology", "technologies", "language", "languages", "framework", "frameworks", "php", "mysql", "javascript", "next.js", "nextjs", "node", "node.js", "sql"],
      answer:
        "Current strengths include PHP, MySQL, SQL design, and front-end fundamentals with HTML, CSS, and JavaScript. He is also building experience with Next.js and Node.js, and learning Veeam backup/recovery and networking fundamentals."
    },
    {
      keys: ["project", "projects", "work", "portfolio", "built", "build", "shipped", "case study"],
      answer:
        "Projects on the site include Outpost DMS (live PHP/MySQL distribution system), the LAPOK catalogue and WhatsApp ordering site (live), Veeam-focused internship learning at Mitsumi, a Kumalo team collaboration, an enterprise inventory database design project, and SmartFix (a PHP/MySQL group project)."
    },
    {
      keys: ["outpost", "outpost dms", "dms", "distribution", "lapok dms"],
      answer:
        "Outpost DMS is a live multi-depot distribution system built for LAPOK Ventures. It supports stock taking, dispatch based on approved assignments, cash handover, and PDF reporting, with separate workflows and server-side access checks for different roles."
    },
    {
      keys: ["catalogue", "catalog", "whatsapp", "lapok", "ordering", "ecommerce", "e-commerce", "e commerce"],
      answer:
        "The LAPOK catalogue site (lapok.afriboards.com) presents products and supports a WhatsApp-based ordering flow. Customers can prepare an order on the site and send a structured message through WhatsApp."
    },
    {
      keys: ["certification", "certifications", "certificate", "certificates", "cert", "certs", "credential", "credentials", "cisco", "ccna", "data analytics", "network security", "networking"],
      answer:
        "Cisco Networking Academy credentials listed on the site: CCNA: Network Security (31 Oct 2026), Data Analytics Essentials (27 Aug 2026), and CCNA: Introduction to Networks (10 Jul 2025)."
    },
    {
      keys: ["badge", "badges", "vsp", "vmts", "veeam university", "veeam badges", "veeam training", "veeam certifications", "veeam certification", "veeam credentials", "university partner", "training", "learned", "learning"],
      answer:
        "Veeam University Partner 2026 badges on the site include five VSP badges and four VMTS badges across areas such as cyber resilience, SaaS protection, modern apps/Kubernetes, on-premises/cloud, and public cloud. See the résumé credentials section or the full archive."
    },
    {
      keys: ["mitsumi", "veeam", "sales", "internship", "intern", "devjyot", "data protection", "backup", "recovery"],
      answer:
        "Since September 2026 Emmanuel has been a sales intern at Mitsumi Distribution (Devjyot Traders) in Kampala. His focus is learning Veeam data protection, including backup/recovery concepts, licensing basics, and clear customer communication."
    },
    {
      keys: ["kumalo", "acholi", "kumalotech"],
      answer:
        "Kumalo is a full-stack project developed with KumaloTech in a private repository. Emmanuel contributed as an invited collaborator, working with the Next.js frontend and Node.js API inside an existing team codebase."
    },
    {
      keys: ["inventory", "database", "schema", "normalisation", "normalization", "er diagram", "oracle"],
      answer:
        "The Enterprise Inventory Management System was an academic Oracle database design project. Emmanuel worked on ER modelling, relational schema design, and key database design decisions, and presented the work on demo day."
    },
    {
      keys: ["smartfix", "repair"],
      answer:
        "SmartFix IT Solutions was a group academic project for a computer-repair booking website. Emmanuel worked on the PHP/MySQL database connection and the user registration module."
    },
    {
      keys: ["experience", "cv", "resume", "résumé", "job", "career"],
      answer:
        "Experience includes live internship projects at LAPOK Ventures, a team collaboration with KumaloTech, academic database/web projects, and a current sales internship at Mitsumi Distribution focused on Veeam. The résumé page has a click-to-view CV and credentials section."
    },
    {
      keys: ["education", "school", "university", "kyambogo", "study", "student", "cgpa", "degree"],
      answer:
        "He studies Information Systems at Kyambogo University and holds a 3.99 CGPA. Coursework includes database systems, web development, networks, and business process analysis."
    },
    {
      keys: ["contact", "email", "phone", "call", "hire", "available", "reach", "whatsapp", "linkedin", "github", "opportunity", "opportunities", "role", "roles", "looking"],
      answer:
        "Email: okettaemma1@gmail.com\nPhone/WhatsApp: +256 782 761164\nLinkedIn: linkedin.com/in/oketayot-emmanuel-kisembo-2bb05841b\nGitHub: github.com/Ekiz538\nHe is based in Kampala, Uganda and open to junior developer opportunities."
    },
    {
      keys: ["location", "where", "kampala", "uganda", "remote", "remotely", "based"],
      answer:
        "He is based in Kampala, Uganda."
    },
    {
      keys: ["now", "currently", "current", "latest", "right now"],
      answer:
        "Currently he is a sales intern at Mitsumi Distribution learning Veeam data protection, while continuing to build his skills in database-driven web development."
    },
    {
      keys: ["live", "demo", "link", "links", "open", "try"],
      answer:
        "Live links on the site include Outpost DMS at dms.afriboards.com and the LAPOK catalogue at lapok.afriboards.com. Other projects are described from the Projects page."
    },
    {
      keys: ["thanks", "thank", "great", "nice", "cool"],
      answer:
        "You're welcome. If you’d like to discuss a role or project, you can reach Emmanuel at okettaemma1@gmail.com."
    }
  ];

  var fallback =
    "I can answer questions about Emmanuel’s projects, skills, credentials, education, current internship, or contact details. If you need something specific, email okettaemma1@gmail.com.";

  var keyBoost = {
    mitsumi: 3, veeam: 3, sales: 2, internship: 3, intern: 3, devjyot: 3,
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

  function conversationFor(input) {
    var text = normalize(input).trim();
    var message = text.replace(/[.!?]+$/g, "");
    if (/^(hi|hello|hey|yo|hiya)( there| junior)?$/.test(message)) {
      return "Hi, I'm Junior — Emmanuel's portfolio assistant. Ask me about his projects, skills, certifications, or how to get in touch.";
    }
    if (/^(hi|hello|hey)[ ]+(how are you|how s it going|how are things)$/.test(message)) {
      return "I'm doing well, thanks for asking. I'm here to help you explore Emmanuel's work. What would you like to know?";
    }
    if (/^(how are you|how s it going|how are things|how do you do)$/.test(message)) {
      return "I'm doing well, thanks for asking. I'm here to help you explore Emmanuel's work. What would you like to know?";
    }
    if (/^(who are you|what are you|what s your name|your name)$/.test(message)) {
      return "I'm Junior, Emmanuel's portfolio assistant. I can answer questions about his projects, skills, certifications and experience.";
    }
    if (/^(help|what can you do|what can i ask|options)$/.test(message)) {
      return "I can help with projects, skills, certifications, the Mitsumi/Veeam research, education and contact details. Try one of the suggestions below.";
    }
    if (/^(thanks|thank you|thx|cheers|appreciate it)$/.test(message)) {
      return "You're welcome. If you'd like to talk about a role or project, email okettaemma1@gmail.com.";
    }
    if (/^(bye|goodbye|see you|later|good night)$/.test(message)) {
      return "Thanks for stopping by. You can reach Emmanuel at okettaemma1@gmail.com.";
    }
    if (/^(good|great|nice|cool|awesome|ok|okay|sure)$/.test(message)) {
      return "Glad to help. Ask me anything about Emmanuel's work, or use one of the suggestions below.";
    }
    return "";
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
    launcher.setAttribute("aria-label", "Open Junior, the portfolio assistant");
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-controls", "assistant-panel");
    launcher.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>' +
      '<span class="assistant-dot" aria-hidden="true"></span>';

    var panel = document.createElement("section");
    panel.className = "assistant-panel";
    panel.id = "assistant-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Junior, the portfolio assistant");
    panel.hidden = true;
    panel.innerHTML =
      '<div class="assistant-head">' +
      '<div class="assistant-id"><span class="assistant-avatar" aria-hidden="true">J.</span><div><strong>Junior</strong><span>Portfolio assistant</span></div></div>' +
      '<button type="button" class="assistant-close" aria-label="Close Junior">&times;</button>' +
      "</div>" +
      '<div class="assistant-messages" role="log" aria-live="polite" aria-label="Conversation"></div>' +
      '<div class="assistant-suggestions"></div>' +
      '<form class="assistant-form">' +
      '<label class="sr-only" for="assistant-input">Your question</label>' +
      '<input id="assistant-input" type="text" autocomplete="off" maxlength="200" placeholder="Ask Junior about projects, skills, contact...">' +
      '<button type="submit" aria-label="Send message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button>' +
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
          addMessage(conversationFor(value) || answerFor(value), "bot");
          busy = false;
        },
        reduceMotion ? 120 : 550 + Math.random() * 300
      );
    }

    ["Hi Junior", "What do you build?", "Tell me about Mitsumi", "What's your stack?", "What certifications do you have?", "How can I contact you?"].forEach(
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
      "Hi — I'm Junior, Emmanuel's portfolio assistant. Ask about his projects, skills, certifications, experience at Mitsumi/Veeam, or how to reach him.",
      "bot"
    );

    function open() {
      panel.hidden = false;
      launcher.setAttribute("aria-expanded", "true");
      launcher.setAttribute("aria-label", "Close Junior, the portfolio assistant");
      window.setTimeout(function () {
        input.focus();
      }, 60);
    }

    function close() {
      panel.hidden = true;
      launcher.setAttribute("aria-expanded", "false");
      launcher.setAttribute("aria-label", "Open Junior, the portfolio assistant");
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
    initBackgroundFx();
    initProgress();
    initReveal();
    initContactCta();
    initCounters();
    initProtectedMedia();
    initAssistant();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
