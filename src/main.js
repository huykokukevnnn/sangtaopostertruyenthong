// UI Elements
const canvasContainer = document.getElementById('canvas-container');
const posterCanvas = document.getElementById('poster-canvas');
const bgLayer = document.getElementById('canvas-background-layer');
const elementsLayer = document.getElementById('canvas-elements-layer');
const textLayer = document.getElementById('canvas-text-layer');

const toggleOrientationBtn = document.getElementById('toggle-orientation-btn');
const elementControlPanel = document.getElementById('element-control-panel');
const textControls = document.getElementById('text-controls');
const fontSelector = document.getElementById('font-selector');
const textColorPicker = document.getElementById('text-color-picker');
const sizeSlider = document.getElementById('size-slider');

let selectedElement = null;
let zIndexCounter = 100;

// Canvas Configuration
const DIMENSIONS = {
  portrait: { width: 900, height: 1200 }, // 3:4
  landscape: { width: 1920, height: 1080 } // 16:9
};
let currentOrientation = 'portrait';

// Initialization
function init() {
  setCanvasSize();
  window.addEventListener('resize', scaleCanvas);
  
  // Drag and drop from sidebar
  setupSidebarDraggables();
  setupCanvasDropZone();
  
  // Controls
  document.getElementById('add-title-btn').addEventListener('click', addTitle);
  document.getElementById('add-billing-btn').addEventListener('click', () => addBillingBlock());
  toggleOrientationBtn.addEventListener('click', toggleOrientation);
  
  // Deselect on clicking canvas background
  posterCanvas.addEventListener('pointerdown', (e) => {
    if (e.target === posterCanvas || e.target.parentElement === bgLayer) {
      deselectAll();
    }
  });

  // Typography changes
  fontSelector.addEventListener('change', (e) => {
    if (selectedElement && selectedElement.classList.contains('is-text')) {
      // Remove old font classes
      selectedElement.className = selectedElement.className.replace(/\bfont-\S+/g, '').trim();
      selectedElement.classList.add(e.target.value);
    }
  });
  
  textColorPicker.addEventListener('input', (e) => {
    if (selectedElement && selectedElement.classList.contains('is-text')) {
      selectedElement.style.color = e.target.value;
    }
  });

  sizeSlider.addEventListener('input', (e) => {
    if (selectedElement) {
      const scale = e.target.value;
      selectedElement.dataset.scale = scale;
      if (selectedElement.classList.contains('is-text')) {
        // base size for title is 6xl (60px), billing is 10px
        const baseSize = selectedElement.id === 'billing-block-instance' ? 10 : 60;
        selectedElement.style.fontSize = `${baseSize * scale}px`;
      } else {
        // base width for image is 256px
        selectedElement.style.width = `${256 * scale}px`;
      }
    }
  });

  // Action Buttons
  document.getElementById('btn-save').addEventListener('click', saveState);
  document.getElementById('btn-reset').addEventListener('click', resetCanvas);
  document.getElementById('btn-preview').addEventListener('click', showPreview);
  document.getElementById('close-preview-btn').addEventListener('click', hidePreview);
  document.getElementById('add-title-btn').addEventListener('click', addTitle);
  document.getElementById('add-billing-btn').addEventListener('click', addBillingBlock);
  
  loadState();

  if (!document.getElementById('billing-block-instance')) {
    // DO NOT ADD DEFAULT
  }
}

function setCanvasSize() {
  const dim = DIMENSIONS[currentOrientation];
  posterCanvas.style.width = `${dim.width}px`;
  posterCanvas.style.height = `${dim.height}px`;
  posterCanvas.dataset.orientation = currentOrientation;
  scaleCanvas();
}

function toggleOrientation() {
  currentOrientation = currentOrientation === 'portrait' ? 'landscape' : 'portrait';
  setCanvasSize();
}

function scaleCanvas() {
  const cw = posterCanvas.offsetWidth;
  const ch = posterCanvas.offsetHeight;
  const padding = 40;
  const scaleX = (canvasContainer.clientWidth - padding) / cw;
  const scaleY = (canvasContainer.clientHeight - padding) / ch;
  const scale = Math.min(scaleX, scaleY);
  posterCanvas.style.transform = `scale(${scale})`;
}

