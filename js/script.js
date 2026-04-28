// ===== API Base =====
const API_BASE = '/api';

// ===== Carousel Config =====
const carouselConfig = {
  homeImages: [],
  productImages: [],
  storeImages: [],
  qualificationImages: [],
  autoPlayInterval: 3000,
};

// ===== Load Settings =====
async function loadSettings() {
  try {
    const res = await fetch(API_BASE + '/settings');
    const data = await res.json();
    if (data.success) {
      const s = data.data;
      // Update contact page
      const phoneEl = document.querySelector('.phone-number');
      if (phoneEl && s.shop_phone) phoneEl.textContent = s.shop_phone;
      const addressEls = document.querySelectorAll('.address');
      if (s.shop_address) addressEls.forEach(el => { el.textContent = '地址：' + s.shop_address; });
      const hoursEl = document.querySelector('.hours-content p');
      if (hoursEl && s.shop_hours) hoursEl.textContent = s.shop_hours;
      // Update story on about page
      const storyEl = document.querySelector('.brand-story .story-content');
      if (storyEl && s.brand_story) {
        storyEl.innerHTML = s.brand_story.replace(/\n/g, '<br>');
      }
      // Update story on index page
      const indexStory = document.querySelector('.brand .story-content');
      if (indexStory && s.brand_story) {
        indexStory.innerHTML = s.brand_story.replace(/\n/g, '<br>');
      }
      // Update QR code
      const qrImg = document.querySelector('.qr-placeholder img');
      if (qrImg && s.qrcode_image) qrImg.src = s.qrcode_image;

      // Also update footer phone
      const footerPhone = document.querySelector('.footer .phone');
      if (footerPhone && s.shop_phone) footerPhone.textContent = '电话：' + s.shop_phone;
      const storeAddress = document.querySelector('.store-address p');
      if (storeAddress && s.shop_address) storeAddress.textContent = s.shop_address;
      const directionsEl = document.querySelector('.directions-content p');
      if (directionsEl && s.shop_address) directionsEl.textContent = s.shop_address;
    }
  } catch (e) {
    console.warn('加载设置失败:', e);
  }
}

// ===== Load Carousel Images from API =====
async function loadCarouselImages() {
  try {
    const res = await fetch(API_BASE + '/carousels');
    const data = await res.json();
    if (data.success) {
      const list = data.data;
      carouselConfig.homeImages = list.filter(c => c.type === 'home').map(c => c.image);
      carouselConfig.productImages = list.filter(c => c.type === 'product').map(c => c.image);
      carouselConfig.storeImages = list.filter(c => c.type === 'store').map(c => c.image);
      carouselConfig.qualificationImages = list.filter(c => c.type === 'qualification').map(c => c.image);
    }
  } catch (e) {
    console.warn('加载轮播图失败:', e);
  }
}

// ===== Load Products from API =====
async function loadProducts() {
  try {
    const res = await fetch(API_BASE + '/products');
    const data = await res.json();
    if (data.success) {
      return data.data;
    }
    return [];
  } catch (e) {
    console.warn('加载产品失败:', e);
    return [];
  }
}

// ===== Carousel Class =====
class Carousel {
  constructor(container, images, autoPlay = true) {
    this.container = container;
    this.images = images;
    this.autoPlay = autoPlay;
    this.currentIndex = 0;
    this.slidesWrapper = container.querySelector('.carousel-wrapper');
    this.prevBtn = container.querySelector('.carousel-btn.prev');
    this.nextBtn = container.querySelector('.carousel-btn.next');
    this.interval = null;

    // If no images, use a default placeholder
    if (!this.images || this.images.length === 0) {
      this.images = ['images/店铺图片/豆包 (13).png'];
    }

    this.init();
  }

  init() {
    this.renderSlides();
    this.bindEvents();
    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }

  renderSlides() {
    if (!this.slidesWrapper) return;
    this.slidesWrapper.innerHTML = '';

    this.images.forEach((image, index) => {
      const slide = document.createElement('div');
      slide.className = 'carousel-item';

      const img = document.createElement('img');
      img.src = image;
      img.alt = `轮播图 ${index + 1}`;
      img.addEventListener('error', function () {
        this.src = 'images/店铺图片/豆包 (13).png';
      });

      slide.appendChild(img);
      this.slidesWrapper.appendChild(slide);
    });

    this.updatePosition();
  }

  bindEvents() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.goToSlide(this.currentIndex - 1));
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.goToSlide(this.currentIndex + 1));
    }
    if (this.container) {
      this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
      this.container.addEventListener('mouseleave', () => {
        if (this.autoPlay) this.startAutoPlay();
      });
    }
  }

  goToSlide(index) {
    if (index < 0) index = this.images.length - 1;
    else if (index >= this.images.length) index = 0;
    this.currentIndex = index;
    this.updatePosition();
  }

  updatePosition() {
    if (!this.slidesWrapper || !this.container) return;
    const slideWidth = this.container.offsetWidth;
    this.slidesWrapper.style.transform = `translateX(-${this.currentIndex * slideWidth}px)`;
  }

  startAutoPlay() {
    this.interval = setInterval(() => this.goToSlide(this.currentIndex + 1), carouselConfig.autoPlayInterval);
  }

  stopAutoPlay() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

