document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     1. ИНТЕРАКТИВНЫЙ CANVAS С НЕОНОВЫМИ ВОЛНАМИ В HERO
     ========================================================================== */
  const canvas = document.getElementById('wave-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let phase = 0;
    let mouseNormY = 0.5;

    const resizeCanvas = () => {
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    window.addEventListener('mousemove', (e) => {
      mouseNormY = e.clientY / window.innerHeight;
    });

    const waves = [
      { color: 'rgba(0, 240, 255, 0.25)', amp: 32, freq: 0.004, speed: 0.022 },
      { color: 'rgba(139, 92, 246, 0.22)', amp: 44, freq: 0.003, speed: 0.016 },
      { color: 'rgba(255, 94, 151, 0.18)', amp: 26, freq: 0.005, speed: 0.028 }
    ];

    const renderWaves = () => {
      ctx.clearRect(0, 0, width, height);
      phase += 1;

      waves.forEach((w, idx) => {
        ctx.beginPath();
        ctx.moveTo(0, height);

        const baseY = height * (0.62 + idx * 0.08) + (mouseNormY - 0.5) * 28;
        for (let x = 0; x <= width; x += 12) {
          const y =
            baseY +
            Math.sin(x * w.freq + phase * w.speed) * w.amp +
            Math.cos(x * w.freq * 0.5 - phase * w.speed) * (w.amp * 0.4);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = w.color;
        ctx.fill();
      });

      requestAnimationFrame(renderWaves);
    };

    renderWaves();
  }

  /* ==========================================================================
     2. SPOTLIGHT-ПОДСВЕТКА КАРТОЧЕК И 3D-НАКЛОН ВИТРИНЫ
     ========================================================================== */
  const spotlightCards = document.querySelectorAll('.spotlight-card');
  spotlightCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
  });

  const tiltCard = document.getElementById('tilt-card');
  if (tiltCard) {
    tiltCard.addEventListener('mousemove', (e) => {
      if (window.innerWidth < 960) return;
      const rect = tiltCard.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      tiltCard.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`;
    });

    tiltCard.addEventListener('mouseleave', () => {
      tiltCard.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    });
  }

  /* ==========================================================================
     3. МОБИЛЬНОЕ МЕНЮ (БУРГЕР)
     ========================================================================== */
  const burgerBtn = document.getElementById('burger-btn');
  const navMenu = document.getElementById('nav-menu');

  const closeMobileMenu = () => {
    burgerBtn.classList.remove('is-active');
    navMenu.classList.remove('is-open');
    burgerBtn.setAttribute('aria-expanded', 'false');
  };

  burgerBtn.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    burgerBtn.classList.toggle('is-active', isOpen);
    burgerBtn.setAttribute('aria-expanded', String(isOpen));
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  /* ==========================================================================
     4. КАСТОМНЫЕ ВЫПАДАЮЩИЕ СПИСКИ (.custom-select)
     ========================================================================== */
  const customSelects = document.querySelectorAll('[data-select]');

  const closeAllSelects = (exceptSelect = null) => {
    customSelects.forEach((select) => {
      if (select !== exceptSelect) {
        select.classList.remove('is-open');
        const trigger = select.querySelector('.custom-select__trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
    });
  };

  customSelects.forEach((select) => {
    const trigger = select.querySelector('.custom-select__trigger');
    const valueDisplay = select.querySelector('[data-select-value]');
    const options = select.querySelectorAll('.custom-select__option');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !select.classList.contains('is-open');
      closeAllSelects(select);
      select.classList.toggle('is-open', willOpen);
      trigger.setAttribute('aria-expanded', String(willOpen));
    });

    options.forEach((option) => {
      option.addEventListener('click', () => {
        options.forEach((opt) => opt.classList.remove('is-selected'));
        option.classList.add('is-selected');
        valueDisplay.textContent = option.textContent.trim();

        select.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');

        select.dispatchEvent(new CustomEvent('select-change', { detail: option.dataset }));
      });
    });
  });

  document.addEventListener('click', () => closeAllSelects());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllSelects();
      closeMobileMenu();
    }
  });

  /* ==========================================================================
     5. КАЛЬКУЛЯТОР СТОИМОСТИ С ДИНАМИЧЕСКИМ ПОЛЗУНКОМ
     ========================================================================== */
  const calcTypeSelect = document.getElementById('calc-type');
  const calcDesignSelect = document.getElementById('calc-design');
  const currencySelect = document.getElementById('currency-select');
  const screensRange = document.getElementById('screens-range');
  const screensOutput = document.getElementById('screens-output');
  const addonInputs = document.querySelectorAll('.check-pill__input');
  const totalPriceEl = document.getElementById('total-price');
  const totalDaysEl = document.getElementById('total-days');
  const applyCalcBtn = document.getElementById('apply-calc-btn');
  const clientMessage = document.getElementById('client-message');

  const getPluralBlocks = (n) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} блок`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} блока`;
    return `${n} блоков`;
  };

  const updateRangeFill = () => {
    const min = Number(screensRange.min);
    const max = Number(screensRange.max);
    const val = Number(screensRange.value);
    const percent = ((val - min) * 100) / (max - min);
    screensRange.style.backgroundSize = `${percent}% 100%`;
  };

  const calculateProject = () => {
    updateRangeFill();

    const selectedType = calcTypeSelect.querySelector('.custom-select__option.is-selected');
    const selectedDesign = calcDesignSelect.querySelector('.custom-select__option.is-selected');
    const selectedCurrency = currencySelect.querySelector('.custom-select__option.is-selected');

    const basePrice = Number(selectedType.dataset.price || 65000);
    const baseDays = Number(selectedType.dataset.days || 10);
    const designMult = Number(selectedDesign.dataset.mult || 1);
    const currencyRate = Number(selectedCurrency.dataset.rate || 1);
    const currencySymbol = selectedCurrency.dataset.symbol || '₽';

    const screensCount = Number(screensRange.value);
    screensOutput.textContent = getPluralBlocks(screensCount);

    const extraScreensPrice = Math.max(0, screensCount - 5) * 4500;
    const extraScreensDays = Math.max(0, Math.round((screensCount - 5) * 0.6));

    let addonsPrice = 0;
    let addonsDays = 0;
    addonInputs.forEach((input) => {
      if (input.checked) {
        addonsPrice += Number(input.dataset.addonPrice || 0);
        addonsDays += Number(input.dataset.addonDays || 0);
      }
    });

    const rawRubPrice = (basePrice + extraScreensPrice) * designMult + addonsPrice;
    const convertedPrice = Math.round(rawRubPrice * currencyRate);
    const totalDays = Math.round(baseDays * designMult + extraScreensDays + addonsDays);

    const formattedPrice = convertedPrice.toLocaleString('ru-RU');
    totalPriceEl.textContent =
      currencySymbol === '₽' ? `${formattedPrice} ₽` : `${currencySymbol}${formattedPrice}`;
    totalDaysEl.textContent = `~${totalDays} рабочих дней`;

    return {
      typeText: selectedType.textContent.trim(),
      designText: selectedDesign.textContent.trim(),
      screensCount,
      priceText: totalPriceEl.textContent,
      daysText: totalDaysEl.textContent
    };
  };

  calcTypeSelect.addEventListener('select-change', calculateProject);
  calcDesignSelect.addEventListener('select-change', calculateProject);
  currencySelect.addEventListener('select-change', calculateProject);
  screensRange.addEventListener('input', calculateProject);
  addonInputs.forEach((input) => input.addEventListener('change', calculateProject));

  applyCalcBtn.addEventListener('click', () => {
    const summary = calculateProject();
    const checkedAddons = Array.from(addonInputs)
      .filter((i) => i.checked)
      .map((i) => i.value);

    const addonsLine = checkedAddons.length ? `, Опции: ${checkedAddons.join(', ')}` : '';
    clientMessage.value = `Конфигурация: ${summary.typeText} (${summary.screensCount} блоков), ${summary.designText}${addonsLine}. Смета: ${summary.priceText}, ${summary.daysText}.`;

    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => document.getElementById('client-name').focus(), 600);
  });

  calculateProject();

  /* ==========================================================================
     6. ФИЛЬТРАЦИЯ ПОРТФОЛИО И АККОРДЕОН FAQ
     ========================================================================== */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const caseCards = document.querySelectorAll('.case-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const category = btn.dataset.filter;
      caseCards.forEach((card) => {
        const match = category === 'all' || card.dataset.category === category;
        card.classList.toggle('is-hidden', !match);
      });
    });
  });

  const accordionItems = document.querySelectorAll('.accordion__item');
  accordionItems.forEach((item) => {
    const header = item.querySelector('.accordion__header');
    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      accordionItems.forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('.accordion__header').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ==========================================================================
     7. ОТПРАВКА ФОРМЫ И ПЛАВНОЕ ПОЯВЛЕНИЕ СЕКЦИЙ
     ========================================================================== */
  const leadForm = document.getElementById('lead-form');
  const formError = document.getElementById('form-error');
  const toast = document.getElementById('success-toast');
  const toastClose = document.getElementById('toast-close');

  leadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('client-name');
    const contactInput = document.getElementById('client-contact');

    if (!nameInput.value.trim() || !contactInput.value.trim()) {
      formError.hidden = false;
      return;
    }

    formError.hidden = true;
    leadForm.reset();
    toast.hidden = false;

    setTimeout(() => {
      toast.hidden = true;
    }, 5000);
  });

  toastClose.addEventListener('click', () => {
    toast.hidden = true;
  });

  const revealItems = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((el) => observer.observe(el));
});