// Sidebar Drag & Drop
function setupSidebarDraggables() {
  const draggables = document.querySelectorAll('.draggable-bg, .draggable-element, .draggable-ground');
  draggables.forEach(el => {
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('type', el.dataset.type);
      if (el.src) e.dataTransfer.setData('src', el.src);
      if (el.dataset.groundId) e.dataTransfer.setData('groundId', el.dataset.groundId);
    });
  });
}

function setupCanvasDropZone() {
  posterCanvas.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  
  posterCanvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const src = e.dataTransfer.getData('src');
    
    // Get drop coordinates relative to scaled canvas
    const rect = posterCanvas.getBoundingClientRect();
    const scale = posterCanvas.getBoundingClientRect().width / posterCanvas.offsetWidth;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (type === 'background') {
      setBackground(src);
    } else if (type === 'ground') {
      const groundId = document.querySelector(`[data-type="ground"][draggable="true"]:hover, [data-type="ground"]:active`)?.dataset.groundId || e.dataTransfer.getData('groundId');
      setGround(groundId);
    } else if (type === 'character') {
      addCharacter(src, x, y);
    } else if (type === 'billing') {
      addBillingBlock();
    }
  });
}

// Element Creation
function setBackground(src) {
  bgLayer.innerHTML = '';
  const img = document.createElement('img');
  img.src = src;
  img.className = 'w-full h-full object-cover';
  img.draggable = false;
  bgLayer.appendChild(img);
  saveState();
}

function setGround(groundId) {
  if (!groundId) return;
  const groundLayer = document.getElementById('canvas-ground-layer');
  groundLayer.innerHTML = '';
  
  let html = '';
  if (groundId === 'grass') {
    html = '<svg class="absolute bottom-0 w-full h-1/5" preserveAspectRatio="none" viewBox="0 0 100 100"><path fill="#22c55e" d="M0,50 Q25,20 50,50 T100,50 L100,100 L0,100 Z"/><path fill="#16a34a" d="M0,70 Q30,50 60,70 T100,60 L100,100 L0,100 Z"/></svg>';
  } else if (groundId === 'scifi') {
    html = '<div class="absolute bottom-0 w-full h-1/4 bg-gray-900 flex items-end justify-center"><div class="w-4/5 h-2/3 bg-cyan-900 rounded-[100%] border-t-4 border-cyan-400 shadow-[0_-5px_30px_rgba(34,211,238,0.5)] transform translate-y-1/3"></div></div>';
  } else if (groundId === 'asphalt') {
    html = '<div class="absolute bottom-0 w-full h-1/4 bg-gray-700 border-t-8 border-gray-400 perspective-[200px] flex justify-center pt-4"><div class="w-2 h-full bg-yellow-400 mx-2 transform skew-x-[-20deg]"></div><div class="w-2 h-full bg-yellow-400 mx-2 transform skew-x-[20deg]"></div></div>';
  } else if (groundId === 'cloud') {
    html = '<svg class="absolute bottom-0 w-full h-1/4" preserveAspectRatio="none" viewBox="0 0 100 100"><circle cx="20" cy="80" r="35" fill="#fbcfe8" opacity="0.9"/><circle cx="50" cy="70" r="45" fill="#e9d5ff" opacity="0.9"/><circle cx="80" cy="80" r="40" fill="#fdf4ff" opacity="0.9"/></svg>';
  }
  
  groundLayer.innerHTML = html;
  saveState();
}

function addCharacter(src, x, y) {
  const img = document.createElement('img');
  img.src = src;
  img.draggable = false;
  img.className = 'canvas-element w-64 h-auto pointer-events-auto'; // Base width 256px
  img.dataset.scale = "1";
  img.style.left = `${x - 128}px`; // Center on pointer
  img.style.top = `${y - 128}px`;
  
  makeInteractive(img);
  elementsLayer.appendChild(img);
}

