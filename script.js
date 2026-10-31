/* ==========================================================================
   CineCrítica: comportamento da página
   Validação do formulário (RF04), redirecionamento (RF05) e detalhes de navegação.
   ========================================================================== */

(function () {
  "use strict";

  var NOME_KEY = "cinecritica:nome";
  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Armazenamento seguro (modo privado pode bloquear) ---------- */
  function salvarNome(nome) {
    try {
      sessionStorage.setItem(NOME_KEY, nome);
    } catch (e) {
      /* sem armazenamento, a página de obrigado usa a saudação padrão */
    }
  }

  function lerNome() {
    try {
      return sessionStorage.getItem(NOME_KEY);
    } catch (e) {
      return null;
    }
  }

  /* ---------- RF04: validação do formulário ---------- */
  function validarNome(valor) {
    var nome = valor.trim();
    if (nome === "") return "Informe seu nome para emitirmos o ingresso.";
    if (nome.length < 2) return "O nome precisa ter pelo menos 2 letras.";
    return "";
  }

  function validarEmail(valor) {
    var email = valor.trim();
    if (email === "") return "Informe seu e-mail para receber a newsletter.";
    if (!EMAIL_REGEX.test(email)) return "Esse e-mail parece incompleto. Confira o formato: nome@exemplo.com";
    return "";
  }

  function mostrarErro(campo, mensagem) {
    var alvo = document.getElementById(campo.id + "-erro");
    if (mensagem) {
      campo.classList.add("is-invalid");
      campo.setAttribute("aria-invalid", "true");
      alvo.innerHTML = '<i class="ph ph-warning-circle" aria-hidden="true"></i><span></span>';
      alvo.querySelector("span").textContent = mensagem;
    } else {
      campo.classList.remove("is-invalid");
      campo.removeAttribute("aria-invalid");
      alvo.textContent = "";
    }
  }

  function iniciarFormulario() {
    var form = document.getElementById("form-assinatura");
    if (!form) return;

    var nome = form.querySelector("#nome");
    var email = form.querySelector("#email");
    var botao = form.querySelector("#btn-assinar");
    var rotulo = botao.querySelector(".btn-label");
    var tentouEnviar = false;

    var regras = [
      { campo: nome, validar: validarNome },
      { campo: email, validar: validarEmail }
    ];

    // Depois da primeira tentativa, o erro some assim que o campo fica correto
    regras.forEach(function (regra) {
      regra.campo.addEventListener("input", function () {
        if (tentouEnviar) mostrarErro(regra.campo, regra.validar(regra.campo.value));
      });
      regra.campo.addEventListener("blur", function () {
        if (tentouEnviar || regra.campo.value.trim() !== "") {
          mostrarErro(regra.campo, regra.validar(regra.campo.value));
        }
      });
    });

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      tentouEnviar = true;

      var primeiroInvalido = null;
      regras.forEach(function (regra) {
        var erro = regra.validar(regra.campo.value);
        mostrarErro(regra.campo, erro);
        if (erro && !primeiroInvalido) primeiroInvalido = regra.campo;
      });

      if (primeiroInvalido) {
        primeiroInvalido.focus();
        return;
      }

      // RF05: tudo certo, segue para a página de obrigado
      salvarNome(nome.value.trim().split(/\s+/)[0]);
      botao.disabled = true;
      botao.setAttribute("aria-busy", "true");
      rotulo.textContent = "Emitindo seu ingresso...";

      window.setTimeout(function () {
        window.location.href = "obrigado.html";
      }, reduzMovimento ? 0 : 450);
    });

    // Se o visitante voltar pelo histórico, o botão volta ao normal
    window.addEventListener("pageshow", function () {
      botao.disabled = false;
      botao.removeAttribute("aria-busy");
      rotulo.textContent = "Assine a newsletter";
    });
  }

  /* ---------- Página de obrigado: saudação com o primeiro nome ---------- */
  function iniciarObrigado() {
    var alvo = document.querySelector("[data-nome-assinante]");
    if (!alvo) return;
    var nome = lerNome();
    if (nome) alvo.textContent = nome;
  }

  /* ---------- Header fica sólido ao sair do topo ---------- */
  function iniciarHeader() {
    var header = document.querySelector(".site-header");
    var gatilho = document.querySelector(".hero, .thanks");
    if (!header || !gatilho || !("IntersectionObserver" in window)) {
      if (header) header.classList.add("is-solid");
      return;
    }
    var sentinela = document.createElement("div");
    sentinela.setAttribute("aria-hidden", "true");
    sentinela.style.cssText = "position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none;";
    gatilho.prepend(sentinela);

    new IntersectionObserver(function (entradas) {
      header.classList.toggle("is-solid", !entradas[0].isIntersecting);
    }).observe(sentinela);
  }

  /* ---------- Menu: link ativo e fechamento no mobile ---------- */
  function iniciarMenu() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.navbar-nav a[href^="#"]'));
    var menu = document.getElementById("menu");

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        if (menu && menu.classList.contains("show") && window.bootstrap) {
          window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
        }
      });
    });

    if (!("IntersectionObserver" in window)) return;
    var secoes = links
      .map(function (link) { return document.querySelector(link.getAttribute("href")); })
      .filter(Boolean);

    // A seção que cruza o meio da tela marca o link correspondente
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        links.forEach(function (link) {
          if (link.getAttribute("href") === "#" + entrada.target.id) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    secoes.forEach(function (secao) { observador.observe(secao); });
  }

  function iniciarAno() {
    document.querySelectorAll("[data-ano]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    iniciarFormulario();
    iniciarObrigado();
    iniciarHeader();
    iniciarMenu();
    iniciarAno();
  });
})();
