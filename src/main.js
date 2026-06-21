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
  document.getElementById('btn-close-preview').addEventListener('click', hidePreview);
  
  loadState();

  if (!document.getElementById('billing-block-instance')) {
    addBillingBlock();
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
  const draggables = document.querySelectorAll('.draggable-bg, .draggable-element');
  draggables.forEach(el => {
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('type', el.dataset.type);
      if (el.tagName === 'IMG') {
        e.dataTransfer.setData('src', el.src);
      }
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
    } else if (type === 'character') {
      addCharacter(src, x, y);
    } else if (type === 'billing') {
      addBillingBlock();
    }
  });
}

// Element Creation
function setBackground(src) {
  bgLayer.innerHTML = ''; // Clear existing
  const img = document.createElement('img');
  img.src = src;
  img.className = 'w-full h-full object-cover pointer-events-none';
  bgLayer.appendChild(img);
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
  title.className = 'canvas-element is-text canvas-text-editable font-anton text-6xl text-white pointer-events-auto p-2';
  title.contentEditable = true;
  title.innerText = 'TIÊU ĐỀ PHIM';
  title.dataset.scale = "1";
  title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
  
  textLayer.appendChild(title);
  
  // Center at top 15%
  const cw = posterCanvas.offsetWidth;
  const ch = posterCanvas.offsetHeight;
  const ew = title.offsetWidth;
  title.style.left = `${(cw - ew) / 2}px`;
  title.style.top = `${ch * 0.15}px`;
  
  makeInteractive(title);
  selectElement(title);
}

function addBillingBlock() {
  // Check if exists
  if (document.getElementById('billing-block-instance')) {
    const existing = document.getElementById('billing-block-instance');
    // Just move to bottom
    existing.style.bottom = '40px';
    existing.style.top = 'auto';
    existing.style.left = '50%';
    existing.style.transform = 'translateX(-50%)';
    return;
  }

  const billing = document.createElement('div');
  billing.id = 'billing-block-instance';
  billing.className = 'canvas-element is-text canvas-text-editable billing-block-style pointer-events-auto font-be-vietnam p-2';
  billing.contentEditable = true;
  billing.dataset.scale = "1";
  billing.innerText = 'MỘT BỘ PHIM CỦA [TÊN HỌC SINH] • ĐẠO DIỄN: [TÊN HỌC SINH] • KHỞI CHIẾU HÈ NÀY • ĐỊNH DẠNG 2D, 3D & IMAX';
  
  // Snap to bottom center
  billing.style.bottom = '40px';
  billing.style.left = '50%';
  billing.style.transform = 'translateX(-50%)';
  // Needs to be wide enough
  billing.style.width = '80%';
  
  // When interacting with billing, reset transform if dragged
  makeInteractive(billing, true);
  textLayer.appendChild(billing);
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
    
    // Boundary Constraints
    const cw = posterCanvas.offsetWidth;
    const ch = posterCanvas.offsetHeight;
    const ew = el.offsetWidth;
    const eh = el.offsetHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, cw - ew));
    newTop = Math.max(0, Math.min(newTop, ch - eh));
    
    el.style.left = `${newLeft}px`;
    el.style.top = `${newTop}px`;
  });

  el.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    el.releasePointerCapture(e.pointerId);
    posterCanvas.style.touchAction = 'auto';
  });

  // Delete element on backspace/delete if selected and not typing
  el.addEventListener('keydown', (e) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && document.activeElement !== el) {
      el.remove();
      deselectAll();
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
  
  // Scale down clone to fit screen nicely
  const padding = 80;
  const scaleX = (window.innerWidth - padding) / clone.offsetWidth;
  const scaleY = (window.innerHeight - padding) / clone.offsetHeight;
  const scale = Math.min(scaleX, scaleY);
  
  clone.style.transform = `scale(${scale})`;
  clone.style.transformOrigin = 'center center';
  
  container.innerHTML = '';
  container.appendChild(clone);
  
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