function addTitle() {
  const title = document.createElement('div');
  title.className = 'canvas-element is-text canvas-text-editable font-anton text-6xl text-white pointer-events-auto p-2 whitespace-nowrap';
  title.contentEditable = false;
  title.innerText = 'TÊN PHIM';
  title.dataset.scale = "1";
  title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
  
  textLayer.appendChild(title);
  makeInteractive(title);
  
  // Start centered
  const cw = posterCanvas.offsetWidth;
  const ch = posterCanvas.offsetHeight;
  title.style.left = `${(cw - title.offsetWidth) / 2}px`;
  title.style.top = `15%`;
  
  selectElement(title);
  saveState();
}

function addBillingBlock() {
  if (document.getElementById('billing-block-instance')) return;
  const billing = document.createElement('div');
  billing.id = 'billing-block-instance';
  billing.className = 'canvas-element is-text canvas-text-editable billing-block-style pointer-events-auto font-be-vietnam p-2';
  billing.contentEditable = false;
  billing.dataset.scale = "2";
  billing.style.fontSize = "20px";
  billing.style.color = "#000000";
  billing.style.textShadow = 'none';
  billing.innerText = 'MỘT BỘ PHIM CỦA [TÊN HỌC SINH] • ĐẠO DIỄN: [TÊN HỌC SINH] • KHỞI CHIẾU HÈ NÀY • ĐỊNH DẠNG 2D, 3D & IMAX';
  
  textLayer.appendChild(billing);
  makeInteractive(billing);
  billing.style.bottom = '40px';
  billing.style.left = '50%';
  billing.style.transform = 'translateX(-50%)';
  // Needs to be wide enough
  billing.style.width = '80%';
}

// Canvas Interaction Logic
function makeInteractive(el, isBilling = false) {
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  el.addEventListener('pointerdown', (e) => {
    // If editing text, don't drag immediately unless clicking border
    if (el.contentEditable === "true" && document.activeElement === el) return;
    
    isDragging = true;
    selectElement(el);
    el.style.zIndex = ++zIndexCounter;
    
    // Disable pointer events on canvas background to prevent glitching
    posterCanvas.style.touchAction = 'none';
    
    const scale = posterCanvas.getBoundingClientRect().width / posterCanvas.offsetWidth;
    startX = e.clientX / scale;
    startY = e.clientY / scale;
    
    if (isBilling && el.style.bottom) {
      // Convert bottom/transform to absolute top/left for dragging
      const rect = el.getBoundingClientRect();
      const canvasRect = posterCanvas.getBoundingClientRect();
      el.style.bottom = 'auto';
      el.style.transform = 'none';
      el.style.left = `${(rect.left - canvasRect.left) / scale}px`;
      el.style.top = `${(rect.top - canvasRect.top) / scale}px`;
    }
    
    initialLeft = parseFloat(el.style.left) || 0;
    initialTop = parseFloat(el.style.top) || 0;
    
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const scale = posterCanvas.getBoundingClientRect().width / posterCanvas.offsetWidth;
    const dx = (e.clientX / scale) - startX;
    const dy = (e.clientY / scale) - startY;
    
    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;
    
    el.style.left = `${newLeft}px`;
    el.style.top = `${newTop}px`;
  });

  el.addEventListener('pointerup', (e) => {
    if (isDragging) {
      isDragging = false;
      el.releasePointerCapture(e.pointerId);
      saveState();
    }
  });

  if (el.classList.contains('is-text')) {
    el.addEventListener('dblclick', (e) => {
      el.contentEditable = true;
      el.focus();
      document.execCommand('selectAll', false, null);
    });
    
    el.addEventListener('blur', (e) => {
      el.contentEditable = false;
    });

    el.addEventListener('input', () => {
      saveState();
    });
  } 
  
  // Delete element on backspace/delete if selected and not typing
  el.addEventListener('keydown', (e) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && document.activeElement !== el) {
      el.remove();
      deselectAll();
      saveState();
    }
  });
}

function selectElement(el) {
  deselectAll();
  selectedElement = el;
  el.classList.add('selected');
  el.focus();
  
  elementControlPanel.classList.remove('hidden');
  sizeSlider.value = el.dataset.scale || 1;

  if (el.classList.contains('is-text')) {
    textControls.classList.remove('hidden');
    // Match select value
    const match = el.className.match(/\bfont-\S+/);
    if (match) {
      fontSelector.value = match[0];
    } else {
      fontSelector.value = 'font-be-vietnam'; // default
    }
  } else {
    textControls.classList.add('hidden');
  }
}