// ===== Render Gallery =====
function renderGallery(containerSelector, images) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = '';
  if (!images || images.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;">暂无图片</p>';
    return;
  }

  images.forEach((image, index) => {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';

    const img = document.createElement('img');
    img.src = image;
    img.alt = `图片 ${index + 1}`;
    img.addEventListener('error', function () {
      this.src = 'images/店铺图片/豆包 (13).png';
    });

    galleryItem.appendChild(img);
    container.appendChild(galleryItem);
  });
}

// ===== Render Product Cards =====
function renderProductCards(products, containerId = 'productGrid') {
  const productGrid = document.getElementById(containerId);
  if (!productGrid) return;

  productGrid.innerHTML = '';

  if (!products || products.length === 0) {
    productGrid.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">暂无产品</p>';
    return;
  }

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;

    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image || 'images/店铺图片/豆包 (13).png'}" alt="${product.name}">
      </div>
      <div class="product-info">
        <h4>${product.name}</h4>
        <p>¥${parseFloat(product.price).toFixed(2)}</p>
        <button class="view-details-btn" data-product-id="${product.id}">查看详情</button>
      </div>
    `;

    const img = card.querySelector('img');
    img.addEventListener('error', function () {
      this.src = 'images/店铺图片/豆包 (13).png';
    });

    productGrid.appendChild(card);
  });

  addProductCardEvents();
}

// ===== Product Card Events =====
function addProductCardEvents() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', function () {
      openProductModal(parseInt(this.dataset.productId));
    });
  });

  document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      openProductModal(parseInt(this.dataset.productId));
    });
  });
}

// ===== Product Modal =====
let allProducts = [];

function openProductModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('productModal');
  const modalImage = document.getElementById('modalProductImage');
  const modalName = document.getElementById('modalProductName');
  const modalPrice = document.getElementById('modalProductPrice');
  const modalDescription = document.getElementById('modalProductDescription');

  modalImage.src = product.image || 'images/店铺图片/豆包 (13).png';
  modalImage.alt = product.name;
  modalImage.addEventListener('error', function () {
    this.src = 'images/店铺图片/豆包 (13).png';
  });

  modalName.textContent = product.name;
  modalPrice.textContent = `价格：¥${parseFloat(product.price).toFixed(2)}`;
  modalDescription.textContent = product.description;

  modal.style.display = 'block';
  addModalCloseEvents();
}

function addModalCloseEvents() {
  const modal = document.getElementById('productModal');
  if (!modal) return;

  const closeBtn = document.querySelector('.close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
  }

  window.addEventListener('click', function (e) {
    if (e.target === modal) modal.style.display = 'none';
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      modal.style.display = 'none';
    }
  });
}

// ===== Init Product Display =====
async function initProductDisplay() {
  allProducts = await loadProducts();

  // Render all products
  renderProductCards(allProducts);

  // Render by category
  renderProductCards(allProducts.filter(p => p.category === 'melon'), 'melonProductsGrid');
  renderProductCards(allProducts.filter(p => p.category === 'nut'), 'nutProductsGrid');
  renderProductCards(allProducts.filter(p => p.category === 'peanut'), 'peanutProductsGrid');

  // Category filter buttons
  const categoryBtns = document.querySelectorAll('.category-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      categoryBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const category = this.dataset.category;
      const filtered = category === 'all' ? allProducts : allProducts.filter(p => p.category === category);
      renderProductCards(filtered);
    });
  });
}

// ===== Side Nav =====
function initSideNav() {
  document.querySelectorAll('.side-nav-item').forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({ top: targetElement.offsetTop - 70, behavior: 'smooth' });
      }
    });
  });
}

// ===== Smooth Scroll =====
function smoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({ top: targetElement.offsetTop - 70, behavior: 'smooth' });
      }
    });
  });
}

// ===== Window Resize =====
window.addEventListener('resize', () => {
  document.querySelectorAll('.carousel, .carousel-container').forEach(carousel => {
    const wrapper = carousel.querySelector('.carousel-wrapper');
    if (wrapper) {
      const match = wrapper.style.transform?.match(/translateX\(-([\d.]+)px\)/);
      const val = parseFloat(match?.[1] || '0');
      const idx = Math.round(val / carousel.offsetWidth);
      wrapper.style.transform = `translateX(-${idx * carousel.offsetWidth}px)`;
    }
  });
});

// ===== Init Page =====
async function initPage() {
  await loadCarouselImages();

  // Init carousels
  const homeCarousel = document.querySelector('.carousel');
  if (homeCarousel) new Carousel(homeCarousel, carouselConfig.homeImages, true);

  const productCarousel = document.querySelector('.product-carousel .carousel-container');
  if (productCarousel) new Carousel(productCarousel, carouselConfig.productImages, true);

  const storeGallery = document.querySelector('.store-gallery-carousel');
  if (storeGallery) new Carousel(storeGallery, carouselConfig.storeImages, true);

  renderGallery('.qualification-gallery', carouselConfig.qualificationImages);

  await loadSettings();
}

// ===== DOM Ready =====
document.addEventListener('DOMContentLoaded', function () {
  initPage();
  initProductDisplay();
  initSideNav();
});
