// ========= Hash router =========
function getRoute() {
  const hash = window.location.hash || "#/";
  const clean = hash.replace("#", "");
  return clean === "" ? "/" : clean;
}

function setActiveView(route) {
  const views = document.querySelectorAll(".view");
  views.forEach(v => v.classList.remove("is-active"));

  const match = Array.from(views).find(v => v.dataset.route === route);
  (match || document.querySelector('.view[data-route="/"]'))?.classList.add("is-active");

  // active menu
  document.querySelectorAll(".menu .nav-link").forEach(a => a.classList.remove("active"));
  const activeLink = document.querySelector(`.menu .nav-link[href="#${route}"]`);
  if (activeLink) activeLink.classList.add("active");
}

// zatvorenie hamburger menu po kliknutí na link
function closeMobileNavIfOpen() {
  const nav = document.getElementById("mainNav");
  if (!nav) return;
  if (nav.classList.contains("show")) {
    const bsCollapse = bootstrap.Collapse.getOrCreateInstance(nav);
    bsCollapse.hide();
  }
}

function route() {
  const r = getRoute();
  setActiveView(r);
  window.scrollTo({ top: 0, behavior: "auto" });
  closeMobileNavIfOpen();
}

window.addEventListener("hashchange", route);

window.addEventListener("DOMContentLoaded", () => {
  route();

  // ==== HOME rentals slider controls ====
  const track = document.getElementById("rentalTrack");
  const prev = document.getElementById("prevBtn");
  const next = document.getElementById("nextBtn");

  if (track && prev && next) {
    let idx = 0;
    const cards = () => Array.from(track.children);
    const step = () => {
      const c = cards()[0];
      if (!c) return 0;
      const style = getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || "14") || 14;
      return c.getBoundingClientRect().width + gap;
    };

    const update = () => {
      const s = step();
      track.style.transform = `translateX(${-idx * s}px)`;
    };

    prev.addEventListener("click", () => {
      idx = Math.max(0, idx - 1);
      update();
    });

    next.addEventListener("click", () => {
      idx = Math.min(cards().length - 1, idx + 1);
      update();
    });

    window.addEventListener("resize", update);
  }

  // ==== FAQ ====
  const wrap = document.getElementById("faqWrap");
  if (wrap) {
    wrap.addEventListener("click", (e) => {
      const q = e.target.closest(".faq-q");
      if (!q) return;
      toggleFaq(q.closest(".faq-item"));
    });

    wrap.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const q = e.target.closest(".faq-q");
      if (!q) return;
      e.preventDefault();
      toggleFaq(q.closest(".faq-item"));
    });

    function toggleFaq(item) {
      if (!item) return;

      Array.from(wrap.querySelectorAll(".faq-item")).forEach(it => {
        if (it !== item) {
          it.classList.remove("open");
          const icon = it.querySelector(".faq-icon");
          if (icon) icon.textContent = "+";
        }
      });

      item.classList.toggle("open");
      const icon = item.querySelector(".faq-icon");
      if (icon) icon.textContent = item.classList.contains("open") ? "×" : "+";
    }
  }

  // ==== GALÉRIA slider buttons ====
  document.addEventListener("click", (e) => {
    const prevBtn = e.target.closest("[data-g-prev]");
    const nextBtn = e.target.closest("[data-g-next]");

    const id = prevBtn?.dataset.gPrev || nextBtn?.dataset.gNext;
    if (!id) return;

    const viewport = document.getElementById(id);
    const track = viewport?.querySelector(".g-track");
    if (!track) return;

    const delta = track.clientWidth * 0.9;
    track.scrollBy({ left: prevBtn ? -delta : delta, behavior: "smooth" });
  });

  // ==== klik na menu link zavrie menu ====
  document.querySelectorAll("[data-route-link]").forEach(a => {
    a.addEventListener("click", () => closeMobileNavIfOpen());
  });

  // =========================
  // LIGHTBOX (klik fotky + šípky + swipe)
  // =========================
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");

  let lbList = [];
  let lbIndex = 0;

  const openLB = (list, startIndex) => {
    lbList = list;
    lbIndex = Math.max(0, Math.min(startIndex, lbList.length - 1));
    lbImg.src = lbList[lbIndex];

    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeLB = () => {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lbImg.src = "";
    lbList = [];
    lbIndex = 0;
  };

  const showLB = (dir) => {
    if (!lbList.length) return;
    lbIndex = (lbIndex + dir + lbList.length) % lbList.length;
    lbImg.src = lbList[lbIndex];
  };

  const getGalleryList = (rootEl) => {
    if (!rootEl) return [];
    const imgs = Array.from(rootEl.querySelectorAll("img"))
      .map(i => i.getAttribute("src"))
      .filter(Boolean);

    const seen = new Set();
    const out = [];
    for (const s of imgs) {
      if (seen.has(s)) continue;
      seen.add(s);
      out.push(s);
    }
    return out;
  };

  // klik na fotky (prenajom + detail auta + galeria)
  document.addEventListener("click", (e) => {
    const imgInRent = e.target.closest(".rent-main-img img, .rent-thumbs .rt img");
    const imgInCar = e.target.closest(".car-main img, .car-thumbs .ct img");
    const imgInGallery = e.target.closest(".g-item img");

    // PRENAJOM list
    if (imgInRent) {
      const rentRow = imgInRent.closest(".rent-row");
      if (!rentRow) return;

      // ak klik na thumb -> prepni main
      const thumbImg = imgInRent.closest(".rent-thumbs .rt img");
      if (thumbImg) {
        const mainImg = rentRow.querySelector(".rent-main-img img");
        if (mainImg) mainImg.src = thumbImg.getAttribute("src");
      }

      const list = getGalleryList(rentRow);
      const clickedSrc = imgInRent.getAttribute("src");
      const start = Math.max(0, list.indexOf(clickedSrc));
      openLB(list, start);
      return;
    }

    // DETAIL auta
    if (imgInCar) {
      const section = imgInCar.closest(".car-detail");
      if (!section) return;

      const thumbImg = imgInCar.closest(".car-thumbs .ct img");
      if (thumbImg) {
        const mainImg = section.querySelector(".car-main img");
        if (mainImg) mainImg.src = thumbImg.getAttribute("src");
      }

      const list = getGalleryList(section);
      const clickedSrc = imgInCar.getAttribute("src");
      const start = Math.max(0, list.indexOf(clickedSrc));
      openLB(list, start);
      return;
    }

    // GALÉRIA (lightbox)
    if (imgInGallery) {
      const block = imgInGallery.closest(".g-block") || imgInGallery.closest(".gallery-page");
      const list = getGalleryList(block);
      const clickedSrc = imgInGallery.getAttribute("src");
      const start = Math.max(0, list.indexOf(clickedSrc));
      openLB(list, start);
    }
  });

  // close buttons + bg
  lb?.addEventListener("click", (e) => {
    if (e.target.closest("[data-lb-close]")) closeLB();
    if (e.target.closest("[data-lb-prev]")) showLB(-1);
    if (e.target.closest("[data-lb-next]")) showLB(1);
  });

  // keyboard
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLB();
    if (e.key === "ArrowLeft") showLB(-1);
    if (e.key === "ArrowRight") showLB(1);
  });

  // ✅ swipe na mobile v lightboxe
  let touchX = null;
  lb?.addEventListener("touchstart", (e) => {
    if (!lb.classList.contains("is-open")) return;
    touchX = e.touches?.[0]?.clientX ?? null;
  }, { passive: true });

  lb?.addEventListener("touchend", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (touchX == null) return;
    const endX = e.changedTouches?.[0]?.clientX ?? null;
    if (endX == null) return;

    const dx = endX - touchX;
    if (Math.abs(dx) > 40) {
      showLB(dx < 0 ? 1 : -1);
    }
    touchX = null;
  }, { passive: true });
});