function deselectAll() {
  if (selectedElement) {
    selectedElement.classList.remove('selected');
    selectedElement.blur();
    selectedElement = null;
  }
  elementControlPanel.classList.add('hidden');
}

// App State Management
function saveState() {
  deselectAll();
  const state = {
    orientation: currentOrientation,
    bgLayer: bgLayer.innerHTML,
    groundLayer: document.getElementById('canvas-ground-layer').innerHTML,
    elementsLayer: elementsLayer.innerHTML,
    textLayer: textLayer.innerHTML
  };
  localStorage.setItem('moviePosterState', JSON.stringify(state));
  
  // Show toast
  const toast = document.getElementById('toast');
  toast.classList.remove('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
  }, 3000);
}

function loadState() {
  const saved = localStorage.getItem('moviePosterState');
  if (saved) {
    const state = JSON.parse(saved);
    currentOrientation = state.orientation || 'portrait';
    setCanvasSize();
    bgLayer.innerHTML = state.bgLayer;
    if (state.groundLayer) document.getElementById('canvas-ground-layer').innerHTML = state.groundLayer;
    elementsLayer.innerHTML = state.elementsLayer;
    textLayer.innerHTML = state.textLayer;
    
    // Re-attach interactiveness
    document.querySelectorAll('#canvas-elements-layer .canvas-element, #canvas-text-layer .canvas-element').forEach(el => {
      makeInteractive(el, el.id === 'billing-block-instance');
    });
  }
}

function resetCanvas() {
  if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ canvas không?')) {
    bgLayer.innerHTML = '';
    document.getElementById('canvas-ground-layer').innerHTML = '';
    elementsLayer.innerHTML = '';
    textLayer.innerHTML = '';
    localStorage.removeItem('moviePosterState');
    deselectAll();
  }
}

function showPreview() {
  deselectAll();
  const modal = document.getElementById('preview-modal');
  const container = document.getElementById('preview-container');
  
  // Clone canvas
  const clone = posterCanvas.cloneNode(true);
  clone.style.transform = 'none'; // reset scale
  clone.classList.remove('shadow-cinema');
  
  container.innerHTML = '';
  
  // Wrapper for scaling
  const wrapper = document.createElement('div');
  wrapper.style.transition = 'transform 0.1s ease-out';
  wrapper.appendChild(clone);
  
  // Scale down clone to fit screen nicely
  const padding = 80;
  let scaleX = (window.innerWidth - padding) / clone.offsetWidth;
  let scaleY = (window.innerHeight - padding) / clone.offsetHeight;
  let currentScale = Math.min(scaleX, scaleY);
  
  wrapper.style.transform = `scale(${currentScale})`;
  wrapper.style.transformOrigin = 'center center';
  
  container.className = 'w-full h-full flex items-center justify-center overflow-hidden touch-none';
  container.appendChild(wrapper);
  
  // Mouse Wheel Zoom
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    currentScale += e.deltaY * -0.001;
    currentScale = Math.max(0.1, Math.min(currentScale, 3));
    wrapper.style.transform = `scale(${currentScale})`;
  });

  // Touch Pinch Zoom
  let initialDistance = 0;
  let initialScale = currentScale;

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      initialDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialScale = currentScale;
    }
  });

  container.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      currentScale = initialScale * (distance / initialDistance);
      currentScale = Math.max(0.1, Math.min(currentScale, 3));
      wrapper.style.transform = `scale(${currentScale})`;
    }
  }, { passive: false });
  
  modal.classList.remove('hidden');
  // Trigger reflow
  void modal.offsetWidth;
  modal.classList.add('opacity-100');
  modal.classList.remove('opacity-0');
}

function hidePreview() {
  const modal = document.getElementById('preview-modal');
  modal.classList.remove('opacity-100');
  modal.classList.add('opacity-0');
  setTimeout(() => {
    modal.classList.add('hidden');
    document.getElementById('preview-container').innerHTML = '';
  }, 500);
}

// Start
document.addEventListener('DOMContentLoaded', init);