/* ======================================================
   Kontakt – odoslanie formulára (frontend)
   ====================================================== */
(function(){
  const form = document.getElementById('contactForm');
  const alertBox = document.getElementById('contactAlert');
  if(!form) return;

  function showAlert(msg, ok){
    if(!alertBox) return;
    alertBox.hidden = false;
    alertBox.classList.remove('ok','err');
    alertBox.classList.add(ok ? 'ok' : 'err');
    alertBox.textContent = msg;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      name: (document.getElementById('cfName')?.value || '').trim(),
      surname: (document.getElementById('cfSurname')?.value || '').trim(),
      email: (document.getElementById('cfEmail')?.value || '').trim(),
      message: (document.getElementById('cfMessage')?.value || '').trim(),
      source: 'kontakt'
    };

    // Minimalná validácia
    if(!payload.name || !payload.surname || !payload.email || !payload.message){
      showAlert('Prosím vyplňte všetky polia.', false);
      return;
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)){
      showAlert('Prosím zadajte platný email.', false);
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const prevText = btn ? btn.textContent : '';
    if(btn){ btn.disabled = true; }

    try{
      const res = await fetch('contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if(!res.ok){
        showAlert(data?.error || 'Nepodarilo sa odoslať správu. Skúste neskôr.', false);
      } else {
        showAlert('Správa bola odoslaná. Ozveme sa vám čo najskôr.', true);
        form.reset();
      }
    } catch (err){
      showAlert('Chyba pripojenia. Skontrolujte, že beží server.', false);
    } finally {
      if(btn){ btn.disabled = false; }
    }
  });
})();
